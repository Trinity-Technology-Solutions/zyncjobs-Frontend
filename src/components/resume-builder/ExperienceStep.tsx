import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Sparkles, Loader2, Check, X, Copy } from 'lucide-react';
import { useResumeStore } from '../../store/useResumeStore';
import { executeResumeAI } from '../../services/resumeAIClient';
import { ph } from '../../utils/goalPlaceholders';

export default function ExperienceStep() {
  const { data, addExperience, updateExperience, removeExperience } = useResumeStore();
  const goal = data.goal || '';
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [aiError, setAiError] = useState('');
  const [suggestion, setSuggestion] = useState<{
    expId: string;
    bIdx: number;
    suggested: string;
  } | null>(null);
  const [roleSummary, setRoleSummary] = useState<Record<string, string>>({});
  const [roleSummaryLoading, setRoleSummaryLoading] = useState<string | null>(null);
  const [generatedCount, setGeneratedCount] = useState<Record<string, number>>({});
  const debounceTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const prevTitles = useRef<Record<string, string>>({});
  const MAX_AUTO_BULLETS = 6;

  const isDuplicate = (candidate: string, existing: string[]): boolean => {
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
    const c = norm(candidate);
    return existing.some(e => {
      const n = norm(e);
      if (!n || !c) return false;
      if (n === c) return true;
      // Check first 6 words overlap
      const cWords = c.split(/\s+/).slice(0, 6).join(' ');
      const nWords = n.split(/\s+/).slice(0, 6).join(' ');
      if (cWords === nWords) return true;
      // Length-ratio similarity
      const ratio = Math.min(c.length, n.length) / Math.max(c.length, n.length);
      return ratio > 0.85;
    });
  };

  const fetchRoleSummary = async (expId: string, title: string, company: string) => {
    setRoleSummaryLoading(expId);
    try {
      const exp = data.experience.find(e => e.id === expId);
      const existingBullets = (exp?.bullets || []).filter(b => b.trim());
      const count = generatedCount[expId] || 0;
      const existingContext = existingBullets.length
        ? `\nAlready added (do NOT repeat or paraphrase these):\n${existingBullets.map(b => `- ${b}`).join('\n')}`
        : '';
      const prompt = count === 0
        ? `Write 1 brief sentence describing the core responsibilities of a ${title} at ${company || 'a company'}. Keep it under 20 words. No markdown. No quotes.${existingContext}`
        : `Write a NEW unique achievement bullet point for a ${title} at ${company || 'a company'}. Start with a strong action verb. Under 20 words. No markdown. No quotes.${existingContext}`;
      const res = await executeResumeAI({
        section: 'experience', action: 'generate',
        content: prompt,
        experienceId: expId,
      });
      if (res.result) {
        const clean = res.result.replace(/^["'`]|["'`]$/g, '').trim();
        if (!isDuplicate(clean, existingBullets)) {
          setRoleSummary(prev => ({ ...prev, [expId]: clean }));
        }
      }
    } catch {} finally { setRoleSummaryLoading(null); }
  };

  // Auto-fetch role summary when title changes
  useEffect(() => {
    data.experience.forEach(exp => {
      if (!exp.title?.trim() || !exp.company?.trim()) return;
      if (roleSummary[exp.id] && prevTitles.current[exp.id] === exp.title) return;
      prevTitles.current[exp.id] = exp.title;
      setGeneratedCount(prev => ({ ...prev, [exp.id]: 0 }));

      const existing = debounceTimers.current.get(exp.id);
      if (existing) clearTimeout(existing);

      const timer = setTimeout(() => fetchRoleSummary(exp.id, exp.title, exp.company), 1200);
      debounceTimers.current.set(exp.id, timer);
    });
    return () => { debounceTimers.current.forEach(t => clearTimeout(t)); };
  }, [data.experience.map(e => `${e.title}|${e.company}`).join('||')]);



    const improveBullet = async (expId: string, bIdx: number, text: string) => {
    if (!text.trim()) return;
    
    // Prevent duplicate suggestions
    if (suggestion?.expId === expId && suggestion?.bIdx === bIdx) {
      setSuggestion(null);
      return;
    }
    
    setAiLoading(`${expId}-${bIdx}`);
    setAiError('');
    try {
      const res = await executeResumeAI({ section: 'experience', action: 'improve', content: text, experienceId: expId });
      
      // Check if the suggestion would be a duplicate
      const cleaned = res.result || '';
      if (cleaned && cleaned.trim().length > 0) {
        const existingBullets = data.experience.find(e => e.id === expId)?.bullets || [];
        const normalizedText = text.trim().toLowerCase();
        const normalizedSuggestion = cleaned.trim().toLowerCase();
        
        // Check if suggestion is too similar to existing bullet
        const isSimilar = existingBullets.some(bullet => {
          const normBullet = bullet.toLowerCase();
          const words = Math.max(normBullet.split(' ').length, normalizedSuggestion.split(' ').length);
          const similarityScore = (normBullet.length * normalizedSuggestion.length) > 0 && 
            (Math.min(normBullet.length, normalizedSuggestion.length) / Math.max(normBullet.length, normalizedSuggestion.length)) > 0.7;
          return similarityScore || normalizedText.includes(normBullet.substring(0, Math.min(20, normBullet.length)));        });
        
        if (!isSimilar && normalizedText !== normalizedSuggestion) {
          setSuggestion({ expId, bIdx, suggested: cleaned });
        } else {
          setSuggestion(null); // Skip if too similar
        }
      }
    } catch (error) {
      setAiError('AI service is currently unavailable. Try again in a moment or enhance the bullet manually with action verbs and metrics.');
    } finally {
      setAiLoading(null);
    }
  };

  const generateBullets = async (expId: string) => {
    const exp = data.experience.find(e => e.id === expId);
    if (!exp || !exp.title || !exp.company) return;
    setAiLoading(expId);
    setAiError('');
    try {
      const existingBullets = exp.bullets.filter(b => b.trim());
      const existingContext = existingBullets.length
        ? `\nAlready added (do NOT repeat or paraphrase):\n${existingBullets.map(b => `- ${b}`).join('\n')}`
        : '';
      const context = `Job Title: ${exp.title}\nCompany: ${exp.company}${exp.location ? `\nLocation: ${exp.location}` : ''}${existingContext}\n\nGenerate 4 unique achievement-focused bullet points not already listed above. Each must start with a strong action verb and include measurable impact. Return as a plain list, one per line, no numbering.`;
      const res = await executeResumeAI({ section: 'experience', action: 'generate', content: context, experienceId: expId });
      if (res.result) {
        const bullets = res.result.split('\n').map(l => l.replace(/^[\d.▪•\-*\s]+/, '').trim()).filter(Boolean).slice(0, 4);
        const newBullets = bullets.filter(b => !isDuplicate(b, existingBullets));
        if (newBullets.length > 0) {
          updateExperience(expId, 'bullets', [...exp.bullets, ...newBullets]);
        } else {
          setAiError('All generated bullets were too similar to existing ones.');
        }
      }
    } catch {
      setAiError('AI unavailable.');
    } finally {
      setAiLoading(null);
    }
  };

  const duplicateExperience = (id: string) => {
    const exp = data.experience.find(e => e.id === id);
    if (!exp) return;
    addExperience();
    const newId = data.experience[data.experience.length - 1]?.id;
    if (newId) {
      updateExperience(newId, 'title', exp.title);
      updateExperience(newId, 'company', exp.company);
      updateExperience(newId, 'location', exp.location || '');
      updateExperience(newId, 'duration', exp.duration);
      updateExperience(newId, 'current', exp.current);
      updateExperience(newId, 'bullets', [...exp.bullets]);
    }
  };

  const acceptSuggestion = () => {
    if (!suggestion) return;
    const exp = data.experience.find(e => e.id === suggestion.expId);
    if (exp) {
      const bullets = [...exp.bullets];
      bullets[suggestion.bIdx] = suggestion.suggested;
      updateExperience(suggestion.expId, 'bullets', bullets);
    }
    setSuggestion(null);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Work Experience</h2>
          <p className="text-sm text-gray-500 mt-0.5">Showcase your professional journey and achievements</p>
        </div>
        <button onClick={addExperience} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
          <Plus className="w-4 h-4" /> Add Experience
        </button>
      </div>

      {aiError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700 flex items-center justify-between">
          <span>{aiError}</span>
          <button onClick={() => setAiError('')} className="text-red-400 hover:text-red-600"><X className="w-3 h-3" /></button>
        </div>
      )}

      {data.experience.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
          <p className="text-gray-500 mb-3">No experience added yet</p>
          <button onClick={addExperience} className="text-blue-600 hover:text-blue-700 font-medium text-sm">+ Add your first experience</button>
        </div>
      ) : (
        <div className="space-y-5">
          {data.experience.map((exp, idx) => (
              <div key={exp.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-gray-300 transition-colors">
              {/* Card header */}
              <div className="flex items-center justify-between px-5 py-3 bg-gray-50/80 border-b border-gray-100">
                <div className="min-w-0 flex-1 mr-3">
                  <h3 className="text-sm font-semibold text-gray-800 truncate">
                    {exp.title || exp.company ? (
                      <>{exp.title || 'Untitled'}{exp.company ? <span className="font-normal text-gray-500"> at {exp.company}</span> : null}</>
                    ) : (
                      <>Experience {idx + 1}</>
                    )}
                  </h3>
                  {exp.duration && <p className="text-[11px] text-gray-400 mt-0.5">{exp.duration}</p>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => generateBullets(exp.id)} disabled={aiLoading === exp.id || !exp.title || !exp.company}
                    className="flex items-center gap-1 px-2 py-1 text-xs bg-purple-50 text-purple-700 rounded-md hover:bg-purple-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    {aiLoading === exp.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    Auto-fill
                  </button>
                  <button onClick={() => duplicateExperience(exp.id)}
                    className="p-1.5 text-gray-300 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors" title="Duplicate">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => removeExperience(exp.id)} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Fields */}
              <div className="p-5 space-y-4">
                <p className="text-[10px] text-gray-400 flex items-center gap-1 -mt-1"><svg className="w-3 h-3 text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> Start each bullet with a strong action verb: <span className="text-amber-500 font-medium">Led</span>, <span className="text-amber-500 font-medium">Built</span>, <span className="text-amber-500 font-medium">Optimized</span>, <span className="text-amber-500 font-medium">Designed</span></p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Job Title <span className="text-red-500">*</span></label>
                    <input type="text" value={exp.title} onChange={(e) => updateExperience(exp.id, 'title', e.target.value)}
                      placeholder={ph(goal, 'title')}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white hover:border-gray-300 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Company <span className="text-red-500">*</span></label>
                    <input type="text" value={exp.company} onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                      placeholder={ph(goal, 'company')}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white hover:border-gray-300 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Location</label>
                    <input type="text" value={exp.location ?? ''} onChange={(e) => updateExperience(exp.id, 'location', e.target.value)}
                      placeholder="Enter your city and country"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white hover:border-gray-300 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Duration <span className="text-red-500">*</span></label>
                    <input type="text" value={exp.duration} onChange={(e) => updateExperience(exp.id, 'duration', e.target.value)}
                      placeholder="Enter start and end date"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white hover:border-gray-300 transition-colors" />
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id={`current-${exp.id}`} checked={exp.current}
                      onChange={(e) => {
                        updateExperience(exp.id, 'current', e.target.checked);
                        if (e.target.checked && !exp.duration?.toLowerCase().includes('present')) {
                          const start = exp.duration?.split('–')[0]?.trim() || exp.duration?.split('-')[0]?.trim() || '';
                          updateExperience(exp.id, 'duration', start ? `${start} – Present` : 'Present');
                        }
                      }}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500" />
                    <label htmlFor={`current-${exp.id}`} className="text-sm text-gray-600">Currently working here</label>
                  </div>
                </div>

                {/* Role summary - loading skeleton */}
                {exp.title && exp.company && roleSummaryLoading === exp.id && !roleSummary[exp.id] && (
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-5 overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-100/40 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" style={{ backgroundSize: '200% 100%' }} />
                    <div className="relative flex items-center gap-4">
                      <div className="w-10 h-10 bg-indigo-200/50 rounded-xl flex items-center justify-center animate-pulse">
                        <Sparkles className="w-5 h-5 text-indigo-400" />
                      </div>
                      <div className="flex-1 space-y-2.5">
                        <div className="h-3 bg-indigo-200/50 rounded-full w-24 animate-pulse" />
                        <div className="h-3 bg-indigo-200/30 rounded-full w-full animate-pulse" />
                        <div className="h-3 bg-indigo-200/30 rounded-full w-3/4 animate-pulse" />
                      </div>
                    </div>
                    <div className="relative flex items-center gap-2 mt-4">
                      <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                      <p className="text-xs text-indigo-500 font-medium">AI is analyzing this role...</p>
                    </div>
                  </div>
                )}

                {/* Role summary - suggestion card */}
                {exp.title && exp.company && (roleSummary[exp.id] || roleSummaryLoading === exp.id) && (roleSummary[exp.id] || generatedCount[exp.id] === 0) && (
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-sm shrink-0">
                        <Sparkles className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                            {generatedCount[exp.id] === 0 ? 'AI Suggestion' : `AI Suggestion #${(generatedCount[exp.id] || 0) + 1}`}
                          </span>
                          {roleSummaryLoading === exp.id && roleSummary[exp.id] && (
                            <span className="flex items-center gap-1.5 text-[11px] text-indigo-400 font-medium">
                              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-ping" />
                              preparing next...
                            </span>
                          )}
                        </div>

                        {/* Skeleton while loading next */}
                        {roleSummaryLoading === exp.id && !roleSummary[exp.id] ? (
                          <div className="space-y-2.5 py-1">
                            <div className="h-4 bg-indigo-200/50 rounded-full w-full animate-pulse" />
                            <div className="h-4 bg-indigo-200/30 rounded-full w-2/3 animate-pulse" />
                            <div className="flex items-center gap-2 mt-3">
                              <div className="h-8 bg-indigo-200/30 rounded-lg w-28 animate-pulse" />
                              <div className="h-8 bg-indigo-200/30 rounded-lg w-24 animate-pulse" />
                            </div>
                          </div>
                        ) : roleSummary[exp.id] ? (
                          <p className="text-sm text-gray-700 leading-relaxed">{roleSummary[exp.id]}</p>
                        ) : null}

                        {roleSummaryLoading !== exp.id && roleSummary[exp.id] && (
                          <div className="flex items-center gap-2 mt-4 flex-wrap">
                            <button onClick={() => {
                              const bullet = roleSummary[exp.id];
                              const existing = exp.bullets.filter(b => b.trim());
                              if (!isDuplicate(bullet, existing)) {
                                updateExperience(exp.id, 'bullets', [...existing, bullet]);
                              }
                              setRoleSummary(prev => { const n = { ...prev }; delete n[exp.id]; return n; });
                              setGeneratedCount(prev => ({ ...prev, [exp.id]: (prev[exp.id] || 0) + 1 }));
                              if ((generatedCount[exp.id] || 0) + 1 < MAX_AUTO_BULLETS) {
                                fetchRoleSummary(exp.id, exp.title, exp.company);
                              }
                            }}
                              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 shadow-sm transition-all">
                              <Plus className="w-3.5 h-3.5" /> Add as Bullet
                            </button>
                            <button onClick={() => {
                              generateBullets(exp.id);
                              setRoleSummary(prev => { const n = { ...prev }; delete n[exp.id]; return n; });
                              setGeneratedCount(prev => ({ ...prev, [exp.id]: MAX_AUTO_BULLETS }));
                            }}
                              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-white text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-50 transition-all">
                              <Sparkles className="w-3.5 h-3.5" /> Full Bullets
                            </button>
                            <button onClick={() => setGeneratedCount(prev => ({ ...prev, [exp.id]: MAX_AUTO_BULLETS }))}
                              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white/60 rounded-lg transition-colors ml-auto" title="Dismiss">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Progress dots */}
                    {(generatedCount[exp.id] || 0) > 0 && (
                      <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-indigo-200/50">
                        {Array.from({ length: Math.min((generatedCount[exp.id] || 0) + 1, MAX_AUTO_BULLETS) }).map((_, i) => (
                          <div key={i} className={`w-2 h-2 rounded-full ${i < (generatedCount[exp.id] || 0) ? 'bg-indigo-400' : 'bg-indigo-200'} ${i === (generatedCount[exp.id] || 0) - 1 ? 'animate-pulse' : ''}`} />
                        ))}
                        <span className="text-[10px] text-indigo-400 ml-1 font-medium">
                          {Math.min((generatedCount[exp.id] || 0), MAX_AUTO_BULLETS)}/{MAX_AUTO_BULLETS}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Bullets */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">Key Achievements</label>
                  <p className="text-[10px] text-gray-400 mb-2 flex items-center gap-1"><svg className="w-3 h-3 text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> Use numbers — recruiters love measurable impact (<span className="text-blue-500 font-medium">40%</span>, <span className="text-blue-500 font-medium">$50K</span>, <span className="text-blue-500 font-medium">200+ users</span>)</p>
                  <div className="space-y-2">
                    {exp.bullets.map((bullet, bIdx) => (
                      <div key={bIdx} className="flex gap-2">
                        <span className="text-gray-400 mt-2.5 shrink-0">•</span>
                        <div className="flex-1">
                          <input type="text" value={bullet}
                            onChange={(e) => {
                              const b = [...exp.bullets]; b[bIdx] = e.target.value;
                              updateExperience(exp.id, 'bullets', b);
                            }}
                            placeholder={ph(goal, 'achievement')}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white hover:border-gray-300 transition-colors"
                          />
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {suggestion?.expId === exp.id && suggestion?.bIdx === bIdx ? (
                            <div className="flex items-center gap-1">
                              <button onClick={acceptSuggestion}
                                className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Accept">
                                <Check className="w-4 h-4" />
                              </button>
                              <button onClick={() => setSuggestion(null)}
                                className="p-1.5 text-gray-400 hover:bg-gray-100 rounded" title="Reject">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <button onClick={() => improveBullet(exp.id, bIdx, bullet)}
                              disabled={aiLoading === `${exp.id}-${bIdx}` || !bullet.trim()}
                              className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded disabled:opacity-30 transition-colors" title="Improve with AI">
                              {aiLoading === `${exp.id}-${bIdx}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                            </button>
                          )}
                          {exp.bullets.length > 1 && (
                            <button onClick={() => {
                              if (exp.bullets.length > 1) updateExperience(exp.id, 'bullets', exp.bullets.filter((_, i) => i !== bIdx));
                            }}
                              className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors" title="Delete">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => updateExperience(exp.id, 'bullets', [...exp.bullets, ''])}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium mt-2">+ Add bullet point</button>
                </div>

                {/* Inline suggestion */}
                {suggestion && suggestion.expId === exp.id && (
                  <div className="flex items-center gap-2 p-3 bg-purple-50 border border-purple-200 rounded-lg text-sm">
                    <Sparkles className="w-4 h-4 text-purple-500 shrink-0" />
                    <input type="text" value={suggestion.suggested} readOnly
                      className="flex-1 text-purple-900 bg-transparent border-none focus:outline-none text-sm"
                    />
                    <button onClick={acceptSuggestion}
                      className="px-3 py-1 text-xs font-semibold bg-purple-600 text-white rounded-md hover:bg-purple-700">
                      Accept
                    </button>
                    <button onClick={() => setSuggestion(null)}
                      className="px-3 py-1 text-xs text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50">
                      X
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
