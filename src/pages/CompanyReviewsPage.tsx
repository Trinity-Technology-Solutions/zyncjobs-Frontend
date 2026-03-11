import React, { useState, useEffect } from 'react';
import { Star, Building, MessageSquare } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BackButton from '../components/BackButton';
import { API_ENDPOINTS } from '../config/constants';

interface CompanyReviewsPageProps {
  onNavigate: (page: string) => void;
  user?: any;
  onLogout?: () => void;
}

interface CompanyMetrics {
  openJobs: number;
  avgSalary: number;
  reviewCount: number;
  avgRating: number;
  recommendPercentage: number;
}

const CompanyReviewsPage: React.FC<CompanyReviewsPageProps> = ({ onNavigate, user, onLogout }) => {
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [companyMetrics, setCompanyMetrics] = useState<CompanyMetrics>({
    openJobs: 0,
    avgSalary: 0,
    reviewCount: 0,
    avgRating: 0,
    recommendPercentage: 0
  });
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({
    rating: 5,
    title: '',
    pros: '',
    cons: '',
    advice: '',
    jobTitle: '',
    workLifeBalance: 5,
    compensation: 5,
    careerGrowth: 5,
    management: 5,
    culture: 5
  });

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.JOBS}`);
      if (response.ok) {
        const jobs = await response.json();
        const uniqueCompanies = Array.from(
          new Map(
            jobs.map((job: any) => [job.companyId, job])
          ).values()
        ).map((job: any) => ({
          _id: job.companyId,
          name: job.companyName,
          domain: job.domain || 'Technology'
        }));
        setCompanies(uniqueCompanies);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  const calculateMetrics = async (companyId: string, jobs: any[]) => {
    const companyJobs = jobs.filter((job: any) => job.companyId === companyId);
    const openJobs = companyJobs.length;
    const avgSalary = companyJobs.length > 0
      ? Math.round(companyJobs.reduce((sum: number, job: any) => sum + (job.salary || 0), 0) / companyJobs.length)
      : 0;

    setCompanyMetrics({
      openJobs,
      avgSalary,
      reviewCount: reviews.length,
      avgRating: reviews.length > 0
        ? parseFloat((reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length).toFixed(1))
        : 0,
      recommendPercentage: reviews.length > 0
        ? Math.round((reviews.filter((r: any) => r.rating >= 4).length / reviews.length) * 100)
        : 0
    });
  };

  const fetchReviews = async (companyId: string) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/reviews/${companyId}`);
      if (response.ok) {
        const data = await response.json();
        setReviews(data);
        const jobsResponse = await fetch(`${API_ENDPOINTS.JOBS}`);
        if (jobsResponse.ok) {
          const jobs = await jobsResponse.json();
          await calculateMetrics(companyId, jobs);
        }
      } else {
        setReviews([]);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setReviews([]);
    }
  };

  const submitReview = async () => {
    if (!user) {
      alert('Please login to submit a review');
      return;
    }

    try {
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newReview,
          companyId: selectedCompany._id,
          companyName: selectedCompany.name,
          reviewerName: user.name,
          reviewerEmail: user.email,
          createdAt: new Date().toISOString()
        })
      });

      if (response.ok) {
        alert('Review submitted successfully!');
        setShowReviewForm(false);
        fetchReviews(selectedCompany._id);
        setNewReview({
          rating: 5, title: '', pros: '', cons: '', advice: '', jobTitle: '',
          workLifeBalance: 5, compensation: 5, careerGrowth: 5, management: 5, culture: 5
        });
      } else if (response.status === 403) {
        alert('Company must post jobs before accepting reviews');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
    }
  };

  const renderStars = (rating: number, size = 'w-4 h-4') => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${size} ${star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
          />
        ))}
      </div>
    );
  };

  return (
    <>
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!selectedCompany && (
          <BackButton 
            onClick={() => onNavigate('home')}
            text="Back to Home"
            className="mb-6"
          />
        )}

        {!selectedCompany ? (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Company Reviews</h1>
              <p className="text-gray-600 mt-2">Read reviews and ratings from employees</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {companies.map((company) => (
                <div
                  key={company._id}
                  onClick={() => {
                    setSelectedCompany(company);
                    fetchReviews(company._id);
                  }}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Building className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{company.name}</h3>
                      <p className="text-sm text-gray-600">{company.domain}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setSelectedCompany(null)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    ← Back to Companies
                  </button>
                  <h1 className="text-3xl font-bold text-gray-900">{selectedCompany.name}</h1>
                </div>
                <button
                  onClick={() => setShowReviewForm(true)}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                >
                  Write Review
                </button>
              </div>
            </div>

            {/* Company Overview */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">{companyMetrics.avgRating}</div>
                  <div className="flex justify-center mb-2">{renderStars(companyMetrics.avgRating, 'w-5 h-5')}</div>
                  <div className="text-sm text-gray-600">{companyMetrics.reviewCount} reviews</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{companyMetrics.recommendPercentage}%</div>
                  <div className="text-sm text-gray-600">Recommend to friend</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">₹{(companyMetrics.avgSalary / 100000).toFixed(1)}L</div>
                  <div className="text-sm text-gray-600">Avg Salary</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{companyMetrics.openJobs}</div>
                  <div className="text-sm text-gray-600">Open Positions</div>
                </div>
              </div>
            </div>

            {/* Reviews */}
            <div className="space-y-6">
              {reviews.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                  <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No reviews yet. Be the first to review this company!</p>
                </div>
              ) : (
                reviews.map((review) => (
                  <div key={review._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          {renderStars(review.rating)}
                          <span className="font-semibold">{review.title}</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {review.reviewerName} • {new Date(review.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-green-600 mb-2">Pros</h4>
                        <p className="text-gray-700">{review.pros}</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-red-600 mb-2">Cons</h4>
                        <p className="text-gray-700">{review.cons}</p>
                      </div>
                      {review.advice && (
                        <div>
                          <h4 className="font-medium text-blue-600 mb-2">Advice to Management</h4>
                          <p className="text-gray-700">{review.advice}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Review Form Modal */}
            {showReviewForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
                    <h2 className="text-2xl font-bold">Write a Review</h2>
                    <button
                      onClick={() => setShowReviewForm(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="p-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                      <div className="flex space-x-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setNewReview({ ...newReview, rating: star })}
                            className="focus:outline-none"
                          >
                            <Star
                              className={`w-8 h-8 ${star <= newReview.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Review Title</label>
                      <input
                        type="text"
                        value={newReview.title}
                        onChange={(e) => setNewReview({ ...newReview, title: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Great company culture"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Pros</label>
                      <textarea
                        value={newReview.pros}
                        onChange={(e) => setNewReview({ ...newReview, pros: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={3}
                        placeholder="What did you like about working here?"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Cons</label>
                      <textarea
                        value={newReview.cons}
                        onChange={(e) => setNewReview({ ...newReview, cons: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={3}
                        placeholder="What could be improved?"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Advice to Management</label>
                      <textarea
                        value={newReview.advice}
                        onChange={(e) => setNewReview({ ...newReview, advice: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={3}
                        placeholder="Any suggestions for the company?"
                      />
                    </div>

                    <div className="flex space-x-4 pt-4">
                      <button
                        onClick={submitReview}
                        className="flex-1 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                      >
                        Submit Review
                      </button>
                      <button
                        onClick={() => setShowReviewForm(false)}
                        className="flex-1 bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <Footer onNavigate={onNavigate} user={user} />
    </>
  );
};

export default CompanyReviewsPage;
