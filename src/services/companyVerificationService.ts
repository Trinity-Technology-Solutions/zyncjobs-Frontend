/**
 * Company Verification Service
 * Handles company domain verification and profile validation
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
}

export interface DomainVerificationResult {
  isValid: boolean;
  isCompanyDomain: boolean;
  companyProfile?: CompanyProfile;
  verificationMethod: 'company_database' | 'domain_check' | 'manual_review';
  message: string;
}

export class CompanyVerificationService {
  private static readonly PERSONAL_EMAIL_DOMAINS = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 
    'rediffmail.com', 'ymail.com', 'live.com', 'aol.com'
  ];

  /**
   * Verify company domain and get company profile
   */
  static async verifyCompanyDomain(email: string, companyName: string): Promise<DomainVerificationResult> {
    try {
      const response = await fetch(`${API_ENDPOINTS.COMPANIES}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, companyName })
      });
      
      if (!response.ok) {
        throw new Error('Verification request failed');
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Verification failed');
      }
      
      return {
        isValid: data.isValid,
        isCompanyDomain: data.isCompanyDomain,
        companyProfile: data.companyProfile,
        verificationMethod: data.verificationMethod,
        message: data.message
      };
    } catch (error) {
      console.error('Domain verification error:', error);
      return {
        isValid: false,
        isCompanyDomain: false,
        verificationMethod: 'manual_review',
        message: 'Verification service unavailable. Manual review required.'
      };
    }
  }

  /**
   * Search for company in the companies database
   */
  private static async searchCompanyInDatabase(companyName: string, domain: string): Promise<CompanyProfile | null> {
    try {
      const response = await fetch(`${API_ENDPOINTS.COMPANIES}?search=${encodeURIComponent(companyName)}`);
      
      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      const companies = Array.isArray(data) ? data : (data.companies || data.data || []);

      // Look for exact company match
      const exactMatch = companies.find((company: any) => 
        company.name?.toLowerCase() === companyName.toLowerCase() &&
        company.domain?.toLowerCase() === domain
      );

      if (exactMatch) {
        return {
          id: exactMatch.id || exactMatch._id,
          name: exactMatch.name,
          domain: exactMatch.domain,
          logo: exactMatch.logo || exactMatch.logoUrl,
          website: exactMatch.website,
          industry: exactMatch.industry,
          size: exactMatch.size,
          verified: true,
          gstNumber: exactMatch.gstNumber,
          registrationNumber: exactMatch.registrationNumber
        };
      }

      // Look for domain match
      const domainMatch = companies.find((company: any) => 
        company.domain?.toLowerCase() === domain
      );

      if (domainMatch) {
        return {
          id: domainMatch.id || domainMatch._id,
          name: domainMatch.name,
          domain: domainMatch.domain,
          logo: domainMatch.logo || domainMatch.logoUrl,
          website: domainMatch.website,
          industry: domainMatch.industry,
          size: domainMatch.size,
          verified: true,
          gstNumber: domainMatch.gstNumber,
          registrationNumber: domainMatch.registrationNumber
        };
      }

      return null;
    } catch (error) {
      console.error('Company database search error:', error);
      return null;
    }
  }

  /**
   * Check if domain appears to be corporate
   */
  private static async checkDomainCorporate(domain: string): Promise<boolean> {
    // Basic heuristics for corporate domains
    const corporateIndicators = [
      '.com', '.co.in', '.in', '.org', '.net', '.co.uk', '.de', '.fr'
    ];

    const hasCorpTLD = corporateIndicators.some(tld => domain.endsWith(tld));
    
    // Additional checks could include:
    // - MX record validation
    // - Website existence check
    // - Domain age check
    
    return hasCorpTLD && domain.length > 5; // Basic check
  }

  /**
   * Get company suggestions based on partial name
   */
  static async getCompanySuggestions(partialName: string): Promise<CompanyProfile[]> {
    try {
      if (partialName.length < 2) return [];

      const response = await fetch(`${API_ENDPOINTS.COMPANIES}/suggestions?q=${encodeURIComponent(partialName)}&limit=10`);
      
      if (!response.ok) {
        return this.getFallbackSuggestions(partialName);
      }

      const data = await response.json();
      const companies = data.companies || [];

      return companies.map((company: any) => ({
        id: company.id,
        name: company.name,
        domain: company.domain,
        logo: company.logo,
        website: company.website,
        industry: company.industry,
        size: company.size,
        verified: company.verified || false,
        gstNumber: company.gstNumber,
        registrationNumber: company.registrationNumber
      }));

    } catch (error) {
      console.error('Company suggestions error:', error);
      return this.getFallbackSuggestions(partialName);
    }
  }

  /**
   * Fallback company suggestions when API is unavailable
   */
  private static getFallbackSuggestions(partialName: string): CompanyProfile[] {
    const fallbackCompanies = [
      { id: '1', name: 'Zoho Corporation', domain: 'zoho.com', logo: 'https://img.logo.dev/zoho.com?token=pk_cY8JBeWnQR6g5m_ymQhBoQ&size=80', verified: true },
      { id: '2', name: 'Tata Consultancy Services', domain: 'tcs.com', logo: 'https://img.logo.dev/tcs.com?token=pk_cY8JBeWnQR6g5m_ymQhBoQ&size=80', verified: true },
      { id: '3', name: 'Infosys Limited', domain: 'infosys.com', logo: 'https://img.logo.dev/infosys.com?token=pk_cY8JBeWnQR6g5m_ymQhBoQ&size=80', verified: true },
      { id: '4', name: 'Wipro Limited', domain: 'wipro.com', logo: 'https://img.logo.dev/wipro.com?token=pk_cY8JBeWnQR6g5m_ymQhBoQ&size=80', verified: true },
      { id: '5', name: 'Google India', domain: 'google.com', logo: 'https://img.logo.dev/google.com?token=pk_cY8JBeWnQR6g5m_ymQhBoQ&size=80', verified: true },
      { id: '6', name: 'Microsoft India', domain: 'microsoft.com', logo: 'https://img.logo.dev/microsoft.com?token=pk_cY8JBeWnQR6g5m_ymQhBoQ&size=80', verified: true },
      { id: '101', name: 'Trinity Technology Solutions', domain: 'trinitetech.com', logo: '/images/trinity-logo.webp', verified: true },
      { id: '102', name: 'Nambikkai Technologies', domain: 'nambikkai.com', logo: '/images/company-logos/nambikkai-logo.png', verified: true }
    ];

    return fallbackCompanies.filter(company => 
      company.name.toLowerCase().includes(partialName.toLowerCase())
    );
  }

  /**
   * Create or update company profile
   */
  static async createCompanyProfile(companyData: {
    name: string;
    domain: string;
    logo?: string;
    website?: string;
    industry?: string;
    size?: string;
    employerEmail: string;
  }): Promise<CompanyProfile> {
    try {
      const response = await fetch(`${API_ENDPOINTS.COMPANIES}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...companyData,
          verified: false, // Will be verified after domain check
          createdBy: companyData.employerEmail,
          createdAt: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create company profile');
      }

      const createdCompany = await response.json();
      
      return {
        id: createdCompany.id || createdCompany._id,
        name: createdCompany.name,
        domain: createdCompany.domain,
        logo: createdCompany.logo,
        website: createdCompany.website,
        industry: createdCompany.industry,
        size: createdCompany.size,
        verified: createdCompany.verified || false,
        gstNumber: createdCompany.gstNumber,
        registrationNumber: createdCompany.registrationNumber
      };

    } catch (error) {
      console.error('Create company profile error:', error);
      throw error;
    }
  }

  /**
   * Validate GST number format (Indian companies)
   */
  static validateGSTNumber(gstNumber: string): boolean {
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstRegex.test(gstNumber);
  }

  /**
   * Get verification status message
   */
  static getVerificationStatusMessage(result: DomainVerificationResult): string {
    switch (result.verificationMethod) {
      case 'company_database':
        return `✅ ${result.companyProfile?.name || 'Company'} verified! Your email domain matches our records.`;
      case 'domain_check':
        return '🔍 Corporate domain detected. Your account will be verified after registration.';
      case 'manual_review':
        return result.isCompanyDomain 
          ? '⏳ Manual verification required. Our team will review your application.'
          : '📧 Please use your company email address for faster verification.';
      default:
        return '⏳ Verification in progress...';
    }
  }
}