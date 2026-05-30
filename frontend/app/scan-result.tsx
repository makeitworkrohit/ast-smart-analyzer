/**
 * Result screen — calls /api/interpret, shows S/I/R, MIC range, organisms,
 * AI explanation, and saves scan to history.
 */
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../src/api/client";
import Button from "../src/components/Button";
import ScreenHeader from "../src/components/ScreenHeader";
import { useScan } from "../src/context/ScanContext";
import { C, F, S, statusPalette } from "../src/theme";

type InterpretResp = {
  interpretation: string;
  estimated_mic_range: string;
  possible_organisms: { name: string; confidence: number }[];
  explanation: string;
  confidence_score: number;
  source: string;
};

export default function ScanResultScreen() {
  const { state, reset } = useScan();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<InterpretResp | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.post<InterpretResp>("/interpret", {
          zone_mm: state.zoneMm,
          antibiotic: state.antibiotic,
          antibiotic_category: state.antibioticCategory,
          sample_type: state.sampleType,
        });
        setResult(data);
        // save scan
        setSaving(true);
        await api.post("/scans", {
          zone_mm: state.zoneMm,
          sample_type: state.sampleType,
          antibiotic: state.antibiotic,
          antibiotic_category: state.antibioticCategory,
          interpretation: data.interpretation,
          estimated_mic_range: data.estimated_mic_range,
          possible_organisms: data.possible_organisms,
          explanation: data.explanation,
          confidence_score: data.confidence_score,
          image_base64: state.imageBase64,
          annotated_base64: null,
          detection_mode: "manual",
        });
      } catch (e: any) {
        Alert.alert(
          "Interpretation failed",
          e?.response?.data?.detail || e?.message || "Unable to interpret"
        );
      } finally {
        setLoading(false);
        setSaving(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pal = result ? statusPalette(result.interpretation) : C.inter;

  const done = () => {
    reset();
    router.replace("/home");
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <ScreenHeader
          step="Result"
          title="Interpretation"
          subtitle={`${state.antibiotic} · ${state.sampleType}`}
          showBack={false}
        />

        {loading || !result ? (
          <View style={styles.loading}>
            <ActivityIndicator color={C.primary} size="large" />
            <Text style={[F.label, { marginTop: S.s3 }]}>
              Running CLSI-style interpretation…
            </Text>
          </View>
        ) : (
          <>
            <View style={[styles.heroCard, { borderColor: pal.border }]}>
              <Text style={F.label}>Zone of inhibition</Text>
              <View style={styles.zoneRow}>
                <Text style={F.data}>{state.zoneMm.toFixed(1)}</Text>
                <Text style={{ color: C.textMuted, marginLeft: 6 }}>mm</Text>
              </View>

              {/* Manual measurement badge */}
              <View style={styles.badgeRow}>
                <View style={[styles.badge, { backgroundColor: C.secondary, borderColor: C.border }]}>
                  <Ionicons name="hand-left-outline" size={13} color={C.textMuted} />
                  <Text style={styles.badgeText}>Manual measurement</Text>
                </View>
              </View>

              <View
                style={[
                  styles.verdictPill,
                  { backgroundColor: pal.bg, borderColor: pal.border },
                ]}
              >
                <View style={[styles.dot, { backgroundColor: pal.dot }]} />
                <Text
                  style={{ color: pal.text, fontWeight: "800", fontSize: 14, letterSpacing: 0.3 }}
                  testID="result-interpretation"
                >
                  {result.interpretation.toUpperCase()}
                </Text>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={F.label}>Estimated MIC range</Text>
              <Text style={[F.h2, { marginTop: 6 }]} testID="result-mic">
                {result.estimated_mic_range || "—"}
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={F.label}>Possible organisms</Text>
              {result.possible_organisms.length === 0 ? (
                <Text style={{ color: C.textMuted, marginTop: 8 }}>
                  No organism suggestions returned.
                </Text>
              ) : (
                result.possible_organisms.map((o, idx) => (
                  <View key={idx} style={styles.orgRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={F.h3}>{o.name}</Text>
                      <View style={styles.barBg}>
                        <View
                          style={[
                            styles.barFill,
                            { width: `${Math.round(o.confidence * 100)}%` },
                          ]}
                        />
                      </View>
                    </View>
                    <Text style={styles.confText}>
                      {Math.round(o.confidence * 100)}%
                    </Text>
                  </View>
                ))
              )}
            </View>

            <View style={[styles.card, styles.aiCard]}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Ionicons name="sparkles" size={16} color={C.ai.text} />
                <Text style={[F.label, { color: C.ai.text }]}>AI explanation</Text>
              </View>
              <Text style={[F.body, { color: C.ai.text, marginTop: 6 }]}>
                {result.explanation}
              </Text>
              <Text style={styles.source}>
                {result.source === "ai"
                  ? `Confidence ${Math.round(result.confidence_score * 100)}%`
                  : "Fallback heuristic (AI unavailable)"}
              </Text>
            </View>

            <Text style={styles.disclaimer}>
              For educational and research purposes only. Not a replacement for
              certified laboratory testing.
            </Text>
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={saving ? "Saving…" : "Done"}
          icon="checkmark"
          loading={saving}
          disabled={loading}
          onPress={done}
          testID="result-done"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { padding: S.s6, paddingBottom: S.s8 },
  loading: { alignItems: "center", paddingVertical: 80 },
  heroCard: {
    marginTop: S.s5,
    backgroundColor: C.surface,
    borderRadius: S.rLg,
    borderWidth: 1,
    padding: S.s5,
  },
  zoneRow: { flexDirection: "row", alignItems: "baseline", marginTop: S.s2 },
  badgeRow: { flexDirection: "row", marginTop: S.s3 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeText: { fontSize: 12, fontWeight: "700", color: C.textMuted },
  verdictPill: {
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
  orgRow: { flexDirection: "row", alignItems: "center", marginTop: S.s3, gap: S.s3 },
  barBg: {
    marginTop: 6,
    height: 6,
    backgroundColor: C.borderSubtle,
    borderRadius: 3,
    overflow: "hidden",
  },
  barFill: { height: "100%", backgroundColor: C.primary },
  confText: { color: C.textMuted, fontWeight: "700", fontSize: 13, minWidth: 40, textAlign: "right" },
  aiCard: {
    backgroundColor: C.ai.bg,
    borderColor: C.ai.border,
    borderLeftWidth: 4,
    borderLeftColor: C.ai.accent,
  },
  source: { marginTop: S.s3, color: C.ai.text, opacity: 0.7, fontSize: 12 },
  disclaimer: {
    marginTop: S.s6,
    fontSize: 11,
    color: C.textSubtle,
    textAlign: "center",
    lineHeight: 17,
  },
  footer: {
    padding: S.s6,
    borderTopWidth: 1,
    borderTopColor: C.borderSubtle,
    backgroundColor: C.bg,
  },
});
