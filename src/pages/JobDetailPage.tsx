import React, { useState, useEffect } from 'react';
import { MapPin, Briefcase, Clock, DollarSign, Building, Share2, X, CheckCircle } from 'lucide-react';
import { API_ENDPOINTS } from '../config/constants';
import { getCompanyLogo } from '../utils/logoUtils';
import { formatJobDescription } from '../utils/textUtils';
import QuickApplyButton from '../components/QuickApplyButton';
import BackButton from '../components/BackButton';

interface JobDetailPageProps {
  onNavigate: (page: string, data?: any) => void;
  jobTitle?: string;
  jobId?: number;
  companyName?: string;
  user?: any;
  onLogout?: () => void;
  jobData?: any;
}

const JobDetailPage: React.FC<JobDetailPageProps> = ({ onNavigate, jobTitle, jobId, companyName, user, onLogout, jobData }) => {
  const [job, setJob] = useState<any>(null);
  const [jobPoster, setJobPoster] = useState<any>(null);
  const [similarJobs, setSimilarJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState<string>('');

  const getCompanyLogo = (job: any) => {
    const company = job.company || job.companyName || 'Company';
    
    // For Trinity companies, use local logo
    if (company.toLowerCase().includes('trinity')) {
      return '/images/trinity-logo.webp';
    }
    
    // For Google, use a working Google logo URL
    if (company.toLowerCase().includes('google')) {
      return 'https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png';
    }
    
    // For other major companies, use simple fallback
    if (company.toLowerCase().includes('microsoft')) {
      return 'https://img-prod-cms-rt-microsoft-com.akamaized.net/cms/api/am/imageFileData/RE1Mu3b?ver=5c31';
    }
    
    // Always fallback to ZyncJobs logo
    return '/images/zync-logo.svg';
  };

  const getJobSpecificContent = (jobTitle: string) => {
    const title = (jobTitle || '').toLowerCase();
    
    if (title.includes('crypto') || title.includes('pki') || title.includes('architect')) {
      return {
        experience: '5-8 years',
        responsibilities: [
          'Design and implement cryptographic solutions and PKI architectures',
          'Develop secure key management systems and certificate lifecycle processes',
          'Collaborate with security teams to ensure compliance with industry standards',
          'Lead technical reviews and provide guidance on cryptographic best practices'
        ],
        requirements: [
          'Master\'s degree in Computer Science, Cybersecurity, or related field',
          '5+ years of experience in cryptography and PKI implementation',
          'Strong expertise in X.509 certificates, HSMs, and cryptographic protocols',
          'Experience with security frameworks and compliance standards (FIPS, Common Criteria)'
        ],
        benefits: [
          'Competitive salary with performance bonuses',
          'Comprehensive health and security clearance benefits',
          'Professional development and certification opportunities',
          'Flexible work arrangements with security-compliant remote options'
        ]
      };
    }
    
    if (title.includes('developer') || title.includes('engineer') || title.includes('software')) {
      return {
        experience: '3-5 years',
        responsibilities: [
          'Design, develop, and maintain high-quality software solutions',
          'Collaborate with cross-functional teams to deliver innovative projects',
          'Write clean, efficient, and well-documented code',
          'Participate in code reviews and technical discussions'
        ],
        requirements: [
          'Bachelor\'s degree in Computer Science or related field',
          '3+ years of professional experience in software development',
          'Strong expertise in JavaScript, Python, React, Node.js, SQL, Git, AWS, Docker',
          'Experience with agile development methodologies'
        ],
        benefits: [
          'Competitive salary and equity package',
          'Comprehensive health, dental, and vision insurance',
          'Flexible work arrangements and remote work options',
          'Professional development and learning opportunities'
        ]
      };
    }
    
    if (title.includes('marketing') || title.includes('digital')) {
      return {
        experience: '2-4 years',
        responsibilities: [
          'Develop and execute comprehensive marketing strategies',
          'Manage digital marketing campaigns across multiple channels',
          'Analyze market trends and customer behavior data',
          'Collaborate with creative teams to produce engaging content'
        ],
        requirements: [
          'Bachelor\'s degree in Marketing, Communications, or related field',
          '2+ years of experience in digital marketing',
          'Proficiency in Google Analytics, SEO, SEM, and social media platforms',
          'Strong analytical and creative problem-solving skills'
        ],
        benefits: [
          'Competitive salary with performance incentives',
          'Health insurance and wellness programs',
          'Creative work environment with flexible hours',
          'Professional development and conference attendance'
        ]
      };
    }
    
    if (title.includes('sales') || title.includes('account')) {
      return {
        experience: '2-5 years',
        responsibilities: [
          'Generate new business opportunities and manage client relationships',
          'Develop and execute sales strategies to meet revenue targets',
          'Conduct product demonstrations and negotiate contracts',
          'Maintain accurate sales forecasts and pipeline management'
        ],
        requirements: [
          'Bachelor\'s degree in Business, Sales, or related field',
          '2+ years of proven sales experience with track record of success',
          'Excellent communication and negotiation skills',
          'Experience with CRM software and sales analytics tools'
        ],
        benefits: [
          'Base salary plus commission and bonus structure',
          'Comprehensive benefits package including health insurance',
          'Car allowance and travel expense reimbursement',
          'Sales incentive trips and recognition programs'
        ]
      };
    }
    
    // Default fallback
    return {
      experience: '2-4 years',
      responsibilities: [
        'Execute key responsibilities aligned with role requirements',
        'Collaborate effectively with team members and stakeholders',
        'Contribute to project success and organizational goals',
        'Maintain high standards of quality and professionalism'
      ],
      requirements: [
        'Bachelor\'s degree or equivalent experience in relevant field',
        '2+ years of professional experience in related role',
        'Strong communication and problem-solving skills',
        'Ability to work independently and as part of a team'
      ],
      benefits: [
        'Competitive salary and benefits package',
        'Health insurance and retirement plans',
        'Professional development opportunities',
        'Collaborative and supportive work environment'
      ]
    };
  };

  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        // If jobData is passed from LatestJobs, use it directly
        if (jobData) {
          setJob(jobData);
          
          // Check if user has applied to this job
          if (user?.email && jobData._id) {
            await checkApplicationStatus(jobData._id, user.email);
          }
          
          // Fetch job poster info based on employerEmail
          if (jobData.employerEmail || jobData.postedBy) {
            const usersResponse = await fetch(API_ENDPOINTS.USERS);
            if (usersResponse.ok) {
              const users = await usersResponse.json();
              const poster = users.find((user: any) => 
                user.email === (jobData.employerEmail || jobData.postedBy)
              );
              console.log('Looking for employer with email:', jobData.employerEmail || jobData.postedBy);
              console.log('Found job poster:', poster);
              setJobPoster(poster);
            }
          }
          
          setLoading(false);
          
          // Fetch similar jobs
          fetchSimilarJobs(jobData);
          return;
        }
        
        if (jobId) {
          // Fetch job details
          const jobResponse = await fetch(`${API_ENDPOINTS.JOBS}/${jobId}`);
          if (jobResponse.ok) {
            const jobData = await jobResponse.json();
            setJob(jobData);
            
            // Check if user has applied to this job
            if (user?.email && jobData._id) {
              await checkApplicationStatus(jobData._id, user.email);
            }
            
            // Fetch job poster (employer who posted this job)
            const usersResponse = await fetch(API_ENDPOINTS.USERS);
            if (usersResponse.ok) {
              const users = await usersResponse.json();
              const poster = users.find((user: any) => 
                user.email === jobData.employerEmail || user.email === jobData.postedBy
              );
              console.log('Looking for employer with email:', jobData.employerEmail || jobData.postedBy);
              console.log('Found job poster:', poster);
              setJobPoster(poster);
            }
          }
        } else {
          // Fallback to default job data
          const defaultJob = {
            id: 1,
            title: jobTitle || "Senior Frontend Developer",
            company: companyName || "TechCorp Inc.",
            location: "San Francisco, CA",
            type: "Full-time",
            salary: "$120,000 - $180,000",
            experience: "3-5 years",
            posted: "2 days ago",
            description: "We are looking for a talented Senior Frontend Developer to join our dynamic team.",
            responsibilities: [
              "Develop and maintain responsive web applications using React and TypeScript",
              "Collaborate with designers and backend developers to implement new features",
              "Optimize applications for maximum speed and scalability"
            ],
            requirements: [
              "Bachelor's degree in Computer Science or related field",
              "3+ years of experience with React and JavaScript/TypeScript",
              "Strong understanding of HTML5, CSS3, and responsive design"
            ],
            skills: ["React", "TypeScript", "JavaScript", "HTML5", "CSS3", "Redux", "Git"],
            benefits: [
              "Competitive salary and equity package",
              "Comprehensive health, dental, and vision insurance",
              "Flexible work arrangements and remote work options"
            ]
          };
          
          // Ensure all required arrays exist with defaults
          defaultJob.responsibilities = defaultJob.responsibilities || [];
          defaultJob.requirements = defaultJob.requirements || [];
          defaultJob.skills = defaultJob.skills || [];
          defaultJob.benefits = defaultJob.benefits || [];
          
          setJob(defaultJob);
        }
      } catch (error) {
        console.error('Error fetching job details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchJobDetails();
  }, [jobId, jobTitle, companyName, jobData]);

  const checkApplicationStatus = async (jobId: string, userEmail: string) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.APPLICATIONS}?candidateEmail=${userEmail}&jobId=${jobId}`);
      if (response.ok) {
        const applications = await response.json();
        const userApplication = applications.applications?.find((app: any) => 
          app.jobId?._id === jobId && app.candidateEmail === userEmail
        );
        
        if (userApplication) {
          setHasApplied(true);
          setApplicationStatus(userApplication.status);
        }
      }
    } catch (error) {
      console.error('Error checking application status:', error);
    }
  };

  const fetchSimilarJobs = async (currentJob: any) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/search/similar/${currentJob._id}`);
      if (response.ok) {
        const similarJobsData = await response.json();
        setSimilarJobs(similarJobsData.slice(0, 3));
      } else {
        // Fallback to regular jobs API
        const response = await fetch(API_ENDPOINTS.JOBS);
        if (response.ok) {
          const allJobs = await response.json();
          const similar = allJobs
            .filter((j: any) => j._id !== currentJob._id)
            .slice(0, 3);
          setSimilarJobs(similar);
        }
      }
    } catch (error) {
      console.error('Error fetching similar jobs:', error);
    }
  };

  const handleReapply = async () => {
    try {
      if (!user?.email) {
        alert('User email not found. Please login again.');
        return;
      }

      // Find the withdrawn application and update it directly
      const response = await fetch(`${API_ENDPOINTS.APPLICATIONS}/candidate/${encodeURIComponent(user.email)}`);
      if (response.ok) {
        const applications = await response.json();
        const withdrawnApp = applications.find(app => 
          app.jobId._id === (job._id || jobId) && app.status === 'withdrawn'
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
            alert('Successfully reapplied to the job!');
          } else {
            alert('Failed to reapply. Please try again.');
          }
        } else {
          alert('No withdrawn application found for this job.');
        }
      } else {
        alert('Failed to find your applications. Please try again.');
      }
    } catch (error) {
      console.error('Error reapplying:', error);
      alert('Failed to reapply. Please try again.');
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
    <div className="min-h-screen bg-gray-50">
      {/* Job Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <BackButton 
            onClick={() => {
              console.log('🔙 Back button clicked');
              console.log('📊 User:', user);
              console.log('👤 User type:', user?.type, user?.userType);
              
              // Navigate based on user type and context
              try {
                if (user?.type === 'employer' || user?.userType === 'employer') {
                  // For employers, go back to my-jobs (their posted jobs)
                  console.log('🏢 Employer - navigating to my-jobs');
                  onNavigate('my-jobs');
                } else {
                  // For candidates and non-logged users, go to job-listings
                  console.log('👤 Candidate/Guest - navigating to job-listings');
                  onNavigate('job-listings');
                }
              } catch (error) {
                console.error('❌ Navigation error:', error);
                // Fallback to job-listings
                try {
                  onNavigate('job-listings');
                } catch (fallbackError) {
                  console.error('❌ Fallback navigation error:', fallbackError);
                  // Final fallback - reload to home
                  window.location.href = '/';
                }
              }
            }}
            text={`Back to ${user?.type === 'employer' || user?.userType === 'employer' ? 'My Jobs' : 'Jobs'}`}
            className="mb-4"
          />

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start space-x-4 flex-1">
              <div className="w-16 h-16 rounded-lg bg-blue-100 flex items-center justify-center p-2">
                <img
                  src={getCompanyLogo(job)}
                  alt={job.company}
                  className="w-full h-full object-contain rounded"
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    img.src = '/images/zync-logo.svg';
                  }}
                />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{job.jobTitle || job.title}</h1>
                <div className="flex items-center space-x-2 text-lg text-blue-600 font-medium mb-4">
                  <Building className="w-5 h-5" />
                  <span>{job.company}</span>
                </div>
                
                <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4" />
                    <span>{job.location}</span>
                  </div>
                  {job.type && (
                    <div className="flex items-center space-x-2">
                      <Briefcase className="w-4 h-4" />
                      <span>{job.type}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <span>{typeof job.salary === 'object' ? `${job.salary.currency === 'INR' ? '₹' : job.salary.currency === 'USD' ? '$' : job.salary.currency || '₹'}${job.salary.min?.toLocaleString()}-${job.salary.max?.toLocaleString()} ${job.salary.period || 'per year'}` : (job.salary || 'Competitive')}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span>{job.experience || job.experienceLevel || getJobSpecificContent(job.jobTitle || job.title).experience} experience</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 lg:mt-0 flex items-center space-x-3">
              {/* Always show share button for testing */}
              <button 
                onClick={() => setShowShareModal(true)}
                className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors flex items-center space-x-2"
              >
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </button>
              
              {/* Apply buttons - Hide for employers */}
              {user?.type !== 'employer' && user?.userType !== 'employer' && (
                <div className="flex items-center space-x-3">
                  {hasApplied ? (
                    applicationStatus === 'withdrawn' ? (
                      <button 
                        onClick={handleReapply}
                        className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center space-x-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Reapply</span>
                      </button>
                    ) : (
                      <div className="flex items-center space-x-2 bg-green-100 text-green-800 px-6 py-3 rounded-lg font-semibold">
                        <CheckCircle className="w-4 h-4" />
                        <span>Applied ({applicationStatus === 'withdrawn' ? 'நீங்கள் திரும்பப் பெற்றுள்ளீர்கள்' : applicationStatus})</span>
                      </div>
                    )
                  ) : (
                    <>
                      {/* Quick Apply Button - Always show for logged in users */}
                      <QuickApplyButton
                        jobId={job._id || jobId}
                        jobTitle={job.jobTitle || job.title}
                        company={job.company}
                        user={user}
                        onSuccess={() => {
                          setHasApplied(true);
                          setApplicationStatus('applied');
                          alert('Quick application submitted!');
                        }}
                      />
                      
                      {/* Regular Apply Button */}
                      <button 
                        onClick={() => {
                          if (user && (user.name || user.fullName)) {
                            // User is logged in - go directly to application page
                            localStorage.setItem('selectedJob', JSON.stringify({
                              _id: job._id || jobId,
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
                            // User is not logged in - store job data and go to login
                            localStorage.setItem('pendingJobApplication', JSON.stringify({
                              jobId: job._id || jobId,
                              jobTitle: job.jobTitle || job.title,
                              company: job.company,
                              jobData: job
                            }));
                            onNavigate('login');
                          }
                        }}
                        className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
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

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Description */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Job Description</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                {formatJobDescription(
                  job.jobDescription || job.description || 'Job description not available.',
                  typeof job.salary === 'object' ? job.salary.currency : undefined
                )}
              </p>
              
              {/* Created By & On Details */}
              <div className="border-t border-gray-100 pt-4 mt-4">
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <span className="font-medium">Created By:</span>
                    <span>{job.postedBy || jobPoster?.name || jobPoster?.fullName || 'System'}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="font-medium">On:</span>
                    <span>{job.createdAt ? new Date(job.createdAt).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: '2-digit', 
                      day: '2-digit' 
                    }) : '01/16/26'}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="font-medium">Company:</span>
                    <span>{job.employerCompany || jobPoster?.company || job.company}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Responsibilities */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Key Responsibilities</h2>
              <ul className="space-y-3">
                {(() => {
                  // Try to get responsibilities from separate field first
                  if (job.responsibilities && job.responsibilities.length > 0) {
                    return Array.isArray(job.responsibilities) ? job.responsibilities.map((responsibility, index) => (
                      <li key={index} className="flex items-start">
                        <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        <span className="text-gray-600">{responsibility}</span>
                      </li>
                    )) : (
                      <li className="flex items-start">
                        <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        <span className="text-gray-600">{job.responsibilities}</span>
                      </li>
                    );
                  }
                  
                  // Extract from description if separate field not available
                  const description = job.jobDescription || job.description || '';
                  const responsibilitiesMatch = description.match(/(?:key\s+)?responsibilities?[:\s]*([\s\S]*?)(?=(?:required\s+qualifications?|requirements?|qualifications?|what\s+we\s+offer|benefits?|$))/gi);
                  
                  if (responsibilitiesMatch && responsibilitiesMatch[0]) {
                    const section = responsibilitiesMatch[0];
                    const bulletPoints = section.match(/•\s*(.+)/g);
                    
                    if (bulletPoints) {
                      return bulletPoints.map((point, index) => {
                        const cleaned = point.replace(/^•\s*/, '').trim();
                        return (
                          <li key={index} className="flex items-start">
                            <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                            <span className="text-gray-600">{cleaned}</span>
                          </li>
                        );
                      });
                    }
                  }
                  
                  // Fallback
                  return (
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span className="text-gray-600">Responsibilities will be discussed during the interview process.</span>
                    </li>
                  );
                })()}
              </ul>
            </div>

            {/* Requirements */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Requirements</h2>
              <ul className="space-y-3">
                {(() => {
                  // Try to get requirements from separate field first
                  if (job.requirements && job.requirements.length > 0) {
                    return Array.isArray(job.requirements) ? job.requirements.map((requirement, index) => (
                      <li key={index} className="flex items-start">
                        <span className="w-2 h-2 bg-green-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        <span className="text-gray-600">{requirement}</span>
                      </li>
                    )) : (
                      <li className="flex items-start">
                        <span className="w-2 h-2 bg-green-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        <span className="text-gray-600">{job.requirements}</span>
                      </li>
                    );
                  }
                  
                  // Extract from description if separate field not available
                  const description = job.jobDescription || job.description || '';
                  const requirementsMatch = description.match(/(?:required\s+qualifications?|requirements?|qualifications?)[:\s]*([\s\S]*?)(?=(?:what\s+we\s+offer|benefits?|join\s+our\s+team|$))/gi);
                  
                  if (requirementsMatch && requirementsMatch[0]) {
                    const section = requirementsMatch[0];
                    const bulletPoints = section.match(/•\s*(.+)/g);
                    
                    if (bulletPoints) {
                      return bulletPoints.map((point, index) => {
                        const cleaned = point.replace(/^•\s*/, '').trim();
                        return (
                          <li key={index} className="flex items-start">
                            <span className="w-2 h-2 bg-green-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                            <span className="text-gray-600">{cleaned}</span>
                          </li>
                        );
                      });
                    }
                  }
                  
                  // Fallback to skills if available
                  if (job.skills && Array.isArray(job.skills) && job.skills.length > 0) {
                    return job.skills.map((skill, index) => (
                      <li key={index} className="flex items-start">
                        <span className="w-2 h-2 bg-green-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        <span className="text-gray-600">Experience with {skill}</span>
                      </li>
                    ));
                  }
                  
                  // Final fallback
                  return (
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-green-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span className="text-gray-600">Requirements will be discussed during the interview process.</span>
                    </li>
                  );
                })()}
              </ul>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Job Poster */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact the Job Poster</h3>
              <div className="flex items-center space-x-3 mb-4">
                <img
                  src={getCompanyLogo(job)}
                  alt={jobPoster?.name || job.company}
                  className="w-12 h-12 rounded-full object-contain border border-gray-200 bg-white p-1"
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    img.src = '/images/zync-logo.svg';
                  }}
                />
                <div>
                  <p className="font-semibold text-gray-900">
                    {jobPoster?.name || job.employerName || 'Hiring Manager'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {jobPoster?.company || job.employerCompany || job.company}
                  </p>
                  <p className="text-sm text-gray-500">Recruiter</p>
                  <p className="text-xs text-gray-400">Posting for: {job.company}</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  if (jobPoster && (jobPoster.id || jobPoster._id)) {
                    // Navigate to employer profile page
                    onNavigate('employer-profile', { 
                      employerId: jobPoster.id || jobPoster._id,
                      employerData: jobPoster 
                    });
                  } else {
                    // Show modal with available employer info
                    alert(`Employer Information:\n\nName: ${jobPoster?.name || job.employerName || 'Hiring Manager'}\nCompany: ${jobPoster?.company || job.employerCompany || job.company}\nEmail: ${job.employerEmail || 'Not available'}\n\nNote: Full profile not available for this employer.`);
                  }
                }}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center transition-colors"
              >
                View Profile
                <span className="ml-1">→</span>
              </button>
            </div>

            {/* Skills */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Required Skills</h3>
              <div className="flex flex-wrap gap-2">
                {Array.isArray(job.skills) ? job.skills.map((skill, index) => (
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
                  Array.isArray(job.benefits) ? job.benefits.map((benefit, index) => (
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
              <div className="space-y-4">
                {similarJobs.length > 0 ? (
                  similarJobs.map((similarJob, index) => (
                    <div key={similarJob._id} className="border-b border-gray-100 pb-3 last:border-b-0">
                      <h4 
                        className="font-medium text-blue-600 hover:text-blue-700 cursor-pointer text-sm mb-1"
                        onClick={() => onNavigate && onNavigate('job-detail', { 
                          jobTitle: similarJob.jobTitle, 
                          jobId: similarJob._id, 
                          companyName: similarJob.company,
                          jobData: similarJob
                        })}
                      >
                        {similarJob.jobTitle}
                      </h4>
                      <p className="text-sm text-gray-600">{similarJob.company}</p>
                      <p className="text-xs text-gray-500">
                        {similarJob.location} • {typeof similarJob.salary === 'object' 
                          ? `${similarJob.salary.currency === 'INR' ? '₹' : similarJob.salary.currency === 'USD' ? '$' : similarJob.salary.currency || '₹'}${similarJob.salary.min?.toLocaleString()}-${similarJob.salary.max?.toLocaleString()}` 
                          : 'Competitive salary'}
                      </p>
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
                        <span>Applied ({applicationStatus === 'withdrawn' ? 'நீங்கள் திரும்பப் பெற்றுள்ளீர்கள்' : applicationStatus})</span>
                      </div>
                    )
                  ) : (
                    <>
                      {/* Quick Apply Button */}
                      {user && (user.name || user.fullName) && (
                        <QuickApplyButton
                          jobId={job._id || jobId}
                          jobTitle={job.jobTitle || job.title}
                          company={job.company}
                          user={user}
                          onSuccess={() => {
                            setHasApplied(true);
                            setApplicationStatus('applied');
                            alert('Quick application submitted!');
                          }}
                          className="w-full justify-center"
                        />
                      )}
                      
                      {/* Regular Apply Button */}
                      <button 
                        onClick={() => {
                          if (user && user.name) {
                            // User is logged in - go directly to application page
                            localStorage.setItem('selectedJob', JSON.stringify({
                              _id: job._id || jobId,
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
                            // User is not logged in - store job data and go to login
                            localStorage.setItem('pendingJobApplication', JSON.stringify({
                              jobId: job._id || jobId,
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
                <p className="text-xs text-gray-500 text-center mt-2">Posted {job.posted}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Share this job</h3>
              <button 
                onClick={() => setShowShareModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-3">
              {/* LinkedIn */}
              <button
                onClick={() => {
                  const url = encodeURIComponent(window.location.href);
                  const jobTitle = job.jobTitle || job.title;
                  const company = job.company;
                  const location = job.location;
                  const salary = typeof job.salary === 'object' ? `${job.salary.currency || '$'}${job.salary.min}-${job.salary.max} ${job.salary.period || 'per year'}` : (job.salary || 'Competitive salary');
                  const experience = job.experience;
                  const jobType = job.type;
                  
                  // Different content based on user type
                  const postContent = user?.type === 'employer' || user?.userType === 'employer' ? 
                    // Employer sharing their job posting
                    `🚀 We're Hiring! Join Our Team!

🎯 ${jobTitle}
🏢 ${company}
📍 ${location}
💰 ${salary}
⏰ ${jobType}
🎯 Experience: ${experience}

📋 What you'll do:
${job.description?.substring(0, 200)}...

${job.skills && Array.isArray(job.skills) ? `🔧 We're looking for:
${job.skills.slice(0, 5).map(skill => `• ${skill}`).join('\n')}` : ''}

${job.benefits && Array.isArray(job.benefits) ? `✨ What we offer:
${job.benefits.slice(0, 3).map(benefit => `• ${benefit}`).join('\n')}` : ''}

💼 Ready to join our team? Apply now!

#WeAreHiring #JoinOurTeam #${company.replace(/\s+/g, '')} #${jobTitle.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '')} #CareerOpportunity #NowHiring

Apply here: ${window.location.href}` :
                    // Candidate sharing job opportunity
                    `💼 Found an interesting job opportunity that might be perfect for someone in my network!

🎯 ${jobTitle} at ${company}
📍 ${location}
💰 ${salary}
⏰ ${jobType}
🎯 Experience: ${experience}

📝 About the role:
${job.description?.substring(0, 200)}...

${job.skills && Array.isArray(job.skills) ? `🔧 Looking for:
${job.skills.slice(0, 5).map(skill => `• ${skill}`).join('\n')}` : ''}

${job.benefits && Array.isArray(job.benefits) ? `✨ What they offer:
${job.benefits.slice(0, 3).map(benefit => `• ${benefit}`).join('\n')}` : ''}

🤝 Know someone who'd be a great fit? Feel free to share!

#JobOpportunity #Hiring #${company.replace(/\s+/g, '')} #${jobTitle.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '')} #CareerOpportunity #JobAlert

Apply here: ${window.location.href}`;
                  
                  const encodedContent = encodeURIComponent(postContent);
                  window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}&text=${encodedContent}`, '_blank');
                  setShowShareModal(false);
                }}
                className="w-full flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                  <span className="text-white font-bold text-sm">in</span>
                </div>
                <span className="font-medium text-gray-900">Share on LinkedIn</span>
              </button>

              {/* Facebook */}
              <button
                onClick={() => {
                  const url = encodeURIComponent(window.location.href);
                  window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
                  setShowShareModal(false);
                }}
                className="w-full flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
                  <span className="text-white font-bold text-sm">f</span>
                </div>
                <span className="font-medium text-gray-900">Share on Facebook</span>
              </button>

              {/* Twitter */}
              <button
                onClick={() => {
                  const url = encodeURIComponent(window.location.href);
                  const jobTitle = job.jobTitle || job.title;
                  const company = job.company;
                  const location = job.location;
                  const salary = typeof job.salary === 'object' ? `${job.salary.currency || '$'}${job.salary.min}-${job.salary.max}` : (job.salary || 'Competitive');
                  
                  const tweetText = `💼 Spotted a great opportunity!

${jobTitle} at ${company}
📍 ${location}
💰 ${salary}

${job.skills && Array.isArray(job.skills) ? `Skills: ${job.skills.slice(0, 3).join(', ')}` : ''}

Might be perfect for someone in my network! 🤝

#JobAlert #Hiring #${company.replace(/\s+/g, '')} #Opportunity`;
                  
                  const encodedText = encodeURIComponent(tweetText);
                  window.open(`https://twitter.com/intent/tweet?url=${url}&text=${encodedText}`, '_blank');
                  setShowShareModal(false);
                }}
                className="w-full flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 bg-black rounded flex items-center justify-center">
                  <span className="text-white font-bold text-sm">X</span>
                </div>
                <span className="font-medium text-gray-900">Share on X (Twitter)</span>
              </button>

              {/* WhatsApp */}
              <button
                onClick={() => {
                  const jobTitle = job.jobTitle || job.title;
                  const company = job.company;
                  const location = job.location;
                  const salary = typeof job.salary === 'object' ? `${job.salary.currency || '$'}${job.salary.min}-${job.salary.max} ${job.salary.period || 'per year'}` : (job.salary || 'Competitive salary');
                  const experience = job.experience;
                  
                  const whatsappMessage = user?.type === 'employer' || user?.userType === 'employer' ?
                    // Employer sharing their job posting
                    `🚀 *We're Hiring!*

*Position:* ${jobTitle}
*Company:* ${company}
*Location:* ${location}
*Salary:* ${salary}
*Experience:* ${experience}

*About the role:*
${job.description?.substring(0, 200)}...

${job.skills && Array.isArray(job.skills) ? `*We're looking for:* ${job.skills.slice(0, 5).join(', ')}` : ''}

Interested? Apply now! 💼

${window.location.href}` :
                    // Candidate sharing job opportunity
                    `💼 *Found an interesting job opportunity!*

*Position:* ${jobTitle}
*Company:* ${company}
*Location:* ${location}
*Salary:* ${salary}
*Experience:* ${experience}

*About the role:*
${job.description?.substring(0, 200)}...

${job.skills && Array.isArray(job.skills) ? `*Skills they're looking for:* ${job.skills.slice(0, 5).join(', ')}` : ''}

Thought this might be perfect for someone in our group! 🤝

Check it out: ${window.location.href}`;
                  
                  const encodedMessage = encodeURIComponent(whatsappMessage);
                  window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
                  setShowShareModal(false);
                }}
                className="w-full flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 bg-green-500 rounded flex items-center justify-center">
                  <span className="text-white font-bold text-sm">W</span>
                </div>
                <span className="font-medium text-gray-900">Share on WhatsApp</span>
              </button>

              {/* Telegram */}
              <button
                onClick={() => {
                  const jobTitle = job.jobTitle || job.title;
                  const company = job.company;
                  const location = job.location;
                  const salary = typeof job.salary === 'object' ? `${job.salary.currency || '$'}${job.salary.min}-${job.salary.max} ${job.salary.period || 'per year'}` : (job.salary || 'Competitive salary');
                  
                  const telegramMessage = `💼 Found a great job opportunity!

🎯 ${jobTitle} at ${company}
📍 Location: ${location}
💰 Salary: ${salary}

${job.description?.substring(0, 150)}...

Might be perfect for someone here! 🤝

Check it out: ${window.location.href}`;
                  
                  const encodedMessage = encodeURIComponent(telegramMessage);
                  window.open(`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodedMessage}`, '_blank');
                  setShowShareModal(false);
                }}
                className="w-full flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 bg-blue-400 rounded flex items-center justify-center">
                  <span className="text-white font-bold text-sm">T</span>
                </div>
                <span className="font-medium text-gray-900">Share on Telegram</span>
              </button>

              {/* Email */}
              <button
                onClick={() => {
                  const jobTitle = job.jobTitle || job.title;
                  const company = job.company;
                  const location = job.location;
                  const salary = typeof job.salary === 'object' ? `${job.salary.currency || '$'}${job.salary.min}-${job.salary.max} ${job.salary.period || 'per year'}` : (job.salary || 'Competitive salary');
                  
                  const subject = `Thought you might be interested: ${jobTitle} at ${company}`;
                  const body = `Hi,

I came across this job opportunity and thought it might be a great fit for you or someone you know:

💼 Position: ${jobTitle}
🏢 Company: ${company}
📍 Location: ${location}
💰 Salary: ${salary}

About the role:
${job.description?.substring(0, 300)}...

${job.skills && Array.isArray(job.skills) ? `They're looking for skills in: ${job.skills.join(', ')}` : ''}

If you're interested or know someone who might be, you can check out the full details and apply here: ${window.location.href}

Hope this helps!

Best regards`;
                  
                  window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
                  setShowShareModal(false);
                }}
                className="w-full flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 bg-red-500 rounded flex items-center justify-center">
                  <span className="text-white font-bold text-sm">@</span>
                </div>
                <span className="font-medium text-gray-900">Share via Email</span>
              </button>

              {/* Copy Link */}
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Link copied to clipboard!');
                  setShowShareModal(false);
                }}
                className="w-full flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 bg-gray-600 rounded flex items-center justify-center">
                  <span className="text-white font-bold text-sm">🔗</span>
                </div>
                <span className="font-medium text-gray-900">Copy Link</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobDetailPage;