import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import type { ComponentProps } from "react";
import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ScreenHeader } from "../components/ScreenHeader";
import { COPY } from "../constants/copy";
import { COUNCIL } from "../constants/councilTheme";

export default function CheckTicketScreen() {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");

  return (
    <View className="flex-1 bg-scc-wash" style={{ paddingTop: insets.top }}>
      <ScreenHeader title="Ticket lookup" subtitle={COPY.ticketLead} />

      <View className="flex-1 px-4 pb-4">
        <View className="mb-4 flex-row items-center gap-2">
          <View className="flex-1 flex-row items-center rounded-[16px] bg-white px-3 shadow-sm">
            <Ionicons name="search" size={20} color={COUNCIL.blue} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Name or mobile"
              placeholderTextColor="#94a3b8"
              className="flex-1 py-3.5 pl-2 text-[16px] text-scc-charcoal"
            />
          </View>
          <Pressable className="rounded-[16px] bg-scc-teal p-3.5 shadow-sm active:opacity-90">
            <Ionicons name="refresh" size={22} color="#fff" />
          </Pressable>
        </View>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          <View className="overflow-hidden rounded-[20px] bg-white shadow-md shadow-slate-900/8">
            <View className="h-1.5 w-full bg-scc-teal" />
            <View className="p-5">
              <Text className="text-[13px] font-medium text-scc-muted">Ticket</Text>
              <Text className="mt-1 text-4xl font-bold tabular-nums text-scc-charcoal">123</Text>

              <View className="my-5 h-px bg-slate-100" />

              <View className="mb-5 flex-row flex-wrap gap-8">
                <View className="min-w-[120px]">
                  <Text className="text-[13px] font-medium text-scc-muted">Rider</Text>
                  <Text className="mt-1 text-[18px] font-semibold text-scc-charcoal">Andy</Text>
                </View>
                <View className="min-w-[140px] flex-1">
                  <Text className="text-[13px] font-medium text-scc-muted">Gear</Text>
                  <Text className="mt-1 text-[16px] text-scc-charcoal">Blue scooter</Text>
                  <Text className="text-[16px] text-scc-charcoal">Brown bike</Text>
                </View>
              </View>

              <Row label="Mobile" value="0475578539" icon="call-outline" />
              <Row label="Devices" value="2" icon="layers-outline" />
              <Row label="Still parked" value="2" icon="bicycle" />
              <Row label="Notes" value="Back left corner" icon="document-text-outline" />
            </View>
          </View>
        </ScrollView>
      </View>

      <View
        className="border-t border-slate-200 bg-white px-4 pt-3"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}
      >
        <Link href="/" asChild>
          <Pressable className="rounded-[16px] bg-scc-blue py-4 active:opacity-95">
            <Text className="text-center text-[17px] font-semibold text-white">Done</Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}

type IonName = ComponentProps<typeof Ionicons>["name"];

function Row({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: IonName;
}) {
  return (
    <View className="mb-4 flex-row items-start gap-3">
      <View className="mt-0.5 rounded-[10px] bg-scc-wash p-2">
        <Ionicons name={icon} size={18} color={COUNCIL.muted} />
      </View>
      <View className="flex-1">
        <Text className="text-[13px] font-medium text-scc-muted">{label}</Text>
        <Text className="mt-0.5 text-[16px] text-scc-charcoal">{value}</Text>
      </View>
    </View>
  );
}
