import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface ResumeModalProps {
  applicationId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const ResumeModal: React.FC<ResumeModalProps> = ({ applicationId, isOpen, onClose }) => {
  const [resume, setResume] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && applicationId) {
      fetchResume();
    }
  }, [isOpen, applicationId]);

  const fetchResume = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/resume-viewer/${applicationId}`);
      if (!response.ok) throw new Error('Failed to load resume');
      const data = await response.json();
      setResume(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load resume');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(`/api/resume-viewer/download/${applicationId}`);
      if (!response.ok) throw new Error('Failed to download');
      const data = await response.json();
      window.open(data.fileUrl, '_blank');
    } catch (err) {
      setError('Failed to download resume');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">{resume?.candidateName ? `Resume - ${resume.candidateName}` : 'Resume'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading && <div className="text-center py-8 text-gray-600">Loading resume...</div>}
          
          {error && <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4">{error}</div>}

          {resume && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* PDF Viewer */}
              <div className="lg:col-span-2">
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <iframe
                    src={resume.resume?.fileUrl}
                    width="100%"
                    height="600"
                    title="Resume"
                    className="w-full"
                  />
                </div>
              </div>

              {/* Resume Details */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold mb-4">{resume.resume?.parsedData?.name}</h3>
                
                {resume.resume?.parsedData?.email && (
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="font-medium">Email:</span> {resume.resume.parsedData.email}
                  </p>
                )}
                
                {resume.resume?.parsedData?.phone && (
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="font-medium">Phone:</span> {resume.resume.parsedData.phone}
                  </p>
                )}
                
                {resume.resume?.parsedData?.location && (
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="font-medium">Location:</span> {resume.resume.parsedData.location}
                  </p>
                )}
                
                {resume.resume?.parsedData?.title && (
                  <p className="text-sm text-gray-600 mb-4">
                    <span className="font-medium">Title:</span> {resume.resume.parsedData.title}
                  </p>
                )}

                {resume.resume?.parsedData?.skills?.length > 0 && (
                  <div className="mb-4 pb-4 border-b border-gray-200">
                    <h4 className="font-medium text-sm mb-2">Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {resume.resume.parsedData.skills.map((skill: string, idx: number) => (
                        <span key={idx} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {resume.resume?.parsedData?.experience && (
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="font-medium">Experience:</span> {resume.resume.parsedData.experience} years
                  </p>
                )}

                {resume.resume?.parsedData?.education && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Education:</span> {resume.resume.parsedData.education}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200 justify-end">
          <button
            onClick={handleDownload}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            📥 Download Resume
          </button>
          <button
            onClick={onClose}
            className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResumeModal;

