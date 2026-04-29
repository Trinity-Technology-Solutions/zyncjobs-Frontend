import React, { useState, useEffect } from 'react';
import {
  Shield, Download, Trash2, ToggleLeft, ToggleRight,
  Loader, History, ChevronRight, AlertTriangle,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BackButton from '../components/BackButton';
import { accountAPI } from '../api/account';

interface Props {
  onNavigate: (page: string) => void;
  user?: any;
  onLogout?: () => void;
}

interface PrivacySettings {
  storeResume: boolean;
  allowEmployerView: boolean;
  receiveJobAlerts: boolean;
  allowAIRecommendations: boolean;
}

const CANDIDATE_TOGGLES: { key: keyof PrivacySettings; label: string; desc: string }[] = [
  { key: 'storeResume',            label: 'Store my resume',                 desc: 'Allow ZyncJobs to securely store your resume for job matching.' },
  { key: 'allowEmployerView',      label: 'Allow employers to view profile',  desc: 'Employers can discover and view your profile in search results.' },
  { key: 'receiveJobAlerts',       label: 'Receive job alerts',              desc: 'Get email notifications about new matching job opportunities.' },
  { key: 'allowAIRecommendations', label: 'Allow AI-based recommendations',  desc: 'Your resume data may be processed by AI to improve job recommendations.' },
];

const EMPLOYER_TOGGLES: { key: keyof PrivacySettings; label: string; desc: string }[] = [
  { key: 'storeResume',            label: 'Store company profile',              desc: 'Allow ZyncJobs to securely store your company profile for candidate discovery.' },
  { key: 'allowEmployerView',      label: 'Allow candidates to view company',   desc: 'Candidates can discover and view your company profile in search results.' },
  { key: 'receiveJobAlerts',       label: 'Receive application alerts',         desc: 'Get email notifications about new candidate applications to your job postings.' },
  { key: 'allowAIRecommendations', label: 'Allow AI-based candidate matching',  desc: 'Your job data may be processed by AI to improve candidate recommendations.' },
];

const CANDIDATE_STORAGE_KEY = 'zync_privacy_settings';
const EMPLOYER_STORAGE_KEY = 'zync_employer_privacy_settings';

const DEFAULT_SETTINGS: PrivacySettings = {
  storeResume: true,
  allowEmployerView: true,
  receiveJobAlerts: true,
  allowAIRecommendations: true,
};



type Tab = 'settings' | 'history';

const loadLocalSettings = (storageKey: string): PrivacySettings => {
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored) return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
  } catch { /* ignore */ }
  return { ...DEFAULT_SETTINGS };
};

const saveLocalSettings = (s: PrivacySettings, storageKey: string) => {
  try { localStorage.setItem(storageKey, JSON.stringify(s)); } catch { /* ignore */ }
};

const PrivacySettingsPage: React.FC<Props> = ({ onNavigate, user: propUser, onLogout }) => {
  const storedUser = (() => { try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; } })();
  const isEmployer = (propUser?.type || propUser?.userType || propUser?.role || storedUser?.userType || storedUser?.role || storedUser?.type) === 'employer';
  const TOGGLES = isEmployer ? EMPLOYER_TOGGLES : CANDIDATE_TOGGLES;
  const STORAGE_KEY = isEmployer ? EMPLOYER_STORAGE_KEY : CANDIDATE_STORAGE_KEY;
  const [tab, setTab]               = useState<Tab>('settings');
  const [settings, setSettings]     = useState<PrivacySettings>(() => loadLocalSettings(STORAGE_KEY));
  const [loading, setLoading]       = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [deleting, setDeleting]     = useState(false);
  const [msg, setMsg]               = useState<{ text: string; ok: boolean } | null>(null);

  const flash = (text: string, ok: boolean) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 4000);
  };

  // Try to sync with backend on mount — only apply if local storage has no saved settings yet
  useEffect(() => {
    const hasLocalSettings = !!localStorage.getItem(STORAGE_KEY);
    if (hasLocalSettings) { setLoading(false); return; }
    const API = import.meta.env.VITE_API_URL || '/api';
    const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken') || '';
    fetch(`${API}/gdpr/privacy-settings`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          const merged = { ...DEFAULT_SETTINGS, ...data };
          setSettings(merged);
          saveLocalSettings(merged, STORAGE_KEY);
        }
      })
      .catch(() => { /* use localStorage */ })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = (key: keyof PrivacySettings) => {
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    saveLocalSettings(updated, STORAGE_KEY);
    flash('Settings saved.', true);

    // Best-effort backend sync — no error shown if it fails
    const API = import.meta.env.VITE_API_URL || '/api';
    const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken') || '';
    fetch(`${API}/gdpr/privacy-settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(updated),
    }).catch(() => { /* silent — already saved locally */ });
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const storedProfile = (() => { try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; } })();
      const baseProfile = propUser || storedProfile;
      const API = import.meta.env.VITE_API_URL || '/api';
      const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken') || '';
      const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

      // ── Fetch fresh full profile from backend ──
      let profile = { ...baseProfile };
      try {
        const userId = baseProfile.id || baseProfile._id;
        const email = baseProfile.email || '';
        if (userId || email) {
          // Fetch both user record and profile record in parallel
          const [userRes, profileRes] = await Promise.all([
            userId ? fetch(`${API}/users/${userId}`, { headers: authHeaders }) : Promise.resolve(null),
            fetch(`${API}/profile/${encodeURIComponent(userId || email)}`, { headers: authHeaders }),
          ]);
          if (userRes && userRes.ok) {
            const userData = await userRes.json();
            // User table has: companyName, company, phone, location, companyWebsite
            profile = { ...profile, ...userData };
          }
          if (profileRes && profileRes.ok) {
            const profileData = await profileRes.json();
            // Profile table may have more up-to-date companyName, phone, location
            profile = {
              ...profile,
              companyName: profileData.companyName || profile.companyName || profile.company || '',
              phone: profileData.phone || profile.phone || '',
              location: profileData.location || profile.location || '',
              industry: profileData.industry || profile.industry || '',
              companySize: profileData.companySize || profile.companySize || '',
              companyWebsite: profileData.companyWebsite || profile.companyWebsite || '',
            };
          }
        }
      } catch { /* use stored profile */ }

      // ── Fetch real-time jobs & applications ──
      let jobs: any[] = [];
      let applications: any[] = [];
      try {
        const email = profile.email || '';
        const employerId = profile.employerId || '';
        const [jobsRes, appsRes] = await Promise.all([
          fetch(`${API}/jobs?employerEmail=${encodeURIComponent(email)}&limit=100`, { headers: authHeaders }),
          fetch(`${API}/applications?employerEmail=${encodeURIComponent(email)}&limit=200`, { headers: authHeaders }),
        ]);
        if (jobsRes.ok) {
          const allJobs = await jobsRes.json();
          const arr: any[] = Array.isArray(allJobs) ? allJobs : (allJobs.jobs || []);
          jobs = arr.filter((j: any) =>
            j.employerEmail?.toLowerCase() === email.toLowerCase() ||
            j.postedBy?.toLowerCase() === email.toLowerCase() ||
            (employerId && j.employerId === employerId)
          );
        }
        if (appsRes.ok) {
          const appsData = await appsRes.json();
          const allApps: any[] = appsData.applications || (Array.isArray(appsData) ? appsData : []);
          applications = allApps.filter((a: any) =>
            a.employerEmail?.toLowerCase() === email.toLowerCase() ||
            (employerId && a.employerId === employerId)
          );
        }
      } catch { /* use empty arrays */ }

      // Build job title lookup map: jobId -> jobTitle
      const jobTitleMap: Record<string, string> = {};
      jobs.forEach((j: any) => {
        const id = j.id || j._id;
        if (id) jobTitleMap[id] = j.jobTitle || j.title || '';
      });
      // Also fetch individual job titles for applications whose jobId isn't in our jobs list
      const missingJobIds = [...new Set(
        applications
          .filter((a: any) => a.jobId && !jobTitleMap[a.jobId])
          .map((a: any) => a.jobId)
      )];
      if (missingJobIds.length > 0) {
        await Promise.all(missingJobIds.map(async (jobId: string) => {
          try {
            const jRes = await fetch(`${API}/jobs/${jobId}`, { headers: authHeaders });
            if (jRes.ok) {
              const jData = await jRes.json();
              jobTitleMap[jobId] = jData.jobTitle || jData.title || '';
            }
          } catch { /* skip */ }
        }));
      }

      // ── Build PDF ──
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 18;
      const contentW = pageW - margin * 2;
      let y = 0;

      const addPage = () => { doc.addPage(); y = margin + 4; };
      const checkY = (needed = 10) => { if (y + needed > pageH - 16) addPage(); };

      const sectionTitle = (text: string) => {
        checkY(14);
        doc.moveDown && null;
        y += 3;
        doc.setFillColor(30, 64, 175);
        doc.rect(margin, y, contentW, 9, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(255, 255, 255);
        doc.text(text, margin + 4, y + 6);
        doc.setTextColor(30, 30, 30);
        y += 13;
      };

      const LABEL_W = 55;
      const VAL_X = margin + LABEL_W;

      const row = (label: string, value: string, indent = 0) => {
        const displayVal = (value && value.trim() && value !== 'undefined') ? value.trim() : 'N/A';
        checkY(8);
        const rowY = y;
        // Zebra stripe
        doc.setFillColor(248, 250, 252);
        doc.rect(margin + indent, rowY - 2, contentW - indent, 7, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(55, 65, 81);
        doc.text(label, margin + indent + 3, rowY + 3);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(displayVal === 'N/A' ? 156 : 30, displayVal === 'N/A' ? 163 : 30, displayVal === 'N/A' ? 175 : 30);
        const lines = doc.splitTextToSize(displayVal, contentW - LABEL_W - indent - 6);
        doc.text(lines, VAL_X + indent, rowY + 3);
        y += Math.max(lines.length * 5.5, 8);
      };

      const divider = () => {
        checkY(5);
        doc.setDrawColor(226, 232, 240);
        doc.line(margin, y, margin + contentW, y);
        y += 5;
      };

      // ── HEADER ── — logo only, no duplicate text
      doc.setFillColor(30, 64, 175);
      doc.rect(0, 0, pageW, 32, 'F');

      // ZyncJobs logo — centered vertically in header
      let logoLoaded = false;
      try {
        const logoUrl = `${window.location.origin}/images/zyncjobs-logo.png`;
        const logoRes = await fetch(logoUrl);
        if (logoRes.ok) {
          const blob = await logoRes.blob();
          const reader = new FileReader();
          await new Promise<void>(resolve => {
            reader.onload = () => {
              try {
                // Large logo — left side of header
                doc.addImage(reader.result as string, 'PNG', margin, 4, 52, 24);
                logoLoaded = true;
              } catch { /* skip */ }
              resolve();
            };
            reader.readAsDataURL(blob);
          });
        }
      } catch { /* skip logo */ }

      // Fallback text if logo fails
      if (!logoLoaded) {
        doc.setFont('helvetica', 'bold'); doc.setFontSize(20); doc.setTextColor(255, 255, 255);
        doc.text('ZYNC', margin, 20);
        doc.setTextColor(251, 146, 60);
        doc.text('JOBS', margin + 22, 20);
      }

      // Right side meta
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(191, 219, 254);
      doc.text('Data Export Report  ·  GDPR Art. 20 — Portability', pageW - margin, 14, { align: 'right' });
      doc.setFontSize(7.5);
      doc.setTextColor(147, 197, 253);
      doc.text(`Generated: ${new Date().toLocaleString()}`, pageW - margin, 22, { align: 'right' });
      y = 40;

      // ── COMPANY PROFILE ──
      sectionTitle('COMPANY PROFILE');
      const companyName = profile.companyName || profile.company || profile.organizationName || '';
      const phone = profile.phone || profile.phoneNumber || profile.contactPhone || '';
      const location = profile.location || profile.city || profile.address || '';
      const website = profile.companyWebsite || profile.website || profile.websiteUrl || '';
      const industry = profile.industry || profile.sector || '';
      const companySize = profile.companySize || profile.employeeCount || profile.size || '';
      row('Company Name', companyName);
      row('Contact Name', profile.name || profile.fullName || '');
      row('Email', profile.email || '');
      row('Phone', phone);
      row('Location', location);
      row('Website', website);
      row('Industry', industry);
      row('Company Size', companySize);
      row('Account Role', (profile.role || profile.userType || 'Employer').charAt(0).toUpperCase() + (profile.role || profile.userType || 'employer').slice(1));
      y += 4;

      // ── PRIVACY SETTINGS ──
      sectionTitle('PRIVACY SETTINGS');
      const privacyRows = isEmployer ? [
        ['Store Company Profile',       settings.storeResume],
        ['Allow Candidates to View',    settings.allowEmployerView],
        ['Receive Application Alerts',  settings.receiveJobAlerts],
        ['AI-Based Candidate Matching', settings.allowAIRecommendations],
      ] : [
        ['Store My Resume',             settings.storeResume],
        ['Allow Employers to View',     settings.allowEmployerView],
        ['Receive Job Alerts',          settings.receiveJobAlerts],
        ['AI-Based Recommendations',    settings.allowAIRecommendations],
      ];
      const BADGE_X = margin + contentW - 28; // right-aligned badge
      privacyRows.forEach(([label, val], idx) => {
        checkY(9);
        const rowY = y;
        if (idx % 2 === 0) { doc.setFillColor(248, 250, 252); doc.rect(margin, rowY - 2, contentW, 9, 'F'); }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(55, 65, 81);
        doc.text(String(label), margin + 4, rowY + 3.5);
        const enabled = val === true;
        doc.setFillColor(enabled ? 22 : 220, enabled ? 163 : 38, enabled ? 74 : 38);
        const badgeW = 24;
        doc.roundedRect(BADGE_X, rowY - 1, badgeW, 7, 2, 2, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(255, 255, 255);
        doc.text(enabled ? 'ENABLED' : 'DISABLED', BADGE_X + badgeW / 2, rowY + 3.5, { align: 'center' });
        doc.setTextColor(30, 30, 30);
        y += 9;
      });
      y += 4;

      // ── JOB POSTINGS ──
      sectionTitle(`JOB POSTINGS  (${jobs.length} total)`);
      if (jobs.length === 0) {
        doc.setFont('helvetica', 'italic'); doc.setFontSize(9); doc.setTextColor(150, 150, 150);
        doc.text('No job postings found.', margin + 4, y); y += 8;
      } else {
        jobs.slice(0, 30).forEach((job: any, i: number) => {
          checkY(35);
          doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(30, 64, 175);
          doc.text(`${i + 1}. ${job.jobTitle || job.title || 'Untitled'}`, margin + 4, y);
          y += 7;
          row('Status',   (job.status || 'active').charAt(0).toUpperCase() + (job.status || 'active').slice(1), 4);
          row('Location', job.location || job.jobLocation || '', 4);
          row('Type',     job.jobType || job.employmentType || '', 4);
          row('Posted',   job.createdAt ? new Date(job.createdAt).toLocaleDateString() : '', 4);

          // Per-job hiring summary
          const jobApps = applications.filter((a: any) => a.jobId === (job.id || job._id));
          if (jobApps.length > 0) {
            checkY(12);
            y += 2;
            doc.setFillColor(239, 246, 255);
            doc.rect(margin + 4, y - 1, contentW - 4, 8, 'F');
            doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(30, 64, 175);
            doc.text(`HIRING DATA  (${jobApps.length} application${jobApps.length !== 1 ? 's' : ''})`, margin + 8, y + 4.5);
            y += 11;
            const sc: Record<string, number> = {};
            jobApps.forEach((a: any) => { const s = a.status || 'pending'; sc[s] = (sc[s] || 0) + 1; });
            const hiredInJob = sc['hired'] || 0;
            doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(55, 65, 81);
            doc.text('Summary:', margin + 8, y); y += 5;
            Object.entries(sc).forEach(([st, cnt]) => {
              checkY(5);
              doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5);
              const isHired = st === 'hired';
              doc.setTextColor(isHired ? 22 : 55, isHired ? 163 : 65, isHired ? 74 : 81);
              doc.text(`${st.charAt(0).toUpperCase() + st.slice(1)}: ${cnt}${isHired ? ' ✓' : ''}`, margin + 14, y); y += 5;
            });
            if (hiredInJob > 0) {
              doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(22, 163, 74);
              doc.text(`Total Hired: ${hiredInJob}`, margin + 14, y); y += 5;
            }
          }
          divider();
        });
      }
      y += 2;

      // ── CANDIDATE APPLICATIONS ──
      const hiredCount = applications.filter((a: any) => a.status === 'hired').length;
      sectionTitle(`CANDIDATE APPLICATIONS  (${applications.length} total${hiredCount > 0 ? `  ·  ${hiredCount} Hired` : ''})`);
      if (applications.length === 0) {
        doc.setFont('helvetica', 'italic'); doc.setFontSize(9); doc.setTextColor(150, 150, 150);
        doc.text('No applications found.', margin + 4, y); y += 8;
      } else {
        applications.slice(0, 100).forEach((app: any, i: number) => {
          checkY(40);
          doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(30, 64, 175);
          doc.text(`${i + 1}. ${app.candidateName || app.candidateEmail || 'Candidate'}`, margin + 4, y);
          y += 7;

          // Applied Role — look up from jobTitleMap
          const appliedRole = jobTitleMap[app.jobId] || app.jobTitle || app.appliedJobTitle || app.jobName || '';
          checkY(8);
          const arY = y;
          doc.setFillColor(248, 250, 252); doc.rect(margin + 4, arY - 2, contentW - 4, 7, 'F');
          doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(55, 65, 81);
          doc.text('Applied Role', margin + 7, arY + 3);
          doc.setFont('helvetica', 'bold'); doc.setTextColor(appliedRole ? 30 : 156, appliedRole ? 64 : 163, appliedRole ? 175 : 175);
          doc.text(appliedRole || 'N/A', VAL_X + 4, arY + 3);
          y += 8;

          // Status badge — right-aligned
          checkY(8);
          const stY = y;
          doc.setFillColor(248, 250, 252); doc.rect(margin + 4, stY - 2, contentW - 4, 7, 'F');
          doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(55, 65, 81);
          doc.text('Status', margin + 7, stY + 3);
          const status = (app.status || 'pending').toLowerCase();
          const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);
          const badgeColors: Record<string, [number,number,number]> = {
            hired:[22,163,74], shortlisted:[37,99,235], interviewed:[124,58,237],
            reviewed:[8,145,178], rejected:[220,38,38], pending:[217,119,6], applied:[5,150,105]
          };
          const [br,bg,bb] = badgeColors[status] || [107,114,128];
          const bw = doc.getTextWidth(statusLabel) + 8;
          doc.setFillColor(br, bg, bb);
          doc.roundedRect(VAL_X + 4, stY - 1, bw, 6, 1.5, 1.5, 'F');
          doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(255, 255, 255);
          doc.text(statusLabel, VAL_X + 4 + bw / 2, stY + 3, { align: 'center' });
          y += 8;

          row('Email',      app.candidateEmail || '', 4);
          row('Phone',      app.candidatePhone || '', 4);
          row('Applied On', app.createdAt ? new Date(app.createdAt).toLocaleDateString() : '', 4);
          divider();
        });
        if (applications.length > 100) {
          doc.setFont('helvetica', 'italic'); doc.setFontSize(8); doc.setTextColor(120, 120, 120);
          doc.text(`... and ${applications.length - 100} more applications.`, margin + 4, y); y += 6;
        }
      }

      // ── FOOTER on every page ──
      const totalPages = (doc.internal as any).getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        doc.setFillColor(245, 247, 250);
        doc.rect(0, pageH - 12, pageW, 12, 'F');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(120, 120, 120);
        doc.text('ZyncJobs · privacy@zyncjobs.com · GDPR Art. 20 Data Portability', margin, pageH - 4);
        doc.text(`Page ${p} of ${totalPages}`, pageW - margin, pageH - 4, { align: 'right' });
      }

      const safeName = ((propUser?.name || storedUser?.name || 'User') as string).replace(/[^a-zA-Z0-9]/g, '_');
      const dateStr = new Date().toISOString().slice(0, 10);
      doc.save(`ZyncJobs_DataExport_${safeName}_${dateStr}.pdf`);
      flash('PDF report downloaded successfully.', true);
    } catch (err) {
      console.error('PDF generation error:', err);
      flash('Failed to generate PDF. Please try again.', false);
    } finally {
      setDownloading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      isEmployer
        ? 'This will permanently delete your employer account, all job postings, applications, and data. This cannot be undone. Continue?'
        : 'This will permanently delete your account, resume, and all data. This cannot be undone. Continue?'
    );
    if (!confirmed) return;
    setDeleting(true);
    try {
      const storedUser2 = (() => { try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; } })();
      const userId = propUser?.id || propUser?._id || storedUser2?.id || storedUser2?._id || '';
      const result = await accountAPI.deleteAccount(userId);
      if (result.success) {
        accountAPI.clearUserData();
        localStorage.removeItem(CANDIDATE_STORAGE_KEY);
        localStorage.removeItem(EMPLOYER_STORAGE_KEY);
        if (onLogout) onLogout();
        setTimeout(() => onNavigate('home'), 1500);
      } else {
        flash(result.message, false);
      }
    } finally {
      setDeleting(false);
    }
  };

  // Consent history from backend
  const [consentHistory, setConsentHistory] = useState<any[]>([]);

  useEffect(() => {
    if (tab !== 'history') return;
    const API = import.meta.env.VITE_API_URL || '/api';
    const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken') || '';
    const storedUser2 = (() => { try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; } })();
    const userId = (propUser?.id || propUser?._id || storedUser2?.id || storedUser2?._id || '');
    if (!userId || !token) return;
    fetch(`${API}/gdpr/consent-history/${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.ok ? r.json() : [])
      .then(data => setConsentHistory(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [tab]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header onNavigate={onNavigate} user={propUser} onLogout={onLogout} />

      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-10">
        <BackButton
          onClick={() => onNavigate('settings')}
          text="Back to Settings"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800 mb-6 transition-colors"
        />

        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Privacy & Data</h1>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          {(['settings', 'history'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2.5 text-sm font-medium capitalize border-b-2 transition-colors ${
                tab === t
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t === 'history' ? 'Consent History' : 'Privacy Settings'}
            </button>
          ))}
        </div>

        {/* Flash message */}
        {msg && (
          <div className={`mb-4 px-4 py-3 rounded-lg text-sm flex items-center gap-2 ${
            msg.ok
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {!msg.ok && <AlertTriangle className="w-4 h-4 shrink-0" />}
            {msg.text}
          </div>
        )}

        {/* ── Settings Tab ── */}
        {tab === 'settings' && (
          <>
            {/* Privacy toggles */}
            <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100 mb-6">
              {loading ? (
                <div className="flex items-center justify-center py-12 text-gray-400">
                  <Loader className="w-5 h-5 animate-spin mr-2" /> Loading settings…
                </div>
              ) : (
                TOGGLES.map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between px-5 py-4 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                    </div>
                    <button
                      onClick={() => toggle(key)}
                      className="flex-shrink-0 text-blue-600 hover:text-blue-700 transition-colors"
                      aria-label={`Toggle ${label}`}
                    >
                      {settings[key] ? (
                        <ToggleRight className="w-8 h-8" />
                      ) : (
                        <ToggleLeft className="w-8 h-8 text-gray-400" />
                      )}
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Data actions */}
            <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100 mb-6">
              {/* Download */}
              <div className="flex items-center justify-between px-5 py-4 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">Download My Data</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {isEmployer
                      ? 'Get a copy of your company profile, job postings, and hiring data (GDPR Art. 20 — portability).'
                      : 'Get a copy of your profile, resume, and applications (GDPR Art. 20 — portability).'}
                  </p>
                </div>
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex-shrink-0"
                >
                  {downloading ? <Loader className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  {downloading ? 'Preparing…' : 'Download'}
                </button>
              </div>

              {/* Consent history shortcut */}
              <button
                onClick={() => setTab('history')}
                className="w-full flex items-center justify-between px-5 py-4 gap-4 hover:bg-gray-50 transition-colors text-left"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">Consent History</p>
                  <p className="text-xs text-gray-500 mt-0.5">View a full audit log of your consent records.</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
              </button>

              {/* Delete account */}
              <div className="flex items-center justify-between px-5 py-4 gap-4">
                <div>
                  <p className="text-sm font-medium text-red-700">Delete My Account</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Permanently removes your account, resume, and all associated data (GDPR Art. 17 — erasure).
                  </p>
                </div>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex-shrink-0"
                >
                  {deleting ? <Loader className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  {deleting ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </div>
          </>
        )}

        {/* ── Consent History Tab ── */}
        {tab === 'history' && (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            {consentHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-2">
                <History className="w-8 h-8" />
                <p className="text-sm">No consent records found.</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Consent Types</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Privacy Settings</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {consentHistory.map((record: any, i: number) => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex flex-wrap gap-1">
                          {(record.consentTypes || []).map((t: string) => (
                            <span key={t} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-100">
                              {t}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex flex-wrap gap-1 text-xs text-gray-600">
                          {[
                            ['Resume', record.storeResume],
                            ['Employer View', record.allowEmployerView],
                            ['Job Alerts', record.receiveJobAlerts],
                            ['AI', record.allowAIRecommendations],
                          ].map(([label, val]) => (
                            <span key={String(label)} className={`px-2 py-0.5 rounded-full border text-xs ${
                              val ? 'bg-green-50 text-green-700 border-green-100' : 'bg-gray-100 text-gray-400 border-gray-200'
                            }`}>
                              {String(label)}: {val ? 'On' : 'Off'}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-gray-500 whitespace-nowrap">
                        {new Date(record.consentDate).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        <p className="text-xs text-gray-400 mt-6 text-center">
          For data requests or questions, contact{' '}
          <a href="mailto:privacy@zyncjobs.com" className="text-blue-500 hover:underline">
            privacy@zyncjobs.com
          </a>
        </p>
        {isEmployer && (
          <p className="text-xs text-gray-400 mt-2 text-center">
            Employer data is handled in accordance with our{' '}
            <a href="/privacy" className="text-blue-500 hover:underline">Privacy Policy</a>.
          </p>
        )}
      </div>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default PrivacySettingsPage;
