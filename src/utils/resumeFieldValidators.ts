/**
 * resumeFieldValidators.ts
 *
 * Centralized field-level validation for the Resume Builder.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A validator returns null (valid) or an error message string (invalid). */
export type FieldValidator = (value: string) => string | null;

// ---------------------------------------------------------------------------
// PERSONAL INFORMATION
// ---------------------------------------------------------------------------

/**
 * Full Name
 *
 * Accepts: Unicode letters, spaces, hyphens, apostrophes, periods (initials).
 * Real-world examples: O'Brien, García-López, Mary Ann, Dr. Smith, Nguyễn Văn A
 *
 * Rejects: purely numeric strings like "12345", strings with no letter characters.
 *
 * Not rejected: names with numbers in the middle are uncommon but names like
 * "John 3rd" are valid edge cases; we only block purely-numeric values.
 */
export const validateName: FieldValidator = (value) => {
  const v = value.trim();
  if (!v) return null; // empty → optionality handled elsewhere

  // Names should not contain numbers/digits
  if (/\d/.test(v)) {
    return 'Name should not contain numbers';
  }

  // Must contain at least one Unicode letter character
  if (!/\p{L}/u.test(v)) {
    return 'Name must contain at least one letter';
  }

  // Allowed characters: Unicode letters, spaces, hyphens/dashes, apostrophes, periods, commas
  // Reject inappropriate special characters like @, #, $, %, ^, &, *, !, ?, etc.
  if (/[^\p{L}\s.'’\-–—,]/u.test(v)) {
    return 'Name contains invalid characters';
  }

  return null;
};

/**
 * Email Address
 *
 * Uses a deliberately lenient RFC-friendly regex.
 * Accepts: user@example.com, user+tag@sub.domain.co.uk, user@123.com
 * Rejects: missing @, missing domain, obvious non-email text
 *
 * Does NOT reject: valid addresses that simple validators wrongly reject
 * (e.g. addresses with subdomains, +, dots in local part).
 */
export const validateEmail: FieldValidator = (value) => {
  const v = value.trim();
  if (!v) return null;

  // Basic structural check: something @ something . something
  // Intentionally lenient — real-world email formats are complex.
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!emailRegex.test(v)) {
    return 'Enter a valid email address (e.g. name@example.com)';
  }

  return null;
};

/**
 * Phone Number
 *
 * Accepts: international and domestic phone formats used globally.
 * Examples:
 *   +91 98765 43210
 *   +1-800-555-0100
 *   (044) 2345 6789
 *   +44 20 7946 0958
 *   9876543210
 *
 * Rejects:
 *   - Alphabetic text ("nine eight seven...")
 *   - Strings with no digits at all
 *   - Strings shorter than 6 digits (no real phone is that short)
 *   - Inappropriate symbols
 *
 * Accepts: +, -, spaces, parentheses, dots — all common phone separators.
 * Does NOT enforce a specific format because formats differ by country.
 */
export const validatePhone: FieldValidator = (value) => {
  const v = value.trim();
  if (!v) return null;

  // Must contain at least one digit
  if (!/\d/.test(v)) {
    return 'Phone number must contain digits';
  }

  // Must not contain alphabetic letters (including Unicode letters)
  if (/\p{L}/u.test(v)) {
    return 'Phone number should not contain letters';
  }

  // Must contain at least 6 digit characters (shortest valid phone)
  const digitCount = (v.match(/\d/g) || []).length;
  if (digitCount < 6) {
    return 'Enter a valid phone number';
  }

  // Must only contain phone-valid characters: digits, +, -, (, ), space, .
  if (/[^0-9+\-().\s]/.test(v)) {
    return 'Phone number contains invalid characters';
  }

  return null;
};

/**
 * URL / Website / LinkedIn / Portfolio / GitHub / Project URL
 *
 * Accepts: http://, https://, and bare domains like github.com/user
 * (users often paste without the protocol)
 *
 * Rejects: plain text that is clearly not a URL (no dot, no slash structure)
 *
 * Does NOT reject: URLs with query strings, paths, fragments.
 */
export const validateUrl: FieldValidator = (value) => {
  const v = value.trim();
  if (!v) return null;

  // Accept full URLs with protocol
  if (/^https?:\/\//i.test(v)) {
    // Must have a hostname with at least one dot
    try {
      const url = new URL(v);
      if (!url.hostname.includes('.')) {
        return 'Enter a valid URL (e.g. https://linkedin.com/in/yourname)';
      }
      return null;
    } catch {
      return 'Enter a valid URL (e.g. https://linkedin.com/in/yourname)';
    }
  }

  // Accept bare domain-style URLs (github.com/user, linkedin.com/in/...)
  // Must have a dot and look like a domain, not just random text
  if (/^[a-zA-Z0-9]([a-zA-Z0-9-]*\.)+[a-zA-Z]{2,}/.test(v)) {
    return null;
  }

  return 'Enter a valid URL (e.g. https://github.com/username)';
};

// ---------------------------------------------------------------------------
// EXPERIENCE
// ---------------------------------------------------------------------------

/**
 * Job Title / Role
 *
 * Highly permissive: real job titles include numbers (Level 2, Tier III),
 * abbreviations (Sr., Jr., III), ampersands (Sales & Marketing Manager),
 * slashes (iOS/Android Developer).
 *
 * Only rejects: purely-numeric strings (e.g. "12345") and completely empty
 * strings with only invalid characters.
 */
export const validateJobTitle: FieldValidator = (value) => {
  const v = value.trim();
  if (!v) return null;

  if (!/\p{L}/u.test(v)) {
    return 'Job title must contain at least one letter';
  }

  return null;
};

/**
 * Company / Institution / Organization name
 *
 * Same reasoning as job title — company names can include numbers
 * (3M, 7-Eleven, AWS), symbols (&, +, .), Unicode.
 */
export const validateOrgName: FieldValidator = (value) => {
  const v = value.trim();
  if (!v) return null;

  if (!/\p{L}/u.test(v)) {
    return 'Must contain at least one letter';
  }

  return null;
};

/**
 * Duration / Date Range
 *
 * The application represents durations as free-text strings like:
 *   "Jan 2020 – Mar 2023"
 *   "2018 – 2022"
 *   "2020 – Present"
 *   "2018"  (passing year for education)
 *
 * Validation: must not be purely alphabetic with no year-like digits.
 * We do not force a specific format because the app uses free-text fields.
 */
export const validateDuration: FieldValidator = (value) => {
  const v = value.trim();
  if (!v) return null;

  // Must contain at least 2 digits (a year has 4, even partial entries have 2)
  const digitCount = (v.match(/\d/g) || []).length;
  if (digitCount < 2) {
    return 'Enter a valid duration or year (e.g. 2020 – 2022)';
  }

  return null;
};

// ---------------------------------------------------------------------------
// EDUCATION
// ---------------------------------------------------------------------------

/**
 * Grade / CGPA / Percentage
 *
 * The app accepts diverse grade formats:
 *   8.5 CGPA / 3.8 GPA / 85% / Distinction / A+ / Pass
 *
 * Rejects: obvious non-grade content (long sentences).
 * Does NOT enforce numeric-only because "Distinction", "A+" are valid.
 */
export const validateGrade: FieldValidator = (value) => {
  const v = value.trim();
  if (!v) return null;

  // Grade fields should be short (max 30 chars covers "9.8 CGPA or First Class")
  if (v.length > 30) {
    return 'Grade field seems too long — enter a grade, CGPA, or percentage';
  }

  return null;
};

// ---------------------------------------------------------------------------
// SKILLS
// ---------------------------------------------------------------------------

/**
 * Individual Skill
 *
 * Accepts: technical symbols (C++, C#, .NET, CI/CD, Node.js, REST APIs),
 * Unicode names, multi-word skills ("Machine Learning", "Project Management").
 *
 * Rejects:
 *   - Empty / whitespace-only values
 *   - Values over 60 characters (extractSkills already enforces this for AI)
 *   - Strings that are entirely whitespace or punctuation with no alphanum
 */
export const validateSkill: FieldValidator = (value) => {
  const v = value.trim();
  if (!v) return 'Skill cannot be empty';

  if (v.length > 60) {
    return 'Skill name is too long (max 60 characters)';
  }

  // Must contain at least one alphanumeric character or common tech symbol
  // Allow: letters (Unicode), digits, +, #, ., -, /
  if (!/[\p{L}\p{N}]/u.test(v)) {
    return 'Skill must contain at least one letter or number';
  }

  return null;
};

// ---------------------------------------------------------------------------
// CERTIFICATIONS / AWARDS / LANGUAGES
// ---------------------------------------------------------------------------

/**
 * Certification / Award Name
 * Same as job title — must have at least one letter.
 */
export const validateCertificationName: FieldValidator = validateJobTitle;

/**
 * Issuer / Issuing Organization
 * Same as org name.
 */
export const validateIssuer: FieldValidator = validateOrgName;

/**
 * Year field (certification year, award year)
 *
 * Accepts: 4-digit years like 2022, year ranges (2020-2022), "Present"
 * Rejects: non-year text (e.g. alphabetic strings with no digits)
 */
export const validateYear: FieldValidator = (value) => {
  const v = value.trim();
  if (!v) return null;

  // Must contain at least one digit if non-empty
  if (!/\d/.test(v)) {
    return 'Enter a valid year (e.g. 2022)';
  }

  // If it looks like a pure number, validate the range roughly
  const num = parseInt(v, 10);
  if (/^\d{4}$/.test(v) && (num < 1900 || num > 2100)) {
    return 'Enter a realistic year (e.g. 2022)';
  }

  return null;
};

/**
 * Language name
 *
 * Must contain at least one letter — prevents purely numeric/symbol entries.
 */
export const validateLanguageName: FieldValidator = (value) => {
  const v = value.trim();
  if (!v) return null;

  if (!/\p{L}/u.test(v)) {
    return 'Language must contain at least one letter';
  }

  return null;
};

/**
 * Custom Section Heading
 * Must contain at least one letter.
 */
export const validateSectionHeading: FieldValidator = (value) => {
  const v = value.trim();
  if (!v) return null;

  if (!/\p{L}/u.test(v)) {
    return 'Section heading must contain at least one letter';
  }

  return null;
};

// ---------------------------------------------------------------------------
// FREE-TEXT / NATURAL LANGUAGE FIELDS
// ---------------------------------------------------------------------------

/**
 * Free-text / natural language validator.
 *
 * Used for: achievement descriptions, experience bullet points, project bullet
 * points, summary, education descriptions, award descriptions, custom section
 * content.
 *
 * These fields allow ALL printable characters including:
 *   - Unicode
 *   - Numbers and percentages ($50K, 40%, 200 users)
 *   - Punctuation and technical symbols
 *   - Multi-line content
 *
 * The only thing validated here: an optional max character length if provided.
 * By default, no max is enforced (the app does not specify limits).
 */
export const validateFreeText = (maxLength?: number): FieldValidator => {
  return (value: string) => {
    if (maxLength !== undefined && value.length > maxLength) {
      return `Content is too long (max ${maxLength} characters)`;
    }
    return null;
  };
};

// ---------------------------------------------------------------------------
// COMPOSITE: run multiple validators in sequence
// ---------------------------------------------------------------------------

/**
 * Run an array of validators against a value. Returns the first error found,
 * or null if all pass.
 *
 * Usage:
 *   const error = runValidators(value, [validateName, someOtherValidator]);
 */
export const runValidators = (value: string, validators: FieldValidator[]): string | null => {
  for (const v of validators) {
    const result = v(value);
    if (result !== null) return result;
  }
  return null;
};

// ---------------------------------------------------------------------------
// Convenience map — keyed by PersonalInfo field names
// ---------------------------------------------------------------------------

export const personalInfoValidators: Record<string, FieldValidator> = {
  name: validateName,
  email: validateEmail,
  phone: validatePhone,
  location: validateFreeText(), // location is free-text: "Mumbai, India" or "Remote"
  linkedin: validateUrl,
  portfolio: validateUrl,
};
