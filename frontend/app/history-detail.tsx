import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../src/api/client";
import ScreenHeader from "../src/components/ScreenHeader";
import { C, F, S, statusPalette } from "../src/theme";

type Scan = {
  id: string;
  zone_mm: number;
  sample_type: string;
  antibiotic: string;
  antibiotic_category: string;
  interpretation: string;
  estimated_mic_range: string;
  possible_organisms: { name: string; confidence: number }[];
  explanation: string;
  confidence_score: number;
  annotated_base64?: string | null;
  image_base64?: string | null;
  timestamp: string;
};

export default function HistoryDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [scan, setScan] = useState<Scan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api
      .get<Scan>(`/scans/${id}`)
      .then(({ data }) => setScan(data))
      .catch(() => setScan(null))
      .finally(() => setLoading(false));
  }, [id]);

  const remove = () => {
    Alert.alert("Delete scan?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await api.delete(`/scans/${id}`);
          router.back();
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator color={C.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!scan) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={F.h3}>Scan not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const pal = statusPalette(scan.interpretation);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <ScreenHeader
          step={new Date(scan.timestamp).toLocaleString()}
          title={scan.antibiotic}
          subtitle={`${scan.sample_type} · ${scan.antibiotic_category}`}
        />

        {scan.annotated_base64 ? (
          <Image source={{ uri: scan.annotated_base64 }} style={styles.img} />
        ) : scan.image_base64 ? (
          <Image source={{ uri: scan.image_base64 }} style={styles.img} />
        ) : null}

        <View style={[styles.heroCard, { borderColor: pal.border }]}>
          <Text style={F.label}>Zone</Text>
          <Text style={F.data}>{scan.zone_mm.toFixed(1)} mm</Text>
          <View style={[styles.pill, { backgroundColor: pal.bg, borderColor: pal.border }]}>
            <View style={[styles.dot, { backgroundColor: pal.dot }]} />
            <Text style={{ color: pal.text, fontWeight: "800", fontSize: 13 }}>
              {scan.interpretation.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={F.label}>Estimated MIC</Text>
          <Text style={[F.h2, { marginTop: 6 }]}>
            {scan.estimated_mic_range || "—"}
          </Text>
        </View>

        {scan.possible_organisms?.length > 0 && (
          <View style={styles.card}>
            <Text style={F.label}>Possible organisms</Text>
            {scan.possible_organisms.map((o, i) => (
              <View key={i} style={styles.orgRow}>
                <Text style={[F.h3, { flex: 1 }]}>{o.name}</Text>
                <Text style={styles.conf}>{Math.round(o.confidence * 100)}%</Text>
              </View>
            ))}
          </View>
        )}

        {!!scan.explanation && (
          <View style={[styles.card, styles.aiCard]}>
            <Text style={[F.label, { color: C.ai.text }]}>AI explanation</Text>
            <Text style={[F.body, { color: C.ai.text, marginTop: 6 }]}>
              {scan.explanation}
            </Text>
          </View>
        )}

        <TouchableOpacity
          onPress={remove}
          style={styles.deleteBtn}
          testID="history-detail-delete"
        >
          <Ionicons name="trash-outline" size={16} color={C.resist.text} />
          <Text style={{ color: C.resist.text, fontWeight: "700", marginLeft: 6 }}>
            Delete scan
          </Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          For educational and research purposes only.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  scroll: { padding: S.s6, paddingBottom: S.s10 },
  img: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: S.rXl,
    resizeMode: "cover",
    borderWidth: 1,
    borderColor: C.border,
  },
  heroCard: {
    marginTop: S.s5,
    backgroundColor: C.surface,
    borderRadius: S.rLg,
    borderWidth: 1,
    padding: S.s5,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    marginTop: S.s3,
    alignSelf: "flex-start",
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  card: {
    marginTop: S.s3,
    backgroundColor: C.surface,
    borderRadius: S.rLg,
    borderWidth: 1,
    borderColor: C.border,
    padding: S.s5,
  },
  orgRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: S.s3,
    gap: S.s3,
  },
  conf: { color: C.textMuted, fontWeight: "700" },
  aiCard: {
    backgroundColor: C.ai.bg,
    borderColor: C.ai.border,
    borderLeftWidth: 4,
    borderLeftColor: C.ai.accent,
  },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: S.s6,
    paddingVertical: S.s4,
    borderRadius: S.rMd,
    borderWidth: 1,
    borderColor: C.resist.border,
    backgroundColor: C.resist.bg,
  },
  disclaimer: {
    marginTop: S.s6,
    textAlign: "center",
    color: C.textSubtle,
    fontSize: 11,
  },
});
