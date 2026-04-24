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



  // Fetch companies — merges registered employers + job postings so no company is ever missed
  const fetchCompaniesFromAPI = async () => {
    try {
      setLoading(true);

      // Normalize key: strip ONLY legal suffixes (Pvt Ltd, Inc etc.) — NOT business words
      const normalizeKey = (name: string) =>
        name.toLowerCase()
          .replace(/\b(private limited|pvt\.?\s*ltd\.?|limited|ltd\.?|inc\.?|llp|llc|corp\.?)\b/g, '')
          .replace(/[^a-z0-9]/g, '')
          .trim();

      // ── 1. Fetch jobs (always) ──────────────────────────────────────────────
      let jobsArray: any[] = [];
      try {
        const jobsRes = await fetch(`${API_ENDPOINTS.BASE_URL}/jobs`);
        if (jobsRes.ok) {
          const j = await jobsRes.json();
          jobsArray = Array.isArray(j) ? j : j.jobs || [];
        }
      } catch {}

      // ── 2. Fetch registered employers (try multiple endpoints) ──────────────
      let registeredEmployers: any[] = [];
      const employerEndpoints = [
        `${API_ENDPOINTS.BASE_URL}/users?userType=employer`,
        `${API_ENDPOINTS.BASE_URL}/users?role=employer`,
        `${API_ENDPOINTS.BASE_URL}/employers`,
        `${API_ENDPOINTS.BASE_URL}/companies`,
      ];
      for (const ep of employerEndpoints) {
        try {
          const res = await fetch(ep);
          if (!res.ok) continue;
          const d = await res.json();
          const arr: any[] = Array.isArray(d) ? d : d.users || d.employers || d.companies || [];
          if (arr.length > 0) {
            registeredEmployers = arr.filter((u: any) =>
              u.userType === 'employer' || u.role === 'employer' || u.type === 'employer'
            );
            if (registeredEmployers.length > 0) break;
          }
        } catch {}
      }

      // ── 3. Build a merged map keyed by normalizedName ───────────────────────
      const companyMap = new Map<string, any>();

      // Seed from registered employers first (most complete data)
      // IMPORTANT: use companyName/company only — never u.name (that's the person's name)
      registeredEmployers.forEach((u: any) => {
        const name = u.companyName || u.company || '';
        if (!name) return; // skip if no company name (person-name-only records)
        const key = normalizeKey(name);
        if (!companyMap.has(key)) {
          companyMap.set(key, {
            _id: u._id || u.id || `emp-${Math.random()}`,
            name,
            industry: u.industry || u.companyIndustry || 'Technology',
            description: u.description || u.companyDescription || `${name} - Professional services`,
            location: u.location || u.companyLocation || 'India',
            employees: u.employees || u.companySize || '1-50',
            website: u.website || u.companyWebsite || '',
            logo: u.companyLogo || u.logo || '',
            email: u.email || '',
            openJobs: 0,
            reviews: 0,
            rating: 0,
            salaries: 0,
            officeLocations: 1,
          });
        }
      });

      // Seed from jobs (adds companies that have jobs but may not be in employer list)
      jobsArray.forEach((job: any) => {
        const name = job.company || job.companyName || job.employerName || '';
        if (!name || name === 'Unknown Company') return;
        const key = normalizeKey(name);
        if (!companyMap.has(key)) {
          companyMap.set(key, {
            _id: `job-company-${Math.random()}`,
            name,
            industry: job.industry || job.jobCategory || 'Technology',
            description: job.companyDescription || `${name} - Professional services`,
            location: job.location || job.jobLocation || 'India',
            employees: job.companySize || '1-50',
            website: job.companyWebsite || '',
            logo: job.companyLogo || '',
            email: job.postedBy || '',
            openJobs: 0,
            reviews: 0,
            rating: 0,
            salaries: 0,
            officeLocations: 1,
          });
        }
      });

      if (companyMap.size === 0) return [];

      // ── 4. Count jobs per company ───────────────────────────────────────────
      jobsArray.forEach((job: any) => {
        const name = (job.company || job.companyName || '').toLowerCase();
        for (const [key, company] of companyMap.entries()) {
          if (normalizeKey(company.name) === key && company.name.toLowerCase() === name) {
            company.openJobs = (company.openJobs || 0) + 1;
            break;
          }
        }
      });

      // ── 5. Fetch reviews for each company ──────────────────────────────────
      await Promise.all(
        Array.from(companyMap.values()).map(async (company) => {
          try {
            const res = await fetch(`${API_ENDPOINTS.BASE_URL}/reviews?companyName=${encodeURIComponent(company.name)}`);
            if (!res.ok) return;
            const d = await res.json();
            const arr: any[] = Array.isArray(d) ? d : d.reviews || [];
            company.reviews = arr.length;
            if (arr.length > 0) {
              const total = arr.reduce((s: number, r: any) => s + (r.rating || 0), 0);
              company.rating = parseFloat((total / arr.length).toFixed(1));
            }
          } catch {}
        })
      );

      const result = Array.from(companyMap.values());
      console.log(`Companies loaded: ${result.length}`, result.map(c => c.name));
      return result;

    } catch (error) {
      console.error('Error fetching companies:', error);
      return [];
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
    return getCompanyLogo(company.name || '') || companyLogos[(company.name || '').toLowerCase()] || company.logo || '';
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
                          src={getCompanyLogoForCard(company)} 
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
