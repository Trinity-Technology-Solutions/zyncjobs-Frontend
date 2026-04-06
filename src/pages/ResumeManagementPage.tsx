import React, { useState } from 'react';
import { FileText, Clock, Download, Eye, Trash2, Plus } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ResumeVersionHistory from '../components/ResumeVersionHistory';

interface ResumeManagementPageProps {
  onNavigate: (page: string) => void;
  user?: any;
  onLogout?: () => void;
}

const ResumeManagementPage: React.FC<ResumeManagementPageProps> = ({ onNavigate, user, onLogout }) => {
  const [selectedResume, setSelectedResume] = useState<string | null>(null);
  const [showVersions, setShowVersions] = useState(false);

  // Mock resumes - replace with actual API call
  const resumes = [
    {
      id: '1',
      name: 'Software Engineer Resume',
      template: 'Modern',
      lastModified: '2024-01-15T10:30:00Z',
      versions: 5,
    },
    {
      id: '2',
      name: 'Frontend Developer Resume',
      template: 'Classic',
      lastModified: '2024-01-10T14:20:00Z',
      versions: 3,
    },
  ];

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Resumes</h1>
            <p className="text-gray-600">Manage your resumes and version history</p>
          </div>
          <button
            onClick={() => onNavigate('resume-builder')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create New Resume
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Resume List */}
          <div className="lg:col-span-2 space-y-4">
            {resumes.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No resumes yet</h3>
                <p className="text-gray-500 mb-6">Create your first resume to get started</p>
                <button
                  onClick={() => onNavigate('resume-builder')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Create Resume
                </button>
              </div>
            ) : (
              resumes.map((resume) => (
                <div
                  key={resume.id}
                  className={`bg-white rounded-xl border-2 p-6 transition-all cursor-pointer ${
                    selectedResume === resume.id
                      ? 'border-blue-500 shadow-lg'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => {
                    setSelectedResume(resume.id);
                    setShowVersions(true);
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                        <FileText className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">{resume.name}</h3>
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                          <span>{resume.template} Template</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {formatDate(resume.lastModified)}
                          </span>
                          <span>•</span>
                          <span>{resume.versions} versions</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          alert('Preview feature coming soon!');
                        }}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Preview"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          alert('Download feature coming soon!');
                        }}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Delete this resume?')) {
                            alert('Delete feature coming soon!');
                          }
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Version History Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-6">
              {!selectedResume || !showVersions ? (
                <div className="text-center py-12 text-gray-500">
                  <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Select a resume to view version history</p>
                </div>
              ) : (
                <ResumeVersionHistory
                  resumeId={selectedResume}
                  onRestore={(versionData) => {
                    console.log('Restored version:', versionData);
                  }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h4 className="font-semibold text-blue-900 mb-2">💡 Version Control</h4>
            <p className="text-sm text-blue-700">
              Every change is automatically saved. Restore any previous version anytime.
            </p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <h4 className="font-semibold text-green-900 mb-2">🎯 ATS Optimized</h4>
            <p className="text-sm text-green-700">
              All templates are designed to pass Applicant Tracking Systems.
            </p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
            <h4 className="font-semibold text-purple-900 mb-2">🤖 AI-Powered</h4>
            <p className="text-sm text-purple-700">
              Get AI suggestions and improvements for every section.
            </p>
          </div>
        </div>
      </div>

      <Footer onNavigate={onNavigate} user={user} />
    </div>
  );
};

export default ResumeManagementPage;
