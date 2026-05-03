import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Link, router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppInput } from "../components/AppInput";
import { DeviceTypeSelect } from "../components/DeviceTypeSelect";
import { MintBackground } from "../components/MintBackground";
import { useActiveEvent } from "../contexts/ActiveEventContext";
import { COPY } from "../constants/copy";
import {
  categoryKeyFromStoredLabel,
  deviceKindLabelFromRow,
  otherDescriptionFromStoredKind,
  type DeviceFormRow,
} from "../constants/devices";
import { COUNCIL } from "../constants/councilTheme";
import type { ParkedBundle } from "../lib/parkedDevices";
import { fetchParkedForPatron } from "../lib/parkedDevices";
import { normalizeAuMobile } from "../lib/phone";
import { supabase } from "../lib/supabase";

const COUNTS = [1, 2, 3, 4, 5, 6] as const;

function parseLanyard(ticket: string): number | null {
  const t = ticket.trim();
  if (!t) return null;
  const n = Number.parseInt(t, 10);
  if (Number.isNaN(n) || n < 1 || n > 300) return null;
  return n;
}

export default function RegisterDevicesScreen() {
  const insets = useSafeAreaInsets();
  const { liveEventId } = useActiveEvent();
  const {
    flow: flowParam,
    patronId: patronIdParam,
    patronName: patronNameParam,
    patronMobile: patronMobileParam,
  } = useLocalSearchParams<{
    flow?: string | string[];
    patronId?: string | string[];
    patronName?: string | string[];
    patronMobile?: string | string[];
  }>();

  const flow = Array.isArray(flowParam) ? flowParam[0] : flowParam;
  const isPickup = flow === "pickup";

  const patronIdRaw = Array.isArray(patronIdParam) ? patronIdParam[0] : patronIdParam;

  const patronName = useMemo(() => {
    const raw = Array.isArray(patronNameParam) ? patronNameParam[0] : patronNameParam;
    if (!raw) return "";
    try {
      return decodeURIComponent(String(raw));
    } catch {
      return String(raw);
    }
  }, [patronNameParam]);

  const patronMobile = useMemo(() => {
    const raw = Array.isArray(patronMobileParam) ? patronMobileParam[0] : patronMobileParam;
    if (!raw) return "";
    try {
      return decodeURIComponent(String(raw));
    } catch {
      return String(raw);
    }
  }, [patronMobileParam]);

  const dropoffFromList = flow === "dropoff" && Boolean(patronName.trim());
  const handoverPickupFromSearch = isPickup && Boolean(patronName.trim());

  const [parkedBundle, setParkedBundle] = useState<ParkedBundle>({
    ticket: "—",
    visitId: null,
    devices: [],
  });
  const [parkedLoading, setParkedLoading] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);
  const [releaseBusyId, setReleaseBusyId] = useState<string | null>(null);

  const [ticket, setTicket] = useState("");
  const [name, setName] = useState(dropoffFromList ? patronName : "");
  const [mobile, setMobile] = useState(dropoffFromList ? patronMobile : "");

  useEffect(() => {
    if (!dropoffFromList) return;
    setName(patronName);
    setMobile(patronMobile);
  }, [dropoffFromList, patronIdRaw, patronName, patronMobile]);

  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [totalDevices, setTotalDevices] = useState(1);
  const [deviceRows, setDeviceRows] = useState<DeviceFormRow[]>([
    { categoryKey: "", notes: "", otherDescription: "" },
  ]);

  const [preRegHydrating, setPreRegHydrating] = useState(dropoffFromList);
  const [editCheckIn, setEditCheckIn] = useState(false);
  /** Bumped each time this screen gains focus so loaders re-run after blur cleared drafts */
  const [focusGeneration, setFocusGeneration] = useState(0);

  useFocusEffect(
    useCallback(() => {
      setFocusGeneration((g) => g + 1);
      return () => {
        setTicket("");
        setNotes("");
        setEmail("");
        setTotalDevices(1);
        setDeviceRows([{ categoryKey: "", notes: "", otherDescription: "" }]);
        setEditCheckIn(false);
        setName(dropoffFromList ? patronName : "");
        setMobile(dropoffFromList ? patronMobile : "");
        setPreRegHydrating(Boolean(dropoffFromList));
        setParkedBundle({ ticket: "—", visitId: null, devices: [] });
        setParkedLoading(false);
        setReleaseBusyId(null);
      };
    }, [dropoffFromList, patronName, patronMobile]),
  );

  useEffect(() => {
    if (!handoverPickupFromSearch || !patronIdRaw || !liveEventId) return;
    let cancelled = false;
    setParkedLoading(true);
    void (async () => {
      const bundle = await fetchParkedForPatron(liveEventId, patronIdRaw);
      if (!cancelled) {
        setParkedBundle(bundle);
        setParkedLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [handoverPickupFromSearch, patronIdRaw, liveEventId, focusGeneration]);

  const unreleased = useMemo(
    () => parkedBundle.devices.filter((d) => d.status !== "released"),
    [parkedBundle.devices],
  );

  const allReleased =
    parkedBundle.devices.length > 0 && parkedBundle.devices.every((d) => d.status === "released");

  const reloadParked = useCallback(async () => {
    if (!liveEventId || !patronIdRaw) return;
    const bundle = await fetchParkedForPatron(liveEventId, patronIdRaw);
    setParkedBundle(bundle);

    if (!bundle.visitId) return;

    const { count, error: countErr } = await supabase
      .from("devices")
      .select("id", { count: "exact", head: true })
      .eq("visit_id", bundle.visitId)
      .in("status", ["checked_in", "parked"]);

    if (countErr) return;

    if ((count ?? 0) === 0) {
      await supabase
        .from("visits")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", bundle.visitId)
        .eq("status", "active");
    }
  }, [liveEventId, patronIdRaw]);

  const releaseDevice = useCallback(
    async (deviceId: string) => {
      if (!liveEventId || !patronIdRaw) return;
      setReleaseBusyId(deviceId);
      try {
        const now = new Date().toISOString();
        await supabase
          .from("devices")
          .update({ status: "released", released_at: now })
          .eq("id", deviceId);
        await supabase.from("release_events").insert({ device_id: deviceId });
        await reloadParked();
      } catch (e) {
        Alert.alert("Release failed", e instanceof Error ? e.message : "Unknown error");
      } finally {
        setReleaseBusyId(null);
      }
    },
    [liveEventId, patronIdRaw, reloadParked],
  );

  const releaseAll = useCallback(async () => {
    const ids = unreleased.map((d) => d.id);
    setReleaseBusyId("all");
    try {
      const now = new Date().toISOString();
      for (const id of ids) {
        await supabase.from("devices").update({ status: "released", released_at: now }).eq("id", id);
        await supabase.from("release_events").insert({ device_id: id });
      }
      await reloadParked();
    } catch (e) {
      Alert.alert("Release failed", e instanceof Error ? e.message : "Unknown error");
    } finally {
      setReleaseBusyId(null);
    }
  }, [unreleased, reloadParked]);

  useEffect(() => {
    if (!dropoffFromList || !patronIdRaw || !liveEventId) {
      setPreRegHydrating(false);
      return;
    }

    let cancelled = false;
    setPreRegHydrating(true);
    setEditCheckIn(false);

    void (async () => {
      const [{ data: preReg }, { data: patron }] = await Promise.all([
        supabase
          .from("pre_registrations")
          .select("id, expected_device_count")
          .eq("event_id", liveEventId)
          .eq("patron_id", patronIdRaw)
          .maybeSingle(),
        supabase.from("patrons").select("full_name, mobile_e164, email").eq("id", patronIdRaw).maybeSingle(),
      ]);

      if (cancelled) return;

      if (patron) {
        setName(patron.full_name?.trim() ?? "");
        setMobile(patron.mobile_e164 ?? "");
        setEmail(patron.email?.trim() ?? "");
      }

      if (!preReg) {
        setTotalDevices(1);
        setDeviceRows([{ categoryKey: "", notes: "", otherDescription: "" }]);
        setPreRegHydrating(false);
        return;
      }

      const { data: regDevices } = await supabase
        .from("pre_registration_devices")
        .select("kind_label, detail_notes, sort_order")
        .eq("pre_registration_id", preReg.id)
        .order("sort_order", { ascending: true });

      if (cancelled) return;

      const fromDb = regDevices?.length ?? 0;
      const expected = preReg.expected_device_count ?? fromDb;
      const count = Math.min(6, Math.max(expected, fromDb, 1));

      setTotalDevices(count);

      const rows: DeviceFormRow[] = [];
      for (let i = 0; i < count; i++) {
        const rd = regDevices?.[i];
        const rawKind = rd?.kind_label?.trim() ?? "";
        const categoryKey = categoryKeyFromStoredLabel(rawKind);
        rows.push({
          categoryKey,
          notes: rd?.detail_notes?.trim() ?? "",
          otherDescription: otherDescriptionFromStoredKind(rawKind, categoryKey),
        });
      }
      setDeviceRows(rows);

      setPreRegHydrating(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [dropoffFromList, patronIdRaw, liveEventId, focusGeneration]);

  const handleDeviceCountSelect = useCallback((n: number) => {
    setTotalDevices(n);
    setDeviceRows((prev) => {
      const kept = prev.slice(0, n);
      while (kept.length < n) {
        kept.push({ categoryKey: "", notes: "", otherDescription: "" });
      }
      return kept;
    });
  }, []);

  const updateDeviceRow = useCallback((index: number, patch: Partial<DeviceFormRow>) => {
    setDeviceRows((prev) => {
      const next = [...prev];
      while (next.length <= index) {
        next.push({ categoryKey: "", notes: "", otherDescription: "" });
      }
      next[index] = { ...next[index], ...patch };
      return next;
    });
  }, []);

  async function saveCheckIn() {
    if (!liveEventId) {
      Alert.alert("No live event", "Create or publish a live event first.");
      return;
    }

    const normMobile = normalizeAuMobile(mobile);
    if (!normMobile || !name.trim()) {
      Alert.alert("Required", "Enter rider name and a valid mobile.");
      return;
    }

    setSaveBusy(true);
    try {
      let patronId = patronIdRaw ?? "";

      if (dropoffFromList && patronId) {
        await supabase
          .from("patrons")
          .update({
            full_name: name.trim(),
            mobile_e164: normMobile,
            email: email.trim() ? email.trim() : null,
          })
          .eq("id", patronId);
      } else {
        const { data: patron, error: pErr } = await supabase
          .from("patrons")
          .upsert(
            {
              full_name: name.trim(),
              mobile_e164: normMobile,
              email: email.trim() ? email.trim() : null,
            },
            { onConflict: "mobile_e164" },
          )
          .select("id")
          .single();

        if (pErr || !patron) {
          Alert.alert("Could not save rider", pErr?.message ?? "Unknown error");
          return;
        }
        patronId = patron.id;
      }

      const lanyard = parseLanyard(ticket);

      const { data: visit, error: vErr } = await supabase
        .from("visits")
        .insert({
          event_id: liveEventId,
          patron_id: patronId,
          entry_method: dropoffFromList ? "pre_registered" : "walk_up",
          lanyard_number: lanyard,
          staff_notes: notes.trim() || null,
          status: "active",
          checked_in_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (vErr || !visit) {
        const msg = vErr?.message ?? "";
        Alert.alert(
          "Could not check in",
          msg.includes("visits_one_active_lanyard_per_event") || msg.includes("duplicate key")
            ? "That lanyard number is already in use for an active visit."
            : msg || "Unknown error",
        );
        return;
      }

      const now = new Date().toISOString();
      const slice = deviceRows.slice(0, totalDevices);
      for (let i = 0; i < slice.length; i++) {
        const row = slice[i];
        if (!row?.categoryKey?.trim()) {
          Alert.alert("Device type", `Choose a category for device ${i + 1}.`);
          return;
        }
        if (row.categoryKey === "other" && !row.otherDescription.trim()) {
          Alert.alert("Describe device", `Add a short description for device ${i + 1} (Other).`);
          return;
        }
      }

      const payloads = slice.map((row) => ({
        visit_id: visit.id,
        category_key: row.categoryKey.trim(),
        kind_label: deviceKindLabelFromRow(row),
        detail_notes: row.notes.trim() || "",
        bay_zone: null as string | null,
        status: "checked_in" as const,
        checked_in_at: now,
      }));

      if (payloads.length) {
        const { error: dErr } = await supabase.from("devices").insert(payloads);
        if (dErr) {
          Alert.alert("Devices not saved", dErr.message);
          return;
        }
      }

      const { error: attErr } = await supabase.from("event_attendees").upsert(
        {
          event_id: liveEventId,
          patron_id: patronId,
          source: dropoffFromList ? "pre_register" : "manual",
        },
        { onConflict: "event_id,patron_id" },
      );

      if (attErr) {
        Alert.alert(
          "Guest list",
          `${attErr.message}\nCheck-in was saved. They may not show under Pick-up until this is resolved.`,
          [{ text: "OK", onPress: () => router.replace("/") }],
        );
        return;
      }

      router.replace("/");
    } finally {
      setSaveBusy(false);
    }
  }

  return (
    <MintBackground>
      <View className="flex-1">
        <ScrollView
          className="flex-1 px-4"
          contentContainerStyle={{
            paddingTop: insets.top + 8,
            paddingBottom: 140,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="mb-5 flex-row items-center justify-between">
            <Link
              href={isPickup ? "/respondent-select?mode=pickup" : "/respondent-select"}
              asChild
            >
              <Pressable
                hitSlop={12}
                className="h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm active:opacity-80"
                accessibilityLabel="Back"
              >
                <Ionicons name="chevron-back" size={26} color="#333333" />
              </Pressable>
            </Link>
            <View
              className={`rounded-full px-3 py-1.5 ${
                isPickup || dropoffFromList ? "bg-scc-teal/15" : "bg-scc-blue/10"
              }`}
            >
              <Text
                className={`text-[11px] font-bold uppercase tracking-wide ${
                  isPickup || dropoffFromList ? "text-scc-teal" : "text-scc-blue"
                }`}
              >
                {isPickup ? "Pick-up" : dropoffFromList ? "On the list" : "Walk-up"}
              </Text>
            </View>
            <View className="w-11" />
          </View>

          <View className="mb-5">
            <Text className="text-[26px] font-bold text-scc-charcoal">
              {handoverPickupFromSearch
                ? "Release devices"
                : dropoffFromList
                  ? COPY.dropOffListTitle
                  : isPickup
                    ? "Pick-up"
                    : "Registration"}
            </Text>
            <Text className="mt-2 text-[16px] leading-6 text-scc-muted">
              {handoverPickupFromSearch
                ? "Review their ticket and release each item when you hand it over."
                : dropoffFromList
                  ? COPY.dropOffListLead
                  : isPickup
                    ? "Search for a rider first — their ticket and parked gear load automatically."
                    : COPY.registerLead}
            </Text>
          </View>

          {handoverPickupFromSearch ? (
            <>
              {parkedLoading ? (
                <View className="mb-6 items-center py-12">
                  <ActivityIndicator size="large" color={COUNCIL.teal} />
                </View>
              ) : (
                <>
                  <View className="mb-4 overflow-hidden rounded-[20px] border border-scc-teal/20 bg-white p-5 shadow-sm">
                    <Text className="text-[11px] font-semibold uppercase tracking-wide text-scc-muted">
                      Rider
                    </Text>
                    <Text className="mt-2 text-[22px] font-bold text-scc-charcoal">{patronName}</Text>
                    {patronMobile ? (
                      <View className="mt-3 flex-row items-center gap-2">
                        <Ionicons name="call-outline" size={18} color={COUNCIL.muted} />
                        <Text className="text-[16px] text-scc-charcoal">{patronMobile}</Text>
                      </View>
                    ) : null}
                    <View className="mt-4 flex-row items-center justify-between border-t border-slate-100 pt-4">
                      <Text className="text-[13px] font-medium text-scc-muted">Lanyard</Text>
                      <Text className="text-[18px] font-bold tabular-nums text-scc-blue">
                        {parkedBundle.ticket}
                      </Text>
                    </View>
                    <Link href="/respondent-select?mode=pickup" asChild>
                      <Pressable className="mt-4 self-start active:opacity-70">
                        <Text className="text-[15px] font-semibold text-scc-blue">Wrong person?</Text>
                      </Pressable>
                    </Link>
                  </View>

                  {parkedBundle.devices.length === 0 ? (
                    <View className="mb-4 rounded-[20px] bg-white p-6 shadow-sm">
                      <Text className="text-center text-[15px] leading-6 text-scc-muted">
                        No checked-in devices found for this rider at this event.
                      </Text>
                    </View>
                  ) : (
                    <View className="mb-4">
                      <View className="mb-3 flex-row items-center justify-between px-0.5">
                        <Text className="text-[17px] font-bold text-scc-charcoal">Parked with you</Text>
                        {unreleased.length > 1 ? (
                          <Pressable
                            onPress={() => void releaseAll()}
                            hitSlop={8}
                            accessibilityRole="button"
                            accessibilityLabel="Release all devices"
                            className="active:opacity-70"
                            disabled={releaseBusyId !== null}
                          >
                            <Text className="text-[15px] font-semibold text-scc-teal">Release all</Text>
                          </Pressable>
                        ) : null}
                      </View>

                      {allReleased ? (
                        <View className="mb-3 rounded-[14px] bg-scc-teal/10 px-4 py-3">
                          <Text className="text-center text-[14px] font-semibold text-scc-teal">
                            All devices released
                          </Text>
                        </View>
                      ) : (
                        <Text className="mb-3 px-0.5 text-[13px] text-scc-muted">
                          {unreleased.length} of {parkedBundle.devices.length} still to release
                        </Text>
                      )}

                      <View className="gap-3">
                        {parkedBundle.devices.map((d) => {
                          const isOut = d.status === "released";
                          const busy = releaseBusyId === d.id || releaseBusyId === "all";
                          return (
                            <View
                              key={d.id}
                              className={`overflow-hidden rounded-[18px] border bg-white p-4 shadow-sm ${
                                isOut ? "border-slate-100 opacity-75" : "border-slate-100"
                              }`}
                            >
                              <View className="flex-row items-start gap-3">
                                <View
                                  className={`rounded-[14px] p-3 ${isOut ? "bg-slate-100" : "bg-scc-wash"}`}
                                >
                                  <Ionicons
                                    name={isOut ? "checkmark-circle" : "bicycle"}
                                    size={26}
                                    color={isOut ? COUNCIL.teal : COUNCIL.blue}
                                  />
                                </View>
                                <View className="min-w-0 flex-1">
                                  <Text className="text-[17px] font-semibold text-scc-charcoal">{d.kind}</Text>
                                  <Text className="mt-1 text-[15px] leading-5 text-scc-muted">{d.detail}</Text>
                                  {d.bay ? (
                                    <Text className="mt-2 text-[12px] font-medium uppercase tracking-wide text-scc-muted">
                                      {d.bay}
                                    </Text>
                                  ) : null}
                                </View>
                              </View>
                              {isOut ? (
                                <View className="mt-4 flex-row items-center gap-2 border-t border-slate-50 pt-3">
                                  <Ionicons name="exit-outline" size={18} color={COUNCIL.teal} />
                                  <Text className="text-[14px] font-semibold text-scc-teal">Released</Text>
                                </View>
                              ) : (
                                <Pressable
                                  onPress={() => void releaseDevice(d.id)}
                                  accessibilityRole="button"
                                  accessibilityLabel={`Release ${d.kind}`}
                                  disabled={busy}
                                  className="mt-4 rounded-[14px] bg-scc-blue py-3.5 active:opacity-90"
                                >
                                  {busy ? (
                                    <ActivityIndicator color="#fff" />
                                  ) : (
                                    <Text className="text-center text-[16px] font-bold text-white">Release</Text>
                                  )}
                                </Pressable>
                              )}
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  )}

                  <View className="mb-6 rounded-[20px] bg-white p-5 shadow-sm">
                    <AppInput
                      label="Note"
                      optional
                      value={notes}
                      onChangeText={setNotes}
                      placeholder="Incident, witness, special instructions…"
                      multiline
                      numberOfLines={3}
                    />
                  </View>
                </>
              )}
            </>
          ) : isPickup ? (
            <View className="mb-6 rounded-[20px] border border-dashed border-scc-teal/30 bg-white p-6">
              <Text className="text-center text-[15px] leading-6 text-scc-muted">
                Pick-up starts from rider search so we can show their ticket and parked devices.
              </Text>
              <Link href="/respondent-select?mode=pickup" asChild>
                <Pressable className="mt-4 rounded-[14px] bg-scc-teal py-3.5 active:opacity-90">
                  <Text className="text-center text-[16px] font-bold text-white">Go to search</Text>
                </Pressable>
              </Link>
            </View>
          ) : (
            <>
              {dropoffFromList && preRegHydrating ? (
                <View className="mb-6 items-center rounded-[20px] bg-white py-16 shadow-sm">
                  <ActivityIndicator size="large" color={COUNCIL.teal} />
                  <Text className="mt-4 px-6 text-center text-[15px] text-scc-muted">
                    Loading pre-registration…
                  </Text>
                </View>
              ) : null}

              {dropoffFromList && !preRegHydrating && !editCheckIn ? (
                <>
                  <View className="mb-4 rounded-[20px] bg-white p-5 shadow-sm">
                    <AppInput
                      label="Lanyard #"
                      optional
                      value={ticket}
                      onChangeText={setTicket}
                      placeholder="1–300"
                    />
                  </View>

                  <View className="mb-4 overflow-hidden rounded-[20px] border border-scc-teal/15 bg-white p-5 shadow-sm">
                    <Text className="text-[11px] font-semibold uppercase tracking-wide text-scc-muted">
                      From pre-registration
                    </Text>
                    <Text className="mt-2 text-[22px] font-bold text-scc-charcoal">{name.trim() || "—"}</Text>
                    <View className="mt-3 flex-row items-center gap-2">
                      <Ionicons name="call-outline" size={18} color={COUNCIL.muted} />
                      <Text className="text-[16px] text-scc-charcoal">{mobile.trim() || "—"}</Text>
                    </View>
                    <Text className="mt-3 text-[15px] text-scc-muted">
                      {email.trim() ? email.trim() : "No email on file"}
                    </Text>
                    <Pressable
                      onPress={() => setEditCheckIn(true)}
                      className="mt-5 self-start rounded-[14px] bg-scc-teal/12 px-4 py-3 active:opacity-90"
                    >
                      <Text className="text-[15px] font-semibold text-scc-teal">{COPY.dropOffEditDetails}</Text>
                    </Pressable>
                    <Link href="/respondent-select" asChild>
                      <Pressable className="mt-3 self-start active:opacity-70">
                        <Text className="text-[15px] font-semibold text-scc-blue">Wrong rider?</Text>
                      </Pressable>
                    </Link>
                  </View>

                  <View className="mb-4 rounded-[20px] bg-white p-5 shadow-sm">
                    <Text className="mb-1 text-[17px] font-bold text-scc-charcoal">Registered devices</Text>
                    <Text className="mb-4 text-[14px] text-scc-muted">
                      {totalDevices} {totalDevices === 1 ? "device" : "devices"} expected
                    </Text>
                    {Array.from({ length: totalDevices }).map((_, index) => {
                      const row = deviceRows[index] ?? {
                        categoryKey: "",
                        notes: "",
                        otherDescription: "",
                      };
                      const label =
                        row.categoryKey.trim() === ""
                          ? `Device ${index + 1}`
                          : deviceKindLabelFromRow(row);
                      return (
                        <View key={index} className="mb-4 rounded-[16px] bg-slate-50 p-4 last:mb-0">
                          <Text className="text-[16px] font-semibold text-scc-charcoal">{label}</Text>
                          {row.notes.trim() ? (
                            <Text className="mt-2 text-[15px] leading-5 text-scc-muted">{row.notes}</Text>
                          ) : (
                            <Text className="mt-2 text-[14px] italic text-scc-muted">No extra notes</Text>
                          )}
                        </View>
                      );
                    })}
                  </View>
                </>
              ) : null}

              {!dropoffFromList ? (
                <View className="mb-4 rounded-[20px] bg-white p-5 shadow-sm">
                  <Text className="mb-4 text-[17px] font-bold text-scc-charcoal">Rider</Text>
                  <AppInput
                    label="Lanyard #"
                    optional
                    value={ticket}
                    onChangeText={setTicket}
                    placeholder="1–300"
                  />
                  <AppInput label="Name" value={name} onChangeText={setName} placeholder="Rider name" />
                  <AppInput
                    label="Mobile"
                    value={mobile}
                    onChangeText={setMobile}
                    placeholder="04xx xxx xxx"
                    keyboardType="phone-pad"
                  />
                  <AppInput
                    label="Email"
                    optional
                    value={email}
                    onChangeText={setEmail}
                    placeholder="name@email.com"
                    keyboardType="email-address"
                  />
                </View>
              ) : dropoffFromList && !preRegHydrating && editCheckIn ? (
                <View className="mb-4 rounded-[20px] bg-white p-5 shadow-sm">
                  <AppInput
                    label="Lanyard #"
                    optional
                    value={ticket}
                    onChangeText={setTicket}
                    placeholder="1–300"
                  />
                  <Text className="mb-3 mt-4 text-[11px] font-semibold uppercase tracking-wide text-scc-muted">
                    Edit rider & devices
                  </Text>
                  <AppInput label="Name" value={name} onChangeText={setName} placeholder="Rider name" />
                  <AppInput
                    label="Mobile"
                    value={mobile}
                    onChangeText={setMobile}
                    placeholder="04xx xxx xxx"
                    keyboardType="phone-pad"
                  />
                  <AppInput
                    label="Email"
                    optional
                    value={email}
                    onChangeText={setEmail}
                    placeholder="name@email.com"
                    keyboardType="email-address"
                  />
                  <Pressable onPress={() => setEditCheckIn(false)} className="mt-5 self-start active:opacity-90">
                    <Text className="text-[15px] font-semibold text-scc-teal">{COPY.dropOffDoneEditing}</Text>
                  </Pressable>
                  <Link href="/respondent-select" asChild>
                    <Pressable className="mt-3 self-start active:opacity-70">
                      <Text className="text-[15px] font-semibold text-scc-blue">Wrong rider?</Text>
                    </Pressable>
                  </Link>
                </View>
              ) : null}

              {((dropoffFromList && editCheckIn && !preRegHydrating) || !dropoffFromList) && (
                <View className="mb-4 rounded-[20px] bg-white p-5 shadow-sm">
                  <Text className="mb-1 text-[17px] font-bold text-scc-charcoal">Devices</Text>
                  <Text className="mb-4 text-[15px] text-scc-muted">
                    {dropoffFromList ? "Adjust if different from pre-registration" : "Count and details"}
                  </Text>
                  <View className="flex-row flex-wrap justify-center gap-2.5">
                    {COUNTS.map((n) => {
                      const selected = totalDevices === n;
                      return (
                        <Pressable
                          key={n}
                          onPress={() => handleDeviceCountSelect(n)}
                          className={`h-[52px] min-w-[52px] items-center justify-center rounded-[16px] px-4 active:opacity-90 ${
                            selected ? "bg-scc-teal" : "bg-slate-100"
                          }`}
                        >
                          <Text
                            className={`text-xl font-bold tabular-nums ${
                              selected ? "text-white" : "text-scc-charcoal"
                            }`}
                          >
                            {n}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <View className="mt-6 border-t border-slate-100 pt-6">
                    {Array.from({ length: totalDevices }).map((_, index) => {
                      const row = deviceRows[index] ?? {
                        categoryKey: "",
                        notes: "",
                        otherDescription: "",
                      };
                      return (
                        <View key={index} className="mb-5 rounded-[16px] bg-slate-50 p-4 last:mb-0">
                          <Text className="mb-3 text-[15px] font-semibold text-scc-charcoal">
                            Device {index + 1}
                          </Text>
                          <Text className="mb-2 text-[13px] font-medium text-scc-muted">Type</Text>
                          <DeviceTypeSelect
                            value={row.categoryKey}
                            onChange={(categoryKey) =>
                              updateDeviceRow(index, {
                                categoryKey,
                                ...(categoryKey !== "other" ? { otherDescription: "" } : {}),
                              })
                            }
                          />
                          {row.categoryKey === "other" ? (
                            <>
                              <Text className="mb-2 mt-3 text-[13px] font-medium text-scc-muted">
                                Describe it
                              </Text>
                              <TextInput
                                value={row.otherDescription}
                                onChangeText={(t) =>
                                  updateDeviceRow(index, { otherDescription: t })
                                }
                                placeholder="e.g. Unicycle, cargo trike…"
                                placeholderTextColor="#94a3b8"
                                className="rounded-[14px] bg-white px-3 py-3.5 text-[16px] text-scc-charcoal"
                              />
                            </>
                          ) : null}
                          <Text className="mb-2 text-[13px] font-medium text-scc-muted">Notes</Text>
                          <TextInput
                            value={row.notes}
                            onChangeText={(t) => updateDeviceRow(index, { notes: t })}
                            placeholder="Colour, lock, stand…"
                            placeholderTextColor="#94a3b8"
                            multiline
                            numberOfLines={2}
                            textAlignVertical="top"
                            className="min-h-[72px] rounded-[14px] bg-white px-3 py-3 text-[16px] text-scc-charcoal"
                          />
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}

              {!(dropoffFromList && preRegHydrating) ? (
                <View className="mb-6 rounded-[20px] bg-white p-5 shadow-sm">
                  <Text className="mb-4 text-[17px] font-bold text-scc-charcoal">Staff notes</Text>
                  <AppInput
                    label="Notes"
                    optional
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Bay, rack, flags…"
                    multiline
                    numberOfLines={4}
                  />
                </View>
              ) : null}
            </>
          )}

          {!handoverPickupFromSearch ? (
            <Link href={isPickup ? "/respondent-select?mode=pickup" : "/respondent-select"} asChild>
              <Pressable className="mb-6 py-2 active:opacity-70">
                <Text className="text-center text-[15px] font-semibold text-scc-teal">
                  {isPickup
                    ? "Back to search"
                    : dropoffFromList
                      ? "Back to rider search"
                      : "Change visitor type"}
                </Text>
              </Pressable>
            </Link>
          ) : (
            <View className="h-4" />
          )}
        </ScrollView>

        <View
          className="border-t border-slate-200/80 bg-white/95 px-4 pt-3"
          style={{
            paddingBottom: Math.max(insets.bottom, 14),
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.06,
            shadowRadius: 12,
          }}
        >
          {handoverPickupFromSearch || isPickup ? (
            <Link href="/" asChild>
              <Pressable className="flex-row items-center justify-center gap-2 rounded-[16px] bg-scc-blue py-4 active:opacity-95">
                <Text className="text-center text-[17px] font-bold text-white">Done</Text>
                <Ionicons name="checkmark" size={22} color="#fff" />
              </Pressable>
            </Link>
          ) : (
            <Pressable
              onPress={() => void saveCheckIn()}
              disabled={saveBusy || (dropoffFromList && preRegHydrating)}
              className={`flex-row items-center justify-center gap-2 rounded-[16px] py-4 active:opacity-95 ${
                dropoffFromList ? "bg-scc-teal" : "bg-scc-blue"
              }`}
            >
              {saveBusy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text className="text-center text-[17px] font-bold text-white">Check in</Text>
                  <Ionicons name="checkmark" size={22} color="#fff" />
                </>
              )}
            </Pressable>
          )}
        </View>
      </View>
    </MintBackground>
  );
}
