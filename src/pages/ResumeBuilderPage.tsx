import React, { useState, useRef } from 'react';
import { ArrowLeft, Sparkles, Download, RefreshCw, FileText, Loader2 } from 'lucide-react';
import Header from '../components/Header';
import BackButton from '../components/BackButton';

interface ResumeBuilderPageProps {
  onNavigate?: (page: string) => void;
  user?: any;
  onLogout?: () => void;
}

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const EMPTY_FORM = { name: '', jobTitle: '', skills: '', experience: '', education: '', jobDescription: '' };

const ResumeBuilderPage: React.FC<ResumeBuilderPageProps> = ({ onNavigate, user, onLogout }) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [resume, setResume] = useState('');
  const [loading, setLoading] = useState(false);
  const [improving, setImproving] = useState(false);
  const [error, setError] = useState('');
  const [showImprove, setShowImprove] = useState(false);
  const [jdForImprove, setJdForImprove] = useState('');
  const previewRef = useRef<HTMLDivElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const generate = async () => {
    if (!form.name.trim() || !form.skills.trim() || !form.experience.trim()) {
      setError('Name, Skills, and Experience are required.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/resume-builder/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate');
      setResume(data.resume);
      setShowImprove(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const improve = async () => {
    if (!jdForImprove.trim()) {
      setError('Please paste a job description to improve against.');
      return;
    }
    setError('');
    setImproving(true);
    try {
      const res = await fetch(`${API_BASE}/resume-builder/improve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ existingResume: resume, jobDescription: jdForImprove }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to improve');
      setResume(data.resume);
      setShowImprove(false);
      setJdForImprove('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setImproving(false);
    }
  };

  const downloadTxt = () => {
    const blob = new Blob([resume], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${form.name || 'Resume'}_Resume.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPdf = async () => {
    if (!previewRef.current) return;
    try {
      const [html2canvas, { default: jsPDF }] = await Promise.all([
        import('html2canvas').then(m => m.default),
        import('jspdf'),
      ]);
      const canvas = await html2canvas(previewRef.current, { scale: 2, backgroundColor: '#ffffff' });
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pageW = 210, pageH = 297;
      const imgH = (canvas.height * pageW) / canvas.width;
      let y = 0;
      while (y < imgH) {
        if (y > 0) pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, -y, pageW, imgH);
        y += pageH;
      }
      pdf.save(`${form.name || 'Resume'}_Resume.pdf`);
    } catch {
      downloadTxt();
    }
  };

  // Parse resume text into sections for styled preview
  const parseResume = (text: string) => {
    const sections: { heading: string; content: string }[] = [];
    const lines = text.split('\n');
    let current: { heading: string; content: string } | null = null;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      if (/^(SUMMARY|SKILLS|EXPERIENCE|EDUCATION|PROFILE|OBJECTIVE)$/i.test(trimmed)) {
        if (current) sections.push(current);
        current = { heading: trimmed, content: '' };
      } else {
        if (!current) current = { heading: '', content: '' };
        current.content += (current.content ? '\n' : '') + trimmed;
      }
    }
    if (current) sections.push(current);
    return sections;
  };

  const sections = resume ? parseResume(resume) : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />

      <div className="max-w-7xl mx-auto px-4 py-6">
        <BackButton
          onClick={() => onNavigate?.('resume-studio')}
          text="Back to Resume Studio"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800 mb-6"
        />

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI Resume Builder</h1>
            <p className="text-sm text-gray-500">Fill in your details → AI generates ATS-optimized resume</p>
          </div>
        </div>

        <div className="flex gap-6">
          {/* LEFT — Form */}
          <div className="w-2/5 space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
              <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">Your Details</h2>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Full Name *</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Rajesh Kumar"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Job Title</label>
                <input
                  name="jobTitle"
                  value={form.jobTitle}
                  onChange={handleChange}
                  placeholder="e.g. Software Engineer"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Skills *</label>
                <textarea
                  name="skills"
                  value={form.skills}
                  onChange={handleChange}
                  rows={3}
                  placeholder="e.g. React, Node.js, TypeScript, PostgreSQL, Docker"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Experience *</label>
                <textarea
                  name="experience"
                  value={form.experience}
                  onChange={handleChange}
                  rows={4}
                  placeholder="e.g. 3 years at TCS as React Developer. Built e-commerce platform serving 50k users. Led team of 4 developers."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Education</label>
                <input
                  name="education"
                  value={form.education}
                  onChange={handleChange}
                  placeholder="e.g. B.E Computer Science, Anna University, 2021"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Target Job Description <span className="text-gray-400 font-normal">(optional — improves keyword match)</span>
                </label>
                <textarea
                  name="jobDescription"
                  value={form.jobDescription}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Paste the job description you're applying for..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {error && <p className="text-red-500 text-xs">{error}</p>}

              <button
                onClick={generate}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors"
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : <><Sparkles className="w-4 h-4" /> Generate Resume</>}
              </button>
            </div>

            {/* Improve section */}
            {resume && (
              <div className="bg-white rounded-xl border border-purple-200 p-5 space-y-3">
                <button
                  onClick={() => setShowImprove(v => !v)}
                  className="flex items-center gap-2 text-purple-600 font-semibold text-sm"
                >
                  <RefreshCw className="w-4 h-4" />
                  🔥 AI Improve — Match to Job Description
                </button>
                {showImprove && (
                  <>
                    <textarea
                      value={jdForImprove}
                      onChange={e => setJdForImprove(e.target.value)}
                      rows={4}
                      placeholder="Paste the job description here to improve your resume..."
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    />
                    <button
                      onClick={improve}
                      disabled={improving}
                      className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold py-2 rounded-lg text-sm flex items-center justify-center gap-2"
                    >
                      {improving ? <><Loader2 className="w-4 h-4 animate-spin" /> Improving...</> : <><RefreshCw className="w-4 h-4" /> Improve Resume</>}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* RIGHT — Preview */}
          <div className="flex-1">
            {!resume ? (
              <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 h-full min-h-[500px] flex flex-col items-center justify-center text-gray-400">
                <FileText className="w-12 h-12 mb-3 opacity-30" />
                <p className="font-medium">Your resume will appear here</p>
                <p className="text-sm mt-1">Fill in your details and click Generate</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* Toolbar */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50">
                  <span className="text-sm font-semibold text-gray-700">Resume Preview</span>
                  <div className="flex gap-2">
                    <button
                      onClick={downloadTxt}
                      className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" /> TXT
                    </button>
                    <button
                      onClick={downloadPdf}
                      className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" /> PDF
                    </button>
                  </div>
                </div>

                {/* Styled Resume */}
                <div ref={previewRef} className="p-8 bg-white" style={{ fontFamily: 'Arial, sans-serif' }}>
                  {/* Header */}
                  <div className="border-b-2 border-gray-800 pb-4 mb-5">
                    <h1 className="text-2xl font-bold text-gray-900">{form.name}</h1>
                    {form.jobTitle && <p className="text-blue-600 font-medium mt-0.5">{form.jobTitle}</p>}
                  </div>

                  {/* Sections */}
                  {sections.map((sec, i) => (
                    <div key={i} className="mb-5">
                      {sec.heading && (
                        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 border-b border-gray-200 pb-1 mb-2">
                          {sec.heading}
                        </h2>
                      )}
                      <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                        {sec.content.split('\n').map((line, j) => (
                          <p key={j} className={line.startsWith('•') ? 'ml-2 mb-1' : 'mb-1'}>{line}</p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeBuilderPage;
