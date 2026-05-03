import { Ionicons } from "@expo/vector-icons";
import { Link, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppInput } from "../components/AppInput";
import { MintBackground } from "../components/MintBackground";
import { COPY } from "../constants/copy";
import { COUNCIL } from "../constants/councilTheme";
import { getParkedForPatron } from "../constants/pickupDemo";

const COUNTS = [1, 2, 3, 4, 5, 6] as const;

type DeviceRow = { kind: string; notes: string };

export default function RegisterDevicesScreen() {
  const insets = useSafeAreaInsets();
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

  const parked = useMemo(
    () => getParkedForPatron(patronIdRaw, patronName),
    [patronIdRaw, patronName],
  );

  const [released, setReleased] = useState<Record<string, boolean>>({});

  const releaseDevice = useCallback((deviceId: string) => {
    setReleased((prev) => ({ ...prev, [deviceId]: true }));
  }, []);

  const releaseAll = useCallback(() => {
    setReleased((prev) => {
      const next = { ...prev };
      for (const d of parked.devices) {
        next[d.id] = true;
      }
      return next;
    });
  }, [parked.devices]);

  const unreleased = useMemo(
    () => parked.devices.filter((d) => !released[d.id]),
    [parked.devices, released],
  );

  const allReleased =
    parked.devices.length > 0 && parked.devices.every((d) => released[d.id]);

  useEffect(() => {
    if (!handoverPickupFromSearch) return;
    setReleased({});
  }, [handoverPickupFromSearch, patronIdRaw, patronName]);

  const [ticket, setTicket] = useState("");
  const [name, setName] = useState(dropoffFromList ? patronName : "");
  const [mobile, setMobile] = useState(dropoffFromList ? patronMobile : "");
  /** List selection changed mid-flow — refill rider fields */
  useEffect(() => {
    if (!dropoffFromList) return;
    setName(patronName);
    setMobile(patronMobile);
  }, [dropoffFromList, patronIdRaw, patronName, patronMobile]);

  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [totalDevices, setTotalDevices] = useState(1);
  const [deviceRows, setDeviceRows] = useState<DeviceRow[]>([{ kind: "", notes: "" }]);

  const handleDeviceCountSelect = useCallback((n: number) => {
    setTotalDevices(n);
    setDeviceRows((prev) => {
      const kept = prev.slice(0, n);
      while (kept.length < n) {
        kept.push({ kind: "", notes: "" });
      }
      return kept;
    });
  }, []);

  const updateDeviceRow = useCallback((index: number, patch: Partial<DeviceRow>) => {
    setDeviceRows((prev) => {
      const next = [...prev];
      while (next.length <= index) {
        next.push({ kind: "", notes: "" });
      }
      next[index] = { ...next[index], ...patch };
      return next;
    });
  }, []);

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
                  <Text className="text-[13px] font-medium text-scc-muted">Ticket</Text>
                  <Text className="text-[18px] font-bold tabular-nums text-scc-blue">{parked.ticket}</Text>
                </View>
                <Link href="/respondent-select?mode=pickup" asChild>
                  <Pressable className="mt-4 self-start active:opacity-70">
                    <Text className="text-[15px] font-semibold text-scc-blue">Wrong person?</Text>
                  </Pressable>
                </Link>
              </View>

              {parked.devices.length === 0 ? (
                <View className="mb-4 rounded-[20px] bg-white p-6 shadow-sm">
                  <Text className="text-center text-[15px] leading-6 text-scc-muted">
                    No devices on file for this rider (demo). When live data is connected, parked items
                    will show here.
                  </Text>
                </View>
              ) : (
                <View className="mb-4">
                  <View className="mb-3 flex-row items-center justify-between px-0.5">
                    <Text className="text-[17px] font-bold text-scc-charcoal">Parked with you</Text>
                    {unreleased.length > 1 ? (
                      <Pressable
                        onPress={releaseAll}
                        hitSlop={8}
                        accessibilityRole="button"
                        accessibilityLabel="Release all devices"
                        className="active:opacity-70"
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
                      {unreleased.length} of {parked.devices.length} still to release
                    </Text>
                  )}

                  <View className="gap-3">
                    {parked.devices.map((d) => {
                      const isOut = released[d.id];
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
                              onPress={() => releaseDevice(d.id)}
                              accessibilityRole="button"
                              accessibilityLabel={`Release ${d.kind}`}
                              className="mt-4 rounded-[14px] bg-scc-blue py-3.5 active:opacity-90"
                            >
                              <Text className="text-center text-[16px] font-bold text-white">Release</Text>
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
              <View className="mb-4 rounded-[20px] bg-white p-5 shadow-sm">
                {dropoffFromList ? (
                  <Text className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-scc-muted">
                    Pre-registered rider · edit if anything changed
                  </Text>
                ) : (
                  <Text className="mb-4 text-[17px] font-bold text-scc-charcoal">Rider</Text>
                )}
                <AppInput
                  label="Ticket #"
                  optional
                  value={ticket}
                  onChangeText={setTicket}
                  placeholder="Type ID if you have it"
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
                {dropoffFromList ? (
                  <Link href="/respondent-select" asChild>
                    <Pressable className="mt-5 self-start active:opacity-70">
                      <Text className="text-[15px] font-semibold text-scc-blue">Wrong rider?</Text>
                    </Pressable>
                  </Link>
                ) : null}
              </View>

              <View className="mb-4 rounded-[20px] bg-white p-5 shadow-sm">
                <Text className="mb-1 text-[17px] font-bold text-scc-charcoal">Devices</Text>
                <Text className="mb-4 text-[15px] text-scc-muted">Count and details</Text>
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
                    const row = deviceRows[index] ?? { kind: "", notes: "" };
                    return (
                      <View key={index} className="mb-5 rounded-[16px] bg-slate-50 p-4 last:mb-0">
                        <Text className="mb-3 text-[15px] font-semibold text-scc-charcoal">
                          Device {index + 1}
                        </Text>
                        <Text className="mb-2 text-[13px] font-medium text-scc-muted">Type</Text>
                        <TextInput
                          value={row.kind}
                          onChangeText={(t) => updateDeviceRow(index, { kind: t })}
                          placeholder="e.g. E-scooter"
                          placeholderTextColor="#94a3b8"
                          className="mb-3 rounded-[14px] bg-white px-3 py-3.5 text-[16px] text-scc-charcoal"
                        />
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
          <Link href="/" asChild>
            <Pressable
              className={`flex-row items-center justify-center gap-2 rounded-[16px] py-4 active:opacity-95 ${
                dropoffFromList ? "bg-scc-teal" : "bg-scc-blue"
              }`}
            >
              <Text className="text-center text-[17px] font-bold text-white">
                {handoverPickupFromSearch || isPickup
                  ? "Done"
                  : dropoffFromList
                    ? "Check in"
                    : "Save"}
              </Text>
              <Ionicons name="checkmark" size={22} color="#fff" />
            </Pressable>
          </Link>
        </View>
      </View>
    </MintBackground>
  );
}
