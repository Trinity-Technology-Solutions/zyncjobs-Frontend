import React, { useState, useEffect, useRef } from 'react';
import { API_ENDPOINTS } from '../config/env';
import { Search, Building2 } from 'lucide-react';

interface Company {
  id: string;
  name: string;
  logo: string;
  followers: number;
}

interface CompanyAutoSuggestProps {
  onSelect: (company: Company) => void;
  placeholder?: string;
  value?: string;
}

const CompanyAutoSuggest: React.FC<CompanyAutoSuggestProps> = ({
  onSelect,
  placeholder = "Search company...",
  value = ""
}) => {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<Company[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value && value !== query) {
      setQuery(value);
    }
  }, [value]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (query.length >= 2 && isOpen) {
        searchCompanies(query);
      } else if (query.length < 2) {
        setResults([]);
        setIsOpen(false);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [query, isOpen]);

  const searchCompanies = async (searchQuery: string) => {
    setLoading(true);
    
    const fallbackCompanies = [
      { id: '1', name: 'Google', logo: 'https://logo.clearbit.com/google.com', followers: 10000000 },
      { id: '2', name: 'Microsoft', logo: 'https://logo.clearbit.com/microsoft.com', followers: 9000000 },
      { id: '3', name: 'Apple', logo: 'https://logo.clearbit.com/apple.com', followers: 12000000 },
      { id: '4', name: 'Amazon', logo: 'https://logo.clearbit.com/amazon.com', followers: 8000000 },
      { id: '5', name: 'Meta', logo: 'https://logo.clearbit.com/meta.com', followers: 7000000 },
      { id: '6', name: 'Netflix', logo: 'https://logo.clearbit.com/netflix.com', followers: 5000000 },
      { id: '7', name: 'Tesla', logo: 'https://logo.clearbit.com/tesla.com', followers: 6000000 },
      { id: '8', name: 'Uber', logo: 'https://logo.clearbit.com/uber.com', followers: 3000000 },
      { id: '9', name: 'Airbnb', logo: 'https://logo.clearbit.com/airbnb.com', followers: 2500000 },
      { id: '10', name: 'Spotify', logo: 'https://logo.clearbit.com/spotify.com', followers: 4000000 },
      { id: '11', name: 'Twitter', logo: 'https://logo.clearbit.com/twitter.com', followers: 3500000 },
      { id: '12', name: 'LinkedIn', logo: 'https://logo.clearbit.com/linkedin.com', followers: 8000000 },
      { id: '13', name: 'Adobe', logo: 'https://logo.clearbit.com/adobe.com', followers: 2000000 },
      { id: '14', name: 'Salesforce', logo: 'https://logo.clearbit.com/salesforce.com', followers: 1800000 },
      { id: '15', name: 'Oracle', logo: 'https://logo.clearbit.com/oracle.com', followers: 1500000 },
      { id: '16', name: 'SAP', logo: 'https://logo.clearbit.com/sap.com', followers: 1200000 },
      { id: '17', name: 'IBM', logo: 'https://logo.clearbit.com/ibm.com', followers: 2000000 },
      { id: '18', name: 'Intel', logo: 'https://logo.clearbit.com/intel.com', followers: 1700000 },
      { id: '19', name: 'NVIDIA', logo: 'https://logo.clearbit.com/nvidia.com', followers: 3000000 },
      { id: '20', name: 'Qualcomm', logo: 'https://logo.clearbit.com/qualcomm.com', followers: 900000 },
      { id: '21', name: 'PayPal', logo: 'https://logo.clearbit.com/paypal.com', followers: 1500000 },
      { id: '22', name: 'Stripe', logo: 'https://logo.clearbit.com/stripe.com', followers: 800000 },
      { id: '23', name: 'Shopify', logo: 'https://logo.clearbit.com/shopify.com', followers: 700000 },
      { id: '24', name: 'Zoom', logo: 'https://logo.clearbit.com/zoom.us', followers: 1200000 },
      { id: '25', name: 'Slack', logo: 'https://logo.clearbit.com/slack.com', followers: 900000 },
      { id: '26', name: 'Atlassian', logo: 'https://logo.clearbit.com/atlassian.com', followers: 700000 },
      { id: '27', name: 'GitHub', logo: 'https://logo.clearbit.com/github.com', followers: 5000000 },
      { id: '28', name: 'GitLab', logo: 'https://logo.clearbit.com/gitlab.com', followers: 600000 },
      { id: '29', name: 'Docker', logo: 'https://logo.clearbit.com/docker.com', followers: 500000 },
      { id: '30', name: 'MongoDB', logo: 'https://logo.clearbit.com/mongodb.com', followers: 600000 },
      { id: '31', name: 'Snowflake', logo: 'https://logo.clearbit.com/snowflake.com', followers: 500000 },
      { id: '32', name: 'Databricks', logo: 'https://logo.clearbit.com/databricks.com', followers: 400000 },
      { id: '33', name: 'Cloudflare', logo: 'https://logo.clearbit.com/cloudflare.com', followers: 700000 },
      { id: '34', name: 'Figma', logo: 'https://logo.clearbit.com/figma.com', followers: 800000 },
      { id: '35', name: 'Notion', logo: 'https://logo.clearbit.com/notion.so', followers: 600000 },
      { id: '36', name: 'Canva', logo: 'https://logo.clearbit.com/canva.com', followers: 900000 },
      { id: '37', name: 'HubSpot', logo: 'https://logo.clearbit.com/hubspot.com', followers: 700000 },
      { id: '38', name: 'Zendesk', logo: 'https://logo.clearbit.com/zendesk.com', followers: 500000 },
      { id: '39', name: 'ServiceNow', logo: 'https://logo.clearbit.com/servicenow.com', followers: 600000 },
      { id: '40', name: 'Workday', logo: 'https://logo.clearbit.com/workday.com', followers: 500000 },
      { id: '41', name: 'Datadog', logo: 'https://logo.clearbit.com/datadoghq.com', followers: 400000 },
      { id: '42', name: 'Twilio', logo: 'https://logo.clearbit.com/twilio.com', followers: 500000 },
      { id: '43', name: 'OpenAI', logo: 'https://logo.clearbit.com/openai.com', followers: 5000000 },
      { id: '44', name: 'Anthropic', logo: 'https://logo.clearbit.com/anthropic.com', followers: 1000000 },
      { id: '45', name: 'Palantir', logo: 'https://logo.clearbit.com/palantir.com', followers: 800000 },
      { id: '46', name: 'TCS', logo: 'https://logo.clearbit.com/tcs.com', followers: 6000000 },
      { id: '47', name: 'Infosys', logo: 'https://logo.clearbit.com/infosys.com', followers: 5500000 },
      { id: '48', name: 'Wipro', logo: 'https://logo.clearbit.com/wipro.com', followers: 4000000 },
      { id: '49', name: 'HCL Technologies', logo: 'https://logo.clearbit.com/hcltech.com', followers: 3500000 },
      { id: '50', name: 'Tech Mahindra', logo: 'https://logo.clearbit.com/techmahindra.com', followers: 2500000 },
      { id: '51', name: 'Accenture', logo: 'https://logo.clearbit.com/accenture.com', followers: 7000000 },
      { id: '52', name: 'Cognizant', logo: 'https://logo.clearbit.com/cognizant.com', followers: 4000000 },
      { id: '53', name: 'Capgemini', logo: 'https://logo.clearbit.com/capgemini.com', followers: 3000000 },
      { id: '54', name: 'Mphasis', logo: 'https://logo.clearbit.com/mphasis.com', followers: 800000 },
      { id: '55', name: 'Hexaware', logo: 'https://logo.clearbit.com/hexaware.com', followers: 600000 },
      { id: '56', name: 'LTIMindtree', logo: 'https://logo.clearbit.com/ltimindtree.com', followers: 1200000 },
      { id: '57', name: 'Persistent Systems', logo: 'https://logo.clearbit.com/persistent.com', followers: 700000 },
      { id: '58', name: 'Coforge', logo: 'https://logo.clearbit.com/coforge.com', followers: 400000 },
      { id: '59', name: 'Zoho', logo: 'https://logo.clearbit.com/zoho.com', followers: 3000000 },
      { id: '60', name: 'Freshworks', logo: 'https://logo.clearbit.com/freshworks.com', followers: 700000 },
      { id: '61', name: 'Flipkart', logo: 'https://logo.clearbit.com/flipkart.com', followers: 4000000 },
      { id: '62', name: 'Swiggy', logo: 'https://logo.clearbit.com/swiggy.com', followers: 2000000 },
      { id: '63', name: 'Zomato', logo: 'https://logo.clearbit.com/zomato.com', followers: 2500000 },
      { id: '64', name: 'Ola', logo: 'https://logo.clearbit.com/olacabs.com', followers: 1500000 },
      { id: '65', name: 'Paytm', logo: 'https://logo.clearbit.com/paytm.com', followers: 2000000 },
      { id: '66', name: 'Razorpay', logo: 'https://logo.clearbit.com/razorpay.com', followers: 800000 },
      { id: '67', name: "BYJU'S", logo: 'https://logo.clearbit.com/byjus.com', followers: 1500000 },
      { id: '68', name: 'Unacademy', logo: 'https://logo.clearbit.com/unacademy.com', followers: 700000 },
      { id: '69', name: 'upGrad', logo: 'https://logo.clearbit.com/upgrad.com', followers: 600000 },
      { id: '70', name: 'Meesho', logo: 'https://logo.clearbit.com/meesho.com', followers: 900000 },
      { id: '71', name: 'Myntra', logo: 'https://logo.clearbit.com/myntra.com', followers: 1200000 },
      { id: '72', name: 'Nykaa', logo: 'https://logo.clearbit.com/nykaa.com', followers: 800000 },
      { id: '73', name: 'OYO', logo: 'https://logo.clearbit.com/oyorooms.com', followers: 1000000 },
      { id: '74', name: 'Dream11', logo: 'https://logo.clearbit.com/dream11.com', followers: 1200000 },
      { id: '75', name: 'PhonePe', logo: 'https://logo.clearbit.com/phonepe.com', followers: 1500000 },
      { id: '76', name: 'Zerodha', logo: 'https://logo.clearbit.com/zerodha.com', followers: 900000 },
      { id: '77', name: 'Groww', logo: 'https://logo.clearbit.com/groww.in', followers: 700000 },
      { id: '78', name: 'CRED', logo: 'https://logo.clearbit.com/cred.club', followers: 600000 },
      { id: '79', name: 'Delhivery', logo: 'https://logo.clearbit.com/delhivery.com', followers: 500000 },
      { id: '80', name: 'Postman', logo: 'https://logo.clearbit.com/postman.com', followers: 800000 },
      { id: '81', name: 'BrowserStack', logo: 'https://logo.clearbit.com/browserstack.com', followers: 400000 },
      { id: '82', name: 'Deloitte', logo: 'https://logo.clearbit.com/deloitte.com', followers: 5000000 },
      { id: '83', name: 'PwC', logo: 'https://logo.clearbit.com/pwc.com', followers: 4000000 },
      { id: '84', name: 'KPMG', logo: 'https://logo.clearbit.com/kpmg.com', followers: 3500000 },
      { id: '85', name: 'EY', logo: 'https://logo.clearbit.com/ey.com', followers: 4000000 },
      { id: '86', name: 'McKinsey', logo: 'https://logo.clearbit.com/mckinsey.com', followers: 3000000 },
      { id: '87', name: 'BCG', logo: 'https://logo.clearbit.com/bcg.com', followers: 2500000 },
      { id: '88', name: 'HDFC Bank', logo: 'https://logo.clearbit.com/hdfcbank.com', followers: 3000000 },
      { id: '89', name: 'ICICI Bank', logo: 'https://logo.clearbit.com/icicibank.com', followers: 2500000 },
      { id: '90', name: 'JPMorgan', logo: 'https://logo.clearbit.com/jpmorgan.com', followers: 4000000 },
      { id: '91', name: 'Goldman Sachs', logo: 'https://logo.clearbit.com/goldmansachs.com', followers: 3500000 },
      { id: '92', name: 'Samsung', logo: 'https://logo.clearbit.com/samsung.com', followers: 8000000 },
      { id: '93', name: 'Trinity Technology Solutions', logo: '/images/company-logos/trinity-logo.png', followers: 5000 },
      { id: '94', name: 'Nambikkai India', logo: '/images/company-logos/nambikkai-logo.png', followers: 2500 },
    ];
    
    try {
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/companies?search=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const data = await response.json();
        setResults(data);
        setIsOpen(true);
        setLoading(false);
        return;
      }
    } catch (error) {
      console.error('Company search error:', error);
    }
    
    // Use fallback companies
    const filtered = fallbackCompanies.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setResults(filtered);
    setIsOpen(filtered.length > 0);
    setLoading(false);
  };

  const handleSelect = (company: Company) => {
    console.log('CompanyAutoSuggest - Selected company:', company);
    setQuery(company.name);
    setResults([]);
    setIsOpen(false);
    
    // Ensure logo is properly set
    const companyWithLogo = {
      ...company,
      logo: company.logo || `https://img.logo.dev/${company.name.toLowerCase().replace(/\s+/g, '')}.com?token=pk_X-NzP5XzTfCUQXerf-1rvQ&size=200`
    };
    
    onSelect(companyWithLogo);
  };

  const formatFollowers = (count: number | undefined) => {
    if (!count) return '0';
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const getCompanyLogo = (company: Company) => {
    // Special handling for Trinity Technology Solutions
    if (company.name.toLowerCase().includes('trinity')) {
      return '/images/company-logos/trinity-logo.png';
    }
    
    // Special handling for Nambikkai
    if (company.name.toLowerCase().includes('nambikkai')) {
      return '/images/company-logos/nambikkai-logo.png';
    }
    
    // Try multiple logo sources
    const logoSources = [
      company.logo,
      `https://logo.clearbit.com/${company.name.toLowerCase().replace(/\s+/g, '')}.com`,
      `https://img.logo.dev/${company.name.toLowerCase().replace(/\s+/g, '')}.com?token=pk_X-NzP5XzTfCUQXerf-1rvQ&size=200`,
      `https://www.google.com/s2/favicons?domain=${company.name.toLowerCase().replace(/\s+/g, '')}.com&sz=64`
    ];
    
    return logoSources.find(url => url) || logoSources[1];
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (e.target.value.length >= 2) {
              setIsOpen(true);
            }
          }}
          onFocus={() => {
            if (query.length >= 2) {
              setIsOpen(true);
            }
          }}
          onBlur={() => {
            setTimeout(() => setIsOpen(false), 200);
          }}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {loading ? (
            <div className="p-3 text-center text-gray-500">
              <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
            </div>
          ) : results.length > 0 ? (
            results.map((company) => (
              <div
                key={company.id}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(company);
                }}
                className="flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 group"
              >
                <div className="flex-shrink-0 w-10 h-10 mr-3">
                  <div className="w-10 h-10 rounded border border-gray-200 flex items-center justify-center bg-white">
                    <img 
                      src={getCompanyLogo(company)} 
                      alt={company.name}
                      className="w-8 h-8 object-contain"
                      onLoad={(e) => {
                        const img = e.target as HTMLImageElement;
                        img.style.display = 'block';
                      }}
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        
                        // Special handling for Trinity - don't fallback, keep trying Trinity logo
                        if (company.name.toLowerCase().includes('trinity')) {
                          img.src = '/images/company-logos/trinity-logo.png';
                          return;
                        }
                        
                        // Special handling for Nambikkai - don't fallback, keep trying Nambikkai logo
                        if (company.name.toLowerCase().includes('nambikkai')) {
                          img.src = '/images/company-logos/nambikkai-logo.png';
                          return;
                        }
                        
                        // Try next logo source for other companies
                        const currentSrc = img.src;
                        const logoSources = [
                          `https://logo.clearbit.com/${company.name.toLowerCase().replace(/\s+/g, '')}.com`,
                          `https://img.logo.dev/${company.name.toLowerCase().replace(/\s+/g, '')}.com?token=pk_X-NzP5XzTfCUQXerf-1rvQ&size=200`,
                          `https://www.google.com/s2/favicons?domain=${company.name.toLowerCase().replace(/\s+/g, '')}.com&sz=64`
                        ];
                        
                        const currentIndex = logoSources.indexOf(currentSrc);
                        if (currentIndex < logoSources.length - 1) {
                          img.src = logoSources[currentIndex + 1];
                        } else {
                          // All sources failed, show LinkedIn-style building icon
                          const container = img.parentElement;
                          if (container) {
                            img.style.display = 'none';
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
                        }
                      }}
                    />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-gray-900 truncate">{company.name}</div>
                    {(company as any).source === 'clearbit' && (
                      <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full ml-2">
                        Live
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatFollowers(company.followers)} followers
                  </div>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-xs text-blue-600">Select →</span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-3 text-center text-gray-500">No companies found</div>
          )}
        </div>
      )}
    </div>
  );
};

export default CompanyAutoSuggest;
