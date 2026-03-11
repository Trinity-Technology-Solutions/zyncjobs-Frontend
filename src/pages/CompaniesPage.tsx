import React, { useState, useEffect } from 'react';
import { Search, MapPin, Users, Star, Building, Globe, ChevronDown } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BackButton from '../components/BackButton';
import { API_ENDPOINTS } from '../config/env';

interface Company {
  _id: string;
  name: string;
  industry: string;
  rating: number;
  description: string;
  location: string;
  employees: string;
  website: string;
  openJobs: number;
  logo?: string;
  reviews?: number;
  salaries?: number;
  officeLocations?: number;
}

const CompaniesPage = ({ onNavigate, user, onLogout }: { 
  onNavigate?: (page: string) => void;
  user?: {name: string, type: 'candidate' | 'employer'} | null;
  onLogout?: () => void;
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreCompanies, setHasMoreCompanies] = useState(true);
  const companiesPerPage = 12;
  
  // Filter states
  const [industryInput, setIndustryInput] = useState('');
  const [sizeInput, setSizeInput] = useState('');
  const [workSettingInput, setWorkSettingInput] = useState('');
  const [showIndustryDropdown, setShowIndustryDropdown] = useState(false);
  const [showSizeDropdown, setShowSizeDropdown] = useState(false);
  const [showWorkSettingDropdown, setShowWorkSettingDropdown] = useState(false);
  
  // Data arrays
  const [industries, setIndustries] = useState<string[]>([]);
  const [companySizes, setCompanySizes] = useState<string[]>([]);
  const [workSettings, setWorkSettings] = useState<string[]>([]);

  // Load filter data
  const loadFilterData = async () => {
    try {
      const [industriesRes, sizesRes, workSettingsRes] = await Promise.all([
        fetch('/backend/data/industries.json'),
        fetch('/backend/data/company-sizes.json'),
        fetch('/backend/data/work-settings.json')
      ]);
      
      if (industriesRes.ok) {
        const industriesData = await industriesRes.json();
        setIndustries(industriesData);
      }
      
      if (sizesRes.ok) {
        const sizesData = await sizesRes.json();
        setCompanySizes(sizesData);
      }
      
      if (workSettingsRes.ok) {
        const workSettingsData = await workSettingsRes.json();
        setWorkSettings(workSettingsData);
      }
    } catch (error) {
      console.error('Error loading filter data:', error);
    }
  };

  // Default companies
  const defaultCompanies: Company[] = [
    {
      _id: '1',
      name: 'Trinity Technology Solutions',
      industry: 'Technology',
      rating: 0,
      description: 'Leading tech solutions provider',
      location: 'India',
      employees: '500-1000',
      website: 'trinitetech.com',
      openJobs: 0,
      logo: 'https://www.google.com/s2/favicons?domain=trinitetech.com&sz=64',
      reviews: 0,
      salaries: 0,
      officeLocations: 0
    },
    {
      _id: '2',
      name: 'GrowthPulse Solutions',
      industry: 'Business Services',
      rating: 0,
      description: 'Growth and business consulting',
      location: 'India',
      employees: '200-500',
      website: 'growthpulss.com',
      openJobs: 0,
      logo: 'https://www.google.com/s2/favicons?domain=growthpulss.com&sz=64',
      reviews: 0,
      salaries: 0,
      officeLocations: 0
    },
    {
      _id: '3',
      name: 'Nambikkai India',
      industry: 'Non-Profit',
      rating: 0,
      description: 'Social impact organization',
      location: 'India',
      employees: '100-200',
      website: 'nambikkai.com',
      openJobs: 0,
      logo: 'https://www.google.com/s2/favicons?domain=nambikkai.com&sz=64',
      reviews: 0,
      salaries: 0,
      officeLocations: 0
    },
    {
      _id: '4',
      name: 'Petrichor India',
      industry: 'Technology',
      rating: 0,
      description: 'Innovation and tech development',
      location: 'India',
      employees: '300-600',
      website: '',
      openJobs: 0,
      logo: 'https://www.google.com/s2/favicons?domain=petrichor.com&sz=64',
      reviews: 0,
      salaries: 0,
      officeLocations: 0
    }
  ];

  const fetchCompaniesFromJobs = async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/jobs?limit=1000`);
      if (response.ok) {
        const jobs = await response.json();
        const jobsArray = Array.isArray(jobs) ? jobs : [];
        
        const companyMap = new Map<string, Company>();
        
        jobsArray.forEach((job: any) => {
          const companyName = job.company || job.companyName;
          if (companyName && !companyMap.has(companyName)) {
            companyMap.set(companyName, {
              _id: companyName.toLowerCase().replace(/\s+/g, '-'),
              name: companyName,
              industry: job.industry || 'Technology',
              rating: (Math.random() * 1.5 + 3.5).toFixed(1) as any,
              description: job.description || 'Company description',
              location: job.location || 'India',
              employees: '100-500',
              website: job.website || '',
              openJobs: 0,
              logo: '',
              reviews: Math.floor(Math.random() * 3000) + 100,
              salaries: Math.floor(Math.random() * 50000000) + 4000000,
              officeLocations: Math.floor(Math.random() * 5) + 1
            });
          }
        });

        const mergedCompanies = Array.from(companyMap.values());
        const allCompanies = [...defaultCompanies, ...mergedCompanies];
        
        const uniqueCompanies = Array.from(
          new Map(allCompanies.map(c => [c.name.toLowerCase(), c])).values()
        );

        const companiesWithJobCounts = uniqueCompanies.map(company => {
          const jobCount = jobsArray.filter(
            (job: any) => (job.company || job.companyName)?.toLowerCase() === company.name.toLowerCase()
          ).length;
          const avgRating = jobsArray
            .filter((job: any) => (job.company || job.companyName)?.toLowerCase() === company.name.toLowerCase())
            .reduce((sum: number, job: any) => sum + (job.rating || 0), 0) / (jobCount || 1);
          const avgSalary = jobsArray
            .filter((job: any) => (job.company || job.companyName)?.toLowerCase() === company.name.toLowerCase())
            .reduce((sum: number, job: any) => sum + (job.salary || 0), 0) / (jobCount || 1);
          const locations = new Set(jobsArray
            .filter((job: any) => (job.company || job.companyName)?.toLowerCase() === company.name.toLowerCase())
            .map((job: any) => job.location));
          
          return { 
            ...company, 
            openJobs: jobCount,
            rating: avgRating > 0 ? parseFloat(avgRating.toFixed(1)) : 0,
            salaries: avgSalary > 0 ? avgSalary : 0,
            officeLocations: locations.size,
            reviews: 0
          };
        });

        return companiesWithJobCounts;
      }
    } catch (error) {
      console.error('Error fetching companies from jobs:', error);
    }
    return defaultCompanies;
  };

  // Fetch companies from API
  const fetchCompanies = async (page = 1, append = false) => {
    try {
      if (!append) setLoading(true);
      
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/jobs?limit=1000`);
      if (response.ok) {
        const jobs = await response.json();
        const jobsArray = Array.isArray(jobs) ? jobs : [];
        
        const filtered = jobsArray.filter((job: any) => {
          const companyName = (job.company || job.companyName || '').toLowerCase();
          return companyName.includes(searchTerm.toLowerCase());
        });

        const companyMap = new Map<string, Company>();
        filtered.forEach((job: any) => {
          const companyName = job.company || job.companyName;
          if (companyName && !companyMap.has(companyName)) {
            companyMap.set(companyName, {
              _id: companyName.toLowerCase().replace(/\s+/g, '-'),
              name: companyName,
              industry: job.industry || 'Technology',
              rating: (Math.random() * 1.5 + 3.5).toFixed(1) as any,
              description: job.description || 'Company description',
              location: job.location || 'India',
              employees: '100-500',
              website: job.website || '',
              openJobs: 0,
              logo: '',
              reviews: Math.floor(Math.random() * 3000) + 100,
              salaries: Math.floor(Math.random() * 50000) + 40000,
              officeLocations: Math.floor(Math.random() * 5) + 1
            });
          }
        });

        const searchResults = Array.from(companyMap.values());
        const companiesWithJobCounts = searchResults.map(company => {
          const jobCount = filtered.filter(
            (job: any) => (job.company || job.companyName)?.toLowerCase() === company.name.toLowerCase()
          ).length;
          return { ...company, openJobs: jobCount };
        });

        if (append) {
          setCompanies(prev => [...prev, ...companiesWithJobCounts]);
        } else {
          setCompanies(companiesWithJobCounts);
        }
        
        setHasMoreCompanies(companiesWithJobCounts.length === companiesPerPage);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      if (!append) setLoading(false);
    }
  };

  const handleLoadMoreCompanies = () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    fetchCompanies(nextPage, true);
  };

  useEffect(() => {
    const loadCompanies = async () => {
      const companiesFromJobs = await fetchCompaniesFromJobs();
      setCompanies(companiesFromJobs);
      setLoading(false);
    };
    loadCompanies();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      fetchCompanies();
    }
  }, [searchTerm]);

  const formatSalary = (salary: number) => {
    if (salary >= 1000000) {
      return `₹${(salary / 100000).toFixed(0)}L`;
    }
    return `₹${(salary / 1000).toFixed(0)}K`;
  };

  const getFilteredIndustries = () => {
    return industries.filter(industry => 
      industry.toLowerCase().includes(industryInput.toLowerCase())
    ).slice(0, 10);
  };

  const getFilteredSizes = () => {
    return companySizes.filter(size => 
      size.toLowerCase().includes(sizeInput.toLowerCase())
    ).slice(0, 10);
  };

  const getFilteredWorkSettings = () => {
    return workSettings.filter(setting => 
      setting.toLowerCase().includes(workSettingInput.toLowerCase())
    ).slice(0, 10);
  };

  const handleIndustrySelect = (industry: string) => {
    setIndustryInput(industry);
    setShowIndustryDropdown(false);
  };

  const handleSizeSelect = (size: string) => {
    setSizeInput(size);
    setShowSizeDropdown(false);
  };

  const handleWorkSettingSelect = (setting: string) => {
    setWorkSettingInput(setting);
    setShowWorkSettingDropdown(false);
  };

  const clearFilters = () => {
    setIndustryInput('');
    setSizeInput('');
    setWorkSettingInput('');
  };

  const getCompanyLogo = (company: Company) => {
    if (company.website) {
      const domain = company.website.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    }
    
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(company.name)}&size=64&background=3b82f6&color=ffffff&bold=true`;
  };

  const handleLogoError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    const companyName = target.getAttribute('data-company-name') || '';
    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(companyName)}&size=64&background=3b82f6&color=ffffff&bold=true`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />
      
      {/* Hero Section */}
      <div className="bg-white py-12 border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <BackButton 
            onClick={() => onNavigate && onNavigate('job-listings')}
            text="Back to Jobs"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800 transition-colors mb-4"
          />
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Explore Companies</h1>
          <p className="text-gray-600 mb-6">Filter companies</p>
          <p className="text-gray-700 font-medium">{loading ? 'Loading...' : `${companies.length} companies found`}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar Filters */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4">Company</h3>
              <input
                type="text"
                placeholder="Select a company"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-6 focus:ring-2 focus:ring-blue-500"
              />

              <h3 className="font-semibold text-gray-900 mb-4">Location</h3>
              <input
                type="text"
                placeholder="Select a location"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-6 focus:ring-2 focus:ring-blue-500"
              />

              <h3 className="font-semibold text-gray-900 mb-4">Industries</h3>
              <div className="relative mb-6">
                <input
                  type="text"
                  placeholder="E.g. healthcare, internet, education"
                  value={industryInput}
                  onChange={(e) => setIndustryInput(e.target.value)}
                  onFocus={() => setShowIndustryDropdown(true)}
                  onBlur={() => setTimeout(() => setShowIndustryDropdown(false), 200)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
                {showIndustryDropdown && getFilteredIndustries().length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto mt-1">
                    {getFilteredIndustries().map((industry) => (
                      <div
                        key={`industry-${industry}`}
                        onClick={() => handleIndustrySelect(industry)}
                        className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm"
                      >
                        {industry}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <h3 className="font-semibold text-gray-900 mb-4">Job title</h3>
              <input
                type="text"
                placeholder="Select a job title"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Company Listings */}
          <div className="flex-1">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading companies...</p>
              </div>
            ) : companies.length === 0 ? (
              <div className="text-center py-12">
                <Building className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No companies found</h3>
                <p className="text-gray-500">Try adjusting your search terms.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {companies.map((company) => (
                  <div 
                    key={company._id} 
                    onClick={() => {
                      localStorage.setItem('selectedCompany', JSON.stringify(company));
                      onNavigate && onNavigate('company-details');
                    }}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="flex items-start gap-6">
                      <div className="flex-shrink-0">
                        <img 
                          src={getCompanyLogo(company)} 
                          alt={company.name}
                          data-company-name={company.name}
                          onError={handleLogoError}
                          className="w-16 h-16 rounded-lg object-cover border border-gray-200"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{company.name}</h3>
                            <p className="text-sm text-gray-600">{company.industry}</p>
                          </div>
                          <div className="flex items-center gap-1 bg-yellow-50 px-3 py-1 rounded">
                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                            <span className="font-semibold text-gray-900">{company.rating}</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{company.location} • {company.employees} employees • {company.officeLocations} office locations</p>
                        <div className="flex items-center gap-6 text-sm">
                          <div>
                            <span className="font-semibold text-blue-600">{company.reviews?.toLocaleString() || 0}</span>
                            <span className="text-gray-600 ml-1">reviews</span>
                          </div>
                          <div>
                            <span className="font-semibold text-blue-600">{formatSalary(company.salaries || 0)}</span>
                            <span className="text-gray-600 ml-1">salaries</span>
                          </div>
                          <div>
                            <span className="font-semibold text-blue-600">{company.openJobs}</span>
                            <span className="text-gray-600 ml-1">jobs</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {companies.length > 0 && hasMoreCompanies && (
              <div className="flex justify-center py-8">
                <button
                  onClick={handleLoadMoreCompanies}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Load More Companies
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <Footer onNavigate={onNavigate} user={user} />
    </div>
  );
};

export default CompaniesPage;
