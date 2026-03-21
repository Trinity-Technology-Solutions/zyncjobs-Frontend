import React, { useState } from 'react';
import { API_ENDPOINTS } from '../config/env';
import Header from '../components/Header';
import BackButton from '../components/BackButton';
import aiService from '../services/aiService';
import Notification from '../components/Notification';
import { useToast } from '../hooks/useToast';

class TemplateErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Template Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "40px", textAlign: "center", color: "#ef4444" }}>
          <h3>Template Error</h3>
          <p>There was an error rendering this template.</p>
          <p>Please try selecting a different template.</p>
          <button 
            onClick={() => this.setState({ hasError: false })}
            style={{ padding: "8px 16px", background: "#3b82f6", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

interface ResumeEditorPageProps {
  onNavigate?: (page: string) => void;
  user?: {name: string, type: 'candidate' | 'employer'} | null;
  onLogout?: () => void;
  template?: string;
}

interface ResumeData {
  firstName: string;
  lastName: string;
  jobTitle: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  address: string;
  company: string;
  role: string;
  workDescription: string;
  skills: string[];
  summary: string;
  experience: Array<{
    company: string;
    role: string;
    location: string;
    start: string;
    end: string;
    details: string[];
  }>;
  education: Array<{
    degree: string;
    school: string;
    location: string;
    start: string;
    end: string;
    description?: string;
  }>;
}

// Per-template style config
const TEMPLATE_STYLES: Record<string, { accent: string; headerBg: string; headerText: string; font: string; layout: 'single' | 'two-column' }> = {
  oslo:       { accent: '#1E1E1E', headerBg: '#fff',     headerText: '#1E1E1E', font: 'Georgia, serif',       layout: 'single' },
  madrid:     { accent: '#333',    headerBg: '#fff',     headerText: '#333',    font: 'Arial, sans-serif',    layout: 'single' },
  santiago:   { accent: '#444',    headerBg: '#fff',     headerText: '#444',    font: 'Times New Roman',      layout: 'single' },
  london:     { accent: '#1E1E1E', headerBg: '#fff',     headerText: '#1E1E1E', font: 'Arial, sans-serif',    layout: 'single' },
  copenhagen: { accent: '#2163CA', headerBg: '#2163CA',  headerText: '#fff',    font: 'Arial, sans-serif',    layout: 'two-column' },
  stockholm:  { accent: '#5121CA', headerBg: '#5121CA',  headerText: '#fff',    font: 'Arial, sans-serif',    layout: 'two-column' },
  vienna:     { accent: '#084C41', headerBg: '#084C41',  headerText: '#fff',    font: 'Georgia, serif',       layout: 'two-column' },
  dublin:     { accent: '#87300D', headerBg: '#87300D',  headerText: '#fff',    font: 'Arial, sans-serif',    layout: 'two-column' },
  brussels:   { accent: '#CA3D21', headerBg: '#CA3D21',  headerText: '#fff',    font: 'Arial, sans-serif',    layout: 'two-column' },
  boston:     { accent: '#2163CA', headerBg: '#f8f8f8',  headerText: '#1E1E1E', font: 'Arial, sans-serif',    layout: 'single' },
  'new-york': { accent: '#CA3D21', headerBg: '#fff',     headerText: '#1E1E1E', font: 'Arial, sans-serif',    layout: 'single' },
  sydney:     { accent: '#084C41', headerBg: '#fff',     headerText: '#084C41', font: 'Georgia, serif',       layout: 'single' },
  milan:      { accent: '#5121CA', headerBg: '#fff',     headerText: '#5121CA', font: 'Arial, sans-serif',    layout: 'single' },
  berlin:     { accent: '#1E1E1E', headerBg: '#1E1E1E',  headerText: '#fff',    font: 'Arial, sans-serif',    layout: 'single' },
  chicago:    { accent: '#2163CA', headerBg: '#f0f4ff',  headerText: '#1E1E1E', font: 'Arial, sans-serif',    layout: 'single' },
  singapore:  { accent: '#1E1E1E', headerBg: '#fff',     headerText: '#1E1E1E', font: 'Arial, sans-serif',    layout: 'single' },
  athens:     { accent: '#2163CA', headerBg: '#fff',     headerText: '#2163CA', font: 'Georgia, serif',       layout: 'single' },
  toronto:    { accent: '#084C41', headerBg: '#084C41',  headerText: '#fff',    font: 'Arial, sans-serif',    layout: 'two-column' },
  paris:      { accent: '#2163CA', headerBg: '#2163CA',  headerText: '#fff',    font: 'Georgia, serif',       layout: 'two-column' },
  amsterdam:  { accent: '#3E1D53', headerBg: '#3E1D53',  headerText: '#fff',    font: 'Arial, sans-serif',    layout: 'two-column' },
  prague:     { accent: '#2163CA', headerBg: '#fff',     headerText: '#1E1E1E', font: 'Arial, sans-serif',    layout: 'single' },
  shanghai:   { accent: '#CA9421', headerBg: '#fff',     headerText: '#CA9421', font: 'Arial, sans-serif',    layout: 'single' },
};

const LivePreview: React.FC<{ data: ResumeData; template: string }> = ({ data, template }) => {
  const t = (template || 'london').toLowerCase();
  const s = TEMPLATE_STYLES[t] || TEMPLATE_STYLES['london'];
  const contact = [data.email, data.phone, data.city && data.country ? `${data.city}, ${data.country}` : data.city || data.country].filter(Boolean).join('  ·  ');

  const sectionTitle = (title: string) => (
    <h2 style={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1.5px', color: s.accent, borderBottom: `1.5px solid ${s.accent}`, paddingBottom: '2px', marginBottom: '6px', marginTop: 0 }}>{title}</h2>
  );

  if (s.layout === 'two-column') {
    return (
      <div style={{ fontFamily: s.font, fontSize: '11px', color: '#111', minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header with photo placeholder */}
        <div style={{ backgroundColor: s.headerBg, color: s.headerText, padding: '20px 24px 14px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.25)', border: '2px solid rgba(255,255,255,0.5)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', color: 'rgba(255,255,255,0.7)' }}>&#128100;</div>
          <div>
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>
              {data.firstName || data.lastName ? `${data.firstName} ${data.lastName}`.trim() : <span style={{ opacity: 0.5 }}>Your Name</span>}
            </h1>
            {data.jobTitle && <p style={{ margin: '3px 0 0', fontSize: '12px', opacity: 0.9 }}>{data.jobTitle}</p>}
          </div>
        </div>
        {/* Two columns */}
        <div style={{ display: 'flex', flex: 1 }}>
          {/* Left sidebar */}
          <div style={{ width: '35%', backgroundColor: '#f5f5f5', padding: '16px 14px' }}>
            {contact && (
              <div style={{ marginBottom: '14px' }}>
                {sectionTitle('Contact')}
                {[data.email, data.phone, data.city && data.country ? `${data.city}, ${data.country}` : data.city || data.country].filter(Boolean).map((c, i) => (
                  <p key={i} style={{ margin: '2px 0', fontSize: '10px', wordBreak: 'break-all' }}>{c}</p>
                ))}
              </div>
            )}
            {data.skills.length > 0 && (
              <div style={{ marginBottom: '14px' }}>
                {sectionTitle('Skills')}
                {data.skills.map((sk, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: s.accent, flexShrink: 0 }} />
                    <span style={{ fontSize: '10px' }}>{sk}</span>
                  </div>
                ))}
              </div>
            )}
            {data.education.some(e => e.school || e.degree) && (
              <div>
                {sectionTitle('Education')}
                {data.education.filter(e => e.school || e.degree).map((edu, i) => (
                  <div key={i} style={{ marginBottom: '8px' }}>
                    <strong style={{ fontSize: '10px', display: 'block' }}>{edu.degree}</strong>
                    <span style={{ fontSize: '10px', color: '#555' }}>{edu.school}</span>
                    {(edu.start || edu.end) && <p style={{ margin: '1px 0', fontSize: '9px', color: '#777' }}>{edu.start}{edu.end ? ` – ${edu.end}` : ''}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Right main */}
          <div style={{ flex: 1, padding: '16px 18px' }}>
            {data.summary && (
              <div style={{ marginBottom: '12px' }}>
                {sectionTitle('Summary')}
                <p style={{ margin: 0, lineHeight: '1.5', fontSize: '10px' }}>{data.summary}</p>
              </div>
            )}
            {data.experience.some(e => e.company || e.role) && (
              <div>
                {sectionTitle('Experience')}
                {data.experience.filter(e => e.company || e.role).map((exp, i) => (
                  <div key={i} style={{ marginBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <strong style={{ fontSize: '11px' }}>{exp.role}{exp.company ? ` — ${exp.company}` : ''}</strong>
                      <span style={{ fontSize: '9px', color: '#666' }}>{exp.start && exp.end ? `${exp.start} – ${exp.end}` : exp.start || ''}</span>
                    </div>
                    {exp.location && <p style={{ margin: '1px 0', fontSize: '9px', color: '#666' }}>{exp.location}</p>}
                    {exp.details.filter(d => d).map((d, j) => <p key={j} style={{ margin: '1px 0 0 8px', fontSize: '10px' }}>• {d}</p>)}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Single-column layout
  return (
    <div style={{ fontFamily: s.font, fontSize: '11px', color: '#111', minHeight: '100%' }}>
      {/* Header */}
      <div style={{ backgroundColor: s.headerBg, color: s.headerText, padding: '20px 28px 14px', borderBottom: s.headerBg === '#fff' ? `2px solid ${s.accent}` : 'none' }}>
        <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 'bold' }}>
          {data.firstName || data.lastName ? `${data.firstName} ${data.lastName}`.trim() : <span style={{ opacity: 0.4 }}>Your Name</span>}
        </h1>
        {data.jobTitle && <p style={{ margin: '3px 0 0', fontSize: '13px', color: s.headerBg === '#fff' ? s.accent : 'rgba(255,255,255,0.85)' }}>{data.jobTitle}</p>}
        {contact && <p style={{ margin: '4px 0 0', fontSize: '10px', opacity: 0.75 }}>{contact}</p>}
      </div>

      <div style={{ padding: '16px 28px' }}>
        {data.summary && (
          <div style={{ marginBottom: '12px' }}>
            {sectionTitle('Summary')}
            <p style={{ margin: 0, lineHeight: '1.5' }}>{data.summary}</p>
          </div>
        )}
        {data.experience.some(e => e.company || e.role) && (
          <div style={{ marginBottom: '12px' }}>
            {sectionTitle('Experience')}
            {data.experience.filter(e => e.company || e.role).map((exp, i) => (
              <div key={i} style={{ marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong style={{ fontSize: '11px' }}>{exp.role}{exp.company ? ` — ${exp.company}` : ''}</strong>
                  <span style={{ fontSize: '10px', color: '#666' }}>{exp.start && exp.end ? `${exp.start} – ${exp.end}` : exp.start || ''}</span>
                </div>
                {exp.location && <p style={{ margin: '1px 0', fontSize: '10px', color: '#666' }}>{exp.location}</p>}
                {exp.details.filter(d => d).map((d, j) => <p key={j} style={{ margin: '1px 0 0 8px' }}>• {d}</p>)}
              </div>
            ))}
          </div>
        )}
        {data.education.some(e => e.school || e.degree) && (
          <div style={{ marginBottom: '12px' }}>
            {sectionTitle('Education')}
            {data.education.filter(e => e.school || e.degree).map((edu, i) => (
              <div key={i} style={{ marginBottom: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong style={{ fontSize: '11px' }}>{edu.degree}{edu.school ? ` — ${edu.school}` : ''}</strong>
                  <span style={{ fontSize: '10px', color: '#666' }}>{edu.start && edu.end ? `${edu.start} – ${edu.end}` : edu.start || ''}</span>
                </div>
                {edu.location && <p style={{ margin: '1px 0', fontSize: '10px', color: '#666' }}>{edu.location}</p>}
                {edu.description && <p style={{ margin: '2px 0 0' }}>{edu.description}</p>}
              </div>
            ))}
          </div>
        )}
        {data.skills.length > 0 && (
          <div>
            {sectionTitle('Skills')}
            <p style={{ margin: 0 }}>{data.skills.join(' · ')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

const ResumeEditorPage: React.FC<ResumeEditorPageProps> = ({ onNavigate, user, onLogout, template }) => {
  const { toast, showToast, hideToast } = useToast();
  const selectedTemplate = (template || 'london').toLowerCase();
  const [activeTab, setActiveTab] = useState<string>('contacts');
  const [showAdditional, setShowAdditional] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  const [isGenerating, setIsGenerating] = useState<{[key: string]: boolean}>({});

  // Pre-fill from localStorage profile
  const prefill = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
  })();
  const prefillNameParts = (prefill.name || '').trim().split(/\s+/);
  const prefillName = prefillNameParts;

  const [resumeData, setResumeData] = useState<ResumeData>({
    firstName: prefillNameParts[0] || '',
    lastName:  prefillNameParts.slice(1).join(' ') || '',
    jobTitle:  prefill.jobTitle || '',
    email:     prefill.email || '',
    phone:     prefill.phone || '',
    city:      typeof prefill.location === 'string' ? prefill.location : (prefill.location?.city || ''),
    country:   typeof prefill.location === 'object' ? (prefill.location?.country || '') : '',
    address:   '',
    company:   Array.isArray(prefill.employment) && prefill.employment[0]?.company ? prefill.employment[0].company : '',
    role:      Array.isArray(prefill.employment) && prefill.employment[0]?.designation ? prefill.employment[0].designation : '',
    workDescription: Array.isArray(prefill.employment) && prefill.employment[0]?.description ? prefill.employment[0].description : '',
    skills:    Array.isArray(prefill.skills) ? prefill.skills.filter(Boolean) : [],
    summary:   prefill.profileSummary || '',
    experience: Array.isArray(prefill.employment) && prefill.employment.length > 0
      ? prefill.employment.map((e: any) => ({
          company: e.company || '',
          role:    e.designation || '',
          location: '',
          start:   e.startDate || '',
          end:     e.endDate || '',
          details: e.description ? e.description.split('\n').filter(Boolean) : ['']
        }))
      : [{ company: '', role: '', location: '', start: '', end: '', details: [''] }],
    education: Array.isArray(prefill.education) && prefill.education.length > 0
      ? prefill.education.map((e: any) => ({
          degree:   e.degree || e.course || '',
          school:   e.college || e.school || '',
          location: '',
          start:    e.startYear ? String(e.startYear) : '',
          end:      e.endYear   ? String(e.endYear)   : '',
          description: ''
        }))
      : [{ degree: '', school: '', location: '', start: '', end: '', description: '' }]
  });

  const resumeScore = Math.min(100, [
    resumeData.firstName && resumeData.lastName ? 15 : 0,
    resumeData.email ? 10 : 0,
    resumeData.phone ? 10 : 0,
    resumeData.jobTitle ? 10 : 0,
    resumeData.summary.length > 50 ? 20 : resumeData.summary.length > 0 ? 10 : 0,
    resumeData.experience.some(e => e.company || e.role) ? 20 : 0,
    resumeData.education.some(e => e.school || e.degree) ? 10 : 0,
    resumeData.skills.length >= 3 ? 5 : resumeData.skills.length > 0 ? 2 : 0,
  ].reduce((a, b) => a + b, 0));

  const scoreColor = resumeScore >= 80 ? '#10b981' : resumeScore >= 50 ? '#f59e0b' : '#f97316';

  const updateField = (field: keyof ResumeData, value: any) => {
    setResumeData(prev => {
      const updated = { ...prev, [field]: value };
      // Update experience array with basic fields
      if (['company', 'role', 'workDescription'].includes(field)) {
        updated.experience = [{
          company: field === 'company' ? value : prev.company,
          role: field === 'role' ? value : prev.role,
          location: `${prev.city}, ${prev.country}`,
          start: prev.experience[0]?.start || '',
          end: prev.experience[0]?.end || '',
          details: field === 'workDescription' ? value.split('\n').filter((line: string) => line.trim()) : (prev.experience[0]?.details || [prev.workDescription].filter(d => d))
        }];
      }
      // Update experience location when city or country changes
      if (['city', 'country'].includes(field)) {
        updated.experience = [{
          company: prev.company,
          role: prev.role,
          location: `${field === 'city' ? value : prev.city}, ${field === 'country' ? value : prev.country}`,
          start: prev.experience[0]?.start || '',
          end: prev.experience[0]?.end || '',
          details: prev.experience[0]?.details || [prev.workDescription].filter(d => d)
        }];
      }
      return updated;
    });
  };



  const downloadResume = async (format: 'pdf' | 'docx') => {
    try {
      if (format === 'pdf') {
        const resumeElement = document.querySelector('[data-resume-content]');
        if (resumeElement) {
          // Lazy load PDF libraries
          const [html2canvas, { default: jsPDF }] = await Promise.all([
            import('html2canvas').then(m => m.default),
            import('jspdf')
          ]);
          
          // Generate PDF from the resume element
          const canvas = await html2canvas(resumeElement as HTMLElement, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff'
          });
          
          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF('p', 'mm', 'a4');
          
          const imgWidth = 210; // A4 width in mm
          const pageHeight = 295; // A4 height in mm
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          let heightLeft = imgHeight;
          
          let position = 0;
          
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
          
          while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
          }
          
          pdf.save(`${resumeData.firstName}_${resumeData.lastName}_Resume.pdf`);
        } else {
          showToast('Resume template not found. Please try again.', 'error');
        }
      } else if (format === 'docx') {
        // Create a Word-compatible HTML file
        const htmlContent = `
          <!DOCTYPE html>
          <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'>
          <head>
            <meta charset="utf-8">
            <title>Resume - ${resumeData.firstName} ${resumeData.lastName}</title>
            <!--[if gte mso 9]>
            <xml>
              <w:WordDocument>
                <w:View>Print</w:View>
                <w:Zoom>90</w:Zoom>
                <w:DoNotPromptForConvert/>
                <w:DoNotShowInsertionsAndDeletions/>
              </w:WordDocument>
            </xml>
            <![endif]-->
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; }
              h1 { color: #2c3e50; margin-bottom: 5px; }
              h2 { color: #34495e; margin-bottom: 10px; }
              h3 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 5px; }
            </style>
          </head>
          <body>
            <h1>${resumeData.firstName} ${resumeData.lastName}</h1>
            <h2>${resumeData.jobTitle}</h2>
            <p><strong>Email:</strong> ${resumeData.email} | <strong>Phone:</strong> ${resumeData.phone}</p>
            <p><strong>Location:</strong> ${resumeData.city}, ${resumeData.country}</p>
            
            <h3>Professional Summary</h3>
            <p>${resumeData.summary}</p>
            
            <h3>Experience</h3>
            <h4>${resumeData.role} - ${resumeData.company}</h4>
            <p>${resumeData.workDescription.replace(/\n/g, '<br>')}</p>
            
            <h3>Education</h3>
            ${resumeData.education.map(edu => `
              <h4>${edu.degree} - ${edu.school}</h4>
              <p><strong>Location:</strong> ${edu.location}</p>
              ${edu.description ? `<p>${edu.description}</p>` : ''}
            `).join('')}
            
            <h3>Skills</h3>
            <p>${resumeData.skills.join(', ')}</p>
          </body>
          </html>
        `;
        
        const blob = new Blob([htmlContent], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${resumeData.firstName}_${resumeData.lastName}_Resume.doc`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showToast('Word document downloaded! You can open it in Microsoft Word.', 'success');
      }
    } catch (error) {
      console.error('Download error:', error);
      showToast('Download failed. Please try again.', 'error');
    }
  };

  const shareResume = () => {
    // Create a shareable data object
    const shareData = {
      template: selectedTemplate,
      data: resumeData
    };
    
    // For now, create a simple share text with resume details
    const shareText = `${resumeData.firstName} ${resumeData.lastName} - ${resumeData.jobTitle}\n\nContact: ${resumeData.email} | ${resumeData.phone}\nLocation: ${resumeData.city}, ${resumeData.country}\n\nSummary: ${resumeData.summary}\n\nSkills: ${resumeData.skills.join(', ')}`;
    
    if (navigator.share) {
      navigator.share({
        title: `${resumeData.firstName} ${resumeData.lastName} - Resume`,
        text: shareText
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(shareText)
        .then(() => showToast('Resume details copied to clipboard!', 'success'))
        .catch(() => {
          const textArea = document.createElement('textarea');
          textArea.value = shareText;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          showToast('Resume details copied to clipboard!', 'success');
        });
    }
  };

  const saveToProfile = async () => {
    try {
      const userEmail = prefill.email;
      if (!userEmail) {
        showToast('Please log in to save your resume.', 'error');
        return;
      }
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/profile/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          name: `${resumeData.firstName} ${resumeData.lastName}`.trim() || prefill.name,
          phone: resumeData.phone || prefill.phone,
          location: resumeData.city || prefill.location,
          jobTitle: resumeData.jobTitle || prefill.jobTitle,
          profileSummary: resumeData.summary || prefill.profileSummary,
          skills: resumeData.skills.length > 0 ? resumeData.skills : prefill.skills,
          employment: resumeData.experience
            .filter(e => e.company || e.role)
            .map(e => ({
              company: e.company,
              designation: e.role,
              startDate: e.start,
              endDate: e.end,
              description: e.details.filter(Boolean).join('\n')
            })),
          education: resumeData.education
            .filter(e => e.school || e.degree)
            .map(e => ({
              college: e.school,
              degree: e.degree,
              startYear: e.start,
              endYear: e.end
            }))
        })
      });
      if (response.ok) {
        showToast('Resume saved to your profile successfully!', 'success');
      } else {
        const err = await response.json().catch(() => ({}));
        showToast(err.message || 'Failed to save. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Save error:', error);
      showToast('Network error. Please check your connection.', 'error');
    }
  };

  const generateAIContent = async (type: 'experience' | 'education' | 'summary') => {
    setIsGenerating(prev => ({ ...prev, [type]: true }));
    
    try {
      const content = await aiService.generateContent({
        type,
        jobTitle: resumeData.jobTitle || resumeData.role || 'Professional',
        company: resumeData.company,
        degree: resumeData.education[0]?.degree,
        school: resumeData.education[0]?.school
      });
      
      if (type === 'experience') {
        updateField('workDescription', content);
      } else if (type === 'education') {
        const newEducation = [...resumeData.education];
        newEducation[0] = { ...newEducation[0], description: content };
        updateField('education', newEducation);
      } else if (type === 'summary') {
        updateField('summary', content);
      }
    } catch (error) {
      console.error('AI generation failed:', error);
    } finally {
      setIsGenerating(prev => ({ ...prev, [type]: false }));
    }
  };

  const renderAIButton = (type: 'experience' | 'education' | 'summary') => (
    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "8px" }}>
      <button
        onClick={() => generateAIContent(type)}
        disabled={isGenerating[type]}
        style={{
          background: isGenerating[type] ? "#9ca3af" : "#3b82f6",
          color: "white",
          border: "none",
          padding: "6px 12px",
          borderRadius: "6px",
          fontSize: "12px",
          cursor: isGenerating[type] ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          gap: "5px"
        }}
      >
        {isGenerating[type] ? "⏳ Generating..." : "✨ Generate with AI"}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Notification type={toast.type} message={toast.message} isVisible={toast.isVisible} onClose={hideToast} />
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />
      
      {/* Back to Templates Button */}
      <div style={{ backgroundColor: "white", borderBottom: "1px solid #e5e7eb" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" style={{ padding: "15px 0" }}>
          <BackButton 
            onClick={() => onNavigate && onNavigate('resume-templates')}
            text="Back to Templates"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800 transition-colors"
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" style={{ display: "flex", height: "calc(100vh - 140px)" }}>
        {/* Left Side - Tabbed Interface */}
        <div style={{ width: "40%", backgroundColor: "#f8f9fa" }}>
          {/* Tab Navigation */}
          <div style={{ display: "flex", borderBottom: "1px solid #e5e7eb", backgroundColor: "white" }}>
            {[
              { id: 'contacts', label: 'Contacts' },
              { id: 'experience', label: 'Experience' },
              { id: 'education', label: 'Education' },
              { id: 'skills', label: 'Skills' },
              { id: 'summary', label: 'Summary' },
              { id: 'finalize', label: 'Finalize' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1,
                  padding: "12px 8px",
                  border: "none",
                  background: "transparent",
                  color: activeTab === tab.id ? "#3b82f6" : "#6b7280",
                  fontSize: "14px",
                  cursor: "pointer",
                  borderBottom: activeTab === tab.id ? "3px solid #3b82f6" : "3px solid transparent",
                  fontWeight: activeTab === tab.id ? "600" : "400"
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
          
          {/* Resume Score */}
          <div style={{ padding: "15px", backgroundColor: "white", borderBottom: "1px solid #e5e7eb" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ backgroundColor: scoreColor, color: "white", padding: "4px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: "bold" }}>
                {resumeScore}%
              </div>
              <span style={{ fontSize: "14px", color: "#6b7280" }}>Your resume score</span>
              <span style={{ fontSize: "16px" }}>{resumeScore >= 80 ? '🌟' : resumeScore >= 50 ? '😊' : '😐'}</span>
            </div>
          </div>
          
          {/* Tab Content */}
          <div style={{ padding: "24px", overflowY: "auto", height: "calc(100vh - 240px)" }}>

            {/* Contacts Tab Content */}
            {activeTab === 'contacts' && (
              <div>
                <h2 style={{ marginBottom: "6px", fontSize: "22px", fontWeight: "700", color: "#111827" }}>Contacts</h2>
                <p style={{ marginBottom: "24px", color: "#6b7280", fontSize: "13px", lineHeight: "1.5" }}>
                  Add your up-to-date contact information so employers and recruiters can easily reach you.
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", color: "#374151", fontWeight: "600" }}>First name</label>
                    <input
                      style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #d1d5db", borderRadius: "8px", fontSize: "14px", outline: "none", boxSizing: "border-box" }}
                      value={resumeData.firstName}
                      onChange={(e) => updateField('firstName', e.target.value)}
                      placeholder="Riley"
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", color: "#374151", fontWeight: "600" }}>Last name</label>
                    <input
                      style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #d1d5db", borderRadius: "8px", fontSize: "14px", outline: "none", boxSizing: "border-box" }}
                      value={resumeData.lastName}
                      onChange={(e) => updateField('lastName', e.target.value)}
                      placeholder="Taylor"
                    />
                  </div>
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", color: "#374151", fontWeight: "600" }}>Desired job title</label>
                  <input
                    style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #d1d5db", borderRadius: "8px", fontSize: "14px", outline: "none", boxSizing: "border-box" }}
                    value={resumeData.jobTitle}
                    onChange={(e) => updateField('jobTitle', e.target.value)}
                    placeholder="e.g. Accountant"
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", color: "#374151", fontWeight: "600" }}>Phone</label>
                    <input
                      style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #d1d5db", borderRadius: "8px", fontSize: "14px", outline: "none", boxSizing: "border-box" }}
                      value={resumeData.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                      placeholder="305-123-4444"
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", color: "#374151", fontWeight: "600" }}>Email</label>
                    <input
                      style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #d1d5db", borderRadius: "8px", fontSize: "14px", outline: "none", boxSizing: "border-box" }}
                      value={resumeData.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      placeholder="mail@example.com"
                    />
                  </div>
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <div>
                      <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", color: "#374151", fontWeight: "600" }}>City</label>
                      <input style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #d1d5db", borderRadius: "8px", fontSize: "14px", outline: "none", boxSizing: "border-box" }} value={resumeData.city} onChange={(e) => updateField('city', e.target.value)} placeholder="San Francisco" />
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", color: "#374151", fontWeight: "600" }}>Country</label>
                      <input style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #d1d5db", borderRadius: "8px", fontSize: "14px", outline: "none", boxSizing: "border-box" }} value={resumeData.country} onChange={(e) => updateField('country', e.target.value)} placeholder="USA" />
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: "20px" }}>
                  <button
                    onClick={() => setShowAdditional(v => !v)}
                    style={{ color: "#3b82f6", background: "none", border: "none", fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", padding: 0 }}
                  >
                    + Additional information (Address) {showAdditional ? '▲' : '▼'}
                  </button>
                  {showAdditional && (
                    <div style={{ marginTop: "12px" }}>
                      <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", color: "#374151", fontWeight: "600" }}>Address</label>
                      <input style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #d1d5db", borderRadius: "8px", fontSize: "14px", outline: "none", boxSizing: "border-box" }} value={resumeData.address} onChange={(e) => updateField('address', e.target.value)} placeholder="123 Main St" />
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "32px" }}>
                  <button
                    style={{ padding: "11px 32px", background: "#3b82f6", color: "white", border: "none", borderRadius: "25px", fontSize: "15px", cursor: "pointer", fontWeight: "600" }}
                    onClick={() => setActiveTab('experience')}
                  >
                    Next: Experience →
                  </button>
                </div>
              </div>
            )}

            {/* Experience Tab Content */}
            {activeTab === 'experience' && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <h2 style={{ fontSize: "22px", fontWeight: "700", margin: 0, color: "#111827" }}>Experience</h2>
                </div>
                <p style={{ marginBottom: "20px", color: "#6b7280", fontSize: "13px", lineHeight: "1.5" }}>
                  List your work experience starting with the most recent position first.
                </p>

                <div style={{ border: "1.5px solid #e5e7eb", borderRadius: "10px", padding: "20px", marginBottom: "16px", backgroundColor: "white" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                    <div>
                      <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", color: "#374151", fontWeight: "600" }}>Job title</label>
                      <input
                        style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #3b82f6", borderRadius: "8px", fontSize: "14px", outline: "none", boxSizing: "border-box" }}
                        value={resumeData.role}
                        onChange={(e) => updateField('role', e.target.value)}
                        placeholder="Junior Accountant"
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", color: "#374151", fontWeight: "600" }}>Employer</label>
                      <input
                        style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #d1d5db", borderRadius: "8px", fontSize: "14px", outline: "none", boxSizing: "border-box" }}
                        value={resumeData.company}
                        onChange={(e) => updateField('company', e.target.value)}
                        placeholder="Company name"
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                    <div>
                      <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", color: "#374151", fontWeight: "600" }}>City</label>
                      <input
                        style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #d1d5db", borderRadius: "8px", fontSize: "14px", outline: "none", boxSizing: "border-box" }}
                        value={resumeData.city}
                        onChange={(e) => updateField('city', e.target.value)}
                        placeholder="San Francisco"
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", color: "#374151", fontWeight: "600" }}>Country</label>
                      <input
                        style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #d1d5db", borderRadius: "8px", fontSize: "14px", outline: "none", boxSizing: "border-box" }}
                        value={resumeData.country}
                        onChange={(e) => updateField('country', e.target.value)}
                        placeholder="USA"
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                    <div>
                      <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", color: "#374151", fontWeight: "600" }}>Start date</label>
                      <input
                        type="month"
                        style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #d1d5db", borderRadius: "8px", fontSize: "14px", outline: "none", boxSizing: "border-box" }}
                        value={resumeData.experience[0]?.start || ''}
                        onChange={(e) => {
                          const newExperience = [...resumeData.experience];
                          newExperience[0] = { ...newExperience[0], start: e.target.value };
                          updateField('experience', newExperience);
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", color: "#374151", fontWeight: "600" }}>End date</label>
                      <input
                        type="month"
                        style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #d1d5db", borderRadius: "8px", fontSize: "14px", outline: "none", boxSizing: "border-box" }}
                        value={resumeData.experience[0]?.end || ''}
                        onChange={(e) => {
                          const newExperience = [...resumeData.experience];
                          newExperience[0] = { ...newExperience[0], end: e.target.value };
                          updateField('experience', newExperience);
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", color: "#374151", fontWeight: "600" }}>Description</label>
                    {renderAIButton('experience')}
                    <textarea
                      style={{ width: "100%", border: "1.5px solid #d1d5db", borderRadius: "8px", padding: "10px 12px", minHeight: "100px", backgroundColor: "white", fontSize: "14px", resize: "vertical", boxSizing: "border-box", outline: "none" }}
                      value={resumeData.workDescription}
                      onChange={(e) => updateField('workDescription', e.target.value)}
                      placeholder="• Describe your responsibilities and achievements"
                    />
                  </div>
                </div>

                <button
                  style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 18px", background: "white", color: "#374151", border: "1.5px dashed #d1d5db", borderRadius: "8px", fontSize: "13px", cursor: "pointer", width: "100%", justifyContent: "center", marginBottom: "24px" }}
                  onClick={() => updateField('experience', [...resumeData.experience, { company: '', role: '', location: '', start: '', end: '', details: [''] }])}
                >
                  + Add another experience
                </button>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <button style={{ padding: "10px 20px", background: "white", color: "#374151", border: "1.5px solid #d1d5db", borderRadius: "8px", fontSize: "14px", cursor: "pointer" }} onClick={() => setActiveTab('contacts')}>← Back</button>
                  <button style={{ padding: "11px 32px", background: "#3b82f6", color: "white", border: "none", borderRadius: "25px", fontSize: "15px", cursor: "pointer", fontWeight: "600" }} onClick={() => setActiveTab('education')}>Next: Education →</button>
                </div>
              </div>
            )}

            {/* Education Tab Content */}
            {activeTab === 'education' && (
              <div>
                <h2 style={{ fontSize: "22px", fontWeight: "700", margin: "0 0 6px", color: "#111827" }}>Education</h2>
                <p style={{ marginBottom: "20px", color: "#6b7280", fontSize: "13px", lineHeight: "1.5" }}>
                  Add your education details — even if you haven't graduated yet.
                </p>

                <div style={{ border: "1.5px solid #e5e7eb", borderRadius: "10px", padding: "20px", marginBottom: "16px", backgroundColor: "white" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                    <div>
                      <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", color: "#374151", fontWeight: "600" }}>School name</label>
                      <input
                        style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #3b82f6", borderRadius: "8px", fontSize: "14px", outline: "none", boxSizing: "border-box" }}
                        value={resumeData.education[0]?.school || ''}
                        onChange={(e) => { const n = [...resumeData.education]; n[0] = { ...n[0], school: e.target.value }; updateField('education', n); }}
                        placeholder="UCLA"
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", color: "#374151", fontWeight: "600" }}>Location</label>
                      <input
                        style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #d1d5db", borderRadius: "8px", fontSize: "14px", outline: "none", boxSizing: "border-box" }}
                        value={resumeData.education[0]?.location || ''}
                        onChange={(e) => { const n = [...resumeData.education]; n[0] = { ...n[0], location: e.target.value }; updateField('education', n); }}
                        placeholder="New York"
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: "16px" }}>
                    <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", color: "#374151", fontWeight: "600" }}>Degree</label>
                    <input
                      style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #d1d5db", borderRadius: "8px", fontSize: "14px", outline: "none", boxSizing: "border-box" }}
                      value={resumeData.education[0]?.degree || ''}
                      onChange={(e) => { const n = [...resumeData.education]; n[0] = { ...n[0], degree: e.target.value }; updateField('education', n); }}
                      placeholder="BA in Finance and Banking"
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                    <div>
                      <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", color: "#374151", fontWeight: "600" }}>Start date</label>
                      <input type="month" style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #d1d5db", borderRadius: "8px", fontSize: "14px", outline: "none", boxSizing: "border-box" }} value={resumeData.education[0]?.start || ''} onChange={(e) => { const n = [...resumeData.education]; n[0] = { ...n[0], start: e.target.value }; updateField('education', n); }} />
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", color: "#374151", fontWeight: "600" }}>End date</label>
                      <input type="month" style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #d1d5db", borderRadius: "8px", fontSize: "14px", outline: "none", boxSizing: "border-box" }} value={resumeData.education[0]?.end || ''} onChange={(e) => { const n = [...resumeData.education]; n[0] = { ...n[0], end: e.target.value }; updateField('education', n); }} />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", color: "#374151", fontWeight: "600" }}>Description</label>
                    {renderAIButton('education')}
                    <textarea
                      style={{ width: "100%", border: "1.5px solid #d1d5db", borderRadius: "8px", padding: "10px 12px", minHeight: "80px", backgroundColor: "white", fontSize: "14px", resize: "vertical", boxSizing: "border-box", outline: "none" }}
                      value={resumeData.education[0]?.description || ''}
                      onChange={(e) => { const n = [...resumeData.education]; n[0] = { ...n[0], description: e.target.value }; updateField('education', n); }}
                      placeholder="e.g. Graduated with honors. Dean's List recognition."
                    />
                  </div>
                </div>

                <button
                  style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 18px", background: "white", color: "#374151", border: "1.5px dashed #d1d5db", borderRadius: "8px", fontSize: "13px", cursor: "pointer", width: "100%", justifyContent: "center", marginBottom: "24px" }}
                  onClick={() => updateField('education', [...resumeData.education, { degree: '', school: '', location: '', start: '', end: '', description: '' }])}
                >
                  + Add another education
                </button>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <button style={{ padding: "10px 20px", background: "white", color: "#374151", border: "1.5px solid #d1d5db", borderRadius: "8px", fontSize: "14px", cursor: "pointer" }} onClick={() => setActiveTab('experience')}>← Back</button>
                  <button style={{ padding: "11px 32px", background: "#3b82f6", color: "white", border: "none", borderRadius: "25px", fontSize: "15px", cursor: "pointer", fontWeight: "600" }} onClick={() => setActiveTab('skills')}>Next: Skills →</button>
                </div>
              </div>
            )}

            {/* Skills Tab Content */}
            {activeTab === 'skills' && (
              <div>
                <h2 style={{ fontSize: "22px", fontWeight: "700", margin: "0 0 6px", color: "#111827" }}>Skills</h2>
                <p style={{ marginBottom: "20px", color: "#6b7280", fontSize: "13px", lineHeight: "1.5" }}>
                  Choose 5 important skills that show you fit the position. Match them to the key skills in the job listing.
                </p>

                <div style={{ marginBottom: "20px" }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "14px", minHeight: "40px" }}>
                    {resumeData.skills.map((skill, index) => (
                      <div key={index} style={{ display: "flex", alignItems: "center", gap: "6px", backgroundColor: "#eff6ff", padding: "6px 12px", borderRadius: "20px", border: "1.5px solid #bfdbfe" }}>
                        <span style={{ fontSize: "13px", color: "#1d4ed8" }}>{skill}</span>
                        <button style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", fontSize: "14px", lineHeight: 1, padding: 0 }} onClick={() => updateField('skills', resumeData.skills.filter((_, i) => i !== index))}>×</button>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: "flex", gap: "10px" }}>
                    <input
                      style={{ flex: 1, padding: "10px 12px", border: "1.5px solid #d1d5db", borderRadius: "8px", fontSize: "14px", outline: "none", boxSizing: "border-box" }}
                      placeholder="Type a skill and press Enter or Add"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && skillInput.trim()) { updateField('skills', [...resumeData.skills, skillInput.trim()]); setSkillInput(''); } }}
                    />
                    <button
                      style={{ padding: "10px 20px", background: "#3b82f6", color: "white", border: "none", borderRadius: "8px", fontSize: "14px", cursor: "pointer", fontWeight: "600", whiteSpace: "nowrap" }}
                      onClick={() => { if (skillInput.trim()) { updateField('skills', [...resumeData.skills, skillInput.trim()]); setSkillInput(''); } }}
                    >
                      + Add
                    </button>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "32px" }}>
                  <button style={{ padding: "10px 20px", background: "white", color: "#374151", border: "1.5px solid #d1d5db", borderRadius: "8px", fontSize: "14px", cursor: "pointer" }} onClick={() => setActiveTab('education')}>← Back</button>
                  <button style={{ padding: "11px 32px", background: "#3b82f6", color: "white", border: "none", borderRadius: "25px", fontSize: "15px", cursor: "pointer", fontWeight: "600" }} onClick={() => setActiveTab('summary')}>Next: Summary →</button>
                </div>
              </div>
            )}

            {/* Summary Tab Content */}
            {activeTab === 'summary' && (
              <div>
                <h2 style={{ fontSize: "22px", fontWeight: "700", margin: "0 0 6px", color: "#111827" }}>Summary</h2>
                <p style={{ marginBottom: "20px", color: "#6b7280", fontSize: "13px", lineHeight: "1.5" }}>
                  Write a short introduction that highlights your experience, key skills, and career goals.
                </p>

                <div style={{ marginBottom: "20px" }}>
                  {renderAIButton('summary')}
                  <textarea
                    style={{ width: "100%", border: "1.5px solid #d1d5db", borderRadius: "8px", padding: "12px", minHeight: "120px", backgroundColor: "white", fontSize: "14px", resize: "vertical", boxSizing: "border-box", outline: "none", lineHeight: "1.6" }}
                    value={resumeData.summary}
                    onChange={(e) => updateField('summary', e.target.value)}
                    placeholder="Type from scratch or click a template below to get started."
                  />
                </div>

                <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "10px" }}>Click an example to insert and customize:</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "24px" }}>
                  {[
                    `Detail-oriented professional with 3+ years of experience in [field]. Skilled in [key skills]. Seeking to contribute to [type of team/company or goal].`,
                    `Motivated recent graduate with a background in [field]. Eager to apply skills in [skill area] and grow within a dynamic organization.`,
                    `Creative thinker with a passion for [field]. Experienced in [tools or platforms].`,
                    `A(n) [role] experienced in [field/industry], skilled in [top 2-3 skills], and looking to...`
                  ].map((tmpl, i) => (
                    <div
                      key={i}
                      onClick={() => updateField('summary', tmpl)}
                      style={{ border: "1.5px solid #e5e7eb", borderRadius: "8px", padding: "12px 14px", cursor: "pointer", backgroundColor: "white", fontSize: "13px", lineHeight: "1.5", color: "#374151", transition: "border-color 0.15s" }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = '#3b82f6')}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
                    >
                      {tmpl}
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <button style={{ padding: "10px 20px", background: "white", color: "#374151", border: "1.5px solid #d1d5db", borderRadius: "8px", fontSize: "14px", cursor: "pointer" }} onClick={() => setActiveTab('skills')}>← Back</button>
                  <button style={{ padding: "11px 32px", background: "#3b82f6", color: "white", border: "none", borderRadius: "25px", fontSize: "15px", cursor: "pointer", fontWeight: "600" }} onClick={() => setActiveTab('finalize')}>Next: Finalize →</button>
                </div>
              </div>
            )}
            
            {/* Finalize Tab Content */}
            {activeTab === 'finalize' && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <h2 style={{ fontSize: "24px", fontWeight: "bold", margin: 0 }}>Finalize</h2>
                  <button style={{ background: "none", border: "none", color: "#f59e0b", cursor: "pointer", fontSize: "14px" }}>💡 Finalize tips ⌄</button>
                </div>
                <p style={{ marginBottom: "30px", color: "#6b7280", fontSize: "14px" }}>
                  Review your resume and make final adjustments before downloading.
                </p>
                
                <div style={{ border: "1px solid #e5e7eb", borderRadius: "8px", padding: "20px", marginBottom: "20px", backgroundColor: "white" }}>
                  <h3 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "15px" }}>Resume Checklist</h3>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {[
                      { text: "Contact information is complete and accurate", checked: !!(resumeData.firstName && resumeData.lastName && resumeData.email && resumeData.phone) },
                      { text: "Work experience includes quantifiable achievements", checked: resumeData.experience.some(e => e.company || e.role) },
                      { text: "Education section is properly formatted", checked: resumeData.education.some(e => e.school || e.degree) },
                      { text: "Skills are relevant to the target position", checked: resumeData.skills.length >= 3 },
                      { text: "Professional summary is compelling and concise", checked: resumeData.summary.length >= 50 }
                    ].map((item, index) => (
                      <div key={index} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ 
                          width: "20px", 
                          height: "20px", 
                          borderRadius: "4px", 
                          backgroundColor: item.checked ? "#10b981" : "#f3f4f6",
                          border: item.checked ? "none" : "1px solid #d1d5db",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "white",
                          fontSize: "12px"
                        }}>
                          {item.checked && "✓"}
                        </div>
                        <span style={{ fontSize: "14px", color: item.checked ? "#374151" : "#6b7280" }}>{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div style={{ border: "1px solid #e5e7eb", borderRadius: "8px", padding: "20px", marginBottom: "20px", backgroundColor: "white" }}>
                  <h3 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "15px" }}>Download Options</h3>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                    <div style={{ textAlign: "center", padding: "20px", border: "2px dashed #d1d5db", borderRadius: "8px" }}>
                      <div style={{ fontSize: "32px", marginBottom: "10px" }}>📄</div>
                      <h4 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "5px" }}>PDF Format</h4>
                      <p style={{ fontSize: "12px", color: "#6b7280", marginBottom: "15px" }}>Best for online applications</p>
                      <button
                        onClick={() => downloadResume('pdf')}
                        style={{
                          width: "100%",
                          padding: "10px 20px",
                          background: "#3b82f6",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          fontSize: "14px",
                          cursor: "pointer",
                          fontWeight: "500"
                        }}
                      >
                        Download PDF
                      </button>
                    </div>
                    
                    <div style={{ textAlign: "center", padding: "20px", border: "2px dashed #d1d5db", borderRadius: "8px" }}>
                      <div style={{ fontSize: "32px", marginBottom: "10px" }}>📃</div>
                      <h4 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "5px" }}>Word Format</h4>
                      <p style={{ fontSize: "12px", color: "#6b7280", marginBottom: "15px" }}>Easy to edit and customize</p>
                      <button
                        onClick={() => downloadResume('docx')}
                        style={{
                          width: "100%",
                          padding: "10px 20px",
                          background: "#10b981",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          fontSize: "14px",
                          cursor: "pointer",
                          fontWeight: "500"
                        }}
                      >
                        Download DOCX
                      </button>
                    </div>
                  </div>
                </div>
                
                <div style={{ border: "1px solid #e5e7eb", borderRadius: "8px", padding: "20px", marginBottom: "30px", backgroundColor: "white" }}>
                  <h3 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "15px" }}>Share & Save Options</h3>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "15px" }}>
                    <div style={{ textAlign: "center", padding: "15px", border: "2px dashed #d1d5db", borderRadius: "8px" }}>
                      <div style={{ fontSize: "24px", marginBottom: "8px" }}>🔗</div>
                      <h4 style={{ fontSize: "14px", fontWeight: "600", marginBottom: "5px" }}>Share Link</h4>
                      <p style={{ fontSize: "11px", color: "#6b7280", marginBottom: "10px" }}>Share with employers</p>
                      <button
                        onClick={shareResume}
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          background: "#8b5cf6",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          fontSize: "12px",
                          cursor: "pointer",
                          fontWeight: "500"
                        }}
                      >
                        Share Resume
                      </button>
                    </div>
                    
                    <div style={{ textAlign: "center", padding: "15px", border: "2px dashed #d1d5db", borderRadius: "8px" }}>
                      <div style={{ fontSize: "24px", marginBottom: "8px" }}>💾</div>
                      <h4 style={{ fontSize: "14px", fontWeight: "600", marginBottom: "5px" }}>Save to Profile</h4>
                      <p style={{ fontSize: "11px", color: "#6b7280", marginBottom: "10px" }}>Access anytime</p>
                      <button
                        onClick={saveToProfile}
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          background: "#f59e0b",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          fontSize: "12px",
                          cursor: "pointer",
                          fontWeight: "500"
                        }}
                      >
                        Save Resume
                      </button>
                    </div>
                    
                    <div style={{ textAlign: "center", padding: "15px", border: "2px dashed #d1d5db", borderRadius: "8px" }}>
                      <div style={{ fontSize: "24px", marginBottom: "8px" }}>📧</div>
                      <h4 style={{ fontSize: "14px", fontWeight: "600", marginBottom: "5px" }}>Email Resume</h4>
                      <p style={{ fontSize: "11px", color: "#6b7280", marginBottom: "10px" }}>Send directly</p>
                      <button
                        onClick={() => {
                          const subject = `Resume - ${resumeData.firstName} ${resumeData.lastName}`;
                          const body = `Hi,\n\nPlease find my resume attached.\n\nBest regards,\n${resumeData.firstName} ${resumeData.lastName}\n${resumeData.email}\n${resumeData.phone}`;
                          window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
                        }}
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          background: "#ef4444",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          fontSize: "12px",
                          cursor: "pointer",
                          fontWeight: "500"
                        }}
                      >
                        Email Resume
                      </button>
                    </div>
                  </div>
                </div>
                
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <button
                    style={{
                      padding: "10px 20px",
                      background: "#f3f4f6",
                      color: "#374151",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      fontSize: "14px",
                      cursor: "pointer"
                    }}
                    onClick={() => setActiveTab('summary')}
                  >
                    Back
                  </button>
                  <button
                    style={{
                      padding: "12px 32px",
                      background: "#10b981",
                      color: "white",
                      border: "none",
                      borderRadius: "25px",
                      fontSize: "16px",
                      cursor: "pointer",
                      fontWeight: "500"
                    }}
                    onClick={() => onNavigate?.('resume-ready')}
                  >
                    Complete Resume
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Live Preview */}
        <div style={{ width: "60%", padding: "20px", backgroundColor: "#f5f5f5" }}>
          <div style={{
            width: "100%",
            height: "calc(100vh - 120px)",
            border: "1px solid #d1d5db",
            borderRadius: "8px",
            backgroundColor: "white",
            overflow: "auto",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
          }} data-resume-content>
            <LivePreview data={resumeData} template={selectedTemplate} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeEditorPage;
