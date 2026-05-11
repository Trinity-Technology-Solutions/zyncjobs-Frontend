import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../config/env';
import { getAuthHeaders } from '../utils/authUtils';

interface ApiDebugProps {
  onClose: () => void;
}

const ApiDebugPanel: React.FC<ApiDebugProps> = ({ onClose }) => {
  const [results, setResults] = useState<any[]>([]);
  const [testing, setTesting] = useState(false);

  const testEndpoint = async (name: string, url: string, method: string = 'GET') => {
    const startTime = Date.now();
    try {
      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      let data;
      try {
        data = await response.json();
      } catch {
        data = await response.text();
      }

      return {
        name,
        url,
        status: response.status,
        ok: response.ok,
        duration,
        data: typeof data === 'string' ? data.substring(0, 200) : data,
        headers: Object.fromEntries(response.headers.entries())
      };
    } catch (error) {
      return {
        name,
        url,
        status: 'ERROR',
        ok: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  const runTests = async () => {
    setTesting(true);
    setResults([]);

    const tests = [
      { name: 'Base API', url: `${API_ENDPOINTS.BASE_URL}/health` },
      { name: 'Jobs Endpoint', url: `${API_ENDPOINTS.JOBS}` },
      { name: 'Resume Upload Check', url: `${API_ENDPOINTS.BASE_URL}/resume/upload`, method: 'OPTIONS' },
      { name: 'Auth Check', url: `${API_ENDPOINTS.BASE_URL}/auth/me` },
    ];

    const testResults = [];
    for (const test of tests) {
      const result = await testEndpoint(test.name, test.url, test.method);
      testResults.push(result);
      setResults([...testResults]);
    }

    setTesting(false);
  };

  useEffect(() => {
    runTests();
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">API Debug Panel</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          <div className="mb-4">
            <button
              onClick={runTests}
              disabled={testing}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {testing ? 'Testing...' : 'Run Tests'}
            </button>
          </div>

          <div className="space-y-4">
            {results.map((result, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{result.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-sm ${
                      result.ok ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {result.status}
                    </span>
                    <span className="text-sm text-gray-500">{result.duration}ms</span>
                  </div>
                </div>
                
                <div className="text-sm text-gray-600 mb-2">
                  <strong>URL:</strong> {result.url}
                </div>

                {result.error && (
                  <div className="bg-red-50 border border-red-200 rounded p-2 mb-2">
                    <strong>Error:</strong> {result.error}
                  </div>
                )}

                {result.data && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm font-medium">Response Data</summary>
                    <pre className="mt-2 bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </details>
                )}

                {result.headers && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm font-medium">Response Headers</summary>
                    <pre className="mt-2 bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                      {JSON.stringify(result.headers, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold mb-2">Environment Info</h3>
            <div className="text-sm space-y-1">
              <div><strong>API Base URL:</strong> {API_ENDPOINTS.BASE_URL}</div>
              <div><strong>Current Origin:</strong> {window.location.origin}</div>
              <div><strong>User Agent:</strong> {navigator.userAgent}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiDebugPanel;