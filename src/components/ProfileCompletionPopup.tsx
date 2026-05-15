import React, { useState } from 'react';
import { X, CheckCircle, Building2, ArrowRight, User, Mail, Phone, Globe } from 'lucide-react';

interface ProfileCompletionPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onCompleteProfile: () => void;
  userInfo?: {
    name?: string;
    email?: string;
    companyName?: string;
    industry?: string;
    companySize?: string;
    headquarters?: string;
    companyDescription?: string;
    companyWebsite?: string;
    tagline?: string;
  };
}

const ProfileCompletionPopup: React.FC<ProfileCompletionPopupProps> = ({
  isOpen,
  onClose,
  onCompleteProfile,
  userInfo
}) => {
  const [showDetails, setShowDetails] = useState(false);

  if (!isOpen) return null;

  // Calculate actual completion percentage
  const requiredFields = [
    userInfo?.companyName,
    userInfo?.industry,
    userInfo?.companySize,
    userInfo?.headquarters,
    userInfo?.companyDescription,
    userInfo?.companyWebsite,
    userInfo?.tagline,
    userInfo?.email
  ];
  
  const completedFields = requiredFields.filter(field => field && field.trim()).length;
  const completionPercentage = Math.round((completedFields / requiredFields.length) * 100);
  const isBasicInfoComplete = userInfo?.companyName && userInfo?.email;

  const completionItems = [
    { icon: Building2, text: 'Company Information', description: 'Add your company details, industry, and size' },
    { icon: User, text: 'Contact Details', description: 'Verify your company email and phone number' },
    { icon: Mail, text: 'Social Links', description: 'Connect your LinkedIn and other social profiles' },
    { icon: Globe, text: 'Company Benefits', description: 'Showcase what makes your company great' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl transform transition-all duration-300 scale-100 animate-slideUp">
        {/* Header */}
        <div className="relative p-6 pb-4">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          {/* Welcome Animation */}
          <div className="text-center mb-4">
            <div className="relative inline-block mb-4">
              <div className="absolute inset-0 rounded-2xl blur-xl opacity-40 bg-orange-400" />
              <div className="relative p-4 rounded-2xl shadow-lg bg-gradient-to-br from-orange-500 to-orange-600">
                <Building2 className="w-8 h-8 text-white" />
              </div>
            </div>
            
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Welcome to ZyncJobs! 🎉
            </h2>
            
            {userInfo?.name && (
              <p className="text-gray-600 text-sm mb-2">
                Hi <span className="font-semibold text-orange-600">{userInfo.name}</span>!
              </p>
            )}
            
            <p className="text-gray-500 text-sm">
              Complete your company profile to start attracting top talent
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          {/* Profile Status */}
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">Profile {completionPercentage === 0 ? 'Not Started' : 'In Progress'}</h3>
                <p className="text-xs text-gray-600">
                  {completionPercentage === 0 
                    ? 'Start your profile to unlock all features'
                    : 'Complete your profile to unlock all features'
                  }
                </p>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-orange-200 rounded-full h-2 mb-2">
              <div 
                className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
            <p className="text-xs text-orange-700 font-medium">{completionPercentage}% Complete</p>
          </div>

          {/* Current Profile Status */}
          {isBasicInfoComplete && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">Basic info added</span>
              </div>
              <p className="text-xs text-green-700">
                Company: {userInfo?.companyName} • Email: {userInfo?.email}
              </p>
            </div>
          )}

          {/* What you'll add */}
          <div className="mb-4">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center justify-between w-full text-left p-2 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <span className="text-sm font-medium text-gray-700">
                {completionPercentage < 50 
                  ? "What you'll add to your profile" 
                  : "Complete your remaining profile sections"
                }
              </span>
              <ArrowRight className={`w-4 h-4 text-gray-400 transition-transform ${showDetails ? 'rotate-90' : ''}`} />
            </button>
            
            {showDetails && (
              <div className="mt-2 space-y-2">
                {completionItems.map((item, index) => (
                  <div key={index} className="flex items-start gap-3 p-2">
                    <div className="w-6 h-6 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <item.icon className="w-3 h-3 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.text}</p>
                      <p className="text-xs text-gray-500">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Benefits */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <h4 className="font-semibold text-blue-900 text-sm mb-2">Why complete your profile?</h4>
            <ul className="space-y-1 text-xs text-blue-700">
              <li className="flex items-center gap-2">
                <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                Get 3x more quality applications
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                Build trust with verified company info
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                Unlock advanced hiring features
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                Improve your company's visibility
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={onCompleteProfile}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 px-4 rounded-xl font-semibold text-sm hover:from-orange-600 hover:to-orange-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {completionPercentage > 0 ? 'Continue Profile Setup' : 'Complete Profile Now'}
            </button>
            
            <button
              onClick={onClose}
              className="w-full border border-gray-300 text-gray-600 py-2.5 px-4 rounded-xl font-medium text-sm hover:bg-gray-50 transition-colors"
            >
              I'll do this later
            </button>
          </div>

          {/* Footer Note */}
          <p className="text-xs text-gray-400 text-center mt-4">
            {completionPercentage > 50 
              ? 'Almost done! Just a few more details needed'
              : 'Takes only 3-5 minutes to complete'
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProfileCompletionPopup;