import React, { useState } from 'react';
import { Plus, Trash2, Sparkles, Loader2, Lightbulb } from 'lucide-react';
import { useResumeStore } from '../../store/useResumeStore';
import { resumeBuilderAPI } from '../../services/resumeBuilderAPI';

export default function ExperienceStep() {
  const { data, addExperience, updateExperience, removeExperience } = useResumeStore();
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<{ [key: string]: any }>({});
  const [showSuggestions, setShowSuggestions] = useState<string | null>(null);

  // AI Generate bullets for specific experience
  const generateBullets = async (expId: string) => {
    const exp = data.experience.find((e) => e.id === expId);
    if (!exp || !exp.title || !exp.company) {
      alert('Please enter job title and company first');
      return;
    }

    setAiLoading(expId);
    try {
      const result = await resumeBuilderAPI.generateContent({
        jobTitle: exp.title,
        experience: `${exp.title} at ${exp.company}`,
      });

      // Update bullets with AI-generated ones
      updateExperience(expId, 'bullets', result.bullets);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setAiLoading(null);
    }
  };

  // Get AI suggestions for a specific bullet
  const getSuggestions = async (expId: string, bulletIdx: number, text: string) => {
    if (!text.trim() || text.length < 10) return;

    const key = `${expId}-${bulletIdx}`;
    setAiLoading(key);

    try {
      const exp = data.experience.find((e) => e.id === expId);
      const result = await resumeBuilderAPI.suggestBullets({
        text,
        jobTitle: exp?.title,
      });

      setSuggestions((prev) => ({ ...prev, [key]: result.suggestions }));
      setShowSuggestions(key);
    } catch (err: any) {
      console.error('Suggestion error:', err);
    } finally {
      setAiLoading(null);
    }
  };

  // Apply AI suggestion
  const applySuggestion = (expId: string, bulletIdx: number, improved: string) => {
    const exp = data.experience.find((e) => e.id === expId);
    if (!exp) return;

    const newBullets = [...exp.bullets];
    newBullets[bulletIdx] = improved;
    updateExperience(expId, 'bullets', newBullets);
    setShowSuggestions(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Work Experience</h2>
          <p className="text-gray-600">Add your professional experience</p>
        </div>
        <button
          onClick={addExperience}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Experience
        </button>
      </div>

      {data.experience.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
          <p className="text-gray-500 mb-4">No experience added yet</p>
          <button
            onClick={addExperience}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            + Add your first experience
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {data.experience.map((exp, idx) => (
            <div key={exp.id} className="p-6 border border-gray-200 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Experience {idx + 1}</h3>
                <button
                  onClick={() => removeExperience(exp.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Job Title *</label>
                  <input
                    type="text"
                    value={exp.title}
                    onChange={(e) => updateExperience(exp.id, 'title', e.target.value)}
                    placeholder="e.g. Software Engineer"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company *</label>
                  <input
                    type="text"
                    value={exp.company}
                    onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                    placeholder="e.g. TCS"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration *</label>
                  <input
                    type="text"
                    value={exp.duration}
                    onChange={(e) => updateExperience(exp.id, 'duration', e.target.value)}
                    placeholder="e.g. Jan 2020 - Present"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex items-center pt-6">
                  <input
                    type="checkbox"
                    checked={exp.current}
                    onChange={(e) => updateExperience(exp.id, 'current', e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <label className="ml-2 text-sm text-gray-700">Currently working here</label>
                </div>
              </div>

              {/* AI Generate Bullets Button */}
              <div className="flex items-center justify-between pt-2 pb-2 border-t border-gray-100">
                <label className="block text-sm font-medium text-gray-700">
                  Key Achievements (bullet points)
                </label>
                <button
                  onClick={() => generateBullets(exp.id)}
                  disabled={aiLoading === exp.id || !exp.title || !exp.company}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {aiLoading === exp.id ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      Write with AI
                    </>
                  )}
                </button>
              </div>
                {exp.bullets.map((bullet, bIdx) => {
                  const key = `${exp.id}-${bIdx}`;
                  const hasSuggestions = suggestions[key]?.length > 0;

                  return (
                    <div key={bIdx} className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={bullet}
                          onChange={(e) => {
                            const newBullets = [...exp.bullets];
                            newBullets[bIdx] = e.target.value;
                            updateExperience(exp.id, 'bullets', newBullets);
                          }}
                          onBlur={(e) => {
                            if (e.target.value.trim().length >= 10) {
                              getSuggestions(exp.id, bIdx, e.target.value);
                            }
                          }}
                          placeholder="• Led team of 5 developers to deliver project 2 weeks ahead of schedule"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                        <button
                          onClick={() => getSuggestions(exp.id, bIdx, bullet)}
                          disabled={aiLoading === key || !bullet.trim() || bullet.length < 10}
                          className="px-3 py-2 text-purple-600 hover:bg-purple-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          title="Get AI suggestions"
                        >
                          {aiLoading === key ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Lightbulb className="w-4 h-4" />
                          )}
                        </button>
                        {exp.bullets.length > 1 && (
                          <button
                            onClick={() => {
                              const newBullets = exp.bullets.filter((_, i) => i !== bIdx);
                              updateExperience(exp.id, 'bullets', newBullets);
                            }}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* AI Suggestions Dropdown */}
                      {showSuggestions === key && hasSuggestions && (
                        <div className="ml-2 p-3 bg-purple-50 border border-purple-200 rounded-lg space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-purple-700 flex items-center gap-1">
                              <Sparkles className="w-3 h-3" />
                              AI Suggestions
                            </span>
                            <button
                              onClick={() => setShowSuggestions(null)}
                              className="text-xs text-gray-500 hover:text-gray-700"
                            >
                              ✕
                            </button>
                          </div>
                          {suggestions[key].map((sug: any, i: number) => (
                            <div key={i} className="bg-white p-2 rounded border border-purple-100">
                              <p className="text-sm text-gray-800 mb-1">{sug.improved}</p>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">{sug.reason}</span>
                                <button
                                  onClick={() => applySuggestion(exp.id, bIdx, sug.improved)}
                                  className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                                >
                                  Use this
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
                <button
                  onClick={() => updateExperience(exp.id, 'bullets', [...exp.bullets, ''])}
                  className="text-sm text-blue-600 hover:text-blue-700 mt-2"
                >
                  + Add bullet point
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
