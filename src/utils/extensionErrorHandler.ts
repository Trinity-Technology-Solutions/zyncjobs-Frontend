/**
 * Browser Extension Error Handler
 * Prevents browser extension errors from affecting the main application
 */

class ExtensionErrorHandler {
  private static initialized = false;

  static init() {
    if (this.initialized) return;
    this.initialized = true;

    // Handle unhandled promise rejections from extensions
    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason;
      
      // Check if it's an extension-related error
      if (this.isExtensionError(error)) {
        console.warn('Browser extension error suppressed:', error);
        event.preventDefault(); // Prevent the error from being logged to console
        return;
      }
    });

    // Handle general errors from extensions
    window.addEventListener('error', (event) => {
      if (this.isExtensionError(event.error)) {
        console.warn('Browser extension error suppressed:', event.error);
        event.preventDefault();
        return;
      }
    });

    // Override console.error to filter extension errors
    const originalConsoleError = console.error;
    console.error = (...args) => {
      const message = args.join(' ');
      if (this.isExtensionErrorMessage(message)) {
        console.warn('Extension error filtered:', ...args);
        return;
      }
      originalConsoleError.apply(console, args);
    };
  }

  private static isExtensionError(error: any): boolean {
    if (!error) return false;

    const errorString = error.toString();
    const stack = error.stack || '';

    // Common extension error patterns
    const extensionPatterns = [
      'message channel closed',
      'Extension context invalidated',
      'chrome-extension://',
      'moz-extension://',
      'safari-extension://',
      'The message port closed before a response was received',
      'A listener indicated an asynchronous response by returning true',
      'Could not establish connection',
      'Receiving end does not exist'
    ];

    return extensionPatterns.some(pattern => 
      errorString.toLowerCase().includes(pattern.toLowerCase()) ||
      stack.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  private static isExtensionErrorMessage(message: string): boolean {
    const extensionPatterns = [
      'message channel closed',
      'extension context invalidated',
      'listener indicated an asynchronous response',
      'receiving end does not exist'
    ];

    return extensionPatterns.some(pattern => 
      message.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  static suppressExtensionErrors() {
    // Additional method to manually suppress known extension errors
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        return await originalFetch.apply(window, args);
      } catch (error) {
        if (this.isExtensionError(error)) {
          console.warn('Extension-related fetch error suppressed:', error);
          throw new Error('Network request failed');
        }
        throw error;
      }
    };
  }
}

// Auto-initialize when the module is loaded
ExtensionErrorHandler.init();

export default ExtensionErrorHandler;