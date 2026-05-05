import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../config/env';
import { apiFetch } from '../api/apiFetch';
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
  const [hasApplied, setHasApplied] = useState(false);

  useEffect(() => {
    checkIfAlreadyApplied();
  }, [jobId, user]);

  const checkIfAlreadyApplied = async () => {
    if (!user?.email || !jobId) return;
    try {
      const response = await fetch(`${API_ENDPOINTS.APPLICATIONS}?candidateEmail=${user.email}&jobId=${jobId}`);
      if (response.ok) {
        const data = await response.json();
        const applications = Array.isArray(data) ? data : (data.applications || []);
        // Only count as "applied" if status is NOT withdrawn
        // ai_rejected is an INTERNAL employer status — candidate still sees it as "applied"
        const alreadyApplied = applications.some((app: any) => {
          const jobMatch = app.jobId?._id === jobId || app.jobId === jobId;
          const emailMatch = app.candidateEmail === user.email;
          const notWithdrawn = app.status !== 'withdrawn';
          return jobMatch && emailMatch && notWithdrawn;
        });
        setHasApplied(alreadyApplied);
      }
    } catch (error) {
      console.error('Error checking application status:', error);
    }
  };

  const handleQuickApply = async () => {
    const currentUser = user || JSON.parse(localStorage.getItem('user') || '{}');

    if (!currentUser?.email || (!currentUser?.name && !currentUser?.fullName)) {
      window.dispatchEvent(new CustomEvent("zync:alert", { detail: { message: "Please login to apply for jobs." } }));
      return;
    }

    setIsApplying(true);
    try {
      let profileData: any = currentUser;
      try {
        const profileRes = await fetch(`${API_ENDPOINTS.BASE_URL}/profile/${encodeURIComponent(currentUser.email)}`);
        if (profileRes.ok) profileData = { ...currentUser, ...(await profileRes.json()) };
      } catch { /* use localStorage data */ }

      const resume = profileData.resume;
      const resumeUrl = profileData.resumeUrl
        || (resume?.url || resume?.fileUrl || resume?.path
          ? (resume.url || resume.fileUrl || resume.path)
          : null);

      if (!resumeUrl) {
        window.dispatchEvent(new CustomEvent("zync:alert", { detail: { message: "📄 Resume not found! Please upload your resume in your profile before applying." } }));
        setIsApplying(false);
        return;
      }

      const payload = {
        jobId,
        candidateEmail: currentUser.email,
        candidateName: currentUser.name || currentUser.fullName,
        candidatePhone: profileData.phone || currentUser.phone || '',
        resumeUrl,
        isQuickApply: true,
        coverLetter: 'Applied using Quick Apply'
      };

      const response = await apiFetch(`${API_ENDPOINTS.APPLICATIONS}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (response.ok) {
        setHasApplied(true);
        onSuccess?.();
        window.dispatchEvent(new CustomEvent("zync:alert", { detail: { message: "✅ Applied successfully! Your resume has been sent to the employer." } }));
      } else {
        const errorMsg = result.errors?.[0]?.msg || result.error || 'Application failed';
        window.dispatchEvent(new CustomEvent("zync:alert", { detail: { message: String(errorMsg) } }));
      }
    } catch (error) {
      console.error('Quick apply error:', error);
      window.dispatchEvent(new CustomEvent("zync:alert", { detail: { message: "Application failed. Please try again." } }));
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
