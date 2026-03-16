import { API_ENDPOINTS } from '../config/constants';

export interface Notification {
  id: string;
  type: 'application' | 'interview' | 'job' | 'daily_summary' | 'job_status' | 'application_status';
  title: string;
  message: string;
  time: string;
  data?: any;
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

  // Get notification icon based on type
  static getNotificationIcon(type: string): string {
    switch (type) {
      case 'application':
        return '📄';
      case 'interview':
        return '🤝';
      case 'job':
        return '💼';
      case 'daily_summary':
        return '📊';
      case 'job_status':
        return '📋';
      case 'application_status':
        return '✅';
      default:
        return '🔔';
    }
  }

  // Get notification color based on type
  static getNotificationColor(type: string): string {
    switch (type) {
      case 'application':
        return 'bg-blue-500';
      case 'interview':
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