import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../config/api';

interface Job {
  _id: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  skills: string[];
  description: string;
  requirements: string[];
}

interface RecommendedJobsProps {
  resumeSkills: Array<{ skill: string }>;
  location: string;
}

const RecommendedJobs: React.FC<RecommendedJobsProps> = ({ resumeSkills, location }) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMatchingJobs();
  }, [resumeSkills, location]);

  const fetchMatchingJobs = async () => {
    try {
      setLoading(true);
      
      // Extract skill names from resume
      const skillNames = resumeSkills.map(s => s.skill.toLowerCase());
      
      // Create search query for skills
      const skillQuery = skillNames.join(',');
      
      // Fetch jobs from your backend API
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/jobs?skills=${skillQuery}&location=${location}`);
      
      if (response.ok) {
        const allJobs = await response.json();
        
        // Calculate match percentage for each job
        const jobsWithMatch = allJobs.map((job: Job) => {
          const jobSkills = job.skills.map(s => s.toLowerCase());
          const matchingSkills = skillNames.filter(skill => 
            jobSkills.some(jobSkill => jobSkill.includes(skill) || skill.includes(jobSkill))
          );
          const matchPercentage = Math.round((matchingSkills.length / skillNames.length) * 100);
          
          return {
            ...job,
            matchPercentage,
            matchingSkills
          };
        });
        
        // Sort by match percentage and take top 5
        const sortedJobs = jobsWithMatch
          .filter((job: any) => job.matchPercentage > 0)
          .sort((a: any, b: any) => b.matchPercentage - a.matchPercentage)
          .slice(0, 5);
        
        setJobs(sortedJobs);
      } else {
        console.error('Failed to fetch jobs');
        setJobs([]);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
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

  if (jobs.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No matching jobs found. Try updating your skills or location.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {jobs.map((job: any) => (
        <div key={job._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h4 className="font-semibold text-gray-900">{job.title}</h4>
              <p className="text-blue-600">{job.company}</p>
              <p className="text-sm text-gray-500">{job.location}</p>
            </div>
            <div className="text-right">
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-medium">
                {job.matchPercentage}% Match
              </span>
              {job.salary && (
                <p className="text-sm text-gray-600 mt-1">{job.salary}</p>
              )}
            </div>
          </div>
          
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{job.description}</p>
          
          <div className="flex flex-wrap gap-2 mt-3">
            {job.skills.slice(0, 4).map((skill: string, idx: number) => (
              <span 
                key={idx} 
                className={`px-2 py-1 rounded text-xs ${
                  job.matchingSkills?.includes(skill.toLowerCase()) 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {skill}
              </span>
            ))}
            {job.skills.length > 4 && (
              <span className="text-xs text-gray-500">+{job.skills.length - 4} more</span>
            )}
          </div>
          
          <div className="mt-3 flex gap-2">
            <button className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition-colors">
              View Details
            </button>
            <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-50 transition-colors">
              Save Job
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RecommendedJobs;