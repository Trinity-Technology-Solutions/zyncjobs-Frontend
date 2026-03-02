import React, { useState, useRef } from 'react';
import { API_ENDPOINTS } from '../config/api';

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

      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/resume/upload`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (response.ok) {
        setUploadResult(result);
        onUploadComplete?.(result);
        
        // Parse resume for profile data if onProfileUpdate is provided
        if (onProfileUpdate) {
          try {
            const reader = new FileReader();
            reader.onload = async (e) => {
              const fileContent = e.target?.result as string;
              let resumeText = file.type === 'application/pdf' 
                ? `Resume content from ${file.name}` 
                : fileContent.substring(0, 2000);
              
              const parseResponse = await fetch(`${API_ENDPOINTS.BASE_URL}/api/resume/parse-profile`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ resumeText })
              });
              
              const parseResult = await parseResponse.json();
              if (parseResponse.ok) {
                setParsedProfile(parseResult.profileData);
                setShowProfilePreview(true);
              }
            };
            reader.readAsText(file);
          } catch (parseError) {
            console.log('Profile parsing failed:', parseError);
          }
        }
      } else {
        setError(result.error || 'Upload failed');
      }
    } catch (error) {
      setError('Upload failed. Please try again.');
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
        <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded text-red-700">
          {error}
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
    </div>
  );
};

export default ResumeUploadWithModeration;