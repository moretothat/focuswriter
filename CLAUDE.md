# FocusWriter - Project Context

## What This Is
A distraction-free writing app (like Cold Turkey Writer) that locks the user's Mac to a minimal writing interface for a set time period. Selling for $20.

## Tech Stack
- Electron 28
- Vanilla HTML/CSS/JS (no framework)
- electron-builder for packaging

## Key Files
- `src/main.js` - Electron main process, handles kiosk mode, keyboard blocking, IPC
- `src/index.html` - All UI and renderer logic (setup screen, writing screen, completion screen)
- `package.json` - Build config for electron-builder
- `assets/icon.icns` - App icon

## Features Implemented
- Fullscreen kiosk mode with dock/menu bar hidden
- Blocks Cmd+Q, Cmd+W, Cmd+Tab, Escape
- Timer with presets (15/30/60/120 min)
- Progress bar showing time remaining
- Word counter
- Auto-save every 3 seconds
- Emergency exit (requires typing a phrase)
- Export document on completion

## Build Commands
- `npm run build` - Build macOS app
- `npm start` - Run in dev mode
- Built app: `dist/mac-arm64/FocusWriter.app`
- DMG: `dist/FocusWriter-1.0.0-arm64.dmg`

## Current Status
v1.0 complete and working. Installed at /Applications/FocusWriter.app

## Next Steps / Ideas
- Add Windows build support
- Add themes (light mode?)
- Add session history/stats
- Add minimum word count mode (can't exit until X words written)
- License key system for paid version
