import React, { useState, useEffect, useRef } from 'react';
import {
  Clock, CheckCircle, Search, ExternalLink, ChevronLeft, ChevronRight,
  Brain, Target, Award, BookOpen, ArrowRight, Download, Linkedin,
  Briefcase, Star, TrendingUp, Lightbulb, Play, RotateCcw, BarChart3,
  Globe, Code, PenTool, MessageSquare, FileText, Zap, AlertTriangle,
  Loader2, Sparkles, ChevronDown, ChevronUp, Bot, Send, X, Eye, Shield, Database, Terminal, Box, Braces, FileCode, Server, Cpu, GitBranch, Layers, Cog, Coffee, Cloud
} from 'lucide-react';
import BackButton from '../components/BackButton';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { executeAI } from '../services/aiChatService';
import { tokenStorage } from '../utils/tokenStorage';
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

interface Props {
  onNavigate: (page: string, params?: any) => void;
  user?: any;
  onLogout?: () => void;
}

const SKILL_CACHE_KEY = 'zyncjobs-skill-cache';
const ASSESSMENT_TYPES_CACHE_KEY = 'zyncjobs-assessment-types-cache';
const getQuestionCacheKey = (skill: string, type: string) => `zyncjobs-questions-${skill}-${type}`;

const SkillAssessmentPage: React.FC<Props> = ({ onNavigate, user, onLogout }) => {
  const [step, setStep] = useState<'dashboard' | 'detail' | 'in-progress' | 'result' | 'skill-gap' | 'learning-path' | 'certificate'>('dashboard');
  const [selectedSkill, setSelectedSkill] = useState('');
  const [assessment, setAssessment] = useState<any>(null);
  const [result, setResult] = useState<any>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<any[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(false);
  const [myAssessments, setMyAssessments] = useState<any[]>([]);
  const [questionTypes, setQuestionTypes] = useState<string[]>(['mcq', 'coding', 'debugging', 'scenario']);
  const [aiMentorOpen, setAiMentorOpen] = useState(false);
  const [mentorInput, setMentorInput] = useState('');
  const [mentorChat, setMentorChat] = useState<{ role: string; content: string }[]>([]);
  const [mentorLoading, setMentorLoading] = useState(false);
  const [aiSkillSuggestions, setAiSkillSuggestions] = useState<any[]>(() => {
    try { return JSON.parse(localStorage.getItem(SKILL_CACHE_KEY) || '[]'); } catch { return []; }
  });
  const [assessmentTypes, setAssessmentTypes] = useState<any[]>(() => {
    try { return JSON.parse(localStorage.getItem(ASSESSMENT_TYPES_CACHE_KEY) || '[]'); } catch { return []; }
  });
  const [aiMissingSkills, setAiMissingSkills] = useState<string[]>([]);
  const [skillGapLoading, setSkillGapLoading] = useState(false);
  const [aiLearningPath, setAiLearningPath] = useState<any[]>([]);
  const [aiCertificateNote, setAiCertificateNote] = useState('');
  const assessmentDifficulty = 'Intermediate';
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [targetRole, setTargetRole] = useState('Senior Developer');
  const [aiCoachMessage, setAiCoachMessage] = useState('');
  const [recommendationLoading, setRecommendationLoading] = useState(false);
  const vivaChatRef = useRef<HTMLDivElement>(null);
  const mentorChatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mentorChatRef.current) mentorChatRef.current.scrollTop = mentorChatRef.current.scrollHeight;
  }, [mentorChat, mentorLoading]);

  // Icon map for assessment types (string -> Lucide component)
  const iconMap: Record<string, any> = {
    CheckCircle, Code, AlertTriangle, PenTool, MessageSquare, FileText, Eye, Brain, Zap, Shield, Globe, Database,
  };

  // Icon map for skills (string -> Lucide component)
  const skillIconMapComp: Record<string, any> = {
    Terminal, Code, Cloud, Box, Braces, Database, FileCode, Server, Cpu, Bot, BarChart3, GitBranch, Layers, Cog, Coffee,
  };

  useEffect(() => { fetchMyAssessments(); fetchPopularSkills(); fetchAssessmentTypes(); }, []);

  useEffect(() => {
    if (step === 'in-progress' && timeLeft > 0) {
      const t = setInterval(() => setTimeLeft(s => s - 1), 1000);
      return () => clearInterval(t);
    }
  }, [step, timeLeft]);

  useEffect(() => {
    if (vivaChatRef.current) vivaChatRef.current.scrollTop = vivaChatRef.current.scrollHeight;
  }, []);

  // AI Coach: generate message when assessments load
  useEffect(() => {
    const generateCoach = async () => {
      try {
        if (myAssessments.length > 0) {
          const passed = myAssessments.filter((a: any) => a.score >= 70).length;
          const bestSkill = myAssessments.reduce((b: any, a: any) => (!b || a.score > b.score) ? a : b, null);
          const weakestSkill = myAssessments.reduce((w: any, a: any) => (!w || a.score < w.score) ? a : w, null);
          const prompt = `User took ${myAssessments.length} skill assessments, passed ${passed}. Best: ${bestSkill?.skill} (${bestSkill?.score}%). Weakest: ${weakestSkill?.skill} (${weakestSkill?.score}%). Give one short, motivational coaching sentence (max 20 words).`;
          const d = await executeAI(`career advice: ${prompt}`, { systemPrompt: 'You are an encouraging AI career coach.' });
          const msg = (d as any)?.result?.reply || '';
          if (msg) { setAiCoachMessage(msg); return; }
        }
      } catch { /* fallback */ }
      // Fallback
      if (myAssessments.length > 0) {
        const passedCount = myAssessments.filter((a: any) => a.score >= 70).length;
        const weakestSkill = myAssessments.reduce((w: any, a: any) => (!w || a.score < w.score) ? a : w, null);
        if (passedCount === myAssessments.length) {
          setAiCoachMessage('Excellent work! You passed all assessments. Try more advanced topics.');
        } else if (weakestSkill) {
          setAiCoachMessage(`Focus on improving ${weakestSkill.skill} (${weakestSkill.score}%). You can do it!`);
        } else {
          setAiCoachMessage('Keep going! Regular practice builds lasting skills.');
        }
      } else {
        setAiCoachMessage('Start your first assessment to unlock personalized AI recommendations.');
      }
    };
    generateCoach();
  }, [myAssessments]);

  const fetchMyAssessments = async () => {
    const local = Object.keys(localStorage)
      .filter(k => k.startsWith('assessment_local-'))
      .map(k => { try { return JSON.parse(localStorage.getItem(k) || ''); } catch { return null; } })
      .filter((a): a is any => Boolean(a) && typeof a.score === 'number')
      .sort((a: any, b: any) => new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime());
    // Also fetch from backend
    try {
      const token = tokenStorage.getAccess();
      if (token) {
        const response = await fetch(`${API_BASE_URL}/skill-assessments/my-assessments`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
          const backendList = await response.json();
          const merged = [...backendList, ...local.filter(
            (la: any) => !backendList.some((ba: any) => ba.assessmentId === la.assessmentId || ba.id === la.assessmentId)
          )];
          setMyAssessments(merged);
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to fetch backend assessments:', e);
    }
    setMyAssessments(local);
  };

  // Map skill names to Lucide icon names
  const skillIconMap: Record<string, string> = {
    Python: 'Terminal', React: 'Code', AWS: 'Cloud', Docker: 'Box',
    JavaScript: 'Braces', SQL: 'Database', TypeScript: 'FileCode', 'Node.js': 'Server',
    Java: 'Coffee', Go: 'GitBranch', Rust: 'Cog', Kubernetes: 'Layers',
    'Machine Learning': 'Brain', AI: 'Bot', 'Data Science': 'BarChart3', Git: 'GitBranch',
  };

  // Generate realistic varied numbers
  const genRating = (base = 4.5) => (base + (Math.random() - 0.5) * 0.8).toFixed(1);
  const genCandidates = (base: number) => `${Math.round(base * (0.8 + Math.random() * 0.4))}K`;

  // Local fallback: generate realistic skill data when AI is offline
  const generateLocalSkills = () => [
    { name: 'Python', icon: skillIconMap.Python, color: 'from-yellow-400 to-blue-500', difficulty: 'Intermediate', duration: 30, questions: 25, rating: genRating(4.7), candidates: genCandidates(280), category: 'Programming' },
    { name: 'React', icon: skillIconMap.React, color: 'from-cyan-400 to-blue-600', difficulty: 'Advanced', duration: 45, questions: 30, rating: genRating(4.9), candidates: genCandidates(220), category: 'Frontend' },
    { name: 'AWS', icon: skillIconMap.AWS, color: 'from-orange-400 to-yellow-500', difficulty: 'Advanced', duration: 40, questions: 30, rating: genRating(4.6), candidates: genCandidates(165), category: 'Cloud' },
    { name: 'Docker', icon: skillIconMap.Docker, color: 'from-blue-400 to-indigo-600', difficulty: 'Intermediate', duration: 25, questions: 20, rating: genRating(4.4), candidates: genCandidates(110), category: 'DevOps' },
    { name: 'JavaScript', icon: skillIconMap.JavaScript, color: 'from-yellow-300 to-yellow-600', difficulty: 'Beginner', duration: 20, questions: 15, rating: genRating(4.3), candidates: genCandidates(350), category: 'Programming' },
    { name: 'SQL', icon: skillIconMap.SQL, color: 'from-orange-300 to-red-500', difficulty: 'Intermediate', duration: 30, questions: 20, rating: genRating(4.5), candidates: genCandidates(190), category: 'Database' },
    { name: 'TypeScript', icon: skillIconMap.TypeScript, color: 'from-blue-400 to-blue-700', difficulty: 'Intermediate', duration: 35, questions: 25, rating: genRating(4.8), candidates: genCandidates(150), category: 'Programming' },
    { name: 'Node.js', icon: skillIconMap['Node.js'], color: 'from-green-400 to-green-700', difficulty: 'Advanced', duration: 40, questions: 28, rating: genRating(4.6), candidates: genCandidates(175), category: 'Backend' },
  ];

  // Local fallback: generate assessment types
  const generateLocalAssessmentTypes = () => [
    { id: 'mcq', label: 'MCQ', icon: 'CheckCircle', desc: 'Multiple choice with AI explanations & instant scoring' },
    { id: 'coding', label: 'Coding', icon: 'Code', desc: 'Write real code, run tests, get AI feedback' },
    { id: 'debugging', label: 'Debugging', icon: 'AlertTriangle', desc: 'Find bugs in real code snippets' },
    { id: 'scenario', label: 'Scenario', icon: 'PenTool', desc: 'Solve real-world business problems' },
    { id: 'viva', label: 'AI Viva', icon: 'MessageSquare', desc: 'AI conducts live technical interview' },
    { id: 'case-study', label: 'Case Study', icon: 'FileText', desc: 'Analyze case & propose solutions' },
    { id: 'review', label: 'Review', icon: 'Eye', desc: 'Get AI feedback on your projects' },
  ];

  // AI-powered: fetch trending/popular skills with AI-generated metadata
  const fetchPopularSkills = async () => {
    try {
      // AI generates complete skill data including Lucide icon names
      const data = await executeAI(
        'skill assessment: Generate 8 in-demand tech skills for assessments. Return ONLY a JSON array: [{name, icon(lucide icon name: Terminal, Code, Cloud, Box, Braces, Database, FileCode, Server, Cpu, Bot, BarChart3, GitBranch, Layers, Cog, Coffee), color(tailwind gradient like "from-blue-400 to-purple-600"), difficulty:"Beginner|Intermediate|Advanced|Expert", duration(number in minutes), questions(number), rating(number 1-5), candidates(string like "120K"), category:"Programming|Cloud|AI|Database|DevOps|Frontend|Backend|Mobile"}]. No extra text.',
        { systemPrompt: 'You are a career industry analyst. Return ONLY valid JSON.' }
      );
      const reply = (data as any)?.result?.reply || '[]';
      const skills = parseJSONArray(reply);
      if (skills.length >= 4) {
        const defIcons = ['Terminal', 'Code', 'Cloud', 'Box', 'Braces', 'Database', 'FileCode', 'Server', 'Cpu', 'Bot', 'BarChart3', 'GitBranch'];
        const defColors = [
          'from-yellow-400 to-blue-500', 'from-cyan-400 to-blue-600', 'from-orange-400 to-yellow-500',
          'from-blue-400 to-indigo-600', 'from-yellow-300 to-yellow-600', 'from-orange-300 to-red-500',
          'from-blue-400 to-blue-700', 'from-green-400 to-green-700', 'from-purple-400 to-pink-600',
          'from-teal-400 to-cyan-600', 'from-red-400 to-pink-500', 'from-indigo-400 to-purple-600',
        ];
        setAiSkillSuggestions(skills.slice(0, 8).map((s: any, i: number) => ({
          name: s.name,
          icon: s.icon || defIcons[i % defIcons.length],
          color: s.color || defColors[i % defColors.length],
          difficulty: s.difficulty || 'Intermediate',
          duration: s.duration || 30,
          questions: s.questions || 20,
          rating: (s.rating || 4.5).toString(),
          candidates: s.candidates || '120K',
          category: s.category || 'Programming',
        })));
        // Cache AI result so next load works even when offline
        localStorage.setItem(SKILL_CACHE_KEY, JSON.stringify(skills.slice(0, 8)));
      }
} catch {
      // AI offline — use local fallback if cache is empty
      if (aiSkillSuggestions.length === 0) {
        const local = generateLocalSkills();
        setAiSkillSuggestions(local);
        localStorage.setItem(SKILL_CACHE_KEY, JSON.stringify(local));
      }
    }
  };

  // AI-powered: fetch assessment types with AI-generated metadata
  const fetchAssessmentTypes = async () => {
    try {
      const data = await executeAI(
        'skill assessment: Generate 7 assessment types for a skill platform. Return ONLY a JSON array: [{id, label, icon(one of: CheckCircle, Code, AlertTriangle, PenTool, MessageSquare, FileText, Eye, Brain, Zap, Shield, Globe, Database), description}]. No extra text.',
        { systemPrompt: 'You are an assessment platform architect. Return ONLY valid JSON.' }
      );
      const reply = (data as any)?.result?.reply || '[]';
      const types = parseJSONArray(reply);
      if (types.length >= 4) {
        const formatted = types.slice(0, 7).map((t: any) => ({
          id: t.id || t.label?.toLowerCase().replace(/\s+/g, '-') || `type-${Math.random()}`,
          label: t.label || 'Assessment',
          icon: t.icon || 'Code',
          desc: t.description || 'AI-powered assessment',
        }));
        setAssessmentTypes(formatted);
        localStorage.setItem(ASSESSMENT_TYPES_CACHE_KEY, JSON.stringify(formatted));
      }
} catch {
      // AI offline — use local fallback if cache is empty
      if (assessmentTypes.length === 0) {
        const local = generateLocalAssessmentTypes();
        setAssessmentTypes(local);
        localStorage.setItem(ASSESSMENT_TYPES_CACHE_KEY, JSON.stringify(local));
      }
    }
  };

  // AI-powered: determine skills covered for assessment
  const aiGenerateSkillsCovered = async (skill: string) => {
    try {
      const data = await executeAI(
        `skill assessment: List 6-8 key subtopics/skills assessed in a "${skill}" technical assessment. Return ONLY a comma-separated list.`,
        { systemPrompt: 'You are a curriculum designer.' }
      );
      const reply = (data as any)?.result?.reply || '';
      const skills = reply.split(',').map((s: string) => s.trim().replace(/^[-•*\d.\s]+/, '')).filter(Boolean);
      if (skills.length >= 3) { return skills; }
    } catch { /* fallthrough */ }
    return generateSkillsCoveredFallback(skill);
  };

  // AI-powered: evaluate answers and generate skill breakdown
  const aiEvaluateAnswers = async (questions: any[], answers: any[], skill: string) => {
    try {
      const evalData = questions.filter((q: any) => q.correct !== undefined || q.correctAnswer !== undefined).map((q: any, i: number) => ({
        question: q.question, correct: q.options?.[q.correct ?? q.correctAnswer], userAnswer: q.options?.[answers[i]],
        isCorrect: Number(q.correct ?? q.correctAnswer) === Number(answers[i]),
      }));
      const prompt = `Evaluate this ${skill} assessment. Score each skill area (0-100%). Student answered ${evalData.filter((e: any) => e.isCorrect).length}/${evalData.length} correct.
Return ONLY JSON: { "skillScores": {"SkillName": score}, "missingSkills": ["skill1","skill2"], "confidence": "high|medium|low", "feedback": "2-3 sentence summary" }
Data: ${JSON.stringify(evalData)}`;
      const data = await executeAI(`skill assessment: ${prompt}`, { systemPrompt: 'You are an expert technical evaluator. Return ONLY valid JSON.' });
      const reply = (data as any)?.result?.reply || '{}';
      const parsed = parseJSONObject(reply);
      if (parsed && parsed.skillScores) return parsed;
    } catch { /* fallthrough */ }
    return null;
  };

  // AI-powered: generate skill gap analysis
  const aiGenerateSkillGap = async (skill: string, score: number, skillBreakdown?: Record<string, number>) => {
    // Derive weak areas from actual assessment breakdown
    const weakAreas = skillBreakdown
      ? Object.entries(skillBreakdown).filter(([, s]) => s < 70).map(([k]) => k)
      : [];
    try {
      const context = weakAreas.length > 0
        ? `They scored below 70% in: ${weakAreas.join(', ')}.`
        : '';
      const data = await executeAI(
        `skill gap: For a ${skill} developer who scored ${score}% on assessment. ${context} List 4-6 specific missing skills they need to reach a senior level. Return ONLY a comma-separated list.`,
        { systemPrompt: 'You are a career gap analyst.' }
      );
      const reply = (data as any)?.result?.reply || '';
      const skills = reply.split(',').map((s: string) => s.trim().replace(/^[-•*\d.\s]+/, '')).filter(Boolean);
      if (skills.length >= 2) { setAiMissingSkills(skills); return skills; }
    } catch { /* fallthrough */ }
    // Fallback: derive from weak areas in breakdown
    if (weakAreas.length > 0) { setAiMissingSkills(weakAreas); return weakAreas; }
    return [];
  };

  // AI-powered: generate 4-week learning path
  const aiGenerateLearningPath = async (skill: string, missingSkills: string[]) => {
    try {
      const missing = missingSkills.join(', ');
      const data = await executeAI(
        `career advice: Create a 4-week learning roadmap to master ${missing} for a ${skill} developer.
Return ONLY JSON array: [{"week":"Week 1","title":"...","desc":"...","skills":["skill1","skill2"]}] with 4 entries.
Keep descriptions under 15 words. 2-3 skills per week.`,
        { systemPrompt: 'You are a learning path designer. Return ONLY valid JSON.' }
      );
      const reply = (data as any)?.result?.reply || '[]';
      const parsed = parseJSONArray(reply);
      if (parsed.length >= 2) { setAiLearningPath(parsed); return parsed; }
    } catch { /* fallthrough */ }
    return [
      { week: 'Week 1', title: 'Core Fundamentals', desc: `Master ${missingSkills.slice(0,2).join(' & ')}`, skills: missingSkills.slice(0,2) },
      { week: 'Week 2', title: 'Intermediate Concepts', desc: `Deep dive into advanced topics`, skills: missingSkills.slice(1,3) },
      { week: 'Week 3', title: 'Advanced Topics', desc: `Build production-ready expertise`, skills: missingSkills.slice(2,4) },
      { week: 'Week 4', title: 'Capstone Project', desc: `Apply all skills in a real project`, skills: missingSkills.slice(0,3) },
    ];
  };

  const getAIRecommendations = async () => {
    setRecommendationLoading(true);
    try {
      const weakestAssessment = myAssessments.length > 0
        ? myAssessments.reduce((w: any, a: any) => (!w || a.score < w.score) ? a : w, null)
        : null;
      const skillName = weakestAssessment?.skill || (aiSkillSuggestions[0]?.name) || targetRole || 'Python';
      const score = weakestAssessment?.score ?? 0;
      const breakdown = weakestAssessment?.skillBreakdown;
      setSelectedSkill(skillName);
      const missing = await aiGenerateSkillGap(skillName, score, breakdown);
      await aiGenerateLearningPath(skillName, missing.length > 0 ? missing : generateSkillsCoveredFallback(skillName));
      setStep('skill-gap');
    } catch {
      setStep('skill-gap');
    } finally {
      setRecommendationLoading(false);
    }
  };

  const parseJSONObject = (str: string): any => {
    try {
      const match = str.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]);
      return JSON.parse(str);
    } catch { return null; }
  };

  // AI-powered: generate certificate message
  const generateCertificateNote = async (skill: string, score: number) => {
    try {
      const data = await executeAI(
        `career advice: Write one short inspiring sentence (max 20 words) for a ${skill} certificate earned with ${score}% score.`,
        { systemPrompt: 'You are a certification authority.' }
      );
      const reply = (data as any)?.result?.reply || `Certified ${skill} Professional`;
      setAiCertificateNote(reply);
    } catch { setAiCertificateNote(`Certified ${skill} Professional`); }
  };

  const generateAssessment = async (skill?: string) => {
    const skillToUse = skill || selectedSkill;
    if (!skillToUse) return;
    setLoading(true);
    // Clear any cached questions from previous skill to prevent bleed-over
    try {
      Object.keys(localStorage)
        .filter(k => k.startsWith('zyncjobs-skill-cache') || k.startsWith('assessment_questions_') || k.startsWith('zyncjobs-questions-'))
        .forEach(k => localStorage.removeItem(k));
    } catch { }
try {
      const aiQuestions: any[] = [];
      // Generate exactly the specified distribution for EACH type
      // Enforce the documented question distribution:
      // MCQ – 5, Coding – 2, Debugging – 3, Scenario – 3 (Total: 13)
      for (const type of questionTypes) {
        let targetCount = 0;
        switch (type) {
          case 'mcq': targetCount = 5; break;
          case 'coding': targetCount = 2; break;
          case 'debugging': targetCount = 3; break;
          case 'scenario': targetCount = 3; break;
          default: targetCount = 5;
        }

        let generatedQuestions = [];
        // Check skill+type specific cache first
        const qCacheKey = getQuestionCacheKey(skillToUse, type);
        try {
          const cached = localStorage.getItem(qCacheKey);
          if (cached) generatedQuestions = JSON.parse(cached);
        } catch { }
        if (generatedQuestions.length < targetCount) {
        try {
          const prompt = type === 'mcq'
                ? `Generate exactly ${targetCount} MCQ questions specifically about ${skillToUse} concepts, syntax, and best practices. Each question must be unique and directly test ${skillToUse} knowledge. Return ONLY a JSON array: [{"question":"...","options":["A","B","C","D"],"correct":0}]. No extra text.`
                : type === 'coding'
                ? `Generate exactly ${targetCount} coding challenges that ONLY use ${skillToUse}. Each challenge must be a real ${skillToUse}-specific problem (NOT palindrome, NOT generic). Examples for context: if skill is React generate hooks/component challenges, if Python generate list comprehension/OOP, if SQL generate JOIN/aggregation queries, if AWS generate SDK/boto3 tasks. Return ONLY a JSON array: [{"title":"${skillToUse}-specific title","description":"problem description","starterCode":"// ${skillToUse} starter code here","testCases":[{"input":"...","expected":"..."}]}]. No extra text.`
                : type === 'debugging'
                ? `Generate exactly ${targetCount} debugging questions with buggy ${skillToUse} code snippets. Each snippet must contain a real ${skillToUse}-specific bug. Return ONLY a JSON array: [{"description":"what to find","buggyCode":"actual ${skillToUse} code with bug","fixHint":"hint"}]. No extra text.`
                : type === 'scenario'
                ? `Generate exactly ${targetCount} real-world scenario questions for a ${skillToUse} developer. Each scenario must be specific to ${skillToUse} use cases. Return ONLY a JSON array: [{"scenario":"real ${skillToUse} situation","question":"what would you do?","expectedPoints":["point1","point2"]}]. No extra text.`
                : '[]';
          const data = await executeAI(`skill assessment: ${prompt}`, { systemPrompt: 'You are a technical assessment creator. Return ONLY valid JSON. Generate the exact number of questions specified.' });
          const reply = (data as any)?.result?.reply || (data as any)?.result?.advice || '[]';
          const parsed = parseJSONArray(reply);
          generatedQuestions = Array.isArray(parsed) ? parsed : [];
          if (generatedQuestions.length > 0) {
            try { localStorage.setItem(qCacheKey, JSON.stringify(generatedQuestions)); } catch { }
          }
        } catch (e) {}
        }

        // Validate and fix generated questions
        const validQuestions = generatedQuestions
          .filter((q: any) => (type === 'mcq' && q.question && Array.isArray(q.options) && q.options.length >= 2 && typeof q.correct !== 'undefined') ||
                       (type === 'coding' && q.title && q.description) ||
                       (type === 'debugging' && q.buggyCode && q.description) ||
                       (type === 'scenario' && q.scenario && q.question))
          .slice(0, targetCount);

        // If not enough valid questions, use fallback
        if (validQuestions.length < targetCount) {
          const fallback = generateFallbackQuestions(skillToUse, [type]);
          const typeFallback = fallback.filter(q => q.type === type).slice(0, Math.max(0, targetCount - validQuestions.length));
          validQuestions.push(...typeFallback);
        }

        // Ensure we have exactly the target count
        const finalQuestions = validQuestions.slice(0, targetCount);
        if (finalQuestions.length > 0) {
          aiQuestions.push(...finalQuestions.map((q: any) => ({ ...q, type })));
        } else {
          // Ultimate fallback
          const fallback = type === 'mcq' ? 'No MCQ questions available' :
                         type === 'coding' ? 'No coding challenges available' :
                         type === 'debugging' ? 'No debugging questions available' :
                         type === 'scenario' ? 'No scenario questions available' : '';
          aiQuestions.push({
            type,
            question: `No questions available for ${type} assessment`,
            description: fallback,
            title: type === 'coding' ? 'Coding Challenge' : undefined,
            scenario: type === 'scenario' ? 'Scenario' : undefined,
            buggyCode: type === 'debugging' ? 'const bug = require(`./bugs/${skillToUse}.js`);' : undefined,
            options: type === 'mcq' ? ['Option 1', 'Option 2', 'Option 3', 'Option 4'] : undefined,
            correct: type === 'mcq' ? 0 : undefined,
            starterCode: type === 'coding' ? `// ${skillToUse} assessment\nfunction solution() {\n  // Implement here\n}` : undefined,
            testCases: type === 'coding' ? [] : undefined,
            expectedPoints: type === 'scenario' ? [] : undefined,
          });
        }
      }
      // Validate distribution
      const counts: Record<string, number> = { mcq: 0, coding: 0, debugging: 0, scenario: 0 };
      aiQuestions.forEach((q: any) => {
        const questionType = String(q?.type ?? '');
        if (counts[questionType] !== undefined) counts[questionType]++;
      });

      console.log('Question distribution:', counts);
      // Fallback if AI fails
      const questions = aiQuestions.length >= 5 ? aiQuestions : generateFallbackQuestions(skillToUse, questionTypes);
      const skillsCovered = await aiGenerateSkillsCovered(skillToUse);
      setAssessment({
        id: `local-${Date.now()}`,
        skill: skillToUse,
        questions,
        totalQuestions: questions.length,
        timeLimit: computeDurationMinutes(questions.length),
        passingScore: 70,
        difficulty: assessmentDifficulty,
        skillsCovered,
      });
      setAnswers(new Array(questions.length).fill(null));
      setCurrentQ(0);
      setTimeLimitFromQuestions(questions.length);
      setStep('detail');
    } catch {
      const questions = generateFallbackQuestions(skillToUse, questionTypes);
      const skillsCovered = await aiGenerateSkillsCovered(skillToUse);
      setAssessment({
        id: `local-${Date.now()}`,
        skill: skillToUse,
        questions,
        totalQuestions: questions.length,
        timeLimit: computeDurationMinutes(questions.length),
        passingScore: 70,
        difficulty: assessmentDifficulty,
        skillsCovered,
      });
      setAnswers(new Array(questions.length).fill(null));
      setCurrentQ(0);
      setTimeLimitFromQuestions(questions.length);
      setStep('detail');
    } finally { setLoading(false); }
  };

  const computeDurationMinutes = (count: number) => {
    const hasCoding = questionTypes.includes('coding');
    const base = count * (hasCoding ? 4 : 2);
    return Math.max(15, Math.min(120, base));
  };

  const setTimeLimitFromQuestions = (count: number) => {
    setTimeLeft(computeDurationMinutes(count) * 60);
  };

  const parseJSONArray = (str: string): any[] => {
    try {
      // Try to extract JSON array
      const match = str.match(/\[[\s\S]*\]/);
      if (match) return JSON.parse(match[0]);
      return JSON.parse(str);
    } catch { return []; }
  };

  const generateSkillsCoveredFallback = (skill: string) => {
    const map: Record<string, string[]> = {
      React: ['Hooks', 'Redux', 'Performance', 'TypeScript', 'API', 'Routing', 'Testing', 'Components'],
      JavaScript: ['ES6+', 'Async/Await', 'Closures', 'DOM', 'Promises', 'Modules', 'Error Handling'],
      Python: ['Data Structures', 'OOP', 'Libraries', 'File I/O', 'Decorators', 'Generators', 'Testing'],
      AWS: ['EC2', 'S3', 'Lambda', 'DynamoDB', 'API Gateway', 'CloudFormation', 'IAM', 'VPC'],
      'Node.js': ['Express', 'Async', 'NPM', 'Middleware', 'REST APIs', 'Authentication', 'Databases'],
      SQL: ['Joins', 'Subqueries', 'Indexing', 'Normalization', 'Transactions', 'Window Functions'],
      TypeScript: ['Types', 'Interfaces', 'Generics', 'Enums', 'Decorators', 'Utility Types', 'Modules'],
      Docker: ['Images', 'Containers', 'Compose', 'Volumes', 'Networks', 'Dockerfile', 'Registry'],
    };
    return map[skill] || [skill, 'Core Concepts', 'Best Practices', 'Problem Solving'];
  };

  const generateFallbackQuestions = (skill: string, types?: string[]) => {
    const activeTypes = types || questionTypes;
    const bank: Record<string, any[]> = {
      JavaScript: [
        { type: 'mcq', question: 'What does `typeof null` return?', options: ['null', 'undefined', 'object', 'string'], correct: 2 },
        { type: 'mcq', question: 'Which method removes last element?', options: ['shift()', 'pop()', 'splice()', 'slice()'], correct: 1 },
        { type: 'mcq', question: 'What is a closure?', options: ['A loop', 'Function with access to outer scope', 'Error handler', 'Class method'], correct: 1 },
        { type: 'mcq', question: 'What does `===` check?', options: ['Value', 'Type', 'Value & type', 'Reference'], correct: 2 },
        { type: 'mcq', question: 'Which is block-scoped?', options: ['var', 'let', 'function', 'const only'], correct: 1 },
        { type: 'mcq', question: 'What does `map()` return?', options: ['Original array', 'New array', 'undefined', 'Boolean'], correct: 1 },
        { type: 'mcq', question: 'What is the event loop?', options: ['A for loop', 'Async operation handler', 'DOM event', 'CSS animation'], correct: 1 },
        { type: 'mcq', question: 'NOT a JS data type?', options: ['Symbol', 'BigInt', 'Float', 'undefined'], correct: 2 },
        { type: 'mcq', question: 'What does `Promise.all()` do?', options: ['Sequential', 'Parallel waits all', 'Returns first resolved', 'Cancels all'], correct: 1 },
        { type: 'mcq', question: 'What is hoisting?', options: ['Server code move', 'Declarations moved to top', 'CSS property', 'Async pattern'], correct: 1 },
        { type: 'scenario', scenario: 'Your app loads slowly', question: 'How would you improve performance?', expectedPoints: ['Analyze bottlenecks', 'Code splitting', 'Lazy loading', 'Memoization', 'CDN'] },
        { type: 'scenario', scenario: 'Users report data loss', question: 'How do you debug this?', expectedPoints: ['Reproduce', 'Check logs', 'Review recent changes', 'Add error tracking'] },
        { type: 'debugging', buggyCode: 'const a = [1,2,3];\nconsole.log(a.map(x => x * 2).filter(x => x > 5).reduce((a,b) => a - b, 0));', description: 'Find the logical bug', fixHint: 'Check reduce direction' },
        { type: 'coding', title: 'Implement Array Flatten', description: 'Write a function that flattens nested arrays', starterCode: 'function flatten(arr) {\n  // your code\n}' },
        { type: 'coding', title: 'Deep Clone Object', description: 'Implement deep clone without JSON.parse', starterCode: 'function deepClone(obj) {\n  // your code\n}' },
      ],
      React: [
        { type: 'mcq', question: 'Which hook for side effects?', options: ['useState', 'useEffect', 'useContext', 'useRef'], correct: 1 },
        { type: 'mcq', question: 'What does JSX stand for?', options: ['JavaScript XML', 'Java Syntax', 'JSON XML', 'JS Extension'], correct: 0 },
        { type: 'mcq', question: 'What is Virtual DOM?', options: ['Real DOM', 'Lightweight DOM copy', 'CSS framework', 'Database'], correct: 1 },
        { type: 'mcq', question: 'Which hook manages state?', options: ['useEffect', 'useContext', 'useState', 'useReducer'], correct: 2 },
        { type: 'mcq', question: 'What are keys used for?', options: ['Styling', 'Unique list identification', 'Events', 'API calls'], correct: 1 },
        { type: 'mcq', question: 'What is prop drilling?', options: ['Build tool', 'Passing props through levels', 'CSS technique', 'Testing'], correct: 1 },
        { type: 'mcq', question: 'What does useCallback do?', options: ['Fetch data', 'Memoize function', 'Create ref', 'Manage state'], correct: 1 },
        { type: 'mcq', question: 'What is Context for?', options: ['Routing', 'Global state without prop drilling', 'Styling', 'Testing'], correct: 1 },
        { type: 'scenario', scenario: 'Component re-renders too often', question: 'How do you optimize?', expectedPoints: ['React.memo', 'useMemo', 'useCallback', 'Code splitting'] },
        { type: 'scenario', scenario: 'API data not updating UI', question: 'How would you debug?', expectedPoints: ['Check state update', 'useEffect deps', 'Stale closures', 'React Query'] },
      ],
      TypeScript: [
        { type: 'mcq', question: 'What is a type alias?', options: ['Variable name', 'Custom type name', 'Function parameter', 'Interface only'], correct: 1 },
        { type: 'mcq', question: 'What does `keyof` do?', options: ['Gets keys of object type', 'Sorts object', 'Filters array', 'Creates array'], correct: 0 },
        { type: 'mcq', question: 'What is `never` type?', options: ['No value', 'Any value', 'Null only', 'Undefined only'], correct: 0 },
        { type: 'mcq', question: 'What does `extends` do in generics?', options: ['Inherits class', 'Constrains type parameter', 'Creates interface', 'Imports module'], correct: 1 },
        { type: 'mcq', question: 'What is `Partial<T>`?', options: ['All props required', 'All props optional', 'Readonly props', 'Pick props'], correct: 1 },
        { type: 'scenario', scenario: 'API returns unknown data', question: 'How to type safely?', expectedPoints: ['Type guards', 'Zod validation', 'Type predicates', 'Exhaustive checks'] },
      ],
      Python: [
        { type: 'mcq', question: 'What is a decorator?', options: ['Function that modifies another function', 'Class method', 'Variable type', 'Loop construct'], correct: 0 },
        { type: 'mcq', question: 'What does `__init__` do?', options: ['Import module', 'Initialize object', 'Define class', 'Handle errors'], correct: 1 },
        { type: 'mcq', question: 'What is a generator?', options: ['List creator', 'Lazy iterator', 'Class factory', 'Decorator'], correct: 1 },
        { type: 'mcq', question: 'What is GIL?', options: ['Global Import Lock', 'Global Interpreter Lock', 'Generic Interface Layer', 'Garbage Index Limit'], correct: 1 },
        { type: 'scenario', scenario: 'Memory leak in Python app', question: 'How to investigate?', expectedPoints: ['tracemalloc', 'objgraph', 'Weak references', 'GC tuning'] },
      ],
      SQL: [
        { type: 'mcq', question: 'What does JOIN do?', options: ['Combines rows from tables', 'Filters rows', 'Sorts data', 'Groups data'], correct: 0 },
        { type: 'mcq', question: 'What is a primary key?', options: ['Unique identifier', 'Foreign reference', 'Index', 'Default value'], correct: 0 },
        { type: 'mcq', question: 'What does GROUP BY do?', options: ['Sorts rows', 'Aggregates rows', 'Filters rows', 'Joins tables'], correct: 1 },
        { type: 'mcq', question: 'What is ACID?', options: ['Atomicity, Consistency, Isolation, Durability', 'A, C, I, D', 'Access Control', 'Auto Commit'], correct: 0 },
        { type: 'scenario', scenario: 'Slow query on large table', question: 'How to optimize?', expectedPoints: ['Add indexes', 'EXPLAIN ANALYZE', 'Partition', 'Denormalize'] },
      ],
      Docker: [
        { type: 'mcq', question: 'What is a container?', options: ['VM', 'Isolated process', 'Database', 'Network'], correct: 1 },
        { type: 'mcq', question: 'What does Dockerfile do?', options: ['Runs container', 'Builds image', 'Orchestrates', 'Monitors'], correct: 1 },
        { type: 'mcq', question: 'What is a volume?', options: ['Persistent storage', 'Network', 'CPU limit', 'Memory limit'], correct: 0 },
        { type: 'scenario', scenario: 'Container exits immediately', question: 'How to debug?', expectedPoints: ['Check logs', 'Entry point', 'Keep running', 'Interactive mode'] },
      ],
      AWS: [
        { type: 'mcq', question: 'What is EC2?', options: ['Storage', 'Virtual servers', 'Database', 'CDN'], correct: 1 },
        { type: 'mcq', question: 'What is S3?', options: ['Compute', 'Object storage', 'Queue', 'DNS'], correct: 1 },
        { type: 'mcq', question: 'What is Lambda?', options: ['Serverless functions', 'Load balancer', 'VPC', 'Monitoring'], correct: 0 },
        { type: 'scenario', scenario: 'Need highly available web app', question: 'Which AWS services?', expectedPoints: ['ELB', 'Auto Scaling', 'Multi-AZ', 'RDS Multi-AZ'] },
      ],
      'Node.js': [
        { type: 'mcq', question: 'What is npm?', options: ['Node package manager', 'New project maker', 'Node process monitor', 'Network port manager'], correct: 0 },
        { type: 'mcq', question: 'What is Express?', options: ['Database', 'Web framework', 'Testing tool', 'Build tool'], correct: 1 },
        { type: 'mcq', question: 'What is middleware?', options: ['Database layer', 'Request handler chain', 'UI component', 'Config file'], correct: 1 },
        { type: 'scenario', scenario: 'API too slow', question: 'How to optimize Node.js?', expectedPoints: ['Connection pooling', 'Caching', 'Async/await', 'Clustering'] },
      ],
    };
    const questions = bank[skill] || generateGenericForSkill(skill, activeTypes);
    return questions.map((q: any, i: number) => ({ ...q, id: i + 1 }));
  };

  const generateGenericForSkill = (skill: string, types?: string[]) => {
    const activeTypes = types || questionTypes;
    const all = [
      { type: 'mcq', question: `What is the main purpose of ${skill}?`, options: ['Web development', 'Data processing', 'Depends on use case', 'All of the above'], correct: 3 },
      { type: 'mcq', question: `Which feature is most important in ${skill}?`, options: ['Performance', 'Scalability', 'Ease of use', 'Depends on context'], correct: 3 },
      { type: 'mcq', question: `How do you debug ${skill} code?`, options: ['Logging', 'Debugger', 'Both', 'Neither'], correct: 2 },
      { type: 'mcq', question: `Which tool integrates well with ${skill}?`, options: ['Git', 'Docker', 'CI/CD', 'All of the above'], correct: 3 },
      { type: 'mcq', question: `What is best practice for ${skill}?`, options: ['Write clean code', 'Test thoroughly', 'Document', 'All of the above'], correct: 3 },
      { type: 'scenario', scenario: `Critical bug in ${skill} production code`, question: 'How do you resolve?', expectedPoints: ['Identify root cause', 'Write fix', 'Test', 'Deploy', 'Monitor'] },
      { type: 'scenario', scenario: `Scaling a ${skill} application`, question: 'What strategies would you apply?', expectedPoints: ['Profiling', 'Caching', 'Load balancing', 'Optimize queries'] },
      { type: 'coding', title: `${skill} Core Implementation`, description: `Implement a core utility function commonly used in ${skill} development`, starterCode: `// ${skill} implementation\n// Write your solution below\n\nfunction solution(input) {\n  // TODO: implement\n}` },
      { type: 'coding', title: `${skill} Data Processing`, description: `Write a ${skill} function to process and transform a dataset`, starterCode: `// ${skill} data processing\n\nfunction processData(data) {\n  // TODO: filter, transform, and return result\n}` },
      { type: 'debugging', description: `Find and fix the bug in this ${skill} code`, buggyCode: `// Buggy ${skill} code\nfunction calculate(items) {\n  let total = 0;\n  for (let i = 0; i <= items.length; i++) { // Bug: should be <\n    total += items[i].value;\n  }\n  return total;\n}`, fixHint: `Check the loop boundary condition` },
      { type: 'debugging', description: `This ${skill} async function has a bug`, buggyCode: `// Buggy async ${skill} code\nasync function fetchData(url) {\n  const res = fetch(url); // Bug: missing await\n  return res.json();\n}`, fixHint: 'Check async/await usage' },
    ];
    return all.filter((q: any) => activeTypes.includes(q.type));
  };

  const submitAssessment = async () => {
    setLoading(true);
    let correctCount = 0;
    const questionResults = assessment.questions.map((q: any, i: number) => {
      const a = answers[i];
      // support both field names: fallback questions use `correct`, AI questions use `correctAnswer`
      const correctIdx = q.correct !== undefined ? q.correct : q.correctAnswer;
      const isCorrect = correctIdx !== undefined && a !== null && a !== undefined && Number(a) === Number(correctIdx);
      if (isCorrect) correctCount++;
      return { ...q, correct: correctIdx, userAnswer: a, isCorrect, points: isCorrect ? 10 : 0 };
    });
    const mcqScore = assessment.questions.filter((q: any) => q.type === 'mcq').length > 0
      ? Math.round((correctCount / assessment.questions.filter((q: any) => q.type === 'mcq').length) * 100) : 0;
    const overallScore = Math.min(100, Math.round((correctCount / Math.max(1, assessment.questions.filter((q: any) => q.correct !== undefined || q.correctAnswer !== undefined).length)) * 100));

    // AI-powered evaluation
    let skillBreakdown: Record<string, number> = {};
    const aiEval = await aiEvaluateAnswers(assessment.questions, answers, selectedSkill);
    if (aiEval) {
      // Clamp all AI skill scores to 0-100
      skillBreakdown = Object.fromEntries(
        Object.entries(aiEval.skillScores || {}).map(([k, v]) => [k, Math.max(0, Math.min(100, Number(v) || 0))])
      );
      setAiMissingSkills(aiEval.missingSkills || []);
    } else {
      skillBreakdown = generateSkillsCoveredFallback(selectedSkill).reduce((acc: any, s: string) => {
        acc[s] = Math.max(0, Math.min(100, overallScore + Math.floor(Math.random() * 20) - 10));
        return acc;
      }, {});
    }

    const res = {
      assessmentId: assessment.id,
      skill: selectedSkill,
      score: overallScore,
      mcqScore,
      vivaScore: 0,
      correctCount,
      totalQuestions: assessment.totalQuestions,
      timeSpent: Math.max(0, (assessment.timeLimit * 60) - timeLeft),
      passingScore: 70,
      passed: overallScore >= 70,
      questions: questionResults,
      skillBreakdown,
      completedAt: new Date().toISOString(),
      difficulty: assessment.difficulty,
    };
    setResult(res);
    localStorage.setItem(`assessment_local-${assessment.id}`, JSON.stringify(res));
    // Save to backend so AI Mentor can access results
    try {
      const token = tokenStorage.getAccess();
      if (token) {
        await fetch(`${API_BASE_URL}/skill-assessments/save-local`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            assessmentId: assessment.id,
            skill: selectedSkill,
            score: overallScore,
            questions: questionResults,
            answers,
            timeSpent: Math.max(0, (assessment.timeLimit * 60) - timeLeft),
            skillBreakdown,
            difficulty: assessment.difficulty,
            passed: overallScore >= 70,
          }),
        });
      }
    } catch (e) {
      console.warn('Failed to save assessment to backend:', e);
    }
    fetchMyAssessments();
    setLoading(false);
    setStep('result');
  };

  const startAssessment = () => { setStep('in-progress'); setCurrentQ(0); };

  const askMentor = async () => {
    if (!mentorInput.trim() || mentorLoading) return;
    const userQuestion = mentorInput;
    setMentorChat(prev => [...prev, { role: 'user', content: userQuestion }]);
    setMentorInput('');
    setMentorLoading(true);

    const skill = result?.skill ?? selectedSkill;
    const score = result?.score ?? 0;

    // Inline the assessment context into the prompt so the AI answers the current question
    const questionSummary = (result?.questions || []).map((q: any, i: number) => {
      const qText = q.question || q.title || q.scenario || q.description || `Question ${i + 1}`;
      const userAns = q.options?.[q.userAnswer] ?? (q.userAnswer != null ? String(q.userAnswer) : 'Not answered');
      const correctAns = q.correct !== undefined ? (q.options?.[q.correct] ?? String(q.correct)) : 'Open ended';
      const status = q.correct === undefined ? 'open-ended' : q.isCorrect ? 'correct' : 'wrong';
      return `Q${i + 1} [${status}]: ${qText}${q.options ? ` | User: ${userAns} | Correct: ${correctAns}` : ''}`;
    }).join('\n');

    const systemPrompt = `You are an AI Mentor for a ${skill} skill assessment. The student scored ${score}%.

Assessment questions and results:
${questionSummary || 'No questions available.'}

Answer the student's question directly and specifically based on the assessment above. Do NOT describe platform features. Give a clear, educational explanation.`;

    try {
      const data = await executeAI(
        `mentor: ${userQuestion}`,
        { systemPrompt, history: mentorChat.map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.content })) }
      );
      const reply = (data as any)?.result?.reply || (data as any)?.result?.advice;
      setMentorChat(prev => [...prev, {
        role: 'ai',
        content: reply || 'I could not generate an explanation. Try asking "Why was question 2 wrong?" or "Explain the correct answer for Q3".',
      }]);
    } catch {
      setMentorChat(prev => [...prev, { role: 'ai', content: 'Having trouble connecting. Please try again.' }]);
    } finally {
      setMentorLoading(false);
    }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  const avgScore = myAssessments.length ? Math.round(myAssessments.reduce((s: number, a: any) => s + a.score, 0) / myAssessments.length) : 0;
  const passedCount = myAssessments.filter((a: any) => a.score >= 70).length;

  // Compute per-skill readiness from actual assessment results
  const skillReadinessMap: Record<string, number> = {};
  myAssessments.forEach((a: any) => {
    if (!skillReadinessMap[a.skill] || a.score > skillReadinessMap[a.skill]) {
      skillReadinessMap[a.skill] = a.score;
    }
  });

  // Difficulty/Category filtering
  const fallbackSkills = aiSkillSuggestions.length > 0 ? aiSkillSuggestions : [];
  const categories = [...new Set(fallbackSkills.map((s: any) => s.category || '').filter(Boolean))];
  const filteredSkills = fallbackSkills.filter((s: any) => {
    if (selectedDifficulty !== 'All' && s.difficulty && s.difficulty !== selectedDifficulty) return false;
    if (selectedCategory && s.category !== selectedCategory) return false;
    return true;
  });

  // Color gradients for bars
  const barColors = ['#6366F1', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B'];
  const barColorsEnd = ['#A78BFA', '#C084FC', '#F472B6', '#34D399', '#FBBF24'];

  const currentQuestion = assessment?.questions?.[currentQ];
  const isMcq = currentQuestion?.type === 'mcq';
  const isCoding = currentQuestion?.type === 'coding';
  const isDebugging = currentQuestion?.type === 'debugging';
  const isScenario = currentQuestion?.type === 'scenario';

  // ── DASHBOARD ──────────────────────────────────────────────────────────────
  if (step === 'dashboard') return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* ── TOP HERO ── */}
        <div className="relative bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 rounded-3xl p-8 mb-8 overflow-hidden">
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-5 right-1/4 w-96 h-96 bg-indigo-500 rounded-full blur-[150px]" />
            <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-purple-500 rounded-full blur-[130px]" />
          </div>
          <div className="relative flex items-center gap-8 flex-wrap">
            {/* Left: Welcome */}
            <div className="flex-1 min-w-[240px]">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/10">
                  <Brain className="w-6 h-6 text-indigo-300" />
                </div>
                <div>
                  <p className="text-white/60 text-xs font-medium uppercase tracking-wider">AI Skill Assessment</p>
                  <h1 className="text-xl sm:text-2xl font-bold text-white">
                    Welcome back{user?.name ? `, ${user.name}` : ''} 👋
                  </h1>
                </div>
              </div>
              <p className="text-indigo-300/70 text-sm">Measure your skills with AI-powered assessments & earn verified certificates</p>
              <div className="flex gap-3 mt-5">
                <button onClick={() => {
                  if (myAssessments.length > 0) {
                    const last = myAssessments[0];
                    setSelectedSkill(last.skill);
                    generateAssessment(last.skill);
                  } else if (aiSkillSuggestions.length > 0) {
                    setSelectedSkill(aiSkillSuggestions[0].name);
                    generateAssessment(aiSkillSuggestions[0].name);
                  } else {
                    const el = document.getElementById('skill-search');
                    if (el) el.focus();
                  }
                }}
                  disabled={loading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white text-gray-900 rounded-xl text-sm font-semibold hover:bg-gray-100 transition-all shadow-lg shadow-black/20 disabled:opacity-60">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  {loading ? 'Generating...' : (myAssessments.length > 0 ? 'Continue Assessment' : 'Start Assessment')}
                </button>
                <button onClick={() => { setSelectedSkill(''); const el = document.getElementById('skill-search'); if (el) el.focus(); }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white/10 backdrop-blur-sm text-white border border-white/10 rounded-xl text-sm font-medium hover:bg-white/20 transition-all">
                  <Search className="w-4 h-4" /> Browse Skills
                </button>
              </div>
            </div>

            {/* Right: Overall Readiness */}
            <div className="flex items-center gap-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl px-6 py-5">
              {/* Readiness Ring */}
              <div className="relative w-20 h-20 flex-shrink-0">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 72 72">
                  <circle cx="36" cy="36" r="30" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
                  <circle cx="36" cy="36" r="30" fill="none" stroke="url(#readinessGrad)" strokeWidth="6" strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 30}`} strokeDashoffset={`${2 * Math.PI * 30 * (1 - (avgScore || 0) / 100)}`} className="transition-all duration-1000" />
                  <defs><linearGradient id="readinessGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#818CF8" /><stop offset="100%" stopColor="#A78BFA" /></linearGradient></defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-black text-white">{avgScore || 0}<span className="text-xs text-indigo-300">%</span></span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-indigo-200/60 text-xs uppercase tracking-wider mb-1">Overall Readiness</p>
                <p className="text-white text-sm font-medium">
                  {myAssessments.length > 0 ? `${passedCount} Passed` : 'Not started'}
                </p>
                {myAssessments.length > 0 && (
                  <p className="text-emerald-400 text-xs mt-0.5">↑ {Math.round(passedCount / Math.max(1, myAssessments.length) * 100)}% pass rate</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── 3-COLUMN LAYOUT ── */}
        <div className="flex gap-6 flex-col lg:flex-row">

          {/* === LEFT COLUMN (Categories + History) === */}
          <div className="w-full lg:w-[260px] flex-shrink-0 space-y-6">

            {/* Search */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input id="skill-search" type="text" value={selectedSkill} onChange={e => setSelectedSkill(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && selectedSkill && generateAssessment()}
                  placeholder="Search skills..."
                  className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400"
                />
              </div>
            </div>

            {/* Categories */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Categories</h3>
              <div className="space-y-1">
                <button onClick={() => setSelectedCategory('')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors font-medium ${!selectedCategory ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-700'}`}>
                  All Categories
                </button>
                {categories.map(cat => (
                  <button key={cat} onClick={() => setSelectedCategory(cat)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors font-medium ${selectedCategory === cat ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-700'}`}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Assessment History */}
            {myAssessments.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Recent Activity</h3>
                <div className="space-y-2">
                  {myAssessments.slice(0, 4).map((a: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                        a.score >= 70 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                      }`}>{a.skill?.slice(0, 2).toUpperCase()}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800 truncate">{a.skill}</p>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold ${a.score >= 70 ? 'text-emerald-600' : 'text-amber-500'}`}>{a.score}%</span>
                          <span className="text-[10px] text-gray-400">{a.completedAt ? new Date(a.completedAt).toLocaleDateString() : ''}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* === CENTER: Main Content === */}
          <div className="flex-1 min-w-0 space-y-6">

            {/* ── Analytics KPIs ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Assessments', value: myAssessments.length, icon: FileText, color: 'from-indigo-500 to-blue-600', bg: 'bg-indigo-50' },
                { label: 'Passed', value: passedCount, icon: Award, color: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-50' },
                { label: 'Certificates', value: myAssessments.filter((a: any) => a.score >= 70).length, icon: Star, color: 'from-amber-500 to-orange-600', bg: 'bg-amber-50' },
                { label: 'Avg Score', value: `${avgScore}%`, icon: TrendingUp, color: 'from-purple-500 to-pink-600', bg: 'bg-purple-50' },
              ].map((k, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <div className={`w-9 h-9 rounded-xl ${k.bg} flex items-center justify-center`}>
                      <k.icon className="w-4 h-4 text-gray-600" />
                    </div>
                  </div>
                  <p className="text-2xl font-black text-gray-900">{k.value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{k.label}</p>
                </div>
              ))}
            </div>

            {/* ── Featured Assessments ── */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Featured Assessments</h2>
                <div className="flex gap-1.5">
                  {['All', ...new Set(fallbackSkills.map((s: any) => s.difficulty).filter(Boolean))].map(d => (
                    <button key={d} onClick={() => setSelectedDifficulty(d)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedDifficulty === d ? 'bg-indigo-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{d}</button>
                  ))}
                </div>
              </div>
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {filteredSkills.length > 0 ? (
                  filteredSkills.map((s: any) => {
                    const SkillIcon = skillIconMapComp[s.icon] || Code;
                    return (
                      <button key={s.name} onClick={() => { setSelectedSkill(s.name); generateAssessment(s.name); }}
                        className="group bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all text-left relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 opacity-5">
                          <div className={`w-full h-full rounded-full ${s.color || 'bg-indigo-500'} blur-2xl`} />
                        </div>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                            <SkillIcon className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-900 text-sm truncate">{s.name}</p>
                            <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                              {s.difficulty || 'Intermediate'} • {s.duration || 30} min
                            </p>
                          </div>
                        </div>
                        {/* Real stats from user history */}
                        {(() => {
                          const skillHistory = myAssessments.filter((a: any) => a.skill === s.name);
                          const attempted = skillHistory.length;
                          const bestScore = attempted ? Math.max(...skillHistory.map((a: any) => a.score)) : null;
                          const qCount = questionTypes.reduce((acc, t) => {
                            const counts: Record<string, number> = { mcq: 5, coding: 2, debugging: 3, scenario: 3, viva: 0 };
                            return acc + (counts[t] || 2);
                          }, 0);
                          return (
                            <div className="flex items-center gap-2 text-[10px] text-gray-400 mb-3">
                              <span className="flex items-center gap-1"><FileText className="w-3 h-3" />{qCount} Q</span>
                              {attempted > 0 ? (
                                <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                                  <CheckCircle className="w-3 h-3" />Best: {bestScore}%
                                </span>
                              ) : (
                                <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-400" />{s.rating || '4.5'}</span>
                              )}
                            </div>
                          );
                        })()}
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-gray-400">{s.candidates || '120K'} candidates</span>
                          <span className="flex items-center gap-1 text-xs font-semibold text-indigo-600 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0">
                            Start <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="col-span-full text-center py-10 text-sm text-gray-400">
                    No assessments match the selected filters.
                  </div>
                )}
              </div>
            </div>

            {/* ── Assessment Types (Feature Cards) ── */}
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4">Assessment Types</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {assessmentTypes.slice(0, 4).map(t => {
                  const Icon = iconMap[t.icon] || Code;
                  return (
                    <button key={t.id} onClick={() => setQuestionTypes(prev =>
                      prev.includes(t.id) ? prev.filter(x => x !== t.id) : [...prev, t.id]
                    )}
                      className={`group bg-white rounded-2xl border shadow-sm p-5 text-left transition-all hover:shadow-md hover:-translate-y-0.5 ${
                        questionTypes.includes(t.id) ? 'border-indigo-200 ring-2 ring-indigo-500/20' : 'border-gray-100'
                      }`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-colors ${
                        questionTypes.includes(t.id) ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 group-hover:bg-indigo-50'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <p className="font-semibold text-gray-900 text-sm mb-1">{t.label}</p>
                      <p className="text-xs text-gray-500 leading-relaxed">{t.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Previous Assessments (full width, for logged in users) ── */}
            {myAssessments.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-gray-900">Assessment History</h2>
                  <span className="text-xs text-gray-400">{myAssessments.length} total</span>
                </div>
                <div className="space-y-3">
                  {myAssessments.map((a: any, i: number) => (
                    <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                        a.score >= 70 ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-amber-50 text-amber-600 border border-amber-200'
                      }`}>{a.skill?.slice(0, 2).toUpperCase()}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-semibold text-gray-800">{a.skill}</span>
                          <span className={`text-sm font-bold ${a.score >= 70 ? 'text-emerald-600' : 'text-amber-500'}`}>{a.score}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full transition-all duration-500 ${a.score >= 70 ? 'bg-emerald-500' : 'bg-amber-400'}`} style={{ width: `${a.score}%` }} />
                        </div>
                      </div>
                      {a.score >= 70 && <span className="text-xs bg-emerald-50 text-emerald-600 border border-emerald-200 px-2.5 py-0.5 rounded-full font-medium">Passed</span>}
                      <button onClick={() => onNavigate('assessment-review', { assessmentId: a.assessmentId })}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1">
                        Review <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* === RIGHT COLUMN (AI Insights + Progress) === */}
          <div className="w-full lg:w-[280px] flex-shrink-0 space-y-6">

            {/* AI Coach */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-5 shadow-lg shadow-indigo-200">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="text-xs font-bold text-white/80 uppercase tracking-wider">AI Coach</span>
              </div>
              <p className="text-white/90 text-sm leading-relaxed mb-4">
                {aiCoachMessage || 'Start your first assessment to unlock personalized AI recommendations.'}
              </p>
              <button onClick={getAIRecommendations} disabled={recommendationLoading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white/15 backdrop-blur-sm text-white rounded-xl text-xs font-semibold hover:bg-white/25 transition-all border border-white/10 disabled:opacity-60 disabled:cursor-not-allowed">
                {recommendationLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lightbulb className="w-3.5 h-3.5" />}
                {recommendationLoading ? 'Analyzing...' : 'Get AI Recommendation'}
              </button>
            </div>

            {/* Skill Readiness Progress (computed from real assessment scores) */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Skill Readiness</h3>
              <div className="space-y-3">
                {(myAssessments.length > 0
                  ? Object.entries(skillReadinessMap).sort(([,a]: any, [,b]: any) => b - a).slice(0, 5)
                  : fallbackSkills.slice(0, 5).map((s: any) => [s.name, 0])
                ).map((entry: any, i: number) => {
                  const name = Array.isArray(entry) ? entry[0] : entry.name;
                  const score = Array.isArray(entry) ? entry[1] : 0;
                  return (
                    <div key={name}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-gray-700">{name}</span>
                        <span className="font-bold text-gray-900">{score}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className="h-2 rounded-full transition-all duration-700"
                          style={{ width: `${score}%`, background: `linear-gradient(90deg, ${barColors[i % barColors.length]}, ${barColorsEnd[i % barColorsEnd.length]})` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Career Target (editable) */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <input type="text" value={targetRole} onChange={e => setTargetRole(e.target.value)}
                    className="text-sm font-bold text-gray-900 bg-transparent border-b border-dashed border-gray-300 focus:border-indigo-500 outline-none w-full"
                  />
                  <p className="text-[10px] text-gray-400">Target Role (click to edit)</p>
                </div>
              </div>
              <div className="space-y-2">
                {[
                  { label: 'Current Readiness', value: avgScore || 0 },
                  { label: 'Required', value: 85 },
                  { label: 'Gap', value: Math.max(0, 85 - (avgScore || 0)) },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span className="text-gray-500">{item.label}</span>
                    <span className={`font-bold ${i === 2 ? (item.value > 0 ? 'text-amber-600' : 'text-emerald-600') : 'text-gray-900'}`}>{item.value}%</span>
                  </div>
                ))}
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 mt-3">
                <div className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-700" style={{ width: `${Math.min(100, avgScore || 0)}%` }} />
              </div>
            </div>

            {/* AI Insight: Recommended */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Quick Actions</h3>
              </div>
              <div className="space-y-2">
                <button onClick={() => { setSelectedSkill(''); setStep('dashboard'); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-all">
                  <RotateCcw className="w-3.5 h-3.5" /> New Assessment
                </button>
                <button onClick={() => { setAiMentorOpen(true); setMentorChat([]); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-all">
                  <Bot className="w-3.5 h-3.5" /> AI Mentor Chat
                </button>
                <button onClick={() => onNavigate('skill-gap-analysis')}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-all">
                  <TrendingUp className="w-3.5 h-3.5" /> Skill Gap Analysis
                </button>
                <button onClick={() => onNavigate('home')}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-all">
                  <Globe className="w-3.5 h-3.5" /> Browse Jobs
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer onNavigate={onNavigate} />

      {/* ── FLOATING AI MENTOR MODAL (available on all steps) ── */}
      {aiMentorOpen && step === 'dashboard' && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg flex flex-col" style={{ maxHeight: '80vh' }}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">AI Mentor</p>
                  <p className="text-xs text-gray-400">Ask anything about your skills or assessments</p>
                </div>
              </div>
              <button onClick={() => setAiMentorOpen(false)} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            {/* Chat */}
            <div ref={mentorChatRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3 min-h-[200px]">
              {mentorChat.length === 0 && (
                <div className="text-center py-8">
                  <Bot className="w-10 h-10 text-indigo-200 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">Hi! I'm your AI Mentor.</p>
                  <p className="text-xs text-gray-400 mt-1">Ask me about any skill, concept, or how to improve your assessment scores.</p>
                </div>
              )}
              {mentorChat.map((m, i) => (
                <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs flex-shrink-0 ${
                    m.role === 'ai' ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>{m.role === 'ai' ? 'AI' : 'U'}</div>
                  <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                    m.role === 'ai' ? 'bg-gray-50 border border-gray-100 text-gray-700' : 'bg-indigo-600 text-white'
                  }`}>{m.content}</div>
                </div>
              ))}
              {mentorLoading && (
                <div className="flex gap-2">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs flex-shrink-0">AI</div>
                  <div className="bg-gray-50 border border-gray-100 px-4 py-2.5 rounded-2xl">
                    <div className="flex gap-1 items-center">
                      {[0, 150, 300].map(d => <span key={d} className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />)}
                    </div>
                  </div>
                </div>
              )}
            </div>
            {/* Input */}
            <div className="px-5 py-4 border-t border-gray-100">
              <div className="flex gap-2">
                <input
                  type="text" value={mentorInput} onChange={e => setMentorInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && askMentor()}
                  placeholder="Ask about any skill or concept..."
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/40"
                  autoFocus
                />
                <button onClick={askMentor} disabled={mentorLoading || !mentorInput.trim()} className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center hover:bg-indigo-700 transition-colors disabled:opacity-50">
                  {mentorLoading ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Send className="w-4 h-4 text-white" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ── ASSESSMENT DETAIL ──────────────────────────────────────────────────────
  if (step === 'detail' && assessment) return (
    <div className="min-h-screen bg-gray-50">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />
      <div className="max-w-2xl mx-auto px-4 py-12">
        <BackButton onClick={() => setStep('dashboard')} className="mb-6" />

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 p-8 text-center">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/10">
              <Brain className="w-8 h-8 text-indigo-300" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">{assessment.skill} Assessment</h1>
            <p className="text-indigo-300/60 text-sm">AI-powered skill validation</p>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Clock, label: 'Duration', value: `${assessment.timeLimit} min` },
                { icon: Target, label: 'Difficulty', value: assessment.difficulty },
                { icon: Award, label: 'Passing Score', value: `${assessment.passingScore}%` },
                { icon: FileText, label: 'Questions', value: `${assessment.totalQuestions} Q` },
              ].map((s, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-4 text-center">
                  <s.icon className="w-5 h-5 text-indigo-500 mx-auto mb-1.5" />
                  <div className="text-sm font-bold text-gray-800">{s.value}</div>
                  <div className="text-xs text-gray-500">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Skills Covered */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Skills Covered</p>
              <div className="flex flex-wrap gap-2">
                {assessment.skillsCovered.map((s: string, i: number) => (
                  <span key={i} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-medium border border-indigo-100">{s}</span>
                ))}
              </div>
            </div>

            {/* Question Type Breakdown */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Question Types</p>
              <div className="space-y-2">
                {(() => {
                  const counts: Record<string, number> = {};
                  assessment.questions.forEach((q: any) => {
                    counts[q.type] = (counts[q.type] || 0) + 1;
                  });
                  return Object.entries(counts).map(([type, count]) => (
                    <div key={type} className="flex items-center gap-3 text-sm">
                      <span className="capitalize font-medium text-gray-700 w-24">{type}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-2">
                        <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${(count / assessment.totalQuestions) * 100}%` }} />
                      </div>
                      <span className="text-gray-500 text-xs">{count} Q</span>
                    </div>
                  ));
                })()}
            </div>
            </div>

            <button onClick={startAssessment}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3.5 rounded-2xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200">
              <Play className="w-4 h-4" /> Start Assessment
            </button>
          </div>
        </div>
      </div>
      <Footer onNavigate={onNavigate} />
    </div>
  );

  // ── IN PROGRESS ────────────────────────────────────────────────────────────
  if (step === 'in-progress' && assessment) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-800/80 backdrop-blur-sm border-b border-slate-700/50">
          <div>
            <p className="text-sm font-semibold text-white">{assessment.skill} Assessment</p>
            <p className="text-xs text-slate-400">Question {currentQ + 1} of {assessment.totalQuestions}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-700/50 rounded-xl px-3 py-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-300" />
              <span className={`text-sm font-mono font-bold ${timeLeft < 300 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                {formatTime(timeLeft)}
              </span>
            </div>
            <div className="flex gap-1">
              {Array.from({ length: assessment.totalQuestions }).map((_, i) => (
                <div key={i} className={`w-2 h-2 rounded-full ${answers[i] !== null ? 'bg-emerald-500' : i === currentQ ? 'bg-indigo-400 animate-pulse' : 'bg-slate-600'}`} />
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto px-6 py-8 max-w-4xl mx-auto w-full">
          {/* Question Type Badge */}
          <div className="flex items-center gap-2 mb-4">
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${
              isMcq ? 'bg-blue-900/30 text-blue-300 border border-blue-700/30' :
              isCoding ? 'bg-emerald-900/30 text-emerald-300 border border-emerald-700/30' :
              isDebugging ? 'bg-amber-900/30 text-amber-300 border border-amber-700/30' :
              isScenario ? 'bg-purple-900/30 text-purple-300 border border-purple-700/30' :
              'bg-slate-700 text-slate-300 border border-slate-600'
            }`}>
              {currentQuestion?.type?.toUpperCase() || 'MCQ'}
            </span>
          </div>

          {/* MCQ */}
          {isMcq && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-white leading-relaxed">{currentQuestion.question}</h2>
              <div className="space-y-3">
                {currentQuestion.options?.map((opt: string, i: number) => (
                  <button key={i} onClick={() => { const a = [...answers]; a[currentQ] = i; setAnswers(a); }}
                    className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl border text-left transition-all ${
                      answers[currentQ] === i ? 'bg-indigo-600/20 border-indigo-500/50 text-white' : 'bg-slate-800/50 border-slate-700/50 text-slate-300 hover:border-slate-500'
                    }`}>
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                      answers[currentQ] === i ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-400'
                    }`}>{String.fromCharCode(65 + i)}</span>
                    <span className="text-sm">{opt}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Coding */}
          {isCoding && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-white mb-2">{currentQuestion.title}</h2>
                <p className="text-sm text-slate-400">{currentQuestion.description}</p>
              </div>
              <div className="bg-slate-950 rounded-xl border border-slate-700/50 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 border-b border-slate-700/50">
                  <div className="w-3 h-3 rounded-full bg-red-500/50" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                  <div className="w-3 h-3 rounded-full bg-green-500/50" />
                  <span className="text-xs text-slate-500 ml-2">code-editor</span>
                </div>
                <textarea
                  value={answers[currentQ] !== null && answers[currentQ] !== undefined ? answers[currentQ] : (currentQuestion.starterCode || '')}
                  onChange={e => { const a = [...answers]; a[currentQ] = e.target.value; setAnswers(a); }}
                  onFocus={() => { if (answers[currentQ] === null || answers[currentQ] === undefined) { const a = [...answers]; a[currentQ] = currentQuestion.starterCode || ''; setAnswers(a); } }}
                  className="w-full bg-transparent text-sm text-slate-200 font-mono p-4 outline-none resize-none min-h-[200px]"
                  placeholder="Write your code here..."
                />
                <div className="flex items-center justify-between px-4 py-2 border-t border-slate-700/50">
                  <span className="text-xs text-slate-500">You can clear and rewrite from scratch</span>
                  <button
                    onClick={() => { const a = [...answers]; a[currentQ] = ''; setAnswers(a); }}
                    className="text-xs text-slate-400 hover:text-red-400 transition-colors px-2 py-1 rounded hover:bg-slate-800"
                  >Clear All</button>
                </div>
              </div>
            </div>
          )}

          {/* Debugging */}
          {isDebugging && (
            <div className="space-y-5">
              <p className="text-sm text-slate-400">{currentQuestion.description}</p>
              <div className="bg-slate-950 rounded-xl border border-slate-700/50 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 border-b border-slate-700/50">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-xs text-slate-500">buggy-code</span>
                </div>
                <pre className="p-4 text-sm text-red-300 font-mono overflow-x-auto whitespace-pre-wrap">{currentQuestion.buggyCode}</pre>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-400 mb-2">Your fix</p>
                <textarea value={answers[currentQ] || ''} onChange={e => { const a = [...answers]; a[currentQ] = e.target.value; setAnswers(a); }}
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 text-sm text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/40 min-h-[120px] resize-none"
                  placeholder="Explain the bug and your fix..."
                />
              </div>
            </div>
          )}

          {/* Scenario */}
          {isScenario && (
            <div className="space-y-5">
              <div className="bg-indigo-950/50 border border-indigo-800/30 rounded-xl p-5">
                <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2">Scenario</p>
                <p className="text-white text-sm">{currentQuestion.scenario}</p>
              </div>
              <p className="text-sm font-medium text-slate-300">{currentQuestion.question}</p>
              <textarea value={answers[currentQ] || ''} onChange={e => { const a = [...answers]; a[currentQ] = e.target.value; setAnswers(a); }}
                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 text-sm text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/40 min-h-[150px] resize-none"
                placeholder="Explain your approach..."
              />
              {currentQuestion.expectedPoints && (
                <div>
                  <p className="text-xs text-slate-500 mb-2">Consider addressing:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {currentQuestion.expectedPoints.map((p: string, i: number) => (
                      <span key={i} className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded-lg text-xs border border-slate-700">{p}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Navigation */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-800/80 backdrop-blur-sm border-t border-slate-700/50">
          <div className="flex gap-2">
            <button onClick={() => setCurrentQ(Math.max(0, currentQ - 1))} disabled={currentQ === 0}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-xl text-sm text-slate-300 hover:bg-slate-700 disabled:opacity-30 transition-all">
              <ChevronLeft className="w-4 h-4" /> Prev
            </button>
            <div className="hidden sm:flex gap-1.5 items-center">
              {assessment.questions.map((_: any, i: number) => (
                <button key={i} onClick={() => setCurrentQ(i)}
                  className={`w-7 h-7 rounded-lg text-[11px] font-semibold transition-all ${
                    i === currentQ ? 'bg-indigo-500 text-white' :
                    answers[i] !== null ? 'bg-emerald-900/50 text-emerald-300 border border-emerald-700/30' :
                    'bg-slate-700 text-slate-400 hover:bg-slate-600'
                  }`}>{i + 1}</button>
              ))}
            </div>
            <button onClick={() => setCurrentQ(Math.min(assessment.totalQuestions - 1, currentQ + 1))} disabled={currentQ === assessment.totalQuestions - 1}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-xl text-sm text-slate-300 hover:bg-slate-700 disabled:opacity-30 transition-all">
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <button onClick={submitAssessment} disabled={loading}
            className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold text-sm hover:from-indigo-700 hover:to-purple-700 disabled:opacity-40 transition-all flex items-center gap-2 shadow-lg">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Submit Assessment
          </button>
        </div>
      </div>
    );
  }

  // ── RESULT ──────────────────────────────────────────────────────────────────
  if (step === 'result' && result) return (
    <div className="min-h-screen bg-gray-50">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Hero Score */}
        <div className={`relative rounded-3xl p-8 text-center overflow-hidden ${
          result.passed ? 'bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900' : 'bg-gradient-to-br from-amber-900 via-amber-800 to-orange-900'
        }`}>
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-60 h-60 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-white rounded-full blur-3xl" />
          </div>
          <div className="relative">
            <div className="inline-flex items-center justify-center w-28 h-28 rounded-full border-4 border-white/20 mb-4">
              <span className={`text-5xl font-black ${result.passed ? 'text-emerald-300' : 'text-amber-300'}`}>{result.score}</span>
              <span className="text-white/40 text-2xl">%</span>
            </div>
            <p className="text-2xl font-bold text-white mb-1">{result.passed ? 'Assessment Passed!' : 'Keep Practicing!'}</p>
            <p className={`text-sm ${result.passed ? 'text-emerald-300/70' : 'text-amber-300/70'}`}>{result.skill}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Skill Breakdown */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Skill Breakdown</h3>
            <div className="space-y-3">
              {Object.entries(result.skillBreakdown || {}).map(([skill, score]: [string, any]) => (
                <div key={skill}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-gray-700">{skill}</span>
                    <span className={`font-bold ${score >= 80 ? 'text-emerald-600' : score >= 60 ? 'text-amber-600' : 'text-red-600'}`}>{score}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className={`h-2 rounded-full ${score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${score}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Question-by-Question */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Question Results</h3>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {result.questions?.map((q: any, i: number) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    q.correct === undefined ? 'bg-blue-100 text-blue-600' : q.isCorrect ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                  }`}>{q.correct === undefined ? '~' : q.isCorrect ? '✓' : '✗'}</div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-700 font-medium leading-relaxed">{q.question || q.title || q.scenario || q.description}</p>
                    {q.correct === undefined && (
                      <p className="text-[11px] text-blue-500 mt-1 capitalize">{q.type} — open ended</p>
                    )}
                    {!q.isCorrect && q.correct !== undefined && (
                      <p className="text-[11px] text-emerald-600 mt-1">Correct: {q.options?.[q.correct]}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Strong & Weak Areas */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Strong Areas</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(result.skillBreakdown || {}).filter(([_, s]) => (s as number) >= 80).map(([skill]) => (
                <span key={skill} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium border border-emerald-200">{skill}</span>
              ))}
              {Object.entries(result.skillBreakdown || {}).filter(([_, s]) => (s as number) < 80).length === 0 && (
                <p className="text-xs text-gray-500">No strong areas identified</p>
              )}
            </div>
            <h3 className="font-semibold text-gray-900 mt-6 mb-4">Needs Improvement</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(result.skillBreakdown || {}).filter(([_, s]) => (s as number) < 60).map(([skill]) => (
                <span key={skill} className="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-xs font-medium border border-red-200">{skill}</span>
              ))}
              {Object.entries(result.skillBreakdown || {}).filter(([_, s]) => (s as number) < 60).length === 0 && (
                <p className="text-xs text-gray-500">Great job! All areas look strong.</p>
              )}
            </div>
          </div>

          {/* Time & Stats */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Assessment Stats</h3>
            <div className="space-y-4">
              {[
                { label: 'Time Spent', value: formatTime(result.timeSpent || 0) },
                { label: 'Correct Answers', value: `${result.correctCount}/${result.totalQuestions}` },
                { label: 'Difficulty', value: result.difficulty || 'Intermediate' },
                { label: 'Status', value: result.passed ? 'Passed' : 'Not passed', color: result.passed ? 'text-emerald-600' : 'text-amber-600' },
              ].map((s, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-500">{s.label}</span>
                  <span className={`text-sm font-semibold ${s.color || 'text-gray-900'}`}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Certificate */}
        {result.passed && (
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-6 text-center">
            <Award className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
            <h3 className="font-bold text-gray-900 text-lg mb-1">Congratulations!</h3>
            <p className="text-sm text-gray-500 mb-1">You passed the {result.skill} assessment.</p>
            {aiCertificateNote && <p className="text-xs text-emerald-600 italic mb-4">"{aiCertificateNote}"</p>}
            {!aiCertificateNote && <p className="text-xs text-gray-400 mb-4">Download your certificate</p>}
            <div className="flex justify-center gap-3">
              <button onClick={() => generateCertificateNote(result.skill, result.score)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-all">
                <Download className="w-4 h-4" /> {aiCertificateNote ? 'Download Certificate' : 'Generate Certificate'}
              </button>
              <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all">
                <Linkedin className="w-4 h-4" /> Share on LinkedIn
              </button>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={async () => {
            const skill = result?.skill || selectedSkill;
            const score = result?.score ?? 0;
            try { await aiGenerateSkillGap(skill, score, result?.skillBreakdown); } catch {}
            setStep('skill-gap');
          }}
            className="flex-1 border border-gray-200 text-gray-700 py-3.5 rounded-2xl font-medium hover:bg-gray-50 transition-all flex items-center justify-center gap-2">
            <TrendingUp className="w-4 h-4" /> View Skill Gap
          </button>
          <button onClick={async () => {
            const skill = result?.skill || selectedSkill;
            const score = result?.score ?? 0;
            try {
              const missing = aiMissingSkills.length > 0 ? aiMissingSkills : await aiGenerateSkillGap(skill, score);
              await aiGenerateLearningPath(skill, missing.length > 0 ? missing : generateSkillsCoveredFallback(skill));
            } catch {}
            setStep('learning-path');
          }}
            className="flex-1 border border-gray-200 text-gray-700 py-3.5 rounded-2xl font-medium hover:bg-gray-50 transition-all flex items-center justify-center gap-2">
            <BookOpen className="w-4 h-4" /> Learning Path
          </button>
          <button onClick={() => { setResult(null); setAssessment(null); setStep('dashboard'); }}
            className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3.5 rounded-2xl font-medium hover:from-indigo-700 hover:to-purple-700 transition-all flex items-center justify-center gap-2 shadow-md">
            <RotateCcw className="w-4 h-4" /> New Assessment
          </button>
        </div>

        {/* AI Mentor */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <button onClick={() => setAiMentorOpen(!aiMentorOpen)}
            className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-sm">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-900">AI Mentor</p>
                <p className="text-xs text-gray-500">Ask why an answer was wrong or get explanations</p>
              </div>
            </div>
            {aiMentorOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>
          {aiMentorOpen && (
            <div className="px-5 pb-5 border-t border-gray-50">
              <div className="mt-4 space-y-3 max-h-[300px] overflow-y-auto mb-3">
                {mentorChat.map((m, i) => (
                  <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs flex-shrink-0 ${
                      m.role === 'ai' ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white' : 'bg-slate-200 text-slate-600'
                    }`}>{m.role === 'ai' ? 'AI' : 'U'}</div>
                    <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                      m.role === 'ai' ? 'bg-gray-50 border border-gray-100 text-gray-700' : 'bg-indigo-600 text-white'
                    }`}>{m.content}</div>
                  </div>
                ))}
                {mentorLoading && (
                  <div className="flex gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs flex-shrink-0">AI</div>
                    <div className="bg-gray-50 border border-gray-100 px-4 py-2.5 rounded-2xl">
                      <div className="flex gap-1 items-center">
                        {[0, 150, 300].map(d => <span key={d} className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <input type="text" value={mentorInput} onChange={e => setMentorInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && askMentor()}
                  placeholder="Ask why an answer was wrong or get explanations..."
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
                <button onClick={askMentor} disabled={mentorLoading} className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center hover:bg-indigo-700 transition-colors disabled:opacity-50">
                  {mentorLoading ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Send className="w-4 h-4 text-white" />}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer onNavigate={onNavigate} />
    </div>
  );

  // ── SKILL GAP ──────────────────────────────────────────────────────────────
  if (step === 'skill-gap') {
    const gapSkill = result?.skill || selectedSkill;
    const currentScore = result?.score ?? 0;
    const breakdown: Record<string, number> = result?.skillBreakdown || {};
    const weakSubSkills = Object.entries(breakdown).filter(([, s]) => s < 70).sort(([, a], [, b]) => a - b);
    const strongSubSkills = Object.entries(breakdown).filter(([, s]) => s >= 70).sort(([, a], [, b]) => b - a);

    // Auto-load missing skills if not yet populated
    const handleEnterSkillGap = async () => {
      if (aiMissingSkills.length === 0 && gapSkill) {
        setSkillGapLoading(true);
        try {
          await aiGenerateSkillGap(gapSkill, currentScore, breakdown);
        } finally {
          setSkillGapLoading(false);
        }
      }
    };

    return (
    <div className="min-h-screen bg-gray-50">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />
      <div className="max-w-3xl mx-auto px-4 py-12">
        <button onClick={() => result ? setStep('result') : setStep('dashboard')} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ChevronLeft className="w-4 h-4" /> {result ? 'Back to Results' : 'Back to Dashboard'}
        </button>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-sm">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Skill Gap Analysis</h2>
              <p className="text-sm text-gray-500">Target: Senior {gapSkill} Developer</p>
            </div>
          </div>

          {/* Current vs Required */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="text-center bg-gray-50 rounded-2xl p-6">
              <div className="text-4xl font-black text-indigo-600 mb-1">{currentScore}%</div>
              <div className="text-sm text-gray-500">Current Score</div>
            </div>
            <div className="text-center bg-gray-50 rounded-2xl p-6">
              <div className="text-4xl font-black text-emerald-600 mb-1">85%</div>
              <div className="text-sm text-gray-500">Required for Senior</div>
            </div>
          </div>

          {/* Gap Bar */}
          <div className="mb-8">
            <div className="flex justify-between text-xs text-gray-500 mb-2">
              <span>Current: {currentScore}%</span>
              <span className={currentScore >= 85 ? 'text-emerald-600 font-semibold' : 'text-amber-600 font-semibold'}>
                {currentScore >= 85 ? 'Target reached! 🎉' : `Gap: ${85 - currentScore}%`}
              </span>
              <span>Target: 85%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-4 relative overflow-hidden">
              <div className="bg-indigo-500 h-4 rounded-full transition-all duration-700" style={{ width: `${currentScore}%` }} />
              {currentScore < 85 && (
                <div className="absolute top-0 h-4 bg-emerald-500/30" style={{ left: `${currentScore}%`, width: `${85 - currentScore}%` }} />
              )}
              <div className="absolute top-0 border-l-2 border-dashed border-emerald-500 h-4" style={{ left: '85%' }} />
            </div>
          </div>

          {/* Sub-skill breakdown from actual assessment */}
          {Object.keys(breakdown).length > 0 && (
            <div className="mb-8">
              <h3 className="font-semibold text-gray-900 mb-4">Your {gapSkill} Sub-skill Scores</h3>
              <div className="space-y-3">
                {Object.entries(breakdown).sort(([, a], [, b]) => b - a).map(([skill, score]) => (
                  <div key={skill}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-gray-700">{skill}</span>
                      <span className={`font-bold ${score >= 80 ? 'text-emerald-600' : score >= 60 ? 'text-amber-600' : 'text-red-600'}`}>{score}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className={`h-2 rounded-full transition-all duration-500 ${score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-400' : 'bg-red-400'}`}
                        style={{ width: `${score}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Strong areas */}
          {strongSubSkills.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Strong Areas</h3>
              <div className="flex flex-wrap gap-2">
                {strongSubSkills.map(([skill, score]) => (
                  <span key={skill} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium border border-emerald-200">
                    {skill} · {score}%
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Missing / weak skills */}
          <h3 className="font-semibold text-gray-900 mb-4">Skills to Improve</h3>
          {skillGapLoading ? (
            <div className="flex items-center gap-3 py-6 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
              <span className="text-sm">Analyzing your assessment results...</span>
            </div>
          ) : aiMissingSkills.length > 0 ? (
            <div className="space-y-3">
              {aiMissingSkills.map((skill, i) => {
                const name = typeof skill === 'string' ? skill : (skill as any).name || skill;
                const subScore = breakdown[name];
                return (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-amber-50 border border-amber-200">
                    <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{name}</p>
                      <p className="text-xs text-gray-500">
                        {subScore !== undefined ? `Scored ${subScore}% — needs improvement` : 'Not yet assessed'}
                      </p>
                    </div>
                    <button onClick={() => { setSelectedSkill(name); generateAssessment(name); }}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">
                      Assess
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-3">
              {weakSubSkills.length > 0 ? weakSubSkills.map(([skill, score]) => (
                <div key={skill} className="flex items-center gap-4 p-4 rounded-xl bg-amber-50 border border-amber-200">
                  <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{skill}</p>
                    <p className="text-xs text-gray-500">Scored {score}% — needs improvement</p>
                  </div>
                  <button onClick={() => { setSelectedSkill(skill); generateAssessment(skill); }}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">Assess</button>
                </div>
              )) : (
                <div className="text-center py-6">
                  <button onClick={handleEnterSkillGap}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-sm font-medium hover:bg-indigo-100 transition-colors">
                    <Sparkles className="w-4 h-4" /> Generate AI Skill Gap
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <button onClick={async () => {
          const missing = aiMissingSkills.length > 0 ? aiMissingSkills : weakSubSkills.map(([s]) => s);
          await aiGenerateLearningPath(gapSkill, missing.length > 0 ? missing : generateSkillsCoveredFallback(gapSkill));
          setStep('learning-path');
        }}
          className="w-full mt-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3.5 rounded-2xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200">
          <BookOpen className="w-4 h-4" /> View Learning Path
        </button>
      </div>
      <Footer onNavigate={onNavigate} />
    </div>
    );
  }

  // ── LEARNING PATH ──────────────────────────────────────────────────────────
  if (step === 'learning-path') return (
    <div className="min-h-screen bg-gray-50">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />
      <div className="max-w-3xl mx-auto px-4 py-12">
        <button onClick={() => setStep('skill-gap')} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ChevronLeft className="w-4 h-4" /> Back to Skill Gap
        </button>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-sm">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Learning Roadmap</h2>
              <p className="text-sm text-gray-500">4-week plan to close your skill gap</p>
            </div>
          </div>

          <div className="relative">
            <div className="absolute left-[23px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-400 via-purple-400 to-emerald-400 hidden sm:block" />
            <div className="space-y-8">
              {aiLearningPath.length > 0 ? (
                aiLearningPath.map((w: any, i: number) => {
                  const colors = ['from-indigo-500 to-blue-600', 'from-purple-500 to-pink-600', 'from-emerald-500 to-teal-600', 'from-orange-500 to-red-600'];
                  const color = colors[i % colors.length];
                  const weekLabel = w.week || `Week ${i + 1}`;
                  return (
                    <div key={i} className="relative pl-0 sm:pl-16">
                      <div className={`absolute left-0 top-1 w-[47px] h-[47px] bg-gradient-to-br ${color} rounded-2xl hidden sm:flex items-center justify-center text-white text-xs font-black shadow-lg ring-4 ring-white`}>{weekLabel}</div>
                      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-all">
                        <div className="flex items-center gap-3 mb-3 sm:hidden">
                          <div className={`w-10 h-10 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center text-white text-xs font-black`}>{weekLabel}</div>
                          <div className="font-bold text-gray-900">{w.title}</div>
                        </div>
                        <div className="hidden sm:block font-bold text-gray-900 text-lg mb-1">{w.title}</div>
                        <p className="text-sm text-gray-500 mb-3">{w.desc}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {(w.skills || []).map((s: string, j: number) => (
                            <span key={j} className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium">{s}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="font-medium text-gray-700">Complete a Skill Gap Analysis first</p>
                  <p className="text-sm mt-1">The AI will generate a personalized learning path based on your missing skills</p>
                </div>
              )}
            </div>
          </div>
          <button onClick={() => onNavigate('home')}
            className="mt-6 w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3.5 rounded-2xl font-semibold hover:from-emerald-700 hover:to-teal-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-200">
            <Briefcase className="w-4 h-4" /> Browse Matching Jobs
          </button>
        </div>
      </div>
      <Footer onNavigate={onNavigate} />
    </div>
  );

  return null;
};

export default SkillAssessmentPage;