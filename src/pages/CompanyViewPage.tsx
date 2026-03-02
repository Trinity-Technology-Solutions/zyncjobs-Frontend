import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../config/api';
import { ArrowLeft, MapPin, Users, Globe, Building, Briefcase } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

interface CompanyViewPageProps {
  onNavigate: (page: string) => void;
  companyName: string;
  user?: {name: string, type: 'candidate' | 'employer'} | null;
  onLogout?: () => void;
}

const CompanyViewPage: React.FC<CompanyViewPageProps> = ({ onNavigate, companyName, user, onLogout }) => {
  const [company, setCompany] = useState<any>(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        // Fetch company details
        const companyResponse = await fetch(`${API_ENDPOINTS.BASE_URL}/api/companies?search=${encodeURIComponent(companyName)}`);
        if (companyResponse.ok) {
          const companies = await companyResponse.json();
          const foundCompany = companies.find(c => c.name === companyName);
          setCompany(foundCompany);
        }

        // Fetch jobs posted by this company
        const jobsResponse = await fetch(`${API_ENDPOINTS.BASE_URL}/api/jobs`);
        if (jobsResponse.ok) {
          const allJobs = await jobsResponse.json();
          const companyJobs = allJobs.filter(job => job.company === companyName);
          setJobs(companyJobs);
        }
      } catch (error) {
        console.error('Error fetching company data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyData();
  }, [companyName]);

  const getCompanyLogo = (name) => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=128&background=3b82f6&color=ffffff&bold=true`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Company Not Found</h1>
          <button
            onClick={() => onNavigate('companies')}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to Companies
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => onNavigate('companies')}
          className="flex items-center text-blue-600 hover:text-blue-700 font-medium mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Companies
        </button>

        {/* Company Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-6">
          <div className="flex items-start space-x-6">
            <img
              src={getCompanyLogo(company.name)}
              alt={company.name}
              className="w-32 h-32 rounded-lg border border-gray-200"
            />
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{company.name}</h1>
              <p className="text-lg text-gray-600 mb-4">{company.industry}</p>
              <p className="text-gray-700 mb-4">{company.description}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2 text-gray-600">
                  <MapPin className="w-5 h-5" />
                  <span>{company.location}</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600">
                  <Users className="w-5 h-5" />
                  <span>{company.employees} employees</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600">
                  <Globe className="w-5 h-5" />
                  <span>{company.website}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Open Positions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="flex items-center space-x-3 mb-6">
            <Briefcase className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Open Positions ({jobs.length})</h2>
          </div>

          {jobs.length === 0 ? (
            <div className="text-center py-12">
              <Building className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Open Positions</h3>
              <p className="text-gray-500">This company hasn't posted any jobs yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <div key={job._id} className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{job.title}</h3>
                      <div className="flex items-center space-x-4 text-gray-600 mb-3">
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-4 h-4" />
                          <span>{job.location}</span>
                        </div>
                        <span>•</span>
                        <span>{job.type}</span>
                        {job.salary && (
                          <>
                            <span>•</span>
                            <span className="text-green-600 font-medium">{job.salary}</span>
                          </>
                        )}
                      </div>
                      <p className="text-gray-700 line-clamp-2">{job.description}</p>
                    </div>
                    <button
                      onClick={() => onNavigate('job-detail', { jobTitle: job.title, jobId: job._id, companyName: job.company })}
                      className="ml-6 bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                      View Job
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default CompanyViewPage;