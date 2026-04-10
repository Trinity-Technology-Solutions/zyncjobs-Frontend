import React from 'react';
import { ResumeData } from '../../store/useResumeStore';

interface Props { data: ResumeData; scale?: number; }

// ─── shared section heading styles per template ───────────────────────────────
const SectionLabel = ({ label, template }: { label: string; template: string }) => {
  if (template === 'modern') return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-xs font-bold uppercase tracking-widest text-blue-600">{label}</span>
      <div className="flex-1 h-px bg-blue-200" />
    </div>
  );
  if (template === 'classic') return (
    <div className="mb-3 border-b-2 border-gray-800 pb-1">
      <span className="text-sm font-bold uppercase tracking-wide text-gray-800">{label}</span>
    </div>
  );
  if (template === 'minimal') return (
    <div className="mb-3">
      <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">{label}</span>
    </div>
  );
  if (template === 'creative') return (
    <div className="mb-3">
      <span className="inline-block bg-purple-600 text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full">{label}</span>
    </div>
  );
  if (template === 'executive') return (
    <div className="mb-3 flex items-center gap-3">
      <div className="w-1 h-5 bg-amber-500 rounded" />
      <span className="text-sm font-bold uppercase tracking-widest text-gray-700">{label}</span>
      <div className="flex-1 h-px bg-amber-200" />
    </div>
  );
  if (template === 'tech') return (
    <div className="mb-3">
      <span className="text-xs font-mono font-bold uppercase tracking-widest text-green-600"># {label}</span>
      <div className="h-px bg-green-200 mt-1" />
    </div>
  );
  return <div className="mb-3 font-bold uppercase text-xs text-gray-500">{label}</div>;
};

// ─── 1. MODERN ────────────────────────────────────────────────────────────────
const ModernTemplate = ({ data }: { data: ResumeData }) => (
  <div style={{ fontFamily: 'Arial, sans-serif', fontSize: 11 }}>
    {/* Header */}
    <div className="bg-blue-600 text-white px-6 py-5 rounded-t-lg">
      <h1 className="text-2xl font-bold">{data.personalInfo.name || 'Your Name'}</h1>
      <div className="flex flex-wrap gap-3 mt-1 text-blue-100 text-xs">
        {data.personalInfo.email && <span>{data.personalInfo.email}</span>}
        {data.personalInfo.phone && <span>• {data.personalInfo.phone}</span>}
        {data.personalInfo.location && <span>• {data.personalInfo.location}</span>}
      </div>
      {(data.personalInfo.linkedin || data.personalInfo.portfolio) && (
        <div className="flex gap-3 mt-1 text-blue-200 text-xs">
          {data.personalInfo.linkedin && <span>{data.personalInfo.linkedin}</span>}
          {data.personalInfo.portfolio && <span>• {data.personalInfo.portfolio}</span>}
        </div>
      )}
    </div>
    <div className="px-6 py-4 space-y-4">
      {data.summary && (
        <div><SectionLabel label="Summary" template="modern" />
          <p className="text-xs text-gray-700 leading-relaxed">{data.summary}</p>
        </div>
      )}
      {data.skills.length > 0 && (
        <div><SectionLabel label="Skills" template="modern" />
          <div className="flex flex-wrap gap-1.5">
            {data.skills.map((s, i) => <span key={i} className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full border border-blue-200">{s}</span>)}
          </div>
        </div>
      )}
      {data.experience.length > 0 && (
        <div><SectionLabel label="Experience" template="modern" />
          {data.experience.map(exp => (
            <div key={exp.id} className="mb-3">
              <div className="flex justify-between"><span className="font-semibold text-xs text-gray-900">{exp.title}</span><span className="text-xs text-gray-400">{exp.duration}</span></div>
              <span className="text-xs text-blue-600 italic">{exp.company}</span>
              <ul className="mt-1 space-y-0.5">{exp.bullets.filter(b => b.trim()).map((b, i) => <li key={i} className="text-xs text-gray-700 ml-3">• {b}</li>)}</ul>
            </div>
          ))}
        </div>
      )}
      {data.education.length > 0 && (
        <div><SectionLabel label="Education" template="modern" />
          {data.education.map(edu => (
            <div key={edu.id} className="mb-2">
              <div className="flex justify-between"><span className="font-semibold text-xs text-gray-900">{edu.degree}</span><span className="text-xs text-gray-400">{edu.duration}</span></div>
              <span className="text-xs text-blue-600 italic">{edu.institution}</span>
              {edu.grade && <p className="text-xs text-gray-500">Grade: {edu.grade}</p>}
            </div>
          ))}
        </div>
      )}
      {data.certifications?.length > 0 && (
        <div><SectionLabel label="Certifications" template="modern" />
          {data.certifications.map(c => (
            <div key={c.id} className="flex justify-between items-baseline mb-1">
              <span className="text-xs font-semibold text-gray-900">{c.name}{c.issuer ? <span className="font-normal text-gray-500"> — {c.issuer}</span> : ''}</span>
              <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{c.year}</span>
            </div>
          ))}
        </div>
      )}
      {data.awards?.length > 0 && (
        <div><SectionLabel label="Awards & Achievements" template="modern" />
          {data.awards.map(a => (
            <div key={a.id} className="mb-2">
              <div className="flex justify-between items-baseline">
                <span className="text-xs font-semibold text-gray-900">{a.title}{a.issuer ? <span className="font-normal text-gray-500"> — {a.issuer}</span> : ''}</span>
                <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{a.year}</span>
              </div>
              {a.description && <p className="text-xs text-gray-500 ml-1">{a.description}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);

// ─── 2. CLASSIC ───────────────────────────────────────────────────────────────
const ClassicTemplate = ({ data }: { data: ResumeData }) => (
  <div style={{ fontFamily: 'Georgia, serif', fontSize: 11 }} className="px-6 py-5">
    <div className="text-center border-b-2 border-gray-800 pb-4 mb-4">
      <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-widest">{data.personalInfo.name || 'Your Name'}</h1>
      <div className="flex justify-center flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-gray-600">
        {data.personalInfo.email && <span>{data.personalInfo.email}</span>}
        {data.personalInfo.phone && <span>| {data.personalInfo.phone}</span>}
        {data.personalInfo.location && <span>| {data.personalInfo.location}</span>}
      </div>
      {(data.personalInfo.linkedin || data.personalInfo.portfolio) && (
        <div className="flex justify-center flex-wrap gap-x-3 mt-0.5 text-xs text-gray-500">
          {data.personalInfo.linkedin && <span>{data.personalInfo.linkedin}</span>}
          {data.personalInfo.portfolio && <span>| {data.personalInfo.portfolio}</span>}
        </div>
      )}
    </div>
    <div className="space-y-4">
      {data.summary && (<div><SectionLabel label="Professional Summary" template="classic" /><p className="text-xs text-gray-700 leading-relaxed">{data.summary}</p></div>)}
      {data.skills.length > 0 && (<div><SectionLabel label="Core Competencies" template="classic" /><p className="text-xs text-gray-700">{data.skills.join('  •  ')}</p></div>)}
      {data.experience.length > 0 && (
        <div><SectionLabel label="Professional Experience" template="classic" />
          {data.experience.map(exp => (
            <div key={exp.id} className="mb-3">
              <div className="flex justify-between items-baseline">
                <span className="font-bold text-xs text-gray-900">{exp.title}{exp.company ? `, ${exp.company}` : ''}</span>
                <span className="text-xs text-gray-500 italic flex-shrink-0 ml-2">{exp.duration}</span>
              </div>
              <ul className="mt-1 space-y-0.5">{exp.bullets.filter(b => b.trim()).map((b, i) => <li key={i} className="text-xs text-gray-700 ml-4">• {b}</li>)}</ul>
            </div>
          ))}
        </div>
      )}
      {data.education.length > 0 && (
        <div><SectionLabel label="Education" template="classic" />
          {data.education.map(edu => (
            <div key={edu.id} className="mb-2">
              <div className="flex justify-between items-baseline">
                <div><span className="font-bold text-xs text-gray-900">{edu.degree}</span>{edu.institution ? <span className="text-xs text-gray-600">, {edu.institution}</span> : null}</div>
                <span className="text-xs text-gray-500 italic flex-shrink-0 ml-2">{edu.duration}{edu.grade ? ` | ${edu.grade}` : ''}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      {data.certifications?.length > 0 && (
        <div><SectionLabel label="Certifications" template="classic" />
          {data.certifications.map(c => (
            <div key={c.id} className="flex justify-between items-baseline mb-1">
              <span className="text-xs text-gray-900 font-semibold">{c.name}{c.issuer ? ` — ${c.issuer}` : ''}</span>
              <span className="text-xs text-gray-500 italic flex-shrink-0 ml-2">{c.year}</span>
            </div>
          ))}
        </div>
      )}
      {data.awards?.length > 0 && (
        <div><SectionLabel label="Awards & Achievements" template="classic" />
          {data.awards.map(a => (
            <div key={a.id} className="mb-2">
              <div className="flex justify-between items-baseline">
                <span className="text-xs font-bold text-gray-900">{a.title}{a.issuer ? ` — ${a.issuer}` : ''}</span>
                <span className="text-xs text-gray-500 italic flex-shrink-0 ml-2">{a.year}</span>
              </div>
              {a.description && <p className="text-xs text-gray-600 ml-2">{a.description}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);

// ─── 3. MINIMAL ───────────────────────────────────────────────────────────────
const MinimalTemplate = ({ data }: { data: ResumeData }) => (
  <div style={{ fontFamily: 'Helvetica, sans-serif', fontSize: 11 }} className="px-8 py-6">
    <div className="mb-6">
      <h1 className="text-3xl font-light text-gray-900 tracking-tight">{data.personalInfo.name || 'Your Name'}</h1>
      <div className="text-xs text-gray-400 mt-1 space-x-3">
        {[data.personalInfo.email, data.personalInfo.phone, data.personalInfo.location].filter(Boolean).map((v, i) => <span key={i}>{v}</span>)}
      </div>
    </div>
    <div className="space-y-5">
      {data.summary && (<div><SectionLabel label="About" template="minimal" /><p className="text-xs text-gray-600 leading-relaxed">{data.summary}</p></div>)}
      {data.skills.length > 0 && (<div><SectionLabel label="Skills" template="minimal" /><p className="text-xs text-gray-600">{data.skills.join(', ')}</p></div>)}
      {data.experience.length > 0 && (
        <div><SectionLabel label="Experience" template="minimal" />
          {data.experience.map(exp => (
            <div key={exp.id} className="mb-3">
              <div className="flex justify-between"><span className="text-xs font-medium text-gray-800">{exp.title} — {exp.company}</span><span className="text-xs text-gray-400">{exp.duration}</span></div>
              <ul className="mt-1">{exp.bullets.filter(b => b.trim()).map((b, i) => <li key={i} className="text-xs text-gray-500 ml-3">– {b}</li>)}</ul>
            </div>
          ))}
        </div>
      )}
      {data.education.length > 0 && (
        <div><SectionLabel label="Education" template="minimal" />
          {data.education.map(edu => (
            <div key={edu.id} className="mb-2 flex justify-between">
              <span className="text-xs text-gray-700">{edu.degree}, {edu.institution}</span>
              <span className="text-xs text-gray-400">{edu.duration}</span>
            </div>
          ))}
        </div>
      )}
      {data.certifications?.length > 0 && (
        <div><SectionLabel label="Certifications" template="minimal" />
          {data.certifications.map(c => (
            <div key={c.id} className="flex justify-between mb-1">
              <span className="text-xs text-gray-600">{c.name}{c.issuer ? `, ${c.issuer}` : ''}</span>
              <span className="text-xs text-gray-400">{c.year}</span>
            </div>
          ))}
        </div>
      )}
      {data.awards?.length > 0 && (
        <div><SectionLabel label="Awards" template="minimal" />
          {data.awards.map(a => (
            <div key={a.id} className="mb-1">
              <div className="flex justify-between">
                <span className="text-xs text-gray-700">{a.title}{a.issuer ? `, ${a.issuer}` : ''}</span>
                <span className="text-xs text-gray-400">{a.year}</span>
              </div>
              {a.description && <p className="text-xs text-gray-400 ml-2">{a.description}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);

// ─── 4. CREATIVE (Design / Marketing) ────────────────────────────────────────
const CreativeTemplate = ({ data }: { data: ResumeData }) => (
  <div style={{ fontFamily: 'Arial, sans-serif', fontSize: 11 }} className="flex min-h-full">
    {/* Left sidebar */}
    <div className="w-2/5 bg-purple-700 text-white px-4 py-5 space-y-4">
      <div>
        <h1 className="text-xl font-bold leading-tight">{data.personalInfo.name || 'Your Name'}</h1>
        <div className="mt-2 space-y-1 text-purple-200 text-xs">
          {data.personalInfo.email && <div>✉ {data.personalInfo.email}</div>}
          {data.personalInfo.phone && <div>📞 {data.personalInfo.phone}</div>}
          {data.personalInfo.location && <div>📍 {data.personalInfo.location}</div>}
          {data.personalInfo.linkedin && <div>🔗 {data.personalInfo.linkedin}</div>}
        </div>
      </div>
      {data.skills.length > 0 && (
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-purple-300 mb-2">Skills</div>
          <div className="space-y-1">{data.skills.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-purple-300 rounded-full flex-shrink-0" />
              <span className="text-xs text-purple-100">{s}</span>
            </div>
          ))}</div>
        </div>
      )}
      {data.education.length > 0 && (
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-purple-300 mb-2">Education</div>
          {data.education.map(edu => (
            <div key={edu.id} className="mb-2">
              <div className="text-xs font-semibold text-white">{edu.degree}</div>
              <div className="text-xs text-purple-200">{edu.institution}</div>
              <div className="text-xs text-purple-300">{edu.duration}</div>
            </div>
          ))}
        </div>
      )}
    </div>
    {/* Right content */}
    <div className="flex-1 px-5 py-5 space-y-4">
      {data.summary && (
        <div><SectionLabel label="Profile" template="creative" />
          <p className="text-xs text-gray-700 leading-relaxed">{data.summary}</p>
        </div>
      )}
      {data.experience.length > 0 && (
        <div><SectionLabel label="Experience" template="creative" />
          {data.experience.map(exp => (
            <div key={exp.id} className="mb-3 pl-3 border-l-2 border-purple-200">
              <div className="font-bold text-xs text-gray-900">{exp.title}</div>
              <div className="text-xs text-purple-600 italic">{exp.company} · {exp.duration}</div>
              <ul className="mt-1">{exp.bullets.filter(b => b.trim()).map((b, i) => <li key={i} className="text-xs text-gray-600 ml-2">• {b}</li>)}</ul>
            </div>
          ))}
        </div>
      )}
      {data.certifications?.length > 0 && (
        <div><SectionLabel label="Certifications" template="creative" />
          {data.certifications.map(c => (
            <div key={c.id} className="flex justify-between mb-1">
              <span className="text-xs text-gray-800 font-medium">{c.name}{c.issuer ? ` — ${c.issuer}` : ''}</span>
              <span className="text-xs text-purple-500 flex-shrink-0 ml-2">{c.year}</span>
            </div>
          ))}
        </div>
      )}
      {data.awards?.length > 0 && (
        <div><SectionLabel label="Awards" template="creative" />
          {data.awards.map(a => (
            <div key={a.id} className="mb-2">
              <div className="flex justify-between">
                <span className="text-xs font-bold text-gray-900">{a.title}</span>
                <span className="text-xs text-purple-500 flex-shrink-0 ml-2">{a.year}</span>
              </div>
              {a.description && <p className="text-xs text-gray-500">{a.description}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);

// ─── 5. EXECUTIVE (Finance / Legal / C-Suite) ─────────────────────────────────
const ExecutiveTemplate = ({ data }: { data: ResumeData }) => (
  <div style={{ fontFamily: 'Georgia, serif', fontSize: 11 }} className="px-6 py-5">
    <div className="flex items-end justify-between border-b-4 border-amber-500 pb-3 mb-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-wide">{data.personalInfo.name || 'Your Name'}</h1>
        <div className="text-xs text-gray-500 mt-1">{[data.personalInfo.email, data.personalInfo.phone, data.personalInfo.location].filter(Boolean).join('  ·  ')}</div>
      </div>
      {(data.personalInfo.linkedin || data.personalInfo.portfolio) && (
        <div className="text-xs text-amber-700 text-right">{[data.personalInfo.linkedin, data.personalInfo.portfolio].filter(Boolean).join('\n')}</div>
      )}
    </div>
    <div className="space-y-4">
      {data.summary && (<div><SectionLabel label="Executive Summary" template="executive" /><p className="text-xs text-gray-700 leading-relaxed italic">{data.summary}</p></div>)}
      {data.skills.length > 0 && (
        <div><SectionLabel label="Areas of Expertise" template="executive" />
          <div className="grid grid-cols-3 gap-1">{data.skills.map((s, i) => <div key={i} className="text-xs text-gray-700 flex items-center gap-1"><span className="text-amber-500">▸</span>{s}</div>)}</div>
        </div>
      )}
      {data.experience.length > 0 && (
        <div><SectionLabel label="Career History" template="executive" />
          {data.experience.map(exp => (
            <div key={exp.id} className="mb-3">
              <div className="flex justify-between items-baseline">
                <span className="font-bold text-xs text-gray-900">{exp.title}</span>
                <span className="text-xs text-amber-700 font-semibold">{exp.duration}</span>
              </div>
              <div className="text-xs text-gray-600 italic mb-1">{exp.company}</div>
              <ul>{exp.bullets.filter(b => b.trim()).map((b, i) => <li key={i} className="text-xs text-gray-700 ml-3">▸ {b}</li>)}</ul>
            </div>
          ))}
        </div>
      )}
      {data.education.length > 0 && (
        <div><SectionLabel label="Education & Credentials" template="executive" />
          {data.education.map(edu => (
            <div key={edu.id} className="mb-2 flex justify-between">
              <div><span className="font-bold text-xs text-gray-900">{edu.degree}</span><span className="text-xs text-gray-600"> · {edu.institution}</span></div>
              <span className="text-xs text-gray-500">{edu.duration}{edu.grade ? ` · ${edu.grade}` : ''}</span>
            </div>
          ))}
        </div>
      )}
      {data.certifications?.length > 0 && (
        <div><SectionLabel label="Certifications" template="executive" />
          {data.certifications.map(c => (
            <div key={c.id} className="flex justify-between mb-1">
              <span className="text-xs text-gray-800 font-semibold">{c.name}{c.issuer ? ` — ${c.issuer}` : ''}</span>
              <span className="text-xs text-amber-700 flex-shrink-0 ml-2">{c.year}</span>
            </div>
          ))}
        </div>
      )}
      {data.awards?.length > 0 && (
        <div><SectionLabel label="Awards & Recognition" template="executive" />
          {data.awards.map(a => (
            <div key={a.id} className="mb-2">
              <div className="flex justify-between">
                <span className="text-xs font-bold text-gray-900">{a.title}{a.issuer ? ` — ${a.issuer}` : ''}</span>
                <span className="text-xs text-amber-700 flex-shrink-0 ml-2">{a.year}</span>
              </div>
              {a.description && <p className="text-xs text-gray-600 italic ml-3">{a.description}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);

// ─── 6. TECH (Engineering / IT / Developer) ───────────────────────────────────
const TechTemplate = ({ data }: { data: ResumeData }) => (
  <div style={{ fontFamily: 'monospace', fontSize: 10.5 }} className="bg-gray-950 text-green-400 px-6 py-5 min-h-full">
    <div className="border border-green-700 rounded px-4 py-3 mb-4">
      <div className="text-green-300 text-xs mb-1">{'// developer profile'}</div>
      <h1 className="text-xl font-bold text-green-300">{data.personalInfo.name || 'Your Name'}</h1>
      <div className="text-green-600 text-xs mt-1 space-y-0.5">
        {data.personalInfo.email && <div>email: <span className="text-green-400">"{data.personalInfo.email}"</span></div>}
        {data.personalInfo.phone && <div>phone: <span className="text-green-400">"{data.personalInfo.phone}"</span></div>}
        {data.personalInfo.location && <div>location: <span className="text-green-400">"{data.personalInfo.location}"</span></div>}
        {data.personalInfo.linkedin && <div>linkedin: <span className="text-green-400">"{data.personalInfo.linkedin}"</span></div>}
        {data.personalInfo.portfolio && <div>portfolio: <span className="text-green-400">"{data.personalInfo.portfolio}"</span></div>}
      </div>
    </div>
    <div className="space-y-4">
      {data.summary && (
        <div><SectionLabel label="About" template="tech" />
          <p className="text-xs text-green-300 leading-relaxed pl-2 border-l border-green-800">{data.summary}</p>
        </div>
      )}
      {data.skills.length > 0 && (
        <div><SectionLabel label="Tech Stack" template="tech" />
          <div className="flex flex-wrap gap-1.5 pl-2">
            {data.skills.map((s, i) => <span key={i} className="bg-green-900 text-green-300 text-xs px-2 py-0.5 rounded border border-green-700">{s}</span>)}
          </div>
        </div>
      )}
      {data.experience.length > 0 && (
        <div><SectionLabel label="Experience" template="tech" />
          {data.experience.map(exp => (
            <div key={exp.id} className="mb-3 pl-2 border-l border-green-800">
              <div className="text-green-200 font-bold text-xs">{exp.title} <span className="text-green-600">@</span> {exp.company}</div>
              {exp.duration && <div className="text-green-700 text-xs">// {exp.duration}</div>}
              <ul className="mt-1">{exp.bullets.filter(b => b.trim()).map((b, i) => <li key={i} className="text-xs text-green-400 ml-2">→ {b}</li>)}</ul>
            </div>
          ))}
        </div>
      )}
      {data.education.length > 0 && (
        <div><SectionLabel label="Education" template="tech" />
          {data.education.map(edu => (
            <div key={edu.id} className="mb-2 pl-2">
              <span className="text-green-200 text-xs font-bold">{edu.degree}</span>
              <span className="text-green-600 text-xs"> · {edu.institution}</span>
              {edu.duration && <span className="text-green-700 text-xs"> // {edu.duration}</span>}
            </div>
          ))}
        </div>
      )}
      {data.certifications?.length > 0 && (
        <div><SectionLabel label="Certifications" template="tech" />
          {data.certifications.map(c => (
            <div key={c.id} className="flex justify-between mb-1 pl-2">
              <span className="text-green-300 text-xs">{c.name}{c.issuer ? ` // ${c.issuer}` : ''}</span>
              <span className="text-green-700 text-xs flex-shrink-0 ml-2">{c.year}</span>
            </div>
          ))}
        </div>
      )}
      {data.awards?.length > 0 && (
        <div><SectionLabel label="Awards" template="tech" />
          {data.awards.map(a => (
            <div key={a.id} className="mb-2 pl-2">
              <div className="flex justify-between">
                <span className="text-green-200 text-xs font-bold">{a.title}{a.issuer ? ` @ ${a.issuer}` : ''}</span>
                <span className="text-green-700 text-xs flex-shrink-0 ml-2">{a.year}</span>
              </div>
              {a.description && <p className="text-green-600 text-xs">→ {a.description}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);

// ─── ROUTER ───────────────────────────────────────────────────────────────────
export default function ResumeTemplate({ data, scale = 1 }: Props) {
  const style = scale !== 1 ? { transform: `scale(${scale})`, transformOrigin: 'top left', width: `${100 / scale}%` } : {};
  const inner = (() => {
    switch (data.template) {
      case 'classic':   return <ClassicTemplate data={data} />;
      case 'minimal':   return <MinimalTemplate data={data} />;
      case 'creative':  return <CreativeTemplate data={data} />;
      case 'executive': return <ExecutiveTemplate data={data} />;
      case 'tech':      return <TechTemplate data={data} />;
      default:          return <ModernTemplate data={data} />;
    }
  })();
  return <div style={style}>{inner}</div>;
}
