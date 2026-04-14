import React, { useState, useEffect } from 'react';
import { Clock, RotateCcw, Eye, Download, Loader2, CheckCircle } from 'lucide-react';
import { tokenStorage } from '../utils/tokenStorage';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

interface Version {
  id: number;
  version: number;
  parsedData: any;
  createdAt: string;
}

interface ResumeVersionHistoryProps {
  resumeId: string;
  onRestore?: (versionData: any) => void;
}

export default function ResumeVersionHistory({ resumeId, onRestore }: ResumeVersionHistoryProps) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<number | null>(null);
  const [previewVersion, setPreviewVersion] = useState<Version | null>(null);

  useEffect(() => {
    loadVersions();
  }, [resumeId]);

  const loadVersions = async () => {
    setLoading(true);
    try {
      const token = tokenStorage.getAccess();
      const res = await fetch(`${API_BASE}/resume-versions/${resumeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setVersions(data.versions);
      }
    } catch (err) {
      console.error('Load versions error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (version: number) => {
    if (!confirm(`Restore to version ${version}? This will create a new version.`)) return;

    setRestoring(version);
    try {
      const token = tokenStorage.getAccess();
      const res = await fetch(`${API_BASE}/resume-versions/${resumeId}/${version}/restore`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        await loadVersions();
        if (onRestore) {
          const versionData = versions.find((v) => v.version === version);
          if (versionData) onRestore(versionData.parsedData);
        }
        alert('✅ Version restored successfully!');
      }
    } catch (err: any) {
      alert('Failed to restore: ' + err.message);
    } finally {
      setRestoring(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>No version history yet</p>
        <p className="text-sm mt-1">Versions are saved automatically when you make changes</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Version History</h3>
        <span className="text-sm text-gray-500">{versions.length} versions</span>
      </div>

      <div className="space-y-3">
        {versions.map((v, idx) => (
          <div
            key={v.id}
            className={`border rounded-lg p-4 transition-all ${
              idx === 0 ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    idx === 0 ? 'bg-green-600' : 'bg-gray-200'
                  }`}
                >
                  {idx === 0 ? (
                    <CheckCircle className="w-5 h-5 text-white" />
                  ) : (
                    <Clock className="w-5 h-5 text-gray-600" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-gray-900">Version {v.version}</h4>
                    {idx === 0 && (
                      <span className="px-2 py-0.5 bg-green-600 text-white text-xs rounded-full">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{formatDate(v.createdAt)}</p>
                  {v.parsedData?.personalInfo?.name && (
                    <p className="text-sm text-gray-600 mt-1">
                      {v.parsedData.personalInfo.name} • {v.parsedData.experience?.length || 0} jobs
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setPreviewVersion(v)}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Preview"
                >
                  <Eye className="w-4 h-4" />
                </button>
                {idx !== 0 && (
                  <button
                    onClick={() => handleRestore(v.version)}
                    disabled={restoring === v.version}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {restoring === v.version ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Restoring...
                      </>
                    ) : (
                      <>
                        <RotateCcw className="w-3.5 h-3.5" />
                        Restore
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Preview Modal */}
      {previewVersion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold text-gray-900">
                Version {previewVersion.version} Preview
              </h3>
              <button
                onClick={() => setPreviewVersion(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                {JSON.stringify(previewVersion.parsedData, null, 2)}
              </pre>
            </div>
            <div className="flex gap-2 p-4 border-t">
              <button
                onClick={() => {
                  handleRestore(previewVersion.version);
                  setPreviewVersion(null);
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <RotateCcw className="w-4 h-4" />
                Restore This Version
              </button>
              <button
                onClick={() => setPreviewVersion(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
