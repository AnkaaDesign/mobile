# SECURITY — Android signing keystore + password leaked in git history

**Severity: CRITICAL.** The Android signing identity is recoverable by anyone who
has ever cloned/pulled `git@github.com:AnkaaDesign/mobile.git`.

## What is exposed (and where)

The working tree is already clean (no secrets tracked; `.gitignore` covers
`*.jks`, `*.keystore`, `credentials/*.env`, `credentials/keystore.properties`).
The exposure is **entirely in history** — `git rm` in `2ed4e901` only removed the
files from the tip, the blobs remain reachable:

| Secret | Blob(s) | Introduced in |
|---|---|---|
| `@kennedy.campos__ankaa-design.jks` (real JKS) | `0ab9ec0f` | `3235cf9b` |
| `android/app/release.keystore` (real JKS) | `d69c3999`, `8a03a735` | `3235cf9b`, `608622ae`, `5d8128ed`, `2ed4e901` |
| Keystore password `ankaa2024release` in `android/gradle.properties` (`MYAPP_UPLOAD_STORE_PASSWORD` / `MYAPP_UPLOAD_KEY_PASSWORD`) | — | added `3235cf9b`, removed `240a257f` |

Verify any time with:
```bash
git rev-list --all --objects | grep -iE '\.jks|release\.keystore|ankaa-design'
git log --oneline -S MYAPP_UPLOAD_STORE_PASSWORD -- android/gradle.properties
```

## Remediation — do these IN ORDER (steps 1–2 are irreversible / outward-facing)

These steps rewrite shared history and rotate signing keys. They were **not**
auto-executed because they force-push to a shared org remote and require Play
Console access. Coordinate with everyone who has a clone first (they must
re-clone or hard-reset after the force-push).

### 0. Rotate the secret first (assume it is already compromised)
- If `release.keystore` / `@kennedy.campos__ankaa-design.jks` is the **Play
  upload key**: in Play Console → Setup → App integrity → request an **upload
  key reset**, generate a fresh keystore (`scripts/generate-release-keystore.sh`),
  and register the new upload certificate.
- If it is the **app-signing key** and you do NOT use Play App Signing, you
  cannot rotate it without shipping a new app listing — enroll in Play App
  Signing going forward.
- Change the password; never reuse `ankaa2024release`. Store the new password
  only in `credentials/keystore.properties` (gitignored) and `~/.gradle`.

### 1. Purge the blobs from history
`git-filter-repo` / `bfg` are **not installed** — install one:
```bash
pipx install git-filter-repo        # or: brew install git-filter-repo
```
Then, from a FRESH mirror clone (filter-repo refuses to run on a repo with a
remote+worktree by default; a mirror is safest):
```bash
git clone --mirror git@github.com:AnkaaDesign/mobile.git mobile-purge.git
cd mobile-purge.git
git filter-repo --invert-paths \
  --path '@kennedy.campos__ankaa-design.jks' \
  --path 'android/app/release.keystore'
# scrub the password text from old gradle.properties revisions:
git filter-repo --replace-text <(printf 'ankaa2024release==>REDACTED\n')
```

### 2. Force-push the rewritten history
```bash
git push --force --mirror
```
After this, **every collaborator must re-clone** (or `git fetch && git reset
--hard origin/<branch>`); old clones still contain the secret and must be
deleted. Invalidate any CI caches that hold the old history.

### 3. Confirm
```bash
git clone git@github.com:AnkaaDesign/mobile.git verify && cd verify
git rev-list --all --objects | grep -iE '\.jks|release\.keystore|ankaa-design'  # must be empty
git log --oneline -S MYAPP_UPLOAD_STORE_PASSWORD -- android/gradle.properties    # must be empty
```

> Note: GitHub may retain unreachable objects in fork network caches; if the
> repo has forks, contact GitHub Support to purge them. Treat the old key as
> permanently compromised regardless.
