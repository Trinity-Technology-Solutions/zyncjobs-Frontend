import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BackButton from '../components/BackButton';
import { API_ENDPOINTS } from '../config/env';
import { Search, MapPin, Users, Building2, Star, Briefcase } from 'lucide-react';
import { getCompanyLogo } from '../utils/logoUtils';

interface Company {
  _id?: string;
  name: string;
  industry?: string;
  description?: string;
  location?: string;
  employees?: string;
  website?: string;
  logo?: string;
  rating?: number;
  openJobs?: number;
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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load all data in parallel
      const [companiesRes, jobsRes, locationsRes, industriesRes] = await Promise.all([
        fetch(API_ENDPOINTS.COMPANIES),
        fetch(API_ENDPOINTS.JOBS),
        fetch(`${API_ENDPOINTS.BASE_URL}/locations`),
        fetch(`${API_ENDPOINTS.BASE_URL}/industries`)
      ]);
      
      const companiesData = await companiesRes.json();
      const jobsData = await jobsRes.json();
      const locationsData = await locationsRes.json();
      const industriesData = await industriesRes.json();
      
      const companiesList = Array.isArray(companiesData) ? companiesData : (companiesData.companies || companiesData.data || []);
      const jobsList = Array.isArray(jobsData) ? jobsData : (jobsData.jobs || jobsData.data || []);
      const locationsList = Array.isArray(locationsData) ? locationsData : (locationsData.locations || locationsData.data || []);
      const industriesList = Array.isArray(industriesData) ? industriesData : (industriesData.industries || industriesData.data || []);
      
      // Add job counts to companies
      const companiesWithJobCounts = companiesList.map((company: any) => {
        const companyJobs = jobsList.filter((job: any) => {
          const jobCompany = (job.company || job.companyName || '').toLowerCase().trim();
          const companyName = (company.name || company.companyName || '').toLowerCase().trim();
          return jobCompany === companyName;
        });
        
        // Fix Trinity Technology location
        let updatedCompany = { ...company };
        if (company.name && company.name.toLowerCase().includes('trinity')) {
          updatedCompany.location = 'Chennai, India';
        }
        
        return {
          ...updatedCompany,
          openJobs: companyJobs.length,
          // Ensure rating is always a number
          rating: typeof company.rating === 'number' ? company.rating : (Math.random() * 2 + 3),
        };
      });
      
      console.log('📊 Companies loaded:', companiesWithJobCounts.length);
      console.log('💼 Jobs loaded:', jobsList.length);
      console.log('📍 Locations loaded:', locationsList.length);
      console.log('🏭 Industries loaded:', industriesList.length);
      
      setCompanies(companiesWithJobCounts);
      setJobs(jobsList);
      setLocations(locationsList);
      setIndustries(industriesList);
      
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get unique industries and locations for filters
  // Now using backend data instead of extracting from companies
  // const industries = [...new Set(companies.map(c => c.industry).filter(Boolean))];
  // const locations = [...new Set(companies.map(c => c.location).filter(Boolean))];

  // Normalize company name for comparison
  const normalizeCompanyName = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[+\s-_.]+/g, '') // Remove special characters and spaces
      .replace(/solutions?/g, 'sol') // Normalize "solution" variations
      .replace(/private?/g, 'priv') // Normalize "private" variations
      .replace(/limited?/g, 'ltd') // Normalize "limited" variations
      .replace(/technologies?/g, 'tech') // Normalize "technology" variations
      .replace(/pvt/g, 'priv') // Normalize "pvt" to "priv"
      .trim();
  };

  // Filter companies based on search and filters
  const filteredCompanies = companies
    .filter((company, index, self) => {
      // Remove duplicates based on normalized company names
      const normalizedName = normalizeCompanyName(company.name);
      return index === self.findIndex(c => normalizeCompanyName(c.name) === normalizedName);
    })
    .filter(company => {
      const matchesSearch = !searchTerm || 
        company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (company.description || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesIndustry = !selectedIndustry || company.industry === selectedIndustry;
      const matchesLocation = !selectedLocation || company.location === selectedLocation;
      
      return matchesSearch && matchesIndustry && matchesLocation;
    });

  const handleCompanyClick = (company: Company) => {
    localStorage.setItem('selectedCompany', JSON.stringify(company));
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
                <img
                  src={getCompanyLogo(company.name) || company.logo}
                  alt={company.name}
                  className="w-8 h-8 object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(company.name)}&size=32&background=3b82f6&color=ffffff&bold=true`;
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search companies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* Industry Filter */}
            <select
              value={selectedIndustry}
              onChange={(e) => setSelectedIndustry(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="" disabled>Select Industry</option>
              {industries.map(industry => (
                <option key={industry} value={industry}>{industry}</option>
              ))}
            </select>
            
            {/* Location Filter */}
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="" disabled>Select Location</option>
              {locations.map(location => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>
            
            {/* Clear Filters */}
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedIndustry('');
                setSelectedLocation('');
              }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Clear Filters
            </button>
          </div>
          
          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredCompanies.length} of {companies.length} companies
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
                  <img
                    src={getCompanyLogo(company.name) || company.logo}
                    alt={company.name}
                    className="w-16 h-16 rounded-lg border border-gray-200 object-contain bg-white p-2"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(company.name)}&size=64&background=3b82f6&color=ffffff&bold=true`;
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">{company.name}</h3>
                    <p className="text-sm text-gray-600 truncate">{company.industry || 'Industry not specified'}</p>
                    
                    {/* Rating */}
                    <div className="flex items-center mt-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm text-gray-600 ml-1">
                        {typeof company.rating === 'number' ? company.rating.toFixed(1) : '4.2'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Company Description */}
                <p className="text-gray-700 text-sm mb-4 line-clamp-2">
                  {company.description || 'No description available.'}
                </p>

                {/* Company Stats */}
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{company.location || 'Location not specified'}</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span>{company.employees || 'Company size not specified'}</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <Briefcase className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span>{company.openJobs || 0} open position{(company.openJobs || 0) !== 1 ? 's' : ''}</span>
                  </div>
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