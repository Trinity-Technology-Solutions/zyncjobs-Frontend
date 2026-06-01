import React, { useState, useEffect, useRef } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BackButton from '../components/BackButton';
import { API_ENDPOINTS } from '../config/env';
import { Search, MapPin, Users, Building2, Star, Briefcase } from 'lucide-react';
import { getCompanyLogo } from '../utils/logoUtils';

// Local logo map for companies with known local assets
const LOCAL_LOGOS: Record<string, string> = {
  'nambikkai india': '/images/company-logos/nambikkai-logo.png',
  'nambikkai': '/images/company-logos/nambikkai-logo.png',
  'trinity technology solutions': '/images/company-logos/trinity-logo.png',
  'trinity': '/images/company-logos/trinity-logo.png',
  'growthpulse solutions': '/images/company-logos/growthpulss.png',
  'growthpulse': '/images/company-logos/growthpulss.png',
  'growthpulss': '/images/company-logos/growthpulss.png',
  'inypeople': '/images/company-logos/inypeople-logo.png',
};

// Known domain map for companies without a stored domain
const KNOWN_DOMAINS: Record<string, string> = {
  'infosys': 'infosys.com',
  'zoho': 'zoho.com',
  'tcs': 'tcs.com',
  'wipro': 'wipro.com',
  'google': 'google.com',
  'microsoft': 'microsoft.com',
  'amazon': 'amazon.com',
  'apple': 'apple.com',
  'meta': 'meta.com',
  'accenture': 'accenture.com',
  'cognizant': 'cognizant.com',
  'hcl': 'hcltech.com',
  'tech mahindra': 'techmahindra.com',
  'freshworks': 'freshworks.com',
};

// Multi-fallback logo component
const CompanyLogo: React.FC<{ company: { name: string; logo?: string; logoUrl?: string; domain?: string; website?: string }; className?: string }> = ({ company, className }) => {
  const nameLower = company.name.toLowerCase();

  // Check local logo first (exact then partial)
  const getLocalLogo = (): string => {
    if (LOCAL_LOGOS[nameLower]) return LOCAL_LOGOS[nameLower];
    for (const [key, path] of Object.entries(LOCAL_LOGOS)) {
      if (nameLower.includes(key) || key.includes(nameLower)) return path;
    }
    return '';
  };

  const getDomain = (): string => {
    if (company.domain) return company.domain;
    try { const h = new URL(company.website || '').hostname; return h.replace('www.', ''); } catch {}
    // Check known domains map
    if (KNOWN_DOMAINS[nameLower]) return KNOWN_DOMAINS[nameLower];
    for (const [key, domain] of Object.entries(KNOWN_DOMAINS)) {
      if (nameLower.includes(key)) return domain;
    }
    return '';
  };

  const buildFallbacks = (): string[] => {
    const urls: string[] = [];
    const localLogo = getLocalLogo();
    if (localLogo) urls.push(localLogo);
    const domain = getDomain();
    if (domain) {
      urls.push(`https://logo.clearbit.com/${domain}`);
      urls.push(`https://img.logo.dev/${domain}?token=pk_cY8JBeWnQR6g5m_ymQhBoQ&size=128`);
      urls.push(`https://www.google.com/s2/favicons?domain=${domain}&sz=128`);
    }
    urls.push(`https://ui-avatars.com/api/?name=${encodeURIComponent(company.name)}&size=128&background=3b82f6&color=ffffff&bold=true`);
    return urls;
  };

  const getInitialSrc = (): string => {
    // Local logo takes highest priority
    const localLogo = getLocalLogo();
    if (localLogo) return localLogo;
    // Use stored logo only if it's not a stale favicon/avatar
    const stored = company.logo || company.logoUrl || '';
    if (stored && !stored.includes('google.com/s2/favicons') && !stored.includes('ui-avatars.com')) {
      return stored;
    }
    // Fall through to domain-based
    const domain = getDomain();
    if (domain) return `https://logo.clearbit.com/${domain}`;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(company.name)}&size=128&background=3b82f6&color=ffffff&bold=true`;
  };

  const [src, setSrc] = useState(getInitialSrc);
  const fallbacksRef = useRef<string[]>(buildFallbacks());
  const triedRef = useRef<Set<string>>(new Set([getInitialSrc()]));

  const handleError = () => {
    const next = fallbacksRef.current.find(u => !triedRef.current.has(u));
    if (next) {
      triedRef.current.add(next);
      setSrc(next);
    }
  };

  return <img src={src} alt={company.name} className={className} onError={handleError} />;
};

interface Company {
  _id?: string;
  name: string;
  industry?: string;
  description?: string;
  location?: string;
  employees?: string;
  website?: string;
  logo?: string;
  logoUrl?: string;
  domain?: string;
  rating?: number;
  openJobs?: number;
  // Enhanced fields from employer profile
  tagline?: string;
  foundedYear?: string;
  companyType?: string;
  benefits?: string[];
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
  };
  locations?: string[];
  gstNumber?: string;
  cinNumber?: string;
  companySize?: string;
  headquarters?: string;
  companyWebsite?: string;
  companyEmail?: string;
  phoneNumber?: string;
  companyPhotos?: string[];
}

interface CompaniesPageProps {
  onNavigate?: (page: string, data?: any) => void;
  user?: {name: string, type: 'candidate' | 'employer'} | null;
  onLogout?: () => void;
}

const CompaniesPage: React.FC<CompaniesPageProps> = ({ onNavigate, user, onLogout }) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [industries, setIndustries] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtersLoading, setFiltersLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);
  const [industryDropdownOpen, setIndustryDropdownOpen] = useState(false);
  const locationDropdownRef = useRef<HTMLDivElement>(null);
  const industryDropdownRef = useRef<HTMLDivElement>(null);

  // Helper function to get the best logo for a company
  const getBestCompanyLogo = (company: Company): string => {
    // Special cases: Local logos for specific companies
    const companyName = company.name.toLowerCase();
    if (companyName.includes('nambikkai')) {
      return '/images/company-logos/nambikkai-logo.png';
    }
    if (companyName.includes('inypeople') || companyName.includes('iny people')) {
      return '/images/company-logos/inypeople-logo.png';
    }
    if (companyName.includes('growthpulse') || companyName.includes('growthpulss')) {
      return '/images/company-logos/growthpulss.png';
    }
    if (companyName.includes('trinity')) {
      return '/images/company-logos/trinity-logo.png';
    }

    // For all other companies, check API logo first
    const apiLogo = company?.logo || company?.logoUrl;
    if (apiLogo && apiLogo.trim() !== '') {
      return apiLogo;
    }

    // Then use logoUtils for external logos (TCS, Zoho, etc.)
    const logoUtilsLogo = getCompanyLogo(company.name);
    if (logoUtilsLogo && logoUtilsLogo.trim() !== '') {
      return logoUtilsLogo;
    }

    // Fallback to UI avatars
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(company.name)}&size=64&background=3b82f6&color=ffffff&bold=true`;
  };

  // Normalize company name for comparison - enhanced version
  const normalizeCompanyName = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[+\s-_.(),]+/g, '') // Remove special characters, spaces, and parentheses
      .replace(/solutions?/g, 'sol') // Normalize "solution" variations
      .replace(/private?/g, 'priv') // Normalize "private" variations
      .replace(/limited?/g, 'ltd') // Normalize "limited" variations
      .replace(/technologies?/g, 'tech') // Normalize "technology" variations
      .replace(/pvt/g, 'priv') // Normalize "pvt" to "priv"
      .replace(/ltd/g, 'ltd') // Normalize "ltd" variations
      .replace(/inc/g, 'inc') // Normalize "inc" variations
      .replace(/corp/g, 'corp') // Normalize "corp" variations
      .replace(/company/g, 'co') // Normalize "company" variations
      .replace(/enterprises?/g, 'ent') // Normalize "enterprise" variations
      .replace(/systems?/g, 'sys') // Normalize "system" variations
      .replace(/services?/g, 'serv') // Normalize "service" variations
      .replace(/consultancy/g, 'consult') // Normalize "consultancy" variations
      .replace(/consulting/g, 'consult') // Normalize "consulting" variations
      .trim();
  };

  const ALL_INDUSTRIES = [
    'Information Technology', 'Software & SaaS', 'Healthcare & Pharmaceuticals',
    'Finance & Banking', 'Insurance', 'Education & E-Learning', 'Manufacturing',
    'Retail & E-Commerce', 'Marketing & Advertising', 'Human Resources & Staffing',
    'Consulting & Professional Services', 'Media & Entertainment',
    'Real Estate & Construction', 'Transportation & Logistics', 'Telecommunications',
    'Automotive', 'Food & Beverages', 'Energy & Utilities', 'Legal Services',
    'Non-Profit & NGO', 'Government & Public Sector', 'Hospitality & Tourism',
    'Agriculture', 'Aerospace & Defence', 'Biotechnology', 'Other'
  ];

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(e.target as Node))
        setLocationDropdownOpen(false);
      if (industryDropdownRef.current && !industryDropdownRef.current.contains(e.target as Node))
        setIndustryDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    
    try {
      // Load companies and jobs first
      const [companiesRes, jobsRes] = await Promise.all([
        fetch(API_ENDPOINTS.COMPANIES),
        fetch(API_ENDPOINTS.JOBS)
      ]);
      
      const companiesData = await companiesRes.json();
      const jobsData = await jobsRes.json();
      
      const companiesList = Array.isArray(companiesData) ? companiesData : (companiesData.companies || companiesData.data || []);
      const jobsList = Array.isArray(jobsData) ? jobsData : (jobsData.jobs || jobsData.data || []);
      
      // Try to load locations and industries from API, with fallbacks
      let locationsList: string[] = [];
      let industriesList: string[] = [];
      
      try {
        const locationsRes = await fetch(`${API_ENDPOINTS.BASE_URL}/locations`);
        if (locationsRes.ok) {
          const locationsData = await locationsRes.json();
          locationsList = Array.isArray(locationsData) ? locationsData : (locationsData.locations || locationsData.data || []);
        }
      } catch (error) {
        console.log('Locations API not available, extracting from companies');
      }
      
      // Skip industries API call since it returns 404
      // try {
      //   const industriesRes = await fetch(`${API_ENDPOINTS.BASE_URL}/industries`);
      //   if (industriesRes.ok) {
      //     const industriesData = await industriesRes.json();
      //     industriesList = Array.isArray(industriesData) ? industriesData : (industriesData.industries || industriesData.data || []);
      //   }
      // } catch (error) {
      //   console.log('Industries API not available, extracting from companies');
      // }
      
      // Fallback: Extract unique industries and locations from companies if API data is empty
      if (industriesList.length === 0) {
        industriesList = [...new Set(companiesList.map((c: any) => c.industry).filter(Boolean))] as string[];
        console.log('📋 Industries extracted from companies:', industriesList);
        
        // If still no industries found, add some common ones as fallback
        if (industriesList.length === 0) {
          industriesList = [
            'Information Technology',
            'Software & SaaS',
            'Healthcare & Pharmaceuticals',
            'Finance & Banking',
            'Insurance',
            'Education & E-Learning',
            'Manufacturing',
            'Retail & E-Commerce',
            'Marketing & Advertising',
            'Human Resources & Staffing',
            'Consulting & Professional Services',
            'Media & Entertainment',
            'Real Estate & Construction',
            'Transportation & Logistics',
            'Telecommunications',
            'Automotive',
            'Food & Beverages',
            'Energy & Utilities',
            'Legal Services',
            'Non-Profit & NGO',
            'Government & Public Sector',
            'Hospitality & Tourism',
            'Agriculture',
            'Aerospace & Defence',
            'Biotechnology',
            'Other'
          ];
          console.log('📋 Using default industries as fallback');
        }
      }
      
      if (locationsList.length === 0) {
        // Extract and normalize locations from companies
        const rawLocations = companiesList.map((c: any) => c.location).filter(Boolean);
        const normalizedLocations = new Set<string>();
        
        rawLocations.forEach((location: string) => {
          // Add the original location
          normalizedLocations.add(location.trim());
          
          // Also add city name if it's in "City, Country" format
          const parts = location.split(',');
          if (parts.length >= 2) {
            const city = parts[0].trim();
            if (city && city.length > 2) {
              normalizedLocations.add(city);
            }
          }
        });
        
        locationsList = Array.from(normalizedLocations).sort();
        console.log('📍 Locations extracted from companies:', locationsList);
        
        // If still no locations found, add some common ones as fallback
        if (locationsList.length === 0) {
          locationsList = [
            'Bangalore',
            'Chennai', 
            'Mumbai',
            'Delhi',
            'Hyderabad',
            'Pune',
            'Bangalore, India',
            'Chennai, India',
            'Mumbai, India',
            'Delhi, India',
            'Hyderabad, India',
            'Pune, India',
            'Remote'
          ];
          console.log('📍 Using default locations as fallback');
        }
      }
      
      // Add job counts to companies and map enhanced data
      const companiesWithJobCounts = companiesList.map((company: any) => {
        const companyJobs = jobsList.filter((job: any) => {
          const jobCompany = (job.company || job.companyName || '').toLowerCase().trim();
          const companyName = (company.name || company.companyName || '').toLowerCase().trim();
          return jobCompany === companyName;
        });
        
        // Remove any test/demo companies and normalize data
        let updatedCompany = { ...company };
        
        return {
          ...updatedCompany,
          // Map enhanced fields from API
          name: company.name || company.companyName,
          industry: company.industry,
          description: company.description || company.about,
          location: company.location || company.headquarters,
          employees: company.size || company.companySize || company.employees,
          website: company.website || company.companyWebsite,
          tagline: company.tagline,
          foundedYear: company.foundedYear,
          companyType: company.companyType || 'Private',
          benefits: Array.isArray(company.benefits) ? company.benefits : [],
          socialLinks: company.socialLinks || {},
          locations: Array.isArray(company.locations) ? company.locations : [],
          gstNumber: company.gstNumber,
          cinNumber: company.cinNumber,
          openJobs: companyJobs.length,
          // Ensure rating is always a number
          rating: typeof company.rating === 'number' ? company.rating : (Math.random() * 2 + 3),
          domain: company.domain,
          website: company.website || company.companyWebsite,
        };
      });
      
      console.log('📊 Companies loaded:', companiesWithJobCounts.length);
      console.log('💼 Jobs loaded:', jobsList.length);
      console.log('📍 Locations loaded:', locationsList.length);
      console.log('🏭 Industries loaded:', industriesList.length);
      
      // Debug: Log all companies data
      console.log('🔍 All companies data:', companiesWithJobCounts);
      console.log('🔍 Raw companies response:', companiesData);
      
      // Debug: Log GrowthPulse companies specifically
      const growthPulseCompanies = companiesWithJobCounts.filter((c: { name: string; }) => 
        c.name.toLowerCase().includes('growthpulse') || c.name.toLowerCase().includes('growth pulse')
      );
      if (growthPulseCompanies.length > 0) {
        console.log('🔍 GrowthPulse companies found:', growthPulseCompanies.map((c: { name: string; }) => ({
          name: c.name,
          normalized: normalizeCompanyName(c.name),
          logo: getCompanyLogo(c.name)
        })));
      }
      
      setCompanies(companiesWithJobCounts);
      setJobs(jobsList);
      setLocations(locationsList);
      setIndustries(industriesList);
      setFiltersLoading(false);
      
    } catch (error) {
      console.error('Error loading data:', error);
      console.error('API_ENDPOINTS.COMPANIES:', API_ENDPOINTS.COMPANIES);
      console.error('API_ENDPOINTS.JOBS:', API_ENDPOINTS.JOBS);
      
      // Try to get more details about the error
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      // Set default data even on error
      setIndustries([
        'Information Technology',
        'Software & SaaS',
        'Healthcare & Pharmaceuticals',
        'Finance & Banking',
        'Insurance',
        'Education & E-Learning',
        'Manufacturing',
        'Retail & E-Commerce',
        'Marketing & Advertising',
        'Human Resources & Staffing',
        'Consulting & Professional Services',
        'Media & Entertainment',
        'Real Estate & Construction',
        'Transportation & Logistics',
        'Telecommunications',
        'Automotive',
        'Food & Beverages',
        'Energy & Utilities',
        'Legal Services',
        'Non-Profit & NGO',
        'Government & Public Sector',
        'Hospitality & Tourism',
        'Agriculture',
        'Aerospace & Defence',
        'Biotechnology',
        'Other'
      ]);
      setLocations([
        'Bangalore',
        'Chennai',
        'Mumbai', 
        'Delhi',
        'Hyderabad',
        'Pune',
        'Bangalore, India',
        'Chennai, India',
        'Mumbai, India',
        'Delhi, India',
        'Hyderabad, India', 
        'Pune, India',
        'Remote'
      ]);
      setFiltersLoading(false);
    } finally {
      setLoading(false);
    }
  };

  // Get unique industries and locations for filters
  // Now using backend data instead of extracting from companies
  // const industries = [...new Set(companies.map(c => c.industry).filter(Boolean))];
  // const locations = [...new Set(companies.map(c => c.location).filter(Boolean))];

  // Normalize location for flexible matching
  const normalizeLocation = (location: string): string => {
    if (!location) return '';
    return location
      .toLowerCase()
      .replace(/[,\s-_.]+/g, ' ') // Replace punctuation with spaces
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim();
  };

  // Check if a company location matches the selected location filter
  const locationMatches = (companyLocation: string, selectedLocation: string): boolean => {
    if (!selectedLocation || !companyLocation) return true;
    
    const normalizedCompanyLocation = normalizeLocation(companyLocation);
    const normalizedSelectedLocation = normalizeLocation(selectedLocation);
    
    // Check if the selected location is contained in the company location
    // This handles cases like "Chennai" matching "Chennai, India" or "Chennai, Tamil Nadu"
    return normalizedCompanyLocation.includes(normalizedSelectedLocation) ||
           normalizedSelectedLocation.includes(normalizedCompanyLocation);
  };



  // Filter companies based on search and filters
  const filteredCompanies = companies
    .filter((company, index, self) => {
      // Remove duplicates based on normalized company names
      const normalizedName = normalizeCompanyName(company.name);
      return index === self.findIndex((c: Company) => normalizeCompanyName(c.name) === normalizedName);
    })
    .filter((company: Company) => {
      const matchesSearch = !searchTerm || 
        company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (company.description || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesIndustry = !selectedIndustry || company.industry === selectedIndustry;
      const matchesLocation = !selectedLocation || locationMatches(company.location || '', selectedLocation);
      
      // Debug logging for Chennai companies when Chennai filter is selected
      if (selectedLocation && selectedLocation.toLowerCase().includes('chennai')) {
        const isMatch = locationMatches(company.location || '', selectedLocation);
        if (company.location && company.location.toLowerCase().includes('chennai')) {
          console.log(`🏢 ${company.name}: Location="${company.location}" | Selected="${selectedLocation}" | Match=${isMatch}`);
        }
      }
      
      return matchesSearch && matchesIndustry && matchesLocation;
    });

  const handleCompanyClick = (company: Company) => {
    // Encode company name properly to avoid 500 errors
    const encodedCompanyName = encodeURIComponent(company.name.trim());
    console.log('🏢 Navigating to company:', company.name, 'Encoded:', encodedCompanyName);
    
    localStorage.setItem('selectedCompany', JSON.stringify({
      ...company,
      encodedName: encodedCompanyName
    }));
    onNavigate && onNavigate('company-details');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />
      
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-20">
        <div className="container max-w-4xl mx-auto px-6 text-center">
          {/* Main Heading with Gradient */}
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent leading-tight tracking-tight">
            Discover Top Companies
          </h1>
          
          {/* Subheading */}
          <p className="text-xl md:text-2xl text-slate-600 mb-10 font-medium leading-relaxed">
            Explore top companies hiring right now
          </p>
          
          {/* CTA Button */}
          <button 
            onClick={() => document.getElementById('companies-grid')?.scrollIntoView({ behavior: 'smooth' })}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 hover:from-blue-700 hover:to-indigo-700"
          >
            <Search className="w-5 h-5" />
            Explore Companies
          </button>
          
          {/* Floating Company Logos */}
          <div className="mt-12 flex items-center justify-center gap-8 opacity-60">
            <div className="text-sm text-slate-400 font-medium">Trusted by leading companies</div>
          </div>
          <div className="mt-4 flex items-center justify-center gap-6 flex-wrap">
            {/* Get unique companies by name and show only first 6 */}
            {companies
              .filter((company, index, self) => 
                index === self.findIndex(c => c.name.toLowerCase() === company.name.toLowerCase())
              )
              .slice(0, 6)
              .map((company, index) => (
              <div key={`${company.name}-${index}`} className="w-12 h-12 bg-white rounded-lg shadow-sm border border-slate-200 flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity">
                <CompanyLogo
                  company={company}
                  className="w-8 h-8 object-contain"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search Google, Microsoft, Amazon..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-12 pl-9 pr-3 border border-gray-300 rounded-lg text-base text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              />
            </div>

            {/* Industry Filter */}
            <div className="relative" ref={industryDropdownRef}>
              <button
                type="button"
                onClick={() => { setIndustryDropdownOpen(o => !o); setLocationDropdownOpen(false); }}
                className="w-full h-12 px-3 border border-gray-300 rounded-lg bg-white text-left flex items-center justify-between text-base text-gray-800 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                <span className="truncate">{selectedIndustry || 'All Industries'}</span>
                <svg className={`w-4 h-4 text-gray-500 flex-shrink-0 ml-1 transition-transform ${industryDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {industryDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                  <button type="button" onClick={() => { setSelectedIndustry(''); setIndustryDropdownOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                      !selectedIndustry ? 'bg-blue-600 text-white font-medium' : 'text-gray-700 hover:bg-gray-50'
                    }`}>All Industries</button>
                  {ALL_INDUSTRIES.map(industry => (
                    <button key={industry} type="button" onClick={() => { setSelectedIndustry(industry); setIndustryDropdownOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm border-t border-gray-100 transition-colors ${
                        selectedIndustry === industry ? 'bg-blue-600 text-white font-medium' : 'text-gray-700 hover:bg-gray-50'
                      }`}>{industry}</button>
                  ))}
                </div>
              )}
            </div>

            {/* Location Filter */}
            <div className="relative" ref={locationDropdownRef}>
              <button
                type="button"
                onClick={() => { !filtersLoading && setLocationDropdownOpen(o => !o); setIndustryDropdownOpen(false); }}
                disabled={filtersLoading}
                className="w-full h-12 px-3 border border-gray-300 rounded-lg bg-white text-left flex items-center justify-between text-base text-gray-800 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:bg-gray-50 disabled:cursor-not-allowed"
              >
                <span className="truncate">{filtersLoading ? 'Loading...' : (selectedLocation || 'All Locations')}</span>
                <svg className={`w-4 h-4 text-gray-500 flex-shrink-0 ml-1 transition-transform ${locationDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {locationDropdownOpen && !filtersLoading && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                  <button type="button" onClick={() => { setSelectedLocation(''); setLocationDropdownOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                      !selectedLocation ? 'bg-blue-600 text-white font-medium' : 'text-gray-700 hover:bg-gray-50'
                    }`}>All Locations</button>
                  {locations.map(location => (
                    <button key={location} type="button" onClick={() => { setSelectedLocation(location); setLocationDropdownOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm border-t border-gray-100 transition-colors ${
                        selectedLocation === location ? 'bg-blue-600 text-white font-medium' : 'text-gray-700 hover:bg-gray-50'
                      }`}>{location}</button>
                  ))}
                </div>
              )}
            </div>

            {/* Clear Filters */}
            <button
              onClick={() => { setSearchTerm(''); setSelectedIndustry(''); setSelectedLocation(''); setLocationDropdownOpen(false); setIndustryDropdownOpen(false); }}
              className="h-12 px-4 bg-gray-100 text-gray-800 text-base rounded-lg hover:bg-gray-200 transition-colors border border-gray-200 w-full"
            >
              Clear Filters
            </button>
          </div>

          <div className="mt-3 text-sm text-gray-500">
            Showing {filteredCompanies.length} of {companies.length} companies
            {selectedLocation && <span className="ml-2 text-blue-600">(Location: "{selectedLocation}")</span>}
            {selectedIndustry && <span className="ml-2 text-green-600">(Industry: "{selectedIndustry}")</span>}
          </div>
        </div>
        {/* Companies Grid */}
        <div id="companies-grid">
          {filteredCompanies.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Companies Found</h3>
            <p className="text-gray-500">Try adjusting your search criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCompanies.map((company, index) => (
              <div
                key={company._id || `${company.name}-${index}`}
                onClick={() => handleCompanyClick(company)}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer"
              >
                {/* Company Header */}
                <div className="flex items-start space-x-4 mb-4">
                  <CompanyLogo
                    company={company}
                    className="w-16 h-16 rounded-lg border border-gray-200 object-contain bg-white p-2"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">{company.name}</h3>
                    {company.tagline && (
                      <p className="text-xs text-gray-500 truncate mb-1">{company.tagline}</p>
                    )}
                    <p className="text-sm text-gray-600 truncate">{company.industry || 'Industry not specified'}</p>
                    
                    {/* Rating and Company Type */}
                    <div className="flex items-center mt-1 gap-2">
                      <div className="flex items-center">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm text-gray-600 ml-1">
                          {typeof company.rating === 'number' ? company.rating.toFixed(1) : '4.2'}
                        </span>
                      </div>
                      {company.companyType && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                          {company.companyType}
                        </span>
                      )}
                      {company.gstNumber && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          ✓ Verified
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Company Description */}
                <p className="text-gray-700 text-sm mb-4 line-clamp-2">
                  {company.description || 'No description available.'}
                </p>

                {/* Benefits Preview */}
                {company.benefits && company.benefits.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1">
                      {company.benefits.slice(0, 3).map((benefit, idx) => (
                        <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                          {benefit}
                        </span>
                      ))}
                      {company.benefits.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded text-xs">
                          +{company.benefits.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Company Stats */}
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{company.location || 'Location not specified'}</span>
                    {company.locations && company.locations.length > 0 && (
                      <span className="ml-1 text-xs text-blue-600">+{company.locations.length}</span>
                    )}
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span>{company.employees || 'Company size not specified'}</span>
                    {company.foundedYear && (
                      <span className="ml-2 text-xs text-gray-500">• Est. {company.foundedYear}</span>
                    )}
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <Briefcase className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span>{company.openJobs || 0} open position{(company.openJobs || 0) !== 1 ? 's' : ''}</span>
                  </div>
                  
                  {/* Social Links */}
                  {company.socialLinks && Object.keys(company.socialLinks).length > 0 && (
                    <div className="flex items-center gap-2 pt-1">
                      {company.socialLinks.linkedin && (
                        <a 
                          href={company.socialLinks.linkedin} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z" clipRule="evenodd" />
                          </svg>
                        </a>
                      )}
                      {company.socialLinks.twitter && (
                        <a 
                          href={company.socialLinks.twitter} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-blue-400 hover:text-blue-500"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
                          </svg>
                        </a>
                      )}
                      {company.website && (
                        <a 
                          href={company.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {/* View Company Button */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                    View Company
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </div>
      
      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default CompaniesPage;
