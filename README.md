# FocusWriter

A distraction-free writing app that locks your computer to a minimal writing interface for a set period of time. Similar to Cold Turkey Writer.

## Features

- **Full Screen Lock Mode**: Once started, the app takes over your screen in kiosk mode
- **Timer-Based Sessions**: Set writing sessions from 1 minute to 8 hours
- **Progress Bar**: Visual indicator showing time remaining
- **Word Counter**: Track your writing progress in real-time
- **Auto-Save**: Your work is automatically saved every 3 seconds
- **Emergency Exit**: If absolutely necessary, type a long phrase to exit early
- **Export**: Save your completed work to any location
- **Clean UI**: Minimal, distraction-free interface optimized for writing

## Quick Start

### Building the App (One-Click)

1. Open Finder and navigate to the FocusWriter folder
2. Double-click `BUILD_AND_INSTALL.command`
3. Wait for the installation to complete (5-10 minutes first time)
4. FocusWriter will be installed in your Applications folder

That's it! The script handles everything automatically.

### Manual Build (Alternative)

If you prefer to build manually:

```bash
cd ~/FocusWriter
npm install
npm run build
```

The built app will be in the `dist` folder.

## How It Works

1. **Launch**: Open FocusWriter from Applications
2. **Set Time**: Enter how long you want to write (or use presets)
3. **Start**: Click "Begin Writing Session"
4. **Write**: The app locks into fullscreen mode - just write!
5. **Finish**: When time's up, export your work or start a new session

### Blocking Features

- Fullscreen kiosk mode (hides dock and menu bar)
- Blocks Cmd+Q, Cmd+W, Cmd+Tab, and other escape shortcuts
- App stays on top and forces focus back if you try to leave
- Emergency exit requires typing a specific phrase

## Selling Your App ($20)

### Option 1: Gumroad (Recommended - No Developer Account Needed)

1. **Create a Gumroad account** at gumroad.com
2. **Zip the DMG file** from the `dist` folder
3. **Create a product**:
   - Title: "FocusWriter - Distraction-Free Writing"
   - Price: $20
   - Upload: The ZIP file containing the DMG
4. **Add a product description** highlighting features
5. **Share your Gumroad link** to start selling

**Limitation**: Users will see a "developer cannot be verified" warning on first launch. They need to right-click > Open to bypass.

### Option 2: Paddle or Lemon Squeezy

Similar to Gumroad but with more features for software sales:
- paddle.com
- lemonsqueezy.com

### Option 3: Mac App Store (Requires Developer Account)

For the best user experience with no warnings:

1. **Get an Apple Developer Account** ($99/year at developer.apple.com)
2. **Sign and notarize the app**:
   ```bash
   # After getting your certificates
   npm run build
   # Then use electron-builder's signing features
   ```
3. **Submit to App Store** through App Store Connect
4. Apple takes 30% of sales (you'd get $14 per sale)

### Option 4: Direct Sales with Notarization

Sell from your own website with a properly signed app:

1. Get Apple Developer Account ($99/year)
2. Add signing configuration to package.json
3. Notarize the app with Apple
4. Host the DMG on your website
5. Use Stripe or PayPal for payments

## Customization

### Change App Name

Edit `package.json`:
```json
{
  "name": "your-app-name",
  "build": {
    "productName": "Your App Name"
  }
}
```

### Change Colors

Edit `src/index.html` and modify the CSS variables:
```css
:root {
  --bg-primary: #0d0d0d;
  --accent: #4a9eff;
  /* etc. */
}
```

### Add Features

The app is built with Electron. Key files:
- `src/main.js` - Main process (window management, blocking)
- `src/index.html` - UI and renderer logic

## File Locations

- **Auto-saved documents**: `~/Library/Application Support/focuswriter/documents/`
- **App settings**: `~/Library/Application Support/focuswriter/settings.json`

## Troubleshooting

### "App is damaged" or "cannot be verified" warning

Right-click the app > Open > Open anyway

Or run in Terminal:
```bash
xattr -rd com.apple.quarantine /Applications/FocusWriter.app
```

### Build fails

Make sure you have:
- macOS 10.15 or later
- Xcode Command Line Tools: `xcode-select --install`
- Sufficient disk space (2GB+)

### App doesn't lock properly

The blocking works best on macOS. Some system shortcuts (like Mission Control) may still work depending on system settings.

## License

Proprietary - All rights reserved.

---

Built with Electron. Inspired by Cold Turkey Writer.
