import { router } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../src/context/AuthContext";
import { C, F } from "../src/theme";

export default function Index() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) router.replace("/home");
      else router.replace("/login");
    }
  }, [user, loading]);

  return (
    <View style={styles.container} testID="splash-screen">
      <Text style={[F.h1, { marginBottom: 12 }]}>AST</Text>
      <Text style={[F.body, { color: C.textMuted, marginBottom: 40 }]}>
        Smart Analyzer
      </Text>
      <ActivityIndicator color={C.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
    alignItems: "center",
    justifyContent: "center",
  },
});
