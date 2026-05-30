import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { C, F, S } from "../theme";

type Props = {
  title: string;
  subtitle?: string;
  step?: string;
  onBack?: () => void;
  showBack?: boolean;
};

export default function ScreenHeader({
  title,
  subtitle,
  step,
  onBack,
  showBack = true,
}: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {showBack && (
          <TouchableOpacity
            style={styles.back}
            onPress={() => (onBack ? onBack() : router.back())}
            testID="header-back-button"
          >
            <Ionicons name="chevron-back" size={22} color={C.text} />
          </TouchableOpacity>
        )}
        {step && <Text style={F.label}>{step}</Text>}
      </View>
      <Text style={[F.h1, { marginTop: S.s4 }]}>{title}</Text>
      {subtitle && (
        <Text style={[F.body, { marginTop: S.s2, color: C.textMuted }]}>
          {subtitle}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingBottom: S.s5 },
  row: { flexDirection: "row", alignItems: "center", gap: S.s4 },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.secondary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: C.border,
  },
});
