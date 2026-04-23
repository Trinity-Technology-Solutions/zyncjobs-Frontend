import React, { useState, useEffect } from 'react';
import { Star, Building, Shield, Flame, TrendingUp } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BackButton from '../components/BackButton';
import { API_ENDPOINTS } from '../config/env';
import { getCompanyLogo, getSafeCompanyLogo } from '../utils/logoUtils';

interface Company {
  _id: string;
  name: string;
  companyName?: string;
  company?: string;
  industry: string;
  rating: number;
  description: string;
  location: string;
  employees: string;
  website: string;
  openJobs: number;
  logo?: string;
  companyLogo?: string;
  reviews?: number;
  salaries?: number;
  officeLocations?: number;
  userType?: string;
  email?: string;
  phone?: string;
  foundedYear?: string;
  companySize?: string;
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
  const [locationFilter2, setLocationFilter2] = useState('');
  const [allCompanies, setAllCompanies] = useState<Company[]>([]);
  const [companyLogos, setCompanyLogos] = useState<Record<string, string>>({});



  // Fetch companies from multiple endpoints - ONLY REAL REGISTERED COMPANIES
  const fetchCompaniesFromAPI = async () => {
    try {
      setLoading(true);
      let companiesData: Company[] = [];
      
      // First try to get registered employers
      const endpoints = [
        `${API_ENDPOINTS.BASE_URL}/companies`,
        `${API_ENDPOINTS.BASE_URL}/users?userType=employer`,
        `${API_ENDPOINTS.BASE_URL}/users?role=employer`,
        `${API_ENDPOINTS.BASE_URL}/employers`,
        `${API_ENDPOINTS.BASE_URL}/profiles?type=employer`
      ];
      
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying endpoint: ${endpoint}`);
          const response = await fetch(endpoint);
          if (response.ok) {
            const data = await response.json();
            const dataArray = Array.isArray(data) ? data : data.companies || data.users || data.employers || data.profiles || [];
            
            if (dataArray.length > 0) {
              console.log(`Found ${dataArray.length} registered employers from ${endpoint}`);
              companiesData = dataArray.filter((company: any) => {
                // Filter only real employers
                const isRealEmployer = 
                  company.userType === 'employer' || 
                  company.role === 'employer' ||
                  company.type === 'employer' ||
                  (company.email && company.email.includes('@'));
                
                // Exclude sample companies
                const sampleCompanies = [
                  'zoho', 'tcs', 'infosys', 'wipro', 'hcl', 'tech mahindra', 
                  'accenture', 'ibm', 'microsoft', 'google', 'amazon', 'apple', 
                  'meta', 'netflix', 'adobe', 'salesforce', 'oracle', 'sap',
                  'intel', 'nvidia', 'dell', 'hp', 'cisco', 'vmware', 'atlassian', 'capgemini'
                ];
                
                const companyName = (company.companyName || company.company || company.name || '').toLowerCase();
                const isSampleData = sampleCompanies.some(sample => companyName.includes(sample));
                
                return isRealEmployer && !isSampleData;
              });
              break;
            }
          }
        } catch (error) {
          console.log(`Failed to fetch from ${endpoint}:`, error);
          continue;
        }
      }
      
      // If no registered employers found, extract companies from job postings
      if (companiesData.length === 0) {
        console.log('No registered employers found, extracting companies from jobs...');
        try {
          const jobsResponse = await fetch(`${API_ENDPOINTS.BASE_URL}/jobs`);
          if (jobsResponse.ok) {
            const jobs = await jobsResponse.json();
            const jobsArray = Array.isArray(jobs) ? jobs : jobs.jobs || [];
            
            // Extract unique companies from jobs using normalized name dedup
            const normalizeKey = (name: string) =>
              name.toLowerCase()
                .replace(/\b(private limited|pvt\.?\s*ltd\.?|limited|ltd\.?|inc\.?|llp|llc|corp\.?|solutions|technologies|technology|services|group|india|global)\b/g, '')
                .replace(/[^a-z0-9]/g, '')
                .trim();
            const companiesFromJobs = new Map();
            
            jobsArray.forEach((job: any) => {
              const companyName = job.company || job.companyName || job.employerName || 'Unknown Company';
              const companyKey = normalizeKey(companyName);
              
              if (!companiesFromJobs.has(companyKey) && companyName !== 'Unknown Company') {
                companiesFromJobs.set(companyKey, {
                  _id: `job-company-${Date.now()}-${Math.random()}`,
                  name: companyName,
                  companyName: companyName,
                  industry: job.industry || job.jobCategory || 'Technology',
                  location: job.location || job.jobLocation || 'India',
                  employees: job.companySize || '1-50',
                  website: job.companyWebsite || '',
                  description: job.companyDescription || `${companyName} - Professional services`,
                  email: job.postedBy || job.employerEmail,
                  logo: job.companyLogo,
                  userType: 'employer',
                  extractedFromJobs: true // Mark as extracted from jobs
                });
              }
            });
            
            companiesData = Array.from(companiesFromJobs.values());
            console.log(`Extracted ${companiesData.length} companies from job postings`);
          }
        } catch (error) {
          console.log('Error extracting companies from jobs:', error);
        }
      }
      
      // If still no companies found, return empty array
      if (companiesData.length === 0) {
        console.log('No companies found from any source');
        return [];
      }
      
      // Transform and enrich company data
      const transformedCompanies = await Promise.all(
        companiesData.map(async (company: any) => {
          // Get company name from various possible fields
          const companyName = company.companyName || company.company || company.name || 'Unknown Company';
          
          // Get job count for this company
          let jobCount = 0;
          try {
            const jobsResponse = await fetch(`${API_ENDPOINTS.BASE_URL}/jobs`);
            if (jobsResponse.ok) {
              const jobs = await jobsResponse.json();
              const jobsArray = Array.isArray(jobs) ? jobs : jobs.jobs || [];
              jobCount = jobsArray.filter((job: any) => 
                (job.company || job.companyName || '').toLowerCase() === companyName.toLowerCase()
              ).length;
            }
          } catch (error) {
            console.log('Error fetching job count:', error);
          }
          
          // Get reviews count and rating
          let reviewCount = 0;
          let avgRating = 0;
          try {
            const reviewsResponse = await fetch(`${API_ENDPOINTS.BASE_URL}/reviews?companyName=${encodeURIComponent(companyName)}`);
            if (reviewsResponse.ok) {
              const reviewsData = await reviewsResponse.json();
              const reviewsArray = Array.isArray(reviewsData) ? reviewsData : reviewsData.reviews || [];
              reviewCount = reviewsArray.length;
              if (reviewCount > 0) {
                const totalRating = reviewsArray.reduce((sum: number, review: any) => sum + (review.rating || 0), 0);
                avgRating = parseFloat((totalRating / reviewCount).toFixed(1));
              }
            }
          } catch (error) {
            console.log('Error fetching reviews:', error);
          }
          
          return {
            _id: company._id || company.id || `company-${Date.now()}-${Math.random()}`,
            name: companyName,
            industry: company.industry || company.companyIndustry || 'Technology',
            rating: avgRating || company.rating || 0,
            description: company.description || company.companyDescription || `${companyName} - Professional services`,
            location: company.location || company.companyLocation || 'India',
            employees: company.employees || company.companySize || '1-50',
            website: company.website || company.companyWebsite || '',
            openJobs: jobCount,
            logo: company.companyLogo || company.logo,
            reviews: reviewCount,
            salaries: company.salaries || 0,
            officeLocations: company.officeLocations || 1,
            email: company.email,
            phone: company.phone,
            foundedYear: company.foundedYear,
            companySize: company.companySize
          };
        })
      );
      
      // Deduplicate by normalized company name (strips suffixes like Pvt Ltd, Private Limited etc.)
      const normalizeCompanyName = (name: string) =>
        name.toLowerCase()
          .replace(/\b(private limited|pvt\.?\s*ltd\.?|limited|ltd\.?|inc\.?|llp|llc|corp\.?|solutions|technologies|technology|services|group|india|global)\b/g, '')
          .replace(/[^a-z0-9]/g, '')
          .trim();

      const seen = new Map<string, any>();
      for (const company of transformedCompanies) {
        const key = normalizeCompanyName(company.name);
        if (!seen.has(key)) {
          seen.set(key, company);
        } else {
          // Keep the one with more jobs or longer name (more complete record)
          const existing = seen.get(key);
          if (company.openJobs > existing.openJobs || company.name.length > existing.name.length) {
            seen.set(key, company);
          }
        }
      }
      const uniqueCompanies = Array.from(seen.values());
      
      console.log(`Final companies count: ${uniqueCompanies.length}`);
      return uniqueCompanies;
      
    } catch (error) {
      console.error('Error fetching companies:', error);
      return []; // Return empty array instead of fallback
    }
  };

  // Apply filters to companies
  const applyFilters = (base: Company[]) => {
    let filtered = base;
    if (searchTerm) filtered = filtered.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
    if (companyFilter) filtered = filtered.filter(c => c.name.toLowerCase().includes(companyFilter.toLowerCase()));
    if (locationFilter) filtered = filtered.filter(c => c.location.toLowerCase().includes(locationFilter.toLowerCase()));
    if (industryInput) filtered = filtered.filter(c => c.industry.toLowerCase().includes(industryInput.toLowerCase()));
    if (locationFilter2) filtered = filtered.filter(c =>
      c.location?.toLowerCase().includes(locationFilter2.toLowerCase())
    );
    setCompanies(filtered);
  };

  const handleLoadMoreCompanies = () => {
    applyFilters(allCompanies);
  };

  useEffect(() => {
    const loadCompanies = async () => {
      const companiesFromAPI = await fetchCompaniesFromAPI();
      setAllCompanies(companiesFromAPI);
      setCompanies(companiesFromAPI);
      // Fetch company logos after loading companies
      await fetchCompanyLogos(companiesFromAPI);
      setLoading(false);
    };
    loadCompanies();
  }, []);

  useEffect(() => {
    applyFilters(allCompanies);
  }, [searchTerm, companyFilter, locationFilter, industryInput, locationFilter2, allCompanies]);

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

  const fetchCompanyLogos = async (jobList: any[]) => {
    try {
      const res = await fetch(API_ENDPOINTS.COMPANIES);
      if (!res.ok) return;
      const data = await res.json();
      const companies: any[] = Array.isArray(data) ? data : (data.companies || data.data || []);
      const map: Record<string, string> = {};
      companies.forEach((c: any) => {
        const name = (c.name || c.companyName || '').toLowerCase();
        const logo = c.logo || c.logoUrl || c.imageUrl || c.image || '';
        if (name && logo) map[name] = logo;
      });
      // Also check job.companyLogo field directly
      jobList.forEach((j: any) => {
        const name = (j.company || '').toLowerCase();
        const logo = j.companyLogo || j.logoUrl || '';
        if (name && logo && !map[name]) map[name] = logo;
      });
      setCompanyLogos(map);
    } catch {}
  };

  const getCompanyLogoForCard = (company: Company) => {
    const apiLogo = companyLogos[(company.name || '').toLowerCase()];
    if (apiLogo) return apiLogo;
    return getCompanyLogo(company.name || '');
  };

  const handleLogoError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    const container = target.parentElement;
    if (container) {
      // Hide the image
      target.style.display = 'none';
      // Add LinkedIn-style building icon
      container.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6B7280" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="4" y="6" width="16" height="16" rx="2" ry="2" fill="#F3F4F6" stroke="#D1D5DB"/>
          <rect x="6" y="8" width="2" height="2" fill="#9CA3AF"/>
          <rect x="10" y="8" width="2" height="2" fill="#9CA3AF"/>
          <rect x="14" y="8" width="2" height="2" fill="#9CA3AF"/>
          <rect x="6" y="12" width="2" height="2" fill="#9CA3AF"/>
          <rect x="10" y="12" width="2" height="2" fill="#9CA3AF"/>
          <rect x="14" y="12" width="2" height="2" fill="#9CA3AF"/>
          <rect x="6" y="16" width="2" height="2" fill="#9CA3AF"/>
          <rect x="10" y="16" width="2" height="2" fill="#9CA3AF"/>
          <rect x="14" y="16" width="2" height="2" fill="#9CA3AF"/>
          <rect x="8" y="2" width="8" height="4" rx="1" fill="#E5E7EB" stroke="#D1D5DB"/>
        </svg>
      `;
      container.classList.add('bg-gray-50');
    }
    // Prevent further error events
    target.onerror = null;
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
            
            <h1 className="text-4xl font-bold text-white mb-3 drop-shadow-lg flex items-center justify-center gap-3">
              Explore Top Companies
              <Building className="w-8 h-8" />
            </h1>
            <p className="text-lg text-white/90 mb-4 max-w-2xl mx-auto drop-shadow flex items-center justify-center gap-2">
              Discover amazing companies, read reviews, and find your dream workplace
              <Star className="w-5 h-5" />
            </p>
            
            {/* Stats */}
            <div className="flex justify-center items-center gap-8 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-white flex items-center justify-center gap-2">
                  <Shield className="w-6 h-6" />
                  Verified
                </div>
                <div className="text-white/80 text-sm">Companies</div>
              </div>
              <div className="w-px h-8 bg-white/30"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white flex items-center justify-center gap-2">
                  <Flame className="w-6 h-6" />
                  Trusted
                </div>
                <div className="text-white/80 text-sm">Partners</div>
              </div>
              <div className="w-px h-8 bg-white/30"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white flex items-center justify-center gap-2">
                  <TrendingUp className="w-6 h-6" />
                  Growing
                </div>
                <div className="text-white/80 text-sm">Opportunities</div>
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

              <h3 className="font-semibold text-gray-900 mb-4">Location</h3>
              <input
                type="text"
                placeholder="E.g. Bangalore, India, Remote"
                value={locationFilter2}
                onChange={(e) => setLocationFilter2(e.target.value)}
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
                          src={companyLogos[(company.name || '').toLowerCase()] || getCompanyLogoForCard(company)} 
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
