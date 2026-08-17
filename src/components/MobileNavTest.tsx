/**
 * Mobile Navigation Test Component
 * Add this temporarily to test mobile navigation
 */

import React from 'react';

export const MobileNavTest: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const handleTest = (action: string) => {
    console.log(`🧪 Mobile Test: ${action}`);
    alert(`Mobile Test: ${action} clicked!`);
    
    if (action === 'login') {
      onNavigate('login');
    } else if (action === 'register') {
      onNavigate('candidate-register');
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-red-500 text-white p-2 rounded-lg text-xs">
      <div className="mb-2">Mobile Test Panel</div>
      <div className="flex gap-2">
        <button 
          onClick={() => handleTest('login')}
          className="bg-blue-600 px-2 py-1 rounded text-xs touch-manipulation"
          style={{ touchAction: 'manipulation' }}
        >
          Login
        </button>
        <button 
          onClick={() => handleTest('register')}
          className="bg-green-600 px-2 py-1 rounded text-xs touch-manipulation"
          style={{ touchAction: 'manipulation' }}
        >
          Register
        </button>
      </div>
    </div>
  );
};

export default MobileNavTest;