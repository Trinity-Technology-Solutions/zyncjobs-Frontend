import React from 'react';
import { Check } from 'lucide-react';
import { useResumeStore } from '../../store/useResumeStore';

const TEMPLATES = [
  {
    id: 'classic',
    name: 'Classic',
    desc: 'Centered header, bold section rules. The most ATS-safe format.',
    preview: (
      <svg viewBox="0 0 160 200" xmlns="http://www.w3.org/2000/svg" className="w-full">
        <rect width="160" height="200" fill="#fff" />
        {/* Header centered */}
        <rect x="40" y="12" width="80" height="7" rx="1" fill="#111" />
        <rect x="30" y="23" width="100" height="3" rx="1" fill="#ccc" />
        {/* Section rule */}
        <rect x="10" y="36" width="140" height="1.5" fill="#111" />
        <rect x="10" y="40" width="60" height="3" rx="1" fill="#999" />
        <rect x="10" y="46" width="130" height="2.5" rx="1" fill="#ddd" />
        <rect x="10" y="51" width="120" height="2.5" rx="1" fill="#ddd" />
        {/* Section rule */}
        <rect x="10" y="62" width="140" height="1.5" fill="#111" />
        <rect x="10" y="66" width="50" height="3" rx="1" fill="#999" />
        <rect x="10" y="72" width="140" height="2" rx="1" fill="#ddd" />
        {/* Section rule */}
        <rect x="10" y="82" width="140" height="1.5" fill="#111" />
        <rect x="10" y="86" width="80" height="3" rx="1" fill="#555" />
        <rect x="10" y="92" width="50" height="2" rx="1" fill="#bbb" />
        <rect x="14" y="97" width="120" height="2" rx="1" fill="#ddd" />
        <rect x="14" y="102" width="110" height="2" rx="1" fill="#ddd" />
        <rect x="14" y="107" width="115" height="2" rx="1" fill="#ddd" />
        {/* Section rule */}
        <rect x="10" y="118" width="140" height="1.5" fill="#111" />
        <rect x="10" y="122" width="70" height="3" rx="1" fill="#555" />
        <rect x="10" y="128" width="100" height="2" rx="1" fill="#ddd" />
      </svg>
    ),
  },
  {
    id: 'modern',
    name: 'Modern',
    desc: 'Left-aligned name, thin rule divider. Clean and contemporary.',
    preview: (
      <svg viewBox="0 0 160 200" xmlns="http://www.w3.org/2000/svg" className="w-full">
        <rect width="160" height="200" fill="#fff" />
        <rect x="10" y="12" width="90" height="8" rx="1" fill="#111" />
        <rect x="10" y="24" width="130" height="2.5" rx="1" fill="#ccc" />
        <rect x="10" y="28" width="140" height="1.5" fill="#111" />
        <rect x="10" y="34" width="40" height="2.5" rx="1" fill="#888" />
        <rect x="10" y="39" width="130" height="2" rx="1" fill="#ddd" />
        <rect x="10" y="44" width="120" height="2" rx="1" fill="#ddd" />
        <rect x="10" y="53" width="40" height="2.5" rx="1" fill="#888" />
        <rect x="10" y="58" width="140" height="2" rx="1" fill="#ddd" />
        <rect x="10" y="67" width="40" height="2.5" rx="1" fill="#888" />
        <rect x="10" y="72" width="80" height="2.5" rx="1" fill="#555" />
        <rect x="10" y="78" width="60" height="2" rx="1" fill="#bbb" />
        <rect x="14" y="83" width="120" height="2" rx="1" fill="#ddd" />
        <rect x="14" y="88" width="110" height="2" rx="1" fill="#ddd" />
        <rect x="14" y="93" width="115" height="2" rx="1" fill="#ddd" />
        <rect x="10" y="103" width="40" height="2.5" rx="1" fill="#888" />
        <rect x="10" y="108" width="100" height="2" rx="1" fill="#ddd" />
        <rect x="10" y="113" width="90" height="2" rx="1" fill="#ddd" />
      </svg>
    ),
  },
  {
    id: 'minimal',
    name: 'Minimal',
    desc: 'Two-column layout with label sidebar. Ultra-clean whitespace.',
    preview: (
      <svg viewBox="0 0 160 200" xmlns="http://www.w3.org/2000/svg" className="w-full">
        <rect width="160" height="200" fill="#fff" />
        <rect x="10" y="12" width="100" height="7" rx="1" fill="#111" />
        <rect x="10" y="23" width="120" height="2" rx="1" fill="#ccc" />
        {/* Two-col rows */}
        {[38, 60, 90, 130].map((y, i) => (
          <g key={i}>
            <rect x="10" y={y} width="28" height="2" rx="1" fill="#aaa" />
            <rect x="44" y={y} width="106" height="1" fill="#e5e5e5" />
            <rect x="44" y={y + 5} width="100" height="2" rx="1" fill="#ddd" />
            <rect x="44" y={y + 10} width="90" height="2" rx="1" fill="#ddd" />
            {i === 2 && <rect x="44" y={y + 15} width="95" height="2" rx="1" fill="#ddd" />}
          </g>
        ))}
      </svg>
    ),
  },
  {
    id: 'executive',
    name: 'Executive',
    desc: 'Double-rule header, formal serif style. Ideal for senior roles.',
    preview: (
      <svg viewBox="0 0 160 200" xmlns="http://www.w3.org/2000/svg" className="w-full">
        <rect width="160" height="200" fill="#fff" />
        <rect x="10" y="10" width="140" height="1.5" fill="#111" />
        <rect x="10" y="13" width="140" height="1.5" fill="#111" />
        <rect x="30" y="17" width="100" height="7" rx="1" fill="#111" />
        <rect x="20" y="27" width="120" height="2.5" rx="1" fill="#ccc" />
        <rect x="10" y="32" width="140" height="1.5" fill="#111" />
        <rect x="10" y="35" width="140" height="1.5" fill="#111" />
        <rect x="10" y="43" width="80" height="2.5" rx="1" fill="#888" />
        <rect x="10" y="48" width="130" height="2" rx="1" fill="#ddd" />
        <rect x="10" y="53" width="120" height="2" rx="1" fill="#ddd" />
        <rect x="10" y="62" width="80" height="2.5" rx="1" fill="#888" />
        <rect x="10" y="67" width="80" height="2.5" rx="1" fill="#555" />
        <rect x="10" y="73" width="60" height="2" rx="1" fill="#bbb" />
        <rect x="14" y="78" width="120" height="2" rx="1" fill="#ddd" />
        <rect x="14" y="83" width="110" height="2" rx="1" fill="#ddd" />
        <rect x="10" y="93" width="80" height="2.5" rx="1" fill="#888" />
        <rect x="10" y="98" width="100" height="2" rx="1" fill="#ddd" />
      </svg>
    ),
  },
  {
    id: 'compact',
    name: 'Compact',
    desc: 'Dense layout, fits more content. Best for experienced candidates.',
    preview: (
      <svg viewBox="0 0 160 200" xmlns="http://www.w3.org/2000/svg" className="w-full">
        <rect width="160" height="200" fill="#fff" />
        <rect x="10" y="10" width="80" height="6" rx="1" fill="#111" />
        <rect x="10" y="19" width="130" height="2" rx="1" fill="#ccc" />
        <rect x="10" y="22" width="140" height="1.5" fill="#222" />
        <rect x="10" y="27" width="35" height="2" rx="1" fill="#888" />
        <rect x="10" y="30" width="140" height="1" fill="#e0e0e0" />
        <rect x="10" y="33" width="130" height="2" rx="1" fill="#ddd" />
        <rect x="10" y="38" width="35" height="2" rx="1" fill="#888" />
        <rect x="10" y="41" width="140" height="1" fill="#e0e0e0" />
        <rect x="10" y="44" width="140" height="2" rx="1" fill="#ddd" />
        <rect x="10" y="50" width="35" height="2" rx="1" fill="#888" />
        <rect x="10" y="53" width="140" height="1" fill="#e0e0e0" />
        <rect x="10" y="56" width="90" height="2" rx="1" fill="#555" />
        <rect x="10" y="61" width="60" height="2" rx="1" fill="#bbb" />
        <rect x="14" y="65" width="120" height="2" rx="1" fill="#ddd" />
        <rect x="14" y="69" width="110" height="2" rx="1" fill="#ddd" />
        <rect x="14" y="73" width="115" height="2" rx="1" fill="#ddd" />
        <rect x="10" y="79" width="90" height="2" rx="1" fill="#555" />
        <rect x="10" y="84" width="60" height="2" rx="1" fill="#bbb" />
        <rect x="14" y="88" width="120" height="2" rx="1" fill="#ddd" />
        <rect x="14" y="92" width="110" height="2" rx="1" fill="#ddd" />
      </svg>
    ),
  },
  {
    id: 'professional',
    name: 'Professional',
    desc: 'Sidebar layout with contact & skills on left. Structured and clear.',
    preview: (
      <svg viewBox="0 0 160 200" xmlns="http://www.w3.org/2000/svg" className="w-full">
        <rect width="160" height="200" fill="#fff" />
        {/* Left sidebar */}
        <rect x="0" y="0" width="50" height="200" fill="#f0f0f0" />
        <rect x="6" y="12" width="38" height="5" rx="1" fill="#111" />
        <rect x="6" y="24" width="25" height="2" rx="1" fill="#888" />
        <rect x="6" y="27" width="38" height="1" fill="#ccc" />
        <rect x="6" y="30" width="36" height="2" rx="1" fill="#bbb" />
        <rect x="6" y="34" width="32" height="2" rx="1" fill="#bbb" />
        <rect x="6" y="38" width="34" height="2" rx="1" fill="#bbb" />
        <rect x="6" y="48" width="25" height="2" rx="1" fill="#888" />
        <rect x="6" y="51" width="38" height="1" fill="#ccc" />
        <rect x="6" y="54" width="36" height="2" rx="1" fill="#bbb" />
        <rect x="6" y="58" width="30" height="2" rx="1" fill="#bbb" />
        <rect x="6" y="62" width="34" height="2" rx="1" fill="#bbb" />
        <rect x="6" y="66" width="28" height="2" rx="1" fill="#bbb" />
        {/* Right content */}
        <rect x="58" y="12" width="70" height="2.5" rx="1" fill="#888" />
        <rect x="58" y="15" width="92" height="1.5" fill="#333" />
        <rect x="58" y="19" width="90" height="2" rx="1" fill="#ddd" />
        <rect x="58" y="23" width="85" height="2" rx="1" fill="#ddd" />
        <rect x="58" y="32" width="70" height="2.5" rx="1" fill="#888" />
        <rect x="58" y="35" width="92" height="1.5" fill="#333" />
        <rect x="58" y="39" width="75" height="2.5" rx="1" fill="#555" />
        <rect x="58" y="44" width="55" height="2" rx="1" fill="#bbb" />
        <rect x="62" y="48" width="88" height="2" rx="1" fill="#ddd" />
        <rect x="62" y="52" width="80" height="2" rx="1" fill="#ddd" />
        <rect x="62" y="56" width="84" height="2" rx="1" fill="#ddd" />
        <rect x="58" y="65" width="75" height="2.5" rx="1" fill="#555" />
        <rect x="58" y="70" width="55" height="2" rx="1" fill="#bbb" />
        <rect x="62" y="74" width="88" height="2" rx="1" fill="#ddd" />
        <rect x="62" y="78" width="80" height="2" rx="1" fill="#ddd" />
      </svg>
    ),
  },
] as const;

type TemplateId = typeof TEMPLATES[number]['id'];

export default function TemplateSelection() {
  const { data, update } = useResumeStore();

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Choose a Resume Template</h2>
        <p className="text-gray-500 text-sm">All 6 templates are ATS-optimized — clean, text-only layouts that pass applicant tracking systems.</p>
        <p className="text-xs text-gray-400 mt-1">You can change your template at any time.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
        {TEMPLATES.map(t => {
          const isSelected = data.template === t.id;
          return (
            <button
              key={t.id}
              onClick={() => update('template', t.id as string)}
              className={`relative group text-left rounded-xl border-2 overflow-hidden transition-all bg-white ${
                isSelected
                  ? 'border-gray-900 shadow-lg'
                  : 'border-gray-200 hover:border-gray-400 hover:shadow-md'
              }`}
            >
              {/* Preview */}
              <div className="relative bg-white border-b border-gray-100 p-3">
                {t.preview}

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-t-xl">
                  <span className="bg-gray-900 text-white text-xs font-semibold px-3 py-1.5 rounded-lg">
                    Select Template
                  </span>
                </div>

                {/* Selected badge */}
                {isSelected && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-gray-900 rounded-full flex items-center justify-center shadow">
                    <Check className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="px-3 py-2.5">
                <div className="flex items-center justify-between mb-0.5">
                  <span className={`font-semibold text-sm ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>{t.name}</span>
                  {isSelected && <span className="text-xs text-gray-500 font-medium">Selected</span>}
                </div>
                <p className="text-xs text-gray-400 leading-snug line-clamp-2">{t.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      <p className="mt-5 text-xs text-gray-400 text-center">
        ✓ All templates use standard fonts and plain text — fully compatible with ATS systems
      </p>
    </div>
  );
}
