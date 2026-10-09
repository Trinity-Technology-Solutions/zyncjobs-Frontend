import React, { useState, useEffect, useRef } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { API_ENDPOINTS } from '../config/env';
import { Search, MapPin, Users, Building2, Star, Briefcase, ArrowRight } from 'lucide-react';
import { getCompanyLogo } from '../utils/logoUtils';
import CompanyLogo from '../components/CompanyLogo';
import AutocompleteCombobox from '../components/AutocompleteCombobox';

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
  const [locations, setLocations] = useState<string[]>([]);
  const [, setIndustries] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtersLoading, setFiltersLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [, setLocationDropdownOpen] = useState(false);
  const [, setLocationSearchInput] = useState('');
  const [, setHighlightedIndex] = useState(-1);
  const [industryDropdownOpen, setIndustryDropdownOpen] = useState(false);
  const locationDropdownRef = useRef<HTMLDivElement>(null);
  
  const industryDropdownRef = useRef<HTMLDivElement>(null);

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
      // Load companies
      const companiesRes = await fetch(API_ENDPOINTS.COMPANIES);
      const companiesData = await companiesRes.json();
      const companiesList = Array.isArray(companiesData) ? companiesData : (companiesData.companies || companiesData.data || []);
      
      // Try to load locations and industries from API, with fallbacks
      let locationsList: string[] = [];
      let industriesList: string[] = [];
      
      try {
        const locationsRes = await fetch(`${API_ENDPOINTS.BASE_URL}/locations`);
        if (locationsRes.ok) {
          const locationsData = await locationsRes.json();
          locationsList = Array.isArray(locationsData) ? locationsData : (locationsData.locations || locationsData.data || []);
        }
      } catch {
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
      
      // Map enhanced data (job counts come from backend directly)
      const companiesWithJobCounts = companiesList.map((company: any) => ({
        ...company,
        name: company.name || company.companyName,
        industry: company.industry,
        description: company.description || company.about,
        location: company.location || company.headquarters,
        employees: company.size || company.companySize || company.employees,
        website: company.website || company.companyWebsite,
        tagline: company.tagline,
        foundedYear: company.foundedYear,
        companyType: company.companyType || '—',
        benefits: Array.isArray(company.benefits) ? company.benefits : [],
        socialLinks: company.socialLinks || {},
        locations: Array.isArray(company.locations) ? company.locations : [],
        gstNumber: company.gstNumber,
        cinNumber: company.cinNumber,
        openJobs: typeof company.openPositions === 'number' ? company.openPositions : 0,
        rating: typeof company.rating === 'number' ? company.rating : null,
        domain: company.domain,
      }));
      
      console.log('📊 Companies loaded:', companiesWithJobCounts.length);
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
      
      // Clean locations — remove bad values, dedupe, sort alphabetically
      const cleanedLocations = [...new Set(
        locationsList
          .map(l => (l || '').trim())
          .filter(l => l && !/^location\s+not\s+specified$/i.test(l))
      )].sort();
      setCompanies(companiesWithJobCounts);
      setLocations(cleanedLocations);
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

  // Filtered location suggestions based on search input
  

  // Check if a company location matches the selected location filter
  const locationMatches = (companyLocation: string, selectedLocation: string): boolean => {
    if (!selectedLocation) return true;
    if (!companyLocation) return false;
    
    const trimmed = companyLocation.trim();
    if (!trimmed) return false;
    if (/^(location\s+not\s+specified|not\s+specified)$/i.test(trimmed)) return false;
    
    return trimmed.toLowerCase() === selectedLocation.trim().toLowerCase();
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
      <div className="companies-directory min-h-screen bg-gray-50">
        <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="companies-directory min-h-screen bg-gray-50">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />
      
      <section className="companies-browse-hero" aria-labelledby="companies-directory-title">
        <div className="portal-page-container">
          <p className="companies-browse-eyebrow">FIND YOUR NEXT WORKPLACE</p>
          <div className="companies-browse-heading">
            <div><h1 id="companies-directory-title">Discover companies.<br /><span>Find where you belong.</span></h1><p>Explore companies hiring across all industries and find your next workplace.</p></div>
            <div className="companies-directory-total"><Building2 size={24} aria-hidden="true" /><strong>{companies.length}</strong><span>companies to explore</span></div>
          </div>

        </div>
      </section>

      <div className="portal-page-container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div id="companies-filters" className="companies-filter-panel">
          <div className="companies-filter-grid">

            <div className="companies-keyword-search relative"><Search size={17} aria-hidden="true" /><input type="search" value={searchTerm} onChange={event => setSearchTerm(event.target.value)} placeholder="Search by company name" aria-label="Search companies" /></div>

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
                  {Array.from(new Set([...ALL_INDUSTRIES, ...companies.map(company => company.industry?.trim()).filter((industry): industry is string => Boolean(industry))])).sort((first, second) => first.localeCompare(second)).map(industry => (
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
              <AutocompleteCombobox
                value={selectedLocation}
                onChange={v => { setSelectedLocation(v); setLocationSearchInput(''); }}
                options={locations.map(l => ({ value: l, label: l }))}
                placeholder={filtersLoading ? 'Loading...' : 'Search locations...'}
                disabled={filtersLoading}
                maxOptions={20}
              />
            </div>

            {/* Clear Filters */}
            <button
              onClick={() => { setSearchTerm(''); setSelectedIndustry(''); setSelectedLocation(''); setLocationSearchInput(''); setLocationDropdownOpen(false); setHighlightedIndex(-1); setIndustryDropdownOpen(false); }}
              className="h-12 px-4 bg-gray-100 text-gray-800 text-base rounded-lg hover:bg-gray-200 transition-colors border border-gray-200 w-full"
            >
              Clear Filters
            </button>
          </div>

          <div className="companies-result-count" aria-live="polite">
            Showing {filteredCompanies.length} of {companies.length} companies
            {selectedLocation && <span className="ml-2 text-blue-600">(Location: "{selectedLocation}")</span>}
            {selectedIndustry && <span className="ml-2 text-green-600">(Industry: "{selectedIndustry}")</span>}
          </div>
        </div>
        {/* Companies Grid */}
        <div id="companies-grid" className="companies-results">
          <h2 className="companies-results-title">Explore companies</h2>
          {filteredCompanies.length === 0 ? (
          <div className="companies-empty-state text-center py-12">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Companies Found</h3>
            <p className="text-gray-500">Try adjusting your search criteria</p>
          </div>
        ) : (
          <div className="companies-browse-grid">
            {filteredCompanies.map((company, index) => (
              <article key={company._id || `${company.name}-${index}`} className="company-browse-card">
                <div className="company-browse-card-heading">
                  <CompanyLogo companyName={company.name} storedLogo={company.logo || company.logoUrl} website={company.website} size={56} className="company-browse-logo" />
                  <div><p>{company.industry || 'Company profile'}</p><h3><button type="button" onClick={() => handleCompanyClick(company)}>{company.name}</button></h3></div>
                  {company.companyType && <span className="company-browse-type">{company.companyType}</span>}
                </div>
                <p className="company-browse-description">{company.tagline || company.description || 'Explore the company profile to learn more about this workplace.'}</p>
                <div className="company-browse-meta">
                  {company.location && <span><MapPin size={15} aria-hidden="true" />{company.location}</span>}
                  {(company.employees || company.companySize) && <span><Users size={15} aria-hidden="true" />{company.employees || company.companySize}</span>}
                  {typeof company.rating === 'number' && <span><Star size={15} aria-hidden="true" />{company.rating.toFixed(1)}</span>}
                </div>
                {company.benefits && company.benefits.length > 0 && <div className="company-browse-benefits">{company.benefits.slice(0, 3).map((benefit, idx) => <span key={idx}>{benefit}</span>)}</div>}
                <div className="company-browse-card-footer">
                  <span><Briefcase size={15} aria-hidden="true" />{company.openJobs || 0} open positions</span>
                  <button type="button" onClick={() => handleCompanyClick(company)}>View company <ArrowRight size={16} aria-hidden="true" /></button>
                </div>
              </article>
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
