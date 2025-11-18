// Export functionality - PNG only



// Ergogen export functionality removed

function convertToYAML(obj, indent = 0) {
    let yaml = '';
    const spaces = '  '.repeat(indent);
    
    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            yaml += `${spaces}${key}:\n`;
            yaml += convertToYAML(value, indent + 1);
        } else if (Array.isArray(value)) {
            yaml += `${spaces}${key}:\n`;
            value.forEach(item => {
                if (typeof item === 'object') {
                    yaml += `${spaces}  -\n`;
                    yaml += convertToYAML(item, indent + 2);
                } else {
                    yaml += `${spaces}  - ${item}\n`;
                }
            });
        } else {
            yaml += `${spaces}${key}: ${value}\n`;
        }
    }
    
    return yaml;
}

function displayExportCode(code, format) {
    // Try to find existing export output area, or create one
    let exportOutput = document.getElementById('export-output');
    
    if (!exportOutput) {
        // Create export output area dynamically
        exportOutput = document.createElement('div');
        exportOutput.id = 'export-output';
        exportOutput.innerHTML = `
            <div style="position: fixed; top: 10%; left: 10%; right: 10%; bottom: 10%; background: white; border: 2px solid #61dafb; border-radius: 8px; padding: 20px; z-index: 1000; overflow: auto; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <h3 id="export-title" style="margin: 0; color: #61dafb;">Export Result</h3>
                    <button onclick="closeExportModal()" style="background: #ff4444; color: white; border: none; border-radius: 4px; padding: 8px 12px; cursor: pointer;">Close</button>
                </div>
                <textarea id="export-code" readonly style="width: 100%; height: 70%; font-family: monospace; font-size: 12px; border: 1px solid #ccc; border-radius: 4px; padding: 10px; resize: none;"></textarea>
                <div style="margin-top: 10px; text-align: right;">
                    <button onclick="copyToClipboard()" style="background: #4CAF50; color: white; border: none; border-radius: 4px; padding: 8px 16px; cursor: pointer;">Copy to Clipboard</button>
                </div>
            </div>
        `;
        document.body.appendChild(exportOutput);
    }
    
    const exportCode = document.getElementById('export-code');
    const exportTitle = document.getElementById('export-title');
    
    if (exportCode) {
        exportCode.value = code;
    }
    
    if (exportTitle) {
        exportTitle.textContent = `${format} Export Result`;
    }
    
    exportOutput.style.display = 'block';
    console.log(`Displaying ${format} export result`);
}

// Function to close the export modal
function closeExportModal() {
    const exportOutput = document.getElementById('export-output');
    if (exportOutput) {
        exportOutput.style.display = 'none';
    }
}

function copyToClipboard() {
    const exportCode = document.getElementById('export-code');
    exportCode.select();
    exportCode.setSelectionRange(0, 99999); // For mobile devices
    
    try {
        document.execCommand('copy');
        
        // Visual feedback
        const button = event.target;
        const originalText = button.textContent;
        button.textContent = 'Copied!';
        button.style.background = '#4CAF50';
        
        setTimeout(() => {
            button.textContent = originalText;
            button.style.background = '';
        }, 2000);
        
    } catch (err) {
        // Fallback for browsers that don't support execCommand
        if (navigator.clipboard) {
            navigator.clipboard.writeText(exportCode.value).then(() => {
                alert('Code copied to clipboard!');
            }).catch(() => {
                alert('Failed to copy code. Please select and copy manually.');
            });
        } else {
            alert('Please select the code and copy manually (Ctrl+C or Cmd+C)');
        }
    }
}

// Generate additional export formats
function exportKLE() {
    // Keyboard Layout Editor format
    const kleData = generateKLEFormat();
    displayExportCode(kleData, 'KLE');
}

function generateKLEFormat() {
    const layout = [];
    
    for (let row = 0; row < app.state.rows; row++) {
        const rowData = [];
        for (let col = 0; col < app.state.cols; col++) {
            const finger = getMostFrequentFinger(row, col);
            const key = {
                c: app.fingerColors[finger] || '#cccccc',
                t: '#000000'
            };
            rowData.push(key, `${row},${col}`);
        }
        layout.push(rowData);
    }
    
    return JSON.stringify(layout, null, 2);
}

function exportQMK() {
    // QMK firmware format
    const qmkData = generateQMKFormat();
    displayExportCode(qmkData, 'QMK');
}





// Export as PNG
function exportPNG() {
    console.log('PNG export started');
    
    try {
        // Get the actual canvas element that's being displayed
        const sourceCanvas = document.getElementById('tap-canvas');
        if (!sourceCanvas) {
            alert('Canvas not found! Make sure you are in mapping mode.');
            return;
        }
        
        console.log('Source canvas found:', sourceCanvas.width, 'x', sourceCanvas.height);
        
        // Create a new canvas to combine the main canvas and overlay
        const exportCanvas = document.createElement('canvas');
        const ctx = exportCanvas.getContext('2d');
        
        // Set same dimensions as source canvas
        exportCanvas.width = sourceCanvas.width;
        exportCanvas.height = sourceCanvas.height;
        
        // Draw the main canvas content
        ctx.drawImage(sourceCanvas, 0, 0);
        
        // Get overlay elements and draw them on canvas
        const overlay = document.getElementById('canvas-overlay');
        if (overlay) {
            // Draw tap indicators
            const tapIndicators = overlay.querySelectorAll('.tap-indicator');
            tapIndicators.forEach(indicator => {
                if (indicator.style.display !== 'none') {
                    const x = parseInt(indicator.style.left);
                    const y = parseInt(indicator.style.top);
                    const finger = indicator.className.match(/finger-(\w+)/)?.[1] || 'unknown';
                    
                    const colors = {
                        thumb: '#FF6B6B',
                        index: '#4ECDC4', 
                        middle: '#45B7D1',
                        ring: '#96CEB4',
                        pinky: '#FFEAA7'
                    };
                    
                    ctx.fillStyle = colors[finger] || '#666';
                    ctx.globalAlpha = 0.8;
                    ctx.beginPath();
                    ctx.arc(x + 6, y + 6, 6, 0, 2 * Math.PI); // +6 to center the circle
                    ctx.fill();
                    ctx.globalAlpha = 1;
                }
            });
            
            // Draw defined keys
            const keyElements = overlay.querySelectorAll('.canvas-key');
            keyElements.forEach((keyElement, index) => {
                if (keyElement.style.display !== 'none') {
                    const x = parseInt(keyElement.style.left) + 20; // +20 to center
                    const y = parseInt(keyElement.style.top) + 20;  // +20 to center
                    const transform = keyElement.style.transform;
                    const rotation = transform.match(/rotate\((-?\d+)deg\)/)?.[1] || 0;
                    
                    ctx.save();
                    ctx.translate(x, y);
                    ctx.rotate((parseInt(rotation) * Math.PI) / 180);
                    
                    // Key background
                    ctx.fillStyle = 'rgba(97, 218, 251, 0.3)';
                    ctx.fillRect(-20, -20, 40, 40);
                    
                    // Key border
                    ctx.strokeStyle = '#61dafb';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(-20, -20, 40, 40);
                    
                    // Key number
                    ctx.fillStyle = '#61dafb';
                    ctx.font = 'bold 14px Arial';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(keyElement.textContent || (index + 1).toString(), 0, 0);
                    
                    ctx.restore();
                }
            });
        }
        
        console.log('Export canvas rendered, size:', exportCanvas.width, 'x', exportCanvas.height);
        
        // Convert to blob and create download
        exportCanvas.toBlob((blob) => {
            console.log('Blob created:', blob);
            const url = URL.createObjectURL(blob);
            
            // Create and trigger download
            const downloadLink = document.createElement('a');
            downloadLink.href = url;
            downloadLink.download = 'keyboard-layout.png';
            downloadLink.style.display = 'none';
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            
            // Also show the data URL for copying
            const dataURL = exportCanvas.toDataURL('image/png');
            displayExportCode(dataURL, 'PNG Image (Data URL)');
            
            console.log('PNG export completed and download triggered');
            
            // Clean up the blob URL
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        }, 'image/png');
        
    } catch (error) {
        console.error('PNG export failed:', error);
        alert('PNG export failed: ' + error.message);
    }
}

// Make functions globally available
window.exportPNG = exportPNG;
window.copyToClipboard = copyToClipboard;
window.closeExportModal = closeExportModal;
window.toggleFullscreen = toggleFullscreen;

// Export just the key positions as JSON for debugging
function exportKeyPositions() {
    const definedKeys = keys.filter(key => key.clicks > 0);
    const exportData = {
        totalKeys: definedKeys.length,
        canvasDimensions: {
            width: window.innerWidth,
            height: window.innerHeight
        },
        keys: definedKeys.map((key, index) => ({
            id: index + 1,
            name: key.name || `Key ${index + 1}`,
            position: {
                x: key.x,
                y: key.y,
                // Convert to physical coordinates (mm)
                physicalX: ((key.x / window.innerWidth) * 200) - 100,
                physicalY: -((key.y / window.innerHeight) * 100) + 50
            },
            rotation: key.rotation || 0,
            clicks: key.clicks,
            averagedFromTaps: key.positions ? key.positions.length : 0
        }))
    };
    
    displayExportCode(JSON.stringify(exportData, null, 2), 'Key Positions JSON');
}

function generateQMKFormat() {
    const keymap = [];
    
    for (let row = 0; row < app.state.rows; row++) {
        const rowKeys = [];
        for (let col = 0; col < app.state.cols; col++) {
            // Generate placeholder keycodes based on position
            const keycode = `KC_${String.fromCharCode(65 + (row * app.state.cols + col) % 26)}`;
            rowKeys.push(keycode);
        }
        keymap.push(`    {${rowKeys.join(', ')}},`);
    }
    
    return `// QMK Keymap generated from Keyboard Layout Designer
#include QMK_KEYBOARD_H

const uint16_t PROGMEM keymaps[][MATRIX_ROWS][MATRIX_COLS] = {
    [0] = LAYOUT(
${keymap.join('\n')}
    ),
};`;
}