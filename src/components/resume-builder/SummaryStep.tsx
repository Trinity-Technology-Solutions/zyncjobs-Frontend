import { useState, useEffect } from 'react';
import { Sparkles, Loader2, Pencil } from 'lucide-react';
import { useResumeStore } from '../../store/useResumeStore';
import { executeResumeAI } from '../../services/resumeAIClient';
import { validateJobTitle } from '../../utils/resumeFieldValidators';

const ROLE_SUGGESTIONS = [
  'Software Engineer', 'Marketing Specialist', 'Frontend Developer',
  'Sales Executive', 'Backend Developer', 'HR Manager',
  'Full Stack Developer', 'Business Analyst', 'DevOps Engineer',
  'Project Manager', 'Data Engineer', 'Accountant',
  'Data Scientist', 'Customer Support Specialist', 'Data Analyst',
  'Operations Manager', 'Product Manager', 'Teacher',
  'UI/UX Designer', 'Financial Analyst', 'QA Engineer',
  'Recruiter', 'QA Analyst', 'Graphic Designer',
  'Mobile Developer', 'Content Writer', 'Cloud Engineer',
  'Supply Chain Manager', 'Machine Learning Engineer', 'Administrative Assistant',
  'Cybersecurity Analyst', 'Nurse', 'Database Administrator',
  'Technical Writer', 'Civil Engineer', 'Scrum Master',
  'Solutions Architect', 'Network Engineer',
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
  const [customRole, setCustomRole] = useState('');
  const [roleError, setRoleError] = useState<string | null>(null);

  const handleGenerateCustom = () => {
    const trimmed = customRole.trim();
    if (!trimmed) return;
    const err = validateJobTitle(trimmed);
    if (err) {
      setRoleError(err);
      return;
    }
    setRoleError(null);
    generateOptions(trimmed);
    setCustomRole('');
  };

  // Auto-generate using wizard role if no summary yet
  useEffect(() => {
    if (!summaryText && !loading && options.length === 0 && data.targetRole?.trim()) {
      generateOptions(data.targetRole.trim());
    }
  }, []);

  const summaryText = Array.isArray(data.summary) ? data.summary.filter(Boolean).join(' ') : data.summary || '';

  // ── Build context string from experience + skills ─────────────────────
  const buildContext = (role: string) => {
    const expText = data.experience
      .filter(e => e.title?.trim() || e.company?.trim())
      .map(e => `${e.title} at ${e.company}${e.bullets.filter(Boolean).length ? `: ${e.bullets.filter(Boolean).join('. ')}` : ''}`)
      .join(' | ');
    const skillsText = data.skills.join(', ');
    const achievementsText = (data.achievements || [])
      .filter((a: any) => a.title?.trim())
      .map((a: any) => a.description ? `${a.title}: ${a.description}` : a.title)
      .join('. ');
    const parts = [
      `Target Role: ${role}`,
      expText ? `Experience: ${expText}` : '',
      skillsText ? `Skills: ${skillsText}` : '',
      achievementsText ? `Achievements: ${achievementsText}` : '',
      data.personalInfo?.name ? `Name: ${data.personalInfo.name}` : '',
    ];
    return parts.filter(Boolean).join('\n');
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
        content: `${context}\n\nThe exact selected job role is "${role}". Write exactly 3 distinct professional summary options for this candidate, each tailored to that role and 2-3 sentences long. Use only facts in the candidate context: do not invent years, seniority, employers, metrics, achievements, tools, or qualifications. If their recorded experience is in a different role, state their actual experience accurately and frame the selected role as their target; connect it only to relevant skills that are listed. Each option must name "${role}" and must not claim the candidate has held that role unless the experience history supports it. Separate options with "---" on its own line. Return only the options, with no labels or placeholders.`,
      });
      if (res.result) {
        const opts = res.result.split('---').map(s => s.replace(/^Option\s*\d*[:.]?\s*/i, '').trim()).filter(Boolean).slice(0, 3);
        const roleMentionedInEveryOption = opts.length >= 2 && opts.every(option =>
          option.toLocaleLowerCase().includes(role.toLocaleLowerCase())
        );
        setOptions(roleMentionedInEveryOption ? opts : fallbackForRole(role));
      } else {
        setOptions(fallbackForRole(role));
      }
    } catch {
      setOptions(fallbackForRole(role));
    } finally { setLoading(false); }
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
  const fallbackForRole = (role: string): string[] => {
    const experience = data.experience
      .filter(item => item.title?.trim() || item.company?.trim())
      .slice(0, 2)
      .map(item => [item.title, item.company].filter(Boolean).join(' at '));
    const skills = data.skills.map(skill => skill.trim()).filter(Boolean).slice(0, 5);
    const experienceText = experience.length ? `Recorded experience includes ${experience.join('; ')}.` : '';
    const skillsText = skills.length ? `Listed skills include ${skills.join(', ')}.` : '';

    if (!experienceText && !skillsText) {
      return [
        `Candidate targeting ${role}. Add relevant experience and skills to create a specific summary without unsupported claims.`,
        `Career objective: ${role}. The profile does not yet list experience or skills to support a more detailed summary.`,
        `Applicant seeking a ${role} opportunity. Add verified skills and experience to personalize this summary.`,
      ];
    }

    return [
      `Candidate targeting ${role}. ${experienceText} ${skillsText}`.trim(),
      `${role} applicant whose profile records ${[experience.join(', '), skills.join(', ')].filter(Boolean).join(' and ')}.`,
      `Seeking a ${role} position, with documented background in ${[experience.join(', '), skills.join(', ')].filter(Boolean).join(' and ')}.`,
    ];
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Professional Summary</h2>
        <p className="text-sm text-gray-500 mt-0.5">Pick any role — AI generates 3 options grounded in your experience and skills</p>
        <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1"><svg className="w-3 h-3 text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> Keep it 3-4 sentences — highlight your top <span className="text-blue-500 font-medium">achievements</span>, <span className="text-blue-500 font-medium">years of experience</span>, and <span className="text-blue-500 font-medium">key skills</span></p>
      </div>

      {!summaryText && options.length === 0 && !loading && (
        /* ── Role picker (empty state) ─────────────────────────────────── */
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700">What job are you applying for?</p>
          {/* Custom role input */}
          <div>
            <div className="flex gap-2">
              <input
                type="text"
                value={customRole}
                onChange={e => { setCustomRole(e.target.value); if (roleError) setRoleError(null); }}
                onKeyDown={e => { if (e.key === 'Enter') handleGenerateCustom(); }}
                placeholder="Type your role (e.g. QA Analyst, Data Analyst...)"
                aria-invalid={Boolean(roleError)}
                className={`flex-1 px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder:text-gray-400 ${
                  roleError ? 'border-red-400 bg-red-50' : 'border-gray-300'
                }`}
              />
              <button
                onClick={handleGenerateCustom}
                disabled={!customRole.trim() || loading}
                className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Generate
              </button>
            </div>
            {roleError && (
              <p role="alert" className="text-[11px] text-red-600 mt-1">{roleError}</p>
            )}
          </div>
          <p className="text-xs text-gray-400">Or pick from common roles:</p>
          <div className="flex flex-wrap gap-2">
            {ROLE_SUGGESTIONS.map(role => (
              <button key={role} onClick={() => generateOptions(role)} disabled={loading}
                className={`px-3 py-1.5 text-xs border rounded-lg transition-all ${
                  selectedRole === role
                    ? 'border-purple-500 bg-purple-50 text-purple-700 font-medium'
                    : 'border-gray-200 hover:border-purple-400 hover:bg-purple-50 hover:text-purple-700'
                } disabled:opacity-40`}
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
              {ROLE_SUGGESTIONS.filter(r => r !== selectedRole).slice(0, 12).map(role => (
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
