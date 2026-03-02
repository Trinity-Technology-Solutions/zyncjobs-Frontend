import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../config/api';
import { Eye, CheckCircle, XCircle, Flag, FileText, Calendar, Building, User } from 'lucide-react';

interface Job {
  _id: string;
  jobTitle: string;
  company: string;
  location: string;
  salary: { min: number; max: number; currency: string };
  description: string;
  status: 'pending' | 'approved' | 'rejected' | 'flagged';
  createdAt: string;
  employerId: { name: string; email: string; company: string };
  moderationFlags?: {
    isSpam: boolean;
    isFake: boolean;
    hasComplianceIssues: boolean;
    isDuplicate: boolean;
  };
}

interface ModerationSummary {
  pending: number;
  approvedToday: number;
  rejectedToday: number;
  suspicious: number;
}

const JobModerationDashboard: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [summary, setSummary] = useState<ModerationSummary>({
    pending: 0, approvedToday: 0, rejectedToday: 0, suspicious: 0
  });
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: 'pending',
    company: '',
    page: 1
  });

  const fetchSummary = async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/admin/jobs/summary`);
      const data = await response.json();
      setSummary(data);
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  };

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status: filters.status,
        page: filters.page.toString(),
        ...(filters.company && { company: filters.company })
      });
      
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/admin/jobs/pending?${params}`);
      const data = await response.json();
      setJobs(data.jobs || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const moderateJob = async (jobId: string, action: string, data: any = {}) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/admin/jobs/${jobId}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, [`${action}_by`]: 'admin123' })
      });
      
      if (response.ok) {
        fetchJobs();
        fetchSummary();
        setShowModal(false);
      }
    } catch (error) {
      console.error(`Error ${action}ing job:`, error);
    }
  };

  const analyzeJob = async (jobId: string) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/admin/jobs/${jobId}/analyze`, {
        method: 'POST'
      });
      const data = await response.json();
      alert(`AI Analysis:\nRecommendation: ${data.recommendation}\nRisk Score: ${data.analysis?.riskScore || 0}/100\nIssues: ${data.issues?.join(', ') || 'None'}`);
    } catch (error) {
      console.error('Error analyzing job:', error);
    }
  };

  useEffect(() => {
    fetchSummary();
    fetchJobs();
  }, [filters]);

  const JobQuickViewModal = () => {
    if (!selectedJob || !showModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center p-6 border-b">
            <h2 className="text-2xl font-bold">Job Review</h2>
            <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
              ✕
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Job Details */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-xl font-semibold mb-2">{selectedJob.jobTitle}</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4" />
                    {selectedJob.company}
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {new Date(selectedJob.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {selectedJob.employerId.name} ({selectedJob.employerId.email})
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Salary & Location</h4>
                <p className="text-sm text-gray-600">
                  {selectedJob.salary?.min || 0} - {selectedJob.salary?.max || 0} {selectedJob.salary?.currency || 'USD'}
                </p>
                <p className="text-sm text-gray-600">{selectedJob.location}</p>
              </div>
            </div>

            {/* Job Description */}
            <div>
              <h4 className="font-medium mb-2">Job Description</h4>
              <div className="bg-gray-50 p-4 rounded-lg max-h-40 overflow-y-auto">
                <p className="text-sm whitespace-pre-line">{selectedJob.description}</p>
              </div>
            </div>

            {/* Moderation Flags */}
            {selectedJob.moderationFlags && (
              <div>
                <h4 className="font-medium mb-2">AI Analysis Flags</h4>
                <div className="flex gap-2 flex-wrap">
                  {selectedJob.moderationFlags.isSpam && (
                    <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">🚫 Spam</span>
                  )}
                  {selectedJob.moderationFlags.isFake && (
                    <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">🎭 Fake</span>
                  )}
                  {selectedJob.moderationFlags.hasComplianceIssues && (
                    <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">📋 Compliance</span>
                  )}
                  {selectedJob.moderationFlags.isDuplicate && (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">📄 Duplicate</span>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <button
                onClick={() => moderateJob(selectedJob._id, 'approve')}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4" />
                Approve
              </button>
              
              <button
                onClick={() => {
                  const reason = prompt('Rejection reason:');
                  if (reason) moderateJob(selectedJob._id, 'reject', { reason });
                }}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                <XCircle className="w-4 h-4" />
                Reject
              </button>
              
              <button
                onClick={() => {
                  const flagType = prompt('Flag type (spam/duplicate/scam/fake):');
                  const notes = prompt('Additional notes:');
                  if (flagType) moderateJob(selectedJob._id, 'flag', { flag_type: flagType, notes });
                }}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
              >
                <Flag className="w-4 h-4" />
                Mark Suspicious
              </button>
              
              <button
                onClick={() => analyzeJob(selectedJob._id)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                <FileText className="w-4 h-4" />
                AI Analyze
              </button>
              
              <button
                onClick={() => {
                  const note = prompt('Add admin note:');
                  if (note) moderateJob(selectedJob._id, 'note', { note });
                }}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Add Notes
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Job Moderation Dashboard</h1>
      
      {/* Moderation Summary */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-medium text-yellow-800">Pending Jobs</h3>
          <p className="text-2xl font-bold text-yellow-900">{summary.pending}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-medium text-green-800">Approved Today</h3>
          <p className="text-2xl font-bold text-green-900">{summary.approvedToday}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="font-medium text-red-800">Rejected Today</h3>
          <p className="text-2xl font-bold text-red-900">{summary.rejectedToday}</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <h3 className="font-medium text-orange-800">Suspicious</h3>
          <p className="text-2xl font-bold text-orange-900">{summary.suspicious}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border rounded-lg p-4 mb-6">
        <div className="flex gap-4 items-center">
          <select
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value})}
            className="border rounded px-3 py-2"
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="flagged">Flagged</option>
          </select>
          
          <input
            type="text"
            placeholder="Filter by company..."
            value={filters.company}
            onChange={(e) => setFilters({...filters, company: e.target.value})}
            className="border rounded px-3 py-2"
          />
        </div>
      </div>

      {/* Jobs Table */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">Job Title</th>
              <th className="px-4 py-3 text-left">Company</th>
              <th className="px-4 py-3 text-left">Posted By</th>
              <th className="px-4 py-3 text-left">Posted Date</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center">Loading...</td>
              </tr>
            ) : jobs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No {filters.status} jobs found
                </td>
              </tr>
            ) : (
              jobs.map(job => (
                <tr key={job._id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{job.jobTitle}</td>
                  <td className="px-4 py-3">{job.company}</td>
                  <td className="px-4 py-3">
                    {job.employerId?.name || 'Unknown'}
                    <br />
                    <span className="text-sm text-gray-500">{job.employerId?.email}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(job.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${
                      job.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      job.status === 'approved' ? 'bg-green-100 text-green-800' :
                      job.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-orange-100 text-orange-800'
                    }`}>
                      {job.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => {
                        setSelectedJob(job);
                        setShowModal(true);
                      }}
                      className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                    >
                      <Eye className="w-3 h-3" />
                      Review
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <JobQuickViewModal />
    </div>
  );
};

export default JobModerationDashboard;