import { useState, useRef } from 'react';
import { Upload, CheckCircle, XCircle, AlertCircle, Loader, BarChart3, Target, TrendingUp, Award } from 'lucide-react';
import BackButton from '../components/BackButton';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { resumeIntelligenceEngine, ResumeAnalysis } from '../services/resumeIntelligenceEngine';
import { resumeAIService, ATSResult } from '../services/resumeAIService';
import { comprehensiveAnalyticsSystem } from '../services/comprehensiveAnalyticsSystem';
import { readPdf } from '../lib/parse-resume-from-pdf/read-pdf';
import mammoth from 'mammoth';

type ScoreResult = ResumeAnalysis;

const DonutChart = ({ score, label, size = 'lg' }: { score: number; label: string; size?: 'lg' | 'sm' }) => {
  const rounded = Math.min(100, Math.max(0, Math.round(score)));
  const color = rounded >= 75 ? '#22c55e' : rounded >= 50 ? '#eab308' : '#ef4444';
  const textColor = rounded >= 75 ? 'text-green-600' : rounded >= 50 ? 'text-yellow-500' : 'text-red-500';
  const dim = size === 'lg' ? 80 : 56;
  const strokeW = size === 'lg' ? 6 : 5;
  const r = (dim - strokeW) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (circ * rounded) / 100;
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: dim, height: dim }}>
        <svg width={dim} height={dim} viewBox={`0 0 ${dim} ${dim}`} className="-rotate-90">
          <circle cx={dim / 2} cy={dim / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={strokeW} />
          <circle cx={dim / 2} cy={dim / 2} r={r} fill="none" stroke={color}
            strokeWidth={strokeW} strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-lg font-bold">
          <span className={textColor}>{rounded}%</span>
        </span>
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
  const [aiResult, setAiResult] = useState<ATSResult | null>(null);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const analyze = async () => {
    setError(''); setResult(null); setLoading(true);
    
    // Track analytics event
    const userId = user?.id || 'anonymous';
    comprehensiveAnalyticsSystem.trackEvent(userId, 'resume_generate', {
      inputMode,
      hasJobDescription: !!jobDescription,
      resumeLength: inputMode === 'text' ? resumeText.length : file?.size || 0
    });
    
    try {
      let resumeContent: string;
      
      if (inputMode === 'file' && file) {
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (ext === 'pdf') {
          const objectUrl = URL.createObjectURL(file);
          try {
            const textItems = await readPdf(objectUrl);
            resumeContent = textItems.map(item => item.text).join(' ');
          } finally {
            URL.revokeObjectURL(objectUrl);
          }
        } else if (ext === 'docx' || ext === 'doc') {
          const arrayBuffer = await file.arrayBuffer();
          const result = await mammoth.extractRawText({ arrayBuffer });
          resumeContent = result.value;
        } else {
          throw new Error('Unsupported file type. Please upload a PDF or DOCX file.');
        }
        if (!resumeContent.trim()) {
          throw new Error('Could not extract text from this file. Try pasting the text directly.');
        }
      } else {
        resumeContent = resumeText;
      }
      
      // Use hybrid backend ATS Score v2 (Rule 70% + AI 30%), fallback to local engine
      const parsedContent = resumeIntelligenceEngine.parseResumeContent(resumeContent);
      let finalResult = resumeIntelligenceEngine.analyzeResume(parsedContent, jobDescription);
      try {
        const hybrid = await resumeAIService.atsScoreV2(resumeContent, jobDescription);
        setAiResult(hybrid);
        finalResult = {
          ...finalResult,
          overallScore: hybrid.score,
          atsScore: hybrid.score,
          keywordMatch: hybrid.rule_score,
          missingKeywords: hybrid.missing_keywords,
          strengths: hybrid.suggestions.length > 0 ? hybrid.suggestions.slice(0, 3) : finalResult.strengths,
          improvements: [
            ...(hybrid.suggestions.slice(0, 3).map(s => ({ issue: s, fix: s, priority: 'medium' as const }))),
            ...finalResult.improvements.slice(0, 3),
          ].slice(0, 5),
          recommendations: [...hybrid.keyword_optimization.slice(0, 3), ...finalResult.recommendations.slice(0, 3)],
          verdict: hybrid.reason || finalResult.verdict,
        };
      } catch {
        setAiResult(null);
      }
      setResult(finalResult);

      // Track successful analysis
      comprehensiveAnalyticsSystem.trackEvent(userId, 'feature_usage', {
        feature: 'resume_analysis',
        score: finalResult.overallScore,
        hasJobDescription: !!jobDescription
      });
      
    } catch (e: any) {
      setError(e.message || 'Analysis failed. Please try again.');
      
      // Track error
      comprehensiveAnalyticsSystem.trackEvent(userId, 'feature_usage', {
        feature: 'resume_analysis',
        error: e.message,
        inputMode
      });
    } finally {
      setLoading(false);
    }
  };

  const canAnalyze = inputMode === 'file' ? !!file : resumeText.trim().length >= 50;

  return (
    <>
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #0f9d58, #16a34a, #059669)', padding: '36px 40px 36px', borderRadius: '0 0 16px 16px' }}>
          <div className="max-w-4xl mx-auto">
            <BackButton fallback="/resume-studio" className="mb-4" />
            {/* Glass card */}
            <div style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)', borderRadius: '12px', padding: '20px 24px' }}>
              <div className="flex items-center justify-between">
                {/* Left: accent + text */}
                <div className="flex items-center gap-3">
                  <div style={{ width: '4px', height: '44px', background: '#22c55e', borderRadius: '4px', flexShrink: 0 }} />
                  <div>
                    <h1 style={{ fontSize: '32px', fontWeight: 700, letterSpacing: '-0.5px', color: '#ffffff', margin: 0, animation: 'fadeUp 0.6s ease' }}>
                      Resume Score Analyzer
                    </h1>
                    <p style={{ fontSize: '15px', fontWeight: 400, color: '#d1fae5', marginTop: '6px', marginBottom: 0 }}>
                      AI-powered ATS score + actionable feedback
                    </p>
                  </div>
                </div>
                {/* Right: icon */}
                <BarChart3 size={32} color="#bbf7d0" style={{ opacity: 0.9, flexShrink: 0 }} />
              </div>
            </div>
          </div>
        </div>
        <style>{`
          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(10px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        `}</style>

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
                <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp" className="hidden"
                  onChange={e => setFile(e.target.files?.[0] || null)} />
                <Upload className={`w-8 h-8 mx-auto mb-2 ${file ? 'text-green-600' : 'text-gray-400'}`} />
                {file ? (
                  <p className="text-green-700 font-medium">{file.name}</p>
                ) : (
                  <>
                    <p className="text-gray-600 font-medium">Drop your resume here or click to browse</p>
                    <p className="text-gray-400 text-sm mt-1">PDF, DOC, DOCX, JPG, JPEG, PNG, WEBP — max 5MB</p>
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
                  <DonutChart score={result.overallScore} label="Overall Score" />
                  <DonutChart score={result.atsScore} label="ATS Score" />
                  {result.keywordMatch !== null && <DonutChart score={result.keywordMatch} label="Keyword Match" />}
                  {aiResult && (
                    <>
                      <DonutChart score={aiResult.experience_relevance} label="Exp. Relevance" />
                      <DonutChart score={aiResult.formatting_score} label="Formatting" />
                    </>
                  )}
                </div>
                <p className="text-center text-gray-600 text-sm italic">"{result.verdict}"</p>
              </div>

              {/* Section Scores */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h2 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4 text-blue-600" />
                  Section Breakdown
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Object.entries(result.sections).map(([key, val]) => (
                    <div key={key} className="flex flex-col gap-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                        <span className="font-medium">{Math.round(val as number)}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className={`h-2 rounded-full ${(val as number) >= 75 ? 'bg-green-500' : (val as number) >= 50 ? 'bg-yellow-400' : 'bg-red-400'}`}
                          style={{ width: `${Math.round(val as number)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* ATS Compatibility Check */}
              <div className="bg-white rounded-xl border border-blue-200 p-5">
                <h2 className="text-base font-bold text-blue-700 mb-3 flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  ATS Compatibility
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Object.entries(result.atsCompatibility).map(([key, passed]) => (
                    <div key={key} className={`flex items-center gap-2 p-2 rounded-lg ${passed ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                      {passed ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      <span className="text-sm capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
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
                        <CheckCircle className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" /> {s}
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
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`w-2 h-2 rounded-full ${
                            item.priority === 'high' ? 'bg-red-500' : 
                            item.priority === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                          }`} />
                          <p className="font-medium text-gray-800">{item.issue}</p>
                        </div>
                        <p className="text-gray-500 ml-4">{item.fix}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              {/* AI Recommendations */}
              {result.recommendations && result.recommendations.length > 0 && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200 p-5">
                  <h2 className="text-base font-bold text-blue-700 mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" /> AI Recommendations
                  </h2>
                  <ul className="space-y-2">
                    {result.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-blue-800">
                        <TrendingUp className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

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

              {/* Matched Keywords */}
              {aiResult && (aiResult.matched_keywords?.length ?? 0) > 0 && (
                <div className="bg-white rounded-xl border border-green-200 p-5">
                  <h2 className="text-base font-bold text-green-600 mb-3 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" /> Matched Keywords
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {aiResult.matched_keywords!.map(k => (
                      <span key={k} className="bg-green-50 border border-green-200 text-green-700 px-3 py-1 rounded-full text-sm font-medium">{k}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                <button onClick={() => onNavigate('resume-builder')}
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
