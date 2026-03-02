import React from 'react';
import { FileText, Zap, User, X } from 'lucide-react';

interface WelcomeParserPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenParser: () => void;
}

const WelcomeParserPopup: React.FC<WelcomeParserPopupProps> = ({ 
  isOpen, 
  onClose, 
  onOpenParser 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full mx-4 p-6 relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Zap className="w-8 h-8 text-white" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Complete Your Profile Instantly!
          </h2>
          
          <p className="text-gray-600 mb-6">
            Upload your resume and let our AI automatically fill your profile with your information. 
            Save time and get better job matches!
          </p>

          <div className="flex items-center justify-center space-x-8 mb-6">
            <div className="text-center">
              <FileText className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Upload Resume</p>
            </div>
            <div className="text-2xl text-gray-300">→</div>
            <div className="text-center">
              <Zap className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="text-sm text-gray-600">AI Parsing</p>
            </div>
            <div className="text-2xl text-gray-300">→</div>
            <div className="text-center">
              <User className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Complete Profile</p>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => {
                onClose();
                onOpenParser();
              }}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all"
            >
              🚀 Auto-Fill My Profile
            </button>
            
            <button
              onClick={onClose}
              className="w-full text-gray-600 py-2 px-4 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeParserPopup;