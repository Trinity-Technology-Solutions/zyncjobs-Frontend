import { useEffect, useRef, useState } from 'react';
import { Sparkles, X, Check, ChevronRight, AlertTriangle, Lightbulb, Loader2 } from 'lucide-react';
import { useResumeStore } from '../../store/useResumeStore';
import { executeResumeAI } from '../../services/resumeAIClient';

interface Suggestion {
  id: string;
  section: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  fix: string;
}

const ACTION_VERB = /^(?:led|built|designed|developed|improved|enhanced|strengthened|boosted|increased|reduced|managed|delivered|implemented|optimized|optimised|spearheaded|engineered|created|launched|architected|analyzed|analysed|tested|supported|maintained|coordinated|automated|resolved|conducted|performed|wrote|configured|deployed|collaborated|assisted|streamlined|transformed|accelerated|integrated|established|executed|generated|secured|monitored|migrated|refactored|trained|authored|administered|facilitated|negotiated|organized|organised|planned|produced|reviewed|validated|troubleshot|upgraded|utilized|utilised|contributed|implemented|responsible for)\b/i;

const startsWithActionVerb = (bullet: string) => ACTION_VERB.test(bullet.trim().replace(/^[\u2022*-]+\s*/, ''));

function analyzeResume(data: any): Suggestion[] {
  const issues: Suggestion[] = [];
  const summary = Array.isArray(data.summary) ? data.summary.filter(Boolean).join(' ') : String(data.summary || '');
  const skills: string[] = Array.isArray(data.skills)
    ? data.skills.filter((skill: unknown) => typeof skill === 'string' && skill.trim())
    : [];
  const experiences = Array.isArray(data.experience) ? data.experience : [];
  const bullets = experiences.flatMap((entry: any) =>
    Array.isArray(entry.bullets)
      ? entry.bullets.filter((bullet: unknown) => typeof bullet === 'string' && bullet.trim())
      : []
  );
  const education = Array.isArray(data.education) ? data.education : [];
  const projects = Array.isArray(data.projects) ? data.projects : [];

  if (!summary.trim()) {
    issues.push({ id: 'summary-missing', section: 'summary', severity: 'error', message: 'Professional summary is missing', fix: 'Add a short summary based on your actual experience and skills.' });
  } else if (summary.trim().length < 60) {
    issues.push({ id: 'summary-short', section: 'summary', severity: 'warning', message: 'Professional summary is very short', fix: 'Add relevant details about your background, strengths, and target role.' });
  }

  if (skills.length < 5) {
    issues.push({ id: 'skills-few', section: 'skills', severity: 'warning', message: `Your resume lists ${skills.length} skill${skills.length === 1 ? '' : 's'}`, fix: 'Review the Skills section and add relevant skills you actually have.' });
  }

  const hasExperience = experiences.some((entry: any) =>
    entry.title?.trim() || entry.company?.trim() || entry.bullets?.some((bullet: string) => bullet.trim())
  );
  if (!hasExperience && !projects.length) {
    issues.push({ id: 'experience-missing', section: 'experience', severity: 'info', message: 'No experience or projects are listed', fix: 'Add relevant employment, internships, volunteering, or projects if applicable.' });
  }

  const incompleteExperienceCount = experiences.filter((entry: any) =>
    (entry.title?.trim() || entry.company?.trim() || entry.bullets?.some((bullet: string) => bullet.trim())) &&
    (!entry.title?.trim() || !entry.company?.trim() || !entry.bullets?.some((bullet: string) => bullet.trim()))
  ).length;
  if (incompleteExperienceCount) {
    issues.push({ id: 'experience-incomplete', section: 'experience', severity: 'warning', message: `${incompleteExperienceCount} experience entr${incompleteExperienceCount === 1 ? 'y is' : 'ies are'} missing a title, company, or description`, fix: 'Review the highlighted experience entries and fill in the details that apply.' });
  }

  if (bullets.length && !bullets.some((bullet: string) => /\b\d+(?:[.,]\d+)?\s*%?\b/.test(bullet))) {
    issues.push({ id: 'experience-metrics', section: 'experience', severity: 'info', message: 'Experience bullets do not include measurable outcomes', fix: 'If you have accurate figures, add them to show scale or impact. Do not estimate or invent metrics.' });
  }

  const weakStarts = bullets.filter((bullet: string) => !startsWithActionVerb(bullet));
  if (weakStarts.length) {
    issues.push({ id: 'experience-action-verbs', section: 'experience', severity: 'warning', message: `${weakStarts.length} experience bullet${weakStarts.length === 1 ? '' : 's'} could start with a clearer action`, fix: 'Start each bullet with what you did, for example: Created, Helped, Organized, or Managed.' });
  }

  if (!education.length) {
    issues.push({ id: 'education-missing', section: 'education', severity: 'info', message: 'No education details are listed', fix: 'Add education details if they are relevant to your background or target role.' });
  } else {
    const incompleteEducationCount = education.filter((entry: any) =>
      (entry.degree?.trim() || entry.institution?.trim()) && (!entry.degree?.trim() || !entry.institution?.trim())
    ).length;
    if (incompleteEducationCount) {
      issues.push({ id: 'education-incomplete', section: 'education', severity: 'warning', message: `${incompleteEducationCount} education entr${incompleteEducationCount === 1 ? 'y is' : 'ies are'} missing a degree or institution`, fix: 'Review each listed qualification and add its degree or institution name.' });
    }
  }

  if (experiences.length && !projects.length) {
    issues.push({ id: 'projects-missing', section: 'projects', severity: 'info', message: 'No projects are listed', fix: 'Add a relevant project if it helps show work that is not covered by your experience.' });
  }

  return issues;
}

export default function AISuggestionsPanel({ onClose, onNavigate }: { onClose: () => void; onNavigate?: (section: string) => void }) {
  const data = useResumeStore(state => state.data);
  const update = useResumeStore(state => state.update);
  const updateExperience = useResumeStore(state => state.updateExperience);
  const [suggestions, setSuggestions] = useState<Suggestion[]>(() => analyzeResume(useResumeStore.getState().data));
  const [recheckMessage, setRecheckMessage] = useState('');
  const [fixingId, setFixingId] = useState<string | null>(null);
  const [fixError, setFixError] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);

  // Re-evaluate the current resume after every edit, so resolved suggestions disappear.
  useEffect(() => {
    setSuggestions(analyzeResume(data));
  }, [data]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  const recheck = () => {
    const currentSuggestions = analyzeResume(useResumeStore.getState().data);
    setSuggestions(currentSuggestions);
    setRecheckMessage(
      currentSuggestions.length === 0
        ? 'Check complete — no current issues found.'
        : `Check complete — ${currentSuggestions.length} current suggestion${currentSuggestions.length === 1 ? '' : 's'} found.`
    );
  };
  const hasSourceDetails = Boolean(
    data.skills?.some(skill => skill.trim()) ||
    data.experience?.some(item => item.title?.trim() || item.company?.trim() || item.bullets?.some(bullet => bullet.trim())) ||
    data.education?.some(item => item.degree?.trim() || item.institution?.trim()) ||
    data.projects?.some(item => item.name?.trim() || item.bullets?.some(bullet => bullet.trim())) ||
    data.certifications?.some(item => item.name?.trim()) ||
    data.achievements?.some(item => item.title?.trim() || item.description?.trim())
  );
  const skillsEvidence = [
    data.summary,
    ...data.experience.flatMap(item => [item.title, item.company, ...item.bullets]),
    ...data.education.flatMap(item => [item.degree, item.fieldOfStudy, item.institution, item.board, item.description]),
    ...data.projects.flatMap(item => [item.name, item.role, ...item.bullets]),
    ...data.certifications.flatMap(item => [item.name, item.issuer]),
    ...data.achievements.flatMap(item => [item.title, item.description]),
    ...data.customSections.flatMap(item => [item.heading, item.content]),
  ].filter((value): value is string => typeof value === 'string' && !!value.trim()).join(' ');
  const canAutoFix = (suggestion: Suggestion) =>
    suggestion.id === 'summary-short' ||
    (suggestion.id === 'summary-missing' && hasSourceDetails) ||
    (suggestion.id === 'skills-few' && !!skillsEvidence) ||
    suggestion.id === 'experience-action-verbs';

  const cleanGeneratedText = (value: string) => value
    .replace(/^```(?:\w+)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .replace(/^(?:professional summary|revised summary|improved bullet)\s*:\s*/i, '')
    .replace(/^[\u2022*-]+\s*/, '')
    .replace(/^['"`]|['"`]$/g, '')
    .trim();

  const autoFix = async (suggestion: Suggestion) => {
    setFixError('');
    setRecheckMessage('');
    setFixingId(suggestion.id);
    try {
      if (suggestion.id === 'summary-short' || suggestion.id === 'summary-missing') {
        const currentSummary = Array.isArray(data.summary) ? data.summary.filter(Boolean).join(' ') : String(data.summary || '');
        const response = await executeResumeAI({
          section: 'summary',
          action: 'rewrite',
          content: `Write one concise, polished professional summary in 2-3 sentences, using only the candidate facts already present in the full profile and current summary. Preserve true employers, job titles, skills, education, and achievements. Do not invent experience, years, metrics, qualifications, or tools. Do not add a heading or options. Current summary: ${currentSummary || '(missing)'}`,
        });
        const revisedSummary = cleanGeneratedText(response.result || '');
        if (!revisedSummary || revisedSummary.length < 40) throw new Error('AI did not return a usable summary.');
        update('summary', revisedSummary);
      } else if (suggestion.id === 'skills-few') {
        const response = await executeResumeAI({
          section: 'skills',
          action: 'find_missing',
          content: `Extract up to 12 distinct professional skills that are explicitly written in the evidence text below and are not already in the current skills list. Only return a JSON array of exact skill names copied from the evidence. Do not infer, expand, or invent skills.\nCurrent skills: ${data.skills.join(', ')}\nEvidence text: ${skillsEvidence}`,
        });
        const raw = cleanGeneratedText(response.result || '').replace(/^(?:skills?|missing skills)\s*:\s*/i, '');
        let proposedSkills: string[] = [];
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) proposedSkills = parsed.filter((item): item is string => typeof item === 'string');
        } catch {
          proposedSkills = raw.split(/[,;\n]/).map(item => item.trim());
        }
        const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9+#.]+/g, ' ').trim().replace(/\s+/g, ' ');
        const evidence = ` ${normalize(skillsEvidence)} `;
        const existing = new Set(data.skills.map(normalize));
        const verifiedSkills = proposedSkills
          .map(skill => skill.trim().replace(/^['"`]|['"`]$/g, ''))
          .filter(skill => {
            const normalized = normalize(skill);
            return normalized.length > 1 && !existing.has(normalized) && evidence.includes(` ${normalized} `);
          })
          .filter((skill, index, all) => all.findIndex(other => normalize(other) === normalize(skill)) === index)
          .slice(0, 12);
        if (verifiedSkills.length === 0) throw new Error('No additional skills could be verified in your resume text. Add only skills you actually have.');
        update('skills', [...data.skills, ...verifiedSkills]);
      } else if (suggestion.id === 'experience-action-verbs') {
        const affected = data.experience.flatMap(item => item.bullets
          .map((bullet, index) => ({ item, bullet, index }))
          .filter(({ bullet }) => bullet.trim() && !startsWithActionVerb(bullet)));
        const updates = new Map<string, string[]>();
        for (const { item, bullet, index } of affected) {
          const response = await executeResumeAI({
            section: 'experience',
            action: 'improve',
            experienceId: item.id,
            content: `Rewrite this one existing resume bullet so its first word is one clear past-tense action verb such as Built, Developed, Improved, Enhanced, Managed, Designed, Implemented, or Supported. Preserve its factual meaning and scope. Do not add metrics, outcomes, tools, responsibilities, or claims. Return only the rewritten bullet with no heading or bullet symbol.\nOriginal bullet: ${bullet}`,
          });
          const revisedBullet = cleanGeneratedText(response.result || '');
          if (!revisedBullet || revisedBullet.length < 8 || !startsWithActionVerb(revisedBullet)) {
            throw new Error('The AI couldn’t improve this bullet safely. Please try again, or edit it to start with what you did, such as “Created,” “Helped,” or “Managed.”');
          }
          const latestItem = useResumeStore.getState().data.experience.find(entry => entry.id === item.id);
          if (!latestItem) continue;
          const nextBullets = [...(updates.get(item.id) || latestItem.bullets)];
          nextBullets[index] = revisedBullet;
          updates.set(item.id, nextBullets);
        }
        updates.forEach((nextBullets, id) => updateExperience(id, 'bullets', nextBullets));
      }
      const latestSuggestions = analyzeResume(useResumeStore.getState().data);
      setSuggestions(latestSuggestions);
      const stillPresent = latestSuggestions.some(item => item.id === suggestion.id);
      setRecheckMessage(stillPresent
        ? 'The resume was updated, but this check still finds an issue. Review the affected details or try Auto-fix again.'
        : 'Fixed. This check no longer finds the issue.');
    } catch (error) {
      setFixError(error instanceof Error ? error.message : 'Could not apply this fix. Please try again.');
    } finally {
      setFixingId(null);
    }
  };
  const errors = suggestions.filter(suggestion => suggestion.severity === 'error').length;
  const recommendations = suggestions.length - errors;
  const iconMap = {
    error: <AlertTriangle className="w-4 h-4 text-red-500" />,
    warning: <Lightbulb className="w-4 h-4 text-amber-500" />,
    info: <Sparkles className="w-4 h-4 text-blue-500" />,
  };

  return (
    <div ref={panelRef} className="w-full max-w-sm sm:w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col">
      <div className="px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-bold">AI Suggestions</span>
          </div>
          <button type="button" onClick={onClose} className="p-0.5 hover:bg-white/20 rounded transition-colors" aria-label="Close suggestions"><X className="w-4 h-4" /></button>
        </div>
        <p className="text-[10px] text-white/80 mt-1">
          {errors > 0 && <span className="font-semibold text-red-200">{errors} issues</span>}
          {errors > 0 && recommendations > 0 && <span> &amp; </span>}
          {recommendations > 0 && <span className="font-semibold text-amber-200">{recommendations} suggestions</span>}
        </p>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {suggestions.length === 0 ? (
          <div className="py-8 text-center text-sm text-green-600">
            <Check className="w-8 h-8 mx-auto mb-2 text-green-500" />
            No current issues found in your resume.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {suggestions.map(suggestion => (
              <div key={suggestion.id} className="px-4 py-3">
                <div className="flex items-start gap-2">
                  <div className="mt-0.5 shrink-0">{iconMap[suggestion.severity]}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800">{suggestion.message}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{suggestion.fix}</p>
                  </div>
                </div>
                {canAutoFix(suggestion) ? (
                  <div className="flex items-center gap-2 mt-2 ml-6">
                    <button
                      type="button"
                      disabled={!!fixingId}
                      onClick={() => autoFix(suggestion)}
                      className="text-[10px] font-medium text-purple-600 hover:text-purple-800 disabled:cursor-wait disabled:opacity-60 flex items-center gap-1"
                    >
                      {fixingId === suggestion.id ? <><Loader2 className="w-3 h-3 animate-spin" /> Fixing...</> : <>Auto-fix <Sparkles className="w-3 h-3" /></>}
                    </button>
                  </div>
                ) : onNavigate && (
                  <div className="flex items-center gap-2 mt-2 ml-6">
                    <button
                      type="button"
                      onClick={event => {
                        event.preventDefault();
                        event.stopPropagation();
                        onNavigate(suggestion.section);
                      }}
                      className="text-[10px] font-medium text-purple-600 hover:text-purple-800 flex items-center gap-0.5"
                    >
                      Add details <ChevronRight className="w-2.5 h-2.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {suggestions.length > 0 && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
          <button type="button" onClick={recheck} className="w-full py-2 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100">
            Re-check resume
          </button>
          {recheckMessage && <p role="status" aria-live="polite" className="mt-2 text-center text-[10px] text-gray-500">{recheckMessage}</p>}
          {fixError && <p role="alert" className="mt-2 text-center text-[10px] text-red-600">{fixError}</p>}
        </div>
      )}
    </div>
  );
}
