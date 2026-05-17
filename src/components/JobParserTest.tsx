import React, { useState } from 'react';
import { JobParser } from '../utils/jobParser';

const JobParserTest: React.FC = () => {
  const [testInput, setTestInput] = useState(`Trinity Technology Solutions - GCP BigQuery Data Engineer

Job Title: GCP BigQuery Data Engineer
Company: Trinity Technology Solutions
Work Location: Hyderabad
Experience Required: 5-8 years

Key Responsibilities:
• Design and implement data pipelines using BigQuery
• Develop ETL processes for large-scale data processing
• Collaborate with cross-functional teams

Required Skills:
• BigQuery
• Kafka
• Python
• Apache Beam
• SQL

Nice to Have:
• GCP Dataflow
• Terraform
• Docker

Interview Process:
• Weekend Hiring Drive
• Interview Mode: Face-to-Face`);

  const [result, setResult] = useState<any>(null);

  const handleTest = () => {
    const parsed = JobParser.parseJobDescription(testInput);
    setResult(parsed);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-xl font-semibold mb-4">🚀 Job Parser Test</h2>
        
        <div className="space-y-4">
          <textarea
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
            className="w-full h-64 p-3 border rounded-lg text-sm"
            placeholder="Paste job description here..."
          />
          
          <button
            onClick={handleTest}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Test Parser
          </button>
        </div>
      </div>

      {result && (
        <>
          {/* Confidence Dashboard */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4">📊 Confidence Scores</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {Object.entries(result.confidence).map(([field, confidence]: [string, any]) => (
                <div key={field} className="text-center">
                  <div className="text-sm font-medium capitalize">{field}</div>
                  <div className={`text-lg font-bold ${getConfidenceColor(confidence)}`}>
                    {Math.round(confidence * 100)}%
                  </div>
                </div>
              ))}
            </div>

            {/* Warnings */}
            {result.confidence.company < 0.7 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-2">
                ⚠️ Please verify company name
              </div>
            )}
            {result.confidence.skills < 0.6 && (
              <div className="bg-red-50 border border-red-200 rounded p-3 mb-2">
                ❌ Please review extracted skills
              </div>
            )}
          </div>

          {/* Results */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4">📋 Parsed Results</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">Basic Info</h4>
                <div className="space-y-2 text-sm">
                  <div><strong>Company:</strong> {result.company || 'Not found'}</div>
                  <div><strong>Title:</strong> {result.title}</div>
                  <div><strong>Location:</strong> {result.location || 'Not specified'}</div>
                  <div><strong>Experience:</strong> {result.experience || 'Not specified'}</div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-3">Skills</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <strong>Required:</strong>
                    <ul className="list-disc list-inside ml-2">
                      {result.mandatorySkills.map((skill: string, i: number) => (
                        <li key={i}>{skill}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <strong>Nice to Have:</strong>
                    <ul className="list-disc list-inside ml-2">
                      {result.goodToHaveSkills.map((skill: string, i: number) => (
                        <li key={i}>{skill}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="font-medium mb-2">Interview Process</h4>
              <ul className="list-disc list-inside text-sm">
                {result.interviewProcess.map((item: string, i: number) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Features */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">✅ All Features in One File</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Section boundary protection (70+ headings)</li>
              <li>• Weighted confidence scoring</li>
              <li>• Section aliases (Required Skills, Must Have, Tech Stack)</li>
              <li>• Text cleaning and normalization</li>
              <li>• Skill deduplication (Python, python, PYTHON → Python)</li>
              <li>• Company name validation</li>
              <li>• Invalid requirement filtering</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
};

export default JobParserTest;