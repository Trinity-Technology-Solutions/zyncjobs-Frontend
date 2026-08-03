import React from 'react';
import { ResumeData } from '../../store/useResumeStore';

// summary can be a string (legacy) or string[] (new multi-point)

function eduDegrees(edu: any): string {
  if (edu.ugDegree && edu.pgDegree) return `${edu.ugDegree}, ${edu.pgDegree}`;
  if (edu.ugDegree) return edu.ugDegree;
  if (edu.pgDegree) return edu.pgDegree;
  return edu.degree || '';
}
function SummaryContent({ summary, style }: { summary: any; style?: React.CSSProperties }) {
  const points: string[] = Array.isArray(summary)
    ? summary.filter(Boolean)
    : summary ? [summary] : [];
  if (!points.length) return null;
  if (points.length === 1)
    return <p style={{ margin: 0, fontSize: 12, ...style }}>{points[0]}</p>;
  return (
    <ul style={{ margin: 0, paddingLeft: 16 }}>
      {points.map((p, i) => <li key={i} style={{ fontSize: 12, marginBottom: 3, ...style }}>{p}</li>)}
    </ul>
  );
}

interface Props { data: ResumeData; scale?: number; }

const s = { fontFamily: 'Arial, sans-serif', fontSize: 13, color: '#111', lineHeight: 1.5 };

// ─── 1. CLASSIC ───────────────────────────────────────────────────────────────
// Clean, modern layout with proper hierarchy — ATS-safe
const ClassicTemplate = ({ data }: { data: ResumeData }) => (
  <div style={{ ...s, padding: '36px 40px' }}>
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a' }}>
        {data.personalInfo.name || 'Your Name'}
      </div>
      <div style={{ fontSize: 12, color: '#555', marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: '0 12px' }}>
        {data.personalInfo.email && <span>{data.personalInfo.email}</span>}
        {data.personalInfo.phone && <span>{data.personalInfo.phone}</span>}
        {data.personalInfo.location && <span>{data.personalInfo.location}</span>}
        {data.personalInfo.linkedin && <span>{data.personalInfo.linkedin}</span>}
        {data.personalInfo.portfolio && <span>{data.personalInfo.portfolio}</span>}
      </div>
    </div>
    {[
      data.summary && { label: 'Professional Summary', content: <SummaryContent summary={data.summary} /> },
      (data.skills || []).length > 0 && { label: 'Core Competencies', content: <p style={{ margin: 0, fontSize: 12, color: '#333' }}>{data.skills.join('  ·  ')}</p> },
      (data.experience || []).length > 0 && {
        label: 'Experience', content: (
          <>{data.experience.map(exp => (
            <div key={exp.id} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontWeight: 600, fontSize: 13, color: '#1a1a1a' }}>{exp.title}{exp.company ? `, ${exp.company}` : ''}</span>
                <span style={{ fontSize: 12, color: '#777', whiteSpace: 'nowrap' }}>{exp.duration}</span>
              </div>
              <ul style={{ margin: '5px 0 0 16px', padding: 0 }}>
                {exp.bullets.filter(b => b.trim()).map((b, i) => (
                  <li key={i} style={{ fontSize: 12, color: '#444', marginBottom: 3, lineHeight: 1.45 }}>{b}</li>
                ))}
              </ul>
            </div>
          ))}</>
        )
      },
      (data.education || []).length > 0 && {
        label: 'Education', content: (
          <>{data.education.map(edu => (
            <div key={edu.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
              <div>
                <span style={{ fontWeight: 600, fontSize: 12, color: '#1a1a1a' }}>{eduDegrees(edu)}</span>
                {edu.institution && <span style={{ fontSize: 12, color: '#555' }}> — {edu.institution}</span>}
                {edu.grade && <span style={{ fontSize: 11, color: '#777' }}> | {edu.grade}</span>}
              </div>
              <span style={{ fontSize: 12, color: '#777', whiteSpace: 'nowrap' }}>{edu.duration}</span>
            </div>
          ))}</>
        )
      },
    ].filter(Boolean).map((sec: any, i) => (
      <div key={i} style={{ marginBottom: 16 }}>
        <div style={{ borderBottom: '1px solid #d0d0d0', paddingBottom: 4, marginBottom: 8, fontWeight: 600, fontSize: 12, color: '#333', letterSpacing: 0.3 }}>
          {sec.label}
        </div>
        {sec.content}
      </div>
    ))}
    {data.certifications?.length > 0 && (
      <div style={{ marginBottom: 16 }}>
        <div style={{ borderBottom: '1px solid #d0d0d0', paddingBottom: 4, marginBottom: 8, fontWeight: 600, fontSize: 12, color: '#333', letterSpacing: 0.3 }}>Certifications</div>
        {data.certifications.map(c => (
          <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
            <span style={{ fontSize: 12, color: '#333' }}>{c.name}{c.issuer ? ` — ${c.issuer}` : ''}</span>
            <span style={{ fontSize: 12, color: '#777' }}>{c.year}</span>
          </div>
        ))}
      </div>
    )}
    {data.awards?.length > 0 && (
      <div style={{ marginBottom: 16 }}>
        <div style={{ borderBottom: '1px solid #d0d0d0', paddingBottom: 4, marginBottom: 8, fontWeight: 600, fontSize: 12, color: '#333', letterSpacing: 0.3 }}>Awards & Achievements</div>
        {data.awards.map(a => (
          <div key={a.id} style={{ marginBottom: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#1a1a1a' }}>{a.title}{a.issuer ? ` — ${a.issuer}` : ''}</span>
              <span style={{ fontSize: 12, color: '#777' }}>{a.year}</span>
            </div>
            {a.description && <p style={{ margin: '2px 0 0 0', fontSize: 11, color: '#666' }}>{a.description}</p>}
          </div>
        ))}
      </div>
    )}
    {data.projects?.length > 0 && (
      <div style={{ marginBottom: 16 }}>
        <div style={{ borderBottom: '1px solid #d0d0d0', paddingBottom: 4, marginBottom: 8, fontWeight: 600, fontSize: 12, color: '#333', letterSpacing: 0.3 }}>Projects</div>
        {data.projects.map(p => (
          <div key={p.id} style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontWeight: 600, fontSize: 13, color: '#1a1a1a' }}>{p.name}{p.role ? ` — ${p.role}` : ''}</span>
              <span style={{ fontSize: 12, color: '#777' }}>{p.duration}</span>
            </div>
            {p.url && <div style={{ fontSize: 11, color: '#2563eb', marginBottom: 2 }}>{p.url}</div>}
            <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
              {p.bullets.filter(b => b.trim()).map((b, i) => (
                <li key={i} style={{ fontSize: 12, color: '#444', marginBottom: 2, lineHeight: 1.45 }}>{b}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    )}
    <ExtraSections data={data} SecComp={({ label, children }: any) => (
      <div style={{ marginBottom: 16 }}>
        <div style={{ borderBottom: '1px solid #d0d0d0', paddingBottom: 4, marginBottom: 8, fontWeight: 600, fontSize: 12, color: '#333', letterSpacing: 0.3 }}>{label}</div>
        {children}
      </div>
    )} borderStyle="1px solid #d0d0d0" />
  </div>
);

// ─── 2. MODERN ────────────────────────────────────────────────────────────────
// Clean two-tone header, thin rule, compact sections
const ModernTemplate = ({ data }: { data: ResumeData }) => (
  <div style={{ ...s, padding: '32px 38px' }}>
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a' }}>{data.personalInfo.name || 'Your Name'}</div>
      <div style={{ fontSize: 12, color: '#666', marginTop: 3, display: 'flex', flexWrap: 'wrap', gap: '0 10px' }}>
        {[data.personalInfo.email, data.personalInfo.phone, data.personalInfo.location, data.personalInfo.linkedin, data.personalInfo.portfolio].filter(Boolean).map((item, i) => (
          <span key={i}>{item}{i < [data.personalInfo.email, data.personalInfo.phone, data.personalInfo.location, data.personalInfo.linkedin, data.personalInfo.portfolio].filter(Boolean).length - 1 ? ' ·' : ''}</span>
        ))}
      </div>
      <div style={{ borderBottom: '1px solid #ccc', marginTop: 10 }} />
    </div>
    {data.summary && (
      <Section label="Summary"><SummaryContent summary={data.summary} /></Section>
    )}
    {(data.skills || []).length > 0 && (
      <Section label="Skills">
        <p style={{ margin: 0, fontSize: 12, color: '#444' }}>{data.skills.join(' · ')}</p>
      </Section>
    )}
    {(data.experience || []).length > 0 && (
      <Section label="Experience">
        {data.experience.map(exp => (
          <div key={exp.id} style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontWeight: 600, fontSize: 13, color: '#1a1a1a' }}>{exp.title}</span>
              <span style={{ fontSize: 12, color: '#777' }}>{exp.duration}</span>
            </div>
            {exp.company && <div style={{ fontSize: 12, color: '#555', marginBottom: 3 }}>{exp.company}</div>}
            <ul style={{ margin: '3px 0 0 16px', padding: 0 }}>
              {exp.bullets.filter(b => b.trim()).map((b, i) => (
                <li key={i} style={{ fontSize: 12, color: '#444', marginBottom: 3, lineHeight: 1.45 }}>{b}</li>
              ))}
            </ul>
          </div>
        ))}
      </Section>
    )}
    {(data.education || []).length > 0 && (
      <Section label="Education">
        {data.education.map(edu => (
          <div key={edu.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
            <div>
              <span style={{ fontWeight: 600, fontSize: 12, color: '#1a1a1a' }}>{eduDegrees(edu)}</span>
              {edu.institution && <span style={{ fontSize: 12, color: '#555' }}> · {edu.institution}</span>}
              {edu.grade && <span style={{ fontSize: 11, color: '#777' }}> · {edu.grade}</span>}
            </div>
            <span style={{ fontSize: 12, color: '#777' }}>{edu.duration}</span>
          </div>
        ))}
      </Section>
    )}
    {data.certifications?.length > 0 && (
      <Section label="Certifications">
        {data.certifications.map(c => (
          <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
            <span style={{ fontSize: 12, color: '#333' }}>{c.name}{c.issuer ? ` — ${c.issuer}` : ''}</span>
            <span style={{ fontSize: 12, color: '#777' }}>{c.year}</span>
          </div>
        ))}
      </Section>
    )}
    {data.awards?.length > 0 && (
      <Section label="Awards & Achievements">
        {data.awards.map(a => (
          <div key={a.id} style={{ marginBottom: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#1a1a1a' }}>{a.title}{a.issuer ? ` — ${a.issuer}` : ''}</span>
              <span style={{ fontSize: 12, color: '#777' }}>{a.year}</span>
            </div>
            {a.description && <p style={{ margin: '2px 0 0 0', fontSize: 11, color: '#666' }}>{a.description}</p>}
          </div>
        ))}
      </Section>
    )}
    {data.projects?.length > 0 && (
      <Section label="Projects">
        {data.projects.map(p => (
          <div key={p.id} style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontWeight: 600, fontSize: 13, color: '#1a1a1a' }}>{p.name}</span>
              <span style={{ fontSize: 12, color: '#777' }}>{p.duration}</span>
            </div>
            {p.role && <div style={{ fontSize: 12, color: '#555', marginBottom: 2 }}>{p.role}</div>}
            {p.url && <div style={{ fontSize: 11, color: '#2563eb', marginBottom: 2 }}>{p.url}</div>}
            <ul style={{ margin: '3px 0 0 16px', padding: 0 }}>
              {p.bullets.filter(b => b.trim()).map((b, i) => (
                <li key={i} style={{ fontSize: 12, color: '#444', marginBottom: 2, lineHeight: 1.45 }}>{b}</li>
              ))}
            </ul>
          </div>
        ))}
      </Section>
    )}
    <ExtraSections data={data} SecComp={Section} borderStyle="1px solid #ccc" />
  </div>
);

// ─── 3. MINIMAL ───────────────────────────────────────────────────────────────
// Ultra-clean, lots of whitespace, small caps labels
const MinimalTemplate = ({ data }: { data: ResumeData }) => (
  <div style={{ ...s, fontFamily: 'Georgia, serif', padding: '38px 42px' }}>
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 24, fontWeight: 400, letterSpacing: 2, textTransform: 'uppercase', color: '#1a1a1a' }}>
        {data.personalInfo.name || 'Your Name'}
      </div>
      <div style={{ fontSize: 12, color: '#777', marginTop: 6, letterSpacing: 0.5 }}>
        {[data.personalInfo.email, data.personalInfo.phone, data.personalInfo.location, data.personalInfo.linkedin, data.personalInfo.portfolio].filter(Boolean).join('   ·   ')}
      </div>
    </div>
    {[
      data.summary && { label: 'About', body: <SummaryContent summary={data.summary} style={{ color: '#333' }} /> },
      (data.skills || []).length > 0 && { label: 'Skills', body: <p style={{ margin: 0, fontSize: 12, color: '#444' }}>{data.skills.join(', ')}</p> },
      (data.experience || []).length > 0 && {
        label: 'Experience', body: (
          <>{data.experience.map(exp => (
            <div key={exp.id} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontWeight: 700, fontSize: 12, color: '#1a1a1a' }}>{exp.title}{exp.company ? ` — ${exp.company}` : ''}</span>
                <span style={{ fontSize: 12, color: '#999' }}>{exp.duration}</span>
              </div>
              <ul style={{ margin: '5px 0 0 16px', padding: 0 }}>
                {exp.bullets.filter(b => b.trim()).map((b, i) => (
                  <li key={i} style={{ fontSize: 12, color: '#555', marginBottom: 3, lineHeight: 1.45 }}>{b}</li>
                ))}
              </ul>
            </div>
          ))}</>
        )
      },
      (data.education || []).length > 0 && {
        label: 'Education', body: (
          <>{data.education.map(edu => (
            <div key={edu.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
              <span style={{ fontSize: 12, color: '#333' }}>{eduDegrees(edu)}{edu.institution ? `, ${edu.institution}` : ''}</span>
              <span style={{ fontSize: 12, color: '#999' }}>{edu.duration}</span>
            </div>
          ))}</>
        )
      },
      data.certifications?.length > 0 && {
        label: 'Certifications', body: (
          <>{data.certifications.map(c => (
            <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: '#444' }}>{c.name}{c.issuer ? ` — ${c.issuer}` : ''}</span>
              <span style={{ fontSize: 12, color: '#999' }}>{c.year}</span>
            </div>
          ))}</>
        )
      },
      data.awards?.length > 0 && {
        label: 'Awards', body: (
          <>{data.awards.map(a => (
            <div key={a.id} style={{ marginBottom: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontWeight: 600, fontSize: 12, color: '#333' }}>{a.title}{a.issuer ? ` — ${a.issuer}` : ''}</span>
                <span style={{ fontSize: 12, color: '#999' }}>{a.year}</span>
              </div>
              {a.description && <p style={{ margin: '2px 0 0 0', fontSize: 11, color: '#777' }}>{a.description}</p>}
            </div>
          ))}</>
        )
      },
      data.projects?.length > 0 && {
        label: 'Projects', body: (
          <>{data.projects.map(p => (
            <div key={p.id} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontWeight: 700, fontSize: 12, color: '#1a1a1a' }}>{p.name}{p.role ? ` — ${p.role}` : ''}</span>
                <span style={{ fontSize: 12, color: '#999' }}>{p.duration}</span>
              </div>
              {p.url && <div style={{ fontSize: 11, color: '#666', marginBottom: 2 }}>{p.url}</div>}
              <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                {p.bullets.filter(b => b.trim()).map((b, i) => (
                  <li key={i} style={{ fontSize: 12, color: '#555', marginBottom: 2, lineHeight: 1.45 }}>{b}</li>
                ))}
              </ul>
            </div>
          ))}</>
        )
      },
      data.languages?.length > 0 && {
        label: 'Languages', body: <p style={{ margin: 0, fontSize: 12, color: '#444' }}>{data.languages.map((l: any) => `${l.language} (${l.proficiency})`).join(', ')}</p>
      },
      data.achievements?.length > 0 && {
        label: 'Achievements', body: (
          <>{data.achievements.map((a: any) => (
            <div key={a.id} style={{ marginBottom: 6 }}>
              {a.title && <span style={{ fontWeight: 600, fontSize: 12, color: '#333' }}>{a.title}</span>}
              {a.description && <p style={{ margin: '2px 0 0 0', fontSize: 11, color: '#777' }}>{a.description}</p>}
            </div>
          ))}</>
        )
      },
      ...(data.customSections?.filter((s: any) => s.content).map((sec: any) => ({
        label: sec.heading, body: <p style={{ margin: 0, fontSize: 12, color: '#444', whiteSpace: 'pre-wrap' }}>{sec.content}</p>
      })) || []),
    ].filter(Boolean).map((sec: any, i) => (
      <div key={i} style={{ marginBottom: 18, display: 'flex', gap: 28 }}>
        <div style={{ width: 100, flexShrink: 0, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#999', paddingTop: 3 }}>
          {sec.label}
        </div>
        <div style={{ flex: 1, borderTop: '1px solid #e0e0e0', paddingTop: 5 }}>{sec.body}</div>
      </div>
    ))}
  </div>
);

// ─── 4. EXECUTIVE ─────────────────────────────────────────────────────────────
// Double-rule header, formal serif, strong hierarchy
const ExecutiveTemplate = ({ data }: { data: ResumeData }) => (
  <div style={{ ...s, fontFamily: 'Georgia, serif', padding: '32px 38px' }}>
    <div style={{ textAlign: 'center', borderTop: '2px double #1a1a1a', borderBottom: '2px double #1a1a1a', padding: '10px 0', marginBottom: 20 }}>
      <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: '#1a1a1a' }}>
        {data.personalInfo.name || 'Your Name'}
      </div>
      <div style={{ fontSize: 12, color: '#666', marginTop: 5, display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '0 8px' }}>
        {[data.personalInfo.email, data.personalInfo.phone, data.personalInfo.location, data.personalInfo.linkedin, data.personalInfo.portfolio].filter(Boolean).join('  ·  ')}
      </div>
    </div>
    {data.summary && (
      <ExecSection label="Executive Summary">
        <SummaryContent summary={data.summary} />
      </ExecSection>
    )}
    {(data.skills || []).length > 0 && (
      <ExecSection label="Areas of Expertise">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '4px 8px' }}>
          {data.skills.map((sk, i) => <span key={i} style={{ fontSize: 12, color: '#444' }}>▸ {sk}</span>)}
        </div>
      </ExecSection>
    )}
    {(data.experience || []).length > 0 && (
      <ExecSection label="Career History">
        {data.experience.map(exp => (
          <div key={exp.id} style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontWeight: 700, fontSize: 13, color: '#1a1a1a' }}>{exp.title}</span>
              <span style={{ fontSize: 12, color: '#777' }}>{exp.duration}</span>
            </div>
            {exp.company && <div style={{ fontSize: 12, fontStyle: 'italic', color: '#555', marginBottom: 3 }}>{exp.company}</div>}
            <ul style={{ margin: '4px 0 0 18px', padding: 0 }}>
              {exp.bullets.filter(b => b.trim()).map((b, i) => (
                <li key={i} style={{ fontSize: 12, color: '#444', marginBottom: 3, lineHeight: 1.45 }}>▸ {b}</li>
              ))}
            </ul>
          </div>
        ))}
      </ExecSection>
    )}
    {(data.education || []).length > 0 && (
      <ExecSection label="Education & Credentials">
        {data.education.map(edu => (
          <div key={edu.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
            <div>
              <span style={{ fontWeight: 700, fontSize: 12, color: '#1a1a1a' }}>{eduDegrees(edu)}</span>
              {edu.institution && <span style={{ fontSize: 12, color: '#555' }}> · {edu.institution}</span>}
              {edu.grade && <span style={{ fontSize: 11, color: '#777' }}> · {edu.grade}</span>}
            </div>
            <span style={{ fontSize: 12, color: '#777' }}>{edu.duration}</span>
          </div>
        ))}
      </ExecSection>
    )}
    {data.certifications?.length > 0 && (
      <ExecSection label="Certifications">
        {data.certifications.map(c => (
          <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
            <span style={{ fontSize: 12, color: '#333' }}>{c.name}{c.issuer ? ` — ${c.issuer}` : ''}</span>
            <span style={{ fontSize: 12, color: '#777' }}>{c.year}</span>
          </div>
        ))}
      </ExecSection>
    )}
    {data.awards?.length > 0 && (
      <ExecSection label="Awards & Recognition">
        {data.awards.map(a => (
          <div key={a.id} style={{ marginBottom: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#1a1a1a' }}>{a.title}{a.issuer ? ` — ${a.issuer}` : ''}</span>
              <span style={{ fontSize: 12, color: '#777' }}>{a.year}</span>
            </div>
            {a.description && <p style={{ margin: '2px 0 0 0', fontSize: 11, color: '#666' }}>{a.description}</p>}
          </div>
        ))}
      </ExecSection>
    )}
    {data.projects?.length > 0 && (
      <ExecSection label="Projects">
        {data.projects.map(p => (
          <div key={p.id} style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontWeight: 700, fontSize: 13, color: '#1a1a1a' }}>{p.name}</span>
              <span style={{ fontSize: 12, color: '#777' }}>{p.duration}</span>
            </div>
            {p.role && <div style={{ fontSize: 12, fontStyle: 'italic', color: '#555', marginBottom: 2 }}>{p.role}</div>}
            {p.url && <div style={{ fontSize: 11, color: '#2563eb', marginBottom: 2 }}>{p.url}</div>}
            <ul style={{ margin: '3px 0 0 18px', padding: 0 }}>
              {p.bullets.filter(b => b.trim()).map((b, i) => (
                <li key={i} style={{ fontSize: 12, color: '#444', marginBottom: 2, lineHeight: 1.45 }}>▸ {b}</li>
              ))}
            </ul>
          </div>
        ))}
      </ExecSection>
    )}
    <ExtraSections data={data} SecComp={ExecSection} borderStyle="1px solid #999" />
  </div>
);

// ─── 5. COMPACT ───────────────────────────────────────────────────────────────
// Dense, fits more content, tight spacing — great for experienced candidates
const CompactTemplate = ({ data }: { data: ResumeData }) => (
  <div style={{ ...s, fontSize: 12, padding: '24px 32px' }}>
    <div style={{ borderBottom: '1px solid #333', paddingBottom: 6, marginBottom: 10 }}>
      <span style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a' }}>
        {data.personalInfo.name || 'Your Name'}
      </span>
      <div style={{ fontSize: 12, color: '#666', marginTop: 3 }}>
        {[data.personalInfo.email, data.personalInfo.phone, data.personalInfo.location, data.personalInfo.linkedin, data.personalInfo.portfolio].filter(Boolean).join(' | ')}
      </div>
    </div>
    {data.summary && (
      <CompactSection label="Summary"><SummaryContent summary={data.summary} /></CompactSection>
    )}
    {(data.skills || []).length > 0 && (
      <CompactSection label="Skills">
        <p style={{ margin: 0, color: '#444' }}>{data.skills.join(' | ')}</p>
      </CompactSection>
    )}
    {(data.experience || []).length > 0 && (
      <CompactSection label="Experience">
        {data.experience.map(exp => (
          <div key={exp.id} style={{ marginBottom: 7 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontWeight: 600, color: '#1a1a1a' }}>{exp.title}{exp.company ? ` | ${exp.company}` : ''}</span>
              <span style={{ color: '#777' }}>{exp.duration}</span>
            </div>
            <ul style={{ margin: '3px 0 0 14px', padding: 0 }}>
              {exp.bullets.filter(b => b.trim()).map((b, i) => (
                <li key={i} style={{ color: '#555', marginBottom: 2, lineHeight: 1.4 }}>{b}</li>
              ))}
            </ul>
          </div>
        ))}
      </CompactSection>
    )}
    {(data.education || []).length > 0 && (
      <CompactSection label="Education">
        {data.education.map(edu => (
          <div key={edu.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 3 }}>
            <span style={{ fontWeight: 600, color: '#333' }}>{eduDegrees(edu)}{edu.institution ? ` | ${edu.institution}` : ''}{edu.grade ? ` | ${edu.grade}` : ''}</span>
            <span style={{ color: '#777' }}>{edu.duration}</span>
          </div>
        ))}
      </CompactSection>
    )}
    {data.certifications?.length > 0 && (
      <CompactSection label="Certifications">
        {data.certifications.map(c => (
          <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 3 }}>
            <span style={{ color: '#444' }}>{c.name}{c.issuer ? ` | ${c.issuer}` : ''}</span>
            <span style={{ color: '#777' }}>{c.year}</span>
          </div>
        ))}
      </CompactSection>
    )}
    {data.awards?.length > 0 && (
      <CompactSection label="Awards">
        {data.awards.map(a => (
          <div key={a.id} style={{ marginBottom: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontWeight: 600, color: '#333' }}>{a.title}{a.issuer ? ` | ${a.issuer}` : ''}</span>
              <span style={{ color: '#777' }}>{a.year}</span>
            </div>
            {a.description && <p style={{ margin: '1px 0 0 0', color: '#888', fontSize: 11 }}>{a.description}</p>}
          </div>
        ))}
      </CompactSection>
    )}
    {data.projects?.length > 0 && (
      <CompactSection label="Projects">
        {data.projects.map(p => (
          <div key={p.id} style={{ marginBottom: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontWeight: 600, color: '#1a1a1a' }}>{p.name}{p.role ? ` | ${p.role}` : ''}</span>
              <span style={{ color: '#777' }}>{p.duration}</span>
            </div>
            {p.url && <div style={{ fontSize: 11, color: '#666', marginBottom: 1 }}>{p.url}</div>}
            <ul style={{ margin: '2px 0 0 14px', padding: 0 }}>
              {p.bullets.filter(b => b.trim()).map((b, i) => (
                <li key={i} style={{ color: '#555', marginBottom: 1, lineHeight: 1.4 }}>{b}</li>
              ))}
            </ul>
          </div>
        ))}
      </CompactSection>
    )}
    <ExtraSections data={data} SecComp={CompactSection} borderStyle="1px solid #ccc" />
  </div>
);

// ─── 6. PROFESSIONAL ──────────────────────────────────────────────────────────
// Two-column: dark sidebar for contact/skills, clean right for content
const ProfessionalTemplate = ({ data }: { data: ResumeData }) => (
  <div style={{ ...s, display: 'flex', minHeight: '100%' }}>
    <div style={{ width: '30%', background: '#1e293b', padding: '28px 18px', fontSize: 12, color: '#cbd5e1' }}>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#f1f5f9', lineHeight: 1.2 }}>{data.personalInfo.name || 'Your Name'}</div>
      </div>
      <SideSection label="Contact" color="#94a3b8" borderColor="#334155">
        {data.personalInfo.email && <div style={{ marginBottom: 3, color: '#cbd5e1' }}>{data.personalInfo.email}</div>}
        {data.personalInfo.phone && <div style={{ marginBottom: 3, color: '#cbd5e1' }}>{data.personalInfo.phone}</div>}
        {data.personalInfo.location && <div style={{ marginBottom: 3, color: '#cbd5e1' }}>{data.personalInfo.location}</div>}
        {data.personalInfo.linkedin && <div style={{ marginBottom: 3, color: '#94a3b8' }}>{data.personalInfo.linkedin}</div>}
        {data.personalInfo.portfolio && <div style={{ marginBottom: 3, color: '#94a3b8' }}>{data.personalInfo.portfolio}</div>}
      </SideSection>
      {(data.skills || []).length > 0 && (
        <SideSection label="Skills" color="#94a3b8" borderColor="#334155">
          {data.skills.map((sk, i) => <div key={i} style={{ marginBottom: 3, color: '#cbd5e1' }}>{sk}</div>)}
        </SideSection>
      )}
      {(data.education || []).length > 0 && (
        <SideSection label="Education" color="#94a3b8" borderColor="#334155">
          {data.education.map(edu => (
            <div key={edu.id} style={{ marginBottom: 8 }}>
              <div style={{ fontWeight: 600, color: '#f1f5f9' }}>{eduDegrees(edu)}</div>
              {edu.institution && <div style={{ color: '#94a3b8' }}>{edu.institution}</div>}
              {edu.duration && <div style={{ color: '#64748b' }}>{edu.duration}</div>}
              {edu.grade && <div style={{ color: '#64748b' }}>{edu.grade}</div>}
            </div>
          ))}
        </SideSection>
      )}
      {data.certifications?.length > 0 && (
        <SideSection label="Certifications" color="#94a3b8" borderColor="#334155">
          {data.certifications.map(c => (
            <div key={c.id} style={{ marginBottom: 5 }}>
              <div style={{ fontWeight: 600, color: '#f1f5f9' }}>{c.name}</div>
              {c.issuer && <div style={{ color: '#94a3b8' }}>{c.issuer}</div>}
              {c.year && <div style={{ color: '#64748b' }}>{c.year}</div>}
            </div>
          ))}
        </SideSection>
      )}
      {data.awards?.length > 0 && (
        <SideSection label="Awards" color="#94a3b8" borderColor="#334155">
          {data.awards.map(a => (
            <div key={a.id} style={{ marginBottom: 5 }}>
              <div style={{ fontWeight: 600, color: '#f1f5f9' }}>{a.title}</div>
              {a.issuer && <div style={{ color: '#94a3b8' }}>{a.issuer}</div>}
              {a.description && <div style={{ color: '#64748b' }}>{a.description}</div>}
            </div>
          ))}
        </SideSection>
      )}
    </div>
    <div style={{ flex: 1, padding: '28px 24px' }}>
      {data.summary && (
        <ProfSection label="Professional Summary">
          <SummaryContent summary={data.summary} />
        </ProfSection>
      )}
      {(data.experience || []).length > 0 && (
        <ProfSection label="Experience">
          {data.experience.map(exp => (
            <div key={exp.id} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontWeight: 600, fontSize: 13, color: '#1a1a1a' }}>{exp.title}</span>
                <span style={{ fontSize: 12, color: '#777' }}>{exp.duration}</span>
              </div>
              {exp.company && <div style={{ fontSize: 12, color: '#555', marginBottom: 3 }}>{exp.company}</div>}
              <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                {exp.bullets.filter(b => b.trim()).map((b, i) => (
                  <li key={i} style={{ fontSize: 12, color: '#444', marginBottom: 3, lineHeight: 1.45 }}>{b}</li>
                ))}
              </ul>
            </div>
          ))}
        </ProfSection>
      )}
      {data.projects?.length > 0 && (
        <ProfSection label="Projects">
          {data.projects.map(p => (
            <div key={p.id} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontWeight: 600, fontSize: 13, color: '#1a1a1a' }}>{p.name}</span>
                <span style={{ fontSize: 12, color: '#777' }}>{p.duration}</span>
              </div>
              {p.role && <div style={{ fontSize: 12, color: '#555', marginBottom: 2 }}>{p.role}</div>}
              {p.url && <div style={{ fontSize: 11, color: '#2563eb', marginBottom: 2 }}>{p.url}</div>}
              <ul style={{ margin: '3px 0 0 16px', padding: 0 }}>
                {p.bullets.filter(b => b.trim()).map((b, i) => (
                  <li key={i} style={{ fontSize: 12, color: '#444', marginBottom: 2, lineHeight: 1.45 }}>{b}</li>
                ))}
              </ul>
            </div>
          ))}
        </ProfSection>
      )}
      <ExtraSections data={data} SecComp={ProfSection} borderStyle="1px solid #ccc" />
    </div>
  </div>
);

// ─── Shared extra sections (Languages, Achievements, Custom) ─────────────────
function ExtraSections({ data, SecComp, borderStyle }: { data: ResumeData; SecComp: any; borderStyle: string }) {
  const hidden = data.hiddenSections || [];
  return (
    <>
      {!hidden.includes('languages') && data.languages?.length > 0 && (
        <SecComp label="LANGUAGES">
          <p style={{ margin: 0, fontSize: 12 }}>
            {data.languages.map(l => `${l.language} (${l.proficiency})`).join('  •  ')}
          </p>
        </SecComp>
      )}
      {!hidden.includes('achievements') && data.achievements?.length > 0 && (
        <SecComp label="ACHIEVEMENTS">
          {data.achievements.map((a: any) => (
            <div key={a.id} style={{ marginBottom: 5 }}>
              {a.title && <span style={{ fontWeight: 600, fontSize: 12 }}>{a.title}</span>}
              {a.description && <p style={{ margin: '2px 0 0 0', fontSize: 11, color: '#555' }}>{a.description}</p>}
            </div>
          ))}
        </SecComp>
      )}
      {!hidden.includes('custom') && data.customSections?.map((sec: any) => sec.content ? (
        <SecComp key={sec.id} label={sec.heading.toUpperCase()}>
          <p style={{ margin: 0, fontSize: 12, whiteSpace: 'pre-wrap' }}>{sec.content}</p>
        </SecComp>
      ) : null)}
    </>
  );
}

// ─── Shared sub-components ────────────────────────────────────────────────────
const Section = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: 14 }}>
    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: '#555', borderBottom: '1px solid #ccc', paddingBottom: 3, marginBottom: 7 }}>{label}</div>
    {children}
  </div>
);

const ExecSection = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: 14 }}>
    <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, borderBottom: '1px solid #888', paddingBottom: 3 }}>{label}</div>
    {children}
  </div>
);

const CompactSection = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: 8 }}>
    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5, marginBottom: 4, borderBottom: '1px solid #ccc', paddingBottom: 2 }}>{label}</div>
    {children}
  </div>
);

const SideSection = ({ label, children, color, borderColor }: { label: string; children: React.ReactNode; color?: string; borderColor?: string }) => (
  <div style={{ marginBottom: 16 }}>
    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: color || '#666', borderBottom: `1px solid ${borderColor || '#bbb'}`, paddingBottom: 2, marginBottom: 6 }}>{label}</div>
    {children}
  </div>
);

const ProfSection = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: 14 }}>
    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color: '#555', borderBottom: '1px solid #ccc', paddingBottom: 3, marginBottom: 7 }}>{label}</div>
    {children}
  </div>
);

// ─── ROUTER ───────────────────────────────────────────────────────────────────
export default function ResumeTemplate({ data, scale = 1 }: Props) {
  const safeScale = (typeof scale === 'number' && isFinite(scale) && scale > 0) ? scale : 1;
  const style: React.CSSProperties = safeScale !== 1 ? {
    transform: ['scale(', safeScale.toFixed(6), ')'].join(''),
    transformOrigin: 'top left',
    width: [Number((100 / safeScale).toFixed(6)), '%'].join(''),
  } : {};
  // Hide sections that user has toggled off
  const hidden = data.hiddenSections || [];
  const filtered: ResumeData = {
    ...data,
    experience: hidden.includes('experience') ? [] : data.experience,
    education: hidden.includes('education') ? [] : data.education,
    projects: hidden.includes('projects') ? [] : data.projects,
    skills: hidden.includes('skills') ? [] : data.skills,
    certifications: hidden.includes('certs') ? [] : data.certifications,
    languages: hidden.includes('languages') ? [] : data.languages,
    achievements: hidden.includes('achievements') ? [] : data.achievements,
    summary: hidden.includes('summary') ? '' : data.summary,
    awards: hidden.includes('awards') ? [] : data.awards,
    customSections: hidden.includes('custom') ? [] : data.customSections,
  };
  const inner = (() => {
    switch (data.template) {
      case 'modern':       return <ModernTemplate data={filtered} />;
      case 'minimal':      return <MinimalTemplate data={filtered} />;
      case 'executive':    return <ExecutiveTemplate data={filtered} />;
      case 'compact':      return <CompactTemplate data={filtered} />;
      case 'professional': return <ProfessionalTemplate data={filtered} />;
      default:             return <ClassicTemplate data={filtered} />;
    }
  })();
  return <div style={style}>{inner}</div>;
}
