import { getScreeningFlag } from '../utils/applicationScreening';

export default function ApplicationScreeningFlag({ application }: { application: Parameters<typeof getScreeningFlag>[0] & { aiAnalysis?: { reviewReasons?: string[]; reasons?: string[] } } }) {
  const flag = getScreeningFlag(application);
  if (!flag) return null;

  const reasons = Array.isArray(application.aiAnalysis?.reviewReasons) ? application.aiAnalysis.reviewReasons : [];
  const evidence = Array.isArray(application.aiAnalysis?.reasons)
    ? application.aiAnalysis.reasons.filter(item => typeof item === 'string' && item.trim())
    : [];
  return (
    <div className="my-2 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2 text-xs text-amber-900">
      <p className="font-semibold">{flag === 'needs-review' ? 'Needs Review' : 'Previously auto-rejected'}</p>
      {flag === 'needs-review' && reasons.length > 0 && (
        <ul className="mt-1 list-disc space-y-0.5 pl-4">
          {reasons.map(reason => <li key={reason}>{reason}</li>)}
        </ul>
      )}
      {flag === 'needs-review' && evidence.length > 0 && (
        <details className="mt-1" onPointerDown={event => event.stopPropagation()}>
          <summary className="cursor-pointer">Screening details</summary>
          <ul className="mt-1 list-disc space-y-0.5 pl-4">
            {evidence.map((item, index) => <li key={index}>{item}</li>)}
          </ul>
        </details>
      )}
    </div>
  );
}
