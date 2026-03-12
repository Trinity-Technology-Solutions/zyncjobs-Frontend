// Service to handle localStorage migration to backend APIs
import { API_ENDPOINTS } from '../config/env';

class LocalStorageMigrationService {
  private static instance: LocalStorageMigrationService;
  private token: string | null = null;

  private constructor() {}

  static getInstance(): LocalStorageMigrationService {
    if (!LocalStorageMigrationService.instance) {
      LocalStorageMigrationService.instance = new LocalStorageMigrationService();
    }
    return LocalStorageMigrationService.instance;
  }

  setToken(token: string) {
    this.token = token;
  }

  private async apiCall(endpoint: string, options: RequestInit = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
      ...options.headers
    };

    const response = await fetch(`${API_ENDPOINTS.BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Migrate saved recommended jobs
  async migrateSavedRecommendedJobs(): Promise<void> {
    try {
      const savedJobs = localStorage.getItem('savedRecommendedJobs');
      if (!savedJobs) return;

      const jobIds = JSON.parse(savedJobs);
      if (!Array.isArray(jobIds) || jobIds.length === 0) return;

      console.log('🔄 Migrating saved recommended jobs:', jobIds.length);

      // For each saved job ID, we need to get the job details and save to backend
      for (const jobId of jobIds) {
        try {
          // Try to get job details from API
          const jobResponse = await fetch(`${API_ENDPOINTS.JOBS}/${jobId}`);
          if (jobResponse.ok) {
            const jobData = await jobResponse.json();
            
            // Save to backend
            await this.apiCall('/saved-recommended-jobs', {
              method: 'POST',
              body: JSON.stringify({
                jobId: jobData._id || jobId,
                jobTitle: jobData.title || jobData.jobTitle,
                company: jobData.company,
                location: jobData.location,
                salary: jobData.salary,
                jobType: jobData.type,
                skills: jobData.skills || [],
                description: jobData.description,
                matchPercentage: jobData.matchPercentage || 0,
                matchingSkills: jobData.matchingSkills || []
              })
            });
          }
        } catch (error) {
          console.warn('Failed to migrate job:', jobId, error);
        }
      }

      // Clear localStorage after successful migration
      localStorage.removeItem('savedRecommendedJobs');
      console.log('✅ Saved recommended jobs migrated successfully');
    } catch (error) {
      console.error('❌ Failed to migrate saved recommended jobs:', error);
    }
  }

  // Migrate resume skills
  async migrateResumeSkills(): Promise<void> {
    try {
      const resumeData = localStorage.getItem('resumeData');
      if (!resumeData) return;

      const parsed = JSON.parse(resumeData);
      if (parsed.skills && Array.isArray(parsed.skills)) {
        console.log('🔄 Migrating resume skills:', parsed.skills.length);

        await this.apiCall('/user-preferences/resume-skills', {
          method: 'POST',
          body: JSON.stringify({ skills: parsed.skills })
        });

        // Don't remove resumeData as it might contain other important info
        console.log('✅ Resume skills migrated successfully');
      }
    } catch (error) {
      console.error('❌ Failed to migrate resume skills:', error);
    }
  }

  // Migrate user preferences
  async migrateUserPreferences(): Promise<void> {
    try {
      const preferences: any = {};
      let hasPreferences = false;

      // Collect various localStorage preferences
      const searchHistory = localStorage.getItem('searchHistory');
      if (searchHistory) {
        preferences.searchHistory = JSON.parse(searchHistory);
        hasPreferences = true;
      }

      const savedSearches = localStorage.getItem('savedSearches');
      if (savedSearches) {
        preferences.savedSearches = JSON.parse(savedSearches);
        hasPreferences = true;
      }

      const jobPreferences = localStorage.getItem('jobPreferences');
      if (jobPreferences) {
        preferences.jobPreferences = JSON.parse(jobPreferences);
        hasPreferences = true;
      }

      if (hasPreferences) {
        console.log('🔄 Migrating user preferences');

        await this.apiCall('/user-preferences', {
          method: 'PUT',
          body: JSON.stringify(preferences)
        });

        // Clear migrated preferences
        if (searchHistory) localStorage.removeItem('searchHistory');
        if (savedSearches) localStorage.removeItem('savedSearches');
        if (jobPreferences) localStorage.removeItem('jobPreferences');

        console.log('✅ User preferences migrated successfully');
      }
    } catch (error) {
      console.error('❌ Failed to migrate user preferences:', error);
    }
  }

  // Get saved recommended jobs from backend
  async getSavedRecommendedJobs(): Promise<string[]> {
    try {
      const response = await this.apiCall('/saved-recommended-jobs');
      return response.savedJobs.map((job: any) => job.jobId);
    } catch (error) {
      console.error('Failed to get saved recommended jobs:', error);
      return [];
    }
  }

  // Save recommended job to backend
  async saveRecommendedJob(jobData: any): Promise<boolean> {
    try {
      await this.apiCall('/saved-recommended-jobs', {
        method: 'POST',
        body: JSON.stringify({
          jobId: jobData._id || jobData.id,
          jobTitle: jobData.title || jobData.jobTitle,
          company: jobData.company,
          location: jobData.location,
          salary: jobData.salary,
          jobType: jobData.type,
          skills: jobData.skills || [],
          description: jobData.description,
          matchPercentage: jobData.matchPercentage || 0,
          matchingSkills: jobData.matchingSkills || []
        })
      });
      return true;
    } catch (error) {
      console.error('Failed to save recommended job:', error);
      return false;
    }
  }

  // Remove saved recommended job from backend
  async removeSavedRecommendedJob(jobId: string): Promise<boolean> {
    try {
      await this.apiCall(`/saved-recommended-jobs/${jobId}`, {
        method: 'DELETE'
      });
      return true;
    } catch (error) {
      console.error('Failed to remove saved recommended job:', error);
      return false;
    }
  }

  // Get resume skills from backend
  async getResumeSkills(): Promise<Array<{ skill: string }>> {
    try {
      const response = await this.apiCall('/user-preferences');
      return response.resumeSkills || [];
    } catch (error) {
      console.error('Failed to get resume skills:', error);
      return [];
    }
  }

  // Update resume skills in backend
  async updateResumeSkills(skills: Array<{ skill: string }>): Promise<boolean> {
    try {
      await this.apiCall('/user-preferences/resume-skills', {
        method: 'POST',
        body: JSON.stringify({ skills })
      });
      return true;
    } catch (error) {
      console.error('Failed to update resume skills:', error);
      return false;
    }
  }

  // Store job session for application
  async storeJobSession(jobData: any): Promise<string | null> {
    try {
      const sessionId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await this.apiCall('/job-session/store', {
        method: 'POST',
        body: JSON.stringify({ jobData, sessionId })
      });
      
      return sessionId;
    } catch (error) {
      console.error('Failed to store job session:', error);
      return null;
    }
  }

  // Get job session data
  async getJobSession(sessionId: string): Promise<any | null> {
    try {
      const response = await this.apiCall(`/job-session/${sessionId}`);
      return response.jobData;
    } catch (error) {
      console.error('Failed to get job session:', error);
      return null;
    }
  }

  // Clear job session
  async clearJobSession(sessionId: string): Promise<void> {
    try {
      await this.apiCall(`/job-session/${sessionId}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Failed to clear job session:', error);
    }
  }

  // Run full migration for logged-in user
  async runFullMigration(): Promise<void> {
    if (!this.token) {
      console.warn('No token available for migration');
      return;
    }

    console.log('🚀 Starting localStorage migration to backend...');
    
    await Promise.all([
      this.migrateSavedRecommendedJobs(),
      this.migrateResumeSkills(),
      this.migrateUserPreferences()
    ]);

    console.log('✅ localStorage migration completed');
  }
}

export default LocalStorageMigrationService.getInstance();