import React from 'react';
import { CheckCircle, AlertCircle, User } from 'lucide-react';

interface ProfileCompletionProps {
  user: any;
  onNavigateToProfile: () => void;
}

const ProfileCompletion: React.FC<ProfileCompletionProps> = ({ user, onNavigateToProfile }) => {
  const calculateCompletion = () => {
    if (!user) return 0;
    
    let completed = 0;
    const total = 6;
    
    if (user.fullName) completed++;
    if (user.email) completed++;
    if (user.skills && user.skills.length > 0) completed++;
    if (user.location) completed++;
    if (user.experience) completed++;
    if (user.title) completed++;
    
    return Math.round((completed / total) * 100);
  };

  const completion = calculateCompletion();
  const isComplete = completion >= 80;

  if (isComplete) return null;

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
      <div className="flex items-start space-x-3">
        <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-yellow-800">Complete Your Profile</h3>
          <p className="text-sm text-yellow-700 mt-1">
            Your profile is {completion}% complete. Complete it to appear in employer searches.
          </p>
          <div className="mt-3">
            <div className="bg-yellow-200 rounded-full h-2">
              <div 
                className="bg-yellow-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${completion}%` }}
              ></div>
            </div>
          </div>
          <button
            onClick={onNavigateToProfile}
            className="mt-3 text-sm bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
          >
            Complete Profile
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileCompletion;