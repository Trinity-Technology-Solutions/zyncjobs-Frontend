import { useState, useEffect, useRef, useCallback, useMemo } from "react";

// -- Theme: matches ZyncJobs employer dashboard (blue-900 sidebar) -------------
const BRAND = "#1e40af";
const BRAND_DARK = "#1e3a8a";
const BRAND_RED = "#dc2626";

// -- Static fallback data (shown when API has no data yet) ---------------------
const SAMPLE_RECRUITERS = [
  { id: 1, name: "Arun Kumar", initials: "AK", email: "arun@company.com", role: "Senior Recruiter", jobs: 40, apps: 600, interviews: 50, hires: 8, contacted: 520, offers: 10, responseRate: 81, joined: 8, avgDays: 12, color: "#7c3aed" },
  { id: 2, name: "Kumar Raj", initials: "KR", email: "kumar@company.com", role: "Recruiter", jobs: 25, apps: 450, interviews: 35, hires: 5, contacted: 420, offers: 8, responseRate: 72, joined: 5, avgDays: 15, color: "#0891b2" },
  { id: 3, name: "Priya Singh", initials: "PS", email: "priya@company.com", role: "Recruiter", jobs: 15, apps: 200, interviews: 12, hires: 2, contacted: 180, offers: 3, responseRate: 58, joined: 2, avgDays: 22, color: "#059669" },
  { id: 4, name: "Deepa Nair", initials: "DN", email: "deepa@company.com", role: "Team Lead", jobs: 30, apps: 380, interviews: 28, hires: 6, contacted: 340, offers: 7, responseRate: 75, joined: 6, avgDays: 11, color: "#d97706" },
  { id: 5, name: "Rahul Sharma", initials: "RS", email: "rahul@company.com", role: "Recruiter", jobs: 20, apps: 290, interviews: 18, hires: 3, contacted: 260, offers: 4, responseRate: 64, joined: 3, avgDays: 18, color: "#db2777" },
];

const SAMPLE_ACTIVITY = [
  { id: 1, time: "10:05 AM", user: "Kumar Raj", action: "posted job", detail: "Java Developer - Bangalore", type: "job", icon: "briefcase" },
  { id: 2, time: "10:12 AM", user: "Priya Singh", action: "shortlisted", detail: "Ravi Kumar - Shortlisted", type: "status", icon: "check" },
  { id: 3, time: "10:20 AM", user: "Arun Kumar", action: "scheduled interview", detail: "Meena Iyer - 2 PM today", type: "interview", icon: "calendar" },
  { id: 4, time: "11:00 AM", user: "Kumar Raj", action: "rejected candidate", detail: "Suresh Babu - Skills mismatch", type: "reject", icon: "x" },
  { id: 5, time: "11:30 AM", user: "Deepa Nair", action: "assigned candidate", detail: "5 candidates to Priya Singh", type: "assign", icon: "arrow" },
  { id: 6, time: "12:05 PM", user: "Arun Kumar", action: "released offer", detail: "Senior React Dev - 18 LPA", type: "offer", icon: "gift" },
  { id: 7, time: "01:15 PM", user: "Rahul Sharma", action: "added note", detail: "Candidate callback scheduled", type: "note", icon: "note" },
  { id: 8, time: "02:00 PM", user: "Priya Singh", action: "moved to Interview 2", detail: "Kiran Patel - Technical round", type: "status", icon: "arrow" },
  { id: 9, time: "03:30 PM", user: "Kumar Raj", action: "posted job", detail: "DevOps Engineer - Remote", type: "job", icon: "briefcase" },
  { id: 10, time: "04:00 PM", user: "Deepa Nair", action: "approved candidate", detail: "Anjali Verma - Final approval", type: "approve", icon: "check" },
];

const SAMPLE_AUDIT = [
  { user: "Kumar Raj", action: "Deleted Job Posting", module: "Jobs", entity: "PHP Developer - Chennai", ip: "103.21.xx.xx", date: "09 Jun 2026, 10:05 AM" },
  { user: "Priya Singh", action: "Changed Candidate Status", module: "Pipeline", entity: "Ravi Kumar - Rejected", ip: "115.99.xx.xx", date: "09 Jun 2026, 10:12 AM" },
  { user: "Arun Kumar", action: "Exported Candidate Data", module: "Reports", entity: "Java Developer Applications", ip: "49.36.xx.xx", date: "09 Jun 2026, 11:20 AM" },
  { user: "Admin", action: "Role Changed", module: "Team", entity: "Deepa Nair - Team Lead", ip: "202.83.xx.xx", date: "08 Jun 2026, 03:00 PM" },
  { user: "Rahul Sharma", action: "Mass Email Sent", module: "Candidates", entity: "50 candidates notified", ip: "103.21.xx.xx", date: "08 Jun 2026, 05:00 PM" },
];

const SAMPLE_PIPELINE: Record<string, { name: string; job: string; days: number; recruiter: string }[]> = {
  "Applied": [{ name: "Sanjay M", job: "Java Developer", days: 1, recruiter: "Kumar Raj" }, { name: "Lakshmi R", job: "React Developer", days: 2, recruiter: "Arun Kumar" }, { name: "Vikram P", job: "Data Analyst", days: 1, recruiter: "Priya Singh" }],
  "Screening": [{ name: "Meena K", job: "Python Dev", days: 3, recruiter: "Arun Kumar" }, { name: "Suresh B", job: "Java Developer", days: 2, recruiter: "Kumar Raj" }],
  "Shortlisted": [{ name: "Ravi Kumar", job: "Java Developer", days: 4, recruiter: "Priya Singh" }, { name: "Anjali V", job: "UX Designer", days: 3, recruiter: "Deepa Nair" }],
  "Interview 1": [{ name: "Kiran P", job: "DevOps Eng", days: 5, recruiter: "Arun Kumar" }],
  "Interview 2": [{ name: "Meena I", job: "Senior React Dev", days: 7, recruiter: "Arun Kumar" }],
  "Selected": [{ name: "Arjun T", job: "Node.js Dev", days: 12, recruiter: "Kumar Raj" }],
  "Offer": [{ name: "Sneha R", job: "Senior React Dev", days: 14, recruiter: "Arun Kumar" }],
  "Joined": [{ name: "Pradeep N", job: "Java Developer", days: 18, recruiter: "Deepa Nair" }],
};

const SAMPLE_SLA = [
  { candidate: "Sanjay M", job: "Java Developer", stage: "Applied", days: 4, recruiter: "Kumar Raj", severity: "critical" },
  { candidate: "Preethi R", job: "QA Engineer", stage: "Screening", days: 3, recruiter: "Priya Singh", severity: "warning" },
  { candidate: "Ganesh K", job: "Data Analyst", stage: "Applied", days: 5, recruiter: "Rahul Sharma", severity: "critical" },
];

const FOLLOW_UP = [
  { date: "05 Jun", action: "Called Candidate", note: "No response, left voicemail", type: "call" },
  { date: "06 Jun", action: "Candidate Interested", note: "Confirmed availability for interview", type: "positive" },
  { date: "07 Jun", action: "Interview Scheduled", note: "Technical round - 10 AM via Google Meet", type: "schedule" },
  { date: "08 Jun", action: "Interview Completed", note: "Good performance, proceeding to HR round", type: "done" },
  { date: "09 Jun", action: "Offer Discussion", note: "Candidate expects Rs.16 LPA, budget is Rs.15 LPA", type: "pending" },
];

const STAGE_COLORS: Record<string, string> = {
  "Applied": "#6366f1", "Screening": "#0891b2", "Shortlisted": "#f59e0b",
  "Interview 1": "#8b5cf6", "Interview 2": "#ec4899", "Selected": "#10b981",
  "Offer": "#f97316", "Joined": "#16a34a",
};

const TABS = [
  { key: "jobs", label: "Overview", icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg> },
  { key: "performance", label: "Performance", icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg> },
];

// -- Job Postings type --------------------------------------------------------
interface JobPosting {
  id: string;
  title: string;
  company: string;
  location: string;
  status: string;
  recruiterManager: string;
  postedBy: string;
  assignedTo: string;
  recruiterRole: string;
  posted: string;
  applications: number;
  interviewScheduled: number;
  interviewCompleted: number;
  hired: number;
  rejected: number;
}

// -- Shared sub-components -----------------------------------------------------
function ColumnFilterPopup({ label, allValues, allRecruiterData, selected, onApply, onClose }: {
  label: string;
  allValues: string[];
  allRecruiterData?: { name: string; email: string }[];
  selected: string[];
  onApply: (vals: string[]) => void;
  onClose: () => void;
}) {
  const [searchMode, setSearchMode] = useState<"name" | "email">("name");
  const [search, setSearch] = useState("");
  const [checked, setChecked] = useState<string[]>(selected);

  const getEmail = (name: string) =>
    allRecruiterData?.find(r => r.name === name)?.email ?? "";

  const filtered = allValues.filter(v => {
    if (label === "Job Status") return true;
    const q = search.toLowerCase();
    if (!q) return true;
    if (searchMode === "name") return v.toLowerCase().includes(q);
    return getEmail(v).toLowerCase().includes(q);
  });

  const allChecked = filtered.length > 0 && filtered.every(v => checked.includes(v));
  const toggle = (v: string) => setChecked(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]);
  const toggleAll = () => setChecked(allChecked ? checked.filter(v => !filtered.includes(v)) : [...new Set([...checked, ...filtered])]);

  return (
    <div
      style={{
        position: "absolute", top: "calc(100% + 2px)", left: 0, zIndex: 9999,
        background: "#fff", border: "1px solid #c7d7f0", borderRadius: 8,
        boxShadow: "0 8px 24px rgba(30,64,175,0.15)", width: 360,
      }}
      onClick={e => e.stopPropagation()}
    >
      {/* Header */}
      <div style={{
        padding: "12px 14px 10px",
        borderBottom: "1px solid #e2e8f0",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={BRAND} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>Filter: {label}</span>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", lineHeight: 1, padding: 2, borderRadius: 4, display: "flex" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>
      </div>

      {/* Search mode toggle */}
      {label !== "Job Status" && (
        <div style={{ padding: "10px 14px 6px", display: "flex", gap: 6 }}>
          <button onClick={() => { setSearchMode("name"); setSearch(""); }} style={{
            flex: 1, padding: "6px 8px", fontSize: 12, fontWeight: 600,
            border: `1.5px solid ${searchMode === "name" ? BRAND : "#e2e8f0"}`,
            borderRadius: 6, cursor: "pointer",
            background: searchMode === "name" ? BRAND + "12" : "#f8fafc",
            color: searchMode === "name" ? BRAND : "#64748b",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            transition: "all 0.15s",
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            By Name
          </button>
          <button onClick={() => { setSearchMode("email"); setSearch(""); }} style={{
            flex: 1, padding: "6px 8px", fontSize: 12, fontWeight: 600,
            border: `1.5px solid ${searchMode === "email" ? BRAND : "#e2e8f0"}`,
            borderRadius: 6, cursor: "pointer",
            background: searchMode === "email" ? BRAND + "12" : "#f8fafc",
            color: searchMode === "email" ? BRAND : "#64748b",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            transition: "all 0.15s",
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
            By Email
          </button>
        </div>
      )}

      {/* Search input */}
      {label !== "Job Status" && (
        <div style={{ padding: "4px 14px 8px" }}>
          <div style={{
            border: `1.5px solid ${search ? BRAND : "#e2e8f0"}`,
            borderRadius: 6,
            display: "flex", alignItems: "center", background: "#fff",
            transition: "border-color 0.15s",
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 8px", flexShrink: 0 }}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={searchMode === "name" ? `Search by name…` : `Search by email…`}
              style={{ flex: 1, border: "none", outline: "none", padding: "7px 0", fontSize: 13, color: "#374151", background: "transparent" }}
              autoFocus
            />
            {search && (
              <button onClick={() => setSearch("")} style={{ border: "none", background: "none", cursor: "pointer", color: "#94a3b8", padding: "0 8px", display: "flex" }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Checkbox list */}
      <div style={{
        margin: "0 14px",
        border: "1px solid #e2e8f0", borderRadius: 6,
        maxHeight: 220, overflowY: "auto",
        background: "#fff",
      }}>
        {/* Select all */}
        <label style={{
          display: "flex", alignItems: "center", gap: 8, padding: "8px 10px",
          cursor: "pointer", fontSize: 12, color: BRAND, fontWeight: 700,
          borderBottom: "1px solid #f1f5f9", background: "#f8fbff",
        }}>
          <input type="checkbox" checked={allChecked} onChange={toggleAll}
            style={{ accentColor: BRAND, cursor: "pointer", width: 14, height: 14, flexShrink: 0 }} />
          [Select all] {filtered.length > 0 && <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 400 }}>({filtered.length})</span>}
        </label>

        {filtered.map((v, idx) => (
          <label key={v} style={{
            display: "flex", alignItems: "center", gap: 8, padding: "7px 10px",
            cursor: "pointer",
            background: checked.includes(v) ? "#eff6ff" : idx % 2 === 0 ? "#fff" : "#fafafa",
            borderBottom: "1px solid #f1f5f9",
          }}>
            <input type="checkbox" checked={checked.includes(v)} onChange={() => toggle(v)}
              style={{ accentColor: BRAND, cursor: "pointer", width: 14, height: 14, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: checked.includes(v) ? BRAND : "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v}</div>
              {allRecruiterData && (
                <div style={{ fontSize: 11, color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{getEmail(v)}</div>
              )}
            </div>
          </label>
        ))}

        {filtered.length === 0 && (
          <div style={{ padding: "18px 10px", fontSize: 12, color: "#94a3b8", textAlign: "center" }}>
            No results for &quot;{search}&quot;
          </div>
        )}
      </div>

      {/* Active filters summary */}
      {checked.length > 0 && (
        <div style={{ padding: "6px 14px 0", display: "flex", flexWrap: "wrap", gap: 4 }}>
          {checked.map(v => (
            <span key={v} style={{
              background: BRAND + "15", color: BRAND, fontSize: 11, fontWeight: 600,
              padding: "2px 8px", borderRadius: 99, border: `1px solid ${BRAND}30`,
              display: "flex", alignItems: "center", gap: 4,
            }}>
              {v}
              <button onClick={() => toggle(v)} style={{ background: "none", border: "none", cursor: "pointer", color: BRAND, padding: 0, lineHeight: 1, display: "flex" }}>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderTop: "1px solid #e2e8f0", marginTop: 10 }}>
        <button
          onClick={() => onApply(checked)}
          style={{
            background: `linear-gradient(135deg, ${BRAND_DARK} 0%, #2563eb 100%)`,
            color: "#fff", border: "none", borderRadius: 6,
            padding: "7px 22px", fontSize: 13, fontWeight: 700, cursor: "pointer",
            boxShadow: "0 2px 6px rgba(30,64,175,0.25)",
          }}>Apply</button>
        <button
          onClick={() => { setChecked([]); onApply([]); }}
          style={{
            background: "#fff", color: "#374151", border: "1px solid #d1d5db",
            borderRadius: 6, padding: "7px 16px", fontSize: 13, cursor: "pointer",
          }}>Reset</button>
        <button
          onClick={onClose}
          style={{ background: "transparent", color: "#64748b", border: "none", fontSize: 13, cursor: "pointer", marginLeft: "auto" }}
        >Cancel</button>
      </div>
    </div>
  );
}
function Avatar({ initials, color, size = 36 }: { initials: string; color: string; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: color + "20", border: `2px solid ${color}40`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.35, fontWeight: 600, color, flexShrink: 0, letterSpacing: "0.5px",
    }}>{initials}</div>
  );
}

function StatCard({ label, value, sub, color, icon }: any) {
  return (
    <div style={{
      background: "#fff",
      borderRadius: 12,
      padding: "14px 16px",
      display: "flex",
      flexDirection: "column",
      gap: 3,
      borderTop: `3px solid ${color || BRAND}`,
      boxShadow: "0 1px 6px rgba(30,64,175,0.06)",
      border: "1px solid #e8f0fe",
      borderTopColor: color || BRAND,
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8,
        background: (color || BRAND) + "15",
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 2,
      }}>
        {icon}
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", lineHeight: 1.1, letterSpacing: "-0.5px" }}>{value}</div>
      <div style={{ fontSize: 12, color: "#374151", fontWeight: 600 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: color || BRAND, fontWeight: 600 }}>{sub}</div>}
    </div>
  );
}

// SVG icon components for StatCards
const IconUsers = ({ color }: { color: string }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const IconBriefcase = ({ color }: { color: string }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
);
const IconInbox = ({ color }: { color: string }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
    <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
  </svg>
);
const IconCalendar = ({ color }: { color: string }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);
const IconGift = ({ color }: { color: string }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 12 20 22 4 22 4 12" />
    <rect x="2" y="7" width="20" height="5" />
    <line x1="12" y1="22" x2="12" y2="7" />
    <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
    <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
  </svg>
);
const IconCheckCircle = ({ color }: { color: string }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

function KPIBar({ value, max = 100, color }: { value: number; max?: number; color: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: "#f1f5f9", borderRadius: 99, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 99, transition: "width 0.6s ease" }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color, minWidth: 36, textAlign: "right" }}>{value}</span>
    </div>
  );
}

function Badge({ text, color = BRAND }: { text: string; color?: string }) {
  return (
    <span style={{
      background: color + "15", color, fontSize: 11, fontWeight: 600,
      padding: "2px 8px", borderRadius: 99, border: `1px solid ${color}30`,
    }}>{text}</span>
  );
}

// -- Main component ------------------------------------------------------------
interface ATSDashboardProps { onNavigate?: (page: string) => void }

const PER_PAGE_OPTIONS = [10, 25, 50];

export default function ATSDashboard({ onNavigate }: ATSDashboardProps) {
  const [activeTab, setActiveTab] = useState("jobs");
  const [selectedRecruiter, setSelectedRecruiter] = useState<number | null>(null);

  // Jobs grid state
  const [apiJobs, setApiJobs] = useState<JobPosting[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobSearch, setJobSearch] = useState("");
  const [jobStatusFilter, setJobStatusFilter] = useState("Active");
  const [apiTotalApps, setApiTotalApps] = useState<number | null>(null);
  const [apiTotalInts, setApiTotalInts] = useState<number | null>(null);
  const [apiTotalHires, setApiTotalHires] = useState<number | null>(null);
  const [apiTotalRejected, setApiTotalRejected] = useState<number | null>(null);
  const [jobPage, setJobPage] = useState(1);
  const [jobPerPage, setJobPerPage] = useState(25);
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [sortCol, setSortCol] = useState("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  // Column filter state
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  const [filterRecruiterMgr, setFilterRecruiterMgr] = useState<string[]>([]);
  const [filterPostedBy, setFilterPostedBy] = useState<string[]>([]);
  const [filterAssignedTo, setFilterAssignedTo] = useState<string[]>([]);
  const [filterJobStatus, setFilterJobStatus] = useState<string[]>(["Active"]);

  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<any>(null);

  const liveRecruiters = useMemo(() => {
    const stored = localStorage.getItem('user');
    const user = stored ? JSON.parse(stored) : null;
    const map: Record<string, any> = {};
    
    // Fallback: If no jobs fetched yet but we have user data, show them with 0
    if (user?.name || user?.fullName) {
      const name = user.name || user.fullName;
      map[name] = {
        id: name,
        name: name,
        email: user.email || '',
        initials: name.substring(0, 2).toUpperCase(),
        role: user.role || user.userType || 'Recruiter',
        color: BRAND,
        jobs: 0,
        apps: 0,
        interviews: 0,
        offers: 0,
        hires: 0,
        avgDays: 0,
        responseRate: 0
      };
    }

    if (apiJobs && apiJobs.length > 0) {
      apiJobs.forEach(j => {
        // Fallback to logged-in user email if missing, so all jobs tied to the logged-in user merge into 1 card
        const email = (j.postedBy || user?.email || 'unknown@example.com').toLowerCase();
        const rName = j.recruiterManager || user?.name || user?.fullName || email.split('@')[0];
        if (!map[email]) {
          const colors = ["#8b5cf6", "#0891b2", "#10b981", "#f59e0b", "#ec4899", "#f43f5e", "#6366f1"];
          const color = colors[Object.keys(map).length % colors.length];
          map[email] = {
            id: email, // use email as unique id
            name: rName,
            email: email,
            initials: rName.substring(0, 2).toUpperCase(),
            role: j.recruiterRole || 'Recruiter',
            color: color,
            jobs: 0,
            apps: 0,
            interviews: 0,
            offers: 0,
            hires: 0,
            avgDays: 0,
            responseRate: 85
          };
        }
        
        map[email].jobs += 1;
        map[email].apps += j.applications || 0;
        map[email].interviews += (j.interviewScheduled || 0) + (j.interviewCompleted || 0);
        map[email].hires += j.hired || 0;
      });
    }
    
    return Object.values(map);
  }, [apiJobs]);

  // Fetch jobs for the logged-in employer from backend
  const fetchJobs = useCallback(async () => {
    try {
      setJobsLoading(true);
      const stored = localStorage.getItem('user');
      if (!stored) return;
      const user = JSON.parse(stored);
      const ownerEmail = user.ownerEmail || user.employerOwnerId || user.email || '';
      const companyName = user.companyName || user.company || user.organizationName || '';
      if (!ownerEmail) return;

      const API_BASE = (import.meta as any).env?.VITE_API_URL || '/api';
      const res = await fetch(`${API_BASE}/jobs/employer/email/${encodeURIComponent(ownerEmail)}`);
      if (!res.ok) return;

      const headerApps = res.headers.get('x-total-applications');
      const headerInts = res.headers.get('x-total-interviews');
      const headerHired = res.headers.get('x-total-hired');
      const headerRejected = res.headers.get('x-total-rejected');

      if (headerApps !== null) setApiTotalApps(Number(headerApps));
      if (headerInts !== null) setApiTotalInts(Number(headerInts));
      if (headerHired !== null) setApiTotalHires(Number(headerHired));
      if (headerRejected !== null) setApiTotalRejected(Number(headerRejected));

      const data = await res.json();
      const jobs: any[] = Array.isArray(data) ? data : [];

      let assignedAppsCount = 0;
      let assignedIntsCount = 0;
      let assignedHiresCount = 0;
      let assignedRejectedCount = 0;

      const mapped: JobPosting[] = jobs.map((j: any) => {
        const postedDate = j.createdAt ? new Date(j.createdAt) : null;
        const formatted = postedDate
          ? `${String(postedDate.getMonth() + 1).padStart(2, '0')}/${String(postedDate.getDate()).padStart(2, '0')}/${String(postedDate.getFullYear()).slice(-2)}`
          : '';
        let jobStatus = 'Active';
        if (j.status === 'closed' || (j.status !== 'hold' && j.isActive === false)) jobStatus = 'Closed';
        else if (j.status === 'hold' || j.status === 'on_hold' || j.status === 'on-hold') jobStatus = 'Hold';
        else jobStatus = 'Active';
        
        const apps = j.applicationCount || j.applicationsCount || 0;
        const ints = (j.interviewScheduled || 0) + (j.interviewCompleted || 0);
        const hires = j.hired || 0;
        const rejected = j.rejected || 0;

        assignedAppsCount += apps;
        assignedIntsCount += ints;
        assignedHiresCount += hires;
        assignedRejectedCount += rejected;

        return {
          id: j.jobCode || j.positionId || '',
          title: j.jobTitle || j.title || '',
          company: j.company || j.companyName || companyName || '',
          location: j.location || j.jobLocation || '',
          status: jobStatus,
          recruiterManager: user.name || user.fullName || '',
          postedBy: j.postedBy || j.employerEmail || '',
          assignedTo: j.assignedTo || 'N/A',
          recruiterRole: user.role || 'Recruiter',
          posted: formatted,
          applications: apps,
          interviewScheduled: j.interviewScheduled || 0,
          interviewCompleted: j.interviewCompleted || 0,
          hired: hires,
          rejected: rejected,
        };
      });

      setApiJobs(mapped);
    } catch (e) {
      console.error('ATSDashboard jobs fetch error:', e);
    } finally {
      setJobsLoading(false);
    }
  }, []);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  useEffect(() => {
    if (activeTab !== "performance" || !chartRef.current) return;

    const buildChart = () => {
      const C = (window as any).Chart;
      if (!C) return;
      if (chartInstanceRef.current) chartInstanceRef.current.destroy();

      const data = selectedRecruiter !== null
        ? liveRecruiters.filter(r => r.id === selectedRecruiter)
        : liveRecruiters;

      chartInstanceRef.current = new C(chartRef.current, {
        type: "bar",
        data: {
          labels: data.map(r => r.name.split(" ")[0]),
          datasets: [
            { label: "Applications", data: data.map(r => r.apps), backgroundColor: data.map(r => r.color + "30"), borderColor: data.map(r => r.color), borderWidth: 2 },
            { label: "Interviews", data: data.map(r => r.interviews), backgroundColor: "#0891b230", borderColor: "#0891b2", borderWidth: 2 },
            { label: "Jobs Posted", data: data.map(r => r.jobs), backgroundColor: "#f59e0b30", borderColor: "#f59e0b", borderWidth: 2 },
            { label: "Hires", data: data.map(r => r.hires), backgroundColor: "#05966930", borderColor: "#059669", borderWidth: 2 },
          ],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: { display: true, position: "top", labels: { boxWidth: 12, font: { size: 11 } } },
            tooltip: { mode: "index", intersect: false },
          },
          scales: {
            x: { grid: { display: false } },
            y: { grid: { color: "#f1f5f9" }, beginAtZero: true },
          },
        },
      });
    };

    if ((window as any).Chart) { buildChart(); }
    else {
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js";
      s.onload = buildChart;
      document.head.appendChild(s);
    }
    return () => { if (chartInstanceRef.current) { chartInstanceRef.current.destroy(); chartInstanceRef.current = null; } };
  }, [activeTab, selectedRecruiter]);

  // Live stats from API data
  const hasLiveJobs = apiJobs.length > 0;
  const totalJobs = hasLiveJobs ? apiJobs.length : liveRecruiters.reduce((acc, r) => acc + r.jobs, 0);
  const totalApps = (apiTotalApps !== null) ? apiTotalApps : (hasLiveJobs ? apiJobs.reduce((acc, j) => acc + j.applications, 0) : liveRecruiters.reduce((acc, r) => acc + r.apps, 0));
  const totalInterviews = (apiTotalInts !== null) ? apiTotalInts : (hasLiveJobs ? apiJobs.reduce((acc, j) => acc + j.interviewScheduled + j.interviewCompleted, 0) : liveRecruiters.reduce((acc, r) => acc + r.interviews, 0));
  const totalOffers = liveRecruiters.reduce((acc, r) => acc + r.offers, 0); // No offers data in jobs API yet
  const totalHires = (apiTotalHires !== null) ? apiTotalHires : (hasLiveJobs ? apiJobs.reduce((acc, j) => acc + j.hired, 0) : liveRecruiters.reduce((acc, r) => acc + r.hires, 0));
  const totalRejected = (apiTotalRejected !== null) ? apiTotalRejected : (hasLiveJobs ? apiJobs.reduce((acc, j) => acc + j.rejected, 0) : 0);

  return (
    <div style={{ fontFamily: "'IBM Plex Sans', 'Inter', -apple-system, sans-serif", background: "#f8fafc", minHeight: "100vh" }}>

      {/* -- Header -- */}
      <div style={{ background: `linear-gradient(135deg, ${BRAND_DARK} 0%, #1d4ed8 60%, #2563eb 100%)`, padding: "20px 28px 0", color: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {onNavigate && (
              <button
                onClick={() => onNavigate("dashboard")}
                style={{
                  width: 40, height: 40, borderRadius: "50%",
                  background: "rgba(255,255,255,0.18)", border: "1.5px solid rgba(255,255,255,0.35)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", flexShrink: 0,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
            )}
            <div style={{
              width: 42, height: 42, borderRadius: 12,
              background: "rgba(255,255,255,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.5px" }}>Recruiter Analytics</div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>ZyncJobs ATS &mdash; Team Management Dashboard</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
              {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
            </div>
            <div style={{ background: BRAND_RED, borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M6 20v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" /><polyline points="16 3 18 5 22 1" /></svg>
              Admin View
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 2, overflowX: "auto" }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
              background: activeTab === t.key ? "#fff" : "transparent",
              color: activeTab === t.key ? BRAND_DARK : "rgba(255,255,255,0.75)",
              border: "none", padding: "10px 16px", borderRadius: "8px 8px 0 0", cursor: "pointer",
              fontSize: 13, fontWeight: activeTab === t.key ? 700 : 500, whiteSpace: "nowrap",
              transition: "all 0.2s",
              display: "flex", alignItems: "center", gap: 6
            }}>
              <span style={{ color: activeTab === t.key ? BRAND_DARK : "rgba(255,255,255,0.8)" }}>{t.icon}</span>
              <span style={{ color: activeTab === t.key ? BRAND_DARK : "rgba(255,255,255,0.8)" }}>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: "16px 28px" }}>

        {/* ---------------- OVERVIEW ---------------- */}
        {activeTab === "overview" && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>Company Analytics Dashboard</div>
              <div style={{ fontSize: 13, color: "#64748b" }}>Full pipeline visibility  all {liveRecruiters.length} recruiters tracked in real time</div>
            </div>

            {/* Stats grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14, marginBottom: 24 }}>
              <StatCard label="Total Recruiters" value={liveRecruiters.length} icon={<IconUsers color="#7c3aed" />} color="#7c3aed" sub="Active team" />
              <StatCard label="Jobs Posted" value={totalJobs} icon={<IconBriefcase color="#0891b2" />} color="#0891b2" sub="This month" />
              <StatCard label="Applications" value={totalApps.toLocaleString()} icon={<IconInbox color="#6366f1" />} color="#6366f1" sub="+12% vs last month" />
              <StatCard label="Interviews" value={totalInterviews} icon={<IconCalendar color="#f59e0b" />} color="#f59e0b" sub="Scheduled" />
              <StatCard label="Offers Released" value={totalOffers} icon={<IconGift color="#059669" />} color="#059669" sub="Pending acceptance" />
              <StatCard label="Total Hires" value={totalHires} icon={<IconCheckCircle color={BRAND} />} color={BRAND} sub="Confirmed joins" />
            </div>

            {/* Leaderboard + Pipeline summary */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
              {/* Leaderboard */}
              <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", overflow: "hidden" }}>
                <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>Recruiter Leaderboard</div>
                  <Badge text="Top Performers" color="#f59e0b" />
                </div>
                <div style={{ padding: "12px 20px" }}>
                  {[...liveRecruiters].sort((a, b) => b.hires - a.hires).map((r, i) => (
                    <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < liveRecruiters.length - 1 ? "1px solid #f8fafc" : "none" }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: "50%",
                        background: i === 0 ? "#fef3c7" : i === 1 ? "#f1f5f9" : "#fdf4ff",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 14, fontWeight: 800,
                        color: i === 0 ? "#d97706" : i === 1 ? "#64748b" : "#9333ea",
                      }}>
                        {i === 0 ? "1st" : i === 1 ? "2nd" : i === 2 ? "3rd" : `#${i + 1}`}
                      </div>
                      <Avatar initials={r.initials} color={r.color} size={32} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{r.name}</div>
                        <div style={{ fontSize: 11, color: "#94a3b8" }}>{r.role}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 16, fontWeight: 800, color: BRAND }}>{r.hires}</div>
                        <div style={{ fontSize: 10, color: "#94a3b8" }}>hires</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#059669" }}>{r.responseRate}%</div>
                        <div style={{ fontSize: 10, color: "#94a3b8" }}>response</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pipeline Summary */}
              <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", overflow: "hidden" }}>
                <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9" }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>Pipeline Summary</div>
                </div>
                <div style={{ padding: "12px 20px" }}>
                  {Object.entries(SAMPLE_PIPELINE).map(([stage, candidates]) => (
                    <div key={stage} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0" }}>
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: STAGE_COLORS[stage], flexShrink: 0 }} />
                      <div style={{ fontSize: 13, color: "#374151", flex: 1 }}>{stage}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 2 }}>
                        <div style={{ flex: 1, height: 6, background: "#f1f5f9", borderRadius: 99 }}>
                          <div style={{ width: `${Math.min(100, candidates.length * 30)}%`, height: "100%", background: STAGE_COLORS[stage], borderRadius: 99 }} />
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", minWidth: 20 }}>{candidates.length}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* SLA Alert banner */}
            {SAMPLE_SLA.length > 0 && (
              <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 12, padding: "14px 20px", display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 20 }}>&#9888;</span>
                <div>
                  <div style={{ fontWeight: 700, color: "#c2410c", fontSize: 14 }}>SLA Alert  {SAMPLE_SLA.length} candidates waiting &gt;3 days with no action</div>
                  <div style={{ fontSize: 12, color: "#92400e" }}>{SAMPLE_SLA.map(b => `${b.candidate} (${b.recruiter})`).join("  ")}</div>
                </div>
                <button onClick={() => setActiveTab("sla")} style={{ marginLeft: "auto", background: "#ea580c", color: "#fff", border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  View SLA &rarr;
                </button>
              </div>
            )}
          </div>
        )}

        {/* ---------------- PERFORMANCE ---------------- */}
        {activeTab === "performance" && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>Recruiter Performance Tracking</div>
              <div style={{ fontSize: 13, color: "#64748b" }}>Deep analytics per recruiter - jobs, pipeline conversion, KPIs and response rates</div>
            </div>

            {/* Chart */}
            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: "20px", marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
                <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                  {([["#6366f1", "Applications"], ["#0891b2", "Interviews"], ["#f59e0b", "Jobs Posted"], ["#059669", "Hires"]] as [string, string][]).map(([c, l]) => (
                    <span key={l} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#64748b" }}>
                      <span style={{ width: 10, height: 10, borderRadius: 2, background: c, display: "inline-block" }} />{l}
                    </span>
                  ))}
                </div>
                {selectedRecruiter !== null ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: liveRecruiters.find(r => r.id === selectedRecruiter)?.color }}>
                      {liveRecruiters.find(r => r.id === selectedRecruiter)?.name}
                    </span>
                    <button onClick={() => setSelectedRecruiter(null)} style={{ background: "#f1f5f9", border: "none", borderRadius: 6, padding: "3px 10px", fontSize: 11, cursor: "pointer", color: "#64748b" }}>Show All</button>
                  </div>
                ) : (
                  <span style={{ fontSize: 11, color: "#94a3b8" }}>Click a card to focus one recruiter</span>
                )}
              </div>
              <div style={{ position: "relative", height: 240 }}>
                <canvas ref={chartRef} role="img" aria-label="Recruiter performance bar chart" />
              </div>
            </div>

            {/* Per-recruiter cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
              {liveRecruiters.map(r => {
                const maxJobs = Math.max(50, ...liveRecruiters.map(lr => lr.jobs));
                const maxApps = Math.max(700, ...liveRecruiters.map(lr => lr.apps));
                const maxInts = Math.max(60, ...liveRecruiters.map(lr => lr.interviews));
                const maxHires = Math.max(10, ...liveRecruiters.map(lr => lr.hires));
                
                return (
                <div key={r.id} style={{
                  background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", overflow: "hidden",
                  cursor: "pointer", transition: "box-shadow 0.2s",
                  boxShadow: selectedRecruiter === r.id ? `0 0 0 2px ${r.color}` : "none",
                }} onClick={() => setSelectedRecruiter(selectedRecruiter === r.id ? null : r.id)}>
                  <div style={{ padding: "16px 18px", borderBottom: "1px solid #f8fafc" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <Avatar initials={r.initials} color={r.color} size={42} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>{r.name}</div>
                        <div style={{ fontSize: 12, color: "#94a3b8" }}>{r.email}</div>
                      </div>
                      <Badge text={r.role} color={r.color} />
                    </div>
                  </div>
                  <div style={{ padding: "14px 18px" }}>
                    {([["Jobs Posted", r.jobs, maxJobs, r.color], ["Applications", r.apps, maxApps, r.color], ["Interviews", r.interviews, maxInts, r.color], ["Hires", r.hires, maxHires, BRAND]] as [string, number, number, string][]).map(([label, val, max, col]) => (
                      <div key={label} style={{ marginBottom: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
                          <span style={{ color: "#64748b" }}>{label}</span>
                        </div>
                        <KPIBar value={val} max={max} color={col} />
                      </div>
                    ))}

                    {selectedRecruiter === r.id && (
                      <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #f1f5f9", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                        {([["Offers", r.offers, "#059669"], ["Joined", r.joined, "#7c3aed"], ["Response %", `${r.responseRate}%`, r.responseRate > 70 ? "#059669" : r.responseRate > 55 ? "#f59e0b" : BRAND_RED]] as [string, any, string][]).map(([label, val, col]) => (
                          <div key={label} style={{ background: "#f8fafc", borderRadius: 8, padding: "8px 10px", textAlign: "center" }}>
                            <div style={{ fontSize: 18, fontWeight: 800, color: col }}>{val}</div>
                            <div style={{ fontSize: 10, color: "#94a3b8" }}>{label}</div>
                          </div>
                        ))}
                        <div style={{ gridColumn: "1 / -1", background: "#f8fafc", borderRadius: 8, padding: "8px 10px", textAlign: "center" }}>
                          <div style={{ fontSize: 12, color: "#64748b" }}>Avg. time-to-hire: <strong style={{ color: "#0f172a" }}>{r.avgDays} days</strong></div>
                        </div>
                      </div>
                    )}
                    <div style={{ fontSize: 11, color: "#94a3b8", textAlign: "center", marginTop: 8 }}>
                      <div style={{ fontSize: 11, color: "#94a3b8", textAlign: "center", marginTop: 8 }}>{selectedRecruiter === r.id ? "Click to collapse" : "Click for full KPIs"}</div>
                    </div>
                  </div>
                </div>
              );
            })}
            </div>
          </div>
        )}

        {/* ---------------- PIPELINE ---------------- */}
        {activeTab === "pipeline" && (
          <div>
            <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>Candidate Pipeline (ATS Kanban)</div>
                <div style={{ fontSize: 13, color: "#64748b" }}>Every candidate tracked from Applied to Joined with full recruiter ownership</div>
              </div>
              <button style={{ background: BRAND, color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>+ Assign Candidates</button>
            </div>

            {/* Stage pills */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
              {Object.entries(SAMPLE_PIPELINE).map(([stage, c]) => (
                <div key={stage} style={{
                  background: STAGE_COLORS[stage] + "15", color: STAGE_COLORS[stage],
                  border: `1px solid ${STAGE_COLORS[stage]}40`, borderRadius: 99,
                  padding: "4px 12px", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 6,
                }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: STAGE_COLORS[stage], display: "inline-block" }} />
                  {stage} <strong>{c.length}</strong>
                </div>
              ))}
            </div>

            {/* Kanban */}
            <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 8 }}>
              {Object.entries(SAMPLE_PIPELINE).map(([stage, candidates]) => (
                <div key={stage} style={{ minWidth: 180, flex: "0 0 180px" }}>
                  <div style={{ background: STAGE_COLORS[stage], color: "#fff", borderRadius: "10px 10px 0 0", padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, fontWeight: 700 }}>{stage}</span>
                    <span style={{ background: "rgba(255,255,255,0.3)", borderRadius: 99, padding: "1px 8px", fontSize: 12, fontWeight: 700 }}>{candidates.length}</span>
                  </div>
                  <div style={{ background: "#fff", border: `1px solid ${STAGE_COLORS[stage]}30`, borderTop: "none", borderRadius: "0 0 10px 10px", padding: 10, minHeight: 80 }}>
                    {candidates.length === 0 ? (
                      <div style={{ textAlign: "center", color: "#cbd5e1", fontSize: 12, padding: 12 }}>Empty</div>
                    ) : candidates.map((c, i) => (
                      <div key={i} style={{ background: "#f8fafc", borderRadius: 8, padding: "10px 12px", marginBottom: 8, border: `1px solid ${STAGE_COLORS[stage]}20` }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>{c.name}</div>
                        <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>{c.job}</div>
                        <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 4 }}>By {c.recruiter.split(" ")[0]}</div>
                        {c.days >= 3 && (
                          <div style={{ fontSize: 10, color: c.days >= 4 ? BRAND_RED : "#f59e0b", fontWeight: 600, marginTop: 4 }}>
                            {c.days}d {c.days >= 4 ? "SLA breach" : "watch"}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Follow-up timeline */}
            <div style={{ marginTop: 28 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 14 }}>Follow-up Tracking - Ravi Kumar (Java Developer)</div>
              <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: "20px 24px" }}>
                {FOLLOW_UP.map((f, i) => (
                  <div key={i} style={{ display: "flex", gap: 16, marginBottom: i < FOLLOW_UP.length - 1 ? 20 : 0 }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                        background: f.type === "positive" ? "#d1fae5" : f.type === "done" ? "#dbeafe" : f.type === "schedule" ? "#fef9c3" : f.type === "pending" ? "#fff7ed" : "#f1f5f9",
                        fontSize: 16,
                      }}>
                        {f.type === "call" ? "Call" : f.type === "positive" ? "OK" : f.type === "schedule" ? "Cal" : f.type === "done" ? "Done" : "Pending"}
                      </div>
                      {i < FOLLOW_UP.length - 1 && <div style={{ width: 2, flex: 1, background: "#e2e8f0", margin: "4px 0" }} />}
                    </div>
                    <div style={{ paddingTop: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{f.action}</span>
                        <span style={{ fontSize: 11, color: "#94a3b8" }}>{f.date}</span>
                      </div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>{f.note}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ---------------- ACTIVITY ---------------- */}
        {activeTab === "activity" && (
          <div>
            <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>Activity Timeline</div>
                <div style={{ fontSize: 13, color: "#64748b" }}>Every recruiter action logged in real time  {SAMPLE_ACTIVITY.length} events today</div>
              </div>
              <div style={{ background: "#f1f5f9", borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 600, color: "#475569" }}>
                Today, {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
              {["All", "Jobs", "Interviews", "Offers", "Status Changes"].map(f => (
                <button key={f} style={{
                  background: f === "All" ? BRAND_DARK : "#f8fafc", color: f === "All" ? "#fff" : "#64748b",
                  border: "1px solid #e2e8f0", borderRadius: 99, padding: "5px 14px", fontSize: 12, fontWeight: 500, cursor: "pointer",
                }}>{f}</button>
              ))}
            </div>

            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", overflow: "hidden" }}>
              {SAMPLE_ACTIVITY.map((log, i) => {
                const rec = liveRecruiters.find(r => r.name === log.user);
                return (
                  <div key={log.id} style={{
                    display: "flex", alignItems: "flex-start", gap: 16, padding: "14px 20px",
                    borderBottom: i < SAMPLE_ACTIVITY.length - 1 ? "1px solid #f8fafc" : "none",
                    background: i % 2 === 0 ? "#fff" : "#fafafa",
                  }}>
                    <div style={{ fontSize: 11, color: "#94a3b8", minWidth: 65, paddingTop: 2, whiteSpace: "nowrap" }}>{log.time}</div>
                    <div style={{ fontSize: 20, flexShrink: 0 }}>{log.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2, flexWrap: "wrap" }}>
                        {rec && <Avatar initials={rec.initials} color={rec.color} size={24} />}
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{log.user}</span>
                        <span style={{ fontSize: 13, color: "#64748b" }}>{log.action}</span>
                      </div>
                      <div style={{ fontSize: 12, color: "#94a3b8" }}>{log.detail}</div>
                    </div>
                    <div style={{
                      fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 99,
                      background: log.type === "job" ? "#dbeafe" : log.type === "offer" ? "#d1fae5" : log.type === "reject" ? "#fee2e2" : "#f5f3ff",
                      color: log.type === "job" ? "#1d4ed8" : log.type === "offer" ? "#065f46" : log.type === "reject" ? "#991b1b" : "#7c3aed",
                    }}>{log.type}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ---------------- TEAM ---------------- */}
        {activeTab === "team" && (
          <div>
            <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>Team Roles & Permissions</div>
                <div style={{ fontSize: 13, color: "#64748b" }}>Manage access levels across your recruiting team</div>
              </div>
              <button onClick={() => onNavigate?.("dashboard")} style={{ background: BRAND, color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>+ Add Member</button>
            </div>

            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", marginBottom: 24, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    {["Recruiter", "Role", "Jobs", "Applications", "Hires", "Response Rate", "Status", "Actions"].map(h => (
                      <th key={h} style={{ padding: "12px 16px", fontSize: 11, fontWeight: 700, color: "#64748b", textAlign: "left", letterSpacing: "0.5px", textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {liveRecruiters.map((r, i) => (
                    <tr key={r.id} style={{ borderTop: "1px solid #f1f5f9", background: i % 2 ? "#fafafa" : "#fff" }}>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <Avatar initials={r.initials} color={r.color} size={36} />
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{r.name}</div>
                            <div style={{ fontSize: 11, color: "#94a3b8" }}>{r.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "14px 16px" }}><Badge text={r.role} color={r.color} /></td>
                      <td style={{ padding: "14px 16px", fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{r.jobs}</td>
                      <td style={{ padding: "14px 16px", fontSize: 13, color: "#374151" }}>{r.apps.toLocaleString()}</td>
                      <td style={{ padding: "14px 16px" }}><span style={{ fontSize: 14, fontWeight: 800, color: BRAND }}>{r.hires}</span></td>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div style={{ flex: 1, height: 5, background: "#f1f5f9", borderRadius: 99, minWidth: 60 }}>
                            <div style={{ width: `${r.responseRate}%`, height: "100%", borderRadius: 99, background: r.responseRate > 70 ? "#10b981" : r.responseRate > 55 ? "#f59e0b" : "#ef4444" }} />
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 700, color: r.responseRate > 70 ? "#059669" : r.responseRate > 55 ? "#d97706" : BRAND_RED }}>{r.responseRate}%</span>
                        </div>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{ background: "#d1fae5", color: "#065f46", fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 99 }}>Active</span>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button style={{ background: "#f1f5f9", border: "none", borderRadius: 6, padding: "5px 10px", fontSize: 11, cursor: "pointer", color: "#374151" }}>Edit</button>
                          <button style={{ background: "#fff7ed", border: "none", borderRadius: 6, padding: "5px 10px", fontSize: 11, cursor: "pointer", color: "#c2410c" }}>Reassign</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Role Permission Matrix */}
            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9" }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>Role Permission Matrix</div>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc" }}>
                      <th style={{ padding: "12px 20px", fontSize: 12, fontWeight: 600, color: "#374151", textAlign: "left", minWidth: 180 }}>Permission</th>
                      {([["Owner", BRAND_DARK], ["Team Lead", "#7c3aed"], ["Recruiter", "#059669"], ["Hiring Manager", "#d97706"], ["Viewer", "#94a3b8"]] as [string, string][]).map(([role, col]) => (
                        <th key={role} style={{ padding: "12px 16px", fontSize: 12, fontWeight: 700, color: col, textAlign: "center", minWidth: 120 }}>{role}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {([
                      ["Post Jobs", [true, true, true, false, false]],
                      ["Assign Candidates", [true, true, false, false, false]],
                      ["View All Recruiters", [true, true, false, false, false]],
                      ["Manage Team", [true, false, false, false, false]],
                      ["Approve Candidates", [true, true, false, true, false]],
                      ["View Reports", [true, true, false, true, true]],
                      ["Audit Logs", [true, false, false, false, false]],
                      ["Export Data", [true, true, false, false, false]],
                    ] as [string, boolean[]][]).map(([perm, vals], i) => (
                      <tr key={perm} style={{ borderTop: "1px solid #f1f5f9", background: i % 2 ? "#fafafa" : "#fff" }}>
                        <td style={{ padding: "12px 20px", fontSize: 13, color: "#374151" }}>{perm}</td>
                        {vals.map((v, j) => (
                          <td key={j} style={{ padding: "12px 16px", textAlign: "center" }}>
                            {v ? <span style={{ color: "#059669", fontSize: 16 }}>&#10003;</span> : <span style={{ color: "#d1d5db", fontSize: 16 }}>&#10007;</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ---------------- SLA ---------------- */}
        {activeTab === "sla" && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>SLA Monitoring</div>
              <div style={{ fontSize: 13, color: "#64748b" }}>Candidates with no action taken  SLA window is 3 days per stage</div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14, marginBottom: 24 }}>
              <StatCard label="Critical Breaches" value={SAMPLE_SLA.filter(b => b.severity === "critical").length} icon={<IconCheckCircle color={BRAND_RED} />} color={BRAND_RED} sub="> 4 days" />
              <StatCard label="Warnings" value={SAMPLE_SLA.filter(b => b.severity === "warning").length} icon={<IconCalendar color="#d97706" />} color="#d97706" sub="3-4 days" />
              <StatCard label="Healthy" value={Object.values(SAMPLE_PIPELINE).flat().filter(c => c.days < 3).length} icon={<IconCheckCircle color="#059669" />} color="#059669" sub="< 3 days" />
            </div>

            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", overflow: "hidden", marginBottom: 24 }}>
              <div style={{ padding: "14px 20px", borderBottom: "1px solid #f1f5f9", background: "#fff7ed", display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontWeight: 700, color: "#c2410c", fontSize: 14 }}>Active Breaches</span>
                <Badge text={`${SAMPLE_SLA.length} Breaches`} color="#ea580c" />
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    {["Candidate", "Job", "Stage", "Days Waiting", "Recruiter", "Severity", "Action"].map(h => (
                      <th key={h} style={{ padding: "10px 16px", fontSize: 11, fontWeight: 700, color: "#64748b", textAlign: "left", letterSpacing: "0.5px", textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SAMPLE_SLA.map((b, i) => (
                    <tr key={i} style={{ borderTop: "1px solid #f1f5f9", background: b.severity === "critical" ? "#fff1f2" : "#fffbeb" }}>
                      <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{b.candidate}</td>
                      <td style={{ padding: "12px 16px", fontSize: 12, color: "#64748b" }}>{b.job}</td>
                      <td style={{ padding: "12px 16px" }}><Badge text={b.stage} color={STAGE_COLORS[b.stage]} /></td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ fontSize: 14, fontWeight: 800, color: b.severity === "critical" ? BRAND_RED : "#d97706" }}>{b.days} days</span>
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 12, color: "#374151" }}>{b.recruiter}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ background: b.severity === "critical" ? "#fee2e2" : "#fef3c7", color: b.severity === "critical" ? "#991b1b" : "#92400e", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99 }}>
                          {b.severity === "critical" ? "Critical" : "Warning"}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <button style={{ background: BRAND, color: "#fff", border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Escalate</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Avg time-to-action */}
            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", overflow: "hidden" }}>
              <div style={{ padding: "14px 20px", borderBottom: "1px solid #f1f5f9" }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>Avg. Time-to-Action by Recruiter</div>
              </div>
              <div style={{ padding: "16px 20px" }}>
                {liveRecruiters.map(r => (
                  <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
                    <Avatar initials={r.initials} color={r.color} size={32} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", marginBottom: 4 }}>{r.name}</div>
                      <div style={{ height: 8, background: "#f1f5f9", borderRadius: 99 }}>
                        <div style={{ width: `${Math.min(100, (r.avgDays / 25) * 100)}%`, height: "100%", borderRadius: 99, background: r.avgDays <= 12 ? "#10b981" : r.avgDays <= 18 ? "#f59e0b" : "#ef4444" }} />
                      </div>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, minWidth: 70, textAlign: "right", color: r.avgDays <= 12 ? "#059669" : r.avgDays <= 18 ? "#d97706" : BRAND_RED }}>
                      {r.avgDays} days avg
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ---------------- JOB POSTINGS ---------------- */}
        {activeTab === "jobs" && (() => {
          // Filter + sort
          const allRecruiterMgrs = [...new Set(apiJobs.map(j => j.recruiterManager))];
          const allPostedBy = [...new Set(apiJobs.map(j => j.postedBy))];
          const allAssignedTo = [...new Set(apiJobs.map(j => j.assignedTo))];

          const roleColor = (role: string) =>
            role === "Team Lead" ? "#d97706" : role === "Senior Recruiter" ? "#7c3aed" : "#059669";

          const filtered = apiJobs.filter(j => {
            const matchStatus = jobStatusFilter === "All Jobs" || j.status === jobStatusFilter;
            const matchStatusCol = filterJobStatus.length === 0 || filterJobStatus.includes(j.status);
            const q = jobSearch.toLowerCase();
            const matchSearch = !q || j.id.toLowerCase().includes(q) || j.title.toLowerCase().includes(q) || j.company.toLowerCase().includes(q) || j.location.toLowerCase().includes(q) || j.recruiterManager.toLowerCase().includes(q);
            const matchMgr = filterRecruiterMgr.length === 0 || filterRecruiterMgr.includes(j.recruiterManager);
            const matchPosted = filterPostedBy.length === 0 || filterPostedBy.includes(j.postedBy);
            const matchAssigned = filterAssignedTo.length === 0 || filterAssignedTo.includes(j.assignedTo);
            return matchStatus && matchStatusCol && matchSearch && matchMgr && matchPosted && matchAssigned;
          });
          const total = filtered.length;
          const totalPages = Math.ceil(total / jobPerPage);
          const paginated = filtered.slice((jobPage - 1) * jobPerPage, jobPage * jobPerPage);
          const allSelected = paginated.length > 0 && paginated.every(j => selectedJobs.includes(j.id));

          const thStyle = (col: string): React.CSSProperties => ({
            padding: "12px 16px", fontSize: 13, fontWeight: 700, color: "#1e293b",
            background: col === "__cb" || col === "id" ? "#e8eeff" : "#f0f4ff",
            whiteSpace: "nowrap", borderBottom: "2px solid #dbeafe",
            borderRight: "1px solid #e2e8f0", cursor: "pointer", userSelect: "none",
            position: col === "__cb" || col === "id" ? "sticky" as const : "static" as const,
            left: col === "__cb" ? 0 : col === "id" ? 44 : undefined,
            zIndex: col === "__cb" || col === "id" ? 2 : undefined,
            letterSpacing: "0.2px",
          } as React.CSSProperties);

          const tdStyle: React.CSSProperties = {
            padding: "11px 16px", fontSize: 13, color: "#374151",
            borderBottom: "1px solid #f1f5f9", borderRight: "1px solid #f1f5f9",
            whiteSpace: "nowrap", verticalAlign: "middle",
          };

          const statusColor = (s: string) => s === "Active" ? { bg: "#d1fae5", fg: "#065f46" } : s === "Hold" ? { bg: "#ffedd5", fg: "#9a3412" } : { bg: "#fee2e2", fg: "#991b1b" };

          return (
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {/* Stats Cards */}
              <div style={{ marginBottom: 18 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12 }}>
                  <StatCard label="Jobs Posted" value={totalJobs} icon={<IconBriefcase color="#0891b2" />} color="#0891b2" sub="Your postings" />
                  <StatCard label="Active Jobs" value={apiJobs.filter(j => j.status === "Active").length} icon={<IconUsers color="#7c3aed" />} color="#7c3aed" sub="Currently open" />
                  <StatCard label="Applications" value={totalApps.toLocaleString()} icon={<IconInbox color="#6366f1" />} color="#6366f1" sub="Total received" />
                  <StatCard label="Interviews" value={totalInterviews} icon={<IconCalendar color="#f59e0b" />} color="#f59e0b" sub="Scheduled" />
                  <StatCard label="Total Hired" value={totalHires} icon={<IconCheckCircle color="#059669" />} color="#059669" sub="Confirmed joins" />
                  <StatCard label="Rejected" value={totalRejected} icon={<IconGift color="#ef4444" />} color="#ef4444" sub="Screened out" />
                </div>
              </div>
              {/* Toolbar */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
                  {/* Search */}
                  <div style={{ display: "flex", alignItems: "center", border: "1px solid #e2e8f0", borderRadius: 8, background: "#fff", padding: "0 12px", height: 34, minWidth: 240, maxWidth: 300 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginRight: 8 }}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                    <input value={jobSearch} onChange={e => { setJobSearch(e.target.value); setJobPage(1); }}
                      placeholder="Job title, recruiter, company..."
                      style={{ border: "none", fontSize: 12, outline: "none", flex: 1, color: "#374151", background: "transparent" }} />
                    {jobSearch && (
                      <button onClick={() => { setJobSearch(""); setJobPage(1); }} style={{ border: "none", background: "none", cursor: "pointer", color: "#94a3b8", fontSize: 14, lineHeight: 1, padding: 0, marginLeft: 4 }}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg></button>
                    )}
                  </div>
                  {/* Status filter pills */}
                  {["Active", "Hold", "Closed"].map(opt => {
                    const isActive = filterJobStatus.length === 1 && filterJobStatus[0] === opt;
                    return (
                      <button key={opt} onClick={() => { setFilterJobStatus([opt]); setJobStatusFilter(opt); setJobPage(1); }} style={{
                        border: "1px solid #d1d5db", borderRadius: 20,
                        padding: "6px 14px", fontSize: 12, fontWeight: isActive ? 700 : 500,
                        cursor: "pointer", whiteSpace: "nowrap",
                        background: isActive ? BRAND : "#fff",
                        color: isActive ? "#fff" : "#374151",
                        boxShadow: isActive ? "0 1px 4px rgba(30,64,175,0.2)" : "none",
                      }}>
                        <span style={{ color: isActive ? "#fff" : "#374151" }}>{opt}</span>
                      </button>
                    );
                  })}
                </div>
                {/* Export CSV */}
                <button style={{
                  background: `linear-gradient(135deg, ${BRAND_DARK} 0%, #2563eb 100%)`, color: "#fff", border: "none", borderRadius: 8,
                  padding: "8px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 7, whiteSpace: "nowrap",
                  boxShadow: "0 2px 8px rgba(30,58,138,0.25)"
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                  Export CSV
                </button>
              </div>

              {/* Grid */}
              <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #dbeafe", overflow: "hidden", boxShadow: "0 1px 6px rgba(30,64,175,0.07)" }}>
                <div style={{ overflowX: "scroll", overflowY: "auto", maxHeight: "calc(100vh - 200px)", position: "relative", WebkitOverflowScrolling: "touch" }}>
                  <table style={{ borderCollapse: "collapse", minWidth: 2050, width: "max-content", tableLayout: "fixed" }}>
                    <colgroup>
                      <col style={{ width: 40 }} />
                      <col style={{ width: 110 }} />
                      <col style={{ width: 220 }} />
                      <col style={{ width: 140 }} />
                      <col style={{ width: 150 }} />
                      <col style={{ width: 140 }} />
                      <col style={{ width: 120 }} />
                      <col style={{ width: 130 }} />
                      <col style={{ width: 130 }} />
                      <col style={{ width: 100 }} />
                      <col style={{ width: 120 }} />
                      <col style={{ width: 100 }} />
                      <col style={{ width: 130 }} />
                      <col style={{ width: 150 }} />
                      <col style={{ width: 110 }} />
                    </colgroup>
                    <thead style={{ position: "sticky", top: 0, zIndex: 3 }}>
                      <tr>
                        <th style={{ ...thStyle("__cb"), left: 0, width: 40 }}>
                          <input type="checkbox"
                            checked={allSelected}
                            onChange={e => {
                              if (e.target.checked) {
                                setSelectedJobs(prev => [...new Set([...prev, ...paginated.map(j => j.id)])]);
                              } else {
                                const pageIds = new Set(paginated.map(j => j.id));
                                setSelectedJobs(prev => prev.filter(id => !pageIds.has(id)));
                              }
                            }}
                            style={{ cursor: "pointer", accentColor: BRAND }} />
                        </th>
                        <th style={{ ...thStyle("id"), left: 40 }} onClick={() => { setSortCol("id"); setSortDir(d => d === "asc" ? "desc" : "asc"); }}>
                          Job Code
                        </th>
                        {/* Static headers � no filter symbol */}
                        {["Job Title", "Company Name", "Location"].map(h => (
                          <th key={h} style={{ ...thStyle(h), textAlign: "left" }}>
                            {h}
                          </th>
                        ))}
                        {/* Recruiter Manager � no filter symbol */}
                        <th style={{ ...thStyle("Recruiter Manager"), textAlign: "left" }}>Recruiter Manager</th>
                        {/* Job Posted By � filterable */}
                        {(["Job Posted By", "Assigned To"] as const).map(h => {
                          const colKey = h === "Job Posted By" ? "postedBy" : "assignedTo";
                          const hasFilter = (h === "Job Posted By" ? filterPostedBy : filterAssignedTo).length > 0;
                          const allVals = h === "Job Posted By" ? allPostedBy : allAssignedTo;
                          const selectedVals = h === "Job Posted By" ? filterPostedBy : filterAssignedTo;
                          const setVals = h === "Job Posted By" ? setFilterPostedBy : setFilterAssignedTo;
                          return (
                            <th key={h} style={{ ...thStyle(h), position: "relative" as const }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <span>{h}</span>
                                <button onClick={e => { e.stopPropagation(); setOpenFilter(openFilter === colKey ? null : colKey); }} style={{
                                  background: hasFilter ? BRAND : "#dbeafe", border: "none", borderRadius: 3,
                                  color: hasFilter ? "#fff" : "#1d4ed8", cursor: "pointer", padding: "2px 7px", fontSize: 10, fontWeight: 700, lineHeight: 1.4, flexShrink: 0
                                }}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg></button>
                              </div>
                              {openFilter === colKey && (
                                <ColumnFilterPopup
                                  label={h}
                                  allValues={allVals}
                                  allRecruiterData={liveRecruiters.map(r => ({ name: r.name, email: r.email }))}
                                  selected={selectedVals}
                                  onApply={vals => { setVals(vals); setJobPage(1); setOpenFilter(null); }}
                                  onClose={() => setOpenFilter(null)}
                                />
                              )}
                            </th>
                          );
                        })}
                        {/* Recruiter Role header */}
                        <th style={{ ...thStyle("Recruiter Role"), textAlign: "left" }}>Recruiter Role</th>
                        {/* Job Status header (filterable) */}
                        <th style={{ ...thStyle("Job Status"), position: "relative" as const }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span>Job Status</span>
                            <button onClick={e => { e.stopPropagation(); setOpenFilter(openFilter === "status" ? null : "status"); }} style={{
                              background: (filterJobStatus.length > 0 && !(filterJobStatus.length === 1 && filterJobStatus[0] === "Active")) ? BRAND : "#dbeafe", border: "none", borderRadius: 3,
                              color: (filterJobStatus.length > 0 && !(filterJobStatus.length === 1 && filterJobStatus[0] === "Active")) ? "#fff" : "#1d4ed8", cursor: "pointer", padding: "2px 7px", fontSize: 10, fontWeight: 700, lineHeight: 1.4, flexShrink: 0
                            }}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg></button>
                          </div>
                          {openFilter === "status" && (
                            <ColumnFilterPopup
                              label="Job Status"
                              allValues={["Active", "Hold", "Closed"]}
                              selected={filterJobStatus}
                              onApply={vals => { setFilterJobStatus(vals); setJobPage(1); setOpenFilter(null); }}
                              onClose={() => setOpenFilter(null)}
                            />
                          )}
                        </th>
                        {/* Remaining static headers */}
                        {["Job Posted", "Applications", "Interview Scheduled", "Interview Completed", "Hired", "Rejected"].map(h => (
                          <th key={h} style={{ ...thStyle(h), textAlign: ["Applications", "Interview Scheduled", "Interview In Progress", "Hired", "Rejected"].includes(h) ? "center" : "left" }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {jobsLoading ? (
                        <tr><td colSpan={15} style={{ textAlign: "center", padding: "40px", color: "#64748b", fontSize: 13 }}>Loading your job postings...</td></tr>
                      ) : paginated.length === 0 ? (
                        <tr><td colSpan={15} style={{ textAlign: "center", padding: "40px", color: "#94a3b8", fontSize: 13 }}>{apiJobs.length === 0 ? "No job postings found. Post a job to see it here." : "No job postings match your search."}</td></tr>
                      ) : paginated.map((j, i) => {
                        const sc = statusColor(j.status);
                        const isSelected = selectedJobs.includes(j.id);
                        const rec = liveRecruiters.find(r => r.name === j.recruiterManager);
                        const rowBg = isSelected ? "#eff6ff" : i % 2 === 0 ? "#fff" : "#fafafa";
                        return (
                          <tr key={j.id} style={{ background: rowBg }}
                            onMouseEnter={e => (e.currentTarget.style.background = "#eff6ff")}
                            onMouseLeave={e => (e.currentTarget.style.background = rowBg)}>
                            <td style={{ ...tdStyle, position: "sticky", left: 0, zIndex: 1, background: rowBg, textAlign: "center" }}>
                              <input type="checkbox" checked={isSelected}
                                onChange={e => setSelectedJobs(prev => e.target.checked ? [...prev, j.id] : prev.filter(id => id !== j.id))}
                                style={{ cursor: "pointer" }} />
                            </td>
                            <td style={{ ...tdStyle, position: "sticky", left: 44, zIndex: 1, background: rowBg }}>
                              <span style={{ color: BRAND, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>{j.id}</span>
                            </td>
                            <td style={{ ...tdStyle, maxWidth: 220 }}>
                              <span style={{ color: BRAND, fontWeight: 500, cursor: "pointer", overflow: "hidden", textOverflow: "ellipsis", display: "block" }} title={j.title}>{j.title}</span>
                            </td>
                            <td style={{ ...tdStyle, fontWeight: 700, color: "#0f172a", fontSize: 13 }}>{j.company}</td>
                            <td style={{ ...tdStyle, overflow: "hidden", textOverflow: "ellipsis" }}>{j.location}</td>
                            {/* Recruiter Manager */}
                            <td style={tdStyle}>
                              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                <span>{j.recruiterManager}</span>
                              </div>
                            </td>
                            {/* Job Posted By */}
                            <td style={{ ...tdStyle, color: "#374151" }}>{j.postedBy}</td>
                            {/* Assigned To */}
                            <td style={{ ...tdStyle, color: j.assignedTo === "N/A" ? "#94a3b8" : "#0f172a", fontStyle: j.assignedTo === "N/A" ? "italic" : "normal" }}>{j.assignedTo}</td>
                            {/* Recruiter Role */}
                            <td style={tdStyle}>
                              <span style={{ background: roleColor(j.recruiterRole) + "18", color: roleColor(j.recruiterRole), fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 99, border: `1px solid ${roleColor(j.recruiterRole)}30`, whiteSpace: "nowrap" }}>
                                {j.recruiterRole}
                              </span>
                            </td>
                            {/* Job Status */}
                            <td style={tdStyle}>
                              <span style={{ background: sc.bg, color: sc.fg, fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 99, border: `1px solid ${sc.fg}30`, whiteSpace: "nowrap" }}>{j.status}</span>
                            </td>
                            {/* Job Posted */}
                            <td style={{ ...tdStyle, color: "#64748b" }}>{j.posted}</td>
                            {/* Applications */}
                            <td style={{ ...tdStyle, textAlign: "center" }}>
                              <span style={{ fontSize: 14, fontWeight: 700, color: "#6366f1" }}>{j.applications}</span>
                            </td>
                            {/* Interview Scheduled */}
                            <td style={{ ...tdStyle, textAlign: "center" }}>
                              <span style={{ background: "#fef9c3", color: "#854d0e", fontSize: 13, fontWeight: 700, padding: "3px 12px", borderRadius: 99, display: "inline-block" }}>{j.interviewScheduled}</span>
                            </td>
                            {/* Interview Completed */}
                            <td style={{ ...tdStyle, textAlign: "center" }}>
                              <span style={{ background: "#f3e8ff", color: "#6b21a8", fontSize: 13, fontWeight: 700, padding: "3px 12px", borderRadius: 99, display: "inline-block" }}>{j.interviewCompleted}</span>
                            </td>
                            {/* Hired */}
                            <td style={{ ...tdStyle, textAlign: "center" }}>
                              <span style={{ background: "#d1fae5", color: "#065f46", fontSize: 13, fontWeight: 700, padding: "3px 12px", borderRadius: 99, display: "inline-block" }}>{j.hired}</span>
                            </td>
                            {/* Rejected */}
                            <td style={{ ...tdStyle, textAlign: "center" }}>
                              <span style={{ background: "#fee2e2", color: "#991b1b", fontSize: 13, fontWeight: 700, padding: "3px 12px", borderRadius: 99, display: "inline-block" }}>{j.rejected}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 20px", borderTop: "1px solid #e2e8f0", background: "#fff" }}>
                  {/* Left: record count */}
                  <span style={{ fontSize: 13, color: "#64748b" }}>
                    {total === 0 ? "0 records" : `${Math.min((jobPage - 1) * jobPerPage + 1, total)} - ${Math.min(jobPage * jobPerPage, total)} of ${total}`}
                  </span>

                  {/* Center: page buttons */}
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    {/* Prev */}
                    <button onClick={() => setJobPage(p => Math.max(1, p - 1))} disabled={jobPage === 1} style={{
                      height: 30, padding: "0 10px", display: "flex", alignItems: "center", gap: 4,
                      border: "1px solid #e2e8f0", borderRadius: 6, background: jobPage === 1 ? "#f9fafb" : "#fff",
                      cursor: jobPage === 1 ? "not-allowed" : "pointer",
                      color: jobPage === 1 ? "#cbd5e1" : "#374151", fontSize: 12, fontWeight: 500,
                    }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg> Prev
                    </button>

                    {/* Page numbers */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, idx) => {
                      const start = Math.max(1, Math.min(jobPage - 2, totalPages - 4));
                      return start + idx;
                    }).filter(p => p >= 1 && p <= totalPages).map(p => (
                      <button key={p} onClick={() => setJobPage(p)} style={{
                        width: 30, height: 30,
                        border: p === jobPage ? "none" : "1px solid #e2e8f0",
                        borderRadius: 6,
                        background: p === jobPage ? BRAND : "#fff",
                        color: p === jobPage ? "#fff" : "#374151",
                        fontSize: 12, fontWeight: p === jobPage ? 700 : 400, cursor: "pointer",
                        boxShadow: p === jobPage ? "0 1px 4px rgba(30,64,175,0.25)" : "none",
                      }}>{p}</button>
                    ))}

                    {/* Next */}
                    <button onClick={() => setJobPage(p => Math.min(totalPages, p + 1))} disabled={jobPage === totalPages} style={{
                      height: 30, padding: "0 10px", display: "flex", alignItems: "center", gap: 4,
                      border: "1px solid #e2e8f0", borderRadius: 6, background: jobPage === totalPages ? "#f9fafb" : "#fff",
                      cursor: jobPage === totalPages ? "not-allowed" : "pointer",
                      color: jobPage === totalPages ? "#cbd5e1" : "#374151", fontSize: 12, fontWeight: 500,
                    }}>
                      Next <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                    </button>
                  </div>

                  {/* Right: per page */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <select value={jobPerPage} onChange={e => { setJobPerPage(Number(e.target.value)); setJobPage(1); }}
                      style={{ border: "1px solid #e2e8f0", borderRadius: 6, padding: "4px 8px", fontSize: 12, color: "#374151", background: "#fff", cursor: "pointer", outline: "none" }}>
                      {PER_PAGE_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                    <span style={{ fontSize: 12, color: "#64748b" }}>Per Page</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ---------------- AUDIT ---------------- */}
        {activeTab === "audit" && (
          <div>
            <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>Audit Logs � Complete Audit Trail</div>
                <div style={{ fontSize: 13, color: "#64748b" }}>Every action, by every user, with IP address and timestamp</div>
              </div>
              <button style={{ background: BRAND_DARK, color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Export CSV</button>
            </div>

            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "14px 20px", marginBottom: 16, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>Filter:</span>
              <select style={{ fontSize: 12, border: "1px solid #e2e8f0", borderRadius: 6, padding: "5px 10px", color: "#374151" }}>
                <option>All Users</option>
                {liveRecruiters.map(r => <option key={r.id}>{r.name}</option>)}
              </select>
              <select style={{ fontSize: 12, border: "1px solid #e2e8f0", borderRadius: 6, padding: "5px 10px", color: "#374151" }}>
                <option>All Modules</option><option>Jobs</option><option>Pipeline</option><option>Team</option><option>Reports</option>
              </select>
              <select style={{ fontSize: 12, border: "1px solid #e2e8f0", borderRadius: 6, padding: "5px 10px", color: "#374151" }}>
                <option>Last 7 days</option><option>Last 30 days</option><option>All time</option>
              </select>
            </div>

            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    {["User", "Action", "Module", "Entity / Detail", "IP Address", "Date & Time"].map(h => (
                      <th key={h} style={{ padding: "12px 16px", fontSize: 11, fontWeight: 700, color: "#64748b", textAlign: "left", letterSpacing: "0.5px", textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SAMPLE_AUDIT.map((log, i) => {
                    const rec = liveRecruiters.find(r => r.name === log.user);
                    return (
                      <tr key={i} style={{ borderTop: "1px solid #f1f5f9", background: i % 2 ? "#fafafa" : "#fff" }}>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            {rec ? <Avatar initials={rec.initials} color={rec.color} size={28} /> :
                              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>A</div>}
                            <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{log.user}</span>
                          </div>
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: 12, color: "#374151", fontWeight: 500 }}>{log.action}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <Badge text={log.module} color={log.module === "Jobs" ? "#0891b2" : log.module === "Pipeline" ? "#7c3aed" : log.module === "Team" ? "#059669" : "#d97706"} />
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: 12, color: "#64748b" }}>{log.entity}</td>
                        <td style={{ padding: "12px 16px", fontSize: 12, fontFamily: "monospace", color: "#94a3b8" }}>{log.ip}</td>
                        <td style={{ padding: "12px 16px", fontSize: 12, color: "#374151" }}>{log.date}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div style={{ padding: "12px 20px", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "#94a3b8" }}>Showing {SAMPLE_AUDIT.length} of {SAMPLE_AUDIT.length} records</span>
                <div style={{ display: "flex", gap: 8 }}>
                  <button style={{ background: "#f1f5f9", border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 12, cursor: "pointer", color: "#374151" }}>&laquo; Prev</button>
                  <button style={{ background: "#f1f5f9", border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 12, cursor: "pointer", color: "#374151" }}>Next &raquo;</button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
