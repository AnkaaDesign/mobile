#!/usr/bin/env node
/**
 * Sync the automatic OTA runtimeVersion fingerprints into the native files the
 * update client reads at runtime:
 *   - ios/.../Supporting/Expo.plist     → EXUpdatesRuntimeVersion  (iOS fingerprint)
 *   - android/.../res/values/expo_runtime.xml → expo_runtime_version (Android fingerprint)
 *
 * iOS and Android get DIFFERENT values — this is exactly what Expo's own
 * build-time fingerprint injection produces, so the embedded value always
 * matches what the publish step serves.
 *
 * Both files are listed in `.fingerprintignore`, so writing into them does NOT
 * change the fingerprint (no feedback loop). `app.json` keeps the constant
 * `runtimeVersion: { "policy": "fingerprint" }` and is never rewritten.
 *
 * Run this as the LAST step before a native build (after any `expo prebuild`):
 *   npm run ota:sync-version
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { computeRuntimeVersions, mobileRoot } from "./ota-version.mjs";

const EXPO_PLIST = join(mobileRoot, "ios", "AnkaaDesign", "Supporting", "Expo.plist");
const ANDROID_RES = join(
  mobileRoot,
  "android",
  "app",
  "src",
  "main",
  "res",
  "values",
  "expo_runtime.xml",
);

console.log("[ota] computing runtimeVersion fingerprints (iOS + Android)...");
const { ios, android } = computeRuntimeVersions();
console.log(`[ota] iOS runtimeVersion:     ${ios}`);
console.log(`[ota] Android runtimeVersion: ${android}`);

// iOS — replace (or insert) EXUpdatesRuntimeVersion in Expo.plist.
let plist = readFileSync(EXPO_PLIST, "utf8");
if (/<key>EXUpdatesRuntimeVersion<\/key>\s*<string>[^<]*<\/string>/.test(plist)) {
  plist = plist.replace(
    /(<key>EXUpdatesRuntimeVersion<\/key>\s*<string>)[^<]*(<\/string>)/,
    `$1${ios}$2`,
  );
} else {
  plist = plist.replace(
    /(<key>EXUpdatesEnabled<\/key>)/,
    `<key>EXUpdatesRuntimeVersion</key>\n    <string>${ios}</string>\n    $1`,
  );
}
writeFileSync(EXPO_PLIST, plist);

// Android — replace the expo_runtime_version string resource value.
let res = readFileSync(ANDROID_RES, "utf8");
res = res.replace(
  /(<string name="expo_runtime_version"[^>]*>)[^<]*(<\/string>)/,
  `$1${android}$2`,
);
writeFileSync(ANDROID_RES, res);

console.log("[ota] synced Expo.plist (iOS) and expo_runtime.xml (Android).");
