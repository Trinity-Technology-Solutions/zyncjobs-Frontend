// Test script for experience range parsing
// Run: node test-experience.mjs

// ── Snap functions (mirrors JobParsingPage & JobPostingPage) ──────────────────
const snapMin = (n) => {
  const opts = [0,1,2,3,4,5,6,7,8,9,10,12,15,20];
  const c = opts.reduce((a, b) => Math.abs(b - n) < Math.abs(a - n) ? b : a);
  return `${c} year${c !== 1 ? 's' : ''}`;
};
const snapMax = (n) => {
  const opts = [1,2,3,4,5,6,7,8,9,10,12,15,20,25];
  const c = opts.reduce((a, b) => Math.abs(b - n) < Math.abs(a - n) ? b : a);
  return `${c} year${c !== 1 ? 's' : ''}`;
};

// ── normalizeExperienceRange (mirrors JobParsingPage) ─────────────────────────
function normalizeExperienceRange(raw) {
  if (!raw) return '';
  const text = raw.toLowerCase().replace(/\s+/g, ' ').trim();
  // FIXED: use (?:[-–—]|\bto\b) not [-–—to]+
  const rangeMatch = text.match(/(\d+)\s*(?:[-\u2013\u2014]|\bto\b)\s*(\d+)/);
  if (rangeMatch) {
    return `${snapMin(parseInt(rangeMatch[1]))} - ${snapMax(parseInt(rangeMatch[2]))}`;
  }
  const singleMatch = text.match(/(\d+)/);
  if (singleMatch) {
    const n = parseInt(singleMatch[1]);
    return `${snapMin(n)} - ${snapMax(Math.min(n + 2, 25))}`;
  }
  return '';
}

// ── JobPostingPage inline normalize (mirrors state initializer) ───────────────
function jobPostingNormalize(val) {
  if (!val) return '';
  // Handle already-formatted "X years - Y years"
  const formatted = val.match(/(\d+)\s*years?\s*-\s*(\d+)\s*years?/);
  if (formatted) return `${snapMin(parseInt(formatted[1]))} - ${snapMax(parseInt(formatted[2]))}`;
  const m = val.match(/(\d+)\s*(?:[-\u2013\u2014]|\bto\b)\s*(\d+)/);
  if (m) return `${snapMin(parseInt(m[1]))} - ${snapMax(parseInt(m[2]))}`;
  const s = val.match(/(\d+)/);
  if (s) { const n = parseInt(s[1]); return `${snapMin(n)} - ${snapMax(Math.min(n+2,25))}`; }
  return '';
}

// ── jobParser extractExperience (mirrors jobParser.ts) ───────────────────────
function jobParserExtract(text) {
  // Simulate cleanText (collapses whitespace)
  const clean = text.replace(/\r/g,'').replace(/\t/g,' ').replace(/\n{2,}/g,'\n').replace(/\s{2,}/g,' ').trim();

  // Simulate section extraction for 'experience'
  const sectionMatch = clean.match(/Experience(?:\s+Required)?\s*:?\s*([^\n]+)/i);
  const rawSection = sectionMatch ? sectionMatch[1].trim() : '';

  if (rawSection) {
    // FIXED: use (?:[-–—]|\bto\b)
    const m = rawSection.match(/(\d+)\s*(?:[-\u2013\u2014]|\bto\b)\s*(\d+)/);
    if (m) return `${m[1]}-${m[2]} years`;
    const s = rawSection.match(/(\d+)/);
    if (s && parseInt(s[1]) <= 40) return `${s[1]}+ years`;
  }

  const labelPatterns = [
    /experience\s+required\s*[:\-]?\s*(\d+)\s*[-\u2013\u2014]?\s*(\d+)\s*(?:years?|yrs?)/i,
    /(\d+)\s*[-\u2013\u2014]\s*(\d+)\s*(?:years?|yrs?)\s*(?:of\s+)?(?:experience|exp)/i,
    /(\d+)\s+to\s+(\d+)\s*(?:years?|yrs?)\s*(?:of\s+)?(?:experience|exp)/i,
  ];
  for (const p of labelPatterns) {
    const m = clean.match(p);
    if (m && m[1]) {
      const a = parseInt(m[1]), b = m[2] ? parseInt(m[2]) : NaN;
      if (!isNaN(a) && a <= 40) {
        if (!isNaN(b) && b <= 40 && b >= a) return `${a}-${b} years`;
        return `${a}+ years`;
      }
    }
  }
  return '';
}

// ── Test cases ────────────────────────────────────────────────────────────────
const PASS = '✅ PASS';
const FAIL = '❌ FAIL';

function check(label, got, expected) {
  const ok = got === expected;
  console.log(`${ok ? PASS : FAIL}  ${label}`);
  if (!ok) console.log(`        got:      "${got}"\n        expected: "${expected}"`);
}

console.log('\n=== normalizeExperienceRange ===');
check('9 to 15 years',       normalizeExperienceRange('9 to 15 years'),   '9 years - 15 years');
check('9-15 years',          normalizeExperienceRange('9-15 years'),       '9 years - 15 years');
check('9 - 15 years',        normalizeExperienceRange('9 - 15 years'),     '9 years - 15 years');
check('11 to 15 years',      normalizeExperienceRange('11 to 15 years'),   '10 years - 15 years');
check('11-15 years',         normalizeExperienceRange('11-15 years'),      '10 years - 15 years');
check('3 to 5 years',        normalizeExperienceRange('3 to 5 years'),     '3 years - 5 years');
check('0 to 1 year',         normalizeExperienceRange('0 to 1 year'),      '0 years - 1 year');
check('20 to 25 years',      normalizeExperienceRange('20 to 25 years'),   '20 years - 25 years');
check('single 9+ years',     normalizeExperienceRange('9+ years'),         '9 years - 10 years');
check('AI output 9-10 years',normalizeExperienceRange('9-10 years'),       '9 years - 10 years');

console.log('\n=== jobPostingNormalize (state initializer) ===');
check('9 years - 15 years',  jobPostingNormalize('9 years - 15 years'),   '9 years - 15 years');
check('9-15 years',          jobPostingNormalize('9-15 years'),            '9 years - 15 years');
check('9 to 15 years',       jobPostingNormalize('9 to 15 years'),        '9 years - 15 years');
check('11 to 15 years',      jobPostingNormalize('11 to 15 years'),       '10 years - 15 years');

console.log('\n=== jobParserExtract (from raw JD text) ===');
check('label: 9 to 15',
  jobParserExtract('Experience Required: 9 to 15 years'),
  '9-15 years');
check('label: 9-15',
  jobParserExtract('Experience Required: 9-15 years'),
  '9-15 years');
check('inline range',
  jobParserExtract('We need 9 to 15 years of experience in Java'),
  '9-15 years');
check('11-15 yrs exp',
  jobParserExtract('11-15 years of experience required'),
  '11-15 years');
check('collapsed newline',
  jobParserExtract('Experience Required\n9 to 15 years\nNotice Period'),
  '9-15 years');

console.log('\n=== End-to-end: parser → normalize → dropdown value ===');
const testCases = [
  { jd: 'Experience Required: 9 to 15 years', expectedMin: '9 years', expectedMax: '15 years' },
  { jd: 'Experience: 11-15 years', expectedMin: '10 years', expectedMax: '15 years' },
  { jd: 'Minimum 5 to 8 years of experience', expectedMin: '5 years', expectedMax: '8 years' },
  { jd: '3 to 5 years of experience required', expectedMin: '3 years', expectedMax: '5 years' },
  { jd: 'Experience Required: 20 to 25 years', expectedMin: '20 years', expectedMax: '25 years' },
];

for (const { jd, expectedMin, expectedMax } of testCases) {
  const parsed = jobParserExtract(jd);
  const normalized = normalizeExperienceRange(parsed);
  const [minPart, maxPart] = normalized.split(' - ');
  const ok = minPart === expectedMin && maxPart === expectedMax;
  console.log(`${ok ? PASS : FAIL}  "${jd}"`);
  if (!ok) console.log(`        parsed: "${parsed}"  normalized: "${normalized}"  expected: "${expectedMin} - ${expectedMax}"`);
}

console.log('');
