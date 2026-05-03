import { Ionicons } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppInput } from "../components/AppInput";
import { MintBackground } from "../components/MintBackground";

type DeviceRow = { kind: string; notes: string };

export default function PreRegisterScreen() {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [deviceCount, setDeviceCount] = useState<number | null>(null);
  const [deviceRows, setDeviceRows] = useState<DeviceRow[]>([]);
  const [termsOk, setTermsOk] = useState(false);

  const handleDeviceCountSelect = useCallback((n: number) => {
    setDeviceCount(n);
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

  const progress = useMemo(() => {
    let p = 0;
    if (name.trim() && mobile.trim()) p += 1;
    if (deviceCount !== null) p += 1;
    if (termsOk) p += 1;
    return p;
  }, [name, mobile, deviceCount, termsOk]);

  function submit() {
    router.push("/pre-register-success");
  }

  const canSubmit =
    name.trim().length > 0 &&
    mobile.trim().length > 0 &&
    deviceCount !== null &&
    termsOk;

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
          <View className="mb-6 flex-row items-center justify-between">
            <Link href="/" asChild>
              <Pressable
                hitSlop={12}
                className="h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm active:opacity-80"
                accessibilityLabel="Back"
              >
                <Ionicons name="chevron-back" size={26} color="#333333" />
              </Pressable>
            </Link>
            <View className="flex-row gap-2">
              {[0, 1, 2].map((i) => (
                <View
                  key={i}
                  className={`h-2 w-2 rounded-full ${i < progress ? "bg-scc-teal" : "bg-slate-200"}`}
                />
              ))}
            </View>
            <View className="w-11" />
          </View>

          <View className="mb-6 items-center">
            <View className="mb-4 h-[88px] w-[88px] items-center justify-center rounded-[22px] bg-scc-teal shadow-lg shadow-scc-blue/12">
              <Ionicons name="bicycle" size={44} color="#ffffff" />
            </View>
            <Text className="text-center text-[26px] font-bold tracking-tight text-scc-charcoal">
              Book BikePark
            </Text>
            <Text className="mt-2 text-center text-[16px] text-scc-muted">
              Tell us who&apos;s coming and what you&apos;re bringing
            </Text>
            <View className="mt-4 rounded-full bg-white/90 px-4 py-2 shadow-sm">
              <Text className="text-center text-[12px] font-medium text-scc-charcoal">
                ThinkChange · Sunshine Coast Council
              </Text>
            </View>
          </View>

          <View className="mb-5 rounded-[20px] bg-white px-4 py-4 shadow-sm">
            <Text className="text-[15px] leading-5 text-scc-muted">
              We only use your details to run BikePark at this event.
            </Text>
          </View>

          <View className="mb-4 rounded-[20px] bg-white p-5 shadow-sm">
            <Text className="mb-4 text-[20px] font-bold text-scc-charcoal">Contact</Text>
            <AppInput
              label="Name"
              value={name}
              onChangeText={setName}
              placeholder="Your name"
            />
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
              sublabel="For optional event updates"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
            />
          </View>

          <View className="mb-4 rounded-[20px] bg-white p-5 shadow-sm">
            <Text className="mb-1 text-[20px] font-bold text-scc-charcoal">Devices</Text>
            <Text className="mb-4 text-[15px] text-scc-muted">How many are you bringing?</Text>
            <View className="flex-row flex-wrap justify-center gap-2.5">
              {[1, 2, 3, 4, 5, 6].map((n) => {
                const selected = deviceCount === n;
                return (
                  <Pressable
                    key={n}
                    onPress={() => handleDeviceCountSelect(n)}
                    className={`h-[52px] min-w-[52px] items-center justify-center rounded-[16px] px-4 active:opacity-90 ${
                      selected ? "bg-scc-teal" : "bg-slate-100"
                    }`}
                  >
                    <Text
                      className={`text-xl font-bold tabular-nums ${selected ? "text-white" : "text-scc-charcoal"}`}
                    >
                      {n}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Text className="mt-4 text-center text-[13px] text-slate-400">Up to 6</Text>

            {deviceCount !== null && deviceCount > 0 ? (
              <View className="mt-6 border-t border-slate-100 pt-6">
                <Text className="mb-4 text-[15px] text-scc-muted">
                  Add a quick description so staff can spot your gear.
                </Text>
                {Array.from({ length: deviceCount }).map((_, index) => {
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
                        placeholder="e.g. Mountain bike"
                        placeholderTextColor="#94a3b8"
                        className="mb-3 rounded-[14px] bg-white px-3 py-3.5 text-[16px] text-scc-charcoal"
                      />
                      <Text className="mb-2 text-[13px] font-medium text-scc-muted">Notes</Text>
                      <TextInput
                        value={row.notes}
                        onChangeText={(t) => updateDeviceRow(index, { notes: t })}
                        placeholder="Colour, accessories…"
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
            ) : null}
          </View>

          <View className="mb-4 rounded-[20px] bg-white p-5 shadow-sm">
            <Text className="mb-3 text-[20px] font-bold text-scc-charcoal">Terms</Text>
            <View className="rounded-[16px] bg-slate-50 px-4 py-4">
              <Text className="text-[15px] leading-6 text-scc-muted">
                Follow event signage and hours. Park at your own risk when unattended. We may text you
                about pickup.
              </Text>
            </View>

            <Pressable
              onPress={() => setTermsOk(!termsOk)}
              className={`mt-4 flex-row items-center gap-4 rounded-[16px] border-2 px-4 py-4 active:opacity-95 ${
                termsOk ? "border-scc-teal bg-scc-wash" : "border-slate-200 bg-white"
              }`}
            >
              <View
                className={`h-11 w-11 items-center justify-center rounded-full ${
                  termsOk ? "bg-scc-teal" : "bg-slate-100"
                }`}
              >
                <Ionicons
                  name={termsOk ? "checkmark" : "ellipse-outline"}
                  size={22}
                  color={termsOk ? "#fff" : "#64748b"}
                />
              </View>
              <Text className="flex-1 text-[16px] font-semibold text-scc-charcoal">I agree</Text>
            </Pressable>
          </View>
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
          <Pressable
            disabled={!canSubmit}
            onPress={submit}
            className={`flex-row items-center justify-center gap-2 rounded-[16px] py-4 ${
              canSubmit ? "bg-scc-blue active:opacity-95" : "bg-slate-200"
            }`}
          >
            <Text
              className={`text-center text-[17px] font-bold ${
                canSubmit ? "text-white" : "text-slate-400"
              }`}
            >
              Submit
            </Text>
            {canSubmit ? <Ionicons name="arrow-forward" size={22} color="#fff" /> : null}
          </Pressable>
        </View>
      </View>
    </MintBackground>
  );
}
