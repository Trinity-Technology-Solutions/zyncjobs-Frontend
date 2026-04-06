import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useResumeStore } from '../../store/useResumeStore';

export default function EducationStep() {
  const { data, addEducation, updateEducation, removeEducation } = useResumeStore();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Education</h2>
          <p className="text-gray-600">Add your educational background</p>
        </div>
        <button
          onClick={addEducation}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Education
        </button>
      </div>

      {data.education.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
          <p className="text-gray-500 mb-4">No education added yet</p>
          <button
            onClick={addEducation}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            + Add your education
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {data.education.map((edu, idx) => (
            <div key={edu.id} className="p-6 border border-gray-200 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Education {idx + 1}</h3>
                <button
                  onClick={() => removeEducation(edu.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Degree *</label>
                  <input
                    type="text"
                    value={edu.degree}
                    onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                    placeholder="e.g. B.E Computer Science"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Institution *</label>
                  <input
                    type="text"
                    value={edu.institution}
                    onChange={(e) => updateEducation(edu.id, 'institution', e.target.value)}
                    placeholder="e.g. Anna University"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration *</label>
                  <input
                    type="text"
                    value={edu.duration}
                    onChange={(e) => updateEducation(edu.id, 'duration', e.target.value)}
                    placeholder="e.g. 2017 - 2021"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Grade (optional)</label>
                  <input
                    type="text"
                    value={edu.grade}
                    onChange={(e) => updateEducation(edu.id, 'grade', e.target.value)}
                    placeholder="e.g. 8.5 CGPA"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
