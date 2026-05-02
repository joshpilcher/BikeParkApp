import { LinearGradient } from "expo-linear-gradient";
import { type ReactNode } from "react";
import { View } from "react-native";

import { COUNCIL } from "../constants/councilTheme";

/** Soft SCC-aligned wash — lighter than solid mint */
export function MintBackground({ children }: { children: ReactNode }) {
  return (
    <LinearGradient
      colors={[COUNCIL.wash, "#FFFFFF", COUNCIL.ice]}
      locations={[0, 0.55, 1]}
      start={{ x: 0, y: 1 }}
      end={{ x: 1, y: 0 }}
      style={{ flex: 1 }}
    >
      <View className="flex-1">{children}</View>
    </LinearGradient>
  );
}
