import React from 'react';
import { ArrowLeft } from 'lucide-react';
import BackButton from '../components/BackButton';
import JobAlertsManager from '../components/JobAlertsManager';

interface JobAlertsPageProps {
  onNavigate: (page: string) => void;
  user: any;
}

const JobAlertsPage: React.FC<JobAlertsPageProps> = ({ onNavigate, user }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-4">
            <BackButton 
              variant="inline"
              label="Back to Dashboard"
              fallbackPage="candidate-dashboard"
              onNavigate={onNavigate}
              className="flex items-center text-gray-600 hover:text-gray-900"
            />
            <div className="h-6 w-px bg-gray-300"></div>
            <h1 className="text-2xl font-bold text-gray-900">Job Alerts</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <p className="text-gray-600">
            Set up job alerts to get notified when new jobs matching your criteria are posted. 
            You can create multiple alerts for different job types, locations, or companies.
          </p>
        </div>

        <JobAlertsManager user={user} />
      </div>
    </div>
  );
};

export default JobAlertsPage;