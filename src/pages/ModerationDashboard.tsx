import React, { useState, useEffect } from 'react';
import { RoleGuard } from '../components/RoleGuard';

interface Job {
  _id: string;
  jobTitle: string;
  company: string;
  location: string;
  status: 'pending' | 'approved' | 'rejected' | 'flagged';
  moderationFlags: {
    isSpam: boolean;
    isDuplicate: boolean;
    isFake: boolean;
    hasComplianceIssues: boolean;
  };
  createdAt: string;
  employerId?: { name: string; email: string };
}

const ModerationDashboard: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedStatus, setSelectedStatus] = useState('pending');
  const [loading, setLoading] = useState(false);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/moderation/jobs?status=${selectedStatus}`);
      const data = await response.json();
      setJobs(data.jobs || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const moderateJob = async (jobId: string, action: string, notes?: string) => {
    try {
      const response = await fetch(`/api/moderation/jobs/${jobId}/moderate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, notes })
      });
      
      if (response.ok) {
        fetchJobs(); // Refresh list
      }
    } catch (error) {
      console.error('Error moderating job:', error);
    }
  };

  const analyzeJob = async (jobId: string) => {
    try {
      const response = await fetch(`/api/moderation/jobs/${jobId}/analyze`, {
        method: 'POST'
      });
      const data = await response.json();
      alert(`AI Analysis: ${data.recommendation}\nRisk Score: ${data.analysis?.riskScore || 0}`);
    } catch (error) {
      console.error('Error analyzing job:', error);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [selectedStatus]);

  return (
    <RoleGuard allowedRoles={['admin', 'moderator']}>
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Job Moderation Dashboard</h1>
        
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
            {jobs.map(job => (
              <div key={job._id} className="bg-white border rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold">{job.jobTitle}</h3>
                    <p className="text-gray-600">{job.company} • {job.location}</p>
                    <p className="text-sm text-gray-500">
                      Posted: {new Date(job.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded text-sm ${
                    job.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    job.status === 'approved' ? 'bg-green-100 text-green-800' :
                    job.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-orange-100 text-orange-800'
                  }`}>
                    {job.status}
                  </span>
                </div>

                {/* Moderation Flags */}
                <div className="mb-4">
                  <div className="flex gap-2 flex-wrap">
                    {job.moderationFlags?.isSpam && (
                      <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">Spam</span>
                    )}
                    {job.moderationFlags?.isFake && (
                      <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">Fake</span>
                    )}
                    {job.moderationFlags?.hasComplianceIssues && (
                      <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">Compliance</span>
                    )}
                    {job.moderationFlags?.isDuplicate && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">Duplicate</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => moderateJob(job._id, 'approve')}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => moderateJob(job._id, 'reject')}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => moderateJob(job._id, 'flag')}
                    className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
                  >
                    Flag
                  </button>
                  <button
                    onClick={() => analyzeJob(job._id)}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    AI Analyze
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </RoleGuard>
  );
};

export default ModerationDashboard;