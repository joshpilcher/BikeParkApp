import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { Link, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ScreenHeader } from "../components/ScreenHeader";
import { useActiveEvent } from "../contexts/ActiveEventContext";
import { COPY } from "../constants/copy";
import { COUNCIL } from "../constants/councilTheme";
import { supabase } from "../lib/supabase";

type EntryMode = "blank" | "preregistered";

type Row = { id: string; name: string; mobile: string };

type PatronEmbed = { full_name: string | null; mobile_e164: string | null };

function patronRow(p: PatronEmbed | PatronEmbed[] | null): PatronEmbed | null {
  if (!p) return null;
  return Array.isArray(p) ? p[0] ?? null : p;
}

export default function RespondentSelectScreen() {
  const insets = useSafeAreaInsets();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const isPickup = mode === "pickup";
  const title = isPickup ? COPY.pickUpTitle : COPY.dropOffTitle;
  const { liveEventId } = useActiveEvent();

  const [entryMode, setEntryMode] = useState<EntryMode>("preregistered");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  /** Drop-off only: count of pre_registrations before excluding already checked-in riders */
  const [preRegListedTotal, setPreRegListedTotal] = useState(0);

  const loadAttendees = useCallback(async () => {
    if (!liveEventId) {
      setRows([]);
      setPreRegListedTotal(0);
      setLoading(false);
      return;
    }

    setLoading(true);

    if (isPickup) {
      setPreRegListedTotal(0);

      const { data: eventVisits, error: vListErr } = await supabase
        .from("visits")
        .select("id, patron_id")
        .eq("event_id", liveEventId);

      if (vListErr) {
        setLoading(false);
        setRows([]);
        return;
      }

      const visitIds = eventVisits?.map((v) => v.id) ?? [];
      if (visitIds.length === 0) {
        setLoading(false);
        setRows([]);
        return;
      }

      const { data: stillParked, error: dErr } = await supabase
        .from("devices")
        .select("visit_id")
        .in("visit_id", visitIds)
        .in("status", ["checked_in", "parked"]);

      if (dErr) {
        setLoading(false);
        setRows([]);
        return;
      }

      const visitIdsWithGear = new Set(stillParked?.map((d) => d.visit_id) ?? []);
      const patronIdsWithPendingPickup = new Set(
        eventVisits?.filter((v) => visitIdsWithGear.has(v.id)).map((v) => v.patron_id) ?? [],
      );

      if (patronIdsWithPendingPickup.size === 0) {
        setLoading(false);
        setRows([]);
        return;
      }

      const { data, error } = await supabase
        .from("event_attendees")
        .select("patron_id, patrons ( full_name, mobile_e164 )")
        .eq("event_id", liveEventId)
        .in("patron_id", [...patronIdsWithPendingPickup]);

      setLoading(false);

      if (error || !data) {
        setRows([]);
        return;
      }

      const mapped = data
        .map((row: { patron_id: string; patrons: PatronEmbed | PatronEmbed[] | null }) => {
          const pr = patronRow(row.patrons);
          return {
            id: row.patron_id,
            name: pr?.full_name?.trim() ?? "",
            mobile: pr?.mobile_e164 ?? "",
          };
        })
        .filter((r) => r.name.length > 0 || r.mobile.length > 0);

      setRows(mapped);
      return;
    }

    const { data: preRegs, error: preErr } = await supabase
      .from("pre_registrations")
      .select("patron_id, patrons ( full_name, mobile_e164 )")
      .eq("event_id", liveEventId);

    const { data: visitsCheckedIn, error: vErr } = await supabase
      .from("visits")
      .select("patron_id")
      .eq("event_id", liveEventId)
      .not("checked_in_at", "is", null);

    setLoading(false);

    if (preErr || !preRegs) {
      setRows([]);
      setPreRegListedTotal(0);
      return;
    }

    setPreRegListedTotal(preRegs.length);

    const checkedInIds = new Set(
      !vErr && visitsCheckedIn ? visitsCheckedIn.map((v) => v.patron_id) : [],
    );

    const mapped = preRegs
      .filter((row: { patron_id: string }) => !checkedInIds.has(row.patron_id))
      .map((row: { patron_id: string; patrons: PatronEmbed | PatronEmbed[] | null }) => {
        const pr = patronRow(row.patrons);
        return {
          id: row.patron_id,
          name: pr?.full_name?.trim() ?? "",
          mobile: pr?.mobile_e164 ?? "",
        };
      })
      .filter((r) => r.name.length > 0 || r.mobile.length > 0);

    setRows(mapped);
  }, [liveEventId, isPickup]);

  useFocusEffect(
    useCallback(() => {
      void loadAttendees();
      return () => {
        setQuery("");
        setSelectedId(null);
        setEntryMode("preregistered");
      };
    }, [loadAttendees]),
  );

  useEffect(() => {
    if (selectedId && !rows.some((r) => r.id === selectedId)) {
      setSelectedId(null);
    }
  }, [rows, selectedId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.name.toLowerCase().includes(q) || r.mobile.replace(/\s/g, "").includes(q.replace(/\s/g, "")),
    );
  }, [query, rows]);

  const selectedPatron = selectedId ? rows.find((r) => r.id === selectedId) : undefined;

  const registerHref = useMemo(() => {
    if (selectedPatron) {
      const q = new URLSearchParams({
        flow: isPickup ? "pickup" : "dropoff",
        patronId: selectedPatron.id,
        patronName: selectedPatron.name,
        patronMobile: selectedPatron.mobile,
      });
      return `/register-devices?${q.toString()}`;
    }
    if (isPickup) return "/register-devices?flow=pickup";
    return "/register-devices";
  }, [isPickup, selectedPatron]);

  const searchListActive = isPickup || (!isPickup && entryMode === "preregistered");
  const needsRiderSelection = searchListActive && !selectedPatron;

  return (
    <View className="flex-1 bg-scc-wash" style={{ paddingTop: insets.top }}>
      <ScreenHeader
        title={title}
        subtitle={
          isPickup
            ? COPY.pickupRespondentLead
            : entryMode === "blank"
              ? COPY.walkUpHeaderSubtitle
              : COPY.respondentLead
        }
      />

      <View className="flex-1 px-4 pt-2">
        {!isPickup ? (
          <View className="mb-5 flex-row rounded-[14px] bg-slate-200/80 p-1">
            <Pressable
              onPress={() => {
                setEntryMode("blank");
                setSelectedId(null);
              }}
              className={`flex-1 rounded-[12px] py-3 ${entryMode === "blank" ? "bg-white shadow-sm" : ""}`}
            >
              <Text
                className={`text-center text-[15px] font-semibold ${
                  entryMode === "blank" ? "text-scc-charcoal" : "text-scc-muted"
                }`}
              >
                {COPY.respondentBlank}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setEntryMode("preregistered");
                setSelectedId(null);
              }}
              className={`flex-1 rounded-[12px] py-3 ${entryMode === "preregistered" ? "bg-white shadow-sm" : ""}`}
            >
              <Text
                className={`text-center text-[15px] font-semibold ${
                  entryMode === "preregistered" ? "text-scc-charcoal" : "text-scc-muted"
                }`}
              >
                {COPY.respondentPreReg}
              </Text>
            </Pressable>
          </View>
        ) : null}

        {!isPickup && entryMode === "blank" ? (
          <View className="flex-1 rounded-[20px] bg-white px-5 py-6 shadow-sm">
            <View className="flex-row items-start gap-4">
              <View className="rounded-[14px] bg-scc-teal/12 p-3">
                <Ionicons name="person-add-outline" size={24} color={COUNCIL.teal} />
              </View>
              <View className="min-w-0 flex-1">
                <Text className="text-[18px] font-bold text-scc-charcoal">{COPY.walkUpPanelTitle}</Text>
                <Text className="mt-2 text-[16px] leading-6 text-scc-muted">{COPY.walkUpPanelBody}</Text>
              </View>
            </View>
          </View>
        ) : null}

        {(isPickup || entryMode === "preregistered") && (
          <>
            <View className="mb-3 flex-row items-center gap-2">
              <View className="flex-1 flex-row items-center rounded-[16px] bg-white px-3 shadow-sm">
                <Ionicons name="search" size={20} color={COUNCIL.muted} />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder={COPY.searchPlaceholder}
                  placeholderTextColor="#94a3b8"
                  className="flex-1 py-3.5 pl-2 text-[16px] text-scc-charcoal"
                />
              </View>
              <Pressable
                onPress={() => void loadAttendees()}
                className="rounded-[16px] bg-scc-teal p-3.5 shadow-sm active:opacity-90"
              >
                <Ionicons name="refresh" size={22} color="#fff" />
              </Pressable>
            </View>

            <View className="min-h-[200px] overflow-hidden rounded-[20px] bg-white shadow-sm">
              {loading ? (
                <View className="items-center py-16">
                  <ActivityIndicator size="large" color={COUNCIL.teal} />
                </View>
              ) : (
                <FlatList
                  keyboardShouldPersistTaps="handled"
                  data={filtered}
                  keyExtractor={(item) => item.id}
                  ListEmptyComponent={
                    <Text className="p-8 text-center text-[15px] leading-6 text-scc-muted">
                      {!liveEventId
                        ? "No live event — create one on the dashboard first."
                        : query.trim()
                          ? isPickup
                            ? "No match — try another number."
                            : "No match — try walk-up."
                          : isPickup
                            ? "No gear waiting for pick-up, or everyone has already collected."
                            : preRegListedTotal > 0
                              ? "Everyone who pre-registered has checked in."
                              : "No pre-registrations for this session yet."}
                    </Text>
                  }
                  renderItem={({ item }) => {
                    const isSel = selectedId === item.id;
                    return (
                      <Pressable
                        onPress={() => setSelectedId(item.id)}
                        className={`flex-row items-center border-b border-slate-50 px-4 py-4 last:border-b-0 ${
                          isSel ? "bg-scc-wash" : "bg-white"
                        }`}
                      >
                        <View className="min-w-0 flex-1">
                          <Text className="text-[17px] font-semibold text-scc-charcoal">{item.name}</Text>
                          <Text className="mt-0.5 text-[15px] text-scc-muted">{item.mobile}</Text>
                        </View>
                        {isSel ? (
                          <Ionicons name="checkmark-circle" size={26} color={COUNCIL.teal} />
                        ) : (
                          <View className="h-[26px] w-[26px] rounded-full border-2 border-slate-200" />
                        )}
                      </Pressable>
                    );
                  }}
                />
              )}
            </View>
          </>
        )}
      </View>

      <View
        className="flex-row gap-3 border-t border-slate-200/90 bg-white px-4 pt-3 shadow-[0_-4px_12px_rgba(0,0,0,0.04)]"
        style={{ paddingBottom: Math.max(insets.bottom, 14) }}
      >
        <Link href="/" asChild>
          <Pressable className="flex-1 rounded-[16px] border border-slate-200 bg-white py-4 active:bg-slate-50">
            <Text className="text-center text-[16px] font-semibold text-scc-charcoal">Cancel</Text>
          </Pressable>
        </Link>
        {needsRiderSelection ? (
          <View className="flex-1">
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: true }}
              accessibilityLabel="Select a rider to continue"
              className="w-full rounded-[16px] bg-slate-300 py-4"
            >
              <Text className="text-center text-[16px] font-semibold text-white/90">Continue</Text>
            </Pressable>
            <Text className="mt-2 text-center text-[12px] text-scc-muted">Select someone from the list</Text>
          </View>
        ) : (
          <Link href={registerHref} asChild>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Continue to registration"
              className="flex-1 rounded-[16px] bg-scc-teal py-4 shadow-sm active:opacity-95"
            >
              <Text className="text-center text-[16px] font-semibold text-white">Continue</Text>
            </Pressable>
          </Link>
        )}
      </View>
    </View>
  );
}
