"use client";
import { useState, useEffect } from "react";
import { readPdf } from "../../lib/parse-resume-from-pdf/read-pdf";
import { ResumeDropzone } from "../ResumeDropzone";
import MistralJobRecommendations from "../MistralJobRecommendations";
import CandidateRanking from "../CandidateRanking";
import CandidateComparison from "../CandidateComparison";
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

interface ResumeParserProps {
  onNavigate?: (page: string, data?: any) => void;
  user?: any;
}

interface ParsedResume {
  profile: { name: string; email: string; phone: string; location: string };
  skills: { featuredSkills: { skill: string }[] };
  workExperiences: { jobTitle: string; company: string; date: string; descriptions: string[] }[];
  educations: { degree: string; school: string; date: string }[];
}

const emptyResume: ParsedResume = {
  profile: { name: '', email: '', phone: '', location: '' },
  skills: { featuredSkills: [] },
  workExperiences: [],
  educations: [],
};

function findSectionIdx(lines: string[], pattern: RegExp) {
  return lines.findIndex(l => pattern.test(l.replace(/[:\-_*#]/g, '').trim()));
}

function parseResumeFromText(text: string): ParsedResume {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const fullText = text;

  // Email
  const email = (fullText.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/) || [])[0] || '';
  // Phone
  const phone = (fullText.match(/(\+?\d[\d\s\-().]{7,}\d)/) || [])[0]?.trim() || '';
  // Location
  const location = (fullText.match(/([A-Z][a-zA-Z]+[,\s]+[A-Z][a-zA-Z\s]{2,20})/) || [])[0]?.trim() || '';
  // Name — first short line (2-4 words, title case, no digits)
  const name = lines.find(l =>
    /^[A-Z][a-zA-Z]+(\s[A-Z][a-zA-Z]+){1,3}$/.test(l) && l.length < 50 && !/\d/.test(l)
  ) || '';

  // Section indices — loose match (handles caps, colons, extra words)
  const skillsIdx = findSectionIdx(lines, /^(skills|technical skills?|core competencies|technologies|key skills?|programming languages?)/i);
  const expIdx = findSectionIdx(lines, /^(experience|work experience|employment|professional experience|work history)/i);
  const eduIdx = findSectionIdx(lines, /^(education|academic|educational|qualifications?)/i);
  const projIdx = findSectionIdx(lines, /^(projects?|personal projects?|academic projects?)/i);
  const certIdx = findSectionIdx(lines, /^(certifications?|courses?|achievements?|awards?)/i);

  // Skills section — find end as next known section
  const sectionStarts = [expIdx, eduIdx, projIdx, certIdx].filter(i => i > skillsIdx && i > 0);
  const skillsEnd = sectionStarts.length > 0 ? Math.min(...sectionStarts) : skillsIdx + 15;
  const skillLines = skillsIdx >= 0 ? lines.slice(skillsIdx + 1, skillsEnd) : [];
  const skillTokens = skillLines
    .join(' ')
    .split(/[,|•·\t\n\/]|\s{2,}/)
    .map(s => s.replace(/[\-–—*#:]/g, '').trim())
    .filter(s => s.length > 1 && s.length < 40 && !/^(and|the|with|using|etc)$/i.test(s));
  const featuredSkills = [...new Set(skillTokens)].slice(0, 20).map(skill => ({ skill }));

  // Experience section
  const expSectionStarts = [eduIdx, projIdx, certIdx, skillsIdx].filter(i => i > expIdx && i > 0);
  const expEnd = expSectionStarts.length > 0 ? Math.min(...expSectionStarts) : expIdx + 30;
  const expLines = expIdx >= 0 ? lines.slice(expIdx + 1, expEnd) : [];
  const workExperiences: ParsedResume['workExperiences'] = [];
  const datePattern = /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\d{4})[\s\-–to]*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\d{4}|Present|Current)?/i;
  for (let i = 0; i < expLines.length; i++) {
    if (datePattern.test(expLines[i])) {
      // Look back for job title and company
      const jobTitle = expLines[i - 1] || expLines[i - 2] || '';
      const company = expLines[i + 1] || '';
      const descriptions = expLines.slice(i + 2, i + 6).filter(
        l => l.length > 20 && !datePattern.test(l)
      );
      if (jobTitle) {
        workExperiences.push({ jobTitle, company, date: expLines[i], descriptions });
        i += 2;
      }
    }
  }

  // Education section
  const eduSectionStarts = [expIdx, projIdx, certIdx, skillsIdx].filter(i => i > eduIdx && i > 0);
  const eduEnd = eduSectionStarts.length > 0 ? Math.min(...eduSectionStarts) : eduIdx + 20;
  const eduLines = eduIdx >= 0 ? lines.slice(eduIdx + 1, eduEnd) : [];
  const educations: ParsedResume['educations'] = [];
  const degreePattern = /b\.?\s*tech|m\.?\s*tech|b\.?\s*e\.?|m\.?\s*e\.?|mba|bsc|msc|b\.?\s*sc|m\.?\s*sc|bachelor|master|phd|doctorate|diploma|b\.?\s*com|m\.?\s*com|university|college|institute|school/i;
  for (let i = 0; i < eduLines.length; i++) {
    if (degreePattern.test(eduLines[i])) {
      const hasDate = datePattern.test(eduLines[i + 1] || '') || /\d{4}/.test(eduLines[i + 1] || '');
      educations.push({
        school: degreePattern.test(eduLines[i]) && /university|college|institute|school/i.test(eduLines[i])
          ? eduLines[i]
          : eduLines[i + 1] || eduLines[i],
        degree: /university|college|institute|school/i.test(eduLines[i])
          ? eduLines[i - 1] || ''
          : eduLines[i],
        date: hasDate ? eduLines[i + 1] : (eduLines[i + 2] || ''),
      });
      i += hasDate ? 1 : 0;
    }
  }

  return { profile: { name, email, phone, location }, skills: { featuredSkills }, workExperiences, educations };
}

export default function ResumeParser({ onNavigate, user }: ResumeParserProps = {}) {
  const [fileUrl, setFileUrl] = useState('');
  const [resume, setResume] = useState<ParsedResume>(emptyResume);
  const [rawText, setRawText] = useState('');
  const [isFileUploaded, setIsFileUploaded] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [availableJobs, setAvailableJobs] = useState<any[]>([]);
  const [matchingScore, setMatchingScore] = useState<any>(null);
  const [uploadedCandidates, setUploadedCandidates] = useState<any[]>([]);
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState({ minScore: 0, skills: '', location: '' });

  useEffect(() => {
    if (user?.type === 'employer') fetchEmployerJobs();
  }, [user]);

  const fetchEmployerJobs = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/jobs`);
      if (response.ok) {
        const jobs = await response.json();
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
      if (file.type === 'application/pdf') {
        try {
          const url = URL.createObjectURL(file);
          const textItems = await readPdf(url);
          const text = textItems.map(t => t.text).join('\n');
          const parsed = parseResumeFromText(text);
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

  useEffect(() => {
    if (!fileUrl) return;
    async function parseResume() {
      setParsing(true);
      try {
        const textItems = await readPdf(fileUrl);
        const text = textItems.map(t => t.text).join('\n');
        setRawText(text);
        const parsed = parseResumeFromText(text);
        setResume(parsed);
        setIsFileUploaded(true);
        if (selectedJob) {
          setMatchingScore(calculateMatchingScore(parsed, selectedJob));
        }
      } catch (e) {
        console.error('Parse error:', e);
      } finally {
        setParsing(false);
      }
    }
    parseResume();
  }, [fileUrl]);

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {user?.type === 'employer' ? 'Candidate Resume Parser' : 'Resume Parser'}
        </h1>
        <p className="text-gray-600">
          {user?.type === 'employer' 
            ? 'Parse candidate resumes to extract key information for efficient screening'
            : 'Upload your resume to extract and analyze key information for better job matching'
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
              <h3 className="text-lg font-medium text-gray-900 mb-3">📁 Bulk Resume Upload</h3>
              <input
                type="file"
                multiple
                accept=".pdf"
                onChange={(e) => e.target.files && handleBulkUpload(e.target.files)}
                className="w-full border border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors"
              />
              <p className="text-sm text-gray-500 mt-2">Select multiple PDF resumes to upload and analyze</p>
            </div>
          )}
          
          {fileUrl && (
            <div className="border border-gray-200 rounded-lg overflow-hidden mb-6">
              <iframe src={`${fileUrl}#navpanes=0&zoom=75`} className="w-full h-[800px]" title="Resume Preview" />
            </div>
          )}
          
          <div className="mt-3">
            <ResumeDropzone
              onFileUrlChange={(fileUrl) =>
                setFileUrl(fileUrl || defaultFileUrl)
              }
              playgroundView={true}
            />
          </div>
        </div>

        {/* Results Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Parsed Information</h2>
          
          {parsing && (
            <div className="flex items-center gap-3 py-8 justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="text-gray-600">Parsing your resume...</span>
            </div>
          )}

          {!parsing && !isFileUploaded && (
            <p className="text-gray-400 text-sm text-center py-8">Upload a PDF resume to see parsed information here.</p>
          )}
          
          {/* Matching Score for Employers */}
          {user?.type === 'employer' && selectedJob && matchingScore && (
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">🎯 Job Match Analysis</h3>
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
                  <h4 className="font-medium text-green-700 mb-2">✅ Matching Skills:</h4>
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
                  <h4 className="font-medium text-red-700 mb-2">❌ Missing Skills:</h4>
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
          <div className="space-y-6">
            {/* Personal Info */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Personal Information</h3>
              <div className="space-y-2">
                <p><span className="font-medium">Name:</span> {resume.profile.name}</p>
                <p><span className="font-medium">Email:</span> {resume.profile.email}</p>
                <p><span className="font-medium">Phone:</span> {resume.profile.phone}</p>
                <p><span className="font-medium">Location:</span> {resume.profile.location}</p>
              </div>
            </div>

            {/* Skills */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {resume.skills.featuredSkills.map((skill: any, index: number) => (
                  <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                    {skill.skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Experience */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Experience</h3>
              {resume.workExperiences.map((exp: any, index: number) => (
                <div key={index} className="border-l-4 border-blue-200 pl-4 mb-4">
                  <h4 className="font-medium text-gray-900">{exp.jobTitle}</h4>
                  <p className="text-blue-600">{exp.company}</p>
                  <p className="text-sm text-gray-500">{exp.date}</p>
                  <p className="text-gray-700 mt-1">{exp.descriptions.join('. ')}</p>
                </div>
              ))}
            </div>

            {/* Education */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Education</h3>
              {resume.educations.map((edu: any, index: number) => (
                <div key={index} className="border-l-4 border-green-200 pl-4 mb-4">
                  <h4 className="font-medium text-gray-900">{edu.degree}</h4>
                  <p className="text-green-600">{edu.school}</p>
                  <p className="text-sm text-gray-500">{edu.date}</p>
                </div>
              ))}
            </div>


          </div>
        </div>
      </div>
      
      {/* Candidate Ranking & Filtering for Employers */}
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
          <h2 className="text-2xl font-bold text-gray-900 mb-6">🎯 Smart Matching & Recommendations</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Job Recommendations */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">💼 AI Job Recommendations for {resume.profile.name}</h3>
              <MistralJobRecommendations 
                resumeSkills={resume.skills.featuredSkills} 
                location={resume.profile.location} 
                experience={(resume.workExperiences[0] as any)?.jobTitle || ''}
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
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🔍 Smart Matching Features</h3>
              
              {/* Skills Match */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-800 mb-3">Skills-Based Matching</h4>
                <div className="space-y-2">
                  {resume.skills.featuredSkills.map((skill: any, index: number) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-gray-700">{skill.skill}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-600 h-2 rounded-full" style={{width: '85%'}}></div>
                        </div>
                        <span className="text-sm text-gray-600">85%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Location Match */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-800 mb-3">Location Preferences</h4>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-800">
                    📍 Based on your location ({resume.profile.location}), we found 25+ jobs in your area
                  </p>
                </div>
              </div>

              {/* Experience Level */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-800 mb-3">Experience Level Match</h4>
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-sm text-green-800">
                    💼 Your {(resume.workExperiences[0] as any)?.jobTitle} experience matches 15+ open positions
                  </p>
                </div>
              </div>

              {/* Search Filters */}
              <div>
                <h4 className="font-medium text-gray-800 mb-3">Enhanced Search Filters</h4>
                <div className="space-y-2">
                  <button className="w-full text-left p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors">
                    🔍 Jobs matching: {resume.skills.featuredSkills.map((s: any) => s.skill).join(", ")}
                  </button>
                  <button className="w-full text-left p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors">
                    📍 Jobs in: {resume.profile.location}
                  </button>
                  <button className="w-full text-left p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors">
                    💼 {(resume.workExperiences[0] as any)?.jobTitle} level positions
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
                  onClick={() => onNavigate && onNavigate('job-listings')}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  View All Recommended Jobs
                </button>
                <button 
                  onClick={() => {
                    // Extract and save profile data
                    const userData = localStorage.getItem('user');
                    const currentUser = userData ? JSON.parse(userData) : {};
                    
                    const updatedUser = {
                      ...currentUser,
                      name: resume.profile.name || currentUser.name,
                      email: resume.profile.email || currentUser.email,
                      phone: resume.profile.phone || currentUser.phone,
                      location: resume.profile.location || currentUser.location,
                      skills: resume.skills.featuredSkills.map((s: any) => s.skill) || currentUser.skills || [],
                      experience: resume.workExperiences.map((exp: any) => 
                        `${(exp as any).jobTitle} at ${(exp as any).company} (${(exp as any).date}): ${(exp as any).descriptions.join('. ')}`
                      ).join('\n\n') || currentUser.experience,
                      education: resume.educations.map((edu: any) => 
                        `${edu.degree} from ${edu.school} (${edu.date})`
                      ).join('\n') || currentUser.education,
                      title: (resume.workExperiences[0] as any)?.jobTitle || currentUser.title
                    };
                    
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                    
                    // Show success message and navigate
                    alert('Profile updated successfully with resume data!');
                    onNavigate && onNavigate('dashboard');
                  }}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Save Profile
                </button>
                <button className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors">
                  Refine Preferences
                </button>
              </>
            )}
          </div>
        </div>
      )}


    </div>
  );
}

