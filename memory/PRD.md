# AST Smart Analyzer — Product Requirements (PRD)

## Purpose
Mobile-first Expo React Native app that digitizes Kirby-Bauer antibiotic
susceptibility testing. Users photograph agar plates, the backend detects
the 6 mm disc + zone of inhibition with OpenCV, and OpenAI gpt-4o-mini
returns an S/I/R interpretation, estimated MIC range, and ranked organism
predictions with an explanation.

## Stack
- Frontend: Expo 54, React Native 0.81, expo-router v6, React 19
- Backend: FastAPI + Motor (MongoDB)
- Auth: JWT (email+password), bcrypt hashing
- CV: opencv-python-headless (Hough Circles + radial intensity profile)
- AI: OpenAI Python SDK, model `gpt-4o-mini`, user-supplied key in .env

## Screens
1. `/login` — Sign in / Register (JWT)
2. `/home` — Hero "Scan Plate" tile + stats + recent scans
3. `/scan-sample` — Searchable specimen dropdown (with "Other" free-text)
4. `/scan-antibiotic` — Cascading category → antibiotic (14 categories, 59 drugs)
5. `/scan-capture` — Camera / gallery picker with 6 mm alignment overlay
6. `/scan-measure` — Backend auto-detection + stepper manual override
7. `/scan-result` — S/I/R, MIC range, organisms, AI explanation
8. `/history` — Past scans list
9. `/history-detail` — Scan report view + delete
10. `/settings` — Account, detection mode, data, about, disclaimer

## API (all `/api/*`)
- `POST /auth/register`, `POST /auth/login`, `GET /auth/me`
- `GET /meta/antibiotics`, `GET /meta/sample-types`
- `POST /analyze` — image_base64 → zone_mm + annotated image
- `POST /interpret` — zone/antibiotic/sample → AI interpretation
- `POST /scans`, `GET /scans`, `GET /scans/{id}`, `DELETE /scans/{id}`,
  `DELETE /scans` (clear all)

## Mongo collections
- `users` (id, email unique, name, password_hash, created_at)
- `scans_collection` (id, user_id, zone_mm, sample_type, antibiotic,
  antibiotic_category, interpretation, estimated_mic_range,
  possible_organisms[], explanation, confidence_score, detection_mode,
  image_base64, annotated_base64, timestamp)

## Security
- `.env` files gitignored (root .gitignore updated with `.env`, `.env.*`,
  `backend/.env`, `frontend/.env`)
- OpenAI key lives only in `/app/backend/.env`, loaded via `load_dotenv`

## Disclaimer
"For educational and research purposes only. Not a replacement for certified
laboratory testing." — shown on login, results, history detail, settings.
