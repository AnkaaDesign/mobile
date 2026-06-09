# Self-Hosted OTA Updates (Expo Updates, no EAS)

The API serves over-the-air JS bundle updates to the mobile app directly, using
the Expo Updates protocol. No EAS Build / EAS Update involved — you build the
native binary locally and ship JS-only changes instantly from your own server.

## How it works

```
mobile app (expo-updates)                 API (NestJS)
  on launch / foreground  ── GET /updates/manifest ──▶  reads UPDATES_ROOT/<runtimeVersion>/
                          ◀── multipart manifest ────   builds + (optionally) signs manifest
  download bundle+assets  ── GET /updates/assets  ──▶   streams files from the export
  prompt user → reload
```

- **API module:** `api/src/modules/system/update/` (`UpdateController`, `UpdateService`).
- **Storage:** `api/updates/<runtimeVersion>/` — one published export per runtime version.
- **Mobile check:** `mobile/src/hooks/use-ota-updates.ts`, mounted in `src/app/_layout.tsx`.
- **Publish script:** `mobile/scripts/publish-ota.mjs` (`npm run ota:publish`).

## runtimeVersion — automatic via fingerprint

An OTA update is only delivered to a native build whose **runtimeVersion matches
the update**. We compute it **automatically** with `@expo/fingerprint`: a
deterministic hash of everything that affects the NATIVE runtime (native dirs,
`package.json`, config plugins, app icons) — but **not** your `src/` app code.

- **JS / business-logic changes** → fingerprint unchanged → update ships OTA. ✅
- **Native changes** (new native dep, native config, icon) → fingerprint changes
  → old binaries correctly ignore the update; you ship a new store build.

It is **deterministic and content-based**, so any clone of the repo, built on any
machine, produces the same value — *provided `node_modules` is installed from the
committed lockfile* (use a frozen install: `npm ci` / `pnpm i --frozen-lockfile`).

iOS and Android get **different** fingerprints (different native code), which is
exactly what Expo's own build injects. They live in:

| Where | Value |
| --- | --- |
| `app.json` → `expo.runtimeVersion` | `{ "policy": "fingerprint" }` (constant) |
| `ios/.../Expo.plist` → `EXUpdatesRuntimeVersion` | iOS fingerprint (written by sync) |
| `android/.../res/values/expo_runtime.xml` → `expo_runtime_version` | Android fingerprint (written by sync) |
| API folders `api/updates/<iosFp>/` + `api/updates/<androidFp>/` | per-platform |

> **`.fingerprintignore`** excludes `Expo.plist` and `expo_runtime.xml` from the
> hash. Without this, writing the computed value back into them would change the
> fingerprint on every run (a feedback loop). Those files hold only update config,
> so ignoring them is safe. **Do not remove `.fingerprintignore`.**

### Why a sync step?

This is a **bare** project, so `expo-updates` reads its runtimeVersion at runtime
from the native files (not `app.json`). `npm run ota:sync-version` writes the
current fingerprints into those files. It computes the **same** values Expo's
build-time injection would, so it's a safety net that guarantees the binary has
the right value even on a plain `xcodebuild`/`gradle` build.

## One-time activation (required once)

OTA was previously disabled. It only takes effect after **one** native rebuild +
store release. Build flow:

```bash
cd mobile
npm run ota:sync-version     # write current fingerprints into native files
# iOS:
expo run:ios --configuration Release --device <UDID>     # then archive/submit
# Android:
expo run:android --variant release                        # then submit APK/AAB
```

> If `expo run:*` re-runs prebuild, run `npm run ota:sync-version` again right
> before the actual Xcode/Gradle compile, or just rely on Expo's build-time
> injection — it produces the identical fingerprint either way.

From then on, every JS-only change ships via `npm run ota:publish` with no rebuild.

## API production setup

Set these env vars for the API process (PM2/systemd):

| Var | Required | Purpose |
| --- | --- | --- |
| `UPDATES_PUBLIC_URL` | **Yes (prod)** | Public HTTPS origin used to build asset URLs. Set to `https://api.ankaadesign.com.br`. Guarantees asset links are HTTPS regardless of proxy headers (iOS ATS requires HTTPS). |
| `UPDATES_ROOT` | No | Override the storage path. Defaults to `<cwd>/updates` (i.e. `api/updates`). |
| `EXPO_UPDATES_PRIVATE_KEY_PATH` | No | PEM RSA private key to enable code signing (see below). |
| `EXPO_UPDATES_KEY_ID` | No | Key id for the signature header (default `main`). |

nginx only needs to proxy `/updates/*` to the Node app like the rest of the API
(no special config; manifest responses are already `cache-control: private`).

## Publishing an update

```bash
cd mobile
npm run ota:publish    # exports → ../api/updates/<iosFp>/ and <androidFp>/
# if the API is on a remote host, deploy the folders:
rsync -avz ../api/updates/ user@server:/path/to/api/updates/
```

Devices pick it up on next launch / foreground and are prompted to restart.
(`ota:publish` computes the same fingerprints the binary embeds, so the folder
names always match the deployed binaries.)

## Optional: code signing (recommended for production)

Prevents a malicious server from pushing a forged update.

```bash
cd mobile
npx expo-updates codesigning:generate \
  --key-output-directory keys \
  --certificate-output-directory certificates \
  --certificate-validity-duration-years 10 \
  --certificate-common-name "Ankaa Design"
npx expo-updates codesigning:configure \
  --certificate-input-directory certificates \
  --key-input-directory keys
```

This adds `updates.codeSigningCertificate` + `codeSigningMetadata` to app config
(rebuild required). Then on the API set `EXPO_UPDATES_PRIVATE_KEY_PATH` to the
generated private key. The server signs every manifest; the app rejects unsigned
or mismatched updates.

> Enable signing on **both** sides together. If the app expects a signature but
> the server has no key, updates are rejected.

## Troubleshooting

- **No update delivered:** the binary's fingerprint doesn't match a published
  folder. Confirm the build had the synced value (`npm run ota:sync-version`) and
  that `api/updates/<fingerprint>/` exists. A native change since the build
  intentionally stops OTA — rebuild.
- **Fingerprint differs between machines:** node_modules drift. Install from the
  committed lockfile (`npm ci` / `pnpm i --frozen-lockfile`) and standardize on
  one package manager.
- **Update downloads over HTTP / iOS rejects:** set `UPDATES_PUBLIC_URL` to the
  HTTPS origin.
- **Nothing happens in dev / Expo Go:** expected — OTA is disabled there
  (`__DEV__` / `Updates.isEnabled === false`).
- **Print the current fingerprints:** `npm run ota:sync-version` (it logs both).
- **Verify the server manually** (use a real fingerprint from the sync output):
  ```bash
  curl -s -H "expo-platform: ios" -H "expo-runtime-version: <iosFp>" \
       -H "expo-protocol-version: 1" \
       https://api.ankaadesign.com.br/updates/manifest | head
  ```
  Expect a `multipart/mixed` body with a `manifest` part (or a `noUpdateAvailable`
  directive if nothing is published yet).
