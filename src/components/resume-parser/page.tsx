"use client";
import { useState, useEffect, useRef, type ReactNode } from "react";
import { readPdf } from "../../lib/parse-resume-from-pdf/read-pdf";
import { ResumeDropzone } from "../ResumeDropzone";
import MistralJobRecommendations from "../MistralJobRecommendations";
import CandidateRanking from "../CandidateRanking";
import CandidateComparison from "../CandidateComparison";
import { parseResumeFromText, type AIParseStatus } from "./parseLogic";
import { tokenStorage } from '../../utils/tokenStorage';
import type { ParsedResume } from "./parseLogic";
import AutocompleteCombobox from '../AutocompleteCombobox';
import { AIProgressLoader } from "../AIProgressLoader";
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
import { updateUserInStorage } from '../../utils/userStorage';

// ── Column-aware PDF text extractor ─────────────────────────────────────────
// For 2-column resumes, groups items by column (left/right) using X midpoint,
// then outputs left column fully before right column so section headings stay intact.
function convertTextItemsToText(items: { text: string; x: number; y: number; page: number }[]): string {
  if (!items.length) return '';

  // Group by page
  const pages = new Map<number, typeof items>();
  for (const item of items) {
    if (!pages.has(item.page)) pages.set(item.page, []);
    pages.get(item.page)!.push(item);
  }

  const pageTexts: string[] = [];

  for (const [, pageItems] of [...pages.entries()].sort((a, b) => a[0] - b[0])) {
    const xs = pageItems.map(i => i.x);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const midX = (minX + maxX) / 2;

    // Detect if truly 2-column: check if items are spread across both halves
    const leftItems = pageItems.filter(i => i.x < midX);
    const rightItems = pageItems.filter(i => i.x >= midX);
    // Sort both by Y before gap detection
    const sortByY = (a: typeof items[0], b: typeof items[0]) => b.y - a.y;
    leftItems.sort(sortByY);
    rightItems.sort(sortByY);
    // Two-column: both sides have content AND there's a clear horizontal gap
    const leftMaxX = leftItems.length ? Math.max(...leftItems.map(i => i.x + ((i as any).width ?? 0))) : 0;
    const rightMinX = rightItems.length ? Math.min(...rightItems.map(i => i.x)) : 0;
    const gap = rightMinX - leftMaxX;
    const pageWidth = maxX - minX;
    const isTwoColumn = leftItems.length > 5 && rightItems.length > 5 && gap > pageWidth * 0.05;

    if (isTwoColumn) {
      const leftText = leftItems.map(i => i.text).join('\n');
      const rightText = rightItems.map(i => i.text).join('\n');
      pageTexts.push(leftText + '\n' + rightText);
    } else {
      // Single column — sort top-to-bottom
      pageTexts.push(pageItems.sort((a, b) => b.y - a.y).map(i => i.text).join('\n'));
    }
  }

  return pageTexts.join('\n');
}


interface ResumeParserProps {
  onNavigate?: (page: string, data?: any) => void;
  user?: any;
}

const emptyResume: ParsedResume = {
  profile: { name: '', email: '', phone: '', location: '' },
  skills: { featuredSkills: [] },
  workExperiences: [],
  educations: [],
};

// ── Parsed Results Card UI ──────────────────────────────────────────────────

const icons = {
  user: "M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z",
  email: "M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75",
  phone: "M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z",
  location: "M15 10.5a3 3 0 11-6 0 3 3 0 016 0zM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 0115 0z",
  link: "M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m1.875-1.875a4.5 4.5 0 01-1.242-7.244l4.5-4.5a4.5 4.5 0 016.364 6.364l-1.757 1.757",
  edu: "M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342",
  calendar: "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5",
  star: "M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z",
  work: "M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0",
  projects: "M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605",
  skills: "M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z",
  cert: "M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982 3.172M9.497 14.25a7.454 7.454 0 00.981 3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0016.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.023 6.023 0 01-2.77.896m0 0a6.023 6.023 0 01-2.77-.896",
  competition: "M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z",
  starSmall: "M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z",
  sparkle: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z",
  warning: "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z",
};
function SvgIcon({ name, className = "w-4 h-4" }: { name: keyof typeof icons; className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d={icons[name]} />
    </svg>
  );
}

function SectionCard({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="mb-3 rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <span className="flex items-center gap-2 font-semibold text-gray-800 text-sm">
          {icon}{title}
        </span>
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="px-4 py-3">{children}</div>}
    </div>
  );
}

function InfoRow({ label, value }: { label: string | ReactNode; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex gap-2 py-1 text-sm">
      <span className="text-gray-400 w-20 shrink-0">{label}</span>
      <span className="text-gray-800 font-medium break-all">{value}</span>
    </div>
  );
}

function ParsedResultsTable({ resume }: { resume: ParsedResume }) {
  const r = resume as any;
  const hasContent = resume.profile.name || resume.profile.email || resume.educations.length > 0 || resume.workExperiences.length > 0;
  if (!hasContent) return null;

  return (
    <div className="space-y-1">
      {/* Profile */}
      <SectionCard title="Profile" icon={<SvgIcon name="user" />}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg shrink-0">
            {(resume.profile.name || '?')[0].toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-gray-900">{resume.profile.name || '—'}</div>
            {r.summary && <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">{r.summary}</div>}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-0.5 text-sm">
          <InfoRow label={<><SvgIcon name="email" className="w-3.5 h-3.5 inline mr-1" />Email</>} value={resume.profile.email} />
          <InfoRow label={<><SvgIcon name="phone" className="w-3.5 h-3.5 inline mr-1" />Phone</>} value={resume.profile.phone} />
          <InfoRow label={<><SvgIcon name="location" className="w-3.5 h-3.5 inline mr-1" />Location</>} value={resume.profile.address?.city || resume.profile.location} />
          <InfoRow label={<><SvgIcon name="link" className="w-3.5 h-3.5 inline mr-1" />Link</>} value={resume.profile.url} />
        </div>
      </SectionCard>

      {/* Education */}
      {resume.educations.length > 0 && (
        <SectionCard title="Education" icon={<SvgIcon name="edu" />}>
          <div className="space-y-3">
            {resume.educations.map((edu: any, i: number) => (
              <div key={i} className={`${i > 0 ? 'pt-3 border-t border-gray-100' : ''}`}>
                <div className="font-medium text-gray-900 text-sm">{edu.school || '—'}</div>
                <div className="text-blue-600 text-xs font-medium mt-0.5">{edu.degree}</div>
                <div className="flex gap-3 mt-1 text-xs text-gray-500">
                  {edu.date && <span><SvgIcon name="calendar" className="w-3.5 h-3.5 inline mr-0.5" />{edu.date}</span>}
                  {edu.gpa && <span><SvgIcon name="starSmall" className="w-3.5 h-3.5 inline mr-0.5 text-yellow-500" />{edu.gpa}</span>}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Work Experience */}
      {resume.workExperiences.length > 0 && (
        <SectionCard title="Work Experience" icon={<SvgIcon name="work" />}>
          <div className="space-y-4">
            {resume.workExperiences.map((exp: any, i: number) => (
              <div key={i} className={`${i > 0 ? 'pt-3 border-t border-gray-100' : ''}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-medium text-gray-900 text-sm">{exp.jobTitle || '—'}</div>
                    <div className="text-blue-600 text-xs font-medium">{exp.company}</div>
                  </div>
                  {exp.date && <span className="text-xs text-gray-400 whitespace-nowrap shrink-0 bg-gray-50 px-2 py-0.5 rounded-full">{exp.date}</span>}
                </div>
                {exp.descriptions?.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {exp.descriptions.slice(0, 3).map((d: string, j: number) => (
                      <li key={j} className="text-xs text-gray-600 flex gap-1.5"><span className="text-gray-300 shrink-0">•</span>{d}</li>
                    ))}
                    {exp.descriptions.length > 3 && <li className="text-xs text-gray-400">+{exp.descriptions.length - 3} more</li>}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Projects */}
      {r.projects?.length > 0 && (
        <SectionCard title="Projects" icon={<SvgIcon name="projects" />}>
          <div className="space-y-3">
            {r.projects.map((proj: any, i: number) => (
              <div key={i} className={`${i > 0 ? 'pt-3 border-t border-gray-100' : ''}`}>
                <div className="font-medium text-gray-900 text-sm">{proj.name}</div>
                {proj.date && <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-0.5"><SvgIcon name="calendar" className="w-3.5 h-3.5" />{proj.date}</div>}
                {(proj.descriptions?.length > 0 || proj.description) && (
                  <ul className="mt-1.5 space-y-1">
                    {(proj.descriptions?.length > 0 ? proj.descriptions : [proj.description]).slice(0, 2).map((d: string, j: number) => (
                      <li key={j} className="text-xs text-gray-600 flex gap-1.5"><span className="text-gray-300 shrink-0">•</span>{d}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Skills */}
      {(resume.skills.featuredSkills.length > 0 || r.softSkills?.length > 0 || r.tools?.length > 0) && (
        <SectionCard title="Skills" icon={<SvgIcon name="skills" />}>
          {resume.skills.featuredSkills.length > 0 && (
            <div className="mb-2">
              <div className="text-xs text-gray-400 mb-1.5 font-medium">Technical</div>
              <div className="flex flex-wrap gap-1.5">
                {resume.skills.featuredSkills.map((s: any, i: number) => (
                  <span key={i} className="bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full text-xs font-medium">{s.skill}</span>
                ))}
              </div>
            </div>
          )}
          {r.softSkills?.length > 0 && (
            <div className="mb-2">
              <div className="text-xs text-gray-400 mb-1.5 font-medium">Soft Skills</div>
              <div className="flex flex-wrap gap-1.5">
                {r.softSkills.map((s: string, i: number) => (
                  <span key={i} className="bg-green-50 text-green-700 border border-green-100 px-2 py-0.5 rounded-full text-xs font-medium">{s}</span>
                ))}
              </div>
            </div>
          )}
          {r.tools?.length > 0 && (
            <div>
              <div className="text-xs text-gray-400 mb-1.5 font-medium">Tools</div>
              <div className="flex flex-wrap gap-1.5">
                {r.tools.map((t: string, i: number) => (
                  <span key={i} className="bg-gray-100 text-gray-700 border border-gray-200 px-2 py-0.5 rounded-full text-xs font-medium">{t}</span>
                ))}
              </div>
            </div>
          )}
        </SectionCard>
      )}

      {/* Certifications */}
      {r.certifications?.length > 0 && (
        <SectionCard title="Certifications" icon={<SvgIcon name="cert" />}>
          <div className="space-y-2">
            {r.certifications.map((cert: any, i: number) => (
              <div key={i} className="flex items-start gap-2">
                <SvgIcon name="starSmall" className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
                <div>
                  <div className="text-sm font-medium text-gray-800">{cert.name}</div>
                  <div className="text-xs text-gray-400">{[cert.provider, cert.date].filter(Boolean).join(' · ')}</div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Competitions */}
      {r.competitions?.length > 0 && (
        <SectionCard title="Competitions" icon={<SvgIcon name="competition" />}>
          <ul className="space-y-1">
            {r.competitions.map((c: string, i: number) => (
              <li key={i} className="text-sm text-gray-700 flex gap-2"><span className="text-gray-300">•</span>{c}</li>
            ))}
          </ul>
        </SectionCard>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function ResumeParser({ onNavigate, user }: ResumeParserProps = {}) {
  const [fileUrl, setFileUrl] = useState('');
  const [currentFileName, setCurrentFileName] = useState('');
  const uploadedFileRef = useRef<File | null>(null);
  const [resume, setResume] = useState<ParsedResume>(emptyResume);
  const [rawText, setRawText] = useState('');
  const [isFileUploaded, setIsFileUploaded] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [aiStatus, setAiStatus] = useState<{ status: AIParseStatus; detail?: string } | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [availableJobs, setAvailableJobs] = useState<any[]>([]);
  const [totalJobsCount, setTotalJobsCount] = useState(0);
  const [matchingScore, setMatchingScore] = useState<any>(null);
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState({ minScore: 0, skills: '', location: '' });
  const [uploadedCandidates, setUploadedCandidates] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.type === 'employer') {
      fetchEmployerJobs();
    } else {
      // For candidates, fetch all jobs to show accurate counts in smart matching
      fetchAllJobsForCandidates();
    }
  }, [user]);

  const fetchAllJobsForCandidates = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/jobs`);
      if (response.ok) {
        const jobs = await response.json();
        setTotalJobsCount(jobs.length);
        setAvailableJobs(jobs); // Store all jobs for skill matching calculations
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  const fetchEmployerJobs = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/jobs`);
      if (response.ok) {
        const jobs = await response.json();
        setTotalJobsCount(jobs.length); // Track total jobs for smart matching
        const employerJobs = jobs.filter((job: any) => job.postedBy === user?.email);
        setAvailableJobs(employerJobs);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  const handleBulkUpload = async (files: FileList) => {
    const candidates: any[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        let text = '';
        if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
          const url = URL.createObjectURL(file);
          const textItems = await readPdf(url);
          if (textItems.length > 0) {
            text = convertTextItemsToText(textItems);
          } else {
            text = await uploadToBackendOcr(file);
          }
        } else {
          // DOCX, DOC, images — backend extraction
          text = await uploadToBackendOcr(file);
        }
        const parsed = await parseResumeFromText(text);
        candidates.push({
          id: `candidate-${Date.now()}-${i}`,
          fileName: file.name,
          resume: parsed,
          matchScore: selectedJob ? calculateMatchingScore(parsed, selectedJob) : null
        });
      } catch (error) {
        console.error(`Error processing ${file.name}:`, error);
      }
    }
    setUploadedCandidates(prev => [...prev, ...candidates]);
  };

  const getFilteredAndRankedCandidates = () => {
    return uploadedCandidates
      .filter(candidate => {
        if (!candidate.matchScore) return true;
        
        const meetsMinScore = candidate.matchScore.overall >= filterCriteria.minScore;
        const hasSkill = !filterCriteria.skills || 
          candidate.resume.skills.featuredSkills.some((s: any) => 
            (s.skill as string).toLowerCase().includes(filterCriteria.skills.toLowerCase())
          );
        const hasLocation = !filterCriteria.location ||
          candidate.resume.profile.location.toLowerCase().includes(filterCriteria.location.toLowerCase());
          
        return meetsMinScore && hasSkill && hasLocation;
      })
      .sort((a, b) => {
        if (!a.matchScore || !b.matchScore) return 0;
        return b.matchScore.overall - a.matchScore.overall;
      });
  };
  const calculateMatchingScore = (resume: any, job: any) => {
    if (!job || !resume) return null;

    // Skills matching — exact word match to avoid false positives
    const resumeSkills = resume.skills.featuredSkills.map((s: any) => s.skill.toLowerCase());
    const jobSkills = (job.skills || []).map((s: string) => s.toLowerCase());
    const skillMatches = jobSkills.filter((skill: string) =>
      resumeSkills.some((rSkill: string) => {
        const rWords = rSkill.split(/[\s/,.+-]+/);
        const jWords = skill.split(/[\s/,.+-]+/);
        return rWords.some(rw => jWords.includes(rw)) || rSkill === skill;
      })
    );
    const skillScore = jobSkills.length > 0 ? (skillMatches.length / jobSkills.length) * 100 : 0;

    // Experience matching
    const resumeExp = (resume.workExperiences[0] as any)?.jobTitle?.toLowerCase() || '';
    const jobTitle = (job as any).jobTitle?.toLowerCase() || '';
    const expScore = resumeExp.includes(jobTitle.split(' ')[0]) || jobTitle.includes(resumeExp.split(' ')[0]) ? 80 : 40;

    // Location matching
    const resumeLocation = resume.profile.location?.toLowerCase() || '';
    const jobLocation = job.location?.toLowerCase() || '';
    const locationScore = resumeLocation.includes(jobLocation) || jobLocation.includes(resumeLocation) || jobLocation.includes('remote') ? 100 : 60;

    // Overall score
    const overallScore = Math.round((skillScore * 0.5) + (expScore * 0.3) + (locationScore * 0.2));

    return {
      overall: overallScore,
      skills: Math.round(skillScore),
      experience: expScore,
      location: locationScore,
      skillMatches,
      missingSkills: jobSkills.filter((skill: string) => !skillMatches.includes(skill))
    };
  };

  async function uploadToBackendOcr(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('resume', file);
    const token = tokenStorage.getAccess();
    const res = await fetch(`${API_BASE_URL}/resume/extract-text`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const raw = body?.error || '';
      const friendly =
        raw.toLowerCase().includes('unexpected field') ? 'File upload failed. Please try again.' :
        raw.toLowerCase().includes('file too large') ? 'File is too large. Please upload a file under 10 MB.' :
        raw.toLowerCase().includes('only pdf') || raw.toLowerCase().includes('not allowed') ? 'Unsupported file type. Please upload a PDF, DOCX, JPG, or PNG.' :
        raw || `Upload failed (${res.status}). Please try again.`;
      throw new Error(friendly);
    }
    const json = await res.json();
    if (!json.success || !json.text) throw new Error('Could not extract text from the file. Please try a different file.');
    return json.text;
  }

  useEffect(() => {
    if (!fileUrl) return;
   async function parseResume() {
     setParsing(true);
     try {
       setParseError(null);
       const file = uploadedFileRef.current;
       if (!file) throw new Error('No file selected');
       const isImage = /\.(jpg|jpeg|png|webp|bmp|tiff|tif)$/i.test(file.name);
        const isDocx = /\.(docx|doc)$/i.test(file.name);
        let text = '';
        let textItems: any[] = [];
        if (isImage || isDocx) {
          // Images and DOCX — send to backend for extraction
          text = await uploadToBackendOcr(file);
        } else {
          // PDF — try client-side extraction first
          textItems = await readPdf(fileUrl);
          if (textItems.length > 0) {
            text = convertTextItemsToText(textItems);
          } else {
            // Scanned PDF — fall back to backend OCR
            text = await uploadToBackendOcr(file);
          }
        }
         setRawText(text);
        const parsed = await parseResumeFromText(text, (status, detail) => setAiStatus({ status, detail }));
        setResume(parsed);
       setIsFileUploaded(true);
       if (selectedJob) {
         setMatchingScore(calculateMatchingScore(parsed, selectedJob));
       }
     } catch (e: any) {
       const isTimeout = e?.name === 'AbortError';
       setParseError(e?.message || (isTimeout ? 'AI timeout. Using local parser.' : 'Failed to parse resume. Please try a different file.'));
       setResume(emptyResume);
       setIsFileUploaded(false);
       setAiStatus(null);
       setMatchingScore(null);
     } finally {
       setParsing(false);
     }
    }
    parseResume();
  }, [fileUrl]);

  return (
    <div className="max-w-screen-2xl mx-auto p-6">
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 mb-3">
          <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          <span className="text-xs font-semibold text-blue-600 tracking-wide">AI Powered</span>
        </div>
        <h1 style={{ fontSize: '32px', fontWeight: 700, letterSpacing: '-0.5px' }} className="text-gray-900 mb-2">
          AI Resume Analysis
        </h1>
        <p style={{ fontSize: '16px', color: '#6B7280', maxWidth: '600px' }}>
          {user?.type === 'employer'
            ? 'Upload candidate resumes to get instant insights, skill analysis, and job matching recommendations.'
            : 'Upload your resume to get instant insights, skill analysis, and job matching recommendations.'
          }
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {user?.type === 'employer' ? 'Upload Candidate Resume' : 'Upload Resume'}
          </h2>
          
          {/* Job Selection for Employers */}
          {user?.type === 'employer' && (
            <div className="mb-6">
              <AutocompleteCombobox
                label="Select Job Position for Screening"
                value={selectedJob?._id || ''}
                onChange={(val) => {
                  const job = availableJobs.find(j => j._id === val);
                  setSelectedJob(job);
                  if (job && resume.profile.name) {
                    const score = calculateMatchingScore(resume, job);
                    setMatchingScore(score);
                  }
                }}
                options={availableJobs.map((job) => ({
                  value: job._id,
                  label: `${job.jobTitle} - ${job.company}`,
                }))}
                placeholder="Choose a job position..."
              />
            </div>
          )}
          
          {/* Bulk Upload for Employers */}
          {user?.type === 'employer' && (
            <div className="mb-6">
              <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                Bulk Resume Upload
              </h3>
              <input
                type="file"
                multiple
                accept=".pdf,.docx,.doc,.jpg,.jpeg,.png,.webp"
                onChange={(e) => e.target.files && handleBulkUpload(e.target.files)}
                className="w-full border border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors"
              />
              <p className="text-sm text-gray-500 mt-2">Select multiple PDF, DOCX, or image resumes to upload and analyze</p>
            </div>
          )}
          
          {fileUrl && currentFileName && /\.pdf$/i.test(currentFileName) && (
            <div className="border border-gray-200 rounded-lg overflow-hidden mb-6">
              <iframe src={`${fileUrl}#navpanes=0&zoom=75`} className="w-full h-[800px]" title="Resume Preview" />
            </div>
          )}
          {fileUrl && currentFileName && /\.(jpg|jpeg|png|webp|bmp|tiff|tif)$/i.test(currentFileName) && (
            <div className="border border-gray-200 rounded-lg overflow-hidden mb-6">
              <img src={fileUrl} alt="Resume Preview" className="w-full h-auto max-h-[800px] object-contain" />
            </div>
          )}
          
          <div className="mt-3">
            <ResumeDropzone
              onFileUrlChange={(fileUrl, file?: File) => {
                if (file) { setCurrentFileName(file.name); uploadedFileRef.current = file; }
                setFileUrl(fileUrl || '');
              }}
              playgroundView={true}
            />
          </div>
        </div>

        {/* Results Section */}
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 overflow-y-auto" style={{ maxHeight: '90vh' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Parsed Information</h2>
            {aiStatus && (
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold flex items-center gap-1 ${
                aiStatus.status === 'ai' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
              }`} title={aiStatus.detail || ''}>
                {aiStatus.status === 'ai' ? <><SvgIcon name="sparkle" className="w-3 h-3" /> AI parsed</> : <><SvgIcon name="warning" className="w-3 h-3" /> Local{aiStatus.detail ? ` — ${aiStatus.detail}` : ''}</>}
              </span>
            )}
          </div>
          
          {parsing && (
            <AIProgressLoader fileName={currentFileName} />
          )}

          {parseError && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 mb-1">
                <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
                <p className="font-medium text-sm">Parse Error</p>
              </div>
              <p className="text-sm ml-6">{parseError}</p>
            </div>
          )}

          {!parsing && !isFileUploaded && !parseError && (
            <p className="text-gray-400 text-sm text-center py-8">Upload a PDF, DOCX, or image resume to see parsed information here.</p>
          )}
          
          {/* Matching Score for Employers */}
          {user?.type === 'employer' && selectedJob && matchingScore && (
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-xl border border-blue-100">
              <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Job Match Analysis
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${
                    matchingScore.overall >= 80 ? 'text-green-600' :
                    matchingScore.overall >= 60 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {matchingScore.overall}%
                  </div>
                  <div className="text-sm text-gray-600">Overall Match</div>
                </div>
                <div className="text-center">
                  <div className={`text-xl font-semibold ${
                    matchingScore.skills >= 70 ? 'text-green-600' :
                    matchingScore.skills >= 50 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {matchingScore.skills}%
                  </div>
                  <div className="text-sm text-gray-600">Skills Match</div>
                </div>
                <div className="text-center">
                  <div className={`text-xl font-semibold ${
                    matchingScore.experience >= 70 ? 'text-green-600' :
                    matchingScore.experience >= 50 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {matchingScore.experience}%
                  </div>
                  <div className="text-sm text-gray-600">Experience</div>
                </div>
                <div className="text-center">
                  <div className={`text-xl font-semibold ${
                    matchingScore.location >= 80 ? 'text-green-600' :
                    matchingScore.location >= 60 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {matchingScore.location}%
                  </div>
                  <div className="text-sm text-gray-600">Location</div>
                </div>
              </div>
              
              {/* Matched Skills */}
              {matchingScore.skillMatches.length > 0 && (
                <div className="mb-3">
                  <h4 className="font-medium text-green-700 mb-2 flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Matching Skills
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {matchingScore.skillMatches.map((skill: string, index: number) => (
                      <span key={index} className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Missing Skills */}
              {matchingScore.missingSkills.length > 0 && (
                <div>
                  <h4 className="font-medium text-red-700 mb-2 flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Missing Skills
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {matchingScore.missingSkills.map((skill: string, index: number) => (
                      <span key={index} className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Recommendation */}
              <div className="mt-4 p-3 rounded-lg ${
                matchingScore.overall >= 80 ? 'bg-green-100 text-green-800' :
                matchingScore.overall >= 60 ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }">
                <strong>Recommendation: </strong>
                {matchingScore.overall >= 80 ? 'Strong candidate - Proceed to interview' :
                 matchingScore.overall >= 60 ? 'Good candidate - Consider for next round' :
                 'Weak match - May not be suitable for this role'}
              </div>
            </div>
          )}
          <ParsedResultsTable resume={resume} />
        </div>
      </div>
      
      {/* Candidate Ranking Engine v2 — Hybrid AI + Rule-based */}
      {user?.type === 'employer' && uploadedCandidates.length > 0 && (
        <>
          <CandidateRanking
            candidates={getFilteredAndRankedCandidates()}
            selectedJob={selectedJob}
            onSelectCandidate={(candidateId) => {
              setSelectedCandidates(prev =>
                prev.includes(candidateId)
                  ? prev.filter(id => id !== candidateId)
                  : [...prev, candidateId]
              );
            }}
            selectedCandidates={selectedCandidates}
            filterCriteria={filterCriteria}
            onFilterChange={setFilterCriteria}
          />
            
            {/* Comparison Actions */}
            {selectedCandidates.length > 1 && (
              <div className="mt-4 text-center">
                <button
                  onClick={() => setShowComparison(true)}
                  className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Compare Selected Candidates ({selectedCandidates.length})
                </button>
              </div>
            )}
          </>
      )}
      
      {/* Candidate Comparison Modal */}
      {showComparison && (
        <CandidateComparison
          candidates={uploadedCandidates.filter(c => selectedCandidates.includes(c.id))}
          selectedJob={selectedJob}
          onClose={() => setShowComparison(false)}
        />
      )}
      
      {/* AI Job Recommendations */}
      {isFileUploaded && (
        <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
            AI Job Recommendations for {resume.profile.name}
          </h2>
          <MistralJobRecommendations 
            resumeSkills={resume.skills.featuredSkills.length > 0 ? resume.skills.featuredSkills : []} 
            location={resume.profile.location || ''} 
            experience={(resume.workExperiences[0] as any)?.jobTitle || resume.profile.name || ''}
            onNavigate={(page, data) => {
              if (page === 'job-application' && onNavigate) {
                localStorage.setItem('selectedJob', JSON.stringify(data.job));
                onNavigate('job-application', data);
              }
            }}
          />

          {/* Action Buttons */}
          <div className="mt-8 flex gap-4 justify-center">
            {user?.type === 'employer' ? (
              // Employer Actions
              <>
                <button 
                  onClick={() => onNavigate && onNavigate('candidate-search')}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Find Similar Candidates
                </button>
                <button className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors">
                  Save Candidate Profile
                </button>
                <button className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors">
                  Schedule Interview
                </button>
              </>
            ) : (
              // Candidate Actions
              <>
                <button 
                  onClick={() => onNavigate && onNavigate('job-listings', { tab: 'recommended' })}
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  View All Recommended Jobs
                </button>
                <button 
                  disabled={saving}
                  onClick={async () => {
                    const userData = localStorage.getItem('user');
                    const currentUser = userData ? JSON.parse(userData) : {};

                    if (!currentUser.email) {
                      window.dispatchEvent(new CustomEvent('zync:alert', { detail: { message: 'Please log in to save your profile.', type: 'error' } }));
                      return;
                    }

                    const r = resume as any;
                    const extractYear = (s: string) => String(s || '').match(/\d{4}/)?.[0] || '';

                    // Skills — always use parsed skills if available
                    const parsedSkills = resume.skills.featuredSkills.map((s: any) => s.skill).filter(Boolean);
                    const skills = parsedSkills.length > 0 ? parsedSkills : (currentUser.skills || []);

                    // Employment — always use parsed if available
                    const employment = resume.workExperiences.length > 0
                      ? resume.workExperiences.map((exp: any) => {
                          const dateParts = String(exp.date || '').split(/\s*[-–]\s*/);
                          return {
                            companyName: exp.company || '',
                            designation: exp.jobTitle || '',
                            description: Array.isArray(exp.descriptions) ? exp.descriptions.join(' ') : (exp.description || ''),
                            startYear: extractYear(dateParts[0] || ''),
                            endYear: extractYear(dateParts[1] || ''),
                            currentlyWorking: /present|current/i.test(exp.date || ''),
                          };
                        })
                      : (currentUser.employment || []);

                    // Education — always use parsed if available
                    const firstEdu = resume.educations[0] as any;
                    const educationCollege = firstEdu
                      ? {
                          college: firstEdu.college || firstEdu.school || '',
                          degree: firstEdu.degree || '',
                          passingYear: extractYear(firstEdu.date || firstEdu.year || ''),
                          courseType: 'Full Time',
                          percentage: firstEdu.gpa || firstEdu.percentage || '',
                        }
                      : (currentUser.educationCollege || {});

                    // Projects — always use parsed if available
                    const projects = r.projects?.length > 0
                      ? r.projects.map((pr: any) => ({
                          projectName: pr.name || pr.projectName || '',
                          description: Array.isArray(pr.descriptions) ? pr.descriptions.join(' ') : (pr.description || ''),
                        }))
                      : (currentUser.projects || []);

                    // Certifications — always use parsed if available
                    const certifications = r.certifications?.length > 0
                      ? r.certifications.map((c: any) => ({
                          certificationName: c.name || '',
                          provider: c.provider || '',
                          date: c.date || '',
                        }))
                      : (currentUser.certifications || {});

                    const updatedUser = {
                      ...currentUser,
                      name: resume.profile.name || currentUser.name || '',
                      phone: resume.profile.phone || currentUser.phone || '',
                      location: resume.profile.location || (resume.profile as any).address?.city || currentUser.location || '',
                      jobTitle: resume.workExperiences[0]?.jobTitle || currentUser.jobTitle || '',
                      profileSummary: r.summary?.trim() || currentUser.profileSummary || '',
                      skills,
                      employment,
                      educationCollege,
                      projects,
                      certifications,
                      email: currentUser.email,
                    };

                    updateUserInStorage(updatedUser);
                    setSaving(true);
                    try {
                      const { apiFetch } = await import('../../api/apiFetch');
                      const res = await apiFetch(`${API_BASE_URL}/profile/save`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: currentUser.email, ...updatedUser })
                      });
                      if (!res.ok) {
                        const err = await res.json().catch(() => ({}));
                        throw new Error(err.error || `Server error: ${res.status}`);
                      }
                      updateUserInStorage(updatedUser);
                      window.dispatchEvent(new CustomEvent('zync:alert', { detail: { message: 'Profile updated from resume!' } }));
                      onNavigate && onNavigate('dashboard');
                    } catch (e: any) {
                      console.error('Save error:', e);
                      window.dispatchEvent(new CustomEvent('zync:alert', { detail: { message: e?.message || 'Failed to save profile. Please try again.', type: 'error' } }));
                    } finally {
                      setSaving(false);
                    }
                  }}
                  className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save Profile'}
                </button>
              </>
            )}
          </div>
        </div>
      )}


    </div>
  );
}

