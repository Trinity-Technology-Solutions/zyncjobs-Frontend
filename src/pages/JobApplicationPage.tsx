import React, { useState, useEffect } from 'react';
import BackButton from '../components/BackButton';
import { API_ENDPOINTS } from '../config/env';

interface JobApplicationPageProps {
  onNavigate: (page: string) => void;
  jobId?: string;
  jobData?: {
    title: string;
    company: string;
    location: string;
    description: string;
    requirements?: string;
  };
}

interface ApplicationData {
  resumeFile: File | null;
  resumeFileName: string;
  resumeUrl: string;
  coverLetterFile: File | null;
  coverLetterFileName: string;
  workAuthorization: string;
}

const JobApplicationPage: React.FC<JobApplicationPageProps> = ({ onNavigate, jobId, jobData }) => {

  // Auth guard — redirect to login if not logged in
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    if (!user || !token) {
      window.dispatchEvent(new CustomEvent("zync:alert", { detail: { message: "Please login to apply for jobs." } }));
      onNavigate('login');
    }
  }, []);

  // Get job data from localStorage if available
  const getJobData = () => {
    if (jobData) return jobData;
    
    const savedJob = localStorage.getItem('selectedJob');
    if (savedJob) {
      try {
        return JSON.parse(savedJob);
      } catch (error) {
        console.error('Error parsing saved job data:', error);
      }
    }
    
    return {
      title: 'Job Title',
      company: 'Company Name', 
      location: 'Location',
      description: 'Job description will appear here when you apply for a specific job.',
      requirements: ''
    };
  };
  
  const currentJobData = getJobData();
  const [currentStep, setCurrentStep] = useState(1);
  const [applicationData, setApplicationData] = useState<ApplicationData>({
    resumeFile: null,
    resumeFileName: '',
    resumeUrl: '',
    coverLetterFile: null,
    coverLetterFileName: '',
    workAuthorization: 'US Citizen'
  });

  const updateData = (field: keyof ApplicationData, value: any) => {
    setApplicationData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    // Validate step 1 before proceeding
    if (currentStep === 1) {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const existingResume = userData?.resume;
      const hasResume = existingResume && (
        existingResume.name || existingResume.filename || existingResume.url ||
        existingResume.path || existingResume.status || typeof existingResume === 'string'
      );
      if (!hasResume && !applicationData.resumeFile) {
        window.dispatchEvent(new CustomEvent("zync:alert", { detail: { message: "Please upload your resume before proceeding." } }));
        return;
      }
      if (!userData.phone && !userData.name) {
        window.dispatchEvent(new CustomEvent("zync:alert", { detail: { message: "Your profile is missing required details (name, phone). Please update your profile first." } }));
        return;
      }
    }
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getProgressPercentage = () => {
    return (currentStep / 3) * 100;
  };

  // Step 1: Resume & Cover Letter
  const renderResumeStep = () => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    const existingResume = userData?.resume;
    
    // Check if user has any resume data
    const hasResume = existingResume && (
      existingResume.name || 
      existingResume.filename || 
      existingResume.url || 
      existingResume.path ||
      existingResume.status ||
      typeof existingResume === 'string'
    );

    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-700 via-indigo-800 to-blue-900 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-pink-500/30 to-purple-600/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-blue-400/30 to-indigo-600/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="relative max-w-3xl mx-auto px-6 py-6">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-violet-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg transform hover:scale-105 transition-transform">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m-8 0V6a2 2 0 00-2 2v6.341" />
              </svg>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 shadow-lg border border-white/20">
              <h2 className="text-sm font-medium text-indigo-200 mb-1 uppercase tracking-wide">You're Applying for</h2>
              <h1 className="text-2xl font-bold text-white mb-2">{currentJobData.title}</h1>
              <p className="text-base text-indigo-200 font-medium">@ {currentJobData.company} in {currentJobData.location}</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="w-full bg-white/20 rounded-full h-2.5 shadow-inner">
              <div className="bg-gradient-to-r from-pink-400 to-violet-400 h-2.5 rounded-full shadow-lg transition-all duration-500 ease-out" style={{ width: `${getProgressPercentage()}%` }}></div>
            </div>
            <div className="flex justify-between items-center mt-2">
              <p className="text-sm font-medium text-indigo-200">Step {currentStep} of 3</p>
              <p className="text-sm font-medium text-pink-300">{Math.round(getProgressPercentage())}% Complete</p>
            </div>
          </div>

          {/* Resume & Cover Letter Form */}
          <div className="bg-white/95 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-1">Resume & Cover Letter</h2>
              <p className="text-gray-500 text-sm">Upload your documents to get started</p>
            </div>
            
            {/* Resume Section */}
            <div className="mb-10">
              <label className="block text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <svg className="w-5 h-5 text-indigo-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Resume <span className="text-red-500 ml-1">*</span>
              </label>
              
              {hasResume || applicationData.resumeFile ? (
                <div className="border-2 border-green-200 rounded-2xl p-6 bg-gradient-to-r from-green-50 to-emerald-50 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-bold text-green-700 text-lg">
                          {applicationData.resumeFileName || existingResume?.name || 'Resume.pdf'}
                        </p>
                        <p className="text-sm text-green-600 font-medium flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {applicationData.resumeFile ? 'Just uploaded' : 'Ready for application'}
                        </p>
                      </div>
                    </div>
                    <button className="text-green-500 hover:text-green-700 p-2 rounded-full hover:bg-green-100 transition-colors">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border-3 border-dashed border-indigo-300 rounded-2xl p-8 text-center bg-gradient-to-br from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 transition-all duration-300 cursor-pointer group">
                  <input
                    type="file"
                    id="resume-upload"
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        try {
                          const formData = new FormData();
                          formData.append('resume', file);

                          // Send userId so backend can persist to Resume table
                          const userData = JSON.parse(localStorage.getItem('user') || '{}');
                          const uid = userData._id || userData.id || userData.userId || '';
                          const email = userData.email || '';
                          if (uid) formData.append('userId', uid);
                          if (email) formData.append('userEmail', email);

                          const token = localStorage.getItem('accessToken') || localStorage.getItem('token') || '';
                          const headers: Record<string, string> = {};
                          if (token) headers['Authorization'] = `Bearer ${token}`;

                          const response = await fetch(`${API_ENDPOINTS.BASE_URL}/upload/resume`, {
                            method: 'POST',
                            headers,
                            body: formData
                          });

                          const result = await response.json();

                          if (response.ok) {
                            updateData('resumeFile', file);
                            updateData('resumeFileName', file.name);
                            updateData('resumeUrl', result.fileUrl || result.file?.url);
                          } else {
                            window.dispatchEvent(new CustomEvent("zync:alert", { detail: { message: String('Upload failed: ' + result.error) } }));
                          }
                        } catch (error) {
                          window.dispatchEvent(new CustomEvent("zync:alert", { detail: { message: 'Upload failed: ' + (error as Error).message } }));
                        }
                      }
                    }}
                  />
                  <label htmlFor="resume-upload" className="cursor-pointer block">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-lg">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <p className="text-xl font-bold text-gray-800 mb-3">Upload your resume</p>
                    <p className="text-sm text-gray-600 bg-white/70 rounded-full px-4 py-2 inline-block">PDF, DOC, DOCX up to 10MB</p>
                  </label>
                </div>
              )}
            </div>

            {/* Cover Letter Section */}
            <div className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <label className="block text-lg font-semibold text-gray-800 flex items-center">
                  <svg className="w-5 h-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Cover letter
                </label>
                <span className="text-sm font-medium text-purple-600 bg-purple-100 px-3 py-1 rounded-full">Optional</span>
              </div>
              
              {applicationData.coverLetterFile ? (
                <div className="border-2 border-purple-200 rounded-2xl p-6 bg-gradient-to-r from-purple-50 to-pink-50 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-bold text-purple-700 text-lg">{applicationData.coverLetterFileName}</p>
                        <p className="text-sm text-purple-600 font-medium flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Just uploaded
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        updateData('coverLetterFile', null);
                        updateData('coverLetterFileName', '');
                      }}
                      className="text-purple-500 hover:text-red-600 p-2 rounded-full hover:bg-red-100 transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border-3 border-dashed border-purple-300 rounded-2xl p-8 text-center bg-gradient-to-br from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 transition-all duration-300 cursor-pointer group">
                  <input
                    type="file"
                    id="cover-letter-upload"
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        updateData('coverLetterFile', file);
                        updateData('coverLetterFileName', file.name);
                      }
                    }}
                  />
                  <label htmlFor="cover-letter-upload" className="cursor-pointer block">
                    <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-lg">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <p className="text-purple-700 font-bold text-lg">Upload your cover letter</p>
                    <p className="text-sm text-purple-600 mt-2">Stand out from other candidates</p>
                  </label>
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center pt-6 border-t border-gray-200">
              <BackButton 
                onClick={() => onNavigate('job-listings')}
                text="Back to Jobs"
              />
              <button
                onClick={nextStep}
                disabled={!hasResume && !applicationData.resumeFile}
                className={`px-8 py-3 rounded-2xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg ${
                  hasResume || applicationData.resumeFile
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-blue-500/25'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-gray-300/25'
                }`}
              >
                Continue
                <svg className="w-5 h-5 ml-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Step 2: Work Authorization
  const renderWorkAuthStep = () => (
    <div className="min-h-screen bg-gradient-to-br from-violet-700 via-indigo-800 to-blue-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-teal-400/30 to-emerald-600/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-cyan-400/30 to-indigo-600/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>
      
      <div className="relative max-w-3xl mx-auto px-6 py-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg transform hover:scale-105 transition-transform">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 shadow-lg border border-white/20">
            <h2 className="text-sm font-medium text-teal-200 mb-1 uppercase tracking-wide">You're Applying for</h2>
            <h1 className="text-2xl font-bold text-white mb-2">{currentJobData.title}</h1>
            <p className="text-base text-teal-200 font-medium">@ {currentJobData.company} in {currentJobData.location}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="w-full bg-white/20 rounded-full h-2.5 shadow-inner">
            <div className="bg-gradient-to-r from-teal-400 to-emerald-400 h-2.5 rounded-full shadow-lg transition-all duration-500 ease-out" style={{ width: `${getProgressPercentage()}%` }}></div>
          </div>
          <div className="flex justify-between items-center mt-2">
            <p className="text-sm font-medium text-teal-200">Step {currentStep} of 3</p>
            <p className="text-sm font-medium text-emerald-300">{Math.round(getProgressPercentage())}% Complete</p>
          </div>
        </div>

        {/* Work Authorization Form */}
        <div className="bg-white/95 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-1">Work Authorization</h2>
            <p className="text-gray-500 text-sm">Let us know your work eligibility status</p>
          </div>
          
          <div className="mb-10">
            <label htmlFor="work-auth-select" className="block text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <svg className="w-5 h-5 text-emerald-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Work Authorization <span className="text-red-500 ml-1">*</span>
            </label>
            
            <select
              id="work-auth-select"
              value={applicationData.workAuthorization}
              onChange={(e) => updateData('workAuthorization', e.target.value)}
              className="w-full border-2 border-emerald-200 rounded-2xl px-6 py-4 text-lg focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white shadow-lg transition-all duration-300 hover:border-emerald-300"
            >
              <option value="US Citizen">US Citizen</option>
              <option value="Green Card Holder">Green Card Holder</option>
              <option value="H1B Visa">H1B Visa</option>
              <option value="F1 Visa (OPT)">F1 Visa (OPT)</option>
              <option value="L1 Visa">L1 Visa</option>
              <option value="TN Permit Holder">TN Permit Holder</option>
              <option value="Other">Other</option>
              <option value="Require Sponsorship">Require Sponsorship</option>
            </select>
          </div>

          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 rounded-2xl mb-8 border border-emerald-200">
            <div className="flex items-start">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-emerald-800 font-medium mb-2">
                  By providing your Work Authorization status, you consent to us collecting and keeping this info consistent with our policies.
                </p>
                <button className="text-emerald-600 hover:text-emerald-700 text-sm font-medium flex items-center group">
                  Learn more
                  <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center pt-6 border-t border-gray-200">
            <button
              onClick={prevStep}
              className="flex items-center text-gray-600 hover:text-gray-800 font-medium px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <button
              onClick={nextStep}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-8 py-3 rounded-2xl font-bold text-lg hover:from-emerald-700 hover:to-teal-700 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-emerald-500/25"
            >
              Continue
              <svg className="w-5 h-5 ml-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Step 3: Review Application
  const renderReviewStep = () => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    const existingResume = userData?.resume;
    
    // Check if user has any resume data
    const hasResume = existingResume && (
      existingResume.name || 
      existingResume.filename || 
      existingResume.url || 
      existingResume.path ||
      existingResume.status ||
      typeof existingResume === 'string'
    );
    
    // Get resume name from various sources
    const getResumeName = () => {
      if (applicationData.resumeFileName) return applicationData.resumeFileName;
      if (existingResume?.name) return existingResume.name;
      if (existingResume?.filename) return existingResume.filename;
      return 'Resume.pdf';
    };
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-700 via-indigo-800 to-blue-900 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-rose-500/30 to-orange-600/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-amber-400/30 to-violet-600/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="relative max-w-3xl mx-auto px-6 py-6">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-rose-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg transform hover:scale-105 transition-transform">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 shadow-lg border border-white/20">
              <h2 className="text-sm font-medium text-rose-200 mb-1 uppercase tracking-wide">You're Applying for</h2>
              <h1 className="text-2xl font-bold text-white mb-2">{currentJobData.title}</h1>
              <p className="text-base text-rose-200 font-medium">@ {currentJobData.company} in {currentJobData.location}</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="w-full bg-white/20 rounded-full h-2.5 shadow-inner">
              <div className="bg-gradient-to-r from-rose-400 to-orange-400 h-2.5 rounded-full shadow-lg transition-all duration-500 ease-out" style={{ width: `${getProgressPercentage()}%` }}></div>
            </div>
            <div className="flex justify-between items-center mt-2">
              <p className="text-sm font-medium text-rose-200">Step {currentStep} of 3</p>
              <p className="text-sm font-medium text-orange-300">{Math.round(getProgressPercentage())}% Complete</p>
            </div>
          </div>

          {/* Review Application */}
          <div className="bg-white/95 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-rose-600 to-orange-600 bg-clip-text text-transparent mb-2">Review your application</h2>
              <p className="text-gray-600 text-lg">
                Take a moment to review the documents you're submitting for this application. Once you submit, this action cannot be undone.
              </p>
            </div>

            {/* Resume Section */}
            <div className="border-2 border-green-200 rounded-2xl p-6 mb-6 bg-gradient-to-r from-green-50 to-emerald-50 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-xl text-green-800 flex items-center">
                  <svg className="w-6 h-6 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Resume <span className="text-red-500 ml-1">*</span>
                </h3>
                <button className="text-green-600 hover:text-green-700 p-3 rounded-full border-2 border-green-200 hover:border-green-300 bg-white hover:bg-green-50 transition-all">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              </div>
              <p className="text-green-700 font-medium text-lg flex items-center">
                <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {getResumeName()}
              </p>
            </div>

            {/* Cover Letter Section */}
            <div className="border-2 border-purple-200 rounded-2xl p-6 mb-6 bg-gradient-to-r from-purple-50 to-pink-50 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-xl text-purple-800 flex items-center">
                  <svg className="w-6 h-6 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Cover Letter
                </h3>
                <button className="text-purple-600 hover:text-purple-700 p-3 rounded-full border-2 border-purple-200 hover:border-purple-300 bg-white hover:bg-purple-50 transition-all">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              </div>
              <p className="text-purple-700 font-medium text-lg flex items-center">
                {applicationData.coverLetterFileName ? (
                  <>
                    <svg className="w-5 h-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {applicationData.coverLetterFileName}
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="text-gray-500">No cover letter uploaded</span>
                  </>
                )}
              </p>
            </div>

            {/* Work Authorization Section */}
            <div className="border-2 border-blue-200 rounded-2xl p-6 mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg">
              <h3 className="font-bold text-xl text-blue-800 mb-4 flex items-center">
                <svg className="w-6 h-6 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Work Authorization
              </h3>
              <p className="text-blue-700 font-medium text-lg flex items-center">
                <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {applicationData.workAuthorization}
              </p>
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center pt-8 border-t border-gray-200">
              <button
                onClick={prevStep}
                className="flex items-center text-gray-600 hover:text-gray-800 font-medium px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
              <button
                onClick={async () => {
                  try {
                    console.log('🚀 Starting application submission...');
                    
                    const jobData = JSON.parse(localStorage.getItem('selectedJob') || '{}');
                    const userData = JSON.parse(localStorage.getItem('user') || '{}');
                    
                    console.log('📋 Job Data:', jobData);
                    console.log('👤 User Data:', userData);
                    
                    // Validate required data
                    if (!jobData._id && !jobData.id) {
                      window.dispatchEvent(new CustomEvent("zync:alert", { detail: { message: "❌ Job information is missing. Please go back and select a job." } }));
                      return;
                    }
                    
                    if (!userData.email) {
                      window.dispatchEvent(new CustomEvent("zync:alert", { detail: { message: "❌ User information is missing. Please log in again." } }));
                      return;
                    }
                    
                    // Get resume URL from various possible sources
                    let resumeUrl = '';
                    let resumeData = null;
                    
                    const serverBase = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '');

                    if (applicationData.resumeUrl) {
                      resumeUrl = applicationData.resumeUrl;
                    } else if (userData?.resume) {
                      const resume = userData.resume;
                      resumeData = resume;

                      if (resume.fileUrl) {
                        // Already a full URL from upload endpoint
                        resumeUrl = resume.fileUrl.startsWith('http') ? resume.fileUrl : `${serverBase}${resume.fileUrl}`;
                      } else if (resume.filename) {
                        resumeUrl = `${serverBase}/uploads/resumes/${resume.filename}`;
                      } else if (resume.url) {
                        resumeUrl = resume.url.startsWith('http') ? resume.url : `${serverBase}${resume.url}`;
                      } else if (resume.path) {
                        resumeUrl = resume.path.startsWith('http') ? resume.path : `${serverBase}/${resume.path.replace(/^\//, '')}`;
                      } else if (typeof resume === 'string' && resume.startsWith('http')) {
                        resumeUrl = resume;
                      }
                      // Do NOT save placeholder strings — leave resumeUrl empty if no real path
                    }
                    
                    const applicationPayload = {
                      jobId: jobData._id || jobData.id,
                      candidateId: userData._id || userData.id,
                      candidateName: userData.name || userData.fullName || 'Unknown',
                      candidateEmail: userData.email,
                      candidatePhone: userData.phone || '',
                      resumeUrl: resumeUrl,
                      resumeData: resumeData, // Include full resume data
                      workAuthorization: applicationData.workAuthorization,
                      coverLetter: applicationData.coverLetterFile ? 'Cover letter attached' : 'No cover letter'
                    };
                    
                    console.log('📤 Sending application payload:', applicationPayload);
                    console.log('🌐 API Endpoint:', API_ENDPOINTS.APPLICATIONS);
                    
                    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
                    if (!token) {
                      window.dispatchEvent(new CustomEvent("zync:alert", { detail: { message: "Session expired. Please login again." } }));
                      onNavigate('login');
                      return;
                    }

                    const response = await fetch(API_ENDPOINTS.APPLICATIONS, {
                      method: 'POST',
                      headers: { 
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${token}`
                      },
                      body: JSON.stringify(applicationPayload)
                    });
                    
                    console.log('📥 Response status:', response.status);
                    
                    const result = await response.json();
                    console.log('📋 Response data:', result);
                    
                    if (response.ok) {
                      console.log('✅ Application submitted successfully!');
                      window.dispatchEvent(new CustomEvent("zync:alert", { detail: { message: "🎉 Application submitted successfully! You can track your application in your dashboard." } }));
                      
                      // Update user's applied jobs in localStorage
                      const updatedUser = {
                        ...userData,
                        appliedJobs: [
                          ...(userData.appliedJobs || []),
                          {
                            jobId: jobData._id || jobData.id,
                            appliedAt: new Date().toISOString(),
                            status: 'applied',
                            jobTitle: jobData.title || jobData.jobTitle,
                            company: jobData.company
                          }
                        ]
                      };
                      localStorage.setItem('user', JSON.stringify(updatedUser));
                      
                      setTimeout(() => onNavigate('dashboard'), 2000);
                    } else {
                      console.error('❌ Application failed:', result);
                      window.dispatchEvent(new CustomEvent("zync:alert", { detail: { message: String(`❌ ${result.error || 'Failed to submit application. Please try again.'}`) } }));
                    }
                  } catch (error) {
                    console.error('❌ Application submission error:', error);
                    window.dispatchEvent(new CustomEvent("zync:alert", { detail: { message: "❌ Network error. Please check your connection and try again." } }));
                  }
                }}
                className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-10 py-4 rounded-2xl font-bold text-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105 shadow-2xl shadow-green-500/25 flex items-center"
              >
                <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Submit Application
                <svg className="w-6 h-6 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };



  return (
    <div>
      {currentStep === 1 && renderResumeStep()}
      {currentStep === 2 && renderWorkAuthStep()}
      {currentStep === 3 && renderReviewStep()}
    </div>
  );
};

export default JobApplicationPage;
