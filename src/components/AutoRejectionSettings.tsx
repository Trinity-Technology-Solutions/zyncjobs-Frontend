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
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const employerEmail = user.email;
      if (!employerEmail) return;

      const url = `${API_ENDPOINTS.BASE_URL}/ai-rejection-settings${jobId ? `/${jobId}` : ''}?employerEmail=${encodeURIComponent(employerEmail)}`;
      const response = await fetch(url);
      if (response.ok) {
        const savedSettings = await response.json();
        setSettings(prev => ({ ...prev, ...savedSettings }));
      } else {
        const saved = localStorage.getItem(`aiRejectionSettings${jobId ? `_${jobId}` : ''}`);
        if (saved) setSettings(JSON.parse(saved));
      }
    } catch {
      const saved = localStorage.getItem(`aiRejectionSettings${jobId ? `_${jobId}` : ''}`);
      if (saved) setSettings(JSON.parse(saved));
    }
    await loadCandidateData();
  };

  const loadCandidateData = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userEmail = user.email;
      if (!userEmail) return;

      const response = await fetch(`${API_ENDPOINTS.APPLICATIONS}?employerEmail=${encodeURIComponent(userEmail)}`);
      if (!response.ok) return;

      const allApplications = await response.json();
      const applications = Array.isArray(allApplications) ? allApplications : allApplications.applications || [];

      const employerApplications = applications;

      // Fetch job details only (not candidate profile — use application data directly)
      const appsWithData = await Promise.all(
        employerApplications.map(async (app: any) => {
          const jobId = app.jobId?._id || app.jobId?.id || (typeof app.jobId === 'string' ? app.jobId : null);
          let jobData: any = app.jobId && typeof app.jobId === 'object' ? app.jobId : {};

          // Fetch full job if skills/experienceRange are missing
          if (jobId && (!Array.isArray(jobData.skills) || !jobData.experienceRange)) {
            try {
              const jobRes = await fetch(`${API_ENDPOINTS.JOBS}/${jobId}`);
              if (jobRes.ok) jobData = await jobRes.json();
            } catch { /* ignore */ }
          }

          return { ...app, _jobData: jobData };
        })
      );

      const processedCandidates = appsWithData.map((app: any) => {
        const skillsMatch = calculateSkillsMatch(app);
        const experienceMatch = calculateExperienceMatch(app);
        const overallScore = Math.round((skillsMatch + experienceMatch) / 2);

        const shouldReject = settings.autoReject && (
          skillsMatch < settings.minSkillsMatch ||
          experienceMatch < settings.minExperienceMatch ||
          overallScore < settings.minOverallScore
        );

        let rejectionReason = null;
        if (shouldReject) {
          if (skillsMatch < settings.minSkillsMatch) rejectionReason = 'skillsMismatch';
          else if (experienceMatch < settings.minExperienceMatch) rejectionReason = 'insufficientExperience';
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
          jobTitle: app._jobData?.jobTitle || app._jobData?.title || app.jobTitle || 'Unknown Position'
        };
      });

      setCandidateDetails(processedCandidates);

      const totalApps = processedCandidates.length;
      const wouldReject = processedCandidates.filter((c: any) => c.status === 'auto-rejected').length;
      const skillsIssues = processedCandidates.filter((c: any) => c.reason === 'skillsMismatch').length;
      const experienceIssues = processedCandidates.filter((c: any) => c.reason === 'insufficientExperience').length;

      setAnalytics({
        totalApplications: totalApps,
        autoRejected: wouldReject,
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
    const jobData = application._jobData || {};

    // Candidate skills — check all possible fields stored on the application
    const rawCandSkills =
      application.skills ||
      application.candidateSkills ||
      application.candidateProfile?.skills ||
      [];
    const candidateSkills = (Array.isArray(rawCandSkills)
      ? rawCandSkills
      : String(rawCandSkills).split(','))
      .map((s: any) => String(s).toLowerCase().trim())
      .filter(Boolean);

    // Job required skills
    const rawJobSkills = jobData.skills || jobData.requiredSkills || [];
    const requiredSkills = (Array.isArray(rawJobSkills)
      ? rawJobSkills
      : String(rawJobSkills).split(','))
      .map((s: any) => String(s).toLowerCase().trim())
      .filter(Boolean);

    if (requiredSkills.length === 0) {
      // No JD skills — score by how many skills candidate listed
      const count = candidateSkills.length;
      if (count === 0) return 0;
      if (count >= 10) return 90;
      return Math.round((count / 10) * 90);
    }

    if (candidateSkills.length === 0) return 0;

    const matched = requiredSkills.filter(req =>
      candidateSkills.some(cs => cs.includes(req) || req.includes(cs))
    ).length;

    return Math.round((matched / requiredSkills.length) * 100);
  };

  const calculateExperienceMatch = (application: any) => {
    const jobData = application._jobData || {};

    // Candidate experience — check all possible fields
    const rawExp =
      application.experience ??
      application.candidateExperience ??
      application.yearsOfExperience ??
      application.candidateProfile?.experience ??
      '';

    const parseYears = (val: any): number => {
      if (typeof val === 'number') return val;
      const str = String(val || '');
      const match = str.match(/(\d+\.?\d*)/);
      return match ? parseFloat(match[1]) : 0;
    };

    const candidateYears = parseYears(rawExp);

    const expRange: string =
      jobData.experienceRange || jobData.experience || jobData.minExperience || '';

    if (!expRange) {
      if (candidateYears === 0) return 20;
      if (candidateYears >= 3) return 100;
      return Math.round((candidateYears / 3) * 100);
    }

    const rangeMatch = expRange.match(/(\d+)\s*[-–]\s*(\d+)/);
    const plusMatch = expRange.match(/(\d+)\+/);
    const singleMatch = expRange.match(/(\d+)/);

    let minExp = 0, maxExp = 0;
    if (rangeMatch) { minExp = parseInt(rangeMatch[1]); maxExp = parseInt(rangeMatch[2]); }
    else if (plusMatch) { minExp = parseInt(plusMatch[1]); maxExp = minExp + 5; }
    else if (singleMatch) { minExp = parseInt(singleMatch[1]); maxExp = minExp; }

    if (minExp === 0 && maxExp === 0) return candidateYears >= 1 ? 80 : 40;

    if (candidateYears >= minExp) {
      return Math.min(100, 80 + Math.round(((candidateYears - minExp) / Math.max(maxExp - minExp + 1, 1)) * 20));
    }
    return Math.max(0, Math.round((candidateYears / minExp) * 70));
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
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const employerEmail = user.email;
      if (!employerEmail) { window.dispatchEvent(new CustomEvent("zync:alert", { detail: { message: "Please login first." } })); return; }

      const url = `${API_ENDPOINTS.BASE_URL}/ai-rejection-settings${jobId ? `/${jobId}` : ''}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...settings, employerEmail })
      });

      if (response.ok) {
        // Settings saved — do NOT auto-reject existing applications here.
        // AI rejection only happens when employer manually triggers "AI Auto-Shortlist"
        // in ApplicationManagementPage, then reviews and confirms each rejection.
        window.dispatchEvent(new CustomEvent("zync:alert", { detail: { message: 'AI auto-rejection settings saved. These will apply when you run AI Auto-Shortlist on applications.' } }));
      } else {
        throw new Error('API save failed');
      }
    } catch {
      localStorage.setItem(`aiRejectionSettings${jobId ? `_${jobId}` : ''}`, JSON.stringify(settings));
      window.dispatchEvent(new CustomEvent("zync:alert", { detail: { message: "Settings saved locally." } }));
    }
    await loadCandidateData();
    if (onSave) onSave(settings);
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
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <BarChart3 className="w-5 h-5 text-gray-600 mr-2" />
            <h3 className="text-sm font-medium text-gray-900">Rejection Analytics Preview</h3>
          </div>
          <span className="text-xs text-orange-600 bg-orange-50 border border-orange-200 px-2 py-1 rounded-full font-medium">
            📄 Preview only — no applications changed
          </span>
        </div>
        <p className="text-xs text-gray-500 mb-3">
          Shows how many candidates <strong>would be flagged</strong> if you run AI Auto-Shortlist with current settings. Click a card to see who.
        </p>
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
            <span className="text-gray-500">Would Be Flagged</span>
            <div className="font-semibold text-orange-600 flex items-center">
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
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{modalData.type}</h3>
                <p className="text-xs text-orange-600 mt-1">Preview only — these candidates have NOT been rejected. Run AI Auto-Shortlist in Application Management to take action.</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
                title="Close modal"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-4 sm:p-6 overflow-y-auto max-h-[60vh]">
              {modalData.candidates.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No candidates found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {modalData.candidates.map((candidate: any, idx: number) => (
                    <div key={candidate.id || idx} className="bg-gray-50 rounded-lg p-3 sm:p-4 border">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-blue-600 font-semibold">{candidate.name.charAt(0)}</span>
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-medium text-gray-900 text-sm">{candidate.name}</h4>
                            <p className="text-xs text-blue-700 font-semibold truncate">📋 {candidate.jobTitle || 'Unknown Position'}</p>
                            <p className="text-xs text-gray-500 truncate">{candidate.email}</p>
                            <p className="text-xs text-gray-400">Applied: {new Date(candidate.appliedAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-3 sm:gap-4">
                          <div>
                            <div className="text-xs text-gray-500">Skills Match</div>
                            <div className={`font-semibold text-sm ${candidate.skillsMatch >= 60 ? 'text-green-600' : 'text-red-600'}`}>{candidate.skillsMatch}%</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">Experience</div>
                            <div className={`font-semibold text-sm ${candidate.experienceMatch >= 80 ? 'text-green-600' : 'text-red-600'}`}>{candidate.experienceMatch}%</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">Preview Status</div>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${candidate.status === 'auto-rejected' ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}`}>
                              {candidate.status === 'auto-rejected' ? '⚠️ Would be flagged' : '✅ Passes threshold'}
                            </span>
                          </div>
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
