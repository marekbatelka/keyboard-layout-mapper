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
- **KLE (Keyboard Layout Editor)**: Copy layout directly to keyboard-layout-editor.com
  - Proper row/column spacing with {x:N} and {y:N} metadata
  - Supports diagonal layouts and custom row spacing
  - Multi-line formatted output for readability
- **PNG**: Visual export of your layout canvas

## 📱 GitHub Pages Deployment

### Automatic Deployment
This project is configured for automatic GitHub Pages deployment:

1. **Fork this repository** to your GitHub account
2. **Enable GitHub Pages** in repository settings:
   - Go to Settings > Pages
   - Source: "GitHub Actions"
3. **Push to main branch** - site deploys automatically
4. **Access your live site** at: `https://your-username.github.io/keyboard-layout-mapper`

### Manual Setup
If you prefer manual deployment:

1. **Create a new repository** on GitHub
2. **Upload all files** to the repository
3. **Enable GitHub Pages** in Settings > Pages
4. **Select source**: "Deploy from a branch" > "main" > "/ (root)"
5. **Wait 5-10 minutes** for deployment

## Quick Start

### On Tablet (Recommended):
1. **Visit the live demo** link above on your tablet
2. **Click "Create Keys"** to enter key creation mode
3. **Tap positions** on the canvas to place keys (up to 10 taps per key averaged for precision)
4. **Navigate keys** using Previous/Next buttons
5. **Toggle grid snapping** with the "Snap to 0.25u Grid" checkbox
6. **Export to KLE** when done - copies directly to clipboard for keyboard-layout-editor.com

### Local Development:
1. **Clone the repository**: `git clone https://github.com/your-username/kbdlayout.git`
2. **Open `index.html`** in a modern web browser
3. **Start a local server** (optional): `python3 -m http.server 8080`
4. **Follow the tablet steps** above

## File Structure

```
kbdlayout/
├── index.html              # Main application interface
├── css/
│   ├── styles.css          # Global styles and utilities
│   ├── wizard.css          # Wizard interface styles
│   └── mapping.css         # Mapping interface and grid styles
├── js/
│   ├── app.js             # Main application logic and state management
│   ├── wizard.js          # Setup wizard functionality
│   ├── mapping.js         # Finger mapping and data processing
│   ├── export.js          # Export functionality for different formats
│   └── touch-handler.js   # Touch and gesture handling
└── .github/
    └── copilot-instructions.md # Project development guidelines
```

## 📱 GitHub Pages Deployment

### Automatic Deployment
This project is configured for automatic GitHub Pages deployment:

1. **Fork this repository** to your GitHub account
2. **Enable GitHub Pages** in repository settings:
   - Go to Settings > Pages
   - Source: "GitHub Actions"
3. **Push to main branch** - site deploys automatically
4. **Access your live site** at: `https://your-username.github.io/kbdlayout`

### Manual Setup
If you prefer manual deployment:

1. **Create a new repository** on GitHub
2. **Upload all files** to the repository
3. **Enable GitHub Pages** in Settings > Pages
4. **Select source**: "Deploy from a branch" > "main" > "/ (root)"
5. **Wait 5-10 minutes** for deployment

## Development

### Local Development
1. **No build process required**: Pure HTML/CSS/JavaScript
2. **Serve locally**: Use any static file server
3. **Live reload**: Use VS Code Live Server extension

### Testing
- **Desktop**: Mouse simulation of touch events
- **Tablet**: Direct testing via GitHub Pages link
- **Mobile**: Responsive design works on phones too
- **Cross-browser**: Test on multiple browsers and devices

## License

MIT License - see LICENSE file for details

## Acknowledgments

- **Ergogen**: Keyboard generator that inspired export format
---

## 🌐 **Perfect for Tablets**

This application is specifically optimized for tablet use via GitHub Pages:
- **No installation required** - runs directly in your tablet browser
- **Offline capable** - works even without internet after first load
- **Cross-platform** - works on iPad, Android tablets, Surface, etc.
- **Touch-optimized** - designed for finger interaction, not mouse clicks
- **Fullscreen experience** - maximum canvas space for accurate mapping

## 📋 **Key Features Checklist**
- ✅ **Precision grid**: 0.25u (4.76mm) snapping resolution
- ✅ **Accurate sizing**: 72px = 1u = 19.05mm physical key size
- ✅ **Multi-tap averaging**: Up to 10 taps per key for perfect positioning
- ✅ **Overlap detection**: Visual feedback for key collisions
- ✅ **KLE export**: Direct copy-paste to keyboard-layout-editor.com
- ✅ **Touch-optimized**: Designed for tablet finger interaction
- ✅ **Real-time preview**: See your layout as you build it
- ✅ **No registration**: Fully client-side, no account needed

---

**Made for the mechanical keyboard community** 🎹