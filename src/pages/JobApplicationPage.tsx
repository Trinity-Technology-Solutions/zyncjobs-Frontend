import React, { useState, useEffect } from 'react';
import { User, FileText, Send, CheckCircle, Upload, Briefcase, MapPin, Building2, AlertCircle } from 'lucide-react';
import BackButton from '../components/BackButton';
import { API_ENDPOINTS } from '../config/env';
import { apiFetch } from '../api/apiFetch';
import { validateUserResume } from '../utils/resumeValidation';
import { S3Service } from '../services/s3Service';
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
  const [resumeSkills, setResumeSkills] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const jobData = (() => {
    try { return JSON.parse(sessionStorage.getItem('selectedJob') || localStorage.getItem('selectedJob') || '{}'); }
    catch { return {}; }
  })();

  const stripHtml = (html: string) =>
    html ? html.replace(/<[^>]*>/g, ' ').replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ').trim() : '';

  const userData = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); }
    catch { return {}; }
  })();

  useEffect(() => {
    const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
    if (!token || !userData.email) { onNavigate('login'); return; }
    
    // Load profile and validate resume
    const loadProfileAndValidateResume = async () => {
      try {
        const profileRes = await apiFetch(`${API_ENDPOINTS.BASE_URL}/profile/${encodeURIComponent(userData.email)}`);
        const profileData = profileRes.ok ? await profileRes.json() : {};
        const merged = { ...userData, ...profileData };
        setProfile(merged);

        // Pre-load profile skills into resumeSkills so existing resume users get scored
        if (Array.isArray(profileData.skills) && profileData.skills.length > 0) {
          setResumeSkills(profileData.skills);
        }
        
        // Validate resume using the utility
        const resumeValidation = await validateUserResume(userData.email);
        if (resumeValidation.hasResume) {
          setResumeUrl(resumeValidation.resumeUrl || '');
          setResumeFileName(resumeValidation.resumeFileName || '');
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        setProfile(userData);
      }
    };
    
    loadProfileAndValidateResume();
  }, []);

  const handleResumeUpload = async (file: File) => {
    try {
      const s3Result = await S3Service.uploadResumeToS3(file);
      if (!s3Result.success) throw new Error(s3Result.error || 'Upload failed');

      const fileUrl = s3Result.fileUrl || '';
      setResumeUrl(fileUrl);
      setResumeFile(file);
      setResumeFileName(file.name);

      // Parse resume via backend (handles PDF properly)
      try {
        const formData = new FormData();
        formData.append('resume', file);
        const parseRes = await apiFetch(`${API_ENDPOINTS.BASE_URL}/resume/parse-profile`, {
          method: 'POST',
          body: formData,
        });
        if (parseRes.ok) {
          const parsed = await parseRes.json();
          const skills: string[] = [
            ...(parsed.profileData?.skills || parsed.skills || []),
          ].filter(Boolean);
          if (skills.length > 0) {
            setResumeSkills(skills);
            // Save skills back to profile so future applications are scored correctly
            await apiFetch(`${API_ENDPOINTS.BASE_URL}/profile/${encodeURIComponent(userData.email)}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ skills }),
            });
          }
        }
      } catch { /* skills extraction failure is non-blocking */ }
      
      // Update localStorage with resume info so ResumeStatusIndicator picks it up
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = {
        ...storedUser,
        resume: {
          name: file.name,
          size: file.size,
          uploadDate: new Date().toLocaleDateString(),
          url: fileUrl
        },
        resumeUrl: fileUrl
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Dispatch event to notify listeners (ResumeStatusIndicator, etc.)
      window.dispatchEvent(new CustomEvent('zync:user-updated', { detail: updatedUser }));
      
      window.dispatchEvent(new CustomEvent('zync:alert', { detail: { message: 'Resume uploaded successfully! ✓', type: 'success' } }));
    } catch (err: any) {
      window.dispatchEvent(new CustomEvent('zync:alert', { detail: { message: err.message || 'Resume upload failed' } }));
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
      // Merge profile skills + resume skills (deduplicated)
      const profileSkills: string[] = Array.isArray(profile?.skills) ? profile.skills : [];
      const mergedSkills = [...new Set([...profileSkills, ...resumeSkills])];

      const res = await apiFetch(API_ENDPOINTS.APPLICATIONS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          candidateId: userData._id || userData.id,
          candidateName: profile?.name || userData.name || userData.fullName,
          candidateEmail: userData.email,
          candidatePhone: profile?.phone || userData.phone || '',
          resumeUrl,
          coverLetter: coverLetter.trim() || 'No cover letter provided',
          workAuthorization: 'Not specified',
          skills: mergedSkills,           // profile + resume skills merged
          resumeSkills,                   // resume-only skills for reference
        }),
      });
      const result = await res.json();
      if (res.ok) {
        setSubmitted(true);
        window.dispatchEvent(new CustomEvent('zync:alert', { detail: { message: '🎉 Application submitted successfully!' } }));
      } else {
        window.dispatchEvent(new CustomEvent('zync:alert', { detail: { message: result.error || 'Submission failed. Please try again.' } }));
      }
    } catch {
      window.dispatchEvent(new CustomEvent('zync:alert', { detail: { message: 'Network error. Please try again.' } }));
    } finally {
      setSubmitting(false);
    }
  };

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
            <BackButton onClick={() => onNavigate('job-detail')} className="mb-6" />

            {/* Resume Requirement Notice */}
            {!resumeUrl && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 mb-6 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-orange-800 mb-1">Resume Required</p>
                  <p className="text-sm text-orange-700">
                    You need to upload your resume before you can apply for this job. 
                    <button 
                      onClick={() => onNavigate('dashboard')} 
                      className="text-orange-600 hover:text-orange-800 font-medium underline ml-1"
                    >
                      Upload resume in your profile
                    </button>
                  </p>
                </div>
              </div>
            )}

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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
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
                    <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp" className="hidden"
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
                  <p className="text-xs text-gray-400 mt-1">PDF, DOC, DOCX, JPG, JPEG, PNG, WEBP · max 10MB</p>
                  <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp" className="hidden"
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
                disabled={submitting || !resumeUrl || submitted}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white py-4 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                {submitting ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Submitting...</>
                ) : submitted ? (
                  <><CheckCircle className="w-4 h-4" />Application Submitted</>
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

      {/* Success popup — stays on the same page */}
      {submitted && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-sm w-full text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-9 h-9 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Application Submitted!</h2>
            <p className="text-gray-500 text-sm mb-6">
              Your application for <span className="font-medium text-gray-700">{jobTitle}</span> at {company} has been submitted successfully.
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => onNavigate('my-applications')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold text-sm transition-colors"
              >
                View My Applications
              </button>
              <button
                onClick={() => setSubmitted(false)}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold text-sm transition-colors"
              >
                Stay on this page
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobApplicationPage;
