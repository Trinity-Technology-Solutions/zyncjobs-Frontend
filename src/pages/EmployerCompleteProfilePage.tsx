import React, { useState, useEffect } from 'react';
import { Building2, Check, AlertTriangle, Shield, ArrowLeft, CheckCircle, Info } from 'lucide-react';
import Header from '../components/Header';
import { apiFetch } from '../api/apiFetch';
import { updateUserInStorage } from '../utils/userStorage';

interface Props {
  onNavigate: (page: string) => void;
  user?: any;
  onLogout?: () => void;
}

// Multi-step company profile form with enhanced validation
const EmployerCompleteProfilePage: React.FC<Props> = ({ onNavigate, user, onLogout }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Basic Company Info (Mandatory)
    companyName: '',
    industry: '',
    companySize: '',
    foundedYear: '',
    companyType: 'Private',
    headquarters: '',
    description: '',
    companyWebsite: '',
    tagline: '',
    // Step 2: Contact & Verification (Mandatory)
    companyEmail: '',
    phoneNumber: '',
    gstNumber: '',
    cinNumber: '',
    socialLinks: {
      linkedin: '',
      twitter: '',
      facebook: ''
    },
    // Step 3: Benefits & Additional Info (Optional)
    benefits: [] as string[],
    locations: [] as string[],
    companyPhotos: [] as string[]
  });
  const [companyLogo, setCompanyLogo] = useState<string>('');
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [fetchingLogo, setFetchingLogo] = useState(false);
  const [newBenefit, setNewBenefit] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [domainStatus, setDomainStatus] = useState<'idle' | 'verified' | 'corporate' | 'pending' | 'blocked'>('idle');
  // Validation for each step
  const validateStep1 = () => {
    const errors = [];
    if (!formData.companyName.trim()) errors.push('Company name is required');
    if (!formData.industry) errors.push('Industry is required');
    if (!formData.companySize) errors.push('Company size is required');
    if (!formData.foundedYear) errors.push('Founded year is required');
    if (!formData.headquarters.trim()) errors.push('Headquarters is required');
    if (!formData.description.trim()) errors.push('Company description is required');
    if (!formData.companyWebsite.trim()) errors.push('Company website is required');
    if (!formData.tagline.trim()) errors.push('Company tagline is required');
    return errors;
  };

  const validateStep2 = () => {
    const errors = [];
    if (!formData.companyEmail.trim()) errors.push('Company email is required');
    if (!formData.phoneNumber.trim()) errors.push('Phone number is required');
    if (!formData.socialLinks.linkedin.trim()) errors.push('LinkedIn URL is required');
    if (!formData.gstNumber.trim()) errors.push('GST number is required for verification');
    return errors;
  };

  const validateStep3 = () => {
    // Step 3 is optional, no mandatory fields
    return [];
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      const errors = validateStep1();
      if (errors.length > 0) {
        setError(errors[0]);
        return;
      }
      setError('');
      setCurrentStep(2);
    } else if (currentStep === 2) {
      const errors = validateStep2();
      if (errors.length > 0) {
        setError(errors[0]);
        return;
      }
      setError('');
      setCurrentStep(3);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError('');
    }
  };

  // Add benefit
  const addBenefit = () => {
    if (newBenefit.trim() && !formData.benefits.includes(newBenefit.trim())) {
      setFormData(prev => ({
        ...prev,
        benefits: [...prev.benefits, newBenefit.trim()]
      }));
      setNewBenefit('');
    }
  };

  // Remove benefit
  const removeBenefit = (index: number) => {
    setFormData(prev => ({
      ...prev,
      benefits: prev.benefits.filter((_, i) => i !== index)
    }));
  };

  // Add location
  const addLocation = () => {
    if (newLocation.trim() && !formData.locations.includes(newLocation.trim())) {
      setFormData(prev => ({
        ...prev,
        locations: [...prev.locations, newLocation.trim()]
      }));
      setNewLocation('');
    }
  };

  // Remove location
  const removeLocation = (index: number) => {
    setFormData(prev => ({
      ...prev,
      locations: prev.locations.filter((_, i) => i !== index)
    }));
  };

  // Pre-fill form data from user registration details and fetch existing company data
  useEffect(() => {
    const loadCompanyData = async () => {
      const currentUser = user || (() => { try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; } })();
      
      console.log('Loading company data for user:', currentUser);
      
      // Check if we have COMPLETE company profile data (all required fields filled)
      const hasCompleteProfile = currentUser?.companyName && currentUser?.industry && currentUser?.companySize && currentUser?.headquarters;
      
      if (hasCompleteProfile) {
        console.log('Found COMPLETE company profile in localStorage, pre-filling entire form');
        setFormData({
          companyName: currentUser.companyName || '',
          companyEmail: currentUser.email || '', // always locked to registered email
          companyWebsite: currentUser.companyWebsite || '',
          industry: currentUser.industry || '',
          companySize: currentUser.companySize || '',
          headquarters: currentUser.headquarters || '',
          description: currentUser.companyDescription || '',
          tagline: currentUser.tagline || '',
          foundedYear: currentUser.foundedYear || '',
          companyType: currentUser.companyType || 'Private',
          phoneNumber: currentUser.phoneNumber || '',
          gstNumber: currentUser.gstNumber || '',
          cinNumber: currentUser.cinNumber || '',
          socialLinks: {
            linkedin: currentUser.socialLinks?.linkedin || '',
            twitter: currentUser.socialLinks?.twitter || '',
            facebook: currentUser.socialLinks?.facebook || ''
          },
          benefits: Array.isArray(currentUser.benefits) ? currentUser.benefits : [],
          locations: Array.isArray(currentUser.locations) ? currentUser.locations : [],
          companyPhotos: []
        });
        
        if (currentUser.companyLogo) {
          setCompanyLogo(currentUser.companyLogo);
        }
        return; // Don't fetch from backend if we have complete profile
      }
      
      // If we have PARTIAL data (like from registration), pre-fill what we have
      const hasPartialData = currentUser?.companyName || currentUser?.email;
      
      if (hasPartialData) {
        console.log('Found PARTIAL company data from registration, pre-filling basic fields');
        setFormData(prev => ({
          ...prev,
          companyName: currentUser.companyName || currentUser.company || '',
          companyEmail: currentUser.email || '', // always locked to registered email
          companyWebsite: currentUser.companyWebsite || '',
          // Keep other fields empty for first-time completion
        }));
        
        if (currentUser.companyLogo) {
          setCompanyLogo(currentUser.companyLogo);
        }
      }
      
      // Try to fetch additional data from backend (in case company exists)
      if (!currentUser?.email) {
        console.log('No user email available, skipping backend lookup');
        return;
      }
      
      try {
        const API = import.meta.env.VITE_API_URL || '/api';
        const domain = currentUser.email.split('@')[1];
        
        console.log('Checking backend for existing company data for domain:', domain);
        
        // Try multiple approaches to find company data with better error handling
        let companyData = null;
        
        // Approach 1: Try by domain (safest approach)
        try {
          // Suppress 404 errors in console for expected new company lookups
          const originalConsoleError = console.error;
          console.error = (...args) => {
            if (args[0]?.toString().includes('404') || args[0]?.toString().includes('Not Found')) {
              return; // Suppress 404 errors
            }
            originalConsoleError.apply(console, args);
          };
          
          const response = await fetch(`${API}/companies/by-domain/${encodeURIComponent(domain)}`, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          });
          
          // Restore original console.error
          console.error = originalConsoleError;
          
          if (response.ok) {
            const data = await response.json();
            if (data && (data.name || data.companyName)) {
              companyData = data;
              console.log('Found existing company by domain:', companyData);
            }
          } else if (response.status === 404) {
            console.log(`No company found for domain ${domain} (this is normal for new companies)`);
          } else {
            console.log(`Domain lookup returned ${response.status}: ${response.statusText}`);
          }
        } catch (e) {
          // Silently handle domain lookup failures - 404 is expected for new companies
          if (e instanceof Error && !e.message.includes('404')) {
            console.log('Domain lookup failed:', e.message);
          }
        }
        
        // Approach 2: Try by email (if domain lookup failed)
        if (!companyData) {
          try {
            const response = await fetch(`${API}/companies?employerEmail=${encodeURIComponent(currentUser.email)}`, {
              method: 'GET',
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
              }
            });
            
            if (response.ok) {
              const companies = await response.json();
              if (companies && Array.isArray(companies) && companies.length > 0) {
                companyData = companies[0];
                console.log('Found existing company by email:', companyData);
              } else if (companies && !Array.isArray(companies) && (companies.name || companies.companyName)) {
                companyData = companies;
                console.log('Found existing company by email (single result):', companyData);
              }
            } else if (response.status === 404) {
              console.log(`No company found for email ${currentUser.email} (this is normal for new companies)`);
            } else {
              console.log(`Email lookup returned ${response.status}: ${response.statusText}`);
            }
          } catch (e) {
            // Silently handle email lookup failures - 404 is expected for new companies
            if (e instanceof Error && !e.message.includes('404')) {
              console.log('Email lookup failed:', e.message);
            }
          }
        }
        
        // Skip the "get all companies" approach as it's causing 500 errors
        // This approach is too resource-intensive and error-prone
        
        // If we found existing company data, merge it with current form data
        // BUT ONLY if it actually belongs to the current user/domain
        if (companyData && (companyData.name || companyData.companyName)) {
          const currentUserDomain = currentUser.email?.split('@')[1]?.toLowerCase();
          const companyDomain = companyData.domain?.toLowerCase();
          const companyEmail = companyData.employerEmail?.toLowerCase();
          const currentUserEmail = currentUser.email?.toLowerCase();
          
          // Only merge if:
          // 1. The company domain matches the user's email domain, OR
          // 2. The company's employer email matches the current user's email, OR
          // 3. The company name matches what the user already has
          const shouldMerge = (
            (currentUserDomain && companyDomain === currentUserDomain) ||
            (companyEmail === currentUserEmail) ||
            (currentUser.companyName && 
             (companyData.name || companyData.companyName)?.toLowerCase() === currentUser.companyName?.toLowerCase())
          );
          
          if (shouldMerge) {
            console.log('Merging existing company data with current form data');
            setFormData(prev => ({
              ...prev,
              companyName: companyData.name || companyData.companyName || prev.companyName,
              companyEmail: currentUser.email || prev.companyEmail, // always locked to registered email — never overwrite with backend value
              companyWebsite: companyData.website || companyData.companyWebsite || prev.companyWebsite,
              industry: companyData.industry || prev.industry,
              companySize: companyData.size || companyData.companySize || prev.companySize,
              headquarters: companyData.location || companyData.headquarters || prev.headquarters,
              description: companyData.description || companyData.companyDescription || prev.description,
              tagline: companyData.tagline || prev.tagline,
              foundedYear: companyData.foundedYear || prev.foundedYear,
              companyType: companyData.companyType || prev.companyType,
              phoneNumber: companyData.phoneNumber || prev.phoneNumber,
              gstNumber: companyData.gstNumber || prev.gstNumber,
              cinNumber: companyData.cinNumber || prev.cinNumber,
              socialLinks: {
                linkedin: companyData.socialLinks?.linkedin || prev.socialLinks.linkedin,
                twitter: companyData.socialLinks?.twitter || prev.socialLinks.twitter,
                facebook: companyData.socialLinks?.facebook || prev.socialLinks.facebook
              },
              benefits: Array.isArray(companyData.benefits) ? companyData.benefits : prev.benefits,
              locations: Array.isArray(companyData.locations) ? companyData.locations : prev.locations
            }));
            
            if (companyData.logo || companyData.companyLogo) {
              setCompanyLogo(companyData.logo || companyData.companyLogo);
            }
          } else {
            console.log('Found company data but it does not belong to current user - ignoring');
            console.log('Current user domain:', currentUserDomain, 'Company domain:', companyDomain);
            console.log('Current user email:', currentUserEmail, 'Company email:', companyEmail);
          }
        } else {
          console.log('No existing company data found in backend - using registration data only');
        }
        
      } catch (error) {
        console.error('Error loading company data from backend:', error instanceof Error ? error.message : 'Unknown error');
        console.log('Continuing with registration data only due to backend error');
      }
    };
    
    loadCompanyData();
  }, [user]);

  const verifyDomain = async (email: string, companyName: string) => {
    if (!email || !companyName) return;
    setVerifying(true);
    setDomainStatus('idle');
    setError('');
    try {
      const API = import.meta.env.VITE_API_URL || '/api';
      const currentUser = user || (() => { try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; } })();
      const emailDomain = email.split('@')[1]?.toLowerCase();
      const generic = ['gmail.com','yahoo.com','outlook.com','hotmail.com','icloud.com','live.com'];
      if (emailDomain && !generic.includes(emailDomain)) {
        const checkRes = await fetch(`${API}/team/check?memberEmail=${encodeURIComponent(email)}`);
        if (checkRes.ok) {
          const checkData = await checkRes.json();
          if (!checkData.hasInvite) {
            const domainCheckRes = await fetch(`${API}/users/check-domain?domain=${encodeURIComponent(emailDomain)}`);
            if (domainCheckRes.ok) {
              const domainData = await domainCheckRes.json();
              if (domainData.exists && domainData.email !== currentUser.email) {
                setBlockedCompany(domainData.companyName || emailDomain);
                setDomainStatus('blocked');
                setVerifying(false);
                return;
              }
            }
          }
        }
      }
      const res = await fetch(`${API}/companies/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, companyName })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.verificationMethod === 'company_database') setDomainStatus('verified');
        else if (data.verificationMethod === 'domain_check') setDomainStatus('corporate');
        else setDomainStatus('pending');
      } else setDomainStatus('pending');
    } catch { setDomainStatus('pending'); }
    finally { setVerifying(false); }
  };

  // Fetch company logo from domain via backend proxy
  const fetchCompanyLogo = async (website: string) => {
    if (!website) return;
    setFetchingLogo(true);
    try {
      const domain = website.replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/^www\./, '');
      if (!domain) return;
      const API = import.meta.env.VITE_API_URL || '/api';
      const res = await fetch(`${API}/logo-proxy?domain=${encodeURIComponent(domain)}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        setCompanyLogo(url);
      } else {
        setCompanyLogo('');
      }
    } catch {
      setCompanyLogo('');
    } finally {
      setFetchingLogo(false);
    }
  };

  const [blockedCompany, setBlockedCompany] = useState('');

  // Calculate completion percentage based on current step
  const calculateCompletion = () => {
    if (currentStep === 1) {
      const step1Fields = [
        formData.companyName,
        formData.industry,
        formData.companySize,
        formData.foundedYear,
        formData.headquarters,
        formData.description,
        formData.companyWebsite,
        formData.tagline
      ];
      const completed = step1Fields.filter(field => field && field.toString().trim()).length;
      return Math.round((completed / step1Fields.length) * 33); // 33% for step 1
    } else if (currentStep === 2) {
      const step2Fields = [
        formData.companyEmail,
        formData.phoneNumber,
        formData.socialLinks.linkedin,
        formData.gstNumber
      ];
      const completed = step2Fields.filter(field => field && field.toString().trim()).length;
      return 33 + Math.round((completed / step2Fields.length) * 33); // 33% + step 2
    } else {
      const step3Fields = [
        formData.benefits.length > 0 ? 'benefits' : '',
        formData.locations.length > 0 ? 'locations' : ''
      ];
      const completed = step3Fields.filter(field => field && field.toString().trim()).length;
      return 66 + Math.round((completed / step3Fields.length) * 34); // 66% + step 3
    }
  };

  useEffect(() => {
    const percentage = calculateCompletion();
    setCompletionPercentage(percentage);
  }, [formData, currentStep]);

  const handleSubmit = async () => {
    // Validate all steps before submission
    const step1Errors = validateStep1();
    const step2Errors = validateStep2();
    
    if (step1Errors.length > 0) {
      setError(`Step 1: ${step1Errors[0]}`);
      setCurrentStep(1);
      return;
    }
    
    if (step2Errors.length > 0) {
      setError(`Step 2: ${step2Errors[0]}`);
      setCurrentStep(2);
      return;
    }
    
    if (domainStatus === 'blocked') { 
      setError(`${blockedCompany} already has an account. Ask admin to invite you.`); 
      return; 
    }
    
    setLoading(true);
    setError('');
    
    try {
      const stored = localStorage.getItem('user');
      const localUser = stored ? JSON.parse(stored) : {};
      const currentUser = user || localUser;
      if (!currentUser?.id && !currentUser?.email) { onNavigate('employer-login'); return; }
      const domain = currentUser.email?.split('@')[1] || '';

      console.log('Saving company profile with data:', {
        companyName: formData.companyName,
        industry: formData.industry,
        benefits: formData.benefits,
        socialLinks: formData.socialLinks
      });

      // 1. Save to Companies table with all enhanced data
      const API = import.meta.env.VITE_API_URL || '/api';
      const companyPayload = {
        name: formData.companyName, 
        domain, 
        industry: formData.industry,
        size: formData.companySize, 
        location: formData.headquarters,
        website: formData.companyWebsite, 
        description: formData.description,
        employerEmail: currentUser.email,
        // Enhanced fields
        tagline: formData.tagline,
        foundedYear: formData.foundedYear,
        companyType: formData.companyType,
        benefits: formData.benefits,
        socialLinks: formData.socialLinks,
        locations: formData.locations,
        gstNumber: formData.gstNumber,
        cinNumber: formData.cinNumber,
        companyEmail: currentUser.email, // always use authenticated user's email
        phoneNumber: formData.phoneNumber,
        logo: companyLogo
      };
      
      console.log('Company payload:', companyPayload);
      
      // Try to save to backend, but don't fail if it doesn't work
      let companySaveSuccess = false;
      try {
        const companyResponse = await apiFetch(`${API}/companies`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(companyPayload)
        });
        
        console.log('Company save response:', companyResponse);
        companySaveSuccess = true;

        // Auto-fetch logo from email domain if no logo yet
        if (!companyLogo && domain) {
          try {
            const logoRes = await fetch(`${API}/companies/auto-fetch-logo`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ companyName: formData.companyName, domain })
            });
            if (logoRes.ok) {
              const logoData = await logoRes.json();
              if (logoData.logoUrl) setCompanyLogo(logoData.logoUrl);
            }
          } catch {}
        }
      } catch (companyError) {
        console.error('Company save failed (continuing anyway):', companyError instanceof Error ? companyError.message : 'Unknown error');
        // Continue with user update even if company save fails
      }

      // 2. Update User record with company details
      let userUpdateSuccess = false;
      const userId = currentUser.id || currentUser._id;
      if (userId) {
        const userPayload = {
          email: currentUser.email,
          companyName: formData.companyName,
          company: formData.companyName,
          industry: formData.industry,
          companySize: formData.companySize,
          headquarters: formData.headquarters,
          companyWebsite: formData.companyWebsite,
          companyDescription: formData.description,
          tagline: formData.tagline,
          foundedYear: formData.foundedYear,
          companyType: formData.companyType,
          benefits: formData.benefits,
          socialLinks: formData.socialLinks,
          gstNumber: formData.gstNumber,
          companyEmail: currentUser.email, // always use authenticated user's email
          phoneNumber: formData.phoneNumber,
          companyLogo: companyLogo
        };
        
        console.log('User update payload:', userPayload);
        
        try {
          const userResponse = await apiFetch(`${API}/users/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userPayload)
          });
          
          console.log('User update response:', userResponse);
          userUpdateSuccess = true;
        } catch (userError) {
          console.error('User update failed (continuing anyway):', userError instanceof Error ? userError.message : 'Unknown error');
          // Continue even if user update fails
        }
      }

      // 3. Update localStorage with complete company data
      const updatedUser = {
        ...currentUser,
        companyName: formData.companyName,
        company: formData.companyName,
        industry: formData.industry,
        companySize: formData.companySize,
        headquarters: formData.headquarters,
        companyWebsite: formData.companyWebsite,
        companyDescription: formData.description,
        tagline: formData.tagline,
        foundedYear: formData.foundedYear,
        companyType: formData.companyType,
        benefits: formData.benefits,
        socialLinks: formData.socialLinks,
        gstNumber: formData.gstNumber,
        companyEmail: currentUser.email, // always use authenticated user's email
        phoneNumber: formData.phoneNumber,
        companyLogo: companyLogo
      };
      
      console.log('Updating localStorage with:', updatedUser);
      updateUserInStorage(updatedUser);
      
      // Mark profile as completed to prevent popup from showing again
      localStorage.setItem('hasSeenProfilePopup', 'true');

      // Show success message with appropriate details
      setError('');
      let successMessage = 'Company profile saved successfully!';
      
      if (!companySaveSuccess && userId && !userUpdateSuccess) {
        successMessage = 'Profile saved locally. Backend sync will retry automatically.';
      } else if (!companySaveSuccess) {
        successMessage = 'Profile saved successfully! Company data will sync when backend is available.';
      } else if (userId && !userUpdateSuccess) {
        successMessage = 'Company profile saved successfully! User data will sync when backend is available.';
      }
      
      // Show success message with icon instead of emoji
      const alertDiv = document.createElement('div');
      alertDiv.className = 'fixed top-4 right-4 z-50 flex items-center gap-3 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg shadow-lg max-w-md';
      alertDiv.innerHTML = `
        <svg class="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <span class="font-medium">${successMessage}</span>
        <button onclick="this.parentElement.remove()" class="ml-2 text-green-600 hover:text-green-800">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      `;
      document.body.appendChild(alertDiv);
      setTimeout(() => alertDiv.remove(), 5000);
      
      onNavigate('dashboard');
    } catch (error) { 
      console.error('Error saving company profile:', error);
      setError(`Failed to save profile: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`); 
    } finally { 
      setLoading(false); 
    }
  };

  const domainStatusUI = () => {
    if (verifying) return (
      <div className="flex items-center gap-2 text-orange-500 text-sm mt-2">
        <div className="w-3.5 h-3.5 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
        <span className="font-medium">Verifying domain...</span>
      </div>
    );
    if (domainStatus === 'blocked') return (
      <div className="flex items-center gap-2 text-red-600 text-sm mt-2 bg-red-50 rounded-lg px-3 py-2 border border-red-200">
        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
        <span><strong>{blockedCompany}</strong> already registered. Ask admin to invite you.</span>
      </div>
    );
    if (domainStatus === 'verified') return (
      <div className="flex items-center gap-2 text-green-600 text-sm mt-2 bg-green-50 rounded-lg px-3 py-2 border border-green-200">
        <Check className="w-4 h-4 flex-shrink-0" />
        <span className="font-medium">Domain verified successfully!</span>
      </div>
    );
    if (domainStatus === 'corporate') return (
      <div className="flex items-center gap-2 text-blue-600 text-sm mt-2 bg-blue-50 rounded-lg px-3 py-2 border border-blue-200">
        <Shield className="w-4 h-4 flex-shrink-0" />
        <span className="font-medium">Corporate domain detected!</span>
      </div>
    );
    return null;
  };

  const inputCls = "w-full px-4 py-3 rounded-xl text-base text-gray-800 placeholder-gray-400 bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 focus:bg-white hover:border-gray-300 transition-all duration-200";
  const selectCls = `${inputCls} appearance-none cursor-pointer`;
  const labelCls = "block text-sm font-semibold text-gray-700 mb-1.5";

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />

      {/* Corner decorative circles — like login page */}
      <div className="fixed top-16 right-0 w-80 h-80 rounded-full bg-orange-100 opacity-60 -translate-y-1/4 translate-x-1/4 pointer-events-none" />
      <div className="fixed top-16 right-0 w-52 h-52 rounded-full bg-orange-50 opacity-80 -translate-y-1/3 translate-x-1/3 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-96 h-96 rounded-full bg-blue-100 opacity-50 translate-y-1/4 -translate-x-1/4 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-60 h-60 rounded-full bg-blue-50 opacity-70 translate-y-1/3 -translate-x-1/3 pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">

        {/* Back button */}
        <button
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-800 text-sm font-medium mb-4 sm:mb-6 transition-colors duration-200 group"
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center group-hover:bg-orange-50 group-hover:border-orange-300 transition-all duration-200">
            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <span className="hidden sm:inline">Back to Dashboard</span>
          <span className="sm:hidden">Back</span>
        </button>

        {/* Card */}
        <div className="relative bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">

          {/* Orange top accent bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-orange-500 via-orange-400 to-yellow-400" />

          {/* Subtle card inner tint */}
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at top center, rgba(249,115,22,0.04) 0%, transparent 50%)' }} />

          {/* Decorative circle inside card top-right */}
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-orange-100 opacity-40 pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-blue-100 opacity-30 pointer-events-none" />

          <div className="relative z-10 p-4 sm:p-6 lg:p-8">

            {/* Header */}
            <div className="text-center mb-6 sm:mb-8">
              <div className="relative inline-block mb-4 sm:mb-5">
                <div className="absolute inset-0 rounded-2xl blur-xl opacity-40 bg-orange-400" />
                <div className="relative p-3 sm:p-4 rounded-2xl shadow-lg bg-gradient-to-br from-orange-500 to-orange-600">
                  <Building2 className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                </div>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                Edit Your{' '}
                <span className="text-orange-500">Company Profile</span>
              </h1>
              <p className="text-gray-500 text-sm sm:text-base px-2">
                {currentStep === 1 && "Basic company information"}
                {currentStep === 2 && "Contact details & verification"}
                {currentStep === 3 && "Benefits & additional information"}
              </p>
              
              {/* Step Indicator */}
              <div className="flex items-center justify-center gap-2 sm:gap-4 mt-4 sm:mt-6 overflow-x-auto pb-2">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="flex items-center flex-shrink-0">
                    <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold transition-all duration-200 ${
                      step === currentStep 
                        ? 'bg-orange-500 text-white shadow-lg' 
                        : step < currentStep 
                        ? 'bg-green-500 text-white' 
                        : 'bg-gray-200 text-gray-500'
                    }`}>
                      {step < currentStep ? <Check className="w-3 h-3 sm:w-4 sm:h-4" /> : step}
                    </div>
                    {step < 3 && (
                      <div className={`w-8 sm:w-12 h-0.5 mx-1 sm:mx-2 transition-colors duration-200 ${
                        step < currentStep ? 'bg-green-500' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
              
              {/* Step Labels */}
              <div className="flex justify-center gap-4 sm:gap-8 mt-2 sm:mt-3 text-xs text-gray-500 overflow-x-auto">
                <span className={`whitespace-nowrap ${currentStep === 1 ? 'text-orange-600 font-medium' : ''}`}>Basic Info</span>
                <span className={`whitespace-nowrap ${currentStep === 2 ? 'text-orange-600 font-medium' : ''}`}>Contact & Verification</span>
                <span className={`whitespace-nowrap ${currentStep === 3 ? 'text-orange-600 font-medium' : ''}`}>Benefits & Extras</span>
              </div>
              
              <div className="flex items-center justify-center gap-2 mt-3 sm:mt-4">
                <div className="h-px w-10 sm:w-14 bg-gradient-to-r from-transparent to-orange-300" />
                <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-orange-400" />
                <div className="h-px w-10 sm:w-14 bg-gradient-to-l from-transparent to-orange-300" />
              </div>
            </div>

              {/* Pre-filled Data Notice */}
              {(formData.companyEmail) && (
                <div className="mb-4 sm:mb-5 flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3">
                  <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div className="text-blue-700 text-sm">
                    <div className="font-medium mb-1">Registration data loaded</div>
                    <div className="text-xs text-blue-600">
                      Pre-filled: Company email. You can edit any field as needed.
                    </div>
                  </div>
                </div>
              )}

            {/* Error */}
            {error && (
              <div className="mb-4 sm:mb-5 flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3">
                <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <span className="text-red-600 text-sm">{error}</span>
              </div>
            )}

            <div className="space-y-4 sm:space-y-5">
              {/* Company Logo Display */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-3 sm:p-4 border border-blue-200">
                <label className={labelCls}>Company Logo</label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl border-2 border-blue-300 flex items-center justify-center bg-white overflow-hidden flex-shrink-0">
                    {fetchingLogo ? (
                      <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                    ) : companyLogo ? (
                      <img src={companyLogo} alt="Company logo" className="w-full h-full object-contain" />
                    ) : (
                      <div className="text-center">
                        <Building2 className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400 mx-auto mb-1" />
                        <span className="text-xs text-blue-500">Logo</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    {companyLogo ? (
                      <div>
                        <p className="text-sm text-gray-700 font-medium mb-1">Company logo loaded</p>
                        <p className="text-xs text-gray-500">Logo will be displayed on your job postings and company profile</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm text-gray-700 font-medium mb-1">Company logo</p>
                        <p className="text-xs text-gray-500">Logo will be automatically fetched when you enter your website URL</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="bg-gray-50 rounded-xl p-3 sm:p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Profile Completion</span>
                  <span className="text-sm font-bold text-blue-600">{completionPercentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
              </div>

              {/* Step 1: Basic Company Information */}
              {currentStep === 1 && (
                <div className="space-y-4 sm:space-y-5">
                  <div className="bg-orange-50 rounded-xl p-3 sm:p-4 border border-orange-200 mb-4 sm:mb-6">
                    <h3 className="text-base sm:text-lg font-semibold text-orange-800 mb-2">Step 1: Basic Company Information</h3>
                    <p className="text-sm text-orange-600">All fields marked with * are mandatory</p>
                  </div>

                  {/* Company Name */}
                  <div>
                    <label className={labelCls}>Company Name *</label>
                    <input
                      type="text"
                      value={formData.companyName}
                      onChange={e => setFormData(p => ({ ...p, companyName: e.target.value }))}
                      onBlur={() => {
                        const email = user?.email || (() => { try { return JSON.parse(localStorage.getItem('user') || '{}').email; } catch { return ''; } })();
                        if (email && formData.companyName.trim()) {
                          verifyDomain(email, formData.companyName);
                        }
                      }}
                      placeholder="e.g. Google Inc."
                      className={inputCls}
                      required
                    />
                    {domainStatusUI()}
                  </div>

                  {/* Industry + Size */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                    <div>
                      <label className={labelCls}>Industry *</label>
                      <div className="relative">
                        <select value={formData.industry} onChange={e => setFormData(p => ({ ...p, industry: e.target.value }))} className={selectCls} required>
                          <option value="">Select Industry</option>
                          <option>Information Technology</option>
                          <option>Healthcare</option>
                          <option>Finance & Banking</option>
                          <option>Education</option>
                          <option>Manufacturing</option>
                          <option>Retail</option>
                          <option>Media & Entertainment</option>
                          <option>Other</option>
                        </select>
                        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>Company Size *</label>
                      <div className="relative">
                        <select value={formData.companySize} onChange={e => setFormData(p => ({ ...p, companySize: e.target.value }))} className={selectCls} required>
                          <option value="">Select Size</option>
                          <option>1-10 employees</option>
                          <option>11-50 employees</option>
                          <option>51-200 employees</option>
                          <option>201-500 employees</option>
                          <option>500+ employees</option>
                        </select>
                        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Founded Year + Company Type */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                    <div>
                      <label className={labelCls}>Founded Year *</label>
                      <input
                        type="number"
                        value={formData.foundedYear}
                        onChange={e => setFormData(p => ({ ...p, foundedYear: e.target.value }))}
                        placeholder="2020"
                        min="1800"
                        max={new Date().getFullYear()}
                        className={inputCls}
                        required
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Company Type *</label>
                      <div className="relative">
                        <select value={formData.companyType} onChange={e => setFormData(p => ({ ...p, companyType: e.target.value }))} className={selectCls} required>
                          <option>Private</option>
                          <option>Public</option>
                          <option>Startup</option>
                          <option>Non-Profit</option>
                          <option>Government</option>
                        </select>
                        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Headquarters */}
                  <div>
                    <label className={labelCls}>Headquarters *</label>
                    <input type="text" value={formData.headquarters} onChange={e => setFormData(p => ({ ...p, headquarters: e.target.value }))} placeholder="City, State, Country (e.g. Muscat, Oman)" className={inputCls} required />
                  </div>

                  {/* Website */}
                  <div>
                    <label className={labelCls}>Company Website *</label>
                    <input 
                      type="url" 
                      value={formData.companyWebsite} 
                      onChange={e => setFormData(p => ({ ...p, companyWebsite: e.target.value }))} 
                      onBlur={() => fetchCompanyLogo(formData.companyWebsite)}
                      placeholder="https://yourcompany.com" 
                      className={inputCls}
                      required
                    />
                  </div>

                  {/* Tagline */}
                  <div>
                    <label className={labelCls}>Company Tagline *</label>
                    <input
                      type="text"
                      value={formData.tagline}
                      onChange={e => setFormData(p => ({ ...p, tagline: e.target.value }))}
                      placeholder="e.g. Innovating the future of technology"
                      className={inputCls}
                      required
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className={labelCls}>Company Description *</label>
                    <textarea value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} rows={4}
                      placeholder="Tell candidates about your company, mission, and values..."
                      className={`${inputCls} resize-none`}
                      required
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Contact & Verification */}
              {currentStep === 2 && (
                <div className="space-y-4 sm:space-y-5">
                  <div className="bg-blue-50 rounded-xl p-3 sm:p-4 border border-blue-200 mb-4 sm:mb-6">
                    <h3 className="text-base sm:text-lg font-semibold text-blue-800 mb-2">Step 2: Contact Details & Verification</h3>
                    <p className="text-sm text-blue-600">All fields marked with * are mandatory for verification</p>
                  </div>

                  {/* Company Email + Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                    <div>
                      <label className={labelCls}>Company Email *</label>
                      <input
                        type="email"
                        value={formData.companyEmail}
                        readOnly
                        className={`${inputCls} bg-gray-100 cursor-not-allowed text-gray-500`}
                        title="Company email is your registered account email and cannot be changed here"
                      />
                      <p className="text-xs text-gray-400 mt-1">This is your registered account email and cannot be changed here.</p>
                    </div>
                    <div>
                      <label className={labelCls}>Phone Number *</label>
                      <input
                        type="tel"
                        value={formData.phoneNumber}
                        onChange={e => setFormData(p => ({ ...p, phoneNumber: e.target.value }))}
                        placeholder="+91 98765 43210"
                        className={inputCls}
                        required
                      />
                    </div>
                  </div>

                  {/* Social Links */}
                  <div>
                    <label className={labelCls}>Social Links</label>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-gray-600 mb-1 block">LinkedIn URL *</label>
                        <input
                          type="url"
                          value={formData.socialLinks.linkedin}
                          onChange={e => setFormData(p => ({ ...p, socialLinks: { ...p.socialLinks, linkedin: e.target.value } }))}
                          placeholder="https://linkedin.com/company/yourcompany"
                          className={inputCls}
                          required
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-gray-600 mb-1 block">Twitter URL (Optional)</label>
                          <input
                            type="url"
                            value={formData.socialLinks.twitter}
                            onChange={e => setFormData(p => ({ ...p, socialLinks: { ...p.socialLinks, twitter: e.target.value } }))}
                            placeholder="https://twitter.com/yourcompany"
                            className={inputCls}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600 mb-1 block">Facebook URL (Optional)</label>
                          <input
                            type="url"
                            value={formData.socialLinks.facebook}
                            onChange={e => setFormData(p => ({ ...p, socialLinks: { ...p.socialLinks, facebook: e.target.value } }))}
                            placeholder="https://facebook.com/yourcompany"
                            className={inputCls}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* GST/CIN */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                    <div>
                      <label className={labelCls}>GST Number *</label>
                      <input
                        type="text"
                        value={formData.gstNumber}
                        onChange={e => setFormData(p => ({ ...p, gstNumber: e.target.value }))}
                        placeholder="22AAAAA0000A1Z5"
                        className={inputCls}
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">Required for company verification</p>
                    </div>
                    <div>
                      <label className={labelCls}>CIN Number (Optional)</label>
                      <input
                        type="text"
                        value={formData.cinNumber}
                        onChange={e => setFormData(p => ({ ...p, cinNumber: e.target.value }))}
                        placeholder="U72900KA2020PTC134567"
                        className={inputCls}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Benefits & Additional Information */}
              {currentStep === 3 && (
                <div className="space-y-4 sm:space-y-5">
                  <div className="bg-green-50 rounded-xl p-3 sm:p-4 border border-green-200 mb-4 sm:mb-6">
                    <h3 className="text-base sm:text-lg font-semibold text-green-800 mb-2">Step 3: Benefits & Additional Information</h3>
                    <p className="text-sm text-green-600">Optional information to make your company profile more attractive</p>
                  </div>
                  {/* Enhanced Benefits Section */}
                  <div>
                    <label className={labelCls}>Employee Benefits & Perks</label>
                    <p className="text-sm text-gray-500 mb-4">Select all benefits your company offers to employees</p>
                    <div className="space-y-4 sm:space-y-6">
                      {/* Health & Wellness */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          Health & Wellness
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                          {[
                            'Health Insurance',
                            'Life Insurance', 
                            'Dental Insurance',
                            'Vision Insurance',
                            'Mental Health Support',
                            'Wellness Programs',
                            'Gym Membership',
                            'Office Gym',
                            'Health Checkups'
                          ].map(benefit => (
                            <label key={benefit} className="flex items-center gap-2 p-2 sm:p-3 bg-gray-50 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors">
                              <input
                                type="checkbox"
                                checked={formData.benefits.includes(benefit)}
                                onChange={e => {
                                  if (e.target.checked) {
                                    setFormData(p => ({ ...p, benefits: [...p.benefits, benefit] }));
                                  } else {
                                    setFormData(p => ({ ...p, benefits: p.benefits.filter(b => b !== benefit) }));
                                  }
                                }}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 flex-shrink-0"
                              />
                              <span className="text-xs sm:text-sm text-gray-700 leading-tight">{benefit}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Work-Life Balance */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          Work-Life Balance
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                          {[
                            'Flexible Working Hours',
                            'Work From Home',
                            'Remote Work',
                            'Hybrid Work Model',
                            'Paid Time Off',
                            'Maternity Leave',
                            'Paternity Leave',
                            'Sabbatical Leave',
                            '5-Day Work Week'
                          ].map(benefit => (
                            <label key={benefit} className="flex items-center gap-2 p-2 sm:p-3 bg-gray-50 rounded-lg hover:bg-green-50 cursor-pointer transition-colors">
                              <input
                                type="checkbox"
                                checked={formData.benefits.includes(benefit)}
                                onChange={e => {
                                  if (e.target.checked) {
                                    setFormData(p => ({ ...p, benefits: [...p.benefits, benefit] }));
                                  } else {
                                    setFormData(p => ({ ...p, benefits: p.benefits.filter(b => b !== benefit) }));
                                  }
                                }}
                                className="w-4 h-4 text-green-600 rounded focus:ring-green-500 flex-shrink-0"
                              />
                              <span className="text-xs sm:text-sm text-gray-700 leading-tight">{benefit}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Learning & Development */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          Learning & Development
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {[
                            'Training Programs',
                            'Skill Development',
                            'Certification Support',
                            'Conference Attendance',
                            'Online Course Access',
                            'Professional Development',
                            'Mentorship Programs',
                            'Leadership Training',
                            'Technical Training'
                          ].map(benefit => (
                            <label key={benefit} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-purple-50 cursor-pointer transition-colors">
                              <input
                                type="checkbox"
                                checked={formData.benefits.includes(benefit)}
                                onChange={e => {
                                  if (e.target.checked) {
                                    setFormData(p => ({ ...p, benefits: [...p.benefits, benefit] }));
                                  } else {
                                    setFormData(p => ({ ...p, benefits: p.benefits.filter(b => b !== benefit) }));
                                  }
                                }}
                                className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                              />
                              <span className="text-sm text-gray-700">{benefit}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Financial Benefits */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                          Financial Benefits
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {[
                            'Performance Bonus',
                            'Annual Bonus',
                            'Stock Options',
                            'ESOP',
                            'Provident Fund',
                            'Gratuity',
                            'Retirement Benefits',
                            'Travel Allowance',
                            'Mobile Allowance'
                          ].map(benefit => (
                            <label key={benefit} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-yellow-50 cursor-pointer transition-colors">
                              <input
                                type="checkbox"
                                checked={formData.benefits.includes(benefit)}
                                onChange={e => {
                                  if (e.target.checked) {
                                    setFormData(p => ({ ...p, benefits: [...p.benefits, benefit] }));
                                  } else {
                                    setFormData(p => ({ ...p, benefits: p.benefits.filter(b => b !== benefit) }));
                                  }
                                }}
                                className="w-4 h-4 text-yellow-600 rounded focus:ring-yellow-500"
                              />
                              <span className="text-sm text-gray-700">{benefit}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Office Perks */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                          Office Perks
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {[
                            'Free Meals',
                            'Cafeteria',
                            'Snacks & Beverages',
                            'Game Room',
                            'Recreation Area',
                            'Parking Facility',
                            'Transportation',
                            'Childcare Support',
                            'Pet-Friendly Office'
                          ].map(benefit => (
                            <label key={benefit} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-orange-50 cursor-pointer transition-colors">
                              <input
                                type="checkbox"
                                checked={formData.benefits.includes(benefit)}
                                onChange={e => {
                                  if (e.target.checked) {
                                    setFormData(p => ({ ...p, benefits: [...p.benefits, benefit] }));
                                  } else {
                                    setFormData(p => ({ ...p, benefits: p.benefits.filter(b => b !== benefit) }));
                                  }
                                }}
                                className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                              />
                              <span className="text-sm text-gray-700">{benefit}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Career Growth */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                          Career Growth
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {[
                            'Career Advancement',
                            'Internal Job Postings',
                            'Cross-Department Moves',
                            'International Opportunities',
                            'Project Leadership',
                            'Team Management',
                            'Client Interaction',
                            'Innovation Time',
                            'Research Projects'
                          ].map(benefit => (
                            <label key={benefit} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-indigo-50 cursor-pointer transition-colors">
                              <input
                                type="checkbox"
                                checked={formData.benefits.includes(benefit)}
                                onChange={e => {
                                  if (e.target.checked) {
                                    setFormData(p => ({ ...p, benefits: [...p.benefits, benefit] }));
                                  } else {
                                    setFormData(p => ({ ...p, benefits: p.benefits.filter(b => b !== benefit) }));
                                  }
                                }}
                                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                              />
                              <span className="text-sm text-gray-700">{benefit}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                {/* Custom Benefits Input */}
                <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Add Custom Benefits</h4>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newBenefit}
                      onChange={e => setNewBenefit(e.target.value)}
                      placeholder="Enter custom benefit (e.g., Annual Company Trip)"
                      className={`${inputCls} flex-1`}
                      onKeyPress={e => e.key === 'Enter' && addBenefit()}
                    />
                    <button
                      type="button"
                      onClick={addBenefit}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Selected Benefits Summary */}
                {formData.benefits.length > 0 && (
                  <div className="mt-4 p-4 bg-green-50 rounded-xl border border-green-200">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-green-800">Selected Benefits ({formData.benefits.length})</h4>
                      <button
                        type="button"
                        onClick={() => setFormData(p => ({ ...p, benefits: [] }))}
                        className="text-xs text-green-600 hover:text-green-800 font-medium"
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.benefits.map((benefit, index) => (
                        <span key={index} className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                          {benefit}
                          <button 
                            onClick={() => removeBenefit(index)} 
                            className="text-green-600 hover:text-green-800 ml-1 font-bold"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                  {/* Additional Locations */}
                  <div>
                    <label className={labelCls}>Additional Office Locations</label>
                    <p className="text-sm text-gray-500 mb-3">Add other cities/countries where your company has offices</p>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={newLocation}
                        onChange={e => setNewLocation(e.target.value)}
                        placeholder="e.g., Mumbai, Maharashtra, India"
                        className={`${inputCls} flex-1`}
                        onKeyPress={e => e.key === 'Enter' && addLocation()}
                      />
                      <button
                        type="button"
                        onClick={addLocation}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
                      >
                        Add
                      </button>
                    </div>
                    {formData.locations.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {formData.locations.map((location, index) => (
                          <span key={index} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                            {location}
                            <button 
                              onClick={() => removeLocation(index)} 
                              className="text-blue-600 hover:text-blue-800 ml-1 font-bold"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-center mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-100 gap-3 sm:gap-0">
              {currentStep === 1 ? (
                <button onClick={() => onNavigate('dashboard')} className="text-sm text-gray-400 hover:text-gray-600 transition-colors order-2 sm:order-1">
                  Skip for now
                </button>
              ) : (
                <button
                  onClick={handlePrevStep}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors order-2 sm:order-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Previous
                </button>
              )}
              
              {currentStep < 3 ? (
                <button
                  onClick={handleNextStep}
                  className="group relative flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-lg hover:shadow-blue-200 hover:-translate-y-0.5 transition-all duration-200 overflow-hidden order-1 sm:order-2 w-full sm:w-auto justify-center"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/15 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  <span className="relative z-10">Next Step</span>
                  <svg className="w-4 h-4 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading || domainStatus === 'blocked'}
                  className="group relative flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-md hover:shadow-lg hover:shadow-orange-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 transition-all duration-200 overflow-hidden order-1 sm:order-2 w-full sm:w-auto justify-center"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/15 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  <span className="relative z-10">{loading ? 'Saving...' : 'Save Profile'}</span>
                  {loading
                    ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin relative z-10" />
                    : <Check className="w-4 h-4 relative z-10" />
                  }
                </button>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployerCompleteProfilePage;
