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
  const [companyFilter, setCompanyFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [industryInput, setIndustryInput] = useState('');
  const [showIndustryDropdown, setShowIndustryDropdown] = useState(false);
  const [jobTitleFilter, setJobTitleFilter] = useState('');
  const [allCompanies, setAllCompanies] = useState<Company[]>([]);

  // Default companies
  const defaultCompanies: Company[] = [
    {
      _id: '1',
      name: 'Trinity Technology Solutions',
      industry: 'Technology',
      rating: 0,
      description: 'Leading tech solutions provider',
      location: 'Bangalore',
      employees: '100-500',
      website: 'trinitetech.com',
      openJobs: 8,
      logo: 'https://www.google.com/s2/favicons?domain=trinitetech.com&sz=128',
      reviews: 0,
      salaries: 0,
      officeLocations: 0
    },
    {
      _id: '2',
      name: 'GrowthPulss Private Solutions',
      industry: 'Business Services',
      rating: 0,
      description: 'Growth and business consulting',
      location: 'India',
      employees: '200-500',
      website: 'growthpulss.com',
      openJobs: 0,
      logo: 'https://growthpulss.com/assets/favicon_io/android-chrome-512x512.png',
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
      website: 'nambikai.com',
      openJobs: 0,
      logo: 'https://www.nambikkai.com/favicon_io/android-chrome-512x512.png',
      reviews: 0,
      salaries: 0,
      officeLocations: 0
    }
  ];

  const fetchCompaniesFromJobs = async () => {
    try {
      const [jobsRes, ...reviewsRes] = await Promise.all([
        fetch(`${API_ENDPOINTS.BASE_URL}/jobs?limit=1000`),
        ...defaultCompanies.map(c =>
          fetch(`${API_ENDPOINTS.BASE_URL}/reviews?companyName=${encodeURIComponent(c.name)}`)
        )
      ]);

      const jobsArray = jobsRes.ok ? (await jobsRes.json()) : [];

      const reviewsData = await Promise.all(
        reviewsRes.map(r => r.ok ? r.json() : { reviews: [] })
      );

      return defaultCompanies.map((company, idx) => {
        const jobCount = (Array.isArray(jobsArray) ? jobsArray : []).filter(
          (job: any) => (job.company || job.companyName)?.toLowerCase() === company.name.toLowerCase()
        ).length;

        const raw = reviewsData[idx];
        const reviewsArray: any[] = Array.isArray(raw.reviews) ? raw.reviews : Array.isArray(raw) ? raw : [];
        const reviewCount = reviewsArray.length;
        const avgRating = reviewCount
          ? parseFloat((reviewsArray.reduce((s: number, r: any) => s + (r.rating || 0), 0) / reviewCount).toFixed(1))
          : 0;

        return { ...company, openJobs: jobCount || company.openJobs, reviews: reviewCount, rating: avgRating };
      });
    } catch (error) {
      console.error('Error fetching companies from jobs:', error);
    }
    return defaultCompanies;
  };

  // Fetch companies from API
  const applyFilters = (base: Company[]) => {
    let filtered = base;
    if (searchTerm) filtered = filtered.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
    if (companyFilter) filtered = filtered.filter(c => c.name.toLowerCase().includes(companyFilter.toLowerCase()));
    if (locationFilter) filtered = filtered.filter(c => c.location.toLowerCase().includes(locationFilter.toLowerCase()));
    if (industryInput) filtered = filtered.filter(c => c.industry.toLowerCase().includes(industryInput.toLowerCase()));
    if (jobTitleFilter) filtered = filtered.filter(c =>
      c.description?.toLowerCase().includes(jobTitleFilter.toLowerCase()) ||
      c.industry?.toLowerCase().includes(jobTitleFilter.toLowerCase())
    );
    setCompanies(filtered);
  };

  const handleLoadMoreCompanies = () => {
    applyFilters(allCompanies);
  };

  useEffect(() => {
    const loadCompanies = async () => {
      const companiesFromJobs = await fetchCompaniesFromJobs();
      setAllCompanies(companiesFromJobs);
      setCompanies(companiesFromJobs);
      setLoading(false);
    };
    loadCompanies();
  }, []);

  useEffect(() => {
    applyFilters(allCompanies);
  }, [searchTerm, companyFilter, locationFilter, industryInput, jobTitleFilter, allCompanies]);

  const formatSalary = (salary: number) => {
    if (salary >= 1000000) {
      return `₹${(salary / 100000).toFixed(0)}L`;
    }
    return `₹${(salary / 1000).toFixed(0)}K`;
  };

  const getFilteredIndustries = () => {
    const uniqueIndustries = [...new Set(allCompanies.map(c => c.industry).filter(Boolean))];
    return uniqueIndustries.filter(i => i.toLowerCase().includes(industryInput.toLowerCase())).slice(0, 10);
  };



  const handleIndustrySelect = (industry: string) => {
    setIndustryInput(industry);
    setShowIndustryDropdown(false);
  };




  const getCompanyLogo = (company: Company) => {
    // Custom logo URLs for companies
    const customLogos: { [key: string]: string } = {
      'Nambikkai India': 'https://www.nambikkai.com/favicon_io/android-chrome-512x512.png',
      'Trinity Technology Solutions': 'https://www.google.com/s2/favicons?domain=trinitetech.com&sz=128',
      'GrowthPulss Private Solutions': 'https://growthpulss.com/assets/favicon_io/android-chrome-512x512.png'
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
                <div className="text-2xl font-bold text-white">{loading ? '...' : companies.reduce((sum, c) => sum + (c.reviews || 0), 0).toLocaleString()}</div>
                <div className="text-white/80 text-sm">Reviews</div>
              </div>
              <div className="w-px h-8 bg-white/30"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{loading ? '...' : companies.reduce((sum, c) => sum + (c.openJobs || 0), 0)}+</div>
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
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
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
                value={jobTitleFilter}
                onChange={(e) => setJobTitleFilter(e.target.value)}
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
                          className="w-20 h-20 rounded-lg object-contain border border-gray-200 bg-white p-1"
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
                            <span className="font-semibold text-gray-900">
                              {company.rating > 0 ? company.rating : '—'}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                          {[company.location, `${company.employees} employees`, company.officeLocations ? `${company.officeLocations} office locations` : null].filter(Boolean).join(' • ')}
                        </p>
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
