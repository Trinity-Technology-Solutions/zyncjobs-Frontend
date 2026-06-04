import React, { useState, useRef } from 'react';
import { API_ENDPOINTS } from '../config/env';
import { getAuthHeaders, getApiHeaders } from '../utils/authUtils';
import { ApiErrorHandler } from '../utils/apiErrorHandler';
import { LocalFileHandler } from '../utils/localFileHandler';
import ApiDebugPanel from './ApiDebugPanel';

interface ResumeUploadProps {
  userId: string;
  onUploadComplete?: (result: any) => void;
  onProfileUpdate?: (profileData: any) => void;
}

const ResumeUploadWithModeration: React.FC<ResumeUploadProps> = ({ userId, onUploadComplete, onProfileUpdate }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [parsedProfile, setParsedProfile] = useState<any>(null);
  const [showProfilePreview, setShowProfilePreview] = useState(false);
  const [error, setError] = useState('');
  const [showDebug, setShowDebug] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Only PDF and DOC files are allowed.');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB.');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('resume', file);
      formData.append('userId', userId);

      console.log('Uploading resume:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        userId: userId
      });

      const response = await ApiErrorHandler.retryRequest(
        () => fetch(`${API_ENDPOINTS.BASE_URL}/resume/upload`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: formData
        }),
        2, // Max 2 retries
        1500 // 1.5 second delay
      );

      console.log('Upload response status:', response.status);
      
      let result;
      const rawText = await response.text();
      try {
        result = JSON.parse(rawText);
      } catch (parseError) {
        console.error('Failed to parse response as JSON. Raw response:', rawText);
        throw new Error(`Server returned ${response.status}: ${rawText || 'Unknown error'}`);
      }

      console.log('Upload result:', result);

      const apiError = ApiErrorHandler.handleResponse(response, result);
      if (apiError) {
        // Check if it's a server configuration error (AWS credentials)
        if (apiError.status === 500 && result?.error?.includes('credentials')) {
          console.log('Server upload failed, trying local fallback...');
          
          // Try local fallback
          const localResult = await LocalFileHandler.processFileLocally(file);
          if (localResult.success) {
            const mockResponse = LocalFileHandler.createMockResponse(localResult);
            setUploadResult(mockResponse);
            onUploadComplete?.(mockResponse);
            
            // Show info about local processing
            setError('Server upload temporarily unavailable. File processed locally. You can continue using the application.');
            return;
          }
        }
        
        setError(apiError.message);
        return;
      }
      // Success case
      setUploadResult(result);
      onUploadComplete?.(result);
        // Parse resume for profile data if onProfileUpdate is provided
        if (onProfileUpdate) {
          try {
            const formData2 = new FormData();
            formData2.append('resume', file);
            const parseResponse = await fetch(`${API_ENDPOINTS.BASE_URL}/resume/upload-and-parse`, {
              method: 'POST',
              headers: getAuthHeaders(),
              body: formData2
            });
            const parseResult = await parseResponse.json();
            if (parseResponse.ok && parseResult.profileData) {
              setParsedProfile(parseResult.profileData);
              setShowProfilePreview(true);
            }
          } catch (parseError) {
            console.log('Profile parsing failed:', parseError);
          }
        }
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Upload failed. Please try again.';
      setError(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600';
      case 'rejected': return 'text-red-600';
      case 'flagged': return 'text-orange-600';
      default: return 'text-yellow-600';
    }
  };

  const getStatusMessage = (result: any) => {
    if (result.resume.status === 'approved') {
      return '✅ Resume approved and ready to use!';
    } else if (result.resume.status === 'rejected') {
      return '❌ Resume rejected. Please upload a different file.';
    } else if (result.resume.status === 'flagged') {
      return '⚠️ Resume flagged for review. We\'ll notify you once reviewed.';
    } else {
      return '⏳ Resume pending review. You\'ll be notified once approved.';
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white border rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold mb-4">Upload Resume</h3>
      
      <div className="mb-4">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={handleFileUpload}
          disabled={uploading}
          className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-sm text-gray-500 mt-1">
          Accepted formats: PDF, DOC, DOCX (Max 5MB)
        </p>
      </div>

      {error && (
        <div className={`mb-4 p-3 border rounded ${
          error.includes('processed locally') 
            ? 'bg-yellow-100 border-yellow-300 text-yellow-800'
            : 'bg-red-100 border-red-300 text-red-700'
        }`}>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-start gap-2">
                {error.includes('processed locally') ? (
                  <svg className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                )}
                <span>{error}</span>
              </div>
              {error.includes('processed locally') && (
                <div className="mt-2 text-sm text-yellow-700">
                  <p>• Your file has been processed and you can continue using the application</p>
                  <p>• The server issue will be resolved soon</p>
                  <p>• No action needed from you</p>
                </div>
              )}
            </div>
            <button
              onClick={() => setShowDebug(true)}
              className={`text-xs px-2 py-1 rounded ml-2 ${
                error.includes('processed locally')
                  ? 'bg-yellow-200 hover:bg-yellow-300 text-yellow-800'
                  : 'bg-red-200 hover:bg-red-300 text-red-800'
              }`}
            >
              Debug
            </button>
          </div>
        </div>
      )}

      {uploading && (
        <div className="mb-4 p-3 bg-blue-100 border border-blue-300 rounded text-blue-700">
          🔄 Uploading and analyzing resume...
        </div>
      )}

      {uploadResult && (
        <div className="mb-4 p-4 bg-gray-50 border rounded">
          <div className={`font-medium ${getStatusColor(uploadResult.resume.status)}`}>
            {getStatusMessage(uploadResult)}
          </div>
          
          <div className="mt-2 text-sm text-gray-600">
            <div>Risk Score: {uploadResult.resume.riskScore}/100</div>
            <div>Status: {uploadResult.resume.status}</div>
            
            {uploadResult.resume.issues && uploadResult.resume.issues.length > 0 && (
              <div className="mt-2">
                <div className="font-medium">Issues detected:</div>
                <ul className="list-disc list-inside">
                  {uploadResult.resume.issues.map((issue: string, index: number) => (
                    <li key={index} className="text-red-600">{issue}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          {/* Profile Data Preview */}
          {showProfilePreview && parsedProfile && onProfileUpdate && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <h4 className="font-medium text-blue-800 mb-2">📋 Extracted Profile Data</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {parsedProfile.name && <div><strong>Name:</strong> {parsedProfile.name}</div>}
                {parsedProfile.email && <div><strong>Email:</strong> {parsedProfile.email}</div>}
                {parsedProfile.phone && <div><strong>Phone:</strong> {parsedProfile.phone}</div>}
                {parsedProfile.location && <div><strong>Location:</strong> {parsedProfile.location}</div>}
                {parsedProfile.title && <div><strong>Title:</strong> {parsedProfile.title}</div>}
                {parsedProfile.experience > 0 && <div><strong>Experience:</strong> {parsedProfile.experience} years</div>}
              </div>
              {parsedProfile.skills.length > 0 && (
                <div className="mt-2">
                  <strong className="text-xs">Skills:</strong>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {parsedProfile.skills.map((skill: string, index: number) => (
                      <span key={index} className="px-1 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <button
                onClick={() => {
                  if (onProfileUpdate) {
                    onProfileUpdate(parsedProfile);
                    setShowProfilePreview(false);
                  }
                }}
                className="mt-2 bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
              >
                ✨ Auto-Fill My Profile
              </button>
            </div>
          )}
        </div>
      )}

      <div className="text-xs text-gray-500">
        <div className="font-medium mb-1">Our AI checks for:</div>
        <ul className="list-disc list-inside space-y-1">
          <li>Spam or inappropriate content</li>
          <li>File format and size validation</li>
          <li>Duplicate or fake resumes</li>
          <li>Profile information matching</li>
        </ul>
      </div>
      
      {showDebug && (
        <ApiDebugPanel onClose={() => setShowDebug(false)} />
      )}
    </div>
  );
};

export default ResumeUploadWithModeration;
