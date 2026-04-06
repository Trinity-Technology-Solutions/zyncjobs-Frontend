import React, { useState } from 'react';
import { Sparkles, Loader2, Wand2, CheckCircle, Target } from 'lucide-react';
import { useResumeStore } from '../../store/useResumeStore';
import { resumeBuilderAPI } from '../../services/resumeBuilderAPI';

export default function AISuggestionsStep() {
  const { data, update } = useResumeStore();
  const [loading, setLoading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [jdText, setJdText] = useState(data.jobDescription || '');
  const [optimizationResult, setOptimizationResult] = useState<any>(null);

  // AI Generate Content (summary, bullets, skills)
  const handleGenerateContent = async () => {
    if (!data.experience.length) {
      setError('Please add at least one work experience first');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const expText = data.experience
        .map((e) => `${e.title} at ${e.company} - ${e.bullets.join('. ')}`)
        .join('. ');

      const result = await resumeBuilderAPI.generateContent({
        jobTitle: data.experience[0]?.title || 'Professional',
        experience: expText,
        name: data.personalInfo.name,
      });

      update('summary', result.summary);
      update('skills', [...new Set([...data.skills, ...result.skills])]);
      setSuccess('✅ AI generated summary and skills!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // JD-Based Optimization
  const handleOptimizeWithJD = async () => {
    if (!jdText.trim()) {
      setError('Please paste a job description first');
      return;
    }

    if (!data.summary && !data.skills.length && !data.experience.length) {
      setError('Please add some resume content first');
      return;
    }

    setOptimizing(true);
    setError('');
    setSuccess('');

    try {
      const bullets = data.experience.flatMap((e) => e.bullets.filter((b) => b.trim()));

      const result = await resumeBuilderAPI.optimizeWithJD({
        resumeData: {
          summary: data.summary,
          bullets,
          skills: data.skills,
        },
        jobDescription: jdText,
      });

      setOptimizationResult(result);
      setSuccess(`✅ Optimized! ATS Score: ${result.atsScore}%`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setOptimizing(false);
    }
  };

  const applyOptimization = () => {
    if (!optimizationResult) return;
    update('summary', optimizationResult.summary);
    update('skills', optimizationResult.skills);
    update('jobDescription', jdText);
    setSuccess('✅ Applied optimizations to your resume!');
    setOptimizationResult(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">AI Suggestions</h2>
        <p className="text-gray-600">Get AI-powered improvements for your resume</p>
      </div>

      {/* AI Generate Content */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Wand2 className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-2">AI Content Generator</h3>
            <p className="text-sm text-gray-600 mb-4">
              Let AI generate a professional summary and suggest relevant skills based on your experience
            </p>
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
      </div>

      {/* JD Optimization */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Target className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-2">🔥 JD-Based Optimization</h3>
            <p className="text-sm text-gray-600 mb-4">
              Paste a job description to optimize your resume with relevant keywords and improve ATS score
            </p>
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
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
      </div>

      {/* Optimization Results */}
      {optimizationResult && (
        <div className="bg-white border border-green-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Optimization Results</h3>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-green-600">{optimizationResult.atsScore}%</span>
              <span className="text-sm text-gray-500">ATS Score</span>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">🎯 Extracted Keywords:</h4>
              <div className="flex flex-wrap gap-2">
                {optimizationResult.keywords.map((kw: string, i: number) => (
                  <span key={i} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                    {kw}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">💡 Improvements:</h4>
              <ul className="space-y-1">
                {optimizationResult.improvements.map((imp: string, i: number) => (
                  <li key={i} className="text-sm text-gray-600">
                    • {imp}
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={applyOptimization}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              Apply Optimizations
            </button>
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
