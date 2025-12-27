# Copilot instructions for working on this repo

## Quick context
- This is an Expo + React Native app (TypeScript) created with `create-expo-app`. See `package.json` for scripts and pins.
- Routing is file-based using `expo-router` (see `app/_layout.tsx` and `app/(tabs)/_layout.tsx`). The root stack exposes a `modal` route.
- The project uses strict TypeScript (`tsconfig.json`) and path alias `@/*` for imports (use `@/components/...`, `@/hooks/...`).

## What to do when adding features
- Add screens under `app/` to leverage file-based routing. For tab screens, put them in `app/(tabs)/` or add a `Tabs.Screen` in `app/(tabs)/_layout.tsx`.
- Use `components/themed-*` helpers and `useThemeColor` for colors instead of hard-coding colors; see `components/themed-text.tsx` and `components/themed-view.tsx`.

## Platform and rendering notes
- Canvas rendering uses `@shopify/react-native-skia` on mobile and falls back to `Image` on the web. Look at `app/(tabs)/dashboard.tsx` for an example pattern:
  - Use `useImage(require(...))` for Skia images and guard with `Platform.OS === 'web'` for web fallback.
- There are platform-specific components/files (e.g., `components/ui/icon-symbol.ios.tsx`) — prefer platform-agnostic imports (`components/ui/icon-symbol`).

## State & interaction patterns to follow
- Dragging interactions use `PanResponder` and mutable refs (`useRef`) for per-item responders (`dashboard.tsx`) — follow this pattern for interactive UI.
- UI cards/components use local state (hooks) and simple setter patterns (e.g., `setCharges(prev => [...prev])`) to ensure immutable updates.

## Common workflows & commands
- Install: `npm install`
- Start dev server: `npx expo start` (or `npm run start`)
- Platform shortcuts: `npm run android`, `npm run ios`, `npm run web`
- Reset sample project: `npm run reset-project` (runs `scripts/reset-project.js`, read that file before running)
- Lint: `npm run lint`

## Patterns & conventions
- TypeScript: `strict: true` — be explicit with types and prefer narrow types.
- Import alias: use `@/` to import internal modules.
- Assets: images are loaded with `require('../../assets/images/...')` (relative to the file). For Skia, use `useImage(require(...))`.
- Keep platform fallbacks explicit (avoid assuming Skia is available on web).

## Where to look for implementation examples
- Navigation & routing: `app/_layout.tsx`, `app/(tabs)/_layout.tsx`
- Themed UI: `components/themed-text.tsx`, `components/themed-view.tsx`, `constants/theme.ts`
- Interactive canvas and platform fallback: `app/(tabs)/dashboard.tsx`
- Reset script and developer note: `scripts/reset-project.js`

## Safety & limits
- No test suite is present; changes should be manually validated in the simulator/browser.
- The repo is an Expo-managed app—avoid adding native modules that require ejecting unless necessary.

---
Please review the sections above and tell me if any details are missing or you'd like more specific examples (e.g., a sample PR checklist or code snippets for adding a new screen).