import { API_ENDPOINTS } from '../config/env';
import { apiFetch } from '../api/apiFetch';

export interface TrackerUploadStatus {
  active: boolean;
  total: number;
  completed: number;
  failed: number;
  currentFile: string;
  error: string | null;
}

type Listener = (status: TrackerUploadStatus) => void;

const listeners = new Set<Listener>();
let status: TrackerUploadStatus = {
  active: false,
  total: 0,
  completed: 0,
  failed: 0,
  currentFile: '',
  error: null,
};
let queue: Promise<void> = Promise.resolve();

function publish(next: Partial<TrackerUploadStatus>) {
  status = { ...status, ...next };
  listeners.forEach(listener => listener(status));
}

export function getTrackerUploadStatus() {
  return status;
}

export function subscribeToTrackerUploads(listener: Listener) {
  listeners.add(listener);
  listener(status);
  return () => listeners.delete(listener);
}

export function enqueueTrackerResumeUpload(
  files: File[],
  _recruiterName: string,
  onUnauthorized: () => void,
) {
  if (!files.length) return;

  queue = queue.then(async () => {
    publish({ active: true, total: files.length, completed: 0, failed: 0, currentFile: '', error: null });

    for (const file of files) {
      publish({ currentFile: file.name });
      try {
        if (!file.size) throw new Error('Empty files cannot be uploaded.');
        if (!/\.(pdf|doc|docx)$/i.test(file.name)) throw new Error('Only PDF, DOC and DOCX resumes are supported.');
        if (file.size > 10 * 1024 * 1024) throw new Error('Resume must be 10 MB or smaller.');
        const formData = new FormData();
        formData.append('resume', file);
        const response = await apiFetch(`${API_ENDPOINTS.TRACKER_ROWS.replace(/\/rows$/, '')}/upload-resume`, { method: 'POST', body: formData });
        if (response.status === 401) { onUnauthorized(); publish({ active: false, currentFile: '' }); return; }
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || 'Resume upload failed.');
        if (!body.id || !body.candidateName) throw new Error('Server did not return a valid submission record.');
        publish({ completed: status.completed + 1 });
      } catch (cause) {
        const message = `${file.name}: ${cause instanceof Error ? cause.message : 'Resume upload failed.'}`;
        publish({ failed: status.failed + 1, error: status.error ? `${status.error}\n${message}` : message });
      }
    }

    publish({ active: false, currentFile: '' });
  });
}
