import React, { useState, useEffect, useRef } from 'react';
import { API_ENDPOINTS } from '../config/api';
import { Building2 } from 'lucide-react';

interface Company {
  name: string;
  domain?: string;
  logo?: string;
  logoUrl?: string;
  website?: string;
}

interface CompanyAutocompleteProps {
  value: string;
  onChange: (value: string, companyData?: Company) => void;
  placeholder?: string;
  className?: string;
}

const CompanyAutocomplete: React.FC<CompanyAutocompleteProps> = ({
  value,
  onChange,
  placeholder = 'Company name...',
  className = ''
}) => {
  const [suggestions, setSuggestions] = useState<Company[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchCompanies = async () => {
      if (value.length < 2 || isSelected) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/companies?search=${encodeURIComponent(value)}`);
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        setSuggestions(data);
        setShowSuggestions(data.length > 0);
      } catch (error) {
        console.error('Company search error:', error);
        // Fallback to local company data when API fails
        const localCompanies = getLocalCompanies(value);
        setSuggestions(localCompanies);
        setShowSuggestions(localCompanies.length > 0);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchCompanies, 300);
    return () => clearTimeout(debounce);
  }, [value, isSelected]);

  const getCompanyLogo = (company: Company) => {
    // Use the logoUrl from the company data first
    if (company.logoUrl || company.logo) {
      return company.logoUrl || company.logo;
    }
    // Use Clearbit as fallback
    if (company.domain) {
      return `https://logo.clearbit.com/${company.domain}`;
    }
    return null;
  };

  const getFallbackLogo = (company: Company) => {
    // Use Google favicon as fallback
    if (company.domain) {
      return `https://www.google.com/s2/favicons?domain=${company.domain}&sz=64`;
    }
    return null;
  };

  const getLocalCompanies = (searchTerm: string): Company[] => {
    const companies = [
      { name: 'Google', domain: 'google.com', logoUrl: 'https://logo.clearbit.com/google.com' },
      { name: 'Microsoft', domain: 'microsoft.com', logoUrl: 'https://logo.clearbit.com/microsoft.com' },
      { name: 'Apple', domain: 'apple.com', logoUrl: 'https://logo.clearbit.com/apple.com' },
      { name: 'Amazon', domain: 'amazon.com', logoUrl: 'https://logo.clearbit.com/amazon.com' },
      { name: 'Meta', domain: 'meta.com', logoUrl: 'https://logo.clearbit.com/meta.com' },
      { name: 'Netflix', domain: 'netflix.com', logoUrl: 'https://logo.clearbit.com/netflix.com' },
      { name: 'Tesla', domain: 'tesla.com', logoUrl: 'https://logo.clearbit.com/tesla.com' },
      { name: 'Uber', domain: 'uber.com', logoUrl: 'https://logo.clearbit.com/uber.com' },
      { name: 'Airbnb', domain: 'airbnb.com', logoUrl: 'https://logo.clearbit.com/airbnb.com' },
      { name: 'Spotify', domain: 'spotify.com', logoUrl: 'https://logo.clearbit.com/spotify.com' },
      { name: 'TCS', domain: 'tcs.com', logoUrl: 'https://logo.clearbit.com/tcs.com' },
      { name: 'Infosys', domain: 'infosys.com', logoUrl: 'https://logo.clearbit.com/infosys.com' },
      { name: 'Wipro', domain: 'wipro.com', logoUrl: 'https://logo.clearbit.com/wipro.com' },
      { name: 'Accenture', domain: 'accenture.com', logoUrl: 'https://logo.clearbit.com/accenture.com' },
      { name: 'IBM', domain: 'ibm.com', logoUrl: 'https://logo.clearbit.com/ibm.com' },
      { name: 'Oracle', domain: 'oracle.com', logoUrl: 'https://logo.clearbit.com/oracle.com' },
      { name: 'Salesforce', domain: 'salesforce.com', logoUrl: 'https://logo.clearbit.com/salesforce.com' },
      { name: 'Adobe', domain: 'adobe.com', logoUrl: 'https://logo.clearbit.com/adobe.com' },
      { name: 'Zoho', domain: 'zoho.com', logoUrl: 'https://logo.clearbit.com/zoho.com' },
      { name: 'Flipkart', domain: 'flipkart.com', logoUrl: 'https://logo.clearbit.com/flipkart.com' },
      { name: 'Paytm', domain: 'paytm.com', logoUrl: 'https://logo.clearbit.com/paytm.com' },
      { name: 'Swiggy', domain: 'swiggy.com', logoUrl: 'https://logo.clearbit.com/swiggy.com' },
      { name: 'Zomato', domain: 'zomato.com', logoUrl: 'https://logo.clearbit.com/zomato.com' }
    ];
    
    return companies.filter(company => 
      company.name.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 10);
  };

  const handleSelect = (company: Company, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsSelected(true);
    onChange(company.name, company);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => {
          setIsSelected(false);
          onChange(e.target.value);
        }}
        onFocus={() => !isSelected && suggestions.length > 0 && setShowSuggestions(true)}
        placeholder={placeholder}
        className={className}
      />
      
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((company, index) => (
            <div
              key={`${company.domain || company.name}-${index}`}
              onMouseDown={(e) => handleSelect(company, e)}
              className="px-4 py-3 hover:bg-indigo-50 cursor-pointer transition-colors flex items-center space-x-3"
            >
              <div className="w-8 h-8 flex-shrink-0">
                <img
                  src={getCompanyLogo(company) || '/images/zync-logo.svg'}
                  alt={company.name}
                  className="w-8 h-8 rounded object-contain bg-white border"
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    const fallbackUrl = getFallbackLogo(company);
                    if (fallbackUrl && img.src !== fallbackUrl) {
                      img.src = fallbackUrl;
                    } else if (img.src !== '/images/zync-logo.svg') {
                      img.src = '/images/zync-logo.svg';
                    }
                  }}
                />
              </div>
              <span className="text-gray-900 font-medium">{company.name}</span>
              {company.domain && (
                <span className="text-gray-500 text-sm ml-auto">{company.domain}</span>
              )}
            </div>
          ))}
        </div>
      )}
      
      {loading && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin h-4 w-4 border-2 border-indigo-600 border-t-transparent rounded-full"></div>
        </div>
      )}
    </div>
  );
};

export default CompanyAutocomplete;
