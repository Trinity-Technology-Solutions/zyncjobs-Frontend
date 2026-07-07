import React, { useState, useEffect } from "react";
import { FileText, AlertCircle, CheckCircle, Upload } from "lucide-react";
import { quickResumeCheck } from "../utils/resumeValidation";
import { getUserFromStorage, listenForUserChanges } from "../utils/userStorage";

interface ResumeStatusIndicatorProps {
  user?: any;
  onUploadClick?: () => void;
  className?: string;
  showText?: boolean;
}

const ResumeStatusIndicator: React.FC<ResumeStatusIndicatorProps> = ({
  user,
  onUploadClick,
  className = "",
  showText = true,
}) => {
  const [hasResume, setHasResume] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkResumeStatus();
    const unlisten = listenForUserChanges(() => {
      checkResumeStatus();
    });
    return unlisten;
  }, [user]);

  const checkResumeStatus = () => {
    setLoading(true);
    try {
      const storedUser = getUserFromStorage();
      const userData = { ...storedUser, ...(user || {}) };
      const resumeExists =
        !!userData?.resume?.url ||
        !!userData?.resumeUrl ||
        quickResumeCheck(userData) ||
        quickResumeCheck(storedUser);
      setHasResume(resumeExists);
    } catch (error) {
      console.error("Error checking resume status:", error);
      setHasResume(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
        {showText && (
          <span className="text-sm text-gray-500">Checking resume...</span>
        )}
      </div>
    );
  }

  if (hasResume) {
    return (
      <div className={`flex items-center gap-2 text-green-600 ${className}`}>
        <CheckCircle className="w-4 h-4" />
        {showText && <span className="text-sm font-medium">Resume ready</span>}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <AlertCircle className="w-4 h-4 text-orange-500" />
      {showText && (
        <button
          onClick={
            onUploadClick || (() => (window.location.href = "/dashboard"))
          }
          className="text-sm text-orange-600 hover:text-orange-700 font-medium hover:underline"
        >
          Upload resume to apply
        </button>
      )}
      {!showText && <span className="text-sm text-orange-600">No resume</span>}
    </div>
  );
};

export default ResumeStatusIndicator;
