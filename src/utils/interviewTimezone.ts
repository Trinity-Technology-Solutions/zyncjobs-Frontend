export function interviewLocalTime(value: string, timezone: string) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date(value));
  const get = (type: string) => parts.find(part => part.type === type)?.value || '';
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
}

// Interpret the selected wall-clock time in its named zone, rather than the browser zone.
export function interviewUtcTime(local: string, timezone: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local)) throw new Error('Select a valid interview date and time.');
  const base = Date.parse(`${local}:00Z`);
  if (!Number.isFinite(base) || new Date(base).toISOString().slice(0, 16) !== local) throw new Error('Invalid interview date.');
  const matches: string[] = [];
  for (let offset = -14 * 60; offset <= 14 * 60; offset += 15) {
    const iso = new Date(base + offset * 60000).toISOString();
    if (interviewLocalTime(iso, timezone) === local) matches.push(iso);
  }
  if (matches.length !== 1) throw new Error('This local time is skipped or repeated by daylight saving. Choose a different time or use UTC.');
  return matches[0];
}
