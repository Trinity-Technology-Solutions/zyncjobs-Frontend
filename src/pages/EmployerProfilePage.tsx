import React, { useState, useEffect } from 'react';
import { Building, MapPin, Mail, Calendar, ArrowLeft } from 'lucide-react';
import BackButton from '../components/BackButton';
import { API_ENDPOINTS } from '../config/constants';

interface EmployerProfilePageProps {
  onNavigate: (page: string, data?: any) => void;
  employerId?: string;
  employerData?: any;
}

const EmployerProfilePage: React.FC<EmployerProfilePageProps> = ({ 
  onNavigate, 
  employerId, 
  employerData 
}) => {
  const [employer, setEmployer] = useState<any>(employerData || null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(!employerData);

  useEffect(() => {
    const fetchEmployerData = async () => {
      if (employerData) {
        setEmployer(employerData);
        fetchEmployerJobs(employerData.email);
        setLoading(false);
        return;
      }

      if (employerId) {
        try {
          const response = await fetch(`${API_ENDPOINTS.USERS}/${employerId}`);
          if (response.ok) {
            const data = await response.json();
            setEmployer(data);
            fetchEmployerJobs(data.email);
          }
        } catch (error) {
          console.error('Error fetching employer data:', error);
        }
      }
      setLoading(false);
    };

    fetchEmployerData();
  }, [employerId, employerData]);

  const fetchEmployerJobs = async (email: string) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.JOBS}?employerEmail=${email}`);
      if (response.ok) {
        const data = await response.json();
        setJobs(data.slice(0, 5)); // Show latest 5 jobs
      }
    } catch (error) {
      console.error('Error fetching employer jobs:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!employer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Employer not found</h2>
          <button 
            onClick={() => onNavigate('job-listings')} 
            className="bg-blue-600 text-white px-6 py-2 rounded-lg"
          >
            Back to Jobs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BackButton 
          onClick={() => onNavigate('job-listings')}
          text="Back to Jobs"
          className="mb-6"
        />

        {/* Employer Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-start space-x-4">
            <div className="w-20 h-20 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building className="w-10 h-10 text-blue-600" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {employer.name || employer.fullName || 'Hiring Manager'}
              </h1>
              <div className="flex items-center space-x-2 text-lg text-blue-600 font-medium mb-4">
                <Building className="w-5 h-5" />
                <span>{employer.company || 'Company'}</span>
              </div>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                {employer.location && (
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-4 h-4" />
                    <span>{employer.location}</span>
                  </div>
                )}
                <div className="flex items-center space-x-1">
                  <Mail className="w-4 h-4" />
                  <span>{employer.email}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>Member since {new Date(employer.createdAt || Date.now()).getFullYear()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* About Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">About</h2>
          <p className="text-gray-600 leading-relaxed">
            {employer.bio || employer.description || 
            `${employer.name || 'This employer'} is actively recruiting talented professionals to join ${employer.company || 'their team'}. They are committed to finding the right candidates for their open positions.`}
          </p>
        </div>

        {/* Current Job Openings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Job Openings</h2>
          {jobs.length > 0 ? (
            <div className="space-y-4">
              {jobs.map((job) => (
                <div 
                  key={job._id} 
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow cursor-pointer"
                  onClick={() => onNavigate('job-detail', { 
                    jobId: job._id, 
                    jobData: job 
                  })}
                >
                  <h3 className="font-semibold text-blue-600 hover:text-blue-800 mb-2">
                    {job.jobTitle || job.title}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                    <span>{job.location}</span>
                    <span>{job.type}</span>
                    {job.salary && (
                      <span>
                        {typeof job.salary === 'object' 
                          ? `${job.salary.currency === 'INR' ? '₹' : '$'}${job.salary.min?.toLocaleString()}-${job.salary.max?.toLocaleString()}`
                          : job.salary
                        }
                      </span>
                    )}
                  </div>
                  <p className="text-gray-700 text-sm line-clamp-2">
                    {job.description?.substring(0, 150)}...
                  </p>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex flex-wrap gap-1">
                      {job.skills?.slice(0, 3).map((skill: string) => (
                        <span key={skill} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          {skill}
                        </span>
                      ))}
                    </div>
                    <span className="text-xs text-gray-500">
                      Posted {new Date(job.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No current job openings available.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployerProfilePage;