import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2, Copy, Check } from 'lucide-react';
import { useResumeStore } from '../../store/useResumeStore';
import { executeResumeAI } from '../../services/resumeAIClient';
import AutocompleteCombobox from '../AutocompleteCombobox';

interface Props {
  selectedJob?: any;
}

export default function CoverLetterStep({ selectedJob }: Props) {
  const { data } = useResumeStore();
  const CL_KEY = 'rb_cover_letter';
  const [company, setCompany] = useState(() => { try { return JSON.parse(localStorage.getItem(CL_KEY) || '{}').company || ''; } catch { return ''; } });
  const [jobTitle, setJobTitle] = useState(() => { try { return JSON.parse(localStorage.getItem(CL_KEY) || '{}').jobTitle || ''; } catch { return ''; } });
  const [tone, setTone] = useState<'professional' | 'enthusiastic' | 'concise'>(() => { try { return JSON.parse(localStorage.getItem(CL_KEY) || '{}').tone || 'professional'; } catch { return 'professional'; } });
  const [letter, setLetter] = useState(() => { try { return JSON.parse(localStorage.getItem(CL_KEY) || '{}').letter || ''; } catch { return ''; } });

  const persist = (patch: Record<string, string>) => {
    try {
      const prev = JSON.parse(localStorage.getItem(CL_KEY) || '{}');
      localStorage.setItem(CL_KEY, JSON.stringify({ ...prev, ...patch }));
    } catch { /* silent */ }
  };
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Auto-fill from selected job
  useEffect(() => {
    if (!selectedJob) return;
    const c = selectedJob.company || selectedJob.companyName || '';
    const jt = selectedJob.title || selectedJob.jobTitle || '';
    if (c && !company) { setCompany(c); persist({ company: c }); }
    if (jt && !jobTitle) { setJobTitle(jt); persist({ jobTitle: jt }); }
  }, [selectedJob?.id || selectedJob?._id]);
  const [error, setError] = useState('');

  const generate = async () => {
    if (!company.trim() || !jobTitle.trim()) { setError('Enter company name and job title first'); return; }
    setLoading(true);
    setError('');
    try {
      const summaryVal = Array.isArray(data.summary)
        ? (data.summary as string[]).join(' ')
        : data.summary || '';
      const expText = data.experience.slice(0, 2)
        .map((e) => `${e.title} at ${e.company}`)
        .join(', ');

      // Cover Letter Brain query
      const result = await executeResumeAI({
        section: 'cover_letter',
        action: 'generate',
        content: `cover letter: generate for ${jobTitle} at ${company}. candidate_name: ${data.personalInfo.name}, tone: ${tone}, summary: ${summaryVal}, experience: ${expText}, skills: ${data.skills.slice(0, 8).join(', ')}`,
      });

      const text = result.result || '';

      const finalLetter = (text && text.length > 100)
        ? text
        : buildFallback(data.personalInfo.name, jobTitle, company, summaryVal, expText, data.skills, tone);
      setLetter(finalLetter);
      persist({ letter: finalLetter, company, jobTitle, tone });
    } catch {
      const fb = buildFallback(data.personalInfo.name, jobTitle, company,
        Array.isArray(data.summary) ? (data.summary as string[]).join(' ') : data.summary || '',
        data.experience.slice(0, 2).map((e) => `${e.title} at ${e.company}`).join(', '),
        data.skills, tone);
      setLetter(fb);
      persist({ letter: fb, company, jobTitle, tone });
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    await navigator.clipboard.writeText(letter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Cover Letter</h2>
        <p className="text-gray-500 text-sm">AI generates a personalized cover letter from your resume</p>
        <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1"><span className="text-purple-400">💡</span> Mention the <span className="text-purple-500 font-medium">company name</span> and <span className="text-purple-500 font-medium">specific role</span> — generic cover letters are easily spotted and dismissed</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Company Name *</label>
          <input
            type="text"
            value={company}
            onChange={(e) => { setCompany(e.target.value); persist({ company: e.target.value }); }}
            placeholder="e.g. Google, TCS, Infosys"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Job Title *</label>
          <input
            type="text"
            value={jobTitle}
            onChange={(e) => { setJobTitle(e.target.value); persist({ jobTitle: e.target.value }); }}
            placeholder="e.g. Senior Backend Engineer"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <AutocompleteCombobox
            label="Tone"
            value={tone}
            onChange={(val) => { setTone(val as any); persist({ tone: val }); }}
            options={[
              { value: 'professional', label: 'Professional' },
              { value: 'enthusiastic', label: 'Enthusiastic' },
              { value: 'concise', label: 'Concise' },
            ]}
            placeholder="Select tone"
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        onClick={generate}
        disabled={loading || !company.trim() || !jobTitle.trim()}
        className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
      >
        {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Generating...</> : <><Sparkles className="w-4 h-4" />Generate Cover Letter</>}
      </button>

      {letter && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">Your Cover Letter</span>
            <button onClick={copy} className="flex items-center gap-1.5 px-3 py-1 text-xs border border-gray-300 rounded-lg hover:bg-gray-50">
              {copied ? <><Check className="w-3 h-3 text-green-600" />Copied!</> : <><Copy className="w-3 h-3" />Copy</>}
            </button>
          </div>
          <textarea
            value={letter}
            onChange={(e) => { setLetter(e.target.value); persist({ letter: e.target.value }); }}
            rows={16}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono leading-relaxed"
          />
        </div>
      )}
    </div>
  );
}

function buildFallback(name: string, jobTitle: string, company: string, summary: string, exp: string, skills: string[], tone: string): string {
  const greeting = tone === 'enthusiastic' ? 'I am thrilled to apply' : tone === 'concise' ? 'I am applying' : 'I am writing to express my interest in applying';
  return `Dear Hiring Manager,

${greeting} for the ${jobTitle} position at ${company}.

${summary || `As an experienced professional, I bring a strong background in ${skills.slice(0, 3).join(', ')}.`}

${exp ? `My experience includes ${exp}, where I consistently delivered high-quality results.` : ''}

I am particularly drawn to ${company} because of its commitment to innovation and excellence. My skills in ${skills.slice(0, 4).join(', ')} align well with the requirements of this role.

I would welcome the opportunity to discuss how my background can contribute to ${company}'s continued success.

Thank you for your consideration.

Sincerely,
${name || 'Your Name'}`;
}
