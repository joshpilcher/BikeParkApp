import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppInput } from "../components/AppInput";
import { MintBackground } from "../components/MintBackground";
import { ScreenHeader } from "../components/ScreenHeader";
import { useActiveEvent } from "../contexts/ActiveEventContext";
import { COPY } from "../constants/copy";
import { isSupabaseConfigured, supabase } from "../lib/supabase";

type EventStatus = "draft" | "published" | "live";

const STATUS_OPTIONS: { value: EventStatus; label: string }[] = [
  { value: "live", label: "Live" },
  { value: "published", label: "Published" },
  { value: "draft", label: "Draft" },
];

export default function CreateEventScreen() {
  const insets = useSafeAreaInsets();
  const { refresh } = useActiveEvent();
  const [name, setName] = useState("");
  const [status, setStatus] = useState<EventStatus>("live");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      return () => {
        setName("");
        setStatus("live");
        setBusy(false);
        setError(null);
      };
    }, []),
  );

  async function submit() {
    setError(null);
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Enter an event name.");
      return;
    }
    if (!isSupabaseConfigured()) {
      setError("Supabase is not configured. Check your .env file.");
      return;
    }

    setBusy(true);
    try {
      const { error: insertError } = await supabase.from("events").insert({
        name: trimmed,
        status,
      });

      if (insertError) {
        setError(insertError.message);
        return;
      }

      const statusLabel = STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status;
      Alert.alert(
        COPY.createEventSuccessTitle,
        `“${trimmed}” is saved as ${statusLabel}. Tap OK to return to the dashboard.`,
        [
          {
            text: "OK",
            onPress: () => {
              void refresh();
              router.back();
            },
          },
        ],
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <MintBackground>
      <View className="flex-1" style={{ paddingTop: insets.top }}>
        <ScreenHeader title={COPY.createEventTitle} subtitle={COPY.createEventLead} href="/" />

        <ScrollView
          className="flex-1 px-4"
          contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="mb-4 rounded-[20px] bg-white p-5 shadow-sm">
            <AppInput
              label="Event name"
              value={name}
              onChangeText={setName}
              placeholder="e.g. Riverfest Sunday"
            />

            <Text className="mb-3 mt-2 text-[15px] font-semibold text-slate-900">Status</Text>
            <Text className="mb-3 text-[13px] leading-5 text-scc-muted">
              Live events appear on the home dashboard title when synced.
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {STATUS_OPTIONS.map((opt) => {
                const selected = status === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => setStatus(opt.value)}
                    className={`rounded-[14px] px-4 py-3 active:opacity-90 ${
                      selected ? "bg-scc-teal" : "bg-slate-100"
                    }`}
                  >
                    <Text
                      className={`text-[15px] font-semibold ${
                        selected ? "text-white" : "text-scc-charcoal"
                      }`}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {error ? (
              <Text className="mt-4 text-[14px] leading-5 text-red-600">{error}</Text>
            ) : null}

            <Pressable
              onPress={submit}
              disabled={busy || !name.trim()}
              className={`mt-8 flex-row items-center justify-center gap-2 rounded-[16px] py-4 ${
                busy || !name.trim() ? "bg-slate-300" : "bg-scc-teal active:opacity-95"
              }`}
            >
              {busy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="add-circle-outline" size={22} color="#fff" />
                  <Text className="text-[17px] font-bold text-white">Create event</Text>
                </>
              )}
            </Pressable>
          </View>

          <Link href="/" asChild>
            <Pressable className="py-2 active:opacity-70">
              <Text className="text-center text-[15px] font-semibold text-scc-blue">Cancel</Text>
            </Pressable>
          </Link>
        </ScrollView>
      </View>
    </MintBackground>
  );
}
