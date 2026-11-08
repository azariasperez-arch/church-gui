# Church Screen

ProPresenter-style church presentation app for **macOS**: project **song lyrics** and **Reina-Valera 1960** Bible verses, with a **shared web library** for team song uploads.

GitHub: [azariasperez-arch/church-gui](https://github.com/azariasperez-arch/church-gui)

## What’s included (Core MVP)

- **Desktop (Electron)**: operator console + fullscreen stage/projector window
- **Bible (RVR1960)**: full Spanish text, citation + keyword search
- **Songs**: local library + upload/edit; blank lines / `[Coro]` headers → intelligent slides
- **Service playlist**: build a run-of-show; Space / ← → navigate slides
- **Web app**: shared song CRUD + `/api/songs` + `/api/sync` for desktop sync
- **i18n**: Spanish-first, English toggle

## Repository layout

```
church-gui/
  apps/desktop   # Electron + React operator/stage
  apps/web       # Next.js shared song management
  packages/core  # Bible search, slide split, song parse, i18n
  .cursor/       # Cloud agent environment bootstrap
```

## Cloud Agents (Cursor)

Start the next Cursor Cloud Agent from this GitHub repo:

1. Open [cursor.com/agents](https://cursor.com/agents)
2. Select repository **`azariasperez-arch/church-gui`**
3. Ask for the next feature

Bootstrap install is defined in [`.cursor/environment.json`](.cursor/environment.json).

## Setup

```bash
# Bible JS sources expected in /tmp/bible-books (or set BIBLE_SRC)
# See packages/core/scripts/build-bible.mjs

pnpm install
pnpm build:core

# Web (shared library) — http://localhost:3177
pnpm dev:web

# Desktop operator — separate terminal
pnpm dev:desktop
```

### Desktop ↔ web sync

1. Start the web app.
2. In desktop, click **Sincronizar desde web** (or set the web URL via the Service panel **URL** button).
3. Songs merge by id / `updatedAt`.

### Present mode

- Click **Presentar** to open the stage window (uses a second display when available).
- **Space** / **→** next slide, **←** previous, **Esc** stop.
- Shortcut: `Cmd+Shift+P` toggles the stage window.

## Lyrics format

```text
[Verso 1]
Línea uno
Línea dos

[Coro]
Línea del coro
```

## Bible attribution

RVR1960 text is packaged from community JSON sources for congregational tooling. Confirm licensing/usage rights for your church before wide redistribution.

## Roadmap (v1.1+)

- Arrangement builder (`V1 → C → V2 → C`)
- Stage themes / blackout / logo look
- Web login + editor roles
- ChordPro / Planning Center import
- Clicker / Stream Deck
- Notarized macOS `.dmg`
