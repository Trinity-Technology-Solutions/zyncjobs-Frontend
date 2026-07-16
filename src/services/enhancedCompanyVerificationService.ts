/**
 * Enhanced Company Verification Service
 * Uses multiple data sources for comprehensive company verification
 */

import { API_ENDPOINTS } from '../config/env';

export interface CompanyProfile {
  id: string;
  name: string;
  domain: string;
  logo?: string;
  website?: string;
  industry?: string;
  size?: string;
  verified: boolean;
  gstNumber?: string;
  registrationNumber?: string;
  dataSource?: 'database' | 'api' | 'domain_check' | 'fallback';
}

export interface DomainVerificationResult {
  isValid: boolean;
  isCompanyDomain: boolean;
  companyProfile?: CompanyProfile;
  verificationMethod: 'company_database' | 'external_api' | 'domain_check' | 'manual_review';
  message: string;
}

export class EnhancedCompanyVerificationService {
  private static readonly PERSONAL_EMAIL_DOMAINS = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 
    'rediffmail.com', 'ymail.com', 'live.com', 'aol.com'
  ];

  /**
   * Enhanced company domain verification with database-first approach
   */
  static async verifyCompanyDomain(email: string, companyName: string): Promise<DomainVerificationResult> {
    const domain = email.split('@')[1]?.toLowerCase();
    
    if (!domain || this.PERSONAL_EMAIL_DOMAINS.includes(domain)) {
      return {
        isValid: false,
        isCompanyDomain: false,
        verificationMethod: 'manual_review',
        message: 'Please use your company email address'
      };
    }

    try {
      // 1. FIRST: Check internal database/JSON - if exists, auto-approve
      const dbResult = await this.searchInternalDatabase(companyName, domain);
      if (dbResult) {
        return {
          isValid: true,
          isCompanyDomain: true,
          companyProfile: { ...dbResult, dataSource: 'database' },
          verificationMethod: 'company_database',
          message: 'Company found in database - auto-approved'
        };
      }

      // 2. Company NOT in DB/JSON - Check if it's a valid corporate domain
      const isValidCorporateDomain = await this.isValidCorporateDomain(domain);
      
      if (isValidCorporateDomain) {
        // Valid corporate domain but not in DB - send to admin for approval
        return {
          isValid: true,
          isCompanyDomain: true,
          companyProfile: {
            id: `pending_${domain}`,
            name: companyName,
            domain,
            logo: '',
            website: `https://${domain}`,
            verified: false,
            dataSource: 'domain_check'
          },
          verificationMethod: 'manual_review',
          message: 'New company - requires admin verification'
        };
      }

      // 3. Invalid domain - manual review
      return {
        isValid: false,
        isCompanyDomain: false,
        verificationMethod: 'manual_review',
        message: 'Invalid domain - manual verification required'
      };

    } catch (error) {
      console.error('Enhanced verification error:', error);
      return {
        isValid: false,
        isCompanyDomain: false,
        verificationMethod: 'manual_review',
        message: 'Verification service unavailable'
      };
    }
  }

  /**
   * Check if domain is valid corporate domain (for new companies not in DB)
   */
  private static async isValidCorporateDomain(domain: string): Promise<boolean> {
    try {
      // Check corporate TLD patterns
      const corporateTLDs = [
        '.com', '.co.in', '.in', '.org', '.net', '.co.uk', '.de', '.fr', 
        '.au', '.ca', '.co', '.io', '.tech', '.ai', '.inc'
      ];
      
      const hasCorpTLD = corporateTLDs.some(tld => domain.endsWith(tld));
      const isNotSubdomain = domain.split('.').length <= 2;
      const hasReasonableLength = domain.length >= 4 && domain.length <= 50;
      
      // Basic domain validation
      if (!hasCorpTLD || !isNotSubdomain || !hasReasonableLength) {
        return false;
      }
      
      // Even if website check fails, allow corporate domains
      return true;
      
    } catch (error) {
      console.error('Corporate domain validation error:', error);
      return false;
    }
  }

  /**
   * Enhanced search that checks both name and domain matches
   */
  private static async searchInternalDatabase(companyName: string, domain: string): Promise<CompanyProfile | null> {
    try {
      const response = await fetch(`${API_ENDPOINTS.COMPANIES}?search=${encodeURIComponent(companyName)}`);
      
      if (!response.ok) return null;

      const data = await response.json();
      const companies = Array.isArray(data) ? data : (data.companies || data.data || []);

      // Priority 1: Exact domain match
      const domainMatch = companies.find((company: any) => 
        company.domain?.toLowerCase() === domain
      );
      
      if (domainMatch) {
        return {
          id: domainMatch.id || domainMatch._id,
          name: domainMatch.name,
          domain: domainMatch.domain,
          logo: domainMatch.logo,
          website: domainMatch.website,
          industry: domainMatch.industry,
          size: domainMatch.size,
          verified: true,
          gstNumber: domainMatch.gstNumber,
          registrationNumber: domainMatch.registrationNumber,
          dataSource: 'database'
        };
      }

      // Priority 2: Exact company name match
      const nameMatch = companies.find((company: any) => 
        company.name?.toLowerCase().trim() === companyName.toLowerCase().trim()
      );

      if (nameMatch) {
        return {
          id: nameMatch.id || nameMatch._id,
          name: nameMatch.name,
          domain: nameMatch.domain,
          logo: nameMatch.logo,
          website: nameMatch.website,
          industry: nameMatch.industry,
          size: nameMatch.size,
          verified: true,
          gstNumber: nameMatch.gstNumber,
          registrationNumber: nameMatch.registrationNumber,
          dataSource: 'database'
        };
      }

      // No match found - company not in database
      return null;
      
    } catch (error) {
      console.error('Database search error:', error);
      return null;
    }
  }

  /**
   * Search multiple external APIs
   */
  private static async searchExternalAPIs(domain: string, companyName: string): Promise<CompanyProfile | null> {
    // Try multiple sources in parallel
    const promises = [
      this.getFromLogoAPI(domain, companyName),
      this.getFromOpenCorporates(domain, companyName),
      this.getFromWebsiteScraping(domain, companyName)
    ];

    const results = await Promise.allSettled(promises);
    
    // Return first successful result
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        return result.value;
      }
    }

    return null;
  }

  /**
   * Get company info from Logo API + basic validation
   */
  private static async getFromLogoAPI(domain: string, companyName: string): Promise<CompanyProfile | null> {
    try {
      // Check if domain has a website
      const websiteCheck = await fetch(`https://${domain}`, { 
        method: 'HEAD',
        mode: 'no-cors'
      }).catch(() => null);

      if (websiteCheck) {
        return {
          id: `api_${domain}`,
          name: companyName,
          domain,
          logo: '',
          website: `https://${domain}`,
          verified: true,
          dataSource: 'api'
        };
      }
    } catch (error) {
      console.error('Logo API error:', error);
    }
    return null;
  }

  /**
   * Get from OpenCorporates (Free API)
   */
  private static async getFromOpenCorporates(domain: string, companyName: string): Promise<CompanyProfile | null> {
    try {
      const response = await fetch(
        `https://api.opencorporates.com/companies/search?q=${encodeURIComponent(companyName)}&format=json&per_page=1`
      );
      
      if (response.ok) {
        const data = await response.json();
        const company = data.results?.companies?.[0]?.company;
        
        if (company) {
          return {
            id: `oc_${company.company_number}`,
            name: company.name,
            domain,
            logo: '',
            website: `https://${domain}`,
            industry: company.company_type,
            verified: true,
            registrationNumber: company.company_number,
            dataSource: 'api'
          };
        }
      }
    } catch (error) {
      console.error('OpenCorporates API error:', error);
    }
    return null;
  }

  /**
   * Basic website scraping for company info
   */
  private static async getFromWebsiteScraping(domain: string, companyName: string): Promise<CompanyProfile | null> {
    try {
      // This would need to be implemented on backend due to CORS
      // For now, just validate domain exists
      const response = await fetch(`https://${domain}`, { 
        method: 'HEAD',
        mode: 'no-cors'
      }).catch(() => null);

      if (response) {
        return {
          id: `web_${domain}`,
          name: companyName,
          domain,
          logo: '',
          website: `https://${domain}`,
          verified: true,
          dataSource: 'domain_check'
        };
      }
    } catch (error) {
      console.error('Website scraping error:', error);
    }
    return null;
  }

  /**
   * Enhanced domain validation
   */
  private static async enhancedDomainCheck(domain: string, companyName: string): Promise<CompanyProfile | null> {
    try {
      // Check if domain has proper corporate structure
      const corporateIndicators = [
        '.com', '.co.in', '.in', '.org', '.net', '.co.uk', '.de', '.fr', '.au', '.ca'
      ];

      const hasCorpTLD = corporateIndicators.some(tld => domain.endsWith(tld));
      const isNotSubdomain = domain.split('.').length <= 2;
      const hasReasonableLength = domain.length >= 4 && domain.length <= 50;

      if (hasCorpTLD && isNotSubdomain && hasReasonableLength) {
        return {
          id: `domain_${domain}`,
          name: companyName,
          domain,
          logo: '',
          website: `https://${domain}`,
          verified: true,
          dataSource: 'domain_check'
        };
      }
    } catch (error) {
      console.error('Enhanced domain check error:', error);
    }
    return null;
  }

  /**
   * Save company to database for future use
   */
  private static async saveToDatabase(company: CompanyProfile): Promise<void> {
    try {
      await fetch(`${API_ENDPOINTS.COMPANIES}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: company.name,
          domain: company.domain,
          logo: company.logo,
          website: company.website,
          industry: company.industry,
          size: company.size,
          verified: true,
          dataSource: company.dataSource,
          autoGenerated: true,
          createdAt: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Save to database error:', error);
    }
  }

  /**
   * Get enhanced company suggestions
   */
  static async getCompanySuggestions(partialName: string): Promise<CompanyProfile[]> {
    if (partialName.length < 2) return [];

    try {
      // 1. Try API first
      const response = await fetch(`${API_ENDPOINTS.COMPANIES}/suggestions?q=${encodeURIComponent(partialName)}&limit=10`);
      
      let apiResults: CompanyProfile[] = [];
      if (response.ok) {
        const data = await response.json();
        apiResults = data.companies || [];
      }

      // 2. Add fallback suggestions
      const fallbackResults = this.getFallbackSuggestions(partialName);

      // 3. Combine and deduplicate by normalized name OR domain
      const allResults = [...apiResults, ...fallbackResults];
      const seen = new Set<string>();
      const uniqueResults = allResults.filter(company => {
        const nameKey = company.name.toLowerCase().replace(/\s+/g, '');
        const domainKey = company.domain?.toLowerCase() || '';
        if (seen.has(nameKey) || (domainKey && seen.has(domainKey))) return false;
        seen.add(nameKey);
        if (domainKey) seen.add(domainKey);
        return true;
      });

      return uniqueResults.slice(0, 10);

    } catch (error) {
      console.error('Enhanced suggestions error:', error);
      return this.getFallbackSuggestions(partialName);
    }
  }

  /**
   * Fallback suggestions (always available)
   */
  private static getFallbackSuggestions(partialName: string): CompanyProfile[] {
    const fallbackCompanies = [
      { id: '1', name: 'Zoho Corporation', domain: 'zoho.com', logo: '', verified: true, dataSource: 'fallback' as const },
      { id: '2', name: 'Tata Consultancy Services', domain: 'tcs.com', logo: '', verified: true, dataSource: 'fallback' as const },
      { id: '3', name: 'Infosys Limited', domain: 'infosys.com', logo: '', verified: true, dataSource: 'fallback' as const },
      { id: '4', name: 'Wipro Limited', domain: 'wipro.com', logo: '', verified: true, dataSource: 'fallback' as const },
    ];

    return fallbackCompanies.filter(company => 
      company.name.toLowerCase().includes(partialName.toLowerCase())
    );
  }
}
