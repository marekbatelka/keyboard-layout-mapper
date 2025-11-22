// Global state
let currentMode = 'key'; // 'move', 'tap', 'key'
let keyCreationMode = false;
let currentKey = null;
let keyClickPositions = [];
let keys = [];
let keyIdCounter = 0;
let totalKeys = 1;
let currentKeyIndex = 0;
let showOnlyCurrentKey = false;
let snapToGridEnabled = true; // Grid snap toggle

// Canvas panning state
let canvasPanX = 0;
let canvasPanY = 0;
let isPanning = false;
let lastPanX = 0;
let lastPanY = 0;

// Make keys array globally accessible for export functions
window.keys = keys;

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
    const gridSize = 18; // 0.25u = 72px / 4 = 18px
    return Math.round(value / gridSize) * gridSize;
}

function startFingerMapping() {
    // Reset mapping state
    app.setState({
        currentHand: 'left',
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
    const quarterU = 18; // 0.25u grid spacing
    const oneU = 72; // 1u spacing for major lines
    
    // Calculate the grid offset based on pan
    // Find the starting point that aligns with the grid
    const offsetX = canvasPanX % quarterU;
    const offsetY = canvasPanY % quarterU;
    const startX = offsetX - quarterU;
    const startY = offsetY - quarterU;
    
    // Draw minor grid lines (0.25u) - 15% opacity
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    
    // Vertical minor lines
    for (let x = startX; x <= canvas.width; x += quarterU) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    
    // Horizontal minor lines
    for (let y = startY; y <= canvas.height; y += quarterU) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
    
    // Calculate major grid starting points (1u)
    const majorOffsetX = canvasPanX % oneU;
    const majorOffsetY = canvasPanY % oneU;
    const majorStartX = majorOffsetX - oneU;
    const majorStartY = majorOffsetY - oneU;
    
    // Draw major grid lines (1u) - slightly brighter
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 2;
    
    // Vertical major lines
    for (let x = majorStartX; x <= canvas.width; x += oneU) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    
    // Horizontal major lines
    for (let y = majorStartY; y <= canvas.height; y += oneU) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
    
    // Add center instruction
    ctx.fillStyle = '#666';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('STEP 1: Position Your Setup', canvas.width / 2, canvas.height / 2 - 80);
    
    ctx.font = '16px Arial';
    ctx.fillStyle = '#888';
    const instructions = [
        'Place your tablet on desk where you plan to use your keyboard',
        'Adjust monitor, chair, and arm position for your intended setup',
        'Consider the angle of your wrists and natural hand posture',
        'Once comfortable, start tapping to map your ideal key positions'
    ];
    
    instructions.forEach((instruction, index) => {
        ctx.fillText(instruction, canvas.width / 2, canvas.height / 2 - 20 + (index * 25));
    });
}



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
    console.log('Switched to hand:', hand);
}

function updatePanelPosition(hand) {
    const panel = document.getElementById('keyPanel');
    const fullscreenBtn = document.querySelector('.fullscreen-icon-btn');
    
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
    
    if (progressElement) progressElement.textContent = `Key ${currentKeyIndex + 1} of ${totalKeys}`;
    if (keyNameElement) keyNameElement.textContent = keys[currentKeyIndex].name;
    if (keyTapCountElement && currentKey) {
        keyTapCountElement.textContent = `${currentKey.clicks}/10 taps required`;
    }
    if (keyIndexElement) keyIndexElement.textContent = `${currentKeyIndex + 1} / ${totalKeys}`;
    if (prevBtn) prevBtn.disabled = currentKeyIndex === 0;
    if (nextBtn) nextBtn.disabled = currentKeyIndex === totalKeys - 1;
    
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
        const KEY_SIZE = 72;
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
    
    // 1u key size = 19.05mm = 72px at 96 DPI
    const KEY_SIZE = 72;
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
    const KEY_SIZE = 72;
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
    
    // Check if rectangles overlap (strict inequality to exclude touching)
    return !(right1 <= left2 || left1 >= right2 || bottom1 <= top2 || top1 >= bottom2);
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
        const KEY_SIZE = 72;
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
        keyCreationMode = false;
        
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
        keyCreationMode = false;
        
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
        keyCreationMode = true;
        
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
        keyCreationMode = false;
        
        // Restore cursor
        document.getElementById('tap-canvas').style.cursor = 'default';
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