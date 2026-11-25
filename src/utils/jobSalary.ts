const fixedSalaryLine = /^\s*(?:[-*•]\s+)?(?:(?:fixed\s+)?salary(?:\s+package)?|compensation|ctc|pay)\s*[:–—-]\s*(?:(₹|INR|USD|\$|GBP|£|EUR|€|AED|OMR|QAR|SAR|KWD)\s*)?(\d[\d,]*(?:\.\d+)?)\s*(lpa|lakhs?|lacs?|lks?|cr(?:ore)?s?|k)?\b(?:\s*(per\s+(?:annum|year|month|hour)|annually|yearly|monthly|hourly|\/\s*(?:yr|mo|hr)))?\s*(?:\([^()]*\))?\s*[.]?\s*$/i;

export function extractFixedJobSalary(description: string) {
  const plain = description.replace(/\*\*/g, '').replace(/\u00a0/g, ' ');
  for (const line of plain.split(/\r?\n/)) {
    const match = fixedSalaryLine.exec(line);
    if (!match) continue;
    const [, currencyToken = '', raw, rawUnit = '', rawRate = ''] = match;
    const unit = rawUnit.toLowerCase();
    const multiplier = /^cr/.test(unit) ? 10_000_000 : unit === 'k' ? 1_000 : unit ? 100_000 : 1;
    const amount = Math.round(Number(raw.replace(/,/g, '')) * multiplier);
    if (!Number.isSafeInteger(amount) || amount <= 0) continue;
    const symbols: Record<string, string> = { '₹': 'INR', '$': 'USD', '£': 'GBP', '€': 'EUR' };
    const currency = symbols[currencyToken] || currencyToken.toUpperCase() || (unit && unit !== 'k' ? 'INR' : '');
    const payRate = /month|\/\s*mo/i.test(rawRate) ? 'per month'
      : /hour|\/\s*hr/i.test(rawRate) ? 'per hour' : 'per year';
    return { min: String(amount), max: '', currency, payRate, payType: 'Exact amount' };
  }
  return null;
}
