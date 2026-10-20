export interface ExperienceDateParts {
  startMonth: string;
  startYear: string;
  endMonth: string;
  endYear: string;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function monthNumber(value: string): number {
  const n = Number(value);
  if (n >= 1 && n <= 12) return n;
  const index = MONTHS.findIndex(month => month.toLowerCase() === value.slice(0, 3).toLowerCase());
  return index < 0 ? 0 : index + 1;
}

function normalizeMonth(value = ''): string {
  const number = monthNumber(value.trim());
  return number ? String(number).padStart(2, '0') : '';
}

function parsePoint(value: string): { month: string; year: string } {
  const text = value.trim();
  const iso = text.match(/^(\d{4})-(\d{1,2})$/);
  if (iso) return { year: iso[1], month: normalizeMonth(iso[2]) };
  const year = text.match(/(?:19|20|21)\d{2}/)?.[0] || '';
  const monthName = text.match(/\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\b/i)?.[0] || '';
  const numericMonth = text.match(/\b(0?[1-9]|1[0-2])[/.](?:19|20|21)\d{2}\b/);
  return { year, month: normalizeMonth(monthName || (numericMonth ? numericMonth[1] : '')) };
}

export function parseExperienceDuration(duration = ''): ExperienceDateParts {
  const clean = duration.replace(/[\u2012-\u2015\u2212]/g, '-').replace(/\s+/g, ' ').trim();
  const parts: ExperienceDateParts = { startMonth: '', startYear: '', endMonth: '', endYear: '' };
  if (!clean) return parts;
  const range = clean.match(/(.+?)\s+(?:-|to)\s+(.+)/i)
    || clean.match(/((?:19|20|21)\d{2})\s*-\s*((?:19|20|21)\d{2})/)
    || clean.match(/(\d{4}-\d{1,2})\s*-\s*(.+)/);
  if (range) {
    const start = parsePoint(range[1]);
    const end = parsePoint(range[2]);
    return { startMonth: start.month, startYear: start.year, endMonth: end.month, endYear: /present|current|now/i.test(range[2]) ? '' : end.year };
  }
  const start = parsePoint(clean);
  return { startMonth: start.month, startYear: start.year, endMonth: '', endYear: '' };
}

export function getExperienceDateParts(exp: Partial<ExperienceDateParts> & { duration?: string }): ExperienceDateParts {
  const parsed = parseExperienceDuration(exp.duration || '');
  return {
    startMonth: normalizeMonth(exp.startMonth || parsed.startMonth),
    startYear: exp.startYear || parsed.startYear,
    endMonth: normalizeMonth(exp.endMonth || parsed.endMonth),
    endYear: exp.endYear || parsed.endYear,
  };
}

export function formatExperienceDateParts(parts: ExperienceDateParts, current = false): string {
  const formatPoint = (month: string, year: string) => [monthNumber(month) ? MONTHS[monthNumber(month) - 1] : '', year].filter(Boolean).join(' ');
  const start = formatPoint(parts.startMonth, parts.startYear);
  const end = current ? 'Present' : formatPoint(parts.endMonth, parts.endYear);
  if (start && end && start === end) return start;
  if (start && end) return `${start} – ${end}`;
  return start || end;
}

export function formatExperienceDuration(exp: Partial<ExperienceDateParts> & { duration?: string; current?: boolean }): string {
  const parts = getExperienceDateParts(exp);
  return formatExperienceDateParts(parts, !!exp.current || /present|current|now/i.test(exp.duration || '')) || exp.duration || '';
}
