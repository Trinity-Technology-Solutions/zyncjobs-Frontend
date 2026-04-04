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
      window.dispatchEvent(new CustomEvent("zync:alert", { detail: { message: "Failed to submit assessment. Please try again." } }));
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
    const wrong = result.totalQuestions - result.correctAnswers;
    return (
      <>
        <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />
        <div className="min-h-screen flex items-center justify-center" style={{background: 'linear-gradient(135deg, #d1fae5 0%, #e0f2fe 50%, #ede9fe 100%)'}}>
          <div className="text-center max-w-lg w-full mx-4">
            {/* Check icon */}
            <div className="w-16 h-16 rounded-full border-2 border-green-400 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <p className="text-gray-700 font-semibold text-lg mb-1">Your quiz has been submitted!</p>
            <p className="text-gray-900 font-bold text-xl mb-6">Score Card</p>

            {/* Score card */}
            <div className="bg-white rounded-3xl shadow-lg px-10 py-8 mb-8">
              <div className="grid grid-cols-3 gap-6">
                {/* Correct */}
                <div className="flex flex-col items-center gap-3">
                  <div className="relative w-20 h-20">
                    <svg width="80" height="80" viewBox="0 0 80 80">
                      <circle cx="40" cy="40" r="34" fill="none" stroke="#d1fae5" strokeWidth="6" />
                      <circle cx="40" cy="40" r="34" fill="none" stroke="#34d399" strokeWidth="6"
                        strokeDasharray={`${(result.correctAnswers / result.totalQuestions) * 213.6} 213.6`}
                        strokeLinecap="round" transform="rotate(-90 40 40)" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xl font-bold text-green-500">{result.correctAnswers}</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-gray-700">Correct</p>
                    <p className="text-sm text-gray-500">Answers</p>
                  </div>
                </div>

                {/* Total */}
                <div className="flex flex-col items-center gap-3">
                  <div className="relative w-20 h-20">
                    <svg width="80" height="80" viewBox="0 0 80 80">
                      <circle cx="40" cy="40" r="34" fill="none" stroke="#e5e7eb" strokeWidth="6" />
                      <circle cx="40" cy="40" r="34" fill="none" stroke="#374151" strokeWidth="6"
                        strokeDasharray="213.6 213.6"
                        strokeLinecap="round" transform="rotate(-90 40 40)" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xl font-bold text-gray-700">{result.totalQuestions}</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-gray-700">Total</p>
                    <p className="text-sm text-gray-500">Questions</p>
                  </div>
                </div>

                {/* Wrong */}
                <div className="flex flex-col items-center gap-3">
                  <div className="relative w-20 h-20">
                    <svg width="80" height="80" viewBox="0 0 80 80">
                      <circle cx="40" cy="40" r="34" fill="none" stroke="#fce7f3" strokeWidth="6" />
                      <circle cx="40" cy="40" r="34" fill="none" stroke="#f87171" strokeWidth="6"
                        strokeDasharray={`${(wrong / result.totalQuestions) * 213.6} 213.6`}
                        strokeLinecap="round" transform="rotate(-90 40 40)" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xl font-bold text-red-400">{wrong}</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-gray-700">Wrong</p>
                    <p className="text-sm text-gray-500">Answers</p>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigate('skill-assessment')}
              className="bg-red-400 hover:bg-red-500 text-white px-10 py-3 rounded-full font-semibold text-sm transition-colors shadow-md"
            >
              Go Back
            </button>
          </div>
        </div>
        <Footer onNavigate={onNavigate} />
      </>
    );
  }

  if (assessment) {
    const question = assessment.questions[currentQuestion];
    const answeredCount = answers.filter(a => a !== -1).length;
    const radius = 54;
    const circumference = 2 * Math.PI * radius;
    const progress = (answeredCount / assessment.totalQuestions) * circumference;
    return (
      <>
        <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />
        <div className="min-h-screen flex items-center justify-center py-8" style={{background: 'linear-gradient(135deg, #d1fae5 0%, #e0f2fe 50%, #ede9fe 100%)'}}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl mx-4">

            {/* Top bar */}
            <div className="flex items-center justify-between px-8 pt-6 pb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <div>
                  <div className={`text-sm font-mono font-bold ${timeLeft < 300 ? 'text-red-500' : 'text-gray-700'}`}>
                    {formatTime(timeLeft)}
                  </div>
                  <div className="text-xs text-gray-400">Time remaining</div>
                </div>
              </div>
              <button
                onClick={submitAssessment}
                disabled={loading}
                className="bg-gray-900 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Submitting...' : 'Submit'}
              </button>
            </div>

            {/* Divider */}
            <div className="h-px bg-gray-100 mx-8" />

            {/* Question + circular progress */}
            <div className="flex gap-6 px-8 py-6">
              <div className="flex-1">
                <p className="text-xs text-gray-400 mb-2 font-medium">Question {currentQuestion + 1} of {assessment.totalQuestions}</p>
                <p className="text-sm font-medium text-gray-800 mb-5 leading-relaxed">{question.question}</p>
                <div className="grid grid-cols-2 gap-3">
                  {question.options.map((option: string, index: number) => (
                    <label key={index}
                      className={`flex items-center gap-3 px-4 py-3 border rounded-xl cursor-pointer transition-all ${
                        answers[currentQuestion] === index
                          ? 'border-gray-900 bg-gray-900 text-white'
                          : 'border-gray-200 hover:border-gray-400 bg-white text-gray-700'
                      }`}>
                      <input type="radio" name={`q-${currentQuestion}`} value={index}
                        checked={answers[currentQuestion] === index}
                        onChange={() => { const a = [...answers]; a[currentQuestion] = index; setAnswers(a); }}
                        className="hidden" />
                      <span className={`text-xs font-bold w-5 flex-shrink-0 ${
                        answers[currentQuestion] === index ? 'text-white' : 'text-gray-400'
                      }`}>{String.fromCharCode(65 + index)}.</span>
                      <span className="text-sm">{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Circular progress */}
              <div className="flex-shrink-0 flex items-center justify-center">
                <div className="relative w-28 h-28">
                  <svg width="112" height="112" viewBox="0 0 112 112">
                    <circle cx="56" cy="56" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="7" />
                    <circle cx="56" cy="56" r={radius} fill="none" stroke="#111827" strokeWidth="7"
                      strokeDasharray={`${progress} ${circumference}`}
                      strokeLinecap="round" transform="rotate(-90 56 56)" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-bold text-gray-900">{answeredCount}/{assessment.totalQuestions}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-gray-100 mx-8" />

            {/* Bottom navigation */}
            <div className="flex items-center gap-2 px-8 py-5">
              <button
                onClick={() => setCurrentQuestion(p => Math.max(0, p - 1))}
                disabled={currentQuestion === 0}
                className="px-5 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:border-gray-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors bg-white"
              >
                Prev
              </button>
              <div className="flex gap-1.5 flex-1 justify-center flex-wrap">
                {assessment.questions.map((_: any, i: number) => (
                  <button key={i} onClick={() => setCurrentQuestion(i)}
                    className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${
                      i === currentQuestion
                        ? 'bg-gray-900 text-white'
                        : answers[i] !== -1
                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}>{i + 1}</button>
                ))}
              </div>
              <button
                onClick={() => setCurrentQuestion(p => Math.min(assessment.totalQuestions - 1, p + 1))}
                disabled={currentQuestion === assessment.totalQuestions - 1}
                className="px-5 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:border-gray-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors bg-white"
              >
                Next
              </button>
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
      <div className="flex flex-col" style={{ minHeight: 'calc(100vh - 64px)', background: 'linear-gradient(135deg, #f0f4ff 0%, #faf5ff 50%, #f0fdf4 100%)' }}>
        <div className="flex-1 max-w-4xl w-full mx-auto px-6 py-10">

          {/* Greeting */}
          <div className="flex items-start justify-between mb-10">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 leading-tight mb-1">
                Hi {user?.name?.split(' ')[0] || 'there'}, Ready to
              </h1>
              <h1 className="text-4xl font-bold text-gray-800 leading-tight">
                Prove Your Skills?
              </h1>
              <p className="text-gray-400 text-sm mt-3">AI-powered assessments · Instant results · Shareable badges</p>
            </div>
            <div className="relative flex-shrink-0 mr-8">
              <div className="relative">
                <div className="w-28 h-28 bg-gradient-to-b from-gray-800 to-gray-900 rounded-3xl flex items-center justify-center shadow-2xl relative overflow-hidden">
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex gap-3">
                      <div className="w-4 h-4 bg-cyan-400 rounded-full animate-pulse shadow-lg shadow-cyan-400/50" />
                      <div className="w-4 h-4 bg-cyan-400 rounded-full animate-pulse shadow-lg shadow-cyan-400/50" />
                    </div>
                    <div className="w-8 h-2 bg-cyan-400/60 rounded-full mt-1" />
                  </div>
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-1 h-4 bg-gray-600 rounded-full">
                    <div className="w-2.5 h-2.5 bg-cyan-400 rounded-full -mt-1 -ml-0.5 shadow-lg shadow-cyan-400/50" />
                  </div>
                </div>
                <div className="absolute -left-4 top-8 w-4 h-10 bg-gray-700 rounded-full" />
                <div className="absolute -right-4 top-8 w-4 h-10 bg-gray-700 rounded-full" />
                <div className="absolute -top-2 -right-28 bg-white rounded-2xl px-3 py-2 shadow-lg border border-gray-100 text-xs font-medium text-gray-700 whitespace-nowrap">
                  Let's test your<br />skills! 🚀
                </div>
              </div>
            </div>
          </div>

          {/* Stats cards */}
          {myAssessments.length > 0 && (
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { label: 'Total Taken', value: myAssessments.length, color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100' },
                { label: 'Passed (≥70%)', value: passed, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
                { label: 'Avg Score', value: `${avgScore}%`, color: avgScore >= 70 ? 'text-emerald-600' : 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100' },
              ].map((s, i) => (
                <div key={i} className={`${s.bg} rounded-2xl p-5 border ${s.border} shadow-sm`}>
                  <div className={`text-3xl font-bold ${s.color} mb-1`}>{s.value}</div>
                  <div className="text-xs text-gray-500 font-medium">{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Feature cards — skill categories */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { icon: '⚡', title: 'Test your coding skills with AI-generated questions tailored to your level.', tag: 'Programming', highlight: false },
              { icon: '🧠', title: 'Validate your knowledge in databases, cloud, and system design concepts.', tag: 'Technical Skills', highlight: true },
              { icon: '📊', title: 'Assess your data analysis, visualization, and business intelligence skills.', tag: 'Data & Analytics', highlight: false },
            ].map((card, i) => (
              <div key={i}
                className={`bg-white rounded-2xl p-5 shadow-sm border border-gray-100 ${card.highlight ? 'ring-2 ring-violet-200' : ''} hover:shadow-md transition-shadow cursor-pointer`}
                onClick={() => { setSkillSearch(''); setShowSkillDropdown(true); }}>
                <div className="text-3xl mb-4">{card.icon}</div>
                <p className="text-gray-700 text-sm leading-relaxed mb-4 font-medium">{card.title}</p>
                <span className="text-xs text-gray-400 font-medium">{card.tag}</span>
              </div>
            ))}
          </div>

          {/* Bottom input area */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-8">
            {/* Top hint bar */}
            <div className="flex items-center justify-between px-5 py-2.5 border-b border-gray-50">
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <span className="w-3.5 h-3.5 text-violet-400">⚡</span>
                Choose a skill to start your assessment
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <span>🤖</span>
                Powered by ZyncJobs AI
              </div>
            </div>

            {/* Search input */}
            <div className="flex items-center gap-3 px-5 py-3">
              <span className="text-gray-300 text-lg font-light">+</span>
              <div className="flex-1">
                <input
                  type="text"
                  value={skillSearch}
                  onChange={handleSkillSearch}
                  onFocus={() => setShowSkillDropdown(true)}
                  onBlur={() => setTimeout(() => setShowSkillDropdown(false), 200)}
                  placeholder='Search a skill — e.g. "JavaScript", "Python", "AWS"'
                  className="w-full outline-none text-sm text-gray-700 placeholder-gray-300 bg-transparent"
                />
              </div>
              <Search className="w-4 h-4 text-gray-300 flex-shrink-0" />
              <button
                onClick={startAssessment}
                disabled={!selectedSkill || loading}
                className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex-shrink-0"
              >
                {loading
                  ? <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  : <ArrowLeft className="w-3.5 h-3.5 text-white rotate-180" />}
              </button>
            </div>
            {/* Dropdown outside the flex row to avoid overlap */}
            {showSkillDropdown && filteredSkills.length > 0 && (
              <div className="mx-5 mb-2 z-50 bg-white border border-gray-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                {filteredSkills.map((skill, i) => (
                  <button key={i} type="button" onMouseDown={() => selectSkill(skill)}
                    className="w-full text-left px-4 py-2.5 hover:bg-violet-50 text-sm text-gray-700 border-b last:border-0 transition-colors">
                    {skill}
                  </button>
                ))}
              </div>
            )}

            {/* Popular skill pills */}
            <div className="flex items-center gap-2 px-5 pb-4 flex-wrap">
              {popularSkills.map((skill, i) => (
                <button key={i} type="button" onClick={() => selectSkill(skill)}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                    selectedSkill === skill
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-900 hover:text-white'
                  }`}>
                  {skill}
                </button>
              ))}
            </div>

            {startError && (
              <div className="mx-5 mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{startError}</div>
            )}
          </div>

          {/* My Assessments */}
          {myAssessments.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-base font-bold text-gray-900 mb-4">My Assessments</h2>
              <div className="space-y-3">
                {myAssessments.map((a, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      a.score >= 70 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>{a.skill?.slice(0, 2).toUpperCase()}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-gray-800">{a.skill}</span>
                        <span className={`text-sm font-bold ${a.score >= 70 ? 'text-emerald-600' : 'text-amber-500'}`}>{a.score}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div className={`h-1.5 rounded-full ${a.score >= 70 ? 'bg-emerald-500' : 'bg-amber-400'}`} style={{ width: `${a.score}%` }} />
                      </div>
                    </div>
                    {a.score >= 70 && <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium flex-shrink-0">Passed</span>}
                    {(a.assessmentId || a._id || a.id) && (
                      <button type="button" onClick={() => onNavigate('assessment-review', { assessmentId: a.assessmentId || a._id || a.id })}
                        className="text-xs text-violet-600 hover:text-violet-800 font-medium flex-shrink-0 flex items-center gap-1">
                        Review <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
      <Footer onNavigate={onNavigate} />
    </>
  );
};

export default SkillAssessmentPage;
