import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../config/api';
import { Briefcase, Users, Eye, Edit, Trash2, Plus, Search, Filter, RefreshCw, MoreVertical, CheckSquare, Mail, UserCheck } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BackButton from '../components/BackButton';

interface Job {
  _id: string;
  title: string;
  location: string;
  salary: any;
  created_at: string;
  status: string;
  type: string;
  views: number;
  company: string;
  applicationCount?: number;
  shortlistedCount?: number;
}

interface JobManagementPageProps {
  onNavigate: (page: string) => void;
  user: {name: string, type: 'candidate' | 'employer'} | null;
  onLogout: () => void;
}

const JobManagementPage: React.FC<JobManagementPageProps> = ({ onNavigate, user, onLogout }) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('posted');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      fetchEmployerJobs(parsedUser);
    }
  }, []);

  const fetchEmployerJobs = async (userData: any) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/jobs`);
      if (response.ok) {
        const allJobs = await response.json();
        const employerJobs = allJobs.filter((job: any) => 
          job.postedBy === userData.email ||
          job.employerEmail === userData.email ||
          (userData.email === 'muthees@trinitetech.com' && job.company?.toLowerCase().includes('trinity'))
        );
        
        // Fetch application counts for each job
        const jobsWithCounts = await Promise.all(
          employerJobs.map(async (job: any) => {
            try {
              const appResponse = await fetch(`${API_ENDPOINTS.BASE_URL}/api/applications/job/${job._id}`);
              if (appResponse.ok) {
                const applications = await appResponse.json();
                const applicationCount = applications.length;
                const shortlistedCount = applications.filter((app: any) => app.status === 'shortlisted').length;
                return { ...job, applicationCount, shortlistedCount };
              }
            } catch (error) {
              console.error('Error fetching applications for job:', job._id, error);
            }
            return { ...job, applicationCount: 0, shortlistedCount: 0 };
          })
        );
        
        setJobs(jobsWithCounts);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (window.confirm('Are you sure you want to delete this job posting?')) {
      try {
        const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/jobs/${jobId}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          setJobs(jobs.filter(job => job._id !== jobId));
        }
      } catch (error) {
        console.error('Error deleting job:', error);
      }
    }
  };

  const handleSelectJob = (jobId: string) => {
    setSelectedJobs(prev => 
      prev.includes(jobId) 
        ? prev.filter(id => id !== jobId)
        : [...prev, jobId]
    );
  };

  const handleSelectAll = () => {
    setSelectedJobs(selectedJobs.length === filteredJobs.length ? [] : filteredJobs.map(job => job._id));
  };

  const filteredJobs = jobs.filter(job => {
    const jobTitle = job.jobTitle || job.title || '';
    const matchesSearch = jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.location?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || 
                         (filter === 'active' && (job.status === 'active' || !job.status)) ||
                         (filter === 'closed' && job.status === 'closed') ||
                         (filter === 'expired' && job.status === 'expired');
    return matchesSearch && matchesFilter;
  });

  const statusCounts = {
    all: jobs.length,
    active: jobs.filter(job => job.status === 'active').length,
    closed: jobs.filter(job => job.status === 'closed').length,
    expired: jobs.filter(job => job.status === 'expired').length
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BackButton 
          onClick={() => onNavigate('employer-dashboard')}
          text="Back to Dashboard"
          className="mb-6"
        />
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Job Management</h1>
            <p className="text-gray-600 mt-2">Manage your job postings and track responses</p>
          </div>
          <button
            onClick={() => onNavigate('job-posting')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Post New Job</span>
          </button>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <Filter className="w-5 h-5 text-gray-400" />
                <span className="font-medium text-gray-700">Filters</span>
              </div>
              <button
                onClick={() => {
                  const userData = localStorage.getItem('user');
                  if (userData) {
                    fetchEmployerJobs(JSON.parse(userData));
                  }
                }}
                className="flex items-center space-x-2 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
            </div>
            
            <div className="flex items-center space-x-4 mb-4">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by Title/Ref Code/Job ID"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="posted">Sort by: Posted/sent date</option>
                <option value="responses">Sort by: Response count</option>
                <option value="title">Sort by: Job title</option>
              </select>
            </div>
          </div>
          
          {/* Job Status Filters */}
          <div className="border-t px-4 py-3">
            <div className="flex items-center space-x-6">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedJobs.length === filteredJobs.length && filteredJobs.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Select All</span>
              </label>
              
              <div className="flex space-x-4">
                <button
                  onClick={() => setFilter('all')}
                  className={`text-sm font-medium ${
                    filter === 'all' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Active Jobs {statusCounts.active}
                </button>
                <button
                  onClick={() => setFilter('closed')}
                  className={`text-sm font-medium ${
                    filter === 'closed' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Closed Jobs {statusCounts.closed}
                </button>
                <button
                  onClick={() => setFilter('expired')}
                  className={`text-sm font-medium ${
                    filter === 'expired' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Expired Jobs {statusCounts.expired}
                </button>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-12">
            <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {jobs.length === 0 ? 'No job postings yet' : 'No jobs match your filters'}
            </h3>
            <p className="text-gray-500 mb-6">
              {jobs.length === 0 ? 'Create your first job posting to start hiring' : 'Try adjusting your search or filters'}
            </p>
            {jobs.length === 0 && (
              <button
                onClick={() => onNavigate('job-posting')}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Post Your First Job
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <CheckSquare className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-600">Select All</span>
                  <RefreshCw className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Refresh</span>
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Collaborate</span>
                  <span className="text-sm text-gray-600">Close</span>
                </div>
                <span className="text-sm text-gray-500">Sort by: Posted/sent date</span>
              </div>
            </div>
            
            <div className="divide-y divide-gray-200">
              {filteredJobs.map((job: Job) => (
                <div key={job._id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <input
                        type="checkbox"
                        checked={selectedJobs.includes(job._id)}
                        onChange={() => handleSelectJob(job._id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-1">
                          <h3 className="font-medium text-blue-600 hover:text-blue-700 cursor-pointer">
                            {job.jobTitle || job.title || 'Job Position'}
                          </h3>
                          {job.applicationCount > 0 && (
                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
                              {job.applicationCount} New
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">
                          {job.location} {job.company && `• ${job.company}`}
                        </div>
                        <div className="text-xs text-gray-500">
                          {job.status === 'active' ? 'Active' : job.status || 'Active'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-8">
                      <button
                        onClick={() => {
                          // Navigate to applications for this job
                          sessionStorage.setItem('selectedJobId', job._id);
                          sessionStorage.setItem('selectedJobTitle', job.jobTitle || job.title || 'Job Position');
                          sessionStorage.setItem('selectedJobCompany', job.company || 'Company');
                          onNavigate('application-management');
                        }}
                        className="text-center hover:bg-blue-50 p-2 rounded transition-colors"
                      >
                        <div className="text-lg font-semibold text-blue-600">{job.applicationCount || 0}</div>
                        <div className="text-xs text-gray-500">Total Responses</div>
                      </button>
                      
                      <div className="text-center">
                        <div className="text-lg font-semibold text-green-600">{job.shortlistedCount || 0}</div>
                        <div className="text-xs text-gray-500">Shortlisted</div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-sm text-gray-600">sent by Me</div>
                        <div className="text-xs text-gray-500">
                          {new Date(job.createdAt || job.created_at).toLocaleDateString('en-GB')}
                        </div>
                      </div>
                      
                      <button className="p-1 hover:bg-gray-100 rounded">
                        <MoreVertical className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default JobManagementPage;