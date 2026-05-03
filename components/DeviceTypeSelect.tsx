import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useMemo } from "react";
import { ActionSheetIOS, Platform, Pressable, Text, View } from "react-native";

import { DEVICE_CATEGORIES } from "../constants/devices";
import { COUNCIL } from "../constants/councilTheme";

type Props = {
  value: string;
  onChange: (categoryKey: string) => void;
  placeholder?: string;
};

export function DeviceTypeSelect({
  value,
  onChange,
  placeholder = "Select type",
}: Props) {
  const displayLabel = useMemo(
    () => DEVICE_CATEGORIES.find((c) => c.key === value)?.label ?? "",
    [value],
  );

  if (Platform.OS === "ios") {
    return (
      <Pressable
        onPress={() => {
          const labels = DEVICE_CATEGORIES.map((c) => (c.indent ? `· ${c.label}` : c.label));
          ActionSheetIOS.showActionSheetWithOptions(
            {
              options: ["Cancel", ...labels],
              cancelButtonIndex: 0,
              title: "Device type",
              userInterfaceStyle: "light",
            },
            (buttonIndex) => {
              if (buttonIndex === 0) return;
              const cat = DEVICE_CATEGORIES[buttonIndex - 1];
              if (cat) onChange(cat.key);
            },
          );
        }}
        accessibilityRole="button"
        accessibilityLabel={`Device type: ${displayLabel || placeholder}`}
        className="mb-3 flex-row items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3.5 active:bg-slate-50"
      >
        <Text
          className={`min-w-0 flex-1 text-[16px] ${displayLabel ? "font-medium text-scc-charcoal" : "text-slate-400"}`}
          numberOfLines={1}
        >
          {displayLabel || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={20} color={COUNCIL.muted} />
      </Pressable>
    );
  }

  return (
    <View className="mb-3 overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <Picker
        selectedValue={value === "" ? "" : value}
        onValueChange={(v) => onChange(String(v))}
        mode={Platform.OS === "android" ? "dropdown" : "dialog"}
        dropdownIconColor={COUNCIL.teal}
        style={{
          height: Platform.OS === "android" ? 52 : 48,
        }}
      >
        <Picker.Item label={placeholder} value="" color="#94a3b8" />
        {DEVICE_CATEGORIES.map((c) => (
          <Picker.Item
            key={c.key}
            label={c.indent ? `· ${c.label}` : c.label}
            value={c.key}
            color="#333333"
          />
        ))}
      </Picker>
    </View>
  );
}
