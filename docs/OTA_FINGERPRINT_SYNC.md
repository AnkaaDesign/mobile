# Keeping OTA fingerprints in sync (server ↔ iOS ↔ Android)

The OTA system matches an installed app to the bundle the server serves using a
**runtimeVersion** — a per-platform `@expo/fingerprint` hash of everything that
affects native compatibility (native dirs, dependencies, app config). JS-only
changes keep the same fingerprint (so OTA applies); native changes bump it (so a
new store/dev build is required).

## The one invariant

For **each platform**, all three of these must be the same string:

```
value embedded in the binary  ==  folder name on the OTA server  ==  computeRuntimeVersions()[platform]
```

…all computed from the **same git commit** with the **same installed deps**.

- iOS embeds it in `ios/AnkaaDesign/Supporting/Expo.plist` (`EXUpdatesRuntimeVersion`).
- Android embeds it in `android/app/src/main/res/values/expo_runtime.xml` (`expo_runtime_version`).
- The server stores each published bundle in `updates/<fingerprint>/`.

iOS and Android have **different** fingerprints — that's expected.

## Why drift happens (and how this repo prevents it)

The embedded values are a **cache** written by `ota:sync-version`. Anything that
changes native compatibility (a dependency bump, an `app.json` edit, a merge)
shifts the computed fingerprint, and the cache silently goes stale until someone
re-syncs. Guards:

1. **`fingerprint.config.js`** skips the `scripts` block of `package.json`
   (`PackageJsonScriptsAll`), so adding npm scripts never bumps the fingerprint.
2. **`npm run ota:verify`** computes both fingerprints, compares them to the two
   native files, and **fails loudly** on drift (and warns on a dirty git tree).
3. **`npm run ios:release` / `npm run android:release`** run `ota:sync-version`
   *first*, so a binary can never embed a stale value.
4. **`npm run ota:publish`** runs `ota:verify` before publishing, so the server
   never serves a fingerprint that no freshly-built binary embeds.

## The discipline (this is the whole rule)

> Build iOS, build Android, and publish OTA from the **same git commit**, each on
> a **frozen install** (`npm ci`). Per-platform fingerprints then match
> automatically across machines.

### Release a native build + OTA

1. Commit everything. Confirm the tree is clean (`git status`).
2. **iOS (this Mac):** `npm ci && npm run ios:release`
   (syncs the fingerprint, builds Release, installs to the connected iPhone).
3. **Android (server):** `npm ci && npm run android:release`
   (whatever the server's build pipeline is, it must run `ota:sync-version`
   first — `android:release` does this for you).
4. **Publish OTA (from the same commit/deps):** `npm run ota:publish`
   then deploy `api/updates/` to the production host. The verify guard refuses to
   publish if the native files don't match the current tree.

### Ship a JS-only OTA update (no new store build)

1. Make JS changes, commit. `npm run ota:verify` must still pass (fingerprint
   unchanged because nothing native changed).
2. `npm run ota:publish` and deploy `api/updates/`. Existing binaries pick it up.

## Cross-machine reproducibility

The fingerprint depends on installed dependencies, so the iOS Mac and the Android
server **must install from the committed lockfile** (`npm ci`, not `npm install`)
and build from the same commit. Otherwise the same source can fingerprint
differently per machine.

## Quick reference

| Command | What it does |
|---------|--------------|
| `npm run ota:verify` | Report drift between native files and the current tree; exit 1 on mismatch. |
| `npm run ota:sync-version` | Write the current fingerprints into Expo.plist + expo_runtime.xml. |
| `npm run ios:release` | Sync → build Release → install to connected iPhone (`IOS_DEVICE_UDID` to pick a device). |
| `npm run android:release` | Sync → build Android release. |
| `npm run ota:publish` | Verify → export → publish bundle under each platform's fingerprint folder. |
