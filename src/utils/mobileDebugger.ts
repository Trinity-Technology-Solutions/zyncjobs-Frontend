/**
 * Mobile Debug Utility
 * Helps identify and fix mobile touch/click issues
 */

export class MobileDebugger {
  private static isEnabled = process.env.NODE_ENV === 'development';

  /**
   * Add touch debugging to buttons
   */
  static debugButton(element: HTMLElement, label: string) {
    if (!this.isEnabled) return;

    element.addEventListener('touchstart', (e) => {
      console.log(`🟢 Touch Start: ${label}`, e);
      element.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
    });

    element.addEventListener('touchend', (e) => {
      console.log(`🔵 Touch End: ${label}`, e);
      element.style.backgroundColor = '';
    });

    element.addEventListener('click', (e) => {
      console.log(`🟡 Click: ${label}`, e);
    });

    element.addEventListener('touchcancel', (e) => {
      console.log(`🔴 Touch Cancel: ${label}`, e);
      element.style.backgroundColor = '';
    });
  }

  /**
   * Check if device is mobile
   */
  static isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  /**
   * Check if device supports touch
   */
  static isTouch(): boolean {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  /**
   * Add global mobile debugging
   */
  static init() {
    if (!this.isEnabled) return;

    console.log('📱 Mobile Debug Info:', {
      isMobile: this.isMobile(),
      isTouch: this.isTouch(),
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio
      }
    });

    // Debug all buttons
    document.addEventListener('DOMContentLoaded', () => {
      const buttons = document.querySelectorAll('button, [role="button"]');
      buttons.forEach((button, index) => {
        this.debugButton(button as HTMLElement, `Button-${index}`);
      });
    });

    // Monitor viewport changes
    window.addEventListener('resize', () => {
      console.log('📱 Viewport changed:', {
        width: window.innerWidth,
        height: window.innerHeight
      });
    });

    // Monitor orientation changes
    window.addEventListener('orientationchange', () => {
      console.log('📱 Orientation changed:', window.orientation);
    });
  }

  /**
   * Fix common mobile issues
   */
  static applyMobileFixes() {
    // Prevent zoom on input focus (iOS)
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      if (input instanceof HTMLElement) {
        input.style.fontSize = '16px';
      }
    });

    // Add touch-action to all interactive elements
    const interactive = document.querySelectorAll('button, a, [role="button"], [onclick]');
    interactive.forEach(element => {
      if (element instanceof HTMLElement) {
        element.style.touchAction = 'manipulation';
        // Use index signature to access webkit-specific property
        (element.style as any).webkitTapHighlightColor = 'rgba(0, 0, 0, 0.1)';
      }
    });

    // Fix viewport meta tag if missing
    let viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
      viewport = document.createElement('meta');
      viewport.setAttribute('name', 'viewport');
      viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
      document.head.appendChild(viewport);
    }
  }
}

// Auto-initialize in development
if (typeof window !== 'undefined') {
  MobileDebugger.init();
  MobileDebugger.applyMobileFixes();
}