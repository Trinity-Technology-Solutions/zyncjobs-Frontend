import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, TrendingUp, Award, Target, BookOpen, ArrowLeft } from 'lucide-react';

interface AssessmentReviewPageProps {
  assessmentId: string;
  onNavigate: (page: string) => void;
  user?: { name: string; type: 'candidate' | 'employer' | 'admin' } | null;
}

const AssessmentReviewPage: React.FC<AssessmentReviewPageProps> = ({ assessmentId, onNavigate, user }) => {
  const [review, setReview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

  useEffect(() => {
    fetchReview();
  }, [assessmentId]);

  const fetchReview = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/skill-assessments/review/${assessmentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch review');
      }

      const data = await response.json();
      setReview(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading review');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your assessment review...</p>
        </div>
      </div>
    );
  }

  if (error || !review) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-cyan-50 p-6">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => onNavigate('dashboard')}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800 mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </button>
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Error Loading Review</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => onNavigate('dashboard')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { skill, score, completedAt, review: reviewData } = review;
  const isPassed = score >= 70;
  const levelColors = {
    'Advanced': 'text-green-600 bg-green-50',
    'Intermediate': 'text-blue-600 bg-blue-50',
    'Beginner': 'text-orange-600 bg-orange-50'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-cyan-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Back Button */}
        <button
          onClick={() => onNavigate('dashboard')}
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </button>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{skill} Assessment Review</h1>
              <p className="text-gray-600">
                Completed on {new Date(completedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${
              isPassed ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'
            }`}>
              {isPassed ? <CheckCircle size={40} /> : <TrendingUp size={40} />}
            </div>
          </div>

          {/* Score Display */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">{score}%</div>
              <p className="text-sm text-gray-600">Your Score</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 text-center">
              <div className={`text-2xl font-bold mb-2 ${levelColors[reviewData.level as keyof typeof levelColors]}`}>
                {reviewData.level}
              </div>
              <p className="text-sm text-gray-600">Proficiency Level</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 text-center">
              <div className="text-2xl font-bold text-green-600 mb-2">
                {isPassed ? '✓ Passed' : 'In Progress'}
              </div>
              <p className="text-sm text-gray-600">Status</p>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <Award className="w-5 h-5 mr-2 text-blue-600" />
            Performance Summary
          </h2>
          <p className="text-gray-700 leading-relaxed">{reviewData.summary}</p>
        </div>

        {/* Strengths */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
            Your Strengths
          </h2>
          <ul className="space-y-3">
            {reviewData.strengths?.map((strength: string, index: number) => (
              <li key={index} className="flex items-start">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-600 mr-3 flex-shrink-0 mt-0.5">
                  ✓
                </span>
                <span className="text-gray-700">{strength}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Areas for Improvement */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-orange-600" />
            Areas for Improvement
          </h2>
          <ul className="space-y-3">
            {reviewData.improvements?.map((improvement: string, index: number) => (
              <li key={index} className="flex items-start">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-600 mr-3 flex-shrink-0 mt-0.5">
                  →
                </span>
                <span className="text-gray-700">{improvement}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Recommendations */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <Target className="w-5 h-5 mr-2 text-blue-600" />
            Recommended Next Steps
          </h2>
          <ul className="space-y-3">
            {reviewData.recommendations?.map((recommendation: string, index: number) => (
              <li key={index} className="flex items-start">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 mr-3 flex-shrink-0 mt-0.5 font-semibold">
                  {index + 1}
                </span>
                <span className="text-gray-700">{recommendation}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => onNavigate('skill-assessment')}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center"
            >
              <BookOpen className="w-5 h-5 mr-2" />
              Take Another Assessment
            </button>
            <button
              onClick={() => onNavigate('dashboard')}
              className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssessmentReviewPage;
