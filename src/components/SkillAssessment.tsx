import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, Search } from 'lucide-react';
import { API_ENDPOINTS } from '../config/constants';
import BackButton from './BackButton';

const SkillAssessment = () => {
  const [skills, setSkills] = useState([]);
  const [filteredSkills, setFilteredSkills] = useState([]);
  const [skillSearch, setSkillSearch] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');
  const [showSkillDropdown, setShowSkillDropdown] = useState(false);
  const [assessment, setAssessment] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(1800);
  const [result, setResult] = useState(null);
  const [myAssessments, setMyAssessments] = useState([]);

  useEffect(() => {
    fetchSkills();
    fetchMyAssessments();
  }, []);

  useEffect(() => {
    if (assessment && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [assessment, timeLeft]);

  const fetchSkills = async () => {
    try {
      // First try to fetch from skills.json
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/backend/data/skills.json`);
      if (response.ok) {
        const data = await response.json();
        setSkills(data.skills || []);
        setFilteredSkills(data.skills || []);
      } else {
        // Fallback to API endpoint
        const apiResponse = await fetch('/api/skill-assessments/skills');
        const apiData = await apiResponse.json();
        setSkills(apiData);
        setFilteredSkills(apiData);
      }
    } catch (error) {
      console.error('Error fetching skills:', error);
      // Fallback skills if both fail
      const fallbackSkills = [
        'JavaScript', 'Python', 'React', 'Node.js', 'Java', 'C++', 'SQL', 'AWS', 'Docker', 'Git',
        'HTML', 'CSS', 'TypeScript', 'Angular', 'Vue.js', 'PHP', 'C#', 'Ruby', 'Go', 'Kotlin',
        'Swift', 'Flutter', 'React Native', 'MongoDB', 'PostgreSQL', 'Redis', 'Kubernetes',
        'Machine Learning', 'Data Science', 'Cybersecurity', 'DevOps', 'UI/UX Design'
      ];
      setSkills(fallbackSkills);
      setFilteredSkills(fallbackSkills);
    }
  };

  const fetchMyAssessments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/skill-assessments/my-assessments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setMyAssessments(data);
    } catch (error) {
      console.error('Error fetching assessments:', error);
    }
  };

  const startAssessment = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/skill-assessments/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ skill: selectedSkill })
      });
      const data = await response.json();
      setAssessment(data);
      setAnswers(new Array(data.totalQuestions).fill(-1));
      setTimeLeft(data.timeLimit * 60);
    } catch (error) {
      console.error('Error starting assessment:', error);
    }
  };

  const submitAssessment = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/skill-assessments/submit/${assessment.assessmentId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ answers, timeSpent: 1800 - timeLeft })
      });
      const data = await response.json();
      setResult(data);
      setAssessment(null);
      fetchMyAssessments();
    } catch (error) {
      console.error('Error submitting assessment:', error);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSkillSearch = (e) => {
    const value = e.target.value;
    setSkillSearch(value);
    setSelectedSkill(value);
    
    if (value.length >= 1) {
      const filtered = skills.filter(skill => 
        skill.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 10);
      setFilteredSkills(filtered);
      setShowSkillDropdown(true);
    } else {
      setFilteredSkills(skills.slice(0, 10));
      setShowSkillDropdown(false);
    }
  };

  const selectSkill = (skill) => {
    setSelectedSkill(skill);
    setSkillSearch(skill);
    setShowSkillDropdown(false);
  };

  if (result) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
            result.score >= 70 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
          }`}>
            {result.score >= 70 ? <CheckCircle size={32} /> : <XCircle size={32} />}
          </div>
          <h2 className="text-2xl font-bold mb-2">Assessment Complete!</h2>
          <div className="text-4xl font-bold mb-4 text-blue-600">{result.score}%</div>
          <p className="text-gray-600 mb-6">
            You got {result.correctAnswers} out of {result.totalQuestions} questions correct
          </p>
          <button
            onClick={() => { setResult(null); setSelectedSkill(''); }}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Take Another Assessment
          </button>
        </div>
      </div>
    );
  }

  if (assessment) {
    const question = assessment.questions[currentQuestion];
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">{assessment.skill} Assessment</h2>
          <div className="flex items-center text-red-600">
            <Clock size={20} className="mr-2" />
            {formatTime(timeLeft)}
          </div>
        </div>
        
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Question {currentQuestion + 1} of {assessment.totalQuestions}</span>
            <span>{Math.round(((currentQuestion + 1) / assessment.totalQuestions) * 100)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestion + 1) / assessment.totalQuestions) * 100}%` }}
            />
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-medium mb-4">{question.question}</h3>
          <div className="space-y-3">
            {question.options.map((option, index) => (
              <label key={index} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name={`question-${currentQuestion}`}
                  value={index}
                  checked={answers[currentQuestion] === index}
                  onChange={() => {
                    const newAnswers = [...answers];
                    newAnswers[currentQuestion] = index;
                    setAnswers(newAnswers);
                  }}
                  className="mr-3"
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-between">
          <button
            onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
            disabled={currentQuestion === 0}
            className="px-4 py-2 border rounded-lg disabled:opacity-50"
          >
            Previous
          </button>
          
          {currentQuestion === assessment.totalQuestions - 1 ? (
            <button
              onClick={submitAssessment}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
            >
              Submit Assessment
            </button>
          ) : (
            <button
              onClick={() => setCurrentQuestion(Math.min(assessment.totalQuestions - 1, currentQuestion + 1))}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Next
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <BackButton 
          onClick={() => window.history.back()}
          text="Back"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800 transition-colors"
        />
      </div>
      <h1 className="text-3xl font-bold mb-8">Skill Assessments</h1>
      
      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold mb-4">Take New Assessment</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Select Skill</label>
            <div className="relative">
              <div className="relative">
                <input
                  type="text"
                  value={skillSearch}
                  onChange={handleSkillSearch}
                  onFocus={() => setShowSkillDropdown(true)}
                  onBlur={() => setTimeout(() => setShowSkillDropdown(false), 200)}
                  placeholder="Search skills (e.g., JavaScript, Python, React)..."
                  className="w-full p-3 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              </div>
              {showSkillDropdown && filteredSkills.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {filteredSkills.map((skill, index) => (
                    <button
                      key={index}
                      type="button"
                      onMouseDown={() => selectSkill(skill)}
                      className="w-full text-left px-4 py-3 hover:bg-blue-50 text-sm border-b last:border-b-0 transition-colors"
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={startAssessment}
            disabled={!selectedSkill}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Start Assessment
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold mb-4">My Assessments</h2>
          {myAssessments.length === 0 ? (
            <p className="text-gray-600">No assessments completed yet.</p>
          ) : (
            <div className="space-y-3">
              {myAssessments.map((assessment, index) => (
                <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{assessment.skill}</div>
                    <div className="text-sm text-gray-600">
                      {new Date(assessment.completedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className={`text-lg font-bold ${
                    assessment.score >= 70 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {assessment.score}%
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SkillAssessment;