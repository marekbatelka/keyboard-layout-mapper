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
    console.log('displayExportCode called with format:', format, 'code length:', code.length);
    
    // Try to find existing export output area, or create one
    let exportOutput = document.getElementById('export-output');
    
    if (!exportOutput) {
        // Create export output area dynamically
        exportOutput = document.createElement('div');
        exportOutput.id = 'export-output';
        exportOutput.innerHTML = `
            <div style="position: fixed; top: 10%; left: 10%; right: 10%; bottom: 10%; background: #1e1e1e; border: 2px solid #569cd6; border-radius: 8px; padding: 20px; z-index: 10000; overflow: auto; box-shadow: 0 4px 20px rgba(0,0,0,0.8);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <h3 id="export-title" style="margin: 0; color: #569cd6;">Export Result</h3>
                    <button onclick="closeExportModal()" style="background: #f48771; color: white; border: none; border-radius: 4px; padding: 8px 12px; cursor: pointer; font-weight: bold;">Close</button>
                </div>
                <textarea id="export-code" readonly style="width: 100%; height: calc(100% - 100px); font-family: 'Courier New', monospace; font-size: 13px; border: 1px solid #3c3c3c; border-radius: 4px; padding: 10px; resize: none; background: #252526; color: #cccccc;"></textarea>
                <div style="margin-top: 10px; text-align: right;">
                    <button onclick="copyToClipboard()" style="background: #4ec9b0; color: #1e1e1e; border: none; border-radius: 4px; padding: 8px 16px; cursor: pointer; font-weight: bold;">Copy to Clipboard</button>
                </div>
            </div>
        `;
        document.body.appendChild(exportOutput);
        console.log('Export modal created');
    }
    
    const exportCode = document.getElementById('export-code');
    const exportTitle = document.getElementById('export-title');
    
    if (exportCode) {
        exportCode.value = code;
        console.log('Export code set, value:', code.substring(0, 100) + '...');
    } else {
        console.error('export-code textarea not found!');
    }
    
    if (exportTitle) {
        exportTitle.textContent = `${format} Export Result`;
    }
    
    exportOutput.style.display = 'block';
    console.log(`Displaying ${format} export result, modal visible:`, exportOutput.style.display);
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
    console.log('KLE export started');
    try {
        // Keyboard Layout Editor format
        const kleData = generateKLEFormat();
        console.log('KLE data generated:', kleData);
        
        // Copy to clipboard directly
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(kleData).then(() => {
                alert('KLE layout copied to clipboard!\n\nPaste it into keyboard-layout-editor.com');
            }).catch(err => {
                console.error('Clipboard copy failed:', err);
                // Fallback to modal display
                displayExportCode(kleData, 'KLE');
            });
        } else {
            // Fallback for browsers without clipboard API
            displayExportCode(kleData, 'KLE');
        }
    } catch (error) {
        console.error('KLE export error:', error);
        alert('KLE export failed: ' + error.message);
    }
}

function generateKLEFormat() {
    // Get all defined keys with positions
    const allKeys = window.keys || [];
    console.log('All keys:', allKeys);
    
    const definedKeys = allKeys.filter(key => key.clicks > 0);
    console.log('Defined keys with clicks:', definedKeys);
    
    if (definedKeys.length === 0) {
        return '// No keys defined yet. Create some keys first!';
    }
    
    // 1u (key unit) = 19.05mm = 1.905cm
    // At 96 DPI: 1cm = 37.8px, so 1u = 1.905 * 37.8 = 72px
    const ONE_U = 72; // pixels per key unit
    const ROW_THRESHOLD = 10; // pixels to consider same row (small threshold for precision)
    
    // Sort keys by Y position (top to bottom), then by X position (left to right)
    const sortedKeys = [...definedKeys].sort((a, b) => {
        const yDiff = a.y - b.y;
        if (Math.abs(yDiff) < ROW_THRESHOLD) {
            return a.x - b.x;
        }
        return yDiff;
    });
    
    // Group keys into rows based on Y position
    const rows = [];
    let currentRow = [];
    let lastY = sortedKeys[0].y;
    
    sortedKeys.forEach((key) => {
        if (Math.abs(key.y - lastY) > ROW_THRESHOLD && currentRow.length > 0) {
            rows.push(currentRow);
            currentRow = [];
            lastY = key.y;
        }
        currentRow.push(key);
    });
    
    if (currentRow.length > 0) {
        rows.push(currentRow);
    }
    
    console.log('Rows detected:', rows.length, 'rows:', rows.map(r => r.length + ' keys'));
    
    // Convert to KLE format
    const kleData = [];
    
    // Find the leftmost key to use as reference
    const minX = Math.min(...sortedKeys.map(k => k.x));
    
    rows.forEach((row, rowIndex) => {
        const rowData = [];
        
        row.forEach((key, keyIndex) => {
            const metadata = {};
            
            // Add Y offset for new row (relative to previous row)
            if (keyIndex === 0 && rowIndex > 0) {
                const prevRow = rows[rowIndex - 1];
                const prevRowY = prevRow[0].y;
                const yDiff = key.y - prevRowY;
                const yUnits = yDiff / ONE_U;
                
                // KLE: negative y moves cursor up, positive moves down
                // After a row, cursor is 1u below, so actual offset = yDiff - 1u
                const yOffset = yUnits - 1;
                
                // Only add y if offset is not ~0 (allow small rounding errors)
                if (Math.abs(yOffset) > 0.01) {
                    metadata.y = Math.round(yOffset * 100) / 100;
                }
            }
            
            // Calculate X offset
            if (keyIndex === 0) {
                // First key in row - offset from left edge
                const xDiff = key.x - minX;
                const xUnits = xDiff / ONE_U;
                if (xUnits > 0.1) {
                    metadata.x = Math.round(xUnits * 100) / 100;
                }
            } else {
                // Subsequent keys - spacing from previous key
                const prevKey = row[keyIndex - 1];
                const xDiff = key.x - prevKey.x;
                const xUnits = xDiff / ONE_U;
                
                // Only add x if there's a gap (more than 1u between keys)
                if (xUnits > 1.1) {
                    // Gap size minus the 1u for the key itself
                    metadata.x = Math.round((xUnits - 1) * 100) / 100;
                }
            }
            
            // Add alignment on first key only
            if (rowIndex === 0 && keyIndex === 0) {
                metadata.a = 7; // Center alignment
            }
            
            // Add metadata if it has properties
            if (Object.keys(metadata).length > 0) {
                rowData.push(metadata);
            }
            
            // Add the key (empty string for blank key)
            rowData.push("");
        });
        
        // Add this row to the main array
        kleData.push(rowData);
    });
    
    // Format with line breaks for readability
    const formattedOutput = JSON.stringify(kleData)
        .replace(/\],\[/g, '],\n[')
        .replace(/^\[\[/, '[')
        .replace(/\]\]$/, ']');
    
    return formattedOutput;
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
window.exportKLE = exportKLE;
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