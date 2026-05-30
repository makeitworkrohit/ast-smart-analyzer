import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "../src/components/Button";
import { useAuth } from "../src/context/AuthContext";
import { C, F, S } from "../src/theme";

export default function LoginScreen() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email.trim() || password.length < 6) {
      Alert.alert("Invalid input", "Enter a valid email and 6+ char password.");
      return;
    }
    try {
      setLoading(true);
      if (mode === "login") {
        await login(email.trim(), password);
      } else {
        await register(email.trim(), password, name.trim() || undefined);
      }
      router.replace("/home");
    } catch (e: any) {
      const msg =
        e?.response?.data?.detail || e?.message || "Authentication failed";
      Alert.alert("Sign-in failed", String(msg));
    } finally {
      setLoading(false);
    }
  };

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
          <View style={styles.hero}>
            <View style={styles.logo}>
              <Ionicons name="flask" size={26} color={C.primaryText} />
            </View>
            <Text style={F.label}>AST SMART ANALYZER</Text>
            <Text style={[F.h1, { marginTop: S.s3 }]}>
              Antibiotic{"\n"}Susceptibility{"\n"}Testing.
            </Text>
            <Text style={[F.body, { color: C.textMuted, marginTop: S.s4 }]}>
              Capture. Measure. Interpret. Zone-of-inhibition results in
              seconds — grounded in CLSI-style breakpoints.
            </Text>
          </View>

          <View style={styles.form}>
            <Text style={[F.label, { marginBottom: S.s2 }]}>
              {mode === "login" ? "Welcome back" : "Create your account"}
            </Text>

            {mode === "register" && (
              <TextInput
                style={styles.input}
                placeholder="Full name (optional)"
                placeholderTextColor={C.textSubtle}
                value={name}
                onChangeText={setName}
                testID="register-name-input"
              />
            )}
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={C.textSubtle}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              testID="login-email-input"
            />
            <TextInput
              style={styles.input}
              placeholder="Password (6+ chars)"
              placeholderTextColor={C.textSubtle}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              testID="login-password-input"
            />

            <Button
              title={mode === "login" ? "Sign In" : "Create Account"}
              onPress={submit}
              loading={loading}
              testID="login-submit-button"
            />

            <TouchableOpacity
              style={styles.switchRow}
              onPress={() => setMode(mode === "login" ? "register" : "login")}
              testID="auth-toggle-mode"
            >
              <Text style={{ color: C.textMuted }}>
                {mode === "login"
                  ? "New here? "
                  : "Already have an account? "}
              </Text>
              <Text style={{ color: C.primary, fontWeight: "700" }}>
                {mode === "login" ? "Create account" : "Sign in"}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.disclaimer}>
            For educational and research use only. Not a replacement for
            certified laboratory testing.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { padding: S.s6, paddingBottom: S.s10 },
  hero: { marginBottom: S.s8 },
  logo: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: C.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: S.s5,
  },
  form: { gap: S.s3 },
  input: {
    height: S.hInput,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: S.rMd,
    paddingHorizontal: S.s4,
    color: C.text,
    fontSize: 15,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: S.s4,
  },
  disclaimer: {
    marginTop: S.s8,
    fontSize: 12,
    color: C.textSubtle,
    textAlign: "center",
    lineHeight: 18,
  },
});
