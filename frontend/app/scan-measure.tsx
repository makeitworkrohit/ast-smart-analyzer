/**
 * Step 4 — Manual measurement.
 *
 * Phase 1 — ALIGN: the plate photo fills the screen behind a fixed
 *   solid 6 mm reference disc at the centre.  The user pans and
 *   pinch-zooms the PHOTO until the reference disc sits exactly over
 *   the antibiotic disc on the plate.  A "Lock photo" button freezes
 *   the photo in place.
 *
 * Phase 2 — MEASURE: a resizable ring (same centre as the reference
 *   disc) appears.  The user pinches to grow/shrink it until its edge
 *   lines up with the zone boundary.  A live readout shows the current
 *   diameter in mm (derived from ring-pixel-radius / disc-pixel-radius
 *   × 6 mm).  A stepper allows fine ±0.5 mm / ±0.1 mm corrections.
 *   A manual-entry fallback lets the user type the value directly.
 *
 * No backend call is made on this screen.
 */
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "../src/components/Button";
import ScreenHeader from "../src/components/ScreenHeader";
import { useScan } from "../src/context/ScanContext";
import { C, F, S } from "../src/theme";

// ─── constants ──────────────────────────────────────────────────────────────

/** Visual diameter of the fixed reference disc on screen (px). */
const DISC_SCREEN_PX = 56;
/** Real physical diameter of the antibiotic disc (mm). */
const DISC_MM = 6.0;
/** px-per-mm scale factor derived from the fixed reference disc. */
const PX_PER_MM = DISC_SCREEN_PX / DISC_MM;

const SCREEN_W = Dimensions.get("window").width;
const CANVAS = SCREEN_W - S.s6 * 2; // square canvas width

const ZONE_MIN_PX = DISC_SCREEN_PX / 2 + 4; // slightly larger than disc radius
const ZONE_MAX_PX = CANVAS / 2 - 4;

// ─── helpers ────────────────────────────────────────────────────────────────

function pxToMm(radiusPx: number): number {
  // diameter = 2 * radius; convert to mm using scale
  return Math.round(((radiusPx * 2) / PX_PER_MM) * 10) / 10;
}

function mmToRadius(mm: number): number {
  return (mm * PX_PER_MM) / 2;
}

// ─── component ───────────────────────────────────────────────────────────────

type Phase = "align" | "measure";

export default function ScanMeasureScreen() {
  const { state, update } = useScan();
  const [phase, setPhase] = useState<Phase>("align");
  const [manualModalVisible, setManualModalVisible] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const [showAlignInstructions, setShowAlignInstructions] = useState(true);
  const [activeStep, setActiveStep] = useState(0); // 0 = Pinch out, 1 = Pinch in, 2 = Drag/Pan
  const stepProgress = useSharedValue(0);
  const animStep = useSharedValue(0);

  useEffect(() => {
    if (!showAlignInstructions) return;
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 3);
    }, 2500); // 2.5 seconds per step
    return () => clearInterval(interval);
  }, [showAlignInstructions]);

  useEffect(() => {
    animStep.value = activeStep;
    stepProgress.value = 0;
    stepProgress.value = withTiming(1, { duration: 2300 });
  }, [activeStep]);

  // Animated styles for gesture mockup
  const finger1Style = useAnimatedStyle(() => {
    let x = 90;
    let y = 90;
    let opacity = 0;
    
    const p = stepProgress.value;
    const fade = p < 0.15 ? p / 0.15 : p > 0.85 ? (1 - p) / 0.15 : 1;

    if (animStep.value === 0) {
      // Pinch Out: move away from center diagonally towards top-left
      const d = 20 + p * 50;
      x = 90 - d;
      y = 90 - d;
      opacity = fade;
    } else if (animStep.value === 1) {
      // Pinch In: move towards center diagonally from top-left
      const d = 70 - p * 50;
      x = 90 - d;
      y = 90 - d;
      opacity = fade;
    } else if (animStep.value === 2) {
      // Pan/Drag: drag from (50, 60) to (90, 90)
      x = 50 + p * 40;
      y = 60 + p * 30;
      opacity = fade;
    }

    return {
      transform: [{ translateX: x - 16 }, { translateY: y - 16 }],
      opacity,
    };
  });

  const finger2Style = useAnimatedStyle(() => {
    let x = 90;
    let y = 90;
    let opacity = 0;
    
    const p = stepProgress.value;
    const fade = p < 0.15 ? p / 0.15 : p > 0.85 ? (1 - p) / 0.15 : 1;

    if (animStep.value === 0) {
      // Pinch Out: move away from center diagonally towards bottom-right
      const d = 20 + p * 50;
      x = 90 + d;
      y = 90 + d;
      opacity = fade;
    } else if (animStep.value === 1) {
      // Pinch In: move towards center diagonally from bottom-right
      const d = 70 - p * 50;
      x = 90 + d;
      y = 90 + d;
      opacity = fade;
    } else if (animStep.value === 2) {
      // Pan/Drag: finger 2 is hidden
      opacity = 0;
    }

    return {
      transform: [{ translateX: x - 16 }, { translateY: y - 16 }],
      opacity,
    };
  });

  const mockImageStyle = useAnimatedStyle(() => {
    let scale = 1.0;
    let tx = 0;
    let ty = 0;
    const p = stepProgress.value;

    if (animStep.value === 0) {
      // Zoom in (mocking pinch out): scale goes from 1.0 to 1.4
      scale = 1.0 + p * 0.4;
    } else if (animStep.value === 1) {
      // Zoom out (mocking pinch in): scale goes from 1.4 to 1.0
      scale = 1.4 - p * 0.4;
    } else if (animStep.value === 2) {
      // Move/Pan (mocking drag): translate goes from (-20, -15) to (0, 0)
      scale = 1.25;
      tx = -20 + p * 20;
      ty = -15 + p * 15;
    }

    return {
      transform: [{ scale }, { translateX: tx }, { translateY: ty }],
    };
  });

  // ── Photo transform (align phase) ────────────────────────────────────────
  const photoTranslateX = useSharedValue(0);
  const photoTranslateY = useSharedValue(0);
  const photoScale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const savedTX = useSharedValue(0);
  const savedTY = useSharedValue(0);

  // ── Zone ring radius (measure phase) ─────────────────────────────────────
  const zoneRadiusPx = useSharedValue(DISC_SCREEN_PX); // start at disc edge
  const savedZoneRadius = useSharedValue(DISC_SCREEN_PX);
  const [displayMm, setDisplayMm] = useState(pxToMm(DISC_SCREEN_PX));

  // ─── Gestures: pan + pinch for photo (align phase) ───────────────────────
  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      photoTranslateX.value = savedTX.value + e.translationX;
      photoTranslateY.value = savedTY.value + e.translationY;
    })
    .onEnd(() => {
      savedTX.value = photoTranslateX.value;
      savedTY.value = photoTranslateY.value;
    });

  const pinchPhotoGesture = Gesture.Pinch()
    .onUpdate((e) => {
      photoScale.value = Math.max(0.5, Math.min(6, savedScale.value * e.scale));
    })
    .onEnd(() => {
      savedScale.value = photoScale.value;
    });

  const photoGesture = Gesture.Simultaneous(panGesture, pinchPhotoGesture);

  // ─── Gestures: pinch for zone ring (measure phase) ───────────────────────
  const pinchZoneGesture = Gesture.Pinch()
    .onUpdate((e) => {
      const next = Math.max(
        ZONE_MIN_PX,
        Math.min(ZONE_MAX_PX, savedZoneRadius.value * e.scale)
      );
      zoneRadiusPx.value = next;
      // update display label on JS thread via runOnJS
      setDisplayMm(pxToMm(next));
    })
    .onEnd(() => {
      savedZoneRadius.value = zoneRadiusPx.value;
      setDisplayMm(pxToMm(zoneRadiusPx.value));
    });

  // ─── Animated styles ─────────────────────────────────────────────────────
  const photoStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: photoTranslateX.value },
      { translateY: photoTranslateY.value },
      { scale: photoScale.value },
    ],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    width: zoneRadiusPx.value * 2,
    height: zoneRadiusPx.value * 2,
    borderRadius: zoneRadiusPx.value,
  }));

  // ─── Actions ─────────────────────────────────────────────────────────────
  const lockPhoto = () => setPhase("measure");

  const nudge = (deltaMm: number) => {
    const currentMm = pxToMm(zoneRadiusPx.value);
    const nextMm = Math.max(DISC_MM + 0.1, Math.round((currentMm + deltaMm) * 10) / 10);
    const nextPx = mmToRadius(nextMm);
    const clamped = Math.max(ZONE_MIN_PX, Math.min(ZONE_MAX_PX, nextPx));
    zoneRadiusPx.value = withSpring(clamped, { damping: 20, stiffness: 200 });
    savedZoneRadius.value = clamped;
    setDisplayMm(pxToMm(clamped));
  };

  const confirmManual = () => {
    const val = parseFloat(manualInput);
    if (isNaN(val) || val < DISC_MM) {
      Alert.alert("Invalid value", `Please enter a number ≥ ${DISC_MM} mm`);
      return;
    }
    const nextPx = mmToRadius(val);
    const clamped = Math.max(ZONE_MIN_PX, Math.min(ZONE_MAX_PX, nextPx));
    zoneRadiusPx.value = withSpring(clamped, { damping: 20, stiffness: 200 });
    savedZoneRadius.value = clamped;
    setDisplayMm(val);
    setManualModalVisible(false);
  };

  const proceed = () => {
    const mm = pxToMm(zoneRadiusPx.value);
    if (mm < DISC_MM) {
      Alert.alert("Too small", "Zone diameter must be at least 6 mm.");
      return;
    }
    update({ zoneMm: mm, detectionMode: "manual" });
    router.push("/scan-result");
  };

  if (!state.imageBase64) {
    router.replace("/scan-capture");
    return null;
  }

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <ScrollView contentContainerStyle={styles.scroll} scrollEnabled={phase === "measure"}>
          <ScreenHeader
            step="Step 4 of 4 · Measure"
            title={phase === "align" ? "Align disc" : "Measure zone"}
            subtitle={
              phase === "align"
                ? "Pan & pinch the photo so the green dot sits exactly over the antibiotic disc, then tap Lock."
                : "Pinch to resize the red ring to the edge of the clear zone. Use steppers for fine control."
            }
          />

          {/* ── Canvas ─────────────────────────────────────────────────── */}
          <GestureDetector gesture={phase === "align" ? photoGesture : pinchZoneGesture}>
            <View style={styles.canvas}>

              {/* Photo layer — movable only during align phase */}
              {phase === "align" ? (
                <Animated.View style={[styles.photoWrap, photoStyle]}>
                  <Image
                    source={{ uri: state.imageBase64 }}
                    style={styles.photo}
                    resizeMode="contain"
                  />
                </Animated.View>
              ) : (
                // Frozen photo during measure phase
                <View style={styles.photoWrap}>
                  <Animated.View style={photoStyle}>
                    <Image
                      source={{ uri: state.imageBase64 }}
                      style={styles.photo}
                      resizeMode="contain"
                    />
                  </Animated.View>
                </View>
              )}

              {/* Fixed 6 mm reference disc — always centred */}
              <View style={styles.discOverlay} pointerEvents="none">
                <View style={styles.discDot} />
              </View>

              {/* Zone ring — only visible in measure phase */}
              {phase === "measure" && (
                <View style={styles.ringOverlay} pointerEvents="none">
                  <Animated.View style={[styles.ring, ringStyle]} />
                </View>
              )}
            </View>
          </GestureDetector>

          {/* ── Phase 1: Lock button ───────────────────────────────────── */}
          {phase === "align" && (
            <View style={{ marginTop: S.s5 }}>
              <Button
                title="Lock photo — disc is aligned"
                icon="lock-closed"
                onPress={lockPhoto}
                testID="lock-photo"
              />
              <Text style={styles.hint}>
                The green dot represents the 6 mm antibiotic disc. Align it precisely before locking.
              </Text>
            </View>
          )}

          {/* ── Phase 2: Readout + steppers ───────────────────────────── */}
          {phase === "measure" && (
            <>
              {/* Live diameter display */}
              <View style={styles.readoutCard}>
                <Text style={F.label}>Zone diameter</Text>
                <View style={styles.readoutRow}>
                  <Text style={F.data} testID="zone-value">{displayMm.toFixed(1)}</Text>
                  <Text style={styles.unit}>mm</Text>
                </View>
                <Text style={styles.readoutSub}>
                  Pinch the ring on the image above to resize
                </Text>
              </View>

              {/* Stepper row — coarse */}
              <View style={styles.stepSection}>
                <Text style={[F.label, { marginBottom: S.s2 }]}>Fine adjust</Text>
                <View style={styles.stepRow}>
                  {([-1, -0.5, -0.1] as const).map((d) => (
                    <TouchableOpacity
                      key={d}
                      style={styles.stepBtn}
                      onPress={() => nudge(d)}
                      testID={`nudge-${d}`}
                    >
                      <Text style={styles.stepText}>{d > 0 ? `+${d}` : `${d}`}</Text>
                    </TouchableOpacity>
                  ))}
                  <View style={styles.stepDivider} />
                  {([0.1, 0.5, 1] as const).map((d) => (
                    <TouchableOpacity
                      key={d}
                      style={styles.stepBtn}
                      onPress={() => nudge(d)}
                      testID={`nudge+${d}`}
                    >
                      <Text style={styles.stepText}>{`+${d}`}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Manual entry fallback */}
              <TouchableOpacity
                style={styles.manualLink}
                onPress={() => {
                  setManualInput(displayMm.toFixed(1));
                  setManualModalVisible(true);
                }}
                testID="manual-entry-btn"
              >
                <Ionicons name="create-outline" size={15} color={C.ai.text} />
                <Text style={styles.manualLinkText}>Enter value manually</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>

        {/* ── Footer ───────────────────────────────────────────────────── */}
        <View style={styles.footer}>
          {phase === "align" ? (
            <Button
              title="Lock photo — disc is aligned"
              icon="lock-closed"
              onPress={lockPhoto}
              testID="lock-photo-footer"
            />
          ) : (
            <Button
              title="Interpret results"
              icon="sparkles"
              disabled={displayMm < DISC_MM}
              onPress={proceed}
              testID="scan-measure-next"
            />
          )}
        </View>

        {/* ── Manual entry modal ───────────────────────────────────────── */}
        <Modal
          visible={manualModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setManualModalVisible(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalBackdrop}
          >
            <View style={styles.modalCard}>
              <Text style={[F.h3, { marginBottom: S.s2 }]}>Enter zone diameter</Text>
              <Text style={[F.body, { color: C.textMuted, marginBottom: S.s4 }]}>
                Type the zone of inhibition diameter in mm (must be ≥ {DISC_MM} mm).
              </Text>
              <TextInput
                style={styles.textInput}
                value={manualInput}
                onChangeText={setManualInput}
                keyboardType="decimal-pad"
                placeholder="e.g. 22.0"
                placeholderTextColor={C.textSubtle}
                autoFocus
                testID="manual-entry-input"
              />
              <View style={styles.modalBtns}>
                <Button
                  title="Cancel"
                  variant="secondary"
                  onPress={() => setManualModalVisible(false)}
                />
                <Button title="Confirm" onPress={confirmManual} testID="manual-entry-confirm" />
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </SafeAreaView>
      {showAlignInstructions && (
        <Animated.View style={styles.instructionOverlay}>
          <SafeAreaView style={styles.instructionContainer} edges={["top", "bottom"]}>
            <View style={styles.instructionCard}>
              <View style={styles.cardHeader}>
                <View style={styles.iconContainer}>
                  <Ionicons name="resize-outline" size={24} color="#3B82F6" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>How to Align your Plate</Text>
                  <Text style={styles.cardSubtitle}>
                    Follow the gesture demonstration below to scale and position your image perfectly.
                  </Text>
                </View>
              </View>

              {/* Gesture animation canvas */}
              <View style={styles.mockCanvas}>
                {/* Simulated dish background */}
                <Animated.View style={[styles.mockImageContainer, mockImageStyle]}>
                  {/* Circular grid simulating petri dish */}
                  <View style={styles.mockPetriDish}>
                    <View style={styles.mockAntibioticDisc} />
                  </View>
                </Animated.View>

                {/* Target central ring matching discOverlay */}
                <View style={styles.mockTargetOverlay}>
                  <View style={styles.mockTargetDot} />
                </View>

                {/* Animated Finger indicators */}
                <Animated.View style={[styles.fingerPointer, finger1Style]}>
                  <View style={styles.fingerPulse} />
                </Animated.View>
                <Animated.View style={[styles.fingerPointer, finger2Style]}>
                  <View style={styles.fingerPulse} />
                </Animated.View>
              </View>

              {/* Dynamic tutorial step description */}
              <View style={styles.stepIndicatorRow}>
                {[0, 1, 2].map((stepIndex) => (
                  <View
                    key={stepIndex}
                    style={[
                      styles.stepDot,
                      activeStep === stepIndex && styles.stepDotActive,
                    ]}
                  />
                ))}
              </View>

              <View style={styles.captionContainer}>
                <Text style={styles.captionText}>
                  {activeStep === 0 && "1. Zoom In: Pinch fingers outwards to grow the plate image."}
                  {activeStep === 1 && "2. Zoom Out: Pinch fingers inwards to shrink the plate image."}
                  {activeStep === 2 && "3. Move Image: Drag with one finger to pan and position the image."}
                </Text>
              </View>

              {/* Step Checklist */}
              <View style={styles.checklist}>
                <View style={styles.checkRow}>
                  <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                  <Text style={styles.checkText}>
                    Use <Text style={{ fontWeight: "700" }}>pinch gestures</Text> to adjust photo size.
                  </Text>
                </View>
                <View style={styles.checkRow}>
                  <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                  <Text style={styles.checkText}>
                    Align the antibiotic disc to the <Text style={{ fontWeight: "700", color: "#10B981" }}>central green reference</Text>.
                  </Text>
                </View>
              </View>

              {/* Got it button */}
              <TouchableOpacity
                style={styles.gotItBtn}
                onPress={() => setShowAlignInstructions(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.gotItText}>Got it, start aligning</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Animated.View>
      )}
    </GestureHandlerRootView>
  );
}

// ─── styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { padding: S.s6, paddingBottom: S.s8 },

  // Canvas
  canvas: {
    width: CANVAS,
    height: CANVAS,
    backgroundColor: "#000",
    borderRadius: S.rXl,
    overflow: "hidden",
    alignSelf: "center",
    position: "relative",
  },
  photoWrap: {
    position: "absolute",
    width: CANVAS,
    height: CANVAS,
    alignItems: "center",
    justifyContent: "center",
  },
  photo: {
    width: CANVAS,
    height: CANVAS,
  },

  // Reference disc overlay (always centred, fixed)
  discOverlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  discDot: {
    width: DISC_SCREEN_PX,
    height: DISC_SCREEN_PX,
    borderRadius: DISC_SCREEN_PX / 2,
    backgroundColor: "rgba(52, 211, 153, 0.85)", // green
    borderWidth: 2,
    borderColor: "#fff",
  },

  // Zone ring overlay (centred, resizable)
  ringOverlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    borderWidth: 3,
    borderColor: "rgba(239, 68, 68, 0.9)", // red
    backgroundColor: "transparent",
  },

  // Align hint
  hint: {
    marginTop: S.s3,
    textAlign: "center",
    fontSize: 12,
    color: C.textMuted,
    lineHeight: 18,
  },

  // Readout card
  readoutCard: {
    marginTop: S.s5,
    backgroundColor: C.surface,
    borderRadius: S.rLg,
    borderWidth: 1,
    borderColor: C.border,
    padding: S.s5,
    alignItems: "center",
  },
  readoutRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
    marginTop: S.s1,
  },
  unit: { fontSize: 20, fontWeight: "700", color: C.textMuted, marginBottom: 2 },
  readoutSub: { marginTop: S.s2, fontSize: 12, color: C.textMuted },

  // Steppers
  stepSection: {
    marginTop: S.s4,
    backgroundColor: C.surface,
    borderRadius: S.rLg,
    borderWidth: 1,
    borderColor: C.border,
    padding: S.s4,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  stepBtn: {
    flex: 1,
    height: 46,
    borderRadius: S.rMd,
    backgroundColor: C.secondary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: C.border,
  },
  stepText: { color: C.text, fontWeight: "700", fontSize: 13 },
  stepDivider: { width: 1, height: 30, backgroundColor: C.border, marginHorizontal: 2 },

  // Manual entry link
  manualLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "center",
    marginTop: S.s4,
    padding: S.s2,
  },
  manualLinkText: { color: C.ai.text, fontWeight: "700", fontSize: 14 },

  // Footer
  footer: {
    padding: S.s6,
    borderTopWidth: 1,
    borderTopColor: C.borderSubtle,
    backgroundColor: C.bg,
  },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: C.bg,
    borderTopLeftRadius: S.rXl,
    borderTopRightRadius: S.rXl,
    padding: S.s6,
    paddingBottom: S.s8,
  },
  textInput: {
    height: S.hInput,
    borderRadius: S.rMd,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: S.s4,
    fontSize: 20,
    fontWeight: "700",
    color: C.text,
    backgroundColor: C.surface,
    marginBottom: S.s4,
  },
  modalBtns: { flexDirection: "row", gap: S.s3 },

  // Instruction Screen Overlay
  instructionOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(15, 23, 42, 0.94)", // deep rich premium slate-900 transparent
    zIndex: 9999,
  },
  instructionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: S.s6,
  },
  instructionCard: {
    width: "100%",
    backgroundColor: "#1E293B", // slate-800
    borderRadius: S.rXl,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    padding: S.s5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 15,
    elevation: 8,
  },
  cardHeader: {
    flexDirection: "row",
    gap: S.s4,
    marginBottom: S.s4,
    alignItems: "center",
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(59, 130, 246, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
  cardSubtitle: {
    fontSize: 13,
    color: "#94A3B8", // slate-400
    lineHeight: 18,
    marginTop: 2,
  },
  mockCanvas: {
    width: 180,
    height: 180,
    backgroundColor: "#0F172A", // slate-900 canvas
    borderRadius: S.rLg,
    overflow: "hidden",
    alignSelf: "center",
    position: "relative",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  mockImageContainer: {
    position: "absolute",
    width: 180,
    height: 180,
    alignItems: "center",
    justifyContent: "center",
  },
  mockPetriDish: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2.5,
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  mockAntibioticDisc: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.4)",
  },
  mockTargetOverlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  mockTargetDot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(16, 185, 129, 0.8)", // emerald/green
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  fingerPointer: {
    position: "absolute",
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  fingerPulse: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#FFFFFF",
  },
  stepIndicatorRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginTop: S.s3,
  },
  stepDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  stepDotActive: {
    backgroundColor: "#3B82F6", // blue
    width: 14,
  },
  captionContainer: {
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    marginTop: S.s2,
    paddingHorizontal: S.s2,
  },
  captionText: {
    fontSize: 13.5,
    fontWeight: "600",
    color: "#F1F5F9",
    textAlign: "center",
    lineHeight: 18,
  },
  checklist: {
    backgroundColor: "rgba(15, 23, 42, 0.4)",
    borderRadius: S.rMd,
    padding: S.s4,
    gap: S.s2,
    marginTop: S.s3,
    marginBottom: S.s5,
  },
  checkRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  checkText: {
    fontSize: 13,
    color: "#CBD5E1", // slate-300
    flex: 1,
  },
  gotItBtn: {
    height: 52,
    backgroundColor: "#3B82F6", // bright modern blue accent
    borderRadius: S.rMd,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  gotItText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
