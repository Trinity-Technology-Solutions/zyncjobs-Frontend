import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Loader2, X } from 'lucide-react';
import { apiFetch } from '../../../api/apiFetch';
import { API_ENDPOINTS } from '../../../config/env';

interface Candidate { id: string; name: string; email?: string; phone?: string; resumeOriginalName?: string; resumeFile?: string }
interface TransferResult {
  created: { talentCandidateId: string }[];
  duplicates: { candidateId: string; name: string }[];
  invalid: { candidateId: string; name: string; reason: string }[];
}
interface Props {
  candidates: Candidate[];
  recruiterName: string;
  onClose: () => void;
  onUnauthorized: () => void;
  onCreated: (ids: string[]) => void;
  onOpenTracker?: () => void;
}
const statuses = ['Submitted', 'Feedback', 'Shortlisted', 'Rejected', 'Screening', 'Not Relevant'];
const sources = ['Internal DB', 'LinkedIn', 'Naukri', 'Indeed', 'Monster', 'Shine', 'TimesJobs', 'ZipRecruiter', 'Glassdoor', 'Foundit', 'Hirist', 'Internshala', 'Referral', 'Walk-in', 'Other'];
const fieldClass = 'w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500';

export default function TalentPoolSubmissionModal({ candidates, recruiterName, onClose, onUnauthorized, onCreated, onOpenTracker }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const submitting = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<TransferResult | null>(null);
  const [details, setDetails] = useState({ clientName: '', skillRole: '', recruiterName, source: 'Internal DB', submittedDate: new Date().toISOString().slice(0, 10), interviewDate: '', status: 'Submitted' });
  useEffect(() => { const element = dialog.current; element?.showModal(); return () => element?.close(); }, []);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting.current || result) return;
    submitting.current = true; setBusy(true); setError('');
    try {
      const response = await apiFetch(`${API_ENDPOINTS.TRACKER_ROWS}/from-talent-pool`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientName: details.clientName, skillRole: details.skillRole, source: details.source, interviewDate: details.interviewDate, status: details.status, candidateIds: candidates.map(candidate => candidate.id) }),
      });
      if (response.status === 401) { onUnauthorized(); return; }
      const data = await response.json();
      if (!response.ok && ![409, 422].includes(response.status)) throw new Error(data.error || 'Unable to send candidates.');
      if (!Array.isArray(data.created) || !Array.isArray(data.duplicates) || !Array.isArray(data.invalid)) throw new Error(data.error || 'Unexpected response from Submission Tracker.');
      setResult(data);
      if (data.created.length) {
        onCreated(data.created.map((row: { talentCandidateId: string }) => row.talentCandidateId));
        window.dispatchEvent(new Event('zync:tracker-updated'));
      }
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to send candidates.'); }
    finally { submitting.current = false; setBusy(false); }
  };
  return (
    <dialog ref={dialog} aria-labelledby="talent-submission-title" onCancel={event => { event.preventDefault(); if (!busy) onClose(); }} className="m-auto w-[calc(100%_-_32px)] max-w-2xl max-h-[90dvh] overflow-y-auto rounded-xl border border-gray-700 bg-gray-900 p-6 text-gray-200 backdrop:bg-black/70">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div><h3 id="talent-submission-title" className="font-semibold text-lg text-white">Send to Submission Tracker</h3><p className="text-sm text-gray-400 mt-1">Candidate details and original resumes are reused automatically.</p></div>
        <button type="button" disabled={busy} onClick={onClose} aria-label="Close" className="p-1 disabled:opacity-40"><X size={20} /></button>
      </div>
      <ul className="max-h-36 overflow-y-auto rounded-lg bg-gray-800 p-3 mb-5 space-y-2" aria-label="Selected candidates">
        {candidates.map(candidate => <li key={candidate.id} className="text-sm"><span className="font-medium text-white">{candidate.name || 'Unnamed candidate'}</span><span className="block text-xs text-gray-400 break-all">{candidate.email || candidate.phone || 'Contact not available'} · {candidate.resumeOriginalName || candidate.resumeFile || 'Stored resume'}</span></li>)}
      </ul>
      {result ? <div role="status" className="space-y-3">
        <p className="text-emerald-400">{result.created.length} candidate(s) added to Submission Tracker.</p>
        {result.duplicates.length > 0 && <p className="text-amber-300">Already submitted to this client/job: {result.duplicates.map(candidate => candidate.name).join(', ')}. No duplicate records created.</p>}
        {result.invalid.map(candidate => <p key={candidate.candidateId} className="text-red-300">{candidate.name}: {candidate.reason}</p>)}
        <div className="flex gap-3 pt-3"><button type="button" onClick={onClose} className="rounded-lg border border-gray-600 px-4 py-2">Close</button>{onOpenTracker && <button type="button" onClick={onOpenTracker} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white">Open Submission Tracker <ArrowRight size={16} /></button>}</div>
      </div> : <form onSubmit={submit}>
        <fieldset disabled={busy} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {([['clientName', 'Client / HR'], ['skillRole', 'Job / requisition title or ID']] as const).map(([key, label]) => <label key={key} className="text-sm">{label}<input required maxLength={255} value={details[key]} onChange={event => setDetails({ ...details, [key]: event.target.value })} className={`${fieldClass} mt-1`} /></label>)}
          <label className="text-sm">Source<select required value={details.source} onChange={event => setDetails({ ...details, source: event.target.value })} className={`${fieldClass} mt-1`}>{sources.map(source => <option key={source}>{source}</option>)}</select></label>
          <label className="text-sm">Recruiter<input readOnly value={recruiterName || 'Logged-in user'} className={`${fieldClass} mt-1 text-gray-400`} /></label>
          <label className="text-sm">Submitted date<input readOnly type="date" value={details.submittedDate} className={`${fieldClass} mt-1 text-gray-400`} /><span className="block text-xs text-gray-400 mt-1">Automatically confirmed by the server when saved.</span></label>
          <label className="text-sm">Interview date (optional)<input type="date" min={details.submittedDate} value={details.interviewDate} onChange={event => setDetails({ ...details, interviewDate: event.target.value })} className={`${fieldClass} mt-1`} /></label>
          <label className="text-sm">Status<select required value={details.status} onChange={event => setDetails({ ...details, status: event.target.value })} className={`${fieldClass} mt-1`}>{statuses.map(status => <option key={status}>{status}</option>)}</select></label>
        </fieldset>
        {error && <p role="alert" className="text-sm text-red-300 mt-4">{error}</p>}
        <p className="text-xs text-gray-400 mt-4">These submission details apply to all {candidates.length} selected candidate(s). Use the same client and job identifier for duplicate checks.</p>
        {candidates.length > 100 && <p role="alert" className="text-sm text-amber-300 mt-3">Select at most 100 candidates per submission batch.</p>}
        <button type="submit" disabled={busy || candidates.length > 100} className="mt-5 flex items-center justify-center gap-2 w-full rounded-lg bg-blue-600 py-3 text-white disabled:opacity-50">{busy ? <><Loader2 size={16} className="animate-spin" /> Sending…</> : 'Send to Submission Tracker'}</button>
      </form>}
    </dialog>
  );
}
