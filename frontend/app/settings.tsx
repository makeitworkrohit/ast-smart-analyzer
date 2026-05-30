import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../src/api/client";
import ScreenHeader from "../src/components/ScreenHeader";
import { useAuth } from "../src/context/AuthContext";
import { C, F, S } from "../src/theme";

type Mode = "manual" | "auto" | "hybrid";

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const [mode, setMode] = useState<Mode>("hybrid");
  const [autoSync, setAutoSync] = useState(true);

  const clearHistory = () =>
    Alert.alert("Clear history?", "All saved scans will be deleted.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear all",
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete("/scans");
            Alert.alert("History cleared");
          } catch (e: any) {
            Alert.alert("Failed", e?.message || "Unable to clear history");
          }
        },
      },
    ]);

  const signOut = () =>
    Alert.alert("Sign out?", "You'll need to log in again.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/login");
        },
      },
    ]);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <ScreenHeader title="Settings" step="App preferences" />

        {/* Account */}
        <Text style={styles.section}>Account</Text>
        <View style={styles.group}>
          <Row
            icon="person-circle-outline"
            title={user?.name || user?.email || ""}
            subtitle={user?.email}
          />
          <Row
            icon="log-out-outline"
            title="Sign out"
            onPress={signOut}
            testID="settings-logout"
            destructive
          />
        </View>

        {/* App */}
        <Text style={styles.section}>Detection</Text>
        <View style={styles.group}>
          <Text style={styles.pickerLabel}>Default mode</Text>
          <View style={styles.segment}>
            {(["auto", "hybrid", "manual"] as Mode[]).map((m) => (
              <TouchableOpacity
                key={m}
                onPress={() => setMode(m)}
                style={[
                  styles.segBtn,
                  mode === m && { backgroundColor: C.primary },
                ]}
                testID={`settings-mode-${m}`}
              >
                <Text
                  style={{
                    color: mode === m ? C.primaryText : C.text,
                    fontWeight: "700",
                    fontSize: 13,
                    textTransform: "capitalize",
                  }}
                >
                  {m}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Data */}
        <Text style={styles.section}>Data</Text>
        <View style={styles.group}>
          <Row
            icon="cloud-upload-outline"
            title="Auto-sync"
            right={
              <Switch
                value={autoSync}
                onValueChange={setAutoSync}
                trackColor={{ true: C.primary, false: C.border }}
                thumbColor={C.surface}
                testID="settings-autosync-toggle"
              />
            }
          />
          <Row
            icon="trash-outline"
            title="Clear history"
            subtitle="Delete all saved scans"
            onPress={clearHistory}
            destructive
            testID="settings-clear-history"
          />
        </View>

        {/* Support */}
        <Text style={styles.section}>Support</Text>
        <View style={styles.group}>
          <Row icon="help-circle-outline" title="Help & FAQ" />
          <Row icon="mail-outline" title="Contact" subtitle="support@ast-analyzer.app" />
        </View>

        {/* About */}
        <Text style={styles.section}>About</Text>
        <View style={styles.group}>
          <Row icon="information-circle-outline" title="About AST Smart Analyzer" />
          <Row icon="shield-outline" title="Privacy Policy" />
          <Row icon="warning-outline" title="Disclaimer" />
        </View>

        <Text style={styles.disclaimer}>
          v1.0 · For educational and research purposes only. Not a replacement
          for certified laboratory testing.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({
  icon,
  title,
  subtitle,
  right,
  onPress,
  destructive,
  testID,
}: {
  icon: any;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  destructive?: boolean;
  testID?: string;
}) {
  const inner = (
    <>
      <View
        style={[
          styles.iconBox,
          destructive && { backgroundColor: C.resist.bg, borderColor: C.resist.border },
        ]}
      >
        <Ionicons
          name={icon}
          size={18}
          color={destructive ? C.resist.text : C.text}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[F.h3, destructive && { color: C.resist.text }]}>{title}</Text>
        {subtitle && <Text style={{ color: C.textMuted, fontSize: 13 }}>{subtitle}</Text>}
      </View>
      {right}
      {onPress && !right && (
        <Ionicons name="chevron-forward" size={18} color={C.textMuted} />
      )}
    </>
  );
  return onPress ? (
    <TouchableOpacity style={styles.row} onPress={onPress} testID={testID}>
      {inner}
    </TouchableOpacity>
  ) : (
    <View style={styles.row}>{inner}</View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { padding: S.s6, paddingBottom: S.s10 },
  section: {
    fontSize: 11,
    fontWeight: "800",
    color: C.textMuted,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginTop: S.s6,
    marginBottom: S.s2,
    paddingHorizontal: 4,
  },
  group: {
    backgroundColor: C.surface,
    borderRadius: S.rLg,
    borderWidth: 1,
    borderColor: C.border,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: S.s3,
    padding: S.s4,
    borderBottomWidth: 1,
    borderBottomColor: C.borderSubtle,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.secondary,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
  },
  pickerLabel: {
    fontSize: 13,
    color: C.textMuted,
    paddingHorizontal: S.s4,
    paddingTop: S.s4,
  },
  segment: {
    flexDirection: "row",
    gap: 4,
    padding: S.s3,
    backgroundColor: C.secondary,
    borderRadius: S.rFull,
    margin: S.s4,
  },
  segBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  disclaimer: {
    marginTop: S.s8,
    textAlign: "center",
    color: C.textSubtle,
    fontSize: 11,
    lineHeight: 17,
  },
});
