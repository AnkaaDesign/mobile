#!/usr/bin/env node
/**
 * Build + install a Release iOS build to a connected iPhone, with the OTA
 * runtimeVersion ALWAYS synced first so the binary embeds the current
 * fingerprint (never a stale cache).
 *
 * Steps:
 *   1. `npm run ota:sync-version`  — write the current iOS/Android fingerprints
 *                                    into the native files.
 *   2. resolve the connected device UDID (or honor $IOS_DEVICE_UDID).
 *   3. `expo run:ios --configuration Release --device <udid>`.
 *
 * Note: `expo run:ios` builds, installs, and tries to launch. If the launch
 * fails because the phone is locked, just unlock and tap the app — the binary
 * is already installed. (Alternatively install the built .app with
 * `xcrun devicectl device install app`.)
 *
 * Usage:
 *   npm run ios:release                       # auto-detect the one connected device
 *   IOS_DEVICE_UDID=<udid> npm run ios:release
 */
import { execFileSync, execSync } from "node:child_process";
import { mobileRoot } from "./ota-version.mjs";

function resolveDevice() {
  if (process.env.IOS_DEVICE_UDID) return process.env.IOS_DEVICE_UDID;
  const out = execFileSync("xcrun", ["devicectl", "list", "devices"], { encoding: "utf8" });
  // Match the 36-char UUID-style identifier on rows reporting a paired device.
  const ids = out
    .split("\n")
    .filter((l) => /\bavailable\b|\bconnected\b/i.test(l))
    .map((l) => (l.match(/\b[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}\b/i) || [])[0])
    .filter(Boolean);
  if (ids.length === 0) {
    throw new Error("No connected iPhone found. Connect a device or set IOS_DEVICE_UDID.");
  }
  if (ids.length > 1) {
    throw new Error(`Multiple devices found (${ids.join(", ")}). Set IOS_DEVICE_UDID to pick one.`);
  }
  return ids[0];
}

console.log("[ios:release] syncing OTA runtimeVersion into native files...");
execSync("npm run ota:sync-version", { cwd: mobileRoot, stdio: "inherit" });

const udid = resolveDevice();
console.log(`[ios:release] building Release onto device ${udid}...`);
execSync(`npx expo run:ios --configuration Release --device ${udid}`, {
  cwd: mobileRoot,
  stdio: "inherit",
});
