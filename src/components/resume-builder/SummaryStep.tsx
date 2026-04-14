import React, { useState } from 'react';
import { Sparkles, Loader2, Lightbulb, Plus, Trash2 } from 'lucide-react';
import { useResumeStore } from '../../store/useResumeStore';
import { resumeBuilderAPI } from '../../services/resumeBuilderAPI';

export default function SummaryStep() {
  const { data, update } = useResumeStore();
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [newPoint, setNewPoint] = useState('');

  // summary stored as array of bullet points; fall back if legacy string
  const points: string[] = Array.isArray(data.summary)
    ? data.summary
    : data.summary
    ? [data.summary]
    : [];

  const setPoints = (pts: string[]) => update('summary', pts as any);

  const addPoint = () => {
    const trimmed = newPoint.trim();
    if (!trimmed) return;
    setPoints([...points, trimmed]);
    setNewPoint('');
  };

  const removePoint = (idx: number) => setPoints(points.filter((_, i) => i !== idx));

  const updatePoint = (idx: number, val: string) =>
    setPoints(points.map((p, i) => (i === idx ? val : p)));

  // Build plain text from points for AI context
  const summaryText = points.join(' ');

  const generateSummary = async () => {
    setLoading(true);
    try {
      const expText = data.experience.length
        ? data.experience.map((e) => `${e.title} at ${e.company} - ${e.bullets.join('. ')}`).join('. ')
        : `${data.personalInfo.name || 'Professional'} seeking new opportunities`;

      let summary = '';
      try {
        const result = await resumeBuilderAPI.generateContent({
          jobTitle: data.experience[0]?.title || data.personalInfo.name || 'Professional',
          experience: expText,
          name: data.personalInfo.name,
        });
        summary = result.summary;
      } catch {
        const title = data.experience[0]?.title || 'Professional';
        const company = data.experience[0]?.company || 'a leading company';
        summary = `Results-driven ${title} with hands-on experience at ${company}. Proven ability to deliver high-quality solutions, collaborate with cross-functional teams, and drive measurable business impact. Passionate about continuous learning and leveraging expertise to exceed organizational goals.`;
      }

      // Split generated summary into bullet points by sentence
      const sentences = summary
        .split(/(?<=[.!?])\s+/)
        .map((s) => s.trim())
        .filter(Boolean);
      setPoints(sentences.length > 1 ? sentences : [summary]);
    } finally {
      setLoading(false);
    }
  };

  const getSuggestions = async () => {
    if (!summaryText.trim() || summaryText.length < 20) {
      alert('Please add at least one summary point first');
      return;
    }
    setLoading(true);
    try {
      let improved: string[] = [];
      try {
        const result = await resumeBuilderAPI.suggestBullets({
          text: summaryText,
          jobTitle: data.experience[0]?.title,
        });
        improved = result.suggestions.map((s) => s.improved);
      } catch {
        const title = data.experience[0]?.title || 'Professional';
        improved = [
          `Accomplished ${title} with a strong track record of delivering results. Committed to excellence and continuous improvement in every project undertaken.`,
          `Dynamic ${title} combining technical expertise with strong leadership skills. Adept at managing priorities and delivering solutions that align with business objectives.`,
        ];
      }
      setSuggestions(improved);
    } finally {
      setLoading(false);
    }
  };

  const exampleSummaries = [
    'Results-driven professional with 5+ years of experience in software development, specializing in full-stack web applications and cloud technologies.',
    'Experienced marketing specialist with proven track record of increasing brand awareness by 40% through data-driven campaigns and strategic partnerships.',
    'Dedicated customer service professional with 3+ years of experience resolving complex issues and maintaining 95% customer satisfaction rating.',
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Professional Summary</h2>
        <p className="text-gray-600">Add multiple bullet points to build your professional summary</p>
      </div>

      {/* AI Buttons */}
      <div className="flex gap-2">
        <button
          onClick={generateSummary}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" />Generating...</>
          ) : (
            <><Sparkles className="w-4 h-4" />Write with AI</>
          )}
        </button>

        {points.length > 0 && (
          <button
            onClick={getSuggestions}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 border border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Lightbulb className="w-4 h-4" />
            Improve
          </button>
        )}
      </div>

      {/* Bullet Points List */}
      {points.length > 0 && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Summary Points</label>
          {points.map((pt, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <span className="mt-3 text-gray-400 text-sm font-bold">•</span>
              <textarea
                value={pt}
                onChange={(e) => updatePoint(idx, e.target.value)}
                rows={2}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
              <button
                onClick={() => removePoint(idx)}
                className="mt-2 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Remove point"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add New Point */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {points.length === 0 ? 'Your Summary' : 'Add Another Point'}
        </label>
        <div className="flex gap-2">
          <textarea
            value={newPoint}
            onChange={(e) => setNewPoint(e.target.value)}
            rows={3}
            placeholder="Write a summary point and click Add, or use Write with AI..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addPoint(); }
            }}
          />
          <button
            onClick={addPoint}
            disabled={!newPoint.trim()}
            className="self-end flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {points.length} point{points.length !== 1 ? 's' : ''} • Press Enter or click Add
        </p>
      </div>

      {/* AI Suggestions */}
      {suggestions.length > 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <h3 className="font-semibold text-gray-900">AI Suggestions</h3>
          </div>
          <div className="space-y-2">
            {suggestions.map((sug, i) => (
              <div key={i} className="bg-white p-3 rounded-lg border border-purple-100">
                <p className="text-sm text-gray-800 mb-2">{sug}</p>
                <button
                  onClick={() => {
                    setPoints([...points, sug]);
                    setSuggestions([]);
                  }}
                  className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                >
                  + Add this point
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Example Summaries */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">💡 Example Points</h3>
        <div className="space-y-2">
          {exampleSummaries.map((example, i) => (
            <div key={i} className="bg-white p-3 rounded border border-gray-200">
              <p className="text-sm text-gray-700 mb-2">{example}</p>
              <button
                onClick={() => setPoints([...points, example])}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                + Add as point
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Tips */}
      <div className="bg-blue-50 rounded-lg p-4 text-sm text-gray-700">
        <p className="font-medium mb-2">✍️ Writing Tips:</p>
        <ul className="space-y-1 ml-4">
          <li>• Start with your job title and years of experience</li>
          <li>• Each point should highlight one key strength or achievement</li>
          <li>• Use action verbs and quantify results when possible</li>
          <li>• Aim for 2–4 concise bullet points</li>
        </ul>
      </div>
    </div>
  );
}
