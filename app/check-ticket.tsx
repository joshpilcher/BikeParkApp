import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ScreenHeader } from "../components/ScreenHeader";
import { COPY } from "../constants/copy";
import { COUNCIL } from "../constants/councilTheme";

export default function CheckTicketScreen() {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");

  useFocusEffect(
    useCallback(() => {
      return () => {
        setQuery("");
      };
    }, []),
  );

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
          contentContainerStyle={{ paddingBottom: 24, flexGrow: 1 }}
        >
          <View className="flex-1 justify-center rounded-[20px] border border-dashed border-slate-200 bg-white px-6 py-12">
            <Text className="text-center text-[16px] leading-6 text-scc-muted">
              {query.trim()
                ? "No ticket found for that search. When your backend is connected, results will appear here."
                : "Search by name or mobile to load ticket and parked gear. Results will appear here once data is connected."}
            </Text>
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
