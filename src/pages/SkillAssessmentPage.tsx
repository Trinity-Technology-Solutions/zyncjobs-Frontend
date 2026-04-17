import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, ArrowLeft, Search, ExternalLink } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { tokenStorage } from '../utils/tokenStorage';

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
    let token = tokenStorage.getAccess();
    if (!token) return null;
    // Try to refresh if expired
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp * 1000 < Date.now()) {
        const refreshToken = tokenStorage.getRefresh();
        if (!refreshToken) return null;
        const res = await fetch(`${API_BASE_URL}/users/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken })
        });
        if (res.ok) {
          const data = await res.json();
          tokenStorage.setAccess(data.accessToken);
          if (data.refreshToken) tokenStorage.setRefresh(data.refreshToken);
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
    setLoading(true);

    const token = await getAuthToken();
    let data: any = null;
    let backendError = '';

    // Try backend with longer timeout for AI generation
    try {
      console.log(`🚀 Requesting ${selectedSkill} assessment from backend...`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 seconds for AI

      const response = await fetch(`${API_BASE_URL}/skill-assessments/start`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ skill: selectedSkill, questionCount: 10 }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        data = await response.json();
        console.log(`✅ Backend returned ${data.totalQuestions} questions for ${selectedSkill}`);
        // Mark as backend-generated so we can handle submission failures
        data.isBackendGenerated = true;
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        backendError = `Backend error: ${response.status} - ${errorData.error || 'Unknown'}`;
        console.error(backendError, errorData);
      }
    } catch (err: any) {
      // Silently fall back to local questions
      if (err.name === 'AbortError') {
        backendError = 'Backend timeout (15s)';
        console.warn(backendError + ' - using local questions');
      } else if (err.message.includes('Failed to fetch')) {
        backendError = 'Backend not reachable';
        console.warn(backendError + ' - is the backend running on port 5000?');
      } else {
        backendError = err.message;
        console.warn('Backend error:', backendError);
      }
    }

    // Use local questions if backend failed
    if (!data) {
      console.log(`📝 Using local questions for ${selectedSkill}${backendError ? ` (${backendError})` : ''}`);
      data = generateLocalAssessment(selectedSkill);
    }

    setAssessment(data);
    setAnswers(new Array(data.totalQuestions).fill(-1));
    setTimeLeft(data.timeLimit * 60);
    setCurrentQuestion(0);
    setLoading(false);
  };

  const generateLocalAssessment = (skill: string) => {
    const bank: Record<string, any[]> = {
      JavaScript: [
        { question: 'What does `typeof null` return in JavaScript?', options: ['null', 'undefined', 'object', 'string'], correct: 2 },
        { question: 'Which method removes the last element from an array?', options: ['shift()', 'pop()', 'splice()', 'slice()'], correct: 1 },
        { question: 'What is a closure in JavaScript?', options: ['A loop construct', 'A function with access to its outer scope', 'An error handler', 'A class method'], correct: 1 },
        { question: 'What does `===` check?', options: ['Value only', 'Type only', 'Value and type', 'Reference'], correct: 2 },
        { question: 'Which keyword declares a block-scoped variable?', options: ['var', 'let', 'function', 'const only'], correct: 1 },
        { question: 'What does `Array.prototype.map()` return?', options: ['The original array', 'A new array', 'undefined', 'A boolean'], correct: 1 },
        { question: 'What is the event loop in JavaScript?', options: ['A for loop', 'A mechanism to handle async operations', 'A DOM event', 'A CSS animation'], correct: 1 },
        { question: 'Which of these is NOT a JavaScript data type?', options: ['Symbol', 'BigInt', 'Float', 'undefined'], correct: 2 },
        { question: 'What does `Promise.all()` do?', options: ['Runs promises sequentially', 'Runs all promises in parallel and waits for all', 'Returns the first resolved', 'Cancels all promises'], correct: 1 },
        { question: 'What is hoisting?', options: ['Moving code to the server', 'Variable/function declarations moved to top of scope', 'A CSS property', 'An async pattern'], correct: 1 },
      ],
      Python: [
        { question: 'What is the output of `type([])`?', options: ['list', '<class list>', "<class 'list'>", 'array'], correct: 2 },
        { question: 'Which keyword is used to define a function in Python?', options: ['function', 'def', 'fun', 'lambda'], correct: 1 },
        { question: 'What does `len([1,2,3])` return?', options: ['2', '3', '4', 'Error'], correct: 1 },
        { question: 'What is a list comprehension?', options: ['A loop', 'A concise way to create lists', 'A dictionary method', 'A class'], correct: 1 },
        { question: 'Which of these is immutable in Python?', options: ['list', 'dict', 'tuple', 'set'], correct: 2 },
        { question: 'What does `*args` do in a function?', options: ['Passes keyword args', 'Passes variable positional args', 'Multiplies args', 'Unpacks a dict'], correct: 1 },
        { question: 'What is a decorator in Python?', options: ['A CSS concept', 'A function that wraps another function', 'A class attribute', 'A loop modifier'], correct: 1 },
        { question: 'What does `__init__` do?', options: ['Destroys an object', 'Initializes a class instance', 'Imports a module', 'Defines a static method'], correct: 1 },
        { question: 'Which module is used for regular expressions?', options: ['regex', 're', 'regexp', 'pattern'], correct: 1 },
        { question: 'What is GIL in Python?', options: ['Global Import Lock', 'Global Interpreter Lock', 'General Input Layer', 'Graph Interface Library'], correct: 1 },
      ],
      React: [
        { question: 'What hook is used for side effects in React?', options: ['useState', 'useEffect', 'useContext', 'useRef'], correct: 1 },
        { question: 'What does JSX stand for?', options: ['JavaScript XML', 'Java Syntax Extension', 'JSON XML', 'JavaScript Extension'], correct: 0 },
        { question: 'What is the virtual DOM?', options: ['A real browser DOM', 'A lightweight copy of the DOM', 'A CSS framework', 'A database'], correct: 1 },
        { question: 'Which hook manages local component state?', options: ['useEffect', 'useContext', 'useState', 'useReducer'], correct: 2 },
        { question: 'What is a React key used for?', options: ['Styling', 'Identifying list items uniquely', 'Event handling', 'API calls'], correct: 1 },
        { question: 'What is prop drilling?', options: ['A build tool', 'Passing props through many component levels', 'A CSS technique', 'A testing method'], correct: 1 },
        { question: 'What does `useCallback` do?', options: ['Fetches data', 'Memoizes a function', 'Creates a ref', 'Manages state'], correct: 1 },
        { question: 'What is React Context used for?', options: ['Routing', 'Global state sharing without prop drilling', 'Styling', 'Testing'], correct: 1 },
        { question: 'What is a controlled component?', options: ['A component with no state', 'A form element whose value is controlled by React state', 'A class component', 'A pure component'], correct: 1 },
        { question: 'What does `React.memo` do?', options: ['Stores data', 'Prevents re-render if props unchanged', 'Creates a context', 'Handles errors'], correct: 1 },
      ],
    };

    const questions = (bank[skill] || bank['JavaScript']).map((q, i) => ({
      id: i + 1,
      question: q.question,
      options: q.options,
      correctAnswer: q.correct,
    }));

    return {
      assessmentId: `local-${Date.now()}`,
      skill,
      questions,
      totalQuestions: questions.length,
      timeLimit: 30,
      isLocal: true,
    };
  };

  const submitAssessment = async () => {
    try {
      setLoading(true);
      
      // Calculate score locally
      const correctAnswers = answers.reduce((count, answer, index) => {
        if (answer === assessment.questions[index].correctAnswer) {
          return count + 1;
        }
        return count;
      }, 0);
      
      const score = Math.round((correctAnswers / assessment.totalQuestions) * 100);
      
      // If this is a local assessment, show result immediately
      if (assessment.isLocal || assessment.assessmentId.startsWith('local-')) {
        // Store in localStorage for review page
        const localAssessmentId = assessment.assessmentId.startsWith('local-') 
          ? assessment.assessmentId 
          : `local-${Date.now()}`;
        const localResult = {
          assessmentId: localAssessmentId,
          skill: assessment.skill,
          score,
          correctAnswers,
          totalQuestions: assessment.totalQuestions,
          timeSpent: 1800 - timeLeft,
          isPractice: true,
          questions: assessment.questions.map((q: any, i: number) => ({
            ...q,
            userAnswer: answers[i]
          })),
          completedAt: new Date().toISOString()
        };
        const storageKey = `assessment_${localAssessmentId}`;
        localStorage.setItem(storageKey, JSON.stringify(localResult));
        console.log('💾 Saved assessment to localStorage:', storageKey);
        console.log('Data:', localResult);
        
        // Verify it was saved
        const verify = localStorage.getItem(storageKey);
        console.log('✅ Verification - Data exists in localStorage:', !!verify);
        
        setResult({
          assessmentId: localAssessmentId,
          skill: assessment.skill,
          score,
          correctAnswers,
          totalQuestions: assessment.totalQuestions,
          timeSpent: 1800 - timeLeft,
          isPractice: true
        });
        setAssessment(null);
        setLoading(false);
        
        // Navigate to review page after 2.5 seconds (give time for localStorage to sync)
        setTimeout(() => {
          console.log('👉 Navigating to review page with ID:', localAssessmentId);
          onNavigate('assessment-review', { assessmentId: localAssessmentId });
        }, 2500);
        return;
      }
      
      // Try to submit to backend
      const token = await getAuthToken();
      if (!token) {
        console.warn('No auth token, treating as local assessment');
        throw new Error('No authentication token');
      }
      
      const response = await fetch(`${API_BASE_URL}/skill-assessments/submit/${assessment.assessmentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ answers, timeSpent: 1800 - timeLeft })
      });
      
      if (response.status === 404) {
        // Assessment not found in backend, treat as local
        console.warn('Assessment not found in backend (404), converting to local assessment');
        // Convert to local assessment
        const localAssessmentId = `local-${Date.now()}`;
        const correctAnswers = answers.reduce((count, answer, index) => 
          answer === assessment.questions[index].correctAnswer ? count + 1 : count, 0);
        const score = Math.round((correctAnswers / assessment.totalQuestions) * 100);
        
        const localResult = {
          assessmentId: localAssessmentId,
          skill: assessment.skill,
          score,
          correctAnswers,
          totalQuestions: assessment.totalQuestions,
          timeSpent: 1800 - timeLeft,
          isPractice: true,
          questions: assessment.questions.map((q: any, i: number) => ({ ...q, userAnswer: answers[i] })),
          completedAt: new Date().toISOString()
        };
        
        localStorage.setItem(`assessment_${localAssessmentId}`, JSON.stringify(localResult));
        console.log('💾 Saved as local assessment:', localAssessmentId);
        
        setResult({
          assessmentId: localAssessmentId,
          skill: assessment.skill,
          score,
          correctAnswers,
          totalQuestions: assessment.totalQuestions,
          timeSpent: 1800 - timeLeft,
          isPractice: true
        });
        setAssessment(null);
        setLoading(false);
        
        setTimeout(() => {
          console.log('👉 Navigating to review page with ID:', localAssessmentId);
          onNavigate('assessment-review', { assessmentId: localAssessmentId });
        }, 2500);
        return;
      }
      
      if (!response.ok) throw new Error('Failed to submit');
      
      const data = await response.json();
      setResult(data);
      setAssessment(null);
      fetchMyAssessments();
      setTimeout(() => onNavigate('assessment-review', { assessmentId: data.assessmentId }), 2000);
    } catch (err) {
      console.error('Submit error:', err);
      // On error, calculate and show local result
      const localAssessmentId = `local-${Date.now()}`;
      const correctAnswers = answers.reduce((count, answer, index) => {
        if (answer === assessment.questions[index].correctAnswer) {
          return count + 1;
        }
        return count;
      }, 0);
      const score = Math.round((correctAnswers / assessment.totalQuestions) * 100);
      
      const localResult = {
        assessmentId: localAssessmentId,
        skill: assessment.skill,
        score,
        correctAnswers,
        totalQuestions: assessment.totalQuestions,
        timeSpent: 1800 - timeLeft,
        isPractice: true,
        questions: assessment.questions.map((q: any, i: number) => ({
          ...q,
          userAnswer: answers[i]
        })),
        completedAt: new Date().toISOString()
      };
      const storageKey = `assessment_${localAssessmentId}`;
      localStorage.setItem(storageKey, JSON.stringify(localResult));
      console.log('💾 Saved local assessment after error:', storageKey);
      
      setResult({
        assessmentId: localAssessmentId,
        skill: assessment.skill,
        score,
        correctAnswers,
        totalQuestions: assessment.totalQuestions,
        timeSpent: 1800 - timeLeft,
        isPractice: true
      });
      setAssessment(null);
      setTimeout(() => {
        console.log('👉 Navigating to review page with ID:', localAssessmentId);
        onNavigate('assessment-review', { assessmentId: localAssessmentId });
      }, 2500);
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
        <div className="min-h-screen flex items-center justify-center py-8 bg-white">
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

          {/* Back button */}
          <button
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>

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