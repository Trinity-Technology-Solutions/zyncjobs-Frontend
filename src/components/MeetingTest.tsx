import React, { useState } from 'react';
import { Video, Phone, Calendar, Clock } from 'lucide-react';

const MeetingTest = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [formData, setFormData] = useState({
    platform: 'zoom',
    topic: 'Test Meeting',
    start_time: '',
    duration: 60,
    description: 'Test meeting created via ZyncJobs'
  });

  const createMeeting = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const response = await fetch('http://localhost:5000/api/meetings/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || 'test-token'}`
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      setResult(data);
      
      if (data.success) {
        console.log('Meeting created successfully:', data);
      } else {
        console.error('Meeting creation failed:', data);
      }
    } catch (error) {
      console.error('Error:', error);
      setResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">Meeting Integration Test</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Platform</label>
          <select
            value={formData.platform}
            onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="zoom">Zoom</option>
            <option value="googlemeet">Google Meet</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Meeting Topic</label>
          <input
            type="text"
            value={formData.topic}
            onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Enter meeting topic"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Start Time</label>
          <input
            type="datetime-local"
            value={formData.start_time}
            onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Duration (minutes)</label>
          <select
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value={30}>30 minutes</option>
            <option value={60}>60 minutes</option>
            <option value={90}>90 minutes</option>
            <option value={120}>120 minutes</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 h-20"
            placeholder="Meeting description"
          />
        </div>

        <button
          onClick={createMeeting}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Creating Meeting...</span>
            </>
          ) : (
            <>
              {formData.platform === 'zoom' ? <Video size={20} /> : <Phone size={20} />}
              <span>Create {formData.platform === 'zoom' ? 'Zoom' : 'Google Meet'} Meeting</span>
            </>
          )}
        </button>
      </div>

      {result && (
        <div className="mt-6 p-4 rounded-lg border">
          <h3 className="font-semibold mb-2">Result:</h3>
          {result.success ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span className="text-green-800 font-medium">Meeting Created Successfully!</span>
              </div>
              
              <div className="space-y-2 text-sm">
                <div><strong>Platform:</strong> {result.meeting?.platform}</div>
                <div><strong>Meeting ID:</strong> {result.meeting?.meetingId}</div>
                {result.meeting?.joinUrl && (
                  <div>
                    <strong>Join URL:</strong> 
                    <a 
                      href={result.meeting.joinUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline ml-2"
                    >
                      {result.meeting.joinUrl}
                    </a>
                  </div>
                )}
                {result.meeting?.password && (
                  <div><strong>Password:</strong> {result.meeting.password}</div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                <span className="text-red-800 font-medium">Meeting Creation Failed</span>
              </div>
              <div className="text-sm text-red-700">
                <strong>Error:</strong> {result.error || result.message || 'Unknown error'}
              </div>
            </div>
          )}
          
          <details className="mt-4">
            <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
              View Raw Response
            </summary>
            <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
};

export default MeetingTest;