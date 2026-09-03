import React, { useState } from 'react';
import { Bell, Plus, Edit2, Trash2, Pause, Play, Calendar, Clock, Briefcase, MapPin, Tag } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BackButton from '../components/BackButton';
import JobAlertForm from '../components/JobAlertForm';
import { JobAlert } from '../api/jobAlerts';
import { useJobAlertStore } from '../hooks/useJobAlertStore';

interface Props {
  onNavigate: (page: string, data?: any) => void;
  user?: { name: string; type: 'candidate' | 'employer'; email?: string } | null;
  onLogout?: () => void;
}

function toast(msg: string) {
  window.dispatchEvent(new CustomEvent('zync:alert', { detail: { message: msg } }));
}

function AlertSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
      <div className="flex justify-between mb-3">
        <div className="h-5 bg-gray-200 rounded w-1/3" />
        <div className="h-5 bg-gray-200 rounded w-16" />
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-100 rounded w-2/3" />
        <div className="h-4 bg-gray-100 rounded w-1/2" />
      </div>
    </div>
  );
}

const FREQ_LABELS: Record<string, string> = { instant: 'Instant', daily: 'Daily', weekly: 'Weekly' };

const MyAlertsPage: React.FC<Props> = ({ onNavigate, user, onLogout }) => {
  const { alerts, alertsLoading, createAlert, updateAlert, deleteAlert, pauseAlert, resumeAlert } =
    useJobAlertStore(user?.email);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<JobAlert | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleSave = async (payload: Omit<JobAlert, '_id' | 'totalJobsSent' | 'createdAt' | 'isActive'>) => {
    if (editing) {
      await updateAlert(editing._id, payload);
      toast('Alert updated successfully');
    } else {
      await createAlert(payload);
      toast('Job Alert Created Successfully');
    }
    setShowForm(false);
    setEditing(null);
  };

  const handleEdit = (alert: JobAlert) => { setEditing(alert); setShowForm(true); };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try { await deleteAlert(id); toast('Alert deleted'); }
    catch { toast('Failed to delete alert'); }
    finally { setDeleting(null); }
  };

  const handlePause = async (id: string) => {
    try { await pauseAlert(id); toast('Alert paused'); }
    catch { toast('Failed to pause alert'); }
  };

  const handleResume = async (id: string) => {
    try { await resumeAlert(id); toast('Alert resumed'); }
    catch { toast('Failed to resume alert'); }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onNavigate={onNavigate} user={user as any} onLogout={onLogout} />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <BackButton fallback="/dashboard" />

        <div className="flex items-center justify-between mt-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Job Alerts</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {alerts.length} alert{alerts.length !== 1 ? 's' : ''} — get notified when matching jobs are posted
            </p>
          </div>
          <button
            onClick={() => { setEditing(null); setShowForm(true); }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Alert
          </button>
        </div>

        {/* Alerts list */}
        {alertsLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <AlertSkeleton key={i} />)}
          </div>
        ) : alerts.length === 0 ? (
          <EmptyAlerts onCreate={() => { setEditing(null); setShowForm(true); }} />
        ) : (
          <div className="space-y-4">
            {alerts.map(alert => (
              <AlertCard
                key={alert._id}
                alert={alert}
                deleting={deleting === alert._id}
                onEdit={() => handleEdit(alert)}
                onDelete={() => handleDelete(alert._id)}
                onPause={() => handlePause(alert._id)}
                onResume={() => handleResume(alert._id)}
                onViewMatches={() => onNavigate('job-alert-notifications')}
              />
            ))}
          </div>
        )}
      </div>

      <Footer onNavigate={onNavigate} user={user as any} />

      {showForm && (
        <JobAlertForm
          initial={editing}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditing(null); }}
        />
      )}
    </div>
  );
};

// ── Alert Card ────────────────────────────────────────────────────────────────

interface CardProps {
  alert: JobAlert;
  deleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onPause: () => void;
  onResume: () => void;
  onViewMatches: () => void;
}

const AlertCard: React.FC<CardProps> = ({ alert, deleting, onEdit, onDelete, onPause, onResume, onViewMatches }) => {
  const { criteria } = alert;
  const chips: string[] = [
    ...criteria.keywords.slice(0, 3),
    ...criteria.skills.slice(0, 2),
  ].filter(Boolean);

  return (
    <div className={`bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow ${!alert.isActive ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-gray-900 text-base truncate">{alert.alertName}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${alert.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {alert.isActive ? 'Active' : 'Paused'}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">
              {FREQ_LABELS[alert.frequency]}
            </span>
          </div>

          {/* Filter chips */}
          {chips.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {chips.map(c => (
                <span key={c} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{c}</span>
              ))}
            </div>
          )}

          {/* Meta */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-gray-500">
            {criteria.location && (
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{criteria.location}</span>
            )}
            {criteria.experienceLevel && (
              <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{criteria.experienceLevel}</span>
            )}
            {criteria.workType.length > 0 && (
              <span className="flex items-center gap-1"><Tag className="w-3 h-3" />{criteria.workType.join(', ')}</span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Created {new Date(alert.createdAt).toLocaleDateString()}
            </span>
            {alert.lastMatched && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Last matched {new Date(alert.lastMatched).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-50">
        <button
          onClick={onViewMatches}
          className="flex-1 text-center text-xs font-medium text-blue-600 hover:text-blue-800 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
        >
          View Matches
        </button>
        <button
          onClick={onEdit}
          className="flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Edit alert"
        >
          <Edit2 className="w-3.5 h-3.5" /> Edit
        </button>
        {alert.isActive ? (
          <button
            onClick={onPause}
            className="flex items-center gap-1 text-xs font-medium text-amber-600 hover:text-amber-800 px-3 py-1.5 rounded-lg hover:bg-amber-50 transition-colors"
            aria-label="Pause alert"
          >
            <Pause className="w-3.5 h-3.5" /> Pause
          </button>
        ) : (
          <button
            onClick={onResume}
            className="flex items-center gap-1 text-xs font-medium text-green-600 hover:text-green-800 px-3 py-1.5 rounded-lg hover:bg-green-50 transition-colors"
            aria-label="Resume alert"
          >
            <Play className="w-3.5 h-3.5" /> Resume
          </button>
        )}
        <button
          onClick={onDelete}
          disabled={deleting}
          className="flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
          aria-label="Delete alert"
        >
          <Trash2 className="w-3.5 h-3.5" /> {deleting ? '…' : 'Delete'}
        </button>
      </div>
    </div>
  );
};

// ── Empty State ───────────────────────────────────────────────────────────────

const EmptyAlerts: React.FC<{ onCreate: () => void }> = ({ onCreate }) => (
  <div className="text-center py-16 px-4">
    <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-5">
      <Bell className="w-10 h-10 text-blue-400" />
    </div>
    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Alerts Created</h3>
    <p className="text-gray-500 text-sm max-w-sm mx-auto mb-6">
      Create job alerts to get notified when matching jobs are posted. Never miss an opportunity.
    </p>
    <button
      onClick={onCreate}
      className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
    >
      <Plus className="w-4 h-4" />
      Create Your First Alert
    </button>
  </div>
);

export default MyAlertsPage;
