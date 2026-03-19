import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../config/env';
import { Zap, Check } from 'lucide-react';

const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return null;
  try {
    const res = await fetch(`${API_ENDPOINTS.BASE_URL}/token/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });
    if (!res.ok) return null;
    const data = await res.json();
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    return data.accessToken;
  } catch {
    return null;
  }
};

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
  const [hasApplied, setHasApplied] = useState(false);

  useEffect(() => {
    checkIfAlreadyApplied();
  }, [jobId, user]);

  const checkIfAlreadyApplied = async () => {
    if (!user?.email || !jobId) {
      console.log('Skipping check - user email:', user?.email, 'jobId:', jobId);
      return;
    }
    
    try {
      console.log('Checking if applied - Email:', user.email, 'JobId:', jobId);
      const url = `${API_ENDPOINTS.APPLICATIONS}?candidateEmail=${user.email}&jobId=${jobId}`;
      console.log('Fetch URL:', url);
      
      const response = await fetch(url);
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Raw response data:', data);
        
        const applications = Array.isArray(data) ? data : (data.applications || []);
        console.log('Parsed applications:', applications);
        
        const alreadyApplied = applications.some((app: any) => {
          const jobMatch = app.jobId?._id === jobId || app.jobId === jobId;
          const emailMatch = app.candidateEmail === user.email;
          const statusMatch = app.status !== 'withdrawn';
          console.log('App check:', { jobId: app.jobId, jobMatch, emailMatch, statusMatch, status: app.status });
          return jobMatch && emailMatch && statusMatch;
        });
        
        console.log('Final result - Already applied:', alreadyApplied);
        setHasApplied(alreadyApplied);
      } else {
        console.log('Response not ok:', response.statusText);
      }
    } catch (error) {
      console.error('Error checking application status:', error);
    }
  };

  const handleQuickApply = async () => {
    const currentUser = user || JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('accessToken');

    if (!currentUser?.email || (!currentUser?.name && !currentUser?.fullName)) {
      alert('Please login to apply for jobs.');
      return;
    }

    if (!token) {
      alert('Session expired. Please login again.');
      return;
    }

    setIsApplying(true);
    try {
      let userResume = '';
      let userPhone = currentUser.phone || '';
      
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

      let attachedResumeUrl = userResume;
      try {
        const attachResponse = await fetch(`${API_ENDPOINTS.BASE_URL}/resume/attach`, {
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
      
      let activeToken = token;
      let response = await fetch(`${API_ENDPOINTS.APPLICATIONS}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeToken}`
        },
        body: JSON.stringify(payload)
      });

      // Auto-refresh token and retry once if expired
      if (response.status === 401) {
        const data = await response.json();
        if (data.code === 'TOKEN_EXPIRED') {
          activeToken = await refreshAccessToken();
          if (!activeToken) {
            alert('Session expired. Please login again.');
            return;
          }
          response = await fetch(`${API_ENDPOINTS.APPLICATIONS}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${activeToken}`
            },
            body: JSON.stringify(payload)
          });
        }
      }

      const result = await response.json();
      console.log('Quick apply response:', result);
      
      if (response.ok) {
        setHasApplied(true);
        onSuccess?.();
        alert('✅ Quick Apply successful! Your resume has been sent to the employer.');
      } else {
        const errorMsg = result.errors?.[0]?.msg || result.error || 'Application failed';
        alert(errorMsg);
      }
    } catch (error) {
      console.error('Quick apply error:', error);
      alert('Application failed. Please try again.');
    } finally {
      setIsApplying(false);
    }
  };

  if (hasApplied) {
    return (
      <button
        disabled
        className={`flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg font-medium ${className}`}
      >
        <Check className="w-4 h-4" />
        <span>Applied</span>
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
