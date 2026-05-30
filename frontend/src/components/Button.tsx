import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { C, S } from "../theme";

type Props = {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline";
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  testID?: string;
};

export default function Button({
  title,
  onPress,
  variant = "primary",
  icon,
  loading,
  disabled,
  testID,
}: Props) {
  const isPrimary = variant === "primary";
  const isOutline = variant === "outline";
  const bg = isPrimary ? C.primary : isOutline ? "transparent" : C.secondary;
  const fg = isPrimary ? C.primaryText : C.text;
  const border = isOutline ? C.border : bg;

  return (
    <TouchableOpacity
      style={[
        styles.btn,
        { backgroundColor: bg, borderColor: border },
        disabled && { opacity: 0.45 },
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      testID={testID}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={styles.inner}>
          {icon && <Ionicons name={icon} size={18} color={fg} />}
          <Text style={[styles.label, { color: fg }]}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: S.hBtn,
    borderRadius: S.rFull,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: S.s5,
  },
  inner: { flexDirection: "row", alignItems: "center", gap: 10 },
  label: { fontSize: 16, fontWeight: "700", letterSpacing: 0.2 },
});
