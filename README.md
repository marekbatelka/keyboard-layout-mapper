# Keyboard Layout Designer

[![Deploy to GitHub Pages](https://github.com/marekbatelka/keyboard-layout-mapper/actions/workflows/deploy.yml/badge.svg)](https://github.com/marekbatelka/keyboard-layout-mapper/actions/workflows/deploy.yml)
[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://marekbatelka.github.io/keyboard-layout-mapper)

A tablet-optimized web application for creating custom keyboard layouts with interactive key positioning. Design your keyboard layout by tapping on a fullscreen canvas to place keys exactly where you want them.

> **🎯 Optimized for tablets** - Best experienced on iPad, Android tablets, or touch devices via the live demo link.

## 🚀 Live Demo

**Try it live on your tablet:** [https://marekbatelka.github.io/keyboard-layout-mapper](https://marekbatelka.github.io/keyboard-layout-mapper)

## Features

### 🎯 Interactive Key Creation
- **Precision positioning**: Tap multiple times per key for averaged, accurate placement
- **0.25u grid snapping**: Optional snap-to-grid at 0.25u intervals (4.76mm precision)
- **72px key size**: 1u = 19.05mm = 72px at 96 DPI for accurate physical representation
- **Real-time preview**: See keys as you create them with live positioning
- **Key management**: Add, remove, navigate, and reset keys easily
- **Overlap detection**: Visual red highlighting when keys overlap

### 📐 Advanced Layout Tools
- **Multi-tap averaging**: Each key position averaged from up to 10 taps for precision
- **Grid visualization**: Subtle grid overlay showing 0.25u and 1u increments
- **Toggleable snapping**: Enable/disable 0.25u grid snapping on the fly
- **No overlap mode**: Keys are only flagged as overlapping if they actually share space (touching is OK)
- **Dark canvas**: Professional dark background for better key visibility

### 📤 Export Formats
- **KLE (Keyboard Layout Editor)**: Export and import layouts
  - Proper row/column spacing with {x:N} and {y:N} metadata
  - Supports diagonal layouts and custom row spacing
  - Multi-line formatted output for readability
  - Import existing KLE layouts for editing
  - Modal popup display for easy copying on tablets
- **PNG**: Visual export of your layout canvas

> **Note**: Currently supports 1u (standard) keys only. Key rotation, custom key sizes, and key legends are not yet supported.

## Quick Start

### On Tablet (Recommended):
1. **Visit the live demo** link above on your tablet
2. **Choose a mode** from the mode selector (Move, Tap, Key, Export)
3. **Create your layout** by switching between modes as needed
4. **Export** your layout when done

### Understanding the Modes

The application has 4 distinct modes to streamline your workflow:

#### 🖐️ **Key Mode** (Default)
Create and edit keyboard keys with precision positioning.
- **Tap the canvas** to record up to 10 positions per key
- **Position is averaged** from all taps for accuracy
- **Navigate** between keys using Previous/Next buttons
- **Add/Remove** keys as needed
- **Toggle grid snapping** for 0.25u precision alignment
- **Visual feedback** shows overlapping keys in red

#### ✋ **Tap Mode**
Record finger mapping positions for ergonomic analysis.
- **Select finger** (Thumb, Index, Middle, Ring, Pinky)
- **Select hand** (Left, Right)
- **Tap positions** to record natural finger reach
- **Clear/Reset** mappings as needed
- Useful for planning ergonomic layouts based on your hand position

#### 🔄 **Move Mode**
Pan and reposition the canvas, keys, or tap indicators.
- **Lock Keys**: Prevent keys from moving (checked by default)
- **Lock Taps**: Prevent tap indicators from moving (checked by default)
- **Lock Canvas**: Prevent grid background from moving (unchecked by default)
- **Drag the canvas** to pan unlocked elements
- Ideal for: positioning the grid under existing keys, or moving everything together

#### 📤 **Export Mode**
Save or import your keyboard layouts.
- **Export PNG**: Save a visual image of your layout
- **Export KLE**: Display KLE format in modal for easy copying (tablet-friendly)
- **Import KLE**: Load existing layouts from KLE format
- All exports use standard KLE format without quotes on property names

### Workflow Tips
1. Start in **Key Mode** to place your keys by tapping positions
2. Use **Move Mode** with locked keys to align the grid underneath
3. Switch to **Export Mode** to save your work
4. Use **Tap Mode** if you want to analyze finger reach patterns

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

## Acknowledgments

- **Ergogen**: Keyboard generator that inspired export format
- **KLE**: keyboard-layout-editor.com for standard layout format

---

**Made for the mechanical keyboard community** 🎹