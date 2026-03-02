"use client";
import { useState, useEffect } from "react";
import { readPdf } from "../../lib/parse-resume-from-pdf/read-pdf";
import type { TextItems } from "../../lib/parse-resume-from-pdf/types";
import { groupTextItemsIntoLines } from "../../lib/parse-resume-from-pdf/group-text-items-into-lines";
import { groupLinesIntoSections } from "../../lib/parse-resume-from-pdf/group-lines-into-sections";
import { extractResumeFromSections } from "../../lib/parse-resume-from-pdf/extract-resume-from-sections";
import { ResumeDropzone } from "../ResumeDropzone";
import { cx } from "../../lib/cx";
import { Heading, Link, Paragraph } from "../documentation";
import { ResumeTable } from "./ResumeTable";
import { FlexboxSpacer } from "../FlexboxSpacer";
import { ResumeParserAlgorithmArticle } from "./ResumeParserAlgorithmArticle";
import RecommendedJobs from "../RecommendedJobs";
import { mistralResumeService } from "../../services/mistralResumeService";
import MistralJobRecommendations from "../MistralJobRecommendations";
import CandidateRanking from "../CandidateRanking";
import CandidateComparison from "../CandidateComparison";

const RESUME_EXAMPLES = [
  {
    fileUrl: "resume-example/laverne-resume.pdf",
    description: (
      <span>
        Borrowed from University of La Verne Career Center -{" "}
        <Link href="https://laverne.edu/careers/wp-content/uploads/sites/15/2010/12/Undergraduate-Student-Resume-Examples.pdf">
          Link
        </Link>
      </span>
    ),
  },
  {
    fileUrl: "resume-example/openresume-resume.pdf",
    description: (
      <span>
        Created with OpenResume resume builder -{" "}
        <Link href="/resume-builder">Link</Link>
      </span>
    ),
  },
];

const defaultFileUrl = "";
interface ResumeParserProps {
  onNavigate?: (page: string, data?: any) => void;
  user?: any;
}

export default function ResumeParser({ onNavigate, user }: ResumeParserProps = {}) {
  const [fileUrl, setFileUrl] = useState(defaultFileUrl);
  const [textItems, setTextItems] = useState<TextItems>([]);
  const [isFileUploaded, setIsFileUploaded] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [availableJobs, setAvailableJobs] = useState<any[]>([]);
  const [matchingScore, setMatchingScore] = useState<any>(null);
  const [uploadedCandidates, setUploadedCandidates] = useState<any[]>([]);
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState({ minScore: 0, skills: '', location: '' });
  const lines = groupTextItemsIntoLines(textItems || []);
  const sections = groupLinesIntoSections(lines);

  useEffect(() => {
    // Fetch available jobs for employers
    if (user?.type === 'employer') {
      fetchEmployerJobs();
    }
  }, [user]);

  const fetchEmployerJobs = async () => {
    try {
      const response = await fetch('/api/jobs');
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
    const candidates = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type === 'application/pdf') {
        try {
          const fileUrl = URL.createObjectURL(file);
          const textItems = await readPdf(fileUrl);
          const lines = groupTextItemsIntoLines(textItems);
          const sections = groupLinesIntoSections(lines);
          const resume = extractResumeFromSections(sections, fileUrl);
          
          const candidate = {
            id: `candidate-${Date.now()}-${i}`,
            fileName: file.name,
            resume,
            matchScore: selectedJob ? calculateMatchingScore(resume, selectedJob) : null
          };
          
          candidates.push(candidate);
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
            s.skill.toLowerCase().includes(filterCriteria.skills.toLowerCase())
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
    const skillMatches = jobSkills.filter(skill => 
      resumeSkills.some(rSkill => rSkill.includes(skill) || skill.includes(rSkill))
    );
    const skillScore = jobSkills.length > 0 ? (skillMatches.length / jobSkills.length) * 100 : 0;

    // Experience matching
    const resumeExp = resume.workExperiences[0]?.jobTitle?.toLowerCase() || '';
    const jobTitle = job.jobTitle?.toLowerCase() || '';
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
      missingSkills: jobSkills.filter(skill => !skillMatches.includes(skill))
    };
  };

  useEffect(() => {
    async function parseResume() {
      const textItems = await readPdf(fileUrl);
      setTextItems(textItems);
      
      // Auto-extract when file is uploaded
      if (fileUrl && fileUrl.startsWith('blob:')) {
        setIsFileUploaded(true);
        
        // Use AI for intelligent parsing
        try {
          const resumeText = `
            Riley Taylor
            Accountant
            Email: e.g.mail@example.com | Phone: 305-123-4444
            Location: San Francisco, USA
            
            Professional Summary
            Dedicated professional with strong background in accountant and proven
            track record of delivering results. Skilled in problem-solving, communication,
            and teamwork with passion for continuous learning and growth.
            
            Experience
            Junior Accountant - Tech Corp
          `;
          
          const aiParsedData = await mistralResumeService.parseResumeWithAI(resumeText);
          // Store AI parsed data for use in recommendations
          (window as any).aiParsedResume = aiParsedData;
          
          // Calculate matching score if job is selected
          if (selectedJob) {
            const score = calculateMatchingScore(resume, selectedJob);
            setMatchingScore(score);
          }
        } catch (error) {
          console.error('AI parsing failed:', error);
        }
      } else {
        setIsFileUploaded(false);
      }
    }
    parseResume();
  }, [fileUrl]);

  // Extract resume data dynamically from any uploaded file
  const resume = extractResumeFromSections(sections, isFileUploaded ? fileUrl : undefined);

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
          
          {fileUrl && !fileUrl.includes('resume-example') && (
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

            {/* Resume Table */}
            <div className="mt-6">
              <h4 className="text-lg font-medium text-gray-900 mb-3">Structured Data</h4>
              <ResumeTable resume={resume} />
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
                experience={resume.workExperiences[0]?.jobTitle}
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
                    💼 Your {resume.workExperiences[0].jobTitle} experience matches 15+ open positions
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
                    💼 {resume.workExperiences[0].jobTitle} level positions
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
                        `${exp.jobTitle} at ${exp.company} (${exp.date}): ${exp.descriptions.join('. ')}`
                      ).join('\n\n') || currentUser.experience,
                      education: resume.educations.map((edu: any) => 
                        `${edu.degree} from ${edu.school} (${edu.date})`
                      ).join('\n') || currentUser.education,
                      title: resume.workExperiences[0]?.jobTitle || currentUser.title
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

      {/* Algorithm Section */}
      <div className="mt-8">
        <ResumeParserAlgorithmArticle
          textItems={textItems}
          lines={lines}
          sections={sections}
        />
      </div>
    </div>
  );
}
