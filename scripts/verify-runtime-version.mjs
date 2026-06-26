#!/usr/bin/env node
/**
 * Verify that the OTA runtimeVersion embedded in the native files matches the
 * static value declared in app.json:
 *
 *   ios/.../Supporting/Expo.plist            EXUpdatesRuntimeVersion
 *   android/.../res/values/expo_runtime.xml  expo_runtime_version
 *
 * This is the drift guard. A build whose native files embed a value other than
 * app.json's would request `updates/<wrong>/` and never receive the OTA the
 * server publishes under app.json's value. It exits non-zero on any mismatch so
 * it can gate builds, the publish step, CI, and git hooks.
 *
 * Fix on drift: `npm run ota:sync-version`, then REBUILD the native binary.
 *
 * Usage:
 *   npm run ota:verify            # fail on drift (use in build/publish/CI)
 *   npm run ota:verify -- --warn  # report only, never fail (diagnostic)
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getRuntimeVersion, mobileRoot } from "./ota-version.mjs";

const EXPO_PLIST = join(mobileRoot, "ios", "AnkaaDesign", "Supporting", "Expo.plist");
const ANDROID_RES = join(mobileRoot, "android", "app", "src", "main", "res", "values", "expo_runtime.xml");

const warnOnly = process.argv.includes("--warn");

/** Read the iOS runtimeVersion currently embedded in Expo.plist. */
function readEmbeddedIos() {
  const plist = readFileSync(EXPO_PLIST, "utf8");
  const m = plist.match(/<key>EXUpdatesRuntimeVersion<\/key>\s*<string>([^<]*)<\/string>/);
  return m ? m[1].trim() : null;
}

/** Read the Android runtimeVersion currently embedded in expo_runtime.xml. */
function readEmbeddedAndroid() {
  const res = readFileSync(ANDROID_RES, "utf8");
  const m = res.match(/<string name="expo_runtime_version"[^>]*>([^<]*)<\/string>/);
  return m ? m[1].trim() : null;
}

const expected = getRuntimeVersion();
const embedded = { ios: readEmbeddedIos(), android: readEmbeddedAndroid() };

console.log(`[ota:verify] app.json runtimeVersion = ${expected}`);

const rows = [
  { platform: "iOS", embedded: embedded.ios },
  { platform: "Android", embedded: embedded.android },
];

let drift = false;
for (const r of rows) {
  const ok = r.embedded === expected;
  if (!ok) drift = true;
  console.log(
    `  ${ok ? "✅" : "❌"} ${r.platform.padEnd(8)} embedded=${r.embedded ?? "(missing)"}  expected=${expected}`,
  );
}

if (!drift) {
  console.log("[ota:verify] ✅ native files embed the app.json runtimeVersion.");
  process.exit(0);
}

console.error(
  "\n[ota:verify] ❌ DRIFT DETECTED — a native file embeds a runtimeVersion other than app.json's.\n" +
    "             A build from this tree would NOT receive the OTA updates served for app.json's value.\n" +
    "             Fix: run `npm run ota:sync-version`, then REBUILD the native binary.\n",
);
process.exit(warnOnly ? 0 : 1);
