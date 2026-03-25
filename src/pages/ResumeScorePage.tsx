import React, { useState, useRef } from 'react';
import { Upload, CheckCircle, XCircle, AlertCircle, ArrowLeft, Loader, BarChart2 } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

interface ScoreResult {
  overallScore: number;
  atsScore: number;
  sections: Record<string, number>;
  keywordMatch: number | null;
  strengths: string[];
  improvements: { issue: string; fix: string }[];
  missingKeywords: string[];
  verdict: string;
}

const ScoreCircle = ({ score, label, size = 'lg' }: { score: number; label: string; size?: 'lg' | 'sm' }) => {
  const color = score >= 75 ? 'text-green-600' : score >= 50 ? 'text-yellow-500' : 'text-red-500';
  const ring = score >= 75 ? 'border-green-400' : score >= 50 ? 'border-yellow-400' : 'border-red-400';
  const bg = score >= 75 ? 'bg-green-50' : score >= 50 ? 'bg-yellow-50' : 'bg-red-50';
  const dim = size === 'lg' ? 'w-24 h-24 text-3xl' : 'w-14 h-14 text-lg';
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`${dim} ${bg} ${ring} border-4 rounded-full flex items-center justify-center font-bold ${color}`}>
        {score}
      </div>
      <p className="text-xs text-gray-500 text-center">{label}</p>
    </div>
  );
};

export default function ResumeScorePage({ onNavigate, user, onLogout }: { onNavigate: (p: string) => void; user?: any; onLogout?: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [inputMode, setInputMode] = useState<'file' | 'text'>('file');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const analyze = async () => {
    setError(''); setResult(null); setLoading(true);
    try {
      let res;
      if (inputMode === 'file' && file) {
        const form = new FormData();
        form.append('resume', file);
        if (jobDescription) form.append('jobDescription', jobDescription);
        res = await fetch(`${API_BASE}/resume-score/upload`, { method: 'POST', body: form });
      } else {
        res = await fetch(`${API_BASE}/resume-score/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resumeText, jobDescription })
        });
      }
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Analysis failed');
      setResult(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const canAnalyze = inputMode === 'file' ? !!file : resumeText.trim().length >= 50;

  return (
    <>
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />
      <div className="min-h-screen bg-gray-50">
        <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white px-4 py-5">
          <div className="max-w-4xl mx-auto">
            <button onClick={() => onNavigate('resume-studio')} className="inline-flex items-center text-green-200 hover:text-white text-sm mb-2">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to Resume Studio
            </button>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Resume Score Analyzer</h1>
                <p className="text-green-200 text-sm mt-0.5">AI-powered ATS score + actionable feedback</p>
              </div>
              <BarChart2 className="w-9 h-9 text-green-200 opacity-80" />
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
          {/* Input Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            {/* Mode Toggle */}
            <div className="flex gap-2 mb-4">
              {(['file', 'text'] as const).map(m => (
                <button key={m} onClick={() => setInputMode(m)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${inputMode === m ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {m === 'file' ? 'Upload File' : 'Paste Text'}
                </button>
              ))}
            </div>

            {inputMode === 'file' ? (
              <div
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${file ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-green-400 hover:bg-gray-50'}`}
              >
                <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" className="hidden"
                  onChange={e => setFile(e.target.files?.[0] || null)} />
                <Upload className={`w-8 h-8 mx-auto mb-2 ${file ? 'text-green-600' : 'text-gray-400'}`} />
                {file ? (
                  <p className="text-green-700 font-medium">{file.name}</p>
                ) : (
                  <>
                    <p className="text-gray-600 font-medium">Drop your resume here or click to browse</p>
                    <p className="text-gray-400 text-sm mt-1">PDF, DOC, DOCX — max 5MB</p>
                  </>
                )}
              </div>
            ) : (
              <textarea
                value={resumeText}
                onChange={e => setResumeText(e.target.value)}
                placeholder="Paste your resume text here..."
                className="w-full border border-gray-200 rounded-lg p-3 text-sm h-40 focus:ring-2 focus:ring-green-500 focus:outline-none resize-none"
              />
            )}

            {/* Optional JD */}
            <div className="mt-4">
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Job Description <span className="text-gray-400 font-normal">(optional — for keyword match score)</span>
              </label>
              <textarea
                value={jobDescription}
                onChange={e => setJobDescription(e.target.value)}
                placeholder="Paste the job description to get keyword match %..."
                className="w-full border border-gray-200 rounded-lg p-3 text-sm h-24 focus:ring-2 focus:ring-green-500 focus:outline-none resize-none"
              />
            </div>

            <button
              onClick={analyze}
              disabled={!canAnalyze || loading}
              className="mt-4 w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? <><Loader className="w-4 h-4 animate-spin" /> Analyzing...</> : 'Analyze Resume'}
            </button>

            {error && <p className="mt-3 text-sm text-red-600 text-center">{error}</p>}
          </div>

          {/* Results */}
          {result && (
            <div className="space-y-4">
              {/* Score Overview */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4">Score Overview</h2>
                <div className="flex flex-wrap gap-6 justify-center mb-4">
                  <ScoreCircle score={result.overallScore} label="Overall Score" />
                  <ScoreCircle score={result.atsScore} label="ATS Score" />
                  {result.keywordMatch !== null && <ScoreCircle score={result.keywordMatch} label="Keyword Match" />}
                </div>
                <p className="text-center text-gray-600 text-sm italic">"{result.verdict}"</p>
              </div>

              {/* Section Scores */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h2 className="text-base font-bold text-gray-800 mb-3">Section Breakdown</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Object.entries(result.sections).map(([key, val]) => (
                    <div key={key} className="flex flex-col gap-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                        <span className="font-medium">{val}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className={`h-2 rounded-full ${val >= 75 ? 'bg-green-500' : val >= 50 ? 'bg-yellow-400' : 'bg-red-400'}`}
                          style={{ width: `${val}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Strengths + Improvements */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border border-green-200 p-5">
                  <h2 className="text-base font-bold text-green-700 mb-3 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" /> Strengths
                  </h2>
                  <ul className="space-y-2">
                    {result.strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-green-500 mt-0.5">✓</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white rounded-xl border border-orange-200 p-5">
                  <h2 className="text-base font-bold text-orange-600 mb-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" /> Improvements
                  </h2>
                  <ul className="space-y-3">
                    {result.improvements.map((item, i) => (
                      <li key={i} className="text-sm">
                        <p className="font-medium text-gray-800">{item.issue}</p>
                        <p className="text-gray-500 mt-0.5">{item.fix}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Missing Keywords */}
              {result.missingKeywords?.length > 0 && (
                <div className="bg-white rounded-xl border border-red-200 p-5">
                  <h2 className="text-base font-bold text-red-600 mb-3 flex items-center gap-2">
                    <XCircle className="w-4 h-4" /> Missing Keywords
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {result.missingKeywords.map(k => (
                      <span key={k} className="bg-red-50 border border-red-200 text-red-700 px-3 py-1 rounded-full text-sm">{k}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                <button onClick={() => onNavigate('resume-templates')}
                  className="bg-green-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-green-700">
                  Improve Resume →
                </button>
                <button onClick={() => { setResult(null); setFile(null); setResumeText(''); }}
                  className="border border-gray-300 text-gray-600 px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
                  Analyze Another
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer onNavigate={onNavigate} />
    </>
  );
}
