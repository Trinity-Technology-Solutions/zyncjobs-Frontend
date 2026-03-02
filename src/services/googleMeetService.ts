interface MeetingData {
  summary?: string;
  topic?: string;
  start?: string;
  start_time?: string;
  duration: number;
  description?: string;
  attendees?: Array<{ email: string }>;
}

interface MeetResponse {
  success: boolean;
  meetLink?: string;
  meetingId?: string;
  fallback?: boolean;
  requiresAuth?: boolean;
}

class GoogleMeetService {
  private baseURL: string;

  constructor() {
    this.baseURL = 'http://localhost:5000/api';
  }

  async getAuthUrl(): Promise<string> {
    const response = await fetch(`${this.baseURL}/auth/google/auth-url`, {
      method: 'GET',
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (data.success) {
      return data.authUrl;
    }
    throw new Error('Failed to get authorization URL');
  }

  async authorizeGoogle(): Promise<void> {
    try {
      const authUrl = await this.getAuthUrl();
      window.location.href = authUrl;
    } catch (error) {
      console.error('Authorization failed:', error);
      alert('Failed to start Google authorization');
    }
  }

  async createGoogleMeet(meetingData: MeetingData): Promise<MeetResponse> {
    const response = await fetch(`${this.baseURL}/auth/google/create-meet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ meetingData })
    });
    
    const data = await response.json();
    
    if (data.success) {
      return {
        success: true,
        meetLink: data.meeting.joinUrl,
        meetingId: data.meeting.meetingId,
        fallback: data.meeting.fallback || false
      };
    }
    
    if (data.requiresAuth) {
      const shouldAuth = confirm('Google authorization required. Authorize now?');
      if (shouldAuth) {
        await this.authorizeGoogle();
      }
      return { success: false, requiresAuth: true };
    }
    
    throw new Error(data.error || 'Failed to create Google Meet');
  }

  async createSimpleMeet(meetingData: MeetingData): Promise<MeetResponse> {
    const response = await fetch(`${this.baseURL}/meetings/generate-meet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(meetingData)
    });
    
    const data = await response.json();
    
    if (data.success) {
      return {
        success: true,
        meetLink: data.meeting.meetLink,
        meetingId: data.meeting.meetingId
      };
    }
    
    throw new Error(data.error || 'Failed to create Google Meet');
  }
}

export default GoogleMeetService;
