import { Ionicons } from "@expo/vector-icons";
import type { Href } from "expo-router";
import { Link } from "expo-router";
import { Pressable, Text, View } from "react-native";

type Props = {
  title: string;
  subtitle?: string;
  href?: Href;
};

/** Minimal nav chrome — large title, optional one-line context */
export function ScreenHeader({ title, subtitle, href = "/" }: Props) {
  return (
    <View className="bg-scc-wash px-4 pb-3 pt-0">
      <View className="flex-row items-center gap-1">
        <Link href={href} asChild>
          <Pressable
            hitSlop={14}
            className="-ml-2 rounded-full p-2 active:opacity-60"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={28} color="#00548B" />
          </Pressable>
        </Link>
        <View className="min-w-0 flex-1 pb-0.5">
          <Text
            className="text-[28px] font-bold tracking-tight text-scc-charcoal"
            style={{ letterSpacing: -0.5 }}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text className="mt-0.5 text-[15px] leading-5 text-scc-muted" numberOfLines={2}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}
