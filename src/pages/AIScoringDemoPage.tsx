import React, { useState } from 'react';
import { API_ENDPOINTS } from '../config/api';

interface AIScoringDemoPageProps {
  onNavigate: (page: string) => void;
}

const AIScoringDemoPage: React.FC<AIScoringDemoPageProps> = ({ onNavigate }) => {
  const [jobDescription, setJobDescription] = useState('');
  const [candidateResume, setCandidateResume] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const sampleJobDescription = `Senior Full Stack Developer - React & Node.js

We are looking for an experienced Full Stack Developer to join our growing team.

Required Skills:
- React.js, TypeScript, JavaScript
- Node.js, Express.js
- MongoDB, PostgreSQL
- AWS, Docker
- Git, CI/CD

Experience: 3-5 years
Education: Bachelor's degree in Computer Science or related field

Responsibilities:
- Develop and maintain web applications
- Collaborate with cross-functional teams
- Write clean, maintainable code
- Participate in code reviews
- Implement best practices`;

  const sampleResume = `John Smith
Senior Software Engineer

Contact:
john.smith@email.com
+1-555-0123
San Francisco, CA

Skills:
React, JavaScript, TypeScript, Node.js, Express, MongoDB, AWS, Docker, Git, Python, Java

Experience:
Senior Software Engineer at TechCorp (2021-2024)
- Built scalable web applications using React and Node.js
- Managed AWS infrastructure and deployment pipelines
- Led team of 3 junior developers
- Implemented CI/CD processes

Software Engineer at StartupXYZ (2019-2021)
- Developed full-stack applications
- Worked with MongoDB and PostgreSQL
- Collaborated in agile environment

Education:
Bachelor of Science in Computer Science
University of California, Berkeley (2019)

Projects:
- E-commerce platform with React/Node.js
- Real-time chat application
- Machine learning recommendation system`;

  const handleScoring = async () => {
    if (!jobDescription.trim() || !candidateResume.trim()) {
      alert('Please provide both job description and candidate resume');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/ai-flow/score-candidate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobDescription,
          candidateResume,
          jobId: 'demo-job-1',
          candidateId: 'demo-candidate-1'
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Scoring error:', error);
      alert('Failed to score candidate. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation?.toLowerCase()) {
      case 'hire': return 'bg-green-100 text-green-800';
      case 'interview': return 'bg-yellow-100 text-yellow-800';
      case 'reject': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <button
            onClick={() => onNavigate('admin-dashboard')}
            className="text-blue-600 hover:text-blue-800 mb-4"
          >
            ← Back to Admin Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">AI Scoring Flow Demo</h1>
          <p className="text-gray-600 mt-2">
            Test the AI-powered candidate scoring system using Mistral AI
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Job Description</h2>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Enter job description with requirements, skills, and responsibilities..."
                className="w-full h-64 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={() => setJobDescription(sampleJobDescription)}
                className="mt-2 text-sm text-blue-600 hover:text-blue-800"
              >
                Use Sample Job Description
              </button>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Candidate Resume</h2>
              <textarea
                value={candidateResume}
                onChange={(e) => setCandidateResume(e.target.value)}
                placeholder="Enter candidate resume with skills, experience, and education..."
                className="w-full h-64 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={() => setCandidateResume(sampleResume)}
                className="mt-2 text-sm text-blue-600 hover:text-blue-800"
              >
                Use Sample Resume
              </button>
            </div>

            <button
              onClick={handleScoring}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Analyzing with AI...' : 'Score Candidate'}
            </button>
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            {result && (
              <>
                {/* Overall Score */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold mb-4">Overall Score</h2>
                  <div className="text-center">
                    <div className={`text-6xl font-bold ${getScoreColor(result.overallScore)}`}>
                      {result.overallScore}%
                    </div>
                    <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-2 ${getRecommendationColor(result.recommendation)}`}>
                      {result.recommendation?.toUpperCase()}
                    </div>
                  </div>
                </div>

                {/* Score Breakdown */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold mb-4">Score Breakdown</h2>
                  <div className="space-y-3">
                    {Object.entries(result.breakdown || {}).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center">
                        <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${value}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium w-12">{value as number}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Skills Analysis */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold mb-4">Skills Analysis</h2>
                  
                  {result.matchingSkills?.length > 0 && (
                    <div className="mb-4">
                      <h3 className="font-medium text-green-800 mb-2">✅ Matching Skills</h3>
                      <div className="flex flex-wrap gap-2">
                        {result.matchingSkills.map((skill: string, index: number) => (
                          <span key={index} className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.missingSkills?.length > 0 && (
                    <div>
                      <h3 className="font-medium text-red-800 mb-2">❌ Missing Skills</h3>
                      <div className="flex flex-wrap gap-2">
                        {result.missingSkills.map((skill: string, index: number) => (
                          <span key={index} className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* AI Summary */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold mb-4">AI Summary</h2>
                  <p className="text-gray-700">{result.aiSummary}</p>
                </div>

                {/* Risk Factors */}
                {result.riskFactors?.length > 0 && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4">Risk Factors</h2>
                    <ul className="space-y-2">
                      {result.riskFactors.map((risk: string, index: number) => (
                        <li key={index} className="flex items-start space-x-2">
                          <span className="text-yellow-500 mt-1">⚠️</span>
                          <span className="text-gray-700">{risk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Strengths & Improvements */}
                {(result.strengths?.length > 0 || result.improvements?.length > 0) && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4">Additional Insights</h2>
                    
                    {result.strengths?.length > 0 && (
                      <div className="mb-4">
                        <h3 className="font-medium text-green-800 mb-2">💪 Strengths</h3>
                        <ul className="space-y-1">
                          {result.strengths.map((strength: string, index: number) => (
                            <li key={index} className="text-gray-700">• {strength}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {result.improvements?.length > 0 && (
                      <div>
                        <h3 className="font-medium text-blue-800 mb-2">🎯 Areas for Improvement</h3>
                        <ul className="space-y-1">
                          {result.improvements.map((improvement: string, index: number) => (
                            <li key={index} className="text-gray-700">• {improvement}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {!result && (
              <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                <div className="text-4xl mb-4">🤖</div>
                <p>Enter job description and candidate resume, then click "Score Candidate" to see AI analysis results.</p>
              </div>
            )}
          </div>
        </div>

        {/* How It Works */}
        <div className="mt-12 bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold mb-6">How AI Scoring Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <h3 className="font-medium mb-2">Job Analysis</h3>
              <p className="text-sm text-gray-600">AI extracts required skills, experience, and responsibilities</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 font-bold">2</span>
              </div>
              <h3 className="font-medium mb-2">Resume Parsing</h3>
              <p className="text-sm text-gray-600">AI extracts candidate skills, experience, and achievements</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 font-bold">3</span>
              </div>
              <h3 className="font-medium mb-2">AI Comparison</h3>
              <p className="text-sm text-gray-600">System compares candidate data with job requirements</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 font-bold">4</span>
              </div>
              <h3 className="font-medium mb-2">Scoring Algorithm</h3>
              <p className="text-sm text-gray-600">AI generates weighted scores for different criteria</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 font-bold">5</span>
              </div>
              <h3 className="font-medium mb-2">Final Report</h3>
              <p className="text-sm text-gray-600">Comprehensive analysis with recommendations</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIScoringDemoPage;