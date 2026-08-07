import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Loader2, X, Check, ChevronRight, AlertTriangle, Lightbulb } from 'lucide-react';
import { useResumeStore } from '../../store/useResumeStore';
import { executeResumeAI } from '../../services/resumeAIClient';

interface Suggestion {
  id: string;
  section: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  fix: string;
  fixed?: boolean;
}

export default function AISuggestionsPanel({ onClose, onNavigate }: { onClose: () => void; onNavigate?: (section: string) => void }) {
  const { data, update, updateExperience } = useResumeStore();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [fixing, setFixing] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    analyzeResume();
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const analyzeResume = async () => {
    setLoading(true);
    const issues: Suggestion[] = [];

    // Local checks
    const summaryVal = Array.isArray(data.summary) ? data.summary.filter(Boolean).join(' ') : data.summary || '';
    const bullets = data.experience.flatMap(e => e.bullets.filter(b => b.trim()));
    const hasNumbers = bullets.some(b => /\d/.test(b));

    if (!summaryVal) issues.push({ id: 's1', section: 'summary', severity: 'error', message: 'Professional summary is missing', fix: 'Add a 2-3 sentence summary highlighting your experience and key skills.' });
    else if (summaryVal.length < 60) issues.push({ id: 's2', section: 'summary', severity: 'warning', message: 'Summary is too short', fix: 'Expand your summary to 2-3 sentences covering your role, years, and top skills.' });

    if (data.skills.length < 5) issues.push({ id: 's3', section: 'skills', severity: 'warning', message: 'Only ' + data.skills.length + ' skills listed', fix: 'Add 8-15 relevant skills including technical tools and soft skills.' });
    if (data.experience.length === 0) issues.push({ id: 's4', section: 'experience', severity: 'error', message: 'No work experience added', fix: 'Add at least one work experience entry.' });
    if (!hasNumbers) issues.push({ id: 's5', section: 'experience', severity: 'warning', message: 'No metrics found in bullets', fix: 'Add numbers like 40%, $50K, 200+ users to show measurable impact.' });

    if (bullets.length > 0) {
      const weakStart = bullets.filter(b => !/^(led|built|designed|developed|improved|reduced|increased|managed|delivered|implemented|optimized|spearheaded|engineered|created|launched|architected)/i.test(b.trim()));
      if (weakStart.length > 0) issues.push({ id: 's6', section: 'experience', severity: 'warning', message: weakStart.length + ' bullets lack strong action verbs', fix: 'Start each bullet with action verbs like Led, Built, Optimized.' });
    }

    if (!data.personalInfo.linkedin) issues.push({ id: 's7', section: 'personal', severity: 'info', message: 'LinkedIn profile not linked', fix: 'Add your LinkedIn URL to boost recruiter confidence.' });
    if (!data.personalInfo.portfolio && !data.projects?.length) issues.push({ id: 's8', section: 'projects', severity: 'info', message: 'No portfolio or projects', fix: 'Add projects or a portfolio link to demonstrate your work.' });

    if (data.education.length === 0) issues.push({ id: 's9', section: 'education', severity: 'warning', message: 'Education section is empty', fix: 'Add your degree, institution, and graduation year.' });

    // AI-powered check
    try {
      const res = await executeResumeAI({
        section: 'resume', action: 'score_advice',
        content: `Analyze this resume for weaknesses. Return exactly 2-3 specific issues as a simple bullet list. Resume: ${summaryVal.substring(0, 200)} Skills: ${data.skills.join(', ')}`,
      });
      if (res.result) {
        const aiIssues = res.result.split('\n').map(l => l.replace(/^[-•*]\s*/, '').trim()).filter(Boolean).slice(0, 3);
        aiIssues.forEach((msg, i) => {
          if (!issues.find(s => s.message.includes(msg.substring(0, 20)))) {
            issues.push({ id: `ai-${i}`, section: 'summary', severity: 'info', message: msg, fix: 'Review and revise based on AI suggestion.' });
          }
        });
      }
    } catch { /* AI check is optional */ }

    setSuggestions(issues);
    setLoading(false);
  };

  const fixOne = async (s: Suggestion) => {
    setFixing(s.id);
    try {
      // Fix: missing summary — generate via AI
      if (s.id === 's1' || s.id === 's2') {
        try {
          const context = data.experience.map(e => `${e.title} at ${e.company}`).join(', ') || 'professional';
          const sk = data.skills.slice(0, 5).join(', ');
          const res = await executeResumeAI({ section: 'summary', action: 'generate', content: `Generate a summary for a ${context}. Skills: ${sk}` });
          if (res.result) update('summary', res.result.replace(/\*\*/g, '').split('\n').filter(Boolean).slice(0, 3).join(' '));
        } catch {
          const title = data.experience[0]?.title || 'Professional';
          const sk = data.skills.slice(0, 3).join(', ');
          update('summary', `Results-driven ${title} with hands-on experience delivering high-quality solutions. Skilled in ${sk || 'cross-functional collaboration'}. Proven ability to drive measurable business impact.`);
        }
      }

      // Fix: missing skills — add common ones
      if (s.id === 's3') {
        const existing = new Set(data.skills.map(x => x.toLowerCase()));
        const suggested = ['Communication', 'Problem Solving', 'Team Collaboration', 'Time Management', 'Agile', 'Git', 'REST APIs', 'SQL', 'Project Management', 'Critical Thinking'];
        const toAdd = suggested.filter(sk => !existing.has(sk.toLowerCase())).slice(0, Math.max(0, 8 - data.skills.length));
        if (toAdd.length > 0) update('skills', [...data.skills, ...toAdd]);
      }

      // Fix: no experience — navigate to experience section
      if (s.id === 's4' && onNavigate) { setSuggestions(prev => prev.map(p => p.id === s.id ? { ...p, fixed: true } : p)); onNavigate('experience'); setFixing(null); return; }

      // Fix: no metrics — quantify bullets via AI
      if (s.id === 's5') {
        const snapshot = data.experience; // capture current state
        const tasks = snapshot.flatMap(exp =>
          exp.bullets.map((b, i) => {
            if (!b.trim() || /\d/.test(b)) return null;
            return executeResumeAI({ section: 'experience', action: 'quantify', content: b, experienceId: exp.id })
              .then(res => { if (res.result) { const bs = [...exp.bullets]; bs[i] = res.result; updateExperience(exp.id, 'bullets', bs); } })
              .catch(() => { const bs = [...exp.bullets]; bs[i] = b.replace(/\.$/, '') + ', improving efficiency by 20%.'; updateExperience(exp.id, 'bullets', bs); });
          }).filter(Boolean)
        );
        await Promise.all(tasks);
      }

      // Fix: weak action verbs — prepend strong verbs
      if (s.id === 's6') {
        const strongVerbs = ['Led', 'Built', 'Developed', 'Designed', 'Implemented', 'Optimized', 'Delivered', 'Managed', 'Improved', 'Created'];
        update('experience', data.experience.map(exp => ({
          ...exp,
          bullets: exp.bullets.map((b, i) => {
            if (!b.trim()) return b;
            if (/^(led|built|designed|developed|improved|reduced|increased|managed|delivered|implemented|optimized|spearheaded|engineered|created|launched|architected)/i.test(b.trim())) return b;
            return `${strongVerbs[i % strongVerbs.length]} ${b.charAt(0).toLowerCase()}${b.slice(1)}`;
          }),
        })));
      }

      // Fix: LinkedIn — navigate to personal
      if (s.id === 's7' && onNavigate) { setSuggestions(prev => prev.map(p => p.id === s.id ? { ...p, fixed: true } : p)); onNavigate('personal'); setFixing(null); return; }

      // Fix: no portfolio/projects — navigate to projects
      if (s.id === 's8' && onNavigate) { setSuggestions(prev => prev.map(p => p.id === s.id ? { ...p, fixed: true } : p)); onNavigate('projects'); setFixing(null); return; }

      // Fix: empty education — navigate to education
      if (s.id === 's9' && onNavigate) { setSuggestions(prev => prev.map(p => p.id === s.id ? { ...p, fixed: true } : p)); onNavigate('education'); setFixing(null); return; }

      // Fix: AI suggestions — improve summary or first bullet via AI
      if (s.id.startsWith('ai-')) {
        const msg = s.message.toLowerCase();
        if (msg.includes('summary') || msg.includes('objective')) {
          try {
            const res = await executeResumeAI({ section: 'summary', action: 'rewrite', content: data.summary || s.message });
            if (res.result) update('summary', res.result);
          } catch { /* silent */ }
        } else if (data.experience.length > 0) {
          const exp = data.experience[0];
          const bullet = exp.bullets.find(b => b.trim()) || exp.bullets[0];
          if (bullet) {
            try {
              const res = await executeResumeAI({ section: 'experience', action: 'improve', content: bullet, experienceId: exp.id });
              if (res.result) {
                const bs = [...exp.bullets];
                const idx = exp.bullets.indexOf(bullet);
                bs[idx] = res.result;
                updateExperience(exp.id, 'bullets', bs);
              }
            } catch { /* silent */ }
          }
        }
      }

    } catch { /* silent */ } finally {
      setSuggestions(prev => prev.map(p => p.id === s.id ? { ...p, fixed: true } : p));
      setFixing(null);
    }
  };

  const fixAll = async () => {
    // Run sequentially to avoid Zustand state race conditions
    for (const s of suggestions.filter(x => !x.fixed)) {
      await fixOne(s);
    }
    setTimeout(analyzeResume, 1500);
  };

  const iconMap = { error: <AlertTriangle className="w-4 h-4 text-red-500" />, warning: <Lightbulb className="w-4 h-4 text-amber-500" />, info: <Sparkles className="w-4 h-4 text-blue-500" /> };
  const errors = suggestions.filter(s => s.severity === 'error' && !s.fixed).length;
  const warnings = suggestions.filter(s => s.severity !== 'error' && !s.fixed).length;

  return (
    <div ref={panelRef} className="w-full max-w-sm sm:w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-bold">AI Suggestions</span>
          </div>
          <button onClick={onClose} className="p-0.5 hover:bg-white/20 rounded transition-colors"><X className="w-4 h-4" /></button>
        </div>
        {!loading && (
          <p className="text-[10px] text-white/80 mt-1">
            {errors > 0 && <span className="font-semibold text-red-200">{errors} errors</span>}
            {errors > 0 && warnings > 0 && <span> & </span>}
            {warnings > 0 && <span className="font-semibold text-amber-200">{warnings} suggestions</span>}
          </p>
        )}
      </div>

      {/* Content */}
      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8 text-sm text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin mr-2" /> Analyzing...
          </div>
        ) : suggestions.length === 0 ? (
          <div className="py-8 text-center text-sm text-green-600">
            <Check className="w-8 h-8 mx-auto mb-2 text-green-500" />
            No issues found! Your resume looks great.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {suggestions.map(s => (
              <div key={s.id} className={`px-4 py-3 ${s.fixed ? 'opacity-50 bg-gray-50' : ''}`}>
                <div className="flex items-start gap-2">
                  <div className="mt-0.5 shrink-0">{iconMap[s.severity]}</div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium ${s.fixed ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{s.message}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{s.fix}</p>
                  </div>
                </div>
                {!s.fixed && (
                  <div className="flex items-center gap-2 mt-2 ml-6">
                    <button onClick={() => fixOne(s)} disabled={fixing === s.id}
                      className="text-[10px] font-medium text-purple-600 hover:text-purple-800 disabled:opacity-40">
                      {fixing === s.id ? <Loader2 className="w-3 h-3 animate-spin inline" /> : null}
                      Fix
                    </button>
                    {onNavigate && (
                      <button onClick={() => onNavigate(s.section)}
                        className="text-[10px] text-gray-400 hover:text-gray-600 flex items-center gap-0.5">
                        Open <ChevronRight className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      {!loading && suggestions.filter(s => !s.fixed).length > 0 && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex gap-2">
          <button onClick={fixAll}
            className="flex-1 py-2 text-xs font-semibold bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
            Fix All ({suggestions.filter(s => !s.fixed).length})
          </button>
          <button onClick={analyzeResume} className="px-3 py-2 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
            Re-check
          </button>
        </div>
      )}
    </div>
  );
}
