import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Link } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ActionTile } from "../components/ActionTile";
import { CouncilDashboardHeader } from "../components/CouncilDashboardHeader";
import { COPY } from "../constants/copy";
import { COUNCIL } from "../constants/councilTheme";
import { useActiveEvent } from "../contexts/ActiveEventContext";
import { DEVICE_CATEGORIES } from "../constants/devices";
import { fetchDeviceCategoryBreakdown, fetchEventSessionStats } from "../lib/eventStats";

const initialCounts = Object.fromEntries(DEVICE_CATEGORIES.map((d) => [d.key, 0])) as Record<
  string,
  number
>;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { liveEventName, liveEventId } = useActiveEvent();
  const [counts, setCounts] = useState(initialCounts);
  const [stillParked, setStillParked] = useState(0);
  const [checkedInTotal, setCheckedInTotal] = useState(0);
  const [statsLoading, setStatsLoading] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const loadSessionStats = useCallback(async () => {
    if (!liveEventId) {
      setStillParked(0);
      setCheckedInTotal(0);
      setCounts(initialCounts);
      return;
    }

    setStatsLoading(true);
    try {
      const [session, breakdown] = await Promise.all([
        fetchEventSessionStats(liveEventId),
        fetchDeviceCategoryBreakdown(liveEventId),
      ]);
      setStillParked(session.stillParked);
      setCheckedInTotal(session.checkedInTotal);
      setCounts(breakdown);
    } finally {
      setStatsLoading(false);
    }
  }, [liveEventId]);

  useFocusEffect(
    useCallback(() => {
      void loadSessionStats();
    }, [loadSessionStats]),
  );

  return (
    <View className="flex-1 bg-scc-wash" style={{ paddingTop: insets.top }}>
      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        <CouncilDashboardHeader />

        <View className="mb-3 flex-row items-center gap-3 rounded-[20px] bg-white px-4 py-3.5 shadow-sm shadow-slate-900/5">
          <View className="rounded-[12px] bg-scc-teal/12 p-2.5">
            <Ionicons name="calendar-outline" size={20} color={COUNCIL.teal} />
          </View>
          <View className="min-w-0 flex-1">
            <Text className="text-[15px] font-semibold text-scc-charcoal" numberOfLines={1}>
              {liveEventName ?? COPY.eventPlaceholder}
            </Text>
            <Text className="text-[13px] text-scc-muted" numberOfLines={1}>
              {COPY.sessionCardHint}
            </Text>
          </View>
          <View className="rounded-full bg-scc-teal/12 px-2.5 py-1">
            <Text className="text-[10px] font-semibold uppercase tracking-wider text-scc-blue">Live</Text>
          </View>
        </View>

        <Link href="/create-event" asChild>
          <Pressable className="mb-4 min-h-[52px] flex-row items-center justify-center gap-2 rounded-[16px] border border-scc-teal/35 bg-white px-4 py-3.5 shadow-sm active:opacity-95">
            <Ionicons name="add-circle-outline" size={22} color={COUNCIL.teal} />
            <Text className="text-[15px] font-semibold text-scc-charcoal">{COPY.createEventCta}</Text>
          </Pressable>
        </Link>

        <View className="mb-4 overflow-hidden rounded-[20px] bg-white shadow-sm shadow-slate-900/6">
          <View className="flex-row items-stretch">
            <View className="flex-1 border-r border-slate-100 px-4 py-4">
              <View className="mb-1 flex-row items-center justify-between">
                <Text className="text-[13px] font-medium text-scc-muted">{COPY.onSiteLabel}</Text>
                <Pressable
                  onPress={() => void loadSessionStats()}
                  hitSlop={10}
                  accessibilityLabel="Refresh session stats"
                  className="rounded-full p-1.5 active:bg-slate-100"
                  disabled={statsLoading}
                >
                  {statsLoading ? (
                    <ActivityIndicator size="small" color={COUNCIL.muted} />
                  ) : (
                    <Ionicons name="refresh" size={16} color={COUNCIL.muted} />
                  )}
                </Pressable>
              </View>
              <Text className="text-4xl font-bold tabular-nums text-rose-600">{stillParked}</Text>
            </View>
            <View className="flex-1 px-4 py-4">
              <Text className="mb-1 text-[13px] font-medium text-scc-muted">{COPY.checkedInLabel}</Text>
              <Text className="text-4xl font-bold tabular-nums text-scc-blue">{checkedInTotal}</Text>
            </View>
          </View>
        </View>

        {COPY.actionsTitle ? (
          <Text className="mb-2 px-1 text-[13px] font-semibold text-scc-muted">{COPY.actionsTitle}</Text>
        ) : null}
        <ActionTile
          href="/respondent-select?mode=dropoff"
          icon="download-outline"
          title={COPY.dropOffTitle}
          subtitle={COPY.dropOffSubtitle}
          accentClass="bg-scc-teal"
        />
        <ActionTile
          href="/respondent-select?mode=pickup"
          icon="arrow-up-circle-outline"
          title={COPY.pickUpTitle}
          subtitle={COPY.pickUpSubtitle}
          accentClass="bg-scc-blue"
        />

        <View className="mb-3 mt-2">
          <Link href="/pre-register" asChild>
            <Pressable className="min-h-[54px] flex-row items-center justify-center gap-2 rounded-[16px] bg-white px-3 py-3.5 shadow-sm active:opacity-90">
              <Ionicons name="create-outline" size={22} color={COUNCIL.blue} />
              <Text className="text-[15px] font-semibold text-scc-charcoal" numberOfLines={1}>
                {COPY.preRegShort}
              </Text>
            </Pressable>
          </Link>
        </View>

        <Pressable
          onPress={() => setDetailsOpen(!detailsOpen)}
          className="mt-1 flex-row items-center justify-between rounded-[20px] bg-white px-4 py-3.5 shadow-sm active:opacity-95"
        >
          <View className="min-w-0 flex-1 flex-row items-center gap-2.5">
            <Ionicons name="options-outline" size={22} color={COUNCIL.teal} />
            <View className="min-w-0 flex-1">
              <Text className="text-[15px] font-semibold text-scc-charcoal">Session details</Text>
              <Text className="text-[13px] text-scc-muted">
                {detailsOpen ? "Hide" : "Gear still on site by type"}
              </Text>
            </View>
          </View>
          <Ionicons
            name={detailsOpen ? "chevron-up" : "chevron-down"}
            size={22}
            color={COUNCIL.muted}
          />
        </Pressable>

        {detailsOpen ? (
          <View className="mt-2">
            <View className="overflow-hidden rounded-[20px] bg-white px-4 py-2 shadow-sm">
              {DEVICE_CATEGORIES.map((cat) => (
                <View
                  key={cat.key}
                  className="flex-row items-center justify-between border-b border-slate-50 py-3 last:border-b-0"
                >
                  <Text className={`text-[15px] text-scc-charcoal ${cat.indent ? "pl-3 italic" : ""}`}>
                    {cat.indent ? "· " : ""}
                    {cat.label}
                  </Text>
                  <Text className="text-[15px] font-semibold tabular-nums text-scc-charcoal">
                    {counts[cat.key]}
                  </Text>
                </View>
              ))}
            </View>

            <View className="mt-3 rounded-[20px] border border-dashed border-scc-teal/25 bg-white px-4 py-4">
              <Text className="text-[13px] leading-5 text-scc-muted">
                This breakdown only includes devices still checked in or parked (not released). Active visits
                only — same scope as Still parked. Set devices.category_key when saving gear.
              </Text>
            </View>
          </View>
        ) : null}

        {COPY.operatorFooter ? (
          <Text className="mt-8 px-2 text-center text-[11px] leading-4 text-scc-muted">
            {COPY.operatorFooter}
          </Text>
        ) : null}
      </ScrollView>

      <View
        className="border-t border-slate-200/90 bg-white/95 px-4 pt-2.5"
        style={{ paddingBottom: Math.max(insets.bottom, 12) }}
      >
        <Link href="/check-ticket" asChild>
          <Pressable className="overflow-hidden rounded-[16px] active:opacity-95">
            <LinearGradient
              colors={[COUNCIL.teal, COUNCIL.blue]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={{ paddingVertical: 16, paddingHorizontal: 18 }}
            >
              <View className="flex-row items-center justify-center gap-2">
                <Ionicons name="ticket-outline" size={22} color="#fff" />
                <Text className="text-[17px] font-semibold text-white">Ticket lookup</Text>
              </View>
            </LinearGradient>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}
