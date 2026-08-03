import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Users, Brain, Clock, ChevronDown, ChevronUp, Star, Zap, Target, Award, CheckCircle, Play, BookOpen, Mic, Video, ThumbsUp, Send, Bot, User, RefreshCw, RotateCcw } from 'lucide-react';
import BackButton from '../components/BackButton';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { executeAI } from '../services/aiChatService';

interface InterviewTipsPageProps {
  onNavigate: (page: string) => void;
  user?: any;
  onLogout?: () => void;
}

// ─── Interview Simulation ─────────────────────────────────────────────────────

const JOB_ROLES = [
  'Frontend Developer', 'Backend Developer', 'Full Stack Developer',
  'Data Scientist', 'Product Manager', 'UI/UX Designer',
  'DevOps Engineer', 'Business Analyst', 'Marketing Manager',
  'Sales Executive', 'HR Manager', 'Graphic Designer',
];

const DIFFICULTY = [
  { id: 'easy', label: 'Fresher', color: 'bg-green-100 text-green-700 border-green-300' },
  { id: 'medium', label: 'Mid-Level', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
  { id: 'hard', label: 'Senior', color: 'bg-red-100 text-red-700 border-red-300' },
];

interface SimMessage { role: 'ai' | 'user'; content: string; score?: number; feedback?: string; }

const stripMarkdown = (text: string): string =>
  text
    .replace(/\*\*(.+?)\*\*/g, '$1')   // **bold**
    .replace(/\*(.+?)\*/g, '$1')        // *italic*
    .replace(/#{1,6}\s+/g, '')          // ## headings
    .replace(/`(.+?)`/g, '$1')          // `code`
    .replace(/^[-*]\s+/gm, '')          // bullet points
    .replace(/\n{3,}/g, '\n\n')         // excess newlines
    .trim();

function SimulationTab({ user }: { user?: any }) {
  const [step, setStep] = useState<'setup' | 'interview' | 'report'>('setup');
  const [role, setRole] = useState('');
  const [customRole, setCustomRole] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [messages, setMessages] = useState<SimMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const [scores, setScores] = useState<number[]>([]);
  const [feedbacks, setFeedbacks] = useState<string[]>([]);
  const chatRef = useRef<HTMLDivElement>(null);
  const MAX_QUESTIONS = 5;

  useEffect(() => {
    if (chatRef.current && messages.length > 0) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, loading]);

  const selectedRole = role === 'custom' ? customRole : role;

  const systemPrompt = `You are a strict professional interviewer conducting a ${difficulty === 'easy' ? 'fresher-level' : difficulty === 'medium' ? 'mid-level' : 'senior-level'} interview for a ${selectedRole} position.

SCORING RULES (strictly enforce):
- 9-10: Exceptional, detailed, structured answer with real examples
- 7-8: Good answer with relevant content and some detail
- 5-6: Partial answer, vague or missing key points
- 3-4: Poor answer, mostly irrelevant or very incomplete
- 1-2: Gibberish, random text, single words, or completely off-topic
- NEVER give above 4 for answers that are random characters, keyboard mash, or unrelated to the question

Format rules:
1. Ask ONE interview question at a time.
2. After each answer, respond in this EXACT format:
   SCORE: X/10
   FEEDBACK: [2-3 sentence honest feedback — call out weak answers directly]
   NEXT_QUESTION: [your next question]
3. After ${MAX_QUESTIONS} questions, replace NEXT_QUESTION with:
   INTERVIEW_COMPLETE
   FINAL_FEEDBACK: [overall honest assessment]
4. Keep questions relevant to ${selectedRole} role.
5. Start with "Tell me about yourself" as the first question.`;

  const startInterview = async () => {
    if (!selectedRole.trim()) return;
    setStep('interview');
    setLoading(true);
    setMessages([]);
    setQuestionCount(0);
    setScores([]);
    setFeedbacks([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      const data = await executeAI(
        `interview: Begin the interview for ${selectedRole} role. Ask the first question.`,
        { systemPrompt, user_preferences: { systemPrompt } }
      );
      const raw = (data as any).result?.reply || (data as any).result?.advice || '';
      const nextMatch = raw.match(/NEXT_QUESTION:\s*([\s\S]+)/);
      const reply = nextMatch
        ? stripMarkdown(nextMatch[1].trim())
        : (raw.includes('SCORE:') ? `Tell me about yourself and what draws you to the ${selectedRole} role.` : stripMarkdown(raw) || `Tell me about yourself and what draws you to the ${selectedRole} role.`);
      setMessages([{ role: 'ai', content: reply }]);
      setQuestionCount(1);
    } catch {
      setMessages([{ role: 'ai', content: `Tell me about yourself and what draws you to the ${selectedRole} role.` }]);
      setQuestionCount(1);
    } finally {
      setLoading(false);
    }
  };

  const isGarbageAnswer = (text: string): boolean => {
    const t = text.trim();
    if (t.length < 10) return true;
    // High ratio of non-alphabetic characters (keyboard mash)
    const alphaRatio = (t.match(/[a-zA-Z]/g) || []).length / t.length;
    if (alphaRatio < 0.5) return true;
    // Very few unique words (repetition or single word repeated)
    const words = t.toLowerCase().split(/\s+/).filter(Boolean);
    if (words.length < 3) return true;
    const uniqueWords = new Set(words);
    if (uniqueWords.size === 1) return true;
    // Detect random character sequences (no real words — avg word length > 10)
    const avgWordLen = words.reduce((s, w) => s + w.length, 0) / words.length;
    if (avgWordLen > 10) return true;
    return false;
  };

  const sendAnswer = async () => {
    const answer = input.trim();
    if (!answer || loading) return;
    setInput('');

    const userMsg: SimMessage = { role: 'user', content: answer };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setLoading(true);

    // Frontend guard: detect garbage before calling AI
    if (isGarbageAnswer(answer)) {
      const garbageScore = 1;
      const garbageFeedback = 'This response does not appear to be a valid answer. Please provide a thoughtful, relevant response to the question.';
      const newScores = [...scores, garbageScore];
      const newFeedbacks = [...feedbacks, garbageFeedback];
      setScores(newScores);
      setFeedbacks(newFeedbacks);
      const isComplete = newScores.length >= MAX_QUESTIONS;
      if (isComplete) {
        setMessages(prev => [...prev, { role: 'ai', content: `✅ Interview Complete!\n\nYour responses need significant improvement. Please prepare properly and try again.`, score: garbageScore, feedback: garbageFeedback }]);
        setStep('report');
      } else {
        setMessages(prev => [...prev, { role: 'ai', content: `Score: 1/10 — That doesn't seem like a valid answer. Please try to respond properly.\n\nLet's continue. ${messages.filter(m => m.role === 'ai').slice(-1)[0]?.content || 'Please answer the question.'}`, score: garbageScore, feedback: garbageFeedback }]);
        setQuestionCount(q => q + 1);
      }
      setLoading(false);
      return;
    }

    try {
      const history = updated.map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.content }));
      const data = await executeAI(`interview: ${answer}`, { systemPrompt, history, user_preferences: { systemPrompt, history } });
      const reply: string = (data as any).result?.reply || (data as any).result?.advice || '';

      // Parse score and feedback
      const scoreMatch = reply.match(/SCORE:\s*(\d+)\/10/);
      const feedbackMatch = reply.match(/FEEDBACK:\s*([^\n]+(?:\n(?!NEXT_QUESTION|INTERVIEW_COMPLETE)[^\n]+)*)/);
      const score = scoreMatch ? parseInt(scoreMatch[1]) : 7;
      const feedback = feedbackMatch ? stripMarkdown(feedbackMatch[1].trim()) : '';

      const newScores = [...scores, ...(scoreMatch ? [score] : [])];
      const newFeedbacks = [...feedbacks, ...(feedback ? [feedback] : [])];
      setScores(newScores);
      setFeedbacks(newFeedbacks);

      const isComplete = reply.includes('INTERVIEW_COMPLETE') || newScores.length >= MAX_QUESTIONS
        || reply.includes('overallScore') || reply.includes('recommendation') || reply.includes('Candidate Evaluation');

      if (isComplete) {
        const finalFeedbackMatch = reply.match(/FINAL_FEEDBACK:\s*([\s\S]+)/);
        const finalFeedback = finalFeedbackMatch
          ? stripMarkdown(finalFeedbackMatch[1].trim())
          : (reply.includes('SCORE:') || reply.includes('overallScore') || reply.includes('recommendation'))
            ? 'Interview complete. Please review your performance above.'
            : 'Great effort! Review your answers above.';
        setMessages(prev => [...prev, { role: 'ai', content: `✅ Interview Complete!\n\n${finalFeedback}`, score, feedback }]);
        setStep('report');
      } else {
        const nextMatch = reply.match(/NEXT_QUESTION:\s*([\s\S]+)/);
        const isWrongIntent = !nextMatch && (reply.includes('search_strategy') || reply.includes('screening_questions') || reply.includes('evaluation_criteria'));
        const nextQ = isWrongIntent
          ? `Let's continue. ${messages.filter(m => m.role === 'ai').slice(-1)[0]?.content || 'Please answer the previous question.'}`
          : nextMatch ? stripMarkdown(nextMatch[1].trim()) : stripMarkdown(reply);
        // Score/feedback on evaluation message, next question as clean separate message
        setMessages(prev => [
          ...prev,
          { role: 'ai', content: '', score, feedback },
          { role: 'ai', content: nextQ },
        ]);
        setQuestionCount(q => q + 1);
      }
    } catch {
      if (scores.length >= MAX_QUESTIONS) {
        setStep('report');
      } else {
        const fallbackQuestions: Record<string, string[]> = {
          default: [
            'Can you describe a challenging project you worked on and how you handled it?',
            'What are your key technical skills and how have you applied them?',
            'Where do you see yourself in the next 3 years?',
            'How do you handle tight deadlines or pressure at work?',
            'Tell me about a time you worked in a team and faced a conflict.',
          ],
        };
        const pool = fallbackQuestions.default;
        const nextFallback = pool[Math.min(scores.length, pool.length - 1)];
        setMessages(prev => [...prev, { role: 'ai', content: nextFallback }]);
        setQuestionCount(q => q + 1);
      }
    } finally {
      setLoading(false);
    }
  };

  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const getScoreColor = (s: number) => s >= 8 ? 'text-green-600' : s >= 6 ? 'text-yellow-600' : 'text-red-600';
  const getScoreBg = (s: number) => s >= 8 ? 'bg-green-50 border-green-200' : s >= 6 ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200';

  // ── Setup Screen ──────────────────────────────────────────────────────────────
  if (step === 'setup') return (
    <div className="max-w-3xl mx-auto">
      <div className="relative bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 mb-6 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-5 right-5 w-40 h-40 bg-indigo-400 rounded-full blur-3xl" />
          <div className="absolute bottom-5 left-5 w-60 h-60 bg-purple-400 rounded-full blur-3xl" />
        </div>
        <div className="relative flex items-center gap-4">
          <div className="w-14 h-14 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/10">
            <Brain className="w-7 h-7 text-indigo-300" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">AI Mock Interview</h2>
            <p className="text-indigo-300/80 text-sm">Practice with AI — get scored & feedback instantly</p>
          </div>
          <div className="ml-auto hidden sm:flex items-center gap-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-2">
            <Clock className="w-4 h-4 text-indigo-300" />
            <span className="text-indigo-200 text-xs font-medium">~{MAX_QUESTIONS * 3} min</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-7">
        {/* Role Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-3">Select Job Role</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-3">
            {JOB_ROLES.map(r => (
              <button key={r} onClick={() => setRole(r)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-all text-left ${
                  role === r ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-gray-50 border-gray-100 text-gray-700 hover:border-indigo-200 hover:bg-indigo-50/50'
                }`}>
                {r}
              </button>
            ))}
            <button onClick={() => setRole('custom')}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                role === 'custom' ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'border-dashed border-gray-200 text-gray-500 hover:border-indigo-200 hover:bg-indigo-50/50'
              }`}>
              + Custom Role
            </button>
          </div>
          {role === 'custom' && (
            <input
              type="text" placeholder="Enter your job role..."
              value={customRole} onChange={e => setCustomRole(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 bg-gray-50"
            />
          )}
        </div>

        {/* Difficulty */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-3">Experience Level</label>
          <div className="flex gap-3">
            {DIFFICULTY.map(d => (
              <button key={d.id} onClick={() => setDifficulty(d.id)}
                className={`flex-1 py-3 rounded-xl text-sm font-medium border transition-all ${
                  difficulty === d.id ? d.color + ' border-2 shadow-sm' : 'border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-200'
                }`}>
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* What to expect */}
        <div className="bg-gradient-to-br from-gray-50 to-indigo-50/30 rounded-2xl p-5 border border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">What to expect</p>
          <div className="grid sm:grid-cols-2 gap-2.5">
            {[
              { icon: MessageSquare, text: `${MAX_QUESTIONS} role-specific questions` },
              { icon: Star, text: 'AI scores each answer out of 10' },
              { icon: Zap, text: 'Instant feedback after every answer' },
              { icon: Award, text: 'Final performance report' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-gray-50">
                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-4 h-4 text-indigo-600" />
                </div>
                <span className="text-sm text-gray-700">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={startInterview}
          disabled={!selectedRole.trim()}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3.5 rounded-2xl font-semibold hover:from-indigo-700 hover:to-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
        >
          <Play className="w-4 h-4" /> Start Mock Interview
        </button>
      </div>
    </div>
  );

  // ── Report Screen ─────────────────────────────────────────────────────────────
  if (step === 'report') return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Score Hero */}
      <div className="relative bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 text-center overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-60 h-60 bg-indigo-400 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-400 rounded-full blur-3xl" />
        </div>
        <div className="relative">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full border-4 border-white/20 mb-4">
            <span className={`text-4xl font-black ${avgScore >= 8 ? 'text-emerald-400' : avgScore >= 6 ? 'text-yellow-400' : 'text-red-400'}`}>
              {avgScore}
            </span>
            <span className="text-white/40 text-xl mt-3">/10</span>
          </div>
          <p className="text-2xl font-bold text-white mb-1">
            {avgScore >= 8 ? 'Excellent Performance!' : avgScore >= 6 ? 'Good Job!' : 'Keep Practicing!'}
          </p>
          <p className="text-indigo-300/70 text-sm">{selectedRole} · {DIFFICULTY.find(d => d.id === difficulty)?.label}</p>
        </div>
      </div>

      {/* Per-question breakdown */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-5">Question-by-Question Breakdown</h3>
        <div className="space-y-4">
          {scores.map((s, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                s >= 8 ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : s >= 6 ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-red-50 text-red-600 border border-red-200'
              }`}>{s}/10</div>
              <div className="flex-1">
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div className={`h-2.5 rounded-full transition-all ${
                    s >= 8 ? 'bg-emerald-500' : s >= 6 ? 'bg-amber-500' : 'bg-red-500'
                  }`} style={{ width: `${s * 10}%` }} />
                </div>
                {feedbacks[i] && <p className="text-xs text-gray-500 mt-1.5">{feedbacks[i]}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={() => { setStep('setup'); }}
          className="flex-1 border border-gray-200 text-gray-700 py-3.5 rounded-2xl font-medium hover:bg-gray-50 transition-all flex items-center justify-center gap-2">
          <RotateCcw className="w-4 h-4" /> New Interview
        </button>
        <button onClick={() => { setStep('interview'); startInterview(); }}
          className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3.5 rounded-2xl font-medium hover:from-indigo-700 hover:to-purple-700 transition-all flex items-center justify-center gap-2 shadow-md">
          <RefreshCw className="w-4 h-4" /> Retry Same Role
        </button>
      </div>
    </div>
  );

  // ── Interview Chat Screen ─────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto flex flex-col bg-slate-900 rounded-3xl overflow-hidden shadow-xl" style={{ height: '75vh' }}>
      {/* Header */}
      <div className="flex items-center justify-between bg-slate-800/80 backdrop-blur-sm px-5 py-3.5 border-b border-slate-700/50 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{selectedRole} Interview</p>
            <p className="text-xs text-slate-400">Question {Math.min(questionCount, MAX_QUESTIONS)} of {MAX_QUESTIONS}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {scores.length > 0 && (
            <div className="flex items-center gap-2 bg-slate-700/50 rounded-xl px-3 py-1.5">
              <Star className="w-3.5 h-3.5 text-yellow-400" />
              <span className={`text-sm font-bold ${getScoreColor(Math.round(scores.reduce((a,b)=>a+b,0)/scores.length))}`}>
                {Math.round(scores.reduce((a,b)=>a+b,0)/scores.length)}/10
              </span>
            </div>
          )}
          <div className="flex gap-1.5">
            {Array.from({ length: MAX_QUESTIONS }).map((_, i) => (
              <div key={i} className={`w-2.5 h-2.5 rounded-full ${
                i < scores.length ? (scores[i] >= 7 ? 'bg-emerald-500' : 'bg-amber-500') :
                i === scores.length ? 'bg-indigo-400 animate-pulse' : 'bg-slate-600'
              }`} />
            ))}
          </div>
        </div>
      </div>

      {/* Chat messages */}
      <div ref={chatRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-slate-900">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center ${
              msg.role === 'ai' ? 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20' : 'bg-slate-700'
            }`}>
              {msg.role === 'ai' ? <Bot className="w-4 h-4 text-white" /> : <User className="w-4 h-4 text-white" />}
            </div>
            <div className={`max-w-[75%] space-y-2`}>
              {msg.content.length > 0 && (
                <div className={`px-5 py-3.5 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'ai'
                    ? 'bg-slate-800 border border-slate-700/50 text-slate-100 rounded-tl-sm shadow-sm'
                    : 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-tr-sm shadow-lg shadow-indigo-500/10'
                }`}>
                  {msg.content}
                </div>
              )}
              {msg.role === 'ai' && msg.score !== undefined && (
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border ${
                  msg.score >= 8 ? 'bg-emerald-900/30 border-emerald-700/30 text-emerald-300' :
                  msg.score >= 6 ? 'bg-amber-900/30 border-amber-700/30 text-amber-300' :
                  'bg-red-900/30 border-red-700/30 text-red-300'
                }`}>
                  <span className="font-bold text-sm">{msg.score}/10</span>
                  {msg.feedback && <span className="text-xs opacity-80">{msg.feedback.slice(0, 80)}{msg.feedback.length > 80 ? '...' : ''}</span>}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/20">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-slate-800 border border-slate-700/50 px-5 py-3.5 rounded-2xl shadow-sm">
              <div className="flex gap-1.5">
                {[0,200,400].map(d => <span key={d} className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="bg-slate-800/80 backdrop-blur-sm border-t border-slate-700/50 p-4 flex-shrink-0">
        <div className="flex gap-3">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAnswer(); } }}
            placeholder="Type your answer here... (Enter to send)"
            rows={1}
            className="flex-1 bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 resize-none"
          />
          <button onClick={sendAnswer} disabled={!input.trim() || loading}
            className="w-11 h-11 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center hover:from-indigo-600 hover:to-purple-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all self-end shadow-lg shadow-indigo-500/20">
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}

const InterviewTipsPage: React.FC<InterviewTipsPageProps> = ({ onNavigate, user, onLogout }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'tips' | 'questions' | 'star' | 'simulate'>('tips');
  const simulateRef = useRef<HTMLDivElement>(null);

  const phases = [
    {
      step: '01',
      icon: BookOpen,
      title: 'Research & Prepare',
      color: 'from-blue-500 to-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-700',
      tips: ['Study company mission, products & recent news', 'Understand the job description deeply', 'Research your interviewers on LinkedIn', 'Prepare 5–7 achievement stories'],
    },
    {
      step: '02',
      icon: Mic,
      title: 'During the Interview',
      color: 'from-purple-500 to-purple-600',
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      text: 'text-purple-700',
      tips: ['Use STAR method for behavioral questions', 'Listen carefully before answering', 'Show enthusiasm and positive energy', 'Ask clarifying questions when needed'],
    },
    {
      step: '03',
      icon: MessageSquare,
      title: 'Ask Smart Questions',
      color: 'from-emerald-500 to-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-700',
      tips: ['What does success look like in 90 days?', 'What are the biggest team challenges?', 'How do you support professional growth?', 'What do you love most about working here?'],
    },
    {
      step: '04',
      icon: Clock,
      title: 'Follow Up',
      color: 'from-orange-500 to-orange-600',
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      text: 'text-orange-700',
      tips: ['Send thank-you email within 24 hours', 'Reference specific conversation points', 'Reiterate your enthusiasm for the role', 'Connect on LinkedIn with a personal note'],
    },
  ];

  const commonQuestions = [
    { q: 'Tell me about yourself', hint: 'Keep it 90 seconds — present, past, future formula', tag: 'Opening' },
    { q: 'Why do you want this job?', hint: 'Show genuine research + align your goals with theirs', tag: 'Motivation' },
    { q: 'What are your strengths?', hint: 'Pick 2–3 relevant to the role with real examples', tag: 'Self-awareness' },
    { q: 'What is your biggest weakness?', hint: 'Be honest, show self-awareness + what you\'re doing to improve', tag: 'Self-awareness' },
    { q: 'Where do you see yourself in 5 years?', hint: 'Align with company growth, show ambition without arrogance', tag: 'Goals' },
    { q: 'Why are you leaving your current job?', hint: 'Stay positive — focus on growth, never badmouth', tag: 'Transition' },
    { q: 'Tell me about a challenge you overcame', hint: 'Use STAR method with a measurable outcome', tag: 'Behavioral' },
    { q: 'What is your expected salary?', hint: 'Research market rates, give a range, not a fixed number', tag: 'Negotiation' },
  ];

  const starExamples = [
    { letter: 'S', label: 'Situation', color: 'bg-blue-500', desc: 'Set the scene — what was the context?', example: '"Our team was behind on a critical product launch with 2 weeks to go..."' },
    { letter: 'T', label: 'Task', color: 'bg-purple-500', desc: 'What was your responsibility?', example: '"I was responsible for coordinating 3 teams and ensuring delivery..."' },
    { letter: 'A', label: 'Action', color: 'bg-emerald-500', desc: 'What specific steps did YOU take?', example: '"I created a daily standup, identified blockers, and re-prioritized tasks..."' },
    { letter: 'R', label: 'Result', color: 'bg-orange-500', desc: 'What was the measurable outcome?', example: '"We launched on time, increasing Q3 revenue by 18%..."' },
  ];

  const stats = [
    { value: '93%', label: 'of hiring decisions are made in the first 5 minutes', icon: Zap },
    { value: '70%', label: 'of candidates fail due to poor preparation', icon: Target },
    { value: '3x', label: 'more likely to get hired with STAR method answers', icon: Award },
  ];

  const tagColors: Record<string, string> = {
    Opening: 'bg-blue-100 text-blue-700',
    Motivation: 'bg-purple-100 text-purple-700',
    'Self-awareness': 'bg-emerald-100 text-emerald-700',
    Goals: 'bg-orange-100 text-orange-700',
    Transition: 'bg-pink-100 text-pink-700',
    Behavioral: 'bg-indigo-100 text-indigo-700',
    Negotiation: 'bg-yellow-100 text-yellow-700',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />

      {/* Hero */}
      <div className="relative bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 overflow-hidden">
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-8 left-1/4 w-80 h-80 bg-indigo-500 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500 rounded-full blur-[120px]" />
          <div className="absolute top-1/2 right-10 w-64 h-64 bg-pink-500 rounded-full blur-[80px]" />
        </div>
        <div className="relative max-w-5xl mx-auto px-4 py-24 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/10 rounded-full px-5 py-2 text-indigo-200 text-sm mb-8 shadow-lg">
            <Mic className="w-4 h-4" /> Interview Mastery Guide
          </div>
          <h1 className="text-5xl sm:text-6xl font-black text-white mb-5 leading-[1.1] tracking-tight">
            Ace Every <br className="sm:hidden" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300">Interview</span>
          </h1>
          <p className="text-lg sm:text-xl text-indigo-200/70 max-w-2xl mx-auto mb-10 leading-relaxed">
            Proven strategies, real examples, and expert tips to land your dream job with confidence.
          </p>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
            {stats.map((s, i) => (
              <div key={i} className="bg-white/[0.07] backdrop-blur-sm border border-white/10 rounded-2xl px-7 py-5 text-center min-w-[160px] hover:bg-white/[0.10] transition-colors">
                <s.icon className="w-5 h-5 text-indigo-300 mx-auto mb-2" />
                <div className="text-3xl sm:text-4xl font-black text-white mb-1">{s.value}</div>
                <div className="text-indigo-200/60 text-xs leading-relaxed">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Back */}
        <BackButton onClick={() => onNavigate('home')} className="mb-6" />

        {/* Tabs */}
        <div className="mb-10">
          <div className="inline-flex gap-1 bg-white rounded-2xl p-1.5 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.06),0_1px_2px_-1px_rgba(0,0,0,0.04)] border border-gray-100/80 flex-wrap">
            {[
              { key: 'tips', label: 'Tips', icon: Star },
              { key: 'questions', label: 'Questions', icon: MessageSquare },
              { key: 'star', label: 'STAR Method', icon: Target },
              { key: 'simulate', label: 'Mock Interview', icon: Brain },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key as any);
                  setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
                }}
                className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === tab.key
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-200'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <tab.icon className={`w-4 h-4 ${activeTab === tab.key ? '' : 'text-gray-400'}`} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tips Tab */}
        {activeTab === 'tips' && (
          <div className="space-y-8">
            <div className="grid md:grid-cols-2 gap-6">
              {phases.map((phase, i) => (
                <div key={i} className="group bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
                  <div className={`bg-gradient-to-r ${phase.color} p-5 flex items-center gap-4 relative overflow-hidden`}>
                    <div className="absolute right-0 top-0 w-24 h-24 bg-white/5 rounded-full -mr-8 -mt-8" />
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
                      <phase.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-white/50 text-xs font-bold tracking-[0.15em]">STEP {phase.step}</div>
                      <div className="text-white font-bold text-lg">{phase.title}</div>
                    </div>
                  </div>
                  <div className="p-5 space-y-3.5">
                    {phase.tips.map((tip, j) => (
                      <div key={j} className="flex items-start gap-3">
                        <CheckCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${phase.text}`} />
                        <span className="text-gray-600 text-sm leading-relaxed">{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Pro Tips Banner */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/60 rounded-2xl p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-400 rounded-xl flex items-center justify-center shadow-sm">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 text-lg">Pro Tips from Hiring Managers</h3>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  { icon: Video, tip: 'Test your camera, mic & lighting 30 min before every virtual interview' },
                  { icon: ThumbsUp, tip: 'Mirror the interviewer\'s energy — match their pace and formality level' },
                  { icon: Users, tip: 'Print 3 copies of your resume even if they have it digitally' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3.5 bg-white/70 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-white">
                    <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-4.5 h-4.5 text-amber-600" />
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{item.tip}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Questions Tab */}
        {activeTab === 'questions' && (
          <div>
            <div className="flex items-center gap-3 mb-7">
              <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-sm">
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-lg">Common Interview Questions</h2>
                <p className="text-gray-500 text-sm">Click any question to see the expert hint.</p>
              </div>
            </div>
            <div className="space-y-2.5">
              {commonQuestions.map((item, i) => (
                <div
                  key={i}
                  className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all duration-200 cursor-pointer ${
                    openFaq === i ? 'shadow-md border-indigo-100' : 'hover:shadow-md hover:border-gray-200'
                  }`}
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <div className="flex items-center justify-between p-4 sm:p-5">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0 transition-colors ${
                        openFaq === i ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : 'bg-gray-200 text-gray-500'
                      }`}>
                        {String(i + 1).padStart(2, '0')}
                      </div>
                      <div className="min-w-0">
                        <span className="font-semibold text-gray-900 text-sm sm:text-base">"{item.q}"</span>
                        <span className={`ml-2.5 text-[11px] px-2.5 py-0.5 rounded-full font-medium whitespace-nowrap ${tagColors[item.tag]}`}>{item.tag}</span>
                      </div>
                    </div>
                    <div className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                      openFaq === i ? 'bg-indigo-100' : 'bg-gray-100'
                    }`}>
                      {openFaq === i
                        ? <ChevronUp className="w-4 h-4 text-indigo-600" />
                        : <ChevronDown className="w-4 h-4 text-gray-400" />
                      }
                    </div>
                  </div>
                  {openFaq === i && (
                    <div className="px-4 sm:px-5 pb-5 border-t border-gray-50">
                      <div className="flex items-start gap-3.5 mt-4 bg-gradient-to-br from-indigo-50 to-purple-50/50 rounded-xl p-4 border border-indigo-100/50">
                        <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Star className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wider mb-1">Expert Hint</p>
                          <p className="text-indigo-900 text-sm font-medium leading-relaxed">{item.hint}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STAR Tab */}
        {activeTab === 'star' && (
          <div className="space-y-10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-sm">
                <Target className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-lg">The STAR Method</h2>
                <p className="text-gray-500 text-sm">A structured framework for behavioral interview answers with impact.</p>
              </div>
            </div>

            {/* Timeline layout */}
            <div className="relative">
              {/* Vertical connecting line */}
              <div className="absolute left-[23px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-400 via-purple-400 via-emerald-400 to-orange-400 hidden sm:block" />

              <div className="space-y-8">
                {starExamples.map((item, i) => (
                  <div key={i} className="relative pl-0 sm:pl-16">
                    {/* Timeline dot */}
                    <div className={`absolute left-0 top-1 w-[47px] h-[47px] ${item.color} rounded-2xl hidden sm:flex items-center justify-center text-white text-xl font-black shadow-lg ring-4 ring-white`}>
                      {item.letter}
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 hover:shadow-md transition-all">
                      <div className="flex items-center gap-4 mb-4 sm:hidden">
                        <div className={`w-11 h-11 ${item.color} rounded-xl flex items-center justify-center text-white text-lg font-black flex-shrink-0`}>
                          {item.letter}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">{item.label}</div>
                          <div className="text-gray-500 text-sm">{item.desc}</div>
                        </div>
                      </div>
                      <div className="hidden sm:block mb-3">
                        <div className="font-bold text-gray-900 text-lg">{item.label}</div>
                        <div className="text-gray-500 text-sm">{item.desc}</div>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4 border-l-4" style={{ borderLeftColor: item.color.replace('bg-', '#').replace('-500', '') === '#blue' ? '#3B82F6' : item.color.includes('blue') ? '#3B82F6' : item.color.includes('purple') ? '#A855F7' : item.color.includes('emerald') ? '#10B981' : '#F97316' }}>
                        <p className="text-gray-600 text-sm italic leading-relaxed">{item.example}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Full STAR Example */}
            <div className="bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/80 border border-indigo-100 rounded-2xl p-6 sm:p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-sm">
                  <Play className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 text-lg">Complete STAR Example</h3>
              </div>
              <div className="relative">
                <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-gray-200" />
                <div className="space-y-6">
                  {[
                    { label: 'S', color: 'bg-blue-500', heading: 'Situation', text: 'Our e-commerce site was losing 30% of users at checkout due to a slow payment flow.' },
                    { label: 'T', color: 'bg-purple-500', heading: 'Task', text: 'I was tasked with identifying the bottleneck and proposing a fix within 2 weeks.' },
                    { label: 'A', color: 'bg-emerald-500', heading: 'Action', text: 'I ran A/B tests, identified a 3-second API delay, and worked with backend to optimize it.' },
                    { label: 'R', color: 'bg-orange-500', heading: 'Result', text: 'Checkout completion improved by 22%, adding $40K in monthly revenue.' },
                  ].map((s, i) => (
                    <div key={i} className="relative pl-12">
                      <span className={`absolute left-0 top-0.5 ${s.color} text-white text-xs font-bold w-[39px] h-[39px] rounded-xl flex items-center justify-center ring-4 ring-white z-10`}>{s.label}</span>
                      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-50">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{s.heading}</span>
                        <p className="text-gray-700 text-sm mt-1 leading-relaxed">{s.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Simulate Tab */}
        {activeTab === 'simulate' && <SimulationTab user={user} />}

        {/* CTA — hidden on simulate tab */}
        {activeTab !== 'simulate' && (
        <div className="mt-14 relative bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 rounded-3xl p-8 sm:p-10 text-center text-white overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 right-0 w-60 h-60 bg-indigo-400 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-400 rounded-full blur-3xl" />
          </div>
          <div className="relative">
            <Brain className="w-10 h-10 text-indigo-300 mx-auto mb-4" />
            <h3 className="text-2xl sm:text-3xl font-bold mb-3">Ready to practice?</h3>
            <p className="text-indigo-200/70 mb-7 max-w-md mx-auto">Use our AI Mock Interview to practice with real questions and get instant feedback.</p>
            <button
              onClick={() => setActiveTab('simulate')}
              className="inline-flex items-center gap-2 bg-white text-indigo-700 font-bold px-7 py-3 rounded-xl hover:bg-indigo-50 transition-all shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:-translate-y-0.5"
            >
              Start Mock Interview <span className="text-lg">→</span>
            </button>
          </div>
        </div>
        )}
      </div>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default InterviewTipsPage;
