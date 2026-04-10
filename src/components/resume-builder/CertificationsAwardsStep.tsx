import React from 'react';
import { Plus, Trash2, Award, BadgeCheck } from 'lucide-react';
import { useResumeStore } from '../../store/useResumeStore';

export default function CertificationsAwardsStep() {
  const {
    data,
    addCertification, updateCertification, removeCertification,
    addAward, updateAward, removeAward,
  } = useResumeStore();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Certifications & Awards</h2>
        <p className="text-gray-500 text-sm">Add your certifications and achievements</p>
      </div>

      {/* Certifications */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BadgeCheck className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Certifications</h3>
          </div>
          <button
            onClick={addCertification}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Certification
          </button>
        </div>

        {data.certifications.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl">
            <BadgeCheck className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">No certifications added yet</p>
            <button onClick={addCertification} className="text-blue-600 text-sm mt-1 hover:underline">
              + Add your first certification
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {data.certifications.map((cert) => (
              <div key={cert.id} className="p-4 border border-gray-200 rounded-xl">
                <div className="flex justify-end mb-2">
                  <button onClick={() => removeCertification(cert.id)} className="text-red-400 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-1">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Certification Name *</label>
                    <input
                      type="text"
                      value={cert.name}
                      onChange={(e) => updateCertification(cert.id, 'name', e.target.value)}
                      placeholder="e.g. AWS Solutions Architect"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Issuing Organization</label>
                    <input
                      type="text"
                      value={cert.issuer}
                      onChange={(e) => updateCertification(cert.id, 'issuer', e.target.value)}
                      placeholder="e.g. Amazon Web Services"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Year</label>
                    <input
                      type="text"
                      value={cert.year}
                      onChange={(e) => updateCertification(cert.id, 'year', e.target.value)}
                      placeholder="e.g. 2023"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
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
            <Award className="w-5 h-5 text-amber-500" />
            <h3 className="font-semibold text-gray-900">Awards & Achievements</h3>
          </div>
          <button
            onClick={addAward}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white text-sm rounded-lg hover:bg-amber-600 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Award
          </button>
        </div>

        {data.awards.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl">
            <Award className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">No awards added yet</p>
            <button onClick={addAward} className="text-amber-500 text-sm mt-1 hover:underline">
              + Add your first award
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {data.awards.map((award) => (
              <div key={award.id} className="p-4 border border-gray-200 rounded-xl">
                <div className="flex justify-end mb-2">
                  <button onClick={() => removeAward(award.id)} className="text-red-400 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Award Title *</label>
                    <input
                      type="text"
                      value={award.title}
                      onChange={(e) => updateAward(award.id, 'title', e.target.value)}
                      placeholder="e.g. Employee of the Year"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Issuer / Organization</label>
                    <input
                      type="text"
                      value={award.issuer}
                      onChange={(e) => updateAward(award.id, 'issuer', e.target.value)}
                      placeholder="e.g. TCS"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Year</label>
                    <input
                      type="text"
                      value={award.year}
                      onChange={(e) => updateAward(award.id, 'year', e.target.value)}
                      placeholder="e.g. 2023"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Description (optional)</label>
                  <input
                    type="text"
                    value={award.description}
                    onChange={(e) => updateAward(award.id, 'description', e.target.value)}
                    placeholder="Brief description of the achievement"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
