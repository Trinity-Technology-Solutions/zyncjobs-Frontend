import React, { useState, useEffect } from 'react';
import { Star, Building } from 'lucide-react';
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
  const [workSettingInput, setWorkSettingInput] = useState('');
  const [showIndustryDropdown, setShowIndustryDropdown] = useState(false);
  const [showSizeDropdown, setShowSizeDropdown] = useState(false);
  const [showWorkSettingDropdown, setShowWorkSettingDropdown] = useState(false);
  
  // Data arrays
  const [industries, setIndustries] = useState<string[]>([]);
  const [companySizes, setCompanySizes] = useState<string[]>([]);
  const [workSettings, setWorkSettings] = useState<string[]>([]);

  // Load filter data

  // Default companies
  const defaultCompanies: Company[] = [
    {
      _id: '1',
      name: 'Trinity Technology Solutions',
      industry: 'Technology',
      rating: 4.2,
      description: 'Leading tech solutions provider',
      location: 'India',
      employees: '500-1000',
      website: 'trinitetech.com',
      openJobs: 0,
      logo: 'https://www.google.com/s2/favicons?domain=trinitetech.com&sz=64',
      reviews: 245,
      salaries: 8500000,
      officeLocations: 3
    },
    {
      _id: '2',
      name: 'GrowthPulss Private Solutions',
      industry: 'Business Services',
      rating: 3.8,
      description: 'Growth and business consulting',
      location: 'India',
      employees: '200-500',
      website: 'growthpulss.com',
      openJobs: 0,
      logo: 'https://www.google.com/s2/favicons?domain=growthpulss.com&sz=64',
      reviews: 156,
      salaries: 6200000,
      officeLocations: 2
    },
    {
      _id: '3',
      name: 'Nambikkai India',
      industry: 'Non-Profit',
      rating: 4.0,
      description: 'Social impact organization',
      location: 'India',
      employees: '100-200',
      website: 'nambikai.com',
      openJobs: 0,
      logo: 'https://www.google.com/s2/favicons?domain=nambikai.com&sz=64',
      reviews: 89,
      salaries: 4500000,
      officeLocations: 1
    },
    {
      _id: '4',
      name: 'Petrichor',
      industry: 'Technology',
      rating: 4.1,
      description: 'Innovation and tech development',
      location: 'India',
      employees: '300-600',
      website: 'petrichor.com',
      openJobs: 0,
      logo: 'https://www.google.com/s2/favicons?domain=petrichor.com&sz=64',
      reviews: 178,
      salaries: 7800000,
      officeLocations: 2
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



  const handleIndustrySelect = (industry: string) => {
    setIndustryInput(industry);
    setShowIndustryDropdown(false);
  };




  const getCompanyLogo = (company: Company) => {
    // Custom logo URLs for companies
    const customLogos: { [key: string]: string } = {
      'Nambikkai India': 'https://ui-avatars.com/api/?name=Nambikkai&size=64&background=10b981&color=ffffff&bold=true',
      'Trinity Technology Solutions': 'https://www.google.com/s2/favicons?domain=trinitetech.com&sz=64',
      'GrowthPulss Private Solutions': 'https://www.google.com/s2/favicons?domain=growthpulss.com&sz=64',
      'Petrichor': 'https://www.google.com/s2/favicons?domain=petrichor.com&sz=64'
    };

    // Check if company has custom logo
    if (customLogos[company.name]) {
      return customLogos[company.name];
    }

    // Fallback to website favicon
    if (company.website) {
      const domain = company.website.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    }
    
    // Final fallback to avatar
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
      <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 py-12 border-b border-gray-200 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Ccircle cx='7' cy='7' r='7'/%3E%3Ccircle cx='53' cy='7' r='7'/%3E%3Ccircle cx='7' cy='53' r='7'/%3E%3Ccircle cx='53' cy='53' r='7'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }}></div>
        </div>
        
        {/* Floating Elements */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-20 right-20 w-32 h-32 bg-white/5 rounded-full blur-2xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-10 left-1/4 w-16 h-16 bg-white/10 rounded-full blur-lg animate-pulse delay-500"></div>
        
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <BackButton 
            onClick={() => onNavigate && onNavigate('job-listings')}
            text="Back to Jobs"
            className="inline-flex items-center text-sm text-white/80 hover:text-white transition-colors mb-4 bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm"
          />
          
          <div className="text-center">
            {/* Company Icons */}
            <div className="flex justify-center items-center mb-4">
              <div className="flex -space-x-2">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30">
                  <Building className="w-6 h-6 text-white" />
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30">
                  <Star className="w-6 h-6 text-white" />
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30">
                  <Building className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            
            <h1 className="text-4xl font-bold text-white mb-3 drop-shadow-lg">
              Explore Top Companies
            </h1>
            <p className="text-lg text-white/90 mb-4 max-w-2xl mx-auto drop-shadow">
              Discover amazing companies, read reviews, and find your dream workplace
            </p>
            
            {/* Stats */}
            <div className="flex justify-center items-center gap-8 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{loading ? '...' : companies.length}+</div>
                <div className="text-white/80 text-sm">Companies</div>
              </div>
              <div className="w-px h-8 bg-white/30"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">10K+</div>
                <div className="text-white/80 text-sm">Reviews</div>
              </div>
              <div className="w-px h-8 bg-white/30"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">500+</div>
                <div className="text-white/80 text-sm">Open Jobs</div>
              </div>
            </div>
            
            {/* Search Bar */}
            <div className="max-w-md mx-auto">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search companies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-6 py-3 rounded-full text-gray-900 placeholder-gray-500 bg-white/95 backdrop-blur-sm border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 shadow-lg"
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <Building className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            </div>
          </div>
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
