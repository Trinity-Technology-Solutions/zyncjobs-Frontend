import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { API_ENDPOINTS } from '../config/env';
import { ArrowLeft, MapPin, Mail, Phone, Download, MessageCircle, Briefcase, GraduationCap, Star, User } from 'lucide-react';
import DirectMessage from '../components/DirectMessage';

interface CandidateProfileViewProps {
  candidateId: string;
  onNavigate: (page: string) => void;
  onBack: () => void;
}

// Safely convert any value to a displayable string — never throws
function safeStr(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  try {
    if (Array.isArray(v)) return v.map(safeStr).filter(Boolean).join('\n');
    if (typeof v === 'object') {
      const obj = v as Record<string, unknown>;
      const parts: string[] = [];
      if (obj.companyName || obj.company) parts.push(`${obj.companyName || obj.company}`);
      if (obj.roleTitle || obj.title || obj.designation) parts.push(`${obj.roleTitle || obj.title || obj.designation}`);
      if (obj.degree) parts.push(`${obj.degree}`);
      if (obj.college || obj.institution || obj.school) parts.push(`${obj.college || obj.institution || obj.school}`);
      if (obj.description) parts.push(String(obj.description));
      if (parts.length > 0) return parts.join(' · ');
      return JSON.stringify(v);
    }
  } catch { /* ignore */ }
  return String(v);
}

// Safely extract skills array — never throws
function safeSkills(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(s => typeof s === 'string' ? s : safeStr(s)).filter(Boolean);
  if (typeof raw === 'string') {
    try { return safeSkills(JSON.parse(raw)); } catch { return raw.split(',').map(s => s.trim()).filter(Boolean); }
  }
  return [];
}

const CandidateProfileView: React.FC<CandidateProfileViewProps> = ({ candidateId, onNavigate, onBack }) => {
  const [searchParams] = useSearchParams();
  const [candidate, setCandidate] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMessage, setShowMessage] = useState(false);

  const currentUser = (() => { try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; } })();
  const storedData = (() => { try { return JSON.parse(sessionStorage.getItem('viewCandidateData') || '{}'); } catch { return {}; } })();

  const effectiveCandidateId = searchParams.get('id') || candidateId || sessionStorage.getItem('viewCandidateId') || storedData.email || '';

  useEffect(() => {
    fetchProfile();
    trackEmployerView();
  }, [effectiveCandidateId]);

  // Track when employer views this profile
  const trackEmployerView = async () => {
    try {
      const currentUserData = localStorage.getItem('user');
      if (!currentUserData) return;
      const currentUser = JSON.parse(currentUserData);
      // Only track if viewer is an employer
      if (currentUser.userType !== 'employer' && currentUser.role !== 'employer') return;

      const candidateEmail = effectiveCandidateId.includes('@')
        ? effectiveCandidateId
        : storedData.email || '';
      if (!candidateEmail) return;

      // Fetch fresh employer data — try User endpoint first (has companyName)
      let recruiterName = currentUser.name || 'Recruiter';
      let recruiterTitle = currentUser.title || currentUser.jobTitle || 'HR';
      let company = currentUser.companyName || currentUser.company || '';
      let location = currentUser.location || '';
      let profilePicture = currentUser.profilePhoto || currentUser.profilePicture || '';

      // Fetch from User endpoint for real company data
      try {
        const userId = currentUser.id || currentUser._id;
        if (userId) {
          const userRes = await fetch(`${API_ENDPOINTS.BASE_URL}/users/${userId}`);
          if (userRes.ok) {
            const userData = await userRes.json();
            company = userData.companyName || userData.company || company;
            location = userData.location || location;
            recruiterTitle = userData.title || recruiterTitle;
            profilePicture = userData.profilePicture || profilePicture;
          }
        }
      } catch { /* use localStorage values */ }

      // Also try Profile endpoint for additional data
      try {
        const empRes = await fetch(`${API_ENDPOINTS.BASE_URL}/profile/${encodeURIComponent(currentUser.email)}`);
        if (empRes.ok) {
          const empData = await empRes.json();
          company = empData.companyName || empData.company || company;
          location = empData.location || location;
          recruiterTitle = empData.title || empData.roleTitle || recruiterTitle;
          profilePicture = empData.profilePhoto || empData.profilePicture || profilePicture;
        }
      } catch { /* use values from above */ }

      // Last resort: derive company from email domain
      if (!company && currentUser.email) {
        const domain = currentUser.email.split('@')[1];
        if (domain && !['gmail.com','yahoo.com','outlook.com','hotmail.com'].includes(domain)) {
          company = domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);
        }
      }

      const trackPayload = {
        email: candidateEmail,
        action: 'profile_viewed',
        recruiterId: currentUser.id || currentUser._id,
        recruiterEmail: currentUser.email,
        recruiterName,
        recruiterTitle,
        company,
        location,
        profilePicture,
      };

      // Track profile_view
      await fetch(`${API_ENDPOINTS.BASE_URL}/analytics/track/profile-view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: candidateEmail, viewedBy: currentUser.email }),
      });

      // Track recruiter_action (profile_viewed)
      await fetch(`${API_ENDPOINTS.BASE_URL}/analytics/track/recruiter-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trackPayload),
      });

      // Dispatch event so Header refreshes metrics
      window.dispatchEvent(new CustomEvent('analyticsRefresh'));
    } catch { /* silent */ }
  };

  const fetchProfile = async () => {
    setLoading(true);

    // If no identifier at all, use stored data
    if (!effectiveCandidateId || effectiveCandidateId === 'undefined' || effectiveCandidateId === 'null') {
      setCandidate(storedData.email ? buildFromStored() : null);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_ENDPOINTS.BASE_URL}/profile/${encodeURIComponent(effectiveCandidateId)}`);
      if (res.ok) {
        const raw = await res.json();
        setCandidate(buildFromApi(raw));
      } else {
        // Try users endpoint as fallback
        const res2 = await fetch(`${API_ENDPOINTS.BASE_URL}/users/${encodeURIComponent(effectiveCandidateId)}`);
        if (res2.ok) {
          const raw2 = await res2.json();
          setCandidate(buildFromApi(raw2));
        } else {
          setCandidate(buildFromStored());
        }
      }
    } catch {
      setCandidate(buildFromStored());
    } finally {
      setLoading(false);
    }
  };

  function buildFromApi(data: Record<string, any>): Record<string, any> {
    return {
      name: data.name || data.fullName || data.candidateName || storedData.name || 'Candidate',
      email: data.email || data.candidateEmail || storedData.email || effectiveCandidateId,
      phone: data.phone || data.candidatePhone || storedData.phone || '',
      location: typeof data.location === 'string' ? data.location : '',
      title: data.title || data.jobTitle || '',
      skills: safeSkills(data.skills || data.keySkills || storedData.skills),
      profilePhoto: data.profilePhoto || data.profilePicture || data.avatar || '',
      resumeUrl: data.resumeUrl || (data.resume && typeof data.resume === 'object' ? data.resume.url : data.resume) || '',
      profileSummary: safeStr(data.profileSummary || data.bio || data.summary || ''),
      education: safeStr(data.educationCollege || data.education || ''),
      employment: safeStr(data.employment || data.experience || ''),
      projects: safeStr(data.projects || ''),
      internships: safeStr(data.internships || ''),
      languages: safeStr(data.languages || ''),
      certifications: safeStr(data.certifications || ''),
      awards: safeStr(data.awards || ''),
      gender: data.gender || '',
      birthday: data.birthday || '',
    };
  }

  function buildFromStored(): Record<string, any> {
    return {
      name: storedData.name || (effectiveCandidateId.includes('@') ? effectiveCandidateId.split('@')[0] : 'Candidate'),
      email: storedData.email || (effectiveCandidateId.includes('@') ? effectiveCandidateId : ''),
      phone: storedData.phone || '',
      location: '',
      title: '',
      skills: safeSkills(storedData.skills),
      profilePhoto: '',
      resumeUrl: '',
      profileSummary: '',
      education: '',
      employment: '',
      projects: '',
      internships: '',
      languages: '',
      certifications: '',
      awards: '',
    };
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center bg-white rounded-xl p-8 shadow-sm border max-w-sm">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Profile Not Available</h3>
          <p className="text-sm text-gray-500 mb-4">This candidate hasn't set up their profile yet.</p>
          <button onClick={onBack} className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">Go Back</button>
        </div>
      </div>
    );
  }

  const initials = (candidate.name || 'C').split(' ').map((n: string) => n?.[0] || '').join('').toUpperCase().slice(0, 2) || 'C';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm font-medium">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Applications</span>
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">

        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="flex-shrink-0 flex justify-center sm:justify-start">
              {candidate.profilePhoto ? (
                <img src={candidate.profilePhoto} alt={candidate.name}
                  className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              ) : (
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                  {initials}
                </div>
              )}
            </div>

            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-bold text-gray-900">{candidate.name}</h1>
              {candidate.title && <p className="text-gray-500 text-sm mb-3">{candidate.title}</p>}

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

              <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                {candidate.email && (
                  <button onClick={() => setShowMessage(true)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
                    <MessageCircle className="w-4 h-4" />Send Message
                  </button>
                )}
                {candidate.resumeUrl && (
                  <button onClick={() => window.open(candidate.resumeUrl, '_blank')}
                    className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">
                    <Download className="w-4 h-4" />Resume
                  </button>
                )}
                {candidate.email && (
                  <a href={`mailto:${candidate.email}`}
                    className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">
                    <Mail className="w-4 h-4" />Email
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            {candidate.profileSummary && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2"><User className="w-4 h-4 text-blue-500" />Profile Summary</h2>
                <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">{candidate.profileSummary}</p>
              </div>
            )}
            {candidate.employment && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2"><Briefcase className="w-4 h-4 text-orange-500" />Employment</h2>
                <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">{candidate.employment}</p>
              </div>
            )}
            {candidate.education && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2"><GraduationCap className="w-4 h-4 text-green-500" />Education</h2>
                <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">{candidate.education}</p>
              </div>
            )}
            {candidate.projects && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2"><Star className="w-4 h-4 text-purple-500" />Projects</h2>
                <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">{candidate.projects}</p>
              </div>
            )}
            {candidate.internships && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-3">Internships</h2>
                <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">{candidate.internships}</p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {candidate.skills.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-3">Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {candidate.skills.map((skill: string, i: number) => (
                    <span key={i} className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 text-xs rounded-full font-medium">{skill}</span>
                  ))}
                </div>
              </div>
            )}
            {candidate.languages && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-3">Languages</h2>
                <p className="text-gray-700 text-sm">{candidate.languages}</p>
              </div>
            )}
            {(candidate.certifications || candidate.awards) && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-3">Accomplishments</h2>
                {candidate.certifications && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Certifications</p>
                    <p className="text-gray-700 text-sm whitespace-pre-line">{candidate.certifications}</p>
                  </div>
                )}
                {candidate.awards && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Awards</p>
                    <p className="text-gray-700 text-sm whitespace-pre-line">{candidate.awards}</p>
                  </div>
                )}
              </div>
            )}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-3">Additional Info</h2>
              <div className="space-y-2 text-sm">
                {candidate.gender && <div><span className="text-gray-500">Gender:</span> <span className="font-medium">{candidate.gender}</span></div>}
                {candidate.birthday && <div><span className="text-gray-500">Birthday:</span> <span className="font-medium">{(() => { try { return new Date(candidate.birthday).toLocaleDateString(); } catch { return candidate.birthday; } })()}</span></div>}
                {!candidate.gender && !candidate.birthday && <p className="text-gray-400 text-xs">No additional info available</p>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showMessage && candidate.email && (
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
