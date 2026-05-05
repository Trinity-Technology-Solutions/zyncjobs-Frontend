import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, TrendingUp, Award, Target, BookOpen, RotateCcw } from 'lucide-react';
import BackButton from '../components/BackButton';
import Header from '../components/Header';
import Footer from '../components/Footer';
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
      const res = await apiFetch(`${API_BASE_URL}/users/refresh`, {
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

  useEffect(() => { 
    console.log('🔄 AssessmentReviewPage mounted with assessmentId:', assessmentId);
    fetchReview(); 
  }, [assessmentId]);

  const fetchReview = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching review for assessmentId:', assessmentId);
      
      // Check if it's a practice assessment (stored in localStorage)
      if (assessmentId.startsWith('local-')) {
        const storageKey = `assessment_${assessmentId}`;
        const stored = localStorage.getItem(storageKey);
        console.log('Looking for:', storageKey);
        console.log('Found:', stored ? 'Yes' : 'No');
        
        if (stored) {
          const practiceData = JSON.parse(stored);
          console.log('✅ Loaded practice assessment:', practiceData);
          setReview({
            ...practiceData,
            review: {
              summary: `You scored ${practiceData.score}% on this practice assessment. This was a practice mode assessment and won't be saved to your profile.`,
              strengths: practiceData.correctAnswers > 0 ? [
                `Answered ${practiceData.correctAnswers} question${practiceData.correctAnswers > 1 ? 's' : ''} correctly`,
                'Completed the full assessment',
                'Demonstrated commitment to learning'
              ] : ['Completed the assessment', 'Identified areas for improvement'],
              improvements: practiceData.score < 100 ? [
                `Review the ${practiceData.totalQuestions - practiceData.correctAnswers} question${practiceData.totalQuestions - practiceData.correctAnswers > 1 ? 's' : ''} you missed`,
                'Practice more to improve your score',
                'Focus on understanding core concepts'
              ] : ['Challenge yourself with advanced topics'],
              recommendations: [
                `Study ${practiceData.skill} documentation and tutorials`,
                'Build hands-on projects to reinforce learning',
                'Take the assessment again to track improvement'
              ],
              level: practiceData.score >= 80 ? 'Advanced' : practiceData.score >= 60 ? 'Intermediate' : 'Beginner'
            }
          });
          setLoading(false);
          return;
        } else {
          console.error('❌ Practice assessment not found in localStorage');
          console.log('Available keys:', Object.keys(localStorage).filter(k => k.startsWith('assessment_')));
          setError('Practice assessment not found. It may have been cleared.');
          setLoading(false);
          return;
        }
      }
      
      // Regular backend assessment
      const token = await getAuthToken();
      if (!token) { setError('Please log in to view your assessment review.'); setLoading(false); return; }
      const response = await apiFetch(`${API_BASE_URL}/skill-assessments/review/${assessmentId}`, {
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
  const correctCount = questions.filter((q: any) => Number(q.userAnswer) === Number(q.correctAnswer)).length;
  const wrongCount = questions.length - correctCount;
  const circumference = 2 * Math.PI * 34;

  return (
    <>
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />
      <div className="min-h-screen py-10 bg-white">
        <div className="max-w-3xl mx-auto px-4">

          {/* Back button */}
          <BackButton onClick={() => onNavigate('skill-assessment')} className="mb-6" />

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
                  const userAns = Number(q.userAnswer);
                  const correctAns = Number(q.correctAnswer);
                  const isCorrect = userAns === correctAns;
                  return (
                    <div key={idx} style={{
                      borderRadius: '16px',
                      padding: '20px',
                      border: `1.5px solid ${isCorrect ? '#6ee7b7' : '#fca5a5'}`,
                      backgroundColor: isCorrect ? '#f0fdf4' : '#fff5f5'
                    }}>
                      {/* Question header */}
                      <div className="flex items-start gap-3 mb-4">
                        <span style={{
                          flexShrink: 0, width: 24, height: 24, borderRadius: '50%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#fff', fontSize: 11, fontWeight: 700,
                          backgroundColor: isCorrect ? '#34d399' : '#f87171'
                        }}>{idx + 1}</span>
                        <p className="text-sm font-medium text-gray-800 leading-relaxed flex-1">{q.question}</p>
                        {isCorrect
                          ? <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#10b981' }} />
                          : <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#ef4444' }} />}
                      </div>

                      {/* Options */}
                      <div className="grid grid-cols-2 gap-2 ml-9">
                        {q.options.map((option: string, optIdx: number) => {
                          const isCorrectOpt = optIdx === correctAns;
                          const isWrongUserAns = optIdx === userAns && !isCorrect;

                          let bg = '#ffffff';
                          let border = '#e5e7eb';
                          let color = '#6b7280';
                          let fontWeight: number | string = 400;

                          if (isCorrectOpt) {
                            bg = '#dcfce7'; border = '#22c55e'; color = '#15803d'; fontWeight = 600;
                          } else if (isWrongUserAns) {
                            bg = '#fee2e2'; border = '#ef4444'; color = '#b91c1c'; fontWeight = 600;
                          }

                          return (
                            <div key={optIdx} style={{
                              display: 'flex', alignItems: 'center', gap: 8,
                              padding: '8px 12px', borderRadius: 12,
                              backgroundColor: bg,
                              border: `2px solid ${border}`,
                              color, fontWeight
                            }}>
                              <span style={{ fontSize: 11, fontWeight: 700, width: 16, flexShrink: 0 }}>
                                {String.fromCharCode(65 + optIdx)}.
                              </span>
                              <span style={{ flex: 1, fontSize: 13 }}>{option}</span>
                              {isCorrectOpt && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                                  {!isCorrect && (
                                    <span style={{
                                      fontSize: 10, fontWeight: 700, backgroundColor: '#bbf7d0',
                                      color: '#15803d', padding: '1px 6px', borderRadius: 999
                                    }}>Correct</span>
                                  )}
                                  <CheckCircle style={{ width: 14, height: 14, color: '#16a34a' }} />
                                </span>
                              )}
                              {isWrongUserAns && (
                                <XCircle style={{ width: 14, height: 14, color: '#dc2626', flexShrink: 0 }} />
                              )}
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
            <button onClick={() => { window.scrollTo(0, 0); onNavigate('dashboard'); }}
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
