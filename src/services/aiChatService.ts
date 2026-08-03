/// <reference types="vite/client" />

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const AI_BASE = import.meta.env.VITE_AI_API_URL || '/recruitment-ai';

let cachedToken: string | null = null;
let tokenExpiry: number = 0;

async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;
  const res = await fetch(`${AI_BASE}/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: 'ai_user', role: 'candidate' }),
  });
  if (!res.ok) throw new Error(`Auth failed: ${res.status}`);
  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + 55 * 60 * 1000;
  return cachedToken!;
}

export async function executeAI(
  query: string,
  context?: Record<string, unknown>,
  userRole = 'candidate'
): Promise<Record<string, unknown>> {
  const token = await getToken();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60000); // 60s — Ollama needs time
  try {
    const res = await fetch(`${AI_BASE}/ai/execute`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ query, context, user_role: userRole }),
    });
    if (!res.ok) throw new Error(`AI execute error: ${res.status}`);
    return res.json();
  } finally {
    clearTimeout(timer);
  }
}

// Patterns that indicate the backend returned a generic feature-description instead of a real answer
const GENERIC_REPLY_PATTERNS = [
  /use (resume builder|skill gap analysis|career roadmap|job recommendations)/i,
  /visit (the )?(resume builder|skill gap|career roadmap|job recommendations)/i,
  /you can use (our|the)? ?(resume|skill|career|job)/i,
  /zyncjobs (offers|provides|has) (a |the )?(resume|skill|career|job)/i,
];

function isGenericReply(text: string): boolean {
  return GENERIC_REPLY_PATTERNS.some(p => p.test(text));
}

// Extract human-readable reply from any brain response shape
function extractReply(data: any): string {
  const r = data?.result;
  const intent = (data as any)?.intent || '';
  if (!r) return '';
  if (r.reply && !isGenericReply(r.reply)) return r.reply;
  if (r.advice) return r.advice;
  if (r.search_strategy) return r.search_strategy;
  if (r.job_description) return r.job_description;
  if (r.career_path && Array.isArray(r.career_path)) {
    const steps = r.career_path.map((s: any, i: number) =>
      `**Step ${i + 1}: ${s.title || s.role || ''}** (${s.estimated_months ? s.estimated_months + ' months' : ''})
${s.description || ''}
Skills to learn: ${Array.isArray(s.skills_to_learn) ? s.skills_to_learn.join(', ') : ''}`
    ).join('\n\n');
    return `Here's your personalized career path (${r.career_path.length} steps):\n\n${steps}${r.advice ? '\n\n💡 ' + r.advice : ''}`.trim();
  }
  if (r.roadmap && Array.isArray(r.roadmap)) {
    const steps = r.roadmap.map((s: any, i: number) =>
      `**Phase ${s.phase || i + 1}: ${s.title || ''}** (${s.duration_months ? s.duration_months + ' months' : ''})
${(s.goals || []).join('. ')}
Skills: ${Array.isArray(s.skills_to_learn) ? s.skills_to_learn.join(', ') : ''}`
    ).join('\n\n');
    return `Here's your career roadmap:\n\n${steps}${r.advice ? '\n\n💡 ' + r.advice : ''}`.trim();
  }
  if (r.missing_skills && Array.isArray(r.missing_skills)) {
    const missing = (r.missing_skills as string[]).slice(0, 6);
    const current = Array.isArray(r.current_skills) ? (r.current_skills as string[]).slice(0, 5) : [];
    let reply = `**Skill Gap Analysis for ${r.target_role || 'your target role'}:**\n\n`;
    if (current.length > 0) reply += `✓ Skills you already have: ${current.join(', ')}\n\n`;
    reply += `○ Missing skills to acquire:\n${missing.map(s => `- ${s}`).join('\n')}`;
    if (r.advice) reply += `\n\n💡 ${r.advice}`;
    return reply;
  }
  if (r.questions && Array.isArray(r.questions)) {
    const preview = r.questions.slice(0, 3).map((q: any, i: number) => `**Q${i+1}:** ${q.question}`).join('\n');
    return `Here are some interview questions for you:\n\n${preview}\n\n${r.questions.length > 3 ? `...and ${r.questions.length - 3} more. Visit the Skill Assessment page for the full test.` : ''}`;
  }
  if (intent === 'RESUME_BUILDER' && r.summary) {
    const techSkills = (r.skills_formatted?.technical || []).slice(0, 6).join(', ');
    const atsKw = (r.ats_keywords || []).slice(0, 5).join(', ');
    return `**Resume Analysis:**\n\nSummary: ${r.summary}${techSkills ? `\n\nKey Skills: ${techSkills}` : ''}${atsKw ? `\n\nATS Keywords to include: ${atsKw}` : ''}${r.ats_score ? `\n\nATS Score: ${r.ats_score}/100` : ''}`;
  }
  if (intent === 'JD_GENERATOR' && r.title) return `Job Description for ${r.title}:\n\n${r.description || ''}\n\nRequirements: ${(r.requirements || []).slice(0, 4).join(', ')}`;
  if (typeof r === 'string') return r;
  return '';
}

// Non-streaming — for JSON responses (Roadmap, Assessment, Skill suggestions)
export async function sendAIMessage(
  messages: ChatMessage[],
  systemPrompt: string,
  signal?: AbortSignal,
  maxTokens = 800
): Promise<string> {
  const userMsg = messages.find(m => m.role === 'user')?.content || '';
  const history = messages.slice(0, -1).map(m => ({ role: m.role, content: m.content }));
  const isCareerCoach = systemPrompt.toLowerCase().includes('career coach') || systemPrompt.toLowerCase().includes('career advisor');
  const isRecruiter = systemPrompt.toLowerCase().includes('recruiter') || systemPrompt.toLowerCase().includes('hiring');
  const query = isRecruiter ? `recruiter: ${userMsg}` : isCareerCoach ? `career advice: ${userMsg}` : userMsg;
  try {
    const data = await executeAI(query, { systemPrompt, maxTokens, history });
    const reply = extractReply(data);
    if (reply) return reply;
    throw new Error('Empty response');
  } catch {
    throw new Error('AI agent unavailable');
  }
}

// Streaming — for chat (CareerCoach, Recruiter, ChatWidget)
export async function sendAIMessageStream(
  messages: ChatMessage[],
  systemPrompt: string,
  onChunk: (text: string) => void,
  signal?: AbortSignal,
  userContext?: Record<string, unknown>
): Promise<void> {
  const userMsg = messages[messages.length - 1]?.content || '';
  const history = messages.slice(0, -1).map(m => ({ role: m.role, content: m.content }));
  const isCareerCoach = systemPrompt.toLowerCase().includes('career') || systemPrompt.toLowerCase().includes('mentor');
  const isRecruiter = systemPrompt.toLowerCase().includes('recruiter') || systemPrompt.toLowerCase().includes('hiring');

  // Build a profile-enriched query so the AI backend can give personalized answers
  let enrichedQuery = userMsg;
  if (isCareerCoach && userContext && Object.keys(userContext).length > 0) {
    const resumeText = userContext.resume_text as string | undefined;
    // If resume_text present, use it directly — skip stale localStorage fields
    if (resumeText) {
      enrichedQuery = `career advice: ${userMsg}\n\nCandidate Resume:\n${resumeText}`;
    } else {
      const profileParts: string[] = [];
      if (userContext.user_name) profileParts.push(`Name: ${userContext.user_name}`);
      if (userContext.current_role) profileParts.push(`Current Role: ${userContext.current_role}`);
      if (userContext.target_role) profileParts.push(`Target Role: ${userContext.target_role}`);
      if (Array.isArray(userContext.skills) && userContext.skills.length > 0)
        profileParts.push(`Skills: ${(userContext.skills as string[]).join(', ')}`);
      if (userContext.experience_years) profileParts.push(`Experience: ${userContext.experience_years} years`);
      if (userContext.ats_score) profileParts.push(`ATS Score: ${userContext.ats_score}%`);
      if (Array.isArray(userContext.missing_skills) && (userContext.missing_skills as string[]).length > 0)
        profileParts.push(`Missing Skills: ${(userContext.missing_skills as string[]).join(', ')}`);
      if (userContext.location) profileParts.push(`Location: ${userContext.location}`);
      enrichedQuery = profileParts.length > 0
        ? `career advice: ${userMsg}\n\nCandidate Profile:\n${profileParts.join('\n')}`
        : `career advice: ${userMsg}`;
    }
  } else if (isRecruiter && userContext && Object.keys(userContext).length > 0) {
    // Recruiter: append employer job context + profile so the AI can answer contextually
    const recruiterParts: string[] = [];
    if (userContext.user_profile) {
      const p = userContext.user_profile as any;
      const name = p.name || p.fullName || '';
      if (name) recruiterParts.push(`Recruiter Name: ${name}`);
      const company = p.company || p.companyName || '';
      if (company) recruiterParts.push(`Company: ${company}`);
    }
    const jobsCtx = userContext.jobs_context as any[] | undefined;
    if (Array.isArray(jobsCtx) && jobsCtx.length > 0) {
      const jobDesc = jobsCtx.map(j => {
        const title = j.jobTitle || j.title || '';
        const skills = Array.isArray(j.skills) ? j.skills.join(', ') : '';
        const loc = j.location || '';
        const exp = j.experienceRange || j.experienceLevel || '';
        return `- ${title} (location: ${loc}, experience: ${exp}, skills: ${skills})`;
      }).join('\n');
      recruiterParts.push(`Employer Active Jobs:\n${jobDesc}`);
    }
    if (recruiterParts.length > 0) {
      enrichedQuery = `recruiter: ${userMsg}\n\nRecruiter Context:\n${recruiterParts.join('\n')}`;
    } else {
      enrichedQuery = `recruiter: ${userMsg}`;
    }
  } else {
    enrichedQuery = isRecruiter ? `recruiter: ${userMsg}` : isCareerCoach ? `career advice: ${userMsg}` : userMsg;
  }

  // Pass systemPrompt inside user_preferences so career_brain.py uses it as override
  const context = {
    systemPrompt,
    history,
    ...(userContext || {}),
    user_preferences: {
      ...(userContext || {}),
      systemPrompt,
      history,
    },
  };
  const data = await executeAI(enrichedQuery, context, isRecruiter ? 'recruiter' : isCareerCoach ? 'candidate' : 'candidate');
  const reply = extractReply(data);
  if (!reply) throw new Error('Empty AI response');
  // Simulate streaming word by word
  const words = reply.split(' ');
  for (let i = 0; i < words.length; i++) {
    if (signal?.aborted) break;
    onChunk(words[i] + (i < words.length - 1 ? ' ' : ''));
    await new Promise(r => setTimeout(r, 25));
  }
}

// Assessment questions — calls AI agent (Ollama via /recruitment-ai/ai/execute)
export async function generateAssessmentQuestions(skill: string): Promise<any[]> {
  const data = await executeAI(
    `generate assessment for ${skill}`,
    { skill, level: 'intermediate', count: 10 }
  );

  const questions: any[] = (data as any).result?.questions;
  if (!Array.isArray(questions) || questions.length === 0) throw new Error('No questions from AI agent');

  const valid = questions.filter((q: any) =>
    q.question &&
    Array.isArray(q.options) && q.options.length === 4 &&
    typeof q.correctAnswer === 'number' && q.correctAnswer >= 0 && q.correctAnswer <= 3
  );

  if (valid.length < 5) throw new Error('Too few valid questions from AI agent');

  return valid.slice(0, 10).map((q: any, i: number) => ({
    id: i + 1,
    question: q.question,
    options: q.options,
    correctAnswer: q.correctAnswer,
  }));
}

// Career roadmap — calls AI agent with CAREER_ADVICE intent
export async function generateCareerRoadmap(
  currentRole: string,
  targetRole: string,
  experience: string
): Promise<any> {
  // Pull user skills from localStorage for personalized transition guidance
  let currentSkills: string[] = [];
  try {
    const u = JSON.parse(localStorage.getItem('user') || '{}');
    const resumeStore = JSON.parse(localStorage.getItem('zyncjobs-resume-builder') || '{}');
    const resumeSkills: string[] = ((resumeStore?.state?.data?.skills) || []).map((s: any) =>
      typeof s === 'string' ? s : (s?.name || '')
    ).filter(Boolean);
    currentSkills = [...(u.skills || []), ...resumeSkills]
      .filter((s, i, a) => s && a.indexOf(s) === i).slice(0, 15);
  } catch { }

  const data = await executeAI(
    `career roadmap from ${currentRole} to ${targetRole}`,
    { current_role: currentRole, target_role: targetRole, experience_years: experience, current_skills: currentSkills }
  );

  const result = (data as any).result;
  if (!result) throw new Error('No result from AI agent');

  const mapSalary = (raw: any[]) =>
    raw.map((s: any) => ({ phase: s.phase ?? 1, expected_range: s.expected_range || s.salary_range || '' }));

  const mapStep = (s: any, i: number, isCareerPath = false) => ({
    step: s.step || s.phase || i + 1,
    title: s.title || `Phase ${i + 1}`,
    timeframe: isCareerPath
      ? (s.estimated_months ? `${s.estimated_months} months` : '')
      : (s.duration_months ? `${s.duration_months} months` : ''),
    skills: Array.isArray(s.skills_to_learn) ? s.skills_to_learn : [],
    skillDetails: Array.isArray(s.skill_details) ? s.skill_details.map(sd => ({
      name: sd.skill || sd.name || '',
      why: sd.why || '',
      resource: Array.isArray(sd.resource) ? sd.resource : (sd.resource_url ? [{ name: sd.resource || 'Resource', url: sd.resource_url, type: sd.platform || 'link' }] : []),
    })) : [],
    description: isCareerPath
      ? (s.description || s.title || '')
      : ((s.goals || []).join('. ') || s.title || ''),
    milestones: Array.isArray(s.milestones)
      ? s.milestones.map((m: any) => typeof m === 'string' ? { title: m, description: m, completed: false } : { title: m.title || m.description || '', description: m.description || m.title || '', completed: m.completed || false })
      : (s.milestone
        ? (typeof s.milestone === 'string' ? [{ title: s.milestone, description: s.milestone, completed: false }] : s.milestone)
        : [{ title: `Complete phase ${i + 1}`, description: `Complete phase ${i + 1}`, completed: false }]),
    certifications: Array.isArray(s.certifications) ? s.certifications : [],
    salaryRange: s.salary_range || '',
    marketDemand: s.market_demand && typeof s.market_demand === 'object' ? s.market_demand : (s.marketDemand || null),
  });

  const mapMarketDemand = (r: any) => {
    if (!r.market_demand || typeof r.market_demand !== 'object') return r.marketDemand || null;
    const md = r.market_demand;
    return {
      level: (md.demand_level || md.level || 'medium').toLowerCase(),
      score: md.score ?? (md.demand_level === 'High' ? 85 : md.demand_level === 'Medium' ? 60 : 35),
      trends: Array.isArray(md.trends) ? md.trends : (Array.isArray(md.market_trends) ? md.market_trends : []),
    };
  };

  // AI agent returns career_path array — map to frontend Roadmap shape
  if (result.career_path && Array.isArray(result.career_path)) {
    return {
      currentRole, targetRole,
      totalTimeframe: result.timeline_months ? `${result.timeline_months} months` : '12-18 months',
      summary: result.advice || `Roadmap from ${currentRole} to ${targetRole}.`,
      steps: result.career_path.map((s: any, i: number) => mapStep(s, i, true)),
      certifications: Array.isArray(result.certifications) ? result.certifications : [],
      salaryProgression: Array.isArray(result.salary_progression) ? mapSalary(result.salary_progression) : [],
      marketTrends: Array.isArray(result.market_trends) ? result.market_trends : [],
      marketDemand: mapMarketDemand(result),
      transferableSkills: Array.isArray(result.transferable_skills) ? result.transferable_skills : [],
      finalTip: result.advice || 'Stay consistent and keep building.',
    };
  }

  // AI agent returns roadmap array (career_roadmap_brain shape)
  if (result.roadmap && Array.isArray(result.roadmap)) {
    return {
      currentRole, targetRole,
      totalTimeframe: result.total_duration_months ? `${result.total_duration_months} months` : '12-18 months',
      summary: result.advice || `Roadmap from ${currentRole} to ${targetRole}.`,
      steps: result.roadmap.map((s: any, i: number) => mapStep(s, i, false)),
      certifications: Array.isArray(result.certifications) ? result.certifications : [],
      salaryProgression: Array.isArray(result.salary_progression) ? mapSalary(result.salary_progression) : [],
      marketTrends: Array.isArray(result.market_trends) ? result.market_trends : [],
      marketDemand: mapMarketDemand(result),
      transferableSkills: Array.isArray(result.transferable_skills) ? result.transferable_skills : [],
      finalTip: result.advice || 'Stay consistent and keep building.',
    };
  }

  // If reply is conversational text (CHAT fallback), build a minimal roadmap from it
  if (result.reply || typeof result === 'string') {
    const text = result.reply || result;
    return {
      currentRole, targetRole,
      totalTimeframe: '12-18 months',
      summary: typeof text === 'string' ? text : `Roadmap from ${currentRole} to ${targetRole}.`,
      steps: [
        { step: 1, title: 'Build Core Skills', timeframe: '3-6 months', skills: [], skillDetails: [], description: `Focus on skills required for ${targetRole}.`, milestones: ['Complete foundational learning'], certifications: [], salaryRange: '' },
        { step: 2, title: 'Build Projects', timeframe: '3-6 months', skills: [], skillDetails: [], description: 'Apply skills in real projects.', milestones: ['Complete 2-3 portfolio projects'], certifications: [], salaryRange: '' },
        { step: 3, title: 'Apply & Interview', timeframe: '3-6 months', skills: [], skillDetails: [], description: `Apply for ${targetRole} roles on ZyncJobs.`, milestones: ['Land your target role'], certifications: [], salaryRange: '' },
      ],
      certifications: [], salaryProgression: [], marketTrends: [], marketDemand: null, transferableSkills: [],
      finalTip: typeof text === 'string' ? text : 'Stay consistent and keep building.',
    };
  }

  throw new Error('Invalid roadmap response from AI agent');
}

// Generic AI call — CareerCoach, Recruiter backend fallback
export async function callAIWithFallback(
  messages: ChatMessage[],
  systemPrompt: string,
  signal?: AbortSignal
): Promise<string> {
  return sendAIMessage(messages, systemPrompt, signal, 600);
}

// Build rich user context from localStorage for Career Mentor
export function buildUserContext(): Record<string, unknown> {
  try {
    const u = JSON.parse(localStorage.getItem('user') || '{}');
    const resumeStore = JSON.parse(localStorage.getItem('zyncjobs-resume-builder') || '{}');
    const resumeData = resumeStore?.state?.data || {};
    // Resume builder stores skills as {name, level} objects — extract name only
    const resumeSkills: string[] = (resumeData.skills || []).map((s: any) =>
      typeof s === 'string' ? s : (s?.name || '')
    ).filter(Boolean);
    const skills: string[] = [
      ...(u.skills || []),
      ...resumeSkills,
    ].filter((s, i, a) => s && a.indexOf(s) === i).slice(0, 15);
    return {
      user_name: u.name || u.fullName || '',
      current_role: u.jobTitle || u.currentRole || '',
      target_role: u.targetRole || u.careerGoal || '',
      skills,
      experience_years: u.experience || u.yearsOfExperience || '',
      ats_score: u.atsScore || null,
      applications_count: u.applicationsCount || null,
      missing_skills: u.missingSkills || [],
      location: u.location || '',
    };
  } catch {
    return {};
  }
}
