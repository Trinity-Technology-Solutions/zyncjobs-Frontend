import React, { useState, useEffect } from 'react';
import { Star, MapPin, Briefcase, Users, DollarSign, MessageSquare, Gift, ChevronRight, Facebook, Instagram, Linkedin, Youtube, X } from 'lucide-react';
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
  reviews?: number;
  salaries?: number;
  officeLocations?: number;
}

interface Job {
  _id: string;
  jobTitle: string;
  location: string;
  salary?: string;
}

const CompanyDetailsPage = ({ onNavigate, user, onLogout, companyId }: { 
  onNavigate?: (page: string) => void;
  user?: any;
  onLogout?: () => void;
  companyId?: string;
}) => {
  const [company, setCompany] = useState<Company | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [officeLocations, setOfficeLocations] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    title: '',
    review: ''
  });
  const [submittingReview, setSubmittingReview] = useState(false);

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
          const locations = await fetchCompanyOfficeLocations(companyData.name);
          setOfficeLocations(locations);
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
        
        const companyJobs = jobsArray.filter((job: any) => 
          (job.company || job.companyName)?.toLowerCase() === companyName.toLowerCase()
        ).map((job: any) => ({
          _id: job._id,
          jobTitle: job.jobTitle,
          location: job.location,
          salary: job.salary
        }));
        
        setJobs(companyJobs.length > 0 ? companyJobs : []);
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
        const reviewsArray = Array.isArray(data.reviews) ? data.reviews : Array.isArray(data) ? data : [];
        return reviewsArray;
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
    return [];
  };

  const fetchCompanyOfficeLocations = async (companyName: string) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/jobs?limit=1000`);
      if (response.ok) {
        const allJobs = await response.json();
        const jobsArray = Array.isArray(allJobs) ? allJobs : [];
        
        const locations = new Set<string>();
        jobsArray.forEach((job: any) => {
          if ((job.company || job.companyName)?.toLowerCase() === companyName.toLowerCase() && job.location) {
            locations.add(job.location);
          }
        });
        
        return Array.from(locations).map((location, idx) => ({
          city: location.split(',')[0] || location,
          country: 'India',
          rating: (Math.random() * 0.5 + 4.0).toFixed(1),
          address: `${location}, India`
        }));
      }
    } catch (error) {
      console.error('Error fetching office locations:', error);
    }
    return [];
  };

  const submitReview = async () => {
    if (!reviewForm.title.trim() || !reviewForm.review.trim()) {
      alert('Please fill in all fields');
      return;
    }

    setSubmittingReview(true);
    try {
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: company?._id,
          companyName: company?.name,
          rating: reviewForm.rating,
          title: reviewForm.title,
          review: reviewForm.review,
          reviewerName: user?.name || 'Anonymous',
          reviewerEmail: user?.email || 'anonymous@example.com'
        })
      });

      if (response.status === 403) {
        alert('Company must post jobs before accepting reviews');
      } else if (response.ok) {
        alert('Review submitted successfully!');
        setShowReviewModal(false);
        setReviewForm({ rating: 5, title: '', review: '' });
        if (company) {
          const companyReviews = await fetchCompanyReviews(company.name);
          setReviews(companyReviews);
        }
      } else {
        alert('Error submitting review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Error submitting review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />
        <div className="text-center py-12">
          <p className="text-gray-500">Company not found</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📋' },
    { id: 'reviews', label: 'Reviews', count: reviews.length },
    { id: 'jobs', label: 'Jobs', count: jobs.length },
    { id: 'salaries', label: 'Salaries', icon: '💰' },
    { id: 'interviews', label: 'Interviews', icon: '🎤' },
    { id: 'benefits', label: 'Benefits', icon: '🎁' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />
      
      {/* Company Header Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <BackButton 
            onClick={() => onNavigate && onNavigate('companies')}
            text="Back to Companies"
            className="text-white mb-6 hover:text-gray-200"
          />
          <div className="flex items-start gap-6">
            <img 
              src={company.logo} 
              alt={company.name}
              className="w-24 h-24 rounded-lg bg-white p-2 border-4 border-white"
            />
            <div className="flex-1 text-white">
              <h1 className="text-4xl font-bold mb-2">{company.name}</h1>
              <div className="flex items-center gap-4 mb-3">
                <div className="flex items-center gap-1">
                  <Star className="w-5 h-5 fill-yellow-300 text-yellow-300" />
                  <span className="font-semibold">{company.rating}</span>
                </div>
                <span>•</span>
                <span>{company.industry}</span>
                <span>•</span>
                <span>{company.employees} employees</span>
              </div>
              <p className="text-blue-100 mb-4">{company.description}</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowReviewModal(true)}
                  className="px-6 py-2 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100"
                >
                  Add a review
                </button>
                <button className="px-6 py-2 bg-blue-700 text-white rounded-lg font-semibold hover:bg-blue-800 border border-white">
                  Follow
                </button>
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
                className={`py-4 px-2 font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
                {tab.count && <span className="ml-2 text-sm">({tab.count})</span>}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Left Content */}
          <div className="flex-1">
            {activeTab === 'reviews' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Company Reviews</h2>
                {reviews.length > 0 ? (
                  <div className="space-y-4">
                    {reviews.map((review, idx) => (
                      <div key={idx} className="border-b border-gray-200 pb-4 last:border-b-0">
                        <div className="flex items-center gap-2 mb-2">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                          ))}
                          <span className="font-semibold text-gray-900">{review.title}</span>
                        </div>
                        <p className="text-gray-600 text-sm mb-2">{review.review}</p>
                        <p className="text-xs text-gray-500">{review.reviewerName} • {new Date(review.createdAt).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">No reviews yet</p>
                )}
              </div>
            )}

            {activeTab === 'jobs' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Open Positions</h2>
                {jobs.length > 0 ? (
                  <div className="space-y-4">
                    {jobs.map((job) => (
                      <div key={job._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
                        <h3 className="font-semibold text-gray-900 mb-2">{job.jobTitle}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {job.location}
                          </span>
                          {job.salary && (
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-4 h-4" />
                              {job.salary}
                            </span>
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

            {activeTab === 'overview' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Office Locations for {company.name}</h2>
                <div className="space-y-6">
                  {officeLocations.map((location, idx) => (
                    <div key={idx} className="border-b border-gray-200 pb-6 last:border-b-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {location.city}, {location.country}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-semibold text-gray-700">{location.rating}</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm">{location.address}</p>
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
              <button
                onClick={() => setShowReviewModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= reviewForm.rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={reviewForm.title}
                  onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                  placeholder="Summary of your review"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Review</label>
                <textarea
                  value={reviewForm.review}
                  onChange={(e) => setReviewForm({ ...reviewForm, review: e.target.value })}
                  placeholder="Share your experience..."
                  rows={5}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={submitReview}
                  disabled={submittingReview}
                  className="flex-1 bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer onNavigate={onNavigate} user={user} />
    </div>
  );
};

export default CompanyDetailsPage;
