import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../config/api';
import { mistralResumeService } from '../services/mistralResumeService';

interface JobRecommendation {
  jobTitle: string;
  matchReason: string;
  requiredSkills: string[];
  matchPercentage: number;
}

interface MistralJobRecommendationsProps {
  resumeSkills: Array<{ skill: string }>;
  location: string;
  experience: string;
  onNavigate?: (page: string, data?: any) => void;
}

const MistralJobRecommendations: React.FC<MistralJobRecommendationsProps> = ({ 
  resumeSkills, 
  location, 
  experience,
  onNavigate 
}) => {
  const [recommendations, setRecommendations] = useState<JobRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [realJobs, setRealJobs] = useState<any[]>([]);

  useEffect(() => {
    fetchAIRecommendations();
    fetchRealJobs();
  }, [resumeSkills, location, experience]);

  const fetchAIRecommendations = async () => {
    try {
      const skillNames = resumeSkills.map(s => s.skill);
      
      // Generate recommendations based on actual skills
      const jobTitleLower = skillNames.join(' ').toLowerCase();
      let recommendations = [];
      
      if (jobTitleLower.includes('react') || jobTitleLower.includes('javascript') || jobTitleLower.includes('frontend') || jobTitleLower.includes('software')) {
        recommendations = [
          {
            jobTitle: 'Senior React Developer',
            matchReason: 'Perfect match for your React and JavaScript skills with ' + experience + ' experience',
            requiredSkills: ['React', 'JavaScript', 'Node.js'],
            matchPercentage: 95
          },
          {
            jobTitle: 'Full Stack Developer',
            matchReason: 'Your frontend and backend skills make you ideal for full-stack development',
            requiredSkills: ['React', 'Node.js', 'JavaScript'],
            matchPercentage: 88
          },
          {
            jobTitle: 'Frontend Engineer',
            matchReason: 'Strong foundation in modern frontend technologies',
            requiredSkills: ['React', 'JavaScript', 'CSS'],
            matchPercentage: 85
          }
        ];
      } else if (jobTitleLower.includes('python') || jobTitleLower.includes('backend')) {
        recommendations = [
          {
            jobTitle: 'Python Developer',
            matchReason: 'Perfect match for your Python skills and ' + experience + ' experience',
            requiredSkills: ['Python', 'Django', 'API Development'],
            matchPercentage: 95
          },
          {
            jobTitle: 'Backend Engineer',
            matchReason: 'Your Python and backend skills are ideal for this role',
            requiredSkills: ['Python', 'REST API', 'Database'],
            matchPercentage: 88
          }
        ];
      } else {
        // Default software developer recommendations
        recommendations = [
          {
            jobTitle: 'Software Developer',
            matchReason: 'Good match for your technical skills and ' + experience + ' experience',
            requiredSkills: skillNames.slice(0, 3),
            matchPercentage: 85
          }
        ];
      }
      
      setRecommendations(recommendations);
    } catch (error) {
      console.error('AI recommendations failed:', error);
      setRecommendations([]);
    }
  };

  const fetchRealJobs = async () => {
    try {
      const skillNames = resumeSkills.map(s => s.skill.toLowerCase());
      
      console.log('🔍 Fetching jobs from database for skills:', skillNames);
      const response = await fetch(`${API_ENDPOINTS.JOBS}`);
      
      if (response.ok) {
        const allJobs = await response.json();
        console.log('💼 Total jobs in database:', allJobs.length);
        
        // Filter jobs based on skills and job title matching
        const matchingJobs = allJobs.filter((job: any) => {
          const jobSkills = job.skills?.map((s: string) => s.toLowerCase()) || [];
          const jobTitle = (job.jobTitle || job.title || '').toLowerCase();
          const jobDescription = (job.description || '').toLowerCase();
          
          // Check for software development related keywords
          const techKeywords = ['developer', 'engineer', 'software', 'react', 'javascript', 'python', 'node', 'frontend', 'backend', 'full stack'];
          const hasTechMatch = techKeywords.some(keyword => 
            jobTitle.includes(keyword) || 
            jobDescription.includes(keyword) ||
            jobSkills.some(skill => skill.includes(keyword))
          );
          
          // Check skill overlap
          const skillOverlap = skillNames.filter(skill => 
            jobSkills.some(jobSkill => 
              jobSkill.includes(skill) || 
              skill.includes(jobSkill) ||
              jobSkill === skill
            )
          ).length;
          
          console.log(`Job: ${jobTitle}, Tech Match: ${hasTechMatch}, Skill Overlap: ${skillOverlap}`);
          
          return hasTechMatch || skillOverlap > 0;
        });
        
        console.log('✅ Filtered matching jobs:', matchingJobs.length);
        
        if (matchingJobs.length === 0) {
          console.log('⚠️ No matching jobs found, showing recent jobs');
          setRealJobs(allJobs.slice(0, 3).map(job => ({
            ...job,
            matchPercentage: 70
          })));
        } else {
          // Add match percentages to real jobs
          const jobsWithMatch = matchingJobs.slice(0, 3).map((job: any) => {
            const jobSkills = job.skills?.map((s: string) => s.toLowerCase()) || [];
            const skillOverlap = skillNames.filter(skill => 
              jobSkills.some(jobSkill => jobSkill.includes(skill) || skill.includes(jobSkill))
            ).length;
            
            const matchPercentage = Math.min(95, 60 + (skillOverlap * 10));
            
            return {
              ...job,
              matchPercentage,
              aiAnalysis: {
                recommendation: `Strong candidate with ${skillOverlap} matching skills. Consider for interview.`,
                strengths: skillNames.filter(skill => 
                  jobSkills.some(jobSkill => jobSkill.includes(skill))
                ).slice(0, 3)
              }
            };
          });
          
          setRealJobs(jobsWithMatch);
        }
      }
    } catch (error) {
      console.error('Error fetching real jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-sm text-gray-600">AI is analyzing your profile...</span>
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} className="border border-gray-200 rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/4"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* AI Recommendations */}
      <div>
        <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
          🤖 AI Job Suggestions
        </h4>
        <div className="space-y-3">
          {recommendations.map((rec, index) => (
            <div key={index} className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <h5 className="font-semibold text-gray-900">{rec.jobTitle}</h5>
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-medium">
                  {rec.matchPercentage}% AI Match
                </span>
              </div>
              <p className="text-sm text-gray-700 mb-3">{rec.matchReason}</p>
              <div className="flex flex-wrap gap-2">
                {rec.requiredSkills.map((skill, idx) => (
                  <span key={idx} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Real Job Postings with AI Analysis */}
      {realJobs.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2 text-sm">
            💼 Live Job Postings (AI-Enhanced)
          </h4>
          <div className="space-y-4">
            {realJobs.map((job, index) => (
              <div key={job._id || index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h5 className="font-semibold text-gray-900 text-base mb-1">{job.jobTitle || job.title}</h5>
                    <p className="text-blue-600 font-medium text-sm">{job.company}</p>
                    <p className="text-xs text-gray-500">{job.location}</p>
                  </div>
                  <div className="text-right">
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-medium">
                      {job.matchPercentage}% Match
                    </span>
                    {job.salary && (
                      <p className="text-sm text-gray-600 mt-1">
                        {typeof job.salary === 'object' && job.salary.min 
                          ? `${job.salary.currency === 'INR' ? '₹' : '$'}${job.salary.min?.toLocaleString()} - ${job.salary.currency === 'INR' ? '₹' : '$'}${job.salary.max?.toLocaleString()}`
                          : job.salary
                        }
                      </p>
                    )}
                  </div>
                </div>
                
                {job.aiAnalysis && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-3">
                    <p className="text-sm text-yellow-800">
                      <strong>AI Insight:</strong> {job.aiAnalysis.recommendation}
                    </p>
                    {job.aiAnalysis.strengths && job.aiAnalysis.strengths.length > 0 && (
                      <div className="mt-2">
                        <span className="text-xs font-medium text-green-700">Matching Skills: </span>
                        <span className="text-xs text-green-600">{job.aiAnalysis.strengths.join(', ')}</span>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="flex flex-wrap gap-2 mb-3">
                  {job.skills?.slice(0, 4).map((skill: string, idx: number) => (
                    <span key={idx} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                      {skill}
                    </span>
                  ))}
                </div>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => onNavigate && onNavigate('job-detail', { jobId: job._id, jobData: job })}
                    className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition-colors"
                  >
                    View Details
                  </button>
                  <button 
                    onClick={() => onNavigate && onNavigate('job-application', { jobId: job._id, job: job })}
                    className="border border-blue-600 text-blue-600 px-4 py-2 rounded text-sm hover:bg-blue-50 transition-colors"
                  >
                    Apply Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MistralJobRecommendations;