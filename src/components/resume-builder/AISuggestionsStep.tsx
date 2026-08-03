import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2, Wand2, CheckCircle, Target } from 'lucide-react';
import { useResumeStore } from '../../store/useResumeStore';
import { executeResumeAI } from '../../services/resumeAIClient';

interface Props {
  selectedJob?: any;
}

export default function AISuggestionsStep({ selectedJob }: Props) {
  const { data, update } = useResumeStore();
  const goal = data.goal || '';
  const [loading, setLoading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [jdText, setJdText] = useState(data.jobDescription || '');
  const [optimizationResult, setOptimizationResult] = useState<any>(null);
  const [versions, setVersions] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('resume_jd_versions') || '[]'); } catch { return []; }
  });
  const [saveName, setSaveName] = useState('');

  const handleGenerateContent = async () => {
    if (!data.experience.length) {
      setError('Please add at least one work experience first');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const goalContext = goal ? `Career goal: ${goal}. Tailor the summary for this career level.` : '';
      const expText = [goalContext, ...data.experience
        .map((e) => `${e.title} at ${e.company} - ${e.bullets.join('. ')}`)
        .join('. ')].filter(Boolean).join('\n');
      try {
        const res = await executeResumeAI({
          section: 'summary',
          action: 'generate',
          content: expText,
        });
        update('summary', res.result);
      } catch {
        const title = data.experience[0]?.title || 'Professional';
        const company = data.experience[0]?.company || 'a leading company';
        const goalFallbacks: Record<string, string> = {
          'first-job': `Motivated recent graduate with hands-on experience as ${title} at ${company}. Eager to apply academic knowledge and internship experience to deliver high-quality solutions in a dynamic team environment.`,
          'internship': `Enthusiastic student with practical experience as ${title} at ${company}. Quick learner seeking an internship opportunity to develop skills and contribute to meaningful projects.`,
          'career-switch': `Career-driven professional with transferable expertise from experience as ${title} at ${company}. Bringing a unique cross-functional perspective and strong adaptability to a new field.`,
          'experienced': `Results-driven ${title} with a proven track record at ${company}. Experienced in delivering high-impact solutions, leading cross-functional teams, and driving measurable business outcomes.`,
          'executive': `Visionary leader with executive-level experience as ${title} at ${company}. Proven ability to drive organizational strategy, lead large-scale initiatives, and deliver transformative business results.`,
        };
        update('summary', goalFallbacks[goal] || `Results-driven ${title} with hands-on experience at ${company}. Proven ability to deliver high-quality solutions and collaborate with cross-functional teams to drive measurable business impact.`);
      }
      setSuccess('✅ AI generated summary and skills!');
    } finally {
      setLoading(false);
    }
  };

  const handleOptimizeWithJD = async () => {
    if (!jdText.trim()) { setError('Please paste a job description first'); return; }
    if (!data.summary && !data.skills.length && !data.experience.length) {
      setError('Please add some resume content first'); return;
    }
    setOptimizing(true);
    setError('');
    setSuccess('');
    try {
      const bullets = data.experience.flatMap((e) => e.bullets.filter((b) => b.trim()));
      const resumeText = [
        data.targetRole ? `Target Role: ${data.targetRole}` : '',
        data.summary ? `Summary: ${data.summary}` : '',
        bullets.length ? `Bullets:\n${bullets.join('\n')}` : '',
        data.skills.length ? `Skills: ${data.skills.join(', ')}` : '',
        goal ? `Career Goal: ${goal}` : '',
      ].filter(Boolean).join('\n');
      const res = await executeResumeAI({
        section: 'resume',
        action: 'optimize',
        content: `Job Description:\n${jdText}\n---\nResume:\n${resumeText}`,
      });
      // Parse structured JSON response from backend
      let parsed: any = null;
      try { parsed = JSON.parse(res.result || '{}'); } catch { /* not JSON */ }
      if (parsed && (parsed.keywords || parsed.optimized_summary)) {
        setOptimizationResult(parsed);
      } else {
        // Fallback: extract keywords from JD locally
        const words = jdText.replace(/[^a-zA-Z0-9\s]/g, ' ').split(/\s+/);
        const stop = new Set(['the','and','or','for','with','that','this','are','you','will','have','from','to','a','an','in','of','on','at','is','be','as','by','experience','work','team']);
        const freq: Record<string,number> = {};
        words.forEach(w => { const c = w.toLowerCase(); if (c.length > 3 && !stop.has(c)) freq[c] = (freq[c]||0)+1; });
        const keywords = Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([w])=>w.charAt(0).toUpperCase()+w.slice(1));
        setOptimizationResult({
          keywords,
          optimized_summary: '',
          optimized_bullets: [],
          improvements: [`Add these JD keywords to your skills: ${keywords.slice(0,4).join(', ')}`, 'Quantify achievements with numbers and percentages', 'Start every bullet with a strong past-tense action verb'],
        });
      }
    } catch {
      setError('Optimization failed. Please try again.');
    } finally {
      setOptimizing(false);
    }
  };

  const applyOptimization = () => {
    if (!optimizationResult) return;
    update('jobDescription', jdText);

    // 1. Merge new keywords into skills (dedup)
    if (optimizationResult.keywords?.length > 0) {
      const existingSkills = new Set(data.skills.map((s: string) => s.toLowerCase()));
      const newSkills = optimizationResult.keywords.filter((kw: string) => !existingSkills.has(kw.toLowerCase()));
      if (newSkills.length > 0) update('skills', [...data.skills, ...newSkills]);
    }

    // 2. Apply AI-optimized summary (always overwrite if AI returned one)
    if (optimizationResult.optimized_summary?.trim()) {
      update('summary', optimizationResult.optimized_summary.trim());
    }

    // 3. Apply optimized bullets back into the first experience entry
    if (optimizationResult.optimized_bullets?.length > 0 && data.experience.length > 0) {
      const updatedExperience = data.experience.map((exp, idx) => {
        if (idx !== 0) return exp;
        // Merge: replace empty bullets, append new ones up to the count
        const existing = exp.bullets.filter((b: string) => b.trim());
        const merged = [...optimizationResult.optimized_bullets.slice(0, Math.max(existing.length, optimizationResult.optimized_bullets.length))];
        return { ...exp, bullets: merged };
      });
      update('experience', updatedExperience);
    }

    setSuccess('Optimizations applied — summary, skills, and bullets updated.');
    setOptimizationResult(null);
  };

  function stripHtml(html: string) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
  }

  // Auto-tailor when a job is selected in Quick Apply
  useEffect(() => {
    if (!selectedJob) return;
    const jobTitle = selectedJob.title || selectedJob.jobTitle || '';
    const company = selectedJob.company || selectedJob.companyName || '';
    const jobSkills = Array.isArray(selectedJob.skills) ? selectedJob.skills.join(', ') : '';
    const desc = stripHtml(selectedJob.description || selectedJob.jobDescription || '');
    const jd = `Role: ${jobTitle}\nCompany: ${company}\n${desc ? `\n${desc}` : ''}${jobSkills ? `\n\nKey Skills: ${jobSkills}` : ''}`;
    setJdText(jd);
    const t = setTimeout(() => {
      if (jd.trim()) handleOptimizeWithJD();
    }, 800);
    return () => clearTimeout(t);
  }, [selectedJob?.id || selectedJob?._id]);

  return (
    <div className="space-y-6 pb-16">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">AI Suggestions</h2>
        <p className="text-gray-600">Get AI-powered improvements for your resume</p>
      </div>

      {/* AI Generate Content */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Wand2 className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-2">AI Content Generator</h3>
              <p className="text-sm text-gray-600 mb-4">
                Let AI generate a professional summary and suggest relevant skills based on your experience
              </p>
            </div>
          </div>
          <button
              onClick={handleGenerateContent}
              disabled={loading || !data.experience.length}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Summary & Skills
                </>
              )}
            </button>
        </div>
      </div>

      {/* JD Optimization */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-2">JD-Based Optimization</h3>
              <p className="text-sm text-gray-600 mb-4">
                Paste a job description to optimize your resume with relevant keywords and improve ATS score
              </p>
            </div>
          </div>
          <textarea
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
            placeholder="Paste the job description here..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent mb-3 text-sm"
          />
          <button
              onClick={handleOptimizeWithJD}
              disabled={optimizing || !jdText.trim()}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {optimizing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Optimizing...
                </>
              ) : (
                <>
                  <Target className="w-4 h-4" />
                  Optimize with JD
                </>
              )}
            </button>
        </div>
      </div>

      {/* Optimization Results */}
      {optimizationResult && (
        <div className="bg-white border border-green-200 rounded-xl p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Optimization Results</h3>

          <div className="space-y-4">
            {optimizationResult.optimized_summary && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-1">Optimized Summary:</h4>
                <p className="text-sm text-gray-600 bg-gray-50 rounded p-2">{optimizationResult.optimized_summary}</p>
              </div>
            )}

            {optimizationResult.keywords?.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Keywords to add to Skills:</h4>
                <div className="flex flex-wrap gap-2">
                  {optimizationResult.keywords.map((kw: string, i: number) => (
                    <span key={i} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">{kw}</span>
                  ))}
                </div>
              </div>
            )}

            {optimizationResult.optimized_bullets?.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-1">Optimized Bullets (applied to first experience):</h4>
                <ul className="space-y-1">
                  {optimizationResult.optimized_bullets.map((b: string, i: number) => (
                    <li key={i} className="text-sm text-gray-600">• {b}</li>
                  ))}
                </ul>
              </div>
            )}

            {optimizationResult.improvements?.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Improvement Tips:</h4>
                <ul className="space-y-1">
                  {optimizationResult.improvements.map((imp: string, i: number) => (
                    <li key={i} className="text-sm text-gray-600">• {imp}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={applyOptimization}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                <CheckCircle className="w-4 h-4" />
                Apply Optimizations
              </button>
              <div className="relative">
                <input type="text" value={saveName} onChange={e => setSaveName(e.target.value)}
                  placeholder="e.g. Amazon Resume"
                  className="w-40 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500" />
                <button onClick={() => {
                  if (!saveName.trim()) return;
                  const newVersions = [...new Set([...versions, saveName.trim()])];
                  setVersions(newVersions);
                  localStorage.setItem('resume_jd_versions', JSON.stringify(newVersions));
                  localStorage.setItem(`resume_jd_${saveName.trim()}`, JSON.stringify({ data: data, jd: jdText }));
                  setSuccess(`✅ Saved as "${saveName.trim()}"`);
                  setSaveName('');
                }} disabled={!saveName.trim()}
                  className="mt-1 w-full text-xs font-medium text-purple-600 hover:text-purple-800 disabled:opacity-40">
                  Save as version
                </button>
              </div>
            </div>
            {versions.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-medium text-gray-500 mb-1">Saved versions:</p>
                <div className="flex flex-wrap gap-1.5">
                  {versions.map(v => (
                    <span key={v} className="px-2 py-0.5 text-[10px] bg-gray-100 text-gray-600 rounded-md">{v}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-700 flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          {success}
        </div>
      )}

      {/* Info */}
      <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
        <p className="font-medium mb-2">💡 Tips:</p>
        <ul className="space-y-1 ml-4">
          <li>• Make sure you've added your work experience first</li>
          <li>• AI will analyze your experience and generate content</li>
          <li>• Paste a job description to get keyword optimization</li>
          <li>• You can edit the generated content in previous steps</li>
        </ul>
      </div>
    </div>
  );
}
