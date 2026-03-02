import React, { useState } from 'react';
import { Clock, CheckCircle, ArrowLeft } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

interface SkillAssessmentPageProps {
  onNavigate: (page: string) => void;
  user?: {name: string, type: 'candidate' | 'employer' | 'admin'} | null;
  onLogout?: () => void;
}

const SkillAssessmentPage: React.FC<SkillAssessmentPageProps> = ({ onNavigate, user, onLogout }) => {
  const [selectedSkill, setSelectedSkill] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [assessmentStarted, setAssessmentStarted] = useState(false);

  const skills = [
    'JavaScript', 'Python', 'React', 'Node.js', 'Java', 'SQL', 'HTML/CSS', 'TypeScript'
  ];

  const questions = {
    JavaScript: [
      {
        question: "What is the correct way to declare a variable in JavaScript?",
        options: ["var x = 5;", "variable x = 5;", "v x = 5;", "declare x = 5;"],
        correct: 0
      },
      {
        question: "Which method is used to add an element to the end of an array?",
        options: ["push()", "add()", "append()", "insert()"],
        correct: 0
      },
      {
        question: "What does '===' operator do in JavaScript?",
        options: ["Assignment", "Comparison without type checking", "Strict equality comparison", "Not equal"],
        correct: 2
      }
    ],
    Python: [
      {
        question: "Which of the following is the correct way to define a function in Python?",
        options: ["function myFunc():", "def myFunc():", "define myFunc():", "func myFunc():"],
        correct: 1
      },
      {
        question: "What is the output of print(type([]))?",
        options: ["<class 'array'>", "<class 'list'>", "<class 'tuple'>", "<class 'dict'>"],
        correct: 1
      },
      {
        question: "Which keyword is used to create a class in Python?",
        options: ["class", "Class", "define", "create"],
        correct: 0
      }
    ],
    React: [
      {
        question: "What is JSX?",
        options: ["JavaScript XML", "Java Syntax Extension", "JSON XML", "JavaScript Extension"],
        correct: 0
      },
      {
        question: "Which hook is used to manage state in functional components?",
        options: ["useEffect", "useState", "useContext", "useReducer"],
        correct: 1
      },
      {
        question: "What is the virtual DOM?",
        options: ["A copy of the real DOM", "A JavaScript representation of the DOM", "A browser API", "A React library"],
        correct: 1
      }
    ]
  };

  const startAssessment = () => {
    if (!selectedSkill) return;
    setAssessmentStarted(true);
    setCurrentQuestion(0);
    setAnswers([]);
    setShowResult(false);
  };

  const handleAnswer = (answerIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answerIndex;
    setAnswers(newAnswers);
  };

  const nextQuestion = () => {
    const skillQuestions = questions[selectedSkill as keyof typeof questions] || [];
    if (currentQuestion < skillQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      finishAssessment();
    }
  };

  const finishAssessment = () => {
    const skillQuestions = questions[selectedSkill as keyof typeof questions] || [];
    let correctCount = 0;
    
    answers.forEach((answer, index) => {
      if (answer === skillQuestions[index]?.correct) {
        correctCount++;
      }
    });
    
    const finalScore = Math.round((correctCount / skillQuestions.length) * 100);
    setScore(finalScore);
    setShowResult(true);
    setAssessmentStarted(false);
  };

  const resetAssessment = () => {
    setSelectedSkill('');
    setCurrentQuestion(0);
    setAnswers([]);
    setShowResult(false);
    setAssessmentStarted(false);
  };

  if (showResult) {
    return (
      <>
        <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-2xl mx-auto px-4">
            <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-6 ${
                score >= 70 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
              }`}>
                <CheckCircle size={32} />
              </div>
              <h2 className="text-2xl font-bold mb-4">Assessment Complete!</h2>
              <div className="text-4xl font-bold mb-4 text-blue-600">{score}%</div>
              <p className="text-gray-600 mb-6">
                You scored {score}% in {selectedSkill} assessment
              </p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={resetAssessment}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                >
                  Take Another Assessment
                </button>
                <button
                  onClick={() => onNavigate('dashboard')}
                  className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
        <Footer onNavigate={onNavigate} />
      </>
    );
  }

  if (assessmentStarted) {
    const skillQuestions = questions[selectedSkill as keyof typeof questions] || [];
    const question = skillQuestions[currentQuestion];
    
    if (!question) {
      return <div>No questions available for this skill.</div>;
    }

    return (
      <>
        <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-2xl mx-auto px-4">
            <div className="bg-white rounded-lg shadow-sm border p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">{selectedSkill} Assessment</h2>
                <div className="flex items-center text-blue-600">
                  <Clock size={20} className="mr-2" />
                  <span>No time limit</span>
                </div>
              </div>
              
              <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Question {currentQuestion + 1} of {skillQuestions.length}</span>
                  <span>{Math.round(((currentQuestion + 1) / skillQuestions.length) * 100)}% Complete</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((currentQuestion + 1) / skillQuestions.length) * 100}%` }}
                  />
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-lg font-medium mb-6">{question.question}</h3>
                <div className="space-y-3">
                  {question.options.map((option, index) => (
                    <label key={index} className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name={`question-${currentQuestion}`}
                        value={index}
                        checked={answers[currentQuestion] === index}
                        onChange={() => handleAnswer(index)}
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
                  className="px-6 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
                >
                  Previous
                </button>
                
                <button
                  onClick={nextQuestion}
                  disabled={answers[currentQuestion] === undefined}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {currentQuestion === skillQuestions.length - 1 ? 'Finish' : 'Next'}
                </button>
              </div>
            </div>
          </div>
        </div>
        <Footer onNavigate={onNavigate} />
      </>
    );
  }

  return (
    <>
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="mb-6">
            <button 
              onClick={() => onNavigate('dashboard')}
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </button>
          </div>
          
          <h1 className="text-3xl font-bold mb-8">Skill Assessments</h1>
          
          <div className="bg-white rounded-lg shadow-sm border p-8">
            <h2 className="text-xl font-bold mb-6">Take a Skill Assessment</h2>
            <p className="text-gray-600 mb-6">
              Test your knowledge and showcase your skills to potential employers.
            </p>
            
            <div className="mb-6">
              <label className="block text-sm font-medium mb-3">Select a skill to assess:</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {skills.map((skill) => (
                  <button
                    key={skill}
                    onClick={() => setSelectedSkill(skill)}
                    className={`p-3 border rounded-lg text-sm font-medium transition-colors ${
                      selectedSkill === skill
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500'
                    }`}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>
            
            <button
              onClick={startAssessment}
              disabled={!selectedSkill}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Start {selectedSkill} Assessment
            </button>
          </div>
        </div>
      </div>
      <Footer onNavigate={onNavigate} />
    </>
  );
};

export default SkillAssessmentPage;