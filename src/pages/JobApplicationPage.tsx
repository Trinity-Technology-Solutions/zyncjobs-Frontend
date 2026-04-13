import React, { useState, useEffect } from 'react';
import BackButton from '../components/BackButton';
import { API_ENDPOINTS } from '../config/env';
import { tokenStorage } from '../utils/tokenStorage';
interface JobApplicationPageProps {
  onNavigate: (page: string) => void;
}

const JobApplicationPage: React.FC<JobApplicationPageProps> = ({ onNavigate }) => {
  const [profile, setProfile] = useState<any>(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [, setResumeFile] = useState<File | null>(null);
  const [resumeFileName, setResumeFileName] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const jobData = (() => {
    try { return JSON.parse(sessionStorage.getItem('selectedJob') || localStorage.getItem('selectedJob') || '{}'); }
    catch { return {}; }
  })();

  const userData = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); }
    catch { return {}; }
  })();

  useEffect(() => {
    const token = tokenStorage.getAccess();
    if (!token || !userData.email) { onNavigate('login'); return; }

    // Fetch fresh profile from backend
    fetch(`${API_ENDPOINTS.BASE_URL}/profile/${encodeURIComponent(userData.email)}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const merged = { ...userData, ...(data || {}) };
        setProfile(merged);
        // Pre-fill resume info
        const resume = merged.resume;
        const url = merged.resumeUrl || resume?.url || resume?.fileUrl || resume?.path || '';
        const name = resume?.name || resume?.filename || (url ? url.split('/').pop() : '');
        setResumeUrl(url);
        setResumeFileName(name || '');
      })
      .catch(() => setProfile(userData));
  }, []);

  const handleResumeUpload = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('resume', file);
      if (userData.id) formData.append('userId', userData.id);
      if (userData.email) formData.append('userEmail', userData.email);
      const token = tokenStorage.getAccess() || '';
      const res = await fetch(`${API_ENDPOINTS.BASE_URL}/upload/resume`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData
      });
      const result = await res.json();
      if (res.ok) {
        const url = result.fileUrl || result.url || result.path || '';
        setResumeUrl(url);
        setResumeFile(file);
        setResumeFileName(file.name);
      } else {
        window.dispatchEvent(new CustomEvent('zync:alert', { detail: { message: 'Resume upload failed: ' + result.error } }));
      }
    } catch (e) {
      window.dispatchEvent(new CustomEvent('zync:alert', { detail: { message: 'Resume upload failed' } }));
    }
  };

  const handleSubmit = async () => {
    if (!resumeUrl) {
      window.dispatchEvent(new CustomEvent('zync:alert', { detail: { message: 'Please upload your resume before submitting.' } }));
      return;
    }
    const jobId = jobData._id || jobData.id;
    if (!jobId) {
      window.dispatchEvent(new CustomEvent('zync:alert', { detail: { message: 'Job information missing. Please go back and select a job.' } }));
      return;
    }

    setSubmitting(true);
    try {
      const token = tokenStorage.getAccess() || '';
      const payload = {
        jobId,
        candidateId: userData._id || userData.id,
        candidateName: profile?.name || userData.name || userData.fullName,
        candidateEmail: userData.email,
        candidatePhone: profile?.phone || userData.phone || '',
        resumeUrl,
        coverLetter: coverLetter.trim() || 'No cover letter provided',
        workAuthorization: 'Not specified'
      };

      const res = await fetch(API_ENDPOINTS.APPLICATIONS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      const result = await res.json();

      if (res.ok) {
        setSubmitted(true);
        window.dispatchEvent(new CustomEvent('zync:alert', { detail: { message: '🎉 Application submitted successfully!' } }));
        setTimeout(() => onNavigate('my-applications'), 2000);
      } else {
        window.dispatchEvent(new CustomEvent('zync:alert', { detail: { message: result.error || 'Submission failed. Please try again.' } }));
      }
    } catch {
      window.dispatchEvent(new CustomEvent('zync:alert', { detail: { message: 'Network error. Please try again.' } }));
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl p-12 shadow-lg max-w-md mx-4">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted!</h2>
          <p className="text-gray-500">Redirecting to your applications...</p>
        </div>
      </div>
    );
  }

  const jobTitle = jobData.jobTitle || jobData.title || 'Job Position';
  const company = jobData.company || 'Company';
  const location = jobData.location || '';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <BackButton onClick={() => window.history.back()} text="Back" className="mb-6" />

        {/* Job Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Applying for</p>
          <h1 className="text-xl font-bold text-gray-900">{jobTitle}</h1>
          <p className="text-blue-600 font-medium">{company}{location ? ` · ${location}` : ''}</p>
        </div>

        {/* Profile Auto-fill Preview */}
        {profile && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6">
            <p className="text-sm font-semibold text-blue-800 mb-3 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Auto-filled from your profile
            </p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">Name</span>
                <p className="font-medium text-gray-900">{profile.name || profile.fullName || '—'}</p>
              </div>
              <div>
                <span className="text-gray-500">Email</span>
                <p className="font-medium text-gray-900">{userData.email}</p>
              </div>
              <div>
                <span className="text-gray-500">Phone</span>
                <p className="font-medium text-gray-900">{profile.phone || <span className="text-orange-500">Not set</span>}</p>
              </div>
              <div>
                <span className="text-gray-500">Location</span>
                <p className="font-medium text-gray-900">{profile.location || '—'}</p>
              </div>
            </div>
            {(!profile.phone || !profile.location) && (
              <button onClick={() => onNavigate('dashboard')} className="mt-3 text-xs text-blue-600 hover:underline">
                Complete your profile →
              </button>
            )}
          </div>
        )}

        {/* Resume */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">Resume <span className="text-red-500">*</span></h2>
          {resumeUrl ? (
            <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-green-800 text-sm">{resumeFileName || 'Resume'}</p>
                  <p className="text-xs text-green-600">Ready to submit</p>
                </div>
              </div>
              <label className="text-xs text-blue-600 hover:underline cursor-pointer">
                Change
                <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleResumeUpload(f); }} />
              </label>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-8 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
              <svg className="w-10 h-10 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="font-medium text-gray-700">Upload Resume</p>
              <p className="text-xs text-gray-400 mt-1">PDF, DOC, DOCX up to 10MB</p>
              <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleResumeUpload(f); }} />
            </label>
          )}
        </div>

        {/* Cover Letter */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">Cover Letter</h2>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">Optional</span>
          </div>
          <textarea
            value={coverLetter}
            onChange={e => setCoverLetter(e.target.value)}
            placeholder={`Hi ${company} team,\n\nI'm excited to apply for the ${jobTitle} role...`}
            rows={5}
            maxLength={1000}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
          <p className="text-xs text-gray-400 text-right mt-1">{coverLetter.length}/1000</p>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={submitting || !resumeUrl}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold text-lg transition-colors flex items-center justify-center gap-2"
        >
          {submitting ? (
            <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />Submitting...</>
          ) : (
            <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>Submit Application</>
          )}
        </button>
        {!resumeUrl && <p className="text-center text-xs text-red-500 mt-2">Upload your resume to enable submission</p>}
      </div>
    </div>
  );
};

export default JobApplicationPage;
