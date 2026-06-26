# Android release signing — permanent keystore

This directory holds the **one, permanent** Android release-signing keystore for
`com.ankaadesign.management`. Everything except this README and
`keystore.properties.example` is **gitignored** (the `.keystore` binary and the
`keystore.properties` passwords never enter git).

## Why this exists (root cause of the "SHA-256 always shifts" problem)

Android App Links auto-verify works by comparing the **SHA-256 fingerprint of the
certificate that signed the installed APK** against the fingerprint pinned in
`assetlinks.json` (served at `https://ankaadesign.com.br/.well-known/assetlinks.json`
and the API mirror). If the two differ, the OS refuses to auto-open
`https://ankaadesign.com.br/...` links in the app.

Previously the release APK was signed with an **EAS-managed / regenerated
keystore** (alias `6111b0c119e8ec6808bde21de69c1e37`) that was **gitignored and not
kept locally**. Every fresh `eas build` / `expo prebuild` / clean machine produced
a *different* keystore → a *different* SHA-256 → `assetlinks.json` (which pins
`BC:72:57:60:…:AE:5B`) no longer matched → verification broke. That is the
"fingerprint shifts and breaks my workflow" symptom.

**The fix:** generate the keystore ONCE, store it here permanently, reuse it for
every release build, and pin its fingerprint in `assetlinks.json`. A keystore's
fingerprint is immutable, so once pinned it never shifts again.

## One-time setup

```bash
# From the repo root. Prompts for store/key passwords; writes ankaa-release.keystore here.
./scripts/generate-release-keystore.sh
```

Then copy the four `ANKAA_*` values into `~/.gradle/gradle.properties`
(see `keystore.properties.example`).

## Print the STABLE SHA-256 (paste this into assetlinks.json)

```bash
keytool -list -v \
  -keystore mobile/credentials/ankaa-release.keystore \
  -alias ankaa | grep -A1 SHA256
```

Take the `SHA256:` line and put the colon-separated value into the
`sha256_cert_fingerprints` array of BOTH:
- `web/public/.well-known/assetlinks.json`
- `api/public/.well-known/assetlinks.json`

(Those two files are owned/documented by another agent.)

## Critical rules

- **Never regenerate** this keystore once `assetlinks.json` is pinned to its
  fingerprint. Losing it = re-pinning a new fingerprint everywhere + a window
  where App Links don't verify.
- **Back it up** (the `.keystore` file AND both passwords) in a password
  manager / encrypted vault. It is gitignored, so git is NOT your backup.
- Local release builds read it via `mobile/android/app/build.gradle`
  (`signingConfigs.release`), which resolves the four `ANKAA_*` Gradle properties.
