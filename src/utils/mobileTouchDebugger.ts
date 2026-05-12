// Mobile Touch Debugger
class MobileTouchDebugger {
  constructor() {
    this.isEnabled = false;
    this.touchEvents = [];
    this.init();
  }

  init() {
    // Only enable on mobile devices
    if (window.innerWidth <= 768) {
      this.enableDebugging();
    }
  }

  enableDebugging() {
    this.isEnabled = true;
    this.addTouchEventListeners();
    this.addVisualFeedback();
    console.log('🔧 Mobile Touch Debugger enabled');
  }

  addTouchEventListeners() {
    // Track all touch events
    ['touchstart', 'touchmove', 'touchend', 'touchcancel'].forEach(eventType => {
      document.addEventListener(eventType, (e) => {
        this.logTouchEvent(eventType, e);
      }, { passive: false });
    });

    // Track click events
    document.addEventListener('click', (e) => {
      this.logClickEvent(e);
    }, true);

    // Track button interactions
    document.addEventListener('click', (e) => {
      if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
        this.highlightElement(e.target.closest('button') || e.target);
      }
    }, true);
  }

  logTouchEvent(type, event) {
    const touch = event.touches[0] || event.changedTouches[0];
    if (touch) {
      const element = document.elementFromPoint(touch.clientX, touch.clientY);
      console.log(`👆 ${type}:`, {
        element: element?.tagName,
        className: element?.className,
        x: touch.clientX,
        y: touch.clientY,
        target: event.target.tagName
      });
    }
  }

  logClickEvent(event) {
    const element = event.target;
    console.log('🖱️ Click:', {
      element: element.tagName,
      className: element.className,
      x: event.clientX,
      y: event.clientY,
      isTrusted: event.isTrusted
    });
  }

  highlightElement(element) {
    // Add visual feedback for touched elements
    element.style.outline = '2px solid #ff0000';
    element.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
    
    setTimeout(() => {
      element.style.outline = '';
      element.style.backgroundColor = '';
    }, 500);
  }

  addVisualFeedback() {
    // Add CSS for better touch feedback
    const style = document.createElement('style');
    style.textContent = `
      .touch-debug * {
        outline: 1px solid rgba(255, 0, 0, 0.3) !important;
      }
      
      .touch-active {
        background-color: rgba(0, 255, 0, 0.2) !important;
        transform: scale(0.98) !important;
      }
    `;
    document.head.appendChild(style);
  }

  // Method to test specific elements
  testElement(selector) {
    const element = document.querySelector(selector);
    if (element) {
      console.log('🧪 Testing element:', selector);
      console.log('Element properties:', {
        tagName: element.tagName,
        className: element.className,
        disabled: element.disabled,
        style: element.style.cssText,
        computedStyle: window.getComputedStyle(element).touchAction
      });
      
      // Test if element is clickable
      element.addEventListener('click', () => {
        console.log('✅ Element is clickable:', selector);
      }, { once: true });
      
      // Simulate click
      element.click();
    } else {
      console.log('❌ Element not found:', selector);
    }
  }

  // Method to fix common mobile issues
  fixCommonIssues() {
    console.log('🔧 Applying mobile fixes...');
    
    // Fix all buttons
    document.querySelectorAll('button, [role="button"]').forEach(btn => {
      btn.style.touchAction = 'manipulation';
      btn.style.webkitTapHighlightColor = 'rgba(0, 0, 0, 0.1)';
      btn.style.userSelect = 'none';
      btn.style.minHeight = '44px';
    });

    // Fix all inputs
    document.querySelectorAll('input').forEach(input => {
      if (input.type === 'email' || input.type === 'password' || input.type === 'text') {
        input.style.fontSize = '16px';
        input.style.webkitAppearance = 'none';
      }
    });

    console.log('✅ Mobile fixes applied');
  }
}

// Auto-initialize on mobile
if (typeof window !== 'undefined') {
  window.mobileTouchDebugger = new MobileTouchDebugger();
  
  // Expose methods to console for manual testing
  window.testButton = (selector) => window.mobileTouchDebugger.testElement(selector);
  window.fixMobile = () => window.mobileTouchDebugger.fixCommonIssues();
}

export default MobileTouchDebugger;