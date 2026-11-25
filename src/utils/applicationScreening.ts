interface ScreenedApplication {
  status?: string;
  aiSuggestion?: string;
  timeline?: { status?: string; updatedBy?: string }[];
}

export function getScreeningFlag(application: ScreenedApplication) {
  if (application.status === 'rejected' && Array.isArray(application.timeline)) {
    const rejection = [...application.timeline].reverse().find(event => event?.status === 'rejected' || event?.status === 'ai_rejected');
    if (rejection?.updatedBy === 'AI Auto-Rejection' || rejection?.status === 'ai_rejected') {
      return 'previously-auto-rejected';
    }
  }
  if (application.aiSuggestion === 'review' && ['pending', 'applied', 'reviewed'].includes(application.status || '')) {
    return 'needs-review';
  }
  return null;
}
