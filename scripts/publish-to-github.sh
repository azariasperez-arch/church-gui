#!/usr/bin/env bash
# Publish the Church Screen MVP branch to azariasperez-arch/church-gui and open a PR.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

REMOTE_URL="${REMOTE_URL:-https://github.com/azariasperez-arch/church-gui.git}"
BRANCH="${BRANCH:-cursor/church-screen-mvp-b1f1}"
BASE="${BASE:-main}"

if ! git remote get-url origin >/dev/null 2>&1; then
  git remote add origin "$REMOTE_URL"
else
  git remote set-url origin "$REMOTE_URL"
fi

git fetch origin "$BASE"
git push -u origin "$BRANCH"

gh pr create \
  --repo azariasperez-arch/church-gui \
  --base "$BASE" \
  --head "$BRANCH" \
  --title "feat: Church Screen MVP (desktop + web + RVR1960)" \
  --body "$(cat <<'EOF'
## Summary
- ProPresenter-style macOS Electron operator + stage/projector window
- Full Reina-Valera 1960 Bible with citation + keyword search
- Song library (local + shared web uploads) with intelligent slide splitting
- Service playlist + present mode (Space / arrows)
- Spanish-first bilingual UI; desktop sync from web (`/api/songs`, `/api/sync`)
- Cursor cloud bootstrap via `.cursor/environment.json`

## Test plan
- [ ] `pnpm install && pnpm build:core`
- [ ] `pnpm dev:web` — create/edit a song at http://localhost:3177
- [ ] `pnpm dev:desktop` — search `Juan 3:16`, add to service, Presentar
- [ ] Sync songs from web in the desktop app
EOF
)"

echo "Done. Open the PR URL above, merge, then start the next Cloud Agent from this repo."
