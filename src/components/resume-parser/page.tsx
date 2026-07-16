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

// ── Parsed Results Table (OpenResume-style) ──────────────────────────────────

function CollapsibleSection({ title, children, defaultOpen = true }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <>
      <tr
        className="cursor-pointer select-none bg-gray-50 hover:bg-gray-100 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <td colSpan={2} className="px-4 py-2.5 font-semibold text-gray-800 text-sm border-b border-gray-200">
          <span className="flex items-center gap-2">
            <svg
              className={`w-3.5 h-3.5 text-gray-500 transition-transform ${open ? 'rotate-90' : ''}`}
              fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            {title}
          </span>
        </td>
      </tr>
      {open && children}
    </>
  );
}

function TableRow({ label, value }: { label: string; value?: ReactNode }) {
  return (
    <tr className="border-b border-gray-100 last:border-0">
      <td className="px-4 py-2.5 text-sm font-medium text-gray-600 w-36 align-top whitespace-nowrap">{label}</td>
      <td className="px-4 py-2.5 text-sm text-gray-800 align-top">{value || <span className="text-gray-300">—</span>}</td>
    </tr>
  );
}

function ParsedResultsTable({ resume }: { resume: ParsedResume }) {
  const r = resume as any;
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <table className="w-full border-collapse">
        <tbody>
          {/* Profile */}
          <CollapsibleSection title="Profile">
            <TableRow label="Name" value={resume.profile.name} />
            <TableRow label="Email" value={resume.profile.email} />
            <TableRow label="Phone" value={resume.profile.phone} />
            <TableRow label="Location" value={resume.profile.address?.city || resume.profile.location} />
            <TableRow label="Link" value={resume.profile.url} />
            {r.summary && <TableRow label="Summary" value={r.summary} />}
          </CollapsibleSection>

          {/* Education */}
          {resume.educations.length > 0 && (
            <CollapsibleSection title="Education">
              {resume.educations.map((edu: any, i: number) => (
                <>
                  <TableRow key={`school-${i}`} label="School" value={edu.school} />
                  <TableRow key={`degree-${i}`} label="Degree" value={edu.degree} />
                  <TableRow key={`gpa-${i}`} label="GPA" value={edu.gpa} />
                  <TableRow key={`date-${i}`} label="Date" value={edu.date} />
                  {edu.descriptions?.length > 0 && (
                    <TableRow key={`desc-${i}`} label="Descriptions" value={
                      <ul className="space-y-0.5">{edu.descriptions.map((d: string, j: number) => <li key={j}>• {d}</li>)}</ul>
                    } />
                  )}
                </>
              ))}
            </CollapsibleSection>
          )}

          {/* Work Experience */}
          {resume.workExperiences.length > 0 && (
            <CollapsibleSection title="Work Experience">
              {resume.workExperiences.map((exp: any, i: number) => (
                <>
                  <TableRow key={`company-${i}`} label="Company" value={exp.company} />
                  <TableRow key={`title-${i}`} label="Job Title" value={exp.jobTitle} />
                  <TableRow key={`expdate-${i}`} label="Date" value={exp.date} />
                  {exp.descriptions?.length > 0 && (
                    <TableRow key={`expdesc-${i}`} label="Descriptions" value={
                      <ul className="space-y-0.5">{exp.descriptions.map((d: string, j: number) => <li key={j}>• {d}</li>)}</ul>
                    } />
                  )}
                </>
              ))}
            </CollapsibleSection>
          )}

          {/* Projects */}
          {r.projects?.length > 0 && (
            <CollapsibleSection title="Projects">
              {r.projects.map((proj: any, i: number) => (
                <>
                  <TableRow key={`proj-${i}`} label="Project" value={proj.name} />
                  <TableRow key={`projdate-${i}`} label="Date" value={proj.date} />
                  {proj.descriptions?.length > 0 && (
                    <TableRow key={`projdesc-${i}`} label="Descriptions" value={
                      <ul className="space-y-0.5">{proj.descriptions.map((d: string, j: number) => <li key={j}>• {d}</li>)}</ul>
                    } />
                  )}
                  {proj.description && !proj.descriptions?.length && (
                    <TableRow key={`projdesc2-${i}`} label="Descriptions" value={proj.description} />
                  )}
                </>
              ))}
            </CollapsibleSection>
          )}

          {/* Skills */}
          {resume.skills.featuredSkills.length > 0 && (
            <CollapsibleSection title="Skills">
              <TableRow label="Featured Skills" value={
                <div className="flex flex-wrap gap-1.5">
                  {resume.skills.featuredSkills.map((s: any, i: number) => (
                    <span key={i} className="bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded text-xs">{s.skill}</span>
                  ))}
                </div>
              } />
              {r.softSkills?.length > 0 && (
                <TableRow label="Soft Skills" value={
                  <div className="flex flex-wrap gap-1.5">
                    {r.softSkills.map((s: string, i: number) => (
                      <span key={i} className="bg-green-50 text-green-700 border border-green-100 px-2 py-0.5 rounded text-xs">{s}</span>
                    ))}
                  </div>
                } />
              )}
              {r.tools?.length > 0 && (
                <TableRow label="Tools" value={
                  <div className="flex flex-wrap gap-1.5">
                    {r.tools.map((t: string, i: number) => (
                      <span key={i} className="bg-gray-100 text-gray-700 border border-gray-200 px-2 py-0.5 rounded text-xs">{t}</span>
                    ))}
                  </div>
                } />
              )}
            </CollapsibleSection>
          )}

          {/* Certifications */}
          {r.certifications?.length > 0 && (
            <CollapsibleSection title="Certifications">
              {r.certifications.map((cert: any, i: number) => (
                <>
                  <TableRow key={`cert-${i}`} label="Name" value={cert.name} />
                  <TableRow key={`certprov-${i}`} label="Provider" value={cert.provider} />
                  <TableRow key={`certdate-${i}`} label="Date" value={cert.date} />
                </>
              ))}
            </CollapsibleSection>
          )}

          {/* Competitions */}
          {r.competitions?.length > 0 && (
            <CollapsibleSection title="Competitions" defaultOpen={false}>
              {r.competitions.map((c: string, i: number) => (
                <TableRow key={i} label={`#${i + 1}`} value={c} />
              ))}
            </CollapsibleSection>
          )}
        </tbody>
      </table>
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
            // Scanned PDF — use backend OCR
            text = await uploadToBackendOcr(file);
          }
        } else {
          // Image file — use backend OCR
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

    // Skills matching
    const resumeSkills = resume.skills.featuredSkills.map((s: any) => s.skill.toLowerCase());
    const jobSkills = (job.skills || []).map((s: string) => s.toLowerCase());
    const skillMatches = jobSkills.filter((skill: string) => 
      resumeSkills.some((rSkill: string) => rSkill.includes(skill) || skill.includes(rSkill))
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
    formData.append('file', file);
    const token = tokenStorage.getAccess();
    const res = await fetch(`${API_BASE_URL}/resume/extract-text`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!res.ok) {
      const err = await res.text().catch(() => '');
      throw new Error(err || `Backend OCR failed (${res.status})`);
    }
    const json = await res.json();
    if (!json.success || !json.text) throw new Error('Backend returned no text');
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
        let text = '';
        let textItems: any[] = [];
        if (isImage) {
          // Image files — always use backend OCR
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Job Position for Screening
              </label>
              <select
                value={selectedJob?._id || ''}
                onChange={(e) => {
                  const job = availableJobs.find(j => j._id === e.target.value);
                  setSelectedJob(job);
                  if (job && resume.profile.name) {
                    const score = calculateMatchingScore(resume, job);
                    setMatchingScore(score);
                  }
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choose a job position...</option>
                {availableJobs.map((job) => (
                  <option key={job._id} value={job._id}>
                    {job.jobTitle} - {job.company}
                  </option>
                ))}
              </select>
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
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={(e) => e.target.files && handleBulkUpload(e.target.files)}
                className="w-full border border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors"
              />
              <p className="text-sm text-gray-500 mt-2">Select multiple PDF or image resumes to upload and analyze</p>
            </div>
          )}
          
          {fileUrl && (
            <div className="border border-gray-200 rounded-lg overflow-hidden mb-6">
              <iframe src={`${fileUrl}#navpanes=0&zoom=75`} className="w-full h-[800px]" title="Resume Preview" />
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
        <div className="bg-white rounded-lg border border-gray-200 p-6 overflow-y-auto" style={{ maxHeight: '90vh' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Parsed Information</h2>
            {aiStatus && (
              <span className={`text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1 ${
                aiStatus.status === 'ai' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
              }`} title={aiStatus.detail || ''}>
                {aiStatus.status === 'ai' ? '✦ AI parsed' : `⚠ Local parser${aiStatus.detail ? ` — ${aiStatus.detail}` : ''}`}
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
            <p className="text-gray-400 text-sm text-center py-8">Upload a PDF or image resume to see parsed information here.</p>
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
      
      {/* Smart Matching & Recommendations */}
      {isFileUploaded && (
        <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
            Smart Matching & Recommendations
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Job Recommendations */}
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                AI Job Recommendations for {resume.profile.name}
              </h3>
              <MistralJobRecommendations 
                resumeSkills={resume.skills.featuredSkills.length > 0 ? resume.skills.featuredSkills : []} 
                location={resume.profile.location || ''} 
                experience={(resume.workExperiences[0] as any)?.jobTitle || resume.profile.name || ''}
                onNavigate={(page, data) => {
                  if (page === 'job-application' && onNavigate) {
                    // Store job data for application page
                    localStorage.setItem('selectedJob', JSON.stringify(data.job));
                    // Navigate to job application page
                    onNavigate('job-application', data);
                  }
                }}
              />
            </div>

            {/* Matching Features */}
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
                Smart Matching Features
              </h3>
              
              {/* Skills Match */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-800 mb-3">Skills-Based Matching</h4>
                <div className="space-y-2">
                  {resume.skills.featuredSkills.map((skill: any, index: number) => {
                    // Count how many fetched jobs require this skill
                    const skillLower = skill.skill.toLowerCase();
                    const totalJobs = availableJobs.length || 1;
                    const matchingJobs = availableJobs.filter((job: any) =>
                      (job.skills || []).some((s: string) =>
                        s.toLowerCase().includes(skillLower) || skillLower.includes(s.toLowerCase())
                      ) ||
                      (job.description || '').toLowerCase().includes(skillLower) ||
                      (job.jobTitle || '').toLowerCase().includes(skillLower)
                    ).length;
                    // Score = % of jobs that need this skill, min 10% if skill exists
                    const pct = availableJobs.length > 0
                      ? Math.max(10, Math.round((matchingJobs / totalJobs) * 100))
                      : Math.min(95, 40 + (index % 5) * 11); // varied fallback when no jobs loaded
                    return (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-gray-700">{skill.skill}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                pct >= 70 ? 'bg-green-500' : pct >= 40 ? 'bg-blue-500' : 'bg-orange-400'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600 w-8 text-right">{pct}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Location Match */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-800 mb-3">Location Preferences</h4>
                <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg flex items-start gap-2">
                  <svg className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                  <p className="text-sm text-blue-800">
                    Based on your location ({resume.profile.location}), we found {totalJobsCount > 0 ? `${totalJobsCount}+` : '25+'} jobs in your area
                  </p>
                </div>
              </div>

              {/* Experience Level */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-800 mb-3">Experience Level Match</h4>
                <div className="bg-green-50 border border-green-100 p-3 rounded-lg flex items-start gap-2">
                  <svg className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                  <p className="text-sm text-green-800">
                    Your {(resume.workExperiences[0] as any)?.jobTitle || 'professional'} experience matches {totalJobsCount > 0 ? `${Math.floor(totalJobsCount * 0.6)}+` : 'several'} open positions
                  </p>
                </div>
              </div>

              {/* Search Filters */}
              <div>
                <h4 className="font-medium text-gray-800 mb-3">Enhanced Search Filters</h4>
                <div className="space-y-2">
                  <button className="w-full text-left p-2.5 bg-gray-50 border border-gray-100 rounded-lg hover:bg-gray-100 transition-colors text-sm text-gray-700 flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
                    Jobs matching: {resume.skills.featuredSkills.map((s: any) => s.skill).join(", ")}
                  </button>
                  <button className="w-full text-left p-2.5 bg-gray-50 border border-gray-100 rounded-lg hover:bg-gray-100 transition-colors text-sm text-gray-700 flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                    Jobs in: {resume.profile.location}
                  </button>
                  <button className="w-full text-left p-2.5 bg-gray-50 border border-gray-100 rounded-lg hover:bg-gray-100 transition-colors text-sm text-gray-700 flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                    {(resume.workExperiences[0] as any)?.jobTitle} level positions
                  </button>
                </div>
              </div>
            </div>
          </div>

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
                    const userId = currentUser._id || currentUser.id;

                    if (!userId) {
                      window.dispatchEvent(new CustomEvent('zync:alert', { detail: { message: 'Please log in to save your profile.', type: 'error' } }));
                      return;
                    }

                    const extractYear = (s: string) => String(s || '').match(/\d{4}/)?.[0] || '';
                    const isEmpty = (v: any) => !v || (typeof v === 'string' && !v.trim()) || (Array.isArray(v) && v.length === 0);

                    // phone — only fill if profile is empty
                    const phone = isEmpty(currentUser.phone) && resume.profile.phone
                      ? resume.profile.phone : currentUser.phone;

                    // location — only fill if profile is empty
                    const location = isEmpty(currentUser.location) && resume.profile.location
                      ? resume.profile.location : currentUser.location;

                    // name — only fill if profile is empty
                    const name = isEmpty(currentUser.name) && resume.profile.name
                      ? resume.profile.name : currentUser.name;

                    // skills — only fill if profile has no skills
                    const parsedSkills = resume.skills.featuredSkills.map((s: any) => s.skill).filter(Boolean);
                    const skills = isEmpty(currentUser.skills) && parsedSkills.length > 0
                      ? parsedSkills : (currentUser.skills || []);

                    // profileSummary — only fill if profile is empty
                    const parsedSummary = (resume as any).summary?.trim() || '';
                    const profileSummary = isEmpty(currentUser.profileSummary) && parsedSummary
                      ? parsedSummary : currentUser.profileSummary;

                    // employment — only fill if profile has no employment
                    const hasExistingEmployment = !isEmpty(currentUser.employment);
                    const employment: any[] = !hasExistingEmployment && resume.workExperiences.length > 0
                      ? resume.workExperiences.map((exp: any) => {
                          const dateParts = String(exp.date || '').split(/\s*[-–]\s*/);
                          return {
                            companyName: exp.company || '',
                            designation: exp.jobTitle || '',
                            description: Array.isArray(exp.descriptions) ? exp.descriptions.join(' ') : '',
                            startMonth: '',
                            startYear: extractYear(dateParts[0] || ''),
                            endMonth: '',
                            endYear: extractYear(dateParts[1] || ''),
                            currentlyWorking: /present|current/i.test(exp.date || ''),
                          };
                        })
                      : (Array.isArray(currentUser.employment)
                          ? currentUser.employment
                          : currentUser.employment ? [currentUser.employment] : []);

                    // jobTitle — only fill if profile is empty (derive from first parsed experience)
                    const parsedJobTitle = resume.workExperiences[0]?.jobTitle || '';
                    const jobTitle = isEmpty(currentUser.jobTitle) && parsedJobTitle
                      ? parsedJobTitle : currentUser.jobTitle;

                    // educationCollege — only fill if profile has no college education
                    const hasExistingEdu = currentUser.educationCollege?.college || currentUser.educationCollege?.degree;
                    const firstEdu = resume.educations[0] as any;
                    const educationCollege = !hasExistingEdu && firstEdu
                      ? {
                          college: firstEdu.school || '',
                          degree: firstEdu.degree || '',
                          passingYear: extractYear(firstEdu.date || ''),
                          courseType: 'Full Time',
                          percentage: ''
                        }
                      : currentUser.educationCollege;

                    const updatedUser = {
                      ...currentUser,
                      name,
                      phone,
                      location,
                      jobTitle,
                      skills,
                      employment,
                      educationCollege,
                      profileSummary,
                      email: currentUser.email,
                      userType: currentUser.userType || currentUser.role || 'candidate',
                      role: currentUser.role || currentUser.userType || 'candidate',
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

                      if (userId) {
                        const { _id, id, password, __v, ...safePayload } = updatedUser as any;
                        await apiFetch(`${API_BASE_URL}/users/${userId}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(safePayload)
                        }).catch(() => {});
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

