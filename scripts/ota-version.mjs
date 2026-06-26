/**
 * Shared OTA runtime-version resolution — SINGLE SOURCE OF TRUTH.
 *
 * The runtimeVersion is a STATIC string declared once in `app.json`
 * (`expo.runtimeVersion`). It is identical on every machine and for BOTH
 * platforms, and the OTA server serves updates from a folder named exactly after
 * it (`updates/<runtimeVersion>/`).
 *
 * Why NOT the fingerprint policy:
 *   A fingerprint is recomputed from node_modules / Podfile.lock / the native
 *   dirs, so it DRIFTS between the Mac that builds iOS, the PC that builds
 *   Android, and the Linux box that publishes the OTA. The binary then embeds one
 *   hash while the server publishes under another, and updates silently never
 *   apply. (The Android Gradle build even recomputed and overwrote the synced
 *   value at build time.) A hand-bumped integer removes every such variable.
 *
 * Bump `expo.runtimeVersion` ONLY when you ship a new native binary (a native
 * code / dependency / config change). JS-only changes keep the same value, so
 * OTA updates apply to the installed binaries.
 */
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const mobileRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Read the static OTA runtimeVersion from app.json. Both platforms share it.
 *
 * @returns {string} e.g. "7"
 */
export function getRuntimeVersion() {
  const appJson = JSON.parse(readFileSync(join(mobileRoot, "app.json"), "utf8"));
  const rv = appJson?.expo?.runtimeVersion;
  if (typeof rv !== "string" || rv.trim() === "") {
    throw new Error(
      `app.json expo.runtimeVersion must be a non-empty STATIC string (got ${JSON.stringify(rv)}).\n` +
        `The self-hosted OTA workflow requires a static runtimeVersion, not a { policy } object.`,
    );
  }
  return rv.trim();
}

export { mobileRoot };
