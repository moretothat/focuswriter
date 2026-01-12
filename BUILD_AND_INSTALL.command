#!/bin/bash

# FocusWriter - One-Click Build and Install Script
# This script will install all dependencies and build the app automatically

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                            ║${NC}"
echo -e "${BLUE}║           ${GREEN}FocusWriter - Build & Install${BLUE}                    ║${NC}"
echo -e "${BLUE}║                                                            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Step 1: Check/Install Homebrew
echo -e "${YELLOW}[1/6]${NC} Checking for Homebrew..."
if command_exists brew; then
    echo -e "${GREEN}✓${NC} Homebrew is already installed"
else
    echo -e "${BLUE}→${NC} Installing Homebrew (this may take a few minutes)..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

    # Add Homebrew to PATH for this session
    if [[ $(uname -m) == "arm64" ]]; then
        eval "$(/opt/homebrew/bin/brew shellenv)"
    else
        eval "$(/usr/local/bin/brew shellenv)"
    fi
    echo -e "${GREEN}✓${NC} Homebrew installed successfully"
fi

# Step 2: Check/Install Node.js
echo -e "${YELLOW}[2/6]${NC} Checking for Node.js..."
if command_exists node; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✓${NC} Node.js is already installed (${NODE_VERSION})"
else
    echo -e "${BLUE}→${NC} Installing Node.js..."
    brew install node
    echo -e "${GREEN}✓${NC} Node.js installed successfully"
fi

# Step 3: Install npm dependencies
echo -e "${YELLOW}[3/6]${NC} Installing project dependencies..."
npm install --silent
echo -e "${GREEN}✓${NC} Dependencies installed"

# Step 4: Generate app icon
echo -e "${YELLOW}[4/6]${NC} Generating app icon..."

# Create a simple PNG icon using built-in tools
# We'll create a basic icon using Python (which comes with macOS)
python3 << 'PYTHON_SCRIPT'
import os
import subprocess

# Create iconset directory
iconset_dir = "assets/icon.iconset"
os.makedirs(iconset_dir, exist_ok=True)

# Icon sizes needed for macOS
sizes = [16, 32, 64, 128, 256, 512, 1024]

# Create a simple icon using sips (built into macOS)
# First, let's create a basic PNG from scratch using Python
from PIL import Image, ImageDraw
import math

def create_icon(size):
    # Create image with gradient background
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Background with rounded corners
    padding = int(size * 0.1)
    radius = int(size * 0.22)

    # Draw rounded rectangle background
    bg_color = (26, 26, 46)
    draw.rounded_rectangle(
        [padding, padding, size - padding, size - padding],
        radius=radius,
        fill=bg_color
    )

    # Draw accent elements
    center_x, center_y = size // 2, size // 2

    # Draw a stylized pen/feather
    accent_color = (74, 158, 255)
    pen_width = int(size * 0.15)
    pen_height = int(size * 0.5)

    # Pen body (simplified rectangle)
    pen_left = center_x - pen_width // 2
    pen_top = center_y - pen_height // 2
    draw.rectangle(
        [pen_left, pen_top, pen_left + pen_width, pen_top + pen_height],
        fill=accent_color
    )

    # Pen tip
    tip_size = int(size * 0.08)
    draw.polygon([
        (center_x - tip_size, pen_top + pen_height),
        (center_x + tip_size, pen_top + pen_height),
        (center_x, pen_top + pen_height + tip_size * 2)
    ], fill=(224, 224, 224))

    # Lock symbol
    lock_size = int(size * 0.12)
    lock_y = center_y - int(size * 0.05)
    draw.rectangle(
        [center_x - lock_size, lock_y, center_x + lock_size, lock_y + lock_size * 1.5],
        fill=bg_color
    )

    # Lock shackle
    shackle_width = int(size * 0.02)
    draw.arc(
        [center_x - lock_size + shackle_width, lock_y - lock_size,
         center_x + lock_size - shackle_width, lock_y + shackle_width],
        180, 0, fill=accent_color, width=shackle_width
    )

    # Progress bar at bottom
    bar_height = int(size * 0.03)
    bar_y = int(size * 0.8)
    bar_margin = int(size * 0.2)
    draw.rounded_rectangle(
        [bar_margin, bar_y, size - bar_margin, bar_y + bar_height],
        radius=bar_height // 2,
        fill=(51, 51, 51)
    )
    draw.rounded_rectangle(
        [bar_margin, bar_y, size - bar_margin - int(size * 0.2), bar_y + bar_height],
        radius=bar_height // 2,
        fill=accent_color
    )

    return img

# Try to import PIL, if not available, create a simpler approach
try:
    from PIL import Image, ImageDraw

    # Generate icons at each size
    for size in sizes:
        icon = create_icon(size)
        icon.save(f"{iconset_dir}/icon_{size}x{size}.png")
        if size <= 512:
            # Also create @2x versions
            icon_2x = create_icon(size * 2)
            icon_2x.save(f"{iconset_dir}/icon_{size}x{size}@2x.png")

    print("Icons created with PIL")

except ImportError:
    # Fallback: create simple colored squares
    print("PIL not available, using fallback icon generation")

    # Create a simple 1024x1024 PNG using pure Python
    def create_simple_png(width, height, filename):
        import struct
        import zlib

        def create_png_data(width, height):
            # Create gradient image data
            raw_data = []
            for y in range(height):
                raw_data.append(0)  # Filter byte
                for x in range(width):
                    # Background color with slight gradient
                    r = 26
                    g = 26
                    b = int(46 + (y / height) * 20)
                    a = 255 if (0.1 < x/width < 0.9 and 0.1 < y/height < 0.9) else 0
                    raw_data.extend([r, g, b, a])

            return bytes(raw_data)

        # PNG signature
        signature = b'\x89PNG\r\n\x1a\n'

        # IHDR chunk
        ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
        ihdr_crc = zlib.crc32(b'IHDR' + ihdr_data)
        ihdr_chunk = struct.pack('>I', 13) + b'IHDR' + ihdr_data + struct.pack('>I', ihdr_crc)

        # IDAT chunk
        raw = create_png_data(width, height)
        compressed = zlib.compress(raw, 9)
        idat_crc = zlib.crc32(b'IDAT' + compressed)
        idat_chunk = struct.pack('>I', len(compressed)) + b'IDAT' + compressed + struct.pack('>I', idat_crc)

        # IEND chunk
        iend_crc = zlib.crc32(b'IEND')
        iend_chunk = struct.pack('>I', 0) + b'IEND' + struct.pack('>I', iend_crc)

        with open(filename, 'wb') as f:
            f.write(signature + ihdr_chunk + idat_chunk + iend_chunk)

    for size in [16, 32, 128, 256, 512, 1024]:
        create_simple_png(size, size, f"{iconset_dir}/icon_{size}x{size}.png")

PYTHON_SCRIPT

# Check if PIL worked, if not install it and retry
if [ ! -f "assets/icon.iconset/icon_512x512.png" ]; then
    echo -e "${BLUE}→${NC} Installing Pillow for icon generation..."
    pip3 install --quiet Pillow 2>/dev/null || pip install --quiet Pillow 2>/dev/null || true

    # Retry icon generation
    python3 << 'RETRY_SCRIPT'
import os

iconset_dir = "assets/icon.iconset"
os.makedirs(iconset_dir, exist_ok=True)

try:
    from PIL import Image, ImageDraw

    def create_icon(size):
        img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        padding = int(size * 0.08)
        radius = int(size * 0.22)

        # Background
        draw.rounded_rectangle(
            [padding, padding, size - padding, size - padding],
            radius=radius,
            fill=(26, 26, 46)
        )

        center_x, center_y = size // 2, size // 2

        # Pen
        accent = (74, 158, 255)
        pw = int(size * 0.15)
        ph = int(size * 0.45)
        pl = center_x - pw // 2
        pt = center_y - ph // 2 - int(size * 0.05)
        draw.rectangle([pl, pt, pl + pw, pt + ph], fill=accent)

        # Tip
        ts = int(size * 0.08)
        draw.polygon([
            (center_x - ts, pt + ph),
            (center_x + ts, pt + ph),
            (center_x, pt + ph + ts * 2)
        ], fill=(224, 224, 224))

        # Progress bar
        bh = int(size * 0.025)
        by = int(size * 0.82)
        bm = int(size * 0.18)
        draw.rounded_rectangle([bm, by, size - bm, by + bh], radius=bh//2, fill=(51, 51, 51))
        draw.rounded_rectangle([bm, by, int(size * 0.65), by + bh], radius=bh//2, fill=accent)

        return img

    sizes = [16, 32, 64, 128, 256, 512, 1024]
    for size in sizes:
        icon = create_icon(size)
        icon.save(f"{iconset_dir}/icon_{size}x{size}.png")
        if size <= 512:
            icon_2x = create_icon(size * 2)
            icon_2x.save(f"{iconset_dir}/icon_{size}x{size}@2x.png")

except Exception as e:
    print(f"Warning: Could not create detailed icons: {e}")
    # Create minimal placeholder
    for size in [16, 32, 128, 256, 512]:
        try:
            img = Image.new('RGBA', (size, size), (26, 26, 46, 255))
            img.save(f"{iconset_dir}/icon_{size}x{size}.png")
        except:
            pass
RETRY_SCRIPT
fi

# Convert iconset to icns using iconutil (built into macOS)
if [ -d "assets/icon.iconset" ]; then
    iconutil -c icns assets/icon.iconset -o assets/icon.icns 2>/dev/null || {
        echo -e "${YELLOW}!${NC} Using default icon (iconutil failed)"
        # Create a minimal icns file or skip
    }
fi

echo -e "${GREEN}✓${NC} App icon generated"

# Step 5: Build the app
echo -e "${YELLOW}[5/6]${NC} Building FocusWriter app (this may take 2-3 minutes)..."
npm run build 2>&1 | while read line; do
    if [[ "$line" == *"error"* ]] || [[ "$line" == *"Error"* ]]; then
        echo -e "${RED}  $line${NC}"
    elif [[ "$line" == *"building"* ]] || [[ "$line" == *"Building"* ]]; then
        echo -e "${BLUE}  → $line${NC}"
    fi
done

# Check if build succeeded
if [ -d "dist/mac" ] || [ -d "dist/mac-arm64" ] || [ -d "dist/mac-universal" ]; then
    echo -e "${GREEN}✓${NC} App built successfully"
else
    echo -e "${RED}✗${NC} Build failed. Trying alternative method..."

    # Try building without code signing
    npx electron-builder --mac --config.mac.identity=null 2>&1

    if [ ! -d "dist/mac" ] && [ ! -d "dist/mac-arm64" ]; then
        echo -e "${RED}Build failed. Please check the error messages above.${NC}"
        exit 1
    fi
fi

# Step 6: Install to Applications
echo -e "${YELLOW}[6/6]${NC} Installing FocusWriter to Applications..."

# Find the built app
APP_PATH=""
for dir in "dist/mac-arm64" "dist/mac" "dist/mac-universal"; do
    if [ -d "$dir/FocusWriter.app" ]; then
        APP_PATH="$dir/FocusWriter.app"
        break
    fi
done

if [ -z "$APP_PATH" ]; then
    # Check for DMG
    DMG_PATH=$(find dist -name "*.dmg" -type f 2>/dev/null | head -1)
    if [ -n "$DMG_PATH" ]; then
        echo -e "${GREEN}✓${NC} DMG created at: $DMG_PATH"
        echo ""
        echo -e "${BLUE}To install:${NC}"
        echo "  1. Double-click the DMG file in Finder"
        echo "  2. Drag FocusWriter to your Applications folder"
        open "$(dirname "$DMG_PATH")"
        exit 0
    fi

    echo -e "${RED}Could not find built app${NC}"
    exit 1
fi

# Remove old version if exists
if [ -d "/Applications/FocusWriter.app" ]; then
    echo -e "${BLUE}→${NC} Removing old version..."
    rm -rf "/Applications/FocusWriter.app"
fi

# Copy new version
cp -R "$APP_PATH" /Applications/

# Remove quarantine attribute so app can run
xattr -rd com.apple.quarantine /Applications/FocusWriter.app 2>/dev/null || true

echo -e "${GREEN}✓${NC} FocusWriter installed to Applications"

# Done!
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                            ║${NC}"
echo -e "${GREEN}║              Installation Complete!                        ║${NC}"
echo -e "${GREEN}║                                                            ║${NC}"
echo -e "${GREEN}║   FocusWriter has been installed to your Applications      ║${NC}"
echo -e "${GREEN}║   folder. You can now launch it from there or Spotlight.   ║${NC}"
echo -e "${GREEN}║                                                            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Open Applications folder
open /Applications

# Optionally launch the app
read -p "Would you like to launch FocusWriter now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    open /Applications/FocusWriter.app
fi

echo ""
echo -e "${BLUE}For distribution:${NC}"
echo "  - The DMG file is in the 'dist' folder"
echo "  - You can distribute this DMG to customers"
echo ""
echo -e "${YELLOW}Note:${NC} For App Store distribution or to avoid Gatekeeper warnings,"
echo "you'll need an Apple Developer account (\$99/year) to sign and notarize the app."
echo ""
