import React, { useState, useEffect } from 'react';
import { Download, Smartphone } from 'lucide-react';
import { PWAManager } from '../utils/pwa';

const PWAInstallButton: React.FC = () => {
  const [showInstall, setShowInstall] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setShowInstall(true);
      (window as any).deferredPrompt = e;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = () => {
    if (isIOS) {
      // Show iOS install instructions
      alert('To install: Tap the Share button and then "Add to Home Screen"');
      return;
    }

    PWAManager.showInstallPrompt();
    setShowInstall(false);
  };

  if (!showInstall && !isIOS) return null;

  return (
    <button
      onClick={handleInstall}
      className="fixed bottom-4 right-4 bg-red-600 text-white px-4 py-2 rounded-full shadow-lg hover:bg-red-700 transition-colors flex items-center space-x-2 z-50"
      id="install-button"
    >
      <Smartphone className="w-4 h-4" />
      <span className="text-sm font-medium">Install App</span>
    </button>
  );
};

export default PWAInstallButton;