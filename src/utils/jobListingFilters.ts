const locationAliases: Record<string, string> = {
  chennai: 'Chennai', madras: 'Chennai', hy: 'Hyderabad', hyd: 'Hyderabad',
  hyderabad: 'Hyderabad', bangalore: 'Bangalore', bengaluru: 'Bangalore',
  muscat: 'Muscat', musacat: 'Muscat', muscut: 'Muscat', gurgaon: 'Gurgaon',
  gurugram: 'Gurgaon', 'pan india': 'India', india: 'India',
  'work from home': 'Remote', wfh: 'Remote', remote: 'Remote', uae: 'UAE', usa: 'USA', uk: 'UK',
};
const regions = new Set([
  'tamil nadu', 'tamilnadu', 'karnataka', 'telangana', 'maharashtra', 'kerala',
  'andhra pradesh', 'haryana', 'uttar pradesh', 'north carolina', 'india', 'oman',
  'united arab emirates', 'uae', 'united states', 'usa', 'united kingdom', 'uk',
]);
const nonLocations = /^(?:stay\s+in|live\s+in|office|wfo|work\s+from\s+office|on[ -]?site|in[ -]?person|hybrid|anywhere|not specified|n\s*a|none)$/i;

export const filterKey = (label: string) => label.toLowerCase().replace(/&/g, ' and ').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

export function listingLocations(value: unknown): string[] {
  if (typeof value !== 'string') return [];
  const locations = new Map<string, string>();
  for (const segment of value.replace(/\([^)]*\)/g, ' ').split(/[\/;|\n]+/)) {
    let hasPlace = false;
    for (const part of segment.split(',')) {
      const name = part.trim().replace(/\s+[–—-]\s+.*$/, '').replace(/\s+as per\b.*$/i, '').trim();
      const key = filterKey(name);
      if (!key || nonLocations.test(key) || (hasPlace && regions.has(key))) continue;
      const label = Object.prototype.hasOwnProperty.call(locationAliases, key)
        ? locationAliases[key]
        : key.replace(/(?:^|\s)\p{L}/gu, letter => letter.toUpperCase());
      locations.set(filterKey(label), label);
      hasPlace = true;
    }
  }
  return [...locations.values()];
}

export function listingJobTypes(job: { jobType?: unknown; type?: unknown }): string[] {
  const aliases: Record<string, string> = {
    'full time': 'Full-time', fulltime: 'Full-time', 'part time': 'Part-time', parttime: 'Part-time',
    contract: 'Contract', contractor: 'Contract', temporary: 'Temporary', temp: 'Temporary',
    internship: 'Internship', intern: 'Internship',
  };
  const raw = [job.jobType, job.type].flatMap(value => Array.isArray(value) ? value : typeof value === 'string' ? value.split(/[,/|]/) : []);
  return [...new Set(raw.flatMap(value => {
    if (typeof value !== 'string') return [];
    const key = filterKey(value);
    if (!key || ['remote', 'hybrid', 'onsite', 'on site', 'work from office', 'in person', 'wfo', 'wfh'].includes(key)) return [];
    return [Object.prototype.hasOwnProperty.call(aliases, key) ? aliases[key] : value.trim()];
  }))];
}

function workMode(value: unknown): string {
  if (typeof value !== 'string') return '';
  const key = filterKey(value);
  if (/\bhybrid\b/.test(key)) return 'Hybrid';
  if (/\b(?:remote|wfh|work from home)\b/.test(key)) return 'Remote';
  if (/\b(?:on ?site|in person|work from office|wfo)\b/.test(key)) return 'Work from office';
  return '';
}

export function listingWorkMode(job: { workSetting?: unknown; workMode?: unknown; locationType?: unknown; location?: unknown; jobType?: unknown; type?: unknown }): string {
  return workMode(job.workSetting) || workMode(job.workMode) || workMode(job.locationType) || workMode(job.location)
    || workMode(job.jobType) || workMode(job.type);
}

function salaryAmount(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) && value > 0 ? value : 0;
  if (typeof value !== 'string') return 0;
  const match = value.trim().replace(/,/g, '').match(/^(?:(?:INR|₹|Rs\.?)[ ]*)?(\d+(?:\.\d+)?)\s*(lpa|lakhs?|l|cr|crores?|k)?$/i);
  if (!match) return 0;
  const unit = match[2]?.toLowerCase();
  return Number(match[1]) * (unit === 'k' ? 1_000 : unit?.startsWith('cr') ? 10_000_000 : unit ? 100_000 : 1);
}

export function listingAnnualInrSalary(job: {
  salary?: string | number | { min?: unknown; max?: unknown; currency?: string; period?: string } | null;
  salaryMin?: unknown; salaryMax?: unknown; currency?: string; payRate?: string; payType?: string;
}) {
  const salary = job.salary && typeof job.salary === 'object' ? job.salary : undefined;
  const currency = (job.currency || salary?.currency || 'INR').trim().toUpperCase();
  const period = job.payRate || salary?.period || '';
  if (currency !== 'INR' || /hour|day|week/i.test(period)) return null;
  const factor = /month/i.test(period) ? 12 : 1;
  const low = salaryAmount(salary?.min) || salaryAmount(job.salaryMin) || salaryAmount(job.salary);
  const high = salaryAmount(salary?.max) || salaryAmount(job.salaryMax);
  if (!low && !high) return null;
  return {
    min: /maximum|up to/i.test(job.payType || '') ? 0 : (low || high) * factor,
    max: /starting|minimum/i.test(job.payType || '') ? Infinity : (high || low) * factor,
  };
}

export function listingFacetCounts<T>(jobs: T[], labelsFor: (job: T) => string[]) {
  const entries = new Map<string, { key: string; label: string; count: number }>();
  for (const job of jobs) {
    const seen = new Set<string>();
    for (const label of labelsFor(job)) {
      const key = filterKey(label);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      const entry = entries.get(key) || { key, label: label.trim(), count: 0 };
      entry.count += 1;
      entries.set(key, entry);
    }
  }
  return [...entries.values()].sort((a, b) => a.label.localeCompare(b.label));
}
