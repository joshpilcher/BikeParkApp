import { LinearGradient } from "expo-linear-gradient";
import { View } from "react-native";

import { COUNCIL } from "../constants/councilTheme";

type Props = {
  size?: number;
};

/** Abstract three-stroke mark inspired by the SCC logo (no asset file required) */
export function SCCWaveMark({ size = 48 }: Props) {
  const h = size;
  const gap = size * 0.08;
  const w1 = size * 0.2;
  const w2 = size * 0.16;
  const w3 = size * 0.22;
  return (
    <View
      className="flex-row items-end"
      style={{ height: h, gap, marginRight: 2 }}
    >
      <LinearGradient
        colors={[COUNCIL.teal, COUNCIL.blue]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ width: w1, height: h * 0.7, borderRadius: 3 }}
      />
      <LinearGradient
        colors={[COUNCIL.teal, COUNCIL.blue]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ width: w2, height: h * 0.95, borderRadius: 3 }}
      />
      <LinearGradient
        colors={[COUNCIL.teal, COUNCIL.blue]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ width: w3, height: h * 0.62, borderRadius: 3 }}
      />
    </View>
  );
}
