import { Text, View } from "react-native";

import { THINK, THINK_CHEVRON } from "../constants/councilTheme";

type Props = {
  /** Taller block for hero; slimmer for inline */
  size?: "default" | "compact";
};

export function ThinkChangeMark({ size = "default" }: Props) {
  const pad = size === "compact" ? "px-2.5 py-1.5" : "px-3 py-2.5";
  const textMain = size === "compact" ? "text-sm" : "text-base";
  return (
    <View className="flex-row items-stretch self-start overflow-hidden rounded-xl">
      <View className={`flex-row items-center bg-think-green ${pad}`}>
        <View>
          <Text className={`font-extrabold text-white ${textMain} leading-tight`}>Think</Text>
          <Text className={`font-extrabold text-white ${textMain} leading-tight`}>Change</Text>
        </View>
        <View className="ml-2 flex-row items-end gap-0.5">
          <View
            className="w-1.5 rounded-sm"
            style={{ height: size === "compact" ? 22 : 28, backgroundColor: THINK_CHEVRON.sky }}
          />
          <View
            className="w-1.5 rounded-sm"
            style={{ height: size === "compact" ? 18 : 24, backgroundColor: THINK_CHEVRON.pink }}
          />
          <View
            className="w-1.5 rounded-sm"
            style={{ height: size === "compact" ? 14 : 20, backgroundColor: THINK_CHEVRON.yellow }}
          />
        </View>
      </View>
    </View>
  );
}
