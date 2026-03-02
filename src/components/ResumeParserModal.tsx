import React, { useState } from 'react';
import { API_ENDPOINTS } from '../config/api';
import { X, Upload, FileText, User, CheckCircle, Loader } from 'lucide-react';

interface ResumeParserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdate: (profileData: any) => void;
}

const ResumeParserModal: React.FC<ResumeParserModalProps> = ({ 
  isOpen, 
  onClose, 
  onProfileUpdate 
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parsedData, setParsedData] = useState<any>(null);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    // Validate file
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      setError('Only PDF and DOC files are allowed');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setUploading(true);
    setError('');

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('resume', file);

      console.log('Uploading file:', file.name, file.type);

      setUploading(false);
      setParsing(true);

      // Upload and parse resume with backend
      const parseResponse = await fetch(`${API_ENDPOINTS.BASE_URL}/api/resume/upload-and-parse`, {
        method: 'POST',
        body: formData // Don't set Content-Type header, let browser set it with boundary
      });

      const parseResult = await parseResponse.json();
      setParsing(false);

      console.log('Parse result:', parseResult);

      if (parseResponse.ok && parseResult.success) {
        setParsedData(parseResult.profileData);
      } else {
        setError(parseResult.error || 'Parsing failed');
      }
    } catch (error) {
      setUploading(false);
      setParsing(false);
      console.error('Upload error:', error);
      setError('Upload failed. Please try again.');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleApplyToProfile = () => {
    if (parsedData) {
      onProfileUpdate(parsedData);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            Resume Parser - Auto-Fill Profile
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {!parsedData && !uploading && !parsing && (
            <div>
              <div className="text-center mb-6">
                <User className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Upload Your Resume</h3>
                <p className="text-gray-600">
                  Our AI will automatically extract your information and fill your profile
                </p>
              </div>

              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                }`}
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Drop your resume here</h3>
                <p className="text-gray-500 mb-4">or click to browse files</p>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="resume-parser-upload"
                />
                <label
                  htmlFor="resume-parser-upload"
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg cursor-pointer hover:bg-blue-700"
                >
                  Choose Resume File
                </label>
                <p className="text-xs text-gray-400 mt-2">PDF, DOC, DOCX (Max 5MB)</p>
              </div>
            </div>
          )}

          {(uploading || parsing) && (
            <div className="text-center py-12">
              <Loader className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
              <h3 className="text-lg font-medium mb-2">
                {uploading ? 'Uploading resume...' : 'Parsing with AI...'}
              </h3>
              <p className="text-gray-500">
                {uploading ? 'Please wait while we process your file' : 'Extracting your profile information automatically using advanced AI'}
              </p>
              <div className="mt-4 text-sm text-blue-600">
                {uploading ? '⬆️ Uploading...' : '🤖 AI Processing...'}
              </div>
            </div>
          )}

          {parsedData && (
            <div className="space-y-6">
              <div className="text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-green-600 mb-2">🎉 Profile Data Extracted!</h3>
                <p className="text-gray-600">Review the information below and apply to your profile</p>
                <div className="mt-2 text-xs text-gray-500">
                  🤖 Powered by AI Resume Parser
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {parsedData.name && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">👤 Name</label>
                      <div className="p-3 bg-gray-50 rounded border">{parsedData.name}</div>
                    </div>
                  )}
                  
                  {parsedData.email && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">📧 Email</label>
                      <div className="p-3 bg-gray-50 rounded border">{parsedData.email}</div>
                    </div>
                  )}
                  
                  {parsedData.phone && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">📞 Phone</label>
                      <div className="p-3 bg-gray-50 rounded border">{parsedData.phone}</div>
                    </div>
                  )}
                  
                  {parsedData.location && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">📍 Location</label>
                      <div className="p-3 bg-gray-50 rounded border">{parsedData.location}</div>
                    </div>
                  )}
                  
                  {parsedData.title && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">💼 Job Title</label>
                      <div className="p-3 bg-gray-50 rounded border">{parsedData.title}</div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {parsedData.experience > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">🕰️ Experience (Years)</label>
                      <div className="p-3 bg-gray-50 rounded border">{parsedData.experience}</div>
                    </div>
                  )}
                  
                  {parsedData.education && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">🎓 Education</label>
                      <div className="p-3 bg-gray-50 rounded border">{parsedData.education}</div>
                    </div>
                  )}
                  
                  {parsedData.skills.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">🛠️ Skills ({parsedData.skills.length})</label>
                      <div className="p-3 bg-gray-50 rounded border">
                        <div className="flex flex-wrap gap-1">
                          {parsedData.skills.map((skill: string, index: number) => (
                            <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {parsedData.summary && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">📝 Professional Summary</label>
                      <div className="p-3 bg-gray-50 rounded border text-sm">{parsedData.summary}</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={handleApplyToProfile}
                  className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 font-medium transition-colors"
                >
                  ✅ Apply to My Profile
                </button>
                <button
                  onClick={() => {
                    setParsedData(null);
                    setError('');
                  }}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  🔄 Try Another Resume
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="text-red-500 mr-2">⚠️</div>
                <div>
                  <h4 className="text-red-800 font-medium">Upload Error</h4>
                  <p className="text-red-700 text-sm mt-1">{error}</p>
                  <p className="text-red-600 text-xs mt-2">
                    💡 Tip: Make sure your file is a valid PDF or DOC file under 5MB
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResumeParserModal;