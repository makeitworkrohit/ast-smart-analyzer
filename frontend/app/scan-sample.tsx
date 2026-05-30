import { router } from "expo-router";
import React, { useEffect, useState } from "react";
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

export default function ScanSampleScreen() {
  const { state, update } = useScan();
  const [sampleTypes, setSampleTypes] = useState<string[]>([]);

  useEffect(() => {
    api.get("/meta/sample-types").then(({ data }) => {
      // Drop "Other" from list (dropdown adds its own via allowOther)
      setSampleTypes((data.sample_types as string[]).filter((s) => s !== "Other"));
    }).catch(() => {});
  }, []);

  const canNext = state.sampleType.trim().length > 0;

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
            step="Step 1 of 4 · Specimen"
            title="Sample type"
            subtitle="Pick the clinical specimen from which bacteria were cultured."
          />

          <View style={{ marginTop: S.s3 }}>
            <SearchableDropdown
              label="Specimen / Sample"
              placeholder="Search samples…"
              items={sampleTypes}
              value={state.sampleType}
              onChange={(v) => update({ sampleType: v })}
              allowOther
              testID="sample-type-dropdown"
            />
          </View>

          {!!state.sampleType && (
            <View style={styles.selected}>
              <Text style={F.label}>Selected</Text>
              <Text style={[F.h3, { marginTop: 4 }]}>{state.sampleType}</Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <Button
            title="Continue"
            icon="arrow-forward"
            disabled={!canNext}
            onPress={() => router.push("/scan-antibiotic")}
            testID="scan-sample-next"
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { padding: S.s6, paddingBottom: S.s10 },
  selected: {
    marginTop: S.s6,
    backgroundColor: C.surface,
    borderRadius: S.rMd,
    borderWidth: 1,
    borderColor: C.border,
    padding: S.s4,
  },
  footer: {
    padding: S.s6,
    borderTopWidth: 1,
    borderTopColor: C.borderSubtle,
    backgroundColor: C.bg,
  },
});
