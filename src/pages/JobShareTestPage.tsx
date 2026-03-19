import React, { useState } from 'react';
import { Share2, ExternalLink } from 'lucide-react';
import JobShareModal from '../components/JobShareModal';

const JobShareTestPage: React.FC = () => {
  const [showShareModal, setShowShareModal] = useState(false);

  // Sample job data for testing
  const sampleJob = {
    _id: '507f1f77bcf86cd799439011',
    jobTitle: 'Manager, Accounting (Laboratory Services)',
    title: 'Manager, Accounting (Laboratory Services)',
    company: 'TrinityTech',
    location: 'New York, NY',
    type: 'Full-time',
    salary: {
      min: 75000,
      max: 95000,
      currency: 'USD',
      period: 'per year'
    },
    experience: '5-7 years',
    description: 'We are seeking an experienced Accounting Manager to oversee our laboratory services financial operations. The ideal candidate will have strong analytical skills and experience in healthcare or laboratory environments.',
    skills: ['Accounting', 'Financial Analysis', 'Laboratory Operations', 'Team Management', 'Compliance'],
    benefits: ['Health Insurance', 'Dental Coverage', '401k Matching', 'Flexible Work Schedule'],
    createdAt: new Date().toISOString(),
    employerEmail: 'hr@trinitytech.com',
    postedBy: 'hr@trinitytech.com'
  };

  const sampleUser = {
    name: 'Mutheeswaran Ganesan',
    type: 'candidate' as const,
    email: 'mutheeswaran@example.com'
  };

  const jobUrl = `${window.location.origin}/job-detail?id=${sampleJob._id}`;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Job Sharing Test Page</h1>
          
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Sample Job Posting</h2>
            <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{sampleJob.jobTitle}</h3>
                  <p className="text-lg text-blue-600 font-semibold mb-2">{sampleJob.company}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>📍 {sampleJob.location}</span>
                    <span>💼 {sampleJob.type}</span>
                    <span>💰 ${sampleJob.salary.min.toLocaleString()}-${sampleJob.salary.max.toLocaleString()} {sampleJob.salary.period}</span>
                    <span>🎯 {sampleJob.experience} experience</span>
                  </div>
                </div>
                <button
                  onClick={() => setShowShareModal(true)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Share2 className="w-5 h-5" />
                  <span>Share Job</span>
                </button>
              </div>
              
              <p className="text-gray-700 mb-4">{sampleJob.description}</p>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {sampleJob.skills.map((skill, index) => (
                  <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">How Job Sharing Works</h2>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">1</div>
                <div>
                  <h3 className="font-semibold text-gray-900">Click Share Button</h3>
                  <p className="text-gray-600">Click the share button on any job posting to open the share modal.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">2</div>
                <div>
                  <h3 className="font-semibold text-gray-900">Preview Social Media Post</h3>
                  <p className="text-gray-600">See how your job share will look on social media platforms like LinkedIn.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">3</div>
                <div>
                  <h3 className="font-semibold text-gray-900">Share to Platform</h3>
                  <p className="text-gray-600">Choose your preferred platform (LinkedIn, Twitter, WhatsApp, etc.) to share the job.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">4</div>
                <div>
                  <h3 className="font-semibold text-gray-900">Direct Link to Job Details</h3>
                  <p className="text-gray-600">When someone clicks the shared content, they'll be taken directly to the job details page.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Generated Job URL</h3>
            <div className="flex items-center space-x-2">
              <code className="bg-white px-3 py-2 rounded border text-sm flex-1 text-blue-800">
                {jobUrl}
              </code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(jobUrl);
                  alert('URL copied to clipboard!');
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors flex items-center space-x-1"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Copy</span>
              </button>
            </div>
            <p className="text-blue-700 text-sm mt-2">
              This URL will take users directly to the job details page when clicked from shared content.
            </p>
          </div>
        </div>
      </div>

      {/* Job Share Modal */}
      <JobShareModal 
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        job={sampleJob}
        user={sampleUser}
      />
    </div>
  );
};

export default JobShareTestPage;