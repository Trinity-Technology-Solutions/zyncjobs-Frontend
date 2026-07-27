import React, { useState } from 'react';
import { Plus, Trash2, Sparkles, Loader2 } from 'lucide-react';
import { useResumeStore } from '../../store/useResumeStore';
import { executeResumeAI } from '../../services/resumeAIClient';

const QUICK_DEGREES = [
  'B.E Computer Science', 'B.Tech Information Technology', 'B.Sc Computer Science',
  'BCA', 'MCA', 'M.Tech', 'MBA', 'B.Com', 'BBA', 'B.E Mechanical', 'B.E Civil',
  'B.E Electrical', 'B.E Electronics', 'B.Sc Mathematics', 'B.Sc Physics',
];

export default function EducationStep() {
  const { data, addEducation, updateEducation, removeEducation } = useResumeStore();
  const [aiLoading, setAiLoading] = useState(false);

    const suggestEducation = async () => {
    setAiLoading(true);
    const title = data.experience[0]?.title || data.summary || 'Professional';
    try {
      const res = await executeResumeAI({ section: 'education', action: 'generate', content: `Target role: ${title}\n\nGenerate 2-3 relevant educational entries. Format: Degree, Institution, Year` });
      const lines = (res.result || '').split('\n').filter(Boolean);
      lines.forEach(line => {
        // Parse education line like "B.Sc Computer Science, Anna University, 2017-2021"
        const parts = line.split(',').map(s => s.trim());
        if (parts.length >= 2) {
          const degree = parts[0];
          const institution = parts[1];
          addEducation();
          const newId = (data.education.length > 0 ? data.education[data.education.length - 1]?.id : '') || Date.now().toString();
          if (degree) updateEducation(newId, 'degree', degree);
          if (institution) updateEducation(newId, 'institution', institution);
        } else if (parts.length === 1) {
          // Partial entry, just add degree
          addEducation();
          const newId = (data.education.length > 0 ? data.education[data.education.length - 1]?.id : '') || Date.now().toString();
          if (parts[0]) updateEducation(newId, 'degree', parts[0]);
        }
      });
    } catch (error) {
      console.error('Education suggestion failed:', error);
    } finally { setAiLoading(false); }
  };

  const hasRole = data.experience[0]?.title || data.summary;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Education</h2>
          <p className="text-sm text-gray-500 mt-0.5">Add your educational background</p>
          <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1"><span className="text-blue-400">💡</span> Include <span className="text-blue-500 font-medium">GPA &gt; 3.0</span> and relevant coursework — especially if you're a recent graduate</p>
        </div>
        <div className="flex items-center gap-2">
          {hasRole && (
            <button onClick={suggestEducation} disabled={aiLoading}
              className="flex items-center gap-1.5 px-3 py-2 text-xs bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 disabled:opacity-50 transition-colors">
              {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              Suggest
            </button>
          )}
          <button onClick={addEducation} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
      </div>

      {data.education.length === 0 ? (
        <div>
          <p className="text-xs text-gray-500 mb-3">Quick add — pick a degree to get started:</p>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {QUICK_DEGREES.slice(0, 8).map(d => (
              <button key={d} onClick={() => { addEducation(); const id = Date.now().toString(); updateEducation(id, 'degree', d); }}
                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:border-blue-400 hover:text-blue-700 transition-colors">{d}</button>
            ))}
          </div>
          {data.education.length === 0 && (
            <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl">
              <p className="text-gray-400 text-sm">Or manually add your education</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {data.education.map((edu, idx) => (
            <div key={edu.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 bg-gray-50/80 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-800">Education {idx + 1}</h3>
                <button onClick={() => removeEducation(edu.id)}
                  className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Degree *</label>
                  <input type="text" value={edu.degree} onChange={e => updateEducation(edu.id, 'degree', e.target.value)}
                    placeholder="Enter degree name"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white hover:border-gray-300 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Institution *</label>
                  <input type="text" value={edu.institution} onChange={e => updateEducation(edu.id, 'institution', e.target.value)}
                    placeholder="Enter institution name"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white hover:border-gray-300 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Location</label>
                  <input type="text" value={edu.location} onChange={e => updateEducation(edu.id, 'location', e.target.value)}
                    placeholder="City, State"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white hover:border-gray-300 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Duration</label>
                  <input type="text" value={edu.duration} onChange={e => updateEducation(edu.id, 'duration', e.target.value)}
                    placeholder="Start Year – End Year"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white hover:border-gray-300 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Grade (optional)</label>
                  <input type="text" value={edu.grade} onChange={e => updateEducation(edu.id, 'grade', e.target.value)}
                    placeholder="GPA / Percentage"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white hover:border-gray-300 transition-colors" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
