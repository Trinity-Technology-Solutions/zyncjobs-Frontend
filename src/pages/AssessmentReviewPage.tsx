import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, TrendingUp, Award, Target, BookOpen, ArrowLeft, RotateCcw } from 'lucide-react';
import Header from '../components/Header';
import { tokenStorage } from '../utils/tokenStorage';

interface AssessmentReviewPageProps {
  assessmentId: string;
  onNavigate: (page: string) => void;
  user?: { name: string; type: 'candidate' | 'employer' | 'admin' } | null;
  onLogout?: () => void;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const getAuthToken = async (): Promise<string | null> => {
  let token = tokenStorage.getAccess();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp * 1000 < Date.now()) {
      const refreshToken = tokenStorage.getRefresh();
      if (!refreshToken) return null;
      const res = await fetch(`${API_BASE_URL}/users/refresh`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });
      if (res.ok) {
        const data = await res.json();
        tokenStorage.setAccess(data.accessToken);
        if (data.refreshToken) tokenStorage.setRefresh(data.refreshToken);
        token = data.accessToken;
      } else return null;
    }
  } catch { }
  return token;
};

const AssessmentReviewPage: React.FC<AssessmentReviewPageProps> = ({ assessmentId, onNavigate, user, onLogout }) => {
  const [review, setReview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { fetchReview(); }, [assessmentId]);

  const fetchReview = async () => {
    try {
      setLoading(true);
      const token = await getAuthToken();
      if (!token) { setError('Please log in to view your assessment review.'); setLoading(false); return; }
      const response = await fetch(`${API_BASE_URL}/skill-assessments/review/${assessmentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch review');
      setReview(await response.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading review');
    } finally { setLoading(false); }
  };

  if (loading) return (
    <>
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />
      <div className="min-h-screen flex items-center justify-center" style={{background: 'linear-gradient(135deg, #d1fae5 0%, #e0f2fe 50%, #ede9fe 100%)'}}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading your review...</p>
        </div>
      </div>
      <Footer onNavigate={onNavigate} />
    </>
  );

  if (error || !review) return (
    <>
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />
      <div className="min-h-screen flex items-center justify-center" style={{background: 'linear-gradient(135deg, #d1fae5 0%, #e0f2fe 50%, #ede9fe 100%)'}}>
        <div className="bg-white rounded-3xl shadow-xl p-10 text-center max-w-md mx-4">
          <XCircle className="w-14 h-14 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Review</h2>
          <p className="text-gray-500 mb-6 text-sm">{error}</p>
          <button onClick={() => onNavigate('skill-assessment')} className="bg-gray-900 text-white px-8 py-2.5 rounded-full font-semibold text-sm hover:bg-gray-700 transition-colors">Go Back</button>
        </div>
      </div>
      <Footer onNavigate={onNavigate} />
    </>
  );

  const { skill, score, completedAt, review: reviewData, questions = [] } = review;
  const isPassed = score >= 70;
  const correctCount = questions.filter((q: any) => q.userAnswer === q.correctAnswer).length;
  const wrongCount = questions.length - correctCount;
  const circumference = 2 * Math.PI * 34;

  return (
    <>
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />
      <div className="min-h-screen py-10" style={{background: 'linear-gradient(135deg, #d1fae5 0%, #e0f2fe 50%, #ede9fe 100%)'}}>
        <div className="max-w-3xl mx-auto px-4">

          {/* Back button */}
          <button onClick={() => onNavigate('skill-assessment')} className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Assessments
          </button>

          {/* Score Card — same style as result screen */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full border-2 border-green-400 flex items-center justify-center mx-auto mb-4 bg-white shadow-sm">
              {isPassed
                ? <CheckCircle className="w-8 h-8 text-green-500" />
                : <TrendingUp className="w-8 h-8 text-amber-500" />}
            </div>
            <p className="text-gray-700 font-semibold text-lg mb-0.5">{skill} Assessment Review</p>
            <p className="text-gray-400 text-sm mb-1">
              {completedAt && new Date(completedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <p className="text-gray-900 font-bold text-xl">Score Card</p>
          </div>

          {/* Score circles */}
          <div className="bg-white rounded-3xl shadow-lg px-10 py-8 mb-6">
            <div className="grid grid-cols-3 gap-6">
              {[
                { label: 'Correct', sublabel: 'Answers', value: correctCount, stroke: '#34d399', track: '#d1fae5', ratio: questions.length ? correctCount / questions.length : 0 },
                { label: 'Total', sublabel: 'Questions', value: questions.length, stroke: '#374151', track: '#e5e7eb', ratio: 1 },
                { label: 'Wrong', sublabel: 'Answers', value: wrongCount, stroke: '#f87171', track: '#fce7f3', ratio: questions.length ? wrongCount / questions.length : 0 },
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center gap-3">
                  <div className="relative w-20 h-20">
                    <svg width="80" height="80" viewBox="0 0 80 80">
                      <circle cx="40" cy="40" r="34" fill="none" stroke={item.track} strokeWidth="6" />
                      <circle cx="40" cy="40" r="34" fill="none" stroke={item.stroke} strokeWidth="6"
                        strokeDasharray={`${item.ratio * circumference} ${circumference}`}
                        strokeLinecap="round" transform="rotate(-90 40 40)" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xl font-bold" style={{color: item.stroke}}>{item.value}</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-gray-700">{item.label}</p>
                    <p className="text-sm text-gray-400">{item.sublabel}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Score bar */}
            <div className="mt-6 pt-6 border-t border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Overall Score</span>
                <span className={`text-sm font-bold ${isPassed ? 'text-emerald-600' : 'text-amber-500'}`}>{score}% — {isPassed ? '✓ Passed' : 'Keep Going'}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div className={`h-2.5 rounded-full transition-all ${isPassed ? 'bg-emerald-400' : 'bg-amber-400'}`} style={{width: `${score}%`}} />
              </div>
            </div>
          </div>

          {/* Q&A Review */}
          {questions.length > 0 && (
            <div className="bg-white rounded-3xl shadow-lg p-8 mb-6">
              <h2 className="text-base font-bold text-gray-900 mb-5 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-violet-500" />
                Question Review
                <span className="ml-auto text-xs font-medium text-gray-400">{correctCount}/{questions.length} Correct</span>
              </h2>
              <div className="space-y-5">
                {questions.map((q: any, idx: number) => {
                  const isCorrect = q.userAnswer === q.correctAnswer;
                  return (
                    <div key={idx} className={`rounded-2xl p-5 border ${isCorrect ? 'border-emerald-100 bg-emerald-50/50' : 'border-red-100 bg-red-50/50'}`}>
                      <div className="flex items-start gap-3 mb-4">
                        <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${isCorrect ? 'bg-emerald-400' : 'bg-red-400'}`}>{idx + 1}</span>
                        <p className="text-sm font-medium text-gray-800 leading-relaxed">{q.question}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 ml-9">
                        {q.options.map((option: string, optIdx: number) => {
                          const isCorrectOpt = optIdx === q.correctAnswer;
                          const isUserAns = optIdx === q.userAnswer;
                          return (
                            <div key={optIdx} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm border ${ 
                              isCorrectOpt ? 'border-emerald-300 bg-emerald-100 text-emerald-800 font-medium' :
                              isUserAns && !isCorrect ? 'border-red-300 bg-red-100 text-red-700' :
                              'border-gray-100 bg-white text-gray-600'
                            }`}>
                              <span className="text-xs font-bold w-4 flex-shrink-0">{String.fromCharCode(65 + optIdx)}.</span>
                              <span className="flex-1 truncate">{option}</span>
                              {isCorrectOpt && <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />}
                              {isUserAns && !isCorrect && <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Performance Summary */}
          {reviewData?.summary && (
            <div className="bg-white rounded-3xl shadow-lg p-8 mb-6">
              <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" /> Performance Summary
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed">{reviewData.summary}</p>
            </div>
          )}

          {/* Strengths + Improvements side by side */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {reviewData?.strengths?.length > 0 && (
              <div className="bg-white rounded-3xl shadow-lg p-6">
                <h2 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" /> Strengths
                </h2>
                <ul className="space-y-2">
                  {reviewData.strengths.map((s: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">✓</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {reviewData?.improvements?.length > 0 && (
              <div className="bg-white rounded-3xl shadow-lg p-6">
                <h2 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-amber-500" /> Improvements
                </h2>
                <ul className="space-y-2">
                  {reviewData.improvements.map((s: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="w-4 h-4 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">→</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Recommendations */}
          {reviewData?.recommendations?.length > 0 && (
            <div className="bg-white rounded-3xl shadow-lg p-8 mb-8">
              <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Target className="w-4 h-4 text-violet-500" /> Recommended Next Steps
              </h2>
              <div className="space-y-3">
                {reviewData.recommendations.map((s: string, i: number) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-violet-50 border border-violet-100">
                    <span className="w-5 h-5 rounded-full bg-violet-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                    <span className="text-sm text-gray-700">{s}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-4 justify-center pb-4">
            <button onClick={() => onNavigate('skill-assessment')}
              className="flex items-center gap-2 bg-gray-900 text-white px-8 py-3 rounded-full font-semibold text-sm hover:bg-gray-700 transition-colors shadow-md">
              <RotateCcw className="w-4 h-4" /> Take Another
            </button>
            <button onClick={() => onNavigate('dashboard')}
              className="flex items-center gap-2 bg-white text-gray-700 px-8 py-3 rounded-full font-semibold text-sm hover:bg-gray-50 transition-colors shadow-md border border-gray-200">
              Dashboard
            </button>
          </div>

        </div>
      </div>
      <Footer onNavigate={onNavigate} />
    </>
  );
};

export default AssessmentReviewPage;
