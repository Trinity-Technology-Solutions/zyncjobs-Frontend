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
  recruiterName: string,
  onUnauthorized: () => void,
) {
  if (!files.length) return;

  queue = queue.then(async () => {
    publish({ active: true, total: files.length, completed: 0, failed: 0, currentFile: '', error: null });

    for (const file of files) {
      publish({ currentFile: file.name, error: null });
      let parsed: any = {};

      try {
        const formData = new FormData();
        formData.append('resume', file);
        const parseResponse = await apiFetch(API_ENDPOINTS.TRACKER_PARSE_RESUME, {
          method: 'POST',
          body: formData,
        });
        if (parseResponse.status === 401) {
          onUnauthorized();
          return;
        }
        if (!parseResponse.ok) {
          const body = await parseResponse.json().catch(() => ({}));
          throw new Error(body.error || `Resume parsing failed (${parseResponse.status})`);
        }
        parsed = await parseResponse.json();
      } catch (error: any) {
        publish({ failed: status.failed + 1, error: `${file.name}: ${error.message || 'Resume parsing failed.'}` });
      }

      try {
        const saveResponse = await apiFetch(API_ENDPOINTS.TRACKER_ROWS, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: new Date().toISOString().slice(0, 10),
            clientName: '',
            skillRole: parsed.skillRole || parsed.title || parsed.currentRole || '',
            candidateName: parsed.name || parsed.fullName || '',
            phone: parsed.phone || parsed.phoneNumber || '',
            email: parsed.email || parsed.emailAddress || '',
            recruiterName,
            status: '',
            resumeFile: file.name,
          }),
        });
        if (saveResponse.status === 401) {
          onUnauthorized();
          return;
        }
        if (!saveResponse.ok) {
          const body = await saveResponse.json().catch(() => ({}));
          throw new Error(body.error || `Tracker row save failed (${saveResponse.status})`);
        }
        publish({ completed: status.completed + 1 });
      } catch (error: any) {
        publish({ failed: status.failed + 1, error: `${file.name}: ${error.message || 'Tracker row save failed.'}` });
      }
    }

    publish({ active: false, currentFile: '' });
  });
}
