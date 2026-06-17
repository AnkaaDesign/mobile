const { SourceSkips } = require("@expo/fingerprint");

/**
 * OTA runtimeVersion fingerprint configuration.
 *
 * The fingerprint hashes everything that affects NATIVE runtime compatibility.
 * By default it also hashes the entire `scripts` block of package.json, which
 * means adding a harmless npm script (e.g. `ota:verify`) would bump the
 * runtimeVersion and force a new store build for no real reason.
 *
 * `PackageJsonScriptsAll` excludes the `scripts` field entirely, so script-only
 * edits keep the same fingerprint (and OTA keeps working). Real native changes —
 * dependencies, native dirs, app config — still bump it as they should.
 *
 * Read by `expo-updates fingerprint:generate` (via scripts/ota-version.mjs),
 * `expo prebuild`, and EAS, so every producer agrees on the same value.
 *
 * @type {import('@expo/fingerprint').Config}
 */
module.exports = {
  sourceSkips: SourceSkips.PackageJsonScriptsAll,
};
