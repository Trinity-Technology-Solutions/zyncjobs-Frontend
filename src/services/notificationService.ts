import { API_ENDPOINTS } from '../config/constants';

export interface Notification {
  id: string;
  type: 'application' | 'interview' | 'job' | 'daily_summary' | 'job_status' | 'application_status' | 'interview_accepted' | 'interview_declined';
  title: string;
  message: string;
  time: string;
  data?: any;
  read?: boolean;
  createdAt: string;
}

class NotificationService {
  // Fetch dynamic notifications for employer
  static async fetchNotifications(employerEmail: string): Promise<Notification[]> {
    try {
      console.log('Fetching notifications for:', employerEmail);
      
      const response = await fetch(
        `${API_ENDPOINTS.NOTIFICATIONS}?employerEmail=${encodeURIComponent(employerEmail)}`
      );
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }
      
      const notifications = await response.json();
      console.log('Notifications received:', notifications.length);
      
      return Array.isArray(notifications) ? notifications : [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  // Mark notification as read (if backend supports it)
  static async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_ENDPOINTS.NOTIFICATIONS}/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      return response.ok;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  // Delete notification
  static async deleteNotification(notificationId: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_ENDPOINTS.NOTIFICATIONS}/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      return response.ok;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  }

  // Get notification icon based on type — returns SVG string (no emojis)
  static getNotificationIcon(type: string): string {
    switch (type) {
      case 'application':
        return '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>';
      case 'interview':
      case 'interview_accepted':
      case 'interview_declined':
        return '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>';
      case 'job':
        return '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>';
      case 'daily_summary':
        return '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>';
      case 'job_status':
        return '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>';
      case 'application_status':
        return '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>';
      default:
        return '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>';
    }
  }

  // Get notification color based on type
  static getNotificationColor(type: string): string {
    switch (type) {
      case 'application':
        return 'bg-blue-500';
      case 'interview':
        return 'bg-green-500';
      case 'interview_accepted':
      case 'interview_declined':
        return 'bg-green-500';
      case 'job':
        return 'bg-purple-500';
      case 'daily_summary':
        return 'bg-orange-500';
      case 'job_status':
        return 'bg-indigo-500';
      case 'application_status':
        return 'bg-emerald-500';
      default:
        return 'bg-gray-500';
    }
  }

  // Format notification time
  static formatTime(timeString: string): string {
    try {
      // If it's already formatted (like "2d ago"), return as is
      if (timeString.includes('ago') || timeString.includes('now')) {
        return timeString;
      }
      
      // Try to parse as date
      const date = new Date(timeString);
      if (isNaN(date.getTime())) {
        return timeString; // Return original if can't parse
      }
      
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);
      
      if (diffDays > 0) {
        return `${diffDays}d ago`;
      } else if (diffHours > 0) {
        return `${diffHours}h ago`;
      } else {
        return 'Just now';
      }
    } catch (error) {
      console.error('Error formatting time:', error);
      return timeString;
    }
  }

  // Create fallback notifications from local data (backup method)
  static createFallbackNotifications(
    applications: any[], 
    interviews: any[], 
    jobs: any[]
  ): Notification[] {
    const notifications: Notification[] = [];
    
    // Add notifications for recent applications
    if (applications.length > 0) {
      const recentApps = applications.slice(0, 3);
      recentApps.forEach((app, index) => {
        notifications.push({
          id: `app_${app._id || app.id}`,
          type: 'application',
          title: 'New application received',
          message: `${app.candidateName || app.candidateEmail} applied for ${app.jobTitle || 'a position'}`,
          time: this.formatTime(app.createdAt) || `${index + 1}d ago`,
          data: app,
          createdAt: app.createdAt
        });
      });
    }
    
    // Add notifications for upcoming interviews
    if (interviews.length > 0) {
      const upcomingInterviews = interviews.slice(0, 2);
      upcomingInterviews.forEach((interview, index) => {
        notifications.push({
          id: `interview_${interview._id}`,
          type: 'interview',
          title: 'Interview scheduled',
          message: `Interview with ${interview.candidateName || 'candidate'} scheduled for ${new Date(interview.date).toLocaleDateString()}`,
          time: this.formatTime(interview.createdAt || interview.date) || `${index + 1}d ago`,
          data: interview,
          createdAt: interview.createdAt || interview.date
        });
      });
    }
    
    // Add notifications for recent job postings
    if (jobs.length > 0) {
      const recentJobs = jobs.slice(0, 2);
      recentJobs.forEach((job, index) => {
        notifications.push({
          id: `job_${job._id || job.id}`,
          type: 'job',
          title: 'Job posting active',
          message: `Your ${job.jobTitle || job.title} position is receiving applications`,
          time: this.formatTime(job.createdAt || job.datePosted) || `${index + 2}d ago`,
          data: job,
          createdAt: job.createdAt || job.datePosted
        });
      });
    }
    
    // Sort by creation date (newest first)
    notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return notifications;
  }

  // Test notifications API
  static async testNotifications(employerEmail: string): Promise<any> {
    try {
      const response = await fetch(`${API_ENDPOINTS.NOTIFICATIONS}/test/${encodeURIComponent(employerEmail)}`);
      
      if (!response.ok) {
        throw new Error(`Test API returned ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error testing notifications:', error);
      throw error;
    }
  }
}

export default NotificationService;