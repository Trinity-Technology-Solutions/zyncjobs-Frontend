import React, { useState, useEffect } from 'react';
import { MapPin, Briefcase, Clock, Building, Share2, CheckCircle } from 'lucide-react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { getSafeCompanyLogo, getCompanyLogo as getLogoFromUtils } from '../utils/logoUtils';
import { API_ENDPOINTS } from '../config/constants';
import { formatDetailedTime, getPostingFreshness, formatSalary } from '../utils/textUtils';
import { validateUserResume, handleResumeValidationAlert } from '../utils/resumeValidation';
import Notification from '../components/Notification';

const fmtNum = (n: number): string => {
  if (n >= 10000000) return `${(n / 10000000).toFixed(n % 10000000 === 0 ? 0 : 1)}Cr`;
  if (n >= 100000) return `${(n / 100000).toFixed(n % 100000 === 0 ? 0 : 1)}L`;
  if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}K`;
  return n.toString();
};

const formatSalaryDisplay = (job: any): string => {
  // salary object from DB: { min, max, currency, period }
  if (job.salary && typeof job.salary === 'object' && (job.salary.min || job.salary.max)) {
    const s = formatSalary(job.salary);
    if (s) return s + (job.salary.period ? ` ${job.salary.period}` : '');
  }
  // flat salaryMin/salaryMax fields
  const min = Number(job.salaryMin) || 0;
  const max = Number(job.salaryMax) || 0;
  if (min && max) return `₹${fmtNum(min)} - ₹${fmtNum(max)}`;
  if (min) return `₹${fmtNum(min)}+`;
  if (max) return `Up to ₹${fmtNum(max)}`;
  return 'Salary not disclosed';
};

const formatExperience = (exp: string | undefined): string => {
  if (!exp) return '2-4 years';
  // Already has 'years' or 'year' in it
  if (/year/i.test(exp)) return exp;
  // Map DB enum values to readable ranges
  const map: Record<string, string> = {
    Entry: '0-2 years', Mid: '2-5 years', Senior: '5-8 years', Lead: '8+ years'
  };
  return map[exp] || exp;
};
import { getDisplayEmployerId, getCompanyAbbreviation } from '../utils/jobMigrationUtils';
import QuickApplyButton from '../components/QuickApplyButton';
import BackButton from '../components/BackButton';
import JobShareModal from '../components/JobShareModal';


interface JobDetailPageProps {
  onNavigate: (page: string, data?: any) => void;
  jobTitle?: string;
  jobId?: string | number;
  companyName?: string;
  user?: any;
  onLogout?: () => void;
  jobData?: any;
}

const JobDetailPage: React.FC<JobDetailPageProps> = ({ onNavigate, jobId, user }) => {
  const { slug } = useParams<{ slug?: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlJobId = searchParams.get('id') || '';
  const [job, setJob] = useState<any>(null);
  const [companyLogoUrl, setCompanyLogoUrl] = useState<string>('');
  const [jobPoster, setJobPoster] = useState<any>(null);
  const [similarJobs, setSimilarJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState<string>('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string; isVisible: boolean }>({ type: 'success', message: '', isVisible: false });

  const showNotif = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ type, message, isVisible: true });
  };

  const getCompanyLogo = (app: any) => {
    const name = app?.company || app?.companyName || '';
    // Always prefer local logo mapping first (handles Nambikkai, Trinity, etc.)
    const localLogo = getLogoFromUtils(name);
    if (localLogo) return localLogo;
    // Fall back to API-fetched logo, then getSafeCompanyLogo
    return companyLogoUrl || getSafeCompanyLogo(app);
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [jobId, urlJobId]);

  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        setLoading(true);
        setJob(null);

        const resolvedJobId = urlJobId || (jobId ? String(jobId) : '');

        console.log('JobDetailPage: resolvedJobId =', resolvedJobId, '| urlJobId =', urlJobId, '| jobId prop =', jobId, '| slug =', slug);

        if (!resolvedJobId && !slug) {
          setJob(null);
          setLoading(false);
          return;
        }

        let jobResult = null;

        // If slug route, fetch by slug first
        if (slug) {
          const slugRes = await fetch(`${API_ENDPOINTS.JOBS}/slug/${slug}`);
          if (slugRes.ok) jobResult = await slugRes.json();
        }

        // Try by UUID/id
        if (!jobResult && resolvedJobId) {
          let response = await fetch(`${API_ENDPOINTS.JOBS}/${resolvedJobId}`);
          if (response.ok) {
            const data = await response.json();
            // Make sure we got a real job object, not an error
            if (data && (data.id || data._id || data.jobTitle || data.title)) {
              jobResult = data;
            }
          }
          if (!jobResult) {
            // Try by positionId
            const posResponse = await fetch(`${API_ENDPOINTS.JOBS}/position/${resolvedJobId}`);
            if (posResponse.ok) {
              const data = await posResponse.json();
              if (data && (data.id || data._id || data.jobTitle || data.title)) {
                jobResult = data;
              }
            }
          }
        }

        if (!jobResult) {
          // Fallback: Check if job data was stored in sessionStorage (from SkillGapAnalysisPage)
          try {
            const storedJobData = sessionStorage.getItem('selectedJobData');
            if (storedJobData) {
              const parsedJobData = JSON.parse(storedJobData);
              // Verify this is the job we're looking for
              const storedJobId = parsedJobData._id || parsedJobData.id;
              if (storedJobId && storedJobId === resolvedJobId) {
                jobResult = parsedJobData;
                console.log('Using job data from sessionStorage:', jobResult);
                // Clear the stored data after use
                sessionStorage.removeItem('selectedJobData');
              }
            }
          } catch (error) {
            console.error('Error parsing stored job data:', error);
          }
        }

        if (!jobResult) {
          setJob(null);
          return;
        }

        const jobData = jobResult;
        setJob(jobData);

        // Fetch company logo from companies API
        try {
          const companyName = jobData.company || '';
          if (companyName) {
            const compRes = await fetch(`${API_ENDPOINTS.COMPANIES}?name=${encodeURIComponent(companyName)}`);
            if (compRes.ok) {
              const compData = await compRes.json();
              const companies: any[] = Array.isArray(compData) ? compData : (compData.companies || compData.data || []);
              const match = companies.find((c: any) =>
                (c.name || '').toLowerCase() === companyName.toLowerCase() ||
                (c.companyName || '').toLowerCase() === companyName.toLowerCase()
              );
              const logoUrl = match?.logo || match?.logoUrl || match?.imageUrl || match?.image || '';
              if (logoUrl) setCompanyLogoUrl(logoUrl);
            }
          }
        } catch {}

        if (user?.email && (jobData.id || jobData._id)) {
          await checkApplicationStatus(jobData.id || jobData._id || '', user.email);
        }

        if (jobData.employerEmail || jobData.postedBy) {
          const usersResponse = await fetch(API_ENDPOINTS.USERS);
          if (usersResponse.ok) {
            const users = await usersResponse.json();
            const poster = users.find(
              (u: any) =>
                u.email === jobData.employerEmail ||
                u.email === jobData.postedBy
            );
            setJobPoster(poster);
          }
        }

        fetchSimilarJobs(jobData);

      } catch (error) {
        console.error('Job fetch error:', error);
        setJob(null);
      } finally {
        setLoading(false);
      }
    };

    fetchJobDetails();
  }, [jobId, urlJobId, slug]);

  // Set Open Graph meta tags for LinkedIn share preview
  useEffect(() => {
    if (!job) return;
    
    const companyName = job.company || '';
    const jobTitle = job.jobTitle || job.title || '';
    const description = (job.jobDescription || job.description || 'Job opportunity').replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*\*([^*]+)\*/g, '$1');
    
    // Use backend OG tags route for social sharing
    const backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
    // Prefer SEO slug URL, fallback to ?id= URL
    const jobSlug = job.slug;
    const ogUrl = jobSlug
      ? `${window.location.origin}/jobs/${jobSlug}`
      : `${backendUrl}/job-detail?id=${job.id || job._id}`;
    const canonicalUrl = jobSlug
      ? `${window.location.origin}/jobs/${jobSlug}`
      : `${backendUrl}/job-detail?id=${job.id || job._id}`;
    document.title = `${jobTitle} at ${companyName} | ZyncJobs`;
    
    const setMeta = (property: string, content: string) => {
      let el = document.querySelector(`meta[property='${property}']`) as HTMLMetaElement;
      if (!el) { el = document.createElement('meta'); el.setAttribute('property', property); document.head.appendChild(el); }
      el.setAttribute('content', content);
    };
    
    // Set canonical URL
    let canonicalEl = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonicalEl) {
      canonicalEl = document.createElement('link');
      canonicalEl.rel = 'canonical';
      document.head.appendChild(canonicalEl);
    }
    canonicalEl.href = canonicalUrl;
    
    setMeta('og:title', `${jobTitle} at ${companyName}`);
    setMeta('og:description', description.substring(0, 160) + '...');
    setMeta('og:url', ogUrl);
    setMeta('og:type', 'website');
    setMeta('og:site_name', 'ZyncJobs');
    if (job.jobHeaderImage) setMeta('og:image', job.jobHeaderImage);
    
    // Set Twitter meta tags
    const setTwitterMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[name='${name}']`) as HTMLMetaElement;
      if (!el) { el = document.createElement('meta'); el.setAttribute('name', name); document.head.appendChild(el); }
      el.setAttribute('content', content);
    };
    
    setTwitterMeta('twitter:card', 'summary_large_image');
    setTwitterMeta('twitter:title', `${jobTitle} at ${companyName}`);
    setTwitterMeta('twitter:description', description.substring(0, 160) + '...');
    setTwitterMeta('twitter:url', ogUrl);
    if (job.jobHeaderImage) setTwitterMeta('twitter:image', job.jobHeaderImage);
  }, [job]);

  const checkApplicationStatus = async (jobId: string, userEmail: string) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.APPLICATIONS}?candidateEmail=${encodeURIComponent(userEmail)}&jobId=${jobId}`);
      if (!response.ok) return;
      const data = await response.json();
      const list: any[] = Array.isArray(data) ? data : (data.applications || []);
      const userApplication = list.find((app: any) => {
        const jobMatch = app.jobId === jobId || app.jobId?._id === jobId || app.jobId?.id === jobId;
        const emailMatch = app.candidateEmail?.toLowerCase() === userEmail.toLowerCase();
        return jobMatch && emailMatch;
      });
      setHasApplied(!!userApplication);
      setApplicationStatus(userApplication?.status || '');
    } catch (error) {
      console.error('Error checking application status:', error);
    }
  };

  const fetchSimilarJobs = async (currentJob: any) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.JOBS}?limit=100`);
      if (!response.ok) return;
      const data = await response.json();
      console.log('SimilarJobs raw data:', typeof data, Array.isArray(data), JSON.stringify(data).substring(0, 200));
      const allJobs: any[] = Array.isArray(data) ? data : (data.jobs || data.data || Object.values(data).find((v: any) => Array.isArray(v)) as any[] || []);
      console.log('SimilarJobs allJobs count:', allJobs.length);
      if (!allJobs.length) return;

      const currentTitle = (currentJob.jobTitle || currentJob.title || '').toLowerCase();
      const currentCompany = (currentJob.company || '').toLowerCase();
      const titleWords = currentTitle.split(/\s+/).filter((w: string) => w.length > 2);

      const currentId = String(currentJob._id || currentJob.id || '');
      const others = allJobs.filter((j: any) => {
        const jId = String(j._id || j.id || '');
        return jId !== currentId;
      });
      console.log('SimilarJobs others count:', others.length);
      const scored = others
        .map((j: any) => {
          const jTitle = (j.jobTitle || j.title || '').toLowerCase();
          const jCompany = (j.company || '').toLowerCase();
          let score = 0;
          if (jCompany === currentCompany) score += 3;
          titleWords.forEach((w: string) => { if (jTitle.includes(w)) score += 1; });
          return { ...j, _score: score };
        })
        .sort((a: any, b: any) => b._score - a._score)
        .slice(0, 4);

      const finalJobs = scored.length > 0 ? scored : others.slice(0, 4);
      console.log('SimilarJobs final count:', finalJobs.length);
      setSimilarJobs(finalJobs);
    } catch (error) {
      console.error('Error fetching similar jobs:', error);
    }
  };

  const handleReapply = async () => {
    try {
      if (!user?.email) {
        showNotif('User email not found. Please login again.', 'error');
        return;
      }

      // Find the withdrawn application and update it directly
      const response = await fetch(`${API_ENDPOINTS.APPLICATIONS}?candidateEmail=${encodeURIComponent(user.email)}`);
      if (response.ok) {
        const applications = await response.json();
        const withdrawnApp = applications.find((app: { jobId: { _id: any; }; candidateEmail: string; status: string; }) => 
          (app.jobId._id === (job._id || jobId)) && 
          app.candidateEmail?.toLowerCase() === user.email.toLowerCase() &&
          app.status === 'withdrawn'
        );
        
        if (withdrawnApp) {
          // Update the application status back to applied
          const updateResponse = await fetch(`${API_ENDPOINTS.APPLICATIONS}/${withdrawnApp._id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              status: 'applied',
              note: 'Reapplied to position after withdrawal',
              updatedBy: user.name || user.fullName || 'Candidate'
            })
          });
          
          if (updateResponse.ok) {
            setHasApplied(true);
            setApplicationStatus('applied');
            showNotif('Successfully reapplied to the job!');
          } else {
            showNotif('Failed to reapply. Please try again.', 'error');
          }
        } else {
          showNotif('No withdrawn application found for this job.', 'error');
        }
      } else {
        showNotif('Failed to find your applications. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Error reapplying:', error);
      showNotif('Failed to reapply. Please try again.', 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Job not found</h2>
          <button onClick={() => onNavigate('job-listings')} className="bg-blue-600 text-white px-6 py-2 rounded-lg">
            Back to Jobs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-cyan-50">
      <Notification
        type={notification.type}
        message={notification.message}
        isVisible={notification.isVisible}
        onClose={() => setNotification(n => ({ ...n, isVisible: false }))}
      />
      {/* Job Header */}
      <div className="bg-white/90 backdrop-blur-md shadow-lg border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <BackButton 
            onClick={() => {
              try {
                if (user?.type === 'employer' || user?.userType === 'employer') {
                  onNavigate('my-jobs');
                } else {
                  onNavigate('job-listings');
                }
              } catch {
                try {
                  onNavigate('job-listings');
                } catch {
                  window.location.href = '/';
                }
              }
            }}
            text={`Back to ${user?.type === 'employer' || user?.userType === 'employer' ? 'My Jobs' : 'Jobs'}`}
            className="mb-4"
          />

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <div className="w-16 h-16 sm:w-28 sm:h-28 rounded-xl bg-blue-100 flex items-center justify-center p-2 sm:p-3 flex-shrink-0">
                <img
                  src={getCompanyLogo(job)}
                  alt={job.company}
                  className="w-full h-full object-contain rounded"
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    img.onerror = null;
                    img.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(job.company || 'C')}&size=80&background=3b82f6&color=ffffff&bold=true&format=png`;
                  }}
                />
              </div>
              <div className="flex-1">
                <h1 className="text-xl sm:text-3xl font-bold text-gray-900 mb-2">{job.jobTitle || job.title}</h1>
                <div className="flex items-center space-x-2 text-lg text-blue-600 font-medium mb-4">
                  <Building className="w-5 h-5" />
                  <span>{job.company}</span>
                </div>
                
                <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4" />
                    <span>{job.location}</span>
                  </div>
                  {(job.type || job.jobType) && (
                    <div className="flex items-center space-x-2">
                      <Briefcase className="w-4 h-4" />
                      <span>{(() => { const t = job.type || job.jobType; return Array.isArray(t) ? t.join(', ') : t; })()}</span>
                    </div>
                  )}
                  {job.locationType && (
                    <div className="flex items-center space-x-2">
                      <span className="bg-cyan-100 text-cyan-700 px-2 py-0.5 rounded-full text-xs font-medium">
                        {job.locationType}
                      </span>
                    </div>
                  )}
                  {(job.jobCategory || job.category) && (
                    <div className="flex items-center space-x-2">
                      <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">
                        {job.jobCategory || job.category}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <span>{formatSalaryDisplay(job)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span>{formatExperience(job.experienceRange)} experience</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-4 lg:mt-0 flex flex-wrap items-center gap-2 sm:gap-3">
              <button 
                onClick={() => setShowShareModal(true)}
                className="bg-gray-100 text-gray-700 px-4 py-2.5 rounded-lg font-semibold hover:bg-gray-200 transition-colors flex items-center space-x-2 text-sm"
              >
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </button>
              
              {/* Apply buttons - Hide for employers */}
              {user?.type !== 'employer' && user?.userType !== 'employer' && (
                <div className="flex flex-wrap items-center gap-2">
                  {hasApplied ? (
                    applicationStatus === 'withdrawn' ? (
                      <button 
                        onClick={handleReapply}
                        className="bg-green-600 text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center space-x-2 text-sm"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Reapply</span>
                      </button>
                    ) : (
                      <div className="flex items-center space-x-2 bg-green-100 text-green-800 px-4 py-2.5 rounded-lg font-semibold text-sm">
                        <CheckCircle className="w-4 h-4" />
                        <span>Applied</span>
                      </div>
                    )
                  ) : (
                    <>
                      <QuickApplyButton
                        jobId={job.id || job._id || String(jobId || '')}
                        jobTitle={job.jobTitle || job.title}
                        company={job.company}
                        user={user}
                        onSuccess={async () => {
                          setHasApplied(true);
                          setApplicationStatus('applied');
                          setTimeout(() => {
                            const jid = job.id || job._id || String(jobId || '');
                            if (user?.email && jid) checkApplicationStatus(jid, user.email);
                          }, 1000);
                        }}
                      />
                      <button 
                        onClick={async () => {
                          const jid = job.id || job._id || String(jobId || '');
                          if (user && (user.name || user.fullName)) {
                            // Validate resume before navigating
                            try {
                              const resumeValidation = await validateUserResume(user.email);
                              if (!resumeValidation.hasResume) {
                                handleResumeValidationAlert(resumeValidation, true);
                                return;
                              }
                            } catch (error) {
                              console.error('Resume validation error:', error);
                              window.dispatchEvent(new CustomEvent('zync:alert', { detail: { message: '📄 Please upload your resume in your profile before applying.' } }));
                              onNavigate('dashboard');
                              return;
                            }
                            
                            sessionStorage.setItem('selectedJob', JSON.stringify({
                              _id: jid, id: jid,
                              jobTitle: job.jobTitle || job.title,
                              company: job.company,
                              location: job.location,
                              description: job.description,
                              salary: job.salary,
                              type: job.type,
                              jobData: job
                            }));
                            onNavigate('job-application');
                          } else {
                            sessionStorage.setItem('pendingJobApplication', JSON.stringify({
                              jobId: jid,
                              jobTitle: job.jobTitle || job.title,
                              company: job.company,
                              jobData: job
                            }));
                            onNavigate('login');
                          }
                        }}
                        className="bg-blue-600 text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm whitespace-nowrap"
                      >
                        {user && (user.name || user.fullName) ? 'Apply with Cover Letter' : 'Login to Apply'}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main grid: banner+description on left, logo+sidebar on right */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left col: Banner image + Job Description as ONE card */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* Banner */}
              <div className="relative h-64 bg-gray-900">
                <img
                  src={job.jobHeaderImage || 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=400&fit=crop'}
                  alt={`${job.jobTitle || job.title} at ${job.company}`}
                  className="w-full h-full object-cover opacity-80"
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    img.src = 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=400&fit=crop';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-blue-900/50 to-purple-900/50"></div>
              </div>
              {/* Job Description directly below banner inside same card */}
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Job description</h2>
                
                {(() => {
                  const sourceDesc = job.jobDescription || job.description || 'Job description not available.';
                  
                  // Always use our custom parsing logic instead of HTML rendering
                  // This ensures we get the clean 3-section format
                  
                  // Parse the job description into structured sections
                  const lines = sourceDesc.split('\n').filter((line: string) => line.trim());
                  const sections: { [key: string]: string[] } = {};
                  let currentSection = 'summary';
                  let currentContent: string[] = [];

                  // Enhanced section headers detection
                  const sectionHeaders: Record<string, string> = {
                    'job summary': 'summary',
                    'summary': 'summary',
                    'key responsibilities': 'responsibilities', 
                    'responsibilities': 'responsibilities',
                    'mandatory skills': 'mandatory-skills',
                    'required skills': 'mandatory-skills',
                    'good to have skills': 'good-to-have',
                    'nice to have': 'good-to-have',
                    'preferred candidate profile': 'candidate-profile',
                    'candidate profile': 'candidate-profile',
                    'interview process': 'interview-process',
                    'locations open for sourcing': 'locations',
                    'location': 'locations',
                    'recruitment drive details': 'recruitment-details',
                    'drive details': 'recruitment-details'
                  };

                  for (const line of lines) {
                    // Decode HTML entities and strip HTML tags
                    const decoded = line.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
                    const stripped = decoded.replace(/<[^>]*>/g, '').trim();
                    const trimmed = stripped.trim();
                    const lowerLine = trimmed.toLowerCase();
                    
                    // Check if this line is a section header
                    const matchedSection = Object.keys(sectionHeaders).find(header => 
                      lowerLine === header || lowerLine.startsWith(header) || lowerLine.includes(header)
                    );
                    
                    if (matchedSection) {
                      // Save previous section
                      if (currentContent.length > 0) {
                        sections[currentSection] = [...currentContent];
                      }
                      // Start new section
                      currentSection = sectionHeaders[matchedSection] as string;
                      currentContent = [];
                    } else if (trimmed && !trimmed.match(/^(Job Title|Work Location|Experience Required|Notice Period|Employment Type|Salary Range)$/)) {
                      // Skip empty lines and HTML tags
                      if (trimmed && !trimmed.match(/^<\/?[^>]+>$/)) {
                        currentContent.push(trimmed);
                      }
                    }
                  }
                  
                  // Save the last section
                  if (currentContent.length > 0) {
                    sections[currentSection] = currentContent;
                  }

                  return (
                    <div className="space-y-6">
                      {/* Job Summary Section */}
                      {sections.summary && sections.summary.length > 0 && (
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-3">Job Summary</h4>
                          <div className="text-gray-700 space-y-2">
                            {sections.summary.map((line: string, i: number) => (
                              <p key={i} className="text-sm leading-relaxed">{line}</p>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Key Responsibilities Section */}
                      {sections.responsibilities && sections.responsibilities.length > 0 && (
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-3">Role & responsibilities</h4>
                          <div className="space-y-2">
                            {sections.responsibilities.map((line: string, i: number) => {
                              const isBulletPoint = /^[•\-\*]/.test(line) || 
                                line.toLowerCase().includes('design') || 
                                line.toLowerCase().includes('build') || 
                                line.toLowerCase().includes('develop') || 
                                line.toLowerCase().includes('implement') || 
                                line.toLowerCase().includes('write') || 
                                line.toLowerCase().includes('monitor') || 
                                line.toLowerCase().includes('collaborate') || 
                                line.toLowerCase().includes('ensure') ||
                                line.toLowerCase().includes('integrate') ||
                                line.toLowerCase().includes('migrate');
                              
                              if (isBulletPoint) {
                                return (
                                  <div key={i} className="flex items-start gap-2">
                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></span>
                                    <span className="text-sm text-gray-700 leading-relaxed">{line.replace(/^[•\-\*]\s*/, '')}</span>
                                  </div>
                                );
                              }
                              return (
                                <p key={i} className="text-sm text-gray-700 leading-relaxed">{line}</p>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Requirements Section - Combining Mandatory Skills and Candidate Profile */}
                      {((sections['mandatory-skills'] && sections['mandatory-skills'].length > 0) || 
                        (sections['candidate-profile'] && sections['candidate-profile'].length > 0)) && (
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-3">Required Skills & Qualifications</h4>
                          <div className="space-y-2">
                            {/* Mandatory Skills */}
                            {sections['mandatory-skills'] && sections['mandatory-skills'].map((skill: string, i: number) => (
                              <div key={`skill-${i}`} className="flex items-start gap-2">
                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></span>
                                <span className="text-sm text-gray-700 leading-relaxed">{skill}</span>
                              </div>
                            ))}
                            {/* Candidate Profile */}
                            {sections['candidate-profile'] && sections['candidate-profile'].map((requirement: string, i: number) => (
                              <div key={`req-${i}`} className="flex items-start gap-2">
                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></span>
                                <span className="text-sm text-gray-700 leading-relaxed">{requirement}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
                
                {/* Created By & On Details */}
                <div className="border-t border-gray-100 pt-6 mt-8">
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <span className="font-medium">Created By:</span>
                      <span>{job.postedBy || jobPoster?.name || jobPoster?.fullName || 'System'}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="font-medium">Posted:</span>
                      <span className="text-blue-600 font-medium">{formatDetailedTime(job.createdAt)}</span>
                      {getPostingFreshness(job.createdAt) === 'new' && (
                        <span className="ml-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                          NEW
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="font-medium">Company:</span>
                      <span>{job.employerCompany || jobPoster?.company || job.company}</span>
                    </div>
                    {(job.jobCategory || job.category) && (
                      <div className="flex items-center space-x-1">
                        <span className="font-medium">Category:</span>
                        <span className="text-blue-600">{job.jobCategory || job.category}</span>
                      </div>
                    )}
                    {/* Employer ID and Position ID - Enhanced Display */}
                    {(() => {
                      const displayEmployerId = getDisplayEmployerId(job, jobPoster);
                      return displayEmployerId ? (
                        <div className="flex items-center space-x-1">
                          <span className="font-medium text-gray-700">Employer ID:</span>
                          <span className="text-blue-600 font-bold text-sm bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                            {displayEmployerId}
                          </span>
                        </div>
                      ) : null;
                    })()} 
                    {(() => {
                      const rawPos = job.positionId;
                      if (!rawPos) return null;
                      // Already in new format ABBR/YY/NNNN
                      const isNewFormat = /^[A-Z]{2,4}\/\d{2}\/\d{4}$/.test(rawPos);
                      let displayPos = rawPos;
                      if (!isNewFormat) {
                        // Reformat old positionId using company name
                        const abbr = getCompanyAbbreviation(job.company || job.employerCompany || '');
                        const year = new Date().getFullYear().toString().slice(-2);
                        // Extract numeric part from old format (e.g. "2026-0006" -> "0006", "PID0003" -> "0003")
                        const numMatch = rawPos.match(/(\d{4})$/);
                        const seq = numMatch ? numMatch[1] : String(parseInt(rawPos.replace(/\D/g, '')) || 1).padStart(4, '0');
                        displayPos = `${abbr}/${year}/${seq}`;
                      }
                      return (
                        <div className="flex items-center space-x-1">
                          <span className="font-medium text-gray-700">Position Code:</span>
                          <span className="text-green-600 font-bold text-sm bg-green-50 px-3 py-1 rounded-full border border-green-200">{displayPos}</span>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right col: Company Logo Card + Sidebar */}
          <div className="space-y-6">
            {/* Company Logo Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200" style={{display:'flex', alignItems:'center', justifyContent:'center', minHeight:'200px'}}>
              <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:'4px'}}>
                <img
                  src={getCompanyLogo(job)}
                  alt={job.company}
                  style={{width:'160px', height:'80px', objectFit:'contain', display:'block'}}
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    img.onerror = null;
                    img.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(job.company || 'C')}&size=80&background=3b82f6&color=ffffff&bold=true&format=png`;
                  }}
                />
                <p style={{fontSize:'18px', fontWeight:'700', color:'#111827', textAlign:'center', margin:'0', lineHeight:'1.3'}}>{job.company}</p>
                <p style={{fontSize:'13px', color:'#6b7280', textAlign:'center', margin:'0', lineHeight:'1.3'}}>Company</p>
              </div>
            </div>
            {/* Skills */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Required Skills</h3>
              <div className="flex flex-wrap gap-2">
                {Array.isArray(job.skills) ? job.skills.map((skill: string, index: number) => (
                  <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    {skill}
                  </span>
                )) : (
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    {job.skills || 'No skills listed'}
                  </span>
                )}
              </div>
            </div>

            {/* Benefits */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Benefits & Perks</h3>
              <ul className="space-y-2">
                {job.benefits && job.benefits.length > 0 ? (
                  Array.isArray(job.benefits) ? job.benefits.map((benefit: string, index: number) => (
                    <li key={index} className="flex items-start">
                      <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span className="text-gray-600 text-sm">{benefit}</span>
                    </li>
                  )) : (
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span className="text-gray-600 text-sm">{job.benefits}</span>
                    </li>
                  )
                ) : (
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span className="text-gray-600 text-sm">Competitive benefits package available.</span>
                  </li>
                )}
              </ul>
            </div>

            {/* Similar Jobs */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Similar Jobs</h3>
              <div className="space-y-3">
                {similarJobs.length > 0 ? (
                  similarJobs.map((sj) => (
                    <div
                      key={sj._id || sj.id}
                      className="border border-gray-100 rounded-lg p-3 hover:shadow-md cursor-pointer transition-shadow"
                      onClick={() => {
                        const sjSlug = sj.slug;
                        const sjId = sj._id || sj.id;
                        if (sjSlug) navigate(`/jobs/${sjSlug}`);
                        else onNavigate(`job-detail/${sjId}`);
                      }}
                    >
                      {/* Logo + Company */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <img
                            src={getCompanyLogo(sj)}
                            alt={sj.company}
                            className="w-8 h-8 rounded object-contain border border-gray-200 bg-white p-0.5"
                            onError={(e) => { const img = e.target as HTMLImageElement; img.onerror = null; img.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(sj.company || 'C')}&size=32&background=3b82f6&color=ffffff&bold=true&format=png`; }}
                          />
                          <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">{sj.company}</span>
                        </div>
                        <span className="text-xs text-gray-400">{formatDetailedTime(sj.createdAt)}</span>
                      </div>
                      {/* Job Title */}
                      <p className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">{sj.jobTitle || sj.title}</p>
                      {/* Location */}
                      <p className="text-xs text-gray-500 mb-2">{sj.location}</p>
                      {/* Description snippet */}
                      {(sj.jobDescription || sj.description) && (
                        <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                          {(sj.jobDescription || sj.description).replace(/<[^>]*>/g, '').replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ').trim().substring(0, 120)}
                        </p>
                      )}
                      {/* Badges */}
                      <div className="flex flex-wrap gap-1">
                        {sj.type && (
                          <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{sj.type}</span>
                        )}
                        {(sj.salaryMin || sj.salaryMax || sj.salary) && (
                          <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                            {formatSalaryDisplay(sj)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No similar jobs found</p>
                )}
              </div>
            </div>

            {/* Apply Button - Hide for employers */}
            {user?.type !== 'employer' && user?.userType !== 'employer' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex flex-col space-y-3">
                  {hasApplied ? (
                    applicationStatus === 'withdrawn' ? (
                      <button 
                        onClick={handleReapply}
                        className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                      >
                        <CheckCircle className="w-5 h-5" />
                        <span>Reapply</span>
                      </button>
                    ) : (
                      <div className="flex items-center justify-center space-x-2 bg-green-100 text-green-800 py-3 rounded-lg font-semibold">
                        <CheckCircle className="w-5 h-5" />
                        <span>Applied</span>
                      </div>
                    )
                  ) : (
                    <>
                      {user && (user.name || user.fullName) && (
                        <QuickApplyButton
                          jobId={job.id || job._id || String(jobId || '')}
                          jobTitle={job.jobTitle || job.title}
                          company={job.company}
                          user={user}
                          onSuccess={async () => {
                            setHasApplied(true);
                            setApplicationStatus('applied');
                            setTimeout(() => {
                              const jid = job.id || job._id || String(jobId || '');
                              if (user?.email && jid) checkApplicationStatus(jid, user.email);
                            }, 1000);
                          }}
                          className="w-full justify-center"
                        />
                      )}
                      <button 
                        onClick={async () => {
                          const jid2 = job.id || job._id || String(jobId || '');
                          if (user && user.name) {
                            // Validate resume before navigating
                            try {
                              const resumeValidation = await validateUserResume(user.email);
                              if (!resumeValidation.hasResume) {
                                handleResumeValidationAlert(resumeValidation, true);
                                return;
                              }
                            } catch (error) {
                              console.error('Resume validation error:', error);
                              window.dispatchEvent(new CustomEvent('zync:alert', { detail: { message: '📄 Please upload your resume in your profile before applying.' } }));
                              onNavigate('dashboard');
                              return;
                            }
                            
                            sessionStorage.setItem('selectedJob', JSON.stringify({
                              _id: jid2, id: jid2,
                              jobTitle: job.jobTitle || job.title,
                              company: job.company,
                              location: job.location,
                              description: job.description,
                              salary: job.salary,
                              type: job.type,
                              jobData: job
                            }));
                            onNavigate('job-application');
                          } else {
                            sessionStorage.setItem('pendingJobApplication', JSON.stringify({
                              jobId: jid2,
                              jobTitle: job.jobTitle || job.title,
                              company: job.company,
                              jobData: job
                            }));
                            onNavigate('login');
                          }
                        }}
                        className="w-full bg-gray-600 text-white py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
                      >
                        {user && user.name ? 'Apply with Cover Letter' : 'Login to Apply'}
                      </button>
                    </>
                  )}
                </div>
                <p className="text-xs text-gray-500 text-center mt-2">
                  Posted {formatDetailedTime(job.createdAt || job.posted)}
                  {getPostingFreshness(job.createdAt) === 'new' && (
                    <span className="ml-2 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">
                      NEW
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Job Share Modal */}
      <JobShareModal 
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        job={job}
        user={user}
      />
    </div>
  );
};

export default JobDetailPage;
