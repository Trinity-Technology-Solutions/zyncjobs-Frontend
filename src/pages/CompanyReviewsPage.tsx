import React, { useState, useEffect } from 'react';
import { Star, ThumbsUp, ThumbsDown, Building, Users, TrendingUp, MessageSquare } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BackButton from '../components/BackButton';
import { API_ENDPOINTS } from '../config/constants';

interface CompanyReviewsPageProps {
  onNavigate: (page: string) => void;
  user?: any;
  onLogout?: () => void;
}

const CompanyReviewsPage: React.FC<CompanyReviewsPageProps> = ({ onNavigate, user, onLogout }) => {
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
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
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/companies`);
      if (response.ok) {
        const data = await response.json();
        setCompanies(data);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  const fetchReviews = async (companyId: string) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/reviews/${companyId}`);
      if (response.ok) {
        const data = await response.json();
        setReviews(data);
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
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/reviews`, {
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

  const getAverageRating = (reviews: any[]) => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / reviews.length).toFixed(1);
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
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {renderStars(4.2)}
                      <span className="text-sm text-gray-600">4.2</span>
                    </div>
                    <span className="text-sm text-gray-500">25 reviews</span>
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
                  <div className="text-3xl font-bold text-gray-900">{getAverageRating(reviews)}</div>
                  <div className="flex justify-center mb-2">{renderStars(parseFloat(getAverageRating(reviews)) || 0, 'w-5 h-5')}</div>
                  <div className="text-sm text-gray-600">{reviews.length} reviews</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">85%</div>
                  <div className="text-sm text-gray-600">Recommend to friend</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">4.1</div>
                  <div className="text-sm text-gray-600">Work-Life Balance</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">4.3</div>
                  <div className="text-sm text-gray-600">Career Growth</div>
                </div>
              </div>
            </div>

            {/* Reviews */}
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        {renderStars(review.rating)}
                        <span className="font-semibold">{review.title}</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {review.jobTitle} • {new Date(review.createdAt).toLocaleDateString()}
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

                  <div className="flex items-center space-x-4 mt-4 pt-4 border-t">
                    <button className="flex items-center space-x-1 text-gray-600 hover:text-green-600">
                      <ThumbsUp className="w-4 h-4" />
                      <span className="text-sm">Helpful (12)</span>
                    </button>
                    <button className="flex items-center space-x-1 text-gray-600 hover:text-red-600">
                      <ThumbsDown className="w-4 h-4" />
                      <span className="text-sm">Not Helpful (2)</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Review Form Modal */}
            {showReviewForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-semibold">Write a Review for {selectedCompany.name}</h2>
                      <button
                        onClick={() => setShowReviewForm(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Overall Rating</label>
                        <div className="flex space-x-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onClick={() => setNewReview({...newReview, rating: star})}
                              className={`w-8 h-8 ${star <= newReview.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                            >
                              <Star className="w-full h-full fill-current" />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Review Title</label>
                        <input
                          type="text"
                          value={newReview.title}
                          onChange={(e) => setNewReview({...newReview, title: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Great place to work!"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Your Job Title</label>
                        <input
                          type="text"
                          value={newReview.jobTitle}
                          onChange={(e) => setNewReview({...newReview, jobTitle: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Software Engineer"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Pros</label>
                        <textarea
                          value={newReview.pros}
                          onChange={(e) => setNewReview({...newReview, pros: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          rows={3}
                          placeholder="What did you like about working here?"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Cons</label>
                        <textarea
                          value={newReview.cons}
                          onChange={(e) => setNewReview({...newReview, cons: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          rows={3}
                          placeholder="What could be improved?"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Advice to Management</label>
                        <textarea
                          value={newReview.advice}
                          onChange={(e) => setNewReview({...newReview, advice: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          rows={2}
                          placeholder="Optional advice for management"
                        />
                      </div>

                      <div className="flex space-x-4">
                        <button
                          onClick={() => setShowReviewForm(false)}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={submitReview}
                          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Submit Review
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <Footer onNavigate={onNavigate} />
    </>
  );
};

export default CompanyReviewsPage;