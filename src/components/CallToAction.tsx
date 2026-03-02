import React from 'react';

interface CallToActionProps {
  onNavigate?: (page: string, data?: any) => void;
}

const CallToAction: React.FC<CallToActionProps> = ({ onNavigate }) => {
  return (
    <div className="bg-blue-600 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h3 className="text-2xl lg:text-3xl font-bold text-white mb-6">
            Let's Get Connected And Start<br />
            Finding Your Dream Job
          </h3>
          <button
            onClick={() => onNavigate && onNavigate('register')}
            className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Click Here
          </button>
        </div>
      </div>
    </div>
  );
};

export default CallToAction;