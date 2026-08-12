// Shared helpers for interview scheduling date/time & meeting link handling.

export interface InterviewLike {
  scheduledDate?: string;
  date?: string;
  interviewDate?: string;
  time?: string;
  interviewTime?: string;
  meetingLink?: string;
  joinUrl?: string;
  meetLink?: string;
}

const pad = (n: number) => String(n).padStart(2, '0');

const isDateOnly = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);

const isExplicitTime = (value: string) => /^\d{1,2}:\d{2}(\s*(AM|PM))?$/i.test(value.trim());

// 'YYYY-MM-DDTHH:mm' layout for <input type="datetime-local"> from a Date, in local time
export const toLocalDateTimeInput = (d: Date): string =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

// Parse a date string without the UTC-midnight shift that JS applies to date-only values
export const parseDateValue = (value: string): Date | null => {
  if (!value) return null;
  if (isDateOnly(value)) {
    const [y, m, day] = value.split('-').map(Number);
    return new Date(y, m - 1, day);
  }
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
};

// Confirmation line in the schedule modal: "10 Aug 2026, 3:30 PM" in the user's local tz
export const formatLocalDateTime = (value: string): string => {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString(undefined, {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
};

export const formatInterviewDate = (interview: InterviewLike): string => {
  const raw = interview.scheduledDate || interview.interviewDate || interview.date;
  const d = raw ? parseDateValue(raw) : null;
  if (!d) return 'Date TBD';
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
};

export const formatInterviewTime = (interview: InterviewLike): string => {
  const explicit = interview.time || interview.interviewTime;
  if (explicit && isExplicitTime(explicit)) return explicit.trim();
  const raw = interview.scheduledDate || interview.interviewDate || interview.date || '';
  if (raw && raw.includes('T')) {
    const d = new Date(raw);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true });
    }
  }
  return explicit || 'Time TBD';
};

// Prefer the real meeting URL over the backend redirect endpoint, which has
// been observed redirecting users to unrelated third-party pages.
export const getInterviewJoinUrl = (interview: InterviewLike): string | null => {
  const link = interview.meetingLink || interview.joinUrl || interview.meetLink;
  if (link && /^https?:\/\//i.test(link)) return link;
  return null;
};

// Verifies a generated link actually belongs to the requested platform.
// The backend falls back to a generic (Jitsi) link when the Zoom/Google
// account is not connected, so we must not store it as a Zoom/Meet link.
export const isMeetingLinkForPlatform = (platform: string, url: string): boolean => {
  let host: string;
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return false;
  }
  if (platform === 'googlemeet') {
    return host === 'meet.google.com' || host === 'hangouts.google.com';
  }
  if (platform === 'zoom') {
    return host === 'zoom.us' || host.endsWith('.zoom.us')
      || host === 'zoom.com' || host.endsWith('.zoom.com')
      || host === 'zoomgov.com' || host.endsWith('.zoomgov.com');
  }
  return true;
};