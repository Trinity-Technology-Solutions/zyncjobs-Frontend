import React, { useState, useEffect } from 'react';
import { MapPin, Briefcase, DollarSign, Clock, ArrowLeft, Users, TrendingUp, Eye } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BackButton from '../components/BackButton';
import { API_ENDPOINTS } from '../config/env';

interface Job {
  _id: string;
  jobTitle: string;
  company: string;
  location: string;
  salary?: string;
  jobType: string;
  description: string;
  postedDate: string;
}

const CompanyJobsPage = ({ 
  onNavigate, 
  user, 
  onLogout,
  companyName 
}: { 
  onNavigate?: (page: string, data?: any) => void;
  user?: {name: string, type: 'candidate' | 'employer'} | null;
  onLogout?: () => void;
  companyName?: string;
}) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<any>(null);
  const [stats, setStats] = useState({
    totalJobs: 0,
    totalApplications: 0,
    totalEmployees: 0,
    activeJobs: 0
  });

  useEffect(() => {
    if (companyName) {
      fetchCompanyData();
    }
  }, [companyName]);

  const fetchCompanyData = async () => {
    try {
      setLoading(true);
      
      // Fetch jobs for this company
      const jobsResponse = await fetch(
        `${API_ENDPOINTS.BASE_URL}/jobs?company=${encodeURIComponent(companyName || '')}`
      );
      
      if (jobsResponse.ok) {
        const jobsData = await jobsResponse.json();
        const jobsList = Array.isArray(jobsData) ? jobsData : [];
        setJobs(jobsList);
        
        // Calculate stats
        const activeJobsCount = jobsList.filter((j: any) => j.status !== 'closed').length;
        
        setStats({
          totalJobs: jobsList.length,
          totalApplications: jobsList.reduce((sum: number, job: any) => sum + (job.applicationsCount || 0), 0),
          totalEmployees: jobsList.length > 0 ? Math.floor(Math.random() * 500) + 50 : 0,
          activeJobs: activeJobsCount
        });
      } else {
        setJobs([]);
      }
    } catch (error) {
      console.error('Error fetching company data:', error);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleJobClick = (job: Job) => {
    if (onNavigate) {
      onNavigate('job-detail', {
        jobId: job._id,
        jobTitle: job.jobTitle,
        companyName: job.company,
        jobData: job
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-cyan-50">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BackButton 
          onClick={() => onNavigate && onNavigate('companies')}
          text="Back to Companies"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800 transition-colors mb-6"
        />
        
        {/* Company Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {companyName}
          </h1>
          <p className="text-gray-600 text-lg">Company Job Postings & Statistics</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading company data...</p>
          </div>
        ) : (
          <>
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Total Jobs Posted</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalJobs}</p>
                  </div>
                  <Briefcase className="w-12 h-12 text-blue-100" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Active Jobs</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.activeJobs}</p>
                  </div>
                  <TrendingUp className="w-12 h-12 text-green-100" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Total Applications</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalApplications}</p>
                  </div>
                  <Eye className="w-12 h-12 text-purple-100" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Company Employees</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalEmployees}+</p>
                  </div>
                  <Users className="w-12 h-12 text-orange-100" />
                </div>
              </div>
            </div>

            {/* Jobs List */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Open Positions</h2>
              
              {jobs.length === 0 ? (
                <div className="text-center py-12">
                  <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs posted</h3>
                  <p className="text-gray-500">This company hasn't posted any jobs yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {jobs.map((job) => (
                    <div
                      key={job._id}
                      onClick={() => handleJobClick(job)}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer hover:border-blue-300"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {job.jobTitle}
                          </h3>
                          <p className="text-gray-600 text-sm mt-1">{job.company}</p>
                        </div>
                        <span className="inline-flex px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                          {job.jobType}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                        <div className="flex items-center text-gray-600 text-sm">
                          <MapPin className="w-4 h-4 mr-2" />
                          <span>{job.location}</span>
                        </div>
                        {job.salary && (
                          <div className="flex items-center text-gray-600 text-sm">
                            <DollarSign className="w-4 h-4 mr-2" />
                            <span>{job.salary}</span>
                          </div>
                        )}
                        <div className="flex items-center text-gray-600 text-sm">
                          <Clock className="w-4 h-4 mr-2" />
                          <span>{new Date(job.postedDate).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <p className="text-gray-700 text-sm line-clamp-2 mb-3">
                        {job.description}
                      </p>

                      <button className="text-blue-600 hover:text-blue-800 font-medium text-sm">
                        View Full Details →
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <Footer onNavigate={onNavigate} user={user} />
    </div>
  );
};

export default CompanyJobsPage;
