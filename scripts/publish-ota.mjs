#!/usr/bin/env node
/**
 * Publish an OTA (over-the-air) update to the self-hosted Expo Updates server.
 *
 * Steps:
 *   1. Verify the native files embed app.json's static runtimeVersion (drift guard).
 *   2. `npx expo export` the JS bundle + assets for iOS and Android (one export
 *      contains both platforms, keyed inside metadata.json).
 *   3. Copy the export into  <UPDATES_DEST>/<runtimeVersion>/  — a SINGLE folder
 *      shared by both platforms, because the runtimeVersion is one static string.
 *      The server reads metadata.json and serves each platform its own bundle.
 *   4. Write an `expo-publish.json` sidecar (createdAt + git commit) used by the
 *      API to populate the manifest's `createdAt`.
 *
 * Usage:
 *   node scripts/publish-ota.mjs                  # exports to ../api/updates
 *   UPDATES_DEST=/srv/api/updates node scripts/publish-ota.mjs
 *
 * After running locally, deploy the folder to the production API host, e.g.:
 *   rsync -avz ../api/updates/ user@server:/path/to/api/updates/
 *
 * IMPORTANT: only the JS bundle ships OTA. A change to native code, native
 * config, or a native dependency requires bumping `expo.runtimeVersion` in
 * app.json AND a new store build (old binaries correctly keep their own version).
 */
import { execSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { getRuntimeVersion, mobileRoot } from "./ota-version.mjs";

// Guard: refuse to publish unless the native files already embed the current
// runtimeVersion. Otherwise we'd serve an update under a runtimeVersion that no
// freshly-built binary embeds. Skip with OTA_SKIP_VERIFY=1 only if you know
// the binaries were built from this exact app.json by another means.
if (process.env.OTA_SKIP_VERIFY !== "1") {
  console.log("[ota] verifying native files are in sync before publishing...");
  execSync("node scripts/verify-runtime-version.mjs", { cwd: mobileRoot, stdio: "inherit" });
}

const runtimeVersion = getRuntimeVersion();
console.log(`[ota] runtimeVersion: ${runtimeVersion}`);

const dest = resolve(mobileRoot, process.env.UPDATES_DEST || "../api/updates");
const exportDir = join(mobileRoot, "ota-dist");

console.log(`[ota] exporting bundle...`);
rmSync(exportDir, { recursive: true, force: true });
execSync(
  `npx expo export --platform ios --platform android --output-dir "${exportDir}"`,
  { cwd: mobileRoot, stdio: "inherit" },
);

if (!existsSync(join(exportDir, "metadata.json"))) {
  console.error("[ota] export failed: metadata.json not found.");
  process.exit(1);
}

let commit = "unknown";
try {
  commit = execSync("git rev-parse --short HEAD", { cwd: mobileRoot }).toString().trim();
} catch {
  /* not a git repo / git unavailable */
}
const createdAt = new Date().toISOString();

// Publish the export under the single runtimeVersion folder. Stage into a
// sibling temp dir first, then swap it in with a near-atomic rename so the live
// folder never exists in a half-copied state.
const targetDir = join(dest, runtimeVersion);
const stagingDir = `${targetDir}.tmp`;
console.log(`[ota] publishing -> ${targetDir}`);
rmSync(stagingDir, { recursive: true, force: true });
mkdirSync(stagingDir, { recursive: true });
cpSync(exportDir, stagingDir, { recursive: true });
writeFileSync(
  join(stagingDir, "expo-publish.json"),
  JSON.stringify({ runtimeVersion, createdAt, commit }, null, 2),
);
rmSync(targetDir, { recursive: true, force: true });
renameSync(stagingDir, targetDir);

rmSync(exportDir, { recursive: true, force: true });

console.log(`[ota] done. Published commit ${commit} under runtimeVersion ${runtimeVersion}.`);
console.log(`[ota] deploy '${dest}' to the production API host if it is remote.`);
