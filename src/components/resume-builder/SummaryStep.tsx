import React, { useState } from 'react';
import { Sparkles, Loader2, Lightbulb } from 'lucide-react';
import { useResumeStore } from '../../store/useResumeStore';
import { resumeBuilderAPI } from '../../services/resumeBuilderAPI';

export default function SummaryStep() {
  const { data, update } = useResumeStore();
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Generate AI summary
  const generateSummary = async () => {
    if (!data.experience.length) {
      alert('Please add at least one work experience first');
      return;
    }

    setLoading(true);
    try {
      const expText = data.experience
        .map((e) => `${e.title} at ${e.company} - ${e.bullets.join('. ')}`)
        .join('. ');

      let summary = '';
      try {
        const result = await resumeBuilderAPI.generateContent({
          jobTitle: data.experience[0]?.title || 'Professional',
          experience: expText,
          name: data.personalInfo.name,
        });
        summary = result.summary;
      } catch {
        // Local fallback
        const title = data.experience[0]?.title || 'Professional';
        const company = data.experience[0]?.company || 'a leading company';
        summary = `Results-driven ${title} with hands-on experience at ${company}. Proven ability to deliver high-quality solutions, collaborate with cross-functional teams, and drive measurable business impact. Passionate about continuous learning and leveraging expertise to exceed organizational goals.`;
      }

      update('summary', summary);
    } finally {
      setLoading(false);
    }
  };

  // Get AI suggestions for current summary
  const getSuggestions = async () => {
    if (!data.summary.trim() || data.summary.length < 20) {
      alert('Please write at least 20 characters first');
      return;
    }

    setLoading(true);
    try {
      let improved: string[] = [];
      try {
        const result = await resumeBuilderAPI.suggestBullets({
          text: data.summary,
          jobTitle: data.experience[0]?.title,
        });
        improved = result.suggestions.map((s) => s.improved);
      } catch {
        // Local fallback
        const title = data.experience[0]?.title || 'Professional';
        improved = [
          `Accomplished ${title} with a strong track record of delivering results. ${data.summary.trim()} Committed to excellence and continuous improvement in every project undertaken.`,
          `Dynamic ${title} combining technical expertise with strong leadership skills. ${data.summary.trim()} Adept at managing priorities and delivering solutions that align with business objectives.`,
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
        <p className="text-gray-600">Write a brief overview of your professional background</p>
      </div>

      {/* AI Generate Button */}
      <div className="flex gap-2">
        <button
          onClick={generateSummary}
          disabled={loading || !data.experience.length}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Write with AI
            </>
          )}
        </button>

        {data.summary && (
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

      {/* Summary Textarea */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Your Summary</label>
        <textarea
          value={data.summary}
          onChange={(e) => update('summary', e.target.value)}
          rows={5}
          placeholder="Write a compelling summary that highlights your key strengths and achievements..."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
        <p className="text-xs text-gray-500 mt-1">
          {data.summary.length} characters • Aim for 100-200 characters
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
                    update('summary', sug);
                    setSuggestions([]);
                  }}
                  className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                >
                  Use this
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Example Summaries */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">💡 Example Summaries</h3>
        <div className="space-y-2">
          {exampleSummaries.map((example, i) => (
            <div key={i} className="bg-white p-3 rounded border border-gray-200">
              <p className="text-sm text-gray-700 mb-2">{example}</p>
              <button
                onClick={() => update('summary', example)}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Use as template
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
          <li>• Highlight 2-3 key achievements or skills</li>
          <li>• Use action verbs and quantify results when possible</li>
          <li>• Keep it concise - 2-3 sentences is ideal</li>
        </ul>
      </div>
    </div>
  );
}
