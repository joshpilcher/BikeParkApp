import { Ionicons } from "@expo/vector-icons";
import type { Href } from "expo-router";
import { Link } from "expo-router";
import type { ComponentProps } from "react";
import { Pressable, Text, View } from "react-native";

type IoniconsName = ComponentProps<typeof Ionicons>["name"];

type Props = {
  href: Href;
  icon: IoniconsName;
  title: string;
  subtitle: string;
  accentClass?: string;
};

/** Large tappable row — iOS “settings” scale, not a dense form row */
export function ActionTile({
  href,
  icon,
  title,
  subtitle,
  accentClass = "bg-scc-teal",
}: Props) {
  return (
    <Link href={href} asChild>
      <Pressable
        className={`mb-3 overflow-hidden rounded-[20px] shadow-md shadow-slate-900/10 active:opacity-95 ${accentClass}`}
      >
        <View className="flex-row items-center gap-3.5 px-4 py-5">
          <View className="rounded-[14px] bg-white/22 p-3">
            <Ionicons name={icon} size={26} color="#ffffff" />
          </View>
          <View className="min-w-0 flex-1">
            <Text className="text-[20px] font-bold leading-snug text-white">{title}</Text>
            <Text
              className="mt-1.5 text-[16px] font-medium leading-[22px] text-white"
              style={{
                textShadowColor: "rgba(0,0,0,0.22)",
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 3,
              }}
            >
              {subtitle}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color="#ffffff" />
        </View>
      </Pressable>
    </Link>
  );
}
