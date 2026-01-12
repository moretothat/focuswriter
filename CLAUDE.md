# FocusWriter - Project Context

---

## QUICK REFERENCE (for Lawrence)

### How to Start Working on This App
```
1. Open Terminal
2. Type: cd ~/Coding/FocusWriter
3. Type: claude
4. Tell Claude what you want to change!
```

### How to Test Your Changes
```
In Terminal (from ~/Coding/FocusWriter folder):
npm start
```
This opens the app so you can see your changes. Press Ctrl+C in Terminal to close it.

### How to Build a Final Version (for selling/sharing)
```
In Terminal (from ~/Coding/FocusWriter folder):
npm run build
```
This creates the distributable app at: `~/Coding/FocusWriter/dist/FocusWriter-1.0.0-arm64.dmg`

### Which App to Open?
- **For testing changes:** Use `npm start` in Terminal, OR open `~/Coding/FocusWriter/dist/mac-arm64/FocusWriter.app`
- **For regular use:** Use `/Applications/FocusWriter.app` (this is a copy that doesn't update with changes)

### How to Save Changes to GitHub
```
In Terminal (from ~/Coding/FocusWriter folder):
git add -A
git commit -m "Description of what you changed"
git push
```
Or just ask Claude to do this for you!

### How to Update the App in /Applications (after making changes)
```
In Terminal (from ~/Coding/FocusWriter folder):
npm run build
cp -R dist/mac-arm64/FocusWriter.app /Applications/
```
Or just ask Claude to do this for you!

---

## What This Is
A distraction-free writing app (like Cold Turkey Writer) that locks the user's Mac to a minimal writing interface for a set time period. Selling for $20.

## Tech Stack
- Electron 28
- Vanilla HTML/CSS/JS (no framework)
- electron-builder for packaging

## Key Files
| File | What It Does |
|------|--------------|
| `src/main.js` | Controls the app window, blocking, keyboard shortcuts |
| `src/index.html` | Everything you see - the UI, colors, buttons, editor |
| `package.json` | App name, version, build settings |
| `assets/icon.icns` | The app icon |

## Features Implemented
- Fullscreen kiosk mode with dock/menu bar hidden
- Blocks Cmd+Q, Cmd+W, Cmd+Tab, Escape
- Timer with presets (15/30/60/120 min)
- Progress bar showing time remaining
- Word counter
- Auto-save every 3 seconds
- Emergency exit (requires typing a phrase)
- Export document on completion

## Current Status
v1.0 complete and working.

## GitHub
Repository: https://github.com/moretothat/focuswriter

## Ideas for Future Features
- Add themes (light mode?)
- Add session history/stats
- Add minimum word count mode (can't exit until X words written)
- Add Windows support
- License key system for paid version
