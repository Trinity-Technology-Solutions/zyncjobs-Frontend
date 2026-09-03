import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const BASE = 'https://www.zyncjobs.com';

const SEO_MAP: Record<string, { title: string; description: string }> = {
  '/':                          { title: 'ZyncJobs | AI-Powered Job Portal for Job Seekers & Employers',            description: 'ZyncJobs is an AI-powered job portal for job seekers and employers. Find jobs, hire talent, post openings, connect with candidates, and recruit smarter.' },
  '/candidate-search':          { title: 'ZyncJobs | AI-Powered Candidate Search for Employers',                   description: 'Search and hire verified professionals with ZyncJobs. Browse talent profiles, filter by skills and location, connect with candidates, and hire faster.' },
  '/companies':                 { title: 'Explore Top Companies in India | ZyncJobs Verified Employers',            description: 'Search verified companies, read employee reviews, compare salaries, explore job openings, discover workplace insights, and find your ideal employer.' },
  '/my-jobs':                   { title: 'Posted Jobs Dashboard | Manage Job Listings on ZyncJobs',                 description: 'View and manage your posted jobs on ZyncJobs, track applications, review job listings, and easily edit or delete openings from your employer dashboard.' },
  '/job-posting-selection':     { title: 'Create & Post Jobs Online | ZyncJobs AI-Powered Hiring',                 description: 'Post jobs online with complete details, including title, salary, skills, location, and requirements, to attract quality applicants and recruit faster.' },
  '/candidate-register':        { title: 'Create Free Account & Find Jobs with AI | ZyncJobs',                        description: 'Create your free ZyncJobs candidate account in minutes. Get AI-powered job matching, one-click apply, resume builder, and get discovered by top companies.' },
  '/job-listings':              { title: 'Browse Jobs by Skill, Location & Experience | ZyncJobs',                 description: 'Discover thousands of job opportunities on ZyncJobs with advanced filters for location, experience, department, salary, work mode, skills, and industry.' },
  '/contact':                   { title: 'ZyncJobs | Contact Us - Employer & Candidate Support',                   description: 'Connect with the ZyncJobs team for support, account help, hiring queries, technical assistance, troubleshooting, and fast responses from our expert team.' },
  '/employers':                 { title: 'ZyncJobs | AI-Powered Candidate Search for Employers',                   description: 'Find and hire the right professionals across every industry with ZyncJobs. Post jobs, search candidates, connect with verified talent, and recruit smarter.' },
  '/dashboard':                 { title: 'ZyncJobs | Hiring Analytics and Recruitment Tools',                       description: 'Track jobs, applications, interviews, and hires from your ZyncJobs employer dashboard. Manage candidate activity, review performance, and post new jobs easily.' },
  '/interview-tips':            { title: 'Interview Tips and Mock Practice | ZyncJobs Career Guide',                description: 'Get expert interview tips, sample questions, and mock interview practice to boost your confidence and performance on the ZyncJobs career support platform.' },
  '/about':                     { title: 'About ZyncJobs | AI-Powered Job Search and Hiring Platform',              description: 'Learn more about ZyncJobs, an AI-powered career platform helping job seekers find jobs, build skills, prepare for interviews, and employers hire faster today.' },
  '/why-zyncjobs':              { title: 'Why Choose ZyncJobs? | Job Search and Hiring Platform',                   description: "Explore benefits of ZyncJobs, including smart matching, career guidance, hiring tools, and transparent support for professionals and employer's platform." },
  '/help':                      { title: 'ZyncJobs Help Center | FAQs, Support and User Guides',                    description: 'Find answers to common questions about ZyncJobs accounts, job search, applications, hiring tools, privacy, and more in our Help Center. Visit ZyncJobs now.' },
  '/admin/login':               { title: 'ZyncJobs Administration Panel | Secure Login Access',                     description: 'Log in to the ZyncJobs control center to oversee administration, monitoring, and backend management tasks in real time and secure environment for employers.' },
  '/settings':                  { title: 'ZyncJobs Settings | Account, Privacy & Security Center',                 description: 'Manage your account information, password, privacy settings, and logout options from the ZyncJobs settings page for secure access and control dashboard.' },
  '/privacy-settings':          { title: 'ZyncJobs Privacy Settings | Data Control and Consent',                   description: 'Update privacy settings, review consent history, download your data, and manage account controls on ZyncJobs for secure account management and compliance.' },
  '/privacy':                   { title: 'Privacy Policy | ZyncJobs Data Protection and Privacy',                   description: 'Read ZyncJobs Privacy Policy to learn how we collect, use, protect, and share personal data, including cookies, AI processing, retention, and user rights.' },
  '/terms':                     { title: 'ZyncJobs Terms of Service | User and Employer Rules',                     description: 'Learn about account rules, employer responsibilities, data handling, prohibited conduct, and service conditions on ZyncJobs platform updates and policies.' },
  '/recruiter-actions':         { title: 'ZyncJobs Recruiter Dashboard | Activity & Job Invites',                  description: 'Monitor recruiter engagement, profile views, and job invites in one place on your ZyncJobs profile dashboard for tracking performance and hiring activity.' },
  '/job-management':            { title: 'Manage Job Postings | ZyncJobs Recruitment Platform',                    description: 'Manage your job postings on ZyncJobs with search, filters, sorting, and response tracking. Post your first job and start hiring faster on the ZyncJobs platform.' },
  '/job-parsing':               { title: 'AI Job Parser Tool | AI-Powered Recruitment Portal',                     description: 'Use AI to convert job descriptions into structured postings, review extracted details, and publish jobs quickly on ZyncJobs platform for faster hiring.' },
  '/job-posting':               { title: 'Employer Job Posting | ZyncJobs AI-Powered Hiring Platform',             description: 'Set up your job posting with title, location type, company, category, and experience requirements on the ZyncJobs platform to hire faster and smarter.' },
  '/alerts':                    { title: 'ZyncJobs Job Alerts | Stay Updated on New Openings',                      description: 'Manage your job alerts in one place and get notified when new roles match your search criteria on ZyncJobs for faster job discovery and updates today.' },
  '/candidate-ranking':         { title: 'Candidate Ranking & Matching | Find Your Best Candidate',                description: "Search applicants, view match scores, and manage hiring decisions faster with ZyncJobs' candidate ranking system for smarter, faster hiring decisions." },
  '/candidate-messages':        { title: 'ZyncJobs Messages | Chat with Employers and Candidates',                  description: 'Manage recruiter and candidate conversations in one place with the ZyncJobs messaging inbox for faster communication and better hiring coordination teams.' },
  '/interviews':                { title: 'Interview Scheduling | ZyncJobs Recruitment Portal',                     description: 'Organize and schedule interviews easily from your ZyncJobs dashboard, and keep your hiring process moving smoothly with better coordination and faster speed.' },
  '/my-applications':           { title: 'Job Applications Dashboard | Manage Your Job Search',                    description: "Track your job applications on ZyncJobs by status, view progress, and browse jobs when you're ready to apply for new opportunities and career growth now." },
  '/forgot-password':           { title: 'Reset Password | Account Recovery and Login Support',                    description: 'Forgot your password? Enter your email to get a reset link and quickly restore access to your ZyncJobs account securely and regain access fast now today.' },
  '/employer-register-complete':{ title: 'ZyncJobs Company Setup | Employer Profile Creation',                      description: 'Set up your company profile on ZyncJobs to access the employer dashboard, post jobs instantly, and start connecting with top talent faster and more easily now.' },
  '/ai-recruiter':              { title: 'AI Hiring Assistant | ZyncJobs Recruitment Platform',                    description: 'Use the AI Recruiter Assistant on ZyncJobs to optimize job postings, analyze candidates, generate interview questions, write descriptions, and automate tasks.' },
  '/resume-help':               { title: 'Resume Writing Guide | ZyncJobs Career Tips and Resources',              description: 'Create a better resume with expert tips on formatting, skills, achievements, and tailoring your resume for each job to improve interview chances fast.' },
  '/resume-builder':            { title: 'ATS-Friendly Resume Builder - Create With ZyncJobs',                     description: 'Select from ATS-optimized resume templates on ZyncJobs and build a clean, professional resume with layouts designed to pass applicant tracking systems.' },
};

const SEOHead = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    let seo = SEO_MAP[pathname] || SEO_MAP['/'];

    // Fix /dashboard title based on actual user type
    if (pathname === '/dashboard') {
      try {
        const stored = localStorage.getItem('user');
        const userType = stored ? (JSON.parse(stored).userType || JSON.parse(stored).role || JSON.parse(stored).type) : '';
        if (userType === 'candidate' || userType === 'jobseeker') {
          seo = { title: 'Candidate Dashboard | Manage Your Profile on ZyncJobs', description: 'View and manage your profile, applications, interviews, and job recommendations from your ZyncJobs candidate dashboard.' };
        }
      } catch { /* use default */ }
    }
    const canonical = `${BASE}${pathname === '/' ? '' : pathname}` || BASE;

    // Title
    document.title = seo.title;

    // Description
    let desc = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!desc) { desc = document.createElement('meta'); desc.setAttribute('name', 'description'); document.head.appendChild(desc); }
    desc.setAttribute('content', seo.description);

    // Canonical
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) { link = document.createElement('link'); link.setAttribute('rel', 'canonical'); document.head.appendChild(link); }
    link.setAttribute('href', canonical);

    // OG
    let ogUrl = document.querySelector('meta[property="og:url"]') as HTMLMetaElement | null;
    if (!ogUrl) { ogUrl = document.createElement('meta'); ogUrl.setAttribute('property', 'og:url'); document.head.appendChild(ogUrl); }
    ogUrl.setAttribute('content', canonical);

    let ogTitle = document.querySelector('meta[property="og:title"]') as HTMLMetaElement | null;
    if (!ogTitle) { ogTitle = document.createElement('meta'); ogTitle.setAttribute('property', 'og:title'); document.head.appendChild(ogTitle); }
    ogTitle.setAttribute('content', seo.title);

    let ogDesc = document.querySelector('meta[property="og:description"]') as HTMLMetaElement | null;
    if (!ogDesc) { ogDesc = document.createElement('meta'); ogDesc.setAttribute('property', 'og:description'); document.head.appendChild(ogDesc); }
    ogDesc.setAttribute('content', seo.description);
  }, [pathname]);

  return null;
};

export default SEOHead;
