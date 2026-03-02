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
}

const CompaniesPage = ({ onNavigate, user, onLogout }: { 
  onNavigate?: (page: string) => void;
  user?: {name: string, type: 'candidate' | 'employer'} | null;
  onLogout?: () => void;
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  
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

  // Fetch companies from API
  const fetchCompanies = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/companies?${params}`);
      if (response.ok) {
        const data = await response.json();
        setCompanies(data);
      } else {
        console.error('Failed to fetch companies');
        setCompanies([]);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFilterData();
    fetchCompanies();
  }, [searchTerm]);

  // Filter functions
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

  // Get company logo - use Google favicons like employer registration
  const getCompanyLogo = (company: Company) => {
    // Use logo from API response if available
    if (company.logo && !company.logo.includes('ui-avatars.com')) {
      return company.logo;
    }
    
    // Use Google favicons with website domain (same as employer registration)
    if (company.website) {
      const domain = company.website.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    }
    
    // Fallback to letter avatar
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(company.name)}&size=64&background=3b82f6&color=ffffff&bold=true`;
  };

  // Handle logo error by showing letter avatar
  const handleLogoError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    const companyName = target.getAttribute('data-company-name') || '';
    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(companyName)}&size=64&background=3b82f6&color=ffffff&bold=true`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />
      
      {/* Hero Section */}
      <div className="bg-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <BackButton 
            onClick={() => onNavigate && onNavigate('job-listings')}
            text="Back to Jobs"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800 transition-colors mb-4"
          />
          <p className="text-gray-600 text-lg mb-4">Browse Companies</p>
          <h1 className="text-5xl font-bold text-gray-900 mb-12">
            {loading ? 'Loading...' : `${companies.length} Companies`}
          </h1>
          
          {/* Search Bar */}
          <div className="mb-8">
            <div className="relative max-w-2xl mx-auto">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by cities"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
              />
            </div>
          </div>

          {/* Filter Inputs */}
          <div className="flex flex-wrap justify-center gap-4 mb-4">
            {/* Industry Filter */}
            <div className="relative">
              <input
                type="text"
                placeholder="Industry"
                value={industryInput}
                onChange={(e) => setIndustryInput(e.target.value)}
                onFocus={() => setShowIndustryDropdown(true)}
                onBlur={() => setTimeout(() => setShowIndustryDropdown(false), 200)}
                className="px-6 py-3 pr-10 border border-gray-300 rounded-lg bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 w-48"
              />
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              {showIndustryDropdown && getFilteredIndustries().length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                  {getFilteredIndustries().map((industry) => (
                    <div
                      key={`industry-${industry}`}
                      onClick={() => handleIndustrySelect(industry)}
                      className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm"
                    >
                      {industry}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Size Filter */}
            <div className="relative">
              <input
                type="text"
                placeholder="Size"
                value={sizeInput}
                onChange={(e) => setSizeInput(e.target.value)}
                onFocus={() => setShowSizeDropdown(true)}
                onBlur={() => setTimeout(() => setShowSizeDropdown(false), 200)}
                className="px-6 py-3 pr-10 border border-gray-300 rounded-lg bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 w-48"
              />
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              {showSizeDropdown && getFilteredSizes().length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                  {getFilteredSizes().map((size) => (
                    <div
                      key={`size-${size}`}
                      onClick={() => handleSizeSelect(size)}
                      className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm"
                    >
                      {size}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Work Setting Filter */}
            <div className="relative">
              <input
                type="text"
                placeholder="Work Setting"
                value={workSettingInput}
                onChange={(e) => setWorkSettingInput(e.target.value)}
                onFocus={() => setShowWorkSettingDropdown(true)}
                onBlur={() => setTimeout(() => setShowWorkSettingDropdown(false), 200)}
                className="px-6 py-3 pr-10 border border-gray-300 rounded-lg bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 w-48"
              />
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              {showWorkSettingDropdown && getFilteredWorkSettings().length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                  {getFilteredWorkSettings().map((setting) => (
                    <div
                      key={`setting-${setting}`}
                      onClick={() => handleWorkSettingSelect(setting)}
                      className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm"
                    >
                      {setting}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button className="px-6 py-3 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg font-medium">
              Hiring
            </button>
            <button 
              onClick={clearFilters}
              className="px-4 py-3 text-blue-600 font-medium hover:text-blue-800"
            >
              Clear filters
            </button>
          </div>
        </div>
      </div>

      {/* Company Listings */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <p className="text-gray-700 text-lg font-medium">
            {loading ? 'Loading...' : `${companies.length} tech companies`}
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading companies...</p>
          </div>
        ) : companies.length === 0 ? (
          <div className="text-center py-12">
            <Building className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No companies found</h3>
            <p className="text-gray-500">Try adjusting your search terms or browse all companies.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {companies.map((company) => (
            <div key={company._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center justify-center mb-6">
                <img 
                  src={getCompanyLogo(company)} 
                  alt={company.name}
                  data-company-name={company.name}
                  onError={handleLogoError}
                  className="w-16 h-16 rounded-lg object-cover border border-gray-200"
                />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{company.name}</h3>
                <p className="text-gray-600 mb-1">{company.location}</p>
                <p className="text-sm text-gray-500 mb-2">{company.industry}</p>
                {company.website && (
                  <a 
                    href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 mb-2"
                  >
                    <Globe className="w-4 h-4 mr-1" />
                    Visit Website
                  </a>
                )}
                {company.openJobs > 0 && (
                  <p className="text-sm text-blue-600 font-medium">{company.openJobs} open jobs</p>
                )}
              </div>
            </div>
            ))}
          </div>
        )}
      </div>
      
      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default CompaniesPage;