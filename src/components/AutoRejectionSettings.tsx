import EmployerFeatureGuide from './EmployerFeatureGuide';
import React, { useState, useEffect, useRef } from 'react';
import { Settings, Save, BarChart3, Users, Brain, X, Eye, Briefcase, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { API_ENDPOINTS } from '../config/constants';
import { apiFetch } from '../api/apiFetch';

interface AutoRejectionSettingsProps {
  jobId?: string;
  onSave?: (settings: any) => void;
}

const AutoRejectionSettings: React.FC<AutoRejectionSettingsProps> = ({ jobId, onSave }) => {
  const getSettingsCacheKey = (email: string) => `aiRejectionSettings:${email.trim().toLowerCase()}:${jobId || 'company'}`;
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
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const dirtyRef = useRef(false);

  useEffect(() => {
    dirtyRef.current = false;
    setIsDirty(false);
    loadSettings();
    const refresh = () => { if (document.visibilityState === 'visible' && !dirtyRef.current) loadSettings(); };
    const timer = window.setInterval(refresh, 30000);
    window.addEventListener('focus', refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', refresh);
    };
  }, [jobId]);

  // Keep the preview responsive while thresholds and rule toggles are edited.
  // Saving is still required before these rules affect applications.
  useEffect(() => {
    if (!candidateDetails.length) return;
    const evaluated = candidateDetails.map((candidate: any) => {
      const skillFailure = settings.rejectReasons.skillsMismatch && candidate.hasSkillData && candidate.skillsMatch < settings.minSkillsMatch;
      const experienceFailure = settings.rejectReasons.insufficientExperience && candidate.hasExperienceData && candidate.experienceMatch < settings.minExperienceMatch;
      const overallFailure = candidate.hasSkillData && candidate.hasExperienceData && candidate.overallScore < settings.minOverallScore;
      const educationFailure = settings.rejectReasons.educationGap && candidate.hasEducationData && candidate.educationMatch === 0;
      const locationFailure = settings.rejectReasons.locationMismatch && candidate.hasLocationData && candidate.locationMatch === 0;
      const wouldBeRejected = Boolean(skillFailure || experienceFailure || overallFailure || educationFailure || locationFailure);
      const reason = skillFailure ? 'skillsMismatch'
        : experienceFailure ? 'insufficientExperience'
          : overallFailure ? 'overallScore'
            : educationFailure ? 'educationGap'
              : locationFailure ? 'locationMismatch' : null;
      return {
        ...candidate,
        wouldBeRejected,
        status: settings.autoReject && wouldBeRejected ? 'auto-rejected' : candidate.originalStatus || 'pending',
        reason
      };
    });
    setCandidateDetails(evaluated);
    setAnalytics(previous => ({
      ...previous,
      autoRejected: evaluated.filter((candidate: any) => candidate.wouldBeRejected).length,
      rejectionReasons: {
        ...previous.rejectionReasons,
        skillsMismatch: evaluated.filter((candidate: any) => candidate.reason === 'skillsMismatch').length,
        insufficientExperience: evaluated.filter((candidate: any) => candidate.reason === 'insufficientExperience').length,
        educationGap: evaluated.filter((candidate: any) => candidate.reason === 'educationGap').length,
        locationMismatch: evaluated.filter((candidate: any) => candidate.reason === 'locationMismatch').length
      }
    }));
  }, [settings]);

  const loadSettings = async () => {
    if (dirtyRef.current) return;
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const employerEmail = user.email;
      if (!employerEmail) return;

      const url = `${API_ENDPOINTS.BASE_URL}/ai-rejection-settings${jobId ? `/${jobId}` : ''}?employerEmail=${encodeURIComponent(employerEmail)}`;
      const response = await apiFetch(url);
      if (response.ok) {
        const payload = await response.json();
        const savedSettings = payload.settings || payload;
        if (dirtyRef.current) return;
        const mergedSettings = {
          ...settings,
          ...savedSettings,
          rejectReasons: { ...settings.rejectReasons, ...(savedSettings.rejectReasons || {}) }
        };
        setSettings(mergedSettings);
        localStorage.setItem(getSettingsCacheKey(employerEmail), JSON.stringify(mergedSettings));
        await loadCandidateData(mergedSettings);
      } else {
        if (dirtyRef.current) return;
        const cached = localStorage.getItem(getSettingsCacheKey(employerEmail));
        const restoredSettings = cached ? { ...settings, ...JSON.parse(cached) } : settings;
        setSettings(restoredSettings);
        await loadCandidateData(restoredSettings);
      }
    } catch {
      if (dirtyRef.current) return;
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const cached = user.email ? localStorage.getItem(getSettingsCacheKey(user.email)) : null;
        const restoredSettings = cached
          ? { ...settings, ...JSON.parse(cached), rejectReasons: { ...settings.rejectReasons, ...(JSON.parse(cached).rejectReasons || {}) } }
          : settings;
        setSettings(restoredSettings);
        await loadCandidateData(restoredSettings);
      } catch {
        await loadCandidateData(settings);
      }
    }
  };

  const loadCandidateData = async (overrideSettings?: typeof settings) => {
    try {
      const response = await apiFetch(API_ENDPOINTS.APPLICATIONS);
      if (!response.ok) throw new Error(`Could not load applications (${response.status})`);

      const allApplications = await response.json();
      const applications = Array.isArray(allApplications) ? allApplications : allApplications.applications || [];
      const employerApplications = jobId
        ? applications.filter((app: any) => String(app.jobId?._id || app.jobId?.id || app.jobId) === String(jobId))
        : applications;

      // Fetch job details only (not candidate profile — use application data directly)
      const appsWithData = await Promise.all(
        employerApplications.map(async (app: any) => {
          const jobId = app.jobId?._id || app.jobId?.id || (typeof app.jobId === 'string' ? app.jobId : null);
          let jobData: any = app.jobId && typeof app.jobId === 'object' ? app.jobId : {};

          // Fetch full job if skills/experienceRange are missing
          if (jobId && (!Array.isArray(jobData.skills) || !jobData.experienceRange)) {
            try {
              const jobRes = await apiFetch(`${API_ENDPOINTS.JOBS}/${jobId}`);
              if (jobRes.ok) jobData = await jobRes.json();
            } catch { /* ignore */ }
          }

          return { ...app, _jobData: jobData };
        })
      );

      const processedCandidates = appsWithData.map((app: any) => {
        const skillsMatch = calculateSkillsMatch(app);
        const experienceMatch = calculateExperienceMatch(app);
        const aiOverall = app.aiAnalysis?.overallScore;
        const overallScore = typeof aiOverall === 'number' && aiOverall > 0
          ? Math.min(100, Math.max(0, Math.round(aiOverall)))
          : Math.round(skillsMatch * 0.6 + experienceMatch * 0.4);
        const requiredSkills = app._jobData?.skills || app._jobData?.requiredSkills || [];
        const candidateSkills = app.skills || app.resumeSkills || app.candidateProfile?.skills || [];
        const hasSkillData = toList(requiredSkills).length > 0 && toList(candidateSkills).length > 0;
        const rawExperience = app.yearsExperience ?? app.experience ?? app.candidateExperience ?? app.candidateProfile?.yearsExperience;
        const hasExperienceData = rawExperience !== undefined && rawExperience !== null && String(rawExperience).trim() !== '';
        const candidateEducation = app.education || app.candidateProfile?.education || app.resumeParsed?.education || '';
        const requiredEducation = app._jobData?.education || app._jobData?.educationLevel || app._jobData?.minimumEducation || '';
        const hasEducationData = Boolean(String(candidateEducation).trim() && String(requiredEducation).trim());
        const candidateLocation = app.location || app.candidateProfile?.location || '';
        const requiredLocation = app._jobData?.location || app._jobData?.jobLocation || '';
        const isRemoteJob = /remote|anywhere/i.test(`${app._jobData?.locationType || ''} ${app._jobData?.workSetting || ''} ${requiredLocation}`);
        const hasLocationData = Boolean(String(candidateLocation).trim() && String(requiredLocation).trim()) && !isRemoteJob;
        const educationMatch = hasEducationData
          ? (String(candidateEducation).toLowerCase().includes(String(requiredEducation).toLowerCase()) ? 100 : 0)
          : null;
        const locationMatch = hasLocationData
          ? (String(candidateLocation).toLowerCase().includes(String(requiredLocation).toLowerCase()) || String(requiredLocation).toLowerCase().includes(String(candidateLocation).toLowerCase()) ? 100 : 0)
          : null;

        // Read latest settings from DB response (passed in) or current state
        const currentSettings = overrideSettings || settings;
        const meetsRejectionRules = (
          (currentSettings.rejectReasons.skillsMismatch && hasSkillData && skillsMatch < currentSettings.minSkillsMatch) ||
          (currentSettings.rejectReasons.insufficientExperience && hasExperienceData && experienceMatch < currentSettings.minExperienceMatch) ||
          (hasSkillData && hasExperienceData && overallScore < currentSettings.minOverallScore) ||
          (currentSettings.rejectReasons.educationGap && hasEducationData && educationMatch === 0) ||
          (currentSettings.rejectReasons.locationMismatch && hasLocationData && locationMatch === 0)
        );
        const shouldReject = currentSettings.autoReject && meetsRejectionRules;

        let rejectionReason = null;
        if (meetsRejectionRules) {
          if (skillsMatch < currentSettings.minSkillsMatch) rejectionReason = 'skillsMismatch';
          else if (experienceMatch < currentSettings.minExperienceMatch) rejectionReason = 'insufficientExperience';
        }

        return {
          id: app._id,
          name: app.candidateName || 'Unknown Candidate',
          email: app.candidateEmail,
          status: shouldReject ? 'auto-rejected' : app.status || 'pending',
          originalStatus: app.status || 'pending',
          wouldBeRejected: meetsRejectionRules,
          hasSkillData,
          hasExperienceData,
          hasEducationData,
          hasLocationData,
          educationMatch,
          locationMatch,
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
      const wouldReject = processedCandidates.filter((c: any) => c.wouldBeRejected).length;
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
  
  const calculateSkillsMatch = (application: any): number => {
    // Use backend-computed aiAnalysis only when it has a real non-zero, in-range score
    const aiSkills = application.aiAnalysis?.skillsScore;
    if (typeof aiSkills === 'number' && aiSkills >= 0) {
      return Math.min(100, Math.max(0, Math.round(aiSkills)));
    }

    const jobData = application._jobData || {};
    const candidateSkills = toList(application.skills).length ? toList(application.skills)
      : toList(application.resumeSkills).length ? toList(application.resumeSkills)
        : toList(application.candidateSkills).length ? toList(application.candidateSkills)
          : toList(application.candidateProfile?.skills);
    const normalizedCandidateSkills = candidateSkills.map((s: any) => String(s).toLowerCase().trim()).filter(Boolean);

    const rawJobSkills = jobData.skills || jobData.requiredSkills || [];
    const requiredSkills = toList(rawJobSkills).map((s: any) => String(s).toLowerCase().trim()).filter(Boolean);

    if (requiredSkills.length === 0) return normalizedCandidateSkills.length >= 10 ? 90 : Math.round((normalizedCandidateSkills.length / 10) * 90);
    if (normalizedCandidateSkills.length === 0) return 0;

    const matched = requiredSkills.filter(req =>
      normalizedCandidateSkills.some((cs: string) => cs.includes(req) || req.includes(cs))
    ).length;
    return Math.round((matched / requiredSkills.length) * 100);
  };

  const calculateExperienceMatch = (application: any): number => {
    // Use backend-computed aiAnalysis only when it has a real non-zero, in-range score
    const aiExp = application.aiAnalysis?.experienceScore;
    if (typeof aiExp === 'number' && aiExp >= 0) {
      return Math.min(100, Math.max(0, Math.round(aiExp)));
    }

    const jobData = application._jobData || {};
    const rawExp = application.yearsExperience ?? application.experience ?? application.candidateExperience ??
      application.candidateProfile?.yearsExperience ?? '';
    const candidateYears = typeof rawExp === 'number' ? rawExp : parseFloat(String(rawExp).match(/(\d+\.?\d*)/)?.[1] || '0');

    const expRange: string = jobData.experienceRange || jobData.experience || '';
    if (!expRange) return candidateYears >= 3 ? 100 : candidateYears >= 1 ? 60 : 20;

    const rangeMatch = expRange.match(/(\d+)\s*[-–]\s*(\d+)/);
    const plusMatch = expRange.match(/(\d+)\+/);
    const singleMatch = expRange.match(/(\d+)/);
    let minExp = 0;
    if (rangeMatch) minExp = parseInt(rangeMatch[1]);
    else if (plusMatch) minExp = parseInt(plusMatch[1]);
    else if (singleMatch) minExp = parseInt(singleMatch[1]);

    if (minExp === 0) return candidateYears >= 1 ? 80 : 40;
    if (candidateYears >= minExp) return Math.min(100, 80 + Math.round(((candidateYears - minExp) / Math.max(minExp, 1)) * 20));
    return Math.max(0, Math.round((candidateYears / minExp) * 70));
  };

  const toList = (value: any): string[] => {
    if (Array.isArray(value)) return value.map(item => String(item).trim()).filter(Boolean);
    if (typeof value === 'string') return value.split(',').map(item => item.trim()).filter(Boolean);
    if (value && typeof value === 'object') return Object.values(value).map(item => String(item).trim()).filter(Boolean);
    return [];
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
        candidates = candidateDetails.filter((c: any) => c.wouldBeRejected);
        title = settings.autoReject ? 'Auto-Rejected Candidates' : 'Candidates Below Threshold';
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
    dirtyRef.current = true;
    setIsDirty(true);
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleReasonChange = (reason: string, enabled: boolean) => {
    dirtyRef.current = true;
    setIsDirty(true);
    setSettings(prev => ({
      ...prev,
      rejectReasons: {
        ...prev.rejectReasons,
        [reason]: enabled
      }
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const employerEmail = user.email;
      if (!employerEmail) { window.dispatchEvent(new CustomEvent("zync:alert", { detail: { message: "Please login first." } })); setIsSaving(false); return; }

      const url = `${API_ENDPOINTS.BASE_URL}/ai-rejection-settings${jobId ? `/${jobId}` : ''}`;
      const response = await apiFetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...settings, employerEmail })
      });

      if (response.ok) {
        const result = await response.json().catch(() => ({}));
        const savedSettings = result.settings || settings;
        const mergedSettings = {
          ...settings,
          ...savedSettings,
          rejectReasons: { ...settings.rejectReasons, ...(savedSettings.rejectReasons || {}) }
        };
        setSettings(mergedSettings);
        dirtyRef.current = false;
        setIsDirty(false);
        localStorage.setItem(getSettingsCacheKey(employerEmail), JSON.stringify(mergedSettings));
        window.dispatchEvent(new CustomEvent("zync:alert", { detail: { message: 'AI auto-rejection settings saved. New and existing applications will be evaluated.' } }));
        await loadCandidateData(mergedSettings);
      } else {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || 'Could not save AI rejection settings');
      }
    } catch (error) {
      window.dispatchEvent(new CustomEvent("zync:alert", { detail: { message: (error as Error).message || 'Could not save AI rejection settings', type: 'error' } }));
      setIsSaving(false);
      return;
    }
    setIsSaving(false);
    if (onSave) onSave(settings);
  };

  return (
    <div className="feature-sidebar-layout"><div className="feature-sidebar-main">
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
            {isDirty ? 'Unsaved changes — preview updates live' : settings.autoReject ? 'Automation enabled — saved rules apply to pending and new applications' : 'Preview only — no applications changed'}
          </span>
        </div>
        <p className="text-xs text-gray-500 mb-3">
          Shows screening results for all company applications. Click a card to see the candidates.
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
            <span className="text-gray-500">{settings.autoReject ? 'Auto-Rejected' : 'Would Be Rejected'}</span>
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
          disabled={isSaving}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center"
          title="Save auto-rejection settings"
        >
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Saving…' : 'Save Settings'}
        </button>
      </div>

      {/* Candidate List Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{modalData.type}</h3>
                <p className="text-xs text-orange-600 mt-1">{settings.autoReject ? 'Candidates below the saved thresholds are automatically rejected.' : 'Preview only — candidates are not changed until automation is enabled and saved.'}</p>
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
                            <p className="flex items-center gap-1 text-xs text-blue-700 font-semibold truncate">
                              <Briefcase className="h-3 w-3 shrink-0" aria-hidden="true" />
                              <span className="truncate">{candidate.jobTitle || 'Unknown Position'}</span>
                            </p>
                            <p className="text-xs text-gray-500 truncate">{candidate.email}</p>
                            <p className="text-xs text-gray-400">Applied: {new Date(candidate.appliedAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-3 sm:gap-4">
                          <div>
                            <div className="text-xs text-gray-500">Skills Match</div>
                            <div className={`font-semibold text-sm ${!candidate.hasSkillData ? 'text-gray-500' : candidate.skillsMatch >= settings.minSkillsMatch ? 'text-green-600' : 'text-red-600'}`}>{candidate.hasSkillData ? `${candidate.skillsMatch}%` : 'N/A'}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">Experience</div>
                            <div className={`font-semibold text-sm ${!candidate.hasExperienceData ? 'text-gray-500' : candidate.experienceMatch >= settings.minExperienceMatch ? 'text-green-600' : 'text-red-600'}`}>{candidate.hasExperienceData ? `${candidate.experienceMatch}%` : 'N/A'}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">Preview Status</div>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                              candidate.wouldBeRejected
                                ? 'bg-orange-100 text-orange-800'
                                : !candidate.hasSkillData || !candidate.hasExperienceData
                                  ? 'bg-gray-100 text-gray-700'
                                  : 'bg-green-100 text-green-800'
                            }`}>
                              {candidate.wouldBeRejected ? (
                                <><AlertTriangle className="h-3 w-3" aria-hidden="true" />{settings.autoReject ? 'Flagged for rejection' : 'Would be flagged'}</>
                              ) : !candidate.hasSkillData || !candidate.hasExperienceData ? (
                                <><Info className="h-3 w-3" aria-hidden="true" />Not evaluated — missing data</>
                              ) : (
                                <><CheckCircle className="h-3 w-3" aria-hidden="true" />Meets criteria</>
                              )}
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
    </div><EmployerFeatureGuide feature="rejection" /></div>
  );
};

export default AutoRejectionSettings;
