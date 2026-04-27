import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const BASE = 'https://www.zyncjobs.com';

const SEO_MAP: Record<string, { title: string; description: string }> = {
  '/':                          { title: 'ZyncJobs | AI-Powered Job Portal for Job Seekers and Employers',          description: 'Discover jobs faster with ZyncJobs, an AI-powered job portal and job search platform. Search job openings, browse jobs, and post jobs with ease.' },
  '/candidate-search':          { title: 'ZyncJobs Candidate Search | Find Verified Talent Fast',                   description: 'Search and hire verified professionals with ZyncJobs. Browse talent profiles, filter by skills and location, and find the right candidates.' },
  '/companies':                 { title: 'Explore Top Companies in India | ZyncJobs Verified Employers',            description: 'Search verified companies, view reviews, check salaries, and explore current job openings on ZyncJobs to find your ideal employer.' },
  '/my-jobs':                   { title: 'Posted Jobs Dashboard | Manage Job Listings on ZyncJobs',                 description: 'View and manage your posted jobs on ZyncJobs, track applications, review job listings, and easily edit or delete openings from your employer dashboard.' },
  '/job-posting-selection':     { title: 'New Job Posting | ZyncJobs Hiring Platform',                              description: 'Add job title, description, skills, location, and salary to reach more candidates and hire faster with ZyncJobs.' },
  '/role-selection':            { title: 'ZyncJobs Job Portal | Find Jobs and Hire Talent',                         description: 'Find your next job or hire top talent with ZyncJobs. Create a candidate profile, post jobs, access verified listings, and use AI-powered matching to connect faster.' },
  '/job-listings':              { title: 'Browse Jobs by Skill, Location & Experience | ZyncJobs',                 description: 'Search thousands of job openings on ZyncJobs using filters for location, experience, department, salary, and work mode.' },
  '/contact':                   { title: 'Contact Us | ZyncJobs',                                                   description: 'Connect with the ZyncJobs team for support, account help, or hiring queries with quick responses and dedicated assistance.' },
  '/employers':                 { title: 'Search Candidates and Hire Talent | ZyncJobs',                            description: 'Find and hire the right professionals across every field with ZyncJobs. Post a job, search candidates, and connect with verified talent using AI-powered matching.' },
  '/dashboard':                 { title: 'Employer Dashboard | Manage Hiring on ZyncJobs',                          description: 'Track jobs, applications, interviews, and hires from your ZyncJobs employer dashboard. Manage candidate activity, review performance, and post new jobs easily.' },
  '/interview-tips':            { title: 'Interview Tips and Mock Practice | ZyncJobs Career Guide',                description: 'Get expert interview tips, sample questions, and mock interview practice to improve your confidence and performance.' },
  '/about':                     { title: 'About ZyncJobs | AI-Powered Job Search and Hiring Platform',              description: 'Learn more about ZyncJobs, an AI-powered career platform that helps job seekers find jobs, improve skills, prepare for interviews, and helps employers hire faster.' },
  '/why-zyncjobs':              { title: 'Why Choose ZyncJobs? | Job Search and Hiring Platform',                   description: 'Explore the benefits of ZyncJobs, including smart matching, career guidance, hiring tools, and transparent support for professionals and employers.' },
  '/help':                      { title: 'ZyncJobs Help Center | FAQs, Support & Guides',                          description: 'Find answers to common questions about ZyncJobs accounts, job search, applications, hiring tools, privacy, and more in our Help Center.' },
  '/admin/login':               { title: 'Admin Panel Sign In | ZyncJobs',                                          description: 'Log in to the ZyncJobs control center to oversee administration, monitoring, and backend management tasks.' },
  '/settings':                  { title: 'ZyncJobs Settings | Account, Privacy & Security',                        description: 'Manage your account information, password, privacy settings, and logout options from the ZyncJobs settings page.' },
  '/privacy-settings':          { title: 'ZyncJobs Privacy Settings | Data Control and Consent',                   description: 'Update privacy settings, review consent history, download your data, and manage account controls on ZyncJobs.' },
  '/privacy':                   { title: 'Privacy Policy | ZyncJobs Data Protection and Privacy',                   description: 'Read ZyncJobs Privacy Policy to learn how we collect, use, protect, and share personal data, including cookies, AI processing, retention, and user rights.' },
  '/terms':                     { title: 'ZyncJobs Terms of Service | User and Employer Rules',                     description: 'Learn about account rules, employer responsibilities, data handling, prohibited conduct, and service conditions on ZyncJobs.' },
  '/recruiter-actions':         { title: 'Recruiter Activity Dashboard | ZyncJobs',                                 description: 'Monitor recruiter engagement, profile views, and job invites in one place on your ZyncJobs profile dashboard.' },
  '/job-management':            { title: 'Manage Job Postings | ZyncJobs Hiring Portal',                            description: 'Manage your job postings on ZyncJobs with search, filters, sorting, and response tracking. Post your first job and start hiring faster.' },
  '/job-parsing':               { title: 'AI Job Parser Tool | ZyncJobs Employer Portal',                           description: 'Use AI to convert job descriptions into structured postings, review extracted details, and publish jobs quickly on ZyncJobs.' },
  '/job-posting':               { title: 'Employer Job Posting | ZyncJobs',                                         description: 'Set up your job posting with title, location type, company, category, and experience requirements on ZyncJobs.' },
  '/alerts':                    { title: 'ZyncJobs Job Alerts | Stay Updated on New Openings',                      description: 'Manage your job alerts in one place and get notified when new roles match your search criteria on ZyncJobs.' },
  '/candidate-ranking':         { title: 'Candidate Ranking & Matching | ZyncJobs',                                description: 'Search applicants, view match scores, and manage hiring decisions faster with ZyncJobs candidate ranking system.' },
  '/candidate-messages':        { title: 'ZyncJobs Messages | Chat with Employers and Candidates',                  description: 'Manage recruiter and candidate conversations in one place with the ZyncJobs messaging inbox.' },
  '/interviews':                { title: 'Interview Calendar | ZyncJobs Hiring Portal',                             description: 'Organize and schedule interviews easily from your ZyncJobs dashboard and keep your hiring process moving smoothly.' },
  '/my-applications':           { title: 'Job Applications Dashboard | ZyncJobs',                                   description: 'Track your job applications on ZyncJobs by status, view application progress, and browse jobs when you are ready to apply for new opportunities.' },
  '/forgot-password':           { title: 'Reset Password | ZyncJobs Login Help',                                    description: 'Forgot your password? Enter your email to get a reset link and quickly restore access to your ZyncJobs account.' },
  '/employer-register-complete':{ title: 'ZyncJobs Company Setup | Employer Profile Creation',                      description: 'Set up your company profile on ZyncJobs to access the employer dashboard, post jobs instantly, and start connecting with top talent faster.' },
  '/ai-recruiter':              { title: 'AI Hiring Assistant | ZyncJobs Employer Tools',                           description: 'Use the AI Recruiter Assistant on ZyncJobs to optimize job postings, analyze candidates, generate interview questions, write descriptions, and automate hiring tasks.' },
  '/resume-help':               { title: 'Resume Writing Guide | ZyncJobs Career Resources',                        description: 'Create a better resume with expert tips on formatting, skills, achievements, and tailoring your resume for each job.' },
  '/resume-builder':            { title: 'ATS Resume Templates | ZyncJobs Career Resources',                        description: 'Select from ATS-optimized resume templates on ZyncJobs and build a clean, professional resume with layouts designed to pass applicant tracking systems.' },
};

const SEOHead = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const seo = SEO_MAP[pathname] || SEO_MAP['/'];
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
