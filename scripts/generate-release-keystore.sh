#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Generate the ONE permanent Android release-signing keystore.
#
# Run this exactly once. The resulting keystore's SHA-256 fingerprint is the
# stable identity pinned in assetlinks.json — reuse this same file for EVERY
# release build so the fingerprint never shifts and App Links auto-verify stays
# green.
#
# Usage:
#   ./scripts/generate-release-keystore.sh
#
# Output:
#   mobile/credentials/ankaa-release.keystore   (alias: ankaa, RSA 2048, 10000d)
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

MOBILE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CRED_DIR="$MOBILE_ROOT/credentials"
KEYSTORE="$CRED_DIR/ankaa-release.keystore"
ALIAS="ankaa"

mkdir -p "$CRED_DIR"

if [[ -f "$KEYSTORE" ]]; then
  echo "❌ $KEYSTORE already exists."
  echo "   Do NOT regenerate it — that would change the SHA-256 and break App Links."
  echo "   Delete it manually ONLY if you intend to re-pin assetlinks.json everywhere."
  exit 1
fi

if ! command -v keytool >/dev/null 2>&1; then
  echo "❌ keytool not found. Install a JDK (e.g. 'brew install --cask temurin')." >&2
  exit 1
fi

echo "Generating permanent release keystore at:"
echo "  $KEYSTORE"
echo "You will be prompted for a keystore (store) password, a key password, and a DN."
echo "Record both passwords — you'll put them in ~/.gradle/gradle.properties."
echo

keytool -genkeypair -v \
  -keystore "$KEYSTORE" \
  -alias "$ALIAS" \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000

echo
echo "✅ Keystore created. Its STABLE SHA-256 fingerprint:"
echo
keytool -list -v -keystore "$KEYSTORE" -alias "$ALIAS" | grep -A1 'SHA256' || true
echo
echo "NEXT STEPS:"
echo "  1. Copy mobile/credentials/keystore.properties.example values into"
echo "     ~/.gradle/gradle.properties (ANKAA_STORE_PASSWORD / ANKAA_KEY_PASSWORD / etc.)."
echo "  2. Paste the SHA256 value above into the sha256_cert_fingerprints array of"
echo "     web/public/.well-known/assetlinks.json AND api/public/.well-known/assetlinks.json."
echo "  3. Back up this .keystore file + both passwords in a secure vault (it is gitignored)."
