import React from 'react';
import { ResumeData } from '../../store/useResumeStore';

interface Props { data: ResumeData; scale?: number; }

const s = { fontFamily: 'Arial, sans-serif', fontSize: 11, color: '#111', lineHeight: 1.4 };

// ─── 1. CLASSIC ───────────────────────────────────────────────────────────────
// Centered header, bold section lines — most ATS-safe
const ClassicTemplate = ({ data }: { data: ResumeData }) => (
  <div style={{ ...s, padding: '32px 36px' }}>
    {/* Header */}
    <div style={{ textAlign: 'center', marginBottom: 14 }}>
      <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>
        {data.personalInfo.name || 'Your Name'}
      </div>
      <div style={{ fontSize: 10, marginTop: 4, color: '#333' }}>
        {[data.personalInfo.email, data.personalInfo.phone, data.personalInfo.location].filter(Boolean).join('  |  ')}
      </div>
      {(data.personalInfo.linkedin || data.personalInfo.portfolio) && (
        <div style={{ fontSize: 10, color: '#333', marginTop: 2 }}>
          {[data.personalInfo.linkedin, data.personalInfo.portfolio].filter(Boolean).join('  |  ')}
        </div>
      )}
    </div>

    {/* Section helper */}
    {[
      data.summary && { label: 'PROFESSIONAL SUMMARY', content: <p style={{ margin: 0, fontSize: 10.5 }}>{data.summary}</p> },
      data.skills.length > 0 && { label: 'CORE COMPETENCIES', content: <p style={{ margin: 0, fontSize: 10.5 }}>{data.skills.join('  •  ')}</p> },
      data.experience.length > 0 && {
        label: 'PROFESSIONAL EXPERIENCE', content: (
          <>{data.experience.map(exp => (
            <div key={exp.id} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700, fontSize: 10.5 }}>{exp.title}{exp.company ? `, ${exp.company}` : ''}</span>
                <span style={{ fontSize: 10, color: '#444' }}>{exp.duration}</span>
              </div>
              <ul style={{ margin: '3px 0 0 16px', padding: 0 }}>
                {exp.bullets.filter(b => b.trim()).map((b, i) => <li key={i} style={{ fontSize: 10.5, marginBottom: 2 }}>{b}</li>)}
              </ul>
            </div>
          ))}</>
        )
      },
      data.education.length > 0 && {
        label: 'EDUCATION', content: (
          <>{data.education.map(edu => (
            <div key={edu.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <div>
                <span style={{ fontWeight: 700, fontSize: 10.5 }}>{edu.degree}</span>
                {edu.institution && <span style={{ fontSize: 10.5 }}>, {edu.institution}</span>}
                {edu.grade && <span style={{ fontSize: 10, color: '#555' }}> — {edu.grade}</span>}
              </div>
              <span style={{ fontSize: 10, color: '#444' }}>{edu.duration}</span>
            </div>
          ))}</>
        )
      },
    ].filter(Boolean).map((sec: any, i) => (
      <div key={i} style={{ marginBottom: 12 }}>
        <div style={{ borderBottom: '1.5px solid #111', paddingBottom: 2, marginBottom: 6, fontWeight: 700, fontSize: 10.5, letterSpacing: 0.5 }}>
          {sec.label}
        </div>
        {sec.content}
      </div>
    ))}
    {data.certifications?.length > 0 && (
      <div style={{ marginBottom: 12 }}>
        <div style={{ borderBottom: '1.5px solid #111', paddingBottom: 2, marginBottom: 6, fontWeight: 700, fontSize: 10.5, letterSpacing: 0.5 }}>CERTIFICATIONS</div>
        {data.certifications.map(c => (
          <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span style={{ fontSize: 10.5, fontWeight: 600 }}>{c.name}{c.issuer ? ` — ${c.issuer}` : ''}</span>
            <span style={{ fontSize: 10, color: '#444' }}>{c.year}</span>
          </div>
        ))}
      </div>
    )}
    {data.awards?.length > 0 && (
      <div style={{ marginBottom: 12 }}>
        <div style={{ borderBottom: '1.5px solid #111', paddingBottom: 2, marginBottom: 6, fontWeight: 700, fontSize: 10.5, letterSpacing: 0.5 }}>AWARDS & ACHIEVEMENTS</div>
        {data.awards.map(a => (
          <div key={a.id} style={{ marginBottom: 5 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 10.5, fontWeight: 600 }}>{a.title}{a.issuer ? ` — ${a.issuer}` : ''}</span>
              <span style={{ fontSize: 10, color: '#444' }}>{a.year}</span>
            </div>
            {a.description && <p style={{ margin: '2px 0 0 0', fontSize: 10, color: '#555' }}>{a.description}</p>}
          </div>
        ))}
      </div>
    )}
  </div>
);

// ─── 2. MODERN ────────────────────────────────────────────────────────────────
// Left-aligned name, thin rule under header, compact
const ModernTemplate = ({ data }: { data: ResumeData }) => (
  <div style={{ ...s, padding: '28px 36px' }}>
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 22, fontWeight: 700 }}>{data.personalInfo.name || 'Your Name'}</div>
      <div style={{ fontSize: 10, color: '#444', marginTop: 3 }}>
        {[data.personalInfo.email, data.personalInfo.phone, data.personalInfo.location, data.personalInfo.linkedin, data.personalInfo.portfolio].filter(Boolean).join('  ·  ')}
      </div>
      <div style={{ borderBottom: '2px solid #111', marginTop: 8 }} />
    </div>

    {data.summary && (
      <Section label="Summary">
        <p style={{ margin: 0, fontSize: 10.5 }}>{data.summary}</p>
      </Section>
    )}
    {data.skills.length > 0 && (
      <Section label="Skills">
        <p style={{ margin: 0, fontSize: 10.5 }}>{data.skills.join(' · ')}</p>
      </Section>
    )}
    {data.experience.length > 0 && (
      <Section label="Experience">
        {data.experience.map(exp => (
          <div key={exp.id} style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontWeight: 700, fontSize: 11 }}>{exp.title}</span>
              <span style={{ fontSize: 10, color: '#555' }}>{exp.duration}</span>
            </div>
            {exp.company && <div style={{ fontSize: 10.5, fontStyle: 'italic', color: '#333' }}>{exp.company}</div>}
            <ul style={{ margin: '3px 0 0 16px', padding: 0 }}>
              {exp.bullets.filter(b => b.trim()).map((b, i) => <li key={i} style={{ fontSize: 10.5, marginBottom: 2 }}>{b}</li>)}
            </ul>
          </div>
        ))}
      </Section>
    )}
    {data.education.length > 0 && (
      <Section label="Education">
        {data.education.map(edu => (
          <div key={edu.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <div>
              <span style={{ fontWeight: 700, fontSize: 10.5 }}>{edu.degree}</span>
              {edu.institution && <span style={{ fontSize: 10.5 }}>, {edu.institution}</span>}
              {edu.grade && <span style={{ fontSize: 10, color: '#555' }}> · {edu.grade}</span>}
            </div>
            <span style={{ fontSize: 10, color: '#555' }}>{edu.duration}</span>
          </div>
        ))}
      </Section>
    )}
    {data.certifications?.length > 0 && (
      <Section label="Certifications">
        {data.certifications.map(c => (
          <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span style={{ fontSize: 10.5, fontWeight: 600 }}>{c.name}{c.issuer ? ` — ${c.issuer}` : ''}</span>
            <span style={{ fontSize: 10, color: '#555' }}>{c.year}</span>
          </div>
        ))}
      </Section>
    )}
    {data.awards?.length > 0 && (
      <Section label="Awards & Achievements">
        {data.awards.map(a => (
          <div key={a.id} style={{ marginBottom: 5 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 10.5, fontWeight: 600 }}>{a.title}{a.issuer ? ` — ${a.issuer}` : ''}</span>
              <span style={{ fontSize: 10, color: '#555' }}>{a.year}</span>
            </div>
            {a.description && <p style={{ margin: '2px 0 0 0', fontSize: 10, color: '#666' }}>{a.description}</p>}
          </div>
        ))}
      </Section>
    )}
  </div>
);

// ─── 3. MINIMAL ───────────────────────────────────────────────────────────────
// Ultra-clean, lots of whitespace, small caps labels
const MinimalTemplate = ({ data }: { data: ResumeData }) => (
  <div style={{ ...s, fontFamily: 'Georgia, serif', padding: '36px 40px' }}>
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 24, fontWeight: 400, letterSpacing: 2, textTransform: 'uppercase' }}>
        {data.personalInfo.name || 'Your Name'}
      </div>
      <div style={{ fontSize: 9.5, color: '#666', marginTop: 5, letterSpacing: 0.5 }}>
        {[data.personalInfo.email, data.personalInfo.phone, data.personalInfo.location].filter(Boolean).join('   ·   ')}
      </div>
    </div>

    {[
      data.summary && { label: 'About', body: <p style={{ margin: 0, fontSize: 10.5, color: '#222' }}>{data.summary}</p> },
      data.skills.length > 0 && { label: 'Skills', body: <p style={{ margin: 0, fontSize: 10.5, color: '#222' }}>{data.skills.join(', ')}</p> },
      data.experience.length > 0 && {
        label: 'Experience', body: (
          <>{data.experience.map(exp => (
            <div key={exp.id} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700, fontSize: 10.5 }}>{exp.title}{exp.company ? ` — ${exp.company}` : ''}</span>
                <span style={{ fontSize: 10, color: '#777' }}>{exp.duration}</span>
              </div>
              <ul style={{ margin: '3px 0 0 14px', padding: 0 }}>
                {exp.bullets.filter(b => b.trim()).map((b, i) => <li key={i} style={{ fontSize: 10.5, color: '#333', marginBottom: 2 }}>{b}</li>)}
              </ul>
            </div>
          ))}</>
        )
      },
      data.education.length > 0 && {
        label: 'Education', body: (
          <>{data.education.map(edu => (
            <div key={edu.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 10.5 }}>{edu.degree}{edu.institution ? `, ${edu.institution}` : ''}</span>
              <span style={{ fontSize: 10, color: '#777' }}>{edu.duration}</span>
            </div>
          ))}</>
        )
      },
    ].filter(Boolean).map((sec: any, i) => (
      <div key={i} style={{ marginBottom: 14, display: 'flex', gap: 20 }}>
        <div style={{ width: 80, flexShrink: 0, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#888', paddingTop: 2 }}>
          {sec.label}
        </div>
        <div style={{ flex: 1, borderTop: '1px solid #ddd', paddingTop: 4 }}>{sec.body}</div>
      </div>
    ))}
    {data.certifications?.length > 0 && (
      <div style={{ marginBottom: 14, display: 'flex', gap: 20 }}>
        <div style={{ width: 80, flexShrink: 0, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#888', paddingTop: 2 }}>Certs</div>
        <div style={{ flex: 1, borderTop: '1px solid #ddd', paddingTop: 4 }}>
          {data.certifications.map(c => (
            <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span style={{ fontSize: 10.5 }}>{c.name}{c.issuer ? `, ${c.issuer}` : ''}</span>
              <span style={{ fontSize: 10, color: '#777' }}>{c.year}</span>
            </div>
          ))}
        </div>
      </div>
    )}
    {data.awards?.length > 0 && (
      <div style={{ marginBottom: 14, display: 'flex', gap: 20 }}>
        <div style={{ width: 80, flexShrink: 0, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#888', paddingTop: 2 }}>Awards</div>
        <div style={{ flex: 1, borderTop: '1px solid #ddd', paddingTop: 4 }}>
          {data.awards.map(a => (
            <div key={a.id} style={{ marginBottom: 5 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 10.5 }}>{a.title}{a.issuer ? `, ${a.issuer}` : ''}</span>
                <span style={{ fontSize: 10, color: '#777' }}>{a.year}</span>
              </div>
              {a.description && <p style={{ margin: '2px 0 0 0', fontSize: 10, color: '#888' }}>{a.description}</p>}
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);

// ─── 4. EXECUTIVE ─────────────────────────────────────────────────────────────
// Double-rule header, formal serif, strong hierarchy
const ExecutiveTemplate = ({ data }: { data: ResumeData }) => (
  <div style={{ ...s, fontFamily: 'Georgia, serif', padding: '30px 36px' }}>
    <div style={{ textAlign: 'center', borderTop: '3px double #111', borderBottom: '3px double #111', padding: '10px 0', marginBottom: 16 }}>
      <div style={{ fontSize: 21, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase' }}>
        {data.personalInfo.name || 'Your Name'}
      </div>
      <div style={{ fontSize: 10, color: '#444', marginTop: 4 }}>
        {[data.personalInfo.email, data.personalInfo.phone, data.personalInfo.location].filter(Boolean).join('  ·  ')}
      </div>
      {(data.personalInfo.linkedin || data.personalInfo.portfolio) && (
        <div style={{ fontSize: 10, color: '#444', marginTop: 2 }}>
          {[data.personalInfo.linkedin, data.personalInfo.portfolio].filter(Boolean).join('  ·  ')}
        </div>
      )}
    </div>

    {data.summary && (
      <ExecSection label="Executive Summary">
        <p style={{ margin: 0, fontSize: 10.5, fontStyle: 'italic' }}>{data.summary}</p>
      </ExecSection>
    )}
    {data.skills.length > 0 && (
      <ExecSection label="Areas of Expertise">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '2px 8px' }}>
          {data.skills.map((s, i) => <span key={i} style={{ fontSize: 10.5 }}>▸ {s}</span>)}
        </div>
      </ExecSection>
    )}
    {data.experience.length > 0 && (
      <ExecSection label="Career History">
        {data.experience.map(exp => (
          <div key={exp.id} style={{ marginBottom: 9 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700, fontSize: 11 }}>{exp.title}</span>
              <span style={{ fontSize: 10, color: '#555' }}>{exp.duration}</span>
            </div>
            {exp.company && <div style={{ fontSize: 10.5, fontStyle: 'italic', color: '#444', marginBottom: 2 }}>{exp.company}</div>}
            <ul style={{ margin: '2px 0 0 16px', padding: 0 }}>
              {exp.bullets.filter(b => b.trim()).map((b, i) => <li key={i} style={{ fontSize: 10.5, marginBottom: 2 }}>▸ {b}</li>)}
            </ul>
          </div>
        ))}
      </ExecSection>
    )}
    {data.education.length > 0 && (
      <ExecSection label="Education & Credentials">
        {data.education.map(edu => (
          <div key={edu.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <div>
              <span style={{ fontWeight: 700, fontSize: 10.5 }}>{edu.degree}</span>
              {edu.institution && <span style={{ fontSize: 10.5 }}> · {edu.institution}</span>}
              {edu.grade && <span style={{ fontSize: 10, color: '#555' }}> · {edu.grade}</span>}
            </div>
            <span style={{ fontSize: 10, color: '#555' }}>{edu.duration}</span>
          </div>
        ))}
      </ExecSection>
    )}
    {data.certifications?.length > 0 && (
      <ExecSection label="Certifications">
        {data.certifications.map(c => (
          <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span style={{ fontSize: 10.5, fontWeight: 600 }}>{c.name}{c.issuer ? ` — ${c.issuer}` : ''}</span>
            <span style={{ fontSize: 10, color: '#555' }}>{c.year}</span>
          </div>
        ))}
      </ExecSection>
    )}
    {data.awards?.length > 0 && (
      <ExecSection label="Awards & Recognition">
        {data.awards.map(a => (
          <div key={a.id} style={{ marginBottom: 5 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 10.5, fontWeight: 600 }}>{a.title}{a.issuer ? ` — ${a.issuer}` : ''}</span>
              <span style={{ fontSize: 10, color: '#555' }}>{a.year}</span>
            </div>
            {a.description && <p style={{ margin: '2px 0 0 0', fontSize: 10, fontStyle: 'italic', color: '#666' }}>{a.description}</p>}
          </div>
        ))}
      </ExecSection>
    )}
  </div>
);

// ─── 5. COMPACT ───────────────────────────────────────────────────────────────
// Dense, fits more content, tight spacing — great for experienced candidates
const CompactTemplate = ({ data }: { data: ResumeData }) => (
  <div style={{ ...s, fontSize: 10, padding: '24px 32px' }}>
    <div style={{ borderBottom: '2px solid #000', paddingBottom: 6, marginBottom: 8 }}>
      <span style={{ fontSize: 18, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {data.personalInfo.name || 'Your Name'}
      </span>
      <div style={{ fontSize: 9.5, color: '#333', marginTop: 3 }}>
        {[data.personalInfo.email, data.personalInfo.phone, data.personalInfo.location, data.personalInfo.linkedin, data.personalInfo.portfolio].filter(Boolean).join(' | ')}
      </div>
    </div>

    {data.summary && (
      <CompactSection label="SUMMARY">
        <p style={{ margin: 0 }}>{data.summary}</p>
      </CompactSection>
    )}
    {data.skills.length > 0 && (
      <CompactSection label="SKILLS">
        <p style={{ margin: 0 }}>{data.skills.join(' | ')}</p>
      </CompactSection>
    )}
    {data.experience.length > 0 && (
      <CompactSection label="EXPERIENCE">
        {data.experience.map(exp => (
          <div key={exp.id} style={{ marginBottom: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700 }}>{exp.title}{exp.company ? ` | ${exp.company}` : ''}</span>
              <span style={{ color: '#555' }}>{exp.duration}</span>
            </div>
            <ul style={{ margin: '2px 0 0 14px', padding: 0 }}>
              {exp.bullets.filter(b => b.trim()).map((b, i) => <li key={i} style={{ marginBottom: 1 }}>{b}</li>)}
            </ul>
          </div>
        ))}
      </CompactSection>
    )}
    {data.education.length > 0 && (
      <CompactSection label="EDUCATION">
        {data.education.map(edu => (
          <div key={edu.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span style={{ fontWeight: 700 }}>{edu.degree}{edu.institution ? ` | ${edu.institution}` : ''}{edu.grade ? ` | ${edu.grade}` : ''}</span>
            <span style={{ color: '#555' }}>{edu.duration}</span>
          </div>
        ))}
      </CompactSection>
    )}
    {data.certifications?.length > 0 && (
      <CompactSection label="CERTIFICATIONS">
        {data.certifications.map(c => (
          <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
            <span>{c.name}{c.issuer ? ` | ${c.issuer}` : ''}</span>
            <span style={{ color: '#555' }}>{c.year}</span>
          </div>
        ))}
      </CompactSection>
    )}
    {data.awards?.length > 0 && (
      <CompactSection label="AWARDS">
        {data.awards.map(a => (
          <div key={a.id} style={{ marginBottom: 3 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700 }}>{a.title}{a.issuer ? ` | ${a.issuer}` : ''}</span>
              <span style={{ color: '#555' }}>{a.year}</span>
            </div>
            {a.description && <p style={{ margin: '1px 0 0 0', color: '#666' }}>{a.description}</p>}
          </div>
        ))}
      </CompactSection>
    )}
  </div>
);

// ─── 6. PROFESSIONAL ──────────────────────────────────────────────────────────
// Two-column: narrow left sidebar for contact/skills, wide right for content
const ProfessionalTemplate = ({ data }: { data: ResumeData }) => (
  <div style={{ ...s, display: 'flex', minHeight: '100%' }}>
    {/* Left sidebar */}
    <div style={{ width: '32%', background: '#f5f5f5', borderRight: '1px solid #ddd', padding: '28px 16px', fontSize: 10 }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.2 }}>{data.personalInfo.name || 'Your Name'}</div>
      </div>
      <SideSection label="CONTACT">
        {data.personalInfo.email && <div style={{ marginBottom: 2 }}>{data.personalInfo.email}</div>}
        {data.personalInfo.phone && <div style={{ marginBottom: 2 }}>{data.personalInfo.phone}</div>}
        {data.personalInfo.location && <div style={{ marginBottom: 2 }}>{data.personalInfo.location}</div>}
        {data.personalInfo.linkedin && <div style={{ marginBottom: 2 }}>{data.personalInfo.linkedin}</div>}
        {data.personalInfo.portfolio && <div style={{ marginBottom: 2 }}>{data.personalInfo.portfolio}</div>}
      </SideSection>
      {data.skills.length > 0 && (
        <SideSection label="SKILLS">
          {data.skills.map((sk, i) => <div key={i} style={{ marginBottom: 2 }}>• {sk}</div>)}
        </SideSection>
      )}
      {data.education.length > 0 && (
        <SideSection label="EDUCATION">
          {data.education.map(edu => (
            <div key={edu.id} style={{ marginBottom: 6 }}>
              <div style={{ fontWeight: 700 }}>{edu.degree}</div>
              {edu.institution && <div>{edu.institution}</div>}
              {edu.duration && <div style={{ color: '#666' }}>{edu.duration}</div>}
              {edu.grade && <div style={{ color: '#666' }}>{edu.grade}</div>}
            </div>
          ))}
        </SideSection>
      )}
      {data.certifications?.length > 0 && (
        <SideSection label="CERTIFICATIONS">
          {data.certifications.map(c => (
            <div key={c.id} style={{ marginBottom: 4 }}>
              <div style={{ fontWeight: 600 }}>{c.name}</div>
              {c.issuer && <div style={{ color: '#666' }}>{c.issuer}</div>}
              {c.year && <div style={{ color: '#666' }}>{c.year}</div>}
            </div>
          ))}
        </SideSection>
      )}
      {data.awards?.length > 0 && (
        <SideSection label="AWARDS">
          {data.awards.map(a => (
            <div key={a.id} style={{ marginBottom: 4 }}>
              <div style={{ fontWeight: 600 }}>{a.title}</div>
              {a.issuer && <div style={{ color: '#666' }}>{a.issuer}</div>}
              {a.description && <div style={{ color: '#666' }}>{a.description}</div>}
            </div>
          ))}
        </SideSection>
      )}
    </div>

    {/* Right content */}
    <div style={{ flex: 1, padding: '28px 20px' }}>
      {data.summary && (
        <ProfSection label="PROFESSIONAL SUMMARY">
          <p style={{ margin: 0, fontSize: 10.5 }}>{data.summary}</p>
        </ProfSection>
      )}
      {data.experience.length > 0 && (
        <ProfSection label="WORK EXPERIENCE">
          {data.experience.map(exp => (
            <div key={exp.id} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontWeight: 700, fontSize: 11 }}>{exp.title}</span>
                <span style={{ fontSize: 10, color: '#555' }}>{exp.duration}</span>
              </div>
              {exp.company && <div style={{ fontSize: 10.5, color: '#444', marginBottom: 2 }}>{exp.company}</div>}
              <ul style={{ margin: '3px 0 0 16px', padding: 0 }}>
                {exp.bullets.filter(b => b.trim()).map((b, i) => <li key={i} style={{ fontSize: 10.5, marginBottom: 2 }}>{b}</li>)}
              </ul>
            </div>
          ))}
        </ProfSection>
      )}
      {data.certifications?.length > 0 && (
        <ProfSection label="CERTIFICATIONS">
          {data.certifications.map(c => (
            <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span style={{ fontSize: 10.5, fontWeight: 600 }}>{c.name}{c.issuer ? ` — ${c.issuer}` : ''}</span>
              <span style={{ fontSize: 10, color: '#555' }}>{c.year}</span>
            </div>
          ))}
        </ProfSection>
      )}
      {data.awards?.length > 0 && (
        <ProfSection label="AWARDS & ACHIEVEMENTS">
          {data.awards.map(a => (
            <div key={a.id} style={{ marginBottom: 5 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 10.5, fontWeight: 600 }}>{a.title}{a.issuer ? ` — ${a.issuer}` : ''}</span>
                <span style={{ fontSize: 10, color: '#555' }}>{a.year}</span>
              </div>
              {a.description && <p style={{ margin: '2px 0 0 0', fontSize: 10, color: '#666' }}>{a.description}</p>}
            </div>
          ))}
        </ProfSection>
      )}
    </div>
  </div>
);

// ─── Shared sub-components ────────────────────────────────────────────────────
const Section = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: 11 }}>
    <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, borderBottom: '1px solid #aaa', paddingBottom: 2, marginBottom: 5 }}>{label}</div>
    {children}
  </div>
);

const ExecSection = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: 12 }}>
    <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5, borderBottom: '1px solid #888', paddingBottom: 2 }}>{label}</div>
    {children}
  </div>
);

const CompactSection = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: 7 }}>
    <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 0.5, marginBottom: 3, borderBottom: '1px solid #ccc', paddingBottom: 1 }}>{label}</div>
    {children}
  </div>
);

const SideSection = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: 14 }}>
    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', borderBottom: '1px solid #bbb', paddingBottom: 2, marginBottom: 5 }}>{label}</div>
    {children}
  </div>
);

const ProfSection = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: 12 }}>
    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', borderBottom: '1.5px solid #333', paddingBottom: 2, marginBottom: 6 }}>{label}</div>
    {children}
  </div>
);

// ─── ROUTER ───────────────────────────────────────────────────────────────────
export default function ResumeTemplate({ data, scale = 1 }: Props) {
  const style = scale !== 1 ? { transform: `scale(${scale})`, transformOrigin: 'top left', width: `${100 / scale}%` } : {};
  const inner = (() => {
    switch (data.template) {
      case 'modern':       return <ModernTemplate data={data} />;
      case 'minimal':      return <MinimalTemplate data={data} />;
      case 'executive':    return <ExecutiveTemplate data={data} />;
      case 'compact':      return <CompactTemplate data={data} />;
      case 'professional': return <ProfessionalTemplate data={data} />;
      default:             return <ClassicTemplate data={data} />;
    }
  })();
  return <div style={style}>{inner}</div>;
}
