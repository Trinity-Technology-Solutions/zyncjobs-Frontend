import React, { useState, useEffect } from 'react';
import { Star, MapPin, IndianRupee, X } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BackButton from '../components/BackButton';
import { API_ENDPOINTS } from '../config/env';
import { getCompanyLogo } from '../utils/logoUtils';

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

interface Job {
  _id: string;
  id?: string;
  jobTitle: string;
  location: string;
  salary?: any;
}

const formatSalary = (salary: any): string => {
  if (!salary) return '';
  if (typeof salary === 'string') return salary;
  if (typeof salary === 'object') {
    const { min, max } = salary;
    if (min && max) return `₹${Number(min).toLocaleString('en-IN')} - ₹${Number(max).toLocaleString('en-IN')}`;
    if (min) return `₹${Number(min).toLocaleString('en-IN')}+`;
    if (max) return `Up to ₹${Number(max).toLocaleString('en-IN')}`;
  }
  return '';
};

const CompanyDetailsPage = ({ onNavigate, user, onLogout }: {
  onNavigate?: (page: string) => void;
  user?: any;
  onLogout?: () => void;
  companyId?: string;
}): JSX.Element => {
  const [company, setCompany] = useState<Company | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', review: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);

  const isCandidate = user?.role === 'candidate' || user?.userType === 'candidate' || user?.type === 'candidate';
  const isEmployer = user?.role === 'employer' || user?.userType === 'employer' || user?.type === 'employer';

  useEffect(() => {
    const savedCompany = localStorage.getItem('selectedCompany');
    if (!savedCompany || !user?.email) return;
    try {
      const companyData = JSON.parse(savedCompany);
      const id = encodeURIComponent(companyData.name || companyData._id);
      fetch(`${API_ENDPOINTS.BASE_URL}/companies/${id}/follow-status?userEmail=${encodeURIComponent(user.email)}`)
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data) { setIsFollowing(data.isFollowing || false); setFollowersCount(data.followersCount || 0); }
        })
        .catch(() => {});
    } catch {}
  }, [user]);

  useEffect(() => {
    const loadCompanyData = async () => {
      const savedCompany = localStorage.getItem('selectedCompany');
      if (savedCompany) {
        try {
          const companyData = JSON.parse(savedCompany);
          setCompany(companyData);
          await fetchCompanyJobs(companyData.name);
          const companyReviews = await fetchCompanyReviews(companyData.name);
          setReviews(companyReviews);
          if (user?.email) {
            const id = encodeURIComponent(companyData.name);
            fetch(`${API_ENDPOINTS.BASE_URL}/companies/${id}/follow-status?userEmail=${encodeURIComponent(user.email)}`)
              .then(r => r.ok ? r.json() : null)
              .then(data => { if (data) { setIsFollowing(data.isFollowing || false); setFollowersCount(data.followersCount || 0); } })
              .catch(() => {});
          }
        } catch (error) {
          console.error('Error parsing company data:', error);
        }
      }
      setLoading(false);
    };
    loadCompanyData();
  }, []);

  const fetchCompanyJobs = async (companyName: string) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/jobs?limit=1000`);
      if (response.ok) {
        const allJobs = await response.json();
        const jobsArray = Array.isArray(allJobs) ? allJobs : [];
        const companyJobs = jobsArray
          .filter((job: any) => (job.company || job.companyName)?.toLowerCase() === companyName.toLowerCase())
          .map((job: any) => ({
            _id: job._id || job.id,
            id: job.id || job._id,
            jobTitle: job.jobTitle || job.title,
            location: job.location,
            salary: job.salary,
          }));
        setJobs(companyJobs);
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
    const id = encodeURIComponent(company?.name || company?._id || '');
    if (!id) return;
    const wasFollowing = isFollowing;
    const prevCount = followersCount;
    const action = wasFollowing ? 'unfollow' : 'follow';
    setIsFollowing(!wasFollowing);
    setFollowersCount(wasFollowing ? Math.max(0, prevCount - 1) : prevCount + 1);
    try {
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/companies/${id}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: user.email, userName: user.name }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.followersCount !== undefined) setFollowersCount(data.followersCount);
      } else {
        setIsFollowing(wasFollowing);
        setFollowersCount(prevCount);
        window.dispatchEvent(new CustomEvent('zync:alert', { detail: { message: 'Failed to update follow status. Please try again.' } }));
      }
    } catch {
      setIsFollowing(wasFollowing);
      setFollowersCount(prevCount);
      window.dispatchEvent(new CustomEvent('zync:alert', { detail: { message: 'Network error. Please try again.' } }));
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

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'reviews', label: 'Reviews', count: reviews.length },
    { id: 'jobs', label: 'Jobs', count: jobs.length },
    { id: 'salaries', label: 'Salaries' },
    { id: 'benefits', label: 'Benefits' },
  ];

  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />

      {/* Company Header Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 py-6 sm:py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <BackButton 
            onClick={() => onNavigate && onNavigate('companies')} 
            text="Back to Companies" 
            className="text-white mb-4 sm:mb-6 hover:text-gray-200" 
          />
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
            <img 
              src={getCompanyLogo(company.name) || company.logo} 
              alt={company.name} 
              className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-lg sm:rounded-xl bg-white p-2 sm:p-3 border-2 sm:border-4 border-white object-contain flex-shrink-0 mx-auto sm:mx-0" 
            />
            <div className="flex-1 text-white min-w-0 text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 break-words">{company.name}</h1>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-3">
                <div className="flex items-center justify-center sm:justify-start gap-1">
                  <Star className="w-4 h-4 sm:w-5 sm:h-5 fill-yellow-300 text-yellow-300" />
                  <span className="font-semibold text-sm sm:text-base">{avgRating ?? '—'}</span>
                  <span className="text-blue-200 text-xs sm:text-sm ml-1">({reviews.length} review{reviews.length !== 1 ? 's' : ''})</span>
                </div>
                <span className="hidden sm:inline">•</span>
                <span className="text-sm sm:text-base text-center">{company.industry}</span>
                <span className="hidden sm:inline">•</span>
                <span className="text-sm sm:text-base text-center">{company.employees} employees</span>
              </div>
              <p className="text-blue-100 mb-4 text-sm sm:text-base leading-relaxed">{company.description}</p>
              <div className="flex flex-col sm:flex-row gap-3 items-center">
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                  {isCandidate && (
                    <button 
                      onClick={() => setShowReviewModal(true)} 
                      className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 text-sm sm:text-base"
                    >
                      Add a review
                    </button>
                  )}
                  {!user && (
                    <button 
                      onClick={() => onNavigate && onNavigate('login')} 
                      className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 text-sm sm:text-base"
                    >
                      Login to review
                    </button>
                  )}
                  {user && !isEmployer && (
                    <button
                      onClick={handleFollow}
                      className={`w-full sm:w-auto px-4 sm:px-6 py-2 rounded-lg font-semibold border transition-colors text-sm sm:text-base ${
                        isFollowing 
                          ? 'bg-white text-blue-600 border-white hover:bg-gray-100' 
                          : 'bg-blue-700 text-white border-white hover:bg-blue-800'
                      }`}
                    >
                      {isFollowing ? '✓ Following' : 'Follow'}
                    </button>
                  )}
                </div>
                <span className="text-blue-100 text-xs sm:text-sm">
                  {followersCount} follower{followersCount !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-4 sm:gap-6 md:gap-8 overflow-x-auto scrollbar-hide">
            <style jsx>{`
              .scrollbar-hide {
                -ms-overflow-style: none;
                scrollbar-width: none;
              }
              .scrollbar-hide::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 sm:py-4 px-2 sm:px-3 font-medium border-b-2 transition-colors whitespace-nowrap text-sm sm:text-base ${
                  activeTab === tab.id 
                    ? 'border-blue-600 text-blue-600' 
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span className="ml-1 sm:ml-2 text-xs sm:text-sm">({tab.count})</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="w-full">
          <div className="w-full max-w-none">

            {activeTab === 'overview' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 md:p-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">About {company.name}</h2>
                <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                  {company.description || 'No description available.'}
                </p>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 md:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                    Company Reviews{' '}
                    <span className="text-base sm:text-lg font-normal text-gray-500">({reviews.length})</span>
                  </h2>
                  {isCandidate && (
                    <button 
                      onClick={() => setShowReviewModal(true)} 
                      className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 text-sm"
                    >
                      + Write a Review
                    </button>
                  )}
                </div>
                {reviews.length > 0 ? (
                  <div className="space-y-3 sm:space-y-4">
                    {reviews.map((review, idx) => {
                      const reviewId = review._id || review.id;
                      const isOwner = user?.email && review.reviewerEmail === user.email;
                      return (
                        <div key={reviewId || idx} className="border border-gray-100 rounded-lg p-3 sm:p-4 bg-gray-50">
                          <div className="flex items-start justify-between mb-2 gap-2">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
                                {(review.reviewerName || 'A').charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className="font-semibold text-gray-900 text-sm block truncate">
                                  {review.reviewerName || 'Anonymous'}
                                </span>
                                <div className="flex items-center gap-1 mt-0.5">
                                  {[...Array(5)].map((_, i) => (
                                    <Star 
                                      key={i} 
                                      className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${
                                        i < review.rating 
                                          ? 'fill-yellow-400 text-yellow-400' 
                                          : 'text-gray-300'
                                      }`} 
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-2 flex-shrink-0">
                              <span className="text-xs text-gray-400 whitespace-nowrap">
                                {new Date(review.createdAt).toLocaleDateString()}
                              </span>
                              {isOwner && (
                                <button 
                                  onClick={() => deleteReview(reviewId)} 
                                  className="text-red-400 hover:text-red-600 text-xs border border-red-200 px-2 py-0.5 rounded hover:bg-red-50 whitespace-nowrap"
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          </div>
                          <p className="font-medium text-gray-800 text-sm mb-1">{review.title}</p>
                          <p className="text-gray-600 text-sm leading-relaxed">{review.review}</p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6 sm:py-8">
                    <p className="text-gray-500 mb-3 text-sm sm:text-base">No reviews yet. Be the first to review!</p>
                    {isCandidate && (
                      <button 
                        onClick={() => setShowReviewModal(true)} 
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 text-sm"
                      >
                        Write a Review
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'jobs' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 md:p-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Open Positions</h2>
                {jobs.length > 0 ? (
                  <div className="space-y-3 sm:space-y-4">
                    {jobs.map((job) => (
                      <div
                        key={job._id}
                        className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => {
                          const jobId = job._id || job.id;
                          if (jobId) {
                            localStorage.setItem('selectedJob', JSON.stringify(job));
                            onNavigate && onNavigate(`job-detail/${jobId}`);
                          }
                        }}
                      >
                        <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base break-words">
                          {job.jobTitle}
                        </h3>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span className="truncate">{job.location}</span>
                          </span>
                          {formatSalary(job.salary) && (
                            <span className="flex items-center gap-1">
                              <IndianRupee className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                              <span className="truncate">{formatSalary(job.salary)}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 text-center py-6 sm:py-8 text-sm sm:text-base">
                    No open positions
                  </p>
                )}
              </div>
            )}

            {activeTab === 'salaries' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 md:p-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
                  Salaries at {company.name}
                </h2>
                {jobs.length > 0 ? (
                  <div className="space-y-3 sm:space-y-4">
                    {jobs.map((job) => (
                      <div key={job._id} className="border border-gray-200 rounded-lg p-3 sm:p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <h3 className="font-semibold text-gray-900 text-sm sm:text-base break-words flex-1">
                            {job.jobTitle}
                          </h3>
                          <span className="flex items-center gap-1 text-green-600 font-medium text-sm sm:text-base flex-shrink-0">
                            <IndianRupee className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span>{formatSalary(job.salary) || 'Not disclosed'}</span>
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{job.location}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 text-center py-6 sm:py-8 text-sm sm:text-base">
                    No salary data available
                  </p>
                )}
              </div>
            )}

            {activeTab === 'benefits' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 md:p-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
                  Benefits & Perks at {company.name}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {[
                    { icon: '🏥', title: 'Health Insurance', desc: 'Comprehensive medical, dental & vision coverage' },
                    { icon: '🏖️', title: 'Paid Time Off', desc: 'Generous vacation, sick leave & holidays' },
                    { icon: '📈', title: 'Performance Bonus', desc: 'Annual performance-based incentives' },
                    { icon: '🎓', title: 'Learning & Development', desc: 'Training programs and certification support' },
                    { icon: '🏠', title: 'Remote / Flexible Work', desc: 'Hybrid and remote work options available' },
                    { icon: '🍽️', title: 'Meal Benefits', desc: 'Subsidised meals or food allowance' },
                  ].map((benefit, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-3 sm:p-4 flex items-start gap-3">
                      <span className="text-xl sm:text-2xl flex-shrink-0">{benefit.icon}</span>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-gray-900 text-sm break-words">{benefit.title}</h3>
                        <p className="text-gray-500 text-xs mt-1 leading-relaxed">{benefit.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
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
