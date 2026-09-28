import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { ResumeData } from '../../store/useResumeStore';
import {
  formatEducationSubtitle,
  formatEducationDegreeLabel,
  formatEducationMeta,
  formatGrade,
} from '../../utils/educationFormatter';

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
  return (
    <View style={base.bullet}>
      <Text style={base.bulletDot}>•</Text>
      <Text style={[base.bulletText, color ? { color } : {}]}>{text}</Text>
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

function normSummary(s: string | string[]): string {
  return Array.isArray(s) ? s.join(' ') : s || '';
}

// ─── CLASSIC
const cs = StyleSheet.create({
  page:   { fontFamily: 'Helvetica', fontSize: 10, color: '#111', paddingTop: 36, paddingBottom: 36, paddingHorizontal: 40, lineHeight: 1.45 },
  name:   { fontSize: 18, fontWeight: 700, marginBottom: 2 },
  contact:{ fontSize: 9, color: '#555', marginBottom: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  secHdr: { fontSize: 10, fontWeight: 700, textTransform: 'uppercase', borderBottomWidth: 1, borderBottomColor: '#d0d0d0', paddingBottom: 2, marginBottom: 4, marginTop: 8, letterSpacing: 0.5, color: '#333' },
  muted:  { color: '#777', fontSize: 9 },
  skills: { fontSize: 9.5, color: '#333', marginBottom: 3 },
});

function ClassicPDF({ d }: { d: ResumeData }) {
  const n = d.personalInfo;
  const contact = [n.email, n.phone, n.location, n.linkedin, n.portfolio].filter(Boolean);
  const summary = normSummary(d.summary);
  return (
    <Page size="A4" style={cs.page}>
      <Text style={cs.name}>{n.name || ''}</Text>
      <View style={cs.contact}>
        {contact.map((p, i) => <Text key={i}>{p}{i < contact.length - 1 ? '  |' : ''}</Text>)}
      </View>
      {summary ? (
        <View><Text style={cs.secHdr}>Professional Summary</Text>
          <Text style={{ fontSize: 9.5, color: '#333', marginBottom: 4 }}>{summary}</Text>
        </View>
      ) : null}
      {d.skills.length > 0 && (
        <View><Text style={cs.secHdr}>Core Competencies</Text>
          <Text style={cs.skills}>{d.skills.join('  ·  ')}</Text>
        </View>
      )}
      {d.experience.length > 0 && (
        <View><Text style={cs.secHdr}>Experience</Text>
          {d.experience.map(e => (
            <View key={e.id} style={base.mb8}>
              <View style={base.row}>
                <Text style={[base.bold, { flex: 1 }]}>{e.title}</Text>
                <Text style={cs.muted}>{e.duration}</Text>
              </View>
              {e.company ? <Text style={{ fontSize: 9.5, color: '#555', marginBottom: 2 }}>{e.company}</Text> : null}
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
          <Text style={cs.skills}>{d.languages.map(l => l.language + ' (' + l.proficiency + ')').join('  ·  ')}</Text>
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

// ─── MODERN
const ms = StyleSheet.create({
  page:   { fontFamily: 'Helvetica', fontSize: 10, color: '#111', paddingTop: 32, paddingBottom: 36, paddingHorizontal: 38, lineHeight: 1.45 },
  name:   { fontSize: 20, fontWeight: 700, marginBottom: 2 },
  contact:{ fontSize: 9, color: '#666', marginBottom: 4, flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  rule:   { borderBottomWidth: 1, borderBottomColor: '#ccc', marginBottom: 8, marginTop: 2 },
  secHdr: { fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: '#555', borderBottomWidth: 1, borderBottomColor: '#ccc', paddingBottom: 2, marginBottom: 4, marginTop: 8 },
  muted:  { color: '#777', fontSize: 9 },
  skills: { fontSize: 9.5, color: '#444', marginBottom: 3 },
});

function ModernPDF({ d }: { d: ResumeData }) {
  const n = d.personalInfo;
  const contact = [n.email, n.phone, n.location, n.linkedin, n.portfolio].filter(Boolean);
  const summary = normSummary(d.summary);
  return (
    <Page size="A4" style={ms.page}>
      <Text style={ms.name}>{n.name || ''}</Text>
      <View style={ms.contact}>
        {contact.map((p, i) => <Text key={i}>{p}{i < contact.length - 1 ? ' ·' : ''}</Text>)}
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
                <Text style={ms.muted}>{e.duration}</Text>
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
  name:   { fontSize: 22, fontWeight: 400, letterSpacing: 2, marginBottom: 3 },
  contact:{ fontSize: 9, color: '#777', marginBottom: 14, letterSpacing: 0.5 },
  secRow: { flexDirection: 'row', marginBottom: 12, gap: 18 },
  secLbl: { width: 68, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#999', paddingTop: 3, flexShrink: 0 },
  secBody:{ flex: 1, borderTopWidth: 1, borderTopColor: '#e0e0e0', paddingTop: 4 },
  muted:  { color: '#999', fontSize: 9 },
});

function MinimalPDF({ d }: { d: ResumeData }) {
  const n = d.personalInfo;
  const contact = [n.email, n.phone, n.location, n.linkedin, n.portfolio].filter(Boolean).join('   ·   ');
  const summary = normSummary(d.summary);
  const sections: Array<{ label: string; body: React.ReactNode }> = [];
  if (summary) sections.push({ label: 'About', body: <Text style={{ fontSize: 9.5, color: '#333' }}>{summary}</Text> });
  if (d.skills.length > 0) sections.push({ label: 'Skills', body: <Text style={{ fontSize: 9.5, color: '#444' }}>{d.skills.join(', ')}</Text> });
  if (d.experience.length > 0) sections.push({ label: 'Experience', body: (
    <View>
      {d.experience.map(e => (
        <View key={e.id} style={base.mb8}>
          <View style={base.row}>
            <Text style={base.bold}>{e.title}{e.company ? ' — ' + e.company : ''}</Text>
            <Text style={mns.muted}>{e.duration}</Text>
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
  page:   { fontFamily: 'Helvetica', fontSize: 10, color: '#111', paddingTop: 32, paddingBottom: 36, paddingHorizontal: 38, lineHeight: 1.45 },
  hdrBox: { borderTopWidth: 2, borderBottomWidth: 2, borderColor: '#1a1a1a', paddingVertical: 7, marginBottom: 14, alignItems: 'center' },
  name:   { fontSize: 20, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase' },
  contact:{ fontSize: 9, color: '#666', marginTop: 3 },
  secHdr: { fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, borderBottomWidth: 1, borderBottomColor: '#888', paddingBottom: 2, marginBottom: 5, marginTop: 10 },
  muted:  { color: '#777', fontSize: 9 },
  skills: { fontSize: 9.5, color: '#444', marginBottom: 3 },
});

function ExecutivePDF({ d }: { d: ResumeData }) {
  const n = d.personalInfo;
  const contact = [n.email, n.phone, n.location, n.linkedin, n.portfolio].filter(Boolean).join('  ·  ');
  const summary = normSummary(d.summary);
  return (
    <Page size="A4" style={es.page}>
      <View style={es.hdrBox}>
        <Text style={es.name}>{n.name || ''}</Text>
        <Text style={es.contact}>{contact}</Text>
      </View>
      {summary ? (
        <View><Text style={es.secHdr}>Executive Summary</Text>
          <Text style={{ fontSize: 9.5, color: '#333', marginBottom: 4 }}>{summary}</Text>
        </View>
      ) : null}
      {d.skills.length > 0 && (
        <View><Text style={es.secHdr}>Areas of Expertise</Text>
          <Text style={es.skills}>{d.skills.join('  ·  ')}</Text>
        </View>
      )}
      {d.experience.length > 0 && (
        <View><Text style={es.secHdr}>Career History</Text>
          {d.experience.map(e => (
            <View key={e.id} style={base.mb8}>
              <View style={base.row}>
                <Text style={[base.bold, { flex: 1 }]}>{e.title}</Text>
                <Text style={es.muted}>{e.duration}</Text>
              </View>
              {e.company ? <Text style={{ fontSize: 9.5, color: '#555', fontStyle: 'italic', marginBottom: 2 }}>{e.company}</Text> : null}
              {e.bullets.filter(b => b.trim()).map((b, i) => <Bullet key={i} text={'> ' + b} />)}
            </View>
          ))}
        </View>
      )}
      {d.education.length > 0 && (
        <View><Text style={es.secHdr}>Education & Credentials</Text>
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
                <Text style={cps.muted}>{e.duration}</Text>
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
                    <Text style={ps.mMuted}>{e.duration}</Text>
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
  const d = applyHidden(data);
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
