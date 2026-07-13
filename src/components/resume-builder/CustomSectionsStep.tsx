import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useResumeStore } from '../../store/useResumeStore';

export default function CustomSectionsStep() {
  const { data, addCustomSection, updateCustomSection, removeCustomSection } = useResumeStore();
  const sections = data.customSections || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Custom Sections</h2>
          <p className="text-gray-500 text-sm">Add any section that doesn't fit elsewhere — Volunteer Work, Publications, Hobbies, etc.</p>
          <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1"><span className="text-blue-400">💡</span> Volunteer work and open-source contributions make you stand out — especially for early-career roles</p>
        </div>
        <button onClick={addCustomSection} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
          <Plus className="w-4 h-4" /> Add Section
        </button>
      </div>

      {sections.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
          <p className="text-gray-500 mb-3">No custom sections yet</p>
          <button onClick={addCustomSection} className="text-blue-600 hover:text-blue-700 font-medium text-sm">+ Add a custom section</button>
        </div>
      ) : (
        <div className="space-y-4">
          {sections.map((sec) => (
            <div key={sec.id} className="p-5 border border-gray-200 rounded-xl space-y-3">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={sec.heading}
                  onChange={(e) => updateCustomSection(sec.id, 'heading', e.target.value)}
                  placeholder="Section heading (e.g. Volunteer Work)"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button onClick={() => removeCustomSection(sec.id)} className="text-red-400 hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <textarea
                value={sec.content}
                onChange={(e) => updateCustomSection(sec.id, 'content', e.target.value)}
                rows={4}
                placeholder="Describe this section..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
