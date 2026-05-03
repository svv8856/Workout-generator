# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Git Push

When the user asks to push to git ("запушь", "push to git", и т.п.):
- Always use `git push "$GIT_URL" main` — `GIT_URL` is a Replit-managed env var containing the authenticated GitHub URL with token for `svv8856/Workout-generator`.
- Do NOT use `git push origin main` — origin lacks credentials and will fail with "Password authentication is not supported".
- Never echo or log the value of `$GIT_URL` (it contains a token).

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Artifacts

- **artifacts/api-server** — Express API (currently no live frontend consumer; left in place for future use).
- **artifacts/mockup-sandbox** — Vite preview server for canvas component previews.
- **artifacts/workout-generator** — «Генератор тренировок», React + Vite, Russian-language workout planner.

## Workout Generator (artifacts/workout-generator)

- **Storage / users**: 100% local on the device. No accounts, no cloud sync, no backend.
  - Profiles are stored in `localStorage` keys: `wg_profiles_v1`, `wg_active_profile_v1`, and per-profile history in `wg_history_v1:<profileId>`.
  - Multiple named profiles supported (e.g., family members). Profile API in `src/lib/workout.ts`: `listProfiles`, `createProfile`, `setActiveProfile`, `renameProfile`, `deleteProfile`, `subscribeProfiles`.
  - On first launch, `WelcomeScreen` asks for a name; profile menu in the header lets the user switch / add / rename / delete profiles.
  - Designed so it can later be wrapped (e.g., Capacitor) into a mobile app for the App Store / Google Play with no server dependency.
- **Exercise database**: ~190 exercises in `src/lib/workout.ts`, organised by equipment × muscle. Strict separation of `biceps` / `triceps` (no generic "arms").
- **Focus methodology**: Push (chest/shoulders/triceps), Pull (back/biceps), Legs (legs/glutes). `pickForSession` only ever picks exercises whose muscle is in the day's `primary` or `filler` lists; missing groups make the session shorter rather than mixing groups across days. Focus label is rebuilt from the muscles actually selected.
- **Pro feature set** (free at launch via toggle in `Analytics`):
  - `src/lib/sessions.ts`: `SessionLog`/`SessionExerciseLog` per-profile in `wg_sessions_v1:<id>` (cap 200), global `wg_pro_v1` flag. APIs: `saveSession`, `listSessions`, `deleteSession`, `clearSessions`, `subscribeSessions`, `isPro`, `setPro`, `subscribePro`.
  - `src/components/TrainingMode.tsx`: full-screen overlay (`role="dialog"`) with progress, set checkmarks, work/rest timers (WebAudio beep), Готово/Пропустить/Закончить раньше, final RPE 1–10. Launched from green "▶ Тренируюсь сейчас" on the workout result card.
  - `src/components/Analytics.tsx`: tab in `MainApp`. Free: weekly volume bar + calendar heatmap. Pro: weekly **tonnage** (вес × повторения × подходы) bar with current week + delta vs previous, **1ПМ** table by Epley formula for base lifts (1–10 reps only), muscle-balance pie, RPE trend, plan-vs-actual, `analyzeForAdaptation` recommendations + **deload-detector** (RPE rise + tonnage drop over 4 weeks). Pro cards blurred with CTA when off.
  - `SessionExerciseLog.reps` and `weightKg` are populated at save time in `TrainingMode` via `parseRepsAvg` (averages "8–10 повторений" → 9, returns null for timed exercises) and `parseWeightKg` (extracts first number from weight string).
- **Backup / migration**: `lib/sessions.ts` exports `buildBackup(profileName)` and `importBackup(raw, mode)`. UI in `ProfileMenu` ("Резервная копия" section) downloads JSON and re-imports merging by session id. Format `{ format: "wg-backup", version: 1, sessions: [...] }` — also intended as the migration bridge for the future mobile app.
- **Mobile (Capacitor)**: `capacitor.config.ts` at artifact root (appId `ru.workoutgenerator.app`, webDir `dist`). `src/lib/native.ts` wraps `@capacitor/haptics`, `@capacitor/local-notifications`, `@capacitor-community/keep-awake` with web fallbacks (Web Vibration, Wake Lock API). `TrainingMode` calls `keepScreenAwake(true)` while open, `hapticSuccess()` at timer end, and `scheduleRestDoneNotification(secs)` at every rest start so the user gets a system notification if the screen sleeps. Build steps in `artifacts/workout-generator/MOBILE.md` (must run locally — Android Studio + JDK 21 required, cannot build APK on Replit). Scripts: `build:mobile`, `cap:add:android`, `cap:sync`, `cap:open:android`. Session cap raised to 5000.
