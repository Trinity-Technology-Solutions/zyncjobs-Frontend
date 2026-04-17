import React, { useState, useEffect } from 'react';
import Notification from '../components/Notification';
import BackButton from '../components/BackButton';
import EmptyState from '../components/EmptyState';
import { sendAIMessage } from '../services/aiChatService';
import { getCached, setCached, cacheKey } from '../services/aiCache';
import { API_ENDPOINTS } from '../config/constants';
import { generatePositionId } from '../utils/jobMigrationUtils';


interface JobPostingPageProps {
  onNavigate: (page: string) => void;
  user?: any;
  onLogout?: () => void;
  mode?: string;
  parsedData?: any;
}

interface JobData {
  // Step 1: Job Basics
  jobTitle: string;
  locationType: string;
  jobLocation: string;
  expandCandidateSearch: boolean;
  experienceRange: string;
  country: string;
  language: string;
  jobCategory: string;
  priority: string;
  clientName: string;
  jobCode: string;
  reportingManager: string;
  
  // Step 2: Hiring Goals
  hiringTimeline: string;
  numberOfPeople: number;
  workAuth: string[];
  
  // Step 3: Job Details
  jobType: string[];
  
  // Step 4: Pay and Benefits
  payType: string;
  minSalary: string;
  maxSalary: string;
  payRate: string;
  currency: string;
  benefits: string[];
  
  // Step 5: Qualifications
  skills: string[];
  educationLevel: string;
  certifications: string[];
  
  // Step 6: Job Description
  jobDescription: string;
  responsibilities: string[];
  requirements: string[];
  
  // Company Information
  companyName: string;
  companyLogo: string;
  companyId: string;
}

const formatSalary = (value: string): string => {
  const num = parseInt(value.replace(/,/g, ''));
  if (isNaN(num)) return value;
  if (num >= 10000000) return `${(num / 10000000).toFixed(num % 10000000 === 0 ? 0 : 1)}Cr`;
  if (num >= 100000) return `${(num / 100000).toFixed(num % 100000 === 0 ? 0 : 1)}L`;
  if (num >= 1000) return `${(num / 1000).toFixed(num % 1000 === 0 ? 0 : 1)}K`;
  return value;
};

const extractExperienceFromText = (text: string): string => {
  if (!text) return '';
  // Match patterns like: 3-5 years, 2+ years, 5 to 7 years, minimum 3 years, 3 years experience
  const patterns = [
    /(\d+)\s*[-–]\s*(\d+)\s*(?:years?|yrs?)/i,
    /(\d+)\+\s*(?:years?|yrs?)/i,
    /(\d+)\s+to\s+(\d+)\s*(?:years?|yrs?)/i,
    /minimum\s+(\d+)\s*(?:years?|yrs?)/i,
    /at\s+least\s+(\d+)\s*(?:years?|yrs?)/i,
    /(\d+)\s*(?:years?|yrs?)\s+(?:of\s+)?experience/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      if (match[2]) return `${match[1]}-${match[2]} years`;
      return `${match[1]}+ years`;
    }
  }
  return '';
};

const KNOWN_TOOLS = [
  'postman', 'rest assured', 'selenium', 'jira', 'confluence', 'jenkins',
  'docker', 'kubernetes', 'git', 'github', 'gitlab', 'bitbucket',
  'react', 'angular', 'vue', 'node', 'nodejs', 'express', 'django', 'flask',
  'spring', 'hibernate', 'maven', 'gradle', 'junit', 'pytest', 'jest',
  'aws', 'azure', 'gcp', 'terraform', 'ansible', 'linux', 'ubuntu',
  'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch',
  'python', 'java', 'javascript', 'typescript', 'kotlin', 'swift', 'golang',
  'html', 'css', 'sass', 'tailwind', 'bootstrap', 'figma', 'sketch',
  'tableau', 'power bi', 'excel', 'salesforce', 'sap', 'erp',
  'agile', 'scrum', 'kanban', 'devops', 'ci/cd', 'microservices',
  'machine learning', 'tensorflow', 'pytorch', 'rest', 'graphql', 'soap', 'api', 'sql'
];

const INVALID_COMPANY_PHRASES = [
  'good to have', 'must have', 'nice to have', 'required', 'preferred',
  'skills', 'experience', 'qualifications', 'responsibilities', 'benefits',
  'about the role', 'mandatory', 'optional', 'desired', 'added advantage',
  'key skills', 'technical skills', 'soft skills', 'job description',
  'job requirements', 'what we offer', 'who we are', 'not mentioned',
  'not specified', 'not provided', 'n/a', 'none'
];

const sanitizeParsedCompany = (company?: string): string => {
  if (!company || company.trim().length < 2) return '';
  const lower = company.toLowerCase().trim();
  if (INVALID_COMPANY_PHRASES.some(p => lower.includes(p))) return '';
  // Check if it's a known tool/technology
  if (KNOWN_TOOLS.some(t => lower === t || lower.startsWith(t + ' ') || lower.includes(t + ','))) return '';
  // If comma-separated and any part is a tool = skills list, not company
  if (lower.includes(',')) {
    const parts = lower.split(',').map(p => p.trim());
    if (parts.some(p => KNOWN_TOOLS.some(t => p.includes(t)))) return '';
  }
  if (/^[A-Z\s&]+$/.test(company) && company.trim().split(/\s+/).length > 3) return '';
  if (/^\d/.test(company.trim())) return '';
  return company.trim();
};

const JobPostingPage: React.FC<JobPostingPageProps> = ({ onNavigate, user, onLogout, mode = 'manual', parsedData }) => {
  const [currentStep, setCurrentStep] = useState(1);

  // Check for edit mode data from sessionStorage
  const editJobRaw = sessionStorage.getItem('editJobData');
  const editJob = editJobRaw ? JSON.parse(editJobRaw) : null;
  const isEditMode = !!editJob;
  const editJobId = editJob?._id || editJob?.id;

  // Helper to extract salary values from job data
  const getSalaryMin = (job: any): string => {
    if (!job?.salary) return '';
    if (typeof job.salary === 'object') return String(job.salary.min || '');
    const match = String(job.salary).match(/(\d+)/);
    return match ? match[1] : '';
  };
  const getSalaryMax = (job: any): string => {
    if (!job?.salary) return '';
    if (typeof job.salary === 'object') return String(job.salary.max || '');
    const parts = String(job.salary).match(/(\d+)[^\d]+(\d+)/);
    return parts ? parts[2] : '';
  };

  const [jobData, setJobData] = useState<JobData>({
    jobTitle: editJob?.jobTitle || editJob?.title || parsedData?.jobTitle || '',
    locationType: editJob?.locationType || 'In person',
    jobLocation: editJob?.location || editJob?.jobLocation || parsedData?.jobLocation || '',
    expandCandidateSearch: false,
    experienceRange: editJob?.experienceRange || editJob?.experience || editJob?.experienceLevel || parsedData?.experienceRange || '',
    country: editJob?.country || parsedData?.country || '',
    language: (() => {
      const lang = editJob?.language || editJob?.languages;
      if (!lang) return [];
      if (Array.isArray(lang)) return lang;
      if (typeof lang === 'string' && lang.trim()) return lang.split(',').map((l: string) => l.trim()).filter(Boolean);
      return [];
    })(),
    jobCategory: editJob?.jobCategory || editJob?.category || parsedData?.jobCategory || '',
    priority: editJob?.priority || parsedData?.priority || 'Medium',
    clientName: editJob?.clientName || parsedData?.clientName || '',
    jobCode: editJob?.jobCode || `JOB-${Date.now()}`,
    reportingManager: editJob?.reportingManager || parsedData?.reportingManager || '',
    hiringTimeline: '',
    numberOfPeople: 0,
    workAuth: editJob?.workAuth || parsedData?.workAuth || [],
    jobType: editJob?.type ? (Array.isArray(editJob.type) ? editJob.type : [editJob.type]) :
             editJob?.jobType ? (Array.isArray(editJob.jobType) ? editJob.jobType : [editJob.jobType]) :
             parsedData?.jobType && Array.isArray(parsedData.jobType) ? parsedData.jobType :
             parsedData?.jobType ? [parsedData.jobType] : [],
    payType: 'Range',
    minSalary: getSalaryMin(editJob) || (parsedData?.minSalary && parseInt(parsedData.minSalary) > 0 ? parsedData.minSalary : ''),
    maxSalary: getSalaryMax(editJob) || (parsedData?.maxSalary && parseInt(parsedData.maxSalary) > 0 ? parsedData.maxSalary : ''),
    payRate: editJob?.salary?.period === 'monthly' ? 'per month' : editJob?.salary?.period === 'hourly' ? 'per hour' : parsedData?.payRate || 'per year',
    currency: parsedData?.currency || 'INR',
    benefits: editJob?.benefits || parsedData?.benefits || [],
    jobDescription: editJob?.jobDescription || editJob?.description || parsedData?.jobDescription || '',
    responsibilities: editJob?.responsibilities
      ? (Array.isArray(editJob.responsibilities) ? editJob.responsibilities : editJob.responsibilities.split('\n').filter(Boolean))
      : parsedData?.responsibilities || [],
    requirements: editJob?.requirements
      ? (Array.isArray(editJob.requirements) ? editJob.requirements : editJob.requirements.split('\n').filter(Boolean))
      : parsedData?.requirements || [],
    skills: editJob?.skills || parsedData?.skills || [],
    educationLevel: editJob?.educationLevel || parsedData?.educationLevel || "Bachelor's degree",
    certifications: [],
    companyName: editJob?.company || editJob?.companyName || '',
    companyLogo: editJob?.companyLogo || '',
    companyId: ''
  });

  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
    isVisible: boolean;
  }>({ type: 'success', message: '', isVisible: false });

  // AI Suggestions state
  const [jobTitleSuggestions, setJobTitleSuggestions] = useState<string[]>([]);
  const [skillSuggestions, setSkillSuggestions] = useState<string[]>([]);
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [showJobTitleSuggestions, setShowJobTitleSuggestions] = useState(false);
  const [showSkillSuggestions, setShowSkillSuggestions] = useState(false);
  const [showCountrySuggestions, setShowCountrySuggestions] = useState(false);
  const [countrySuggestions, setCountrySuggestions] = useState<string[]>([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [isLoadingJobTitles, setIsLoadingJobTitles] = useState(false);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [isLoadingSkills, setIsLoadingSkills] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  const [companySearchResults, setCompanySearchResults] = useState<any[]>([]);
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [aiSuggestedSkills, setAiSuggestedSkills] = useState<string[]>([]);

  const [salaryModified, setSalaryModified] = useState(() => {
    const min = getSalaryMin(editJob) || parsedData?.minSalary || parsedData?.salary?.min;
    const max = getSalaryMax(editJob) || parsedData?.maxSalary || parsedData?.salary?.max;
    return !!(min && max && parseInt(String(min)) > 0 && parseInt(String(max)) > 0);
  });
  const [salaryFocused, setSalaryFocused] = useState<'min' | 'max' | null>(null);

  const updateJobData = (field: keyof JobData, value: any) => {
    setJobData(prev => ({ ...prev, [field]: value }));
  };
  useEffect(() => {
    if (parsedData?.companyName && !jobData.companyLogo) {
      const companies = [
        { id: '1', name: 'Google', logo: 'https://img.logo.dev/google.com?token=pk_cY8JBeWnQR6g5m_ymQhBoQ&size=80' },
        { id: '2', name: 'Microsoft', logo: 'https://img.logo.dev/microsoft.com?token=pk_cY8JBeWnQR6g5m_ymQhBoQ&size=80' },
        { id: '3', name: 'Apple', logo: 'https://img.logo.dev/apple.com?token=pk_cY8JBeWnQR6g5m_ymQhBoQ&size=80' },
        { id: '4', name: 'Amazon', logo: 'https://img.logo.dev/amazon.com?token=pk_cY8JBeWnQR6g5m_ymQhBoQ&size=80' },
        { id: '5', name: 'Meta', logo: 'https://img.logo.dev/meta.com?token=pk_cY8JBeWnQR6g5m_ymQhBoQ&size=80' },
        { id: '6', name: 'Trinity Technology Solutions', logo: '/images/company-logos/trinity-logo.png' },
        { id: '7', name: 'TCS', logo: 'https://img.logo.dev/tcs.com?token=pk_cY8JBeWnQR6g5m_ymQhBoQ&size=80' },
        { id: '8', name: 'Infosys', logo: 'https://img.logo.dev/infosys.com?token=pk_cY8JBeWnQR6g5m_ymQhBoQ&size=80' },
        { id: '9', name: 'Wipro', logo: 'https://img.logo.dev/wipro.com?token=pk_cY8JBeWnQR6g5m_ymQhBoQ&size=80' },
        { id: '10', name: 'Zoho', logo: 'https://img.logo.dev/zoho.com?token=pk_cY8JBeWnQR6g5m_ymQhBoQ&size=80' },
        { id: '11', name: 'IBM', logo: 'https://img.logo.dev/ibm.com?token=pk_cY8JBeWnQR6g5m_ymQhBoQ&size=80' },
        { id: '12', name: 'Accenture', logo: 'https://img.logo.dev/accenture.com?token=pk_cY8JBeWnQR6g5m_ymQhBoQ&size=80' },
        { id: '13', name: 'Oracle', logo: 'https://img.logo.dev/oracle.com?token=pk_cY8JBeWnQR6g5m_ymQhBoQ&size=80' },
        { id: '14', name: 'Salesforce', logo: 'https://img.logo.dev/salesforce.com?token=pk_cY8JBeWnQR6g5m_ymQhBoQ&size=80' },
        { id: '15', name: 'Adobe', logo: 'https://img.logo.dev/adobe.com?token=pk_cY8JBeWnQR6g5m_ymQhBoQ&size=80' }
      ];
      
      const matchedCompany = companies.find(company => 
        company.name.toLowerCase().includes(parsedData.companyName.toLowerCase()) ||
        parsedData.companyName.toLowerCase().includes(company.name.toLowerCase())
      );
      
      if (matchedCompany) {
        updateJobData('companyLogo', matchedCompany.logo);
        updateJobData('companyId', matchedCompany.id);
      }
    }
  }, [parsedData]);

  // Auto-parse skills from job description when parsedData is available
  useEffect(() => {
    if (parsedData?.jobDescription && mode === 'parse') {
      const parsedSkills = parseSkillsFromJobDescription(
        parsedData.jobDescription, 
        parsedData.jobTitle || ''
      );
      
      // If no skills were parsed initially or only basic skills, update with parsed skills
      if (!parsedData.skills || parsedData.skills.length === 0 || 
          parsedData.skills.every((skill: string) => ['AWS', 'Azure', 'GitHub', 'IT', 'Java', 'Linux', 'Python', 'SQL', 'Version control'].includes(skill))) {
        updateJobData('skills', parsedSkills);
      } else {
        // Merge existing skills with parsed skills
        const mergedSkills = [...new Set([...parsedData.skills, ...parsedSkills])].slice(0, 15);
        updateJobData('skills', mergedSkills);
      }
    }
  }, [parsedData, mode]);

  // Set salaryModified if parsedData has actual salary values
  useEffect(() => {
    if (parsedData?.minSalary && parsedData?.maxSalary &&
        parseInt(parsedData.minSalary) > 0 && parseInt(parsedData.maxSalary) > 0) {
      setSalaryModified(true);
    }
  }, [parsedData]);

  // Auto-extract experience range from job description
  useEffect(() => {
    if (jobData.jobDescription && !jobData.experienceRange) {
      const extracted = extractExperienceFromText(jobData.jobDescription);
      if (extracted) updateJobData('experienceRange', extracted);
    }
  }, [jobData.jobDescription]);

  // Load countries on component mount
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await fetch(`${API_ENDPOINTS.BASE_URL}/locations/countries`);
        const data = await response.json();
        setCountries(data.countries || []);
      } catch (error) {
        setCountries(['India', 'United States', 'United Kingdom', 'Canada', 'Australia']);
      }
    };
    fetchCountries();
  }, []);

  // AI-powered job title suggestions
  const handleJobTitleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    updateJobData('jobTitle', value);
    
    if (value.length >= 1) {
      setIsLoadingJobTitles(true);
      
      try {
        const response = await fetch(`${API_ENDPOINTS.JOBS.replace('/jobs', '/suggest')}?q=${encodeURIComponent(value)}&type=job`);
        const data = await response.json();
        console.log('Job title API response:', data);
        
        if (data.suggestions && data.suggestions.length > 0) {
          setJobTitleSuggestions(data.suggestions);
          setShowJobTitleSuggestions(true);
        } else {
          setShowJobTitleSuggestions(false);
        }
      } catch (error) {
        console.error('Job title suggestions failed:', error);
        setShowJobTitleSuggestions(false);
      } finally {
        setIsLoadingJobTitles(false);
      }
    } else {
      setShowJobTitleSuggestions(false);
      setJobTitleSuggestions([]);
    }
  };

  const getFallbackJobTitles = (input: string) => {
    const key = input.toLowerCase();
    const fallbacks: { [key: string]: string[] } = {
      'account': ['Accountant', 'Account Manager', 'Accounting Specialist', 'Account Executive', 'Senior Accountant', 'Accounting Clerk', 'Account Coordinator', 'Accounting Manager'],
      'software': ['Software Developer', 'Software Engineer', 'Software Tester', 'Software Architect', 'Senior Software Engineer', 'Software Quality Engineer', 'Software Consultant', 'Software Product Manager'],
      'data': ['Data Scientist', 'Data Analyst', 'Data Engineer', 'Data Architect', 'Senior Data Scientist', 'Data Product Manager', 'Data Visualization Specialist', 'Big Data Engineer'],
      'marketing': ['Marketing Manager', 'Digital Marketing Specialist', 'Content Marketing Manager', 'Marketing Coordinator', 'Social Media Manager', 'Marketing Analyst', 'Brand Manager', 'Growth Marketing Manager'],
      'sales': ['Sales Representative', 'Sales Manager', 'Account Executive', 'Sales Coordinator', 'Business Development Manager', 'Sales Analyst', 'Inside Sales Representative', 'Sales Director']
    };
    
    for (const [prefix, suggestions] of Object.entries(fallbacks)) {
      if (key.includes(prefix) || prefix.includes(key)) {
        return suggestions;
      }
    }
    return ['Software Developer', 'Marketing Manager', 'Sales Representative', 'Data Analyst', 'Product Manager', 'Business Analyst', 'Project Manager', 'Operations Manager'];
  };

  const handleLocationChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    updateJobData('jobLocation', value);
    
    if (value.length >= 1) {
      setIsLoadingLocations(true);
      
      try {
        const response = await fetch(`${API_ENDPOINTS.BASE_URL}/locations/search/${encodeURIComponent(value)}`);
        const data = await response.json();
        
        if (data.locations && data.locations.length > 0) {
          setLocationSuggestions(data.locations);
          setShowLocationSuggestions(true);
        } else {
          const fallbackLocations = getFallbackLocations(value);
          setLocationSuggestions(fallbackLocations);
          setShowLocationSuggestions(fallbackLocations.length > 0);
        }
      } catch (error) {
        const fallbackLocations = getFallbackLocations(value);
        setLocationSuggestions(fallbackLocations);
        setShowLocationSuggestions(fallbackLocations.length > 0);
      } finally {
        setIsLoadingLocations(false);
      }
    } else {
      setShowLocationSuggestions(false);
      setLocationSuggestions([]);
    }
  };

  const handleLocationBlur = async (value: string) => {
    // Small delay so onMouseDown on dropdown fires first
    setTimeout(async () => {
      setShowLocationSuggestions(false);
      if (value && value !== 'Remote') {
        try {
          const res = await fetch(`${API_ENDPOINTS.BASE_URL}/locations/city-country/${encodeURIComponent(value)}`);
          const data = await res.json();
          if (data.country) updateJobData('country', data.country);
        } catch {}
      }
    }, 150);
  };

  const getFallbackLocations = (input: string) => {
    const key = input.toLowerCase();
    const allLocations = [
      'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Kolkata', 'Pune', 'Ahmedabad',
      'Surat', 'Jaipur', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane', 'Bhopal',
      'Visakhapatnam', 'Patna', 'Vadodara', 'Ghaziabad', 'Ludhiana', 'Agra', 'Nashik',
      'Faridabad', 'Meerut', 'Rajkot', 'Varanasi', 'Srinagar', 'Aurangabad', 'Dhanbad',
      'Amritsar', 'Navi Mumbai', 'Allahabad', 'Ranchi', 'Howrah', 'Coimbatore', 'Jabalpur',
      'Gwalior', 'Vijayawada', 'Jodhpur', 'Madurai', 'Raipur', 'Kota', 'Guwahati',
      'Chandigarh', 'Solapur', 'Hubli-Dharwad', 'Bareilly', 'Moradabad', 'Mysore',
      'Gurgaon', 'Aligarh', 'Jalandhar', 'Tiruchirappalli', 'Bhubaneswar', 'Salem',
      'Warangal', 'Guntur', 'Bhiwandi', 'Saharanpur', 'Gorakhpur', 'Bikaner', 'Amravati',
      'Noida', 'Jamshedpur', 'Bhilai', 'Cuttack', 'Firozabad', 'Kochi', 'Nellore',
      'Bhavnagar', 'Dehradun', 'Durgapur', 'Asansol', 'Rourkela', 'Nanded', 'Kolhapur',
      'Ajmer', 'Akola', 'Gulbarga', 'Jamnagar', 'Ujjain', 'Loni', 'Siliguri', 'Jhansi',
      'Ulhasnagar', 'Jammu', 'Mangalore', 'Erode', 'Belgaum', 'Ambattur', 'Tirunelveli',
      'Malegaon', 'Gaya', 'Jalgaon', 'Udaipur', 'Maheshtala', 'Davanagere', 'Kozhikode',
      'Kurnool', 'Rajahmundry', 'Bokaro', 'South Dumdum', 'Bellary', 'Patiala', 'Gopalpur',
      'Agartala', 'Bhagalpur', 'Muzaffarnagar', 'Bhatpara', 'Panihati', 'Latur', 'Dhule',
      'Rohtak', 'Korba', 'Bhilwara', 'Berhampur', 'Muzaffarpur', 'Ahmednagar', 'Mathura',
      'Kollam', 'Avadi', 'Kadapa', 'Kamarhati', 'Sambalpur', 'Bilaspur', 'Shahjahanpur',
      'Satara', 'Bijapur', 'Rampur', 'Shivamogga', 'Chandrapur', 'Junagadh', 'Thrissur',
      'Alwar', 'Bardhaman', 'Kulti', 'Kakinada', 'Nizamabad', 'Parbhani', 'Tumkur',
      'Khammam', 'Ozhukarai', 'Bihar Sharif', 'Panipat', 'Darbhanga', 'Bally', 'Aizawl',
      'Dewas', 'Ichalkaranji', 'Karnal', 'Bathinda', 'Jalna', 'Eluru', 'Baranagar',
      'Purnia', 'Satna', 'Mau', 'Sonipat', 'Farrukhabad', 'Sagar', 'Durg', 'Imphal',
      'Ratlam', 'Hapur', 'Arrah', 'Anantapur', 'Karimnagar', 'Etawah', 'Ambernath',
      'North Dumdum', 'Bharatpur', 'Begusarai', 'New Delhi', 'Gandhidham', 'Tiruvottiyur',
      'Puducherry', 'Sikar', 'Thoothukudi', 'Rewa', 'Mirzapur', 'Raichur', 'Pali',
      'Ramagundam', 'Silchar', 'Orai', 'Tenali', 'Jorhat', 'Karaikudi', 'Kishanganj',
      'Surendranagar', 'Remote', 'Work from Home', 'Pan India', 'India'
    ];
    
    return allLocations.filter(location => 
      location.toLowerCase().includes(key)
    ).slice(0, 10);
  };



  // AI-powered skill suggestions
  const handleSkillInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSkillInput(value);
    
    if (value.length >= 1) {
      setIsLoadingSkills(true);
      
      try {
        // First try to get skills from backend skills.json
        const response = await fetch(`${API_ENDPOINTS.SKILLS}?q=${encodeURIComponent(value)}`);
        const data = await response.json();
        console.log('Skills API response:', data);
        
        if (data.skills && data.skills.length > 0) {
          setSkillSuggestions(data.skills);
          setShowSkillSuggestions(true);
        } else {
          // Use fallback skills if API doesn't return results
          const fallbackSkills = getFallbackSkills(value);
          setSkillSuggestions(fallbackSkills);
          setShowSkillSuggestions(fallbackSkills.length > 0);
        }
      } catch (error) {
        console.error('Skill suggestions failed:', error);
        // Use fallback skills if API fails
        const fallbackSkills = getFallbackSkills(value);
        setSkillSuggestions(fallbackSkills);
        setShowSkillSuggestions(fallbackSkills.length > 0);
      } finally {
        setIsLoadingSkills(false);
      }
    } else {
      setShowSkillSuggestions(false);
      setSkillSuggestions([]);
    }
  };

  const getFallbackSkills = (input: string) => {
    const key = input.toLowerCase();
    const fallbacks: { [key: string]: string[] } = {
      'py': ['Python', 'PyTorch', 'PySpark', 'Pytest', 'Pandas', 'NumPy', 'PyQt', 'Pyramid'],
      'java': ['JavaScript', 'Java', 'jQuery', 'JSON', 'JavaFX', 'Jakarta EE', 'Jackson', 'JUnit'],
      'react': ['React', 'React Native', 'Redux', 'React Router', 'React Hooks', 'React Testing Library', 'Next.js', 'Gatsby'],
      'node': ['Node.js', 'Express.js', 'npm', 'Nodemon', 'NestJS', 'Socket.io', 'Mongoose', 'Passport.js'],
      'aws': ['AWS', 'AWS Lambda', 'AWS S3', 'AWS EC2', 'AWS RDS', 'AWS CloudFormation', 'AWS ECS', 'AWS API Gateway'],
      'azure': ['Azure', 'Azure Functions', 'Azure DevOps', 'Azure SQL', 'Azure Storage', 'Azure Active Directory'],
      'sql': ['SQL', 'MySQL', 'PostgreSQL', 'SQLite', 'SQL Server', 'Oracle SQL', 'MongoDB', 'NoSQL'],
      'git': ['Git', 'GitHub', 'GitLab', 'Bitbucket', 'Version Control', 'Git Flow'],
      'docker': ['Docker', 'Docker Compose', 'Kubernetes', 'Container Orchestration', 'Docker Swarm'],
      'angular': ['Angular', 'AngularJS', 'TypeScript', 'RxJS', 'Angular CLI', 'Angular Material'],
      'vue': ['Vue.js', 'Vuex', 'Vue Router', 'Nuxt.js', 'Vue CLI', 'Vuetify'],
      'css': ['CSS', 'CSS3', 'Sass', 'SCSS', 'Less', 'Tailwind CSS', 'Bootstrap', 'Material-UI'],
      'html': ['HTML', 'HTML5', 'Semantic HTML', 'Web Standards', 'Accessibility'],
      'test': ['Testing', 'Unit Testing', 'Integration Testing', 'Jest', 'Cypress', 'Selenium', 'Test Automation'],
      'api': ['REST API', 'GraphQL', 'API Development', 'API Testing', 'Postman', 'Swagger'],
      'data': ['Data Analysis', 'Data Science', 'Machine Learning', 'Data Visualization', 'Tableau', 'Power BI'],
      'mobile': ['Mobile Development', 'iOS', 'Android', 'React Native', 'Flutter', 'Swift', 'Kotlin'],
      'design': ['UI/UX Design', 'Figma', 'Adobe XD', 'Sketch', 'Photoshop', 'Illustrator', 'Wireframing'],
      'project': ['Project Management', 'Agile', 'Scrum', 'Kanban', 'Jira', 'Trello', 'Asana'],
      'communication': ['Communication', 'Presentation', 'Public Speaking', 'Writing', 'Documentation'],
      'leadership': ['Leadership', 'Team Management', 'Mentoring', 'Strategic Planning', 'Decision Making']
    };
    
    // Check for exact matches first
    for (const [prefix, suggestions] of Object.entries(fallbacks)) {
      if (key.startsWith(prefix) || prefix.startsWith(key)) {
        return suggestions.filter(skill => skill.toLowerCase().includes(key));
      }
    }
    
    // Check for partial matches in skill names
    const allSkills = Object.values(fallbacks).flat();
    const matchingSkills = allSkills.filter(skill => 
      skill.toLowerCase().includes(key)
    );
    
    if (matchingSkills.length > 0) {
      return matchingSkills.slice(0, 8);
    }
    
    // Default popular skills if no matches
    return ['JavaScript', 'Python', 'React', 'Node.js', 'SQL', 'Git', 'AWS', 'Docker'];
  };

  // Auto-generate job description and populate skills/education
  const generateJobDescription = async (jobTitle: string, forceUpdate = false) => {
    if (!jobTitle || jobTitle.length < 3) return;
    
    setIsGeneratingDescription(true);
    try {
      const currencySymbol = jobData.currency === 'INR' ? '₹' : 
                            jobData.currency === 'USD' ? '$' : 
                            jobData.currency === 'EUR' ? '€' : 
                            jobData.currency === 'GBP' ? '£' : 
                            jobData.currency === 'CAD' ? 'C$' : 
                            jobData.currency === 'AUD' ? 'A$' : 
                            jobData.currency === 'JPY' ? '¥' : 
                            jobData.currency === 'SGD' ? 'S$' : '$';
      
      // Only include salary if user has actually modified salary values
      const shouldIncludeSalary = salaryModified && jobData.minSalary && jobData.maxSalary;
      
      const description = await mistralAIService.generateJobDescription(
        jobTitle,
        jobData.companyName || 'ZyncJobs',
        jobData.jobLocation || 'Remote',
        {
          jobType: jobData.jobType.join(', ') || 'full-time',
          skills: jobData.skills,
          salary: shouldIncludeSalary ? `₹${formatSalary(jobData.minSalary)} - ₹${formatSalary(jobData.maxSalary)} ${jobData.payRate}` : undefined,
          benefits: jobData.benefits,
          educationLevel: jobData.educationLevel
        }
      );
      updateJobData('jobDescription', description);
      
      // Auto-populate skills from the generated description and job title
      const parsedSkills = parseSkillsFromJobDescription(description, jobTitle);
      
      // Auto-populate skills and education based on job title (only on first generation)
      if (!forceUpdate) {
        const { skills: titleSkills, education } = getJobTitleDefaults(jobTitle);
        const { responsibilities: titleResponsibilities, requirements: titleRequirements } = getJobTitleResponsibilitiesAndRequirements(jobTitle);
        
        // Combine parsed skills with title-based skills, prioritizing parsed skills
        const combinedSkills = [...new Set([...parsedSkills, ...titleSkills])].slice(0, 12);
        
        if (jobData.skills.length === 0 || jobData.skills.every(skill => ['AWS', 'Azure', 'GitHub', 'IT', 'Java', 'Linux', 'Python', 'SQL', 'Version control'].includes(skill))) {
          updateJobData('skills', combinedSkills);
        }
        if (jobData.educationLevel === "Bachelor's degree") {
          updateJobData('educationLevel', education);
        }
        
        // Auto-populate responsibilities and requirements if they're empty
        if (jobData.responsibilities.length === 0) {
          updateJobData('responsibilities', titleResponsibilities);
        }
        if (jobData.requirements.length === 0) {
          updateJobData('requirements', titleRequirements);
        }
      } else {
        // For force updates, also update skills from the new description
        const currentSkills = jobData.skills;
        const newParsedSkills = parseSkillsFromJobDescription(description, jobTitle);
        const mergedSkills = [...new Set([...currentSkills, ...newParsedSkills])].slice(0, 15);
        updateJobData('skills', mergedSkills);
      }
      
      setNotification({
        type: 'success',
        message: 'Job details generated successfully with AI! 🤖',
        isVisible: true
      });
    } catch (error) {
      console.error('Job description generation failed:', error);
      setNotification({
        type: 'error',
        message: 'Failed to generate job description. Please try again.',
        isVisible: true
      });
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  // Enhanced skill parsing from job description
  const parseSkillsFromJobDescription = (jobDescription: string, jobTitle: string = ''): string[] => {
    if (!jobDescription) return [];
    
    const text = (jobDescription + ' ' + jobTitle).toLowerCase();
    const extractedSkills = new Set<string>();
    
    // Comprehensive skill database with variations
    const skillDatabase = {
      // Programming Languages
      'javascript': ['javascript', 'js', 'node.js', 'nodejs', 'react', 'vue', 'angular'],
      'python': ['python', 'django', 'flask', 'fastapi', 'pandas', 'numpy', 'scipy'],
      'java': ['java', 'spring', 'hibernate', 'maven', 'gradle'],
      'typescript': ['typescript', 'ts'],
      'c#': ['c#', 'csharp', '.net', 'dotnet', 'asp.net'],
      'php': ['php', 'laravel', 'symfony', 'codeigniter'],
      'ruby': ['ruby', 'rails', 'ruby on rails'],
      'go': ['golang', 'go'],
      'rust': ['rust'],
      'kotlin': ['kotlin'],
      'swift': ['swift', 'ios'],
      'scala': ['scala'],
      'r': [' r ', 'r programming'],
      'matlab': ['matlab'],
      'perl': ['perl'],
      'shell': ['bash', 'shell', 'powershell', 'zsh'],
      
      // Frontend Technologies
      'react': ['react', 'reactjs', 'react.js', 'jsx'],
      'angular': ['angular', 'angularjs'],
      'vue.js': ['vue', 'vuejs', 'vue.js'],
      'html': ['html', 'html5'],
      'css': ['css', 'css3', 'scss', 'sass', 'less'],
      'bootstrap': ['bootstrap'],
      'tailwind css': ['tailwind', 'tailwindcss'],
      'material-ui': ['material-ui', 'mui'],
      'jquery': ['jquery'],
      
      // Backend Technologies
      'node.js': ['node', 'nodejs', 'node.js', 'express'],
      'express.js': ['express', 'expressjs'],
      'django': ['django'],
      'flask': ['flask'],
      'spring boot': ['spring boot', 'springboot'],
      'laravel': ['laravel'],
      'rails': ['rails', 'ruby on rails'],
      
      // Databases
      'mysql': ['mysql'],
      'postgresql': ['postgresql', 'postgres'],
      'mongodb': ['mongodb', 'mongo'],
      'redis': ['redis'],
      'elasticsearch': ['elasticsearch', 'elastic search'],
      'oracle': ['oracle db', 'oracle database'],
      'sql server': ['sql server', 'mssql'],
      'sqlite': ['sqlite'],
      'cassandra': ['cassandra'],
      'dynamodb': ['dynamodb'],
      
      // Cloud Platforms
      'aws': ['aws', 'amazon web services', 'ec2', 's3', 'lambda', 'rds', 'cloudformation'],
      'azure': ['azure', 'microsoft azure'],
      'gcp': ['gcp', 'google cloud', 'google cloud platform'],
      'docker': ['docker', 'containerization'],
      'kubernetes': ['kubernetes', 'k8s'],
      
      // DevOps & Tools
      'git': ['git', 'github', 'gitlab', 'bitbucket'],
      'jenkins': ['jenkins'],
      'ci/cd': ['ci/cd', 'continuous integration', 'continuous deployment'],
      'terraform': ['terraform'],
      'ansible': ['ansible'],
      'puppet': ['puppet'],
      'chef': ['chef'],
      
      // Testing
      'jest': ['jest'],
      'cypress': ['cypress'],
      'selenium': ['selenium'],
      'junit': ['junit'],
      'pytest': ['pytest'],
      'mocha': ['mocha'],
      'jasmine': ['jasmine'],
      
      // Data Science & Analytics
      'machine learning': ['machine learning', 'ml', 'artificial intelligence', 'ai'],
      'deep learning': ['deep learning', 'neural networks'],
      'tensorflow': ['tensorflow'],
      'pytorch': ['pytorch'],
      'pandas': ['pandas'],
      'numpy': ['numpy'],
      'scikit-learn': ['scikit-learn', 'sklearn'],
      'tableau': ['tableau'],
      'power bi': ['power bi', 'powerbi'],
      'spark': ['apache spark', 'spark'],
      'hadoop': ['hadoop'],
      
      // Mobile Development
      'react native': ['react native'],
      'flutter': ['flutter'],
      'android': ['android'],
      'ios': ['ios', 'swift'],
      'xamarin': ['xamarin'],
      
      // Design
      'figma': ['figma'],
      'sketch': ['sketch'],
      'adobe xd': ['adobe xd', 'xd'],
      'photoshop': ['photoshop'],
      'illustrator': ['illustrator'],
      'ui/ux': ['ui/ux', 'ui', 'ux', 'user experience', 'user interface'],
      
      // Project Management
      'agile': ['agile', 'scrum', 'kanban'],
      'jira': ['jira'],
      'trello': ['trello'],
      'asana': ['asana'],
      'confluence': ['confluence'],
      
      // Business Skills
      'excel': ['excel', 'microsoft excel'],
      'powerpoint': ['powerpoint', 'ppt'],
      'word': ['microsoft word', 'ms word'],
      'salesforce': ['salesforce', 'crm'],
      'sap': ['sap'],
      'erp': ['erp'],
      
      // Soft Skills
      'communication': ['communication', 'verbal communication', 'written communication'],
      'leadership': ['leadership', 'team lead', 'team management'],
      'problem solving': ['problem solving', 'analytical thinking'],
      'teamwork': ['teamwork', 'collaboration', 'team player'],
      'project management': ['project management', 'pmp']
    };
    
    // Extract skills using pattern matching
    Object.entries(skillDatabase).forEach(([skill, variations]) => {
      variations.forEach(variation => {
        const pattern = new RegExp(`\\b${variation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
        if (pattern.test(text)) {
          extractedSkills.add(skill);
        }
      });
    });
    
    // Additional pattern-based extraction for common skill formats
    const skillPatterns = [
      /\b([A-Z][a-z]+(?:\.[a-z]+)+)\b/g, // Framework patterns like React.js, Vue.js
      /\b([A-Z]{2,})\b/g, // Acronyms like AWS, API, SQL
      /\b(\w+(?:-\w+)+)\b/g, // Hyphenated skills like machine-learning
    ];
    
    skillPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const cleanMatch = match.toLowerCase().trim();
          if (cleanMatch.length > 2 && cleanMatch.length < 30) {
            // Check if it's a known skill or technology
            const knownTechTerms = ['api', 'sql', 'xml', 'json', 'rest', 'soap', 'mvc', 'orm', 'ide', 'sdk', 'cli'];
            if (knownTechTerms.includes(cleanMatch) || 
                Object.values(skillDatabase).flat().includes(cleanMatch)) {
              extractedSkills.add(cleanMatch.toUpperCase());
            }
          }
        });
      }
    });
    
    // Convert to proper case and filter
    const finalSkills = Array.from(extractedSkills)
      .map(skill => {
        // Proper case conversion
        if (skill === 'javascript') return 'JavaScript';
        if (skill === 'typescript') return 'TypeScript';
        if (skill === 'node.js') return 'Node.js';
        if (skill === 'react') return 'React';
        if (skill === 'angular') return 'Angular';
        if (skill === 'vue.js') return 'Vue.js';
        if (skill === 'python') return 'Python';
        if (skill === 'java') return 'Java';
        if (skill === 'c#') return 'C#';
        if (skill === 'aws') return 'AWS';
        if (skill === 'azure') return 'Azure';
        if (skill === 'docker') return 'Docker';
        if (skill === 'kubernetes') return 'Kubernetes';
        if (skill === 'git') return 'Git';
        if (skill === 'mysql') return 'MySQL';
        if (skill === 'postgresql') return 'PostgreSQL';
        if (skill === 'mongodb') return 'MongoDB';
        if (skill === 'machine learning') return 'Machine Learning';
        if (skill === 'ui/ux') return 'UI/UX Design';
        
        // Default: capitalize first letter
        return skill.charAt(0).toUpperCase() + skill.slice(1);
      })
      .filter(skill => skill.length > 1)
      .slice(0, 15); // Limit to top 15 skills
    
    return finalSkills;
  };

  // Get default responsibilities and requirements based on job title
  const getJobTitleResponsibilitiesAndRequirements = (jobTitle: string) => {
    const title = jobTitle.toLowerCase();
    
    if (title.includes('software') && (title.includes('developer') || title.includes('engineer'))) {
      return {
        responsibilities: [
          'Design, develop, and maintain high-quality software applications',
          'Collaborate with cross-functional teams to define and implement new features',
          'Write clean, maintainable, and efficient code following best practices',
          'Participate in code reviews and provide constructive feedback to team members'
        ],
        requirements: [
          'Bachelor\'s degree in Computer Science, Engineering, or related field',
          'Proficiency in programming languages such as Java, Python, or JavaScript',
          'Experience with software development methodologies and version control systems',
          'Strong problem-solving skills and attention to detail'
        ]
      };
    }
    
    if (title.includes('data') && (title.includes('scientist') || title.includes('analyst'))) {
      return {
        responsibilities: [
          'Analyze large datasets to identify trends, patterns, and business insights',
          'Develop and implement statistical models and machine learning algorithms',
          'Create data visualizations and reports to communicate findings to stakeholders',
          'Collaborate with business teams to understand requirements and provide data-driven solutions'
        ],
        requirements: [
          'Bachelor\'s degree in Statistics, Mathematics, Computer Science, or related field',
          'Proficiency in data analysis tools such as Python, R, SQL, or similar',
          'Experience with data visualization tools like Tableau, Power BI, or similar',
          'Strong analytical and problem-solving skills with attention to detail'
        ]
      };
    }
    
    if (title.includes('marketing')) {
      return {
        responsibilities: [
          'Develop and execute comprehensive marketing strategies and campaigns',
          'Analyze market trends and customer behavior to identify opportunities',
          'Manage social media presence and create engaging content across platforms',
          'Collaborate with sales teams to generate leads and support business growth'
        ],
        requirements: [
          'Bachelor\'s degree in Marketing, Communications, or related field',
          'Experience with digital marketing tools and platforms (Google Analytics, social media)',
          'Strong written and verbal communication skills',
          'Creative thinking and ability to work in a fast-paced environment'
        ]
      };
    }
    
    if (title.includes('sales')) {
      return {
        responsibilities: [
          'Identify and pursue new business opportunities and potential clients',
          'Build and maintain strong relationships with existing and prospective customers',
          'Present products and services to clients and negotiate contracts',
          'Meet and exceed sales targets while providing excellent customer service'
        ],
        requirements: [
          'Bachelor\'s degree in Business, Sales, or related field',
          'Proven track record in sales with strong negotiation skills',
          'Excellent communication and interpersonal skills',
          'Self-motivated with ability to work independently and as part of a team'
        ]
      };
    }
    
    if (title.includes('project manager') || title.includes('program manager')) {
      return {
        responsibilities: [
          'Plan, execute, and deliver projects on time and within budget',
          'Coordinate cross-functional teams and manage project resources effectively',
          'Monitor project progress and communicate status updates to stakeholders',
          'Identify and mitigate project risks while ensuring quality deliverables'
        ],
        requirements: [
          'Bachelor\'s degree in Business, Engineering, or related field',
          'PMP certification or equivalent project management experience',
          'Strong organizational and leadership skills',
          'Proficiency in project management tools and methodologies'
        ]
      };
    }
    
    if (title.includes('hr') || title.includes('human resources')) {
      return {
        responsibilities: [
          'Manage recruitment and selection processes for various positions',
          'Develop and implement HR policies and procedures',
          'Handle employee relations, performance management, and conflict resolution',
          'Ensure compliance with employment laws and company policies'
        ],
        requirements: [
          'Bachelor\'s degree in Human Resources, Psychology, or related field',
          'Knowledge of employment laws and HR best practices',
          'Strong interpersonal and communication skills',
          'Experience with HRIS systems and HR analytics'
        ]
      };
    }
    
    if (title.includes('accountant') || title.includes('accounting')) {
      return {
        responsibilities: [
          'Prepare and maintain accurate financial records and statements',
          'Process accounts payable and receivable transactions',
          'Assist with budget preparation and financial analysis',
          'Ensure compliance with accounting standards and tax regulations'
        ],
        requirements: [
          'Bachelor\'s degree in Accounting, Finance, or related field',
          'Knowledge of accounting principles and financial reporting standards',
          'Proficiency in accounting software and Microsoft Excel',
          'Strong attention to detail and analytical skills'
        ]
      };
    }
    
    if (title.includes('designer') || title.includes('ui') || title.includes('ux')) {
      return {
        responsibilities: [
          'Create user-centered designs for web and mobile applications',
          'Conduct user research and usability testing to inform design decisions',
          'Develop wireframes, prototypes, and high-fidelity mockups',
          'Collaborate with developers and product managers to implement designs'
        ],
        requirements: [
          'Bachelor\'s degree in Design, HCI, or related field',
          'Proficiency in design tools such as Figma, Sketch, or Adobe Creative Suite',
          'Strong portfolio demonstrating UI/UX design skills',
          'Understanding of user-centered design principles and methodologies'
        ]
      };
    }
    
    // Default for other roles
    return {
      responsibilities: [
        'Execute daily tasks and responsibilities according to company standards',
        'Collaborate effectively with team members and stakeholders',
        'Contribute to process improvements and operational efficiency',
        'Maintain professional development and stay current with industry trends'
      ],
      requirements: [
        'Bachelor\'s degree or equivalent experience in relevant field',
        'Strong communication and interpersonal skills',
        'Ability to work independently and manage multiple priorities',
        'Proficiency in relevant tools and technologies for the role'
      ]
    };
  };

  // Get default skills and education based on job title
  const getJobTitleDefaults = (jobTitle: string) => {
    const title = jobTitle.toLowerCase();
    
    if (title.includes('accountant') || title.includes('accounting')) {
      return {
        skills: ['QuickBooks', 'Excel', 'Financial Reporting', 'GAAP', 'Tax Preparation', 'Accounts Payable', 'Accounts Receivable', 'SAP'],
        education: "Bachelor's degree in Accounting or Finance"
      };
    }
    
    if (title.includes('marketing')) {
      return {
        skills: ['Digital Marketing', 'Social Media', 'Google Analytics', 'SEO', 'Content Marketing', 'Email Marketing', 'Adobe Creative Suite', 'Campaign Management'],
        education: "Bachelor's degree in Marketing or Communications"
      };
    }
    
    if (title.includes('sales')) {
      return {
        skills: ['CRM Software', 'Lead Generation', 'Negotiation', 'Customer Relationship Management', 'Sales Forecasting', 'Presentation Skills', 'Cold Calling', 'Salesforce'],
        education: "Bachelor's degree in Business or Sales"
      };
    }
    
    if (title.includes('hr') || title.includes('human resources')) {
      return {
        skills: ['HRIS', 'Recruitment', 'Employee Relations', 'Performance Management', 'Benefits Administration', 'Training & Development', 'Employment Law', 'Payroll'],
        education: "Bachelor's degree in Human Resources or related field"
      };
    }
    
    if (title.includes('developer') || title.includes('engineer') || title.includes('programmer')) {
      return {
        skills: ['JavaScript', 'Python', 'React', 'Node.js', 'SQL', 'Git', 'AWS', 'Docker'],
        education: "Bachelor's degree in Computer Science or Engineering"
      };
    }
    
    return {
      skills: ['Communication', 'Problem Solving', 'Team Collaboration', 'Time Management', 'Analytical Thinking', 'Microsoft Office', 'Project Management'],
      education: "Bachelor's degree or equivalent experience"
    };
  };

  const fetchAISkillsForTitle = async (title: string) => {
    if (!title || title.length < 3) return;
    const key = cacheKey('job-skills', title.toLowerCase());
    const cached = getCached<string[]>(key);
    if (cached) { setAiSuggestedSkills(cached); return; }
    try {
      const reply = await sendAIMessage(
        [{ role: 'user', content: `List exactly 10 key skills required for a "${title}" job role. Return ONLY a JSON array of skill names, no explanation: ["skill1","skill2",...]` }],
        'You are a job skills expert. Return only a valid JSON array of skill strings.',
        undefined,
        200
      );
      const match = reply.match(/\[[\s\S]*\]/);
      if (match) {
        const skills: string[] = JSON.parse(match[0]).slice(0, 10);
        setCached(key, skills, 60 * 60 * 1000); // cache 1 hour
        setAiSuggestedSkills(skills);
      }
    } catch {
      // fallback to getJobTitleDefaults
      const { skills } = getJobTitleDefaults(title);
      setAiSuggestedSkills(skills);
    }
  };

  // Select suggestions
  const selectJobTitle = (title: string) => {
    updateJobData('jobTitle', title);
    setShowJobTitleSuggestions(false);
    setJobTitleSuggestions([]);
    fetchAISkillsForTitle(title);
    setTimeout(() => generateJobDescription(title), 500);
  };

  // Handle country input change with suggestions
  const handleCountryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    updateJobData('country', value);
    
    if (value.length >= 1) {
      const filtered = countries.filter(country => 
        country.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 8);
      setCountrySuggestions(filtered);
      setShowCountrySuggestions(filtered.length > 0);
    } else {
      setShowCountrySuggestions(false);
    }
  };

  const selectCountry = (country: string) => {
    updateJobData('country', country);
    setShowCountrySuggestions(false);
  };

  const selectLocation = async (location: string) => {
    updateJobData('jobLocation', location);
    setShowLocationSuggestions(false);
    setLocationSuggestions([]);
    // Always auto-fill country from selected city
    if (location && location !== 'Remote') {
      try {
        const res = await fetch(`${API_ENDPOINTS.BASE_URL}/locations/city-country/${encodeURIComponent(location)}`);
        const data = await res.json();
        if (data.country) updateJobData('country', data.country);
      } catch {}
    }
  };

  const addSkill = (skill: string) => {
    if (!jobData.skills.includes(skill)) {
      updateJobData('skills', [...jobData.skills, skill]);
    }
    setSkillInput('');
    setShowSkillSuggestions(false);
  };

  // Smart skill search in job description
  const findSkillInJobDescription = (searchSkill: string): string[] => {
    if (!jobData.jobDescription) return [];
    
    const jdText = jobData.jobDescription.toLowerCase();
    const searchTerm = searchSkill.toLowerCase();
    const foundSkills = new Set<string>();
    
    // Skill mapping for better detection
    const skillMappings: { [key: string]: string[] } = {
      'react': ['react', 'reactjs', 'react.js', 'jsx', 'react native'],
      'angular': ['angular', 'angularjs', 'angular 2+', 'typescript'],
      'vue': ['vue', 'vuejs', 'vue.js', 'nuxt'],
      'node': ['node', 'nodejs', 'node.js', 'express', 'npm'],
      'python': ['python', 'django', 'flask', 'fastapi', 'pandas', 'numpy'],
      'java': ['java', 'spring', 'spring boot', 'hibernate', 'maven'],
      'javascript': ['javascript', 'js', 'es6', 'es2015', 'jquery'],
      'typescript': ['typescript', 'ts'],
      'aws': ['aws', 'amazon web services', 'ec2', 's3', 'lambda', 'cloudformation'],
      'azure': ['azure', 'microsoft azure', 'azure functions'],
      'docker': ['docker', 'containerization', 'containers'],
      'kubernetes': ['kubernetes', 'k8s', 'container orchestration'],
      'git': ['git', 'github', 'gitlab', 'version control'],
      'sql': ['sql', 'mysql', 'postgresql', 'database'],
      'mongodb': ['mongodb', 'mongo', 'nosql'],
      'redis': ['redis', 'caching'],
      'graphql': ['graphql', 'apollo'],
      'rest': ['rest', 'restful', 'api'],
      'microservices': ['microservices', 'microservice architecture'],
      'agile': ['agile', 'scrum', 'kanban'],
      'ci/cd': ['ci/cd', 'continuous integration', 'continuous deployment', 'jenkins'],
      'testing': ['testing', 'unit testing', 'integration testing', 'jest', 'cypress'],
      'machine learning': ['machine learning', 'ml', 'ai', 'artificial intelligence'],
      'data science': ['data science', 'data analysis', 'analytics'],
      'devops': ['devops', 'infrastructure', 'deployment'],
      'linux': ['linux', 'unix', 'bash', 'shell'],
      'windows': ['windows', 'powershell'],
      'mobile': ['mobile', 'ios', 'android', 'react native', 'flutter'],
      'frontend': ['frontend', 'front-end', 'ui', 'user interface'],
      'backend': ['backend', 'back-end', 'server-side'],
      'fullstack': ['fullstack', 'full-stack', 'full stack']
    };
    
    // Check if the search term or its variations exist in JD
    const variations = skillMappings[searchTerm] || [searchTerm];
    
    variations.forEach(variation => {
      const regex = new RegExp(`\\b${variation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      if (regex.test(jdText)) {
        // Add the properly formatted skill name
        const properSkillName = formatSkillName(variation);
        foundSkills.add(properSkillName);
      }
    });
    
    // Also run the comprehensive parsing to find related skills
    const allParsedSkills = parseSkillsFromJobDescription(jobData.jobDescription, jobData.jobTitle);
    
    // Filter parsed skills that are related to the search term
    allParsedSkills.forEach(skill => {
      const skillLower = skill.toLowerCase();
      if (skillLower.includes(searchTerm) || searchTerm.includes(skillLower)) {
        foundSkills.add(skill);
      }
    });
    
    return Array.from(foundSkills);
  };
  
  // Format skill names properly
  const formatSkillName = (skill: string): string => {
    const skillFormatting: { [key: string]: string } = {
      'javascript': 'JavaScript',
      'typescript': 'TypeScript',
      'nodejs': 'Node.js',
      'node.js': 'Node.js',
      'reactjs': 'React',
      'react.js': 'React',
      'vuejs': 'Vue.js',
      'vue.js': 'Vue.js',
      'angularjs': 'Angular',
      'mysql': 'MySQL',
      'postgresql': 'PostgreSQL',
      'mongodb': 'MongoDB',
      'aws': 'AWS',
      'gcp': 'GCP',
      'ui/ux': 'UI/UX Design',
      'ci/cd': 'CI/CD',
      'api': 'API',
      'rest': 'REST API',
      'graphql': 'GraphQL',
      'html': 'HTML',
      'css': 'CSS',
      'sql': 'SQL'
    };
    
    const lowerSkill = skill.toLowerCase();
    return skillFormatting[lowerSkill] || skill.charAt(0).toUpperCase() + skill.slice(1);
  };
  
  // Enhanced skill addition with JD parsing
  const addSkillWithParsing = (inputSkill: string) => {
    const trimmedSkill = inputSkill.trim();
    if (!trimmedSkill) return;
    
    // First, add the manually entered skill if it's not already there
    const formattedSkill = formatSkillName(trimmedSkill);
    const currentSkills = [...jobData.skills];
    
    // Check if skill already exists to prevent duplicates
    if (currentSkills.includes(formattedSkill)) {
      setSkillInput('');
      setShowSkillSuggestions(false);
      return;
    }
    
    currentSkills.push(formattedSkill);
    
    // Then, search for related skills in the job description
    const foundSkills = findSkillInJobDescription(trimmedSkill);
    
    // Add found skills that aren't already in the list
    const newSkills = foundSkills.filter(skill => !currentSkills.includes(skill));
    
    if (newSkills.length > 0) {
      const updatedSkills = [...currentSkills, ...newSkills].slice(0, 15); // Limit to 15 skills
      updateJobData('skills', updatedSkills);
      
      setNotification({
        type: 'success',
        message: `Added "${formattedSkill}" and found ${newSkills.length} related skills from JD: ${newSkills.join(', ')} 🎯`,
        isVisible: true
      });
    } else {
      updateJobData('skills', currentSkills);
      
      if (jobData.jobDescription) {
        setNotification({
          type: 'info',
          message: `Added "${formattedSkill}" - no additional related skills found in JD`,
          isVisible: true
        });
      }
    }
    
    setSkillInput('');
    setShowSkillSuggestions(false);
  };

  const searchCompanies = (query: string) => {
    if (query.length < 2) {
      setCompanySearchResults([]);
      setShowCompanyDropdown(false);
      return;
    }

    const companies = [
      { id: '1', name: 'Google', logo: 'https://img.logo.dev/google.com?token=pk_cY8JBeWnQR6g5m_ymQhBoQ&size=80' },
      { id: '2', name: 'Microsoft', logo: 'https://img.logo.dev/microsoft.com?token=pk_cY8JBeWnQR6g5m_ymQhBoQ&size=80' },
      { id: '3', name: 'Apple', logo: 'https://img.logo.dev/apple.com?token=pk_cY8JBeWnQR6g5m_ymQhBoQ&size=80' },
      { id: '4', name: 'Amazon', logo: 'https://img.logo.dev/amazon.com?token=pk_cY8JBeWnQR6g5m_ymQhBoQ&size=80' },
      { id: '5', name: 'Meta', logo: 'https://img.logo.dev/meta.com?token=pk_cY8JBeWnQR6g5m_ymQhBoQ&size=80' },
      { id: '6', name: 'Trinity Technology Solutions', logo: '/images/company-logos/trinity-logo.png' },
      { id: '7', name: 'TCS', logo: 'https://img.logo.dev/tcs.com?token=pk_cY8JBeWnQR6g5m_ymQhBoQ&size=80' },
      { id: '8', name: 'Infosys', logo: 'https://img.logo.dev/infosys.com?token=pk_cY8JBeWnQR6g5m_ymQhBoQ&size=80' },
      { id: '9', name: 'Wipro', logo: 'https://img.logo.dev/wipro.com?token=pk_cY8JBeWnQR6g5m_ymQhBoQ&size=80' },
      { id: '10', name: 'Zoho', logo: 'https://img.logo.dev/zoho.com?token=pk_cY8JBeWnQR6g5m_ymQhBoQ&size=80' }
    ];

    const filtered = companies.filter(company => 
      company.name.toLowerCase().includes(query.toLowerCase())
    );
    
    setCompanySearchResults(filtered);
    setShowCompanyDropdown(filtered.length > 0);
  };

  const selectCompany = (company: any) => {
    updateJobData('companyName', company.name);
    updateJobData('companyLogo', company.logo);
    updateJobData('companyId', company.id);
    setShowCompanyDropdown(false);
  };

  const removeSkill = (skillToRemove: string) => {
    updateJobData('skills', jobData.skills.filter(skill => skill !== skillToRemove));
  };

  const validateStep = (step: number): { isValid: boolean; message: string } => {
    switch (step) {
      case 1:
        if (!jobData.jobTitle.trim()) return { isValid: false, message: 'Job title is required' };
        if (!jobData.companyName.trim()) return { isValid: false, message: 'Company name is required' };
        if (!jobData.jobLocation.trim()) return { isValid: false, message: 'Job location is required' };
        if (!jobData.jobCategory.trim()) return { isValid: false, message: 'Job category is required' };
        if (!jobData.country.trim()) return { isValid: false, message: 'Country is required' };
        const languages = Array.isArray(jobData.language) ? jobData.language : jobData.language ? [jobData.language] : [];
        if (languages.length === 0) return { isValid: false, message: 'At least one language is required' };
        break;
      case 2:
        // Step 2 is removed - no validation needed
        break;
      case 3:
        if (!Array.isArray(jobData.jobType) || jobData.jobType.length === 0) {
          return { isValid: false, message: 'At least one job type is required' };
        }
        break;
      case 4:
        // Salary section is now optional
        break;
      case 5:
        if (jobData.skills.length === 0) return { isValid: false, message: 'At least one skill is required' };
        const education = Array.isArray(jobData.educationLevel) ? jobData.educationLevel : jobData.educationLevel ? [jobData.educationLevel] : [];
        if (education.length === 0) return { isValid: false, message: 'Education level is required' };
        break;
      case 6:
        if (!jobData.jobDescription.trim()) return { isValid: false, message: 'Job description is required' };
        break;
    }
    return { isValid: true, message: '' };
  };

  const nextStep = () => {
    const validation = validateStep(currentStep);
    if (!validation.isValid) {
      setNotification({
        type: 'error',
        message: validation.message,
        isVisible: true
      });
      return;
    }
    
    // Skip step 2 - go directly from step 1 to step 3
    if (currentStep === 1) {
      setCurrentStep(3);
    } else if (currentStep < 7) {
      setCurrentStep(currentStep + 1);
    }
    
    // Scroll to top smoothly when moving to next step
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const prevStep = () => {
    // Skip step 2 - go directly from step 3 to step 1
    if (currentStep === 3) {
      setCurrentStep(1);
    } else if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
    
    // Scroll to top smoothly when moving to previous step
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };


  const renderStep1 = () => (
    <div className="px-6 py-8">
      <div className="flex justify-between items-center mb-8">
        <BackButton 
          onClick={() => mode === 'parse' ? onNavigate('job-parsing') : onNavigate('job-posting-selection')}
          text={mode === 'parse' ? 'Back to Parser' : 'Back to Selection'}
        />
        <button onClick={() => onNavigate('dashboard')} className="text-gray-500 text-2xl hover:text-gray-700">×</button>
      </div>
      
      <div className="space-y-8">
        <div className="relative">
          <label className="block text-gray-700 font-medium mb-3">Job title *</label>
          <div className="relative">
            <input
              type="text"
              value={jobData.jobTitle}
              onChange={handleJobTitleChange}
              onBlur={() => { if (jobData.jobTitle.length >= 3) fetchAISkillsForTitle(jobData.jobTitle); }}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 pr-10 text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g. Software Engineer"
            />
            {isLoadingJobTitles && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              </div>
            )}
          </div>
          {showJobTitleSuggestions && jobTitleSuggestions.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {jobTitleSuggestions.map((title, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => selectJobTitle(title)}
                  className="w-full text-left px-4 py-3 hover:bg-blue-50 text-sm border-b last:border-b-0 transition-colors flex items-center justify-between group"
                >
                  <span>{title}</span>
                  <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">✨ AI</span>
                </button>
              ))}
            </div>
          )}
        </div>
        
        <div>
          <label className="block text-gray-700 font-medium mb-3">Job location type *</label>
          <select
            value={jobData.locationType}
            onChange={(e) => updateJobData('locationType', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="In person">In person</option>
            <option value="Remote">Remote</option>
            <option value="Hybrid">Hybrid</option>
          </select>
        </div>
        
        <div className="relative">
          <label className="block text-gray-700 font-medium mb-3">Company for this job *</label>
          <p className="text-gray-500 text-sm mb-3">You can post jobs for any company, not just your registered company</p>
          <div className="relative">
            <input
              type="text"
              value={jobData.companyName}
              onChange={(e) => {
                updateJobData('companyName', e.target.value);
                searchCompanies(e.target.value);
              }}
              onFocus={() => {
                if (jobData.companyName.length >= 2) {
                  searchCompanies(jobData.companyName);
                }
              }}
              onBlur={() => {
                setTimeout(() => setShowCompanyDropdown(false), 200);
              }}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Search for company (e.g., Google, Microsoft, Trinity Technology Solutions)..."
            />
            {showCompanyDropdown && companySearchResults.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {companySearchResults.map((company) => (
                  <div
                    key={company.id}
                    onMouseDown={() => selectCompany(company)}
                    className="px-4 py-3 hover:bg-blue-50 cursor-pointer transition-colors flex items-center space-x-3 border-b last:border-b-0"
                  >
                    <div className="w-8 h-8 flex-shrink-0">
                      <img
                        src={company.logo}
                        alt={company.name}
                        className="w-8 h-8 rounded object-contain bg-white border"
                        onError={(e) => {
                          const img = e.target as HTMLImageElement;
                          // Generate a letter avatar instead of using Trinity logo
                          const firstLetter = company.name.charAt(0).toUpperCase();
                          const canvas = document.createElement('canvas');
                          canvas.width = 32;
                          canvas.height = 32;
                          const ctx = canvas.getContext('2d');
                          if (ctx) {
                            ctx.fillStyle = '#3B82F6';
                            ctx.fillRect(0, 0, 32, 32);
                            ctx.fillStyle = 'white';
                            ctx.font = '16px Arial';
                            ctx.textAlign = 'center';
                            ctx.fillText(firstLetter, 16, 22);
                            img.src = canvas.toDataURL();
                          }
                        }}
                      />
                    </div>
                    <span className="text-gray-900 font-medium">{company.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="relative">
          <label className="block text-gray-700 font-medium mb-2">What is the job location? *</label>
          <p className="text-gray-500 text-sm mb-3">Enter city, region, or select Remote</p>
          <div className="relative">
            <input
              type="text"
              value={jobData.jobLocation}
              onChange={handleLocationChange}
              onBlur={(e) => handleLocationBlur(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 pr-10 text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g. Chennai, Remote, Bangalore"
            />
            {isLoadingLocations && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              </div>
            )}
          </div>
          {showLocationSuggestions && locationSuggestions.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {locationSuggestions.map((location, index) => (
                <div
                  key={index}
                  onMouseDown={() => selectLocation(location)}
                  className="w-full text-left px-4 py-3 hover:bg-blue-50 text-sm border-b last:border-b-0 transition-colors flex items-center justify-between group cursor-pointer"
                >
                  <span>{location}</span>
                  <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">📍</span>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div>
          <label className="block text-gray-700 font-medium mb-3">Job Category *</label>
          <select
            value={jobData.jobCategory || ''}
            onChange={(e) => updateJobData('jobCategory', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select job category</option>
            <option value="Information Technology">Information Technology</option>
            <option value="Software Development">Software Development</option>
            <option value="Data Science & Analytics">Data Science & Analytics</option>
            <option value="Sales & Marketing">Sales & Marketing</option>
            <option value="Finance & Accounting">Finance & Accounting</option>
            <option value="Human Resources">Human Resources</option>
            <option value="Operations">Operations</option>
            <option value="Customer Service">Customer Service</option>
            <option value="Healthcare">Healthcare</option>
            <option value="Engineering">Engineering</option>
            <option value="Education">Education</option>
            <option value="Legal">Legal</option>
            <option value="Manufacturing">Manufacturing</option>
            <option value="Retail">Retail</option>
            <option value="Other">Other</option>
          </select>
        </div>
        
        <div>
          <label className="block text-gray-700 font-medium mb-3">Priority Level *</label>
          <select
            value={jobData.priority || 'Medium'}
            onChange={(e) => updateJobData('priority', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="Low">🟢 Low Priority</option>
            <option value="Medium">🟡 Medium Priority</option>
            <option value="High">🟠 High Priority</option>
            <option value="Urgent">🔴 Urgent</option>
          </select>
        </div>
        
        <div className="relative">
          <label className="block text-gray-700 font-medium mb-3">Country *</label>
          <input
            type="text"
            value={jobData.country}
            onChange={handleCountryChange}
            onFocus={() => jobData.country.length >= 1 && setShowCountrySuggestions(true)}
            onBlur={() => setTimeout(() => setShowCountrySuggestions(false), 200)}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g. India, United States"
          />
          {showCountrySuggestions && countrySuggestions.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {countrySuggestions.map((country, index) => (
                <button
                  key={index}
                  type="button"
                  onMouseDown={() => selectCountry(country)}
                  className="w-full text-left px-4 py-3 hover:bg-blue-50 text-sm border-b last:border-b-0 transition-colors"
                >
                  {country}
                </button>
              ))}
            </div>
          )}
        </div>
        
        <div>
          <label className="block text-gray-700 font-medium mb-3">Languages *</label>
          <p className="text-gray-500 text-sm mb-3">Select all languages required for this position</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              'English', 'Tamil', 'Hindi', 'Spanish', 'French', 'German', 
              'Mandarin', 'Japanese', 'Korean', 'Arabic', 'Portuguese', 'Russian'
            ].map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => {
                  const currentLanguages = Array.isArray(jobData.language) ? jobData.language : jobData.language ? [jobData.language] : [];
                  const newLanguages = currentLanguages.includes(lang)
                    ? currentLanguages.filter(l => l !== lang)
                    : [...currentLanguages, lang];
                  updateJobData('language', newLanguages);
                }}
                className={`px-4 py-2 border rounded-lg text-sm transition-colors ${
                  (Array.isArray(jobData.language) ? jobData.language : jobData.language ? [jobData.language] : []).includes(lang)
                    ? 'border-blue-600 text-blue-600 bg-blue-50'
                    : 'border-gray-300 text-gray-700 hover:border-gray-400'
                }`}
              >
                + {lang}
              </button>
            ))}
          </div>
          {Array.isArray(jobData.language) && jobData.language.length > 0 && (
            <div className="mt-3">
              <p className="text-sm text-gray-600">Selected: {jobData.language.join(', ')}</p>
            </div>
          )}
        </div>
        
        <div>
          <label className="block text-gray-700 font-medium mb-3">Experience Range</label>
          {mode === 'parse' && jobData.experienceRange && (
            <p className="text-xs text-green-600 mb-2">✨ Auto-extracted from JD: <strong>{jobData.experienceRange}</strong></p>
          )}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-gray-500 text-sm mb-1">Min Experience</label>
              <select
                value={jobData.experienceRange.split('-')[0]?.trim() || ''}
                onChange={(e) => {
                  const max = jobData.experienceRange.split('-')[1]?.trim() || '';
                  updateJobData('experienceRange', max ? e.target.value + ' - ' + max : e.target.value);
                }}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="">Select</option>
                {[0,1,2,3,4,5,6,7,8,9,10,12,15,20].map(y => (
                  <option key={y} value={`${y} year${y !== 1 ? 's' : ''}`}>{y} year{y !== 1 ? 's' : ''}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-gray-500 text-sm mb-1">Max Experience</label>
              <select
                value={jobData.experienceRange.split('-')[1]?.trim() || ''}
                onChange={(e) => {
                  const min = jobData.experienceRange.split('-')[0]?.trim() || '';
                  updateJobData('experienceRange', min ? min + ' - ' + e.target.value : e.target.value);
                }}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="">Select</option>
                {[1,2,3,4,5,6,7,8,9,10,12,15,20,25].map(y => (
                  <option key={y} value={`${y} year${y !== 1 ? 's' : ''}`}>{y} year{y !== 1 ? 's' : ''}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        

      </div>
      
      <div className="flex justify-end mt-16">
        <button
          onClick={nextStep}
          className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium flex items-center space-x-2 hover:bg-blue-700"
        >
          <span>Continue</span>
          <span>→</span>
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Hiring goals & Requirements</h1>
      
      <div className="space-y-8">
        <div>
          <label className="block text-gray-700 font-medium mb-3">Hiring timeline for this job *</label>
          <select
            value={jobData.hiringTimeline}
            onChange={(e) => updateJobData('hiringTimeline', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select an option</option>
            <option value="1 to 3 days">1 to 3 days</option>
            <option value="3 to 7 days">3 to 7 days</option>
            <option value="1 to 2 weeks">1 to 2 weeks</option>
            <option value="2 to 4 weeks">2 to 4 weeks</option>
            <option value="More than 4 weeks">More than 4 weeks</option>
          </select>
        </div>
        
        <div>
          <label className="block text-gray-700 font-medium mb-3">Number of people to hire in the next 30 days *</label>
          <input
            type="number"
            min="1"
            max="100"
            value={jobData.numberOfPeople || ''}
            onChange={(e) => updateJobData('numberOfPeople', parseInt(e.target.value) || 0)}
            placeholder="Enter number of people to hire"
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-gray-700 font-medium mb-3">Work Authorization Required</label>
          <div className="space-y-2">
            {[
              'US Citizen',
              'Green Card Holder',
              'H1B Visa',
              'L1 Visa',
              'OPT/CPT',
              'TN Visa',
              'No Sponsorship Required',
              'Will Sponsor'
            ].map((auth) => (
              <label key={auth} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={(jobData.workAuth || []).includes(auth)}
                  onChange={(e) => {
                    const currentAuth = jobData.workAuth || [];
                    const newAuth = e.target.checked
                      ? [...currentAuth, auth]
                      : currentAuth.filter(a => a !== auth);
                    updateJobData('workAuth', newAuth);
                  }}
                  className="rounded"
                />
                <span className="text-gray-700">{auth}</span>
              </label>
            ))}
          </div>
        </div>
        
        <div>
          <h3 className="text-gray-700 font-medium mb-2">Expand your candidate search</h3>
          <p className="text-gray-500 text-sm mb-4">Over 10 million active job seekers are open to relocating.</p>
          <label className="flex items-start space-x-3">
            <input
              type="checkbox"
              checked={jobData.expandCandidateSearch}
              onChange={(e) => updateJobData('expandCandidateSearch', e.target.checked)}
              className="mt-1"
            />
            <div>
              <span className="text-gray-700">I'm interested in attracting candidates open to relocation</span>
              <button className="text-blue-600 ml-2 text-sm underline hover:text-blue-700">How it works</button>
              <p className="text-gray-500 text-sm mt-1">Marking your interest helps improve our recommendations.</p>
            </div>
          </label>
        </div>
      </div>
      
      <div className="flex justify-between items-center mt-12">
        <button
          onClick={prevStep}
          className="flex items-center space-x-2 text-blue-600 font-medium hover:text-blue-700"
        >
          <span>←</span>
          <span>Back</span>
        </button>
        <button
          onClick={nextStep}
          className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium flex items-center space-x-2 hover:bg-blue-700"
        >
          <span>Continue</span>
          <span>→</span>
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="px-6 py-8">
      <div className="space-y-8">
        <div>
          <label className="block text-gray-700 font-medium mb-6">Job type *</label>
          <div className="flex flex-wrap gap-4">
            {['Full-time', 'Part-time', 'Contract', 'Temporary', 'Internship'].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => {
                  const newTypes = jobData.jobType.includes(type)
                    ? jobData.jobType.filter(t => t !== type)
                    : [...jobData.jobType, type];
                  updateJobData('jobType', newTypes);
                }}
                className={`px-6 py-3 border rounded-lg font-medium transition-colors ${
                  jobData.jobType.includes(type)
                    ? 'border-blue-600 text-blue-600 bg-blue-50'
                    : 'border-gray-300 text-gray-700 hover:border-gray-400'
                }`}
              >
                + {type}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <div className="flex justify-between items-center mt-12">
        <button
          onClick={prevStep}
          className="flex items-center space-x-2 text-blue-600 font-medium hover:text-blue-700"
        >
          <span>←</span>
          <span>Back</span>
        </button>
        <button
          onClick={nextStep}
          className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium flex items-center space-x-2 hover:bg-blue-700"
        >
          <span>Continue</span>
          <span>→</span>
        </button>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="px-6 py-8">
      <div className="space-y-8">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-700 font-medium">Pay (optional)</h3>
            {salaryModified && (
              <button
                onClick={() => {
                  updateJobData('minSalary', '');
                  updateJobData('maxSalary', '');
                  setSalaryModified(false);
                  setNotification({
                    type: 'info',
                    message: 'Salary information cleared - job description will not include salary',
                    isVisible: true
                  });
                }}
                className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center space-x-1"
              >
                <span>×</span>
                <span>Clear Salary</span>
              </button>
            )}
          </div>
          <p className="text-gray-500 text-sm mb-6">You can skip this section or add pay information to attract more candidates.</p>
          
          <div className="grid grid-cols-5 gap-4 items-end">
            <div>
              <label className="block text-gray-600 text-sm mb-2">Show pay by</label>
              <select
                value={jobData.payType}
                onChange={(e) => updateJobData('payType', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Range">Range</option>
                <option value="Starting amount">Starting amount</option>
                <option value="Maximum amount">Maximum amount</option>
                <option value="Exact amount">Exact amount</option>
              </select>
            </div>
            
            <div>
              <label className="block text-gray-600 text-sm mb-2">Currency</label>
              <div className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-700 font-medium">
                ₹ INR
              </div>
            </div>
            
            <div>
              <label className="block text-gray-600 text-sm mb-2">Minimum</label>
              <input
                type="text"
                value={salaryFocused === 'min' ? jobData.minSalary : (jobData.minSalary ? formatSalary(jobData.minSalary) : '')}
                onFocus={() => setSalaryFocused('min')}
                onChange={(e) => {
                  updateJobData('minSalary', e.target.value.replace(/[^0-9]/g, ''));
                  setSalaryModified(true);
                }}
                onBlur={() => setSalaryFocused(null)}
                placeholder="e.g. 500000"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="text-center">
              <span className="text-gray-500">to</span>
            </div>
            
            <div>
              <label className="block text-gray-600 text-sm mb-2">Maximum</label>
              <input
                type="text"
                value={salaryFocused === 'max' ? jobData.maxSalary : (jobData.maxSalary ? formatSalary(jobData.maxSalary) : '')}
                onFocus={() => setSalaryFocused('max')}
                onChange={(e) => {
                  updateJobData('maxSalary', e.target.value.replace(/[^0-9]/g, ''));
                  setSalaryModified(true);
                }}
                onBlur={() => setSalaryFocused(null)}
                placeholder="e.g. 800000"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="mt-4">
            <label className="block text-gray-600 text-sm mb-2">Rate</label>
            <select
              value={jobData.payRate}
              onChange={(e) => updateJobData('payRate', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="per year">per year</option>
              <option value="per month">per month</option>
              <option value="per hour">per hour</option>
            </select>
          </div>
          
          {/* Salary Status Indicator */}
          <div className="mt-4 p-3 rounded-lg border">
            <div className="flex items-center space-x-2">
              {salaryModified ? (
                <>
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span className="text-sm text-green-700 font-medium">Salary will be included in job description</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                  <span className="text-sm text-gray-600">Salary is optional - will show "Competitive salary" if not specified</span>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="text-gray-700 font-medium mb-4">Benefits</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              'Visa sponsorship', 'Green card sponsorship', 'Dental insurance',
              'Health insurance', 'Vision insurance', 'AD&D insurance', 'Life insurance'
            ].map((benefit) => (
              <button
                key={benefit}
                type="button"
                onClick={() => {
                  const newBenefits = jobData.benefits.includes(benefit)
                    ? jobData.benefits.filter(b => b !== benefit)
                    : [...jobData.benefits, benefit];
                  updateJobData('benefits', newBenefits);
                }}
                className={`px-4 py-2 border rounded-lg text-sm transition-colors ${
                  jobData.benefits.includes(benefit)
                    ? 'border-blue-600 text-blue-600 bg-blue-50'
                    : 'border-gray-300 text-gray-700 hover:border-gray-400'
                }`}
              >
                + {benefit}
              </button>
            ))}
          </div>
        </div>
        
        <div>
          <h3 className="text-gray-700 font-medium mb-3">Work Authorization Required</h3>
          <div className="space-y-2">
            {[
              'US Citizen',
              'Green Card Holder',
              'H1B Visa',
              'L1 Visa',
              'OPT/CPT',
              'TN Visa',
              'No Sponsorship Required',
              'Will Sponsor'
            ].map((auth) => (
              <label key={auth} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={(jobData.workAuth || []).includes(auth)}
                  onChange={(e) => {
                    const currentAuth = jobData.workAuth || [];
                    const newAuth = e.target.checked
                      ? [...currentAuth, auth]
                      : currentAuth.filter(a => a !== auth);
                    updateJobData('workAuth', newAuth);
                  }}
                  className="rounded"
                />
                <span className="text-gray-700">{auth}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
      
      <div className="flex justify-between items-center mt-12">
        <button
          onClick={prevStep}
          className="flex items-center space-x-2 text-blue-600 font-medium hover:text-blue-700"
        >
          <span>←</span>
          <span>Back</span>
        </button>
        <button
          onClick={nextStep}
          className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium flex items-center space-x-2 hover:bg-blue-700"
        >
          <span>Continue</span>
          <span>→</span>
        </button>
      </div>
    </div>
  );

  const renderQualifications = () => (
    <div className="px-6 py-8">
      <div className="space-y-8">
        
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-700 font-medium">What skills should candidates have?</h3>
            {jobData.jobDescription && (
              <button
                onClick={() => {
                  const parsedSkills = parseSkillsFromJobDescription(jobData.jobDescription, jobData.jobTitle);
                  const mergedSkills = [...new Set([...jobData.skills, ...parsedSkills])].slice(0, 15);
                  updateJobData('skills', mergedSkills);
                  setNotification({
                    type: 'success',
                    message: `Extracted ${parsedSkills.length} skills from job description! 🎯`,
                    isVisible: true
                  });
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-sm font-medium flex items-center space-x-1 transition-colors"
              >
                <span>🎯</span>
                <span>Extract from JD</span>
              </button>
            )}
          </div>
          
          {/* Selected Skills */}
          <div className="flex flex-wrap gap-2 mb-4">
            {jobData.skills.map((skill, index) => (
              <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                {skill}
                <button 
                  type="button" 
                  onClick={() => removeSkill(skill)} 
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          
          {/* Skill Input with AI Suggestions */}
          <div className="relative">
            <input
              type="text"
              value={skillInput}
              onChange={handleSkillInputChange}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && skillInput.trim()) {
                  e.preventDefault();
                  addSkillWithParsing(skillInput.trim());
                }
              }}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Type skills (e.g. Python, React, AWS)..."
            />
            {isLoadingSkills && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              </div>
            )}
            {showSkillSuggestions && skillSuggestions.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {skillSuggestions.map((skill, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => addSkillWithParsing(skill)}
                    className="w-full text-left px-4 py-3 hover:bg-blue-50 text-sm border-b last:border-b-0 transition-colors flex items-center justify-between group"
                  >
                    <span>{skill}</span>
                    <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">🚀 AI</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* AI Suggested Skills based on Job Title */}
          {(aiSuggestedSkills.length > 0 || jobData.jobTitle) && (
            <div className="mt-4">
              <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
                AI suggested for "{jobData.jobTitle || 'your role'}"
              </p>
              <div className="flex flex-wrap gap-2">
                {(aiSuggestedSkills.length > 0 ? aiSuggestedSkills : getJobTitleDefaults(jobData.jobTitle).skills).map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => {
                      const newSkills = jobData.skills.includes(skill)
                        ? jobData.skills.filter(s => s !== skill)
                        : [...jobData.skills, skill];
                      updateJobData('skills', newSkills);
                    }}
                    className={`px-3 py-1.5 border rounded-lg text-sm transition-colors ${
                      jobData.skills.includes(skill)
                        ? 'border-blue-600 text-blue-600 bg-blue-50'
                        : 'border-gray-300 text-gray-700 hover:border-blue-400 hover:bg-blue-50'
                    }`}
                  >
                    {jobData.skills.includes(skill) ? '✓' : '+'} {skill}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div>
          <h3 className="text-gray-700 font-medium mb-4">What education level should candidates have?</h3>
          <p className="text-gray-500 text-sm mb-4">Select all acceptable education levels</p>
          <div className="space-y-2">
            {[
              "High School Diploma",
              "Associate's Degree",
              "Bachelor's Degree",
              "Master's Degree",
              "PhD/Doctorate",
              "Professional Certification",
              "Trade School Certificate",
              "No formal education required"
            ].map((level) => {
              const currentEducation = Array.isArray(jobData.educationLevel) ? jobData.educationLevel : jobData.educationLevel ? [jobData.educationLevel] : [];
              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => {
                    const newEducation = currentEducation.includes(level)
                      ? currentEducation.filter(e => e !== level)
                      : [...currentEducation, level];
                    updateJobData('educationLevel', newEducation);
                  }}
                  className={`w-full text-left px-4 py-2 border rounded-lg transition-colors ${
                    currentEducation.includes(level)
                      ? 'border-blue-600 text-blue-600 bg-blue-50'
                      : 'border-gray-300 text-gray-700 hover:border-gray-400'
                  }`}
                >
                  {currentEducation.includes(level) ? '✓' : '+'} {level}
                </button>
              );
            })}
          </div>
          {Array.isArray(jobData.educationLevel) && jobData.educationLevel.length > 0 && (
            <div className="mt-3">
              <p className="text-sm text-gray-600">Selected: {jobData.educationLevel.join(', ')}</p>
            </div>
          )}
        </div>
        
      </div>
      
      <div className="flex justify-between items-center mt-12">
        <button
          onClick={prevStep}
          className="flex items-center space-x-2 text-blue-600 font-medium hover:text-blue-700"
        >
          <span>←</span>
          <span>Back</span>
        </button>
        <button
          onClick={nextStep}
          className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium flex items-center space-x-2 hover:bg-blue-700"
        >
          <span>Continue</span>
          <span>→</span>
        </button>
      </div>
    </div>
  );

  const renderJobDescription = () => (
    <div className="px-6 py-8">
      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-gray-700 font-medium">Job description *</label>
            {isGeneratingDescription && (
              <span className="text-blue-600 text-sm flex items-center gap-2">
                <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                Generating with AI...
              </span>
            )}
          </div>
          <p className="text-gray-500 text-sm mb-4">AI-powered job description. You can edit or replace it.</p>
          
          <textarea
            value={jobData.jobDescription}
            onChange={(e) => updateJobData('jobDescription', e.target.value)}
            placeholder="Enter job description here..."
            className="w-full p-4 min-h-[200px] resize-none border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        {/* Key Responsibilities Section */}
        <div>
          <label className="block text-gray-700 font-medium mb-2">Key Responsibilities</label>
          <p className="text-gray-500 text-sm mb-4">List the main responsibilities for this role (one per line)</p>
          
          <div className="space-y-2">
            {jobData.responsibilities.map((responsibility, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={responsibility}
                  onChange={(e) => {
                    const newResponsibilities = [...jobData.responsibilities];
                    newResponsibilities[index] = e.target.value;
                    updateJobData('responsibilities', newResponsibilities);
                  }}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Develop and maintain web applications"
                />
                <button
                  onClick={() => {
                    const newResponsibilities = jobData.responsibilities.filter((_, i) => i !== index);
                    updateJobData('responsibilities', newResponsibilities);
                  }}
                  className="text-red-600 hover:text-red-800 p-2"
                >
                  ×
                </button>
              </div>
            ))}
            <button
              onClick={() => {
                updateJobData('responsibilities', [...jobData.responsibilities, '']);
              }}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center space-x-1"
            >
              <span>+</span>
              <span>Add Responsibility</span>
            </button>
          </div>
        </div>
        
        {/* Requirements Section */}
        <div>
          <label className="block text-gray-700 font-medium mb-2">Requirements</label>
          <p className="text-gray-500 text-sm mb-4">List the key requirements for this role (one per line)</p>
          
          <div className="space-y-2">
            {jobData.requirements.map((requirement, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={requirement}
                  onChange={(e) => {
                    const newRequirements = [...jobData.requirements];
                    newRequirements[index] = e.target.value;
                    updateJobData('requirements', newRequirements);
                  }}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Bachelor's degree in Computer Science"
                />
                <button
                  onClick={() => {
                    const newRequirements = jobData.requirements.filter((_, i) => i !== index);
                    updateJobData('requirements', newRequirements);
                  }}
                  className="text-red-600 hover:text-red-800 p-2"
                >
                  ×
                </button>
              </div>
            ))}
            <button
              onClick={() => {
                updateJobData('requirements', [...jobData.requirements, '']);
              }}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center space-x-1"
            >
              <span>+</span>
              <span>Add Requirement</span>
            </button>
          </div>
        </div>
        
        <div className="flex justify-end mt-4">
          <button
            onClick={() => generateJobDescription(jobData.jobTitle, true)}
            disabled={!jobData.jobTitle || isGeneratingDescription}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 transition-colors"
          >
            {isGeneratingDescription ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                <span>Generating...</span>
              </>
            ) : (
              <>
                <span>🤖</span>
                <span>Regenerate with AI</span>
              </>
            )}
          </button>
        </div>
      </div>
      
      <div className="flex justify-between items-center mt-12">
        <button
          onClick={prevStep}
          className="flex items-center space-x-2 text-blue-600 font-medium hover:text-blue-700"
        >
          <span>←</span>
          <span>Back</span>
        </button>
        <button
          onClick={nextStep}
          className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium flex items-center space-x-2 hover:bg-blue-700"
        >
          <span>Continue</span>
          <span>→</span>
        </button>
      </div>
    </div>
  );

  const renderStep7 = () => (
    <div className="px-6 py-8">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Job details</h2>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-gray-200">
              <span className="text-gray-600">Job title</span>
              <div className="flex items-center space-x-2">
                <span className="text-gray-800">{jobData.jobTitle}</span>
                <button className="text-blue-600 hover:text-blue-700">✏️</button>
              </div>
            </div>
            
            <div className="flex justify-between items-center py-3 border-b border-gray-200">
              <span className="text-gray-600">Company for this job</span>
              <div className="flex items-center space-x-2">
                <span className="text-gray-800">{jobData.companyName}</span>
                <button className="text-blue-600 hover:text-blue-700">✏️</button>
              </div>
            </div>
            
            {/* Only show number of openings if it's actually set and not 0 */}
            {jobData.numberOfPeople > 0 && (
              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                <span className="text-gray-600">Number of openings</span>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-800">{jobData.numberOfPeople}</span>
                  <button className="text-blue-600 hover:text-blue-700">✏️</button>
                </div>
              </div>
            )}
            
            <div className="flex justify-between items-center py-3 border-b border-gray-200">
              <span className="text-gray-600">Country and language</span>
              <div className="flex items-center space-x-2">
                <div>
                  <div className="text-gray-800">{jobData.country}</div>
                  <div className="text-gray-800">{Array.isArray(jobData.language) ? jobData.language.join(', ') : jobData.language}</div>
                </div>
                <button className="text-blue-600 hover:text-blue-700">✏️</button>
              </div>
            </div>
            
            <div className="flex justify-between items-center py-3 border-b border-gray-200">
              <span className="text-gray-600">Location</span>
              <div className="flex items-center space-x-2">
                <span className="text-gray-800">{jobData.jobLocation}</span>
                <button className="text-blue-600 hover:text-blue-700">✏️</button>
              </div>
            </div>
            
            <div className="flex justify-between items-center py-3 border-b border-gray-200">
              <span className="text-gray-600">Job type</span>
              <div className="flex items-center space-x-2">
                <span className="text-gray-800">{Array.isArray(jobData.jobType) ? jobData.jobType.join(', ') : jobData.jobType}</span>
                <button className="text-blue-600 hover:text-blue-700">✏️</button>
              </div>
            </div>
            
            {/* Only show pay if user actually modified salary values */}
            {salaryModified && jobData.minSalary && jobData.maxSalary && (
              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                <span className="text-gray-600">Pay</span>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-800">
                    ₹{formatSalary(jobData.minSalary)} - ₹{formatSalary(jobData.maxSalary)} {jobData.payRate}
                  </span>
                  <button className="text-blue-600 hover:text-blue-700">✏️</button>
                </div>
              </div>
            )}
            
            {/* Only show benefits if any are selected */}
            {jobData.benefits.length > 0 && (
              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                <span className="text-gray-600">Benefits</span>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-800">{jobData.benefits.join(', ')}</span>
                  <button className="text-blue-600 hover:text-blue-700">✏️</button>
                </div>
              </div>
            )}
            
            <div className="flex justify-between items-start py-3">
              <span className="text-gray-600">Job description</span>
              <div className="flex items-start space-x-2 max-w-md">
                <div>
                  <div className="font-medium text-gray-800 mb-2">Overview</div>
                  <p className="text-gray-600 text-sm">
                    {jobData.jobDescription ? jobData.jobDescription.substring(0, 150) + '...' : (
                      <span className="text-blue-600 cursor-pointer" onClick={() => generateJobDescription(jobData.jobTitle)}>
                        Click to generate description with AI 🤖
                      </span>
                    )}
                  </p>
                </div>
                <button className="text-blue-600 mt-1 hover:text-blue-700">✏️</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-between items-center mt-12">
        <button
          onClick={prevStep}
          className="flex items-center space-x-2 text-blue-600 font-medium hover:text-blue-700"
        >
          <span>←</span>
          <span>Back</span>
        </button>
        <button
          onClick={handleSubmit}
          className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700"
        >
          {isEditMode ? 'Update Job' : 'Post Job'}
        </button>
      </div>
    </div>
  );

  const handleSubmit = async () => {
    // Check if user is logged in
    if (!user || !user.email) {
      setNotification({
        type: 'error',
        message: 'You must be logged in to post a job',
        isVisible: true
      });
      return;
    }

    // Map experienceRange to experienceLevel enum
    const mapExperienceLevel = (range: string): string => {
      if (range.includes('0-1') || range.includes('1-2')) return 'Entry';
      if (range.includes('2-3') || range.includes('3-5')) return 'Mid';
      if (range.includes('5-7') || range.includes('7-10')) return 'Senior';
      if (range.includes('10+')) return 'Lead';
      return '';
    };

    // Get proper company logo - prioritize Trinity local logo
    const logoUrl = jobData.companyName?.toLowerCase().includes('trinity') 
      ? '/images/company-logos/trinity-logo.png' 
      : jobData.companyLogo || '/images/company-logos/trinity-logo.png';
    
    // Check if salary should be included (only if user actually modified it)
    const shouldIncludeSalary = salaryModified && jobData.minSalary && jobData.maxSalary;
    
    // Format jobType as simple string - let backend handle PostgreSQL conversion
    const formatJobType = (field: any): string => {
      if (Array.isArray(field)) {
        const cleanArray = field.filter(item => item && item.trim && item.trim() !== '');
        return cleanArray.length > 0 ? cleanArray[0] : 'Full-time'; // Take first item as string
      }
      if (field && typeof field === 'string' && field.trim() !== '') {
        return field.trim();
      }
      return 'Full-time'; // Default
    };

    // Format arrays as JSON arrays for backend processing
    const formatArrayField = (field: any): any[] => {
      if (Array.isArray(field)) {
        return field.filter(item => item && item.trim && item.trim() !== '');
      }
      if (field && typeof field === 'string' && field.trim() !== '') {
        return [field.trim()];
      }
      return [];
    };

    const jobPostData = {
      jobTitle: jobData.jobTitle,
      company: user?.companyName || jobData.companyName || 'Your Company',
      companyLogo: logoUrl,
      location: jobData.jobLocation,
      jobType: formatArrayField(jobData.jobType),
      type: formatArrayField(jobData.jobType)[0] || 'Full-time',
      description: jobData.jobDescription,
      responsibilities: Array.isArray(jobData.responsibilities) ? jobData.responsibilities.join('\n') : jobData.responsibilities,
      requirements: Array.isArray(jobData.requirements) ? jobData.requirements.join('\n') : jobData.requirements,
      skills: formatArrayField(jobData.skills), // JSON array
      experienceLevel: mapExperienceLevel(jobData.experienceRange),
      // Only include salary if user actually set custom values
      ...(shouldIncludeSalary && {
        salary: {
          min: parseInt(jobData.minSalary.replace(/,/g, '')) || 0,
          max: parseInt(jobData.maxSalary.replace(/,/g, '')) || 0,
          currency: 'INR',
          period: jobData.payRate === 'per year' ? 'yearly' : jobData.payRate === 'per month' ? 'monthly' : 'hourly'
        }
      }),
      benefits: formatArrayField(jobData.benefits), // JSON array
      // Use the currently logged-in user's email
      postedBy: user.email,
      employerEmail: user.email,
      employerName: user.name,
      employerCompany: user?.companyName || jobData.companyName || 'Your Company',
      // Include employer ID from user data
      employerId: user.employerId || 'EID0001', // Fallback to 'EID0001' if not set
      // Generate a sequential position ID
      positionId: generatePositionId(),
      jobCategory: jobData.jobCategory || '',
      locationType: jobData.locationType || '',
      language: Array.isArray(jobData.language) ? jobData.language : jobData.language ? [jobData.language] : [],
      languages: Array.isArray(jobData.language) ? jobData.language : jobData.language ? [jobData.language] : [],
      country: jobData.country || '',
      experienceRange: jobData.experienceRange || ''
    };
    
    console.log('Posting job for user:', user.email);
    console.log('JobType being sent:', jobPostData.jobType, 'Type:', typeof jobPostData.jobType);
    console.log('Benefits being sent:', jobPostData.benefits, 'Type:', typeof jobPostData.benefits, 'IsArray:', Array.isArray(jobPostData.benefits));
    console.log('Skills being sent:', jobPostData.skills, 'Type:', typeof jobPostData.skills, 'IsArray:', Array.isArray(jobPostData.skills));
    console.log('Full payload:', JSON.stringify(jobPostData, null, 2));
    
    try {
      const url = isEditMode ? `${API_ENDPOINTS.JOBS}/${editJobId}` : API_ENDPOINTS.JOBS;
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jobPostData)
      });
      
      if (response.ok) {
        const result = await response.json();
        sessionStorage.removeItem('editJobData');
        setNotification({
          type: 'success',
          message: isEditMode ? 'Job updated successfully! ✅' : 'Job posted successfully! 🎉',
          isVisible: true
        });
        console.log('Job Posted by:', user.email, result);
        
        // Trigger event to refresh latest jobs
        window.dispatchEvent(new CustomEvent('jobPosted', { detail: result }));
        
        // Also dispatch a storage event for cross-tab communication
        localStorage.setItem('lastJobPosted', JSON.stringify({
          jobId: result._id || result.id,
          timestamp: new Date().toISOString(),
          postedBy: user.email
        }));
        
        // Clear the form
        setJobData({
          jobTitle: '',
          locationType: 'In person',
          jobLocation: '',
          expandCandidateSearch: false,
          experienceRange: '',
          country: '',
          language: '',
          jobCategory: '',
          priority: 'Medium',
          clientName: '',
          jobCode: '', // Backend will generate this
          reportingManager: '',
          hiringTimeline: '',
          numberOfPeople: 0,
          workAuth: [],
          jobType: [], // Ensure this is an array
          payType: 'Range',
          minSalary: '',
          maxSalary: '',
          payRate: 'per year',
          currency: 'INR',
          benefits: [],
          jobDescription: '',
          responsibilities: [],
          requirements: [],
          skills: [],
          educationLevel: "Bachelor's degree",
          certifications: [],
          companyName: '',
          companyLogo: '',
          companyId: ''
        });
        setCurrentStep(1);
        
        // Navigate back appropriately
        setTimeout(() => {
          onNavigate(isEditMode ? 'job-management' : 'job-listings');
        }, 2000);
      } else {
        const errorText = await response.text();
        console.error('Job posting failed with status:', response.status);
        console.error('Error response:', errorText);
        console.error('Request payload was:', JSON.stringify(jobPostData, null, 2));
        
        let errorMessage = 'Failed to post job';
        
        if (!errorText || errorText.trim() === '') {
          // Empty response - likely backend issue
          errorMessage = `Backend server error (${response.status}). Please check if the backend server is running and the /api/jobs endpoint is available.`;
        } else {
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.error || errorJson.message || errorMessage;
          } catch (e) {
            errorMessage = errorText || errorMessage;
          }
        }
        
        setNotification({
          type: 'error',
          message: `Job posting failed: ${errorMessage}`,
          isVisible: true
        });
      }
    } catch (error) {
      console.error('Error posting job:', error);
      setNotification({
        type: 'error',
        message: 'Error posting job. Please check if the backend server is running.',
        isVisible: true
      });
    }
  };

  return (
    <>
      <Notification
        type={notification.type}
        message={notification.message}
        isVisible={notification.isVisible}
        onClose={() => setNotification({ ...notification, isVisible: false })}
      />
      
      
      <div className="min-h-screen bg-white">
        {/* Fixed Header Section */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-6 py-4">
            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                <span>Step {currentStep === 1 ? 1 : currentStep === 3 ? 2 : currentStep === 4 ? 3 : currentStep === 5 ? 4 : currentStep === 6 ? 5 : 6} of 6</span>
                <span>{Math.round(((currentStep === 1 ? 1 : currentStep === 3 ? 2 : currentStep === 4 ? 3 : currentStep === 5 ? 4 : currentStep === 6 ? 5 : 6) / 6) * 100)}% Complete</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentStep === 1 ? 1 : currentStep === 3 ? 2 : currentStep === 4 ? 3 : currentStep === 5 ? 4 : currentStep === 6 ? 5 : 6) / 6) * 100}%` }}
                ></div>
              </div>
            </div>
            
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-800">
                {currentStep === 1 && (mode === 'parse' ? 'Review Parsed Job' : 'Add job basics')}
                {currentStep === 3 && 'Add job details'}
                {currentStep === 4 && 'Add pay and benefits'}
                {currentStep === 5 && 'Qualifications'}
                {currentStep === 6 && 'Describe the job'}
                {currentStep === 7 && 'Review'}
              </h1>
              {currentStep === 1 && parsedData && (
                <span className="text-sm text-green-600 ml-2">✨ AI Parsed</span>
              )}
            </div>
          </div>
        </div>
        
        {/* Step Content */}
        <div className="flex max-w-6xl mx-auto">
          {/* Main Content */}
          <div className="flex-1">
            {currentStep === 1 && renderStep1()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}
            {currentStep === 5 && renderQualifications()}
            {currentStep === 6 && renderJobDescription()}
            {currentStep === 7 && renderStep7()}
          </div>
          
          {/* Sidebar with Tips */}
          <div className="w-80 bg-gray-50 border-l border-gray-200 p-6">
            <div className="sticky top-32">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">💡 Tips & Help</h3>
              
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-lg border">
                    <h4 className="font-medium text-gray-800 mb-2">Job Title Tips</h4>
                    <p className="text-sm text-gray-600">Use specific, clear job titles. Avoid internal jargon or abbreviations.</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border">
                    <h4 className="font-medium text-gray-800 mb-2">Location Best Practices</h4>
                    <p className="text-sm text-gray-600">Be specific about location requirements. Remote work attracts 3x more candidates.</p>
                  </div>
                </div>
              )}
              
              {currentStep === 3 && (
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-lg border">
                    <h4 className="font-medium text-gray-800 mb-2">Job Type Impact</h4>
                    <p className="text-sm text-gray-600">Full-time positions get 40% more applications than part-time roles.</p>
                  </div>
                </div>
              )}
              
              {currentStep === 4 && (
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-lg border">
                    <h4 className="font-medium text-gray-800 mb-2">Salary Transparency</h4>
                    <p className="text-sm text-gray-600">Jobs with salary ranges get 30% more applications and higher quality candidates.</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border">
                    <h4 className="font-medium text-gray-800 mb-2">Benefits Matter</h4>
                    <p className="text-sm text-gray-600">Health insurance and visa sponsorship are top priorities for candidates.</p>
                  </div>
                </div>
              )}
              
              {currentStep === 5 && (
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-lg border">
                    <h4 className="font-medium text-gray-800 mb-2">Skills Selection</h4>
                    <p className="text-sm text-gray-600">List 5-8 key skills. Too many requirements can discourage qualified candidates.</p>
                  </div>
                </div>
              )}
              
              {currentStep === 6 && (
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-lg border">
                    <h4 className="font-medium text-gray-800 mb-2">Description Length</h4>
                    <p className="text-sm text-gray-600">Optimal job descriptions are 300-600 words. Too long descriptions reduce applications by 25%.</p>
                  </div>
                </div>
              )}
              
              {currentStep === 7 && (
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-lg border">
                    <h4 className="font-medium text-gray-800 mb-2">Final Check</h4>
                    <p className="text-sm text-gray-600">Review all details carefully. You can edit the job after posting.</p>
                  </div>
                </div>
              )}
              
              {/* Quick Stats */}
              <div className="mt-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-800 mb-2">📊 Quick Stats</h4>
                <div className="space-y-2 text-sm text-blue-700">
                  <div>• Average time to hire: 23 days</div>
                  <div>• Jobs with salary: +30% applications</div>
                  <div>• Remote jobs: +200% reach</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default JobPostingPage;
