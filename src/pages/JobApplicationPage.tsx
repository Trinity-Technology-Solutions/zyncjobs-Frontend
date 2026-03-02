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
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
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
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto p-6">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m-8 0V6a2 2 0 00-2 2v6.341" />
              </svg>
            </div>
            <h2 className="text-sm text-gray-600 mb-2">You're Applying for</h2>
            <h1 className="text-2xl font-bold mb-2">{currentJobData.title}</h1>
            <p className="text-gray-600">@ {currentJobData.company} in {currentJobData.location}</p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${getProgressPercentage()}%` }}></div>
            </div>
            <p className="text-sm text-gray-600 mt-2">Step {currentStep} of 3</p>
          </div>

          {/* Resume & Cover Letter Form */}
          <div className="bg-white rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-6">Resume & Cover Letter</h2>
            
            {/* Resume Section */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Resume <span className="text-red-500">*</span>
              </label>
              
              {hasResume || applicationData.resumeFile ? (
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <svg className="w-8 h-8 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <div>
                        <p className="font-medium text-blue-600">
                          {applicationData.resumeFileName || existingResume?.name || 'Resume.pdf'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {applicationData.resumeFile ? 'Just uploaded' : 'Uploaded to application'}
                        </p>
                      </div>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
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
                          
                          const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/upload/resume`, {
                            method: 'POST',
                            body: formData
                          });
                          
                          const result = await response.json();
                          
                          if (response.ok) {
                            updateData('resumeFile', file);
                            updateData('resumeFileName', file.name);
                            updateData('resumeUrl', result.fileUrl);
                          } else {
                            alert('Upload failed: ' + result.error);
                          }
                        } catch (error) {
                          alert('Upload failed: ' + error.message);
                        }
                      }
                    }}
                  />
                  <label htmlFor="resume-upload" className="cursor-pointer">
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-lg font-medium text-gray-700 mb-2">Upload your resume</p>
                    <p className="text-sm text-gray-500">PDF, DOC, DOCX up to 10MB</p>
                  </label>
                </div>
              )}
            </div>

            {/* Cover Letter Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Cover letter
                </label>
                <span className="text-sm text-gray-500">Optional</span>
              </div>
              
              {applicationData.coverLetterFile ? (
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <svg className="w-8 h-8 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <div>
                        <p className="font-medium text-blue-600">{applicationData.coverLetterFileName}</p>
                        <p className="text-sm text-gray-500">Just uploaded</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        updateData('coverLetterFile', null);
                        updateData('coverLetterFileName', '');
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-blue-200 rounded-lg p-6 text-center bg-blue-50">
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
                  <label htmlFor="cover-letter-upload" className="cursor-pointer">
                    <svg className="w-8 h-8 text-blue-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-blue-600 font-medium">Upload your cover letter</p>
                  </label>
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center">
              <BackButton 
                onClick={() => onNavigate('job-listings')}
                text="Back to Jobs"
              />
              <button
                onClick={nextStep}
                disabled={!hasResume && !applicationData.resumeFile}
                className={`px-6 py-2 rounded-lg font-medium ${
                  hasResume || applicationData.resumeFile
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Step 2: Work Authorization
  const renderWorkAuthStep = () => (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m-8 0V6a2 2 0 00-2 2v6.341" />
            </svg>
          </div>
          <h2 className="text-sm text-gray-600 mb-2">You're Applying for</h2>
          <h1 className="text-2xl font-bold mb-2">{currentJobData.title}</h1>
          <p className="text-gray-600">@ {currentJobData.company} in {currentJobData.location}</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${getProgressPercentage()}%` }}></div>
          </div>
          <p className="text-sm text-gray-600 mt-2">Step {currentStep} of 3</p>
        </div>

        {/* Work Authorization Form */}
        <div className="bg-white rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-6">Work Authorization</h2>
          
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Work Authorization <span className="text-red-500">*</span>
            </label>
            
            <select
              value={applicationData.workAuthorization}
              onChange={(e) => updateData('workAuthorization', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
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

          <div className="bg-gray-50 p-4 rounded-lg mb-8">
            <p className="text-sm text-gray-600">
              By providing your Work Authorization status, you consent to us collecting and keeping this info consistent with our policies.
            </p>
            <button className="text-blue-600 hover:text-blue-700 text-sm mt-2 flex items-center">
              Learn more
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <button
              onClick={prevStep}
              className="flex items-center text-gray-600 hover:text-gray-800"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <button
              onClick={nextStep}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700"
            >
              Next
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
    
    // Get resume name from various sources
    const getResumeName = () => {
      if (applicationData.resumeFileName) return applicationData.resumeFileName;
      if (existingResume?.name) return existingResume.name;
      if (existingResume?.filename) return existingResume.filename;
      return 'Resume.pdf';
    };
    
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto p-6">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m-8 0V6a2 2 0 00-2 2v6.341" />
              </svg>
            </div>
            <h2 className="text-sm text-gray-600 mb-2">You're Applying for</h2>
            <h1 className="text-2xl font-bold mb-2">{currentJobData.title}</h1>
            <p className="text-gray-600">@ {currentJobData.company} in {currentJobData.location}</p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${getProgressPercentage()}%` }}></div>
            </div>
            <p className="text-sm text-gray-600 mt-2">Step {currentStep} of 3</p>
          </div>

          {/* Review Application */}
          <div className="bg-white rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-4">Review your application</h2>
            <p className="text-gray-600 mb-8">
              Take a moment to review the documents you're submitting for this application. Once you submit, this action cannot be undone.
            </p>

            {/* Resume Section */}
            <div className="border border-gray-200 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">Resume <span className="text-red-500">*</span></h3>
                <button className="text-blue-600 hover:text-blue-700 p-2 rounded-full border border-gray-200">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              </div>
              <p className="text-gray-700">
                {getResumeName()}
              </p>
            </div>

            {/* Cover Letter Section */}
            <div className="border border-gray-200 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">Cover Letter</h3>
                <button className="text-blue-600 hover:text-blue-700 p-2 rounded-full border border-gray-200">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              </div>
              <p className="text-gray-700">
                {applicationData.coverLetterFileName || 'No cover letter uploaded'}
              </p>
            </div>

            {/* Work Authorization Section */}
            <div className="border border-gray-200 rounded-lg p-6 mb-8">
              <h3 className="font-semibold text-lg mb-4">Work Authorization</h3>
              <p className="text-gray-700">{applicationData.workAuthorization}</p>
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center">
              <button
                onClick={prevStep}
                className="flex items-center text-gray-600 hover:text-gray-800"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                      alert('❌ Job information is missing. Please go back and select a job.');
                      return;
                    }
                    
                    if (!userData.email) {
                      alert('❌ User information is missing. Please log in again.');
                      return;
                    }
                    
                    // Get resume URL from various possible sources
                    let resumeUrl = '';
                    let resumeData = null;
                    
                    if (applicationData.resumeUrl) {
                      resumeUrl = applicationData.resumeUrl;
                    } else if (userData?.resume) {
                      const resume = userData.resume;
                      resumeData = resume; // Store the full resume object
                      
                      // For resume uploaded via modal (has status field)
                      if (resume.status) {
                        resumeUrl = `resume_${resume.name || 'uploaded'}`;
                      } else if (resume.filename) {
                        resumeUrl = `${API_ENDPOINTS.BASE_URL}/uploads/${resume.filename}`;
                      } else if (resume.url) {
                        resumeUrl = resume.url;
                      } else if (resume.path) {
                        resumeUrl = resume.path;
                      } else if (typeof resume === 'string') {
                        resumeUrl = resume;
                      } else {
                        resumeUrl = 'resume_uploaded';
                      }
                    }
                    
                    // If still no resume URL but we detected a resume, use a default
                    if (!resumeUrl && hasResume) {
                      resumeUrl = 'resume_from_profile';
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
                    
                    const response = await fetch(API_ENDPOINTS.APPLICATIONS, {
                      method: 'POST',
                      headers: { 
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                      },
                      body: JSON.stringify(applicationPayload)
                    });
                    
                    console.log('📥 Response status:', response.status);
                    
                    const result = await response.json();
                    console.log('📋 Response data:', result);
                    
                    if (response.ok) {
                      console.log('✅ Application submitted successfully!');
                      alert('🎉 Application submitted successfully! You can track your application in your dashboard.');
                      
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
                      
                      setTimeout(() => onNavigate('candidate-dashboard'), 2000);
                    } else {
                      console.error('❌ Application failed:', result);
                      alert(`❌ ${result.error || 'Failed to submit application. Please try again.'}`);
                    }
                  } catch (error) {
                    console.error('❌ Application submission error:', error);
                    alert('❌ Network error. Please check your connection and try again.');
                  }
                }}
                className="bg-green-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-green-700 flex items-center"
              >
                Submit Application
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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