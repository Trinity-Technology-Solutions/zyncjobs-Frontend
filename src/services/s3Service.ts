import { API_ENDPOINTS } from '../config/env';
import { tokenStorage } from '../utils/tokenStorage';

export interface S3UploadResponse {
  success: boolean;
  fileUrl?: string;
  fileHash?: string;
  error?: string;
}

// Compute SHA-256 hash of file content — same file always produces same hash
async function hashFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Session-level cache: hash → s3Url (avoids re-uploading same file twice in same session)
const uploadCache = new Map<string, string>();

export class S3Service {
  private static getAuthHeaders(extra?: Record<string, string>) {
    const token = tokenStorage.getAccess() || sessionStorage.getItem('adminToken');
    return {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...extra,
    };
  }

  static async uploadResumeToS3(file: File): Promise<S3UploadResponse> {
    try {
      const formData = new FormData();
      formData.append('resume', file);

      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/upload/resume`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: formData
      });

      const result = await response.json();
      
      if (!response.ok) {
        return { success: false, error: result.error || 'Upload failed' };
      }

      return { 
        success: true, 
        fileUrl: result.fileUrl || result.file?.url 
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Upload failed' 
      };
    }
  }

  static async uploadTalentResumeToS3(file: File): Promise<S3UploadResponse> {
    try {
      // 1. Hash the file
      const fileHash = await hashFile(file);

      // 2. Return cached URL if same file was already uploaded this session
      if (uploadCache.has(fileHash)) {
        return { success: true, fileUrl: uploadCache.get(fileHash)!, fileHash, error: undefined };
      }

      const formData = new FormData();
      formData.append('resume', file);

      // 3. Send hash as header — backend uses it as S3 key so same file = same key = no duplicate
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/upload/talent-resume`, {
        method: 'POST',
        headers: this.getAuthHeaders({ 'x-file-hash': fileHash }),
        body: formData
      });

      const result = await response.json();
      
      if (!response.ok) {
        return { success: false, error: result.error || 'Upload failed' };
      }

      const fileUrl = result.fileUrl || result.file?.url;

      // 4. Cache the result for this session
      if (fileUrl) uploadCache.set(fileHash, fileUrl);

      return { success: true, fileUrl, fileHash };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Upload failed' 
      };
    }
  }
}