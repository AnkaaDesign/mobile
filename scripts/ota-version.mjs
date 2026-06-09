/**
 * Shared OTA runtime-version computation.
 *
 * The runtimeVersion is an automatic, deterministic "fingerprint" of everything
 * that affects the NATIVE runtime (native dirs, package.json, config plugins,
 * app icons) — but NOT your JS/business code in `src/`. That is exactly what we
 * want: JS-only changes keep the same runtimeVersion (so OTA updates apply),
 * while native changes bump it (so a new store build is required).
 *
 * iOS and Android fingerprints differ, so we combine them into ONE version
 * string shared by both platforms. It is content-derived, so any clone of the
 * repo (built on any machine) produces the same value — provided node_modules
 * is installed from the committed lockfile (use a frozen install in CI/builds).
 */
import { execFileSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const mobileRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const updatesCli = join(mobileRoot, "node_modules", "expo-updates", "bin", "cli.js");

/** Run `expo-updates fingerprint:generate` for a platform and return its hash. */
function platformFingerprint(platform) {
  const out = execFileSync(
    process.execPath,
    [updatesCli, "fingerprint:generate", "--platform", platform],
    { cwd: mobileRoot, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
  );
  const { hash } = JSON.parse(out);
  if (!hash || typeof hash !== "string") {
    throw new Error(`fingerprint:generate returned no hash for ${platform}`);
  }
  return hash;
}

/**
 * Compute the per-platform runtimeVersion fingerprints.
 *
 * iOS and Android intentionally get DIFFERENT values — this matches exactly what
 * Expo's own build-time fingerprint injection produces, so the value the binary
 * embeds and the value the server serves always agree, whether it was written by
 * `sync-runtime-version.mjs` or by Expo's build.
 *
 * @returns {{ ios: string, android: string }}
 */
export function computeRuntimeVersions() {
  return {
    ios: platformFingerprint("ios"),
    android: platformFingerprint("android"),
  };
}

export { mobileRoot };
