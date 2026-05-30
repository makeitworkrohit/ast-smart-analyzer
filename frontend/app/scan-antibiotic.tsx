/**
 * Step 2 of 4 — Antibiotic selection.
 *
 * Single searchable dropdown listing every antibiotic from the catalog.
 * "Other" appears at the bottom — selecting it reveals a free-text input.
 * The category is derived silently from the selection so the AI still
 * receives it; the user never sees the category field.
 */
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../src/api/client";
import Button from "../src/components/Button";
import ScreenHeader from "../src/components/ScreenHeader";
import SearchableDropdown from "../src/components/SearchableDropdown";
import { useScan } from "../src/context/ScanContext";
import { C, F, S } from "../src/theme";

export default function ScanAntibioticScreen() {
  const { state, update } = useScan();
  const [catalog, setCatalog] = useState<Record<string, string[]>>({});

  useEffect(() => {
    api
      .get("/meta/antibiotics")
      .then(({ data }) => setCatalog(data.categories))
      .catch(() => {});
  }, []);

  // Flat alphabetical list of every antibiotic, deduplicated
  const allAntibiotics = useMemo(() => {
    const seen = new Set<string>();
    const list: string[] = [];
    for (const drugs of Object.values(catalog)) {
      for (const d of drugs) {
        if (!seen.has(d)) {
          seen.add(d);
          list.push(d);
        }
      }
    }
    return list.sort((a, b) => a.localeCompare(b));
  }, [catalog]);

  // Silently resolve which category a drug belongs to (for the AI)
  const resolveCategory = (drug: string): string => {
    for (const [cat, drugs] of Object.entries(catalog)) {
      if (drugs.includes(drug)) return cat;
    }
    return "Others / Special";
  };

  const handleSelect = (drug: string) => {
    update({
      antibiotic: drug,
      antibioticCategory: resolveCategory(drug),
    });
  };

  const canNext = !!state.antibiotic;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <ScreenHeader
            step="Step 2 of 4 · Antibiotic"
            title="Antibiotic used"
            subtitle="Search by name and select the disc used in the test. Choose Other if yours isn't listed."
          />

          <View style={{ marginTop: S.s3 }}>
            <SearchableDropdown
              label="Antibiotic name"
              placeholder="Search antibiotics…"
              items={allAntibiotics}
              value={state.antibiotic}
              onChange={handleSelect}
              allowOther
              testID="antibiotic-dropdown"
            />
          </View>

          {canNext && (
            <View style={styles.summary}>
              <View style={{ flex: 1 }}>
                <Text style={F.label}>Selected</Text>
                <Text style={[F.h3, { marginTop: 4 }]}>{state.antibiotic}</Text>
                {state.antibioticCategory ? (
                  <Text style={{ color: C.textMuted, marginTop: 2, fontSize: 13 }}>
                    {state.antibioticCategory}
                  </Text>
                ) : null}
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <Button
            title="Continue to capture"
            icon="arrow-forward"
            disabled={!canNext}
            onPress={() => router.push("/scan-capture")}
            testID="scan-antibiotic-next"
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { padding: S.s6, paddingBottom: S.s10 },
  summary: {
    marginTop: S.s6,
    backgroundColor: C.surface,
    borderRadius: S.rMd,
    borderWidth: 1,
    borderColor: C.border,
    padding: S.s4,
    flexDirection: "row",
  },
  footer: {
    padding: S.s6,
    borderTopWidth: 1,
    borderTopColor: C.borderSubtle,
    backgroundColor: C.bg,
  },
});
