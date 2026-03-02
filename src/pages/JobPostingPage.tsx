import React, { useState, useEffect } from 'react';
import Notification from '../components/Notification';
import BackButton from '../components/BackButton';
import mistralAIService from '../services/mistralAIService';
import { API_ENDPOINTS } from '../config/constants';


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

const JobPostingPage: React.FC<JobPostingPageProps> = ({ onNavigate, user, onLogout, mode = 'manual', parsedData }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [jobData, setJobData] = useState<JobData>({
    jobTitle: parsedData?.jobTitle || '',
    locationType: 'In person',
    jobLocation: parsedData?.jobLocation || '',
    expandCandidateSearch: false,
    experienceRange: parsedData?.experienceRange || '',
    country: '',
    language: '',
    jobCategory: parsedData?.jobCategory || '',
    priority: parsedData?.priority || 'Medium',
    clientName: parsedData?.clientName || '',
    jobCode: `JOB-${Date.now()}`,
    reportingManager: parsedData?.reportingManager || '',
    hiringTimeline: '',
    numberOfPeople: 0,
    workAuth: parsedData?.workAuth || [],
    jobType: parsedData?.jobType || [],
    payType: 'Range',
    minSalary: parsedData?.minSalary || '50,000',
    maxSalary: parsedData?.maxSalary || '80,000',
    payRate: parsedData?.payRate || 'per year',
    currency: parsedData?.currency || 'INR',
    benefits: parsedData?.benefits || [],
    jobDescription: parsedData?.jobDescription || '',
    responsibilities: parsedData?.responsibilities || [],
    requirements: parsedData?.requirements || [],
    skills: parsedData?.skills || [],
    educationLevel: parsedData?.educationLevel || "Bachelor's degree",
    certifications: [],
    companyName: parsedData?.companyName || '',
    companyLogo: '',
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
  const [jobPostingCount, setJobPostingCount] = useState(0);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Check job posting limit on component mount
  useEffect(() => {
    const checkJobPostingLimit = async () => {
      if (user && user.email) {
        try {
          const response = await fetch(`${API_ENDPOINTS.JOBS}`);
          if (response.ok) {
            const jobs = await response.json();
            const userJobs = jobs.filter((job: any) => job.postedBy === user.email);
            setJobPostingCount(userJobs.length);
            
            // Show upgrade modal if limit reached
            if (userJobs.length >= 10) {
              setShowUpgradeModal(true);
            }
          }
        } catch (error) {
          console.error('Error checking job posting limit:', error);
        }
      }
    };
    
    checkJobPostingLimit();
  }, [user]);

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
        { id: '6', name: 'Trinity Technology Solutions', logo: '/images/zync-logo.svg' },
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

  // Load countries on component mount
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        console.log('Fetching countries...');
        const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/countries`);
        const data = await response.json();
        console.log('Countries data:', data);
        setCountries(data.countries || []);
      } catch (error) {
        console.error('Error fetching countries:', error);
        // Fallback to basic countries if API fails
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

  // AI-powered location suggestions
  const handleLocationChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    updateJobData('jobLocation', value);
    
    if (value.length >= 1) {
      setIsLoadingLocations(true);
      
      try {
        const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/locations/search/${encodeURIComponent(value)}`);
        const data = await response.json();
        console.log('Location API response:', data);
        
        if (data.locations && data.locations.length > 0) {
          setLocationSuggestions(data.locations);
          setShowLocationSuggestions(true);
        } else {
          // Fallback to basic locations if API fails
          const fallbackLocations = getFallbackLocations(value);
          setLocationSuggestions(fallbackLocations);
          setShowLocationSuggestions(fallbackLocations.length > 0);
        }
      } catch (error) {
        console.error('Location suggestions failed:', error);
        // Fallback to basic locations if API fails
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
        const response = await fetch(`${API_ENDPOINTS.JOBS.replace('/jobs', '/suggest')}?q=${encodeURIComponent(value)}&type=skill`);
        const data = await response.json();
        console.log('Skills API response:', data);
        
        if (data.suggestions && data.suggestions.length > 0) {
          setSkillSuggestions(data.suggestions);
          setShowSkillSuggestions(true);
        } else {
          setShowSkillSuggestions(false);
        }
      } catch (error) {
        console.error('Skill suggestions failed:', error);
        setShowSkillSuggestions(false);
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
      'aws': ['AWS', 'AWS Lambda', 'AWS S3', 'AWS EC2', 'AWS RDS', 'AWS CloudFormation', 'AWS ECS', 'AWS API Gateway']
    };
    
    for (const [prefix, suggestions] of Object.entries(fallbacks)) {
      if (key.startsWith(prefix) || prefix.startsWith(key)) {
        return suggestions;
      }
    }
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
      
      const description = await mistralAIService.generateJobDescription(
        jobTitle,
        jobData.companyName || 'ZyncJobs',
        jobData.jobLocation || 'Remote',
        {
          jobType: jobData.jobType.join(', ') || 'full-time',
          skills: jobData.skills,
          salary: `${currencySymbol}${jobData.minSalary} - ${currencySymbol}${jobData.maxSalary} ${jobData.payRate}`,
          benefits: jobData.benefits,
          educationLevel: jobData.educationLevel
        }
      );
      updateJobData('jobDescription', description);
      
      // Auto-populate skills and education based on job title (only on first generation)
      if (!forceUpdate) {
        const { skills, education } = getJobTitleDefaults(jobTitle);
        if (jobData.skills.length === 0 || jobData.skills.every(skill => ['AWS', 'Azure', 'GitHub', 'IT', 'Java', 'Linux', 'Python', 'SQL', 'Version control'].includes(skill))) {
          updateJobData('skills', skills);
        }
        if (jobData.educationLevel === "Bachelor's degree") {
          updateJobData('educationLevel', education);
        }
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

  // Select suggestions
  const selectJobTitle = (title: string) => {
    updateJobData('jobTitle', title);
    setShowJobTitleSuggestions(false);
    setJobTitleSuggestions([]);
    // Generate description after title is selected
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

  const selectLocation = (location: string) => {
    updateJobData('jobLocation', location);
    setShowLocationSuggestions(false);
    setLocationSuggestions([]);
  };

  const addSkill = (skill: string) => {
    if (!jobData.skills.includes(skill)) {
      updateJobData('skills', [...jobData.skills, skill]);
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
      { id: '6', name: 'Trinity Technology Solutions', logo: '/images/zync-logo.svg' },
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
        if (!jobData.experienceRange.trim()) return { isValid: false, message: 'Experience range is required' };
        const languages = Array.isArray(jobData.language) ? jobData.language : jobData.language ? [jobData.language] : [];
        if (languages.length === 0) return { isValid: false, message: 'At least one language is required' };
        break;
      case 2:
        if (!jobData.hiringTimeline.trim()) return { isValid: false, message: 'Hiring timeline is required' };
        if (!jobData.numberOfPeople || jobData.numberOfPeople <= 0) return { isValid: false, message: 'Number of people to hire is required' };
        break;
      case 3:
        if (jobData.jobType.length === 0) return { isValid: false, message: 'At least one job type is required' };
        break;
      case 4:
        if (!jobData.minSalary.trim()) return { isValid: false, message: 'Minimum salary is required' };
        if (!jobData.maxSalary.trim()) return { isValid: false, message: 'Maximum salary is required' };
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
    
    if (currentStep < 7) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };


  const renderStep1 = () => (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <div className="text-center mb-8">
        <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 p-2">
          <img 
            src="/images/zync-logo.svg" 
            alt="ZyncJobs" 
            className="w-full h-full object-contain"
          />
        </div>
        <div className="flex justify-between items-center">
          <BackButton 
            onClick={() => mode === 'parse' ? onNavigate('job-parsing') : onNavigate('job-posting-selection')}
            text={mode === 'parse' ? 'Back to Parser' : 'Back to Selection'}
          />
          <h1 className="text-3xl font-bold text-gray-800">
            {mode === 'parse' ? 'Review Parsed Job' : 'Add job basics'}
            {parsedData && <span className="text-sm text-green-600 ml-2">✨ AI Parsed</span>}
          </h1>
          <button onClick={() => onNavigate('dashboard')} className="text-gray-500 text-2xl hover:text-gray-700">×</button>
        </div>
      </div>
      
      <div className="space-y-8">
        <div className="relative">
          <label className="block text-gray-700 font-medium mb-3">Job title *</label>
          <div className="relative">
            <input
              type="text"
              value={jobData.jobTitle}
              onChange={handleJobTitleChange}
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
          <p className="text-gray-500 text-sm mb-3">Enter a street address or ZIP code</p>
          <div className="relative">
            <input
              type="text"
              value={jobData.jobLocation}
              onChange={handleLocationChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 pr-10 text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g. Chennai, Remote"
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
                <button
                  key={index}
                  type="button"
                  onClick={() => selectLocation(location)}
                  className="w-full text-left px-4 py-3 hover:bg-blue-50 text-sm border-b last:border-b-0 transition-colors flex items-center justify-between group"
                >
                  <span>{location}</span>
                  <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">📍 AI</span>
                </button>
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
          <label className="block text-gray-700 font-medium mb-3">Experience Range *</label>
          <select
            value={jobData.experienceRange}
            onChange={(e) => updateJobData('experienceRange', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select experience range</option>
            <option value="0-1 years">0-1 years</option>
            <option value="1-2 years">1-2 years</option>
            <option value="2-3 years">2-3 years</option>
            <option value="3-5 years">3-5 years</option>
            <option value="5-7 years">5-7 years</option>
            <option value="7-10 years">7-10 years</option>
            <option value="10+ years">10+ years</option>
          </select>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 font-medium mb-3">Client Name</label>
            <input
              type="text"
              value={jobData.clientName}
              onChange={(e) => updateJobData('clientName', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g. ABC Corp"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-3">Job Code</label>
            <input
              type="text"
              value={jobData.jobCode}
              onChange={(e) => updateJobData('jobCode', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Auto-generated"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-gray-700 font-medium mb-3">Reporting Manager</label>
          <input
            type="text"
            value={jobData.reportingManager}
            onChange={(e) => updateJobData('reportingManager', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g. John Smith, VP Engineering"
          />
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
    <div className="max-w-2xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Add job details</h1>
      
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
    <div className="max-w-2xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Add pay and benefits</h1>
      
      <div className="space-y-8">
        <div>
          <h3 className="text-gray-700 font-medium mb-2">Pay</h3>
          <p className="text-gray-500 text-sm mb-6">Review the pay we estimated for your job and adjust as needed.</p>
          
          <div className="grid grid-cols-6 gap-4 items-end">
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
              <select
                value={jobData.currency || 'USD'}
                onChange={(e) => updateJobData('currency', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="USD">$ USD</option>
                <option value="EUR">€ EUR</option>
                <option value="GBP">£ GBP</option>
                <option value="INR">₹ INR</option>
                <option value="CAD">C$ CAD</option>
                <option value="AUD">A$ AUD</option>
                <option value="JPY">¥ JPY</option>
                <option value="SGD">S$ SGD</option>
              </select>
            </div>
            
            <div>
              <label className="block text-gray-600 text-sm mb-2">Minimum</label>
              <input
                type="text"
                value={jobData.minSalary}
                onChange={(e) => updateJobData('minSalary', e.target.value)}
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
                value={jobData.maxSalary}
                onChange={(e) => updateJobData('maxSalary', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
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
    <div className="max-w-2xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Qualifications</h1>
      
      <div className="space-y-8">
        
        <div>
          <h3 className="text-gray-700 font-medium mb-4">What skills should candidates have?</h3>
          
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
                  addSkill(skillInput.trim());
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
                    onClick={() => addSkill(skill)}
                    className="w-full text-left px-4 py-3 hover:bg-blue-50 text-sm border-b last:border-b-0 transition-colors flex items-center justify-between group"
                  >
                    <span>{skill}</span>
                    <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">🚀 AI</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Predefined Skills */}
          <div className="flex flex-wrap gap-3 mt-4">
            {[
              'AWS', 'Azure', 'GitHub', 'IT', 'Java', 'Linux',
              'Python', 'SQL', 'Version control', 'React', 'Node.js'
            ].map((skill) => (
              <button
                key={skill}
                type="button"
                onClick={() => {
                  const newSkills = jobData.skills.includes(skill)
                    ? jobData.skills.filter(s => s !== skill)
                    : [...jobData.skills, skill];
                  updateJobData('skills', newSkills);
                }}
                className={`px-3 py-2 border rounded-lg text-sm transition-colors ${
                  jobData.skills.includes(skill)
                    ? 'border-blue-600 text-blue-600 bg-blue-50'
                    : 'border-gray-300 text-gray-700 hover:border-gray-400'
                }`}
              >
                {jobData.skills.includes(skill) ? '✓' : '+'} {skill}
              </button>
            ))}
          </div>
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
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Describe the job</h1>
      
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
          
          <div className="border border-gray-300 rounded-lg">
            <div className="border-b border-gray-200 p-3 bg-gray-50 flex items-center space-x-2">
              <button className="p-1 hover:bg-gray-200 rounded"><strong>B</strong></button>
              <button className="p-1 hover:bg-gray-200 rounded"><em>I</em></button>
              <button className="p-1 hover:bg-gray-200 rounded">•</button>
              <button className="p-1 hover:bg-gray-200 rounded text-sm">?</button>
            </div>
            <textarea
              value={jobData.jobDescription}
              onChange={(e) => updateJobData('jobDescription', e.target.value)}
              placeholder="Enter job description here..."
              className="w-full p-4 min-h-[200px] resize-none border-none outline-none focus:ring-0"
            />
          </div>
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
    <div className="max-w-2xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Review</h1>
      
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
            
            <div className="flex justify-between items-center py-3 border-b border-gray-200">
              <span className="text-gray-600">Number of openings</span>
              <div className="flex items-center space-x-2">
                <span className="text-gray-800">{jobData.numberOfPeople}</span>
                <button className="text-blue-600 hover:text-blue-700">✏️</button>
              </div>
            </div>
            
            <div className="flex justify-between items-center py-3 border-b border-gray-200">
              <span className="text-gray-600">Country and language</span>
              <div className="flex items-center space-x-2">
                <div>
                  <div className="text-gray-800">{jobData.country}</div>
                  <div className="text-gray-800">{jobData.language}</div>
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
                <span className="text-gray-800">{jobData.jobType.join(', ')}</span>
                <button className="text-blue-600 hover:text-blue-700">✏️</button>
              </div>
            </div>
            
            <div className="flex justify-between items-center py-3 border-b border-gray-200">
              <span className="text-gray-600">Pay</span>
              <div className="flex items-center space-x-2">
                <span className="text-gray-800">
                  {jobData.currency === 'USD' && '$'}
                  {jobData.currency === 'EUR' && '€'}
                  {jobData.currency === 'GBP' && '£'}
                  {jobData.currency === 'INR' && '₹'}
                  {jobData.currency === 'CAD' && 'C$'}
                  {jobData.currency === 'AUD' && 'A$'}
                  {jobData.currency === 'JPY' && '¥'}
                  {jobData.currency === 'SGD' && 'S$'}
                  {jobData.minSalary} - {jobData.currency === 'USD' && '$'}
                  {jobData.currency === 'EUR' && '€'}
                  {jobData.currency === 'GBP' && '£'}
                  {jobData.currency === 'INR' && '₹'}
                  {jobData.currency === 'CAD' && 'C$'}
                  {jobData.currency === 'AUD' && 'A$'}
                  {jobData.currency === 'JPY' && '¥'}
                  {jobData.currency === 'SGD' && 'S$'}
                  {jobData.maxSalary} {jobData.payRate}
                </span>
                <button className="text-blue-600 hover:text-blue-700">✏️</button>
              </div>
            </div>
            
            <div className="flex justify-between items-center py-3 border-b border-gray-200">
              <span className="text-gray-600">Benefits</span>
              <div className="flex items-center space-x-2">
                <span className="text-gray-800">{jobData.benefits.join(', ')}</span>
                <button className="text-blue-600 hover:text-blue-700">✏️</button>
              </div>
            </div>
            
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
          Post Job
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

    // Check job posting limit
    if (jobPostingCount >= 10) {
      setShowUpgradeModal(true);
      return;
    }

    // Map experienceRange to experienceLevel enum
    const mapExperienceLevel = (range: string): string => {
      if (range.includes('0-1') || range.includes('1-2')) return 'Entry';
      if (range.includes('2-3') || range.includes('3-5')) return 'Mid';
      if (range.includes('5-7') || range.includes('7-10')) return 'Senior';
      if (range.includes('10+')) return 'Lead';
      return 'Mid';
    };

    // Get proper company logo
    const logoUrl = jobData.companyLogo || '/images/trinity-logo.webp';
    
    const jobPostData = {
      jobTitle: jobData.jobTitle,
      company: user?.companyName || jobData.companyName || 'Your Company',
      companyLogo: logoUrl,
      location: jobData.jobLocation,
      jobType: jobData.jobType.length > 0 ? jobData.jobType.join(', ') : 'Full-time',
      description: jobData.jobDescription,
      responsibilities: Array.isArray(jobData.responsibilities) ? jobData.responsibilities.join('\n') : jobData.responsibilities,
      requirements: Array.isArray(jobData.requirements) ? jobData.requirements.join('\n') : jobData.requirements,
      skills: jobData.skills,
      experienceLevel: mapExperienceLevel(jobData.experienceRange),
      salary: {
        min: parseInt(jobData.minSalary.replace(/,/g, '')) || 0,
        max: parseInt(jobData.maxSalary.replace(/,/g, '')) || 0,
        currency: jobData.currency,
        period: jobData.payRate === 'per year' ? 'yearly' : jobData.payRate === 'per month' ? 'monthly' : 'hourly'
      },
      benefits: jobData.benefits,
      // Use the currently logged-in user's email
      postedBy: user.email,
      employerEmail: user.email,
      employerName: user.name,
      employerCompany: user?.companyName || jobData.companyName || 'Your Company'
    };
    
    console.log('Posting job for user:', user.email, jobPostData);
    
    try {
      const response = await fetch(API_ENDPOINTS.JOBS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jobPostData)
      });
      
      if (response.ok) {
        const result = await response.json();
        setNotification({
          type: 'success',
          message: `Job posted successfully by ${user.email}! 🎉`,
          isVisible: true
        });
        console.log('Job Posted by:', user.email, result);
        
        // Trigger event to refresh latest jobs
        window.dispatchEvent(new CustomEvent('jobPosted', { detail: result }));
        
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
          jobCode: `JOB-${Date.now()}`,
          reportingManager: '',
          hiringTimeline: '',
          numberOfPeople: 0,
          workAuth: [],
          jobType: [],
          payType: 'Range',
          minSalary: '50,000',
          maxSalary: '80,000',
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
        
        // Navigate back to dashboard after 2 seconds
        setTimeout(() => {
          onNavigate('dashboard');
        }, 2000);
      } else {
        const errorText = await response.text();
        console.error('Job posting failed:', errorText);
        let errorMessage = 'Failed to post job';
        
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorJson.message || errorMessage;
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }
        
        setNotification({
          type: 'error',
          message: errorMessage,
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
      
      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md mx-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-yellow-600 text-2xl">⚡</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Free Limit Reached</h3>
              <p className="text-gray-600 mb-6">
                You've used all 10 free job postings. Upgrade to Professional plan to post unlimited jobs.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowUpgradeModal(false);
                    onNavigate('dashboard');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowUpgradeModal(false);
                    onNavigate('pricing');
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Upgrade Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="min-h-screen bg-white">
        {/* Job Posting Limit Warning */}
        {jobPostingCount >= 8 && jobPostingCount < 10 && (
          <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-4">
            <div className="max-w-2xl mx-auto flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-yellow-600 mr-2">⚠️</span>
                <span className="text-yellow-800">
                  You have {10 - jobPostingCount} free job posting{10 - jobPostingCount !== 1 ? 's' : ''} remaining.
                </span>
              </div>
              <button
                onClick={() => onNavigate('pricing')}
                className="text-yellow-800 underline hover:text-yellow-900"
              >
                View Plans
              </button>
            </div>
          </div>
        )}
        
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
        {currentStep === 5 && renderQualifications()}
        {currentStep === 6 && renderJobDescription()}
        {currentStep === 7 && renderStep7()}
      </div>
    </>
  );
};

export default JobPostingPage;