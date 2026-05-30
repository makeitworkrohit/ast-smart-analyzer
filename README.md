# AST Smart Analyzer 🔬🦠

**AST Smart Analyzer** is an educational universal application designed for **Antimicrobial Susceptibility Testing (AST)** using the clinical Kirby-Bauer disc diffusion method. 

It allows users to capture or upload photos of agar plates, measure the diameter of zone of inhibition overlays, and receive AI-driven susceptibility interpretations, predicted MIC ranges, and plausible micro-organisms.

---


## 🌟 Key Features

*   **Interactive Measurement UI:** Intuitive touch-based / mouse-based on-screen caliper tool in the Expo app to overlay and measure the zone of inhibition in millimeters.
*   **AI Interpretation Engine:** FastAPI backend powered by OpenAI (`gpt-4o-mini`) translating zone diameters into CLSI-style interpretations (*Sensitive*, *Intermediate*, *Resistant*).
*   **Smart Clinical Insights:** Provides estimated Minimum Inhibitory Concentration (MIC) ranges, ranked likely micro-organisms, and explanatory summaries.
*   **Deterministic Fallback:** Robust local heuristic ruleset that ensures reliable interpretations even when offline or during API outages.
*   **Scan History & Auth:** Secure MongoDB-backed user registration/login, session management, and past scan history tracking.

---

## 📂 Architecture Overview

### 1. Frontend (`/frontend`)
*   **Framework:** Expo SDK 54 / React Native (Universal Web, iOS, Android support).
*   **Routing:** File-based navigation using `expo-router`.
*   **State:** Local state management using React Context (`AuthContext`, `ScanContext`).
*   **Build & Deploy:** Configured for Expo Application Services (EAS) and hosted on **EAS Hosting**.

### 2. Backend (`/backend`)
*   **Framework:** FastAPI (Python 3) for clean, high-performance API endpoints.
*   **Database:** MongoDB via `motor` (async driver) for saving user profiles and scan history.
*   **AI Layer:** Direct OpenAI SDK integration implementing custom JSON response structures.
*   **Testing:** Automated endpoints coverage using `pytest`.


