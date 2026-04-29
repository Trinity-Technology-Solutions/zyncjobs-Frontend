import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

interface Props {
  onNavigate: (page: string, data?: any) => void;
  onLogin: (user: any, token: string) => void;
}

const TeamAcceptPage: React.FC<Props> = ({ onNavigate, onLogin }) => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [teamRole, setTeamRole] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('Invalid invitation link.');
      return;
    }

    const API = import.meta.env.VITE_API_URL || '/api';
    fetch(`${API}/team/accept/${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          // Store token and user — auto login
          localStorage.setItem('accessToken', data.accessToken);
          localStorage.setItem('user', JSON.stringify(data.user));
          onLogin(data.user, data.accessToken);
          setTeamRole(data.user.teamRole || 'Recruiter');
          setStatus('success');
          // Redirect to employer dashboard after 2s
          setTimeout(() => onNavigate('employer-dashboard'), 2000);
        } else {
          setStatus('error');
          setMessage(data.error || 'Failed to accept invitation.');
        }
      })
      .catch(() => {
        setStatus('error');
        setMessage('Network error. Please try again.');
      });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <Loader className="w-12 h-12 text-indigo-500 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800">Accepting your invitation…</h2>
            <p className="text-gray-500 mt-2 text-sm">Please wait while we set up your account.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">You're in!</h2>
            <p className="text-gray-600 text-sm mb-3">
              Your invitation has been accepted. You've joined the team as a <strong>{teamRole}</strong>.
            </p>
            <p className="text-gray-400 text-xs">Redirecting you to the dashboard…</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-14 h-14 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Invitation Failed</h2>
            <p className="text-gray-600 text-sm mb-6">{message}</p>
            <button
              onClick={() => onNavigate('employer-login')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors text-sm"
            >
              Go to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default TeamAcceptPage;
