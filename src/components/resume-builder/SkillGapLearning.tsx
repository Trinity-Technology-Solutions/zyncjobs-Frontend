import { useState, useEffect } from 'react';
import { Sparkles, Loader2, CheckCircle, BookOpen, ExternalLink } from 'lucide-react';
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

function normalizeSkill(value: string): string {
  const normalized = value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const aliases: Record<string, string> = {
    rest: 'rest api',
    'rest apis': 'rest api',
    'restful api': 'rest api',
    'restful apis': 'rest api',
    js: 'javascript',
    ts: 'typescript',
    'ci cd': 'cicd',
    'data structures algorithms': 'data structures and algorithms',
  };
  return aliases[normalized] || normalized;
}

// Build a Google search URL for learning a skill
function buildLearnUrl(skill: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(skill + ' tutorial free course')}`;
}

export default function SkillGapLearning() {
  const { data, update } = useResumeStore();
  const [targetRole, setTargetRole] = useState(data.targetRole || '');
  const [missingSkills, setMissingSkills] = useState<string[]>([]);
  const [analysisError, setAnalysisError] = useState('');
  const [loading, setLoading] = useState(false);
  const [learning, setLearning] = useState<Record<string, boolean>>({});
  const [inProgress, setInProgress] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('skill_learning_inprogress') || '[]'); } catch { return []; }
  });
  const [completed, setCompleted] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('skill_learning_completed') || '[]'); } catch { return []; }
  });

  const analyzeGap = async () => {
    const role = targetRole.trim() || data.targetRole || '';
    if (!role) return;
    setLoading(true);
    setAnalysisError('');
    const existing = new Set(data.skills.map(normalizeSkill));
    setMissingSkills([]);
    // Ask the AI to compare the exact target role with the candidate's resume evidence.
    let customRoleAnalysisFailed = false;
    let failureMessage = '';
    try {
      const experience = data.experience.flatMap(item => [item.title, item.company, ...item.bullets]).filter(Boolean).join('\n');
      const projects = data.projects.flatMap(item => [item.name, item.role, ...item.bullets]).filter(Boolean).join('\n');
      const education = data.education.map(item => [item.degree, item.fieldOfStudy, item.institution].filter(Boolean).join(' - ')).join('\n');
      const res = await executeResumeAI({
        section: 'skills',
        action: 'analyze_gap',
        content: `Target role: ${role}\nCurrent skills: ${data.skills.join(', ') || '(none listed)'}\nExperience:\n${experience || '(none listed)'}\nProjects:\n${projects || '(none listed)'}\nEducation:\n${education || '(none listed)'}`,
        context: {
          target_role: role,
          current_role: data.experience[0]?.title || '',
          current_skills: data.skills,
          experience_evidence: experience,
          project_evidence: projects,
          education_evidence: education,
        },
      });
      const raw = (res.result || '').replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
      let result: unknown;
      try { result = JSON.parse(raw); } catch { result = null; }
      const proposed: unknown[] = Array.isArray(result)
        ? result
        : result && typeof result === 'object' && Array.isArray((result as { missing_skills?: unknown[] }).missing_skills)
          ? (result as { missing_skills: unknown[] }).missing_skills
          : [];
      const hasValidResponse = Array.isArray(result)
        || Boolean(result && typeof result === 'object' && Array.isArray((result as { missing_skills?: unknown[] }).missing_skills));
      const rejectGeneric = /\b(?:years? of experience|generate|screening questions?|evaluate|various|specific|frameworks?|platforms?|practices?|knowledge of|familiarity with|understanding of|proficiency in|responsibilities|requirements)\b/i;
      const accepted = proposed
        .map(item => typeof item === 'string'
          ? item
          : item && typeof item === 'object' && typeof (item as { skill?: unknown }).skill === 'string'
            ? (item as { skill: string }).skill
            : '')
        .map(skill => skill.trim().replace(/^[\u2022*-]+\s*/, '').replace(/^['"`]|['"`]$/g, '').trim())
        .filter(skill => skill.length >= 2 && skill.length <= 40 && skill.split(/\s+/).length <= 5
          && !rejectGeneric.test(skill) && !/[!?;:]|\b(?:and|or|to|with)\s*$/i.test(skill)
          && !existing.has(normalizeSkill(skill)))
        .filter((skill, index, all) => all.findIndex(item => item.toLowerCase() === skill.toLowerCase()) === index)
        .slice(0, 10);
      customRoleAnalysisFailed = result !== null && typeof result === 'object'
        && (result as { analysis_available?: boolean }).analysis_available === false
        || !hasValidResponse || (proposed.length > 0 && accepted.length === 0);
      if (customRoleAnalysisFailed) {
        failureMessage = 'The AI could not complete a reliable skill-gap analysis. Check that the local AI service is running, then try Analyze again.';
      }
      setMissingSkills(accepted);
    } catch (error) {
      customRoleAnalysisFailed = true;
      setMissingSkills([]);
      if (error instanceof DOMException && error.name === 'AbortError') {
        failureMessage = 'The AI analysis took too long to finish. The local model may still be processing; please try Analyze again.';
      } else {
        const detail = error instanceof Error ? error.message.trim() : '';
        failureMessage = detail
          ? `AI request failed: ${detail.slice(0, 180)}`
          : 'The AI service could not complete the analysis. Check that it is running, then try Analyze again.';
      }
    }

    setAnalysisError(customRoleAnalysisFailed ? failureMessage : '');
    setLoading(false);
  };

  useEffect(() => {
    if (targetRole || data.targetRole) analyzeGap();
  }, []);

  const openCourse = (skill: string) => {
    const course = SKILL_COURSES[skill];
    const url = course?.url || buildLearnUrl(skill);
    window.open(url, '_blank', 'noopener,noreferrer');
    // Mark as in-progress (started learning) but NOT completed
    if (!inProgress.includes(skill)) {
      const updated = [...inProgress, skill];
      setInProgress(updated);
      localStorage.setItem('skill_learning_inprogress', JSON.stringify(updated));
    }
    setLearning(prev => ({ ...prev, [skill]: true }));
    setTimeout(() => setLearning(prev => ({ ...prev, [skill]: false })), 2000);
  };

  const markDone = (skill: string) => {
    if (completed.includes(skill)) return;
    const newCompleted = [...completed, skill];
    setCompleted(newCompleted);
    localStorage.setItem('skill_learning_completed', JSON.stringify(newCompleted));
    // Add to resume skills
    if (!data.skills.includes(skill)) {
      update('skills', [...data.skills, skill]);
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

      {analysisError && <p role="status" className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">{analysisError}</p>}

      {/* Results */}
      {missingSkills.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-700">AI-identified skill gaps for <span className="text-purple-600">{targetRole || data.targetRole}</span></p>
            <p className="text-xs text-gray-500">{missingSkills.filter(s => completed.includes(s)).length}/{missingSkills.length} completed</p>
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
                        <button onClick={() => openCourse(skill)} disabled={learning[skill]}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors">
                          {learning[skill] ? <Loader2 className="w-3 h-3 animate-spin" /> : <ExternalLink className="w-3 h-3" />}
                          {learning[skill] ? 'Opening...' : 'Learn'}
                        </button>
                        {inProgress.includes(skill) && (
                          <button onClick={() => markDone(skill)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                            <CheckCircle className="w-3 h-3" />
                            Done
                          </button>
                        )}
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

      {!loading && !analysisError && missingSkills.length === 0 && targetRole && (
        <div className="text-center py-12 border-2 border-dashed border-green-200 rounded-xl bg-green-50/50">
          <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
          <p className="text-sm font-semibold text-green-700">No critical gaps found!</p>
          <p className="text-xs text-green-600 mt-1">Your skills match well with the {targetRole} role.</p>
        </div>
      )}
    </div>
  );
}
