/**
 * Step 3 — Image capture.
 * User picks from gallery or uses camera. After selecting, they proceed
 * to scan-measure where the manual overlay tool lives.
 */
import { Ionicons } from "@expo/vector-icons";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "../src/components/Button";
import ScreenHeader from "../src/components/ScreenHeader";
import { useScan } from "../src/context/ScanContext";
import { C, F, S } from "../src/theme";

async function imageToBase64(uri: string): Promise<string> {
  const manip = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1280 } }],
    { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG, base64: true }
  );
  return `data:image/jpeg;base64,${manip.base64}`;
}

export default function ScanCaptureScreen() {
  const { state, update } = useScan();
  const [busy, setBusy] = useState(false);

  const pickFromGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Gallery access is required.");
      return;
    }
    try {
      setBusy(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.9,
        allowsEditing: false,
      });
      if (!result.canceled && result.assets?.[0]) {
        const b64 = await imageToBase64(result.assets[0].uri);
        update({ imageBase64: b64 });
      }
    } catch (e: any) {
      Alert.alert("Picker failed", String(e?.message ?? e));
    } finally {
      setBusy(false);
    }
  };

  const captureFromCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Camera access is required.");
      return;
    }
    try {
      setBusy(true);
      const result = await ImagePicker.launchCameraAsync({
        quality: 0.9,
        allowsEditing: false,
      });
      if (!result.canceled && result.assets?.[0]) {
        const b64 = await imageToBase64(result.assets[0].uri);
        update({ imageBase64: b64 });
      }
    } catch (e: any) {
      Alert.alert("Camera failed", String(e?.message ?? e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <ScreenHeader
          step="Step 3 of 4 · Capture"
          title="Plate image"
          subtitle="Take a photo directly above the plate or upload from gallery. Keep it flat and well-lit."
        />

        <View style={styles.preview}>
          {state.imageBase64 ? (
            <Image source={{ uri: state.imageBase64 }} style={styles.img} />
          ) : (
            <View style={styles.placeholder}>
              <View style={styles.targetRing}>
                <View style={styles.targetInner} />
              </View>
              <Text style={[F.label, { marginTop: S.s4, color: "#334155" }]}>
                No image selected
              </Text>
            </View>
          )}
        </View>

        <View style={{ gap: S.s3, marginTop: S.s6 }}>
          <Button
            title={state.imageBase64 ? "Retake with camera" : "Use camera"}
            icon="camera-outline"
            onPress={captureFromCamera}
            loading={busy}
            testID="scan-capture-camera"
          />
          <Button
            title="Pick from gallery"
            icon="image-outline"
            variant="secondary"
            onPress={pickFromGallery}
            loading={busy}
            testID="scan-capture-gallery"
          />
        </View>

        <View style={styles.tips}>
          <Ionicons name="information-circle-outline" size={16} color={C.ai.text} />
          <Text style={styles.tipText}>
            Hold the phone directly above the petri dish. The entire zone of
            inhibition must be visible. You will manually align a 6 mm disc
            overlay on the next screen.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Next: Measure zone"
          icon="arrow-forward"
          disabled={!state.imageBase64}
          onPress={() => router.push("/scan-measure")}
          testID="scan-capture-next"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { padding: S.s6, paddingBottom: S.s8 },
  preview: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: C.secondary,
    borderRadius: S.rXl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: C.border,
  },
  img: { width: "100%", height: "100%", resizeMode: "cover" },
  placeholder: { flex: 1, alignItems: "center", justifyContent: "center" },
  targetRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: C.textMuted,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  targetInner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: C.textMuted,
    opacity: 0.4,
  },
  tips: {
    flexDirection: "row",
    gap: 8,
    padding: S.s4,
    backgroundColor: C.ai.bg,
    borderRadius: S.rMd,
    borderWidth: 1,
    borderColor: C.ai.border,
    marginTop: S.s6,
  },
  tipText: { flex: 1, color: C.ai.text, fontSize: 13, lineHeight: 19 },
  footer: {
    padding: S.s6,
    borderTopWidth: 1,
    borderTopColor: C.borderSubtle,
    backgroundColor: C.bg,
  },
});
