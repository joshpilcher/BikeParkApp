import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { COUNCIL } from "../constants/councilTheme";

export default function PreRegisterSuccessScreen() {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={[COUNCIL.wash, "#ffffff"]}
      style={{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <View className="flex-1 justify-center px-6">
        <View className="mb-8 items-center">
          <View className="mb-5 rounded-full bg-white p-2 shadow-lg shadow-scc-blue/10">
            <Ionicons name="checkmark-circle" size={72} color={COUNCIL.teal} />
          </View>
          <Text className="text-center text-[26px] font-bold text-scc-charcoal">You&apos;re booked</Text>
          <Text className="mt-3 text-center text-[16px] leading-6 text-scc-muted">
            Bring this phone to the BikePark desk. Staff will confirm your gear and give you a ticket.
          </Text>
        </View>

        <View className="rounded-[16px] bg-white/90 px-4 py-4 shadow-sm">
          <Text className="text-center text-[14px] leading-5 text-scc-muted">
            Screenshot if you want a reminder before you leave.
          </Text>
        </View>

        <Link href="/" asChild>
          <Pressable className="mt-10 rounded-[16px] bg-scc-blue py-4 shadow-md shadow-scc-blue/20 active:opacity-95">
            <Text className="text-center text-[17px] font-bold text-white">Home</Text>
          </Pressable>
        </Link>
      </View>
    </LinearGradient>
  );
}
