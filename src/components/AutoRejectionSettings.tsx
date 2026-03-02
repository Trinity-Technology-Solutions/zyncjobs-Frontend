import React, { useState, useEffect } from 'react';
import { Settings, Save, BarChart3, Users, Brain, X, Eye } from 'lucide-react';
import { API_ENDPOINTS } from '../config/constants';

interface AutoRejectionSettingsProps {
  jobId?: string;
  onSave?: (settings: any) => void;
}

const AutoRejectionSettings: React.FC<AutoRejectionSettingsProps> = ({ jobId, onSave }) => {
  const [settings, setSettings] = useState({
    autoReject: false,
    minSkillsMatch: 60,
    minExperienceMatch: 80,
    minOverallScore: 70,
    sendFeedback: true,
    rejectReasons: {
      skillsMismatch: true,
      insufficientExperience: true,
      educationGap: false,
      locationMismatch: false
    }
  });

  const [analytics, setAnalytics] = useState({
    totalApplications: 0,
    autoRejected: 0,
    rejectionReasons: {
      skillsMismatch: 0,
      insufficientExperience: 0,
      educationGap: 0,
      locationMismatch: 0
    }
  });

  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState<{ type: string; candidates: any[] }>({ type: '', candidates: [] });
  const [candidateDetails, setCandidateDetails] = useState<any[]>([]);

  useEffect(() => {
    loadSettings();
  }, [jobId]);

  const loadSettings = async () => {
    try {
      // Try to load from API first
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/ai-rejection-settings${jobId ? `/${jobId}` : ''}`);
      if (response.ok) {
        const savedSettings = await response.json();
        setSettings(savedSettings);
      } else {
        // Fallback to localStorage
        const savedSettings = localStorage.getItem(`aiRejectionSettings${jobId ? `_${jobId}` : ''}`);
        if (savedSettings) {
          setSettings(JSON.parse(savedSettings));
        }
      }
    } catch (error) {
      // Fallback to localStorage if API fails
      const savedSettings = localStorage.getItem(`aiRejectionSettings${jobId ? `_${jobId}` : ''}`);
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    }
    
    // Load real candidate data
    await loadCandidateData();
  };

  const loadCandidateData = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userEmail = user.email;
      
      if (!userEmail) return;
      
      // Fetch all applications for this employer
      const response = await fetch(`${API_ENDPOINTS.APPLICATIONS}`);
      if (!response.ok) return;
      
      const allApplications = await response.json();
      const applications = Array.isArray(allApplications) ? allApplications : allApplications.applications || [];
      
      // Filter applications for this employer
      const employerApplications = applications.filter((app: any) => 
        app.employerEmail === userEmail
      );
      
      // Process applications to add AI scores and rejection status
      const processedCandidates = employerApplications.map((app: any) => {
        // Calculate AI scores based on application data
        const skillsMatch = calculateSkillsMatch(app);
        const experienceMatch = calculateExperienceMatch(app);
        const overallScore = (skillsMatch + experienceMatch) / 2;
        
        // Determine if should be auto-rejected based on current settings
        const shouldReject = settings.autoReject && (
          skillsMatch < settings.minSkillsMatch ||
          experienceMatch < settings.minExperienceMatch ||
          overallScore < settings.minOverallScore
        );
        
        // Determine rejection reason
        let rejectionReason = null;
        if (shouldReject) {
          if (skillsMatch < settings.minSkillsMatch) {
            rejectionReason = 'skillsMismatch';
          } else if (experienceMatch < settings.minExperienceMatch) {
            rejectionReason = 'insufficientExperience';
          }
        }
        
        return {
          id: app._id,
          name: app.candidateName || 'Unknown Candidate',
          email: app.candidateEmail,
          status: shouldReject ? 'auto-rejected' : app.status || 'pending',
          reason: rejectionReason,
          skillsMatch,
          experienceMatch,
          overallScore,
          appliedAt: app.createdAt,
          jobTitle: app.jobTitle || 'Unknown Position'
        };
      });
      
      setCandidateDetails(processedCandidates);
      
      // Update analytics based on real data
      const totalApps = processedCandidates.length;
      const autoRejected = processedCandidates.filter((c: any) => c.status === 'auto-rejected').length;
      const skillsIssues = processedCandidates.filter((c: any) => c.reason === 'skillsMismatch').length;
      const experienceIssues = processedCandidates.filter((c: any) => c.reason === 'insufficientExperience').length;
      
      setAnalytics({
        totalApplications: totalApps,
        autoRejected: autoRejected,
        rejectionReasons: {
          skillsMismatch: skillsIssues,
          insufficientExperience: experienceIssues,
          educationGap: 0,
          locationMismatch: 0
        }
      });
      
    } catch (error) {
      console.error('Error loading candidate data:', error);
    }
  };
  
  const calculateSkillsMatch = (application: any) => {
    // Simple skills matching algorithm
    // In a real implementation, this would use NLP/AI to match skills
    const candidateSkills = application.skills || [];
    const requiredSkills = application.jobId?.skills || [];
    
    if (requiredSkills.length === 0) return 75; // Default if no required skills
    
    const matchedSkills = candidateSkills.filter((skill: string) => 
      requiredSkills.some((reqSkill: string) => 
        skill.toLowerCase().includes(reqSkill.toLowerCase()) ||
        reqSkill.toLowerCase().includes(skill.toLowerCase())
      )
    );
    
    return Math.min(100, Math.round((matchedSkills.length / requiredSkills.length) * 100));
  };
  
  const calculateExperienceMatch = (application: any) => {
    // Simple experience matching
    const candidateExp = application.experience || 0;
    const requiredExp = application.jobId?.experienceRange || '0-1 years';
    
    // Extract minimum required experience
    const minExpMatch = requiredExp.match(/(\d+)/);
    const minExp = minExpMatch ? parseInt(minExpMatch[1]) : 0;
    
    if (candidateExp >= minExp) {
      return Math.min(100, 80 + (candidateExp - minExp) * 5);
    } else {
      return Math.max(0, (candidateExp / minExp) * 80);
    }
  };

  const showCandidateList = (type: string) => {
    let candidates: any[] = [];
    let title = '';
    
    switch (type) {
      case 'total':
        candidates = candidateDetails;
        title = 'All Applications';
        break;
      case 'auto-rejected':
        candidates = candidateDetails.filter((c: any) => c.status === 'auto-rejected');
        title = 'Auto-Rejected Candidates';
        break;
      case 'skills':
        candidates = candidateDetails.filter((c: any) => c.reason === 'skillsMismatch');
        title = 'Skills Issues';
        break;
      case 'experience':
        candidates = candidateDetails.filter((c: any) => c.reason === 'insufficientExperience');
        title = 'Experience Issues';
        break;
    }
    
    setModalData({ type: title, candidates });
    setShowModal(true);
  };

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleReasonChange = (reason: string, enabled: boolean) => {
    setSettings(prev => ({
      ...prev,
      rejectReasons: {
        ...prev.rejectReasons,
        [reason]: enabled
      }
    }));
  };

  const handleSave = async () => {
    try {
      // Try to save to API first
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/ai-rejection-settings${jobId ? `/${jobId}` : ''}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      
      if (response.ok) {
        alert('Auto-rejection settings saved successfully!');
      } else {
        throw new Error('API save failed');
      }
    } catch (error) {
      // Fallback to localStorage if API fails
      localStorage.setItem(`aiRejectionSettings${jobId ? `_${jobId}` : ''}`, JSON.stringify(settings));
      alert('Auto-rejection settings saved successfully!');
    }
    
    // Reload candidate data with new settings
    await loadCandidateData();
    
    if (onSave) {
      onSave(settings);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center mb-6">
        <Brain className="w-6 h-6 text-blue-600 mr-3" />
        <h2 className="text-xl font-semibold text-gray-900">AI Auto-Rejection Settings</h2>
      </div>

      {/* Enable Auto-Rejection */}
      <div className="mb-6">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={settings.autoReject}
            onChange={(e) => handleSettingChange('autoReject', e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="ml-3 text-gray-900 font-medium">Enable AI Auto-Rejection</span>
        </label>
        <p className="text-sm text-gray-500 mt-1 ml-7">
          Automatically reject candidates who don&apos;t meet minimum requirements
        </p>
      </div>

      {settings.autoReject && (
        <>
          {/* Threshold Settings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Skills Match Threshold
              </label>
              <div className="flex items-center">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.minSkillsMatch}
                  onChange={(e) => handleSettingChange('minSkillsMatch', parseInt(e.target.value))}
                  className="flex-1 mr-3"
                  title="Set minimum skills match percentage"
                  placeholder="Skills match percentage"
                />
                <span className="text-sm font-medium text-gray-900 w-12">
                  {settings.minSkillsMatch}%
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Experience Match Threshold
              </label>
              <div className="flex items-center">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.minExperienceMatch}
                  onChange={(e) => handleSettingChange('minExperienceMatch', parseInt(e.target.value))}
                  className="flex-1 mr-3"
                  title="Set minimum experience match percentage"
                  placeholder="Experience match percentage"
                />
                <span className="text-sm font-medium text-gray-900 w-12">
                  {settings.minExperienceMatch}%
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Overall Score Threshold
              </label>
              <div className="flex items-center">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.minOverallScore}
                  onChange={(e) => handleSettingChange('minOverallScore', parseInt(e.target.value))}
                  className="flex-1 mr-3"
                  title="Set minimum overall score percentage"
                  placeholder="Overall score percentage"
                />
                <span className="text-sm font-medium text-gray-900 w-12">
                  {settings.minOverallScore}%
                </span>
              </div>
            </div>
          </div>

          {/* Rejection Reasons */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Auto-Reject For:</h3>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.rejectReasons.skillsMismatch}
                  onChange={(e) => handleReasonChange('skillsMismatch', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-3 text-gray-900">Skills Mismatch</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.rejectReasons.insufficientExperience}
                  onChange={(e) => handleReasonChange('insufficientExperience', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-3 text-gray-900">Insufficient Experience</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.rejectReasons.educationGap}
                  onChange={(e) => handleReasonChange('educationGap', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-3 text-gray-900">Education Requirements</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.rejectReasons.locationMismatch}
                  onChange={(e) => handleReasonChange('locationMismatch', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-3 text-gray-900">Location Mismatch</span>
              </label>
            </div>
          </div>

          {/* Feedback Settings */}
          <div className="mb-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.sendFeedback}
                onChange={(e) => handleSettingChange('sendFeedback', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-3 text-gray-900 font-medium">Send feedback to rejected candidates</span>
            </label>
            <p className="text-sm text-gray-500 mt-1 ml-7">
              Help candidates improve by explaining why they were rejected
            </p>
          </div>
        </>
      )}

      {/* Analytics Preview */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="flex items-center mb-3">
          <BarChart3 className="w-5 h-5 text-gray-600 mr-2" />
          <h3 className="text-sm font-medium text-gray-900">Rejection Analytics</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div 
            className="cursor-pointer hover:bg-white p-2 rounded transition-colors"
            onClick={() => showCandidateList('total')}
          >
            <span className="text-gray-500">Total Applications</span>
            <div className="font-semibold text-gray-900 flex items-center">
              {analytics.totalApplications}
              <Eye className="w-3 h-3 ml-1 text-gray-400" />
            </div>
          </div>
          <div 
            className="cursor-pointer hover:bg-white p-2 rounded transition-colors"
            onClick={() => showCandidateList('auto-rejected')}
          >
            <span className="text-gray-500">Auto-Rejected</span>
            <div className="font-semibold text-red-600 flex items-center">
              {analytics.autoRejected}
              <Eye className="w-3 h-3 ml-1 text-gray-400" />
            </div>
          </div>
          <div 
            className="cursor-pointer hover:bg-white p-2 rounded transition-colors"
            onClick={() => showCandidateList('skills')}
          >
            <span className="text-gray-500">Skills Issues</span>
            <div className="font-semibold text-orange-600 flex items-center">
              {analytics.rejectionReasons.skillsMismatch}
              <Eye className="w-3 h-3 ml-1 text-gray-400" />
            </div>
          </div>
          <div 
            className="cursor-pointer hover:bg-white p-2 rounded transition-colors"
            onClick={() => showCandidateList('experience')}
          >
            <span className="text-gray-500">Experience Issues</span>
            <div className="font-semibold text-yellow-600 flex items-center">
              {analytics.rejectionReasons.insufficientExperience}
              <Eye className="w-3 h-3 ml-1 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center"
          title="Save auto-rejection settings"
        >
          <Save className="w-4 h-4 mr-2" />
          Save Settings
        </button>
      </div>

      {/* Candidate List Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">{modalData.type}</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
                title="Close modal"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {modalData.candidates.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No candidates found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {modalData.candidates.map((candidate: any) => (
                    <div key={candidate.id} className="bg-gray-50 rounded-lg p-4 border">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 font-semibold">
                                {candidate.name.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">{candidate.name}</h4>
                              <p className="text-sm text-gray-500">{candidate.email}</p>
                              <p className="text-xs text-gray-400">
                                Applied: {new Date(candidate.appliedAt).toLocaleDateString()}
                              </p>
                              <p className="text-xs text-blue-600">{candidate.jobTitle}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <div className="text-sm text-gray-500">Skills Match</div>
                            <div className={`font-semibold ${
                              candidate.skillsMatch >= 60 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {candidate.skillsMatch}%
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-sm text-gray-500">Experience</div>
                            <div className={`font-semibold ${
                              candidate.experienceMatch >= 80 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {candidate.experienceMatch}%
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-sm text-gray-500">Status</div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              candidate.status === 'auto-rejected' 
                                ? 'bg-red-100 text-red-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {candidate.status === 'auto-rejected' ? 'Rejected' : 'Pending'}
                            </span>
                          </div>
                          
                          {candidate.reason && (
                            <div className="text-right">
                              <div className="text-sm text-gray-500">Reason</div>
                              <div className="text-xs text-red-600 font-medium">
                                {candidate.reason === 'skillsMismatch' ? 'Skills' : 'Experience'}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutoRejectionSettings;