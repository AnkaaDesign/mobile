# Mobile Deployment & Versioning Guide

This is the master runbook for shipping the **Ankaa Design** mobile app (Expo SDK 54,
bare/prebuilt native projects, **no EAS Build** — the project is too large for EAS).

> ⚠️ **OTA runtimeVersion model changed (2026-06-25):** OTA matching now uses a
> **static `runtimeVersion` string** in `app.json` (same for both platforms), not
> an `@expo/fingerprint` hash. Sections below that describe per-platform
> fingerprints, "same commit + frozen install", or matching hashes are superseded
> by `docs/OTA_FINGERPRINT_SYNC.md` — the static value just needs to be identical
> in `app.json`, both native files, and the `updates/<value>/` folder name.

> 🚫 **NEVER use `expo build` / EAS Build / `eas build`.** This app is too large
> for EAS to build — it fails. **Android is ALWAYS built locally with
> `./gradlew` on this PC, and iOS is ALWAYS built natively with Xcode /
> `xcodebuild` on the Mac.** The `npm run build`, `android:build`, `ios:build`,
> and `preview` scripts in `package.json` (which call `expo build` / `eas build`)
> are dead — do not run them. The `eas.json` profiles exist for historical
> reasons only and are effectively unused. Use the runbooks in §3 (Android) and
> §4 (iOS) instead.

Three things ship the app to users:

| Channel | What it delivers | Where you build it | How often |
|---|---|---|---|
| **Android binary (APK)** | The whole app (native + JS) | **This PC** (local Gradle) | Only when native changes (see fingerprint rule) |
| **iOS binary (App Store)** | The whole app (native + JS) | **The Mac** (Xcode / `xcodebuild`) | Only when native changes |
| **OTA update** | JS bundle + JS assets ONLY | Either machine | Anytime you change only `src/` code |

> **The single most important rule:** an OTA update can ONLY replace JavaScript.
> Any change to **native code, native dependencies, `app.json` native config,
> Expo plugins, or app icons** changes the *fingerprint* (runtimeVersion) and
> **requires a brand-new binary build**. Installed apps correctly ignore OTA
> updates that don't match their fingerprint. See the decision flowchart below.

Deep technical detail of the OTA server lives in
[`OTA_SELF_HOSTED_UPDATES.md`](./OTA_SELF_HOSTED_UPDATES.md). This file is the
practical "what do I run to deploy" guide.

---

## 1. How versioning works (read this once)

There are **three independent numbers**. Don't confuse them.

### a) Marketing version — `1.0.3` (what humans see)
The public version users see in the store ("Version 1.0.3"). Bump it on every
release that's meaningful to users. Use semver-ish: `MAJOR.MINOR.PATCH`.

- **Android:** `versionName` in `android/app/build.gradle`
- **iOS:** `MARKETING_VERSION` in `ios/AnkaaDesign.xcodeproj/project.pbxproj`
- Keep `version` in `app.json` matching too (cosmetic, but avoid drift).

### b) Build number — integer counter (stores require it to always increase)
Every binary you upload **must** have a higher build number than the last one,
even a tiny rebuild. The stores reject a build whose number isn't strictly greater.

- **Android:** `versionCode` (integer) in `android/app/build.gradle` — **+1 every APK you distribute**
- **iOS:** `CURRENT_PROJECT_VERSION` (= `buildNumber`) in `project.pbxproj` — **+1 every build you upload to App Store Connect**
- These two are tracked **per platform** and don't need to match each other.

### c) runtimeVersion — the fingerprint (automatic, don't edit by hand)
A content hash of everything native. It decides which binaries an OTA update is
allowed to land on. You never set it manually — `app.json` holds the constant
`runtimeVersion: { "policy": "fingerprint" }`, and the scripts compute the real
hash. iOS and Android get **different** fingerprints — that's expected.

### Current values (as of this writing — verify before each release)

| Item | File | Value |
|---|---|---|
| Marketing version (Android) | `android/app/build.gradle` → `versionName` | `1.0.3` |
| Build number (Android) | `android/app/build.gradle` → `versionCode` | `4` |
| Marketing version (iOS) | `project.pbxproj` → `MARKETING_VERSION` | `1.0` |
| Build number (iOS) | `project.pbxproj` → `CURRENT_PROJECT_VERSION` | `3` |
| `app.json` version | `app.json` → `expo.version` | `1.0` |

> ⚠️ Note the drift: Android is at `1.0.3` / build `4`, iOS at `1.0` / build `3`,
> `app.json` at `1.0`. **Since you build natively, the native files are the source
> of truth** — edit `build.gradle` and `project.pbxproj` directly. Bring them all
> to the same marketing version on your next release to stop the confusion.

---

## 2. The decision: OTA or new binary?

```
                 Did your change touch ANY of:
                 - native code (android/ or ios/ folders, except JS)
                 - a native dependency (anything in package.json that has
                   native code: expo-* native modules, vision-camera, etc.)
                 - app.json native config (plugins, permissions, intentFilters,
                   icons, bundleId, scheme, newArch, etc.)
                 - app icons / splash
                          │
              ┌───────────┴───────────┐
             YES                       NO  (only changed src/ JS/TS, JS assets)
              │                         │
   ┌──────────┴──────────┐             │
   │ Fingerprint CHANGES  │   ┌─────────┴─────────┐
   │ → must ship a NEW    │   │ Fingerprint SAME   │
   │   BINARY:            │   │ → ship via OTA:     │
   │   • Android: §3      │   │   §5  (no version    │
   │   • iOS: §4          │   │        bump needed)  │
   │ Bump versionCode /   │   └─────────────────────┘
   │ buildNumber first.   │
   │ Then OTA can follow. │
   └─────────────────────┘
```

**Not sure if the fingerprint changed?** Check it directly:

```bash
cd mobile
node -e "import('./scripts/ota-version.mjs').then(m=>console.log(m.computeRuntimeVersions()))"
```

Compare against the fingerprint baked into the installed binary. If they differ,
the installed app will NOT accept your OTA — you need a new binary. (This exact
drift bit us once: `app.json` gained intent filters, fingerprint changed, and
OTA silently stopped reaching old installs.)

---

## 3. Android release — on THIS PC (local Gradle, no Play Store)

You distribute the APK by hand (no Play Store for now).

### Toolchain (already set up here)
- JDK: `/opt/android-studio/jbr` (JDK 21)
- Android SDK: `~/Android/Sdk` (`android/local.properties` → `sdk.dir`)
- Signing keystore: `android/app/ankaa-release.jks` (alias `6111b0c119e8ec6808bde21de69c1e37`)
- Keystore passwords in `~/.gradle/gradle.properties`:
  `ANKAA_STORE_PASSWORD` + `ANKAA_KEY_PASSWORD` (store ≠ key password)
- `JAVA_HOME` / `ANDROID_HOME` exported in `~/.zshrc` — use a fresh terminal.

### Steps

```bash
cd mobile

# 1. Bump the version numbers in android/app/build.gradle:
#      versionCode 4  -> 5      (ALWAYS +1, every distributed APK)
#      versionName "1.0.3" -> "1.0.4"
#    (edit the file by hand)

# 2. If you changed app.json / plugins / icons, re-sync native config first:
npx expo prebuild --platform android      # only when native config changed
#    (skip this if you only changed JS — but then you don't need a build at all)

# 3. Sync the OTA fingerprint into the native runtime file (ALWAYS, last step
#    before building, so the binary embeds the value the OTA server will serve):
npm run ota:sync-version

# 4. Build the signed release APK:
cd android && ./gradlew assembleRelease
#    Output: android/app/build/outputs/apk/release/app-release.apk
#    First build ~40 min; subsequent ~6 min.

# 5. Verify the signature (optional but recommended):
apksigner verify --print-certs app/build/outputs/apk/release/app-release.apk
```

Then distribute `app-release.apk` to your users (LocalSend, link, etc.).

> **Gotcha:** `android/gradle/wrapper/gradle-wrapper.jar` is gitignored. If it's
> missing, regenerate: download `gradle-8.14.3-bin.zip`, run `gradle wrapper`.
> Release lint is disabled and Gradle heap is raised in `build.gradle` to avoid
> Metaspace OOMs — leave those as-is.

### Want an `.aab` for the Play Store later?
`eas.json` already has a `production-aab` profile, but EAS can't build this project.
Locally: `cd android && ./gradlew bundleRelease` →
`android/app/build/outputs/bundle/release/app-release.aab`.

---

## 4. iOS release — on the MAC (App Store)

Build and upload from your Mac. Two options — Xcode GUI (simplest) or command line.

### Prerequisites (on the Mac)
- Xcode installed, signed into your Apple Developer account
- Team ID: `VDN4DBVKPJ` (already in `ios/ExportOptions.plist`)
- Bundle ID: `com.ankaadesign.management` (must exist in App Store Connect)
- `cd mobile && npm ci && cd ios && pod install` after pulling new JS deps

### Step 0 — bump versions
Edit `ios/AnkaaDesign.xcodeproj/project.pbxproj`:
- `MARKETING_VERSION` → e.g. `1.0.4` (match Android)
- `CURRENT_PROJECT_VERSION` → **+1** (e.g. `3` → `4`) — App Store rejects a
  reused build number within a marketing version.

(`ExportOptions.plist` has `manageAppVersionAndBuildNumber = false`, so these
values are taken exactly as you set them — Xcode won't auto-bump.)

### Step 1 — sync native config + fingerprint
```bash
cd mobile
npx expo prebuild --platform ios     # only if app.json native config changed
cd ios && pod install && cd ..
npm run ota:sync-version             # ALWAYS, last step before archiving
```

### Step 2a — build & upload via Xcode GUI (recommended if unsure)
1. Open `ios/AnkaaDesign.xcworkspace` in Xcode (the **.xcworkspace**, not .xcodeproj).
2. Select the **Any iOS Device (arm64)** destination (not a simulator).
3. **Product → Archive**. Wait for the build.
4. In the Organizer window that opens → **Distribute App** →
   **App Store Connect** → **Upload** → follow prompts (automatic signing).
5. The build appears in App Store Connect → TestFlight after processing (~10–30 min).
6. Submit for review from App Store Connect when ready.

### Step 2b — build & upload via command line (alternative)
```bash
cd mobile/ios

xcodebuild -workspace AnkaaDesign.xcworkspace \
  -scheme AnkaaDesign \
  -configuration Release \
  -archivePath build/AnkaaDesign.xcarchive \
  archive

xcodebuild -exportArchive \
  -archivePath build/AnkaaDesign.xcarchive \
  -exportOptionsPlist ExportOptions.plist \
  -exportPath build/export

# Upload the resulting .ipa to App Store Connect:
xcrun altool --upload-app -f build/export/*.ipa -t ios \
  --apiKey <KEY_ID> --apiIssuer <ISSUER_ID>
# (or drag the .ipa into the Transporter app)
```

### Step 3 — App Store submission
In App Store Connect: pick the uploaded build, fill in "What's New",
screenshots if changed, and submit for review.
See [`APP_REVIEW_NOTES.md`](../APP_REVIEW_NOTES.md) for reviewer login notes.

---

## 5. OTA update — JS-only changes (either machine)

Use this when you changed **only `src/` JavaScript/TypeScript** and the
fingerprint is unchanged. No version bump, no store, no APK — installed apps
pick it up on next launch/foreground.

```bash
cd mobile

# 1. Make sure your fingerprint still matches the binaries in the field
#    (if it changed, STOP — you need a new binary instead, see §3/§4):
node -e "import('./scripts/ota-version.mjs').then(m=>console.log(m.computeRuntimeVersions()))"

# 2. Build + stage the OTA bundle into ../api/updates/<fingerprint>/ :
npm run ota:publish

# 3. Ship the folders to the production API host:
rsync -avz --delay-updates ../api/updates/ user@server:/path/to/api/updates/
```

The API serves them from `GET /updates/manifest`. Clients check on launch and on
foreground (`fallbackToCacheTimeout: 0`, so it never blocks offline use). A user
who declines an update isn't nagged again that session.

> **The classic OTA failure:** you publish, but old installs never update. Cause:
> the binary in the field has a *different* fingerprint than what you just
> published (a native change slipped in). Fix: rebuild & redistribute the binary
> (§3/§4) so its fingerprint matches, then OTA works again. To reach the OLD
> binaries one last time, publish from a tree whose native config matches them.

---

## 6. Quick cheat sheet

```bash
# Check current fingerprints
node -e "import('./scripts/ota-version.mjs').then(m=>console.log(m.computeRuntimeVersions()))"

# Android binary (this PC)
#   edit build.gradle: versionCode +1, versionName
npm run ota:sync-version
cd android && ./gradlew assembleRelease         # -> APK
#   bundleRelease for .aab

# iOS binary (Mac)
#   edit project.pbxproj: MARKETING_VERSION, CURRENT_PROJECT_VERSION +1
cd ios && pod install && cd ..
npm run ota:sync-version
#   Xcode: Product > Archive > Distribute > App Store Connect

# OTA (JS only)
npm run ota:publish
rsync -avz --delay-updates ../api/updates/ user@server:/path/to/api/updates/
```

### Order of operations for a NATIVE release (don't skip a step)
1. Bump version numbers (versionCode/versionName or MARKETING/CURRENT_PROJECT).
2. `npx expo prebuild --platform <p>` *only if* `app.json` native config changed.
3. `pod install` (iOS) if deps changed.
4. `npm run ota:sync-version`  ← always last before building.
5. Build & sign (Gradle / Xcode archive).
6. Distribute (hand-deliver APK / upload to App Store Connect).
7. Optionally `npm run ota:publish` afterward to push later JS fixes to it.

---

## 7. Gotchas & deferred items

- **Source of truth for versions = native files** (`build.gradle`, `project.pbxproj`),
  not `app.json`, because you build natively. Keep `app.json.version` in sync only
  to avoid confusion.
- **`ota:sync-version` must run after any `expo prebuild`** and right before the
  build, or the binary embeds a stale runtimeVersion and won't get OTA updates.
- **Expo.plist / expo_runtime.xml are `.fingerprintignore`d** — writing the
  synced version into them does NOT change the fingerprint (no feedback loop).
- **OTA code signing is not yet enabled** (integrity currently relies on TLS).
  Recommended for production: generate a keypair, add the cert to `app.json`, set
  `EXPO_UPDATES_PRIVATE_KEY_PATH` on prod, and bundle it into the next native
  build. See `OTA_SELF_HOSTED_UPDATES.md` §"Optional: code signing".
- **Old fingerprint folders under `api/updates/` are never pruned** — clean up
  manually if disk grows.
- **EAS Build does not work** for this project (size). `eas.json` profiles exist
  but are effectively unused; build locally.
- **No Play Store distribution** currently — Android APKs are hand-distributed.
  When you're ready, `bundleRelease` makes the `.aab` the Play Store needs.

### pnpm + Android native build (`prefab` / `No matching variant`)
This project uses **pnpm** (`node-linker=hoisted`). Two pnpm-specific traps can
break `./gradlew assembleRelease`:

1. **`Error: no such option …patch_hash` (prefab / CMake config fails for
   reanimated/worklets/gesture-handler).** Cause: a dependency patched via pnpm's
   `patchedDependencies` makes pnpm inject a `patch_hash=<hash>` segment into the
   `.pnpm` dir name of that package *and every package that depends on it*. The
   `=` in the path breaks Android's `prefab` CLI (clikt reads `…patch_hash=…` as
   `--option=value`). **Fix:** do NOT patch `react-native` (or any widely-depended
   native package) via `pnpm-workspace.yaml` `patchedDependencies`. Patch it with
   **patch-package** instead (`patches/<name>+<version>.patch`, applied by the
   `postinstall` script) — it edits files in place and never renames dirs. The
   `react-native` patch is iOS-only, so this has zero effect on the Android build.
   Avoid the `virtualStoreDirMaxLength` workaround — set low enough to hash the
   `=` away, it truncates package names and breaks autolinking (trap #2).

2. **`No matching variant of project :react-native-… (No variants exist)` at
   configure time.** Usually stale Gradle/native build state after node_modules
   paths changed (e.g. a reinstall). **Fix:** reset build state:
   ```bash
   cd android && ./gradlew --stop
   rm -rf android/.gradle android/build android/app/build android/app/.cxx
   find node_modules/.pnpm -type d \( -name build -o -name .cxx \) -path "*/android/*" -prune -exec rm -rf {} +
   ```
   then rebuild.
```
