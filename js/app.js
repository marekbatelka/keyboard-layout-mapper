// Main application state and initialization
class KeyboardLayoutApp {
    constructor() {
        this.state = {
            rows: 3,
            cols: 10,
            mappingOrder: 'rows',
            currentHand: 'left',
            currentFinger: 'thumb',
            currentPosition: { row: 0, col: 0 },
            tapCount: 0,
            requiredTaps: 0, // No limit
            mappingData: {},
            tapPositions: [],
            canvasWidth: 0,
            canvasHeight: 0,
            isMapping: false,
            isComplete: false,
            freeMode: true // Free mapping mode
        };
        
        this.fingers = ['thumb', 'index', 'middle', 'ring', 'pinky'];
        this.fingerColors = {
            thumb: '#FF6B6B',
            index: '#4ECDC4', 
            middle: '#45B7D1',
            ring: '#96CEB4',
            pinky: '#FFEAA7'
        };
        
        this.init();
    }
    
    init() {
        // Initialize touch handler
        this.touchHandler = new TouchHandler();
        
        // Set up event listeners
        this.setupEventListeners();
        
        console.log('Keyboard Layout Designer initialized');
    }
    
    setupEventListeners() {
        // Add any global event listeners here
        window.addEventListener('resize', this.handleResize.bind(this));
    }
    
    handleResize() {
        // Handle responsive layout updates
        if (this.state.isMapping) {
            this.updateCanvasLayout();
        }
    }
    
    updateCanvasLayout() {
        const canvas = document.getElementById('tap-canvas');
        if (canvas && canvas.classList.contains('fullscreen-canvas')) {
            // Update fullscreen canvas dimensions
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            
            // Update stored dimensions
            this.setState({
                canvasWidth: canvas.width,
                canvasHeight: canvas.height
            });
            
            // Redraw canvas
            if (typeof drawCanvasGuides !== 'undefined') {
                drawCanvasGuides(canvas);
            }
            
            console.log('Fullscreen canvas resized:', {
                width: canvas.width,
                height: canvas.height
            });
        }
    }
    
    setState(newState) {
        this.state = { ...this.state, ...newState };
        this.render();
    }
    
    render() {
        // Update UI based on current state
        this.updateProgressInfo();
        this.updateFingerLegend();
        this.updateCanvas();
    }
    
    updateProgressInfo() {
        const tapCounter = document.getElementById('tap-counter');
        const handIndicator = document.getElementById('hand-indicator');
        
        if (tapCounter) {
            const fingerKey = `${this.state.currentHand}_${this.state.currentFinger}`;
            const fingerTaps = this.state.mappingData[fingerKey] ? this.state.mappingData[fingerKey].length : 0;
            tapCounter.textContent = `${fingerTaps} taps`;
        }
        
        if (handIndicator) {
            handIndicator.textContent = `${this.state.currentHand.charAt(0).toUpperCase() + this.state.currentHand.slice(1)} ${this.state.currentFinger.charAt(0).toUpperCase() + this.state.currentFinger.slice(1)}`;
        }
    }
    
    updateFingerLegend() {
        const fingers = document.querySelectorAll('.finger-item');
        fingers.forEach(finger => {
            finger.classList.toggle('active', finger.dataset.finger === this.state.currentFinger);
        });
    }
    
    updateCanvas() {
        // Update canvas state if needed
        const canvas = document.getElementById('tap-canvas');
        if (canvas && this.state.isMapping) {
            // Could add canvas-specific updates here
            // For now, the canvas updates are handled by the wizard functions
        }
    }
    
    getCurrentFingerInfo() {
        return {
            finger: this.state.currentFinger,
            hand: this.state.currentHand,
            tapCount: this.state.tapCount,
            requiredTaps: this.state.requiredTaps
        };
    }
    
    exportData() {
        return {
            config: {
                rows: this.state.rows,
                cols: this.state.cols,
                mappingOrder: this.state.mappingOrder,
                canvasWidth: this.state.canvasWidth,
                canvasHeight: this.state.canvasHeight
            },
            tapPositions: this.state.tapPositions,
            suggestedKeys: this.state.suggestedKeys,
            mappingData: this.state.mappingData,
            metadata: {
                createdAt: new Date().toISOString(),
                version: '2.0.0',
                type: 'canvas-based-mapping'
            }
        };
    }
}

// Global app instance
let app;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    app = new KeyboardLayoutApp();
});

// Global utility functions
function showElement(id) {
    const element = document.getElementById(id);
    if (element) element.classList.remove('hidden');
}

function hideElement(id) {
    const element = document.getElementById(id);
    if (element) element.classList.add('hidden');
}

function setElementText(id, text) {
    const element = document.getElementById(id);
    if (element) element.textContent = text;
}