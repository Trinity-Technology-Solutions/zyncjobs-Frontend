import React, { useState, useEffect } from 'react';
import { X, Sparkles, Loader2, Check, Plus, Lightbulb } from 'lucide-react';
import { useResumeStore } from '../../store/useResumeStore';
import { executeResumeAI } from '../../services/resumeAIClient';

function extractSkills(raw: string): string[] {
  const nonSkill = /^(#|##|###|- |\* |•|for |feel free|certainly|sure|here|note|###|as a)/i;
  const categoryLabel = /^[-•*]?\s*[a-z\s]+:/i;
  const tokens = raw.split(/[,;\n|]+/).map(s => s.replace(/^[-•*]\s*/, '').trim()).filter(Boolean);
  const seen = new Set<string>();
  const skills: string[] = [];
  for (const t of tokens) {
    if (nonSkill.test(t)) continue;
    if (categoryLabel.test(t)) continue;
    if (t.length > 60) continue;
    const cleaned = t.replace(/^[-•*]\s*/, '').trim();
    if (!cleaned || cleaned.length < 2 || cleaned.length > 60) continue;
    if (seen.has(cleaned.toLowerCase())) continue;
    seen.add(cleaned.toLowerCase());
    skills.push(cleaned);
  }
  return skills;
}

export default function SkillsStep() {
  const { data, update } = useResumeStore();
  const [input, setInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<string[] | null>(null);
  const [expSkills, setExpSkills] = useState<string[]>([]);
  const [expSkillsLoading, setExpSkillsLoading] = useState(false);

  // Auto-suggest skills from experience data
  useEffect(() => {
    const hasExp = data.experience.some(e => e.title?.trim() || e.company?.trim());
    if (!hasExp || expSkills.length > 0) return;
    const timer = setTimeout(async () => {
      setExpSkillsLoading(true);
      try {
        const expText = data.experience
          .filter(e => e.title?.trim() || e.company?.trim())
          .map(e => `- ${e.title} at ${e.company}${e.bullets.filter(b => b.trim()).map(b => `\n  • ${b}`).join('')}`)
          .join('\n');
        if (!expText.trim()) { setExpSkillsLoading(false); return; }
        const res = await executeResumeAI({
          section: 'skills',
          action: 'find_missing',
          content: `Based on these work experiences, suggest 10-15 relevant technical and professional skills. Return ONLY a comma-separated list, no other text.\n\nExperiences:\n${expText}`,
        });
        if (res.result) {
          const skills = res.result.split(',').map(s => s.trim().replace(/^[\d.▪•\-*\s]+/, '')).filter(Boolean);
          if (skills.length > 0) setExpSkills(skills);
        }
      } catch {} finally { setExpSkillsLoading(false); }
    }, 2000);
    return () => clearTimeout(timer);
  }, [data.experience.length]);

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

  const generateSkills = async () => {
    setAiLoading(true);
    try {
      // Build comprehensive context from profile for better AI skills generation
      const profileText = [
        `Name: ${data.personalInfo.name || 'Professional'}`,
        `Current Skills: ${data.skills.join(', ')}`,
        `Target Role: ${data.targetRole || 'Not specified'}`,
        data.summary ? `Summary: ${data.summary}` : '',
        // Add experience titles for context
        data.experience.length > 0 ? 'Experience:' : '',
        ...data.experience.map(e => `• ${e.title || ''} at ${e.company || ''}`)
      ].filter(Boolean).join('\n');
      
      const res = await executeResumeAI({
        section: 'skills',
        action: 'generate',
        content: profileText || 'Professional',
      });
      const skills = extractSkills(res.result);
      const merged = [...new Set([...data.skills, ...skills])];
      setAiResult(skills);
      update('skills', merged);
    } catch (error) {
      console.error('Skills generation failed:', error);
      setAiResult(null);
    } finally {
      setAiLoading(false);
    }
  };

  const findMissingSkills = async () => {
    setAiLoading(true);
    try {
      // First, try to extract skills from work experience and other resume sections
      const experienceSkills = extractSkillsFromExperience();
      const allCurrentSkills = [...data.skills, ...expSkills];
      
      // If we have skills from experience and current skills are limited, 
      // generate from experience first to avoid AI dependency
      if (expSkills.length > 0 && allCurrentSkills.length < 5) {
        const merged = [...new Set([...data.skills, ...expSkills])];
        update('skills', merged);
        setAiResult(expSkills);
        return;
      }
      
      // Otherwise, call the AI API as fallback
      const res = await executeResumeAI({
        section: 'skills',
        action: 'find_missing',
        content: data.skills.join(', '),
      });
      const missing = extractSkills(res.result);
      const merged = [...new Set([...data.skills, ...missing])];
      setAiResult(missing);
      update('skills', merged);
    } catch (error) {
      setAiResult(null);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Skills</h2>
        <p className="text-gray-600">Add your technical and professional skills</p>
        <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1"><span className="text-emerald-400">💡</span> Aim for <span className="text-emerald-500 font-medium">8-15 relevant skills</span> — recruiters and ATS systems scan for keywords matching the job description</p>
      </div>

      {/* AI Actions */}
      <div className="flex items-center gap-1.5 flex-wrap bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
        <Sparkles className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />
        <button onClick={generateSkills} disabled={aiLoading}
          className="flex items-center gap-1 px-2.5 py-1 text-xs bg-white border border-gray-200 text-gray-700 rounded-md hover:bg-purple-50 hover:border-purple-200 hover:text-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
          {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
          ✨ Generate Skills
        </button>
        <button onClick={findMissingSkills} disabled={aiLoading}
          className="flex items-center gap-1 px-2.5 py-1 text-xs bg-white border border-gray-200 text-gray-700 rounded-md hover:bg-purple-50 hover:border-purple-200 hover:text-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
          {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
          ✨ Find Missing Skills
        </button>
      </div>

      {/* Experience-based skill suggestions */}
      {expSkillsLoading && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 flex items-center gap-2 text-xs text-indigo-700">
          <Loader2 className="w-3 h-3 animate-spin" />
          Analyzing your experience to suggest skills...
        </div>
      )}
      {expSkills.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <p className="text-xs font-medium text-gray-600">Based on your experience, AI suggests these skills:</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {expSkills.filter(s => !data.skills.includes(s)).map(s => (
              <button key={s} onClick={() => update('skills', [...data.skills, s])}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-white border border-indigo-200 text-indigo-700 rounded-lg hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all">
                <Plus className="w-3 h-3" /> {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Fallback: hardcoded chips when no experience yet */}
      {expSkills.length === 0 && data.skills.length === 0 && (data.experience[0]?.title || data.summary) && (
        <div>
          <p className="text-xs text-gray-500 mb-2">Based on your profile, common skills include:</p>
          <div className="flex flex-wrap gap-1.5">
            {[
              'Python', 'JavaScript', 'React', 'Node.js', 'SQL', 'Git', 'Docker',
              'AWS', 'TypeScript', 'Java', 'C++', 'REST APIs', 'Agile', 'CSS'
            ].filter(s => !data.skills.includes(s)).slice(0, 10).map(s => (
              <button key={s} onClick={() => update('skills', [...data.skills, s])}
                className="px-3 py-1 text-xs border border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:text-blue-700 hover:bg-blue-50 transition-colors">
                + {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* AI Result */}
      {aiResult && aiResult.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2 text-xs text-green-700">
          <Check className="w-3 h-3 text-green-500" />
          {aiResult.length} skill{aiResult.length !== 1 ? 's' : ''} added
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Add Skills (press Enter to add)
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a skill (e.g., React, Python, Project Management)"
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400 text-sm"
          />
          <button
            onClick={addSkill}
            className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
          >
            Add
          </button>
        </div>
      </div>

      {data.skills.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center justify-between">
            Your Skills ({data.skills.length})
            <span className="text-xs text-gray-400">Click to remove</span>
          </h3>
          <div className="flex flex-wrap gap-2">
            {data.skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 rounded-full text-sm border border-blue-100 hover:bg-blue-100 hover:border-blue-200 transition-all"
              >
                {skill}
                <button
                  onClick={() => removeSkill(skill)}
                  className="p-0.5 hover:text-blue-900 hover:bg-blue-100 rounded-full transition-colors"
                  title="Remove skill"
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
          <p className="text-gray-500">No skills added yet. Start typing above or use AI to generate skills!</p>
        </div>
      )}
    </div>
  );
}
