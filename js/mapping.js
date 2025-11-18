// Mapping functionality and data processing
function generateLayoutPreview() {
    const preview = document.getElementById('layout-preview');
    preview.innerHTML = '';
    
    // Create a canvas preview showing tap positions and suggested keys
    const previewCanvas = document.createElement('canvas');
    previewCanvas.width = 600;
    previewCanvas.height = 200;
    previewCanvas.style.border = '2px solid #ddd';
    previewCanvas.style.borderRadius = '8px';
    previewCanvas.style.background = 'white';
    previewCanvas.style.display = 'block';
    previewCanvas.style.margin = '0 auto';
    
    const ctx = previewCanvas.getContext('2d');
    
    // Draw tap positions
    app.state.tapPositions.forEach((tap, index) => {
        const x = (tap.x / app.state.canvasWidth) * previewCanvas.width;
        const y = (tap.y / app.state.canvasHeight) * previewCanvas.height;
        
        ctx.fillStyle = app.fingerColors[tap.finger];
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fill();
        
        // Add finger label
        ctx.fillStyle = '#333';
        ctx.font = '10px Arial';
        ctx.fillText(tap.finger.charAt(0).toUpperCase(), x - 3, y - 8);
    });
    
    // Draw defined keys from key creation system
    if (typeof keys !== 'undefined' && keys.length > 0) {
        const definedKeys = keys.filter(key => key.clicks > 0);
        definedKeys.forEach((key, index) => {
            const x = (key.x / window.innerWidth) * previewCanvas.width;
            const y = (key.y / window.innerHeight) * previewCanvas.height;
            
            // Draw key outline
            ctx.strokeStyle = '#61dafb';
            ctx.lineWidth = 2;
            ctx.strokeRect(x - 20, y - 15, 40, 30);
            
            // Fill with semi-transparent color
            ctx.fillStyle = 'rgba(97, 218, 251, 0.3)';
            ctx.fillRect(x - 20, y - 15, 40, 30);
            
            // Add key number
            ctx.fillStyle = '#333';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText((index + 1).toString(), x, y + 4);
            
            // Add rotation indicator if rotated
            if (key.rotation && key.rotation !== 0) {
                ctx.save();
                ctx.translate(x, y);
                ctx.rotate((key.rotation * Math.PI) / 180);
                ctx.strokeStyle = '#ff6b6b';
                ctx.lineWidth = 1;
                ctx.strokeRect(-20, -15, 40, 30);
                ctx.restore();
            }
        });
    }
    
    preview.appendChild(previewCanvas);
    
    // Add mapping statistics
    const stats = generateMappingStats();
    const statsDiv = document.createElement('div');
    statsDiv.className = 'mapping-stats';
    statsDiv.innerHTML = `
        <h4>Mapping Statistics</h4>
        <p>Total taps recorded: ${stats.totalTaps}</p>
        <p>Fingers mapped: ${stats.uniqueFingers}</p>
        <p>Hands mapped: ${stats.handsMapped.join(', ')}</p>
        <p>Defined key positions: ${stats.definedKeys}</p>
        <div class="finger-breakdown">
            <h5>Taps per finger:</h5>
            ${Object.entries(stats.fingerDistribution).map(([key, count]) => {
                const [hand, finger] = key.split('_');
                return `<span class="finger-stat">${hand} ${finger}: ${count}</span>`;
            }).join(', ')}
        </div>
    `;
    statsDiv.style.marginTop = '20px';
    statsDiv.style.padding = '15px';
    statsDiv.style.background = '#f0f0f0';
    statsDiv.style.borderRadius = '8px';
    
    preview.appendChild(statsDiv);
}

function getFingerForPosition(x, y, tolerance = 50) {
    // Find the finger that has taps closest to this position
    const fingerCounts = {};
    
    app.state.tapPositions.forEach(tap => {
        const distance = Math.sqrt(Math.pow(tap.x - x, 2) + Math.pow(tap.y - y, 2));
        if (distance <= tolerance) {
            fingerCounts[tap.finger] = (fingerCounts[tap.finger] || 0) + 1;
        }
    });
    
    // Find the finger with most taps near this position
    let maxCount = 0;
    let mostFrequentFinger = null;
    
    Object.keys(fingerCounts).forEach(finger => {
        if (fingerCounts[finger] > maxCount) {
            maxCount = fingerCounts[finger];
            mostFrequentFinger = finger;
        }
    });
    
    return mostFrequentFinger;
}

// Legacy function for compatibility
function getMostFrequentFinger(row, col) {
    // Convert grid position to approximate canvas position
    const x = (col / app.state.cols) * app.state.canvasWidth;
    const y = (row / app.state.rows) * app.state.canvasHeight;
    return getFingerForPosition(x, y);
}

function generateMappingStats() {
    const totalTaps = app.state.tapPositions.length;
    const uniqueFingers = new Set();
    const handsMapped = new Set();
    const fingerDistribution = {};
    
    app.state.tapPositions.forEach(tap => {
        uniqueFingers.add(tap.finger);
        handsMapped.add(tap.hand);
        
        const key = `${tap.hand}_${tap.finger}`;
        fingerDistribution[key] = (fingerDistribution[key] || 0) + 1;
    });
    
    return {
        totalTaps,
        uniqueFingers: uniqueFingers.size,
        handsMapped: Array.from(handsMapped),
        fingerDistribution,
        definedKeys: typeof keys !== 'undefined' ? keys.filter(key => key.clicks > 0).length : 0
    };
}

// Advanced mapping analysis
function analyzeMappingData() {
    const analysis = {
        fingerAssignments: {},
        heatmap: {},
        recommendations: []
    };
    
    // Analyze finger assignments for each position
    for (let row = 0; row < app.state.rows; row++) {
        for (let col = 0; col < app.state.cols; col++) {
            const finger = getMostFrequentFinger(row, col);
            if (finger) {
                analysis.fingerAssignments[`${row},${col}`] = finger;
                
                // Create heatmap data
                if (!analysis.heatmap[finger]) {
                    analysis.heatmap[finger] = [];
                }
                analysis.heatmap[finger].push({ row, col });
            }
        }
    }
    
    // Generate recommendations
    analysis.recommendations = generateRecommendations(analysis);
    
    return analysis;
}

function generateRecommendations(analysis) {
    const recommendations = [];
    
    // Check for finger balance
    const fingerUsage = {};
    Object.values(analysis.fingerAssignments).forEach(finger => {
        fingerUsage[finger] = (fingerUsage[finger] || 0) + 1;
    });
    
    const avgUsage = Object.values(fingerUsage).reduce((sum, count) => sum + count, 0) / Object.keys(fingerUsage).length;
    
    Object.keys(fingerUsage).forEach(finger => {
        const usage = fingerUsage[finger];
        if (usage < avgUsage * 0.5) {
            recommendations.push(`Consider using ${finger} finger more - it's currently underutilized`);
        } else if (usage > avgUsage * 1.5) {
            recommendations.push(`${finger} finger might be overloaded - consider redistributing some keys`);
        }
    });
    
    return recommendations;
}

function startOver() {
    if (confirm('Start over with a new layout? This will lose all current mapping data.')) {
        // Reset application state
        app.setState({
            rows: 3,
            cols: 10,
            mappingOrder: 'rows',
            currentHand: 'left',
            currentFinger: 'thumb',
            currentPosition: { row: 0, col: 0 },
            tapCount: 0,
            requiredTaps: 10,
            mappingData: {},
            isMapping: false,
            isComplete: false
        });
        
        // Show wizard again
        hideElement('results-container');
        showElement('wizard-container');
        showElement('step-welcome');
        hideElement('step-config');
        
        // Reset form values
        document.getElementById('rows-input').value = 3;
        document.getElementById('cols-input').value = 10;
        document.getElementById('mapping-order').value = 'rows';
    }
}