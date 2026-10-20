import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { ResumeData } from '../../store/useResumeStore';
import {
  formatEducationSubtitle,
  formatEducationDegreeLabel,
  formatEducationMeta,
  formatGrade,
} from '../../utils/educationFormatter';
import { prepareResumeContent } from '../../utils/prepareResumeContent';
import { formatExperienceDuration } from '../../utils/experienceDateUtils';

// Built-in PDF standard fonts — no network fetch, no CDN dependency.
// Helvetica/Helvetica-Bold are embedded in @react-pdf/pdfkit and resolved
// via the STANDARD_FONTS branch in @react-pdf/font, bypassing fetch().
Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'Helvetica',      fontWeight: 400 },
    { src: 'Helvetica-Bold', fontWeight: 700 },
  ],
});

// Classic preview uses Georgia. Times is the closest built-in PDF serif and
// keeps the exported document's font metrics close without loading web fonts.
Font.register({
  family: 'ResumeGeorgia',
  fonts: [
    { src: 'Times-Roman', fontWeight: 400 },
    { src: 'Times-Bold', fontWeight: 700 },
  ],
});

const base = StyleSheet.create({
  row:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 1 },
  bold:      { fontWeight: 700 },
  bullet:    { flexDirection: 'row', marginBottom: 2, paddingLeft: 6 },
  bulletDot: { width: 8, fontSize: 9.5 },
  bulletText:{ flex: 1, fontSize: 9.5, color: '#333', lineHeight: 1.45 },
  mb4:       { marginBottom: 4 },
  mb8:       { marginBottom: 8 },
});

function Bullet({ text, color }: { text: string; color?: string }) {
  const cleanText = text.replace(/^[\s>*•-]+/, '').trim();
  return (
    <View style={base.bullet}>
      <Text style={base.bulletDot}>•</Text>
      <Text style={[base.bulletText, color ? { color } : {}]}>{cleanText}</Text>
    </View>
  );
}

function applyHidden(data: ResumeData): ResumeData {
  const h = data.hiddenSections || [];
  return {
    ...data,
    experience:     h.includes('experience')    ? [] : data.experience,
    education:      h.includes('education')     ? [] : data.education,
    projects:       h.includes('projects')      ? [] : data.projects,
    skills:         h.includes('skills')        ? [] : data.skills,
    certifications: h.includes('certs')         ? [] : data.certifications,
    languages:      h.includes('languages')     ? [] : data.languages,
    achievements:   h.includes('achievements')  ? [] : data.achievements,
    summary:        h.includes('summary')       ? '' : data.summary,
    awards:         h.includes('awards')        ? [] : data.awards,
    customSections: h.includes('custom')        ? [] : data.customSections,
  };
}

// Keep generated PDFs readable in standard PDF viewers and extractable by ATS parsers.
// Imported text can contain mis-encoded punctuation, which should not leak into the PDF.
function sanitizePdfValue(value: any): any {
  if (typeof value === 'string') {
    return value
      .replace(/\u00e2\u20ac\u201c/g, '-')
      .replace(/\u00e2\u20ac\u201d/g, '-')
      .replace(/\u00e2\u20ac\u00a2|\u2022/g, '-')
      .replace(/\u00c2\u00b7|\u00b7/g, '|')
      .replace(/[\u2012-\u2015]/g, '-')
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201c\u201d]/g, '"')
      .replace(/\uFFFD/g, '');
  }
  if (Array.isArray(value)) return value.map(sanitizePdfValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, sanitizePdfValue(item)]));
  }
  return value;
}
function normSummary(s: string | string[]): string {
  return Array.isArray(s) ? s.join(' ') : s || '';
}

// â”€â”€â”€ CLASSIC
const cs = StyleSheet.create({
  // Preview dimensions are CSS pixels while PDF uses points (1pt = 1.333px).
  // Convert the Classic template's sizing so both render at the same scale.
  page:   { fontFamily: 'ResumeGeorgia', fontSize: 9.75, color: '#111', paddingTop: 27, paddingBottom: 27, paddingHorizontal: 33, lineHeight: 1.5 },
  header: { alignItems: 'center', marginBottom: 0 },
  name:   { fontFamily: 'ResumeGeorgia', fontSize: 17.25, fontWeight: 700, color: '#17376b', letterSpacing: 0.3, lineHeight: 1.25 },
  role:   { fontSize: 8.25, color: '#52677e', marginTop: 1.5 },
  contactWrap: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', borderTopWidth: 1.5, borderBottomWidth: 0.75, borderColor: '#17376b', paddingVertical: 3.75, marginTop: 5.25 },
  contactPart: { fontSize: 8.25, color: '#445267', marginHorizontal: 7.5 },
  secHdr: { fontSize: 9, fontWeight: 700, textTransform: 'none', borderBottomWidth: 0.75, borderBottomColor: '#d0d0d0', paddingBottom: 3, marginBottom: 6, marginTop: 12, letterSpacing: 0.2, color: '#333' },
  muted:  { color: '#777', fontSize: 9 },
  skills: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 2 },
  skill:  { width: '50%', fontSize: 9, color: '#333', paddingRight: 9, marginBottom: 2.25 },
  jobTitle:{ flex: 1, fontSize: 9.75, fontWeight: 700, color: '#1a1a1a' },
});

function ClassicPDF({ d }: { d: ResumeData }) {
  const n = d.personalInfo;
  const contact = [n.email, n.phone, n.location, n.linkedin, n.portfolio].filter(Boolean);
  const summary = normSummary(d.summary);
  return (
    <Page size="A4" style={cs.page}>
      <View style={cs.header}>
        <Text style={cs.name}>{n.name || ''}</Text>
        {d.targetRole ? <Text style={cs.role}>{d.targetRole}</Text> : null}
        <View style={cs.contactWrap}>{contact.map((part, i) => <Text key={i} style={cs.contactPart}>{part}</Text>)}</View>
      </View>
      {summary ? (
        <View><Text style={cs.secHdr}>Professional Summary</Text>
          <Text style={{ fontSize: 9, color: '#111', marginBottom: 3 }}>{summary}</Text>
        </View>
      ) : null}
      {d.skills.length > 0 && (
        <View><Text style={cs.secHdr}>Core Competencies</Text>
          <View style={cs.skills}>{d.skills.map((skill, i) => <Text key={i} style={cs.skill}>{skill}</Text>)}</View>
        </View>
      )}
      {d.experience.length > 0 && (
        <View><Text style={cs.secHdr}>Experience</Text>
          {d.experience.map(e => (
            <View key={e.id} style={base.mb8} wrap={false}>
              <View style={base.row}>
                <Text style={cs.jobTitle}>{e.title}{e.company ? `  |  ${e.company}` : ''}</Text>
                {formatExperienceDuration(e) ? <Text style={cs.muted}>{formatExperienceDuration(e)}</Text> : null}
              </View>
              {e.location ? <Text style={{ fontSize: 9, color: '#66778a', marginTop: 1 }}>{e.location}</Text> : null}
              {e.bullets.filter(b => b.trim()).map((b, i) => <Bullet key={i} text={b} />)}
            </View>
          ))}
        </View>
      )}
      {d.education.length > 0 && (
        <View><Text style={cs.secHdr}>Education</Text>
          {d.education.map(edu => {
            const inst = formatEducationSubtitle(edu);
            const deg  = formatEducationDegreeLabel(edu);
            const meta = formatEducationMeta(edu);
            const grade = formatGrade(edu.grade);
            return (
              <View key={edu.id} style={base.mb4}>
                <View style={base.row}>
                  <Text style={base.bold}>{inst || deg}</Text>
                  <Text style={cs.muted}>{edu.duration}</Text>
                </View>
                <View style={base.row}>
                  <Text style={{ fontSize: 9, color: '#333' }}>{inst ? deg : ''}{meta ? '  —  ' + meta : ''}</Text>
                  {grade ? <Text style={cs.muted}>{grade}</Text> : null}
                </View>
                {edu.description ? <Text style={{ fontSize: 8.5, color: '#555', marginTop: 2 }}>{edu.description}</Text> : null}
              </View>
            );
          })}
        </View>
      )}
      {d.certifications.length > 0 && (
        <View><Text style={cs.secHdr}>Certifications</Text>
          {d.certifications.map(c => (
            <View key={c.id} style={[base.row, base.mb4]}>
              <Text>{c.name}{c.issuer ? ' — ' + c.issuer : ''}</Text>
              <Text style={cs.muted}>{c.year}</Text>
            </View>
          ))}
        </View>
      )}
      {d.awards?.length > 0 && (
        <View><Text style={cs.secHdr}>Awards</Text>
          {d.awards.map((a: any) => (
            <View key={a.id} style={[base.row, base.mb4]}>
              <Text style={base.bold}>{a.title}{a.issuer ? ' — ' + a.issuer : ''}</Text>
              <Text style={cs.muted}>{a.year}</Text>
            </View>
          ))}
        </View>
      )}
      {d.projects.length > 0 && (
        <View><Text style={cs.secHdr}>Projects</Text>
          {d.projects.map(p => (
            <View key={p.id} style={base.mb8}>
              <View style={base.row}>
                <Text style={base.bold}>{p.name}{p.role ? ' — ' + p.role : ''}</Text>
                <Text style={cs.muted}>{p.duration}</Text>
              </View>
              {p.url ? <Text style={{ fontSize: 9, color: '#2563eb', marginBottom: 2 }}>{p.url}</Text> : null}
              {p.bullets.filter(b => b.trim()).map((b, i) => <Bullet key={i} text={b} />)}
            </View>
          ))}
        </View>
      )}
      {d.languages.length > 0 && (
        <View><Text style={cs.secHdr}>Languages</Text>
          <View style={cs.skills}>{d.languages.map((language, i) => <Text key={language.id || i} style={cs.skill}>{language.language} ({language.proficiency})</Text>)}</View>
        </View>
      )}
      {d.achievements?.length > 0 && (
        <View><Text style={cs.secHdr}>Achievements</Text>
          {d.achievements.map((a: any) => (
            <View key={a.id} style={base.mb4}>
              {a.title ? <Text style={base.bold}>{a.title}</Text> : null}
              {a.description ? <Text style={{ fontSize: 9.5, color: '#555' }}>{a.description}</Text> : null}
            </View>
          ))}
        </View>
      )}
      {d.customSections?.filter((s: any) => s.content).map((s: any) => (
        <View key={s.id}><Text style={cs.secHdr}>{s.heading}</Text>
          <Text style={{ fontSize: 9.5, color: '#333' }}>{s.content}</Text>
        </View>
      ))}
    </Page>
  );
}

// â”€â”€â”€ MODERN
const ms = StyleSheet.create({
  page:   { fontFamily: 'Helvetica', fontSize: 10, color: '#172b3a', paddingTop: 34, paddingBottom: 36, paddingHorizontal: 40, lineHeight: 1.45 },
  hdr:    { backgroundColor: '#effaf8', borderLeftWidth: 5, borderLeftColor: '#0f9f91', padding: 12, marginBottom: 8 },
  name:   { fontSize: 21, fontWeight: 700, color: '#123b48', marginBottom: 2 },
  role:   { fontSize: 9.5, color: '#0f766e', marginBottom: 4 },
  contact:{ fontSize: 9, color: '#526b75', marginBottom: 4, flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  rule:   { borderBottomWidth: 1, borderBottomColor: '#99d7ce', marginBottom: 8, marginTop: 2 },
  secHdr: { fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: '#087f76', borderBottomWidth: 1, borderBottomColor: '#99d7ce', paddingBottom: 2, marginBottom: 4, marginTop: 8 },
  muted:  { color: '#777', fontSize: 9 },
  skills: { fontSize: 9.5, color: '#444', marginBottom: 3 },
});

function ModernPDF({ d }: { d: ResumeData }) {
  const n = d.personalInfo;
  const contact = [n.email, n.phone, n.location, n.linkedin, n.portfolio].filter(Boolean);
  const summary = normSummary(d.summary);
  return (
    <Page size="A4" style={ms.page}>
      <View style={ms.hdr}>
        <Text style={ms.name}>{n.name || ''}</Text>
        {d.targetRole ? <Text style={ms.role}>{d.targetRole}</Text> : null}
        <View style={ms.contact}>
          {contact.map((p, i) => <Text key={i}>{p}{i < contact.length - 1 ? ' |' : ''}</Text>)}
        </View>
      </View>
      <View style={ms.rule} />
      {summary ? (
        <View><Text style={ms.secHdr}>Summary</Text>
          <Text style={{ fontSize: 9.5, color: '#333', marginBottom: 4 }}>{summary}</Text>
        </View>
      ) : null}
      {d.skills.length > 0 && (
        <View><Text style={ms.secHdr}>Skills</Text>
          <Text style={ms.skills}>{d.skills.join(' · ')}</Text>
        </View>
      )}
      {d.experience.length > 0 && (
        <View><Text style={ms.secHdr}>Experience</Text>
          {d.experience.map(e => (
            <View key={e.id} style={base.mb8}>
              <View style={base.row}>
                <Text style={[base.bold, { flex: 1 }]}>{e.title}</Text>
                <Text style={ms.muted}>{formatExperienceDuration(e)}</Text>
              </View>
              {e.company ? <Text style={{ fontSize: 9.5, color: '#555', marginBottom: 2 }}>{e.company}</Text> : null}
              {e.bullets.filter(b => b.trim()).map((b, i) => <Bullet key={i} text={b} />)}
            </View>
          ))}
        </View>
      )}
      {d.education.length > 0 && (
        <View><Text style={ms.secHdr}>Education</Text>
          {d.education.map(edu => {
            const inst = formatEducationSubtitle(edu);
            const deg  = formatEducationDegreeLabel(edu);
            const meta = formatEducationMeta(edu);
            const grade = formatGrade(edu.grade);
            return (
              <View key={edu.id} style={base.mb4}>
                <View style={base.row}>
                  <Text style={base.bold}>{inst || deg}</Text>
                  <Text style={ms.muted}>{edu.duration}</Text>
                </View>
                <View style={base.row}>
                  <Text style={{ fontSize: 9, color: '#444' }}>{inst ? deg : ''}{meta ? ' · ' + meta : ''}</Text>
                  {grade ? <Text style={ms.muted}>{grade}</Text> : null}
                </View>
                {edu.description ? <Text style={{ fontSize: 8.5, color: '#555', marginTop: 2 }}>{edu.description}</Text> : null}
              </View>
            );
          })}
        </View>
      )}
      {d.certifications.length > 0 && (
        <View><Text style={ms.secHdr}>Certifications</Text>
          {d.certifications.map(c => (
            <View key={c.id} style={[base.row, base.mb4]}>
              <Text>{c.name}{c.issuer ? ' — ' + c.issuer : ''}</Text>
              <Text style={ms.muted}>{c.year}</Text>
            </View>
          ))}
        </View>
      )}
      {d.awards?.length > 0 && (
        <View><Text style={ms.secHdr}>Awards</Text>
          {d.awards.map((a: any) => (
            <View key={a.id} style={[base.row, base.mb4]}>
              <Text style={base.bold}>{a.title}{a.issuer ? ' — ' + a.issuer : ''}</Text>
              <Text style={ms.muted}>{a.year}</Text>
            </View>
          ))}
        </View>
      )}
      {d.projects.length > 0 && (
        <View><Text style={ms.secHdr}>Projects</Text>
          {d.projects.map(p => (
            <View key={p.id} style={base.mb8}>
              <View style={base.row}>
                <Text style={base.bold}>{p.name}</Text>
                <Text style={ms.muted}>{p.duration}</Text>
              </View>
              {p.role ? <Text style={{ fontSize: 9.5, color: '#555', marginBottom: 2 }}>{p.role}</Text> : null}
              {p.url ? <Text style={{ fontSize: 9, color: '#2563eb', marginBottom: 2 }}>{p.url}</Text> : null}
              {p.bullets.filter(b => b.trim()).map((b, i) => <Bullet key={i} text={b} />)}
            </View>
          ))}
        </View>
      )}
      {d.languages.length > 0 && (
        <View><Text style={ms.secHdr}>Languages</Text>
          <Text style={ms.skills}>{d.languages.map(l => l.language + ' (' + l.proficiency + ')').join(' · ')}</Text>
        </View>
      )}
      {d.achievements?.length > 0 && (
        <View><Text style={ms.secHdr}>Achievements</Text>
          {d.achievements.map((a: any) => (
            <View key={a.id} style={base.mb4}>
              {a.title ? <Text style={base.bold}>{a.title}</Text> : null}
              {a.description ? <Text style={{ fontSize: 9.5, color: '#555' }}>{a.description}</Text> : null}
            </View>
          ))}
        </View>
      )}
      {d.customSections?.filter((s: any) => s.content).map((s: any) => (
        <View key={s.id}><Text style={ms.secHdr}>{s.heading}</Text>
          <Text style={{ fontSize: 9.5, color: '#333' }}>{s.content}</Text>
        </View>
      ))}
    </Page>
  );
}

// --- MINIMAL
const mns = StyleSheet.create({
  page:   { fontFamily: 'Helvetica', fontSize: 10, color: '#111', paddingTop: 38, paddingBottom: 38, paddingHorizontal: 42, lineHeight: 1.45 },
  name:   { fontSize: 22, fontWeight: 700, marginBottom: 3 },
  contact:{ fontSize: 9, color: '#555', marginBottom: 12 },
  secRow: { flexDirection: 'column', marginBottom: 9 },
  secLbl: { width: 'auto', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, color: '#333', paddingTop: 0, marginBottom: 3 },
  secBody:{ borderTopWidth: 1, borderTopColor: '#d5d5d5', paddingTop: 4 },
  muted:  { color: '#999', fontSize: 9 },
});

function MinimalPDF({ d }: { d: ResumeData }) {
  const n = d.personalInfo;
  const contact = [n.email, n.phone, n.location, n.linkedin, n.portfolio].filter(Boolean).join('   ·   ');
  const summary = normSummary(d.summary);
  const sections: Array<{ label: string; body: React.ReactNode }> = [];
  if (summary) sections.push({ label: 'Professional Summary', body: <Text style={{ fontSize: 9.5, color: '#333' }}>{summary}</Text> });
  if (d.skills.length > 0) sections.push({ label: 'Skills', body: <Text style={{ fontSize: 9.5, color: '#444' }}>{d.skills.join(', ')}</Text> });
  if (d.experience.length > 0) sections.push({ label: 'Experience', body: (
    <View>
      {d.experience.map(e => (
        <View key={e.id} style={base.mb8}>
          <View style={base.row}>
            <Text style={base.bold}>{e.title}{e.company ? ' — ' + e.company : ''}</Text>
            <Text style={mns.muted}>{formatExperienceDuration(e)}</Text>
          </View>
          {e.bullets.filter(b => b.trim()).map((b, i) => <Bullet key={i} text={b} color="#555" />)}
        </View>
      ))}
    </View>
  )});
  if (d.education.length > 0) sections.push({ label: 'Education', body: (
    <View>
      {d.education.map(edu => {
        const inst = formatEducationSubtitle(edu);
        const deg  = formatEducationDegreeLabel(edu);
        const meta = formatEducationMeta(edu);
        const grade = formatGrade(edu.grade);
        return (
          <View key={edu.id} style={base.mb4}>
            <View style={base.row}>
              <Text style={base.bold}>{inst || deg}</Text>
              <Text style={mns.muted}>{edu.duration}</Text>
            </View>
            <View style={base.row}>
              <Text style={{ fontSize: 9, color: '#444' }}>{inst ? deg : ''}{meta ? ' — ' + meta : ''}</Text>
              {grade ? <Text style={mns.muted}>{grade}</Text> : null}
            </View>
            {edu.description ? <Text style={{ fontSize: 8.5, color: '#666', marginTop: 2 }}>{edu.description}</Text> : null}
          </View>
        );
      })}
    </View>
  )});
  if (d.certifications.length > 0) sections.push({ label: 'Certifications', body: (
    <View>{d.certifications.map(c => (
      <View key={c.id} style={[base.row, base.mb4]}>
        <Text style={{ fontSize: 9.5, color: '#444' }}>{c.name}{c.issuer ? ' — ' + c.issuer : ''}</Text>
        <Text style={mns.muted}>{c.year}</Text>
      </View>
    ))}</View>
  )});
  if (d.awards?.length > 0) sections.push({ label: 'Awards', body: (
    <View>{d.awards.map((a: any) => (
      <View key={a.id} style={base.mb4}>
        <View style={base.row}>
          <Text style={base.bold}>{a.title}{a.issuer ? ' — ' + a.issuer : ''}</Text>
          <Text style={mns.muted}>{a.year}</Text>
        </View>
        {a.description ? <Text style={{ fontSize: 9, color: '#777' }}>{a.description}</Text> : null}
      </View>
    ))}</View>
  )});
  if (d.projects.length > 0) sections.push({ label: 'Projects', body: (
    <View>{d.projects.map(p => (
      <View key={p.id} style={base.mb8}>
        <View style={base.row}>
          <Text style={base.bold}>{p.name}{p.role ? ' — ' + p.role : ''}</Text>
          <Text style={mns.muted}>{p.duration}</Text>
        </View>
        {p.url ? <Text style={{ fontSize: 9, color: '#666', marginBottom: 2 }}>{p.url}</Text> : null}
        {p.bullets.filter(b => b.trim()).map((b, i) => <Bullet key={i} text={b} color="#555" />)}
      </View>
    ))}</View>
  )});
  if (d.languages.length > 0) sections.push({ label: 'Languages', body: <Text style={{ fontSize: 9.5, color: '#444' }}>{d.languages.map(l => l.language + ' (' + l.proficiency + ')').join(', ')}</Text> });
  if (d.achievements?.length > 0) sections.push({ label: 'Achievements', body: (
    <View>{d.achievements.map((a: any) => (
      <View key={a.id} style={base.mb4}>
        {a.title ? <Text style={base.bold}>{a.title}</Text> : null}
        {a.description ? <Text style={{ fontSize: 9, color: '#777' }}>{a.description}</Text> : null}
      </View>
    ))}</View>
  )});
  d.customSections?.filter((s: any) => s.content).forEach((s: any) => {
    sections.push({ label: s.heading, body: <Text style={{ fontSize: 9.5, color: '#444' }}>{s.content}</Text> });
  });
  return (
    <Page size="A4" style={mns.page}>
      <Text style={mns.name}>{n.name || ''}</Text>
      <Text style={mns.contact}>{contact}</Text>
      {sections.map((sec, i) => (
        <View key={i} style={mns.secRow}>
          <Text style={mns.secLbl}>{sec.label}</Text>
          <View style={mns.secBody}>{sec.body}</View>
        </View>
      ))}
    </Page>
  );
}


// --- EXECUTIVE
const es = StyleSheet.create({
  page:   { fontFamily: 'Helvetica', fontSize: 10, color: '#182230', paddingTop: 38, paddingBottom: 40, paddingHorizontal: 44, lineHeight: 1.45 },
  hdrBox: { backgroundColor: '#183451', borderBottomWidth: 4, borderBottomColor: '#c49a54', padding: 14, marginBottom: 14 },
  name:   { fontSize: 21, fontWeight: 700, color: '#ffffff', letterSpacing: 0.7 },
  role:   { fontSize: 9.5, color: '#e7d6b8', marginTop: 2, marginBottom: 6 },
  rule:   { height: 0.7, backgroundColor: '#58718a', marginBottom: 5 },
  ruleThin:{ height: 0 },
  contact:{ fontSize: 8.5, color: '#e1e8ef' },
  secHdr: { fontSize: 10, fontWeight: 700, color: '#244a73', borderBottomWidth: 0.7, borderBottomColor: '#aab8c7', paddingBottom: 3, marginBottom: 6, marginTop: 10 },
  muted:  { color: '#777', fontSize: 9 },
  skills: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 3 },
  skill:  { width: '50%', fontSize: 9.5, color: '#36475a', paddingRight: 8, marginBottom: 4 },
  jobTitle:{ flex: 1, fontSize: 10, fontWeight: 700, color: '#182230' },
  employer:{ fontSize: 9, color: '#526174', marginTop: 1, marginBottom: 2 },
});

function ExecutivePDF({ d }: { d: ResumeData }) {
  const n = d.personalInfo;
  const contact = [n.email, n.phone, n.location, n.linkedin, n.portfolio].filter(Boolean).join('  |  ');
  const summary = normSummary(d.summary);
  return (
    <Page size="A4" style={es.page}>
      <View style={es.hdrBox}>
        <Text style={es.name}>{(n.name || '').toLocaleUpperCase()}</Text>
        {d.targetRole ? <Text style={es.role}>{d.targetRole}</Text> : null}
        <View style={{ width: '100%' }}><View style={es.rule} /><View style={es.ruleThin} /></View>
        <Text style={es.contact}>{contact}</Text>
      </View>
      {summary ? (
        <View><Text style={es.secHdr}>Professional Summary</Text>
          <Text style={{ fontSize: 9.5, color: '#333', marginBottom: 4 }}>{summary}</Text>
        </View>
      ) : null}
      {d.skills.length > 0 && (
        <View><Text style={es.secHdr}>Skills</Text>
          <View style={es.skills}>{d.skills.map((skill, i) => <Text key={i} style={es.skill}>• {skill}</Text>)}</View>
        </View>
      )}
      {d.experience.length > 0 && (
        <View><Text style={es.secHdr}>Professional Experience</Text>
          {d.experience.map(e => (
            <View key={e.id} style={base.mb8} wrap={false}>
              <View style={base.row}>
                <Text style={es.jobTitle}>{e.title}</Text>
                {formatExperienceDuration(e) ? <Text style={es.muted}>{formatExperienceDuration(e)}</Text> : null}
              </View>
              {(e.company || e.location) ? <Text style={es.employer}>{[e.company, e.location].filter(Boolean).join('  |  ')}</Text> : null}
              {e.bullets.filter(b => b.trim()).map((b, i) => <Bullet key={i} text={b.replace(/^[\s>*•-]+/, '')} />)}
            </View>
          ))}
        </View>
      )}
      {d.education.length > 0 && (
        <View><Text style={es.secHdr}>Education</Text>
          {d.education.map(edu => {
            const inst = formatEducationSubtitle(edu);
            const deg  = formatEducationDegreeLabel(edu);
            const meta = formatEducationMeta(edu);
            const grade = formatGrade(edu.grade);
            return (
              <View key={edu.id} style={base.mb4}>
                <View style={base.row}>
                  <Text style={base.bold}>{inst || deg}</Text>
                  <Text style={es.muted}>{edu.duration}</Text>
                </View>
                <View style={base.row}>
                  <Text style={{ fontSize: 9, color: '#333' }}>{inst ? deg : ''}{meta ? ' · ' + meta : ''}</Text>
                  {grade ? <Text style={es.muted}>{grade}</Text> : null}
                </View>
                {edu.description ? <Text style={{ fontSize: 8.5, color: '#555', marginTop: 2 }}>{edu.description}</Text> : null}
              </View>
            );
          })}
        </View>
      )}
      {d.certifications.length > 0 && (
        <View><Text style={es.secHdr}>Certifications</Text>
          {d.certifications.map(c => (
            <View key={c.id} style={[base.row, base.mb4]}>
              <Text>{c.name}{c.issuer ? ' — ' + c.issuer : ''}</Text>
              <Text style={es.muted}>{c.year}</Text>
            </View>
          ))}
        </View>
      )}
      {d.awards?.length > 0 && (
        <View><Text style={es.secHdr}>Awards & Recognition</Text>
          {d.awards.map((a: any) => (
            <View key={a.id} style={[base.row, base.mb4]}>
              <Text style={base.bold}>{a.title}{a.issuer ? ' — ' + a.issuer : ''}</Text>
              <Text style={es.muted}>{a.year}</Text>
            </View>
          ))}
        </View>
      )}
      {d.projects.length > 0 && (
        <View><Text style={es.secHdr}>Projects</Text>
          {d.projects.map(p => (
            <View key={p.id} style={base.mb8}>
              <View style={base.row}>
                <Text style={base.bold}>{p.name}</Text>
                <Text style={es.muted}>{p.duration}</Text>
              </View>
              {p.role ? <Text style={{ fontSize: 9.5, fontStyle: 'italic', color: '#555', marginBottom: 2 }}>{p.role}</Text> : null}
              {p.url ? <Text style={{ fontSize: 9, color: '#2563eb', marginBottom: 2 }}>{p.url}</Text> : null}
              {p.bullets.filter(b => b.trim()).map((b, i) => <Bullet key={i} text={'> ' + b} />)}
            </View>
          ))}
        </View>
      )}
      {d.languages.length > 0 && (
        <View><Text style={es.secHdr}>Languages</Text>
          <Text style={es.skills}>{d.languages.map(l => l.language + ' (' + l.proficiency + ')').join('  ·  ')}</Text>
        </View>
      )}
      {d.achievements?.length > 0 && (
        <View><Text style={es.secHdr}>Achievements</Text>
          {d.achievements.map((a: any) => (
            <View key={a.id} style={base.mb4}>
              {a.title ? <Text style={base.bold}>{a.title}</Text> : null}
              {a.description ? <Text style={{ fontSize: 9.5, color: '#555' }}>{a.description}</Text> : null}
            </View>
          ))}
        </View>
      )}
      {d.customSections?.filter((s: any) => s.content).map((s: any) => (
        <View key={s.id}><Text style={es.secHdr}>{s.heading}</Text>
          <Text style={{ fontSize: 9.5, color: '#333' }}>{s.content}</Text>
        </View>
      ))}
    </Page>
  );
}


// --- COMPACT
const cps = StyleSheet.create({
  page:   { fontFamily: 'Helvetica', fontSize: 9.5, color: '#111', paddingTop: 24, paddingBottom: 28, paddingHorizontal: 32, lineHeight: 1.4 },
  hdr:    { borderBottomWidth: 1, borderBottomColor: '#333', paddingBottom: 4, marginBottom: 7 },
  name:   { fontSize: 16, fontWeight: 700 },
  contact:{ fontSize: 9, color: '#666', marginTop: 2 },
  secHdr: { fontSize: 9, fontWeight: 700, letterSpacing: 0.5, borderBottomWidth: 1, borderBottomColor: '#ccc', paddingBottom: 1, marginBottom: 3, marginTop: 6 },
  muted:  { color: '#777', fontSize: 8.5 },
  skills: { fontSize: 9, color: '#444', marginBottom: 2 },
});

function CompactPDF({ d }: { d: ResumeData }) {
  const n = d.personalInfo;
  const contact = [n.email, n.phone, n.location, n.linkedin, n.portfolio].filter(Boolean).join(' | ');
  const summary = normSummary(d.summary);
  return (
    <Page size="A4" style={cps.page}>
      <View style={cps.hdr}>
        <Text style={cps.name}>{n.name || ''}</Text>
        <Text style={cps.contact}>{contact}</Text>
      </View>
      {summary ? (
        <View><Text style={cps.secHdr}>Summary</Text>
          <Text style={{ fontSize: 9, color: '#333', marginBottom: 3 }}>{summary}</Text>
        </View>
      ) : null}
      {d.skills.length > 0 && (
        <View><Text style={cps.secHdr}>Skills</Text>
          <Text style={cps.skills}>{d.skills.join(' | ')}</Text>
        </View>
      )}
      {d.experience.length > 0 && (
        <View><Text style={cps.secHdr}>Experience</Text>
          {d.experience.map(e => (
            <View key={e.id} style={{ marginBottom: 5 }}>
              <View style={base.row}>
                <Text style={[base.bold, { flex: 1 }]}>{e.title}{e.company ? ' | ' + e.company : ''}</Text>
                <Text style={cps.muted}>{formatExperienceDuration(e)}</Text>
              </View>
              {e.bullets.filter(b => b.trim()).map((b, i) => <Bullet key={i} text={b} />)}
            </View>
          ))}
        </View>
      )}
      {d.education.length > 0 && (
        <View><Text style={cps.secHdr}>Education</Text>
          {d.education.map(edu => {
            const inst = formatEducationSubtitle(edu);
            const deg  = formatEducationDegreeLabel(edu);
            const meta = formatEducationMeta(edu);
            const grade = formatGrade(edu.grade);
            return (
              <View key={edu.id} style={{ marginBottom: 4 }}>
                <View style={base.row}>
                  <Text style={base.bold}>{inst || deg}</Text>
                  <Text style={cps.muted}>{edu.duration}</Text>
                </View>
                <View style={base.row}>
                  <Text style={{ fontSize: 8.5, color: '#444' }}>{inst ? deg : ''}{meta ? ' (' + meta + ')' : ''}</Text>
                  {grade ? <Text style={cps.muted}>{grade}</Text> : null}
                </View>
                {edu.description ? <Text style={{ fontSize: 8, color: '#555', marginTop: 1 }}>{edu.description}</Text> : null}
              </View>
            );
          })}
        </View>
      )}
      {d.certifications.length > 0 && (
        <View><Text style={cps.secHdr}>Certifications</Text>
          {d.certifications.map(c => (
            <View key={c.id} style={[base.row, { marginBottom: 2 }]}>
              <Text>{c.name}{c.issuer ? ' | ' + c.issuer : ''}</Text>
              <Text style={cps.muted}>{c.year}</Text>
            </View>
          ))}
        </View>
      )}
      {d.awards?.length > 0 && (
        <View><Text style={cps.secHdr}>Awards</Text>
          {d.awards.map((a: any) => (
            <View key={a.id} style={[base.row, { marginBottom: 3 }]}>
              <Text style={base.bold}>{a.title}{a.issuer ? ' | ' + a.issuer : ''}</Text>
              <Text style={cps.muted}>{a.year}</Text>
            </View>
          ))}
        </View>
      )}
      {d.projects.length > 0 && (
        <View><Text style={cps.secHdr}>Projects</Text>
          {d.projects.map(p => (
            <View key={p.id} style={{ marginBottom: 4 }}>
              <View style={base.row}>
                <Text style={base.bold}>{p.name}{p.role ? ' | ' + p.role : ''}</Text>
                <Text style={cps.muted}>{p.duration}</Text>
              </View>
              {p.url ? <Text style={{ fontSize: 8.5, color: '#666', marginBottom: 1 }}>{p.url}</Text> : null}
              {p.bullets.filter(b => b.trim()).map((b, i) => <Bullet key={i} text={b} />)}
            </View>
          ))}
        </View>
      )}
      {d.languages.length > 0 && (
        <View><Text style={cps.secHdr}>Languages</Text>
          <Text style={cps.skills}>{d.languages.map(l => l.language + ' (' + l.proficiency + ')').join(' | ')}</Text>
        </View>
      )}
      {d.achievements?.length > 0 && (
        <View><Text style={cps.secHdr}>Achievements</Text>
          {d.achievements.map((a: any) => (
            <View key={a.id} style={{ marginBottom: 3 }}>
              {a.title ? <Text style={base.bold}>{a.title}</Text> : null}
              {a.description ? <Text style={{ fontSize: 9, color: '#555' }}>{a.description}</Text> : null}
            </View>
          ))}
        </View>
      )}
      {d.customSections?.filter((s: any) => s.content).map((s: any) => (
        <View key={s.id}><Text style={cps.secHdr}>{s.heading}</Text>
          <Text style={{ fontSize: 9, color: '#333' }}>{s.content}</Text>
        </View>
      ))}
    </Page>
  );
}


// --- PROFESSIONAL (two-column)
const ps = StyleSheet.create({
  page:     { fontFamily: 'Helvetica', fontSize: 10, color: '#111', paddingTop: 0, paddingBottom: 0, paddingHorizontal: 0, lineHeight: 1.45 },
  body:     { flexDirection: 'row', minHeight: '100%' },
  sidebar:  { width: '30%', backgroundColor: '#1e293b', padding: 20, fontSize: 9.5, color: '#cbd5e1' },
  main:     { flex: 1, padding: 22 },
  sName:    { fontSize: 14, fontWeight: 700, color: '#f1f5f9', marginBottom: 12, lineHeight: 1.3 },
  sSec:     { fontSize: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#94a3b8', borderBottomWidth: 1, borderBottomColor: '#334155', paddingBottom: 2, marginBottom: 4, marginTop: 10 },
  sText:    { color: '#cbd5e1', marginBottom: 2, fontSize: 8.5 },
  mSecHdr:  { fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: '#555', borderBottomWidth: 1, borderBottomColor: '#ccc', paddingBottom: 2, marginBottom: 4, marginTop: 8 },
  mMuted:   { color: '#777', fontSize: 9 },
  skillChip:{ fontSize: 8.5, color: '#cbd5e1', borderWidth: 1, borderColor: '#334155', borderRadius: 3, paddingHorizontal: 4, paddingVertical: 1, marginRight: 3, marginBottom: 3 },
});

function ProfessionalPDF({ d }: { d: ResumeData }) {
  const n = d.personalInfo;
  const summary = normSummary(d.summary);
  return (
    <Page size="A4" style={ps.page}>
      <View style={ps.body}>
        <View style={ps.sidebar}>
          <Text style={ps.sName}>{n.name || ''}</Text>
          <Text style={ps.sSec}>Contact</Text>
          {n.email ? <Text style={ps.sText}>{n.email}</Text> : null}
          {n.phone ? <Text style={ps.sText}>{n.phone}</Text> : null}
          {n.location ? <Text style={ps.sText}>{n.location}</Text> : null}
          {n.linkedin ? <Text style={[ps.sText, { color: '#94a3b8' }]}>{n.linkedin}</Text> : null}
          {n.portfolio ? <Text style={[ps.sText, { color: '#94a3b8' }]}>{n.portfolio}</Text> : null}
          {d.skills.length > 0 && (
            <View>
              <Text style={ps.sSec}>Skills</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {d.skills.map((sk, i) => (
                  <Text key={i} style={ps.skillChip}>{sk}</Text>
                ))}
              </View>
            </View>
          )}
          {d.education.length > 0 && (
            <View>
              <Text style={ps.sSec}>Education</Text>
              {d.education.map(edu => {
                const inst = formatEducationSubtitle(edu);
                const deg  = formatEducationDegreeLabel(edu);
                const meta = formatEducationMeta(edu);
                const grade = formatGrade(edu.grade);
                return (
                  <View key={edu.id} style={{ marginBottom: 7 }}>
                    <Text style={{ fontWeight: 700, color: '#f1f5f9', fontSize: 9 }}>{inst || deg}</Text>
                    {inst ? <Text style={{ color: '#cbd5e1', fontSize: 8.5 }}>{deg}</Text> : null}
                    {meta ? <Text style={{ color: '#94a3b8', fontSize: 8 }}>{meta}</Text> : null}
                    <Text style={{ color: '#64748b', fontSize: 8, marginTop: 1 }}>{[edu.duration, grade].filter(Boolean).join('  ')}</Text>
                    {edu.description ? <Text style={{ color: '#94a3b8', fontSize: 8, marginTop: 1 }}>{edu.description}</Text> : null}
                  </View>
                );
              })}
            </View>
          )}
          {d.certifications.length > 0 && (
            <View>
              <Text style={ps.sSec}>Certifications</Text>
              {d.certifications.map(c => (
                <View key={c.id} style={{ marginBottom: 4 }}>
                  <Text style={{ fontWeight: 700, color: '#f1f5f9', fontSize: 9 }}>{c.name}</Text>
                  {c.issuer ? <Text style={{ color: '#94a3b8', fontSize: 8.5 }}>{c.issuer}</Text> : null}
                  {c.year ? <Text style={{ color: '#64748b', fontSize: 8 }}>{c.year}</Text> : null}
                </View>
              ))}
            </View>
          )}
          {d.awards?.length > 0 && (
            <View>
              <Text style={ps.sSec}>Awards</Text>
              {d.awards.map((a: any) => (
                <View key={a.id} style={{ marginBottom: 4 }}>
                  <Text style={{ fontWeight: 700, color: '#f1f5f9', fontSize: 9 }}>{a.title}</Text>
                  {a.issuer ? <Text style={{ color: '#94a3b8', fontSize: 8.5 }}>{a.issuer}</Text> : null}
                </View>
              ))}
            </View>
          )}
          {d.languages.length > 0 && (
            <View>
              <Text style={ps.sSec}>Languages</Text>
              {d.languages.map(l => <Text key={l.id} style={{ fontSize: 9, color: '#cbd5e1', marginBottom: 2 }}>{l.language} ({l.proficiency})</Text>)}
            </View>
          )}
        </View>
        <View style={ps.main}>
          {summary ? (
            <View><Text style={ps.mSecHdr}>Professional Summary</Text>
              <Text style={{ fontSize: 9.5, color: '#333', marginBottom: 4 }}>{summary}</Text>
            </View>
          ) : null}
          {d.experience.length > 0 && (
            <View><Text style={ps.mSecHdr}>Experience</Text>
              {d.experience.map(e => (
                <View key={e.id} style={base.mb8}>
                  <View style={base.row}>
                    <Text style={[base.bold, { flex: 1 }]}>{e.title}</Text>
                    <Text style={ps.mMuted}>{formatExperienceDuration(e)}</Text>
                  </View>
                  {e.company ? <Text style={{ fontSize: 9.5, color: '#555', marginBottom: 2 }}>{e.company}</Text> : null}
                  {e.bullets.filter(b => b.trim()).map((b, i) => <Bullet key={i} text={b} />)}
                </View>
              ))}
            </View>
          )}
          {d.projects.length > 0 && (
            <View><Text style={ps.mSecHdr}>Projects</Text>
              {d.projects.map(p => (
                <View key={p.id} style={base.mb8}>
                  <View style={base.row}>
                    <Text style={base.bold}>{p.name}</Text>
                    <Text style={ps.mMuted}>{p.duration}</Text>
                  </View>
                  {p.role ? <Text style={{ fontSize: 9.5, color: '#555', marginBottom: 2 }}>{p.role}</Text> : null}
                  {p.url ? <Text style={{ fontSize: 9, color: '#2563eb', marginBottom: 2 }}>{p.url}</Text> : null}
                  {p.bullets.filter(b => b.trim()).map((b, i) => <Bullet key={i} text={b} />)}
                </View>
              ))}
            </View>
          )}
          {d.achievements?.length > 0 && (
            <View><Text style={ps.mSecHdr}>Achievements</Text>
              {d.achievements.map((a: any) => (
                <View key={a.id} style={base.mb4}>
                  {a.title ? <Text style={base.bold}>{a.title}</Text> : null}
                  {a.description ? <Text style={{ fontSize: 9.5, color: '#555' }}>{a.description}</Text> : null}
                </View>
              ))}
            </View>
          )}
          {d.customSections?.filter((s: any) => s.content).map((s: any) => (
            <View key={s.id}><Text style={ps.mSecHdr}>{s.heading}</Text>
              <Text style={{ fontSize: 9.5, color: '#333' }}>{s.content}</Text>
            </View>
          ))}
        </View>
      </View>
    </Page>
  );
}

// --- ROUTER
export default function ResumePDFDocument({ data }: { data: ResumeData }) {
  const d = applyHidden(prepareResumeContent(sanitizePdfValue(data)));
  const n = d.personalInfo;
  const page = (() => {
    switch (d.template) {
      case 'modern':       return <ModernPDF d={d} />;
      case 'minimal':      return <MinimalPDF d={d} />;
      case 'executive':    return <ExecutivePDF d={d} />;
      case 'compact':      return <CompactPDF d={d} />;
      case 'professional': return <ProfessionalPDF d={d} />;
      default:             return <ClassicPDF d={d} />;
    }
  })();
  return (
    <Document title={n.name || 'Resume'} author={n.name || ''} subject="Resume">
      {page}
    </Document>
  );
}
