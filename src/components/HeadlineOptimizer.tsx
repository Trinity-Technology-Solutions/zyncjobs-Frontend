import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../config/api';
import { Lightbulb, TrendingUp, BarChart3, Sparkles } from 'lucide-react';

interface HeadlineOptimizerProps {
  user: any;
  onUpdateUser: (userData: any) => void;
}

const HeadlineOptimizer: React.FC<HeadlineOptimizerProps> = ({ user, onUpdateUser }) => {
  const [currentHeadline, setCurrentHeadline] = useState(user?.headline || '');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [abTestHeadlines, setAbTestHeadlines] = useState<{
    headlineA: string;
    headlineB: string;
    viewsA: number;
    viewsB: number;
    isActive: boolean;
  }>(user?.headlineTest || { headlineA: '', headlineB: '', viewsA: 0, viewsB: 0, isActive: false });
  const [loading, setLoading] = useState(false);

  // Load real analytics data
  useEffect(() => {
    if (user?.id && abTestHeadlines.isActive) {
      fetchAnalytics();
    }
  }, [user?.id]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/headline/stats/${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setAbTestHeadlines(prev => ({
          ...prev,
          viewsA: data.viewsA,
          viewsB: data.viewsB
        }));
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const generateSuggestions = async () => {
    setLoading(true);
    
    try {
      const userSkills = user?.skills?.join(', ') || '';
      const userTitle = user?.title || user?.jobTitle || '';
      const experience = user?.yearsExperience || '';
      
      const prompt = `You are a professional resume writer. Create exactly 5 different resume headlines for a ${userTitle} with ${experience} years of experience. Skills: ${userSkills}. 

Format: Return ONLY the headlines, one per line, no numbering or extra text.

Example format:
Senior Software Developer | React & Node.js Expert
Full-Stack Developer | 5+ Years Building Scalable Applications

Now create 5 headlines:`;
      
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt })
      });
      
      if (response.ok) {
        const data = await response.json();
        const headlines = data.response
          .split('\n')
          .map(line => line.trim())
          .filter(line => line && !line.includes('here to help') && !line.includes('question'))
          .slice(0, 5);
        setSuggestions(headlines);
      } else {
        // Fallback suggestions
        const fallbackSuggestions = [
          `${experience}+ Years ${userTitle} | ${userSkills.split(',')[0]} Expert`,
          `Senior ${userTitle} Specializing in ${userSkills.split(',')[0]}`,
          `${userTitle} | Driving Innovation with ${userSkills.split(',')[0]}`,
          `Experienced ${userTitle} | ${userSkills.split(',')[0]} Specialist`
        ].filter(s => !s.includes('undefined'));
        setSuggestions(fallbackSuggestions);
      }
    } catch (error) {
      console.error('Error generating suggestions:', error);
      // Fallback suggestions on error
      const fallbackSuggestions = [
        `${experience}+ Years ${userTitle}`,
        `Senior ${userTitle}`,
        `${userTitle} | Professional`,
        `Experienced ${userTitle}`
      ].filter(s => !s.includes('undefined'));
      setSuggestions(fallbackSuggestions);
    } finally {
      setLoading(false);
    }
  };

  const selectHeadline = (headline: string) => {
    setCurrentHeadline(headline);
    onUpdateUser({ ...user, headline });
  };

  const startAbTest = async () => {
    if (currentHeadline && suggestions.length > 0 && user?.id) {
      try {
        await fetch(`${API_ENDPOINTS.BASE_URL}/api/headline/start-test`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            headlineA: currentHeadline,
            headlineB: suggestions[0]
          })
        });
        
        const testData = {
          headlineA: currentHeadline,
          headlineB: suggestions[0],
          viewsA: 0,
          viewsB: 0,
          isActive: true
        };
        setAbTestHeadlines(testData);
        onUpdateUser({ ...user, headlineTest: testData });
        
        // Start polling for updates
        const interval = setInterval(fetchAnalytics, 5000);
        setTimeout(() => clearInterval(interval), 60000); // Stop after 1 minute
      } catch (error) {
        console.error('Error starting A/B test:', error);
      }
    }
  };

  const stopAbTest = () => {
    const winner = abTestHeadlines.viewsA > abTestHeadlines.viewsB ? abTestHeadlines.headlineA : abTestHeadlines.headlineB;
    setCurrentHeadline(winner);
    setAbTestHeadlines({ ...abTestHeadlines, isActive: false });
    onUpdateUser({ 
      ...user, 
      headline: winner,
      headlineTest: { ...abTestHeadlines, isActive: false }
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
      <h2 className="text-xl font-semibold text-gray-700 mb-6 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-purple-500" />
        Resume Headline Optimizer
      </h2>

      {/* Current Headline */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Current Headline</label>
        <input
          type="text"
          value={currentHeadline}
          onChange={(e) => setCurrentHeadline(e.target.value)}
          onBlur={() => onUpdateUser({ ...user, headline: currentHeadline })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2"
          placeholder="Enter your professional headline..."
        />
      </div>

      {/* AI Suggestions */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-medium text-gray-900 flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-yellow-500" />
            AI Suggestions
          </h3>
          <button
            onClick={generateSuggestions}
            disabled={loading}
            className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700 disabled:opacity-50"
          >
            {loading ? 'Generating...' : 'Generate'}
          </button>
        </div>
        
        {suggestions.length > 0 && (
          <div className="space-y-2">
            {suggestions.map((suggestion, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">{suggestion}</span>
                <button
                  onClick={() => selectHeadline(suggestion)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Use This
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* A/B Testing */}
      <div className="border-t pt-6">
        <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-green-500" />
          A/B Testing
        </h3>
        
        {!abTestHeadlines.isActive ? (
          <div className="text-center py-6">
            <p className="text-gray-600 mb-4">Test two headlines to see which performs better</p>
            <button
              onClick={startAbTest}
              disabled={!currentHeadline || suggestions.length === 0}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              Start A/B Test
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-blue-800">Headline A</span>
                  <span className="text-sm text-blue-600">{abTestHeadlines.viewsA} views</span>
                </div>
                <p className="text-sm text-gray-700">{abTestHeadlines.headlineA}</p>
              </div>
              
              <div className="p-4 border border-green-200 rounded-lg bg-green-50">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-green-800">Headline B</span>
                  <span className="text-sm text-green-600">{abTestHeadlines.viewsB} views</span>
                </div>
                <p className="text-sm text-gray-700">{abTestHeadlines.headlineB}</p>
              </div>
            </div>
            
            <div className="flex justify-center">
              <button
                onClick={stopAbTest}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                End Test & Use Winner
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Performance Metrics */}
      {currentHeadline && (
        <div className="border-t pt-6 mt-6">
          <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-orange-500" />
            Performance
          </h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">-</div>
              <div className="text-sm text-gray-600">Profile Views</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">-</div>
              <div className="text-sm text-gray-600">Recruiter Actions</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">-</div>
              <div className="text-sm text-gray-600">Job Matches</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HeadlineOptimizer;