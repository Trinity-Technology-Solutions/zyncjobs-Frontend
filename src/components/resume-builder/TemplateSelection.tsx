import React from 'react';
import { Check } from 'lucide-react';
import { useResumeStore } from '../../store/useResumeStore';

const templates = [
  {
    id: 'modern',
    name: 'Modern',
    industry: 'General / Startups',
    desc: 'Clean blue header with skill chips — great for most industries',
    color: '#2563eb',
    free: true,
    preview: (
      <svg viewBox="0 0 160 200" className="w-full h-full">
        <rect width="160" height="200" fill="#f8fafc" />
        <rect width="160" height="48" fill="#2563eb" />
        <rect x="10" y="10" width="80" height="8" rx="2" fill="white" opacity="0.9" />
        <rect x="10" y="22" width="55" height="4" rx="1" fill="white" opacity="0.5" />
        <rect x="10" y="30" width="40" height="4" rx="1" fill="white" opacity="0.4" />
        <rect x="10" y="58" width="30" height="3" rx="1" fill="#2563eb" />
        <rect x="44" y="59" width="106" height="1" fill="#bfdbfe" />
        <rect x="10" y="66" width="140" height="2.5" rx="1" fill="#e2e8f0" />
        <rect x="10" y="71" width="120" height="2.5" rx="1" fill="#e2e8f0" />
        <rect x="10" y="82" width="30" height="3" rx="1" fill="#2563eb" />
        <rect x="44" y="83" width="106" height="1" fill="#bfdbfe" />
        {[0,1,2,3,4].map(i => <rect key={i} x={10 + i*28} y="90" width="24" height="8" rx="4" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="0.5" />)}
        <rect x="10" y="108" width="30" height="3" rx="1" fill="#2563eb" />
        <rect x="44" y="109" width="106" height="1" fill="#bfdbfe" />
        {[0,1].map(i => (
          <g key={i} transform={`translate(0,${i*28})`}>
            <rect x="10" y="116" width="80" height="3.5" rx="1" fill="#1e293b" />
            <rect x="10" y="122" width="50" height="2.5" rx="1" fill="#2563eb" opacity="0.6" />
            <rect x="14" y="128" width="100" height="2" rx="1" fill="#e2e8f0" />
            <rect x="14" y="132" width="85" height="2" rx="1" fill="#e2e8f0" />
          </g>
        ))}
      </svg>
    ),
  },
  {
    id: 'classic',
    name: 'Classic',
    industry: 'Finance / Law / Academia',
    desc: 'Traditional serif layout with centered header — timeless and ATS-safe',
    color: '#1e293b',
    free: true,
    preview: (
      <svg viewBox="0 0 160 200" className="w-full h-full">
        <rect width="160" height="200" fill="#ffffff" />
        <rect x="10" y="10" width="140" height="2" fill="#1e293b" />
        <rect x="30" y="16" width="100" height="7" rx="1" fill="#1e293b" />
        <rect x="40" y="26" width="80" height="3" rx="1" fill="#64748b" />
        <rect x="10" y="34" width="140" height="2" fill="#1e293b" />
        <rect x="10" y="42" width="60" height="3" rx="1" fill="#1e293b" />
        <rect x="10" y="46" width="140" height="1.5" fill="#1e293b" />
        <rect x="10" y="51" width="140" height="2" rx="1" fill="#94a3b8" />
        <rect x="10" y="56" width="120" height="2" rx="1" fill="#94a3b8" />
        <rect x="10" y="66" width="70" height="3" rx="1" fill="#1e293b" />
        <rect x="10" y="70" width="140" height="1.5" fill="#1e293b" />
        {[0,1,2].map(i => (
          <g key={i} transform={`translate(0,${i*22})`}>
            <rect x="10" y="76" width="90" height="3" rx="1" fill="#1e293b" />
            <rect x="130" y="76" width="20" height="3" rx="1" fill="#94a3b8" />
            <rect x="14" y="82" width="120" height="2" rx="1" fill="#cbd5e1" />
            <rect x="14" y="86" width="100" height="2" rx="1" fill="#cbd5e1" />
          </g>
        ))}
        <rect x="10" y="148" width="60" height="3" rx="1" fill="#1e293b" />
        <rect x="10" y="152" width="140" height="1.5" fill="#1e293b" />
        <rect x="10" y="158" width="140" height="2.5" rx="1" fill="#cbd5e1" />
        <rect x="10" y="163" width="110" height="2.5" rx="1" fill="#cbd5e1" />
      </svg>
    ),
  },
  {
    id: 'minimal',
    name: 'Minimal',
    industry: 'Design / Freelance',
    desc: 'Light, whitespace-driven layout — lets your work speak for itself',
    color: '#6b7280',
    free: true,
    preview: (
      <svg viewBox="0 0 160 200" className="w-full h-full">
        <rect width="160" height="200" fill="#ffffff" />
        <rect x="12" y="14" width="90" height="9" rx="1" fill="#111827" />
        <rect x="12" y="26" width="120" height="2.5" rx="1" fill="#d1d5db" />
        <rect x="12" y="44" width="20" height="2" rx="1" fill="#9ca3af" />
        <rect x="12" y="50" width="136" height="2" rx="1" fill="#e5e7eb" />
        <rect x="12" y="54" width="110" height="2" rx="1" fill="#e5e7eb" />
        <rect x="12" y="58" width="125" height="2" rx="1" fill="#e5e7eb" />
        <rect x="12" y="70" width="20" height="2" rx="1" fill="#9ca3af" />
        <rect x="12" y="76" width="136" height="2" rx="1" fill="#e5e7eb" />
        <rect x="12" y="88" width="20" height="2" rx="1" fill="#9ca3af" />
        {[0,1,2].map(i => (
          <g key={i} transform={`translate(0,${i*20})`}>
            <rect x="12" y="94" width="100" height="2.5" rx="1" fill="#374151" />
            <rect x="12" y="99" width="70" height="2" rx="1" fill="#d1d5db" />
            <rect x="12" y="103" width="120" height="2" rx="1" fill="#e5e7eb" />
          </g>
        ))}
        <rect x="12" y="158" width="20" height="2" rx="1" fill="#9ca3af" />
        <rect x="12" y="164" width="136" height="2" rx="1" fill="#e5e7eb" />
        <rect x="12" y="168" width="100" height="2" rx="1" fill="#e5e7eb" />
      </svg>
    ),
  },
  {
    id: 'creative',
    name: 'Creative',
    industry: 'Marketing / Design / Media',
    desc: 'Two-column purple sidebar — bold and memorable for creative roles',
    color: '#7c3aed',
    free: false,
    preview: (
      <svg viewBox="0 0 160 200" className="w-full h-full">
        <rect width="160" height="200" fill="#f5f3ff" />
        <rect width="60" height="200" fill="#7c3aed" />
        <rect x="8" y="12" width="44" height="7" rx="1" fill="white" opacity="0.9" />
        <rect x="8" y="22" width="36" height="2.5" rx="1" fill="white" opacity="0.5" />
        <rect x="8" y="27" width="30" height="2.5" rx="1" fill="white" opacity="0.4" />
        <rect x="8" y="32" width="25" height="2.5" rx="1" fill="white" opacity="0.3" />
        <rect x="8" y="46" width="25" height="2.5" rx="1" fill="#c4b5fd" />
        {[0,1,2,3,4].map(i => <rect key={i} x="10" y={52 + i*7} width="40" height="2" rx="1" fill="white" opacity="0.5" />)}
        <rect x="8" y="96" width="25" height="2.5" rx="1" fill="#c4b5fd" />
        {[0,1].map(i => (
          <g key={i} transform={`translate(0,${i*22})`}>
            <rect x="8" y="102" width="44" height="2.5" rx="1" fill="white" opacity="0.8" />
            <rect x="8" y="107" width="36" height="2" rx="1" fill="white" opacity="0.4" />
            <rect x="8" y="111" width="40" height="2" rx="1" fill="white" opacity="0.3" />
          </g>
        ))}
        <rect x="68" y="12" width="30" height="3" rx="2" fill="#7c3aed" />
        <rect x="68" y="18" width="84" height="2" rx="1" fill="#e5e7eb" />
        <rect x="68" y="22" width="70" height="2" rx="1" fill="#e5e7eb" />
        <rect x="68" y="32" width="30" height="3" rx="2" fill="#7c3aed" />
        {[0,1,2].map(i => (
          <g key={i} transform={`translate(0,${i*26})`}>
            <rect x="70" y="38" width="80" height="2.5" rx="1" fill="#374151" />
            <rect x="70" y="43" width="60" height="2" rx="1" fill="#7c3aed" opacity="0.5" />
            <rect x="72" y="48" width="76" height="2" rx="1" fill="#e5e7eb" />
            <rect x="72" y="52" width="60" height="2" rx="1" fill="#e5e7eb" />
          </g>
        ))}
      </svg>
    ),
  },
  {
    id: 'executive',
    name: 'Executive',
    industry: 'C-Suite / Finance / Legal',
    desc: 'Gold-accented serif layout — commands authority for senior roles',
    color: '#d97706',
    free: false,
    preview: (
      <svg viewBox="0 0 160 200" className="w-full h-full">
        <rect width="160" height="200" fill="#fffbeb" />
        <rect x="10" y="10" width="100" height="9" rx="1" fill="#1c1917" />
        <rect x="10" y="22" width="130" height="2.5" rx="1" fill="#78716c" />
        <rect x="10" y="30" width="140" height="3" fill="#d97706" />
        <rect x="10" y="40" width="4" height="5" rx="1" fill="#d97706" />
        <rect x="18" y="41" width="40" height="3" rx="1" fill="#44403c" />
        <rect x="62" y="41" width="88" height="1" fill="#fde68a" />
        <rect x="10" y="48" width="140" height="2" rx="1" fill="#d6d3d1" />
        <rect x="10" y="52" width="120" height="2" rx="1" fill="#d6d3d1" />
        <rect x="10" y="62" width="4" height="5" rx="1" fill="#d97706" />
        <rect x="18" y="63" width="50" height="3" rx="1" fill="#44403c" />
        <rect x="72" y="63" width="78" height="1" fill="#fde68a" />
        <div />
        {[0,1,2,3,4,5].map(i => (
          <g key={i}>
            <rect x="14" y={70 + i*7} width="6" height="2.5" rx="0.5" fill="#d97706" />
            <rect x="24" y={70 + i*7} width={80 + (i % 3)*20} height="2.5" rx="1" fill="#78716c" />
          </g>
        ))}
        <rect x="10" y="118" width="4" height="5" rx="1" fill="#d97706" />
        <rect x="18" y="119" width="45" height="3" rx="1" fill="#44403c" />
        <rect x="67" y="119" width="83" height="1" fill="#fde68a" />
        {[0,1,2].map(i => (
          <g key={i} transform={`translate(0,${i*20})`}>
            <rect x="10" y="126" width="90" height="3" rx="1" fill="#1c1917" />
            <rect x="10" y="131" width="60" height="2.5" rx="1" fill="#d97706" opacity="0.6" />
            <rect x="14" y="136" width="120" height="2" rx="1" fill="#e7e5e4" />
          </g>
        ))}
      </svg>
    ),
  },
  {
    id: 'tech',
    name: 'Tech',
    industry: 'Engineering / IT / Dev',
    desc: 'Dark terminal-style layout — perfect for developers and engineers',
    color: '#16a34a',
    free: false,
    preview: (
      <svg viewBox="0 0 160 200" className="w-full h-full">
        <rect width="160" height="200" fill="#030712" />
        <rect x="8" y="8" width="144" height="44" rx="3" fill="#0f172a" stroke="#166534" strokeWidth="0.5" />
        <rect x="14" y="13" width="60" height="2.5" rx="1" fill="#4ade80" opacity="0.4" />
        <rect x="14" y="19" width="80" height="5" rx="1" fill="#86efac" />
        <rect x="14" y="27" width="50" height="2" rx="1" fill="#166534" />
        <rect x="14" y="31" width="65" height="2" rx="1" fill="#166534" />
        <rect x="14" y="35" width="55" height="2" rx="1" fill="#166534" />
        <rect x="8" y="60" width="50" height="2.5" rx="1" fill="#4ade80" />
        <rect x="8" y="64" width="144" height="0.5" fill="#166534" />
        <div />
        {[0,1,2,3,4].map(i => <rect key={i} x={8 + i*28} y="68" width="24" height="7" rx="2" fill="#0f172a" stroke="#166534" strokeWidth="0.5" />)}
        {[0,1,2,3,4].map(i => <rect key={i} x={12 + i*28} y="70" width="16" height="3" rx="1" fill="#4ade80" opacity="0.6" />)}
        <rect x="8" y="84" width="50" height="2.5" rx="1" fill="#4ade80" />
        <rect x="8" y="88" width="144" height="0.5" fill="#166534" />
        {[0,1,2].map(i => (
          <g key={i} transform={`translate(0,${i*24})`}>
            <rect x="10" y="92" width="2" height="18" rx="1" fill="#166534" />
            <rect x="16" y="93" width="80" height="3" rx="1" fill="#86efac" />
            <rect x="16" y="98" width="50" height="2" rx="1" fill="#166534" />
            <rect x="18" y="103" width="110" height="2" rx="1" fill="#14532d" />
            <rect x="18" y="107" width="90" height="2" rx="1" fill="#14532d" />
          </g>
        ))}
      </svg>
    ),
  },
] as const;

type TemplateId = typeof templates[number]['id'];

export default function TemplateSelection() {
  const { data, update } = useResumeStore();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Choose Your Template</h2>
        <p className="text-gray-500 text-sm">6 industry-specific designs — pick the one that fits your career</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {templates.map((t) => {
          const isSelected = data.template === t.id;
          return (
            <button
              key={t.id}
              onClick={() => update('template', t.id as any)}
              className={`relative group rounded-xl border-2 text-left transition-all overflow-hidden ${
                isSelected ? 'border-blue-600 shadow-lg shadow-blue-100' : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
              }`}
            >
              {/* Template preview */}
              <div className="h-40 bg-gray-50 overflow-hidden">
                {t.preview}
              </div>

              {/* Selected check */}
              {isSelected && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center shadow">
                  <Check className="w-3.5 h-3.5 text-white" />
                </div>
              )}

              {/* Free / Pro badge */}
              {!t.free && (
                <div className="absolute top-2 left-2 px-2 py-0.5 text-xs font-bold rounded-full text-white"
                  style={{ background: t.color }}>
                  PRO
                </div>
              )}

              {/* Info */}
              <div className="p-3 border-t border-gray-100">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-semibold text-sm text-gray-900">{t.name}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded text-white font-medium" style={{ background: t.color }}>
                    {t.industry.split(' / ')[0]}
                  </span>
                </div>
                <p className="text-xs text-gray-500 leading-tight">{t.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-700">
        💡 All 6 templates are available. PRO templates will be paywalled after launch — use them free now!
      </div>
    </div>
  );
}
