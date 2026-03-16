import React, { useState } from 'react';
import { 
  generateEmployerId, 
  getNextEmployerId, 
  getCurrentEmployerIdCount, 
  resetEmployerIdCounter, 
  setEmployerIdCounter 
} from '../utils/employerIdUtils';

const EmployerIdTest: React.FC = () => {
  const [currentCount, setCurrentCount] = useState(getCurrentEmployerIdCount());
  const [nextId, setNextId] = useState(getNextEmployerId());
  const [generatedIds, setGeneratedIds] = useState<string[]>([]);

  const updateDisplay = () => {
    setCurrentCount(getCurrentEmployerIdCount());
    setNextId(getNextEmployerId());
  };

  const handleGenerateId = () => {
    const newId = generateEmployerId();
    setGeneratedIds(prev => [...prev, newId]);
    updateDisplay();
  };

  const handleReset = () => {
    resetEmployerIdCounter();
    setGeneratedIds([]);
    updateDisplay();
  };

  const handleSetCounter = (value: number) => {
    setEmployerIdCounter(value);
    updateDisplay();
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Employer ID Test</h2>
      
      <div className="space-y-4">
        <div className="bg-gray-100 p-3 rounded">
          <p><strong>Current Count:</strong> {currentCount}</p>
          <p><strong>Next ID:</strong> {nextId}</p>
        </div>

        <div className="space-x-2">
          <button
            onClick={handleGenerateId}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Generate ID
          </button>
          <button
            onClick={handleReset}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Reset Counter
          </button>
        </div>

        <div className="space-x-2">
          <button
            onClick={() => handleSetCounter(0)}
            className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
          >
            Set to 0
          </button>
          <button
            onClick={() => handleSetCounter(10)}
            className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
          >
            Set to 10
          </button>
        </div>

        {generatedIds.length > 0 && (
          <div className="bg-green-50 p-3 rounded">
            <p className="font-semibold mb-2">Generated IDs:</p>
            <div className="flex flex-wrap gap-2">
              {generatedIds.map((id, index) => (
                <span key={index} className="bg-green-200 px-2 py-1 rounded text-sm font-mono">
                  {id}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="bg-blue-50 p-3 rounded">
          <p className="font-semibold mb-2 text-blue-800">Expected Format:</p>
          <div className="text-sm text-blue-700">
            <p>• EID0001, EID0002, EID0003...</p>
            <p>• PID0001, PID0002, PID0003...</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployerIdTest;