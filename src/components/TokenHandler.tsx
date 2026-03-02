import { useEffect } from 'react';

interface TokenHandlerProps {
  onLogin: (userData: {name: string, type: 'candidate' | 'employer' | 'admin', email?: string}) => void;
  onNavigate: (page: string) => void;
}

const TokenHandler: React.FC<TokenHandlerProps> = ({ onLogin, onNavigate }) => {
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (token) {
      // Store token in localStorage
      localStorage.setItem('token', token);
      
      // Decode token to get user info (basic JWT decode)
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        
        // Fetch user details from API to get complete user data
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/users/${payload.userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        .then(response => response.json())
        .then(userData => {
          // Store complete user data
          localStorage.setItem('user', JSON.stringify(userData));
          
          const displayName = userData.name || userData.fullName || userData.email?.split('@')[0] || 'User';
          
          onLogin({
            name: displayName,
            type: userData.userType as 'candidate' | 'employer' | 'admin',
            email: userData.email
          });
          
          // Navigate based on user type
          if (userData.userType === 'employer') {
            onNavigate('pricing');
          } else {
            onNavigate('dashboard');
          }
          
          // Clear URL parameters
          window.history.replaceState({}, document.title, window.location.pathname);
        })
        .catch(error => {
          console.error('Failed to fetch user data:', error);
          // Fallback to token data
          const userData = {
            name: 'User',
            type: payload.userType as 'candidate' | 'employer' | 'admin',
            email: payload.email
          };
          
          onLogin(userData);
          
          if (payload.userType === 'employer') {
            onNavigate('pricing');
          } else {
            onNavigate('dashboard');
          }
          
          window.history.replaceState({}, document.title, window.location.pathname);
        });
        
      } catch (error) {
        console.error('Token decode error:', error);
        localStorage.removeItem('token');
        onNavigate('login');
      }
    }
  }, [onLogin, onNavigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Completing Google sign in...</p>
        <p className="text-sm text-gray-500 mt-2">Please wait while we set up your account...</p>
      </div>
    </div>
  );
};

export default TokenHandler;