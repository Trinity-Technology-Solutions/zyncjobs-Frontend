import { useCallback, useEffect, useRef, useState } from 'react';
import { Calendar, Download, ExternalLink, Loader2, Mail, Plus, X } from 'lucide-react';
import { API_ENDPOINTS } from '../../../config/env';
import { apiFetch } from '../../../api/apiFetch';
import { interviewLocalTime, interviewUtcTime } from '../../../utils/interviewTimezone';

interface Submission { id: string; candidateName: string; email: string; clientName: string; skillRole: string; subId: string; recruiterName: string }
interface Interview {
  id: string; candidateName: string; candidateEmail: string; clientName: string; skillRole: string;
  interviewerName: string; interviewerEmail: string; scheduledDate: string; duration: number; timezone: string;
  round: string; type: string; meetingLink: string; location: string; notes: string;
  status: 'scheduled' | 'cancelled' | 'completed'; revision: number; lastInvitedAt: string | null;
}
interface Details { round: string; scheduledDate: string; timezone: string; duration: string; interviewerName: string; interviewerEmail: string; type: string; meetingLink: string; location: string; notes: string }
const field = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500';
const button = 'inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50';
const browserZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
const zones = [...new Set([browserZone, 'Asia/Kolkata', 'UTC', 'Asia/Dubai', 'Asia/Singapore', 'Europe/London', 'Europe/Berlin', 'America/New_York', 'America/Chicago', 'America/Los_Angeles', 'Australia/Sydney'])];
const blank = (): Details => ({ round: 'Technical', scheduledDate: '', timezone: browserZone, duration: '60', interviewerName: '', interviewerEmail: '', type: 'video', meetingLink: '', location: '', notes: '' });

export default function TrackerInterviewModal({ submission, onClose, onUnauthorized }: { submission: Submission; onClose: () => void; onUnauthorized: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const inFlight = useRef(false);
  const [rows, setRows] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [details, setDetails] = useState<Details>(blank);
  const [editor, setEditor] = useState(false);
  const [editing, setEditing] = useState<Interview | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const base = `${API_ENDPOINTS.TRACKER_ROWS}/${submission.id}/interviews`;
  const request = useCallback(async (url: string, method = 'GET', body?: unknown) => {
    const response = await apiFetch(url, { method, ...(body !== undefined ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}) });
    if (response.status === 401) { onUnauthorized(); throw new Error('Your session has expired.'); }
    const data = await response.json().catch(() => ({}));
    if (response.status === 404 && (!data.error || data.error === 'Not found')) throw new Error('Interview scheduling is unavailable on this server. Please retry or contact your administrator.');
    if (!response.ok) throw new Error(data.error || 'Unable to update interview.');
    if (method !== 'GET') window.dispatchEvent(new Event('zync:tracker-interviews-updated'));
    return data;
  }, [onUnauthorized]);
  const load = async () => {
    setLoading(true); setLoadError('');
    try {
      const data = await request(base);
      if (!Array.isArray(data)) throw new Error('Unable to load interviews.');
      setRows(data); setLoaded(true);
    } catch (cause) {
      setLoadError(cause instanceof Error ? cause.message : 'Unable to load interviews.');
    } finally { setLoading(false); }
  };
  useEffect(() => {
    const element = dialog.current; element?.showModal();
    let mounted = true;
    setLoading(true); setLoadError(''); setLoaded(false);
    void request(base).then(data => {
      if (!Array.isArray(data)) throw new Error('Unable to load interviews.');
      if (mounted) { setRows(data); setLoaded(true); }
    }).catch(cause => { if (mounted) setLoadError(cause.message); }).finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; element?.close(); };
  }, [base, request]);
  const run = async (action: () => Promise<void>) => {
    if (inFlight.current) return;
    inFlight.current = true; setBusy(true); setError(''); setMessage('');
    try { await action(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to update interview.'); }
    finally { inFlight.current = false; setBusy(false); }
  };
  const openEditor = (row?: Interview) => {
    setEditing(row || null); setError(''); setMessage('');
    setDetails(row ? { ...row, scheduledDate: interviewLocalTime(row.scheduledDate, row.timezone), duration: String(row.duration) } : blank());
    setEditor(true);
  };
  const save = async (sendInvite: boolean) => {
    const form = dialog.current?.querySelector('form');
    if (!form?.reportValidity()) return;
    await run(async () => {
      const payload = { ...details, scheduledDate: interviewUtcTime(details.scheduledDate, details.timezone), duration: Number(details.duration), ...(editing ? { revision: editing.revision } : {}) };
      const saved: Interview = await request(editing ? `${base}/${editing.id}` : base, editing ? 'PUT' : 'POST', payload);
      setEditor(false); setEditing(null); // A mail failure must never re-submit a saved interview.
      setRows(previous => [...previous.filter(row => row.id !== saved.id), saved].sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate)));
      setMessage(sendInvite ? 'Interview saved. Sending invitation...' : 'Interview saved. Invitations have not been sent.');
      if (sendInvite) {
        const invited = await request(`${base}/${saved.id}/invite`, 'POST', { revision: saved.revision });
        setRows(previous => previous.map(row => row.id === saved.id ? invited : row));
        setMessage('Interview saved and email/calendar invitation sent.');
      }
    });
  };
  const updateStatus = (row: Interview, status: string) => run(async () => {
    const updated = await request(`${base}/${row.id}/status`, 'PATCH', { status, revision: row.revision });
    setRows(previous => previous.map(item => item.id === row.id ? updated : item));
    setCancelId(null);
    setMessage(status === 'cancelled' ? 'Interview cancelled. Use “Send cancellation” to notify the candidate and interviewer.' : 'Interview marked completed.');
  });
  const download = (row: Interview) => run(async () => {
    const response = await apiFetch(`${base}/${row.id}/calendar`);
    if (response.status === 401) { onUnauthorized(); return; }
    if (!response.ok) throw new Error('Unable to download calendar event.');
    const url = URL.createObjectURL(await response.blob());
    const link = document.createElement('a'); link.href = url; link.download = 'interview.ics'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  const change = (key: keyof Details, value: string) => setDetails(previous => ({ ...previous, [key]: value }));
  return <dialog ref={dialog} aria-labelledby="tracker-interviews-title" onCancel={event => { event.preventDefault(); if (!busy) onClose(); }} className="m-auto w-[calc(100%_-_24px)] max-w-3xl max-h-[90dvh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 text-slate-800 shadow-xl backdrop:bg-slate-950/60">
    <div className="flex items-start justify-between gap-4 mb-5">
      <div><h2 id="tracker-interviews-title" className="text-lg font-semibold flex items-center gap-2"><Calendar size={20} /> Submission interviews</h2><p className="mt-1 text-sm text-slate-500">{[submission.subId, submission.candidateName].filter(Boolean).join(' · ')}</p></div>
      <button type="button" aria-label="Close interviews" disabled={busy} onClick={onClose} className={button}><X size={18} /></button>
    </div>
    <div className="grid gap-2 sm:grid-cols-2 rounded-xl bg-slate-50 border border-slate-200 p-4 text-sm mb-5">
      <p><span className="text-slate-500">Candidate:</span> {submission.candidateName}</p><p className="break-all"><span className="text-slate-500">Email:</span> {submission.email || 'Add email to submission first'}</p>
      <p><span className="text-slate-500">Client:</span> {submission.clientName || '_'}</p><p><span className="text-slate-500">Job / Role:</span> {submission.skillRole || '_'}</p>
      <p><span className="text-slate-500">Recruiter:</span> {submission.recruiterName || '_'}</p>
    </div>
    {loadError && <div role="alert" className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700"><p className="font-semibold">Unable to load interviews</p><p className="mt-1 text-slate-500">{loadError}</p><button type="button" disabled={busy || loading} className={`${button} mt-3`} onClick={() => void load()}>Retry loading</button></div>}
    {error && <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"><p>{error}</p><button type="button" disabled={busy || loading} className="mt-2 underline" onClick={() => void run(load)}>Reload interviews</button></div>}
    {message && <p role="status" className="mb-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-800">{message}</p>}
    {loading ? <div role="status" className="flex justify-center gap-2 py-8 text-sm text-slate-500"><Loader2 size={18} className="animate-spin" /> Loading interviews...</div> : loaded && !loadError && <div className="space-y-3">
      {!rows.length && <p className="text-center text-sm text-slate-500 py-6">No interviews scheduled for this submission yet.</p>}
      {rows.map(row => <article key={row.id} className="rounded-xl border border-slate-200 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold text-sm">{row.round} round</h3><span className="rounded-full bg-slate-100 px-2 py-1 text-xs capitalize">{row.status}</span></div>
        <p className="mt-2 text-sm">{new Date(row.scheduledDate).toLocaleString('en-GB', { timeZone: row.timezone, dateStyle: 'medium', timeStyle: 'short' })} · {row.timezone} · {row.duration} minutes</p>
        <p className="mt-1 text-sm text-slate-500 break-words">{row.interviewerName} · {row.interviewerEmail} · {row.type}</p>
        {row.location && <p className="text-sm mt-1 break-words">{row.location}</p>}{row.notes && <p className="text-sm text-slate-500 mt-2 whitespace-pre-wrap break-words">{row.notes}</p>}
        <p className="text-xs text-slate-500 mt-2">{row.lastInvitedAt ? `Email/calendar sent ${new Date(row.lastInvitedAt).toLocaleString()}` : 'Email/calendar notification not sent for this version.'}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {row.status === 'scheduled' && row.meetingLink && <a href={row.meetingLink} target="_blank" rel="noopener noreferrer" className={button}><ExternalLink size={14} /> Open meeting</a>}
          {row.status !== 'completed' && <button type="button" disabled={busy || (row.status === 'scheduled' && Date.parse(row.scheduledDate) <= Date.now())} className={button} onClick={() => void run(async () => {
            const updated = await request(`${base}/${row.id}/invite`, 'POST', { revision: row.revision });
            setRows(previous => previous.map(item => item.id === row.id ? updated : item)); setMessage(row.status === 'cancelled' ? 'Cancellation notification sent.' : 'Email/calendar invitation sent.');
          })}><Mail size={14} /> {row.status === 'cancelled' ? 'Send cancellation' : row.lastInvitedAt ? 'Resend invite' : 'Send invite'}</button>}
          <button type="button" disabled={busy} className={button} onClick={() => void download(row)}><Download size={14} /> Calendar</button>
          {row.status === 'scheduled' && <><button type="button" disabled={busy} className={button} onClick={() => openEditor(row)}>Reschedule / edit</button>
            <button type="button" disabled={busy} className={button} onClick={() => setCancelId(row.id)}>Cancel</button>
            {Date.parse(row.scheduledDate) <= Date.now() && <button type="button" disabled={busy} className={button} onClick={() => void updateStatus(row, 'completed')}>Mark completed</button>}</>}
        </div>
        {cancelId === row.id && <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm"><p>Cancel this interview? Notifications will be sent separately.</p><div className="flex gap-2 mt-2"><button type="button" disabled={busy} className={button} onClick={() => void updateStatus(row, 'cancelled')}>Confirm cancellation</button><button type="button" disabled={busy} className={button} onClick={() => setCancelId(null)}>Keep interview</button></div></div>}
      </article>)}
    </div>}
    {!editor && <button type="button" disabled={busy || loading || !loaded || Boolean(loadError)} onClick={() => openEditor()} className={`${button} mt-5`}><Plus size={16} /> Schedule interview</button>}
    {editor && <form className="mt-6 border-t border-slate-200 pt-5" onSubmit={event => { event.preventDefault(); void save(false); }}>
      <h3 className="font-semibold mb-4">{editing ? 'Reschedule interview' : 'Schedule a new round'}</h3>
      <fieldset disabled={busy} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="text-sm">Round<select className={`${field} mt-1`} value={details.round} onChange={e => change('round', e.target.value)}>{['Screening', 'Technical', 'HR', 'Managerial', 'Final'].map(round => <option key={round}>{round}</option>)}</select></label>
        <label className="text-sm">Mode<select className={`${field} mt-1`} value={details.type} onChange={e => change('type', e.target.value)}><option value="video">Online meeting</option><option value="phone">Phone</option><option value="in-person">In-person</option></select></label>
        <label className="text-sm">Interview date and time<input required type="datetime-local" className={`${field} mt-1`} value={details.scheduledDate} onChange={e => change('scheduledDate', e.target.value)} /></label>
        <label className="text-sm">Timezone<select className={`${field} mt-1`} value={details.timezone} onChange={e => change('timezone', e.target.value)}>{[...new Set([...zones, details.timezone])].map(zone => <option key={zone}>{zone}</option>)}</select></label>
        <label className="text-sm">Duration (minutes)<input required type="number" min={15} max={480} className={`${field} mt-1`} value={details.duration} onChange={e => change('duration', e.target.value)} /></label>
        <label className="text-sm">Interviewer name<input required maxLength={255} className={`${field} mt-1`} value={details.interviewerName} onChange={e => change('interviewerName', e.target.value)} /></label>
        <label className="text-sm">Interviewer email<input required type="email" maxLength={254} className={`${field} mt-1`} value={details.interviewerEmail} onChange={e => change('interviewerEmail', e.target.value)} /></label>
        {details.type === 'video' && <label className="text-sm">Meeting link<input required type="url" maxLength={2048} placeholder="https://meet.google.com/..." className={`${field} mt-1`} value={details.meetingLink} onChange={e => change('meetingLink', e.target.value)} /></label>}
        {details.type === 'in-person' && <label className="text-sm">Location<input required maxLength={500} className={`${field} mt-1`} value={details.location} onChange={e => change('location', e.target.value)} /></label>}
        {details.type === 'phone' && <p className="text-sm text-slate-500 self-end pb-2">The interviewer will call using the contact on the submission.</p>}
        <label className="text-sm sm:col-span-2">Notes<textarea maxLength={4000} rows={3} className={`${field} mt-1`} value={details.notes} onChange={e => change('notes', e.target.value)} /></label>
      </fieldset>
      <p className="text-xs text-slate-500 mt-3">Use an existing Google Meet, Teams, Zoom or other HTTPS meeting link. Save & Send Invite emails the candidate and interviewer with a calendar event. Submission status and date remain unchanged.</p>
      <div className="mt-4 flex flex-wrap gap-2"><button type="submit" disabled={busy} className={button}>Save interview</button><button type="button" disabled={busy} onClick={() => void save(true)} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50">{busy ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />} Save & Send Invite</button><button type="button" disabled={busy} onClick={() => setEditor(false)} className={button}>Close form</button></div>
    </form>}
    {busy && <p role="status" className="mt-4 text-sm text-slate-500 flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> Saving / sending, please wait...</p>}
  </dialog>;
}
