import React, { useState, useEffect } from 'react';
import { X, Bell, ChevronDown } from 'lucide-react';
import { JobAlert, AlertCriteria } from '../api/jobAlerts';
import AutocompleteCombobox from './AutocompleteCombobox';

interface Props {
  initial?: JobAlert | null;
  onSave: (payload: Omit<JobAlert, '_id' | 'totalJobsSent' | 'createdAt' | 'isActive'>) => Promise<void>;
  onCancel: () => void;
}

const WORK_TYPES = ['Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship', 'Remote'];
const EXPERIENCE_LEVELS = ['Entry Level', 'Mid Level', 'Senior Level', 'Lead', 'Manager', 'Director', 'Executive'];
const FREQUENCIES = [
  { value: 'instant', label: 'Instant' },
  { value: 'daily', label: 'Daily Digest' },
  { value: 'weekly', label: 'Weekly Digest' },
] as const;

const EMPTY: AlertCriteria = {
  keywords: [], skills: [], location: '', country: '',
  experienceLevel: '', workType: [], category: '',
};

function toForm(a?: JobAlert | null) {
  return {
    alertName: a?.alertName ?? '',
    keywords: a?.criteria.keywords.join(', ') ?? '',
    skills: a?.criteria.skills.join(', ') ?? '',
    location: a?.criteria.location ?? '',
    country: a?.criteria.country ?? '',
    experienceLevel: a?.criteria.experienceLevel ?? '',
    salaryMin: a?.criteria.salaryMin?.toString() ?? '',
    salaryMax: a?.criteria.salaryMax?.toString() ?? '',
    workType: a?.criteria.workType ?? [],
    category: a?.criteria.category ?? '',
    frequency: a?.frequency ?? 'daily' as const,
  };
}

const JobAlertForm: React.FC<Props> = ({ initial, onSave, onCancel }) => {
  const [form, setForm] = useState(toForm(initial));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { setForm(toForm(initial)); }, [initial]);

  const set = (k: string, v: any) => setForm(prev => ({ ...prev, [k]: v }));

  const toggleWorkType = (t: string) =>
    set('workType', form.workType.includes(t) ? form.workType.filter(x => x !== t) : [...form.workType, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.alertName.trim()) { setError('Alert title is required'); return; }
    setSaving(true); setError('');
    try {
      await onSave({
        alertName: form.alertName.trim(),
        criteria: {
          keywords: form.keywords.split(',').map(s => s.trim()).filter(Boolean),
          skills: form.skills.split(',').map(s => s.trim()).filter(Boolean),
          location: form.location.trim(),
          country: form.country.trim(),
          experienceLevel: form.experienceLevel,
          salaryMin: form.salaryMin ? parseInt(form.salaryMin) : undefined,
          salaryMax: form.salaryMax ? parseInt(form.salaryMax) : undefined,
          workType: form.workType,
          category: form.category.trim(),
        },
        frequency: form.frequency,
        lastMatched: initial?.lastMatched,
        lastSent: initial?.lastSent,
      });
    } catch (err: any) {
      setError(err.message ?? 'Failed to save alert');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true" aria-label="Job Alert Form">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Bell className="w-4 h-4 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              {initial ? 'Edit Job Alert' : 'Create Job Alert'}
            </h2>
          </div>
          <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-full transition-colors" aria-label="Close">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
          )}

          {/* Alert Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Alert Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.alertName}
              onChange={e => set('alertName', e.target.value)}
              placeholder="e.g. Senior React Developer"
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              required
            />
          </div>

          {/* Keywords + Skills */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Keywords</label>
              <input
                type="text"
                value={form.keywords}
                onChange={e => set('keywords', e.target.value)}
                placeholder="React, TypeScript, Node.js"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
              <p className="text-xs text-gray-400 mt-1">Comma separated</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Skills</label>
              <input
                type="text"
                value={form.skills}
                onChange={e => set('skills', e.target.value)}
                placeholder="JavaScript, AWS, Docker"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
              <p className="text-xs text-gray-400 mt-1">Comma separated</p>
            </div>
          </div>

          {/* Location + Country */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Location</label>
              <input
                type="text"
                value={form.location}
                onChange={e => set('location', e.target.value)}
                placeholder="Bangalore, Remote"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Country</label>
              <input
                type="text"
                value={form.country}
                onChange={e => set('country', e.target.value)}
                placeholder="India, USA"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>
          </div>

          {/* Experience + Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <AutocompleteCombobox
                label="Experience Level"
                value={form.experienceLevel}
                onChange={(val) => set('experienceLevel', val)}
                options={[
                  { value: '', label: 'Any level' },
                  ...EXPERIENCE_LEVELS.map(l => ({ value: l, label: l })),
                ]}
                placeholder="Select experience level"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
              <input
                type="text"
                value={form.category}
                onChange={e => set('category', e.target.value)}
                placeholder="Engineering, Design, Marketing"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>
          </div>

          {/* Salary Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Salary Range (Annual)</label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                value={form.salaryMin}
                onChange={e => set('salaryMin', e.target.value)}
                placeholder="Min (e.g. 500000)"
                className="border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
              <input
                type="number"
                value={form.salaryMax}
                onChange={e => set('salaryMax', e.target.value)}
                placeholder="Max (e.g. 1500000)"
                className="border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>
          </div>

          {/* Work Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Work Type</label>
            <div className="flex flex-wrap gap-2">
              {WORK_TYPES.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleWorkType(t)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${form.workType.includes(t)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                    }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Frequency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notification Frequency</label>
            <div className="grid grid-cols-3 gap-3">
              {FREQUENCIES.map(f => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => set('frequency', f.value)}
                  className={`py-2.5 rounded-xl text-sm font-medium border transition-colors ${form.frequency === f.value
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                    }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              {saving ? 'Saving…' : initial ? 'Save Changes' : 'Create Alert'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JobAlertForm;
