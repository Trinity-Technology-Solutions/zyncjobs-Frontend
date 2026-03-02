import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Star, CheckCircle, XCircle, Eye } from 'lucide-react';

interface CandidateReviewPageProps {
  onNavigate: (page: string) => void;
  jobId?: string;
}

interface Candidate {
  _id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  skills: string[];
  experience: string;
  education: string;
  resume?: { name: string };
  aiScore: number;
  aiRecommendation: string;
  matchScore: number;
  application: {
    appliedAt: string;
    status: string;
    answers?: any;
  };
}

const CandidateReviewPage: React.FC<CandidateReviewPageProps> = ({ onNavigate, jobId }) => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [shortlisted, setShortlisted] = useState<Candidate[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (jobId) {
      fetchCandidates();
      fetchShortlisted();
    }
  }, [jobId]);

  const fetchCandidates = async () => {
    try {
      const response = await fetch(`/api/employer/jobs/${jobId}/applicants`);
      const data = await response.json();
      setCandidates(data.applicants || []);
    } catch (error) {
      console.error('Error fetching candidates:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchShortlisted = async () => {
    try {
      const response = await fetch(`/api/employer/jobs/${jobId}/shortlisted`);
      const data = await response.json();
      setShortlisted(data.shortlisted || []);
    } catch (error) {
      console.error('Error fetching shortlisted:', error);
    }
  };

  const shortlistCandidate = async (candidateId: string, notes = '') => {
    try {
      await fetch('/api/employer/shortlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId, jobId, notes })
      });
      
      fetchCandidates();
      fetchShortlisted();
      alert('Candidate shortlisted successfully!');
    } catch (error) {
      alert('Error shortlisting candidate');
    }
  };

  const updateCandidateStatus = async (candidateId: string, status: string, notes = '') => {
    try {
      await fetch(`/api/employer/candidate/${candidateId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, status, notes })
      });
      
      fetchCandidates();
      fetchShortlisted();
      alert(`Candidate status updated to ${status}`);
    } catch (error) {
      alert('Error updating candidate status');
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const CandidateCard = ({ candidate }: { candidate: Candidate }) => (
    <div className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">{candidate.name}</h3>
            <p className="text-gray-600 text-sm">Applied {new Date(candidate.application.appliedAt).toLocaleDateString()}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded text-xs font-medium ${getScoreColor(candidate.aiScore)}`}>
            AI Score: {candidate.aiScore}/100
          </span>
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
            Match: {candidate.matchScore}%
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div className="flex items-center text-gray-600">
          <Mail className="w-4 h-4 mr-2" />
          {candidate.email}
        </div>
        <div className="flex items-center text-gray-600">
          <Phone className="w-4 h-4 mr-2" />
          {candidate.phone || 'Not provided'}
        </div>
        <div className="flex items-center text-gray-600">
          <MapPin className="w-4 h-4 mr-2" />
          {candidate.location}
        </div>
        <div className="flex items-center text-gray-600">
          <Star className="w-4 h-4 mr-2" />
          {candidate.aiRecommendation}
        </div>
      </div>

      <div className="mb-4">
        <p className="text-sm font-medium mb-2">Skills:</p>
        <div className="flex flex-wrap gap-1">
          {candidate.skills?.slice(0, 5).map((skill, index) => (
            <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
              {skill}
            </span>
          ))}
          {candidate.skills?.length > 5 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
              +{candidate.skills.length - 5} more
            </span>
          )}
        </div>
      </div>

      <div className="flex space-x-2">
        <button
          onClick={() => setSelectedCandidate(candidate)}
          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center justify-center"
        >
          <Eye className="w-4 h-4 mr-2" />
          View Details
        </button>
        
        {candidate.application.status !== 'shortlisted' && (
          <button
            onClick={() => shortlistCandidate(candidate._id)}
            className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center justify-center"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Shortlist
          </button>
        )}
        
        <button
          onClick={() => updateCandidateStatus(candidate._id, 'rejected')}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          <XCircle className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  if (loading) return <div className="p-6">Loading candidates...</div>;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Review Candidates</h1>
        <button 
          onClick={() => onNavigate('employer-dashboard')}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          Back to Dashboard
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b mb-6">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab('all')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'all' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            All Applicants ({candidates.length})
          </button>
          <button
            onClick={() => setActiveTab('shortlisted')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'shortlisted' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Shortlisted ({shortlisted.length})
          </button>
        </div>
      </div>

      {/* Candidate List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {activeTab === 'all' && candidates.map(candidate => (
          <CandidateCard key={candidate._id} candidate={candidate} />
        ))}
        
        {activeTab === 'shortlisted' && shortlisted.map(candidate => (
          <CandidateCard key={candidate._id} candidate={candidate} />
        ))}
      </div>

      {/* Candidate Detail Modal */}
      {selectedCandidate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">{selectedCandidate.name}</h2>
                <button
                  type="button"
                  onClick={() => setSelectedCandidate(null)}
                  className="text-gray-500 hover:text-gray-700"
                  title="Close modal"
                  aria-label="Close modal"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Contact Information</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Email:</strong> {selectedCandidate.email}</p>
                    <p><strong>Phone:</strong> {selectedCandidate.phone}</p>
                    <p><strong>Location:</strong> {selectedCandidate.location}</p>
                  </div>

                  <h3 className="text-lg font-semibold mb-3 mt-6">AI Assessment</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>AI Score:</strong> {selectedCandidate.aiScore}/100</p>
                    <p><strong>Match Score:</strong> {selectedCandidate.matchScore}%</p>
                    <p><strong>Recommendation:</strong> {selectedCandidate.aiRecommendation}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Skills</h3>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {selectedCandidate.skills?.map((skill, index) => (
                      <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {skill}
                      </span>
                    ))}
                  </div>

                  <h3 className="text-lg font-semibold mb-3">Experience</h3>
                  <p className="text-sm text-gray-700 mb-6">{selectedCandidate.experience}</p>

                  <h3 className="text-lg font-semibold mb-3">Education</h3>
                  <p className="text-sm text-gray-700">{selectedCandidate.education}</p>
                </div>
              </div>

              <div className="flex space-x-4 mt-6 pt-6 border-t">
                <button
                  onClick={() => {
                    shortlistCandidate(selectedCandidate._id);
                    setSelectedCandidate(null);
                  }}
                  className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
                >
                  Shortlist Candidate
                </button>
                <button
                  onClick={() => {
                    updateCandidateStatus(selectedCandidate._id, 'rejected');
                    setSelectedCandidate(null);
                  }}
                  className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700"
                >
                  Reject
                </button>
                <button
                  onClick={() => setSelectedCandidate(null)}
                  className="bg-gray-300 text-gray-700 px-6 py-2 rounded hover:bg-gray-400"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidateReviewPage;