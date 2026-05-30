/**
 * Design tokens — Swiss/Clinical aesthetic. All screens use StyleSheet + these tokens.
 */
export const C = {
  bg: "#F8FAFC",            // slate-50
  surface: "#FFFFFF",
  border: "#E2E8F0",        // slate-200
  borderSubtle: "#F1F5F9",  // slate-100
  primary: "#0F172A",       // slate-900
  primaryText: "#FFFFFF",
  secondary: "#F1F5F9",
  text: "#0F172A",
  textMuted: "#64748B",     // slate-500
  textSubtle: "#94A3B8",    // slate-400
  // status
  sens: { bg: "#ECFDF5", text: "#047857", border: "#A7F3D0", dot: "#10B981" },
  inter: { bg: "#FFFBEB", text: "#B45309", border: "#FDE68A", dot: "#F59E0B" },
  resist: { bg: "#FEF2F2", text: "#B91C1C", border: "#FECACA", dot: "#EF4444" },
  // ai
  ai: { bg: "#EFF6FF", text: "#1E40AF", border: "#BFDBFE", accent: "#3B82F6" },
};

export const S = {
  // spacing
  s1: 4,
  s2: 8,
  s3: 12,
  s4: 16,
  s5: 20,
  s6: 24,
  s8: 32,
  s10: 40,
  // radii
  rSm: 12,
  rMd: 16,
  rLg: 20,
  rXl: 24,
  rFull: 9999,
  // buttons
  hBtn: 56,
  hInput: 52,
};

export const F = {
  h1: { fontSize: 32, fontWeight: "800" as const, color: C.text, letterSpacing: -1 },
  h2: { fontSize: 24, fontWeight: "700" as const, color: C.text, letterSpacing: -0.5 },
  h3: { fontSize: 18, fontWeight: "700" as const, color: C.text },
  body: { fontSize: 15, fontWeight: "400" as const, color: "#334155", lineHeight: 22 },
  label: {
    fontSize: 11,
    fontWeight: "800" as const,
    color: C.textMuted,
    letterSpacing: 2,
    textTransform: "uppercase" as const,
  },
  data: { fontSize: 44, fontWeight: "700" as const, color: C.text, letterSpacing: -1.5 },
  mono: { fontSize: 14, fontWeight: "600" as const, color: C.text },
};

export function statusPalette(interp: string) {
  const v = (interp || "").toLowerCase();
  if (v.startsWith("sens")) return C.sens;
  if (v.startsWith("inter")) return C.inter;
  return C.resist;
}
