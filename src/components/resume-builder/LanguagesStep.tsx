import React, { useState } from 'react';
import { Plus, Trash2, Sparkles, Loader2 } from 'lucide-react';
import { useResumeStore, LanguageItem } from '../../store/useResumeStore';

const LEVELS: LanguageItem['proficiency'][] = ['Native', 'Fluent', 'Advanced', 'Intermediate', 'Basic'];
const COMMON_LANGUAGES = ['English', 'Tamil', 'Hindi', 'Malayalam', 'Telugu', 'Kannada', 'French', 'German', 'Spanish', 'Arabic', 'Japanese', 'Mandarin'];

export default function LanguagesStep() {
  const { data, addLanguage, updateLanguage, removeLanguage } = useResumeStore();
  const [aiLoading, setAiLoading] = useState(false);
  const languages = data.languages || [];

  const suggestLanguages = async () => {
    setAiLoading(true);
    try {
      const { executeResumeAI } = await import('../../services/resumeAIClient');
      const res = await executeResumeAI({ section: 'languages', action: 'generate', content: 'Suggest 3-5 common languages for a resume' });
      const items = (res.result || '').split(/[,;\n]/).map(s => s.trim()).filter(Boolean).slice(0, 5);
      items.forEach(lang => {
        if (!lang) return;
        addLanguage();
        const id = (languages.length > 0 ? languages[languages.length - 1]?.id : '') || Date.now().toString();
        updateLanguage(id, 'language', lang);
      });
    } catch { /* silent */ } finally { setAiLoading(false); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Languages</h2>
          <p className="text-sm text-gray-500 mt-0.5">Add languages you speak</p>
          <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1"><span className="text-blue-400">💡</span> Only list languages relevant to the job — bilingual roles value this more than technical ones</p>
        </div>
        <div className="flex items-center gap-2">
          {languages.length === 0 && (
            <button onClick={suggestLanguages} disabled={aiLoading}
              className="flex items-center gap-1.5 px-3 py-2 text-xs bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 disabled:opacity-50 transition-colors">
              {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              Suggest
            </button>
          )}
          <button onClick={addLanguage} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
      </div>

      {languages.length === 0 ? (
        <div>
          <p className="text-xs text-gray-500 mb-3">Common languages — click to add:</p>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {COMMON_LANGUAGES.map(l => (
              <button key={l} onClick={() => { addLanguage(); const id = Date.now().toString(); updateLanguage(id, 'language', l); }}
                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:border-blue-400 hover:text-blue-700 transition-colors">{l}</button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {languages.map((lang) => (
            <div key={lang.id} className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl">
              <input type="text" value={lang.language} onChange={e => updateLanguage(lang.id, 'language', e.target.value)}
                placeholder="e.g. Tamil"
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white hover:border-gray-300 transition-colors" />
              <select value={lang.proficiency} onChange={e => updateLanguage(lang.id, 'proficiency', e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white">
                {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
              <button onClick={() => removeLanguage(lang.id)} className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
