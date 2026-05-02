import { Text, TextInput, View } from "react-native";

type Props = {
  label: string;
  optional?: boolean;
  sublabel?: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  keyboardType?: "default" | "email-address" | "phone-pad";
  multiline?: boolean;
  numberOfLines?: number;
};

export function AppInput({
  label,
  optional,
  sublabel,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
  numberOfLines = 3,
}: Props) {
  return (
    <View className="mb-5 last:mb-0">
      <View className="mb-2 flex-row items-baseline justify-between">
        <Text className="text-[15px] font-semibold text-slate-900">{label}</Text>
        {optional ? <Text className="text-[13px] font-medium text-slate-400">Optional</Text> : null}
      </View>
      {sublabel ? (
        <Text className="mb-2 text-xs leading-5 text-slate-500">{sublabel}</Text>
      ) : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        keyboardType={keyboardType ?? "default"}
        autoCapitalize={keyboardType === "email-address" ? "none" : "sentences"}
        multiline={multiline}
        numberOfLines={multiline ? numberOfLines : undefined}
        textAlignVertical={multiline ? "top" : "center"}
        className={`rounded-2xl border-0 bg-slate-100 px-4 text-[17px] text-slate-900 ${
          multiline ? `min-h-[100px] py-3` : "py-4"
        }`}
      />
    </View>
  );
}
