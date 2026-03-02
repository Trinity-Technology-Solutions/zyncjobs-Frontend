import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../config/api';
import RoleGuard from '../components/RoleGuard';

interface Resume {
  _id: string;
  originalName: string;
  fileSize: number;
  status: 'pending' | 'approved' | 'rejected' | 'flagged';
  riskScore: number;
  moderationFlags: {
    hasSpam: boolean;
    hasInappropriateContent: boolean;
    isFake: boolean;
    profileMismatch: boolean;
    isDuplicate: boolean;
  };
  userId: { name: string; email: string };
  createdAt: string;
}

const ResumeModerationDashboard: React.FC = () => {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedStatus, setSelectedStatus] = useState('pending');
  const [loading, setLoading] = useState(false);

  const fetchResumes = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/resume/moderation?status=${selectedStatus}`);
      const data = await response.json();
      setResumes(data.resumes || []);
    } catch (error) {
      console.error('Error fetching resumes:', error);
    } finally {
      setLoading(false);
    }
  };

  const moderateResume = async (resumeId: string, action: string, notes?: string) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/resume/${resumeId}/moderate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, notes })
      });
      
      if (response.ok) {
        fetchResumes(); // Refresh list
      }
    } catch (error) {
      console.error('Error moderating resume:', error);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, [selectedStatus]);

  const formatFileSize = (bytes: number) => {
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const getRiskColor = (score: number) => {
    if (score >= 70) return 'text-red-600';
    if (score >= 40) return 'text-orange-600';
    if (score >= 20) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Resume Moderation Dashboard</h1>
        
        <div className="mb-6">
          <div className="flex gap-4">
            {['pending', 'approved', 'rejected', 'flagged'].map(status => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-4 py-2 rounded ${
                  selectedStatus === status 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <div className="space-y-4">
            {resumes.map(resume => (
              <div key={resume._id} className="bg-white border rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{resume.originalName}</h3>
                    <p className="text-gray-600">
                      {resume.userId.name} ({resume.userId.email})
                    </p>
                    <p className="text-sm text-gray-500">
                      Size: {formatFileSize(resume.fileSize)} • 
                      Uploaded: {new Date(resume.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded text-sm ${
                      resume.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      resume.status === 'approved' ? 'bg-green-100 text-green-800' :
                      resume.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-orange-100 text-orange-800'
                    }`}>
                      {resume.status}
                    </span>
                    <div className={`text-sm font-medium mt-1 ${getRiskColor(resume.riskScore)}`}>
                      Risk: {resume.riskScore}/100
                    </div>
                  </div>
                </div>

                {/* Moderation Flags */}
                <div className="mb-4">
                  <div className="flex gap-2 flex-wrap">
                    {resume.moderationFlags?.hasSpam && (
                      <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">🚫 Spam</span>
                    )}
                    {resume.moderationFlags?.hasInappropriateContent && (
                      <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">⚠️ Inappropriate</span>
                    )}
                    {resume.moderationFlags?.isFake && (
                      <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">🎭 Fake</span>
                    )}
                    {resume.moderationFlags?.profileMismatch && (
                      <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">📋 Profile Mismatch</span>
                    )}
                    {resume.moderationFlags?.isDuplicate && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">📄 Duplicate</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => moderateResume(resume._id, 'approve')}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    ✓ Approve
                  </button>
                  <button
                    onClick={() => moderateResume(resume._id, 'reject')}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    ✗ Reject
                  </button>
                  <button
                    onClick={() => moderateResume(resume._id, 'flag')}
                    className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
                  >
                    🏴 Flag
                  </button>
                </div>
              </div>
            ))}
            
            {resumes.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No {selectedStatus} resumes found.
              </div>
            )}
          </div>
        )}
      </div>
  );
};

export default ResumeModerationDashboard;