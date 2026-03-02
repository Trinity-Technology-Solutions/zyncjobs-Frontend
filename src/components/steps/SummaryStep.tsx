import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../config/api';
import { Sparkles, RefreshCw } from 'lucide-react';
import useResumeStore from '../../store/useResumeStore';

const SummaryStep = () => {
  const { resumeData, updateSummary, isGenerating, setIsGenerating, calculateResumeScore } = useResumeStore();
  const [localSummary, setLocalSummary] = useState(resumeData.summary);

  useEffect(() => {
    calculateResumeScore();
  }, [resumeData.summary, calculateResumeScore]);

  const generateAISummary = async () => {
    setIsGenerating(true);
    
    try {
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/generate-summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalInfo: resumeData.personalInfo,
          experience: resumeData.experience,
          skills: resumeData.skills,
          education: resumeData.education
        })
      });

      if (response.ok) {
        const data = await response.json();
        setLocalSummary(data.summary);
        updateSummary(data.summary);
      } else {
        // Fallback summary
        const fallbackSummary = `Experienced professional with expertise in ${resumeData.skills.slice(0, 3).join(', ')}. Proven track record of delivering high-quality results and driving team success through innovative solutions and strong collaboration skills.`;
        setLocalSummary(fallbackSummary);
        updateSummary(fallbackSummary);
      }
    } catch (error) {
      console.error('AI generation failed:', error);
      // Fallback summary
      const fallbackSummary = `Dedicated professional with strong background in ${resumeData.skills.slice(0, 2).join(' and ')}. Committed to excellence and continuous learning with a passion for delivering impactful results.`;
      setLocalSummary(fallbackSummary);
      updateSummary(fallbackSummary);
    }
    
    setIsGenerating(false);
  };

  const handleSummaryChange = (value) => {
    setLocalSummary(value);
    updateSummary(value);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Professional Summary</h2>
        <button
          onClick={generateAISummary}
          disabled={isGenerating}
          className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          {isGenerating ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          <span>{isGenerating ? 'Generating...' : 'Generate AI Summary'}</span>
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Professional Summary
          </label>
          <textarea
            value={localSummary}
            onChange={(e) => handleSummaryChange(e.target.value)}
            rows={6}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="Write a compelling summary that highlights your key achievements, skills, and career objectives..."
          />
          <p className="text-sm text-gray-500 mt-2">
            {localSummary.length}/500 characters
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-green-50 rounded-lg">
            <h4 className="font-medium text-green-800 mb-2">✓ Good Summary Tips</h4>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Highlight key achievements</li>
              <li>• Include relevant skills</li>
              <li>• Keep it concise (2-3 sentences)</li>
              <li>• Use action words</li>
            </ul>
          </div>
          
          <div className="p-4 bg-red-50 rounded-lg">
            <h4 className="font-medium text-red-800 mb-2">✗ Avoid These</h4>
            <ul className="text-sm text-red-700 space-y-1">
              <li>• Generic statements</li>
              <li>• Personal pronouns (I, me, my)</li>
              <li>• Overly long paragraphs</li>
              <li>• Irrelevant information</li>
            </ul>
          </div>
        </div>

        {resumeData.skills.length > 0 && (
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">💡 AI Suggestion</h4>
            <p className="text-sm text-blue-700">
              Based on your skills ({resumeData.skills.slice(0, 3).join(', ')}), 
              consider highlighting your expertise in these areas and any measurable achievements.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SummaryStep;