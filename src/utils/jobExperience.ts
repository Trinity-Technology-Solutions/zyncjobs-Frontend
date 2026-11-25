export const FRESHER_EXPERIENCE = 'Freshers welcome';

export function isFresherExperience(value: string): boolean {
  return /^(?:freshers?(?:\s+(?:are\s+)?welcome)?|no\s+(?:(?:prior|work|professional)\s+)?experience(?:\s+(?:is\s+)?required)?|0\s*(?:years?|yrs?)(?:\s+of\s+experience)?)$/i.test(value.trim());
}

export function mentionsFresherEligibility(text: string): boolean {
  return /\bfreshers?\s+(?:(?:are\s+)?welcome|(?:can|may)\s+apply)\b|\bno\s+(?:(?:prior|work|professional)\s+)?experience\s+(?:is\s+)?(?:required|needed)\b|(?:^|\n)\s*experience\s*(?:required\s*)?[:–-]\s*freshers?\b|\(\s*freshers?\s*\)|(?:^|\n)[^\n]*[–-]\s*freshers?\s*(?:\(|$)/im.test(text);
}
