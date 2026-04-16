import React, { useEffect, useState } from 'react';
import { X, MapPin, Mail, Phone, Briefcase, GraduationCap, Loader, Code, Users, Globe, Star, CheckCircle, Clock, Award, Link, Calendar } from 'lucide-react';
import { API_ENDPOINTS } from '../config/env';

interface CandidateProfileModalProps {
  candidate: any;
  isOpen: boolean;
  onClose: () => void;
}

const CandidateProfileModal: React.FC<CandidateProfileModalProps> = ({ candidate, isOpen, onClose }) => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !candidate) return;
    setProfile(null);
    setLoading(true);

    const id = candidate._id || candidate.id;
    const email = candidate.email;

    const fetchProfile = async () => {
      try {
        const [byId, byEmail] = await Promise.all([
          id ? fetch(`${API_ENDPOINTS.BASE_URL}/profile/${encodeURIComponent(id)}`).then(r => r.ok ? r.json() : null).catch(() => null) : Promise.resolve(null),
          email ? fetch(`${API_ENDPOINTS.BASE_URL}/profile/${encodeURIComponent(email)}`).then(r => r.ok ? r.json() : null).catch(() => null) : Promise.resolve(null),
        ]);
        const fresh = { ...(byId || {}), ...(byEmail || {}) };
        setProfile(Object.keys(fresh).length > 0 && !fresh.error ? { ...candidate, ...fresh } : candidate);
      } catch {
        setProfile(candidate);
      }
      setLoading(false);
    };

    fetchProfile();
  }, [isOpen, candidate]);

  if (!isOpen || !candidate) return null;

  const name = profile?.fullName || profile?.name || candidate?.fullName || candidate?.name || 'Anonymous';

  const parseList = (val: any): string[] => {
    if (!val) return [];
    if (Array.isArray(val)) return val.filter(Boolean);
    if (typeof val === 'string' && val.trim()) {
      try { const p = JSON.parse(val); if (Array.isArray(p)) return p.filter(Boolean); } catch {}
      const sep = val.includes('\n') ? '\n' : ',';
      return val.split(sep).map((s: string) => s.trim()).filter(Boolean);
    }
    return [];
  };

  const skills = parseList(profile?.skills);
  const languages = parseList(profile?.languages);
  const certifications = parseList(profile?.certifications);

  const empList: any[] = Array.isArray(profile?.employment)
    ? profile.employment
    : profile?.employment && typeof profile.employment === 'object' && profile.employment.companyName
      ? [profile.employment] : [];

  const edu = profile?.educationCollege;
  const hasEdu = edu && typeof edu === 'object' && (edu.degree || edu.college);

  const prefs = profile?.careerPreferences;
  const availability = prefs?.availability || profile?.availability;
  const jobType = prefs?.lookingFor?.join(', ') || profile?.jobType || profile?.employmentType;
  const salary = profile?.salary || profile?.expectedSalary;
  const summary = profile?.profileSummary;
  const openToWork = profile?.openToWork;
  const visibilityStatus = profile?.visibilityStatus;
  const totalExp = profile?.yearsExperience || profile?.experience;

  const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  // Quick info cards
  const infoCards = [
    profile?.email && { icon: <Mail className="w-4 h-4 text-indigo-500" />, label: 'Email', value: profile.email, bg: 'bg-gray-50' },
    profile?.phone && { icon: <Phone className="w-4 h-4 text-indigo-500" />, label: 'Phone', value: profile.phone, bg: 'bg-gray-50' },
    availability && { icon: <Clock className="w-4 h-4 text-green-600" />, label: 'Availability', value: availability, bg: 'bg-green-50' },
    jobType && { icon: <Briefcase className="w-4 h-4 text-blue-600" />, label: 'Job Type', value: jobType, bg: 'bg-blue-50' },
    salary && { icon: <Star className="w-4 h-4 text-emerald-600" />, label: 'Expected Salary', value: salary, bg: 'bg-emerald-50' },
    profile?.workAuthorization && { icon: <CheckCircle className="w-4 h-4 text-purple-600" />, label: 'Work Authorization', value: profile.workAuthorization, bg: 'bg-purple-50' },
    totalExp && { icon: <Calendar className="w-4 h-4 text-orange-500" />, label: 'Experience', value: totalExp, bg: 'bg-orange-50' },
    prefs?.location && { icon: <MapPin className="w-4 h-4 text-amber-600" />, label: 'Preferred Location', value: prefs.location, bg: 'bg-amber-50' },
  ].filter(Boolean) as { icon: React.ReactNode; label: string; value: string; bg: string }[];

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[88vh] overflow-y-auto shadow-2xl flex flex-col">

        {/* Header */}
        <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 rounded-t-2xl px-6 py-5 flex-shrink-0">
          <button onClick={onClose} className="absolute top-4 right-4 p-1.5 bg-white/20 hover:bg-white/30 rounded-full transition-colors">
            <X className="w-5 h-5 text-white" />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/60 shadow-lg flex-shrink-0">
              {profile?.profilePhoto
                ? <img src={profile.profilePhoto} alt={name} className="w-full h-full object-cover" />
                : <div className="w-full h-full bg-white/20 flex items-center justify-center text-white font-bold text-xl">{initials}</div>}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-white">{name}</h2>
                {openToWork && (
                  <span className="bg-green-400 text-white text-xs font-bold px-2 py-0.5 rounded-full">#OpenToWork</span>
                )}
              </div>
              <p className="text-indigo-200 text-sm mt-0.5">{profile?.title || profile?.jobTitle || profile?.roleTitle || 'Professional'}</p>
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                {profile?.location && (
                  <span className="flex items-center gap-1 text-white/80 text-xs"><MapPin className="w-3 h-3" />{profile.location}</span>
                )}
                {totalExp && (
                  <span className="flex items-center gap-1 text-white/80 text-xs"><Briefcase className="w-3 h-3" />{totalExp}</span>
                )}
                {visibilityStatus && (
                  <span className="flex items-center gap-1 text-white/80 text-xs capitalize"><Globe className="w-3 h-3" />{visibilityStatus.replace('-', ' ')}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader className="w-7 h-7 animate-spin text-indigo-600" />
            <span className="ml-3 text-gray-500">Loading profile...</span>
          </div>
        ) : (
          <div className="px-6 py-5 space-y-5">

            {/* Quick Info Grid */}
            {infoCards.length > 0 && (
              <div className="grid grid-cols-2 gap-2.5">
                {infoCards.map((card, i) => (
                  <div key={i} className={`flex items-start gap-2.5 ${card.bg} rounded-xl px-3 py-2.5`}>
                    <div className="mt-0.5 flex-shrink-0">{card.icon}</div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500">{card.label}</p>
                      <p className="text-sm font-medium text-gray-800 truncate">{card.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Profile Summary */}
            {summary && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-500" /> Profile Summary
                </h4>
                <p className="text-sm text-gray-600 bg-indigo-50 rounded-xl px-4 py-3 leading-relaxed">{summary}</p>
              </div>
            )}

            {/* Skills */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Code className="w-4 h-4 text-indigo-500" /> Skills & Technologies
              </h4>
              {skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill: string, i: number) => (
                    <span key={i} className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-xs font-medium">{skill}</span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm">No skills listed</p>
              )}
            </div>

            {/* Work Experience */}
            {empList.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2.5 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-indigo-500" /> Work Experience
                </h4>
                <div className="space-y-2.5">
                  {empList.slice(0, 4).map((emp: any, i: number) => (
                    <div key={i} className="flex gap-3 bg-gray-50 rounded-xl px-3 py-2.5">
                      <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Briefcase className="w-4 h-4 text-indigo-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{emp.designation || 'Role'}</p>
                        <p className="text-xs text-gray-600">{emp.companyName}</p>
                        {(emp.startMonth || emp.startYear) && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            {[emp.startMonth, emp.startYear].filter(Boolean).join(' ')} —{' '}
                            {emp.currentlyWorking ? 'Present' : [emp.endMonth, emp.endYear].filter(Boolean).join(' ')}
                          </p>
                        )}
                        {emp.description && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{emp.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Education */}
            {hasEdu && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-indigo-500" /> Education
                </h4>
                <div className="flex gap-3 bg-gray-50 rounded-xl px-3 py-2.5">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <GraduationCap className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{edu.degree}</p>
                    <p className="text-xs text-gray-600">{edu.college}</p>
                    {edu.passingYear && <p className="text-xs text-gray-400 mt-0.5">Graduated {edu.passingYear}</p>}
                    {edu.percentage && <p className="text-xs text-gray-400">Score: {edu.percentage}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Certifications */}
            {certifications.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Award className="w-4 h-4 text-indigo-500" /> Certifications
                </h4>
                <div className="flex flex-wrap gap-2">
                  {certifications.map((cert: string, i: number) => (
                    <span key={i} className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                      <Award className="w-3 h-3" />{cert}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Languages */}
            {languages.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-indigo-500" /> Languages
                </h4>
                <div className="flex flex-wrap gap-2">
                  {languages.map((lang: string, i: number) => (
                    <span key={i} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">{lang}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Social / Portfolio Links */}
            {(profile?.linkedinUrl || profile?.githubUrl || profile?.portfolioUrl || profile?.websiteUrl) && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Link className="w-4 h-4 text-indigo-500" /> Links
                </h4>
                <div className="flex flex-wrap gap-2">
                  {profile.linkedinUrl && (
                    <a href={profile.linkedinUrl} target="_blank" rel="noreferrer" className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full font-medium hover:bg-blue-200 transition-colors">LinkedIn</a>
                  )}
                  {profile.githubUrl && (
                    <a href={profile.githubUrl} target="_blank" rel="noreferrer" className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full font-medium hover:bg-gray-200 transition-colors">GitHub</a>
                  )}
                  {(profile.portfolioUrl || profile.websiteUrl) && (
                    <a href={profile.portfolioUrl || profile.websiteUrl} target="_blank" rel="noreferrer" className="text-xs bg-purple-100 text-purple-700 px-3 py-1.5 rounded-full font-medium hover:bg-purple-200 transition-colors">Portfolio</a>
                  )}
                </div>
              </div>
            )}

          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0 mt-auto">
          <button onClick={onClose} className="px-5 py-2 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors text-sm">
            Close
          </button>
          <button
            onClick={() => profile?.email && (window.location.href = `mailto:${profile.email}`)}
            className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 text-sm"
          >
            <Mail className="w-4 h-4" /> Contact Candidate
          </button>
        </div>
      </div>
    </div>
  );
};

export default CandidateProfileModal;
