import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2, CheckCircle, BookOpen, TrendingUp, ExternalLink } from 'lucide-react';
import { useResumeStore } from '../../store/useResumeStore';
import { executeResumeAI } from '../../services/resumeAIClient';

const SKILL_COURSES: Record<string, { name: string; hours: string; platform: string; url: string }> = {
  'Docker': { name: 'Docker Mastery', hours: '8h', platform: 'Udemy', url: 'https://www.udemy.com/course/docker-mastery/' },
  'Kubernetes': { name: 'Kubernetes for Developers', hours: '12h', platform: 'Udemy', url: 'https://www.udemy.com/course/kubernetes-for-developers/' },
  'AWS': { name: 'AWS Solutions Architect', hours: '40h', platform: 'AWS', url: 'https://aws.amazon.com/training/learn-about/solutions-architect/' },
  'Azure': { name: 'Azure Fundamentals', hours: '10h', platform: 'Microsoft', url: 'https://learn.microsoft.com/en-us/training/azure/' },
  'GCP': { name: 'Google Cloud Engineer', hours: '20h', platform: 'Google', url: 'https://cloud.google.com/training' },
  'React': { name: 'React - The Complete Guide', hours: '40h', platform: 'Udemy', url: 'https://www.udemy.com/course/react-the-complete-guide-incl-redux/' },
  'Node.js': { name: 'Node.js Developer Course', hours: '25h', platform: 'Udemy', url: 'https://www.udemy.com/course/nodejs-the-complete-guide/' },
  'Python': { name: 'Python for Everybody', hours: '20h', platform: 'Coursera', url: 'https://www.coursera.org/specializations/python' },
  'TypeScript': { name: 'Understanding TypeScript', hours: '15h', platform: 'Udemy', url: 'https://www.udemy.com/course/understanding-typescript/' },
  'Machine Learning': { name: 'Machine Learning Specialization', hours: '60h', platform: 'Coursera', url: 'https://www.coursera.org/specializations/machine-learning-introduction' },
  'System Design': { name: 'System Design Interview', hours: '30h', platform: 'Educative', url: 'https://www.educative.io/courses/grokking-the-system-design-interview' },
  'CI/CD': { name: 'Jenkins CI/CD Pipeline', hours: '8h', platform: 'Udemy', url: 'https://www.udemy.com/course/jenkins-ci-cd-pipeline/' },
  'Terraform': { name: 'Terraform for Beginners', hours: '10h', platform: 'Udemy', url: 'https://www.udemy.com/course/terraform-beginner-to-advanced/' },
  'SQL': { name: 'SQL for Data Analysis', hours: '12h', platform: 'Coursera', url: 'https://www.coursera.org/learn/sql-for-data-science' },
  'MongoDB': { name: 'MongoDB University', hours: '10h', platform: 'MongoDB', url: 'https://university.mongodb.com/' },
  'Redis': { name: 'Redis for Developers', hours: '6h', platform: 'Udemy', url: 'https://www.udemy.com/course/redis-complete-guide/' },
  'Microservices': { name: 'Microservices Architecture', hours: '20h', platform: 'Udemy', url: 'https://www.udemy.com/course/microservices-architecture/' },
  'GraphQL': { name: 'GraphQL with Apollo', hours: '10h', platform: 'Udemy', url: 'https://www.udemy.com/course/graphql-with-apollo/' },
  'Agile': { name: 'Agile & Scrum', hours: '5h', platform: 'LinkedIn', url: 'https://www.linkedin.com/learning/agile-scrum-training' },
  'Leadership': { name: 'Leadership Principles', hours: '8h', platform: 'Coursera', url: 'https://www.coursera.org/learn/leadership' },
};

const COMMON_SKILLS_BY_ROLE: Record<string, string[]> = {
  'Software Engineer': ['Python', 'Java', 'System Design', 'SQL', 'Docker', 'AWS', 'Agile', 'Microservices', 'CI/CD', 'Data Structures'],
  'Frontend Developer': ['React', 'TypeScript', 'JavaScript', 'CSS', 'HTML', 'GraphQL', 'Webpack', 'Jest', 'Responsive Design', 'Git'],
  'Backend Developer': ['Node.js', 'Python', 'Java', 'SQL', 'Docker', 'AWS', 'Redis', 'Microservices', 'CI/CD', 'System Design'],
  'Full Stack Developer': ['React', 'Node.js', 'TypeScript', 'SQL', 'Docker', 'AWS', 'MongoDB', 'GraphQL', 'CI/CD', 'Git'],
  'DevOps Engineer': ['Docker', 'Kubernetes', 'AWS', 'Terraform', 'CI/CD', 'Python', 'Linux', 'Ansible', 'Monitoring', 'Git'],
  'Data Engineer': ['Python', 'SQL', 'Spark', 'Airflow', 'AWS', 'Kafka', 'Hadoop', 'Snowflake', 'Data Modeling', 'ETL'],
  'Data Scientist': ['Python', 'Machine Learning', 'SQL', 'Statistics', 'TensorFlow', 'R', 'Data Visualization', 'Deep Learning', 'NLP', 'Tableau'],
  'AI Engineer': ['Python', 'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'NLP', 'Computer Vision', 'Docker', 'AWS', 'MLOps'],
  'Product Manager': ['Agile', 'SQL', 'Analytics', 'User Research', 'Roadmapping', 'A/B Testing', 'JIRA', 'Stakeholder Management', 'Strategy', 'Wireframing'],
  'UI/UX Designer': ['Figma', 'User Research', 'Wireframing', 'Prototyping', 'Design Systems', 'Accessibility', 'Usability Testing', 'Responsive Design', 'HTML/CSS', 'Motion Design'],
};

export default function SkillGapLearning() {
  const { data, update } = useResumeStore();
  const [targetRole, setTargetRole] = useState(data.targetRole || '');
  const [missingSkills, setMissingSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [learning, setLearning] = useState<Record<string, boolean>>({});
  const [completed, setCompleted] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('skill_learning_completed') || '[]'); } catch { return []; }
  });

  const analyzeGap = async () => {
    const role = targetRole.trim() || data.targetRole || 'Software Engineer';
    setLoading(true);

    const common = COMMON_SKILLS_BY_ROLE[role] || COMMON_SKILLS_BY_ROLE['Software Engineer'];
    const existing = new Set(data.skills.map(s => s.toLowerCase()));
    const missing = common.filter(s => !existing.has(s.toLowerCase()));

    // Also try AI for role-specific suggestions
    if (missing.length < 3) {
      try {
        const res = await executeResumeAI({
          section: 'skills', action: 'find_missing',
          content: `Current skills: ${data.skills.join(', ')}. Target role: ${role}. List 5-8 missing but important skills for this role, comma-separated.`,
        });
        if (res.result) {
          const aiSkills = res.result.split(',').map(s => s.trim().replace(/^[-•*\d.]+\s*/g, '')).filter(Boolean);
          aiSkills.forEach(s => { if (!existing.has(s.toLowerCase())) missing.push(s); });
        }
      } catch { /* silent */ }
    }

    setMissingSkills([...new Set(missing)].slice(0, 8));
    setLoading(false);
  };

  useEffect(() => {
    if (targetRole || data.targetRole) analyzeGap();
  }, []);

  const markLearning = (skill: string) => {
    const newCompleted = [...completed, skill];
    setCompleted(newCompleted);
    localStorage.setItem('skill_learning_completed', JSON.stringify(newCompleted));

    // Add skill to resume
    if (!data.skills.includes(skill)) {
      update('skills', [...data.skills, skill]);
    }

    setLearning(prev => ({ ...prev, [skill]: true }));
    setTimeout(() => setLearning(prev => ({ ...prev, [skill]: false })), 2000);
  };

  const openLearningResource = (skill: string) => {
    const course = SKILL_COURSES[skill];
    if (course?.url) {
      window.open(course.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">AI Learning — Skill Gap Analysis</h2>
        <p className="text-sm text-gray-500 mt-0.5">Find missing skills, learn them, and boost your resume</p>
      </div>

      {/* Target role */}
      <div className="flex items-center gap-3">
        <input type="text" value={targetRole} onChange={e => setTargetRole(e.target.value)}
          placeholder="Target role (e.g. Software Engineer)"
          className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
        />
        <button onClick={analyzeGap} disabled={loading || !targetRole.trim()}
          className="px-4 py-2 text-sm font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-40 transition-colors">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          <span className="ml-1.5">Analyze</span>
        </button>
      </div>

      {/* Results */}
      {missingSkills.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-700">Missing Skills for <span className="text-purple-600">{targetRole || data.targetRole || 'Software Engineer'}</span></p>
            <p className="text-xs text-gray-500">{completed.length}/{missingSkills.length + completed.length} completed</p>
          </div>

          <div className="space-y-2">
            {missingSkills.map(skill => {
              const course = SKILL_COURSES[skill] || { name: `${skill} Course`, hours: '10h', platform: 'Various' };
              const isDone = completed.includes(skill);
              return (
                <div key={skill} className={`p-4 border rounded-xl transition-all ${
                  isDone ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200 hover:border-purple-300'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isDone ? 'bg-green-100' : 'bg-amber-100'
                      }`}>
                        {isDone ? <CheckCircle className="w-4 h-4 text-green-600" /> : <BookOpen className="w-4 h-4 text-amber-500" />}
                      </div>
                      <div>
                        <p className={`text-sm font-semibold ${isDone ? 'text-green-700' : 'text-gray-800'}`}>
                          {skill} {isDone && <span className="text-green-500 font-normal">✓</span>}
                        </p>
                        <p className="text-[10px] text-gray-400">{course.name} · {course.hours} · {course.platform}</p>
                      </div>
                    </div>
                    {!isDone && (
                      <div className="flex items-center gap-2">
                        <button onClick={() => markLearning(skill)} disabled={learning[skill]}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors">
                          {learning[skill] ? <Loader2 className="w-3 h-3 animate-spin" /> : <TrendingUp className="w-3 h-3" />}
                          {learning[skill] ? 'Adding...' : `Learn ${course.hours}`}
                        </button>
                        <button onClick={() => openLearningResource(skill)}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                          <ExternalLink className="w-3 h-3" />
                          Course
                        </button>
                      </div>
                    )}
                  </div>
                  {/* Progress bar (simulated ATS impact) */}
                  {isDone && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                        <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '100%' }} />
                      </div>
                      <span className="text-[10px] text-green-600 font-medium">ATS +4%</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <p className="text-[10px] text-gray-400 text-center">
            Mark a skill as learned → it's added to your resume and ATS score improves
          </p>
        </div>
      )}

      {!loading && missingSkills.length === 0 && targetRole && (
        <div className="text-center py-12 border-2 border-dashed border-green-200 rounded-xl bg-green-50/50">
          <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
          <p className="text-sm font-semibold text-green-700">No critical gaps found!</p>
          <p className="text-xs text-green-600 mt-1">Your skills match well with the {targetRole} role.</p>
        </div>
      )}
    </div>
  );
}
