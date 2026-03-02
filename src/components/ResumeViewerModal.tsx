import React from 'react';
import { X, Download, FileText, User, Mail, Calendar } from 'lucide-react';

interface ResumeViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  resumeUrl: string;
  candidateName: string;
  application?: any;
}

const ResumeViewerModal: React.FC<ResumeViewerModalProps> = ({ 
  isOpen, 
  onClose, 
  resumeUrl, 
  candidateName,
  application
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {candidateName}'s Resume
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="flex-1 p-6 overflow-y-auto">
          {/* Candidate Information */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <div className="flex items-center mb-4">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mr-4">
                <span className="text-white font-bold text-2xl">
                  {candidateName?.charAt(0).toUpperCase() || 'C'}
                </span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{candidateName}</h3>
                <p className="text-gray-600">{application?.candidateEmail}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center text-gray-600">
                <Mail className="w-5 h-5 mr-2" />
                <span>{application?.candidateEmail}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Calendar className="w-5 h-5 mr-2" />
                <span>Applied: {new Date(application?.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Application Details */}
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Position Applied For</h4>
              <p className="text-gray-700 bg-blue-50 p-3 rounded-lg">
                {application?.jobId?.jobTitle || application?.jobId?.title || 'Software Developer'}
              </p>
            </div>

            {application?.coverLetter && application.coverLetter !== 'No cover letter' && (
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Cover Letter</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700 whitespace-pre-wrap">{application.coverLetter}</p>
                </div>
              </div>
            )}

            {application?.skills && application.skills.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {application.skills.map((skill: string, index: number) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {application?.experience && (
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Experience</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700">
                    {typeof application.experience === 'number' 
                      ? `${application.experience} years of experience`
                      : application.experience
                    }
                  </p>
                </div>
              </div>
            )}

            {/* Resume File Information */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Resume File</h4>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="w-8 h-8 text-yellow-600 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">Resume Document</p>
                      <p className="text-sm text-gray-600">Submitted with application</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-2">Resume file is stored securely</p>
                    <p className="text-xs text-gray-500">Contact candidate for resume access</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-blue-900 mb-2">Contact Candidate</h4>
              <p className="text-blue-700 mb-3">
                To request the resume document or schedule an interview, contact the candidate directly:
              </p>
              <a
                href={`mailto:${application?.candidateEmail}?subject=Regarding your application for ${application?.jobId?.jobTitle || 'Software Developer'}`}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center"
              >
                <Mail className="w-4 h-4 mr-2" />
                Send Email
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeViewerModal;