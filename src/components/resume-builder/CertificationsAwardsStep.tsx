import React, { useState } from 'react';
import { Plus, Trash2, Award, BadgeCheck, Sparkles, Loader2 } from 'lucide-react';
import { useResumeStore } from '../../store/useResumeStore';
import { executeResumeAI } from '../../services/resumeAIClient';

export default function CertificationsAwardsStep() {
  const {
    data, addCertification, updateCertification, removeCertification,
    addAward, updateAward, removeAward,
  } = useResumeStore();
  const [aiLoading, setAiLoading] = useState(false);

  const suggestCerts = async () => {
    const title = data.experience[0]?.title || data.summary || 'Professional';
    setAiLoading(true);
    try {
      const res = await executeResumeAI({ section: 'certifications', action: 'generate', content: `Target role: ${title}. Suggest 3 certifications. Return name,issuer per line.` });
      (res.result || '').split('\n').filter(Boolean).slice(0, 3).forEach(line => {
        const parts = line.split(',').map(s => s.trim());
        addCertification();
        const id = Date.now().toString();
        if (parts[0]) updateCertification(id, 'name', parts[0]);
        if (parts[1]) updateCertification(id, 'issuer', parts[1]);
      });
    } catch { /* silent */ } finally { setAiLoading(false); }
  };

  const hasRole = data.experience[0]?.title || data.summary;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Certifications & Awards</h2>
        <p className="text-sm text-gray-500 mt-0.5">Add your certifications and achievements</p>
        <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1"><span className="text-purple-400">💡</span> Certifications from <span className="text-purple-500 font-medium">AWS, Google, Microsoft</span> — hiring managers prioritize recognized vendors</p>
      </div>

      {/* Certifications */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BadgeCheck className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-semibold text-gray-800">Certifications</h3>
          </div>
          <div className="flex items-center gap-2">
            {hasRole && data.certifications.length === 0 && (
              <button onClick={suggestCerts} disabled={aiLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 disabled:opacity-50 transition-colors">
                {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                Suggest
              </button>
            )}
            <button onClick={addCertification}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>
        </div>

        {data.certifications.length === 0 ? (
          <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-xl">
            <p className="text-gray-400 text-xs">No certifications yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {data.certifications.map((cert) => (
              <div key={cert.id} className="p-4 bg-white border border-gray-200 rounded-xl">
                <div className="flex justify-end mb-2">
                  <button onClick={() => removeCertification(cert.id)} className="text-gray-300 hover:text-red-500 p-1 rounded transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-1">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
                    <input type="text" value={cert.name} onChange={e => updateCertification(cert.id, 'name', e.target.value)}
                      placeholder="Enter certification name"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white hover:border-gray-300 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Issuer</label>
                    <input type="text" value={cert.issuer} onChange={e => updateCertification(cert.id, 'issuer', e.target.value)}
                      placeholder="Enter issuing organization"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white hover:border-gray-300 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Year</label>
                    <input type="text" value={cert.year} onChange={e => updateCertification(cert.id, 'year', e.target.value)}
                      placeholder="Year obtained"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white hover:border-gray-300 transition-colors" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Awards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-semibold text-gray-800">Awards & Achievements</h3>
          </div>
          <button onClick={addAward}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white text-xs rounded-lg hover:bg-amber-600 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        </div>

        {data.awards.length === 0 ? (
          <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-xl">
            <p className="text-gray-400 text-xs">No awards yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {data.awards.map((award) => (
              <div key={award.id} className="p-4 bg-white border border-gray-200 rounded-xl">
                <div className="flex justify-end mb-2">
                  <button onClick={() => removeAward(award.id)} className="text-gray-300 hover:text-red-500 p-1 rounded transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Title *</label>
                    <input type="text" value={award.title} onChange={e => updateAward(award.id, 'title', e.target.value)}
                      placeholder="Enter award title"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white hover:border-gray-300 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Issuer</label>
                    <input type="text" value={award.issuer} onChange={e => updateAward(award.id, 'issuer', e.target.value)}
                      placeholder="Issuing organization"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white hover:border-gray-300 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Year</label>
                    <input type="text" value={award.year} onChange={e => updateAward(award.id, 'year', e.target.value)}
                      placeholder="Year"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white hover:border-gray-300 transition-colors" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                  <input type="text" value={award.description} onChange={e => updateAward(award.id, 'description', e.target.value)}
                    placeholder="Brief description"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white hover:border-gray-300 transition-colors" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
