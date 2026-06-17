#!/usr/bin/env node
/**
 * Verify that the OTA runtimeVersion fingerprints embedded in the native files
 * match what the current source tree actually fingerprints to.
 *
 *   ios/.../Supporting/Expo.plist            EXUpdatesRuntimeVersion   (iOS)
 *   android/.../res/values/expo_runtime.xml  expo_runtime_version      (Android)
 *
 * This is the drift guard. It is the single source of truth for the question
 * "would a build from this tree embed the same fingerprint the OTA server
 * serves?". It exits non-zero on any mismatch so it can gate builds, the
 * publish step, CI, and git hooks.
 *
 * Why drift happens: the embedded values are a CACHE written by
 * `ota:sync-version`. Anything that changes native compatibility (a dependency
 * bump, an app.json/native edit, a merge) shifts the computed fingerprint, and
 * the cache silently goes stale until someone re-syncs. This script makes that
 * staleness loud instead of silent.
 *
 * Usage:
 *   npm run ota:verify            # fail on drift (use in build/publish/CI)
 *   npm run ota:verify -- --warn  # report only, never fail (diagnostic)
 */
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { computeRuntimeVersions, mobileRoot } from "./ota-version.mjs";

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

/** Is the git working tree clean? A dirty tree fingerprints to a value that no committed/published state will match. */
function isTreeClean() {
  try {
    return execSync("git status --porcelain", { cwd: mobileRoot, encoding: "utf8" }).trim() === "";
  } catch {
    return null; // not a git repo / git unavailable — can't tell
  }
}

console.log("[ota:verify] computing runtimeVersion fingerprints (iOS + Android)...");
const computed = computeRuntimeVersions();
const embedded = { ios: readEmbeddedIos(), android: readEmbeddedAndroid() };

const rows = [
  { platform: "iOS", computed: computed.ios, embedded: embedded.ios },
  { platform: "Android", computed: computed.android, embedded: embedded.android },
];

let drift = false;
for (const r of rows) {
  const ok = r.computed === r.embedded;
  if (!ok) drift = true;
  console.log(
    `  ${ok ? "✅" : "❌"} ${r.platform.padEnd(8)} computed=${r.computed}  embedded=${r.embedded ?? "(missing)"}`,
  );
}

const clean = isTreeClean();
if (clean === false) {
  console.warn(
    "[ota:verify] ⚠️  git working tree is DIRTY — this fingerprint reflects uncommitted changes and\n" +
      "             will not match any committed build or published OTA. Commit before building/publishing.",
  );
}

if (!drift) {
  console.log("[ota:verify] ✅ native files are in sync with the current tree.");
  process.exit(0);
}

console.error(
  "\n[ota:verify] ❌ DRIFT DETECTED — the native files embed a stale runtimeVersion.\n" +
    "             A build from this tree would NOT match the embedded value (and may not\n" +
    "             receive the OTA updates the server serves for it).\n" +
    "             Fix: run `npm run ota:sync-version`, then REBUILD the native binary.\n",
);
process.exit(warnOnly ? 0 : 1);
