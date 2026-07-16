import React, { useState, useEffect } from 'react';
import { Clock, Shield, AlertTriangle, Mail } from 'lucide-react';

interface AccountLockedModalProps {
  isOpen: boolean;
  lockoutMinutes: number;
  onClose: () => void;
  onContactSupport: () => void;
}

const AccountLockedModal: React.FC<AccountLockedModalProps> = ({
  isOpen,
  lockoutMinutes,
  onClose,
  onContactSupport,
}) => {
  const [remaining, setRemaining] = useState(lockoutMinutes * 60);

  useEffect(() => {
    if (!isOpen) return;
    setRemaining(lockoutMinutes * 60);
    const interval = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, lockoutMinutes]);

  if (!isOpen) return null;

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Account Locked</h2>
          <p className="text-gray-600 mt-2 text-sm">
            Too many failed login attempts. Your account has been temporarily locked for security.
          </p>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-4 text-center">
          <Clock className="w-8 h-8 text-orange-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-orange-700 font-mono">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </p>
          <p className="text-sm text-orange-600 mt-1">until you can try again</p>
        </div>

        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800 flex gap-2 mb-4">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p>For your security, we've temporarily locked your account after multiple failed login attempts. Please wait for the countdown to end before trying again.</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition"
          >
            Close
          </button>
          <button
            onClick={onContactSupport}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition"
          >
            <Mail className="w-4 h-4" />
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccountLockedModal;
