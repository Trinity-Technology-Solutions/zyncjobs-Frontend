import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, FileText, Send, CheckCircle, Upload, Briefcase, MapPin, Building2 } from 'lucide-react';
import { API_ENDPOINTS } from '../config/env';
import { tokenStorage } from '../utils/tokenStorage';
import Header from '../components/Header';

interface JobApplicationPageProps {
  onNavigate: (page: string) => void;
  user?: any;
  onLogout?: () => void;
}

const JobApplicationPage: React.FC<JobApplicationPageProps> = ({ onNavigate, user, onLogout }) => {
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
    fetch(`${API_ENDPOINTS.BASE_URL}/profile/${encodeURIComponent(userData.email)}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const merged = { ...userData, ...(data || {}) };
        setProfile(merged);
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
        body: formData,
      });
      const result = await res.json();
      if (res.ok) {
        setResumeUrl(result.fileUrl || result.url || result.path || '');
        setResumeFile(file);
        setResumeFileName(file.name);
      } else {
        window.dispatchEvent(new CustomEvent('zync:alert', { detail: { message: 'Resume upload failed: ' + result.error } }));
      }
    } catch {
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
      const res = await fetch(API_ENDPOINTS.APPLICATIONS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          jobId,
          candidateId: userData._id || userData.id,
          candidateName: profile?.name || userData.name || userData.fullName,
          candidateEmail: userData.email,
          candidatePhone: profile?.phone || userData.phone || '',
          resumeUrl,
          coverLetter: coverLetter.trim() || 'No cover letter provided',
          workAuthorization: 'Not specified',
        }),
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
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-2xl p-10 shadow-lg max-w-sm w-full">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-9 h-9 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Application Submitted!</h2>
          <p className="text-gray-500 text-sm">Redirecting to your applications...</p>
        </div>
      </div>
    );
  }

  const jobTitle = jobData.jobTitle || jobData.title || 'Job Position';
  const company  = jobData.company || 'Company';
  const location = jobData.location || '';
  const jobType  = jobData.jobType || jobData.employmentType || jobData.type || '';

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />

      {/* White card with space on sides — same as MyJobsPage */}
      <div className="flex-1 mx-4 my-4 bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-8 py-6">

            {/* Back button — same style as reference */}
            <button
              onClick={() => window.history.back()}
              className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-medium text-sm mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            {/* Job info header card */}
            <div
              className="rounded-2xl px-7 py-6 mb-5"
              style={{ background: 'linear-gradient(135deg, #3b5bdb 0%, #4c6ef5 60%, #7048e8 100%)' }}
            >
              <p className="text-blue-200 text-xs font-bold uppercase tracking-widest mb-1">Applying for</p>
              <h1 className="text-2xl font-bold text-white mb-2">{jobTitle}</h1>
              <div className="flex flex-wrap items-center gap-5 text-blue-100 text-sm">
                <span className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5 opacity-80" />{company}</span>
                {location && <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 opacity-80" />{location}</span>}
                {jobType  && <span className="flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5 opacity-80" />{jobType}</span>}
              </div>
            </div>

            {/* Profile auto-fill */}
            {profile && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl px-6 py-5 mb-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-semibold text-blue-600 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Auto-filled from your profile
                  </p>
                  {(!profile.phone || !profile.location) && (
                    <button onClick={() => onNavigate('dashboard')} className="text-xs text-blue-500 hover:underline">
                      Complete profile →
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-x-12 gap-y-4">
                  {[
                    { label: 'Name',     value: profile.name || profile.fullName || '—' },
                    { label: 'Email',    value: userData.email },
                    { label: 'Phone',    value: profile.phone || '' },
                    { label: 'Location', value: profile.location || '—' },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                      <p className={`text-sm font-semibold ${!value ? 'text-orange-500' : 'text-gray-900'}`}>
                        {value || 'Not set'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Resume */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-3">
                <label className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-500" />
                  Resume <span className="text-red-500">*</span>
                </label>
                {resumeUrl && (
                  <label className="text-sm text-blue-600 hover:text-blue-700 cursor-pointer font-medium">
                    Change
                    <input type="file" accept=".pdf,.doc,.docx" className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleResumeUpload(f); }} />
                  </label>
                )}
              </div>
              {resumeUrl ? (
                <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-5 py-4">
                  <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-green-800 truncate">{resumeFileName || 'Resume'}</p>
                    <p className="text-xs text-green-600">Ready to submit</p>
                  </div>
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl py-10 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                  <Upload className="w-9 h-9 text-gray-400 mb-2" />
                  <p className="text-sm font-medium text-gray-700">Click to upload resume</p>
                  <p className="text-xs text-gray-400 mt-1">PDF, DOC, DOCX · max 10MB</p>
                  <input type="file" accept=".pdf,.doc,.docx" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleResumeUpload(f); }} />
                </label>
              )}
            </div>

            {/* Cover Letter */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-3">
                <label className="text-base font-semibold text-gray-900">Cover Letter</label>
                <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">Optional</span>
              </div>
              <textarea
                value={coverLetter}
                onChange={e => setCoverLetter(e.target.value)}
                placeholder={`Hi ${company} team,\n\nI'm excited to apply for the ${jobTitle} role...`}
                rows={6}
                maxLength={1000}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white placeholder-gray-400 leading-relaxed"
              />
              <p className="text-xs text-gray-400 text-right mt-1">{coverLetter.length}/1000</p>
            </div>

            {/* Submit */}
            <div className="pb-4">
              <button
                onClick={handleSubmit}
                disabled={submitting || !resumeUrl}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white py-4 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                {submitting ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Submitting...</>
                ) : (
                  <><Send className="w-4 h-4" />Submit Application</>
                )}
              </button>
              {!resumeUrl && (
                <p className="text-center text-xs text-red-500 mt-2">Upload your resume to enable submission</p>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default JobApplicationPage;
