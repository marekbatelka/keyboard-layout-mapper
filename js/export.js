// Export functionality - PNG and KLE

// KLE Import/Export functions
function showImportModal() {
    const modal = document.getElementById('import-modal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function closeImportModal() {
    const modal = document.getElementById('import-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    const input = document.getElementById('import-kle-input');
    if (input) {
        input.value = '';
    }
}

function importKLE() {
    const input = document.getElementById('import-kle-input');
    let kleData = input.value.trim();
    
    if (!kleData) {
        alert('Please paste KLE data first!');
        return;
    }
    
    try {
        // Clean up common issues
        // If data has line breaks between rows, wrap it in outer brackets
        if (kleData.match(/^\[.*\],\s*\n\[/)) {
            kleData = '[' + kleData + ']';
        }
        
        // Remove any trailing commas before closing brackets
        kleData = kleData.replace(/,(\s*[\]}])/g, '$1');
        
        // Add quotes to unquoted property names for valid JSON parsing
        kleData = kleData.replace(/([{,]\s*)([axywh])(\s*:)/g, '$1"$2"$3');
        
        // Try to extract just the layout array if it's part of a larger object
        let layout;
        
        try {
            const parsed = JSON.parse(kleData);
            
            // Check if it's already an array (the layout itself)
            if (Array.isArray(parsed)) {
                layout = parsed;
            }
            // Check if it's an object with a layout property
            else if (parsed && typeof parsed === 'object') {
                if (parsed.layout && Array.isArray(parsed.layout)) {
                    layout = parsed.layout;
                } else if (parsed.keys && Array.isArray(parsed.keys)) {
                    layout = parsed.keys;
                } else {
                    throw new Error('Could not find layout array in the data');
                }
            } else {
                throw new Error('Invalid data format');
            }
        } catch (parseError) {
            throw new Error('Invalid JSON format. Expected array like [[{"a":7},""],["",""]] or with line breaks');
        }
        
        if (!Array.isArray(layout)) {
            throw new Error('Invalid KLE format: expected an array');
        }
        
        // Convert KLE format to our internal key format
        const ONE_U = 72; // pixels per key unit
        const importedKeys = [];
        
        let currentX = 0;
        let currentY = 0;
        let keyIndex = 0;
        
        // Process each item - handle both flat and nested array formats
        for (let i = 0; i < layout.length; i++) {
            const item = layout[i];
            
            if (Array.isArray(item)) {
                // Nested row format
                currentX = 0;
                currentY += ONE_U;
                
                for (let j = 0; j < item.length; j++) {
                    const rowItem = item[j];
                    
                    if (typeof rowItem === 'object' && !Array.isArray(rowItem)) {
                        if (rowItem.x !== undefined) currentX += rowItem.x * ONE_U;
                        if (rowItem.y !== undefined) currentY += rowItem.y * ONE_U;
                    } else if (typeof rowItem === 'string') {
                        importedKeys.push({
                            id: `key_${keyIndex}`,
                            name: `Key ${keyIndex + 1}`,
                            x: currentX,
                            y: currentY,
                            rotation: 0,
                            clicks: 10,
                            positions: [{ x: currentX, y: currentY }],
                            finalized: true
                        });
                        keyIndex++;
                        currentX += ONE_U;
                    }
                }
            } else if (typeof item === 'object' && !Array.isArray(item)) {
                // Metadata object
                if (item.x !== undefined) currentX += item.x * ONE_U;
                if (item.y !== undefined) currentY += (1 + item.y) * ONE_U;
            } else if (typeof item === 'string') {
                // Flat format key
                importedKeys.push({
                    id: `key_${keyIndex}`,
                    name: `Key ${keyIndex + 1}`,
                    x: currentX,
                    y: currentY,
                    rotation: 0,
                    clicks: 10,
                    positions: [{ x: currentX, y: currentY }],
                    finalized: true
                });
                keyIndex++;
                currentX += ONE_U;
            }
        }
        
        if (importedKeys.length === 0) {
            throw new Error('No keys found in KLE data');
        }
        
        // Find the bounding box of imported keys
        const minX = Math.min(...importedKeys.map(k => k.x));
        const minY = Math.min(...importedKeys.map(k => k.y));
        
        // Offset to center the layout on screen (or place it visibly)
        const canvas = document.getElementById('tap-canvas');
        const offsetX = (canvas ? canvas.width / 4 : 300) - minX; // Place at 1/4 from left
        const offsetY = (canvas ? canvas.height / 4 : 300) - minY; // Place at 1/4 from top
        
        // Apply offset to all keys
        importedKeys.forEach(key => {
            key.x += offsetX;
            key.y += offsetY;
            // Update positions array as well
            if (key.positions && key.positions.length > 0) {
                key.positions[0].x += offsetX;
                key.positions[0].y += offsetY;
            }
        });
        
        // Clear existing keys and load imported keys
        window.keys = importedKeys;
        totalKeys = importedKeys.length;
        currentKeyIndex = 0;
        currentKey = importedKeys[0];
        
        // Redraw all keys on canvas
        const overlay = document.querySelector('.canvas-overlay');
        if (overlay) {
            // Remove all existing key elements
            const existingKeys = overlay.querySelectorAll('.canvas-key');
            existingKeys.forEach(el => el.remove());
            
            // Add imported keys
            importedKeys.forEach((key, idx) => {
                const keyElement = document.createElement('div');
                keyElement.className = 'canvas-key';
                keyElement.id = key.id;
                const KEY_SIZE = 72;
                const HALF_KEY = KEY_SIZE / 2;
                keyElement.style.left = (key.x - HALF_KEY) + 'px';
                keyElement.style.top = (key.y - HALF_KEY) + 'px';
                keyElement.style.setProperty('width', KEY_SIZE + 'px', 'important');
                keyElement.style.setProperty('height', KEY_SIZE + 'px', 'important');
                keyElement.style.transform = `rotate(${key.rotation}deg)`;
                keyElement.textContent = (idx + 1).toString();
                keyElement.style.display = 'flex';
                overlay.appendChild(keyElement);
            });
        }
        
        // Update UI
        updateKeyWorkflowUI();
        updateOverlapHighlighting();
        
        // Close modal
        closeImportModal();
        
        alert(`Successfully imported ${importedKeys.length} keys from KLE!`);
        
        console.log('Imported keys:', importedKeys);
        
    } catch (error) {
        console.error('KLE import error:', error);
        alert('Failed to import KLE data: ' + error.message + '\\n\\nMake sure you copied the raw JSON data from keyboard-layout-editor.com');
    }
}

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
        
        // Show in modal popup
        showExportModal(kleData);
    } catch (error) {
        console.error('KLE export error:', error);
        alert('KLE export failed: ' + error.message);
    }
}

function showExportModal(kleData) {
    console.log('showExportModal called with data:', kleData?.substring(0, 100));
    const modal = document.getElementById('export-modal');
    const output = document.getElementById('export-kle-output');
    
    console.log('Modal element:', modal);
    console.log('Output element:', output);
    
    if (modal && output) {
        output.value = kleData;
        modal.style.display = 'flex';
        console.log('Modal display set to flex, computed style:', window.getComputedStyle(modal).display);
    } else {
        console.error('Modal or output element not found!');
        alert('Export modal not found. Please refresh the page.');
    }
}

function closeExportModal() {
    const modal = document.getElementById('export-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function selectAllKLE() {
    const output = document.getElementById('export-kle-output');
    if (output) {
        output.select();
        output.setSelectionRange(0, output.value.length);
    }
}

function copyKLEToClipboard() {
    const output = document.getElementById('export-kle-output');
    if (!output) return;
    
    // Try modern clipboard API first
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(output.value).then(() => {
            alert('✓ Copied to clipboard!');
        }).catch(err => {
            console.error('Clipboard copy failed:', err);
            // Fallback to select
            selectAllKLE();
            alert('Copy failed. Please use Ctrl+C / Cmd+C to copy.');
        });
    } else {
        // Fallback: select the text
        selectAllKLE();
        try {
            document.execCommand('copy');
            alert('✓ Copied to clipboard!');
        } catch (err) {
            alert('Please use Ctrl+C / Cmd+C to copy the selected text.');
        }
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
    
    // Format with line breaks for readability and without quotes on property names
    const formattedOutput = JSON.stringify(kleData)
        .replace(/\],\[/g, '],\n[')
        .replace(/^\[\[/, '[')
        .replace(/\]\]$/, ']')
        // Remove quotes from property names (a, x, y, etc.)
        .replace(/"([axywh])"\s*:/g, '$1:');
    
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
        // Get all keys and tap indicators to calculate bounding box
        const allKeys = window.keys || [];
        const definedKeys = allKeys.filter(key => key.clicks > 0);
        
        const overlay = document.getElementById('canvas-overlay');
        const tapIndicators = overlay ? overlay.querySelectorAll('.tap-indicator') : [];
        
        if (definedKeys.length === 0 && tapIndicators.length === 0) {
            alert('No keys or taps to export. Create some keys first!');
            return;
        }
        
        // Calculate bounding box
        const KEY_SIZE = 72;
        const MARGIN = 50; // Margin around content
        
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;
        
        // Include keys in bounding box
        definedKeys.forEach(key => {
            minX = Math.min(minX, key.x - KEY_SIZE/2);
            minY = Math.min(minY, key.y - KEY_SIZE/2);
            maxX = Math.max(maxX, key.x + KEY_SIZE/2);
            maxY = Math.max(maxY, key.y + KEY_SIZE/2);
        });
        
        // Include tap indicators in bounding box
        tapIndicators.forEach(indicator => {
            if (indicator.style.display !== 'none') {
                const x = parseInt(indicator.style.left) || 0;
                const y = parseInt(indicator.style.top) || 0;
                minX = Math.min(minX, x);
                minY = Math.min(minY, y);
                maxX = Math.max(maxX, x + 12);
                maxY = Math.max(maxY, y + 12);
            }
        });
        
        // Create export canvas with calculated size
        const width = Math.ceil(maxX - minX) + (MARGIN * 2);
        const height = Math.ceil(maxY - minY) + (MARGIN * 2);
        
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = width;
        exportCanvas.height = height;
        const ctx = exportCanvas.getContext('2d');
        
        // Dark background matching the UI
        ctx.fillStyle = '#1e1e1e';
        ctx.fillRect(0, 0, width, height);
        
        // Offset for centering content
        const offsetX = MARGIN - minX;
        const offsetY = MARGIN - minY;
        
        // Draw grid background
        const quarterU = 18; // 0.25u grid spacing
        const oneU = 72; // 1u spacing
        
        // Minor grid lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1;
        
        for (let x = 0; x <= width; x += quarterU) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        
        for (let y = 0; y <= height; y += quarterU) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
        
        // Major grid lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.lineWidth = 2;
        
        for (let x = 0; x <= width; x += oneU) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        
        for (let y = 0; y <= height; y += oneU) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
        
        // Draw tap indicators
        const colors = {
            thumb: '#FF6B6B',
            index: '#4ECDC4', 
            middle: '#45B7D1',
            ring: '#96CEB4',
            pinky: '#FFEAA7'
        };
        
        tapIndicators.forEach(indicator => {
            if (indicator.style.display !== 'none') {
                const x = parseInt(indicator.style.left) || 0;
                const y = parseInt(indicator.style.top) || 0;
                const finger = indicator.className.match(/finger-(\\w+)/)?.[1] || 'unknown';
                
                ctx.fillStyle = colors[finger] || '#666';
                ctx.globalAlpha = 0.8;
                ctx.beginPath();
                ctx.arc(x + offsetX + 6, y + offsetY + 6, 6, 0, 2 * Math.PI);
                ctx.fill();
                ctx.globalAlpha = 1;
            }
        });
        
        // Draw keys
        definedKeys.forEach((key, index) => {
            const x = key.x + offsetX;
            const y = key.y + offsetY;
            const HALF_KEY = KEY_SIZE / 2;
            
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate((key.rotation * Math.PI) / 180);
            
            // Key background
            ctx.fillStyle = 'rgba(97, 218, 251, 0.3)';
            ctx.fillRect(-HALF_KEY, -HALF_KEY, KEY_SIZE, KEY_SIZE);
            
            // Key border
            ctx.strokeStyle = '#61dafb';
            ctx.lineWidth = 2;
            ctx.strokeRect(-HALF_KEY, -HALF_KEY, KEY_SIZE, KEY_SIZE);
            
            // Key number
            ctx.fillStyle = '#61dafb';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText((index + 1).toString(), 0, 0);
            
            ctx.restore();
        });
        
        console.log('Export canvas rendered, size:', width, 'x', height);
        
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
window.importKLE = importKLE;
window.showImportModal = showImportModal;
window.closeImportModal = closeImportModal;
window.showExportModal = showExportModal;
window.closeExportModal = closeExportModal;
window.selectAllKLE = selectAllKLE;
window.copyKLEToClipboard = copyKLEToClipboard;
window.copyToClipboard = copyToClipboard;
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