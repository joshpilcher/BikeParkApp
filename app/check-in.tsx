import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ScreenHeader } from "../components/ScreenHeader";
import { COPY } from "../constants/copy";

type Tab = "checkin" | "pickup";

export default function CheckInScreen() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>("checkin");
  const [bikeId, setBikeId] = useState("");
  const [location, setLocation] = useState("");

  return (
    <View className="flex-1 bg-scc-wash" style={{ paddingTop: insets.top }}>
      <ScreenHeader title="Scanner" subtitle={COPY.checkInLead} />

      <View className="px-4 pb-3">
        <View className="flex-row rounded-[14px] bg-white p-1 shadow-sm">
          <Pressable
            onPress={() => setTab("checkin")}
            className={`flex-1 rounded-[12px] py-3.5 ${tab === "checkin" ? "bg-scc-teal" : ""}`}
          >
            <Text
              className={`text-center text-[15px] font-semibold ${
                tab === "checkin" ? "text-white" : "text-scc-muted"
              }`}
            >
              Check in
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setTab("pickup")}
            className={`flex-1 rounded-[12px] py-3.5 ${tab === "pickup" ? "bg-scc-blue" : ""}`}
          >
            <Text
              className={`text-center text-[15px] font-semibold ${
                tab === "pickup" ? "text-white" : "text-scc-muted"
              }`}
            >
              Pick up
            </Text>
          </Pressable>
        </View>
      </View>

      <View className="flex-1 px-4">
        <View className="mb-7 aspect-[5/4] w-full items-center justify-center rounded-[24px] border-2 border-dashed border-scc-teal/20 bg-white">
          <View className="rounded-full bg-scc-wash p-7">
            <Ionicons name="qr-code-outline" size={80} color="#00A99D" />
          </View>
          <Text className="mt-4 max-w-[260px] text-center text-[15px] leading-6 text-scc-muted">
            Point the camera at a QR code to fill the ID below.
          </Text>
        </View>

        <Text className="mb-2 text-[15px] font-semibold text-scc-charcoal">Or type it in</Text>
        <View className="mb-4">
          <Text className="mb-2 text-[13px] font-medium text-scc-muted">ID</Text>
          <TextInput
            value={bikeId}
            onChangeText={setBikeId}
            placeholder="Device or ticket"
            placeholderTextColor="#94a3b8"
            className="rounded-[16px] bg-slate-100 px-4 py-4 text-[16px] text-scc-charcoal"
          />
        </View>
        <View className="mb-8">
          <Text className="mb-2 text-[13px] font-medium text-scc-muted">Bay / zone</Text>
          <TextInput
            value={location}
            onChangeText={setLocation}
            placeholder="Optional"
            placeholderTextColor="#94a3b8"
            className="rounded-[16px] bg-slate-100 px-4 py-4 text-[16px] text-scc-charcoal"
          />
        </View>

        <Pressable className="rounded-[16px] bg-scc-teal py-4 shadow-md shadow-scc-blue/15 active:opacity-95">
          <Text className="text-center text-[17px] font-bold text-white">Confirm</Text>
        </Pressable>

        <Link href="/" asChild>
          <Pressable className="mt-5 py-2 active:opacity-70">
            <Text className="text-center text-[15px] font-semibold text-scc-blue">Home</Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}
