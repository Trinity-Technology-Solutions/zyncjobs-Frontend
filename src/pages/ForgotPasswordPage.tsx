import React, { useState } from 'react';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import Header from '../components/Header';
import { API_ENDPOINTS } from '../config/env';

interface ForgotPasswordPageProps {
  onNavigate: (page: string) => void;
}

const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    console.log('🔥 Starting forgot password request for:', email);

    try {
      console.log('📡 Making API call...');
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);
      
      const responseText = await response.text();
      console.log('📦 Response text:', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('📦 Parsed data:', data);
      } catch (parseError) {
        console.error('❌ JSON parse error:', parseError);
        console.log('Raw response:', responseText);
      }

      if (response.ok) {
        console.log('✅ Success! Showing sent page');
        setSent(true);
      } else {
        console.log('❌ Request failed with status:', response.status);
        setError(data?.error || data?.message || 'Failed to send reset email');
      }
    } catch (err) {
      console.error('❌ Network error:', err);
      setError('Network error: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header onNavigate={onNavigate} />
        <div className="flex items-center justify-center py-16 px-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Email Sent!</h2>
            <p className="text-gray-600 mb-4">
              Password reset link has been sent to:
            </p>
            <p className="font-medium text-gray-900 mb-6">{email}</p>
            <p className="text-sm text-gray-500 mb-6">
              Check your email and click the reset link to create a new password.
            </p>
            <button
              onClick={() => onNavigate('login')}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onNavigate={onNavigate} />
      <div className="flex items-center justify-center py-16 px-4">
        <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-8">
          <div className="text-center mb-8">
            <Mail className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Forgot Password?</h2>
            <p className="text-gray-600">
              Enter your email address and we'll send you a reset link.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your email"
                required
              />
              {error && (
                <p className="mt-2 text-sm text-red-600">{error}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
            
            <button
              type="button"
              onClick={() => onNavigate('login')}
              className="w-full flex items-center justify-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Login</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;