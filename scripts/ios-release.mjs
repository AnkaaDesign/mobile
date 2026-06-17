#!/usr/bin/env node
/**
 * Build + install a Release iOS build to a connected iPhone, with the OTA
 * runtimeVersion ALWAYS synced first so the binary embeds the current
 * fingerprint (never a stale cache).
 *
 * We drive xcodebuild + devicectl directly instead of `expo run:ios --device`
 * because:
 *   - expo's device resolution breaks on recent Xcode ("Unexpected devicectl
 *     JSON version output"), and it expects the hardware UDID
 *     (e.g. 00008101-00116521142B001E from `xctrace list devices`), NOT the
 *     CoreDevice identifier (a UUID from `devicectl list devices`).
 *   - `expo run:ios` also tries to LAUNCH the app, which fails (exit 1) when the
 *     phone is locked — even though install succeeded. xcodebuild has no launch
 *     step, so the build never fails for that reason.
 *
 * Steps:
 *   1. `npm run ota:sync-version` — write current fingerprints into native files.
 *   2. resolve the CoreDevice identifier used by `devicectl` to install.
 *   3. `xcodebuild ... -configuration Release -destination generic/platform=iOS`.
 *   4. `xcrun devicectl device install app` the built .app onto the phone.
 *
 * Usage:
 *   npm run ios:release                      # auto-detect the one connected device
 *   IOS_DEVICE_ID=<coredevice-id> npm run ios:release
 */
import { execFileSync, execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { mobileRoot } from "./ota-version.mjs";

const IOS_DIR = join(mobileRoot, "ios");
const WORKSPACE = "AnkaaDesign.xcworkspace";
const SCHEME = "AnkaaDesign";
const DERIVED = join(IOS_DIR, "build");
const APP_PATH = join(DERIVED, "Build", "Products", "Release-iphoneos", "AnkaaDesign.app");

/** CoreDevice identifier (UUID) for the connected device — what `devicectl install` wants. */
function resolveDeviceId() {
  if (process.env.IOS_DEVICE_ID) return process.env.IOS_DEVICE_ID;
  const out = execFileSync("xcrun", ["devicectl", "list", "devices"], { encoding: "utf8" });
  const ids = out
    .split("\n")
    .filter((l) => /\bavailable\b|\bconnected\b/i.test(l))
    .map((l) => (l.match(/\b[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}\b/i) || [])[0])
    .filter(Boolean);
  if (ids.length === 0) throw new Error("No connected iPhone found (devicectl). Set IOS_DEVICE_ID.");
  if (ids.length > 1) throw new Error(`Multiple devices found (${ids.join(", ")}). Set IOS_DEVICE_ID.`);
  return ids[0];
}

console.log("[ios:release] syncing OTA runtimeVersion into native files...");
execSync("npm run ota:sync-version", { cwd: mobileRoot, stdio: "inherit" });

const deviceId = resolveDeviceId();

console.log("[ios:release] building Release (xcodebuild, generic iOS device)...");
execFileSync(
  "xcodebuild",
  [
    "-workspace", WORKSPACE,
    "-scheme", SCHEME,
    "-configuration", "Release",
    "-destination", "generic/platform=iOS",
    "-derivedDataPath", DERIVED,
    "-allowProvisioningUpdates",
    "build",
  ],
  { cwd: IOS_DIR, stdio: "inherit", env: { ...process.env, NODE_ENV: "production" } },
);

if (!existsSync(APP_PATH)) {
  throw new Error(`Build reported success but no app at ${APP_PATH}`);
}

console.log(`[ios:release] installing to device ${deviceId} via devicectl...`);
execFileSync("xcrun", ["devicectl", "device", "install", "app", "--device", deviceId, APP_PATH], {
  stdio: "inherit",
});
console.log("[ios:release] ✅ installed. Unlock the iPhone and tap the app to launch.");
