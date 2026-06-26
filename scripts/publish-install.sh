#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Publish a locally-built app binary to the self-hosted install system.
#
# POSTs a built .ipa (iOS) or .apk (Android) to the ADMIN-authenticated publish
# endpoint, which stores it and updates the install page / version metadata.
#
#   POST https://api.ankaadesign.com.br/install/publish/<platform>
#   Headers: Authorization: Bearer $ANKAA_ADMIN_TOKEN
#   Multipart fields: file=<binary>  version=<x.y>  build=<n>
#
# Usage:
#   ANKAA_ADMIN_TOKEN=xxxxx ./scripts/publish-install.sh ios     path/to/AnkaaDesign.ipa 1.0 7
#   ANKAA_ADMIN_TOKEN=xxxxx ./scripts/publish-install.sh android path/to/app-release.apk 1.0 6
#
# Optional env:
#   ANKAA_API_BASE   override API base (default https://api.ankaadesign.com.br)
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

API_BASE="${ANKAA_API_BASE:-https://api.ankaadesign.com.br}"

die() { echo "❌ $*" >&2; exit 1; }

# ---- args ----
PLATFORM="${1:-}"
FILE="${2:-}"
VERSION="${3:-}"
BUILD="${4:-}"

[[ -n "$PLATFORM" && -n "$FILE" && -n "$VERSION" && -n "$BUILD" ]] || \
  die "Usage: $0 <ios|android> <path-to-binary> <version> <build>"

case "$PLATFORM" in
  ios)     EXPECT_EXT="ipa" ;;
  android) EXPECT_EXT="apk" ;;
  *)       die "platform must be 'ios' or 'android' (got '$PLATFORM')" ;;
esac

# ---- validation ----
[[ -n "${ANKAA_ADMIN_TOKEN:-}" ]] || die "ANKAA_ADMIN_TOKEN env var is required (admin Bearer token)."
[[ -f "$FILE" ]] || die "file not found: $FILE"
[[ "${FILE##*.}" == "$EXPECT_EXT" ]] || die "platform '$PLATFORM' expects a .$EXPECT_EXT file (got '$FILE')."
command -v curl >/dev/null 2>&1 || die "curl is required."

ENDPOINT="$API_BASE/install/publish/$PLATFORM"
SIZE="$(du -h "$FILE" | cut -f1)"

echo "Publishing $PLATFORM build:"
echo "  endpoint : $ENDPOINT"
echo "  file     : $FILE ($SIZE)"
echo "  version  : $VERSION"
echo "  build    : $BUILD"
echo

# Idempotent: re-running with the same version/build simply overwrites that slot
# server-side (the endpoint is keyed by platform+version+build).
HTTP_CODE="$(curl -sS -w '%{http_code}' -o /tmp/ankaa-publish-resp.json \
  -X POST "$ENDPOINT" \
  -H "Authorization: Bearer $ANKAA_ADMIN_TOKEN" \
  -F "file=@${FILE};type=application/octet-stream" \
  -F "version=${VERSION}" \
  -F "build=${BUILD}")"

echo "── server response (HTTP $HTTP_CODE) ──"
cat /tmp/ankaa-publish-resp.json 2>/dev/null || true
echo

if [[ "$HTTP_CODE" != "200" && "$HTTP_CODE" != "201" ]]; then
  die "publish failed (HTTP $HTTP_CODE). See response above."
fi

echo
echo "✅ Published. Verify the live version metadata:"
echo "   curl -s $API_BASE/install/version"
echo
curl -s "$API_BASE/install/version" || true
echo

# ─────────────────────────────────────────────────────────────────────────────
# MANUAL FALLBACK (if the API publish endpoint is unavailable)
# ─────────────────────────────────────────────────────────────────────────────
# 1. scp the binary into the server's install directory:
#      scp "$FILE" user@server:$INSTALL_DIR/<platform>/
#      (e.g. INSTALL_DIR=/var/www/ankaa/install ; iOS -> ios/AnkaaDesign.ipa,
#       Android -> android/app-release.apk)
# 2. Edit $INSTALL_DIR/meta.json on the server, bumping the matching platform's
#    "version" and "build" (and filename if it changed), e.g.:
#      { "ios":     { "version": "1.0", "build": 7, "file": "ios/AnkaaDesign.ipa" },
#        "android": { "version": "1.0", "build": 6, "file": "android/app-release.apk" } }
# 3. Confirm: curl -s $API_BASE/install/version
# ─────────────────────────────────────────────────────────────────────────────
