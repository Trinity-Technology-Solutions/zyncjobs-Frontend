import React, { useState } from 'react';
import { API_ENDPOINTS } from '../config/api';
import { Zap, Check } from 'lucide-react';

interface QuickApplyButtonProps {
  jobId: string;
  jobTitle: string;
  company: string;
  user: any;
  onSuccess?: () => void;
  className?: string;
}

const QuickApplyButton: React.FC<QuickApplyButtonProps> = ({
  jobId,
  jobTitle,
  company,
  user,
  onSuccess,
  className = ''
}) => {
  const [isApplying, setIsApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  const handleQuickApply = async () => {
    // Get user from localStorage if not passed as prop
    const currentUser = user || JSON.parse(localStorage.getItem('user') || '{}');
    
    console.log('Quick Apply clicked, user:', currentUser);
    console.log('User resume data:', currentUser.resume);
    console.log('User profile resume:', currentUser.profile?.resume);
    
    if (!currentUser || !currentUser.email || (!currentUser.name && !currentUser.fullName)) {
      console.log('No user found, redirecting to login');
      alert('Please login to apply');
      return;
    }

    setIsApplying(true);
    try {
      // First, get the user's full profile including resume
      let userResume = '';
      let userPhone = currentUser.phone || '';
      
      // Get resume from user profile
      if (currentUser.resume) {
        const resume = currentUser.resume;
        if (resume.filename) {
          userResume = `/uploads/${resume.filename}`;
        } else if (resume.url) {
          userResume = resume.url;
        } else if (resume.path) {
          userResume = resume.path;
        } else if (typeof resume === 'string') {
          userResume = resume;
        } else {
          userResume = 'resume_from_profile';
        }
      } else if (currentUser.profile?.resume) {
        userResume = currentUser.profile.resume;
      } else {
        userResume = 'resume_from_quick_apply';
      }
      
      console.log('Using resume for quick apply:', userResume);

      // Copy/attach the resume file for this application
      let attachedResumeUrl = userResume;
      try {
        const attachResponse = await fetch(`${API_ENDPOINTS.BASE_URL}/api/resume/attach`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            resumeUrl: userResume,
            candidateEmail: currentUser.email,
            jobId: jobId
          })
        });
        
        if (attachResponse.ok) {
          const attachResult = await attachResponse.json();
          attachedResumeUrl = attachResult.resumeUrl;
          console.log('Resume attached successfully:', attachedResumeUrl);
        }
      } catch (error) {
        console.log('Resume attach failed, using original URL:', error);
      }

      const payload = {
        jobId,
        candidateEmail: currentUser.email,
        candidateName: currentUser.name || currentUser.fullName,
        candidatePhone: userPhone,
        resumeUrl: attachedResumeUrl,
        isQuickApply: true,
        coverLetter: 'Applied using Quick Apply with saved resume'
      };
      
      console.log('Sending quick apply with resume:', payload);
      
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      console.log('Quick apply response:', result);
      
      if (response.ok) {
        setApplied(true);
        onSuccess?.();
        alert('✅ Quick Apply successful! Your resume has been sent to the employer.');
        setTimeout(() => setApplied(false), 3000);
      } else {
        alert(result.error || 'Application failed');
      }
    } catch (error) {
      console.error('Quick apply error:', error);
      alert('Application failed. Please try again.');
    } finally {
      setIsApplying(false);
    }
  };

  if (applied) {
    return (
      <button
        disabled
        className={`flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg font-medium ${className}`}
      >
        <Check className="w-4 h-4" />
        <span>Applied!</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleQuickApply}
      disabled={isApplying}
      className={`flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 ${className}`}
    >
      <Zap className="w-4 h-4" />
      <span>{isApplying ? 'Applying...' : 'Quick Apply'}</span>
    </button>
  );
};

export default QuickApplyButton;