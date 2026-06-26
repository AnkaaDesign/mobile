# Keeping OTA runtimeVersion in sync (server ↔ iOS ↔ Android)

> **2026-06-25 — model change.** We replaced the Expo **fingerprint policy** with a
> **static `runtimeVersion` string** declared in `app.json`. The fingerprint was a
> hash of `node_modules` / `Podfile.lock` / the native dirs, so it drifted between
> the Mac (iOS build), the PC (Android build) and the Linux box (OTA publish) — the
> binary embedded one hash while the server published under another, and updates
> silently never applied. A hand-bumped string removes every cross-machine
> variable. This doc is the current, authoritative runbook.

The OTA system matches an installed app to the bundle the server serves using a
**runtimeVersion** — now a single static string (e.g. `"7"`) that is the SAME for
both platforms. JS-only changes keep it (so OTA applies); native changes require
bumping it (so a new store/dev build is required).

## The one invariant

All of these must be the **same string** — and they no longer depend on the build
machine, the installed deps, or the git commit:

```
app.json expo.runtimeVersion
  == EXUpdatesRuntimeVersion in ios/AnkaaDesign/Supporting/Expo.plist
  == expo_runtime_version in android/app/src/main/res/values/expo_runtime.xml
  == the folder name on the OTA server: updates/<runtimeVersion>/
```

`app.json` is the single source of truth. `npm run ota:sync-version` copies it
into the two native files; `npm run ota:publish` exports into `updates/<value>/`.
**One** server folder serves both platforms — the server reads `metadata.json` and
hands each platform its own bundle.

## The rule (this is the whole thing)

> **Bump `expo.runtimeVersion` in `app.json` ONLY when you ship a new native
> binary** (a native code / dependency / config change). Then `ota:sync-version`,
> rebuild + redistribute both binaries, and `ota:publish`. For JS-only changes,
> leave it unchanged and just `ota:publish` — installed binaries pick it up.

Because the value is static, there is **no** "same commit / frozen install / pnpm
pin" requirement for OTA correctness anymore. iOS can be built on the Mac, Android
on the PC, and the OTA published from Linux — all independently — as long as every
one of them carries the same `app.json` `runtimeVersion`.

### Bump for a new native release

1. Edit `app.json` → `"runtimeVersion": "8"` (next integer). Commit.
2. `npm run ota:sync-version` (writes `8` into the two native files). Commit.
3. Rebuild **both** binaries — iOS (`npm run ios:release`) and Android
   (`npm run android:apk` / `:release`); both run `ota:sync-version` first as a
   safety net. Distribute them.
4. `npm run ota:publish` → deploy `api/updates/` to the production host. Now
   `updates/8/` exists and the new binaries (which embed `8`) consume it.

> Binaries already in the field still embed their OLD runtimeVersion and will NOT
> jump to a new one — that's by design (a native change is not OTA-safe). They keep
> getting OTA updates published under their own value until users install the new
> build. If you must reach an old field build over OTA, publish a JS-only bundle
> under that build's value too.

### Ship a JS-only OTA update (no new store build, the common case)

1. Make JS changes in `src/`, commit. (`app.json` `runtimeVersion` is unchanged.)
2. `npm run ota:verify` (sanity: native files still embed the app.json value).
3. `npm run ota:publish`, then deploy `api/updates/`. Existing binaries pick it up.

## Guards

- **`npm run ota:verify`** — fails loudly if either native file embeds a value
  other than `app.json`'s. Use it in builds / publish / CI / a git hook.
- **`npm run ota:publish`** runs `ota:verify` first, so the server never serves a
  runtimeVersion no built binary embeds. (`OTA_SKIP_VERIFY=1` overrides — don't.)
- **`*:release` / `*:apk`** run `ota:sync-version` first, so a binary can't embed a
  stale value.

## Quick reference

| Command | What it does |
|---------|--------------|
| `npm run ota:verify` | Fail if the native files don't embed `app.json`'s `runtimeVersion`. |
| `npm run ota:sync-version` | Write `app.json`'s `runtimeVersion` into Expo.plist + expo_runtime.xml. |
| `npm run ios:release` | Sync → build Release → install to connected iPhone (`IOS_DEVICE_UDID` to pick a device). |
| `npm run android:apk` | Sync → Gradle `assembleRelease` → `app-release.apk`. |
| `npm run ota:publish` | Verify → `expo export` → publish bundle to `updates/<runtimeVersion>/`. |

`fingerprint.config.js` and `.fingerprintignore` are now vestigial (the
fingerprint policy is no longer used) and can be deleted whenever convenient.
