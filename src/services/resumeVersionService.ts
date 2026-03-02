interface ResumeVersion {
  _id: string;
  version: number;
  data: any;
  createdAt: string;
  isActive: boolean;
}

class ResumeVersionService {
  private baseUrl = '/api/resume-versions';

  async saveVersion(resumeId: string, resumeData: any): Promise<{ version: number }> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      },
      body: JSON.stringify({ resumeId, resumeData })
    });

    if (!response.ok) throw new Error('Failed to save version');
    return response.json();
  }

  async getVersions(resumeId: string): Promise<ResumeVersion[]> {
    const response = await fetch(`${this.baseUrl}/${resumeId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      }
    });

    if (!response.ok) throw new Error('Failed to get versions');
    const result = await response.json();
    return result.versions;
  }

  async getVersion(resumeId: string, version: number): Promise<ResumeVersion> {
    const response = await fetch(`${this.baseUrl}/${resumeId}/${version}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      }
    });

    if (!response.ok) throw new Error('Failed to get version');
    const result = await response.json();
    return result.version;
  }

  async restoreVersion(resumeId: string, version: number): Promise<ResumeVersion> {
    const response = await fetch(`${this.baseUrl}/${resumeId}/${version}/restore`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      }
    });

    if (!response.ok) throw new Error('Failed to restore version');
    const result = await response.json();
    return result.version;
  }
}

export default new ResumeVersionService();