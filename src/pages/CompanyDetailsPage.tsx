import { useState, useEffect, useMemo } from 'react';
import { Star, MapPin, X } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BackButton from '../components/BackButton';
import AutocompleteCombobox from '../components/AutocompleteCombobox';
import CompanyLogo from '../components/CompanyLogo';
import { API_ENDPOINTS } from '../config/env';
import { apiFetch } from '../api/apiFetch';
import { EnhancedCompanyData, CompanyBenefit, CompanyDepartment, EmployeeSalary } from '../api/companyDataService';
import { useSavedJobsStore } from '../store/useSavedJobsStore';
import { normalizeSocialUrl } from '../utils/socialLinks';

interface Company {
  _id: string;
  name: string;
  industry: string;
  rating: number | null;
  description: string;
  location: string;
  employees: string;
  website: string;
  openJobs: number;
  logo?: string;
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

interface Job {
  _id: string;
  id?: string;
  jobTitle: string;
  location: string;
  salary?: any;
  company?: string;
  jobType?: string;
  jobCategory?: string;
  slug?: string;
}

const displayValue = (val: string | undefined | null): string =>
  val && val !== 'N/A' ? val : 'Not specified';

const cleanEmployees = (val: string | undefined | null): string => {
  if (!val) return 'Not specified';
  return val.replace(/\s*employees?\s*$/i, '').trim();
};

const formatSalary = (salary: any): string => {
  if (!salary) return '';
  if (typeof salary === 'string') return salary;
  if (typeof salary === 'object') {
    const { min, max, currency } = salary;
    const CURRENCY_SYMBOLS: Record<string, string> = { INR: '₹', USD: '$', EUR: '€', GBP: '£', AED: 'د.إ', SAR: 'ر.س', SGD: 'S$', MYR: 'RM', THB: '฿', PHP: '₱', IDR: 'Rp', VND: '₫', KRW: '₩', JPY: '¥', CNY: '¥', TWD: 'NT$', HKD: 'HK$', CAD: 'C$', AUD: 'A$', NZD: 'NZ$', CHF: 'Fr', SEK: 'kr', NOK: 'kr', DKK: 'kr', PLN: 'zł', TRY: '₺', ZAR: 'R', BRL: 'R$', MXN: '$', NGN: '₦', KES: 'KSh', EGP: 'E£' };
    const sym = CURRENCY_SYMBOLS[currency] || (currency || '₹');
    const fmtNum = (n: number): string => {
      if (n >= 10000000) return `${(n / 10000000).toFixed(n % 10000000 === 0 ? 0 : 1)}Cr`;
      if (n >= 100000) return `${(n / 100000).toFixed(n % 100000 === 0 ? 0 : 1)}L`;
      if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
      if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}K`;
      return n.toString();
    };
    if (min && max) {
      if (min === max) return `${sym}${fmtNum(min)}`;
      return `${sym}${fmtNum(min)} - ${sym}${fmtNum(max)}`;
    }
    if (min) return `${sym}${fmtNum(min)}+`;
    if (max) return `Up to ${sym}${fmtNum(max)}`;
  }
  return '';
};

const CompanyDetailsPage = ({ onNavigate, user, onLogout }: {
  onNavigate?: (page: string, params?: any) => void;
  user?: any;
  onLogout?: () => void;
  companyId?: string;
}): JSX.Element => {
  const [company, setCompany] = useState<Company | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', review: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [activeTab, setActiveTab] = useState<'overview' | 'jobs' | 'reviews'>('overview');
  const [showFullDesc, setShowFullDesc] = useState(false);
  
  // Dynamic data states
  const [_enhancedData, setEnhancedData] = useState<EnhancedCompanyData | null>(null);
  const [benefits, setBenefits] = useState<CompanyBenefit[]>([]);
  const [departments, _setDepartments] = useState<CompanyDepartment[]>([]);
  const [salaries, _setSalaries] = useState<EmployeeSalary[]>([]);
  const [_reviewBreakdown, _setReviewBreakdown] = useState<any>(null);
  const [_similarCompanies, _setSimilarCompanies] = useState<any[]>([]);

  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');

  const isCandidate = user?.role === 'candidate' || user?.userType === 'candidate' || user?.type === 'candidate';
  const isEmployer = user?.role === 'employer' || user?.userType === 'employer' || user?.type === 'employer';
  const savedJobIds = useSavedJobsStore(s => s.savedJobIds);
  const saveJobGlobal = useSavedJobsStore(s => s.saveJob);
  const unsaveJobGlobal = useSavedJobsStore(s => s.unsaveJob);

  const jobLocations = useMemo(() => [...new Set(jobs.map(j => (j.location || '').trim()).filter(Boolean))], [jobs]);
  const jobCategories = useMemo(() => [...new Set(jobs.map(j => (j.jobCategory || j.category || j.jobType || '').trim()).filter(Boolean))], [jobs]);

  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      if (selectedLocation && !(job.location || '').toLowerCase().includes(selectedLocation.toLowerCase())) return false;
      if (selectedDepartment) {
        const deptVal = (job.jobCategory || job.category || job.jobType || '').trim();
        if (deptVal.toLowerCase() !== selectedDepartment.toLowerCase()) return false;
      }
      return true;
    });
  }, [jobs, selectedLocation, selectedDepartment]);

  useEffect(() => {
    const savedCompany = localStorage.getItem('selectedCompany');
    if (!savedCompany || !user?.email) return;
    
    try {
      const companyData = JSON.parse(savedCompany);
      const companyIdentifier = companyData._id || companyData.name || '';
      
      // Try to get follow status, but don't fail if endpoint doesn't exist
      fetch(`${API_ENDPOINTS.BASE_URL}/companies/${encodeURIComponent(companyIdentifier)}/follow-status?userEmail=${encodeURIComponent(user.email)}`)
        .then(r => {
          if (r.ok) {
            return r.json();
          } else if (r.status === 404) {
            // Follow feature not implemented - set default values
            return { isFollowing: false, followersCount: 0 };
          }
          return null;
        })
        .then(data => {
          if (data) { 
            setIsFollowing(data.isFollowing || false); 
            setFollowersCount(data.followersCount || 0); 
          }
        })
        .catch(error => {
          console.log('Follow status check failed:', error);
          // Set default values on error
          setIsFollowing(false);
          setFollowersCount(0);
        });
    } catch (error) {
      console.error('Error parsing company data for follow status:', error);
    }
  }, [user]);

  useEffect(() => {
    const loadCompanyData = async () => {
      const savedCompany = localStorage.getItem('selectedCompany');
      if (savedCompany) {
        try {
          const companyData = JSON.parse(savedCompany);
          
          // Fetch real company data from API
          await fetchRealCompanyData(companyData.name || companyData._id);
          
          await fetchCompanyJobs(companyData.name);
          const companyReviews = await fetchCompanyReviews(companyData.name);
          setReviews(companyReviews);
          
          if (user?.email) {
            const companyIdentifier = companyData._id || companyData.name || '';
            fetch(`${API_ENDPOINTS.BASE_URL}/companies/${encodeURIComponent(companyIdentifier)}/follow-status?userEmail=${encodeURIComponent(user.email)}`)
              .then(r => {
                if (r.ok) {
                  return r.json();
                } else if (r.status === 404) {
                  return { isFollowing: false, followersCount: 0 };
                }
                return null;
              })
              .then(data => { 
                if (data) { 
                  setIsFollowing(data.isFollowing || false); 
                  setFollowersCount(data.followersCount || 0); 
                } 
              })
              .catch(error => {
                console.log('Follow status check failed in loadCompanyData:', error);
                setIsFollowing(false);
                setFollowersCount(0);
              });
          }
        } catch (error) {
          console.error('Error parsing company data:', error);
        }
      }
      setLoading(false);
    };
    loadCompanyData();
  }, []);
  
  // Fetch real company data from API
  const fetchRealCompanyData = async (companyId: string) => {
    try {
      // First try to get company by ID if it looks like an ID
      let response;
      if (companyId.match(/^[0-9a-fA-F]{24}$/)) {
        // MongoDB ObjectId format
        response = await fetch(`${API_ENDPOINTS.BASE_URL}/companies/${companyId}`);
      } else {
        // For company names, search through all companies to find a match
        const encodedName = encodeURIComponent(companyId.trim());
        
        // Try to get all companies and find by name
        const allCompaniesResponse = await fetch(`${API_ENDPOINTS.BASE_URL}/companies`);
        if (allCompaniesResponse.ok) {
          const allCompanies = await allCompaniesResponse.json();
          const companies = Array.isArray(allCompanies) ? allCompanies : allCompanies.companies || [];
          const foundCompany = companies.find((c: any) => 
            (c.name || c.companyName || '').toLowerCase() === companyId.toLowerCase()
          );
          
          if (foundCompany) {
            // Create a mock response with the found company data
            response = {
              ok: true,
              json: async () => foundCompany
            } as Response;
          } else {
            // If not found in companies list, try direct endpoint as fallback
            response = await fetch(`${API_ENDPOINTS.BASE_URL}/companies/${encodedName}`);
          }
        } else {
          // Fallback to direct endpoint
          response = await fetch(`${API_ENDPOINTS.BASE_URL}/companies/${encodedName}`);
        }
      }
      
      if (response.ok) {
        const realCompanyData = await response.json();
        
        // Map API data to component state
        const mappedCompany = {
          _id: realCompanyData._id || realCompanyData.id,
          name: realCompanyData.name || realCompanyData.companyName,
          industry: realCompanyData.industry,
          rating: realCompanyData.rating || null,
          description: realCompanyData.description || realCompanyData.about,
          location: realCompanyData.location || realCompanyData.headquarters,
          employees: realCompanyData.size || realCompanyData.companySize || realCompanyData.employees,
          website: realCompanyData.website || realCompanyData.companyWebsite,
          openJobs: realCompanyData.openPositions ?? realCompanyData.openJobs ?? 0,
          logo: realCompanyData.logo,
          tagline: realCompanyData.tagline,
          foundedYear: realCompanyData.foundedYear,
          companyType: realCompanyData.companyType || '—',
          benefits: realCompanyData.benefits || [],
          socialLinks: realCompanyData.socialLinks || {},
          locations: realCompanyData.locations || [],
          gstNumber: realCompanyData.gstNumber,
          cinNumber: realCompanyData.cinNumber
        };
        
        setCompany(mappedCompany as Company);
        
        // Set enhanced data for display
        const enhancedCompanyData: EnhancedCompanyData = {
          id: realCompanyData._id || realCompanyData.id,
          name: realCompanyData.name || realCompanyData.companyName,
          industry: realCompanyData.industry,
          description: realCompanyData.description || realCompanyData.about,
          company_type: realCompanyData.companyType || '—',
          founded_year: realCompanyData.foundedYear ? parseInt(realCompanyData.foundedYear) : null,
          tagline: realCompanyData.tagline,
          logo_url: realCompanyData.logo,
          website: realCompanyData.website || realCompanyData.companyWebsite,
          headquarters: realCompanyData.location || realCompanyData.headquarters,
          employees: realCompanyData.size || realCompanyData.companySize,
          socialLinks: realCompanyData.socialLinks || {},
          additional_locations: realCompanyData.locations || [],
          verification_status: realCompanyData.gstNumber ? 'verified' : 'pending',
          avg_rating: realCompanyData.rating || 0,
          review_count: 0,
          follower_count: 0,
          total_jobs: 0,
          benefits: [],
          departments: [],
          salaries: [],
          review_breakdown: {
            work_life_rating: 0,
            salary_rating: 0,
            culture_rating: 0,
            growth_rating: 0,
            security_rating: 0,
            skill_development_rating: 0
          },
          similar_companies: []
        };
        
        setEnhancedData(enhancedCompanyData);
        
        // Set benefits if available
        if (realCompanyData.benefits && realCompanyData.benefits.length > 0) {
          const mappedBenefits = realCompanyData.benefits.map((benefit: string, index: number) => ({
            benefit_name: benefit,
            benefit_type: getBenefitType(benefit),
            employee_count: Math.floor(Math.random() * 20) + 5 // Mock count
          }));
          setBenefits(mappedBenefits);
        }
        
      } else {
        console.log('Company API returned:', response.status, response.statusText);
        // Fallback to localStorage data if API fails
        const savedCompany = localStorage.getItem('selectedCompany');
        if (savedCompany) {
          const companyData = JSON.parse(savedCompany);
          setCompany(companyData);
        }
      }
    } catch (error) {
      console.error('Error fetching real company data:', error);
      // Always fallback to localStorage data on error
      const savedCompany = localStorage.getItem('selectedCompany');
      if (savedCompany) {
        try {
          const companyData = JSON.parse(savedCompany);
          setCompany(companyData);
        } catch (parseError) {
          console.error('Error parsing saved company data:', parseError);
        }
      }
    }
  };
  
  // Helper function to map benefit names to types
  const getBenefitType = (benefitName: string): string => {
    const lowerName = benefitName.toLowerCase();
    if (lowerName.includes('health') || lowerName.includes('medical') || lowerName.includes('insurance')) return 'health_insurance';
    if (lowerName.includes('training') || lowerName.includes('skill') || lowerName.includes('learning')) return 'skill_training';
    if (lowerName.includes('food') || lowerName.includes('cafeteria') || lowerName.includes('meal')) return 'cafeteria';
    if (lowerName.includes('gym') || lowerName.includes('fitness') || lowerName.includes('wellness')) return 'gym';
    if (lowerName.includes('child') || lowerName.includes('daycare') || lowerName.includes('creche')) return 'childcare';
    return 'health_insurance'; // default
  };

  const fetchCompanyJobs = async (companyName: string) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/jobs?limit=1000`);
      if (response.ok) {
        const allJobs = await response.json();
        const jobsArray = Array.isArray(allJobs) ? allJobs : allJobs.jobs || allJobs.data || [];
        const companyJobs = jobsArray
          .filter((job: any) => (job.company || job.companyName)?.toLowerCase() === companyName.toLowerCase())
          .map((job: any) => ({
            _id: job._id || job.id,
            id: job.id || job._id,
            jobTitle: job.jobTitle || job.title,
            location: job.location,
            salary: job.salary,
            company: job.company || job.companyName || companyName,
            jobType: job.jobType,
            jobCategory: job.jobCategory,
            category: job.category,
            slug: job.slug,
          }));
        setJobs(companyJobs);
        setSelectedLocation('');
        setSelectedDepartment('');
      }
    } catch (error) {
      console.error('Error fetching company jobs:', error);
      setJobs([]);
    }
  };

  const fetchCompanyReviews = async (companyName: string) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/reviews?companyName=${encodeURIComponent(companyName)}`);
      if (response.ok) {
        const data = await response.json();
        return Array.isArray(data.reviews) ? data.reviews : Array.isArray(data) ? data : [];
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
    return [];
  };

  const handleFollow = async () => {
    if (!user?.email) {
      window.dispatchEvent(new CustomEvent('zync:alert', { detail: { message: 'Please login to follow companies' } }));
      return;
    }
    
    const companyName = company?.name || company?._id || '';
    if (!companyName) return;
    
    const wasFollowing = isFollowing;
    const prevCount = followersCount;
    const action = wasFollowing ? 'unfollow' : 'follow';
    
    // Optimistically update UI
    setIsFollowing(!wasFollowing);
    setFollowersCount(wasFollowing ? Math.max(0, prevCount - 1) : prevCount + 1);
    
    try {
      // Try the follow endpoint
      const companyIdentifier = company?._id || company?.name || '';
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/companies/${encodeURIComponent(companyIdentifier)}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: user.email, userName: user.name }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.followersCount !== undefined) {
          setFollowersCount(data.followersCount);
        }
        window.dispatchEvent(new CustomEvent('zync:alert', { 
          detail: { 
            message: `Successfully ${wasFollowing ? 'unfollowed' : 'followed'} ${companyName}!`,
            type: 'success'
          } 
        }));
      } else if (response.status === 404) {
        // Follow feature not implemented yet - show message but keep UI state
        window.dispatchEvent(new CustomEvent('zync:alert', { 
          detail: { 
            message: 'Company following feature is coming soon!',
            type: 'info'
          } 
        }));
      } else {
        // Revert UI changes on other errors
        setIsFollowing(wasFollowing);
        setFollowersCount(prevCount);
        window.dispatchEvent(new CustomEvent('zync:alert', { 
          detail: { 
            message: 'Failed to update follow status. Please try again.',
            type: 'error'
          } 
        }));
      }
    } catch (error) {
      console.error('Follow error:', error);
      // Revert UI changes on network errors
      setIsFollowing(wasFollowing);
      setFollowersCount(prevCount);
      window.dispatchEvent(new CustomEvent('zync:alert', { 
        detail: { 
          message: 'Network error. Please try again.',
          type: 'error'
        } 
      }));
    }
  };

  const deleteReview = async (reviewId: string) => {
    if (!window.confirm('Delete this review?')) return;
    try {
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewerEmail: user?.email }),
      });
      if (response.ok) setReviews(prev => prev.filter(r => (r._id || r.id) !== reviewId));
    } catch (error) {
      console.error('Error deleting review:', error);
    }
  };

  const submitReview = async () => {
    setReviewError('');
    if (!isCandidate) { setReviewError('Only candidates can submit reviews.'); return; }
    if (!reviewForm.title.trim() || !reviewForm.review.trim()) { setReviewError('Please fill in all fields.'); return; }
    if (reviewForm.review.trim().length > 1000) { setReviewError('Review must not exceed 1000 characters.'); return; }
    setSubmittingReview(true);
    try {
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: company?._id || company?.name,
          companyName: company?.name,
          rating: reviewForm.rating,
          title: reviewForm.title,
          review: reviewForm.review,
          reviewerName: user?.name || 'Anonymous',
          reviewerEmail: user?.email || 'anonymous@example.com',
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.status === 403) {
        setReviewError('This company has no job postings yet.');
      } else if (response.ok) {
        setReviewSuccess(true);
        setReviewForm({ rating: 5, title: '', review: '' });
        if (company) setReviews(await fetchCompanyReviews(company.name));
        setTimeout(() => { setShowReviewModal(false); setReviewSuccess(false); }, 1500);
      } else {
        const errMsg = data.error || '';
        if (errMsg.toLowerCase().includes('relation') || errMsg.toLowerCase().includes('does not exist') || response.status === 500) {
          setReviewError('Review service is temporarily unavailable. Please try again later.');
        } else {
          setReviewError(errMsg || 'Failed to submit review. Please try again.');
        }
      }
    } catch {
      setReviewError('Network error. Please check your connection and try again.');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />
        <div className="text-center py-12"><p className="text-gray-500">Company not found</p></div>
      </div>
    );
  }

  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />

      {/* Company Banner Background - Matching Companies Page */}
      <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden border-b border-gray-200">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 opacity-30" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100 rounded-full opacity-20 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-100 rounded-full opacity-20 blur-3xl" />
        
        {/* Back Button */}
        <div className="absolute top-6 left-6 z-30">
          <BackButton 
            fallback="/companies" 
            className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 shadow-sm hover:shadow-md transition-all duration-200" 
          />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-14 lg:py-20 relative z-10">
          <div className="flex flex-col lg:flex-row items-start gap-6 lg:gap-8">
            {/* Company Logo */}
            <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 bg-white rounded-2xl sm:rounded-3xl border border-gray-200 p-3 sm:p-4 flex-shrink-0 shadow-lg hover:shadow-xl transition-all duration-300 mx-auto lg:mx-0">
              <CompanyLogo 
                companyName={company.name}
                website={company.website || company.companyWebsite}
                storedLogo={company.logo}
                size={112}
                className="w-full h-full rounded-xl"
              />
            </div>
            
            {/* Company Info */}
            <div className="flex-1 min-w-0 text-center lg:text-left">
              <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-4 lg:gap-0">
                <div className="flex-1">
                  {/* Company Name */}
                  <div className="flex flex-col lg:flex-row items-center lg:items-center gap-2 lg:gap-4 mb-3">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-gray-900">
                      {company.name}
                    </h1>
                    {/* Verification Badge */}
                    {company.gstNumber && (
                      <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-green-50 border border-green-200 rounded-full">
                        <svg className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-green-600 font-semibold text-xs sm:text-sm">Verified Company</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Description */}
                  {company.tagline && (
                    <p className="text-base sm:text-lg text-gray-600 mb-4 sm:mb-6 font-medium leading-relaxed max-w-2xl mx-auto lg:mx-0">
                      {company.tagline}
                    </p>
                  )}
                  
                  {/* Rating & Followers Row */}
                  <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4 mb-4 sm:mb-6">
                    <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      {reviews.length > 0 ? (
                        <>
                          <span className="text-lg font-bold text-gray-900">{avgRating}</span>
                          <span className="text-gray-600 text-sm">({reviews.length} review{reviews.length !== 1 ? 's' : ''})</span>
                        </>
                      ) : (
                        <span className="text-gray-600 text-sm">0 reviews</span>
                      )}
                    </div>
                    {followersCount > 0 && (
                      <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span className="text-base font-semibold text-gray-900">
                          {followersCount >= 1000 ? `${Math.floor(followersCount / 1000)}K` : followersCount} followers
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span className="text-base font-semibold text-gray-900">Fast Response</span>
                    </div>
                  </div>
                  
                  {/* Tag Chips */}
                  <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 sm:gap-3 mb-4">
                    {company.industry && (
                      <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs sm:text-sm font-semibold">
                        {company.industry}
                      </span>
                    )}
                    {company.companyType && (
                      <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-xs sm:text-sm font-medium">
                        {company.companyType}
                      </span>
                    )}
                    {company.employees && (
                      <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-xs sm:text-sm font-medium">
                        {cleanEmployees(company.employees)} employees
                      </span>
                    )}
                    {company.foundedYear && (
                      <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-xs sm:text-sm font-medium">
                        Founded {company.foundedYear}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Follow Button */}
                {user && !isEmployer && (
                  <button
                    onClick={handleFollow}
                    className={`flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl border text-sm sm:text-base ${
                      isFollowing 
                        ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200' 
                        : 'bg-blue-600 text-white hover:bg-blue-700 border-blue-600 hover:scale-105'
                    }`}
                  >
                    <span className="text-base sm:text-lg">{isFollowing ? '✓' : '+'}</span>
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
        
      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 -mt-6 sm:-mt-8 lg:-mt-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          <div className="rounded-xl sm:rounded-2xl bg-white shadow-lg border border-gray-200 p-4 sm:p-6 text-center hover:shadow-xl hover:scale-105 transition-all duration-300">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">
              {company?.foundedYear || 'Not specified'}
            </div>
            <div className="text-xs sm:text-sm text-gray-600 font-medium">Founded</div>
          </div>
          <div className="rounded-xl sm:rounded-2xl bg-white shadow-lg border border-gray-200 p-4 sm:p-6 text-center hover:shadow-xl hover:scale-105 transition-all duration-300">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">
              {company?.employees ? cleanEmployees(company.employees) : 'Not specified'}
            </div>
            <div className="text-xs sm:text-sm text-gray-600 font-medium">Employees</div>
          </div>
          <div className="rounded-xl sm:rounded-2xl bg-white shadow-lg border border-gray-200 p-4 sm:p-6 text-center hover:shadow-xl hover:scale-105 transition-all duration-300">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">
              {jobs.length}
            </div>
            <div className="text-xs sm:text-sm text-gray-600 font-medium">Active Jobs</div>
          </div>
          <div className="rounded-xl sm:rounded-2xl bg-white shadow-lg border border-gray-200 p-4 sm:p-6 text-center hover:shadow-xl hover:scale-105 transition-all duration-300">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-1 sm:mb-2 truncate">
              {(company?.location || company?.headquarters) ? displayValue(company.location?.split(',')[0] || company.headquarters?.split(',')[0]) : 'Not specified'}
            </div>
            <div className="text-xs sm:text-sm text-gray-600 font-medium">Headquarters</div>
          </div>
        </div>
      </div>

      {/* Clean Navigation Tabs - Mobile Responsive */}
      <div className="border-b border-gray-200 mt-6 sm:mt-8 sticky top-0 z-40 backdrop-blur-lg bg-gray-50/80">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
          <nav className="flex justify-between sm:justify-start sm:gap-6 lg:gap-8 overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-3 sm:pb-4 border-b-2 font-semibold transition-all duration-300 whitespace-nowrap text-xs sm:text-sm lg:text-base px-2 sm:px-0 flex-1 sm:flex-none ${
                activeTab === 'overview'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-black'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('jobs')}
              className={`pb-3 sm:pb-4 border-b-2 font-semibold transition-all duration-300 whitespace-nowrap text-xs sm:text-sm lg:text-base px-2 sm:px-0 flex-1 sm:flex-none ${
                activeTab === 'jobs'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-black'
              }`}
            >
              <span className="hidden sm:inline">Jobs ({jobs.length})</span>
              <span className="sm:hidden">Jobs ({jobs.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`pb-3 sm:pb-4 border-b-2 font-semibold transition-all duration-300 whitespace-nowrap text-xs sm:text-sm lg:text-base px-2 sm:px-0 flex-1 sm:flex-none ${
                activeTab === 'reviews'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-black'
              }`}
            >
              <span className="hidden sm:inline">Reviews ({reviews.length})</span>
              <span className="sm:hidden">Reviews ({reviews.length})</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content - Seamless Integration */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'overview' ? (
          <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 sm:gap-8">
            {/* Left Content - 70% */}
            <div className="lg:col-span-7">
              {/* About Section - Rounded Top */}
              <div className="bg-white rounded-t-2xl border border-gray-100 p-6 sm:p-8 mb-6 shadow-sm hover:shadow-lg transition-all duration-300">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">About {company?.name}</h2>
                {company?.description && (
                  <>
                    <p className="text-gray-700 leading-relaxed mb-4 sm:mb-6 text-base sm:text-lg">
                      {showFullDesc ? company.description : (company.description.length > 300 ? company.description.substring(0, 300) + '...' : company.description)}
                    </p>
                    <button
                      onClick={() => setShowFullDesc(!showFullDesc)}
                      className="text-blue-600 hover:text-blue-700 font-semibold transition-colors text-sm sm:text-base"
                    >
                      {showFullDesc ? 'read less' : 'read more'}
                    </button>
                  </>
                )}
              </div>
              
            {/* Departments Hiring Section - Only show if real data exists */}
            {departments.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 mb-6 shadow-sm hover:shadow-lg transition-all duration-300">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Departments Hiring at {company?.name}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  {departments.map((dept, index) => (
                    <div key={index} className="p-4 sm:p-6 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-100 hover:shadow-md transition-all duration-300">
                      <h4 className="font-bold text-gray-900 mb-2 text-base sm:text-lg">{dept.department_name}</h4>
                      <p className="text-blue-600 font-semibold text-sm sm:text-base">{dept.job_openings} openings →</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Benefits Section - Enhanced with Icons */}
            {benefits.length > 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 mb-6 shadow-sm hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Benefits & Perks</h3>
                  <span className="text-xs sm:text-sm text-gray-500 bg-gray-100 px-2 sm:px-3 py-1 rounded-full">
                    {benefits.length} benefits
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                  {benefits.slice(0, 8).map((benefit, idx) => {
                    const iconMap: { [key: string]: JSX.Element } = {
                      'health_insurance': (
                        <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-3">
                          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        </div>
                      ),
                      'skill_training': (
                        <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-3">
                          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                      ),
                      'cafeteria': (
                        <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-3">
                          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                          </svg>
                        </div>
                      ),
                      'gym': (
                        <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-3">
                          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                      ),
                      'childcare': (
                        <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-3">
                          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                          </svg>
                        </div>
                      )
                    };
                    
                    return (
                      <div key={idx} className="text-center p-3 sm:p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all duration-300 border border-gray-100">
                        {iconMap[benefit.benefit_type] || iconMap['health_insurance']}
                        <p className="text-xs sm:text-sm font-semibold text-gray-900">{benefit.benefit_name}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : company?.benefits && company.benefits.length > 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 mb-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Benefits & Perks</h3>
                  <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full font-medium">
                    {company.benefits.length} benefits
                  </span>
                </div>

                {(() => {
                  const BenefitIcon = ({ name }: { name: string }) => {
                    const n = name.toLowerCase();
                    if (n.includes('health') || n.includes('medical') || n.includes('insurance'))
                      return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>;
                    if (n.includes('gym') || n.includes('fitness') || n.includes('wellness'))
                      return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>;
                    if (n.includes('remote') || n.includes('work from home') || n.includes('hybrid'))
                      return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
                    if (n.includes('flexible') || n.includes('time off') || n.includes('leave') || n.includes('hours'))
                      return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
                    if (n.includes('training') || n.includes('skill') || n.includes('learning') || n.includes('course') || n.includes('development') || n.includes('mentorship') || n.includes('certification'))
                      return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>;
                    if (n.includes('bonus') || n.includes('stock') || n.includes('esop') || n.includes('provident') || n.includes('gratuity') || n.includes('retirement') || n.includes('financial'))
                      return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
                    if (n.includes('meal') || n.includes('food') || n.includes('cafeteria') || n.includes('snack'))
                      return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
                    if (n.includes('transport') || n.includes('travel') || n.includes('parking'))
                      return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>;
                    if (n.includes('career') || n.includes('growth') || n.includes('advancement') || n.includes('innovation'))
                      return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>;
                    if (n.includes('child') || n.includes('maternity') || n.includes('paternity'))
                      return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
                    if (n.includes('mobile') || n.includes('phone') || n.includes('allowance'))
                      return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>;
                    if (n.includes('international') || n.includes('global') || n.includes('sabbatical'))
                      return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
                    if (n.includes('game') || n.includes('recreation') || n.includes('pet'))
                      return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
                    return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
                  };
                  const getBg = (name: string) => {
                    const n = name.toLowerCase();
                    if (n.includes('health')||n.includes('medical')||n.includes('insurance')) return 'bg-red-50 text-red-600';
                    if (n.includes('gym')||n.includes('fitness')||n.includes('wellness')) return 'bg-orange-50 text-orange-600';
                    if (n.includes('remote')||n.includes('work from home')||n.includes('hybrid')) return 'bg-green-50 text-green-600';
                    if (n.includes('flexible')||n.includes('time off')||n.includes('leave')||n.includes('hours')) return 'bg-blue-50 text-blue-600';
                    if (n.includes('training')||n.includes('skill')||n.includes('learning')||n.includes('course')||n.includes('development')||n.includes('mentorship')||n.includes('certification')) return 'bg-purple-50 text-purple-600';
                    if (n.includes('bonus')||n.includes('stock')||n.includes('esop')||n.includes('provident')||n.includes('gratuity')||n.includes('retirement')||n.includes('financial')) return 'bg-yellow-50 text-yellow-600';
                    if (n.includes('meal')||n.includes('food')||n.includes('cafeteria')||n.includes('snack')) return 'bg-amber-50 text-amber-600';
                    if (n.includes('transport')||n.includes('travel')||n.includes('parking')) return 'bg-indigo-50 text-indigo-600';
                    if (n.includes('career')||n.includes('growth')||n.includes('advancement')||n.includes('innovation')) return 'bg-teal-50 text-teal-600';
                    if (n.includes('child')||n.includes('maternity')||n.includes('paternity')) return 'bg-pink-50 text-pink-600';
                    return 'bg-gray-100 text-gray-600';
                  };
                  return (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {company.benefits.map((benefit, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50 hover:bg-white hover:shadow-sm transition-all duration-200">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${getBg(benefit)}`}>
                            <BenefitIcon name={benefit} />
                          </div>
                          <span className="text-xs sm:text-sm font-medium text-gray-800 leading-tight">{benefit}</span>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            ) : null}
            
            {/* Employee Salaries Section - Only show if real salary data exists */}
            {salaries.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Employee Salaries</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {salaries.slice(0, 2).map((salary, idx) => (
                    <div key={idx} className="p-4 border border-gray-200 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">{salary.job_title}</h4>
                      <p className="text-sm text-gray-600 mb-3">with {salary.experience_min}-{salary.experience_max} yrs experience ({salary.submission_count}) salaries</p>
                      <div className="relative">
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                          <div className="bg-blue-600 h-2 rounded-full" style={{width: '60%'}}></div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>₹{salary.salary_min} LPA</span>
                          <span>₹{salary.salary_max} LPA</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* More Information Section - Real Data */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {company?.companyType && (
                  <div>
                    <span className="text-sm font-medium text-gray-900">Type: </span>
                    <span className="text-sm text-gray-600">{company.companyType}</span>
                  </div>
                )}
                {company?.foundedYear && (
                  <div>
                    <span className="text-sm font-medium text-gray-900">Founded: </span>
                    <span className="text-sm text-gray-600">{company.foundedYear}</span>
                  </div>
                )}
                {company?.employees && (
                  <div>
                    <span className="text-sm font-medium text-gray-900">Company Size: </span>
                    <span className="text-sm text-gray-600">{company.employees}</span>
                  </div>
                )}
                {company?.industry && (
                  <div>
                    <span className="text-sm font-medium text-gray-900">Industry: </span>
                    <span className="text-sm text-gray-600">{company.industry}</span>
                  </div>
                )}
                {company?.website && (
                  <div>
                    <span className="text-sm font-medium text-gray-900">Website: </span>
                    <a href={normalizeSocialUrl(company.website, 'website') ?? '#'} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:text-blue-700">
                      {company.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}
                {company?.socialLinks?.linkedin && (
                  <div>
                    <span className="text-sm font-medium text-gray-900">LinkedIn: </span>
                    <a href={normalizeSocialUrl(company.socialLinks.linkedin, 'linkedin') ?? '#'} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm">LinkedIn</span>
                    </a>
                  </div>
                )}
                {company?.location && (
                  <div>
                    <span className="text-sm font-medium text-gray-900">Headquarters: </span>
                    <span className="text-sm text-gray-600">{company.location}</span>
                  </div>
                )}
                {company?.gstNumber && (
                  <div>
                    <span className="text-sm font-medium text-gray-900">GST: </span>
                    <span className="text-sm text-gray-600">{company.gstNumber}</span>
                  </div>
                )}
{company?.locations && company.locations.length > 0 && (
                  <div className="md:col-span-2">
                    <span className="text-sm font-medium text-gray-900">Other Locations: </span>
                    <span className="text-sm text-gray-600">{company.locations.join(', ')}</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Current Job Openings */}
            {jobs.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Job Openings at {company?.name}</h3>
                <div className="space-y-4">
                  {jobs.slice(0, 5).map((job, idx) => (
                    <div key={idx} className="p-4 border border-gray-200 rounded-lg hover:shadow-sm cursor-pointer">
                      <h4 className="font-medium text-gray-900 mb-2">{job.jobTitle}</h4>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {job.location}
                        </span>
                        {job.salary && (
                          <span className="flex items-center gap-1">
                            {formatSalary(job.salary)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {jobs.length > 0 && (
                  <div className="mt-4 text-center">
                    <button onClick={() => { setActiveTab('jobs'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="text-blue-600 hover:text-blue-700 font-medium">
                      View all {jobs.length} openings
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Right Sidebar - 30% Sticky */}
          <div className="lg:col-span-3">
            <div className="sticky top-24 space-y-6">
              {/* Company Quick Facts */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-lg transition-all duration-300">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Facts</h3>
                <div className="space-y-4">
                  {company?.industry && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-medium">Industry</span>
                      <span className="font-semibold text-gray-900">{company.industry}</span>
                    </div>
                  )}
                  {company?.employees && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-medium">Company Size</span>
                      <span className="font-semibold text-gray-900">{company.employees}</span>
                    </div>
                  )}
                  {company?.foundedYear && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-medium">Founded</span>
                      <span className="font-semibold text-gray-900">{company.foundedYear}</span>
                    </div>
                  )}
                  {company?.companyType && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-medium">Type</span>
                      <span className="font-semibold text-gray-900">{company.companyType}</span>
                    </div>
                  )}
                  {company?.website && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-medium">Website</span>
                      <a href={company?.website} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 hover:text-blue-700 truncate max-w-32">
                        {company?.website?.replace(/^https?:\/\//, '').split('/')[0]}
                      </a>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Hiring Urgency */}
              {jobs.length > 0 && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-100 p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Actively Hiring</h3>
                      <p className="text-sm text-gray-600">{jobs.length} open positions</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {jobs.slice(0, 3).map((job, idx) => (
                      <div key={idx} className="bg-white/70 rounded-xl p-3 border border-green-100">
                        <h4 className="font-semibold text-gray-900 text-sm mb-1">{job.jobTitle}</h4>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <MapPin className="w-3 h-3" />
                          <span>{job.location}</span>
                          {job.salary && (
                            <>
                              <span>•</span>
                              <span>{formatSalary(job.salary)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <button 
                    onClick={() => setActiveTab('jobs')}
                    className="w-full mt-4 py-2 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors"
                  >
                    View All Jobs
                  </button>
                </div>
              )}
              {/* Real Reviews Section - Only show if reviews exist */}
              {reviews.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Employee Reviews</h3>
                  
                  {/* Average Rating */}
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="w-5 h-5 text-yellow-400 fill-current" />
                      <span className="text-xl font-bold text-gray-900">{avgRating}</span>
                      <span className="text-gray-600">({reviews.length} reviews)</span>
                    </div>
                  </div>
                  
                  {/* Recent Reviews */}
                  <div className="space-y-3 mb-4">
                    {reviews.slice(0, 3).map((review, idx) => (
                      <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star key={star} className={`w-3 h-3 ${
                                star <= (review.rating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                              }`} />
                            ))}
                          </div>
                          <span className="text-xs text-gray-600">{review.reviewerName || 'Anonymous'}</span>
                        </div>
                        <p className="text-sm font-medium text-gray-900 mb-1">{review.title}</p>
                        <p className="text-xs text-gray-600 line-clamp-2">{review.review}</p>
                      </div>
                    ))}
                  </div>
                  
                  <button 
                    onClick={() => setShowReviewModal(true)}
                    className="w-full py-2 border border-blue-600 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-50"
                  >
                    Write a Review
                  </button>
                </div>
              )}
              
              {/* Job Openings Widget - Only show if jobs exist */}
              {jobs.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-orange-500 rounded text-white text-sm flex items-center justify-center font-bold">
                      {company?.name?.charAt(0) || 'C'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Hiring now</p>
                      <p className="text-lg font-bold text-gray-900">{jobs.length} job openings</p>
                    </div>
                  </div>
                  
                  {/* Job Listings */}
                  <div className="space-y-3 mb-4">
                    {jobs.slice(0, 2).map((job, idx) => (
                      <div key={idx} className="p-3 border border-gray-200 rounded-lg hover:shadow-sm cursor-pointer">
                        <h4 className="font-medium text-gray-900 text-sm mb-1">{job.jobTitle}</h4>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {job.location}
                          </span>
                          {job.salary && (
                            <span className="flex items-center gap-1">
                              {formatSalary(job.salary)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <button onClick={() => { setActiveTab('jobs'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="w-full py-2 border border-blue-600 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-50">
                    View all {jobs.length} openings
                  </button>
                </div>
              )}
              
              {/* Write Review Section - Always show for candidates */}
              {isCandidate && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Write a review & help millions!</p>
                    <p className="text-sm font-medium text-gray-900 mb-3">
                      Rate {company?.name} as a workplace
                    </p>
                    <button 
                      onClick={() => setShowReviewModal(true)}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Write review
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        ) : activeTab === 'jobs' ? (
          /* Jobs Tab Content */
          <div className="space-y-6">
            {/* Jobs Header */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div className="flex-1">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Job Openings at {company?.name}</h2>
                  <p className="text-gray-600 mt-1">{filteredJobs.length} positions available</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                  <AutocompleteCombobox
                    value={selectedLocation}
                    onChange={(val) => setSelectedLocation(val)}
                    options={[
                      { value: '', label: 'All Locations' },
                      ...jobLocations.map(location => ({ value: location, label: location })),
                    ]}
                    dataSource="locations"
                    placeholder="Select location"
                    className="w-full sm:w-auto"
                    maxOptions={jobLocations.length + 1}
                  />
                  <AutocompleteCombobox
                    value={selectedDepartment}
                    onChange={(val) => setSelectedDepartment(val)}
                    options={[
                      { value: '', label: 'All Departments' },
                      ...jobCategories.map(cat => ({ value: cat, label: cat })),
                    ]}
                    placeholder="Select department"
                    className="w-full sm:w-auto"
                    maxOptions={jobCategories.length + 1}
                  />
                  {(selectedLocation || selectedDepartment) && (
                    <button
                      onClick={() => { setSelectedLocation(''); setSelectedDepartment(''); }}
                      className="px-3 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            {/* Jobs List */}
            {filteredJobs.length > 0 ? (
              <div className="space-y-4">
                {filteredJobs.map((job, idx) => (
                  <div key={idx} className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">{job.jobTitle}</h3>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-600 mb-3">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{job.location}</span>
                          </span>
                          {job.salary && (
                            <span className="flex items-center gap-1">
                              <span className="truncate">{formatSalary(job.salary)}</span>
                            </span>
                          )}
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                            Actively Hiring
                          </span>
                        </div>
                        <p className="text-gray-700 text-sm leading-relaxed line-clamp-2">
                          {company?.description ? 
                            `Join our team at ${company?.name} and contribute to our mission in the ${company?.industry} industry.` :
                            `Exciting opportunity to work with ${company?.name} in ${company?.industry}. Apply now to be part of our growing team.`
                          }
                        </p>
                      </div>
                      <div className="flex flex-row lg:flex-col gap-2 lg:ml-6 w-full lg:w-auto">
                        {isEmployer ? (
                          <button
                            onClick={() => {
                              const jid = job._id || job.id;
                              if (!jid) return;
                              onNavigate && onNavigate('job-detail', { jobId: jid });
                            }}
                            className="flex-1 lg:flex-none px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm sm:text-base"
                          >
                            View Details
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                const jid = job._id || job.id;
                                if (!jid) return;
                                onNavigate && onNavigate('job-detail', { jobId: jid });
                              }}
                              className="flex-1 lg:flex-none px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm sm:text-base"
                            >
                              Apply Now
                            </button>
                            <button
                              onClick={() => {
                                const jid = job._id || job.id;
                                if (!jid) return;
                                savedJobIds.has(jid) ? unsaveJobGlobal(jid) : saveJobGlobal(jid, { ...job, company: job.company || company?.name });
                              }}
                              className={`flex-1 lg:flex-none px-4 sm:px-6 py-2 border rounded-lg font-medium transition-colors text-sm sm:text-base ${
                                savedJobIds.has(job._id || job.id || '')
                                  ? 'border-blue-300 bg-blue-50 text-blue-700'
                                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              {savedJobIds.has(job._id || job.id || '') ? '✓ Saved' : 'Save Job'}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {/* Job Tags */}
                    <div className="flex flex-wrap gap-2 mt-4">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                        Full-time
                      </span>
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                        {Math.floor(Math.random() * 5)}-{Math.floor(Math.random() * 3) + 3} years
                      </span>
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                        {company?.industry}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : jobs.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6M8 8v10l4-4 4 4V8" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Job Openings</h3>
                <p className="text-gray-600 mb-4">
                  {company?.name} doesn't have any active job postings at the moment.
                </p>
                <button 
                  onClick={handleFollow}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                >
                  Follow Company for Updates
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6M8 8v10l4-4 4 4V8" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Matching Jobs</h3>
                <p className="text-gray-600 mb-4">
                  No jobs match your current filters. Try adjusting your search criteria.
                </p>
                <button
                  onClick={() => { setSelectedLocation(''); setSelectedDepartment(''); }}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Reviews Tab Content */
          <div className="space-y-6">
            {/* Reviews Header */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Employee Reviews for {company?.name}</h2>
                  <p className="text-gray-600 mt-1">{reviews.length} reviews from employees</p>
                </div>
                {isCandidate && (
                  <button 
                    onClick={() => setShowReviewModal(true)}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Write a Review
                  </button>
                )}
              </div>
              
              {/* Overall Rating */}
              {reviews.length > 0 && (
                <div className="flex items-center gap-6 p-4 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900 mb-1">{avgRating}</div>
                    <div className="flex items-center justify-center mb-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className={`w-4 h-4 ${
                          star <= parseFloat(avgRating || '0') ? 'text-yellow-400 fill-current' : 'text-gray-300'
                        }`} />
                      ))}
                    </div>
                    <div className="text-sm text-gray-600">{reviews.length} reviews</div>
                  </div>
                  
                  {/* Rating Breakdown */}
                  <div className="flex-1">
                    {[5, 4, 3, 2, 1].map((rating) => {
                      const count = reviews.filter(r => Math.floor(r.rating || 0) === rating).length;
                      const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                      return (
                        <div key={rating} className="flex items-center gap-3 mb-2">
                          <span className="text-sm font-medium w-8">{rating} ★</span>
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-yellow-400 h-2 rounded-full transition-all duration-300" 
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600 w-8">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            
            {/* Reviews List */}
            {reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((review, idx) => (
                  <div key={idx} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star key={star} className={`w-4 h-4 ${
                                star <= (review.rating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                              }`} />
                            ))}
                          </div>
                          <span className="text-sm font-medium text-gray-900">{review.rating}/5</span>
                          <span className="text-sm text-gray-500">•</span>
                          <span className="text-sm text-gray-500">
                            {new Date(review.createdAt || Date.now()).toLocaleDateString()}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{review.title}</h3>
                        <p className="text-gray-700 leading-relaxed mb-3">{review.review}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span>By {review.reviewerName || 'Anonymous'}</span>
                          {review.reviewerEmail === user?.email && (
                            <>
                              <span>•</span>
                              <button 
                                onClick={() => deleteReview(review._id || review.id)}
                                className="text-red-600 hover:text-red-700 font-medium"
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Review Actions */}
                    <div className="flex items-center gap-4 pt-3 border-t border-gray-100">
                      <button className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                        </svg>
                        Helpful
                      </button>
                      <button className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                        </svg>
                        Share
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Reviews Yet</h3>
                <p className="text-gray-600 mb-4">
                  Be the first to share your experience working at {company?.name}.
                </p>
                {isCandidate ? (
                  <button 
                    onClick={() => setShowReviewModal(true)}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                  >
                    Write the First Review
                  </button>
                ) : (
                  <p className="text-sm text-gray-500">
                    Login as a candidate to write a review
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 md:p-8">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold">Write a Review</h2>
              <button 
                onClick={() => { setShowReviewModal(false); setReviewError(''); setReviewSuccess(false); }} 
                className="text-gray-500 hover:text-gray-700 p-1"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
            {!user ? (
              <div className="text-center py-6">
                <p className="text-gray-600 mb-4 text-sm sm:text-base">Please login as a candidate to write a review.</p>
                <button 
                  onClick={() => { setShowReviewModal(false); onNavigate && onNavigate('login'); }} 
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 text-sm sm:text-base"
                >
                  Login
                </button>
              </div>
            ) : !isCandidate ? (
              <div className="text-center py-6">
                <p className="text-red-600 font-medium mb-2 text-sm sm:text-base">Access Restricted</p>
                <p className="text-gray-500 text-xs sm:text-sm">Only candidates can submit company reviews.</p>
              </div>
            ) : (
              <>
                {reviewError && (
                  <div className="mb-4 px-3 sm:px-4 py-2 sm:py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs sm:text-sm">
                    {reviewError}
                  </div>
                )}
                {reviewSuccess && (
                  <div className="mb-4 px-3 sm:px-4 py-2 sm:py-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-xs sm:text-sm font-medium">
                    ✓ Review submitted successfully!
                  </div>
                )}
                <div className="mb-3 px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg text-xs sm:text-sm text-blue-700">
                  Reviewing as <strong>{user.name || user.email}</strong>
                </div>
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Rating</label>
                    <div className="flex gap-1 sm:gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button 
                          key={star} 
                          onClick={() => setReviewForm({ ...reviewForm, rating: star })} 
                          className="focus:outline-none p-1"
                        >
                          <Star className={`w-6 h-6 sm:w-8 sm:h-8 ${
                            star <= reviewForm.rating 
                              ? 'fill-yellow-400 text-yellow-400' 
                              : 'text-gray-300'
                          }`} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Title</label>
                    <input 
                      type="text" 
                      value={reviewForm.title} 
                      onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })} 
                      placeholder="Summary of your review" 
                      className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Review</label>
                    <textarea
                      value={reviewForm.review}
                      onChange={(e) => setReviewForm({ ...reviewForm, review: e.target.value })}
                      placeholder="Share your experience..."
                      rows={4}
                      maxLength={1000}
                      className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base resize-none"
                    />
                    <div className="flex justify-between text-xs mt-1">
                      <span />
                      <span className={reviewForm.review.length >= 950 ? 'text-orange-500' : 'text-gray-400'}>
                        {reviewForm.review.length}/1000
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2 sm:pt-4">
                    <button 
                      onClick={submitReview} 
                      disabled={submittingReview} 
                      className="w-full sm:flex-1 bg-blue-600 text-white px-4 sm:px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 text-sm sm:text-base"
                    >
                      {submittingReview ? 'Submitting...' : 'Submit Review'}
                    </button>
                    <button 
                      onClick={() => { setShowReviewModal(false); setReviewError(''); setReviewSuccess(false); }} 
                      className="w-full sm:flex-1 bg-gray-300 text-gray-700 px-4 sm:px-6 py-2 rounded-lg font-medium hover:bg-gray-400 text-sm sm:text-base"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <Footer onNavigate={onNavigate} user={user} />
    </div>
  );
};

export default CompanyDetailsPage;
