import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../src/api/client";
import { useAuth } from "../src/context/AuthContext";
import { useScan } from "../src/context/ScanContext";
import { C, F, S, statusPalette } from "../src/theme";

type ScanSummary = {
  id: string;
  zone_mm: number;
  antibiotic: string;
  interpretation: string;
  timestamp: string;
};

export default function HomeScreen() {
  const { user } = useAuth();
  const { reset } = useScan();
  const [recent, setRecent] = useState<ScanSummary[]>([]);
  const [stats, setStats] = useState({ total: 0, s: 0, i: 0, r: 0 });

  useEffect(() => {
    if (!user) return;
    api.get<ScanSummary[]>("/scans").then(({ data }) => {
      setRecent(data.slice(0, 3));
      const s = data.filter((d) => d.interpretation === "Sensitive").length;
      const i = data.filter((d) => d.interpretation === "Intermediate").length;
      const r = data.filter((d) => d.interpretation === "Resistant").length;
      setStats({ total: data.length, s, i, r });
    }).catch(() => {});
  }, [user]);

  if (!user) return null;
  const initial = (user.name || user.email)[0].toUpperCase();

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topRow}>
          <View>
            <Text style={F.label}>Welcome back</Text>
            <Text style={[F.h2, { marginTop: 4 }]}>{user.name || user.email}</Text>
          </View>
          <TouchableOpacity
            style={styles.avatar}
            onPress={() => router.push("/settings")}
            testID="home-avatar-button"
          >
            <Text style={styles.avatarText}>{initial}</Text>
          </TouchableOpacity>
        </View>

        {/* Hero: Scan plate */}
        <TouchableOpacity
          style={styles.hero}
          activeOpacity={0.9}
          onPress={() => {
            reset();
            router.push("/scan-sample");
          }}
          testID="home-scan-plate-button"
        >
          <View>
            <Text style={[F.label, { color: "#94A3B8" }]}>Primary action</Text>
            <Text style={styles.heroTitle}>Scan Plate</Text>
            <Text style={styles.heroSub}>
              Measure zone of inhibition and interpret results
            </Text>
          </View>
          <View style={styles.heroIcon}>
            <Ionicons name="scan-outline" size={28} color={C.primaryText} />
          </View>
        </TouchableOpacity>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <StatTile label="Total" value={stats.total} color={C.text} />
          <StatTile label="Sensitive" value={stats.s} color={C.sens.dot} />
          <StatTile label="Intermediate" value={stats.i} color={C.inter.dot} />
          <StatTile label="Resistant" value={stats.r} color={C.resist.dot} />
        </View>

        {/* Quick tiles row */}
        <View style={styles.tileRow}>
          <TouchableOpacity
            style={styles.smallTile}
            onPress={() => router.push("/history")}
            testID="home-history-button"
          >
            <Ionicons name="time-outline" size={22} color={C.text} />
            <Text style={styles.tileTitle}>History</Text>
            <Text style={styles.tileSub}>Past scans & reports</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.smallTile}
            onPress={() => router.push("/settings")}
            testID="home-settings-button"
          >
            <Ionicons name="settings-outline" size={22} color={C.text} />
            <Text style={styles.tileTitle}>Settings</Text>
            <Text style={styles.tileSub}>Detection mode & account</Text>
          </TouchableOpacity>
        </View>

        {/* Recent */}
        {recent.length > 0 && (
          <>
            <Text style={[F.label, { marginTop: S.s8, marginBottom: S.s3 }]}>
              Recent scans
            </Text>
            {recent.map((r) => {
              const pal = statusPalette(r.interpretation);
              return (
                <TouchableOpacity
                  key={r.id}
                  style={styles.recentRow}
                  onPress={() =>
                    router.push({ pathname: "/history-detail", params: { id: r.id } })
                  }
                  testID={`home-recent-${r.id}`}
                >
                  <View>
                    <Text style={F.h3}>{r.antibiotic}</Text>
                    <Text style={{ color: C.textMuted, marginTop: 2 }}>
                      {r.zone_mm} mm · {new Date(r.timestamp).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={[styles.pill, { backgroundColor: pal.bg, borderColor: pal.border }]}>
                    <View style={[styles.dot, { backgroundColor: pal.dot }]} />
                    <Text style={{ color: pal.text, fontWeight: "700", fontSize: 12 }}>
                      {r.interpretation[0]}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </>
        )}

        <Text style={styles.disclaimer}>
          For educational and research purposes only.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatTile({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.stat}>
      <View style={[styles.statDot, { backgroundColor: color }]} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { padding: S.s6, paddingBottom: S.s10 },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: S.s6,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: C.primaryText, fontWeight: "800", fontSize: 16 },
  hero: {
    backgroundColor: C.primary,
    borderRadius: S.rXl,
    padding: S.s6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    minHeight: 180,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: C.primaryText,
    marginTop: S.s2,
    letterSpacing: -1,
  },
  heroSub: { color: "#CBD5E1", marginTop: S.s2, maxWidth: 220 },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#1E293B",
    alignItems: "center",
    justifyContent: "center",
  },
  statsRow: {
    flexDirection: "row",
    gap: S.s2,
    marginTop: S.s5,
  },
  stat: {
    flex: 1,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: S.rMd,
    padding: S.s3,
  },
  statDot: { width: 8, height: 8, borderRadius: 4, marginBottom: 6 },
  statValue: { fontSize: 22, fontWeight: "800", color: C.text },
  statLabel: { fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 1 },
  tileRow: { flexDirection: "row", gap: S.s3, marginTop: S.s5 },
  smallTile: {
    flex: 1,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: S.rLg,
    padding: S.s5,
    minHeight: 140,
    justifyContent: "space-between",
  },
  tileTitle: { fontSize: 18, fontWeight: "700", color: C.text, marginTop: S.s6 },
  tileSub: { fontSize: 12, color: C.textMuted, marginTop: 2 },
  recentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: S.rMd,
    padding: S.s4,
    marginBottom: S.s2,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  disclaimer: {
    marginTop: S.s8,
    fontSize: 11,
    color: C.textSubtle,
    textAlign: "center",
  },
});
