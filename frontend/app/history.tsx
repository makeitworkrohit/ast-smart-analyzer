import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../src/api/client";
import ScreenHeader from "../src/components/ScreenHeader";
import { C, F, S, statusPalette } from "../src/theme";

type Row = {
  id: string;
  zone_mm: number;
  sample_type: string;
  antibiotic: string;
  antibiotic_category: string;
  interpretation: string;
  timestamp: string;
};

export default function HistoryScreen() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      api
        .get<Row[]>("/scans")
        .then(({ data }) => setRows(data))
        .catch(() => setRows([]))
        .finally(() => setLoading(false));
    }, [])
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={{ paddingHorizontal: S.s6 }}>
        <ScreenHeader
          title="History"
          subtitle={`${rows.length} scan${rows.length === 1 ? "" : "s"}`}
          step="All reports"
        />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={C.primary} />
        </View>
      ) : rows.length === 0 ? (
        <View style={styles.center}>
          <Text style={[F.h3, { textAlign: "center" }]}>No scans yet</Text>
          <Text style={{ color: C.textMuted, marginTop: 8, textAlign: "center" }}>
            Your past AST reports will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(r) => r.id}
          contentContainerStyle={{ padding: S.s6, paddingTop: 0 }}
          renderItem={({ item }) => {
            const pal = statusPalette(item.interpretation);
            return (
              <TouchableOpacity
                style={styles.row}
                onPress={() =>
                  router.push({
                    pathname: "/history-detail",
                    params: { id: item.id },
                  })
                }
                testID={`history-item-${item.id}`}
              >
                <View style={{ flex: 1 }}>
                  <Text style={F.h3}>{item.antibiotic}</Text>
                  <Text style={{ color: C.textMuted, marginTop: 2, fontSize: 13 }}>
                    {item.sample_type} · {new Date(item.timestamp).toLocaleString()}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={F.h2}>{item.zone_mm.toFixed(1)} mm</Text>
                  <View style={[styles.pill, { backgroundColor: pal.bg, borderColor: pal.border }]}>
                    <View style={[styles.dot, { backgroundColor: pal.dot }]} />
                    <Text style={{ color: pal.text, fontWeight: "700", fontSize: 11 }}>
                      {item.interpretation}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: S.s8 },
  row: {
    flexDirection: "row",
    gap: S.s3,
    backgroundColor: C.surface,
    borderRadius: S.rMd,
    borderWidth: 1,
    borderColor: C.border,
    padding: S.s4,
    marginBottom: S.s2,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    marginTop: 6,
  },
  dot: { width: 7, height: 7, borderRadius: 3.5 },
});
