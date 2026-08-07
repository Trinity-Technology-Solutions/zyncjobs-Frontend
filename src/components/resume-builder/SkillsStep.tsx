import React, { useState, useEffect } from 'react';
import { X, Sparkles, Loader2, Check, Plus, Lightbulb } from 'lucide-react';
import { useResumeStore } from '../../store/useResumeStore';
import { executeResumeAI } from '../../services/resumeAIClient';

function extractSkills(raw: string): string[] {
  const nonSkill = /^(#|##|###|for |feel free|certainly|sure|here|note|as a)/i;
  const categoryLabel = /^[-•*]?\s*[a-z\s]+:/i;
  const tokens = raw.split(/[,;\n|]+/).map(s =>
    s.replace(/^[-•*★⭐\d.\s]+/, '').replace(/[★⭐*]+/g, '').trim()
  ).filter(Boolean);
  const seen = new Set<string>();
  const skills: string[] = [];
  for (const t of tokens) {
    if (nonSkill.test(t)) continue;
    if (categoryLabel.test(t)) continue;
    if (t.length > 60) continue;
    if (t.length < 2) continue;
    if (seen.has(t.toLowerCase())) continue;
    seen.add(t.toLowerCase());
    skills.push(t);
  }
  return skills;
}

import { ph } from '../../utils/goalPlaceholders';

export default function SkillsStep() {
  const { data, update } = useResumeStore();
  const goal = data.goal || '';
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
      const existingLower = new Set(data.skills.map(s => s.toLowerCase()));
      const context = [
        data.targetRole ? `Target Role: ${data.targetRole}` : '',
        data.experience.length > 0
          ? `Experience: ${data.experience.map(e => `${e.title} at ${e.company}`).join(', ')}`
          : '',
        `Current Skills: ${data.skills.join(', ')}`,
      ].filter(Boolean).join('\n');

      const res = await executeResumeAI({
        section: 'skills',
        action: 'find_missing',
        content: `${context}\n\nList ONLY skills that are missing from the current skills above. Return a plain comma-separated list with no symbols, no bullets, no numbering, no markdown.`,
      });
      const missing = extractSkills(res.result).filter(
        s => !existingLower.has(s.toLowerCase())
      );
      if (missing.length > 0) {
        update('skills', [...data.skills, ...missing]);
        setAiResult(missing);
      } else {
        setAiResult([]);
      }
    } catch {
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
        <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1"><svg className="w-3 h-3 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> Aim for <span className="text-emerald-500 font-medium">8-15 relevant skills</span> — recruiters and ATS systems scan for keywords matching the job description</p>
      </div>

      {/* AI Actions */}
      <div className="flex items-center gap-1.5 flex-wrap bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
        <Sparkles className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />
        <button onClick={generateSkills} disabled={aiLoading}
          className="flex items-center gap-1 px-2.5 py-1 text-xs bg-white border border-gray-200 text-gray-700 rounded-md hover:bg-purple-50 hover:border-purple-200 hover:text-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
          {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
          Generate Skills
        </button>
        <button onClick={findMissingSkills} disabled={aiLoading}
          className="flex items-center gap-1 px-2.5 py-1 text-xs bg-white border border-gray-200 text-gray-700 rounded-md hover:bg-purple-50 hover:border-purple-200 hover:text-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
          {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
          Find Missing Skills
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

      {aiResult !== null && (
        <div className={`border rounded-lg p-3 flex items-center gap-2 text-xs ${
          aiResult.length > 0 ? 'bg-green-50 border-green-200 text-green-700' : 'bg-blue-50 border-blue-200 text-blue-700'
        }`}>
          <Check className="w-3 h-3" />
          {aiResult.length > 0
            ? `${aiResult.length} missing skill${aiResult.length !== 1 ? 's' : ''} added`
            : 'No missing skills found — your profile looks complete!'}
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
            placeholder={ph(goal, 'skill')}
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
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center justify-between">
            Your Skills <span className="font-normal normal-case tracking-normal text-gray-400">{data.skills.length} added · click to remove</span>
          </h3>
          <div className="flex flex-wrap gap-2">
            {data.skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white text-blue-700 rounded-full text-xs font-medium border border-blue-200 shadow-sm hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition-all group cursor-default"
              >
                {skill}
                <button
                  onClick={() => removeSkill(skill)}
                  className="opacity-50 group-hover:opacity-100 transition-opacity"
                  title="Remove"
                >
                  <X className="w-3 h-3" />
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
