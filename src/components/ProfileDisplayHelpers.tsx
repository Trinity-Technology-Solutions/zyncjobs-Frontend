/**
 * ProfileDisplayHelpers.tsx
 * LinkedIn-style structured display components for candidate profile sections.
 * Used by CandidateDashboardPage to render profile data cleanly.
 */
import React from "react";
import AutocompleteCombobox from "./AutocompleteCombobox";

// ─── Shared helpers ──────────────────────────────────────────────────────────

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const MONTH_OPTIONS = MONTHS;

export const YEAR_OPTIONS: number[] = (() => {
  const cur = new Date().getFullYear();
  const years: number[] = [];
  for (let y = cur + 10; y >= 1950; y--) years.push(y);
  return years;
})();

/** Returns true if value is a non-empty, non-"undefined" string */
const has = (v: any): boolean =>
  v !== null &&
  v !== undefined &&
  String(v).trim() !== "" &&
  String(v) !== "undefined";

/** Safely render a field — returns null if empty/undefined */
export const safeText = (v: any): string | null =>
  has(v) ? String(v).trim() : null;

/**
 * Formats a score field with its unit/label so records never show a bare
 * number: "85" → "85%", "8.5" → "CGPA 8.5", while "85%", "8.5 CGPA", "9/10"
 * are kept as entered.
 */
export const formatScore = (v: any): string | null => {
  const raw = safeText(v);
  if (!raw) return null;
  const t = raw.toLowerCase();
  if (t.includes("%") || t.includes("cgpa") || t.includes("/10") || t.includes("/ 10")) return raw;
  const n = parseFloat(t);
  if (!isNaN(n) && !t.includes("/")) {
    if (n > 10) return `${raw}%`;
    if (n > 0) return `CGPA ${raw}`;
  }
  return raw;
};

// ─── Validation helpers ───────────────────────────────────────────────────────

export const isValidUrl = (v: string): boolean => {
  try {
    new URL(v);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validates a URL field for profile forms.
 * - Empty string is valid (field is optional unless required).
 * - Non-empty values must start with http:// or https:// and be a valid URL.
 * Returns an error string or null.
 */
export const validateUrlField = (
  v: string,
  required = false,
): string | null => {
  const trimmed = v.trim();
  if (!trimmed) return required ? "This field is required." : null;
  try {
    new URL(trimmed);
    return /^https?:\/\//i.test(trimmed) ? null : "Please enter a valid URL";
  } catch {
    return "Please enter a valid URL";
  }
};

export const isValidYear = (v: string | number): boolean => {
  const n = Number(v);
  return Number.isInteger(n) && n >= 1950 && n <= new Date().getFullYear() + 10;
};

export const isValidPercentage = (v: string): boolean => {
  const n = parseFloat(v);
  return !isNaN(n) && n >= 0 && n <= 100;
};

export const isValidCGPA = (v: string): boolean => {
  const n = parseFloat(v);
  return !isNaN(n) && n >= 0 && n <= 10;
};

export const isValidPhone = (v: string): boolean =>
  /^[+]?[\d\s\-().]{7,15}$/.test(v.trim());

/** Validate month+year pair. Returns error string or null. */
export const validateMonthYear = (
  month: string,
  year: string,
  label = "date",
): string | null => {
  if (!month) return `Please select a valid month for ${label}.`;
  if (!year || !isValidYear(year))
    return `Please enter a valid year for ${label} (1950–${new Date().getFullYear() + 10}).`;
  return null;
};

/** Returns error if end is before start */
export const validateDateRange = (
  startMonth: string,
  startYear: string,
  endMonth: string,
  endYear: string,
): string | null => {
  if (!startYear || !endYear) return null;
  const sIdx = MONTHS.indexOf(startMonth);
  const eIdx = MONTHS.indexOf(endMonth);
  const sDate = new Date(Number(startYear), sIdx < 0 ? 0 : sIdx);
  const eDate = new Date(Number(endYear), eIdx < 0 ? 0 : eIdx);
  if (eDate < sDate) return "End date cannot be earlier than start date.";
  return null;
};

// ─── Shared form primitives ───────────────────────────────────────────────────

interface FieldProps {
  error?: string | null;
  required?: boolean;
  label: string;
  children: React.ReactNode;
}
export const FormField: React.FC<FieldProps> = ({
  label,
  required,
  error,
  children,
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1.5">
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
  </div>
);

interface MonthYearProps {
  monthValue: string;
  yearValue: string;
  onMonthChange: (v: string) => void;
  onYearChange: (v: string) => void;
  disabled?: boolean;
  error?: string | null;
}
export const MonthYearPicker: React.FC<MonthYearProps> = ({
  monthValue,
  yearValue,
  onMonthChange,
  onYearChange,
  disabled,
  error,
}) => (
  <div>
    <div className="grid grid-cols-2 gap-3">
      <AutocompleteCombobox
        label="Month"
        value={monthValue}
        onChange={onMonthChange}
        options={[
          { value: '', label: 'Month' },
          ...MONTH_OPTIONS.map((m) => ({ value: m, label: m })),
        ]}
        placeholder="Month"
        disabled={disabled}
      />
      <AutocompleteCombobox
        label="Year"
        value={yearValue}
        onChange={onYearChange}
        options={[
          { value: '', label: 'Year' },
          ...YEAR_OPTIONS.map((y) => ({ value: String(y), label: String(y) })),
        ]}
        placeholder="Year"
        disabled={disabled}
      />
    </div>
    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
  </div>
);

interface YearSelectProps {
  value: string;
  onChange: (v: string) => void;
  error?: string | null;
  placeholder?: string;
  disabled?: boolean;
}
export const YearSelect: React.FC<YearSelectProps> = ({
  value,
  onChange,
  error,
  disabled,
}) => (
  <div>
    <AutocompleteCombobox
      label="Year"
      value={value}
      onChange={onChange}
      options={[
        { value: '', label: 'Select Year' },
        ...YEAR_OPTIONS.map((y) => ({ value: String(y), label: String(y) })),
      ]}
      placeholder="Select Year"
      disabled={disabled}
    />
    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
  </div>
);

interface UrlInputProps {
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  error?: string | null;
  required?: boolean;
}
export const UrlInput: React.FC<UrlInputProps> = ({
  value,
  onChange,
  onBlur,
  placeholder,
  error,
  required,
}) => (
  <div>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      required={required}
      placeholder={placeholder || "https://..."}
      className={`w-full p-3 border rounded-lg text-sm ${error ? "border-red-400 bg-red-50" : "border-gray-300"}`}
    />
    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
  </div>
);

// ─── Display Components ───────────────────────────────────────────────────────

/** Education College card */
export const EducationCollegeDisplay: React.FC<{ data: any }> = ({ data }) => {
  if (!data || typeof data !== "object") return null;
  const degree = safeText(data.degree);
  const college = safeText(data.college);
  if (!degree && !college) return null;

  const isPursuing =
    safeText(data.status) === "Pursuing" ||
    (data.passingYear && Number(data.passingYear) > new Date().getFullYear());

  const year = safeText(data.passingYear || data.graduationYear || data.endYear || data.year);
  const score = formatScore(data.percentage);

  return (
    <div className="flex items-start gap-4">
      <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
        <svg
          className="w-5 h-5 text-blue-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 14l9-5-9-5-9 5 9 5z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
          />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        {degree && (
          <p className="font-semibold text-gray-900 text-sm">{degree}</p>
        )}
        {college && <p className="text-gray-700 text-sm mt-0.5">{college}</p>}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
          {safeText(data.courseType) && (
            <span className="text-xs text-gray-500">{data.courseType}</span>
          )}
          {year && (
            <span className="text-xs text-gray-500">
              {isPursuing
                ? `Expected Graduation ${year}`
                : `Graduation Year ${year}`}
            </span>
          )}
          {score && (
            <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">
              {score}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

/** Class 12 / Class 10 display */
export const SchoolEducationDisplay: React.FC<{ data: any; label: string }> = ({
  data,
  label,
}) => {
  if (!data || typeof data !== "object" || !safeText(data.board)) return null;
  const year = safeText(data.passingYear || data.graduationYear || data.endYear || data.year);
  const score = formatScore(data.percentage);
  return (
    <div className="flex items-start gap-4">
      <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0 mt-0.5">
        <svg
          className="w-5 h-5 text-indigo-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 text-sm">{label}</p>
        <p className="text-gray-700 text-sm mt-0.5">{data.board}</p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
          {safeText(data.medium) && (
            <span className="text-xs text-gray-500">{data.medium} Medium</span>
          )}
          {year && (
            <span className="text-xs text-gray-500">
              Passed {year}
            </span>
          )}
          {score && (
            <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">
              {score}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

/** Employment card */
export const EmploymentDisplay: React.FC<{ emp: any }> = ({ emp }) => {
  if (!emp) return null;
  const company = safeText(emp.companyName);
  const role = safeText(emp.designation);
  if (!company && !role) return null;

  const startStr = [safeText(emp.startMonth), safeText(emp.startYear)]
    .filter(Boolean)
    .join(" ");
  const endStr = emp.currentlyWorking
    ? "Present"
    : [safeText(emp.endMonth), safeText(emp.endYear)].filter(Boolean).join(" ");
  const dateRange =
    startStr || endStr
      ? `${startStr}${startStr && endStr ? " – " : ""}${endStr}`
      : null;

  const expStr = (() => {
    const y = safeText(emp.experienceYears);
    const m = safeText(emp.experienceMonths);
    if (!y && !m) return null;
    const parts = [];
    if (y && y !== "0") parts.push(`${y} yr${y === "1" ? "" : "s"}`);
    if (m && m !== "0") parts.push(`${m} mo`);
    return parts.length ? parts.join(" ") : null;
  })();

  const bullets = safeText(emp.description)
    ? emp.description
        .split("\n")
        .map((l: string) => l.trim())
        .filter(Boolean)
    : [];

  return (
    <div className="flex items-start gap-4">
      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
        <svg
          className="w-5 h-5 text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        {role && <p className="font-semibold text-gray-900 text-sm">{role}</p>}
        {company && <p className="text-gray-700 text-sm mt-0.5">{company}</p>}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
          {dateRange && (
            <span className="text-xs text-gray-500">{dateRange}</span>
          )}
          {expStr && <span className="text-xs text-gray-400">· {expStr}</span>}
          {emp.currentlyWorking && (
            <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">
              Current
            </span>
          )}
        </div>
        {bullets.length > 0 && (
          <ul className="mt-2 space-y-1">
            {bullets.map((b: string, i: number) => (
              <li
                key={i}
                className="flex items-start gap-1.5 text-xs text-gray-600"
              >
                <span className="mt-1.5 w-1 h-1 rounded-full bg-gray-400 flex-shrink-0" />
                <span
                  className="break-words"
                  style={{ overflowWrap: "anywhere" }}
                >
                  {b}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

/** Project card */
export const ProjectDisplay: React.FC<{ proj: any }> = ({ proj }) => {
  if (!proj || !safeText(proj.projectName)) return null;
  return (
    <div className="flex items-start gap-4">
      <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0 mt-0.5">
        <svg
          className="w-5 h-5 text-purple-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
          />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 text-sm">
          {proj.projectName}
        </p>
        {safeText(proj.skills) && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {proj.skills.split(",").map((s: string, i: number) => (
              <span
                key={i}
                className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full"
              >
                {s.trim()}
              </span>
            ))}
          </div>
        )}
        {safeText(proj.description) && (
          <p
            className="text-xs text-gray-600 mt-1.5 break-words leading-relaxed"
            style={{ overflowWrap: "anywhere" }}
          >
            {proj.description}
          </p>
        )}
        {safeText(proj.projectUrl) && (
          <a
            href={proj.projectUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 mt-1.5 break-all"
          >
            <svg
              className="w-3 h-3 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
            {proj.projectUrl}
          </a>
        )}
      </div>
    </div>
  );
};

/** Internship card */
export const InternshipDisplay: React.FC<{ intern: any }> = ({ intern }) => {
  if (!intern || !safeText(intern.companyName)) return null;
  const startStr = [safeText(intern.startMonth), safeText(intern.startYear)]
    .filter(Boolean)
    .join(" ");
  const endStr = [safeText(intern.endMonth), safeText(intern.endYear)]
    .filter(Boolean)
    .join(" ");
  const dateRange =
    startStr || endStr
      ? `${startStr}${startStr && endStr ? " – " : ""}${endStr}`
      : null;

  return (
    <div className="flex items-start gap-4">
      <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0 mt-0.5">
        <svg
          className="w-5 h-5 text-orange-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 text-sm">
          {intern.companyName}
        </p>
        {dateRange && (
          <p className="text-xs text-gray-500 mt-0.5">{dateRange}</p>
        )}
        {safeText(intern.skills) && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {intern.skills.split(",").map((s: string, i: number) => (
              <span
                key={i}
                className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full"
              >
                {s.trim()}
              </span>
            ))}
          </div>
        )}
        {safeText(intern.description) && (
          <p
            className="text-xs text-gray-600 mt-1.5 break-words leading-relaxed"
            style={{ overflowWrap: "anywhere" }}
          >
            {intern.description}
          </p>
        )}
      </div>
    </div>
  );
};

/** Certification card */
export const CertificationDisplay: React.FC<{ cert: any }> = ({ cert }) => {
  if (!cert || !safeText(cert.certificationName)) return null;
  const startStr = [safeText(cert.startMonth), safeText(cert.startYear)]
    .filter(Boolean)
    .join(" ");
  const endStr = cert.noExpiry
    ? "No Expiry"
    : [safeText(cert.endMonth), safeText(cert.endYear)]
        .filter(Boolean)
        .join(" ");
  const validity =
    startStr || endStr
      ? `${startStr}${startStr && endStr ? " – " : ""}${endStr}`
      : null;

  return (
    <div className="flex items-start gap-4">
      <div className="w-10 h-10 rounded-lg bg-yellow-50 flex items-center justify-center flex-shrink-0 mt-0.5">
        <svg
          className="w-5 h-5 text-yellow-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
          />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 text-sm">
          {cert.certificationName}
        </p>
        {validity && <p className="text-xs text-gray-500 mt-0.5">{validity}</p>}
        {safeText(cert.completionId) && (
          <p className="text-xs text-gray-500 mt-0.5">
            ID: {cert.completionId}
          </p>
        )}
        {safeText(cert.certificationUrl) && (
          <a
            href={cert.certificationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 mt-1 break-all"
          >
            <svg
              className="w-3 h-3 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
            View Certificate
          </a>
        )}
      </div>
    </div>
  );
};

/** Skills pills */
export const SkillsDisplay: React.FC<{ skills: any[] }> = ({ skills }) => {
  if (!Array.isArray(skills) || skills.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {skills.map((skill: any, i: number) => {
        const label =
          typeof skill === "string" ? skill : skill?.skill || String(skill);
        if (!label.trim()) return null;
        return (
          <span
            key={i}
            className="px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded-full border border-gray-200 hover:bg-gray-200 transition-colors"
          >
            {label}
          </span>
        );
      })}
    </div>
  );
};

/** Languages display */
export const LanguagesDisplay: React.FC<{ languages: any }> = ({
  languages,
}) => {
  const list: string[] = Array.isArray(languages)
    ? languages
    : typeof languages === "string"
      ? languages
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean)
      : [];
  if (list.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {list.map((lang, i) => (
        <span
          key={i}
          className="px-3 py-1 bg-blue-50 text-blue-800 text-sm rounded-full border border-blue-100"
        >
          {lang}
        </span>
      ))}
    </div>
  );
};

/** Career preferences display */
export const CareerPreferencesDisplay: React.FC<{ prefs: any }> = ({
  prefs,
}) => {
  if (!prefs) return null;
  const lookingFor: string[] = Array.isArray(prefs.lookingFor)
    ? prefs.lookingFor
    : [];
  const locations: string[] = Array.isArray(prefs.locations)
    ? prefs.locations
    : prefs.location
      ? [prefs.location]
      : [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
          Preferred Job Type
        </p>
        {lookingFor.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {lookingFor.map((t, i) => (
              <span
                key={i}
                className="px-3 py-1 bg-blue-50 text-blue-800 text-sm rounded-full border border-blue-100"
              >
                {t}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 italic">Not specified</p>
        )}
      </div>
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
          Availability
        </p>
        {safeText(prefs.availability) ? (
          <p className="text-sm text-gray-800">{prefs.availability}</p>
        ) : (
          <p className="text-sm text-gray-400 italic">Not specified</p>
        )}
      </div>
      {locations.length > 0 && (
        <div className="md:col-span-2">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Preferred Locations
          </p>
          <div className="flex flex-wrap gap-2">
            {locations.map((loc, i) => (
              <span
                key={i}
                className="px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded-full"
              >
                {loc}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
