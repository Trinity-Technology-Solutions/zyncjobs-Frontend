import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, TrendingUp, Award, Target, BookOpen, ArrowLeft } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

interface AssessmentReviewPageProps {
  assessmentId: string;
  onNavigate: (page: string) => void;
  user?: { name: string; type: 'candidate' | 'employer' | 'admin' } | null;
  onLogout?: () => void;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const getAuthToken = async (): Promise<string | null> => {
  let token = localStorage.getItem('accessToken');
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp * 1000 < Date.now()) {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) return null;
      const res = await fetch(`${API_BASE_URL}/users/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('accessToken', data.accessToken);
        if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
        token = data.accessToken;
      } else {
        return null;
      }
    }
  } catch { /* use token as-is */ }
  return token;
};

const AssessmentReviewPage: React.FC<AssessmentReviewPageProps> = ({ assessmentId, onNavigate, user, onLogout }) => {
  const [review, setReview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReview();
  }, [assessmentId]);

  const fetchReview = async () => {
    try {
      setLoading(true);
      const token = await getAuthToken();
      if (!token) {
        setError('Please log in to view your assessment review.');
        setLoading(false);
        return;
      }
      const response = await fetch(`${API_BASE_URL}/skill-assessments/review/${assessmentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch review');
      setReview(await response.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading review');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-cyan-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your assessment review...</p>
          </div>
        </div>
        <Footer onNavigate={onNavigate} />
      </>
    );
  }

  if (error || !review) {
    return (
      <>
        <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-cyan-50 p-6">
          <div className="max-w-2xl mx-auto">
            <button onClick={() => onNavigate('dashboard')} className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800 mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
            </button>
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Error Loading Review</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <button onClick={() => onNavigate('dashboard')} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
        <Footer onNavigate={onNavigate} />
      </>
    );
  }

  const { skill, score, completedAt, review: reviewData, questions = [] } = review;
  const isPassed = score >= 70;
  const levelColors: Record<string, string> = {
    'Advanced': 'text-green-600 bg-green-50',
    'Intermediate': 'text-blue-600 bg-blue-50',
    'Beginner': 'text-orange-600 bg-orange-50'
  };

  return (
    <>
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-cyan-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <button onClick={() => onNavigate('dashboard')} className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800 mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
          </button>

          {/* Score Header */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold mb-2">{skill} Assessment Review</h1>
                <p className="text-gray-600">
                  Completed on {new Date(completedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${isPassed ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                {isPassed ? <CheckCircle size={40} /> : <TrendingUp size={40} />}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">{score}%</div>
                <p className="text-sm text-gray-600">Your Score</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 text-center">
                <div className={`text-2xl font-bold mb-2 ${levelColors[reviewData?.level] || 'text-gray-600'}`}>
                  {reviewData?.level || 'N/A'}
                </div>
                <p className="text-sm text-gray-600">Proficiency Level</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 text-center">
                <div className="text-2xl font-bold text-green-600 mb-2">{isPassed ? '✓ Passed' : 'Keep Going'}</div>
                <p className="text-sm text-gray-600">Status</p>
              </div>
            </div>
          </div>

          {/* Q&A Review */}
          {questions.length > 0 && (
            <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
              <h2 className="text-xl font-bold mb-6 flex items-center">
                <BookOpen className="w-5 h-5 mr-2 text-blue-600" />
                Question Review ({questions.filter((q: any) => q.userAnswer === q.correctAnswer).length}/{questions.length} Correct)
              </h2>
              <div className="space-y-6">
                {questions.map((q: any, idx: number) => {
                  const isCorrect = q.userAnswer === q.correctAnswer;
                  return (
                    <div key={idx} className={`border-2 rounded-lg p-5 ${isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                      <div className="flex items-start gap-3 mb-4">
                        <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white text-sm font-bold ${isCorrect ? 'bg-green-500' : 'bg-red-500'}`}>
                          {idx + 1}
                        </span>
                        <p className="font-medium text-gray-800">{q.question}</p>
                      </div>
                      <div className="space-y-2 ml-10">
                        {q.options.map((option: string, optIdx: number) => {
                          const isCorrectOption = optIdx === q.correctAnswer;
                          const isUserAnswer = optIdx === q.userAnswer;
                          let optionClass = 'border border-gray-200 bg-white text-gray-700';
                          if (isCorrectOption) optionClass = 'border-2 border-green-500 bg-green-100 text-green-800 font-medium';
                          else if (isUserAnswer && !isCorrect) optionClass = 'border-2 border-red-400 bg-red-100 text-red-800';
                          return (
                            <div key={optIdx} className={`flex items-center gap-2 px-4 py-2 rounded-lg ${optionClass}`}>
                              <span className="text-sm font-semibold w-5">{String.fromCharCode(65 + optIdx)}.</span>
                              <span className="text-sm flex-1">{option}</span>
                              {isCorrectOption && <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />}
                              {isUserAnswer && !isCorrect && <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />}
                            </div>
                          );
                        })}
                      </div>
                      {!isCorrect && q.userAnswer !== -1 && (
                        <p className="ml-10 mt-2 text-sm text-red-600">
                          Your answer: <span className="font-medium">{q.options[q.userAnswer]}</span> &nbsp;|&nbsp; Correct: <span className="font-medium text-green-700">{q.options[q.correctAnswer]}</span>
                        </p>
                      )}
                      {q.userAnswer === -1 && (
                        <p className="ml-10 mt-2 text-sm text-gray-500">Not answered &nbsp;|&nbsp; Correct: <span className="font-medium text-green-700">{q.options[q.correctAnswer]}</span></p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <Award className="w-5 h-5 mr-2 text-blue-600" /> Performance Summary
            </h2>
            <p className="text-gray-700 leading-relaxed">{reviewData?.summary}</p>
          </div>

          {/* Strengths */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <CheckCircle className="w-5 h-5 mr-2 text-green-600" /> Your Strengths
            </h2>
            <ul className="space-y-3">
              {reviewData?.strengths?.map((s: string, i: number) => (
                <li key={i} className="flex items-start">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-600 mr-3 flex-shrink-0 mt-0.5">✓</span>
                  <span className="text-gray-700">{s}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Improvements */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-orange-600" /> Areas for Improvement
            </h2>
            <ul className="space-y-3">
              {reviewData?.improvements?.map((s: string, i: number) => (
                <li key={i} className="flex items-start">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-600 mr-3 flex-shrink-0 mt-0.5">→</span>
                  <span className="text-gray-700">{s}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Recommendations */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <Target className="w-5 h-5 mr-2 text-blue-600" /> Recommended Next Steps
            </h2>
            <ul className="space-y-3">
              {reviewData?.recommendations?.map((s: string, i: number) => (
                <li key={i} className="flex items-start">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 mr-3 flex-shrink-0 mt-0.5 font-semibold">{i + 1}</span>
                  <span className="text-gray-700">{s}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex flex-col sm:flex-row gap-4">
              <button onClick={() => onNavigate('skill-assessment')} className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center">
                <BookOpen className="w-5 h-5 mr-2" /> Take Another Assessment
              </button>
              <button onClick={() => onNavigate('dashboard')} className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium">
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
      <Footer onNavigate={onNavigate} />
    </>
  );
};

export default AssessmentReviewPage;
