// Connection Checker Utility
export import { API_ENDPOINTS } from '../config/api';

class ConnectionChecker {
  private static API_BASE = API_ENDPOINTS.BASE_URL + '/api';
  
  static async checkBackendConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.API_BASE}/test`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Backend connection successful:', data);
        return true;
      } else {
        console.error('❌ Backend connection failed:', response.status, response.statusText);
        return false;
      }
    } catch (error) {
      console.error('❌ Network error:', error);
      return false;
    }
  }
  
  static async testLogin(): Promise<boolean> {
    try {
      const response = await fetch(`${this.API_BASE}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@candidate.com',
          password: '123456'
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Login test successful:', data);
        return true;
      } else {
        console.error('❌ Login test failed:', response.status);
        return false;
      }
    } catch (error) {
      console.error('❌ Login test error:', error);
      return false;
    }
  }
  
  static async runDiagnostics(): Promise<void> {
    console.log('🔍 Running ZyncJobs Connection Diagnostics...\n');
    
    const backendOk = await this.checkBackendConnection();
    const loginOk = await this.testLogin();
    
    console.log('\n📊 Diagnostics Summary:');
    console.log(`Backend API: ${backendOk ? '✅ Connected' : '❌ Failed'}`);
    console.log(`Login System: ${loginOk ? '✅ Working' : '❌ Failed'}`);
    
    if (!backendOk) {
      console.log('\n🔧 Troubleshooting Steps:');
      console.log('1. Check if backend server is running: python run.py');
      console.log('2. Verify backend is on', API_ENDPOINTS.BASE_URL);
      console.log('3. Check browser console for CORS errors');
      console.log('4. Try hard refresh (Ctrl+Shift+R)');
    }
  }
}

// Auto-run diagnostics in development
if (import.meta.env.DEV) {
  ConnectionChecker.runDiagnostics();
}