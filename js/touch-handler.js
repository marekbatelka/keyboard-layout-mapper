// Touch and gesture handling for tablet optimization
class TouchHandler {
    constructor() {
        this.touchStartTime = 0;
        this.touchStartPos = { x: 0, y: 0 };
        this.longPressTimer = null;
        this.longPressThreshold = 500; // ms
        
        this.init();
    }
    
    init() {
        // Prevent default touch behaviors that might interfere
        document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
        document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        
        // Prevent context menu on long press
        document.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // Prevent zoom on double tap
        document.addEventListener('touchend', this.preventZoom.bind(this));
        
        // Handle orientation changes
        window.addEventListener('orientationchange', this.handleOrientationChange.bind(this));
        
        console.log('Touch handler initialized');
    }
    
    handleTouchStart(event) {
        // Record touch start time and position
        this.touchStartTime = Date.now();
        
        if (event.touches.length === 1) {
            const touch = event.touches[0];
            this.touchStartPos = { x: touch.clientX, y: touch.clientY };
            
            // Set up long press detection for keyboard keys
            const target = event.target;
            if (target.classList.contains('grid-key')) {
                this.longPressTimer = setTimeout(() => {
                    this.handleLongPress(target);
                }, this.longPressThreshold);
            }
        }
        
        // Prevent default for canvas area to avoid scrolling
        if (event.target.closest('.tap-canvas-container') || event.target.id === 'tap-canvas') {
            event.preventDefault();
        }
    }
    
    handleTouchMove(event) {
        // Cancel long press if finger moves too much
        if (this.longPressTimer && event.touches.length === 1) {
            const touch = event.touches[0];
            const deltaX = Math.abs(touch.clientX - this.touchStartPos.x);
            const deltaY = Math.abs(touch.clientY - this.touchStartPos.y);
            
            if (deltaX > 10 || deltaY > 10) { // 10px threshold
                clearTimeout(this.longPressTimer);
                this.longPressTimer = null;
            }
        }
        
        // Prevent scrolling on the canvas
        if (event.target.closest('.tap-canvas-container') || event.target.id === 'tap-canvas') {
            event.preventDefault();
        }
    }
    
    handleTouchEnd(event) {
        // Clear long press timer
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }
        
        // Handle tap if it was quick and didn't move much
        const touchDuration = Date.now() - this.touchStartTime;
        
        if (touchDuration < this.longPressThreshold) {
            // This was a tap, not a long press
            const target = event.target;
            if (target.id === 'tap-canvas') {
                this.handleCanvasTap(target, event);
            }
        }
    }
    
    handleCanvasTap(target, event) {
        // Add haptic feedback if available
        if (navigator.vibrate) {
            navigator.vibrate(50); // 50ms vibration
        }
        
        // Add visual feedback
        this.addTapFeedback(target);
        
        // The actual tap handling is done by the wizard.js handleCanvasTap function
        // This just adds touch-specific enhancements
    }
    
    handleLongPress(target) {
        // Handle long press on canvas (could be used for special functions)
        if (navigator.vibrate) {
            navigator.vibrate([100, 50, 100]); // Pattern vibration
        }
        
        // Add visual feedback for long press
        target.style.boxShadow = '0 0 20px rgba(255, 255, 0, 0.8)';
        setTimeout(() => {
            target.style.boxShadow = '';
        }, 300);
        
        // Could implement special functionality here like:
        // - Show key details
        // - Toggle key assignment
        // - etc.
    }
    
    addTapFeedback(target) {
        // Add a visual ripple effect
        const ripple = document.createElement('div');
        ripple.style.position = 'absolute';
        ripple.style.borderRadius = '50%';
        ripple.style.background = 'rgba(255, 255, 255, 0.6)';
        ripple.style.pointerEvents = 'none';
        ripple.style.animation = 'ripple 0.3s ease-out';
        
        const rect = target.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        ripple.style.width = size + 'px';
        ripple.style.height = size + 'px';
        ripple.style.left = (rect.width - size) / 2 + 'px';
        ripple.style.top = (rect.height - size) / 2 + 'px';
        
        target.style.position = 'relative';
        target.appendChild(ripple);
        
        // Remove ripple after animation
        setTimeout(() => {
            if (ripple.parentNode) {
                ripple.parentNode.removeChild(ripple);
            }
        }, 300);
    }
    
    preventZoom(event) {
        // Prevent zoom on double tap
        if (event.touches.length > 1) return;
        
        const now = Date.now();
        const timeSinceLastTap = now - (this.lastTapTime || 0);
        
        if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
            event.preventDefault();
        }
        
        this.lastTapTime = now;
    }
    
    handleOrientationChange() {
        // Handle orientation changes for responsive layout
        setTimeout(() => {
            if (app && app.state.isMapping) {
                app.updateCanvasLayout();
            }
        }, 100); // Small delay to ensure orientation change is complete
    }
    
    // Utility methods for gesture detection
    getTouchDistance(touch1, touch2) {
        const dx = touch1.clientX - touch2.clientX;
        const dy = touch1.clientY - touch2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    getTouchAngle(touch1, touch2) {
        const dx = touch2.clientX - touch1.clientX;
        const dy = touch2.clientY - touch1.clientY;
        return Math.atan2(dy, dx) * 180 / Math.PI;
    }
}

// Add CSS for ripple animation
const style = document.createElement('style');
style.textContent = `
    @keyframes ripple {
        0% {
            transform: scale(0);
            opacity: 1;
        }
        100% {
            transform: scale(2);
            opacity: 0;
        }
    }
    
    /* Improve touch targets */
    .grid-key {
        min-height: 48px;
        min-width: 48px;
    }
    
    .btn-primary, .btn-secondary, .btn-copy {
        min-height: 48px;
        min-width: 48px;
    }
    
    /* Prevent text selection on touch */
    .tap-canvas-container, .tap-canvas, .finger-legend {
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
        -webkit-touch-callout: none;
    }
    
    /* Improve scrolling on mobile */
    body {
        -webkit-overflow-scrolling: touch;
        overscroll-behavior: contain;
    }
`;
document.head.appendChild(style);