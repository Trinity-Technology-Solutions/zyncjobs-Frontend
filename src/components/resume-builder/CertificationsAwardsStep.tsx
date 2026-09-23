import { useState } from 'react';
import { Plus, Trash2, Award, BadgeCheck, Sparkles, Loader2 } from 'lucide-react';
import { useResumeStore } from '../../store/useResumeStore';
import { executeResumeAI } from '../../services/resumeAIClient';
import { validateYear, validateCertificationName, validateIssuer } from '../../utils/resumeFieldValidators';
import ValidatedInput from './ValidatedInput';

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
        <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1"><svg className="w-3 h-3 text-purple-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> Certifications from <span className="text-purple-500 font-medium">recognized industry bodies</span> — hiring managers prioritize verified credentials</p>
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
                  <ValidatedInput
                    id={`cert-name-${cert.id}`}
                    label="Name"
                    required
                    value={cert.name}
                    onCommit={(v) => updateCertification(cert.id, 'name', v)}
                    validator={validateCertificationName}
                    placeholder="Enter certification name"
                    className="md:col-span-1"
                  />
                  <ValidatedInput
                    id={`cert-issuer-${cert.id}`}
                    label="Issuer"
                    value={cert.issuer}
                    onCommit={(v) => updateCertification(cert.id, 'issuer', v)}
                    validator={validateIssuer}
                    placeholder="Enter issuing organization"
                  />
                  <ValidatedInput
                    id={`cert-year-${cert.id}`}
                    label="Year"
                    value={cert.year}
                    onCommit={(v) => updateCertification(cert.id, 'year', v)}
                    validator={validateYear}
                    placeholder="Year obtained"
                  />
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
                  <ValidatedInput
                    id={`award-title-${award.id}`}
                    label="Title"
                    required
                    value={award.title}
                    onCommit={(v) => updateAward(award.id, 'title', v)}
                    validator={validateCertificationName}
                    placeholder="Enter award title"
                  />
                  <ValidatedInput
                    id={`award-issuer-${award.id}`}
                    label="Issuer"
                    value={award.issuer}
                    onCommit={(v) => updateAward(award.id, 'issuer', v)}
                    validator={validateIssuer}
                    placeholder="Issuing organization"
                  />
                  <ValidatedInput
                    id={`award-year-${award.id}`}
                    label="Year"
                    value={award.year}
                    onCommit={(v) => updateAward(award.id, 'year', v)}
                    validator={validateYear}
                    placeholder="Year"
                  />
                </div>
                <div>
                  <ValidatedInput
                    id={`award-desc-${award.id}`}
                    label="Description"
                    value={award.description}
                    onCommit={(v) => updateAward(award.id, 'description', v)}
                    placeholder="Brief description"
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
