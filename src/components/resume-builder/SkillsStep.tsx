import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useResumeStore } from '../../store/useResumeStore';

export default function SkillsStep() {
  const { data, update } = useResumeStore();
  const [input, setInput] = useState('');

  const addSkill = () => {
    const trimmed = input.trim();
    if (trimmed && !data.skills.includes(trimmed)) {
      update('skills', [...data.skills, trimmed]);
      setInput('');
    }
  };

  const removeSkill = (skill: string) => {
    update('skills', data.skills.filter((s) => s !== skill));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Skills</h2>
        <p className="text-gray-600">Add your technical and professional skills</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Add Skills (press Enter to add)
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. React, Node.js, Python..."
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={addSkill}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add
          </button>
        </div>
      </div>

      {data.skills.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Your Skills ({data.skills.length})</h3>
          <div className="flex flex-wrap gap-2">
            {data.skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm"
              >
                {skill}
                <button
                  onClick={() => removeSkill(skill)}
                  className="hover:text-blue-900"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {data.skills.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
          <p className="text-gray-500">No skills added yet. Start typing above!</p>
        </div>
      )}
    </div>
  );
}
