# Server release handoff (Android APK + OTA publish)

> For the Claude session running on the build/API **server**. The iOS Release was
> built and installed from a Mac. Your job: produce the matching **Android release
> APK** and **publish the OTA bundle** so the server serves updates both binaries
> can consume. Read `docs/OTA_FINGERPRINT_SYNC.md` first — this is the operational
> checklist.

## The non-negotiable rule

iOS (built on the Mac) and Android (built here) must come from the **same git
commit** with a **frozen dependency install**. The OTA bundle must be published
from that **same commit** too. If any of the three diverges, the runtimeVersion
fingerprints won't match and OTA silently won't apply.

## Pinned state for THIS release

- **Branch:** `pre-accounting-implementation`
- **Release commit:** `3fdc8c03` or newer on this branch (docs-only commits after
  it keep the same fingerprints; `ota:verify` is the real gate).
- **Expected fingerprints** (the consistency anchor — `npm run ota:verify` must
  print these, matching what's embedded in the committed native files):
  - iOS:     `a9eb301de8753db841eb5804301f2950d78dc2c1`  (built on the Mac)
  - Android: `367b668accf94352a99076777441c0b5da49afc2`  (you build this)
- These hold only if `node_modules` is installed from the committed lockfile and
  you're on the same commit as the Mac. The exact commit SHA is in the chat
  handoff; if unsure, `git log --oneline -1` should match the SHA you were given.

## Steps

1. **Sync to the exact commit:**
   ```sh
   cd mobile
   git fetch origin
   git checkout pre-accounting-implementation
   git pull --ff-only
   ```
2. **Frozen install** (reproducible fingerprint — do NOT use `npm install`):
   ```sh
   npm ci
   ```
3. **Verify you're consistent with the iOS build** — this MUST pass and print the
   fingerprints above. If it reports drift or different hashes, STOP: you're on
   the wrong commit or deps differ.
   ```sh
   npm run ota:verify
   ```
4. **Build the release APK** (syncs the fingerprint into the native files first,
   then runs Gradle — no device/emulator needed):
   ```sh
   npm run android:apk
   ```
   Output: `android/app/build/outputs/apk/release/app-release.apk`
5. **Publish the OTA bundle from the same commit** (verify runs again as a guard):
   ```sh
   npm run ota:publish
   ```
   This exports the JS bundle and writes it to `../api/updates/<iosFp>/` and
   `../api/updates/<androidFp>/` (override the location with `UPDATES_DEST=...`).
6. **Deploy the updates folder** to the live API host if it isn't already there,
   e.g. `rsync -avz ../api/updates/ <prod-api-host>:/path/to/api/updates/`.

## Environment prerequisites (verify before building)

- **Android signing:** a release keystore + `signingConfigs.release` must be
  configured (it was for the v1.0.4 / versionCode 5 release). An unsigned/debug
  APK won't be installable as a release.
- **New store submission?** If this APK goes to a store, bump `versionCode`
  (and `versionName`) — OTA-only/internal installs don't require it.
- **API OTA env (production):** `UPDATES_PUBLIC_URL=https://api.ankaadesign.com.br`
  must be set (asset URLs must be absolute HTTPS for iOS ATS). The API serves from
  `UPDATES_ROOT` (defaults to `<cwd>/updates`).
- **JDK / Android SDK** present and `ANDROID_HOME` set for Gradle.

## If `ota:verify` shows different hashes than above

That means the source/deps here don't match the Mac's iOS build. Do **not**
force-publish. Most likely causes: wrong commit, `npm install` instead of
`npm ci`, or uncommitted local changes (`git status` must be clean). Fix the
cause, not the symptom — overriding with `OTA_SKIP_VERIFY=1` will serve a bundle
no binary can use.
