import React, { useState } from 'react';
import { Sparkles, Loader2, Check, Pencil } from 'lucide-react';
import { useResumeStore } from '../../store/useResumeStore';
import { executeResumeAI } from '../../services/resumeAIClient';

const ROLE_SUGGESTIONS = [
  'Software Engineer', 'Frontend Developer', 'Backend Developer',
  'Full Stack Developer', 'DevOps Engineer', 'Data Engineer',
  'Data Scientist', 'Product Manager', 'UI/UX Designer',
  'Project Manager', 'Business Analyst', 'QA Engineer',
];

const STYLE_TOGGLES = [
  { id: 'improve',      label: 'Rewrite' },
  { id: 'professional', label: 'Professional' },
  { id: 'shorten',      label: 'Shorten' },
  { id: 'friendly',     label: 'Friendly' },
];

function cleanSummary(raw: string): string {
  const advicePatterns = /^(here are some suggestions|highlight|tailor|use active|keep it concise|consider adding|you may|try to|to make it|focus on|be sure|remember to)/i;
  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
  const cleaned: string[] = [];
  for (const line of lines) {
    const s = line.replace(/^[-•*#]+\s*/, '').replace(/\*\*/g, '').trim();
    if (!s || s.length > 200) continue;
    if (/^\[(X|\d+)\]/.test(s) || /^(certainly|sure|here|feel free|note:|###|---)/i.test(s)) continue;
    if (/^(key skills|highlights|summary|---)/i.test(s) || advicePatterns.test(s)) continue;
    cleaned.push(s);
  }
  if (cleaned.length === 0) {
    const sentences = raw.split(/(?<=[.!?])\s+/).map(s => s.replace(/\*\*/g, '').trim()).filter(Boolean);
    return sentences.filter(s => s.length > 10 && s.length < 200 && !advicePatterns.test(s)).slice(0, 3).join(' ');
  }
  return cleaned.join(' ');
}

export default function SummaryStep() {
  const { data, update } = useResumeStore();
  const [loading, setLoading] = useState(false);
  const [styleLoading, setStyleLoading] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const [options, setOptions] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState('');

  const summaryText = Array.isArray(data.summary) ? data.summary.filter(Boolean).join(' ') : data.summary || '';

  // ── Build context string from experience + skills ─────────────────────
  const buildContext = (role: string) => {
    const expText = data.experience.map(e =>
      `${e.title} at ${e.company}${e.bullets.filter(Boolean).length ? ` - ${e.bullets.filter(Boolean).join('. ')}` : ''}`
    ).join('. ');
    const skillsText = data.skills.join(', ');
    return `Role: ${role || data.experience[0]?.title || 'Professional'}\nExperience: ${expText}\nSkills: ${skillsText}`;
  };

  // ── Generate 3 summary options ────────────────────────────────────────
  const generateOptions = async (role: string) => {
    setLoading(true);
    setSelectedRole(role);
    setOptions([]);
    const context = buildContext(role);
    try {
      const res = await executeResumeAI({
        section: 'summary',
        action: 'generate',
        content: `${context}\n\nWrite 3 different professional summary options for this candidate. Each must be 2-3 sentences, start with a strong opening, highlight experience and skills. Separate each option with "---" on its own line. No labels, no placeholders.`,
      });
      if (res.result) {
        const opts = res.result.split('---').map(s => s.replace(/^Option\s*\d*[:.]?\s*/i, '').trim()).filter(Boolean).slice(0, 3);
        setOptions(opts.length >= 2 ? opts : [res.result]);
      }
    } catch { /* silent */ } finally { setLoading(false); }
  };

  // ── Select an option ──────────────────────────────────────────────────
  const selectOption = (text: string) => {
    const cleaned = cleanSummary(text);
    update('summary', cleaned || text);
    setOptions([]);
  };

  // ── Style toggle ──────────────────────────────────────────────────────
  const applyStyle = async (styleId: string) => {
    if (!summaryText) return;
    setStyleLoading(styleId);
    const actions: Record<string, string> = { improve: 'rewrite', professional: 'professional', shorten: 'shorten', friendly: 'friendly' };
    try {
      const res = await executeResumeAI({ section: 'summary', action: actions[styleId] || 'improve', content: summaryText });
      const cleaned = cleanSummary(res.result || '');
      if (cleaned) update('summary', cleaned);
    } catch { /* silent */ } finally { setStyleLoading(null); }
  };

  // ── Fallback summaries per role ───────────────────────────────────────
  const fallbackForRole = (role: string): string[] => [
    `Experienced ${role} with a proven track record of delivering high-quality software solutions. Skilled in full development lifecycle from requirements analysis to deployment, with strong collaboration across cross-functional teams.`,
    `Results-driven ${role} with expertise in building scalable applications and optimizing system performance. Passionate about writing clean code and adopting modern development practices to drive business value.`,
    `Dedicated ${role} with a focus on creating user-centric solutions and improving team productivity. Adept at translating complex requirements into efficient, maintainable code.`,
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Professional Summary</h2>
        <p className="text-sm text-gray-500 mt-0.5">Pick a role — AI generates 3 options to choose from</p>
        <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1"><span className="text-blue-400">💡</span> Keep it 3-4 sentences — highlight your top <span className="text-blue-500 font-medium">achievements</span>, <span className="text-blue-500 font-medium">years of experience</span>, and <span className="text-blue-500 font-medium">key skills</span></p>
      </div>

      {!summaryText && options.length === 0 && !loading && (
        /* ── Role picker (empty state) ─────────────────────────────────── */
        <div>
          <p className="text-sm font-medium text-gray-700 mb-3">What job are you applying for?</p>
          <div className="flex flex-wrap gap-2">
            {ROLE_SUGGESTIONS.map(role => (
              <button key={role} onClick={() => generateOptions(role)} disabled={loading}
                className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 hover:text-purple-700 disabled:opacity-40 transition-all"
              >
                {role}
              </button>
            ))}
          </div>
        </div>
      )}

      {!summaryText && loading && (
        <div className="flex items-center gap-3 py-8 justify-center text-sm text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
          Generating 3 options for <span className="font-semibold text-gray-700">{selectedRole}</span>...
        </div>
      )}

      {!summaryText && options.length > 0 && (
        /* ── Select from 3 AI options ────────────────────────────────── */
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700">Choose a summary style:</p>
          {options.map((opt, i) => (
            <div key={i}
              onClick={() => selectOption(opt)}
              className="p-4 border border-gray-200 rounded-xl cursor-pointer hover:border-purple-300 hover:bg-purple-50/50 transition-all group"
            >
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 mt-0.5 shrink-0 rounded-full border-2 border-gray-300 group-hover:border-purple-500 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full group-hover:bg-purple-500" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-400 mb-1">Option {i + 1}</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{opt}</p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); selectOption(opt); }}
                  className="px-3 py-1.5 text-xs font-semibold bg-purple-600 text-white rounded-md hover:bg-purple-700 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  Use this
                </button>
              </div>
            </div>
          ))}
          <button onClick={() => { setOptions([]); setSelectedRole(''); }}
            className="text-xs text-gray-500 hover:text-gray-700 underline">
            Choose a different role
          </button>
        </div>
      )}

      {summaryText && (
        /* ── Has summary ──────────────────────────────────────────────── */
        <div className="space-y-4">
          {editing ? (
            <div className="space-y-2">
              <textarea value={editText} onChange={e => setEditText(e.target.value)}
                rows={4} autoFocus
                className="w-full px-4 py-3 border border-blue-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 resize-none"
                onKeyDown={e => { if (e.key === 'Escape') { setEditing(false); } }}
              />
              <div className="flex gap-2">
                <button onClick={() => { update('summary', editText); setEditing(false); }}
                  className="px-4 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  Save
                </button>
                <button onClick={() => setEditing(false)}
                  className="px-4 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-800 leading-relaxed">{summaryText}</p>
              <button onClick={() => { setEditText(summaryText); setEditing(true); }}
                className="flex items-center gap-1 mt-3 text-xs text-gray-500 hover:text-blue-600">
                <Pencil className="w-3 h-3" /> Edit
              </button>
            </div>
          )}

          {/* Regenerate with different role */}
          <details className="text-sm">
            <summary className="cursor-pointer text-purple-600 hover:text-purple-700 font-medium text-xs">
              Try a different role
            </summary>
            <div className="flex flex-wrap gap-2 mt-3">
              {ROLE_SUGGESTIONS.filter(r => r !== selectedRole).slice(0, 6).map(role => (
                <button key={role} onClick={() => { update('summary', ''); generateOptions(role); }}
                  disabled={loading}
                  className="px-3 py-1.5 text-xs border border-gray-200 rounded-md hover:border-purple-300 hover:text-purple-700 disabled:opacity-40 transition-all"
                >
                  {role}
                </button>
              ))}
            </div>
          </details>

          {/* Style toggles */}
          <div className="flex items-center gap-2 flex-wrap">
            <Sparkles className="w-3.5 h-3.5 text-purple-500" />
            {STYLE_TOGGLES.map(s => (
              <button key={s.id} onClick={() => applyStyle(s.id)} disabled={styleLoading === s.id}
                className="flex items-center gap-1 px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md hover:border-purple-300 hover:text-purple-700 disabled:opacity-40 transition-all"
              >
                {styleLoading === s.id ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
