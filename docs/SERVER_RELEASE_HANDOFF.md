# Server release handoff (Android APK + OTA publish)

> For the Claude session running on the build/API **server**. The iOS Release was
> built and installed from a Mac. Your job: produce the matching **Android release
> APK** and **publish the OTA bundle**. Read `docs/OTA_FINGERPRINT_SYNC.md` first —
> this is the operational checklist.

## The rule (now simple)

OTA matching uses a **static `runtimeVersion` string** in `app.json` (e.g. `"7"`),
the SAME for both platforms. It does **not** depend on the build machine, the
installed dependency tree, or the git commit. So:

- iOS (Mac) and Android (here) just need the **same `app.json` `runtimeVersion`**.
- The OTA bundle is published into a single `updates/<runtimeVersion>/` folder that
  serves both platforms.
- `npm run ota:verify` is the gate: it must show both native files embed the
  `app.json` value. No fingerprint/frozen-install/same-pnpm requirement anymore.

## Steps

1. **Get the release source** (same branch the Mac built; a matching commit is good
   hygiene but only the `app.json` `runtimeVersion` must agree):
   ```sh
   cd mobile
   git fetch origin && git checkout main && git pull --ff-only
   pnpm install            # frozen install still recommended for a clean build
   ```
2. **Verify the runtimeVersion is embedded** — must print the same value on both
   rows (it reads `app.json`):
   ```sh
   npm run ota:verify
   ```
   If it shows drift, run `npm run ota:sync-version` and commit.
3. **Build the release APK** (syncs the runtimeVersion into the native files first,
   then runs Gradle — no device/emulator needed):
   ```sh
   npm run android:apk
   ```
   Output: `android/app/build/outputs/apk/release/app-release.apk`
4. **Publish the OTA bundle:**
   ```sh
   npm run ota:publish
   ```
   This exports the JS bundle and writes it to `../api/updates/<runtimeVersion>/`
   (one folder for both platforms; override the location with `UPDATES_DEST=...`).
5. **Deploy the updates folder** to the live API host if it isn't already there:
   ```sh
   rsync -avz ../api/updates/ <prod-api-host>:/path/to/api/updates/
   ```

## Environment prerequisites (verify before building)

- **Android signing:** a release keystore + `signingConfigs.release` must be
  configured. An unsigned/debug APK won't be installable as a release.
- **New store submission?** Bump `versionCode` (and `versionName`) in
  `android/app/build.gradle`. This is independent of `runtimeVersion` — but note
  that any **native** change you ship also means bumping `app.json`
  `runtimeVersion` and rebuilding both platforms (see OTA_FINGERPRINT_SYNC.md).
- **API OTA env (production):** `UPDATES_PUBLIC_URL=https://api.ankaadesign.com.br`
  must be set (asset URLs must be absolute HTTPS for iOS ATS). The API serves from
  `UPDATES_ROOT` (defaults to `<cwd>/updates`).
- **JDK / Android SDK** present and `ANDROID_HOME` set for Gradle.
