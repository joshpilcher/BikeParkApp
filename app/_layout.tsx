import "../global.css";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ActiveEventProvider } from "../contexts/ActiveEventContext";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ActiveEventProvider>
        <StatusBar style="dark" />
        <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#F4FBFA" },
        }}
      />
      </ActiveEventProvider>
    </SafeAreaProvider>
  );
}
