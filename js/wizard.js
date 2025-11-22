// Global state
let currentMode = 'key'; // 'move', 'tap', 'key', 'play'
let keyCreationMode = false;
let currentKey = null;
let keyClickPositions = [];
let keys = [];
let keyIdCounter = 0;
let totalKeys = 1;
let currentKeyIndex = 0;
let showOnlyCurrentKey = false;
let snapToGridEnabled = true; // Grid snap toggle
let playModeActive = false;
let highlightedKeyId = null;
let playModeTaps = {}; // Store tap positions for each key in play mode: { key_0: [{x, y}, ...] }

// Canvas panning state
let canvasPanX = 0;
let canvasPanY = 0;
let isPanning = false;
let lastPanX = 0;
let lastPanY = 0;
let showInstructions = true; // Canvas instruction visibility
let showCalibration = true; // Calibration square visibility
let calibrationMode = false; // Calibration mode active
let dpiScaleX = 1.0; // DPI scaling factor X axis (1.0 = 96 DPI standard)
let dpiScaleY = 1.0; // DPI scaling factor Y axis (1.0 = 96 DPI standard)

// Helper function to get scaled key unit size (uses average of X and Y)
function getScaledOneU() {
    const avgScale = (dpiScaleX + dpiScaleY) / 2;
    return Math.round(72 * avgScale);
}

// Make keys array globally accessible for export functions
window.keys = keys;
window.getScaledOneU = getScaledOneU;

// Initialize app directly on page load
window.addEventListener('DOMContentLoaded', function() {
    // Initialize with one key by default
    keys = [{
        id: 'key_0',
        name: 'Key 1',
        x: 0,
        y: 0,
        rotation: 0,
        clicks: 0,
        positions: [],
        finalized: false
    }];
    totalKeys = 1;
    currentKeyIndex = 0;
    window.keys = keys;
    
    // Initialize the canvas and mapping
    initializeMapping();
    
    // Set initial mode to 'key'
    setTimeout(() => {
        setMode('key');
        // Initialize panel position based on default hand (right)
        updatePanelPosition(app.state.currentHand);
        
        // Show calibration on first load
        if (!localStorage.getItem('calibration-done')) {
            setTimeout(() => {
                toggleCalibration();
            }, 500);
        }
    }, 100);
});

// Wizard functionality - removed startWizard since we start directly with config

function startMapping() {
    // Get configuration values
    const keyCount = parseInt(document.getElementById('key-count-input').value);
    const mappingOrder = document.getElementById('mapping-order').value;
    
    // Validate inputs
    if (keyCount < 1 || keyCount > 100) {
        alert('Please enter a valid number of keys (1-100)');
        return;
    }
    
    // Initialize key creation workflow
    totalKeys = keyCount;
    currentKeyIndex = 0;
    keys = [];
    keyIdCounter = 0;
    
    // Create placeholder keys
    for (let i = 0; i < totalKeys; i++) {
        keys.push({
            id: `key_${i}`,
            name: `Key ${i + 1}`,
            x: 0,
            y: 0,
            rotation: 0,
            clicks: 0,
            positions: [],
            finalized: false
        });
    }
    
    // Update global reference
    window.keys = keys;
    
    // Update app state
    app.setState({
        keyCount: keyCount,
        mappingOrder: mappingOrder,
        isMapping: true
    });
    
    // Hide wizard and show mapping interface
    hideElement('wizard-container');
    showElement('mapping-container');
    
    // Initialize mapping
    initializeMapping();
    
    // Don't automatically start key creation - wait for user to click
}

function initializeMapping() {
    initializeCanvas();
    startFingerMapping();
}

function initializeCanvas() {
    const canvas = document.getElementById('tap-canvas');
    const overlay = document.getElementById('canvas-overlay');
    
    // Set fullscreen canvas dimensions
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Store canvas dimensions in app state
    app.setState({
        canvasWidth: canvas.width,
        canvasHeight: canvas.height
    });
    
    // Clear overlay
    overlay.innerHTML = '';
    
    // Add event listeners for canvas taps
    canvas.addEventListener('touchstart', handleCanvasTap);
    canvas.addEventListener('click', handleCanvasTap);
    
    // Prevent context menu
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    
    // Canvas panning listeners
    canvas.addEventListener('mousedown', handlePanStart);
    canvas.addEventListener('mousemove', handlePanMove);
    canvas.addEventListener('mouseup', handlePanEnd);
    canvas.addEventListener('mouseleave', handlePanEnd);
    
    canvas.addEventListener('touchstart', handlePanStart, { passive: false });
    canvas.addEventListener('touchmove', handlePanMove, { passive: false });
    canvas.addEventListener('touchend', handlePanEnd);
    canvas.addEventListener('touchcancel', handlePanEnd);
    
    // Draw canvas guidelines
    drawCanvasGuides(canvas);
    
    console.log('Fullscreen canvas initialized:', {
        width: canvas.width,
        height: canvas.height
    });
}

// Snap coordinate to 0.25u grid (18px increments)
function snapToGrid(value) {
    const avgScale = (dpiScaleX + dpiScaleY) / 2;
    const gridSize = Math.round(18 * avgScale); // 0.25u = 72px / 4 = 18px, scaled
    return Math.round(value / gridSize) * gridSize;
}

function startFingerMapping() {
    // Reset mapping state
    app.setState({
        currentHand: 'right',
        currentFinger: app.fingers[0],
        currentPosition: { row: 0, col: 0 },
        tapCount: 0,
        mappingData: {},
        tapPositions: []
    });
    
    // Initialize UI
    updateFingerButtons();
    updateHandButtons();
    
    console.log('Started finger mapping in free mode');
}

function updateInstructionText() {
    // Instruction text removed - status now shown in left panel
}

function drawCanvasGuides(canvas) {
    const ctx = canvas.getContext('2d');
    
    // Save current transform and reset it for clearing
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    
    // Draw a subtle grid pattern
    // 1u = 72px, 0.25u = 18px (grid snap resolution)
    const quarterUX = Math.round(18 * dpiScaleX); // 0.25u grid spacing X, scaled
    const quarterUY = Math.round(18 * dpiScaleY); // 0.25u grid spacing Y, scaled
    const oneUX = Math.round(72 * dpiScaleX); // 1u spacing for major lines X, scaled
    const oneUY = Math.round(72 * dpiScaleY); // 1u spacing for major lines Y, scaled
    
    // Calculate the grid offset based on pan
    // Find the starting point that aligns with the grid
    const offsetX = canvasPanX % quarterUX;
    const offsetY = canvasPanY % quarterUY;
    const startX = offsetX - quarterUX;
    const startY = offsetY - quarterUY;
    
    // Draw minor grid lines (0.25u) - 15% opacity
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    
    // Vertical minor lines
    for (let x = startX; x <= canvas.width; x += quarterUX) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    
    // Horizontal minor lines
    for (let y = startY; y <= canvas.height; y += quarterUY) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
    
    // Calculate major grid starting points (1u)
    const majorOffsetX = canvasPanX % oneUX;
    const majorOffsetY = canvasPanY % oneUY;
    const majorStartX = majorOffsetX - oneUX;
    const majorStartY = majorOffsetY - oneUY;
    
    // Draw major grid lines (1u) - slightly brighter
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 2;
    
    // Vertical major lines
    for (let x = majorStartX; x <= canvas.width; x += oneUX) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    
    // Horizontal major lines
    for (let y = majorStartY; y <= canvas.height; y += oneUY) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
    
    // Draw 10x10cm calibration square if enabled
    if (showCalibration) {
        // 10cm = 100mm = 378px at 96 DPI
        // 1 inch = 25.4mm = 96px at 96 DPI
        // 100mm = (100 / 25.4) * 96 = 377.95px ≈ 378px
        const squareWidth = Math.round(378 * dpiScaleX); // 10cm width at current DPI scale
        const squareHeight = Math.round(378 * dpiScaleY); // 10cm height at current DPI scale
        const squareX = (canvas.width - squareWidth) / 2; // Center horizontally
        const squareY = (canvas.height - squareHeight) / 2; // Center vertically
        
        ctx.strokeStyle = 'rgba(255, 100, 100, 0.8)';
        ctx.lineWidth = 2;
        ctx.strokeRect(squareX, squareY, squareWidth, squareHeight);
        
        // Label the square
        ctx.fillStyle = 'rgba(255, 100, 100, 0.9)';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('10cm × 10cm', squareX + squareWidth / 2, squareY + squareHeight / 2 - 10);
        ctx.font = '12px Arial';
        ctx.fillText('(Use ruler to calibrate screen)', squareX + squareWidth / 2, squareY + squareHeight / 2 + 10);
    }
    
    // Draw mode-specific instructions if enabled
    if (showInstructions) {
        drawCanvasInstructions(ctx, canvas.width, canvas.height);
    }
}

function drawCanvasInstructions(ctx, width, height) {
    const centerX = width / 2;
    const centerY = height / 2;
    
    ctx.fillStyle = '#569cd6';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    
    let title = '';
    let instructions = [];
    
    switch(currentMode) {
        case 'key':
            title = '🔑 KEY MODE';
            instructions = [
                'Tap on the canvas to place keys (up to 10 taps per key)',
                'Each key position is averaged from your taps for precision',
                'Use Previous/Next buttons to navigate between keys',
                'Enable "Snap to Grid" for 0.25u alignment',
                'Red highlights show overlapping keys'
            ];
            break;
        case 'tap':
            title = '✋ TAP MODE';
            instructions = [
                'Select your finger (Thumb, Index, Middle, Ring, Pinky)',
                'Select your hand (Left or Right)',
                'Tap positions to record natural finger reach',
                'Use this to plan ergonomic layouts',
                'Different colors represent different fingers'
            ];
            break;
        case 'move':
            title = '🔄 MOVE MODE';
            instructions = [
                'Drag the canvas to pan elements',
                'Lock Keys: Prevents keys from moving',
                'Lock Taps: Prevents tap indicators from moving',
                'Lock Canvas: Prevents grid background from moving',
                'Useful for aligning the grid under your keys'
            ];
            break;
        case 'export':
            title = '📤 EXPORT MODE';
            instructions = [
                'Export PNG: Save a visual image of your layout',
                'Export KLE: Get layout data for keyboard-layout-editor.com',
                'Import KLE: Load existing layouts to edit',
                'All exports include your complete key configuration',
                'KLE format uses standard syntax without quotes'
            ];
            break;
        case 'calibrate':
            title = '🔧 CALIBRATE MODE';
            instructions = [
                'Measure the red square with a physical ruler',
                'It should be exactly 10cm × 10cm when correctly calibrated',
                'Enter horizontal and vertical measurements separately',
                'Apply calibration to scale all elements to real-world size',
                'Warning: Calibration will reset all keys and taps'
            ];
            break;
        case 'play':
            title = '🎮 PLAY MODE';
            instructions = [
                'Tap on keys to track where you press them',
                'Arrows show the offset from key center to average tap position',
                'Arrow length indicates how far off-center you tap',
                'Badge shows number of taps recorded for each key',
                'Use Reset button to clear tap data and start over'
            ];
            break;
    }
    
    ctx.fillText(title, centerX, centerY - 100);
    
    ctx.font = '16px Arial';
    ctx.fillStyle = '#cccccc';
    instructions.forEach((instruction, index) => {
        ctx.fillText(instruction, centerX, centerY - 50 + (index * 28));
    });
    
    // Hide button hint
    ctx.font = 'italic 14px Arial';
    ctx.fillStyle = '#888';
    ctx.fillText('Click the ? icon to hide/show these instructions', centerX, centerY + 120);
}

function toggleInstructions() {
    showInstructions = !showInstructions;
    const canvas = document.getElementById('tap-canvas');
    if (canvas) {
        drawCanvasGuides(canvas);
    }
    console.log('Instructions:', showInstructions ? 'shown' : 'hidden');
}

function toggleCalibration() {
    if (!calibrationMode) {
        // Enter calibration mode
        calibrationMode = true;
        showCalibration = true;
        showCalibrationUI();
    } else {
        // Exit calibration mode
        calibrationMode = false;
        hideCalibrationUI();
    }
    const canvas = document.getElementById('tap-canvas');
    if (canvas) {
        drawCanvasGuides(canvas);
    }
    console.log('Calibration mode:', calibrationMode ? 'active' : 'inactive');
}

function toggleSquare() {
    showCalibration = !showCalibration;
    const canvas = document.getElementById('tap-canvas');
    if (canvas) {
        drawCanvasGuides(canvas);
    }
    // Update button text if in calibrate mode
    const squareToggleText = document.getElementById('squareToggleText');
    if (squareToggleText) {
        squareToggleText.textContent = showCalibration ? 'Hide Square' : 'Show Square';
    }
    console.log('Calibration square:', showCalibration ? 'shown' : 'hidden');
}

function toggleHandIcon() {
    // Toggle between left and right hand
    const newHand = app.state.currentHand === 'left' ? 'right' : 'left';
    switchHand(newHand);
    
    // Update icon
    const handIconText = document.getElementById('handIconText');
    if (handIconText) {
        // 🤚 = right hand (raised hand - back of hand)
        // 🖐️ = left hand (raised hand with fingers splayed)
        handIconText.textContent = newHand === 'right' ? '🤚' : '🖐️';
    }
}

function updateCalibrationPanelDisplay() {
    const panelXDisplay = document.getElementById('dpi-scale-x-display-panel');
    const panelYDisplay = document.getElementById('dpi-scale-y-display-panel');
    const panelDpiXDisplay = document.getElementById('effective-dpi-x-panel');
    const panelDpiYDisplay = document.getElementById('effective-dpi-y-panel');
    const inputX = document.getElementById('calibration-input-x-panel');
    const inputY = document.getElementById('calibration-input-y-panel');
    const squareToggleText = document.getElementById('squareToggleText');
    
    if (panelXDisplay) panelXDisplay.textContent = dpiScaleX.toFixed(3);
    if (panelYDisplay) panelYDisplay.textContent = dpiScaleY.toFixed(3);
    if (panelDpiXDisplay) panelDpiXDisplay.textContent = (96 * dpiScaleX).toFixed(1);
    if (panelDpiYDisplay) panelDpiYDisplay.textContent = (96 * dpiScaleY).toFixed(1);
    if (inputX) inputX.value = '10';
    if (inputY) inputY.value = '10';
    if (squareToggleText) squareToggleText.textContent = showCalibration ? 'Hide Square' : 'Show Square';
}

function applyCalibrationFromPanel() {
    const inputX = document.getElementById('calibration-input-x-panel');
    const inputY = document.getElementById('calibration-input-y-panel');
    const measuredCmX = parseFloat(inputX.value);
    const measuredCmY = parseFloat(inputY.value);
    
    if (measuredCmX < 5 || measuredCmX > 15 || measuredCmY < 5 || measuredCmY > 15) {
        alert('Please enter valid measurements between 5 and 15 cm');
        return;
    }
    
    // Calculate the scaling factors
    dpiScaleX = 10.0 / measuredCmX;
    dpiScaleY = 10.0 / measuredCmY;
    
    // Update panel display
    updateCalibrationPanelDisplay();
    
    // Reset all keys
    keys = [{
        id: 'key_0',
        name: 'Key 1',
        x: 0,
        y: 0,
        rotation: 0,
        clicks: 0,
        positions: [],
        finalized: false
    }];
    totalKeys = 1;
    currentKeyIndex = 0;
    keyIdCounter = 0;
    window.keys = keys;
    
    const overlay = document.getElementById('canvas-overlay');
    if (overlay) overlay.innerHTML = '';
    
    app.setState({
        tapPositions: [],
        mappingData: {},
        tapCount: 0
    });
    
    const canvas = document.getElementById('tap-canvas');
    if (canvas) drawCanvasGuides(canvas);
    
    updateKeyInfo();
    updateKeyPreview();
    updateKeyWorkflowUI();
    
    localStorage.setItem('calibration-done', 'true');
    
    console.log(`Calibration applied: X=${measuredCmX}cm (scale: ${dpiScaleX.toFixed(3)}), Y=${measuredCmY}cm (scale: ${dpiScaleY.toFixed(3)})`);
}

function resetCalibrationFromPanel() {
    dpiScaleX = 1.0;
    dpiScaleY = 1.0;
    updateCalibrationPanelDisplay();
    
    const canvas = document.getElementById('tap-canvas');
    if (canvas) drawCanvasGuides(canvas);
    
    console.log('Calibration reset to default');
}

function showCalibrationUI() {
    // Create calibration overlay
    const overlay = document.createElement('div');
    overlay.id = 'calibration-overlay';
    overlay.innerHTML = `
        <div class="calibration-panel">
            <h3>🔧 Screen Calibration</h3>
            <p>Measure the red square with a ruler. It should be exactly 10cm × 10cm.</p>
            <p style="font-size: 0.9em; color: #999;">Screens can have different DPI in each dimension.</p>
            <p style="font-size: 0.85em; color: #ffa500; margin-top: 8px;"><strong>⚠️ Important:</strong> Calibration differs between fullscreen and windowed mode. Calibrate in the mode you'll use for your work.</p>
            <p style="font-size: 0.85em; color: #f48771; margin-top: 10px;"><strong>⚠️ Warning:</strong> Applying calibration will reset all keys and taps.</p>
            <div class="calibration-controls">
                <div class="calibration-dimension">
                    <label>Horizontal width (cm):</label>
                    <input type="number" id="calibration-input-x" value="10" min="5" max="15" step="0.1">
                </div>
                <div class="calibration-dimension">
                    <label>Vertical height (cm):</label>
                    <input type="number" id="calibration-input-y" value="10" min="5" max="15" step="0.1">
                </div>
                <div class="calibration-buttons">
                    <button onclick="applyCalibration()" class="btn-primary">Apply Calibration</button>
                    <button onclick="resetCalibration()" class="btn-secondary">Reset to Default</button>
                    <button onclick="toggleCalibration()" class="btn-cancel">Close</button>
                </div>
            </div>
            <div class="calibration-info">
                <p>DPI Scale X: <span id="dpi-scale-x-display">${dpiScaleX.toFixed(3)}</span> | Y: <span id="dpi-scale-y-display">${dpiScaleY.toFixed(3)}</span></p>
                <p>Effective DPI X: <span id="effective-dpi-x">${(96 * dpiScaleX).toFixed(1)}</span> | Y: <span id="effective-dpi-y">${(96 * dpiScaleY).toFixed(1)}</span></p>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
}

function hideCalibrationUI() {
    const overlay = document.getElementById('calibration-overlay');
    if (overlay) {
        overlay.remove();
    }
}

function applyCalibration() {
    const inputX = document.getElementById('calibration-input-x');
    const inputY = document.getElementById('calibration-input-y');
    const measuredCmX = parseFloat(inputX.value);
    const measuredCmY = parseFloat(inputY.value);
    
    if (measuredCmX < 5 || measuredCmX > 15 || measuredCmY < 5 || measuredCmY > 15) {
        alert('Please enter valid measurements between 5 and 15 cm');
        return;
    }
    
    // Calculate the scaling factors
    // If user measures 9cm instead of 10cm, the scale should be 10/9 = 1.111
    dpiScaleX = 10.0 / measuredCmX;
    dpiScaleY = 10.0 / measuredCmY;
    
    // Update display
    document.getElementById('dpi-scale-x-display').textContent = dpiScaleX.toFixed(3);
    document.getElementById('dpi-scale-y-display').textContent = dpiScaleY.toFixed(3);
    document.getElementById('effective-dpi-x').textContent = (96 * dpiScaleX).toFixed(1);
    document.getElementById('effective-dpi-y').textContent = (96 * dpiScaleY).toFixed(1);
    
    // Reset all keys to avoid mismatched sizes
    keys = [{
        id: 'key_0',
        name: 'Key 1',
        x: 0,
        y: 0,
        rotation: 0,
        clicks: 0,
        positions: [],
        finalized: false
    }];
    totalKeys = 1;
    currentKeyIndex = 0;
    keyIdCounter = 0;
    window.keys = keys;
    
    // Clear canvas overlay
    const overlay = document.getElementById('canvas-overlay');
    if (overlay) {
        overlay.innerHTML = '';
    }
    
    // Clear tap indicators
    app.setState({
        tapPositions: [],
        mappingData: {},
        tapCount: 0
    });
    
    // Redraw canvas with new scale
    const canvas = document.getElementById('tap-canvas');
    if (canvas) {
        drawCanvasGuides(canvas);
    }
    
    // Update UI
    updateKeyInfo();
    updateKeyPreview();
    updateKeyWorkflowUI();
    
    // Mark calibration as done
    localStorage.setItem('calibration-done', 'true');
    
    console.log(`Calibration applied: X=${measuredCmX}cm (scale: ${dpiScaleX.toFixed(3)}), Y=${measuredCmY}cm (scale: ${dpiScaleY.toFixed(3)})`);
    console.log('All keys and taps have been reset');
}

function resetCalibration() {
    dpiScaleX = 1.0;
    dpiScaleY = 1.0;
    document.getElementById('calibration-input-x').value = '10';
    document.getElementById('calibration-input-y').value = '10';
    document.getElementById('dpi-scale-x-display').textContent = dpiScaleX.toFixed(3);
    document.getElementById('dpi-scale-y-display').textContent = dpiScaleY.toFixed(3);
    document.getElementById('effective-dpi-x').textContent = (96 * dpiScaleX).toFixed(1);
    document.getElementById('effective-dpi-y').textContent = (96 * dpiScaleY).toFixed(1);
    
    const canvas = document.getElementById('tap-canvas');
    if (canvas) {
        drawCanvasGuides(canvas);
    }
    
    console.log('Calibration reset to default');
}

// Make functions globally accessible
window.toggleInstructions = toggleInstructions;
window.toggleCalibration = toggleCalibration;
window.toggleSquare = toggleSquare;
window.toggleHandIcon = toggleHandIcon;
window.applyCalibration = applyCalibration;
window.resetCalibration = resetCalibration;
window.applyCalibrationFromPanel = applyCalibrationFromPanel;
window.resetCalibrationFromPanel = resetCalibrationFromPanel;


// Fullscreen toggle function
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().then(() => {
            console.log('Entered fullscreen mode');
        }).catch((err) => {
            console.error('Error entering fullscreen:', err);
            alert('Fullscreen not supported or blocked by browser');
        });
    } else {
        document.exitFullscreen().then(() => {
            console.log('Exited fullscreen mode');
        }).catch((err) => {
            console.error('Error exiting fullscreen:', err);
        });
    }
}

function handleCanvasTap(event) {
    event.preventDefault();
    
    const canvas = event.target;
    const rect = canvas.getBoundingClientRect();
    
    // Get tap coordinates relative to canvas
    let clientX, clientY;
    if (event.touches && event.touches.length > 0) {
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
    } else {
        clientX = event.clientX;
        clientY = event.clientY;
    }
    
    // Calculate coordinates relative to canvas
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    // Ensure coordinates are within canvas bounds
    const boundedX = Math.max(0, Math.min(x, rect.width));
    const boundedY = Math.max(0, Math.min(y, rect.height));
    
    // Scale to canvas coordinate system (canvas internal coordinates)
    const canvasX = (boundedX * canvas.width) / rect.width;
    const canvasY = (boundedY * canvas.height) / rect.height;
    
    console.log('Tap detected:', {
        client: { x: clientX, y: clientY },
        rect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
        relative: { x: x, y: y },
        bounded: { x: boundedX, y: boundedY },
        canvas: { x: canvasX, y: canvasY },
        mode: currentMode
    });
    
    if (currentMode === 'move') {
        // Move mode - pan handled by mouse/touch move events
        return;
    } else if (currentMode === 'play') {
        // Play mode - track where keys are pressed
        handlePlayModeTap(boundedX, boundedY);
    } else if (currentMode === 'key' && currentKey) {
        handleKeyCreationTap(boundedX, boundedY);
    } else if (currentMode === 'tap') {
        // Tap mode - record finger mapping taps
        recordCanvasTap(canvasX, canvasY);
        
        // Add visual indicator using the bounded screen coordinates
        addTapIndicator(boundedX, boundedY, app.state.currentFinger);
        
        // Update tap counter for current finger
        updateTapCounter();
    }
}

function recordCanvasTap(x, y) {
    const tapData = {
        x: x,
        y: y,
        timestamp: Date.now(),
        finger: app.state.currentFinger,
        hand: app.state.currentHand,
        canvasWidth: app.state.canvasWidth,
        canvasHeight: app.state.canvasHeight
    };
    
    app.state.tapPositions.push(tapData);
    
    // Also store in the original format for compatibility
    const key = `${app.state.currentHand}_${app.state.currentFinger}`;
    if (!app.state.mappingData[key]) {
        app.state.mappingData[key] = [];
    }
    app.state.mappingData[key].push(tapData);
}

function addTapIndicator(x, y, finger) {
    const overlay = document.getElementById('canvas-overlay');
    const indicator = document.createElement('div');
    indicator.className = `tap-indicator finger-${finger}`;
    
    // Don't show numbers in the small dots - too crowded
    // indicator.textContent = app.state.tapCount + 1;
    
    // Since overlay now perfectly matches canvas dimensions,
    // we can use the coordinates directly
    indicator.style.left = x + 'px';
    indicator.style.top = y + 'px';
    
    overlay.appendChild(indicator);
    
    console.log('Added indicator at exact position:', { x, y, finger });
}

function switchFinger(finger) {
    app.setState({
        currentFinger: finger
    });
    updateFingerButtons();
    console.log('Switched to finger:', finger);
}

function switchHand(hand) {
    app.setState({
        currentHand: hand
    });
    updateHandButtons();
    updatePanelPosition(hand);
    
    // Update hand icon button
    const handIconText = document.getElementById('handIconText');
    if (handIconText) {
        handIconText.textContent = hand === 'right' ? '🤚' : '🖐️';
    }
    
    console.log('Switched to hand:', hand);
}

function updatePanelPosition(hand) {
    const panel = document.getElementById('keyPanel');
    const fullscreenBtn = document.querySelector('.fullscreen-icon-btn');
    const instructionsBtn = document.querySelector('.instructions-icon-btn');
    const calibrateBtn = document.querySelector('.calibrate-icon-btn');
    const squareBtn = document.querySelector('.square-icon-btn');
    const handBtn = document.querySelector('.hand-icon-btn');
    const tapsBtn = document.querySelector('.taps-icon-btn');
    const playArrowsBtn = document.querySelector('.play-arrows-icon-btn');
    
    // Left hand = panel on right, Right hand = panel on left
    if (hand === 'left') {
        // Panel on right
        if (panel) {
            panel.style.left = 'auto';
            panel.style.right = '20px';
        }
        // Fullscreen button on left
        if (fullscreenBtn) {
            fullscreenBtn.style.right = 'auto';
            fullscreenBtn.style.left = '20px';
        }
        // Instructions button on left
        if (instructionsBtn) {
            instructionsBtn.style.right = 'auto';
            instructionsBtn.style.left = '20px';
        }
        // Calibrate button on left
        if (calibrateBtn) {
            calibrateBtn.style.right = 'auto';
            calibrateBtn.style.left = '20px';
        }
        // Square button on left
        if (squareBtn) {
            squareBtn.style.right = 'auto';
            squareBtn.style.left = '20px';
        }
        // Hand button on left
        if (handBtn) {
            handBtn.style.right = 'auto';
            handBtn.style.left = '20px';
        }
        // Taps button on left
        if (tapsBtn) {
            tapsBtn.style.right = 'auto';
            tapsBtn.style.left = '20px';
        }
        // Play arrows button on left
        if (playArrowsBtn) {
            playArrowsBtn.style.right = 'auto';
            playArrowsBtn.style.left = '20px';
        }
    } else {
        // Panel on left
        if (panel) {
            panel.style.left = '20px';
            panel.style.right = 'auto';
        }
        // Fullscreen button on right
        if (fullscreenBtn) {
            fullscreenBtn.style.left = 'auto';
            fullscreenBtn.style.right = '20px';
        }
        // Instructions button on right
        if (instructionsBtn) {
            instructionsBtn.style.left = 'auto';
            instructionsBtn.style.right = '20px';
        }
        // Calibrate button on right
        if (calibrateBtn) {
            calibrateBtn.style.left = 'auto';
            calibrateBtn.style.right = '20px';
        }
        // Square button on right
        if (squareBtn) {
            squareBtn.style.left = 'auto';
            squareBtn.style.right = '20px';
        }
        // Hand button on right
        if (handBtn) {
            handBtn.style.left = 'auto';
            handBtn.style.right = '20px';
        }
        // Taps button on right
        if (tapsBtn) {
            tapsBtn.style.left = 'auto';
            tapsBtn.style.right = '20px';
        }
        // Play arrows button on right
        if (playArrowsBtn) {
            playArrowsBtn.style.left = 'auto';
            playArrowsBtn.style.right = '20px';
        }
    }
}

function updateFingerButtons() {
    const buttons = document.querySelectorAll('.finger-btn');
    buttons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.finger === app.state.currentFinger);
    });
}

function updateHandButtons() {
    const buttons = document.querySelectorAll('.hand-btn');
    buttons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.hand === app.state.currentHand);
    });
}

function updateTapCounter() {
    const fingerKey = `${app.state.currentHand}_${app.state.currentFinger}`;
    const tapCount = app.state.mappingData[fingerKey] ? app.state.mappingData[fingerKey].length : 0;
    
    app.setState({
        tapCount: tapCount
    });
}

function clearCurrentFinger() {
    const fingerKey = `${app.state.currentHand}_${app.state.currentFinger}`;
    
    if (confirm(`Clear all taps for ${app.state.currentHand} ${app.state.currentFinger} finger?`)) {
        // Remove from mapping data
        delete app.state.mappingData[fingerKey];
        
        // Remove from tap positions
        app.state.tapPositions = app.state.tapPositions.filter(
            tap => !(tap.finger === app.state.currentFinger && tap.hand === app.state.currentHand)
        );
        
        // Remove visual indicators for this finger
        const indicators = document.querySelectorAll(`.tap-indicator.finger-${app.state.currentFinger}`);
        indicators.forEach(indicator => {
            // Check if it's the right hand too
            const tapData = app.state.tapPositions.find(tap => 
                tap.finger === app.state.currentFinger && 
                tap.hand === app.state.currentHand
            );
            if (!tapData) {
                indicator.remove();
            }
        });
        
        updateTapCounter();
        console.log('Cleared finger:', fingerKey);
    }
}

function completeMappingPhase() {
    // Analyze tap positions
    analyzeTapPositions();
    
    app.setState({
        isMapping: false,
        isComplete: true
    });
}

function analyzeTapPositions() {
    console.log('Analyzing tap positions:', app.state.tapPositions);
    
    // Group taps by finger and hand
    const fingerGroups = {};
    app.state.tapPositions.forEach(tap => {
        const key = `${tap.hand}_${tap.finger}`;
        if (!fingerGroups[key]) {
            fingerGroups[key] = [];
        }
        fingerGroups[key].push(tap);
    });
    
    // Calculate optimal key positions based on tap clusters
    const suggestedKeys = [];
    Object.keys(fingerGroups).forEach(fingerKey => {
        const taps = fingerGroups[fingerKey];
        const [hand, finger] = fingerKey.split('_');
        
        // Calculate average position for this finger
        const avgX = taps.reduce((sum, tap) => sum + tap.x, 0) / taps.length;
        const avgY = taps.reduce((sum, tap) => sum + tap.y, 0) / taps.length;
        
        suggestedKeys.push({
            x: avgX,
            y: avgY,
            finger: finger,
            hand: hand,
            taps: taps.length
        });
    });
    
    // Store suggestions for export
    app.state.suggestedKeys = suggestedKeys;
    
    // Show suggested key positions on canvas
    showSuggestedKeys(suggestedKeys);
}

function showSuggestedKeys(suggestedKeys) {
    const overlay = document.getElementById('canvas-overlay');
    
    suggestedKeys.forEach((key, index) => {
        const suggestion = document.createElement('div');
        suggestion.className = `suggested-key finger-${key.finger}`;
        suggestion.textContent = key.finger.charAt(0).toUpperCase();
        suggestion.title = `${key.hand} ${key.finger} (${key.taps} taps)`;
        
        // Position based on canvas coordinates
        const canvas = document.getElementById('tap-canvas');
        const rect = canvas.getBoundingClientRect();
        const relativeX = (key.x * rect.width) / app.state.canvasWidth;
        const relativeY = (key.y * rect.height) / app.state.canvasHeight;
        
        suggestion.style.left = relativeX + 'px';
        suggestion.style.top = relativeY + 'px';
        
        overlay.appendChild(suggestion);
    });
}

function finishMapping() {
    if (app.state.tapPositions.length === 0) {
        alert('Please tap on the canvas with different fingers first!');
        return;
    }
    
    if (confirm('Finish mapping and analyze positions? You can always come back and add more taps.')) {
        // Exit fullscreen mode
        const mappingContainer = document.getElementById('mapping-container');
        mappingContainer.classList.remove('fullscreen');
        
        hideElement('mapping-container');
        showElement('results-container');
        
        // Analyze and generate layout preview
        analyzeTapPositions();
        generateLayoutPreview();
    }
}

// Add keyboard shortcuts
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (event) => {
        if (!app.state.isMapping) return;
        
        // Play mode - disable keyboard input, only taps allowed
        if (playModeActive) {
            return; // Do nothing in play mode for keyboard
        }
        
        switch(event.key) {
            case 'Escape':
                if (confirm('Exit mapping mode?')) {
                    finishMapping();
                }
                break;
            case '1': switchFinger('thumb'); break;
            case '2': switchFinger('index'); break;
            case '3': switchFinger('middle'); break;
            case '4': switchFinger('ring'); break;
            case '5': switchFinger('pinky'); break;
            case 'q': case 'Q': switchHand('left'); break;
            case 'e': case 'E': switchHand('right'); break;
            case 'c': case 'C': 
                if (event.ctrlKey || event.metaKey) {
                    event.preventDefault();
                    clearCurrentFinger();
                }
                break;
            case 'r': case 'R':
                if (event.ctrlKey || event.metaKey) {
                    event.preventDefault();
                    resetMapping();
                }
                break;
            case ' ': // Spacebar to toggle controls
                event.preventDefault();
                toggleControls();
                break;
        }
    });
}

// Initialize keyboard shortcuts when mapping starts
function initializeMapping() {
    initializeCanvas();
    startFingerMapping();
    setupKeyboardShortcuts();
    
    // Show free mapping mode by default with finger controls always visible
    document.getElementById('freeMappingInfo').style.display = 'block';
    document.getElementById('keyProgressSection').style.display = 'none';
    document.getElementById('freeMapActions').style.display = 'flex';
    document.getElementById('keyCreateActions').style.display = 'none';
    keyCreationMode = false;
    
    console.log('Keyboard shortcuts active:', {
        'Escape': 'Exit mapping',
        '1-5': 'Switch fingers',
        'Q/E': 'Switch hands',
        'Ctrl+C': 'Clear finger',
        'Ctrl+R': 'Reset all',
        'Space': 'Toggle controls'
    });
}

function completeMappingPhase() {
    app.setState({
        isMapping: false,
        isComplete: true
    });
    showElement('finish-mapping');
}

function skipCurrent() {
    if (confirm('Skip current finger mapping? This will move to the next finger/position.')) {
        completeCurrentMapping();
    }
}

function resetMapping() {
    if (confirm('Reset all mapping data? This will clear all taps for all fingers.')) {
        // Clear canvas overlay
        const overlay = document.getElementById('canvas-overlay');
        overlay.innerHTML = '';
        
        // Clear tap data
        app.setState({
            tapPositions: [],
            mappingData: {},
            suggestedKeys: [],
            tapCount: 0
        });
        
        // Reset keys array if in key creation mode
        if (keys.length > 0) {
            keys.forEach(key => {
                key.positions = [];
                key.clicks = 0;
                key.x = 0;
                key.y = 0;
                key.rotation = 0;
            });
        }
        
        // Restart mapping
        startFingerMapping();
        
        // Redraw canvas
        const canvas = document.getElementById('tap-canvas');
        drawCanvasGuides(canvas);
        
        console.log('Reset all mapping data');
    }
}

// Export functions now handle data export without leaving the mapping interface

// Key creation workflow functions
function startKeyCreationMode() {
    // Deprecated - use setMode('key') instead
    setMode('key');
}

function pauseKeyCreationMode() {
    // Deprecated - use setMode('tap') instead
    setMode('tap');
}

function startKeyCreationWorkflow() {
    // This function is now called by startKeyCreationMode
    currentKey = keys[currentKeyIndex];
    updateKeyWorkflowUI();
    updateKeyPreview();
    console.log('Started key creation workflow');
}

function updateKeyWorkflowUI() {
    const progressElement = document.getElementById('keyProgress');
    const keyNameElement = document.getElementById('currentKeyName');
    const keyTapCountElement = document.getElementById('keyTapCount');
    const keyIndexElement = document.getElementById('keyIndex');
    const prevBtn = document.getElementById('prevKeyBtn');
    const nextBtn = document.getElementById('nextKeyBtn');
    const keySelector = document.getElementById('keySelector');
    
    if (progressElement) progressElement.textContent = `Key ${currentKeyIndex + 1} of ${totalKeys}`;
    if (keyNameElement) keyNameElement.textContent = keys[currentKeyIndex].name;
    if (keyTapCountElement && currentKey) {
        keyTapCountElement.textContent = `${currentKey.clicks}/10 taps required`;
    }
    if (keyIndexElement) keyIndexElement.textContent = `${currentKeyIndex + 1} / ${totalKeys}`;
    if (prevBtn) prevBtn.disabled = currentKeyIndex === 0;
    if (nextBtn) nextBtn.disabled = currentKeyIndex === totalKeys - 1;
    
    // Update key selector dropdown
    if (keySelector) {
        // Rebuild options
        keySelector.innerHTML = '';
        keys.forEach((key, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = `Key ${index + 1}${key.clicks > 0 ? ' (' + key.clicks + '/10)' : ''}`;
            if (index === currentKeyIndex) {
                option.selected = true;
            }
            keySelector.appendChild(option);
        });
    }
    
    updateKeyVisibility();
}

function previousKey() {
    if (currentKeyIndex > 0) {
        saveCurrentKeyState();
        currentKeyIndex--;
        currentKey = keys[currentKeyIndex];
        loadKeyState();
        updateKeyWorkflowUI();
    }
}

function nextKey() {
    if (currentKeyIndex < totalKeys - 1) {
        saveCurrentKeyState();
        currentKeyIndex++;
        currentKey = keys[currentKeyIndex];
        loadKeyState();
        updateKeyWorkflowUI();
    }
}

function selectKeyFromDropdown(indexStr) {
    const index = parseInt(indexStr);
    if (index >= 0 && index < keys.length && index !== currentKeyIndex) {
        saveCurrentKeyState();
        currentKeyIndex = index;
        currentKey = keys[currentKeyIndex];
        loadKeyState();
        updateKeyWorkflowUI();
        console.log('Selected key:', index + 1);
    }
}

function saveCurrentKeyState() {
    if (currentKey && currentKey.clicks > 0) {
        keys[currentKeyIndex] = { ...currentKey };
        
        // Create or update finalized key element
        const existingKey = document.getElementById(currentKey.id);
        if (existingKey) {
            existingKey.remove();
        }
        
        const keyElement = document.createElement('div');
        keyElement.className = 'canvas-key';
        keyElement.id = currentKey.id;
        const KEY_SIZE = getScaledOneU();
        const HALF_KEY = KEY_SIZE / 2;
        keyElement.style.left = (currentKey.x - HALF_KEY) + 'px';
        keyElement.style.top = (currentKey.y - HALF_KEY) + 'px';
        keyElement.style.setProperty('width', KEY_SIZE + 'px', 'important');
        keyElement.style.setProperty('height', KEY_SIZE + 'px', 'important');
        keyElement.style.setProperty('width', KEY_SIZE + 'px', 'important');
        keyElement.style.setProperty('height', KEY_SIZE + 'px', 'important');
        keyElement.style.transform = `rotate(${currentKey.rotation}deg)`;
        keyElement.textContent = (currentKeyIndex + 1).toString();
        keyElement.style.display = 'flex'; // Always show finalized keys
        
        const overlay = document.querySelector('.canvas-overlay');
        overlay.appendChild(keyElement);
    }
}

function loadKeyState() {
    // Update the current key reference
    currentKey = keys[currentKeyIndex];
    
    // Update the UI to show the loaded key
    updateKeyWorkflowUI();
    updateKeyPreview();
    updateOverlapHighlighting();
}

// Key management functions
function addNewKey() {
    // Save current key state before switching
    if (currentKey && currentKey.clicks > 0) {
        keys[currentKeyIndex] = { ...currentKey };
    }
    
    // Add a new key to the array
    const newKeyIndex = keys.length;
    keys.push({
        id: `key_${newKeyIndex}`,
        name: `Key ${newKeyIndex + 1}`,
        x: 0,
        y: 0,
        rotation: 0,
        clicks: 0,
        positions: [],
        finalized: false
    });
    
    // Update total keys and switch to the new key
    totalKeys = keys.length;
    currentKeyIndex = newKeyIndex;
    currentKey = keys[currentKeyIndex];
    
    // Update global reference
    window.keys = keys;
    
    // Update UI
    updateKeyWorkflowUI();
    updateKeyPreview();
    
    console.log(`Added new key: ${currentKey.name}`);
}

function removeCurrentKey() {
    if (keys.length <= 1) {
        console.log('Cannot remove the last key');
        return;
    }
    
    // Remove visual elements for this key
    const keyElement = document.getElementById(currentKey.id);
    if (keyElement) keyElement.remove();
    
    const preview = document.querySelector('.canvas-key.preview');
    if (preview) preview.remove();
    
    // Remove from keys array
    keys.splice(currentKeyIndex, 1);
    totalKeys = keys.length;
    
    // Adjust current index if needed
    if (currentKeyIndex >= totalKeys) {
        currentKeyIndex = totalKeys - 1;
    }
    
    // Update current key reference
    currentKey = keys[currentKeyIndex];
    
    // Update global reference
    window.keys = keys;
    
    // Update UI
    updateKeyWorkflowUI();
    updateKeyPreview();
    
    console.log(`Removed key, now have ${totalKeys} keys`);
}

function resetCurrentKey() {
    if (currentKey) {
        // Reset current key data
        currentKey.positions = [];
        currentKey.clicks = 0;
        currentKey.x = 0;
        currentKey.y = 0;
        currentKey.rotation = 0;
        
        // Remove visual elements for this key
        const keyElement = document.getElementById(currentKey.id);
        if (keyElement) keyElement.remove();
        
        const preview = document.querySelector('.canvas-key.preview');
        if (preview) preview.remove();
        
        // Update UI
        updateKeyWorkflowUI();
        updateKeyPreview();
        
        console.log(`Reset key: ${currentKey.name}`);
    }
}

// Removed toggleCurrentKeyTaps - simplified key visibility

function updateKeyVisibility() {
    const allKeyElements = document.querySelectorAll('.canvas-key');
    const allTapIndicators = document.querySelectorAll('.tap-indicator');
    const currentKeyId = keys[currentKeyIndex] ? keys[currentKeyIndex].id : null;
    
    allKeyElements.forEach(element => {
        if (keyCreationMode) {
            // In key creation mode, always show all finalized keys and current preview
            element.style.display = 'flex';
        } else if (showOnlyCurrentKey && currentKeyId) {
            // Show current key preview and finalized current key
            const isCurrentKey = element.id === currentKeyId || element.id === currentKeyId + '_preview' || element.classList.contains('preview');
            element.style.display = isCurrentKey ? 'flex' : 'none';
        } else {
            // Respect global key visibility setting
            element.style.display = keysVisible ? 'flex' : 'none';
        }
    });
    
    // Also handle tap indicators
    allTapIndicators.forEach(indicator => {
        if (showOnlyCurrentKey) {
            // Show only tap indicators for current key
            const isCurrentKeyTap = indicator.classList.contains(`finger-key-${currentKeyIndex}`) || 
                                   indicator.classList.contains('finger-key-creation');
            indicator.style.display = (isCurrentKeyTap && tapIndicatorsVisible) ? 'block' : 'none';
        } else {
            indicator.style.display = tapIndicatorsVisible ? 'block' : 'none';
        }
    });
}

// Key management functions
function addNewKey() {
    // Add a new key to the array
    const newKeyIndex = keys.length;
    keys.push({
        id: `key_${newKeyIndex}`,
        name: `Key ${newKeyIndex + 1}`,
        x: 0,
        y: 0,
        rotation: 0,
        clicks: 0,
        positions: [],
        finalized: false
    });
    
    // Update total keys and switch to the new key
    totalKeys = keys.length;
    currentKeyIndex = newKeyIndex;
    currentKey = keys[currentKeyIndex];
    
    // Update global reference
    window.keys = keys;
    
    // Update UI
    updateKeyWorkflowUI();
    updateKeyPreview();
    
    console.log(`Added new key: ${currentKey.name}`);
}

function resetCurrentKey() {
    if (currentKey) {
        // Reset current key data
        currentKey.positions = [];
        currentKey.clicks = 0;
        currentKey.x = 0;
        currentKey.y = 0;
        currentKey.rotation = 0;
        
        // Remove visual elements for this key
        const keyElement = document.getElementById(currentKey.id);
        if (keyElement) keyElement.remove();
        
        const preview = document.querySelector('.canvas-key.preview');
        if (preview) preview.remove();
        
        // Update UI
        updateKeyWorkflowUI();
        updateKeyPreview();
        
        console.log(`Reset key: ${currentKey.name}`);
    }
}

function clearCurrentKey() {
    resetCurrentKey(); // Use the new resetCurrentKey function
}

// Removed finishAllKeys - replaced with export options that don't interrupt workflow

function handleKeyCreationTap(x, y) {
    if (!currentKey) return;
    
    currentKey.positions.push({ x, y });
    currentKey.clicks = currentKey.positions.length;
    
    // Calculate average position
    const avgX = currentKey.positions.reduce((sum, pos) => sum + pos.x, 0) / currentKey.positions.length;
    const avgY = currentKey.positions.reduce((sum, pos) => sum + pos.y, 0) / currentKey.positions.length;
    
    // Apply grid snapping if enabled (0.25u = 18px)
    currentKey.x = snapToGridEnabled ? snapToGrid(avgX) : avgX;
    currentKey.y = snapToGridEnabled ? snapToGrid(avgY) : avgY;
    
    // 1u key size = 19.05mm = 72px at 96 DPI (scaled)
    const KEY_SIZE = getScaledOneU();
    const HALF_KEY = KEY_SIZE / 2;
    
    // Create/update finalized key element immediately
    const existingKey = document.getElementById(currentKey.id);
    if (existingKey) {
        existingKey.remove();
    }
    
    const keyElement = document.createElement('div');
    keyElement.className = 'canvas-key';
    keyElement.id = currentKey.id;
    keyElement.style.left = (currentKey.x - HALF_KEY) + 'px';
    keyElement.style.top = (currentKey.y - HALF_KEY) + 'px';
    keyElement.style.setProperty('width', KEY_SIZE + 'px', 'important');
    keyElement.style.setProperty('height', KEY_SIZE + 'px', 'important');
    keyElement.style.transform = `rotate(${currentKey.rotation}deg)`;
    keyElement.textContent = (currentKeyIndex + 1).toString();
    keyElement.style.display = 'flex';
    
    const overlay = document.querySelector('.canvas-overlay');
    overlay.appendChild(keyElement);
    
    updateKeyInfo();
    updateKeyPreview();
    updateKeyWorkflowUI();
    updateOverlapHighlighting();
    
    // Add tap indicator for feedback with current key styling
    addTapIndicator(x, y, `key-${currentKeyIndex}`);
    
    console.log(`${currentKey.name} click ${currentKey.clicks} at (${x}, ${y}), avg: (${avgX.toFixed(1)}, ${avgY.toFixed(1)})`);
}

// Check if two keys overlap
function keysOverlap(key1, key2) {
    const KEY_SIZE = getScaledOneU();
    const HALF_KEY = KEY_SIZE / 2;
    
    // Get bounding boxes for both keys
    const left1 = key1.x - HALF_KEY;
    const right1 = key1.x + HALF_KEY;
    const top1 = key1.y - HALF_KEY;
    const bottom1 = key1.y + HALF_KEY;
    
    const left2 = key2.x - HALF_KEY;
    const right2 = key2.x + HALF_KEY;
    const top2 = key2.y - HALF_KEY;
    const bottom2 = key2.y + HALF_KEY;
    
    // Add tolerance to account for floating point precision and small gaps
    const TOLERANCE = 5;
    
    // Check if rectangles overlap
    // Keys are NOT overlapping if they are separated or just touching (within tolerance)
    const separated = (right1 <= left2 + TOLERANCE || left1 >= right2 - TOLERANCE || 
                      bottom1 <= top2 + TOLERANCE || top1 >= bottom2 - TOLERANCE);
    
    return !separated;
}

// Update all keys' visual state based on overlaps
function updateOverlapHighlighting() {
    // Check each key against all other keys
    keys.forEach((key, index) => {
        if (!key.finalized && key.clicks === 0) return;
        
        const keyElement = document.getElementById(key.id);
        if (!keyElement) return;
        
        let hasOverlap = false;
        
        // Check against all other keys
        for (let i = 0; i < keys.length; i++) {
            if (i === index) continue;
            const otherKey = keys[i];
            if (!otherKey.finalized && otherKey.clicks === 0) continue;
            
            if (keysOverlap(key, otherKey)) {
                hasOverlap = true;
                break;
            }
        }
        
        // Update visual state
        if (hasOverlap) {
            keyElement.classList.add('overlapping');
        } else {
            keyElement.classList.remove('overlapping');
        }
    });
}

function updateKeyInfo() {
    if (!currentKey) return;
    
    // Update tap count display if element exists
    const keyTapCountElement = document.getElementById('keyTapCount');
    if (keyTapCountElement) {
        keyTapCountElement.textContent = `${currentKey.clicks}/10 taps required`;
    }
}

function updateKeyPreview() {
    if (!currentKey) return;
    
    // Remove existing preview for current key
    const existingPreview = document.querySelector('.canvas-key.preview');
    if (existingPreview) {
        existingPreview.remove();
    }
    
    // Don't remove finalized keys - let them persist
    // Only update the preview for the current key being edited
    
    if (currentKey.clicks > 0) {
        const keyElement = document.createElement('div');
        keyElement.className = 'canvas-key preview';
        keyElement.id = currentKey.id + '_preview';
        const KEY_SIZE = getScaledOneU();
        const HALF_KEY = KEY_SIZE / 2;
        keyElement.style.left = (currentKey.x - HALF_KEY) + 'px';
        keyElement.style.top = (currentKey.y - HALF_KEY) + 'px';
        keyElement.style.setProperty('width', KEY_SIZE + 'px', 'important');
        keyElement.style.setProperty('height', KEY_SIZE + 'px', 'important');
        keyElement.style.transform = `rotate(${currentKey.rotation}deg)`;
        keyElement.textContent = (currentKeyIndex + 1).toString();
        keyElement.style.display = 'flex'; // Always show preview in key creation mode
        
        const overlay = document.querySelector('.canvas-overlay');
        overlay.appendChild(keyElement);
    }
}

function updateKeyRotation(value) {
    if (!currentKey) return;
    currentKey.rotation = parseInt(value);
    document.getElementById('rotationValue').textContent = value + '°';
    updateKeyPreview();
}

function toggleKeyPanel() {
    const panel = document.getElementById('keyPanel');
    const btn = panel.querySelector('.toggle-btn');
    
    panel.classList.toggle('collapsed');
    btn.textContent = panel.classList.contains('collapsed') ? '+' : '−';
}

// Tap visibility control
let tapIndicatorsVisible = true;
let keysVisible = true;

function toggleSnapToGrid(enabled) {
    snapToGridEnabled = enabled;
    console.log('Snap to grid:', enabled ? 'enabled' : 'disabled');
}

// Mode switching functions
function setMode(mode) {
    currentMode = mode;
    
    // Update button states
    document.getElementById('moveMode').classList.remove('active');
    document.getElementById('tapMode').classList.remove('active');
    document.getElementById('keyMode').classList.remove('active');
    document.getElementById('calibrateMode').classList.remove('active');
    document.getElementById('playMode').classList.remove('active');
    document.getElementById('exportMode').classList.remove('active');
    document.getElementById(mode + 'Mode').classList.add('active');
    
    // Update mode description and UI sections
    const modeDescElement = document.getElementById('modeDescription');
    const keyProgressSection = document.getElementById('keyProgressSection');
    const freeMappingInfo = document.getElementById('freeMappingInfo');
    const freeMapActions = document.getElementById('freeMapActions');
    const keyCreateActions = document.getElementById('keyCreateActions');
    
    if (mode === 'move') {
        modeDescElement.textContent = 'Move Mode: Pan canvas, keys, or taps';
        keyProgressSection.style.display = 'none';
        freeMappingInfo.style.display = 'none';
        freeMapActions.style.display = 'none';
        keyCreateActions.style.display = 'flex';
        document.getElementById('moveModeOptions').style.display = 'block';
        document.getElementById('exportModeOptions').style.display = 'none';
        document.getElementById('calibrateModeOptions').style.display = 'none';
        document.getElementById('playModeOptions').style.display = 'none';
        document.getElementById('fingerMappingControls').style.display = 'none';
        keyCreationMode = false;
        playModeActive = false;
        
        // Change cursor
        document.getElementById('tap-canvas').style.cursor = 'grab';
    } else if (mode === 'tap') {
        modeDescElement.textContent = 'Tap Mode: Record finger mapping positions';
        keyProgressSection.style.display = 'none';
        freeMappingInfo.style.display = 'block';
        freeMapActions.style.display = 'flex';
        keyCreateActions.style.display = 'none';
        document.getElementById('moveModeOptions').style.display = 'none';
        document.getElementById('exportModeOptions').style.display = 'none';
        document.getElementById('calibrateModeOptions').style.display = 'none';
        document.getElementById('playModeOptions').style.display = 'none';
        document.getElementById('fingerMappingControls').style.display = 'block';
        keyCreationMode = false;
        playModeActive = false;
        
        // Restore cursor
        document.getElementById('tap-canvas').style.cursor = 'crosshair';
    } else if (mode === 'key') {
        modeDescElement.textContent = 'Key Mode: Create and edit keys';
        keyProgressSection.style.display = 'block';
        freeMappingInfo.style.display = 'none';
        freeMapActions.style.display = 'none';
        keyCreateActions.style.display = 'flex';
        document.getElementById('moveModeOptions').style.display = 'none';
        document.getElementById('exportModeOptions').style.display = 'none';
        document.getElementById('calibrateModeOptions').style.display = 'none';
        document.getElementById('playModeOptions').style.display = 'none';
        document.getElementById('fingerMappingControls').style.display = 'none';
        keyCreationMode = true;
        playModeActive = false;
        
        // Initialize key mode if needed
        if (keys.length === 0) {
            keys.push({
                id: `key_0`,
                name: `Key 1`,
                x: 0,
                y: 0,
                rotation: 0,
                clicks: 0,
                positions: [],
                finalized: false
            });
            totalKeys = 1;
            currentKeyIndex = 0;
            window.keys = keys;
        }
        
        currentKey = keys[currentKeyIndex];
        updateKeyWorkflowUI();
        updateKeyPreview();
        
        // Restore cursor
        document.getElementById('tap-canvas').style.cursor = 'crosshair';
    } else if (mode === 'export') {
        modeDescElement.textContent = 'Export Mode: Save or import layouts';
        keyProgressSection.style.display = 'none';
        freeMappingInfo.style.display = 'none';
        freeMapActions.style.display = 'none';
        keyCreateActions.style.display = 'none';
        document.getElementById('moveModeOptions').style.display = 'none';
        document.getElementById('exportModeOptions').style.display = 'block';
        document.getElementById('calibrateModeOptions').style.display = 'none';
        document.getElementById('playModeOptions').style.display = 'none';
        document.getElementById('fingerMappingControls').style.display = 'none';
        keyCreationMode = false;
        playModeActive = false;
        
        // Restore cursor
        document.getElementById('tap-canvas').style.cursor = 'default';
    } else if (mode === 'calibrate') {
        modeDescElement.textContent = 'Calibrate Mode: Adjust screen DPI';
        keyProgressSection.style.display = 'none';
        freeMappingInfo.style.display = 'none';
        freeMapActions.style.display = 'none';
        keyCreateActions.style.display = 'none';
        document.getElementById('moveModeOptions').style.display = 'none';
        document.getElementById('exportModeOptions').style.display = 'none';
        document.getElementById('calibrateModeOptions').style.display = 'block';
        document.getElementById('playModeOptions').style.display = 'none';
        document.getElementById('fingerMappingControls').style.display = 'none';
        keyCreationMode = false;
        playModeActive = false;
        
        // Show calibration square
        showCalibration = true;
        
        // Update panel display values
        updateCalibrationPanelDisplay();
        
        // Restore cursor
        document.getElementById('tap-canvas').style.cursor = 'default';
    } else if (mode === 'play') {
        modeDescElement.textContent = 'Play Mode: Tap keys to track pressing positions';
        keyProgressSection.style.display = 'none';
        freeMappingInfo.style.display = 'none';
        freeMapActions.style.display = 'none';
        keyCreateActions.style.display = 'none';
        document.getElementById('moveModeOptions').style.display = 'none';
        document.getElementById('exportModeOptions').style.display = 'none';
        document.getElementById('calibrateModeOptions').style.display = 'none';
        document.getElementById('playModeOptions').style.display = 'block';
        document.getElementById('fingerMappingControls').style.display = 'none';
        keyCreationMode = false;
        playModeActive = true;
        
        // Hide instructions and calibration square in play mode
        showInstructions = false;
        showCalibration = false;
        
        // Show all keys, hide tap indicators
        const allKeyElements = document.querySelectorAll('.canvas-key');
        allKeyElements.forEach(keyEl => {
            keyEl.style.display = 'flex';
        });
        
        const allTapIndicators = document.querySelectorAll('.tap-indicator');
        allTapIndicators.forEach(tapEl => {
            tapEl.style.display = 'none';
        });
        
        // Update arrows if any taps exist
        updatePlayModeArrows();
        
        // Restore cursor
        document.getElementById('tap-canvas').style.cursor = 'crosshair';
    }
    
    // Redraw canvas to show mode-specific instructions
    const canvas = document.getElementById('tap-canvas');
    if (canvas) {
        drawCanvasGuides(canvas);
    }
    
    console.log('Mode changed to:', mode);
}

// Canvas panning functions
function handlePanStart(event) {
    if (currentMode !== 'move') return;
    
    isPanning = true;
    
    let clientX, clientY;
    if (event.touches && event.touches.length > 0) {
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
    } else {
        clientX = event.clientX;
        clientY = event.clientY;
    }
    
    lastPanX = clientX;
    lastPanY = clientY;
    
    document.getElementById('tap-canvas').style.cursor = 'grabbing';
    event.preventDefault();
}

function handlePanMove(event) {
    if (currentMode !== 'move' || !isPanning) return;
    
    let clientX, clientY;
    if (event.touches && event.touches.length > 0) {
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
    } else {
        clientX = event.clientX;
        clientY = event.clientY;
    }
    
    const deltaX = clientX - lastPanX;
    const deltaY = clientY - lastPanY;
    
    canvasPanX += deltaX;
    canvasPanY += deltaY;
    
    lastPanX = clientX;
    lastPanY = clientY;
    
    // Get lock states
    const lockKeys = document.getElementById('lockKeys')?.checked || false;
    const lockTaps = document.getElementById('lockTaps')?.checked || false;
    const lockCanvas = document.getElementById('lockCanvas')?.checked || false;
    
    // Pan canvas (grid background) if not locked
    if (!lockCanvas) {
        const canvas = document.getElementById('tap-canvas');
        
        // Redraw grid with new pan offset
        drawCanvasGuides(canvas);
    }
    
    // Update key positions if not locked
    if (!lockKeys) {
        const allKeys = document.querySelectorAll('.canvas-key');
        allKeys.forEach(keyEl => {
            const currentLeft = parseFloat(keyEl.style.left) || 0;
            const currentTop = parseFloat(keyEl.style.top) || 0;
            keyEl.style.left = (currentLeft + deltaX) + 'px';
            keyEl.style.top = (currentTop + deltaY) + 'px';
        });
        
        // Update key data
        keys.forEach(key => {
            key.x += deltaX;
            key.y += deltaY;
            if (key.positions && key.positions.length > 0) {
                key.positions.forEach(pos => {
                    pos.x += deltaX;
                    pos.y += deltaY;
                });
            }
        });
        
        // Update play mode tap positions
        Object.keys(playModeTaps).forEach(keyId => {
            playModeTaps[keyId].forEach(tap => {
                tap.x += deltaX;
                tap.y += deltaY;
            });
        });
        
        // Update play mode arrows
        const allPlayArrows = document.querySelectorAll('.play-mode-arrow');
        allPlayArrows.forEach(arrowEl => {
            const currentLeft = parseFloat(arrowEl.style.left) || 0;
            const currentTop = parseFloat(arrowEl.style.top) || 0;
            arrowEl.style.left = (currentLeft + deltaX) + 'px';
            arrowEl.style.top = (currentTop + deltaY) + 'px';
        });
    }
    
    // Update tap indicators if not locked
    if (!lockTaps) {
        const allTaps = document.querySelectorAll('.tap-indicator');
        allTaps.forEach(tapEl => {
            const currentLeft = parseFloat(tapEl.style.left) || 0;
            const currentTop = parseFloat(tapEl.style.top) || 0;
            tapEl.style.left = (currentLeft + deltaX) + 'px';
            tapEl.style.top = (currentTop + deltaY) + 'px';
        });
    }
    
    event.preventDefault();
}

function handlePanEnd(event) {
    if (currentMode !== 'move') return;
    
    isPanning = false;
    document.getElementById('tap-canvas').style.cursor = 'grab';
    event.preventDefault();
}

function toggleTapVisibility(show) {
    tapIndicatorsVisible = show;
    const allTapIndicators = document.querySelectorAll('.tap-indicator');
    
    allTapIndicators.forEach(indicator => {
        indicator.style.display = show ? 'block' : 'none';
    });
    
    // Update button states
    document.getElementById('showTapsBtn').classList.toggle('active', show);
    document.getElementById('hideTapsBtn').classList.toggle('active', !show);
    
    console.log('Tap indicators:', show ? 'shown' : 'hidden');
}

function toggleKeyVisibility(show) {
    keysVisible = show;
    const allKeyElements = document.querySelectorAll('.canvas-key');
    
    allKeyElements.forEach(keyElement => {
        // Don't hide the current preview key if in key creation mode
        if (keyCreationMode && keyElement.classList.contains('preview')) {
            return; // Keep preview visible
        }
        keyElement.style.display = show ? 'flex' : 'none';
    });
    
    // Update button states
    document.getElementById('showKeysBtn').classList.toggle('active', show);
    document.getElementById('hideKeysBtn').classList.toggle('active', !show);
    
    console.log('Defined keys:', show ? 'shown' : 'hidden');
}

// Play Mode Functions
function handlePlayModeKeypress(event) {
    // Don't interfere with mode switching or controls
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    
    // Map key to key index (simple mapping for now)
    // You can customize this mapping based on your layout
    const keyChar = event.key.toLowerCase();
    
    // Find a key that might match (first approximation)
    // In a real implementation, you'd map specific keys to specific positions
    let keyIndex = -1;
    
    // Simple mapping: number keys 1-9,0 map to key indices 0-9
    if (keyChar >= '0' && keyChar <= '9') {
        keyIndex = keyChar === '0' ? 9 : parseInt(keyChar) - 1;
    } else {
        // For letter keys, map based on position in alphabet (for demo)
        const charCode = keyChar.charCodeAt(0);
        if (charCode >= 97 && charCode <= 122) { // a-z
            keyIndex = charCode - 97; // a=0, b=1, etc.
        }
    }
    
    // Check if we have a key at this index
    if (keyIndex >= 0 && keyIndex < keys.length) {
        highlightKey(keyIndex);
    }
}

function handlePlayModeKeyup(event) {
    // Remove highlight when key is released
    unhighlightKey();
}

function highlightKey(keyIndex) {
    if (keyIndex < 0 || keyIndex >= keys.length) return;
    
    const key = keys[keyIndex];
    highlightedKeyId = key.id;
    
    // Update the visual highlight
    const allKeyElements = document.querySelectorAll('.canvas-key');
    allKeyElements.forEach(keyEl => {
        if (keyEl.id === key.id || keyEl.id === key.id + '_preview') {
            keyEl.classList.add('highlighted');
        } else {
            keyEl.classList.remove('highlighted');
        }
    });
}

function unhighlightKey() {
    highlightedKeyId = null;
    const allKeyElements = document.querySelectorAll('.canvas-key');
    allKeyElements.forEach(keyEl => {
        keyEl.classList.remove('highlighted');
    });
}

function handlePlayModeTap(x, y) {
    // Find which key was tapped (if any)
    const tappedKeyIndex = findKeyAtPosition(x, y);
    
    if (tappedKeyIndex >= 0 && tappedKeyIndex < keys.length) {
        const key = keys[tappedKeyIndex];
        
        // Initialize tap array for this key if needed
        if (!playModeTaps[key.id]) {
            playModeTaps[key.id] = [];
        }
        
        // Store tap position
        playModeTaps[key.id].push({ x, y });
        
        // Update arrow visualization
        updatePlayModeArrows();
        
        console.log(`Play mode tap on ${key.name}:`, { x, y, totalTaps: playModeTaps[key.id].length });
    }
}

function findKeyAtPosition(x, y) {
    const KEY_SIZE = getScaledOneU();
    const HALF_KEY = KEY_SIZE / 2;
    
    // Check each key to see if the tap is within its bounds
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        // In play mode, check all keys that have been created (with clicks > 0 OR finalized)
        if (!key.finalized && key.clicks === 0) continue;
        
        const keyLeft = key.x - HALF_KEY;
        const keyRight = key.x + HALF_KEY;
        const keyTop = key.y - HALF_KEY;
        const keyBottom = key.y + HALF_KEY;
        
        if (x >= keyLeft && x <= keyRight && y >= keyTop && y <= keyBottom) {
            console.log(`Found key at position (${x}, ${y}):`, key.name, key.id);
            return i;
        }
    }
    
    console.log(`No key found at position (${x}, ${y}). Total keys:`, keys.length);
    return -1;
}

function updatePlayModeArrows() {
    console.log('updatePlayModeArrows called. playModeTaps:', playModeTaps);
    
    // Remove existing arrows
    const existingArrows = document.querySelectorAll('.play-mode-arrow');
    existingArrows.forEach(arrow => arrow.remove());
    console.log('Removed', existingArrows.length, 'existing arrows');
    
    // Draw arrow for each key that has taps
    Object.keys(playModeTaps).forEach(keyId => {
        const taps = playModeTaps[keyId];
        if (taps.length === 0) return;
        
        const key = keys.find(k => k.id === keyId);
        if (!key) {
            console.log('Key not found for id:', keyId);
            return;
        }
        
        console.log('Processing arrow for key:', key.name, 'with', taps.length, 'taps');
        
        // Calculate average tap position
        let avgX = 0, avgY = 0;
        taps.forEach(tap => {
            avgX += tap.x;
            avgY += tap.y;
        });
        avgX /= taps.length;
        avgY /= taps.length;
        
        console.log('Average tap position:', { avgX, avgY }, 'Key center:', { x: key.x, y: key.y });
        
        // Calculate offset from key center
        const offsetX = avgX - key.x;
        const offsetY = avgY - key.y;
        
        // Only draw arrow if offset is significant (> 2px)
        const distance = Math.sqrt(offsetX * offsetX + offsetY * offsetY);
        console.log('Offset distance:', distance);
        
        if (distance < 2) {
            console.log('Distance too small, skipping arrow');
            return;
        }
        
        // Create arrow element
        const arrow = document.createElement('div');
        arrow.className = 'play-mode-arrow';
        arrow.style.left = key.x + 'px';
        arrow.style.top = key.y + 'px';
        
        // Calculate arrow rotation (angle towards tap point)
        const angle = Math.atan2(offsetY, offsetX) * (180 / Math.PI);
        arrow.style.transform = `rotate(${angle}deg)`;
        
        // Arrow length based on offset distance (capped at key size)
        const KEY_SIZE = getScaledOneU();
        const arrowLength = Math.min(distance, KEY_SIZE * 0.4);
        arrow.style.width = arrowLength + 'px';
        
        console.log('Arrow created:', { angle, arrowLength, position: { left: key.x, top: key.y } });
        
        // Add tap count label
        const label = document.createElement('span');
        label.className = 'play-mode-tap-count';
        label.textContent = taps.length;
        label.style.left = (arrowLength + 5) + 'px';
        arrow.appendChild(label);
        
        const overlay = document.getElementById('canvas-overlay');
        overlay.appendChild(arrow);
        console.log('Arrow appended to overlay');
    });
    
    console.log('updatePlayModeArrows completed');
}

function resetPlayModeTaps() {
    playModeTaps = {};
    updatePlayModeArrows();
    console.log('Play mode taps reset');
}

function toggleTapsIcon() {
    tapIndicatorsVisible = !tapIndicatorsVisible;
    const allTapIndicators = document.querySelectorAll('.tap-indicator');
    const btn = document.querySelector('.taps-icon-btn');
    
    allTapIndicators.forEach(indicator => {
        indicator.style.display = tapIndicatorsVisible ? 'block' : 'none';
    });
    
    // Update button state
    if (btn) {
        if (tapIndicatorsVisible) {
            btn.classList.remove('hidden-state');
        } else {
            btn.classList.add('hidden-state');
        }
    }
    
    console.log('Tap indicators:', tapIndicatorsVisible ? 'shown' : 'hidden');
}

function togglePlayArrowsIcon() {
    const allArrows = document.querySelectorAll('.play-mode-arrow');
    const btn = document.querySelector('.play-arrows-icon-btn');
    
    // Check current visibility state from first arrow
    const currentlyVisible = allArrows.length === 0 || 
        (allArrows[0] && allArrows[0].style.display !== 'none');
    
    const newVisibility = !currentlyVisible;
    
    allArrows.forEach(arrow => {
        arrow.style.display = newVisibility ? 'block' : 'none';
    });
    
    // Update button state
    if (btn) {
        if (newVisibility) {
            btn.classList.remove('hidden-state');
        } else {
            btn.classList.add('hidden-state');
        }
    }
    
    console.log('Play mode arrows:', newVisibility ? 'shown' : 'hidden');
}

// Make functions globally accessible
window.switchFinger = switchFinger;
window.switchHand = switchHand;
window.toggleInstructions = toggleInstructions;
window.toggleCalibration = toggleCalibration;
window.selectKeyFromDropdown = selectKeyFromDropdown;
window.resetPlayModeTaps = resetPlayModeTaps;
window.toggleTapsIcon = toggleTapsIcon;
window.togglePlayArrowsIcon = togglePlayArrowsIcon;