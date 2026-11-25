const usCitizenship = /\b(?:u\.?\s*s\.?|united states)\s+citizen(?:s|ship)?\b/i;
const noCitizenshipRestriction = /\b(?:citizen(?:s|ship)?\s+(?:is\s+)?not\s+(?:required|needed)|no\s+(?:citizenship|nationality)\s+(?:requirement|restriction))\b/i;

export function extractJobWorkAuthorization(text: string): string[] {
  const options: string[] = [];
  if (text.split(/\r?\n/).some(line => usCitizenship.test(line) && !noCitizenshipRestriction.test(line))) options.push('US Citizen');
  if (/green\s*card|permanent\s*resident/i.test(text)) options.push('Green Card Holder');
  if (/\bh-?1b\b/i.test(text)) options.push('H1B Visa');
  if (/\bl-?1\s*visa\b/i.test(text)) options.push('L1 Visa');
  if (/\bopt\s*\/\s*cpt\b|\b(?:opt|cpt)\s+(?:visa|authorization|eligible)\b|\bf-?1\s*visa\b/i.test(text)) options.push('OPT/CPT');
  if (/\btn\s*visa\b/i.test(text)) options.push('TN Visa');
  if (/no\s*sponsorship|sponsorship\s*not\s*available/i.test(text)) options.push('No Sponsorship Required');
  else if (/will\s*sponsor|sponsorship\s*(?:is\s+)?available|offers?\s+visa\s+sponsorship/i.test(text)) options.push('Will Sponsor');
  return options;
}
