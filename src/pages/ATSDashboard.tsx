import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { apiFetch } from "../api/apiFetch";

// -- Theme: matches ZyncJobs employer dashboard (blue-900 sidebar) -------------
const BRAND = "#1e40af";
const BRAND_DARK = "#1e3a8a";
const BRAND_RED = "#dc2626";

// -- Pipeline stages (must match backend CandidateAssignment enum) -------------
const STAGES = ["Applied", "Screening", "Shortlisted", "Interview 1", "Interview 2", "Selected", "Offer", "Joined", "Rejected"];

const STAGE_COLORS: Record<string, string> = {
  "Applied": "#6366f1", "Screening": "#0891b2", "Shortlisted": "#f59e0b",
  "Interview 1": "#8b5cf6", "Interview 2": "#ec4899", "Selected": "#10b981",
  "Offer": "#f97316", "Joined": "#16a34a", "Rejected": "#ef4444",
};

const AVATAR_COLORS = ["#7c3aed", "#0891b2", "#059669", "#d97706", "#db2777", "#8b5cf6", "#f43f5e", "#6366f1"];

const PER_PAGE_OPTIONS = [10, 25, 50];

const TABS = [
  {
    key: "overview", label: "Overview",
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>,
  },
  {
    key: "pipeline", label: "Pipeline",
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" /></svg>,
  },
  {
    key: "activity", label: "Activity",
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
  },
  {
    key: "team", label: "Team",
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
  },
  {
    key: "sla", label: "SLA",
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>,
  },
  {
    key: "jobs", label: "Jobs",
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>,
  },
  {
    key: "audit", label: "Audit",
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>,
  },
  {
    key: "performance", label: "Performance",
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>,
  },
];

// -- Types ---------------------------------------------------------------------
interface JobPosting {
  dbId: string;
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

interface AtsAssignment {
  id: string;
  applicationId: string;
  candidateEmail: string;
  candidateName: string;
  jobId: string;
  jobTitle: string;
  recruiterId: string;
  recruiterName: string;
  recruiterEmail: string;
  pipelineStage: string;
  notes: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PerfRecruiter {
  email: string;
  name: string;
  role: string;
  jobsPosted: number;
  applications: number;
  interviews: number;
  hires: number;
  candidatesContacted: number;
  offersReleased: number;
  responseRate: number;
}

interface ActivityEntry {
  id: string;
  userName: string;
  userEmail: string;
  action: string;
  module: string;
  entityName: string;
  details: any;
  createdAt: string;
}

interface AuditEntry {
  id: string;
  userName: string;
  userEmail: string;
  action: string;
  module: string;
  entityName: string;
  ip: string;
  createdAt: string;
}

interface TeamMemberRow {
  id: string;
  memberName: string;
  memberEmail: string;
  role: string;
  status: string;
  createdAt: string;
  permissions?: { canPost: boolean; canAssign: boolean; canViewAll: boolean; canApprove: boolean; label: string };
}

// -- Small helpers -------------------------------------------------------------
const fmtDate = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getFullYear()).slice(-2)}`;
};

const fmtDateTime = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return `${d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} ${d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`;
};

const daysSince = (iso?: string) => {
  if (!iso) return 0;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return 0;
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / 86400000));
};

const initialsOf = (name: string) => (name || "?").trim().substring(0, 2).toUpperCase();

function downloadCSV(filename: string, rows: string[][]) {
  const csv = rows.map(r => r.map(c => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
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
              placeholder={searchMode === "name" ? "Search by name…" : "Search by email…"}
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

function EmptyState({ icon, title, sub }: { icon?: React.ReactNode; title: string; sub?: string }) {
  return (
    <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: "48px 24px", textAlign: "center" }}>
      {icon && <div style={{ marginBottom: 10, opacity: 0.5 }}>{icon}</div>}
      <div style={{ fontSize: 15, fontWeight: 700, color: "#374151", marginBottom: 4 }}>{title}</div>
      {sub && <div style={{ fontSize: 13, color: "#94a3b8" }}>{sub}</div>}
    </div>
  );
}

function Toast({ msg }: { msg: string }) {
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 99999,
      background: "#0f172a", color: "#fff", fontSize: 13, fontWeight: 600,
      padding: "12px 18px", borderRadius: 10, boxShadow: "0 8px 24px rgba(15,23,42,0.35)",
      display: "flex", alignItems: "center", gap: 8,
      animation: "atsToastIn 0.25s ease",
    }}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
      {msg}
      <style>{`@keyframes atsToastIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}

// -- Main component ------------------------------------------------------------
interface ATSDashboardProps { onNavigate?: (page: string) => void }

export default function ATSDashboard({ onNavigate }: ATSDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedRecruiter, setSelectedRecruiter] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const notify = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3000);
  }, []);

  // -- Jobs grid state ---------------------------------------------------------
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
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  const [filterRecruiterMgr, setFilterRecruiterMgr] = useState<string[]>([]);
  const [filterPostedBy, setFilterPostedBy] = useState<string[]>([]);
  const [filterAssignedTo, setFilterAssignedTo] = useState<string[]>([]);
  const [filterJobStatus, setFilterJobStatus] = useState<string[]>(["Active"]);
  const [bulkAssignTo, setBulkAssignTo] = useState<string>("");
  const [bulkBusy, setBulkBusy] = useState(false);

  // -- ATS API state -----------------------------------------------------------
  const [atsLoading, setAtsLoading] = useState(true);
  const [dashStats, setDashStats] = useState<{ totalRecruiters: number; jobsPosted: number; applications: number; interviews: number; offers: number; hires: number } | null>(null);
  const [recentActivity, setRecentActivity] = useState<ActivityEntry[]>([]);
  const [perfData, setPerfData] = useState<PerfRecruiter[]>([]);
  const [pipelineData, setPipelineData] = useState<Record<string, AtsAssignment[]>>({});
  const [pipelineLoading, setPipelineLoading] = useState(false);
  const [movingId, setMovingId] = useState<string | null>(null);
  const [noteOpenId, setNoteOpenId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [activityLogs, setActivityLogs] = useState<ActivityEntry[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [slaBreaches, setSlaBreaches] = useState<any[]>([]);
  const [slaDays, setSlaDays] = useState(3);
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditUserFilter, setAuditUserFilter] = useState("");
  const [auditModuleFilter, setAuditModuleFilter] = useState("");
  const [auditPeriodFilter, setAuditPeriodFilter] = useState("");
  const [teamMembers, setTeamMembers] = useState<TeamMemberRow[]>([]);
  const [teamLoading, setTeamLoading] = useState(false);

  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<any>(null);

  // -- Fetch jobs for the logged-in employer from backend ----------------------
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
      const res = await fetch(`${API_BASE}/jobs/employer/email/${encodeURIComponent(ownerEmail)}?includeInactive=true`);
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

        return {
          dbId: j.id || '',
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
          hired: j.hired || 0,
          rejected: j.rejected || 0,
        };
      });

      setApiJobs(mapped);
    } catch (e) {
      console.error('ATSDashboard jobs fetch error:', e);
    } finally {
      setJobsLoading(false);
    }
  }, []);

  // -- Fetch all ATS data from the backend (/api/ats/*) ------------------------
  const fetchAts = useCallback(async () => {
    setAtsLoading(true);
    const results = await Promise.allSettled([
      apiFetch('/api/ats/dashboard'),
      apiFetch('/api/ats/recruiter-performance'),
      apiFetch('/api/ats/pipeline'),
      apiFetch('/api/ats/activity?limit=50'),
      apiFetch('/api/ats/sla'),
      apiFetch('/api/ats/audit?limit=50'),
      apiFetch('/api/ats/team'),
    ]);

    const [dashRes, perfRes, pipeRes, actRes, slaRes, audRes, teamRes] = results;

    if (dashRes.status === 'fulfilled' && dashRes.value.ok) {
      try {
        const d = await dashRes.value.json();
        if (d?.stats) setDashStats(d.stats);
        if (Array.isArray(d?.recentActivity)) setRecentActivity(d.recentActivity);
      } catch { /* ignore */ }
    }

    if (perfRes.status === 'fulfilled' && perfRes.value.ok) {
      try {
        const d = await perfRes.value.json();
        if (Array.isArray(d?.performance)) setPerfData(d.performance);
      } catch { /* ignore */ }
    }

    if (pipeRes.status === 'fulfilled' && pipeRes.value.ok) {
      try {
        const d = await pipeRes.value.json();
        if (d?.pipeline) setPipelineData(d.pipeline);
      } catch { /* ignore */ }
    }

    if (actRes.status === 'fulfilled' && actRes.value.ok) {
      try {
        const d = await actRes.value.json();
        if (Array.isArray(d?.logs)) setActivityLogs(d.logs);
      } catch { /* ignore */ }
    }

    if (slaRes.status === 'fulfilled' && slaRes.value.ok) {
      try {
        const d = await slaRes.value.json();
        if (Array.isArray(d?.slaBreaches)) setSlaBreaches(d.slaBreaches);
        if (d?.slaDays) setSlaDays(Number(d.slaDays));
      } catch { /* ignore */ }
    }

    if (audRes.status === 'fulfilled' && audRes.value.ok) {
      try {
        const d = await audRes.value.json();
        if (Array.isArray(d?.logs)) setAuditLogs(d.logs);
      } catch { /* ignore */ }
    }

    if (teamRes.status === 'fulfilled' && teamRes.value.ok) {
      try {
        const d = await teamRes.value.json();
        if (Array.isArray(d?.members)) setTeamMembers(d.members);
      } catch { /* ignore */ }
    }

    setAtsLoading(false);
  }, []);

  useEffect(() => {
    fetchJobs();
    fetchAts();
  }, [fetchJobs, fetchAts]);

  // -- Derived recruiters: real performance data (fallback: jobs-derived) ------
  const liveRecruiters = useMemo(() => {
    if (perfData.length > 0) {
      return perfData.map((p, idx) => {
        // Average time-to-action computed from real pipeline assignments
        const mine = Object.values(pipelineData).flat().filter(a =>
          (a.recruiterEmail || '').toLowerCase() === p.email.toLowerCase());
        const avgDays = mine.length > 0
          ? Math.round(mine.reduce((acc, a) => acc + daysSince(a.updatedAt), 0) / mine.length)
          : 0;
        return {
          id: p.email,
          name: p.name || p.email.split('@')[0],
          email: p.email,
          initials: initialsOf(p.name || p.email),
          role: p.role || 'Recruiter',
          color: AVATAR_COLORS[idx % AVATAR_COLORS.length],
          jobs: p.jobsPosted,
          apps: p.applications,
          interviews: p.interviews,
          hires: p.hires,
          offers: p.offersReleased,
          contacted: p.candidatesContacted,
          responseRate: p.responseRate,
          avgDays,
        };
      });
    }

    // Fallback: derive from jobs (works even if recruiter-performance fails)
    const stored = localStorage.getItem('user');
    const user = stored ? JSON.parse(stored) : null;
    const map: Record<string, any> = {};

    if (user?.name || user?.fullName) {
      const name = user.name || user.fullName;
      map[user?.email || ''] = {
        id: user?.email || name,
        name,
        email: user?.email || '',
        initials: initialsOf(name),
        role: user.role || user.userType || 'Recruiter',
        color: BRAND,
        jobs: 0, apps: 0, interviews: 0, offers: 0, hires: 0, avgDays: 0, responseRate: 0,
      };
    }

    apiJobs.forEach(j => {
      const email = (j.postedBy || user?.email || 'unknown@example.com').toLowerCase();
      const rName = j.recruiterManager || user?.name || user?.fullName || email.split('@')[0];
      if (!map[email]) {
        map[email] = {
          id: email,
          name: rName,
          email,
          initials: initialsOf(rName),
          role: j.recruiterRole || 'Recruiter',
          color: AVATAR_COLORS[Object.keys(map).length % AVATAR_COLORS.length],
          jobs: 0, apps: 0, interviews: 0, offers: 0, hires: 0, avgDays: 0, responseRate: 0,
        };
      }
      map[email].jobs += 1;
      map[email].apps += j.applications || 0;
      map[email].interviews += (j.interviewScheduled || 0) + (j.interviewCompleted || 0);
      map[email].hires += j.hired || 0;
    });

    return Object.values(map);
  }, [perfData, pipelineData, apiJobs]);

  // -- Totals (real data; jobs API headers win for per-job counts) -------------
  const hasLiveJobs = apiJobs.length > 0;
  const totalJobs = dashStats?.jobsPosted ?? (hasLiveJobs ? apiJobs.length : liveRecruiters.reduce((acc, r) => acc + r.jobs, 0));
  const totalApps = dashStats?.applications ?? (apiTotalApps !== null ? apiTotalApps : (hasLiveJobs ? apiJobs.reduce((acc, j) => acc + j.applications, 0) : liveRecruiters.reduce((acc, r) => acc + r.apps, 0)));
  const totalInterviews = dashStats?.interviews ?? (apiTotalInts !== null ? apiTotalInts : (hasLiveJobs ? apiJobs.reduce((acc, j) => acc + j.interviewScheduled + j.interviewCompleted, 0) : liveRecruiters.reduce((acc, r) => acc + r.interviews, 0)));
  const totalOffers = dashStats?.offers ?? liveRecruiters.reduce((acc, r) => acc + r.offers, 0);
  const totalHires = dashStats?.hires ?? (apiTotalHires !== null ? apiTotalHires : (hasLiveJobs ? apiJobs.reduce((acc, j) => acc + j.hired, 0) : liveRecruiters.reduce((acc, r) => acc + r.hires, 0)));
  const totalRejected = apiTotalRejected !== null ? apiTotalRejected : (hasLiveJobs ? apiJobs.reduce((acc, j) => acc + j.rejected, 0) : 0);

  const pipelineCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    STAGES.forEach(s => counts[s] = (pipelineData[s] || []).length);
    return counts;
  }, [pipelineData]);

  // -- Pipeline actions --------------------------------------------------------
  const moveAssignment = async (id: string, nextStage: string) => {
    setMovingId(id);
    try {
      const res = await apiFetch(`/api/ats/assignments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pipelineStage: nextStage }),
      });
      if (res.ok) {
        setPipelineData(prev => {
          const next: Record<string, AtsAssignment[]> = {};
          Object.keys(prev).forEach(k => next[k] = [...(prev[k] || [])]);
          let moved: AtsAssignment | null = null;
          Object.keys(next).forEach(k => {
            next[k] = next[k].filter(a => {
              if (a.id === id) { moved = { ...a, pipelineStage: nextStage, updatedAt: new Date().toISOString() }; return false; }
              return true;
            });
          });
          if (moved) next[nextStage] = [moved, ...(next[nextStage] || [])];
          return next;
        });
        notify(`Moved candidate to ${nextStage}`);
        fetchAts();
      } else {
        notify('Failed to move candidate');
      }
    } catch {
      notify('Failed to move candidate');
    } finally {
      setMovingId(null);
    }
  };

  const logFollowUp = async (assignment: AtsAssignment) => {
    if (!noteText.trim()) return;
    try {
      const res = await apiFetch('/api/ats/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: assignment.applicationId,
          candidateEmail: assignment.candidateEmail,
          candidateName: assignment.candidateName,
          noteType: 'followup',
          content: noteText.trim(),
        }),
      });
      if (res.ok) {
        notify('Follow-up note logged');
        setNoteOpenId(null);
        setNoteText('');
      } else {
        notify('Failed to log follow-up');
      }
    } catch {
      notify('Failed to log follow-up');
    }
  };

  const escalateBreach = async (b: any) => {
    try {
      const res = await apiFetch('/api/ats/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: `Escalated SLA breach — ${b.candidateName || b.candidateEmail || ''} (${b.jobTitle || ''})`,
          module: 'sla',
          entityType: 'candidate',
          entityName: b.candidateName || b.candidateEmail || '',
        }),
      });
      if (res.ok) notify('Escalation logged to activity trail');
      else notify('Failed to log escalation');
    } catch {
      notify('Failed to log escalation');
    }
  };

  const changeRole = async (member: TeamMemberRow, role: string) => {
    try {
      const res = await apiFetch(`/api/ats/team/${member.id}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (res.ok) {
        setTeamMembers(prev => prev.map(m => m.id === member.id ? { ...m, role } : m));
        notify(`Role updated to ${role}`);
        fetchAts();
      } else {
        notify('Failed to update role');
      }
    } catch {
      notify('Failed to update role');
    }
  };

  // -- Exports -----------------------------------------------------------------
  const exportJobsCSV = () => {
    const rows = [["Job Code", "Job Title", "Company Name", "Location", "Recruiter Manager", "Job Posted By", "Assigned To", "Recruiter Role", "Job Status", "Job Posted", "Applications", "Interview Scheduled", "Interview Completed", "Hired", "Rejected"]];
    filteredJobs.forEach(j => rows.push([j.id, j.title, j.company, j.location, j.recruiterManager, j.postedBy, j.assignedTo, j.recruiterRole, j.status, j.posted, String(j.applications), String(j.interviewScheduled), String(j.interviewCompleted), String(j.hired), String(j.rejected)]));
    downloadCSV(`zyncjobs-jobs-${new Date().toISOString().slice(0, 10)}.csv`, rows);
    notify(`Exported ${filteredJobs.length} jobs`);
  };

  const exportAuditCSV = () => {
    const rows = [["User", "Action", "Module", "Entity / Detail", "IP Address", "Date & Time"]];
    filteredAudit.forEach(l => rows.push([l.userName || l.userEmail, l.action, l.module, l.entityName, l.ip, fmtDateTime(l.createdAt)]));
    downloadCSV(`zyncjobs-audit-${new Date().toISOString().slice(0, 10)}.csv`, rows);
    notify(`Exported ${filteredAudit.length} audit records`);
  };

  // -- Bulk actions on selected jobs (Excel-style) -----------------------------
  const selectedJobRows = useMemo(() => apiJobs.filter(j => selectedJobs.includes(j.id)), [apiJobs, selectedJobs]);

  const bulkAssignToRecruiter = async () => {
    if (selectedJobRows.length === 0) return;
    const rec = liveRecruiters.find(r => r.email === bulkAssignTo);
    if (!rec) { notify("Select a recruiter first"); return; }

    setBulkBusy(true);
    try {
      const appIds: string[] = [];
      for (const job of selectedJobRows) {
        const res = await apiFetch(`/api/applications/job/${encodeURIComponent(job.id)}`);
        if (!res.ok) continue;
        const data = await res.json();
        const apps = Array.isArray(data) ? data : data?.applications;
        if (Array.isArray(apps)) appIds.push(...apps.map((a: any) => a.id).filter(Boolean));
      }
      if (appIds.length === 0) { notify("No applications found for the selected jobs"); return; }

      const assignRes = await apiFetch('/api/ats/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationIds: appIds,
          recruiterId: rec.email,
          recruiterName: rec.name,
          recruiterEmail: rec.email,
        }),
      });
      if (assignRes.ok) {
        const data = await assignRes.json();
        notify(`${data.count ?? appIds.length} candidate(s) assigned to ${rec.name}`);
        setSelectedJobs([]);
        fetchAts();
      } else {
        const err = await assignRes.json().catch(() => null);
        notify(`Assignment failed: ${err?.error || 'unknown error'}`);
      }
    } catch {
      notify("Assignment failed");
    } finally {
      setBulkBusy(false);
    }
  };

  const bulkSetStatus = async (action: "hold" | "close" | "active") => {
    if (selectedJobRows.length === 0) return;
    setBulkBusy(true);
    let okCount = 0;
    try {
      for (const job of selectedJobRows) {
        if (!job.dbId) continue;
        const body = action === "hold"
          ? { status: 'hold', isActive: false }
          : action === "close"
            ? { status: 'closed', isActive: false }
            : { status: 'active', isActive: true };
        const res = await apiFetch(`/api/jobs/${job.dbId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (res.ok) okCount++;
      }
      const label = action === "hold" ? "held" : action === "close" ? "closed" : "reactivated";
      notify(`${okCount} job(s) ${label}`);
      setSelectedJobs([]);
      fetchJobs();
    } catch {
      notify("Bulk update failed");
    } finally {
      setBulkBusy(false);
    }
  };

  const bulkDelete = async () => {
    if (selectedJobRows.length === 0) return;
    const confirmFn = (window as any).confirmAsync || ((msg: string) => Promise.resolve(window.confirm(msg)));
    const ok = await confirmFn(`Are you sure you want to delete ${selectedJobRows.length} selected job(s)? This cannot be undone.`);
    if (!ok) return;

    setBulkBusy(true);
    let okCount = 0;
    try {
      for (const job of selectedJobRows) {
        if (!job.dbId) continue;
        const res = await apiFetch(`/api/jobs/${job.dbId}`, { method: 'DELETE' });
        if (res.ok) okCount++;
      }
      notify(`${okCount} job(s) deleted`);
      setSelectedJobs([]);
      setBulkAssignTo("");
      fetchJobs();
    } catch {
      notify("Delete failed");
    } finally {
      setBulkBusy(false);
    }
  };

  const exportSelectedCSV = () => {
    if (selectedJobRows.length === 0) return;
    const rows = [["Job Code", "Job Title", "Company Name", "Location", "Recruiter Manager", "Job Posted By", "Assigned To", "Recruiter Role", "Job Status", "Job Posted", "Applications", "Interview Scheduled", "Interview Completed", "Hired", "Rejected"]];
    selectedJobRows.forEach(j => rows.push([j.id, j.title, j.company, j.location, j.recruiterManager, j.postedBy, j.assignedTo, j.recruiterRole, j.status, j.posted, String(j.applications), String(j.interviewScheduled), String(j.interviewCompleted), String(j.hired), String(j.rejected)]));
    downloadCSV(`zyncjobs-selected-jobs-${new Date().toISOString().slice(0, 10)}.csv`, rows);
    notify(`Exported ${selectedJobRows.length} selected jobs`);
  };

  // -- Jobs grid derived (filter + sort + paginate) ----------------------------
  const filteredJobs = useMemo(() => {
    const q = jobSearch.toLowerCase();
    const filtered = apiJobs.filter(j => {
      const matchStatus = jobStatusFilter === "All Jobs" || j.status === jobStatusFilter;
      const matchStatusCol = filterJobStatus.length === 0 || filterJobStatus.includes(j.status);
      const matchSearch = !q || j.id.toLowerCase().includes(q) || j.title.toLowerCase().includes(q) || j.company.toLowerCase().includes(q) || j.location.toLowerCase().includes(q) || j.recruiterManager.toLowerCase().includes(q);
      const matchMgr = filterRecruiterMgr.length === 0 || filterRecruiterMgr.includes(j.recruiterManager);
      const matchPosted = filterPostedBy.length === 0 || filterPostedBy.includes(j.postedBy);
      const matchAssigned = filterAssignedTo.length === 0 || filterAssignedTo.includes(j.assignedTo);
      return matchStatus && matchStatusCol && matchSearch && matchMgr && matchPosted && matchAssigned;
    });

    if (sortCol) {
      const dir = sortDir === "asc" ? 1 : -1;
      filtered.sort((a, b) => {
        const va = (a as any)[sortCol];
        const vb = (b as any)[sortCol];
        const cmp = typeof va === "number" && typeof vb === "number"
          ? va - vb
          : String(va ?? "").localeCompare(String(vb ?? ""));
        return cmp * dir;
      });
    }
    return filtered;
  }, [apiJobs, jobSearch, jobStatusFilter, filterJobStatus, filterRecruiterMgr, filterPostedBy, filterAssignedTo, sortCol, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / jobPerPage));
  const paginatedJobs = filteredJobs.slice((jobPage - 1) * jobPerPage, jobPage * jobPerPage);

  // -- Audit derived -----------------------------------------------------------
  const filteredAudit = useMemo(() => {
    const days = auditPeriodFilter === "7" ? 7 : auditPeriodFilter === "30" ? 30 : 0;
    return auditLogs.filter(l => {
      if (auditUserFilter && (l.userName || l.userEmail) !== auditUserFilter) return false;
      if (auditModuleFilter && l.module !== auditModuleFilter) return false;
      if (days > 0 && daysSince(l.createdAt) > days) return false;
      return true;
    });
  }, [auditLogs, auditUserFilter, auditModuleFilter, auditPeriodFilter]);

  // -- Performance chart -------------------------------------------------------
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
  }, [activeTab, selectedRecruiter, liveRecruiters]);

  const sortedLeaderboard = useMemo(() => [...liveRecruiters].sort((a, b) => b.hires - a.hires), [liveRecruiters]);
  const pendingFollowUps = useMemo(() =>
    Object.values(pipelineData).flat()
      .filter(a => a.pipelineStage === "Applied" || a.pipelineStage === "Screening")
      .sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()),
    [pipelineData]);

  const thStyle = (col: string): React.CSSProperties => ({
    padding: "12px 16px", fontSize: 13, fontWeight: 700, color: "#1e293b",
    background: col === "__cb" || col === "id" ? "#e8eeff" : "#f0f4ff",
    whiteSpace: "nowrap", borderBottom: "2px solid #dbeafe",
    borderRight: "1px solid #e2e8f0", cursor: col === "__cb" ? "default" : "pointer", userSelect: "none",
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
  const roleColor = (role: string) =>
    role === "Team Lead" ? "#d97706" : role === "Senior Recruiter" ? "#7c3aed" : "#059669";

  const toggleSort = (col: string) => {
    setSortCol(col);
    setSortDir(d => d === "asc" ? "desc" : "asc");
    setJobPage(1);
  };

  const sortIcon = (col: string) => sortCol === col
    ? (sortDir === "asc" ? " ▲" : " ▼")
    : "";

  const roleOptions = ["Owner", "Recruiter", "Team Lead", "Hiring Manager", "Viewer"];

  const renderSlaTable = () => {
    const breachRows = slaBreaches.map(b => ({
      ...b,
      days: daysSince(b.updatedAt),
      severity: daysSince(b.updatedAt) > slaDays ? "critical" : "warning",
    }));
    const criticalCount = breachRows.filter(b => b.severity === "critical").length;
    const warningCount = breachRows.filter(b => b.severity === "warning").length;
    const healthyCount = Object.values(pipelineData).flat().filter(c => c.pipelineStage === "Applied" || c.pipelineStage === "Screening").filter(c => daysSince(c.updatedAt) < slaDays).length;

    return (
      <div>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>SLA Monitoring</div>
          <div style={{ fontSize: 13, color: "#64748b" }}>Candidates with no action taken — SLA window is {slaDays} days per stage</div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14, marginBottom: 24 }}>
          <StatCard label="Critical Breaches" value={criticalCount} icon={<IconCheckCircle color={BRAND_RED} />} color={BRAND_RED} sub={`> ${slaDays} days`} />
          <StatCard label="Warnings" value={warningCount} icon={<IconCalendar color="#d97706" />} color="#d97706" sub={`${slaDays}-${slaDays + 1} days`} />
          <StatCard label="Healthy" value={healthyCount} icon={<IconCheckCircle color="#059669" />} color="#059669" sub={`< ${slaDays} days`} />
        </div>

        {breachRows.length === 0 ? (
          <EmptyState
            icon={<IconCheckCircle color="#059669" />}
            title="No SLA breaches"
            sub={`Every candidate in Applied / Screening has been actioned within ${slaDays} days.`}
          />
        ) : (
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", overflow: "hidden", marginBottom: 24 }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid #f1f5f9", background: "#fff7ed", display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontWeight: 700, color: "#c2410c", fontSize: 14 }}>Active Breaches</span>
              <Badge text={`${breachRows.length} Breaches`} color="#ea580c" />
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
                {breachRows.map((b, i) => (
                  <tr key={i} style={{ borderTop: "1px solid #f1f5f9", background: b.severity === "critical" ? "#fff1f2" : "#fffbeb" }}>
                    <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{b.candidateName || b.candidateEmail || "—"}</td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: "#64748b" }}>{b.jobTitle || "—"}</td>
                    <td style={{ padding: "12px 16px" }}><Badge text={b.pipelineStage} color={STAGE_COLORS[b.pipelineStage] || BRAND} /></td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: b.severity === "critical" ? BRAND_RED : "#d97706" }}>{b.days} days</span>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: "#374151" }}>{b.recruiterName || b.recruiterEmail || "—"}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ background: b.severity === "critical" ? "#fee2e2" : "#fef3c7", color: b.severity === "critical" ? "#991b1b" : "#92400e", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99 }}>
                        {b.severity === "critical" ? "Critical" : "Warning"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <button onClick={() => escalateBreach(b)} style={{ background: BRAND, color: "#fff", border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Escalate</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Avg time-to-action */}
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid #f1f5f9" }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>Avg. Time-to-Action by Recruiter</div>
          </div>
          <div style={{ padding: "16px 20px" }}>
            {liveRecruiters.length === 0 && <div style={{ fontSize: 13, color: "#94a3b8", textAlign: "center", padding: "12px 0" }}>No recruiter data yet</div>}
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
    );
  };

  const renderJobsTable = () => {
    const allRecruiterMgrs = [...new Set(apiJobs.map(j => j.recruiterManager))];
    const allPostedBy = [...new Set(apiJobs.map(j => j.postedBy))];
    const allAssignedTo = [...new Set(apiJobs.map(j => j.assignedTo))];
    const allSelected = paginatedJobs.length > 0 && paginatedJobs.every(j => selectedJobs.includes(j.id));

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

        {/* Bulk selection toolbar (Excel-style) */}
        {selectedJobs.length > 0 && (
          <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: "10px 16px", marginBottom: 12, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: BRAND }}>
              {selectedJobs.length} job{selectedJobs.length > 1 ? "s" : ""} selected
            </span>
            <span style={{ width: 1, height: 22, background: "#bfdbfe" }} />
            <select value={bulkAssignTo} onChange={e => setBulkAssignTo(e.target.value)} disabled={bulkBusy}
              style={{ border: "1px solid #bfdbfe", borderRadius: 6, padding: "5px 8px", fontSize: 12, color: "#374151", background: "#fff", cursor: "pointer", outline: "none" }}>
              <option value="">Assign to recruiter…</option>
              {liveRecruiters.map(r => <option key={r.email} value={r.email}>{r.name} ({r.email})</option>)}
            </select>
            <button onClick={bulkAssignToRecruiter} disabled={bulkBusy || !bulkAssignTo} style={{
              background: BRAND, color: "#fff", border: "none", borderRadius: 6, padding: "6px 14px",
              fontSize: 12, fontWeight: 600, cursor: bulkBusy || !bulkAssignTo ? "not-allowed" : "pointer", opacity: bulkBusy || !bulkAssignTo ? 0.5 : 1,
            }}>
              {bulkBusy ? "Working…" : "Assign Candidates"}
            </button>
            <span style={{ width: 1, height: 22, background: "#bfdbfe" }} />
            <button onClick={() => bulkSetStatus("hold")} disabled={bulkBusy} style={{
              background: "#fff7ed", color: "#9a3412", border: "1px solid #fdba74", borderRadius: 6, padding: "6px 14px",
              fontSize: 12, fontWeight: 600, cursor: bulkBusy ? "not-allowed" : "pointer",
            }}>Hold</button>
            <button onClick={() => bulkSetStatus("close")} disabled={bulkBusy} style={{
              background: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca", borderRadius: 6, padding: "6px 14px",
              fontSize: 12, fontWeight: 600, cursor: bulkBusy ? "not-allowed" : "pointer",
            }}>Close</button>
            {selectedJobRows.every(j => j.status !== "Active") && (
              <button onClick={() => bulkSetStatus("active")} disabled={bulkBusy} style={{
                background: "#ecfdf5", color: "#065f46", border: "1px solid #a7f3d0", borderRadius: 6, padding: "6px 14px",
                fontSize: 12, fontWeight: 600, cursor: bulkBusy ? "not-allowed" : "pointer",
              }}>Reactivate</button>
            )}
            <button onClick={bulkDelete} disabled={bulkBusy} style={{
              background: BRAND_RED, color: "#fff", border: "none", borderRadius: 6, padding: "6px 14px",
              fontSize: 12, fontWeight: 600, cursor: bulkBusy ? "not-allowed" : "pointer", opacity: bulkBusy ? 0.5 : 1,
            }}>
              Delete
            </button>
            <span style={{ width: 1, height: 22, background: "#bfdbfe" }} />
            <button onClick={exportSelectedCSV} disabled={bulkBusy} style={{
              background: "#fff", color: "#374151", border: "1px solid #d1d5db", borderRadius: 6, padding: "6px 14px",
              fontSize: 12, fontWeight: 600, cursor: bulkBusy ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
              Export Selected
            </button>
            <button onClick={() => { setSelectedJobs([]); setBulkAssignTo(""); }} disabled={bulkBusy} style={{
              background: "transparent", color: "#64748b", border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer", marginLeft: "auto", textDecoration: "underline",
            }}>Clear</button>
          </div>
        )}

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
          <button onClick={exportJobsCSV} style={{
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
                          setSelectedJobs(prev => [...new Set([...prev, ...paginatedJobs.map(j => j.id)])]);
                        } else {
                          const pageIds = new Set(paginatedJobs.map(j => j.id));
                          setSelectedJobs(prev => prev.filter(id => !pageIds.has(id)));
                        }
                      }}
                      style={{ cursor: "pointer", accentColor: BRAND }} />
                  </th>
                  <th style={{ ...thStyle("id"), left: 40 }} onClick={() => toggleSort("id")}>
                    Job Code{sortIcon("id")}
                  </th>
                  {(["title", "company", "location"] as const).map(h => (
                    <th key={h} style={{ ...thStyle(h), textAlign: "left" }} onClick={() => toggleSort(h)}>
                      {h === "title" ? "Job Title" : h === "company" ? "Company Name" : "Location"}{sortIcon(h)}
                    </th>
                  ))}
                  <th style={{ ...thStyle("recruiterManager"), textAlign: "left" }}>Recruiter Manager</th>
                  {(["postedBy", "assignedTo"] as const).map(h => {
                    const colKey = h;
                    const hasFilter = (h === "postedBy" ? filterPostedBy : filterAssignedTo).length > 0;
                    const allVals = h === "postedBy" ? allPostedBy : allAssignedTo;
                    const selectedVals = h === "postedBy" ? filterPostedBy : filterAssignedTo;
                    const setVals = h === "postedBy" ? setFilterPostedBy : setFilterAssignedTo;
                    return (
                      <th key={h} style={{ ...thStyle(h), position: "relative" as const }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span>{h === "postedBy" ? "Job Posted By" : "Assigned To"}</span>
                          <button onClick={e => { e.stopPropagation(); setOpenFilter(openFilter === colKey ? null : colKey); }} style={{
                            background: hasFilter ? BRAND : "#dbeafe", border: "none", borderRadius: 3,
                            color: hasFilter ? "#fff" : "#1d4ed8", cursor: "pointer", padding: "2px 7px", fontSize: 10, fontWeight: 700, lineHeight: 1.4, flexShrink: 0
                          }}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg></button>
                        </div>
                        {openFilter === colKey && (
                          <ColumnFilterPopup
                            label={h === "postedBy" ? "Job Posted By" : "Assigned To"}
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
                  <th style={{ ...thStyle("recruiterRole"), textAlign: "left" }}>Recruiter Role</th>
                  <th style={{ ...thStyle("status"), position: "relative" as const }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span onClick={() => toggleSort("status")} style={{ cursor: "pointer" }}>Job Status{sortIcon("status")}</span>
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
                  {(["posted", "applications", "interviewScheduled", "interviewCompleted", "hired", "rejected"] as const).map(h => (
                    <th key={h} style={{ ...thStyle(h), textAlign: ["applications", "interviewScheduled", "interviewCompleted", "hired", "rejected"].includes(h) ? "center" : "left" }} onClick={() => toggleSort(h)}>
                      {h === "posted" ? "Job Posted" : h === "applications" ? "Applications" : h === "interviewScheduled" ? "Interview Scheduled" : h === "interviewCompleted" ? "Interview Completed" : h === "hired" ? "Hired" : "Rejected"}{sortIcon(h)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {jobsLoading ? (
                  <tr><td colSpan={15} style={{ textAlign: "center", padding: "40px", color: "#64748b", fontSize: 13 }}>Loading your job postings...</td></tr>
                ) : paginatedJobs.length === 0 ? (
                  <tr><td colSpan={15} style={{ textAlign: "center", padding: "40px", color: "#94a3b8", fontSize: 13 }}>{apiJobs.length === 0 ? "No job postings found. Post a job to see it here." : "No job postings match your search."}</td></tr>
                ) : paginatedJobs.map((j, i) => {
                  const sc = statusColor(j.status);
                  const isSelected = selectedJobs.includes(j.id);
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
                      <td style={tdStyle}>
                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          <span>{j.recruiterManager}</span>
                        </div>
                      </td>
                      <td style={{ ...tdStyle, color: "#374151" }}>{j.postedBy}</td>
                      <td style={{ ...tdStyle, color: j.assignedTo === "N/A" ? "#94a3b8" : "#0f172a", fontStyle: j.assignedTo === "N/A" ? "italic" : "normal" }}>{j.assignedTo}</td>
                      <td style={tdStyle}>
                        <span style={{ background: roleColor(j.recruiterRole) + "18", color: roleColor(j.recruiterRole), fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 99, border: `1px solid ${roleColor(j.recruiterRole)}30`, whiteSpace: "nowrap" }}>
                          {j.recruiterRole}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ background: sc.bg, color: sc.fg, fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 99, border: `1px solid ${sc.fg}30`, whiteSpace: "nowrap" }}>{j.status}</span>
                      </td>
                      <td style={{ ...tdStyle, color: "#64748b" }}>{j.posted}</td>
                      <td style={{ ...tdStyle, textAlign: "center" }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: "#6366f1" }}>{j.applications}</span>
                      </td>
                      <td style={{ ...tdStyle, textAlign: "center" }}>
                        <span style={{ background: "#fef9c3", color: "#854d0e", fontSize: 13, fontWeight: 700, padding: "3px 12px", borderRadius: 99, display: "inline-block" }}>{j.interviewScheduled}</span>
                      </td>
                      <td style={{ ...tdStyle, textAlign: "center" }}>
                        <span style={{ background: "#f3e8ff", color: "#6b21a8", fontSize: 13, fontWeight: 700, padding: "3px 12px", borderRadius: 99, display: "inline-block" }}>{j.interviewCompleted}</span>
                      </td>
                      <td style={{ ...tdStyle, textAlign: "center" }}>
                        <span style={{ background: "#d1fae5", color: "#065f46", fontSize: 13, fontWeight: 700, padding: "3px 12px", borderRadius: 99, display: "inline-block" }}>{j.hired}</span>
                      </td>
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
            <span style={{ fontSize: 13, color: "#64748b" }}>
              {filteredJobs.length === 0 ? "0 records" : `${Math.min((jobPage - 1) * jobPerPage + 1, filteredJobs.length)} - ${Math.min(jobPage * jobPerPage, filteredJobs.length)} of ${filteredJobs.length}`}
            </span>

            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <button onClick={() => setJobPage(p => Math.max(1, p - 1))} disabled={jobPage === 1} style={{
                height: 30, padding: "0 10px", display: "flex", alignItems: "center", gap: 4,
                border: "1px solid #e2e8f0", borderRadius: 6, background: jobPage === 1 ? "#f9fafb" : "#fff",
                cursor: jobPage === 1 ? "not-allowed" : "pointer",
                color: jobPage === 1 ? "#cbd5e1" : "#374151", fontSize: 12, fontWeight: 500,
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg> Prev
              </button>

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

              <button onClick={() => setJobPage(p => Math.min(totalPages, p + 1))} disabled={jobPage === totalPages} style={{
                height: 30, padding: "0 10px", display: "flex", alignItems: "center", gap: 4,
                border: "1px solid #e2e8f0", borderRadius: 6, background: jobPage === totalPages ? "#f9fafb" : "#fff",
                cursor: jobPage === totalPages ? "not-allowed" : "pointer",
                color: jobPage === totalPages ? "#cbd5e1" : "#374151", fontSize: 12, fontWeight: 500,
              }}>
                Next <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
              </button>
            </div>

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
  };

  return (
    <div style={{ fontFamily: "'IBM Plex Sans', 'Inter', -apple-system, sans-serif", background: "#f8fafc", minHeight: "100vh" }}>

      {/* -- Header -- */}
      <div style={{
        background: `linear-gradient(135deg, #0f1e4d 0%, ${BRAND_DARK} 35%, #1d4ed8 75%, #2563eb 100%)`,
        padding: "28px 40px 22px", color: "#fff", position: "relative", overflow: "hidden",
      }}>
        {/* Decorative glows */}
        <div style={{ position: "absolute", top: -90, right: -50, width: 340, height: 340, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0) 65%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -120, left: "32%", width: 280, height: 280, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.3) 0%, rgba(99,102,241,0) 65%)", pointerEvents: "none" }} />

        <div style={{ position: "relative", display: "flex", alignItems: "center", marginBottom: 24, gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
            {onNavigate && (
              <button
                onClick={() => onNavigate("dashboard")}
                title="Back to dashboard"
                style={{
                  width: 42, height: 42, borderRadius: "50%",
                  background: "rgba(255,255,255,0.12)", border: "1.5px solid rgba(255,255,255,0.3)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", flexShrink: 0, transition: "all 0.2s",
                }}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
            )}
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: "linear-gradient(135deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.08) 100%)",
              border: "1px solid rgba(255,255,255,0.25)",
              boxShadow: "0 4px 14px rgba(2,6,23,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            </div>
            <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", textAlign: "center", maxWidth: "38%", minWidth: 260 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.6px", lineHeight: 1.2, whiteSpace: "nowrap" }}>Recruiter Analytics</div>
                <span style={{ background: "rgba(255,255,255,0.16)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 99, padding: "2px 10px", fontSize: 10.5, fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase", color: "rgba(255,255,255,0.9)", whiteSpace: "nowrap" }}>ATS</span>
              </div>
              <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.75)", marginTop: 4 }}>ZyncJobs ATS — Team Management Dashboard</div>
            </div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <button onClick={() => fetchAts()} disabled={atsLoading} className="atsGlassBtn" style={{
              background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.28)", borderRadius: 10,
              padding: "8px 16px", fontSize: 12.5, fontWeight: 600, cursor: atsLoading ? "wait" : "pointer", color: "#fff",
              display: "flex", alignItems: "center", gap: 7, transition: "all 0.2s",
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={atsLoading ? { animation: "atsSpin 1s linear infinite" } : undefined}><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>
              {atsLoading ? "Refreshing…" : "Refresh"}
              <style>{`@keyframes atsSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </button>
            <div style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.28)", borderRadius: 10, padding: "8px 16px", fontSize: 12.5, fontWeight: 600, display: "flex", alignItems: "center", gap: 7 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
              {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
            </div>
            <div style={{ background: "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)", borderRadius: 10, padding: "8px 16px", fontSize: 12.5, fontWeight: 700, display: "flex", alignItems: "center", gap: 7, boxShadow: "0 4px 12px rgba(220,38,38,0.35)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M6 20v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" /><polyline points="16 3 18 5 22 1" /></svg>
              Admin View
            </div>
          </div>
        </div>

        {/* Tabs — segmented control (centered) */}
        <div style={{ position: "relative", display: "flex", justifyContent: "center", overflowX: "auto", maxWidth: "100%" }}>
          <div style={{
            display: "inline-flex", gap: 4,
            background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.18)",
            borderRadius: 14, padding: 5,
          }}>
          {TABS.map(t => {
            const active = activeTab === t.key;
            return (
              <button key={t.key} onClick={() => setActiveTab(t.key)} className="atsTabBtn" style={{
                background: active ? "#fff" : "transparent",
                color: active ? BRAND_DARK : "rgba(255,255,255,0.8)",
                border: "none", padding: "9px 16px", borderRadius: 10, cursor: "pointer",
                fontSize: 12.5, fontWeight: active ? 700 : 500, whiteSpace: "nowrap",
                transition: "all 0.2s", boxShadow: active ? "0 2px 10px rgba(2,6,23,0.3)" : "none",
                display: "flex", alignItems: "center", gap: 7,
              }}>
                <span style={{ color: active ? BRAND_DARK : "rgba(255,255,255,0.85)", display: "flex" }}>{t.icon}</span>
                <span style={{ color: active ? BRAND_DARK : "rgba(255,255,255,0.85)" }}>{t.label}</span>
                {active && <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#10b981", marginLeft: 2 }} />}
              </button>
            );
          })}
        </div>
        </div>
        <style>{`
          .atsTabBtn:hover { background: rgba(255,255,255,0.14); }
          .atsGlassBtn:hover { background: rgba(255,255,255,0.22); }
        `}</style>
      </div>

      <div style={{ padding: "28px 40px 48px" }}>

        {atsLoading && (
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: "36px", textAlign: "center", color: "#64748b", fontSize: 13, marginBottom: 16 }}>
            Loading live ATS data…
          </div>
        )}

        {/* ---------------- OVERVIEW ---------------- */}
        {activeTab === "overview" && (
          <div>
            <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>Company Analytics Dashboard</div>
                <div style={{ fontSize: 13, color: "#64748b" }}>Full pipeline visibility — all {liveRecruiters.length} recruiters tracked in real time</div>
              </div>
            </div>

            {/* Stats grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 16, marginBottom: 26 }}>
              <StatCard label="Total Recruiters" value={liveRecruiters.length} icon={<IconUsers color="#7c3aed" />} color="#7c3aed" sub="Active team" />
              <StatCard label="Jobs Posted" value={totalJobs} icon={<IconBriefcase color="#0891b2" />} color="#0891b2" sub="Total postings" />
              <StatCard label="Applications" value={totalApps.toLocaleString()} icon={<IconInbox color="#6366f1" />} color="#6366f1" sub="Total received" />
              <StatCard label="Interviews" value={totalInterviews} icon={<IconCalendar color="#f59e0b" />} color="#f59e0b" sub="Scheduled" />
              <StatCard label="Offers Released" value={totalOffers} icon={<IconGift color="#059669" />} color="#059669" sub="Released" />
              <StatCard label="Total Hires" value={totalHires} icon={<IconCheckCircle color={BRAND} />} color={BRAND} sub="Confirmed joins" />
            </div>

            {/* Leaderboard + Pipeline summary */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22, marginBottom: 26 }}>
              {/* Leaderboard */}
              <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", overflow: "hidden" }}>
                <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>Recruiter Leaderboard</div>
                  <Badge text="Top Performers" color="#f59e0b" />
                </div>
                <div style={{ padding: "12px 20px" }}>
                  {sortedLeaderboard.length === 0 && <div style={{ fontSize: 13, color: "#94a3b8", textAlign: "center", padding: "12px 0" }}>No recruiter data yet</div>}
                  {sortedLeaderboard.map((r, i) => (
                    <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < sortedLeaderboard.length - 1 ? "1px solid #f8fafc" : "none" }}>
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
                  {STAGES.map(stage => (
                    <div key={stage} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0" }}>
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: STAGE_COLORS[stage], flexShrink: 0 }} />
                      <div style={{ fontSize: 13, color: "#374151", flex: 1 }}>{stage}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 2 }}>
                        <div style={{ flex: 1, height: 6, background: "#f1f5f9", borderRadius: 99 }}>
                          <div style={{ width: `${Math.min(100, (pipelineCounts[stage] || 0) * 10)}%`, height: "100%", background: STAGE_COLORS[stage], borderRadius: 99 }} />
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", minWidth: 20 }}>{pipelineCounts[stage] || 0}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* SLA Alert banner */}
            {slaBreaches.length > 0 ? (
              <div style={{ background: "linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)", border: "1px solid #fecdd3", borderRadius: 14, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={BRAND_RED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#881337" }}>{slaBreaches.length} candidate{slaBreaches.length > 1 ? "s" : ""} breaching SLA</div>
                    <div style={{ fontSize: 12, color: "#9f1239" }}>No action taken within the {slaDays}-day window — review the SLA tab</div>
                  </div>
                </div>
                <button onClick={() => setActiveTab("sla")} style={{ background: BRAND_RED, color: "#fff", border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  View SLA
                </button>
              </div>
            ) : (
              <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: 14, padding: "16px 20px", display: "flex", alignItems: "center", gap: 12 }}>
                <IconCheckCircle color="#059669" />
                <div style={{ fontSize: 13, fontWeight: 600, color: "#065f46" }}>No SLA breaches — all candidates are within the {slaDays}-day action window.</div>
              </div>
            )}
          </div>
        )}

        {/* ---------------- PIPELINE (KANBAN) ---------------- */}
        {activeTab === "pipeline" && (
          <div>
            <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>Candidate Pipeline</div>
                <div style={{ fontSize: 13, color: "#64748b" }}>Drag-free kanban — use the arrow to move candidates to the next stage</div>
              </div>
              <button onClick={() => fetchAts()} disabled={pipelineLoading} style={{
                background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 16px",
                fontSize: 12, fontWeight: 600, cursor: "pointer", color: "#374151",
              }}>{pipelineLoading ? "Refreshing…" : "Refresh Pipeline"}</button>
            </div>

            {Object.keys(pipelineData).length === 0 ? (
              <EmptyState
                icon={<IconBriefcase color={BRAND} />}
                title="No candidates in the pipeline yet"
                sub="Assign candidates to recruiters to start building your pipeline."
              />
            ) : (
              <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 12 }}>
                {STAGES.map(stage => {
                  const cards = pipelineData[stage] || [];
                  return (
                    <div key={stage} style={{ flex: "0 0 260px", background: "#f1f5f9", borderRadius: 12, border: "1px solid #e2e8f0" }}>
                      <div style={{ padding: "12px 14px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 10, height: 10, borderRadius: "50%", background: STAGE_COLORS[stage] }} />
                          <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{stage}</span>
                        </div>
                        <span style={{ background: STAGE_COLORS[stage] + "20", color: STAGE_COLORS[stage], fontSize: 11, fontWeight: 800, padding: "2px 8px", borderRadius: 99 }}>{cards.length}</span>
                      </div>
                      <div style={{ padding: "10px", minHeight: 120 }}>
                        {cards.length === 0 && (
                          <div style={{ fontSize: 12, color: "#94a3b8", textAlign: "center", padding: "24px 0" }}>No candidates</div>
                        )}
                        {cards.map(a => {
                          const idx = STAGES.indexOf(stage);
                          const next = idx < STAGES.length - 1 ? STAGES[idx + 1] : null;
                          const days = daysSince(a.updatedAt);
                          const isOpen = noteOpenId === a.id;
                          return (
                            <div key={a.id} style={{ background: "#fff", borderRadius: 10, border: "1px solid #e2e8f0", padding: "12px", marginBottom: 10, boxShadow: "0 1px 3px rgba(30,64,175,0.06)" }}>
                              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                                <div style={{ minWidth: 0 }}>
                                  <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.candidateName || a.candidateEmail}</div>
                                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.jobTitle || "—"}</div>
                                </div>
                                <span style={{ fontSize: 11, fontWeight: 700, color: days > 3 ? BRAND_RED : "#94a3b8", whiteSpace: "nowrap" }}>{days}d</span>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 8 }}>
                                <Avatar initials={initialsOf(a.recruiterName || a.recruiterEmail)} color={BRAND} size={18} />
                                <span style={{ fontSize: 11, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.recruiterName || a.recruiterEmail || "Unassigned"}</span>
                              </div>
                              <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                                <button onClick={() => { setNoteOpenId(isOpen ? null : a.id); setNoteText(""); }}
                                  style={{ flex: 1, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 6, padding: "5px 0", fontSize: 11, fontWeight: 600, cursor: "pointer", color: "#374151" }}>
                                  {isOpen ? "Close" : "Follow up"}
                                </button>
                                {next && (
                                  <button onClick={() => moveAssignment(a.id, next)} disabled={movingId === a.id}
                                    style={{ flex: 1, background: STAGE_COLORS[next] + "18", border: `1px solid ${STAGE_COLORS[next]}40`, borderRadius: 6, padding: "5px 0", fontSize: 11, fontWeight: 700, cursor: movingId === a.id ? "wait" : "pointer", color: STAGE_COLORS[next] }}>
                                    {movingId === a.id ? "Moving…" : `Move → ${next}`}
                                  </button>
                                )}
                              </div>
                              {isOpen && (
                                <div style={{ marginTop: 8 }}>
                                  <textarea value={noteText} onChange={e => setNoteText(e.target.value)}
                                    placeholder="Follow-up note (call, email, meeting…)"
                                    rows={2}
                                    style={{ width: "100%", boxSizing: "border-box", border: "1px solid #e2e8f0", borderRadius: 6, padding: "7px 9px", fontSize: 12, color: "#374151", outline: "none", resize: "vertical", fontFamily: "inherit" }} />
                                  <button onClick={() => logFollowUp(a)} disabled={!noteText.trim()}
                                    style={{ marginTop: 6, width: "100%", background: BRAND, color: "#fff", border: "none", borderRadius: 6, padding: "6px 0", fontSize: 11, fontWeight: 700, cursor: noteText.trim() ? "pointer" : "not-allowed", opacity: noteText.trim() ? 1 : 0.5 }}>
                                    Save Follow-up
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ---------------- ACTIVITY ---------------- */}
        {activeTab === "activity" && (
          <div>
            <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>Team Activity Timeline</div>
                <div style={{ fontSize: 13, color: "#64748b" }}>Recent actions by every recruiter — latest 50 events</div>
              </div>
              <button onClick={() => fetchAts()} disabled={activityLoading} style={{
                background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 16px",
                fontSize: 12, fontWeight: 600, cursor: "pointer", color: "#374151",
              }}>{activityLoading ? "Refreshing…" : "Refresh Activity"}</button>
            </div>

            {activityLogs.length === 0 ? (
              <EmptyState
                icon={<IconCalendar color={BRAND} />}
                title="No activity recorded yet"
                sub="Actions like job posting, candidate moves, notes and escalations will appear here."
              />
            ) : (
              <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: "20px 24px" }}>
                {activityLogs.map((log, i) => {
                  const color = AVATAR_COLORS[i % AVATAR_COLORS.length];
                  return (
                    <div key={log.id || i} style={{ display: "flex", gap: 14, padding: "12px 0", borderBottom: i < activityLogs.length - 1 ? "1px solid #f8fafc" : "none" }}>
                      <Avatar initials={initialsOf(log.userName || log.userEmail)} color={color} size={36} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>
                          {log.userName || log.userEmail}
                          <span style={{ fontWeight: 400, color: "#64748b" }}> {log.action}</span>
                          {log.entityName && <span style={{ fontWeight: 400, color: "#94a3b8" }}> — {log.entityName}</span>}
                        </div>
                        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 3 }}>{fmtDateTime(log.createdAt)}</div>
                      </div>
                      <Badge text={log.module || "general"} color={log.module === "pipeline" ? "#7c3aed" : log.module === "assignment" ? "#059669" : log.module === "sla" ? BRAND_RED : log.module === "team" ? "#d97706" : "#0891b2"} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ---------------- TEAM ---------------- */}
        {activeTab === "team" && (
          <div>
            <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>Team Members &amp; Roles</div>
                <div style={{ fontSize: 13, color: "#64748b" }}>Manage recruiter roles and permissions</div>
              </div>
              <button onClick={() => { if (onNavigate) onNavigate("team"); else notify("Open the Team page from your dashboard to add members"); }} style={{
                background: `linear-gradient(135deg, ${BRAND_DARK} 0%, #2563eb 100%)`, color: "#fff", border: "none", borderRadius: 8,
                padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}>
                + Add Member
              </button>
            </div>

            {teamLoading ? (
              <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: "36px", textAlign: "center", color: "#64748b", fontSize: 13 }}>Loading team…</div>
            ) : teamMembers.length === 0 ? (
              <EmptyState
                icon={<IconUsers color={BRAND} />}
                title="No team members yet"
                sub="Invite recruiters from the Team page in your employer dashboard."
              />
            ) : (
              <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc" }}>
                      {["Member", "Email", "Role", "Permissions", "Added On", "Action"].map(h => (
                        <th key={h} style={{ padding: "12px 16px", fontSize: 11, fontWeight: 700, color: "#64748b", textAlign: "left", letterSpacing: "0.5px", textTransform: "uppercase" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {teamMembers.map((m, i) => {
                      const p = m.permissions || { canPost: false, canAssign: false, canViewAll: false, canApprove: false, label: "Viewer" };
                      return (
                        <tr key={m.id} style={{ borderTop: "1px solid #f1f5f9", background: i % 2 ? "#fafafa" : "#fff" }}>
                          <td style={{ padding: "12px 16px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <Avatar initials={initialsOf(m.memberName)} color={AVATAR_COLORS[i % AVATAR_COLORS.length]} size={30} />
                              <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{m.memberName}</span>
                            </div>
                          </td>
                          <td style={{ padding: "12px 16px", fontSize: 12, color: "#64748b" }}>{m.memberEmail}</td>
                          <td style={{ padding: "12px 16px" }}>
                            <Badge text={m.role} color={m.role === "Owner" ? BRAND_RED : m.role === "Team Lead" ? "#d97706" : "#059669"} />
                          </td>
                          <td style={{ padding: "12px 16px", fontSize: 11, color: "#64748b" }}>
                            {[p.canPost ? "Post" : null, p.canAssign ? "Assign" : null, p.canViewAll ? "View All" : null, p.canApprove ? "Approve" : null].filter(Boolean).join(", ") || "View only"}
                          </td>
                          <td style={{ padding: "12px 16px", fontSize: 12, color: "#64748b" }}>{fmtDate(m.createdAt)}</td>
                          <td style={{ padding: "12px 16px" }}>
                            <select
                              value={m.role}
                              onChange={e => changeRole(m, e.target.value)}
                              style={{ border: "1px solid #e2e8f0", borderRadius: 6, padding: "5px 8px", fontSize: 12, color: "#374151", background: "#fff", cursor: "pointer", outline: "none" }}
                            >
                              {roleOptions.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ---------------- SLA ---------------- */}
        {activeTab === "sla" && renderSlaTable()}

        {/* ---------------- JOB POSTINGS ---------------- */}
        {activeTab === "jobs" && renderJobsTable()}

        {/* ---------------- AUDIT ---------------- */}
        {activeTab === "audit" && (
          <div>
            <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>Audit Logs — Complete Audit Trail</div>
                <div style={{ fontSize: 13, color: "#64748b" }}>Every action, by every user, with IP address and timestamp</div>
              </div>
              <button onClick={exportAuditCSV} disabled={filteredAudit.length === 0} style={{
                background: `linear-gradient(135deg, ${BRAND_DARK} 0%, #2563eb 100%)`, color: "#fff", border: "none", borderRadius: 8,
                padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: filteredAudit.length === 0 ? "not-allowed" : "pointer", opacity: filteredAudit.length === 0 ? 0.5 : 1,
                display: "flex", alignItems: "center", gap: 7,
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                Export CSV
              </button>
            </div>

            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "14px 20px", marginBottom: 16, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>Filter:</span>
              <select value={auditUserFilter} onChange={e => setAuditUserFilter(e.target.value)} style={{ fontSize: 12, border: "1px solid #e2e8f0", borderRadius: 6, padding: "5px 10px", color: "#374151", background: "#fff", cursor: "pointer" }}>
                <option value="">All Users</option>
                {[...new Set(auditLogs.map(l => l.userName || l.userEmail))].map(u => <option key={u} value={u}>{u}</option>)}
              </select>
              <select value={auditModuleFilter} onChange={e => setAuditModuleFilter(e.target.value)} style={{ fontSize: 12, border: "1px solid #e2e8f0", borderRadius: 6, padding: "5px 10px", color: "#374151", background: "#fff", cursor: "pointer" }}>
                <option value="">All Modules</option>
                {[...new Set(auditLogs.map(l => l.module))].map(mo => <option key={mo} value={mo}>{mo}</option>)}
              </select>
              <select value={auditPeriodFilter} onChange={e => setAuditPeriodFilter(e.target.value)} style={{ fontSize: 12, border: "1px solid #e2e8f0", borderRadius: 6, padding: "5px 10px", color: "#374151", background: "#fff", cursor: "pointer" }}>
                <option value="">All time</option>
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
              </select>
            </div>

            {auditLoading ? (
              <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: "36px", textAlign: "center", color: "#64748b", fontSize: 13 }}>Loading audit log…</div>
            ) : filteredAudit.length === 0 ? (
              <EmptyState
                icon={<IconInbox color={BRAND} />}
                title={auditLogs.length === 0 ? "No audit records yet" : "No records match your filters"}
                sub="Job posting, candidate moves, role changes and escalations are logged here automatically."
              />
            ) : (
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
                    {filteredAudit.map((log, i) => (
                      <tr key={log.id || i} style={{ borderTop: "1px solid #f1f5f9", background: i % 2 ? "#fafafa" : "#fff" }}>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <Avatar initials={initialsOf(log.userName || log.userEmail)} color={AVATAR_COLORS[i % AVATAR_COLORS.length]} size={28} />
                            <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{log.userName || log.userEmail}</span>
                          </div>
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: 12, color: "#374151", fontWeight: 500 }}>{log.action}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <Badge text={log.module} color={log.module === "Jobs" ? "#0891b2" : log.module === "Pipeline" || log.module === "pipeline" ? "#7c3aed" : log.module === "Team" || log.module === "team" ? "#059669" : log.module === "sla" ? BRAND_RED : "#d97706"} />
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: 12, color: "#64748b" }}>{log.entityName || "—"}</td>
                        <td style={{ padding: "12px 16px", fontSize: 12, fontFamily: "monospace", color: "#94a3b8" }}>{log.ip || "—"}</td>
                        <td style={{ padding: "12px 16px", fontSize: 12, color: "#374151" }}>{fmtDateTime(log.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ padding: "12px 20px", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: "#94a3b8" }}>Showing {filteredAudit.length} of {auditLogs.length} records</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ---------------- PERFORMANCE ---------------- */}
        {activeTab === "performance" && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>Recruiter Performance &amp; KPIs</div>
              <div style={{ fontSize: 13, color: "#64748b" }}>Live metrics per recruiter — applications, interviews, hires and response rates</div>
            </div>

            {/* Chart */}
            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: "16px 20px", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>Recruiter Comparison</div>
                <select value={selectedRecruiter ?? ""} onChange={e => setSelectedRecruiter(e.target.value || null)}
                  style={{ border: "1px solid #e2e8f0", borderRadius: 6, padding: "5px 10px", fontSize: 12, color: "#374151", background: "#fff", cursor: "pointer", outline: "none" }}>
                  <option value="">All Recruiters</option>
                  {liveRecruiters.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div style={{ height: 300, position: "relative" }}>
                <canvas ref={chartRef} />
              </div>
            </div>

            {/* Per-recruiter KPI cards */}
            {liveRecruiters.length === 0 ? (
              <EmptyState
                icon={<IconUsers color={BRAND} />}
                title="No recruiter performance data yet"
                sub="Performance metrics appear once recruiters start posting jobs and managing candidates."
              />
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 16, marginBottom: 20 }}>
                {liveRecruiters.map(r => {
                  const maxApps = Math.max(1, ...liveRecruiters.map(x => x.apps));
                  return (
                    <div key={r.id} style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: "18px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                        <Avatar initials={r.initials} color={r.color} size={40} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{r.name}</div>
                          <div style={{ fontSize: 11, color: "#94a3b8" }}>{r.role}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 18, fontWeight: 800, color: r.responseRate >= 70 ? "#059669" : r.responseRate >= 50 ? "#d97706" : BRAND_RED }}>{r.responseRate}%</div>
                          <div style={{ fontSize: 10, color: "#94a3b8" }}>response rate</div>
                        </div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 24px" }}>
                        <div>
                          <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>Jobs Posted</div>
                          <KPIBar value={r.jobs} max={Math.max(1, ...liveRecruiters.map(x => x.jobs))} color="#f59e0b" />
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>Applications</div>
                          <KPIBar value={r.apps} max={maxApps} color="#6366f1" />
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>Interviews</div>
                          <KPIBar value={r.interviews} max={maxApps} color="#0891b2" />
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>Hires</div>
                          <KPIBar value={r.hires} max={Math.max(1, ...liveRecruiters.map(x => x.hires))} color="#059669" />
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>Offers Released</div>
                          <KPIBar value={r.offers} max={Math.max(1, ...liveRecruiters.map(x => x.hires))} color="#f97316" />
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>Candidates Contacted</div>
                          <KPIBar value={r.contacted} max={maxApps} color="#8b5cf6" />
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>Avg. Time-to-Action</div>
                          <KPIBar value={r.avgDays} max={25} color={r.avgDays <= 12 ? "#10b981" : r.avgDays <= 18 ? "#f59e0b" : "#ef4444"} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pending follow-ups (real pipeline data) */}
            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>Pending Follow-ups</div>
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>Candidates awaiting action in Applied / Screening</div>
                </div>
                <Badge text={`${pendingFollowUps.length} pending`} color={pendingFollowUps.length > 0 ? "#d97706" : "#059669"} />
              </div>
              <div style={{ padding: "12px 20px" }}>
                {pendingFollowUps.length === 0 ? (
                  <div style={{ fontSize: 13, color: "#94a3b8", textAlign: "center", padding: "16px 0" }}>All candidates are being actioned. Nothing pending.</div>
                ) : (
                  pendingFollowUps.map(a => {
                    const isOpen = noteOpenId === a.id;
                    return (
                      <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid #f8fafc" }}>
                        <Avatar initials={initialsOf(a.candidateName || a.candidateEmail)} color={STAGE_COLORS[a.pipelineStage] || BRAND} size={32} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {a.candidateName || a.candidateEmail}
                            <span style={{ fontWeight: 400, color: "#94a3b8" }}> — {a.jobTitle || "—"}</span>
                          </div>
                          <div style={{ fontSize: 11, color: "#94a3b8" }}>
                            {a.recruiterName || a.recruiterEmail || "Unassigned"} · {daysSince(a.updatedAt)} days in {a.pipelineStage}
                          </div>
                        </div>
                        <button onClick={() => { setNoteOpenId(isOpen ? null : a.id); setNoteText(""); }}
                          style={{ background: "#fff7ed", border: "1px solid #fdba74", borderRadius: 6, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", color: "#9a3412", whiteSpace: "nowrap" }}>
                          {isOpen ? "Close" : "Follow up"}
                        </button>
                      </div>
                    );
                  })
                )}
                {noteOpenId && (() => {
                  const a = pendingFollowUps.find(x => x.id === noteOpenId);
                  if (!a) return null;
                  return (
                    <div style={{ marginTop: 10, background: "#fff7ed", border: "1px solid #fdba74", borderRadius: 10, padding: "12px" }}>
                      <textarea value={noteText} onChange={e => setNoteText(e.target.value)}
                        placeholder={`Follow-up note for ${a.candidateName || a.candidateEmail}…`}
                        rows={2}
                        style={{ width: "100%", boxSizing: "border-box", border: "1px solid #fdba74", borderRadius: 6, padding: "7px 9px", fontSize: 12, color: "#374151", outline: "none", resize: "vertical", fontFamily: "inherit" }} />
                      <button onClick={() => logFollowUp(a)} disabled={!noteText.trim()}
                        style={{ marginTop: 6, background: "#ea580c", color: "#fff", border: "none", borderRadius: 6, padding: "7px 18px", fontSize: 12, fontWeight: 700, cursor: noteText.trim() ? "pointer" : "not-allowed", opacity: noteText.trim() ? 1 : 0.5 }}>
                        Save Follow-up
                      </button>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

      </div>

      {toast && <Toast msg={toast} />}
    </div>
  );
}