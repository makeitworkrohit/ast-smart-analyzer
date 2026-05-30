/**
 * Persists the in-flight scan wizard state across screens.
 * Detection mode is always "manual" — the user aligns a 6 mm overlay
 * disc on the photo and pinches a ring to measure the zone.
 */
import React, { createContext, useContext, useState } from "react";

export type ScanState = {
  sampleType: string;
  antibioticCategory: string;
  antibiotic: string;
  imageBase64: string | null;
  zoneMm: number;
  detectionMode: "manual";
};

const EMPTY: ScanState = {
  sampleType: "",
  antibioticCategory: "",
  antibiotic: "",
  imageBase64: null,
  zoneMm: 0,
  detectionMode: "manual",
};

type Ctx = {
  state: ScanState;
  update: (patch: Partial<ScanState>) => void;
  reset: () => void;
};

const ScanContext = createContext<Ctx | null>(null);

export function ScanProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ScanState>(EMPTY);
  const update = (patch: Partial<ScanState>) =>
    setState((prev) => ({ ...prev, ...patch }));
  const reset = () => setState(EMPTY);
  return (
    <ScanContext.Provider value={{ state, update, reset }}>
      {children}
    </ScanContext.Provider>
  );
}

export function useScan() {
  const ctx = useContext(ScanContext);
  if (!ctx) throw new Error("useScan outside ScanProvider");
  return ctx;
}
