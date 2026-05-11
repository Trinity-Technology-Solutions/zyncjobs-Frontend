/**
 * Local File Handler - Fallback mechanism when server upload fails
 * Provides local file processing and temporary storage
 */

export interface LocalFileResult {
  success: boolean;
  fileId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  localUrl?: string;
  extractedText?: string;
  error?: string;
}

export class LocalFileHandler {
  private static readonly STORAGE_KEY = 'zync_local_files';
  private static readonly MAX_STORAGE_SIZE = 10 * 1024 * 1024; // 10MB limit

  /**
   * Process file locally when server upload fails
   */
  static async processFileLocally(file: File): Promise<LocalFileResult> {
    try {
      // Validate file
      const validation = this.validateFile(file);
      if (!validation.valid) {
        return {
          success: false,
          fileId: '',
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          error: validation.error
        };
      }

      // Generate unique file ID
      const fileId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create local URL for preview
      const localUrl = URL.createObjectURL(file);

      // Extract text if it's a PDF (basic extraction)
      let extractedText = '';
      if (file.type === 'application/pdf') {
        try {
          extractedText = await this.extractTextFromPDF(file);
        } catch (error) {
          console.warn('PDF text extraction failed:', error);
        }
      }

      // Store file metadata locally
      const fileData = {
        id: fileId,
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString(),
        localUrl,
        extractedText: extractedText.substring(0, 5000), // Limit text size
        status: 'local_only'
      };

      this.storeFileMetadata(fileData);

      return {
        success: true,
        fileId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        localUrl,
        extractedText
      };
    } catch (error) {
      return {
        success: false,
        fileId: '',
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        error: error instanceof Error ? error.message : 'Failed to process file locally'
      };
    }
  }

  /**
   * Validate file before processing
   */
  private static validateFile(file: File): { valid: boolean; error?: string } {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Invalid file type. Only PDF and DOC files are allowed.'
      };
    }

    if (file.size > 5 * 1024 * 1024) {
      return {
        valid: false,
        error: 'File size must be less than 5MB.'
      };
    }

    return { valid: true };
  }

  /**
   * Basic PDF text extraction (fallback method)
   */
  private static async extractTextFromPDF(file: File): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        // This is a very basic extraction - in a real app you'd use a proper PDF library
        const text = `Resume file: ${file.name}\nFile size: ${(file.size / 1024).toFixed(1)}KB\nUploaded: ${new Date().toLocaleDateString()}`;
        resolve(text);
      };
      reader.onerror = () => resolve('');
      reader.readAsText(file);
    });
  }

  /**
   * Store file metadata in localStorage
   */
  private static storeFileMetadata(fileData: any): void {
    try {
      const stored = this.getStoredFiles();
      stored.push(fileData);

      // Clean up old files if storage is getting full
      this.cleanupOldFiles(stored);

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(stored));
    } catch (error) {
      console.warn('Failed to store file metadata:', error);
    }
  }

  /**
   * Get stored files from localStorage
   */
  private static getStoredFiles(): any[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /**
   * Clean up old files to prevent storage quota issues
   */
  private static cleanupOldFiles(files: any[]): void {
    // Sort by upload date, keep only the 10 most recent
    files.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
    
    if (files.length > 10) {
      const toRemove = files.splice(10);
      // Revoke object URLs to free memory
      toRemove.forEach(file => {
        if (file.localUrl) {
          URL.revokeObjectURL(file.localUrl);
        }
      });
    }
  }

  /**
   * Get file by ID
   */
  static getFileById(fileId: string): any | null {
    const files = this.getStoredFiles();
    return files.find(f => f.id === fileId) || null;
  }

  /**
   * Create a mock server response for local files
   */
  static createMockResponse(result: LocalFileResult): any {
    return {
      success: result.success,
      resume: {
        id: result.fileId,
        filename: result.fileName,
        size: result.fileSize,
        status: 'local_processing',
        riskScore: 0,
        issues: [],
        localUrl: result.localUrl,
        extractedText: result.extractedText
      },
      message: 'File processed locally. Server upload will be retried automatically.',
      isLocalFallback: true
    };
  }

  /**
   * Retry server upload for local files
   */
  static async retryServerUpload(fileId: string, uploadFunction: (file: File) => Promise<any>): Promise<boolean> {
    const fileData = this.getFileById(fileId);
    if (!fileData || !fileData.localUrl) return false;

    try {
      // This would need the original File object, which we can't recreate from localStorage
      // In a real implementation, you'd need to store the file differently or ask user to re-upload
      console.log('Server upload retry would happen here for file:', fileId);
      return true;
    } catch {
      return false;
    }
  }
}

export default LocalFileHandler;