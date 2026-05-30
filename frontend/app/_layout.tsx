import { Stack } from "expo-router";
import React from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "../src/context/AuthContext";
import { ScanProvider } from "../src/context/ScanContext";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ScanProvider>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: "#F8FAFC" },
              animation: "slide_from_right",
            }}
          />
        </ScanProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
