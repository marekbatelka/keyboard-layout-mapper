# Keyboard Layout Designer

[![Deploy to GitHub Pages](https://github.com/marekbatelka/keyboard-layout-mapper/actions/workflows/deploy.yml/badge.svg)](https://github.com/marekbatelka/keyboard-layout-mapper/actions/workflows/deploy.yml)
[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://marekbatelka.github.io/keyboard-layout-mapper)

A tablet-optimized web application for creating custom keyboard layouts with interactive key positioning. Design your keyboard layout by tapping on a fullscreen canvas to place keys exactly where you want them.

> **🎯 Optimized for tablets** - Best experienced on iPad, Android tablets, or touch devices via the live demo link.

## 🚀 Live Demo

**Try it live on your tablet:** [https://marekbatelka.github.io/keyboard-layout-mapper](https://marekbatelka.github.io/keyboard-layout-mapper)

## Features

### 🎯 Interactive Finger Mapping
- **Free canvas mapping**: Tap anywhere on fullscreen canvas
- **No limitations**: Switch fingers/hands freely, unlimited taps
- **Real-time visualization**: Color-coded tap indicators
- **Both hands support**: Independent left and right hand mapping

### 📱 Tablet-Optimized Interface
- **Fullscreen canvas**: Immersive mapping experience
- **Touch-friendly design**: Large touch targets optimized for fingers
- **Floating controls**: Compact, collapsible control panel
- **Gesture support**: Tap, long-press, and multi-touch handling
- **Responsive layout**: Perfect for tablets, works on all screen sizes
- **Haptic feedback**: Vibration feedback on supported devices
- **Keyboard shortcuts**: Quick finger/hand switching (1-5, Q/E keys)

### 🎨 Visual Design
- **Color-coded fingers**: Each finger has a distinct color
- **Progress tracking**: Visual feedback on mapping progress
- **Real-time preview**: See your layout as you create it
- **Professional UI**: Modern, clean interface design

### 📤 Export Formats
- **PNG**: IMage of canvas

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

## Quick Start

### On Tablet (Recommended):
1. **Visit the live demo** link above on your tablet
4. **Start mapping**: The canvas goes fullscreen automatically
5. **Tap with different fingers**: Use the floating controls to switch fingers/hands

### Local Development:
1. **Clone the repository**: `git clone https://github.com/your-username/kbdlayout.git`
2. **Open `index.html`** in a modern web browser
3. **Start a local server** (optional): `python3 -m http.server 8080`
4. **Follow the online steps** above

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

## 📋 **Tablet Testing Checklist**
- ✅ Touch accuracy (taps register exactly where you touch)
- ✅ Finger switching (easy to change between fingers)
- ✅ Hand switching (left/right hand support)
- ✅ Control visibility (floating panel doesn't obstruct canvas)
- ✅ Orientation support (works in landscape and portrait)
- ✅ Export functionality (generate layouts for import)

---

**Made for the mechanical keyboard community** 🎹