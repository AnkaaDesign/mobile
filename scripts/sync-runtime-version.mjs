#!/usr/bin/env node
/**
 * Write the static OTA runtimeVersion (from app.json) into the native files the
 * update client reads at runtime:
 *   - ios/.../Supporting/Expo.plist            → EXUpdatesRuntimeVersion
 *   - android/.../res/values/expo_runtime.xml  → expo_runtime_version
 *
 * Both platforms get the SAME value (app.json `expo.runtimeVersion`), so a single
 * published `updates/<runtimeVersion>/` folder serves both. This keeps the
 * embedded value, the app.json value, and the served folder name in lock-step.
 *
 * Run this as the LAST step before a native build (the `*:release` / `*:apk`
 * scripts already do). It is idempotent — re-running with an unchanged app.json
 * is a no-op.
 *
 *   npm run ota:sync-version
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { getRuntimeVersion, mobileRoot } from "./ota-version.mjs";

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

const runtimeVersion = getRuntimeVersion();
console.log(`[ota] static runtimeVersion (iOS + Android): ${runtimeVersion}`);

// iOS — replace (or insert) EXUpdatesRuntimeVersion in Expo.plist.
let plist = readFileSync(EXPO_PLIST, "utf8");
if (/<key>EXUpdatesRuntimeVersion<\/key>\s*<string>[^<]*<\/string>/.test(plist)) {
  plist = plist.replace(
    /(<key>EXUpdatesRuntimeVersion<\/key>\s*<string>)[^<]*(<\/string>)/,
    `$1${runtimeVersion}$2`,
  );
} else {
  plist = plist.replace(
    /(<key>EXUpdatesEnabled<\/key>)/,
    `<key>EXUpdatesRuntimeVersion</key>\n    <string>${runtimeVersion}</string>\n    $1`,
  );
}
writeFileSync(EXPO_PLIST, plist);

// Android — replace the expo_runtime_version string resource value.
let res = readFileSync(ANDROID_RES, "utf8");
res = res.replace(
  /(<string name="expo_runtime_version"[^>]*>)[^<]*(<\/string>)/,
  `$1${runtimeVersion}$2`,
);
writeFileSync(ANDROID_RES, res);

console.log("[ota] synced Expo.plist (iOS) and expo_runtime.xml (Android).");
