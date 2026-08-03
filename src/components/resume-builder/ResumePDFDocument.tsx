import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { ResumeData } from '../../store/useResumeStore';

Font.register({
  family: 'Arial',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/opensans/v40/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsjZ0C24.woff2', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/opensans/v40/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsg-1C24.woff2', fontWeight: 700 },
  ],
});

const s = StyleSheet.create({
  page:       { fontFamily: 'Arial', fontSize: 10, color: '#111', paddingTop: 36, paddingBottom: 36, paddingHorizontal: 40, lineHeight: 1.5 },
  name:       { fontSize: 18, fontWeight: 700, marginBottom: 3 },
  contact:    { fontSize: 9, color: '#555', marginBottom: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  sectionHdr: { fontSize: 10, fontWeight: 700, textTransform: 'uppercase', borderBottomWidth: 1, borderBottomColor: '#ccc', paddingBottom: 2, marginBottom: 5, marginTop: 10, letterSpacing: 0.5 },
  row:        { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  bold:       { fontWeight: 700 },
  muted:      { color: '#666', fontSize: 9 },
  bullet:     { flexDirection: 'row', marginBottom: 2, paddingLeft: 8 },
  bulletDot:  { width: 10, fontSize: 10 },
  bulletText: { flex: 1, fontSize: 9.5, color: '#333' },
  skillsText: { fontSize: 9.5, color: '#333', marginBottom: 4 },
  mb4:        { marginBottom: 4 },
  mb8:        { marginBottom: 8 },
});

function Bullet({ text }: { text: string }) {
  return (
    <View style={s.bullet}>
      <Text style={s.bulletDot}>•</Text>
      <Text style={s.bulletText}>{text}</Text>
    </View>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View>
      <Text style={s.sectionHdr}>{label}</Text>
      {children}
    </View>
  );
}

function eduDegree(edu: any): string {
  if (edu.ugDegree && edu.pgDegree) return `${edu.ugDegree}, ${edu.pgDegree}`;
  return edu.ugDegree || edu.pgDegree || edu.degree || '';
}

export default function ResumePDFDocument({ data }: { data: ResumeData }) {
  const n = data.personalInfo;
  const contactParts = [n.email, n.phone, n.location, n.linkedin, n.portfolio].filter(Boolean);
  const summary = Array.isArray(data.summary) ? data.summary.join(' ') : data.summary || '';

  return (
    <Document title={n.name || 'Resume'} author={n.name || ''} subject="Resume">
      <Page size="A4" style={s.page}>

        {/* Header */}
        <Text style={s.name}>{n.name || ''}</Text>
        <View style={s.contact}>
          {contactParts.map((p, i) => (
            <Text key={i}>{p}{i < contactParts.length - 1 ? '  |' : ''}</Text>
          ))}
        </View>

        {/* Summary */}
        {summary ? (
          <Section label="Professional Summary">
            <Text style={{ fontSize: 9.5, color: '#333', marginBottom: 4 }}>{summary}</Text>
          </Section>
        ) : null}

        {/* Skills */}
        {data.skills.length > 0 && (
          <Section label="Skills">
            <Text style={s.skillsText}>{data.skills.join('  ·  ')}</Text>
          </Section>
        )}

        {/* Experience */}
        {data.experience.length > 0 && (
          <Section label="Experience">
            {data.experience.map(exp => (
              <View key={exp.id} style={s.mb8}>
                <View style={s.row}>
                  <Text style={s.bold}>{exp.title}{exp.company ? ` — ${exp.company}` : ''}</Text>
                  <Text style={s.muted}>{exp.duration}</Text>
                </View>
                {exp.bullets.filter(b => b.trim()).map((b, i) => <Bullet key={i} text={b} />)}
              </View>
            ))}
          </Section>
        )}

        {/* Education */}
        {data.education.length > 0 && (
          <Section label="Education">
            {data.education.map(edu => (
              <View key={edu.id} style={[s.row, s.mb4]}>
                <Text style={s.bold}>{eduDegree(edu)}{edu.institution ? ` — ${edu.institution}` : ''}{edu.grade ? `  |  ${edu.grade}` : ''}</Text>
                <Text style={s.muted}>{edu.duration}</Text>
              </View>
            ))}
          </Section>
        )}

        {/* Certifications */}
        {data.certifications.length > 0 && (
          <Section label="Certifications">
            {data.certifications.map(c => (
              <View key={c.id} style={[s.row, s.mb4]}>
                <Text>{c.name}{c.issuer ? ` — ${c.issuer}` : ''}</Text>
                <Text style={s.muted}>{c.year}</Text>
              </View>
            ))}
          </Section>
        )}

        {/* Projects */}
        {data.projects.length > 0 && (
          <Section label="Projects">
            {data.projects.map(p => (
              <View key={p.id} style={s.mb8}>
                <View style={s.row}>
                  <Text style={s.bold}>{p.name}{p.role ? ` — ${p.role}` : ''}</Text>
                  <Text style={s.muted}>{p.duration}</Text>
                </View>
                {p.url ? <Text style={{ fontSize: 9, color: '#2563eb', marginBottom: 2 }}>{p.url}</Text> : null}
                {p.bullets.filter(b => b.trim()).map((b, i) => <Bullet key={i} text={b} />)}
              </View>
            ))}
          </Section>
        )}

        {/* Languages */}
        {data.languages.length > 0 && (
          <Section label="Languages">
            <Text style={s.skillsText}>{data.languages.map(l => `${l.language} (${l.proficiency})`).join('  ·  ')}</Text>
          </Section>
        )}

        {/* Achievements */}
        {data.achievements?.length > 0 && (
          <Section label="Achievements">
            {data.achievements.map((a: any) => (
              <View key={a.id} style={s.mb4}>
                {a.title ? <Text style={s.bold}>{a.title}</Text> : null}
                {a.description ? <Text style={{ fontSize: 9.5, color: '#555' }}>{a.description}</Text> : null}
              </View>
            ))}
          </Section>
        )}

        {/* Awards */}
        {data.awards?.length > 0 && (
          <Section label="Awards">
            {data.awards.map((a: any) => (
              <View key={a.id} style={[s.row, s.mb4]}>
                <Text style={s.bold}>{a.title}{a.issuer ? ` — ${a.issuer}` : ''}</Text>
                <Text style={s.muted}>{a.year}</Text>
              </View>
            ))}
          </Section>
        )}

        {/* Custom Sections */}
        {data.customSections?.filter((sec: any) => sec.content).map((sec: any) => (
          <Section key={sec.id} label={sec.heading}>
            <Text style={{ fontSize: 9.5, color: '#333' }}>{sec.content}</Text>
          </Section>
        ))}

      </Page>
    </Document>
  );
}
