import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Sparkles, Loader2, Check, X, Clock } from 'lucide-react';
import { useResumeStore } from '../../store/useResumeStore';
import { executeResumeAI } from '../../services/resumeAIClient';

export default function ProjectsStep() {
  const { data, addProject, updateProject, removeProject } = useResumeStore();
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [aiError, setAiError] = useState('');
  const [suggestion, setSuggestion] = useState<{ projId: string; bIdx: number; suggested: string } | null>(null);
  const aiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const projects = data.projects || [];

  const showError = (msg: string) => {
    setAiError(msg);
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    errorTimerRef.current = setTimeout(() => setAiError(''), 8000);
  };

  useEffect(() => {
    return () => {
      if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    };
  }, []);

  const generateBullets = async (id: string) => {
    const p = projects.find(x => x.id === id);
    if (!p?.name) { showError('Enter a project name first'); return; }
    setAiLoading(id);
    const fallback = () => {
      updateProject(id, 'bullets', [`Developed ${p.name} using modern technologies`, 'Collaborated with team to deliver on schedule']);
      showError('AI took too long. Default bullets added — you can edit them.');
    };
    aiTimerRef.current = setTimeout(fallback, 15000);
    try {
      const res = await executeResumeAI({ section: 'projects', action: 'generate', content: `${p.name}${p.role ? ` as ${p.role}` : ''}` });
      if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
      const bullets = (res.result || '').split('\n').filter(Boolean);
      if (bullets.length > 0) { updateProject(id, 'bullets', bullets); return; }
      fallback();
    } catch {
      if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
      fallback();
    } finally {
      aiTimerRef.current = null;
      setAiLoading(null);
    }
  };

  const improveBullet = async (projId: string, bIdx: number, text: string) => {
    if (!text.trim()) return;
    setAiLoading(`${projId}-${bIdx}`);
    const fallback = () => showError('AI improvement timed out. Try again or edit manually.');
    aiTimerRef.current = setTimeout(fallback, 15000);
    try {
      const res = await executeResumeAI({ section: 'projects', action: 'improve', content: text });
      if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
      setSuggestion({ projId, bIdx, suggested: res.result || '' });
    } catch {
      showError('AI improvement unavailable. Edit manually.');
    } finally {
      if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
      aiTimerRef.current = null;
      setAiLoading(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Projects</h2>
          <p className="text-sm text-gray-500 mt-0.5">Showcase your key projects and contributions</p>
          <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1"><span className="text-purple-400">💡</span> Link to <span className="text-purple-500 font-medium">GitHub</span> or live demo — recruiters verify projects they can actually see</p>
        </div>
        <button onClick={addProject} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
          <Plus className="w-4 h-4" /> Add Project
        </button>
      </div>

      {aiError && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 flex items-center justify-between">
          <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 shrink-0" />{aiError}</span>
          <button onClick={() => setAiError('')} className="text-amber-400 hover:text-amber-600 shrink-0 ml-2"><X className="w-3 h-3" /></button>
        </div>
      )}

      {projects.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
          <p className="text-gray-500 mb-3">No projects added yet</p>
          <button onClick={addProject} className="text-blue-600 hover:text-blue-700 font-medium text-sm">+ Add your first project</button>
        </div>
      ) : (
        <div className="space-y-5">
          {projects.map((p, idx) => (
            <div key={p.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 bg-gray-50/80 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-800">Project {idx + 1}</h3>
                <button onClick={() => removeProject(p.id)} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Project Name *</label>
                    <input type="text" value={p.name} onChange={e => updateProject(p.id, 'name', e.target.value)}
                      placeholder="e.g. E-Commerce Platform"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white hover:border-gray-300 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Your Role</label>
                    <input type="text" value={p.role} onChange={e => updateProject(p.id, 'role', e.target.value)}
                      placeholder="e.g. Full Stack Developer"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white hover:border-gray-300 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Duration</label>
                    <input type="text" value={p.duration} onChange={e => updateProject(p.id, 'duration', e.target.value)}
                      placeholder="e.g. Jan 2023 – Mar 2023"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white hover:border-gray-300 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Project URL (optional)</label>
                    <input type="url" value={p.url} onChange={e => updateProject(p.id, 'url', e.target.value)}
                      placeholder="e.g. github.com/user/project"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white hover:border-gray-300 transition-colors" />
                  </div>
                </div>

                {/* Bullets */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-gray-600">Key Highlights</label>
                    <button onClick={() => generateBullets(p.id)} disabled={aiLoading === p.id || !p.name}
                      className="flex items-center gap-1.5 px-3 py-1 text-xs bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 disabled:opacity-50 transition-colors">
                      {aiLoading === p.id ? <><Loader2 className="w-3 h-3 animate-spin" />Generating...</> : <><Sparkles className="w-3 h-3" />Write with AI</>}
                    </button>
                    {aiLoading === p.id && (
                      <span className="text-[10px] text-gray-400 animate-pulse">This may take a moment</span>
                    )}
                  </div>
                  <div className="space-y-2">
                    {p.bullets.map((b, bi) => (
                      <div key={bi} className="flex gap-2">
                        <span className="text-gray-400 mt-2.5 shrink-0">•</span>
                        <div className="flex-1">
                          <input type="text" value={b}
                            onChange={(e) => {
                              const nb = [...p.bullets]; nb[bi] = e.target.value;
                              updateProject(p.id, 'bullets', nb);
                            }}
                            placeholder="e.g. Built REST APIs"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white hover:border-gray-300 transition-colors"
                          />
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {suggestion?.projId === p.id && suggestion?.bIdx === bi ? (
                            <div className="flex items-center gap-1">
                              <button onClick={() => {
                                const nb = [...p.bullets]; nb[bi] = suggestion.suggested;
                                updateProject(p.id, 'bullets', nb); setSuggestion(null);
                              }} className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Accept"><Check className="w-4 h-4" /></button>
                              <button onClick={() => setSuggestion(null)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded" title="Reject"><X className="w-4 h-4" /></button>
                            </div>
                          ) : (
                            <button onClick={() => improveBullet(p.id, bi, b)}
                              disabled={aiLoading === `${p.id}-${bi}` || !b.trim()}
                              className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded disabled:opacity-30 transition-colors" title="Improve with AI">
                              {aiLoading === `${p.id}-${bi}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                            </button>
                          )}
                          {p.bullets.length > 1 && (
                            <button onClick={() => updateProject(p.id, 'bullets', p.bullets.filter((_, i) => i !== bi))}
                              className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors" title="Delete">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => updateProject(p.id, 'bullets', [...p.bullets, ''])}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium mt-2">+ Add bullet</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
