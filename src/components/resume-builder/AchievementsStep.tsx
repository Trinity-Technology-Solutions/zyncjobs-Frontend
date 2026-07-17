import React, { useState } from 'react';
import { Plus, Trash2, Sparkles, Loader2, Pencil, Check, X, RefreshCw, FileText } from 'lucide-react';
import { useResumeStore } from '../../store/useResumeStore';
import { executeResumeAI } from '../../services/resumeAIClient';

export default function AchievementsStep() {
  const { data, addAchievement, updateAchievement, removeAchievement } = useResumeStore();
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<{ id: string; field: 'title' | 'description'; value: string } | null>(null);
  const [suggestion, setSuggestion] = useState<{
    id: string;
    original: string;
    suggested: string;
  } | null>(null);
  const achievements = data.achievements || [];

  const quantify = async (id: string) => {
    const item = achievements.find((a) => a.id === id);
    if (!item?.title.trim()) { alert('Enter an achievement title first'); return; }
    setAiLoading(id);
    setSuggestion(null);
    try {
      const res = await executeResumeAI({ section: 'achievements', action: 'quantify', content: item.title });
      setSuggestion({
        id,
        original: item.description || '',
        suggested: res.result || '',
      });
    } catch {
      updateAchievement(id, 'description', `Achieved significant impact through ${item.title}, improving outcomes and driving measurable results.`);
    } finally {
      setAiLoading(null);
    }
  };

  const acceptSuggestion = () => {
    if (!suggestion) return;
    updateAchievement(suggestion.id, 'description', suggestion.suggested);
    setSuggestion(null);
  };

  const rejectSuggestion = () => setSuggestion(null);

  const startEdit = (id: string, field: 'title' | 'description', value: string) => {
    setEditingField({ id, field, value });
    setSuggestion(null);
  };

  const saveEdit = () => {
    if (!editingField) return;
    updateAchievement(editingField.id, editingField.field, editingField.value);
    setEditingField(null);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Achievements</h2>
          <p className="text-sm text-gray-500 mt-0.5">Highlight your key accomplishments — AI will quantify them</p>
        </div>
        <button onClick={addAchievement} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
          <Plus className="w-4 h-4" /> Add Achievement
        </button>
      </div>

      {achievements.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
          <p className="text-gray-500 mb-3">No achievements added yet</p>
          <button onClick={addAchievement} className="text-blue-600 hover:text-blue-700 font-medium text-sm">+ Add your first achievement</button>
        </div>
      ) : (
        <div className="space-y-3">
          {achievements.map((item) => {
            const isEditingTitle = editingField?.id === item.id && editingField?.field === 'title';
            const isEditingDesc = editingField?.id === item.id && editingField?.field === 'description';
            return (
              <div key={item.id}>
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-gray-300 transition-colors">
                  <div className="flex items-center justify-between px-5 py-3 bg-gray-50/80 border-b border-gray-100">
                    {isEditingTitle ? (
                      <div className="flex-1 flex items-center gap-2">
                        <input type="text" value={editingField.value}
                          onChange={(e) => setEditingField({ ...editingField, value: e.target.value })}
                          className="flex-1 px-2 py-1 text-sm border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                          autoFocus
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); saveEdit(); } if (e.key === 'Escape') setEditingField(null); }} />
                        <button onClick={saveEdit} className="px-2 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700">Save</button>
                        <button onClick={() => setEditingField(null)} className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded-md">Cancel</button>
                      </div>
                    ) : (
                      <>
                        <h3 className="text-sm font-semibold text-gray-800">{item.title || 'New Achievement'}</h3>
                        <div className="flex items-center gap-1">
                          <button onClick={() => startEdit(item.id, 'title', item.title)}
                            className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Edit title">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => removeAchievement(item.id)}
                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Delete">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="p-4">
                    {isEditingDesc ? (
                      <div className="space-y-2">
                        <textarea value={editingField.value}
                          onChange={(e) => setEditingField({ ...editingField, value: e.target.value })}
                          rows={3}
                          className="w-full px-3 py-2 border border-blue-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white"
                          autoFocus
                          onKeyDown={(e) => { if (e.key === 'Escape') setEditingField(null); }} />
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => setEditingField(null)} className="px-3 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded-md">Cancel</button>
                          <button onClick={saveEdit} className="px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700">Save</button>
                        </div>
                      </div>
                    ) : (
                      <div className="group">
                        {item.description ? (
                          <p className="text-sm text-gray-800 leading-relaxed">{item.description}</p>
                        ) : (
                          <p className="text-sm text-gray-400 italic">Click AI to generate quantified description</p>
                        )}
                        <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => startEdit(item.id, 'description', item.description)}
                            className="flex items-center gap-1 px-2 py-1 text-[11px] text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors">
                            <Pencil className="w-3 h-3" /> Edit
                          </button>
                          <button onClick={() => quantify(item.id)} disabled={aiLoading === item.id || !item.title.trim()}
                            className="flex items-center gap-1 px-2 py-1 text-[11px] text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                            {aiLoading === item.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                            AI Quantify
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* AI Suggestion Panel */}
                {suggestion && suggestion.id === item.id && (
                  <div className="mt-2 border border-purple-200 rounded-xl overflow-hidden bg-white shadow-sm">
                    <div className="flex items-center justify-between px-4 py-2.5 bg-purple-50 border-b border-purple-100">
                      <span className="text-xs font-semibold text-purple-700 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        AI Suggestion · Quantify
                      </span>
                    </div>
                    <div className="grid grid-cols-2 divide-x divide-purple-100">
                      <div className="p-4">
                        <div className="flex items-center gap-1.5 mb-2">
                          <FileText className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Current</span>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed">{suggestion.original || <span className="italic text-gray-400">Empty</span>}</p>
                      </div>
                      <div className="p-4 bg-purple-50/30">
                        <div className="flex items-center gap-1.5 mb-2">
                          <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                          <span className="text-[11px] font-semibold text-purple-700 uppercase tracking-wider">Suggested</span>
                        </div>
                        <p className="text-sm text-gray-800 leading-relaxed">{suggestion.suggested}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-3 border-t border-purple-100 bg-white">
                      <button onClick={acceptSuggestion}
                        className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors">
                        <Check className="w-3.5 h-3.5" /> Accept
                      </button>
                      <button onClick={rejectSuggestion}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
                        <X className="w-3.5 h-3.5" /> Reject
                      </button>
                      <button onClick={() => quantify(item.id)}
                        disabled={aiLoading === item.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-purple-600 border border-purple-200 rounded-md hover:bg-purple-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                        {aiLoading === item.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                        Regenerate
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
        <p className="font-medium mb-1">Tip:</p>
        <p>Type what you did → click <strong>AI Quantify</strong> → converts to a measurable achievement with numbers and impact.</p>
      </div>
    </div>
  );
}
