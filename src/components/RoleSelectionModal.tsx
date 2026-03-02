import React from 'react';
import { X, User, Building } from 'lucide-react';

interface RoleSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRole: (role: 'candidate' | 'employer') => void;
}

const RoleSelectionModal: React.FC<RoleSelectionModalProps> = ({ isOpen, onClose, onSelectRole }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="p-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Choose Your Role</h2>
            <p className="text-gray-600">Select the type of account you want to create:</p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => onSelectRole('candidate')}
              className="w-full border-2 border-gray-200 rounded-lg p-4 hover:border-blue-400 hover:bg-blue-50 transition-all text-left"
            >
              <div className="flex items-center space-x-4">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Candidate</h3>
                  <p className="text-gray-600 text-xs">
                    Looking for jobs? Create a profile to apply.
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => onSelectRole('employer')}
              className="w-full border-2 border-gray-200 rounded-lg p-4 hover:border-green-400 hover:bg-green-50 transition-all text-left"
            >
              <div className="flex items-center space-x-4">
                <div className="bg-green-100 p-2 rounded-lg">
                  <Building className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Employer</h3>
                  <p className="text-gray-600 text-xs">
                    Want to hire talent? Post jobs and find candidates.
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleSelectionModal;