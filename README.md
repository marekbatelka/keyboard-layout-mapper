# Keyboard Layout Designer

[![Deploy to GitHub Pages](https://github.com/marekbatelka/keyboard-layout-mapper/actions/workflows/deploy.yml/badge.svg)](https://github.com/marekbatelka/keyboard-layout-mapper/actions/workflows/deploy.yml)
[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://marekbatelka.github.io/keyboard-layout-mapper)
[![Version](https://img.shields.io/badge/version-2.0.0-blue)](https://github.com/marekbatelka/keyboard-layout-mapper/releases)

A tablet-optimized web application for creating custom keyboard layouts with interactive key positioning, screen calibration, and tap position analysis. Design your keyboard layout by tapping on a fullscreen canvas to place keys exactly where you want them.

> **🎯 Optimized for tablets** - Best experienced on iPad, Android tablets, or touch devices via the live demo link.

## 🚀 Live Demo

**Try it live on your tablet:** [https://marekbatelka.github.io/keyboard-layout-mapper](https://marekbatelka.github.io/keyboard-layout-mapper)

## ✨ What's New in v2.0

### 📏 Screen Calibration System
- **Physical DPI calibration**: Measure a 10×10cm square with a real ruler to calibrate your screen
- **Separate X/Y scaling**: Independent horizontal and vertical DPI adjustment for accurate screen representation
- **Auto-calibration prompt**: First-time users are guided through the calibration process
- **Fullscreen mode awareness**: Different calibration for fullscreen vs windowed mode
- **Real-world dimensions**: Keys sized accurately to match physical keyboard dimensions (1u = 19.05mm)

### 🎮 Play Mode - Practice & Analysis
- **Interactive tap tracking**: Tap on keys to record where you actually press them
- **Visual offset arrows**: See arrows from key center to your average tap position
- **Tap count badges**: Track how many times you've tapped each key
- **Usage pattern analysis**: Discover your natural pressing tendencies
- **Clean interface**: Grid and other UI elements hidden for focused practice

### 🔧 Enhanced Import/Export
- **DPI-aware KLE import**: Imported layouts automatically scale to your calibrated screen
- **Proper key synchronization**: All imported keys visible and navigable in Key mode
- **Move mode integration**: Play mode arrows move with keys in Move mode

### 🎯 Improved Collision Detection
- **Calibration-aware**: Uses calibrated key sizes for overlap detection
- **5px tolerance**: Keys can touch or have small gaps without triggering collision warnings
- **Floating-point precision**: Handles rounding errors from calibration and import

## Features

### 📐 Screen Calibration
- **Physical ruler measurement**: Uses a 10×10cm calibration square for accurate screen DPI
- **X/Y axis calibration**: Separate horizontal and vertical scaling factors
- **Fullscreen mode detection**: Warns users that calibration differs between modes
- **Persistent settings**: Calibration saved to localStorage
- **Reset keys on calibration**: Automatically clears keys when calibration changes to prevent size mismatches

### 🎯 Interactive Key Creation
- **Precision positioning**: Tap multiple times per key for averaged, accurate placement
- **0.25u grid snapping**: Optional snap-to-grid at 0.25u intervals (scaled to your DPI)
- **Calibrated key size**: 1u = 19.05mm scaled to your actual screen DPI
- **Real-time preview**: See keys as you create them with live positioning
- **Key management**: Add, remove, navigate, and reset keys easily
- **Overlap detection**: Visual red highlighting when keys overlap (5px tolerance)
- **Key selector dropdown**: Quick navigation showing "Key N (X/10)" format with tap counts

### 🎮 Play Mode Features
- **Tap position tracking**: Records exactly where you tap each key
- **Average position calculation**: Shows your typical pressing location
- **Visual arrow indicators**: Green arrows point from key center to average tap position
- **Arrow length**: Indicates distance from center (capped at 40% of key size)
- **Tap count display**: Badge shows number of recorded taps per key
- **Reset functionality**: Clear all tap data to start fresh
- **Clean canvas**: Only keys and arrows visible for focused analysis

### 📤 Export Formats
- **KLE (Keyboard Layout Editor)**: Export and import layouts
  - Proper row/column spacing with {x:N} and {y:N} metadata
  - Supports diagonal layouts and custom row spacing
  - Multi-line formatted output for readability
  - **Import with DPI scaling**: Imported layouts automatically scale to your calibration
  - Modal popup display for easy copying on tablets
- **PNG**: Visual export of your layout canvas with calibrated dimensions

### 🔄 Move Mode Enhancements
- **Play mode arrow support**: Arrows move with keys when repositioning
- **Tap position updates**: Stored tap coordinates update when keys move
- **Lock controls**: Independent locking for keys, taps, canvas, and play arrows

> **Note**: Currently supports 1u (standard) keys only. Key rotation, custom key sizes, and key legends are not yet supported.

## Quick Start

### On Tablet (Recommended):
1. **Visit the live demo** link above on your tablet
2. **Calibrate your screen** (first-time users): Measure the red square with a physical ruler
3. **Choose a mode** from the mode selector (Calibrate, Move, Tap, Key, Play, Export)
4. **Create your layout** by switching between modes as needed
5. **Test in Play mode** to analyze your tapping patterns
6. **Export** your layout when done

### Understanding the Modes

The application has 6 distinct modes to streamline your workflow:

#### 📏 **Calibrate Mode** (New in v2.0)
Adjust screen DPI for accurate physical dimensions.
- **Measure the red square** with a physical ruler (should be 10×10cm)
- **Enter measurements** separately for horizontal and vertical
- **Apply calibration** to scale all elements to real-world size
- **Warning**: Calibration resets all keys to prevent size mismatches
- **Fullscreen awareness**: Different calibration needed for fullscreen vs windowed mode

#### 🖐️ **Key Mode**
Create and edit keyboard keys with precision positioning.
- **Tap the canvas** to record up to 10 positions per key
- **Position is averaged** from all taps for accuracy
- **Navigate** between keys using Previous/Next buttons or dropdown selector
- **Add/Remove** keys as needed
- **Toggle grid snapping** for 0.25u precision alignment
- **Visual feedback** shows overlapping keys in red (5px tolerance)

#### ✋ **Tap Mode**
Record finger mapping positions for ergonomic analysis.
- **Select finger** (Thumb, Index, Middle, Ring, Pinky)
- **Select hand** (Left or Right via top bar icon: 🤚/🖐️)
- **Tap positions** to record natural finger reach
- **Clear/Reset** mappings as needed
- Useful for planning ergonomic layouts based on your hand position

#### 🔄 **Move Mode**
Pan and reposition the canvas, keys, or tap indicators.
- **Lock Keys**: Prevent keys from moving (checked by default)
- **Lock Taps**: Prevent tap indicators from moving (checked by default)
- **Lock Canvas**: Prevent grid background from moving (unchecked by default)
- **Drag the canvas** to pan unlocked elements
- **Play mode arrows**: Move with keys automatically
- Ideal for: positioning the grid under existing keys, or moving everything together

#### 🎮 **Play Mode** (New in v2.0)
Practice and analyze your tapping patterns.
- **Tap on keys** to record where you press them
- **Visual arrows** show offset from key center to average tap position
- **Tap count badges** display how many times you've tapped each key
- **Reset tap data** to clear all recordings and start fresh
- **Clean interface**: Only keys and arrows visible
- Perfect for: discovering pressing tendencies, testing layout ergonomics

#### 📤 **Export Mode**
Save or import your keyboard layouts.
- **Export PNG**: Save a visual image of your layout with calibrated dimensions
- **Export KLE**: Display KLE format in modal for easy copying (tablet-friendly)
- **Import KLE**: Load existing layouts with automatic DPI scaling
- All exports use standard KLE format without quotes on property names

### Workflow Tips
1. **First time?** Start in **Calibrate Mode** to measure your screen with a ruler
2. Use **Key Mode** to place your keys by tapping positions
3. **Import KLE** layouts to test existing designs on your screen
4. Switch to **Move Mode** with locked keys to align the grid underneath
5. Test in **Play Mode** to see where you naturally tap each key
6. Use **Tap Mode** if you want to analyze finger reach patterns
7. Switch to **Export Mode** to save your work

## 📱 GitHub Pages Deployment

### Automatic Deployment
This project is configured for automatic GitHub Pages deployment:

1. **Fork this repository** to your GitHub account
2. **Enable GitHub Pages** in repository settings:
   - Go to Settings > Pages
   - Source: "GitHub Actions"
3. **Push to main branch** - site deploys automatically
4. **Access your live site** at: `https://your-username.github.io/keyboard-layout-mapper`

## Development

### Local Development
1. **Clone the repository**: `git clone https://github.com/your-username/kbdlayout.git`
2. **Open `index.html`** in a modern web browser
3. **Start a local server** (optional): `python3 -m http.server 8080`
4. **No build process required**: Pure HTML/CSS/JavaScript

## Development

### Local Development
1. **Clone the repository**: `git clone https://github.com/your-username/kbdlayout.git`
2. **Open `index.html`** in a modern web browser
3. **Start a local server** (optional): `python3 -m http.server 8080`
4. **No build process required**: Pure HTML/CSS/JavaScript

### File Structure

```
kbdlayout/
├── index.html              # Main application interface
├── css/
│   ├── styles.css          # Global styles and utilities
│   ├── wizard.css          # Wizard interface styles
│   └── mapping.css         # Mapping interface and grid styles
├── js/
│   ├── app.js             # Main application logic and state management
│   ├── wizard.js          # Key creation, modes, and canvas panning
│   ├── mapping.js         # Finger mapping and data processing
│   ├── export.js          # Export/Import functionality (KLE, PNG)
│   └── touch-handler.js   # Touch and gesture handling
└── .github/
    └── copilot-instructions.md # Project development guidelines
```

### Testing
- **Tablet**: Best experience via GitHub Pages link
- **Desktop**: Mouse simulation of touch events
- **Mobile**: Responsive design works on phones too

## License

MIT License - Non-Commercial Use Only

This software is free to use for personal and non-commercial purposes. Commercial use requires explicit written permission from the copyright holder. See LICENSE file for full details.

## Acknowledgments

- **Ergogen**: Keyboard generator that inspired export format
- **KLE**: keyboard-layout-editor.com for standard layout format

---

**Made for the mechanical keyboard community** 🎹