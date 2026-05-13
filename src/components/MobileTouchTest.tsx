import React, { useState } from 'react';

const MobileTouchTest: React.FC = () => {
  const [clickCount, setClickCount] = useState(0);
  const [touchCount, setTouchCount] = useState(0);
  const [lastEvent, setLastEvent] = useState('');

  const handleClick = (buttonName: string) => {
    setClickCount(prev => prev + 1);
    setLastEvent(`Clicked: ${buttonName}`);
    console.log(`✅ Button clicked: ${buttonName}`);
  };

  const handleTouchStart = (buttonName: string) => {
    setTouchCount(prev => prev + 1);
    setLastEvent(`Touched: ${buttonName}`);
    console.log(`👆 Button touched: ${buttonName}`);
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg border z-50 max-w-xs">
      <h3 className="text-sm font-bold mb-2">Mobile Touch Test</h3>
      
      <div className="space-y-2 text-xs">
        <div>Clicks: {clickCount}</div>
        <div>Touches: {touchCount}</div>
        <div>Last: {lastEvent}</div>
      </div>

      <div className="space-y-2 mt-3">
        <button
          onClick={() => handleClick('Test Button')}
          onTouchStart={() => handleTouchStart('Test Button')}
          className="w-full py-2 px-3 bg-blue-600 text-white rounded text-xs font-medium"
        >
          Test Button
        </button>

        <button
          onClick={() => handleClick('OAuth Style')}
          onTouchStart={() => handleTouchStart('OAuth Style')}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-gray-200 rounded text-xs font-medium text-gray-700 hover:bg-gray-50"
        >
          <span>📱</span>
          OAuth Style
        </button>

        <button
          onClick={() => {
            if (window.mobileTouchDebugger) {
              window.mobileTouchDebugger.fixCommonIssues();
              handleClick('Fix Applied');
            }
          }}
          className="w-full py-2 px-3 bg-green-600 text-white rounded text-xs font-medium"
        >
          Apply Mobile Fixes
        </button>
      </div>

      <div className="mt-2 text-xs text-gray-500">
        Check console for debug info
      </div>
    </div>
  );
};

export default MobileTouchTest;