import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, ArrowLeft, Search, ExternalLink } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

interface SkillAssessmentPageProps {
  onNavigate: (page: string, params?: any) => void;
  user?: { name: string; type: 'candidate' | 'employer' | 'admin' } | null;
  onLogout?: () => void;
}

const SkillAssessmentPage: React.FC<SkillAssessmentPageProps> = ({ onNavigate, user, onLogout }) => {
  const [skills, setSkills] = useState<string[]>([]);
  const [filteredSkills, setFilteredSkills] = useState<string[]>([]);
  const [skillSearch, setSkillSearch] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');
  const [showSkillDropdown, setShowSkillDropdown] = useState(false);
  const [assessment, setAssessment] = useState<any>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(1800);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [startError, setStartError] = useState('');
  const [myAssessments, setMyAssessments] = useState<any[]>([]);

  useEffect(() => {
    fetchSkills();
    fetchMyAssessments();
  }, []);

  useEffect(() => {
    if (assessment && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [assessment, timeLeft]);

  const fetchSkills = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/skill-assessments/skills`);
      if (response.ok) {
        const data = await response.json();
        setSkills(data);
        setFilteredSkills(data.slice(0, 10));
      }
    } catch {
      const fallback = [
        'JavaScript', 'Python', 'React', 'Node.js', 'Java', 'C++', 'SQL', 'AWS',
        'Docker', 'Git', 'HTML', 'CSS', 'TypeScript', 'Angular', 'Vue.js', 'PHP',
        'C#', 'Ruby', 'Go', 'Kotlin'
      ];
      setSkills(fallback);
      setFilteredSkills(fallback.slice(0, 10));
    }
  };

  const getAuthToken = async (): Promise<string | null> => {
    let token = localStorage.getItem('accessToken');
    if (!token) return null;
    // Try to refresh if expired
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

  const fetchMyAssessments = async () => {
    try {
      const token = await getAuthToken();
      if (!token) return;
      const response = await fetch(`${API_BASE_URL}/skill-assessments/my-assessments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setMyAssessments(data);
      }
    } catch { /* silent */ }
  };

  const startAssessment = async () => {
    if (!selectedSkill) return;
    setStartError('');
    try {
      setLoading(true);
      const token = await getAuthToken();
      if (!token) {
        setStartError('Please log in to take an assessment.');
        return;
      }
      const response = await fetch(`${API_BASE_URL}/skill-assessments/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ skill: selectedSkill, questionCount: 10 })
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        if (response.status === 503) {
          setStartError('The AI question service is temporarily unavailable. Please try again in a moment.');
        } else {
          setStartError(err.error || 'Failed to start assessment. Please try again.');
        }
        return;
      }
      const data = await response.json();
      setAssessment(data);
      setAnswers(new Array(data.totalQuestions).fill(-1));
      setTimeLeft(data.timeLimit * 60);
      setCurrentQuestion(0);
    } catch {
      setStartError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const submitAssessment = async () => {
    try {
      setLoading(true);
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/skill-assessments/submit/${assessment.assessmentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ answers, timeSpent: 1800 - timeLeft })
      });
      if (!response.ok) throw new Error('Failed to submit');
      const data = await response.json();
      setResult(data);
      setAssessment(null);
      fetchMyAssessments();
      setTimeout(() => onNavigate('assessment-review', { assessmentId: data.assessmentId }), 2000);
    } catch {
      alert('Failed to submit assessment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSkillSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSkillSearch(value);
    setSelectedSkill(value);
    if (value.length >= 1) {
      setFilteredSkills(skills.filter(s => s.toLowerCase().includes(value.toLowerCase())).slice(0, 10));
      setShowSkillDropdown(true);
    } else {
      setFilteredSkills(skills.slice(0, 10));
      setShowSkillDropdown(false);
    }
  };

  const selectSkill = (skill: string) => {
    setSelectedSkill(skill);
    setSkillSearch(skill);
    setShowSkillDropdown(false);
  };

  if (result) {
    return (
      <>
        <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-2xl mx-auto px-4">
            <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-6 ${result.score >= 70 ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                <CheckCircle size={32} />
              </div>
              <h2 className="text-2xl font-bold mb-4">Assessment Complete!</h2>
              <div className="text-4xl font-bold mb-4 text-blue-600">{result.score}%</div>
              <p className="text-gray-600 mb-4">
                You got {result.correctAnswers} out of {result.totalQuestions} questions correct
              </p>
              <p className="text-sm text-gray-500 mb-6">Redirecting to your review page...</p>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          </div>
        </div>
        <Footer onNavigate={onNavigate} />
      </>
    );
  }

  if (assessment) {
    const question = assessment.questions[currentQuestion];
    return (
      <>
        <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-4xl mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-6">
              {/* Question Navigator Sidebar */}
              <div className="md:col-span-1">
                <div className="bg-white rounded-lg shadow-sm border p-4 sticky top-8">
                  <h3 className="font-semibold text-sm text-gray-700 mb-3">Questions</h3>
                  <div className="grid grid-cols-5 gap-2">
                    {assessment.questions.map((_: any, i: number) => (
                      <button
                        key={i}
                        onClick={() => setCurrentQuestion(i)}
                        className={`w-8 h-8 rounded text-xs font-medium transition-colors ${
                          i === currentQuestion
                            ? 'bg-blue-600 text-white'
                            : answers[i] !== -1
                            ? 'bg-green-100 text-green-700 border border-green-300'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t space-y-2 text-xs text-gray-500">
                    <div className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-blue-600 inline-block"></span> Current</div>
                    <div className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-green-100 border border-green-300 inline-block"></span> Answered</div>
                    <div className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-gray-100 inline-block"></span> Unanswered</div>
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <div className={`flex items-center gap-2 text-sm font-medium ${timeLeft < 300 ? 'text-red-600' : 'text-gray-700'}`}>
                      <Clock size={16} />
                      {formatTime(timeLeft)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {answers.filter(a => a !== -1).length} of {assessment.totalQuestions} answered
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Question Area */}
              <div className="md:col-span-2">
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold">{assessment.skill} Assessment</h2>
                    <span className="text-sm text-gray-500">Q{currentQuestion + 1}/{assessment.totalQuestions}</span>
                  </div>

                  <div className="mb-5">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${((answers.filter(a => a !== -1).length) / assessment.totalQuestions) * 100}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{Math.round((answers.filter(a => a !== -1).length / assessment.totalQuestions) * 100)}% Complete</div>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-base font-medium mb-4 leading-relaxed">{question.question}</h3>
                    <div className="space-y-3">
                      {question.options.map((option: string, index: number) => (
                        <label
                          key={index}
                          className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                            answers[currentQuestion] === index
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`question-${currentQuestion}`}
                            value={index}
                            checked={answers[currentQuestion] === index}
                            onChange={() => {
                              const newAnswers = [...answers];
                              newAnswers[currentQuestion] = index;
                              setAnswers(newAnswers);
                            }}
                            className="mr-3"
                          />
                          <span className="text-sm">{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t">
                    <button
                      type="button"
                      onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
                      className={`px-5 py-2 border-2 rounded-lg text-sm font-medium transition-colors ${
                        currentQuestion === 0
                          ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-100 cursor-pointer'
                      }`}
                    >
                      ← Previous
                    </button>
                    {currentQuestion === assessment.totalQuestions - 1 ? (
                      <button
                        type="button"
                        onClick={submitAssessment}
                        disabled={loading}
                        className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium"
                      >
                        {loading ? 'Submitting...' : 'Submit Assessment'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setCurrentQuestion(prev => Math.min(assessment.totalQuestions - 1, prev + 1))}
                        className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
                      >
                        Next →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Footer onNavigate={onNavigate} />
      </>
    );
  }

  const passed = myAssessments.filter(a => a.score >= 70).length;
  const avgScore = myAssessments.length
    ? Math.round(myAssessments.reduce((s, a) => s + a.score, 0) / myAssessments.length)
    : 0;
  const popularSkills = ['JavaScript', 'Python', 'React', 'Node.js', 'Java', 'TypeScript', 'SQL', 'AWS', 'Docker', 'Go'];

  return (
    <>
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-cyan-50 py-8">
        <div className="max-w-5xl mx-auto px-4">
          <div className="mb-6">
            <button
              onClick={() => onNavigate('dashboard')}
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </button>
          </div>

          <h1 className="text-3xl font-bold mb-2">Skill Assessments</h1>
          <p className="text-gray-500 mb-6">Validate your skills with AI-powered assessments and stand out to employers.</p>

          {/* Stats Row */}
          {myAssessments.length > 0 && (
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-lg border p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{myAssessments.length}</div>
                <div className="text-xs text-gray-500 mt-1">Total Taken</div>
              </div>
              <div className="bg-white rounded-lg border p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{passed}</div>
                <div className="text-xs text-gray-500 mt-1">Passed (≥70%)</div>
              </div>
              <div className="bg-white rounded-lg border p-4 text-center">
                <div className={`text-2xl font-bold ${avgScore >= 70 ? 'text-green-600' : 'text-orange-500'}`}>{avgScore}%</div>
                <div className="text-xs text-gray-500 mt-1">Avg Score</div>
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-5 gap-6">
            {/* Left: Take Assessment */}
            <div className="md:col-span-2 space-y-4">
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h2 className="text-lg font-bold mb-1">Take New Assessment</h2>
                <p className="text-gray-500 text-xs mb-4">10 AI-generated questions · Instant results · Shareable badge</p>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Select Skill</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={skillSearch}
                      onChange={handleSkillSearch}
                      onFocus={() => setShowSkillDropdown(true)}
                      onBlur={() => setTimeout(() => setShowSkillDropdown(false), 200)}
                      placeholder="Search skills..."
                      className="w-full p-3 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    {showSkillDropdown && filteredSkills.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {filteredSkills.map((skill, index) => (
                          <button
                            key={index}
                            type="button"
                            onMouseDown={() => selectSkill(skill)}
                            className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm border-b last:border-b-0 transition-colors"
                          >
                            {skill}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                {startError && (
                  <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    {startError}
                  </div>
                )}
                <button
                  onClick={startAssessment}
                  disabled={!selectedSkill || loading}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium text-sm"
                >
                  {loading ? 'Generating Questions...' : startError ? 'Retry' : 'Start Assessment'}
                </button>
              </div>

              {/* Popular Skills */}
              <div className="bg-white p-5 rounded-lg shadow-sm border">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Popular Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {popularSkills.map(skill => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => selectSkill(skill)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                        selectedSkill === skill
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-blue-400 hover:text-blue-600'
                      }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: My Assessments */}
            <div className="md:col-span-3">
              <div className="bg-white p-6 rounded-lg shadow-sm border h-full">
                <h2 className="text-lg font-bold mb-4">My Assessments</h2>
                {myAssessments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mb-3">
                      <CheckCircle className="w-7 h-7 text-blue-400" />
                    </div>
                    <p className="text-gray-500 text-sm">No assessments yet.</p>
                    <p className="text-gray-400 text-xs mt-1">Pick a skill on the left and get started!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myAssessments.map((a, index) => (
                      <div key={index} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                              a.score >= 70 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                            }`}>
                              {a.skill?.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium text-sm">{a.skill}</div>
                              <div className="text-xs text-gray-400">
                                {a.completedAt && new Date(a.completedAt).getFullYear() > 1970
                                  ? new Date(a.completedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
                                  : 'Date unavailable'}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {a.score >= 70 && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Passed</span>
                            )}
                            <span className={`text-sm font-bold ${
                              a.score >= 70 ? 'text-green-600' : 'text-orange-500'
                            }`}>{a.score}%</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full transition-all ${
                                  a.score >= 70 ? 'bg-green-500' : 'bg-orange-400'
                                }`}
                                style={{ width: `${a.score}%` }}
                              />
                            </div>
                          </div>
                          {(a.assessmentId || a._id || a.id) && (
                            <button
                              type="button"
                              onClick={() => onNavigate('assessment-review', { assessmentId: a.assessmentId || a._id || a.id })}
                              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium flex-shrink-0"
                            >
                              View Review <ExternalLink className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer onNavigate={onNavigate} />
    </>
  );
};

export default SkillAssessmentPage;
