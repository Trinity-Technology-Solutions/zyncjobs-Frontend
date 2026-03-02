// PWA Utilities
export class PWAManager {
  static async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('SW registered:', registration);
        return registration;
      } catch (error) {
        console.log('SW registration failed:', error);
      }
    }
  }

  static async requestNotificationPermission() {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }

  static async subscribeToPushNotifications(registration) {
    try {
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          'BEl62iUYgUivxIkv69yViEuiBIa40HI80NqIUHI80NqIUHI80NqIUHI80NqI' // Replace with your VAPID key
        )
      });
      
      // Send subscription to server
      await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription)
      });
      
      return subscription;
    } catch (error) {
      console.error('Push subscription failed:', error);
    }
  }

  static urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  static async cacheJobs(jobs) {
    if ('caches' in window) {
      const cache = await caches.open('zyncjobs-jobs');
      await cache.put('/api/jobs', new Response(JSON.stringify(jobs)));
    }
  }

  static async getCachedJobs() {
    if ('caches' in window) {
      const cache = await caches.open('zyncjobs-jobs');
      const response = await cache.match('/api/jobs');
      if (response) {
        return await response.json();
      }
    }
    return null;
  }

  static isOnline() {
    return navigator.onLine;
  }

  static showInstallPrompt() {
    // This will be set by the beforeinstallprompt event
    if (window.deferredPrompt) {
      window.deferredPrompt.prompt();
      window.deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        }
        window.deferredPrompt = null;
      });
    }
  }
}

// Install prompt handling
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  window.deferredPrompt = e;
  
  // Show install button
  const installButton = document.getElementById('install-button');
  if (installButton) {
    installButton.style.display = 'block';
  }
});

// Online/offline status
window.addEventListener('online', () => {
  document.body.classList.remove('offline');
  console.log('App is online');
});

window.addEventListener('offline', () => {
  document.body.classList.add('offline');
  console.log('App is offline');
});