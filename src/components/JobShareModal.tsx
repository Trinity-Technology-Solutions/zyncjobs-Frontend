import React, { useState } from 'react';
import { X, Copy } from 'lucide-react';
import { generateJobShareContent, shareToLinkedIn, shareToTwitter, shareToWhatsApp, copyToClipboard } from '../utils/socialShare';

interface JobShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: any;
  user?: any;
}

const JobShareModal: React.FC<JobShareModalProps> = ({ isOpen, onClose, job, user }) => {
  const [copied, setCopied] = useState(false);
  const [linkedInCopied, setLinkedInCopied] = useState(false);

  if (!isOpen || !job) return null;

  const shareContent = generateJobShareContent(job);
  const jobUrl = shareContent.url;

  const handleCopyLink = async () => {
    const success = await copyToClipboard(jobUrl);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLinkedInShare = () => {
    shareToLinkedIn(shareContent);
    setLinkedInCopied(true);
    setTimeout(() => setLinkedInCopied(false), 3000);
  };

  const handleTwitterShare = () => {
    shareToTwitter(shareContent);
  };

  const handleWhatsAppShare = () => {
    shareToWhatsApp(shareContent);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">Share Job</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Share Options */}
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900 mb-4">Share to:</h4>
            
            {/* LinkedIn */}
            <button
              onClick={handleLinkedInShare}
              className="w-full flex items-center space-x-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 bg-blue-600 rounded flex items-center justify-center">
                <span className="text-white font-bold text-sm">in</span>
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-gray-900">LinkedIn</p>
                <p className="text-sm text-gray-600">Share with your professional network</p>
              </div>
            </button>

            {/* Twitter */}
            <button
              onClick={handleTwitterShare}
              className="w-full flex items-center space-x-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 bg-black rounded flex items-center justify-center">
                <span className="text-white font-bold text-sm">X</span>
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-gray-900">X (Twitter)</p>
                <p className="text-sm text-gray-600">Share with your followers</p>
              </div>
            </button>

            {/* WhatsApp */}
            <button
              onClick={handleWhatsAppShare}
              className="w-full flex items-center space-x-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 bg-green-500 rounded flex items-center justify-center">
                <span className="text-white font-bold text-sm">W</span>
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-gray-900">WhatsApp</p>
                <p className="text-sm text-gray-600">Share with contacts</p>
              </div>
            </button>

            {/* Copy Link */}
            <button
              onClick={handleCopyLink}
              className="w-full flex items-center space-x-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 bg-gray-600 rounded flex items-center justify-center">
                <Copy className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-gray-900">
                  {copied ? 'Link Copied!' : 'Copy Link'}
                </p>
                <p className="text-sm text-gray-600">
                  {copied ? 'Link copied to clipboard' : 'Copy job link to share anywhere'}
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobShareModal;