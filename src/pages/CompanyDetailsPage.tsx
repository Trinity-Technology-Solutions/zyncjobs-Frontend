import React, { useState, useEffect } from 'react';
import { Star, MapPin, IndianRupee, X } from 'lucide-react';
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
}) => {
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
    // Optimistic update
    const newFollowing = !isFollowing;
    const newCount = newFollowing ? followersCount + 1 : Math.max(0, followersCount - 1);
    setIsFollowing(newFollowing);
    setFollowersCount(newCount);
    const action = newFollowing ? 'follow' : 'unfollow';
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
        setFollowersCount(data.followersCount ?? newCount);
      } else {
        // Revert on failure
        setIsFollowing(!newFollowing);
        setFollowersCount(followersCount);
      }
    } catch {
      setIsFollowing(!newFollowing);
      setFollowersCount(followersCount);
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
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <BackButton onClick={() => onNavigate && onNavigate('companies')} text="Back to Companies" className="text-white mb-6 hover:text-gray-200" />
          <div className="flex items-start gap-6">
            <img src={company.logo} alt={company.name} className="w-24 h-24 rounded-lg bg-white p-2 border-4 border-white" />
            <div className="flex-1 text-white">
              <h1 className="text-4xl font-bold mb-2">{company.name}</h1>
              <div className="flex items-center gap-4 mb-3">
                <div className="flex items-center gap-1">
                  <Star className="w-5 h-5 fill-yellow-300 text-yellow-300" />
                  <span className="font-semibold">{avgRating ?? '—'}</span>
                  <span className="text-blue-200 text-sm ml-1">({reviews.length} review{reviews.length !== 1 ? 's' : ''})</span>
                </div>
                <span>•</span>
                <span>{company.industry}</span>
                <span>•</span>
                <span>{company.employees} employees</span>
              </div>
              <p className="text-blue-100 mb-4">{company.description}</p>
              <div className="flex gap-3 items-center">
                {isCandidate && (
                  <button onClick={() => setShowReviewModal(true)} className="px-6 py-2 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100">
                    Add a review
                  </button>
                )}
                {!user && (
                  <button onClick={() => onNavigate && onNavigate('login')} className="px-6 py-2 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100">
                    Login to review
                  </button>
                )}
                {user && !isEmployer && (
                  <button
                    onClick={handleFollow}
                    className={`px-6 py-2 rounded-lg font-semibold border transition-colors ${isFollowing ? 'bg-white text-blue-600 border-white hover:bg-gray-100' : 'bg-blue-700 text-white border-white hover:bg-blue-800'}`}
                  >
                    {isFollowing ? '✓ Following' : 'Follow'}
                  </button>
                )}
                <span className="text-blue-100 text-sm">{followersCount} follower{followersCount !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-2 font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-900'}`}
              >
                {tab.label}
                {tab.count !== undefined && <span className="ml-2 text-sm">({tab.count})</span>}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          <div className="flex-1">

            {activeTab === 'overview' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">About {company.name}</h2>
                <p className="text-gray-600">{company.description || 'No description available.'}</p>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Company Reviews <span className="text-lg font-normal text-gray-500">({reviews.length})</span>
                  </h2>
                  {isCandidate && (
                    <button onClick={() => setShowReviewModal(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 text-sm">
                      + Write a Review
                    </button>
                  )}
                </div>
                {reviews.length > 0 ? (
                  <div className="space-y-4">
                    {reviews.map((review, idx) => {
                      const reviewId = review._id || review.id;
                      const isOwner = user?.email && review.reviewerEmail === user.email;
                      return (
                        <div key={reviewId || idx} className="border border-gray-100 rounded-lg p-4 bg-gray-50">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
                                {(review.reviewerName || 'A').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <span className="font-semibold text-gray-900 text-sm">{review.reviewerName || 'Anonymous'}</span>
                                <div className="flex items-center gap-1 mt-0.5">
                                  {[...Array(5)].map((_, i) => (
                                    <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                                  ))}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</span>
                              {isOwner && (
                                <button onClick={() => deleteReview(reviewId)} className="text-red-400 hover:text-red-600 text-xs border border-red-200 px-2 py-0.5 rounded hover:bg-red-50">
                                  Delete
                                </button>
                              )}
                            </div>
                          </div>
                          <p className="font-medium text-gray-800 text-sm mb-1">{review.title}</p>
                          <p className="text-gray-600 text-sm">{review.review}</p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-3">No reviews yet. Be the first to review!</p>
                    {isCandidate && (
                      <button onClick={() => setShowReviewModal(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 text-sm">
                        Write a Review
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'jobs' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Open Positions</h2>
                {jobs.length > 0 ? (
                  <div className="space-y-4">
                    {jobs.map((job) => (
                      <div
                        key={job._id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => {
                          const jobId = job._id || job.id;
                          if (jobId) {
                            localStorage.setItem('selectedJob', JSON.stringify(job));
                            onNavigate && onNavigate(`job-detail/${jobId}`);
                          }
                        }}
                      >
                        <h3 className="font-semibold text-gray-900 mb-2">{job.jobTitle}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{job.location}</span>
                          {formatSalary(job.salary) && (
                            <span className="flex items-center gap-1"><IndianRupee className="w-4 h-4" />{formatSalary(job.salary)}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">No open positions</p>
                )}
              </div>
            )}

{activeTab === 'salaries' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Salaries at {company.name}</h2>
                {jobs.length > 0 ? (
                  <div className="space-y-4">
                    {jobs.map((job) => (
                      <div key={job._id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-gray-900">{job.jobTitle}</h3>
                          <span className="flex items-center gap-1 text-green-600 font-medium">
                            <IndianRupee className="w-4 h-4" />{formatSalary(job.salary) || 'Not disclosed'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1 flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">No salary data available</p>
                )}
              </div>
            )}

            {activeTab === 'benefits' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Benefits & Perks at {company.name}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { icon: '🏥', title: 'Health Insurance', desc: 'Comprehensive medical, dental & vision coverage' },
                    { icon: '🏖️', title: 'Paid Time Off', desc: 'Generous vacation, sick leave & holidays' },
                    { icon: '📈', title: 'Performance Bonus', desc: 'Annual performance-based incentives' },
                    { icon: '🎓', title: 'Learning & Development', desc: 'Training programs and certification support' },
                    { icon: '🏠', title: 'Remote / Flexible Work', desc: 'Hybrid and remote work options available' },
                    { icon: '🍽️', title: 'Meal Benefits', desc: 'Subsidised meals or food allowance' },
                  ].map((benefit, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-4 flex items-start gap-3">
                      <span className="text-2xl">{benefit.icon}</span>
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm">{benefit.title}</h3>
                        <p className="text-gray-500 text-xs mt-1">{benefit.desc}</p>
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
          <div className="bg-white rounded-lg max-w-2xl w-full p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Write a Review</h2>
              <button onClick={() => { setShowReviewModal(false); setReviewError(''); setReviewSuccess(false); }} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            {!user ? (
              <div className="text-center py-6">
                <p className="text-gray-600 mb-4">Please login as a candidate to write a review.</p>
                <button onClick={() => { setShowReviewModal(false); onNavigate && onNavigate('login'); }} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700">Login</button>
              </div>
            ) : !isCandidate ? (
              <div className="text-center py-6">
                <p className="text-red-600 font-medium mb-2">Access Restricted</p>
                <p className="text-gray-500 text-sm">Only candidates can submit company reviews.</p>
              </div>
            ) : (
              <>
                {reviewError && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{reviewError}</div>}
                {reviewSuccess && <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm font-medium">✓ Review submitted successfully!</div>}
                <div className="mb-3 px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-700">
                  Reviewing as <strong>{user.name || user.email}</strong>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button key={star} onClick={() => setReviewForm({ ...reviewForm, rating: star })} className="focus:outline-none">
                          <Star className={`w-8 h-8 ${star <= reviewForm.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                    <input type="text" value={reviewForm.title} onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })} placeholder="Summary of your review" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Review</label>
                    <textarea
                      value={reviewForm.review}
                      onChange={(e) => setReviewForm({ ...reviewForm, review: e.target.value })}
                      placeholder="Share your experience..."
                      rows={5}
                      maxLength={1000}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <div className="flex justify-between text-xs mt-1">
                      <span />
                      <span className={reviewForm.review.length >= 950 ? 'text-orange-500' : 'text-gray-400'}>
                        {reviewForm.review.length}/1000
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button onClick={submitReview} disabled={submittingReview} className="flex-1 bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">
                      {submittingReview ? 'Submitting...' : 'Submit Review'}
                    </button>
                    <button onClick={() => { setShowReviewModal(false); setReviewError(''); setReviewSuccess(false); }} className="flex-1 bg-gray-300 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-400">
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
