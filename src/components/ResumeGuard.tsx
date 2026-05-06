import React, { useState, useEffect } from 'react';
import { FileText, AlertTriangle, Upload, ArrowRight } from 'lucide-react';
import { validateUserResume, ResumeValidationResult } from '../utils/resumeValidation';

interface ResumeGuardProps {
  user?: any;
  onNavigate?: (page: string) => void;
  children: React.ReactNode;
  fallbackComponent?: React.ReactNode;
  showInlineWarning?: boolean;
  requireResume?: boolean;
}

const ResumeGuard: React.FC<ResumeGuardProps> = ({
  user,
  onNavigate,
  children,
  fallbackComponent,
  showInlineWarning = true,
  requireResume = true
}) => {
  const [resumeStatus, setResumeStatus] = useState<ResumeValidationResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkResumeStatus();
  }, [user]);

  const checkResumeStatus = async () => {
    if (!requireResume) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const userData = user || JSON.parse(localStorage.getItem('user') || '{}');
      if (!userData.email) {
        setResumeStatus({ hasResume: false, message: 'User not logged in' });
        setLoading(false);
        return;
      }

      const validation = await validateUserResume(userData.email);
      setResumeStatus(validation);
    } catch (error) {
      console.error('Resume validation error:', error);
      setResumeStatus({ hasResume: false, message: 'Error checking resume status' });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If resume is not required or user has resume, show children
  if (!requireResume || (resumeStatus?.hasResume)) {
    return <>{children}</>;
  }

  // If custom fallback component is provided, use it
  if (fallbackComponent) {
    return <>{fallbackComponent}</>;
  }

  // Default fallback UI
  if (showInlineWarning) {
    return (
      <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-6 text-center">
        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-orange-600" />
        </div>
        <h3 className="text-lg font-semibold text-orange-800 mb-2">Resume Required</h3>
        <p className="text-orange-700 mb-4 max-w-md mx-auto">
          {resumeStatus?.message || 'You need to upload your resume before you can apply for jobs.'}
        </p>
        <button
          onClick={() => onNavigate?.('dashboard')}
          className="inline-flex items-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors"
        >
          <Upload className="w-4 h-4" />
          Upload Resume
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // Minimal fallback
  return (
    <div className="text-center py-4">
      <p className="text-orange-600 text-sm">
        {resumeStatus?.message || 'Resume required to access this feature.'}
      </p>
    </div>
  );
};

export default ResumeGuard;