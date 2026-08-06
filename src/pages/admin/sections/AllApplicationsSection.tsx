import React, { useState, useEffect, useCallback } from 'react';
import { API_ENDPOINTS } from '../../../config/env';
import { Search, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import AutocompleteCombobox from '../../../components/AutocompleteCombobox';

interface AllApplicationsSectionProps {
  onUnauthorized: () => void;
}

export default function AllApplicationsSection({ onUnauthorized }: AllApplicationsSectionProps) {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [counts, setCounts] = useState<{ byStatus: Record<string, number>; byCompany: Record<string, number>; total: number }>({ byStatus: {}, byCompany: {}, total: 0 });

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '50' });
      if (statusFilter) params.set('status', statusFilter);
      if (companyFilter) params.set('company', companyFilter);

      const res = await fetch(`${API_ENDPOINTS.ADMIN_ALL_APPLICATIONS}?${params}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken') || localStorage.getItem('accessToken')}` }
      });
      if (res.status === 401) { onUnauthorized(); return; }
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setApplications(data.applications || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotal(data.pagination?.total || 0);
      setCounts(data.counts || { byStatus: {}, byCompany: {}, total: 0 });
    } catch (e) {
      console.error('All applications fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, companyFilter, onUnauthorized]);

  useEffect(() => { fetchApplications(); }, [fetchApplications]);

  const exportCSV = () => {
    const headers = ['Candidate Name', 'Email', 'Phone', 'Status', 'Job Title', 'Company', 'Applied Date', 'AI Score'];
    const rows = applications.map(a => [
      a.candidateName || '', a.candidateEmail || '', a.candidatePhone || '',
      a.status || '', a.jobTitle || '', a.company || '',
      a.appliedDate ? new Date(a.appliedDate).toISOString().split('T')[0] : '',
      a.aiScore != null ? String(a.aiScore) : ''
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `all_applications_page_${page}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-700',
    applied: 'bg-blue-100 text-blue-700',
    reviewed: 'bg-yellow-100 text-yellow-700',
    shortlisted: 'bg-emerald-100 text-emerald-700',
    interviewed: 'bg-purple-100 text-purple-700',
    hired: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    withdrawn: 'bg-gray-100 text-gray-500'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">All Applications</h2>
          <p className="text-sm text-gray-500 mt-1">{counts.total} total applications across all companies</p>
        </div>
        <button onClick={exportCSV} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
          <Download className="w-4 h-4" /> Export Page CSV
        </button>
      </div>

      {/* Counts by status */}
      <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
        {Object.entries(counts.byStatus).map(([status, count]) => (
          <button key={status} onClick={() => setStatusFilter(statusFilter === status ? '' : status)}
            className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${statusFilter === status ? 'ring-2 ring-blue-500 border-blue-500' : 'border-gray-200 hover:border-blue-300'}`}>
            <span className="block text-lg font-bold">{count as number}</span>
            <span className="block capitalize">{status}</span>
          </button>
        ))}
      </div>

      {/* Top companies */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Applications by Company</h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(counts.byCompany).slice(0, 15).map(([company, count]) => (
            <button key={company} onClick={() => setCompanyFilter(companyFilter === company ? '' : company)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${companyFilter === company ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'}`}>
              {company} ({count as number})
            </button>
          ))}
        </div>
      </div>

      {/* Search / Filter bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <AutocompleteCombobox
            value={companyFilter}
            onChange={v => { setCompanyFilter(v); setPage(1); }}
            options={Object.keys(counts.byCompany).map(c => ({ value: c, label: c }))}
            allowCustom
            placeholder="Filter by company..."
          />
        </div>
        {(statusFilter || companyFilter) && (
          <button onClick={() => { setStatusFilter(''); setCompanyFilter(''); setPage(1); }}
            className="text-sm text-red-600 hover:text-red-800 font-medium">Clear</button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : applications.length === 0 ? (
          <div className="text-center py-16 text-gray-400">No applications found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Candidate</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Email</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Job Title</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Company</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Date</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">AI Score</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app: any) => (
                  <tr key={app.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{app.candidateName || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{app.candidateEmail || '—'}</td>
                    <td className="px-4 py-3 text-gray-700">{app.jobTitle}</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5">
                        {app.companyLogo && <img src={app.companyLogo} alt="" className="w-4 h-4 rounded" />}
                        {app.company}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${statusColors[app.status] || 'bg-gray-100 text-gray-600'}`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {app.appliedDate ? new Date(app.appliedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {app.aiScore != null ? (
                        <span className={`text-xs font-bold px-2 py-1 rounded ${app.aiScore >= 70 ? 'bg-green-100 text-green-700' : app.aiScore >= 40 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                          {app.aiScore}
                        </span>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Page {page} of {totalPages} ({total} results)</span>
          <div className="flex items-center gap-2">
            <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-40">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium text-gray-700">{page}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-40">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
