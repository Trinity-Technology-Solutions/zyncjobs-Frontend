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
  { id: 'easy', label: 'Fresher', color: 'bg-emerald-50 text-emerald-700 border-emerald-300' },
  { id: 'medium', label: 'Mid-Level', color: 'bg-amber-50 text-amber-700 border-amber-300' },
  { id: 'hard', label: 'Senior', color: 'bg-red-50 text-red-700 border-red-300' },
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
    <div className="w-full space-y-6">
      <div className="relative overflow-hidden rounded-lg border border-[#dbeafe] bg-[#eff6ff] text-[#1e3a8a] p-6 sm:p-8 shadow-sm">
        <div className="absolute inset-x-0 top-0 h-1 bg-[#2563eb]" />
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-12 h-12 bg-white border border-[#bfdbfe] rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
            <Brain className="w-6 h-6 text-[#2563eb]" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#1e3a8a]">AI Mock Interview</h2>
            <p className="text-[#526780] text-sm">Practice with AI — get scored & feedback instantly</p>
          </div>
          <div className="sm:ml-auto inline-flex items-center gap-2 bg-white border border-[#bfdbfe] rounded-md px-3.5 py-1.5 shadow-sm self-start sm:self-center">
            <Clock className="w-3.5 h-3.5 text-[#2563eb]" />
            <span className="text-[#1e3a8a] text-xs font-semibold">~{MAX_QUESTIONS * 3} min</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-[#e2e8f0] shadow-sm p-6 sm:p-8 lg:p-10 space-y-6 sm:space-y-8">
        {/* Role Selection */}
        <div>
          <label className="block text-sm font-semibold text-[#1e3a8a] mb-3">Select Job Role</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3 mb-3">
            {JOB_ROLES.map(r => (
              <button key={r} onClick={() => setRole(r)}
                className={`px-4 py-2.5 rounded-md text-sm font-medium border transition-all text-left ${
                  role === r ? 'bg-[#2563eb] text-white border-[#2563eb] shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-[#bfdbfe] hover:bg-blue-50/40'
                }`}>
                {r}
              </button>
            ))}
            <button onClick={() => setRole('custom')}
              className={`px-4 py-2.5 rounded-md text-sm font-medium border transition-all ${
                role === 'custom' ? 'bg-[#2563eb] text-white border-[#2563eb] shadow-sm' : 'border-dashed border-slate-300 text-slate-600 hover:border-[#bfdbfe] hover:bg-blue-50/40'
              }`}>
              + Custom Role
            </button>
          </div>
          {role === 'custom' && (
            <input
              type="text" placeholder="Enter your job role..."
              value={customRole} onChange={e => setCustomRole(e.target.value)}
              className="w-full h-12 px-4 border border-slate-200 rounded-md text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400/25 focus:border-blue-500 bg-slate-50 focus:bg-white transition-all"
            />
          )}
        </div>

        {/* Difficulty */}
        <div>
          <label className="block text-sm font-semibold text-[#1e3a8a] mb-3">Experience Level</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {DIFFICULTY.map(d => (
              <button key={d.id} onClick={() => setDifficulty(d.id)}
                className={`py-3 rounded-md text-sm font-medium border transition-all ${
                  difficulty === d.id ? `${d.color} border-2 shadow-sm font-semibold` : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                }`}>
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* What to expect */}
        <div className="bg-[#eff6ff] rounded-lg p-5 sm:p-6 border border-[#dbeafe]">
          <p className="text-xs font-semibold text-[#2563eb] uppercase tracking-wider mb-3">What to expect</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
            {[
              { icon: MessageSquare, text: `${MAX_QUESTIONS} role-specific questions` },
              { icon: Star, text: 'AI scores each answer out of 10' },
              { icon: Zap, text: 'Instant feedback after every answer' },
              { icon: Award, text: 'Final performance report' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 bg-white rounded-md px-4 py-3 border border-[#e2e8f0] shadow-sm">
                <div className="w-8 h-8 bg-[#eff6ff] rounded-md flex items-center justify-center flex-shrink-0 text-[#2563eb]">
                  <item.icon className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium text-[#334e72]">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={startInterview}
          disabled={!selectedRole.trim()}
          className="w-full min-h-[48px] rounded-md bg-[#2563eb] text-white py-3.5 font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 shadow-sm shadow-blue-600/20"
        >
          <Play className="w-4 h-4" /> Start Mock Interview
        </button>
      </div>
    </div>
  );

  // ── Report Screen ─────────────────────────────────────────────────────────────
  if (step === 'report') return (
    <div className="w-full space-y-6">
      {/* Score Hero */}
      <div className="relative overflow-hidden rounded-lg border border-[#dbeafe] bg-[#eff6ff] p-8 sm:p-10 text-center text-[#1e3a8a] shadow-sm">
        <div className="absolute inset-x-0 top-0 h-1 bg-[#2563eb]" />
        <div className="relative">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full border-4 border-[#bfdbfe] bg-white shadow-sm mb-4">
            <span className={`text-4xl font-black ${avgScore >= 8 ? 'text-emerald-600' : avgScore >= 6 ? 'text-[#2563eb]' : 'text-red-600'}`}>
              {avgScore}
            </span>
            <span className="text-[#94a3b8] text-xl mt-3">/10</span>
          </div>
          <p className="text-2xl font-bold text-[#1e3a8a] mb-1">
            {avgScore >= 8 ? 'Excellent Performance!' : avgScore >= 6 ? 'Good Job!' : 'Keep Practicing!'}
          </p>
          <p className="text-[#526780] text-sm">{selectedRole} · {DIFFICULTY.find(d => d.id === difficulty)?.label}</p>
        </div>
      </div>

      {/* Per-question breakdown */}
      <div className="bg-white rounded-lg border border-[#e2e8f0] shadow-sm p-6 sm:p-8">
        <h3 className="font-bold text-[#1e3a8a] mb-5">Question-by-Question Breakdown</h3>
        <div className="space-y-4">
          {scores.map((s, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                s >= 8 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : s >= 6 ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-red-50 text-red-700 border border-red-200'
              }`}>{s}/10</div>
              <div className="flex-1">
                <div className="w-full bg-slate-100 rounded-full h-2.5">
                  <div className={`h-2.5 rounded-full transition-all ${
                    s >= 8 ? 'bg-emerald-500' : s >= 6 ? 'bg-amber-500' : 'bg-red-500'
                  }`} style={{ width: `${s * 10}%` }} />
                </div>
                {feedbacks[i] && <p className="text-xs text-[#526780] mt-1.5">{feedbacks[i]}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button onClick={() => { setStep('setup'); }}
          className="flex-1 border border-slate-200 text-slate-700 py-3 rounded-md font-semibold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 min-h-[44px]">
          <RotateCcw className="w-4 h-4" /> New Interview
        </button>
        <button onClick={() => { setStep('interview'); startInterview(); }}
          className="flex-1 bg-[#2563eb] text-white py-3 rounded-md font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-sm min-h-[44px]">
          <RefreshCw className="w-4 h-4" /> Retry Same Role
        </button>
      </div>
    </div>
  );

  // ── Interview Chat Screen ─────────────────────────────────────────────────────
  return (
    <div className="w-full flex flex-col bg-white rounded-lg border border-[#e2e8f0] shadow-sm overflow-hidden" style={{ height: '75vh' }}>
      {/* Header */}
      <div className="flex items-center justify-between bg-white px-5 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#eff6ff] border border-[#bfdbfe] rounded-md flex items-center justify-center text-[#2563eb] shadow-sm">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#1e3a8a]">{selectedRole} Interview</p>
            <p className="text-xs text-[#64748b]">Question {Math.min(questionCount, MAX_QUESTIONS)} of {MAX_QUESTIONS}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {scores.length > 0 && (
            <div className="flex items-center gap-2 bg-[#eff6ff] border border-[#bfdbfe] rounded-md px-3 py-1.5">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span className={`text-sm font-bold ${getScoreColor(Math.round(scores.reduce((a,b)=>a+b,0)/scores.length))}`}>
                {Math.round(scores.reduce((a,b)=>a+b,0)/scores.length)}/10
              </span>
            </div>
          )}
          <div className="flex gap-1.5">
            {Array.from({ length: MAX_QUESTIONS }).map((_, i) => (
              <div key={i} className={`w-2.5 h-2.5 rounded-full ${
                i < scores.length ? (scores[i] >= 7 ? 'bg-emerald-500' : 'bg-amber-500') :
                i === scores.length ? 'bg-[#2563eb] animate-pulse' : 'bg-slate-200'
              }`} />
            ))}
          </div>
        </div>
      </div>

      {/* Chat messages */}
      <div ref={chatRef} className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-4 bg-[#f8fafc]">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-md flex-shrink-0 flex items-center justify-center shadow-sm ${
              msg.role === 'ai' ? 'bg-[#eff6ff] border border-[#bfdbfe] text-[#2563eb]' : 'bg-[#2563eb] text-white'
            }`}>
              {msg.role === 'ai' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
            </div>
            <div className={`max-w-[85%] lg:max-w-[75%] space-y-2`}>
              {msg.content.length > 0 && (
                <div className={`px-5 py-3.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                  msg.role === 'ai'
                    ? 'bg-white border border-[#e2e8f0] text-slate-800 rounded-tl-sm'
                    : 'bg-[#2563eb] text-white rounded-tr-sm'
                }`}>
                  {msg.content}
                </div>
              )}
              {msg.role === 'ai' && msg.score !== undefined && (
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs ${
                  msg.score >= 8 ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                  msg.score >= 6 ? 'bg-amber-50 border-amber-200 text-amber-700' :
                  'bg-red-50 border-red-200 text-red-700'
                }`}>
                  <span className="font-bold">{msg.score}/10</span>
                  {msg.feedback && <span className="opacity-90">{msg.feedback.slice(0, 80)}{msg.feedback.length > 80 ? '...' : ''}</span>}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-md bg-[#eff6ff] border border-[#bfdbfe] text-[#2563eb] flex items-center justify-center flex-shrink-0 shadow-sm">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white border border-[#e2e8f0] px-5 py-3.5 rounded-2xl shadow-sm">
              <div className="flex gap-1.5">
                {[0,200,400].map(d => <span key={d} className="w-2 h-2 bg-[#2563eb] rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="bg-white border-t border-slate-200 p-4 sm:p-5 flex-shrink-0">
        <div className="flex gap-3">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAnswer(); } }}
            placeholder="Type your answer here... (Enter to send)"
            rows={1}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-md px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-400/25 focus:border-blue-500 focus:bg-white resize-none transition-colors"
          />
          <button onClick={sendAnswer} disabled={!input.trim() || loading}
            className="w-11 h-11 bg-[#2563eb] hover:bg-blue-700 rounded-md flex items-center justify-center text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors self-end shadow-sm"
          >
            <Send className="w-4 h-4" />
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
      color: 'from-blue-600 to-indigo-600',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-700',
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
      color: 'from-blue-500 to-indigo-600',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-700',
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
    { letter: 'S', label: 'Situation', color: 'bg-[#2563eb]', desc: 'Set the scene — what was the context?', example: '"Our team was behind on a critical product launch with 2 weeks to go..."' },
    { letter: 'T', label: 'Task', color: 'bg-[#1e40af]', desc: 'What was your responsibility?', example: '"I was responsible for coordinating 3 teams and ensuring delivery..."' },
    { letter: 'A', label: 'Action', color: 'bg-emerald-600', desc: 'What specific steps did YOU take?', example: '"I created a daily standup, identified blockers, and re-prioritized tasks..."' },
    { letter: 'R', label: 'Result', color: 'bg-[#1e3a8a]', desc: 'What was the measurable outcome?', example: '"We launched on time, increasing Q3 revenue by 18%..."' },
  ];

  const stats = [
    { value: '93%', label: 'of hiring decisions are made in the first 5 minutes', icon: Zap },
    { value: '70%', label: 'of candidates fail due to poor preparation', icon: Target },
    { value: '3x', label: 'more likely to get hired with STAR method answers', icon: Award },
  ];

  const tagColors: Record<string, string> = {
    Opening: 'bg-[#eff6ff] text-[#1e40af] border border-[#bfdbfe]',
    Motivation: 'bg-slate-100 text-slate-700 border border-slate-200',
    'Self-awareness': 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    Goals: 'bg-blue-50 text-[#1e40af] border border-[#bfdbfe]',
    Transition: 'bg-slate-100 text-slate-700 border border-slate-200',
    Behavioral: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
    Negotiation: 'bg-blue-50 text-[#1e40af] border border-blue-200',
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        {/* Back */}
        <BackButton fallback="/" className="mb-6" />

        {/* Hero Banner */}
        <div className="relative overflow-hidden rounded-lg border border-[#dbeafe] bg-[#eff6ff] text-[#1e3a8a] p-6 sm:p-10 mb-8 shadow-sm">
          <div className="absolute inset-x-0 top-0 h-1 bg-[#2563eb]" />
          <div className="relative max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#bfdbfe] bg-white/80 px-4 py-1.5 text-xs font-semibold text-[#2563eb] mb-4 shadow-sm">
              <Mic className="w-3.5 h-3.5" /> Interview Mastery Guide
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#1e3a8a] tracking-tight mb-2.5">
              Ace Every Interview
            </h1>
            <p className="text-sm sm:text-base text-[#526780] max-w-2xl mx-auto mb-6 leading-relaxed">
              Proven strategies, real examples, and expert tips to land your dream job with confidence.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
              {stats.map((s, i) => (
                <div key={i} className="bg-white rounded-lg border border-[#e2e8f0] p-4 sm:p-5 text-center shadow-sm">
                  <div className="w-8 h-8 rounded-full bg-[#eff6ff] text-[#2563eb] flex items-center justify-center mx-auto mb-2">
                    <s.icon className="w-4 h-4" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold text-[#1e3a8a] mb-1">{s.value}</div>
                  <div className="text-xs text-[#64748b] leading-relaxed">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="inline-flex gap-1.5 bg-white rounded-lg p-1.5 border border-[#e2e8f0] shadow-sm flex-wrap">
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
                className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-md text-sm font-semibold transition-all ${
                  activeTab === tab.key
                    ? 'bg-[#2563eb] text-white shadow-sm'
                    : 'text-[#526780] hover:text-[#1e3a8a] hover:bg-slate-50'
                }`}
              >
                <tab.icon className={`w-4 h-4 ${activeTab === tab.key ? 'text-white' : 'text-[#64748b]'}`} />
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
                <div key={i} className="group bg-white rounded-lg border border-[#e2e8f0] shadow-sm overflow-hidden transition-all duration-200">
                  <div className="bg-[#eff6ff] border-b border-[#dbeafe] p-5 flex items-center gap-4 relative overflow-hidden">
                    <div className="w-11 h-11 bg-white border border-[#bfdbfe] rounded-lg flex items-center justify-center flex-shrink-0 text-[#2563eb] shadow-sm">
                      <phase.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[#2563eb] text-xs font-bold tracking-[0.15em]">STEP {phase.step}</div>
                      <div className="text-[#1e3a8a] font-bold text-lg">{phase.title}</div>
                    </div>
                  </div>
                  <div className="p-5 space-y-3.5">
                    {phase.tips.map((tip, j) => (
                      <div key={j} className="flex items-start gap-3">
                        <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#2563eb]" />
                        <span className="text-[#526780] text-sm leading-relaxed">{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Pro Tips Banner */}
            <div className="relative overflow-hidden rounded-lg border border-[#dbeafe] bg-[#eff6ff] p-6 sm:p-8 shadow-sm">
              <div className="absolute inset-x-0 top-0 h-1 bg-[#2563eb]" />
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-full bg-white border border-[#bfdbfe] text-[#2563eb] flex items-center justify-center shadow-sm">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-[#1e3a8a] text-lg">Pro Tips from Hiring Managers</h3>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  { icon: Video, tip: 'Test your camera, mic & lighting 30 min before every virtual interview' },
                  { icon: ThumbsUp, tip: 'Mirror the interviewer\'s energy — match their pace and formality level' },
                  { icon: Users, tip: 'Print 3 copies of your resume even if they have it digitally' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3.5 bg-white rounded-lg p-4 shadow-sm border border-[#e2e8f0]">
                    <div className="w-9 h-9 rounded-md bg-[#eff6ff] text-[#2563eb] flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-4.5 h-4.5" />
                    </div>
                    <p className="text-sm font-medium text-[#334e72] leading-relaxed">{item.tip}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Questions Tab */}
        {activeTab === 'questions' && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-md bg-[#eff6ff] border border-[#bfdbfe] text-[#2563eb] flex items-center justify-center shadow-sm">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-bold text-[#1e3a8a] text-lg">Common Interview Questions</h2>
                <p className="text-[#526780] text-sm">Click any question to see the expert hint.</p>
              </div>
            </div>
            <div className="space-y-2.5">
              {commonQuestions.map((item, i) => (
                <div
                  key={i}
                  className={`bg-white rounded-lg border border-[#e2e8f0] shadow-sm overflow-hidden transition-all duration-200 cursor-pointer ${
                    openFaq === i ? 'border-[#bfdbfe]' : 'hover:border-slate-300'
                  }`}
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <div className="flex items-center justify-between p-4 sm:p-5">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${
                        openFaq === i ? 'bg-[#2563eb] text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {String(i + 1).padStart(2, '0')}
                      </div>
                      <div className="min-w-0">
                        <span className="font-semibold text-[#1e3a8a] text-sm sm:text-base">"{item.q}"</span>
                        <span className={`ml-2.5 text-[11px] px-2.5 py-0.5 rounded-full font-medium whitespace-nowrap ${tagColors[item.tag]}`}>{item.tag}</span>
                      </div>
                    </div>
                    <div className={`flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center transition-colors ${
                      openFaq === i ? 'bg-[#eff6ff] text-[#2563eb]' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {openFaq === i
                        ? <ChevronUp className="w-4 h-4" />
                        : <ChevronDown className="w-4 h-4" />
                      }
                    </div>
                  </div>
                  {openFaq === i && (
                    <div className="px-4 sm:px-5 pb-5 border-t border-slate-100">
                      <div className="flex items-start gap-3.5 mt-4 bg-[#eff6ff] rounded-lg p-4 border border-[#dbeafe]">
                        <div className="w-8 h-8 bg-white border border-[#bfdbfe] text-[#2563eb] rounded-md flex items-center justify-center flex-shrink-0 shadow-sm">
                          <Star className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-[#2563eb] uppercase tracking-wider mb-1">Expert Hint</p>
                          <p className="text-[#1e3a8a] text-sm font-medium leading-relaxed">{item.hint}</p>
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
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-md bg-[#eff6ff] border border-[#bfdbfe] text-[#2563eb] flex items-center justify-center shadow-sm">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-bold text-[#1e3a8a] text-lg">The STAR Method</h2>
                <p className="text-[#526780] text-sm">A structured framework for behavioral interview answers with impact.</p>
              </div>
            </div>

            {/* Timeline layout */}
            <div className="relative">
              {/* Vertical connecting line */}
              <div className="absolute left-[23px] top-0 bottom-0 w-0.5 bg-[#bfdbfe] hidden sm:block" />

              <div className="space-y-6">
                {starExamples.map((item, i) => (
                  <div key={i} className="relative pl-0 sm:pl-16">
                    {/* Timeline dot */}
                    <div className={`absolute left-0 top-1 w-[47px] h-[47px] ${item.color} rounded-lg hidden sm:flex items-center justify-center text-white text-xl font-bold shadow-sm ring-4 ring-white`}>
                      {item.letter}
                    </div>
                    <div className="bg-white rounded-lg border border-[#e2e8f0] shadow-sm p-5 sm:p-6 transition-all">
                      <div className="flex items-center gap-4 mb-4 sm:hidden">
                        <div className={`w-11 h-11 ${item.color} rounded-lg flex items-center justify-center text-white text-lg font-bold flex-shrink-0`}>
                          {item.letter}
                        </div>
                        <div>
                          <div className="font-bold text-[#1e3a8a]">{item.label}</div>
                          <div className="text-[#526780] text-sm">{item.desc}</div>
                        </div>
                      </div>
                      <div className="hidden sm:block mb-3">
                        <div className="font-bold text-[#1e3a8a] text-lg">{item.label}</div>
                        <div className="text-[#526780] text-sm">{item.desc}</div>
                      </div>
                      <div className="bg-slate-50 rounded-md p-4 border-l-4 border-[#2563eb]">
                        <p className="text-[#526780] text-sm italic leading-relaxed">{item.example}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Full STAR Example */}
            <div className="relative overflow-hidden rounded-lg border border-[#dbeafe] bg-[#eff6ff] p-6 sm:p-8 shadow-sm">
              <div className="absolute inset-x-0 top-0 h-1 bg-[#2563eb]" />
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-white border border-[#bfdbfe] text-[#2563eb] flex items-center justify-center shadow-sm">
                  <Play className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-[#1e3a8a] text-lg">Complete STAR Example</h3>
              </div>
              <div className="relative">
                <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-[#bfdbfe]" />
                <div className="space-y-5">
                  {[
                    { label: 'S', color: 'bg-blue-600', heading: 'Situation', text: 'Our e-commerce site was losing 30% of users at checkout due to a slow payment flow.' },
                    { label: 'T', color: 'bg-[#1e40af]', heading: 'Task', text: 'I was tasked with identifying the bottleneck and proposing a fix within 2 weeks.' },
                    { label: 'A', color: 'bg-emerald-600', heading: 'Action', text: 'I ran A/B tests, identified a 3-second API delay, and worked with backend to optimize it.' },
                    { label: 'R', color: 'bg-[#1e3a8a]', heading: 'Result', text: 'Checkout completion improved by 22%, adding $40K in monthly revenue.' },
                  ].map((s, i) => (
                    <div key={i} className="relative pl-12">
                      <span className={`absolute left-0 top-0.5 ${s.color} text-white text-xs font-bold w-[39px] h-[39px] rounded-lg flex items-center justify-center ring-4 ring-white z-10 shadow-sm`}>{s.label}</span>
                      <div className="bg-white rounded-md p-4 shadow-sm border border-[#e2e8f0]">
                        <span className="text-xs font-bold text-[#64748b] uppercase tracking-wider">{s.heading}</span>
                        <p className="text-[#1e3a8a] text-sm mt-1 leading-relaxed">{s.text}</p>
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
          <div className="mt-12 relative overflow-hidden rounded-lg border border-[#dbeafe] bg-[#eff6ff] p-8 sm:p-10 text-center text-[#1e3a8a] shadow-sm">
            <div className="absolute inset-x-0 top-0 h-1 bg-[#2563eb]" />
            <div className="relative max-w-lg mx-auto">
              <div className="w-12 h-12 rounded-full bg-white border border-[#bfdbfe] text-[#2563eb] flex items-center justify-center mx-auto mb-4 shadow-sm">
                <Brain className="w-6 h-6" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-[#1e3a8a] mb-2">Ready to practice?</h3>
              <p className="text-[#526780] text-sm sm:text-base mb-6 leading-relaxed">
                Use our AI Mock Interview to practice with real questions and get instant feedback.
              </p>
              <button
                onClick={() => setActiveTab('simulate')}
                className="inline-flex items-center gap-2 bg-[#2563eb] text-white font-semibold px-7 py-3 rounded-md hover:bg-blue-700 transition-colors shadow-sm shadow-blue-600/20"
              >
                Start Mock Interview <span className="text-lg">→</span>
              </button>
            </div>
          </div>
        )}
      </main>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default InterviewTipsPage;
