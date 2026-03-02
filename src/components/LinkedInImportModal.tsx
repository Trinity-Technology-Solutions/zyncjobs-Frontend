import React, { useState } from 'react';
import { API_ENDPOINTS } from '../config/api';
import { X, Linkedin, Sparkles, Upload } from 'lucide-react';

interface LinkedInImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: any) => void;
}

const LinkedInImportModal: React.FC<LinkedInImportModalProps> = ({ isOpen, onClose, onImport }) => {
  const [linkedInText, setLinkedInText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleParse = async () => {
    if (!linkedInText.trim()) {
      setError('Please paste your LinkedIn profile text');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/parse-linkedin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: linkedInText })
      });

      if (!response.ok) throw new Error('Failed to parse LinkedIn profile');

      const data = await response.json();
      onImport(data);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Linkedin className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Import from LinkedIn</h2>
              <p className="text-sm text-gray-600">Paste your LinkedIn profile to auto-fill</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2 flex items-center">
              <Sparkles className="w-4 h-4 mr-2" />
              How to use:
            </h3>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Go to your LinkedIn profile</li>
              <li>Select and copy all text (Ctrl+A, Ctrl+C)</li>
              <li>Paste it in the box below</li>
              <li>Click "Parse with AI" - we'll extract your info automatically!</li>
            </ol>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Paste LinkedIn Profile Text
            </label>
            <textarea
              value={linkedInText}
              onChange={(e) => setLinkedInText(e.target.value)}
              className="w-full h-64 border border-gray-300 rounded-lg p-4 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Paste your entire LinkedIn profile here...

Example:
John Doe
Software Engineer at Google
San Francisco, CA

Experience:
Software Engineer
Google • Full-time
Jan 2020 - Present
- Developed scalable web applications
- Led team of 5 engineers

Education:
Stanford University
Bachelor of Science - Computer Science
2016 - 2020

Skills:
Python, React, AWS, Docker..."
            />
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleParse}
              disabled={loading || !linkedInText.trim()}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                  <span>Parsing with AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Parse with AI</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LinkedInImportModal;
