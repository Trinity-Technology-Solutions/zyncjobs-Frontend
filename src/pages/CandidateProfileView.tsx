import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { API_ENDPOINTS } from '../config/env';
import { ArrowLeft, MapPin, Mail, Phone, Download, ExternalLink, Github, Globe, MessageCircle, Briefcase, GraduationCap, Star, User } from 'lucide-react';
import DirectMessage from '../components/DirectMessage';

interface CandidateProfileViewProps {
  candidateId: string;
  onNavigate: (page: string) => void;
  onBack: () => void;
}

// Safely convert any value to a displayable string
const safeStr = (v: any): string => {
  if (!v) return '';
  if (typeof v === 'string') {
    // Try to parse JSON string
    try {
      const parsed = JSON.parse(v);
      return safeStr(parsed);
    } catch {}
    return v;
  }
  if (Array.isArray(v)) {
    return v.map(item => safeStr(item)).filter(Boolean).join('\n');
  }
  if (typeof v === 'object') {
    // Object with numeric keys = char array (stringify back to string)
    const keys = Object.keys(v);
    const numericKeys = keys.filter(k => !isNaN(Number(k)));
    const namedKeys = keys.filter(k => isNaN(Number(k)));

    if (numericKeys.length > namedKeys.length) {
      // Reconstruct string from char indices
      const str = numericKeys.sort((a, b) => Number(a) - Number(b)).map(k => v[k]).join('');
      // Try to parse the reconstructed string
      try {
        const parsed = JSON.parse(str);
        return safeStr(parsed);
      } catch {}
      return str;
    }

    // Named object — format as readable text
    const parts: string[] = [];
    if (v.companyName || v.company) parts.push(`🏢 ${v.companyName || v.company}`);
    if (v.roleTitle || v.title || v.position || v.role) parts.push(`💼 ${v.roleTitle || v.title || v.position || v.role}`);
    if (v.experienceYears || v.years) parts.push(`⏱ ${v.experienceYears || v.years} years`);
    if (v.description && v.description !== '-') parts.push(v.description);
    if (v.degree) parts.push(`🎓 ${v.degree}`);
    if (v.institution || v.school || v.college) parts.push(`🏫 ${v.institution || v.school || v.college}`);
    if (v.year || v.graduationYear) parts.push(`📅 ${v.year || v.graduationYear}`);
    if (v.name && !v.companyName) parts.push(v.name);
    return parts.join('\n') || JSON.stringify(v);
  }
  return String(v);
};

const CandidateProfileView: React.FC<CandidateProfileViewProps> = ({ candidateId, onNavigate, onBack }) => {
  const [searchParams] = useSearchParams();
  const [candidate, setCandidate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showMessage, setShowMessage] = useState(false);
  const [emailError, setEmailError] = useState('');
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  // Get candidateId from URL params first, then prop, then sessionStorage
  const effectiveCandidateId = searchParams.get('id') || candidateId || sessionStorage.getItem('viewCandidateId') || '';

  useEffect(() => {
    fetchCandidateProfile();
  }, [effectiveCandidateId]);

  const fetchCandidateProfile = async () => {
    if (!effectiveCandidateId || effectiveCandidateId === 'undefined' || effectiveCandidateId === 'null' || effectiveCandidateId === '') {
      setLoading(false);
      return;
    }
    try {
      let response = await fetch(`${API_ENDPOINTS.BASE_URL}/profile/${encodeURIComponent(effectiveCandidateId)}`);
      if (!response.ok && effectiveCandidateId?.includes('@')) {
        response = await fetch(`${API_ENDPOINTS.BASE_URL}/profile?email=${encodeURIComponent(effectiveCandidateId)}`);
      }
      if (!response.ok && !effectiveCandidateId.includes('@')) {
        response = await fetch(`${API_ENDPOINTS.BASE_URL}/users/${encodeURIComponent(effectiveCandidateId)}`);
      }
      if (!response.ok && effectiveCandidateId?.includes('@')) {
        response = await fetch(`${API_ENDPOINTS.BASE_URL}/users?email=${encodeURIComponent(effectiveCandidateId)}`);
      }

      if (response.ok) {
        const data = await response.json();
        setCandidate({
          ...data,
          name: data.name || data.fullName || data.candidateName,
          email: data.email || data.candidateEmail,
          phone: data.phone || data.candidatePhone,
          location: typeof data.location === 'string' ? data.location : '',
          skills: Array.isArray(data.skills) ? data.skills.map((s: any) => typeof s === 'string' ? s : s?.name || String(s)) : [],
          profilePhoto: data.profilePhoto || data.avatar,
          resume: data.resume || data.resumeFile || data.resumePath || null,
          profileSummary: safeStr(data.profileSummary || data.bio || data.summary),
          education: safeStr(data.education),
          employment: safeStr(data.employment || data.experience),
          projects: safeStr(data.projects),
          internships: safeStr(data.internships),
          languages: safeStr(data.languages),
          certifications: safeStr(data.certifications),
          awards: safeStr(data.awards),
        });
      } else {
        const appData = (() => { try { return JSON.parse(sessionStorage.getItem('viewCandidateData') || '{}'); } catch { return {}; } })();
        setCandidate({
          name: appData.name || (effectiveCandidateId.includes('@') ? effectiveCandidateId.split('@')[0] : effectiveCandidateId),
          email: effectiveCandidateId.includes('@') ? effectiveCandidateId : appData.email,
          phone: appData.phone,
          skills: appData.skills || [],
        });
      }
    } catch (error) {
      const appData = (() => { try { return JSON.parse(sessionStorage.getItem('viewCandidateData') || '{}'); } catch { return {}; } })();
      setCandidate({
        name: appData.name || (effectiveCandidateId.includes('@') ? effectiveCandidateId.split('@')[0] : 'Candidate'),
        email: effectiveCandidateId.includes('@') ? effectiveCandidateId : appData.email,
        phone: appData.phone,
        skills: appData.skills || [],
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading candidate profile...</p>
        </div>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-2">Candidate profile not found</p>
          <p className="text-xs text-gray-400 mb-4">ID: {effectiveCandidateId}</p>
          <button onClick={onBack} className="text-blue-600 hover:text-blue-800">Go Back</button>
        </div>
      </div>
    );
  }

  const initials = candidate.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'C';

  const handleSendEmail = async () => {
    if (!candidate.email) {
      setEmailError('No email address available');
      return;
    }
    
    try {
      // Open mailto link which works directly
      const subject = `Message from ${currentUser.name || 'an Employer'} at ZyncJobs`;
      const body = `Hi ${candidate.name},\n\nI'm interested in discussing opportunities with you.\n\nBest regards,\n${currentUser.name || 'Employer'}`;
      const mailtoLink = `mailto:${candidate.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.location.href = mailtoLink;
    } catch (error) {
      console.error('Error opening email:', error);
      setEmailError('Error opening email');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm font-medium">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Applications</span>
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">

        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0 flex justify-center sm:justify-start">
              {candidate.profilePhoto ? (
                <img src={candidate.profilePhoto} alt={candidate.name} className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-white shadow-lg" />
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-500 to-orange-400 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                  {initials}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{candidate.name || 'Candidate'}</h1>
              <p className="text-gray-500 text-sm mb-3">{candidate.title || candidate.jobTitle || 'Professional'}</p>

              <div className="flex flex-wrap justify-center sm:justify-start gap-3 text-sm text-gray-600 mb-4">
                {candidate.location && (
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-blue-500" />{candidate.location}</span>
                )}
                {candidate.email && (
                  <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-blue-500" />{candidate.email}</span>
                )}
                {candidate.phone && (
                  <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-blue-500" />{candidate.phone}</span>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                <button onClick={() => setShowMessage(true)}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!candidate.email}>
                  <MessageCircle className="w-4 h-4" />Send Message
                </button>
                {candidate.resume && (
                  <button onClick={() => {
                    const resumeUrl = typeof candidate.resume === 'string' 
                      ? candidate.resume 
                      : (candidate.resume?.url || `${API_ENDPOINTS.BASE_URL}/uploads/${candidate.resume?.filename}`);
                    if (resumeUrl) window.open(resumeUrl, '_blank');
                  }}
                    className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">
                    <Download className="w-4 h-4" />Resume
                  </button>
                )}
                <button onClick={handleSendEmail}
                  className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">
                  <Mail className="w-4 h-4" />Email
                </button>
              </div>
              {emailError && <p className="text-red-500 text-xs mt-2">{emailError}</p>}
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Left Column */}
          <div className="lg:col-span-2 space-y-4">

            {candidate.profileSummary && (
              <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2"><User className="w-4 h-4 text-blue-500" />Profile Summary</h2>
                <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">{candidate.profileSummary}</p>
              </div>
            )}

            {candidate.employment && (
              <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2"><Briefcase className="w-4 h-4 text-orange-500" />Employment</h2>
                <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">{candidate.employment}</p>
              </div>
            )}

            {candidate.education && (
              <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2"><GraduationCap className="w-4 h-4 text-green-500" />Education</h2>
                <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">{candidate.education}</p>
              </div>
            )}

            {candidate.projects && (
              <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2"><Star className="w-4 h-4 text-purple-500" />Projects</h2>
                <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">{candidate.projects}</p>
              </div>
            )}

            {candidate.internships && (
              <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-3">Internships</h2>
                <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">{candidate.internships}</p>
              </div>
            )}

            {(['certifications','awards','clubsCommittees','competitiveExams','academicAchievements'] as const)
              .some(f => candidate[f] && String(candidate[f]).trim() && candidate[f] !== 'null') && (
              <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-3">Accomplishments</h2>
                <div className="space-y-3">
                  {(['certifications','awards','clubsCommittees','competitiveExams','academicAchievements'] as const)
                    .filter(f => candidate[f] && String(candidate[f]).trim() && candidate[f] !== 'null')
                    .map(f => (
                      <div key={f}>
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{f.replace(/([A-Z])/g, ' $1').trim()}</p>
                        <p className="text-gray-700 text-sm whitespace-pre-line">{candidate[f]}</p>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-4">
            {candidate.skills && candidate.skills.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-3">Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {candidate.skills.map((skill: string, i: number) => (
                    <span key={i} className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 text-xs rounded-full font-medium">{skill}</span>
                  ))}
                </div>
              </div>
            )}

            {candidate.portfolioLinks && candidate.portfolioLinks.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-3">Links</h2>
                <div className="space-y-2">
                  {candidate.portfolioLinks.map((link: any) => (
                    <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800">
                      {link.type === 'github' ? <Github className="w-4 h-4" /> : link.type === 'linkedin' ? <ExternalLink className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                      {link.label}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {candidate.languages && (
              <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-3">Languages</h2>
                <p className="text-gray-700 text-sm whitespace-pre-line">{candidate.languages}</p>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-3">Additional Info</h2>
              <div className="space-y-2 text-sm">
                {candidate.yearsExperience && <div><span className="text-gray-500">Experience:</span> <span className="font-medium">{candidate.yearsExperience} yrs</span></div>}
                {candidate.salary && <div><span className="text-gray-500">Expected Salary:</span> <span className="font-medium">{candidate.salary}</span></div>}
                {candidate.jobType && <div><span className="text-gray-500">Job Type:</span> <span className="font-medium">{candidate.jobType}</span></div>}
                {candidate.gender && <div><span className="text-gray-500">Gender:</span> <span className="font-medium">{candidate.gender}</span></div>}
                {candidate.birthday && <div><span className="text-gray-500">Birthday:</span> <span className="font-medium">{new Date(candidate.birthday).toLocaleDateString()}</span></div>}
                {candidate.workAuthorization && <div><span className="text-gray-500">Work Auth:</span> <span className="font-medium">{candidate.workAuthorization}</span></div>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showMessage && (
        <DirectMessage
          candidateId={effectiveCandidateId}
          candidateName={candidate.name}
          candidateEmail={candidate.email}
          employerId={currentUser.id || currentUser._id || 'employer'}
          employerName={currentUser.name || 'Employer'}
          onClose={() => setShowMessage(false)}
        />
      )}
    </div>
  );
};

export default CandidateProfileView;
