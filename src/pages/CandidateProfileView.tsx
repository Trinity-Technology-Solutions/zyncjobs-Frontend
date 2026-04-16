import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { API_ENDPOINTS } from '../config/env';
import { ArrowLeft, MapPin, Mail, Phone, Download, MessageCircle, Briefcase, GraduationCap, Star, User } from 'lucide-react';
import DirectMessage from '../components/DirectMessage';
import Header from '../components/Header';
import Footer from '../components/Footer';

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

// Parse certifications into structured array
interface CertItem { name: string; completionId?: string; url?: string; issuer?: string; date?: string; }
function parseCertifications(raw: unknown): CertItem[] {
  if (!raw) return [];
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    const arr = Array.isArray(parsed) ? parsed : [parsed];
    return arr.map((c: any) => ({
      name: c.certificationName || c.name || c.title || '',
      completionId: c.completionId || c.credentialId || '',
      url: c.certificationUrl || c.url || c.link || '',
      issuer: c.issuer || c.issuingOrganization || '',
      date: c.date || c.issueDate || '',
    })).filter(c => c.name);
  } catch {
    return [];
  }
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
  const profileViewSource = sessionStorage.getItem('profileViewSource') || 'application-management';
  const backLabel = profileViewSource === 'candidate-search' ? 'Back to Candidate Search' : 'Back to Applications';

  const handleBack = () => {
    sessionStorage.removeItem('profileViewSource');
    if (profileViewSource === 'candidate-search') {
      onNavigate('candidate-search');
    } else {
      onBack();
    }
  };

  const effectiveCandidateId = searchParams.get('id') || candidateId || sessionStorage.getItem('viewCandidateId') || storedData.email || '';

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
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
      certifications: data.certifications || '',
      awards: safeStr(data.awards || ''),
      gender: data.gender || '',
      birthday: data.birthday || '',
      openToWork: data.openToWork ?? false,
      visibilityStatus: data.visibilityStatus ?? 'passively-looking',
      profileVisibility: data.profileVisibility ?? 'public',
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
      <div className="min-h-[60vh] flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-gray-50">
        <div className="text-center bg-white rounded-2xl p-8 shadow border max-w-sm">
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <User className="w-7 h-7 text-gray-400" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Profile Not Available</h3>
          <p className="text-sm text-gray-500 mb-4">This candidate hasn't set up their profile yet.</p>
          <button onClick={handleBack} className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">Go Back</button>
        </div>
      </div>
    );
  }

  const initials = (candidate.name || 'C').split(' ').map((n: string) => n?.[0] || '').join('').toUpperCase().slice(0, 2) || 'C';
  const certs = parseCertifications(candidate.certifications);

  const SectionRow = ({ icon, color, title, children }: { icon: React.ReactNode; color: string; title: string; children: React.ReactNode }) => (
    <div className="py-5 border-t border-gray-100">
      <div className={`flex items-center gap-2 mb-3 ${color}`}>
        {icon}
        <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
      </div>
      {children}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f0f2f7]">
      <Header onNavigate={onNavigate} user={currentUser} onLogout={() => {}} />
      {/* Sticky back bar */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-3">
          <button onClick={handleBack} className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors">
            <ArrowLeft className="w-4 h-4" />{backLabel}
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6 space-y-4">

        {/* ── Hero card ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Banner */}
          <div className="h-32 bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500" />

          {/* Avatar + name row */}
          <div className="px-8 pb-6">
            <div className="flex items-end justify-between -mt-12 mb-4">
              {/* Avatar */}
              <div className="relative">
                {candidate.profilePhoto ? (
                  <img src={candidate.profilePhoto} alt={candidate.name}
                    className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-3xl font-bold text-white border-4 border-white shadow-lg">
                    {initials}
                  </div>
                )}
                {candidate.openToWork && (
                  <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-green-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shadow">
                    #OpenToWork
                  </span>
                )}
              </div>
              {/* Action buttons top-right */}
              <div className="flex gap-2 mb-1">
                {candidate.email && (
                  <button onClick={() => setShowMessage(true)}
                    className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm">
                    <MessageCircle className="w-4 h-4" />Send Message
                  </button>
                )}
                {candidate.resumeUrl && (
                  <button onClick={() => window.open(candidate.resumeUrl, '_blank')}
                    className="flex items-center gap-1.5 border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium transition-colors">
                    <Download className="w-4 h-4" />Resume
                  </button>
                )}
                {candidate.email && (
                  <a href={`mailto:${candidate.email}`}
                    className="flex items-center gap-1.5 border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium transition-colors">
                    <Mail className="w-4 h-4" />Email
                  </a>
                )}
              </div>
            </div>

            {/* Name + status */}
            <h1 className="text-2xl font-bold text-gray-900 mb-1">{candidate.name}</h1>
            {candidate.title && <p className="text-gray-500 text-sm mb-2">{candidate.title}</p>}
            {candidate.visibilityStatus && (
              <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full mb-3 ${
                candidate.visibilityStatus === 'actively-looking' ? 'bg-green-100 text-green-700' :
                candidate.visibilityStatus === 'passively-looking' ? 'bg-blue-100 text-blue-700' :
                'bg-gray-100 text-gray-500'
              }`}>
                {candidate.visibilityStatus === 'actively-looking' ? '● Actively Looking' :
                 candidate.visibilityStatus === 'passively-looking' ? '● Open to Opportunities' : 'Not Looking'}
              </span>
            )}

            {/* Contact chips */}
            <div className="flex flex-wrap gap-3 text-sm text-gray-500">
              {candidate.location && (
                <span className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 rounded-lg px-3 py-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-400" />{candidate.location}
                </span>
              )}
              {candidate.email && (
                <span className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 rounded-lg px-3 py-1">
                  <Mail className="w-3.5 h-3.5 text-blue-400" />{candidate.email}
                </span>
              )}
              {candidate.phone && (
                <span className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 rounded-lg px-3 py-1">
                  <Phone className="w-3.5 h-3.5 text-blue-400" />{candidate.phone}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Section cards ── */}
        {candidate.profileSummary && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-8 py-6">
            <div className="flex items-center gap-2 mb-3 text-blue-500">
              <User className="w-4 h-4" />
              <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Profile Summary</h2>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{candidate.profileSummary}</p>
          </div>
        )}

        {candidate.skills.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-8 py-6">
            <div className="flex items-center gap-2 mb-4 text-indigo-500">
              <Star className="w-4 h-4" />
              <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Skills</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {candidate.skills.map((skill: string, i: number) => (
                <span key={i} className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-100 text-xs rounded-lg font-medium">{skill}</span>
              ))}
            </div>
          </div>
        )}

        {candidate.employment && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-8 py-6">
            <div className="flex items-center gap-2 mb-3 text-orange-500">
              <Briefcase className="w-4 h-4" />
              <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Employment</h2>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{candidate.employment}</p>
          </div>
        )}

        {candidate.education && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-8 py-6">
            <div className="flex items-center gap-2 mb-3 text-green-500">
              <GraduationCap className="w-4 h-4" />
              <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Education</h2>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{candidate.education}</p>
          </div>
        )}

        {candidate.projects && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-8 py-6">
            <div className="flex items-center gap-2 mb-3 text-purple-500">
              <Star className="w-4 h-4" />
              <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Projects</h2>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{candidate.projects}</p>
          </div>
        )}

        {candidate.internships && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-8 py-6">
            <div className="flex items-center gap-2 mb-3 text-pink-500">
              <Briefcase className="w-4 h-4" />
              <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Internships</h2>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{candidate.internships}</p>
          </div>
        )}

        {candidate.languages && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-8 py-6">
            <div className="flex items-center gap-2 mb-3 text-teal-500">
              <User className="w-4 h-4" />
              <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Languages</h2>
            </div>
            <p className="text-gray-600 text-sm">{candidate.languages}</p>
          </div>
        )}

        {(certs.length > 0 || candidate.awards) && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-8 py-6">
            <div className="flex items-center gap-2 mb-4 text-yellow-500">
              <Star className="w-4 h-4" />
              <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Accomplishments</h2>
            </div>
            {certs.length > 0 && (
              <div className="mb-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-3">Certifications</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {certs.map((cert, i) => (
                    <div key={i} className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                      <p className="text-sm font-semibold text-gray-800">{cert.name}</p>
                      {cert.issuer && <p className="text-xs text-gray-500 mt-0.5">{cert.issuer}</p>}
                      {cert.completionId && <p className="text-xs text-gray-400">ID: {cert.completionId}</p>}
                      {cert.date && <p className="text-xs text-gray-400">{cert.date}</p>}
                      {cert.url && (
                        <a href={cert.url} target="_blank" rel="noopener noreferrer" download
                          className="inline-flex items-center gap-1 mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium">
                          <Download className="w-3 h-3" />View Certificate
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {candidate.awards && (
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Awards</p>
                <p className="text-gray-600 text-sm whitespace-pre-line">{candidate.awards}</p>
              </div>
            )}
          </div>
        )}

        {(candidate.gender || candidate.birthday) && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-8 py-6">
            <div className="flex items-center gap-2 mb-4 text-gray-400">
              <User className="w-4 h-4" />
              <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Additional Info</h2>
            </div>
            <div className="flex flex-wrap gap-8 text-sm">
              {candidate.gender && (
                <div><span className="text-gray-400 text-xs uppercase tracking-wide block mb-0.5">Gender</span><span className="font-medium text-gray-700">{candidate.gender}</span></div>
              )}
              {candidate.birthday && (
                <div><span className="text-gray-400 text-xs uppercase tracking-wide block mb-0.5">Birthday</span><span className="font-medium text-gray-700">{(() => { try { return new Date(candidate.birthday).toLocaleDateString(); } catch { return candidate.birthday; } })()}</span></div>
              )}
            </div>
          </div>
        )}

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
      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default CandidateProfileView;
