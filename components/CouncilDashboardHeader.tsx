import { LinearGradient } from "expo-linear-gradient";
import { Text, View } from "react-native";

import { COPY } from "../constants/copy";
import { COUNCIL } from "../constants/councilTheme";
import { SCCWaveMark } from "./SCCWaveMark";
import { ThinkChangeMark } from "./ThinkChangeMark";

/** Gradient hero with SCC wordmark + Think Change — matches council palette */
export function CouncilDashboardHeader() {
  return (
    <View className="mb-5 overflow-hidden rounded-3xl shadow-lg shadow-scc-blue/15">
      <LinearGradient
        colors={[COUNCIL.gradBlue, COUNCIL.gradTeal]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20 }}
      >
        <View className="flex-row items-start gap-4">
          <SCCWaveMark size={56} />
          <View className="min-w-0 flex-1 pt-0.5">
            <Text className="text-xl font-bold leading-tight text-white" style={{ letterSpacing: -0.3 }}>
              Sunshine Coast
            </Text>
            <Text className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/75">
              Council
            </Text>
            <Text className="mt-3 text-lg font-bold tracking-tight text-white">{COPY.appName}</Text>
            <Text className="mt-1.5 text-[15px] leading-5 text-white/90" numberOfLines={2}>
              {COPY.tagline}
            </Text>
          </View>
        </View>

        <View className="mt-4 flex-row items-center gap-3 border-t border-white/20 pt-4">
          <ThinkChangeMark />
        </View>
      </LinearGradient>
    </View>
  );
}
