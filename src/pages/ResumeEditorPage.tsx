import React, { useState, lazy, Suspense, ErrorBoundary } from 'react';
import { API_ENDPOINTS } from '../config/api';
import Header from '../components/Header';
import BackButton from '../components/BackButton';
import aiService from '../services/aiService';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

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

// Dynamic template imports
const templateComponents: { [key: string]: any } = {
  'amsterdam': lazy(() => import('../components/templates/amsterdam')),
  'athens': lazy(() => import('../components/templates/athens')),
  'berlin': lazy(() => import('../components/templates/berlin')),
  'boston': lazy(() => import('../components/templates/boston')),
  'brussels': lazy(() => import('../components/templates/brussels')),
  'chicago': lazy(() => import('../components/templates/chicago')),
  'copenhagen': lazy(() => import('../components/templates/copenhagen')),
  'dublin': lazy(() => import('../components/templates/dublin')),
  'london': lazy(() => import('../components/templates/london')),
  'madrid': lazy(() => import('../components/templates/madrid')),
  'milan': lazy(() => import('../components/templates/milan')),
  'new-york': lazy(() => import('../components/templates/new-york')),
  'oslo': lazy(() => import('../components/templates/oslo')),
  'paris': lazy(() => import('../components/templates/paris')),
  'prague': lazy(() => import('../components/templates/prague')),
  'santiago': lazy(() => import('../components/templates/santiago')),
  'shanghai': lazy(() => import('../components/templates/shanghai')),
  'singapore': lazy(() => import('../components/templates/singapore')),
  'stockholm': lazy(() => import('../components/templates/stockholm')),
  'sydney': lazy(() => import('../components/templates/sydney')),
  'toronto': lazy(() => import('../components/templates/toronto')),
  'vienna': lazy(() => import('../components/templates/vienna'))
};

const ResumeEditorPage: React.FC<ResumeEditorPageProps> = ({ onNavigate, user, onLogout, template }) => {
  const selectedTemplate = template || 'london';
  const [activeTab, setActiveTab] = useState<string>('contacts');
  const [isGenerating, setIsGenerating] = useState<{[key: string]: boolean}>({});
  
  const [resumeData, setResumeData] = useState<ResumeData>({
    firstName: 'Riley',
    lastName: 'Taylor',
    jobTitle: 'Accountant',
    email: 'e.g.mail@example.com',
    phone: '305-123-44444',
    city: 'San Francisco',
    country: 'USA',
    address: '',
    company: 'Tech Corp',
    role: 'Junior Accountant',
    workDescription: 'Helped with monthly financial reports and data entry\nWatched over team budgets and reported issues\nEntered 150+ invoices weekly using accounting software',
    skills: ['Microsoft Excel', 'Financial Analysis', 'Data Entry', 'QuickBooks', 'Budget Management'],
    summary: 'Experienced professional with strong background in accounting and finance. Skilled in financial analysis, budget management, and data entry with proven track record of improving efficiency and accuracy.',
    experience: [{
      company: '',
      role: '',
      location: '',
      start: '',
      end: '',
      details: ['']
    }],
    education: [{
      degree: '',
      school: '',
      location: '',
      start: '',
      end: '',
      description: ''
    }]
  });

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
          details: field === 'workDescription' ? value.split('\n').filter(line => line.trim()) : (prev.experience[0]?.details || [prev.workDescription].filter(d => d))
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

  const renderTemplate = () => {
    const TemplateComponent = templateComponents[selectedTemplate];
    if (!TemplateComponent) {
      return (
        <div style={{ padding: "40px", textAlign: "center", color: "#666" }}>
          <h3>Template "{selectedTemplate}" not found</h3>
          <p>Please select a different template or check if the template exists.</p>
        </div>
      );
    }
    
    return (
      <TemplateErrorBoundary>
        <Suspense fallback={
          <div style={{ padding: "40px", textAlign: "center", color: "#666" }}>
            <div>Loading template...</div>
          </div>
        }>
          <TemplateComponent data={resumeData} />
        </Suspense>
      </TemplateErrorBoundary>
    );
  };

  const downloadResume = async (format: 'pdf' | 'docx') => {
    try {
      if (format === 'pdf') {
        const resumeElement = document.querySelector('[data-resume-content]');
        if (resumeElement) {
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
          alert('Resume template not found. Please try again.');
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
        
        alert('Word document downloaded successfully! You can open it in Microsoft Word.');
      }
    } catch (error) {
      console.error('Download error:', error);
      alert('Download failed. Please try again.');
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
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareText).then(() => {
        alert('Resume details copied to clipboard! You can share this with employers.');
      }).catch(() => {
        // Manual copy fallback
        const textArea = document.createElement('textarea');
        textArea.value = shareText;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('Resume details copied to clipboard! You can share this with employers.');
      });
    }
  };

  const saveToProfile = async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/save-resume`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: user?.name || 'guest',
          resume_data: resumeData,
          template: selectedTemplate
        })
      });
      
      if (response.ok) {
        alert('Resume saved to your profile successfully!');
      } else {
        alert('Failed to save resume. Please try again.');
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save resume. Please try again.');
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

  const renderToolbar = (type?: 'experience' | 'education' | 'summary') => (
    <div style={{ display: "flex", gap: "5px", marginBottom: "8px", flexWrap: "wrap", alignItems: "center" }}>
      <button style={{ padding: "4px 8px", border: "1px solid #d1d5db", background: "white", cursor: "pointer", borderRadius: "3px" }}><b>B</b></button>
      <button style={{ padding: "4px 8px", border: "1px solid #d1d5db", background: "white", cursor: "pointer", borderRadius: "3px" }}><i>I</i></button>
      <button style={{ padding: "4px 8px", border: "1px solid #d1d5db", background: "white", cursor: "pointer", borderRadius: "3px" }}><u>U</u></button>
      <button style={{ padding: "4px 8px", border: "1px solid #d1d5db", background: "white", cursor: "pointer", borderRadius: "3px" }}><s>S</s></button>
      
      <select style={{ padding: "4px 8px", border: "1px solid #d1d5db", background: "white", cursor: "pointer", borderRadius: "3px", fontSize: "12px" }}>
        <option>Arial</option>
        <option>Times New Roman</option>
        <option>Helvetica</option>
        <option>Georgia</option>
      </select>
      
      <select style={{ padding: "4px 8px", border: "1px solid #d1d5db", background: "white", cursor: "pointer", borderRadius: "3px", fontSize: "12px", width: "50px" }}>
        <option>12</option>
        <option>14</option>
        <option>16</option>
      </select>
      
      <button style={{ padding: "4px 8px", border: "1px solid #d1d5db", background: "white", cursor: "pointer", borderRadius: "3px", display: "flex", alignItems: "center", gap: "3px" }}>
        <div style={{ width: "16px", height: "16px", backgroundColor: "#000000", borderRadius: "2px" }}></div>
        <span style={{ fontSize: "10px" }}>▼</span>
      </button>
      
      <button style={{ padding: "4px 8px", border: "1px solid #d1d5db", background: "white", cursor: "pointer", borderRadius: "3px" }}>🔗</button>
      <button style={{ padding: "4px 8px", border: "1px solid #d1d5db", background: "white", cursor: "pointer", borderRadius: "3px" }}>•</button>
      <button style={{ padding: "4px 8px", border: "1px solid #d1d5db", background: "white", cursor: "pointer", borderRadius: "3px" }}>1.</button>
      <div style={{ marginLeft: "auto" }}>
        <button
          onClick={() => type && generateAIContent(type)}
          disabled={type ? isGenerating[type] : false}
          style={{
            background: type && isGenerating[type] ? "#9ca3af" : "#3b82f6",
            color: "white",
            border: "none",
            padding: "6px 12px",
            borderRadius: "6px",
            fontSize: "12px",
            cursor: type && isGenerating[type] ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: "5px"
          }}
        >
          {type && isGenerating[type] ? "⏳ Generating..." : "✨ Generate with AI"}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />
      
      {/* Back to Templates Button */}
      <div style={{ padding: "15px 20px", backgroundColor: "white", borderBottom: "1px solid #e5e7eb" }}>
        <BackButton 
          onClick={() => onNavigate && onNavigate('resume-templates')}
          text="Back to Templates"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800 transition-colors"
        />
      </div>

      <div style={{ display: "flex", height: "calc(100vh - 140px)" }}>
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
              <div style={{ 
                backgroundColor: "#f97316", 
                color: "white", 
                padding: "4px 8px", 
                borderRadius: "4px", 
                fontSize: "12px", 
                fontWeight: "bold" 
              }}>
                20%
              </div>
              <span style={{ fontSize: "14px", color: "#6b7280" }}>Your resume score</span>
              <span style={{ fontSize: "16px" }}>😊</span>
            </div>
          </div>
          
          {/* Tab Content */}
          <div style={{ padding: "20px", overflowY: "auto", height: "calc(100vh - 240px)" }}>
            
            {/* Contacts Tab Content */}
            {activeTab === 'contacts' && (
              <div>
                <h2 style={{ marginBottom: "10px", fontSize: "24px", fontWeight: "bold" }}>Contacts</h2>
                <p style={{ marginBottom: "20px", color: "#6b7280", fontSize: "14px" }}>
                  Add your up-to-date contact information so employers and recruiters can easily reach you.
                </p>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "15px" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "#374151", fontWeight: "500" }}>First name</label>
                    <input
                      style={{ width: "100%", padding: "10px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px" }}
                      value={resumeData.firstName}
                      onChange={(e) => updateField('firstName', e.target.value)}
                      placeholder="Riley"
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "#374151", fontWeight: "500" }}>Last name</label>
                    <input
                      style={{ width: "100%", padding: "10px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px" }}
                      value={resumeData.lastName}
                      onChange={(e) => updateField('lastName', e.target.value)}
                      placeholder="Taylor"
                    />
                  </div>
                </div>
                
                <div style={{ marginBottom: "15px" }}>
                  <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "#374151", fontWeight: "500" }}>Desired job title</label>
                  <input
                    style={{ width: "100%", padding: "10px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px" }}
                    value={resumeData.jobTitle}
                    onChange={(e) => updateField('jobTitle', e.target.value)}
                    placeholder="Accountant"
                  />
                </div>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "15px" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "#374151", fontWeight: "500" }}>Phone</label>
                    <input
                      style={{ width: "100%", padding: "10px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px" }}
                      value={resumeData.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                      placeholder="305-123-44444"
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "#374151", fontWeight: "500" }}>Email</label>
                    <input
                      style={{ width: "100%", padding: "10px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px" }}
                      value={resumeData.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      placeholder="e.g.mail@example.com"
                    />
                  </div>
                </div>
                
                <div style={{ marginBottom: "20px" }}>
                  <button
                    style={{
                      color: "#3b82f6",
                      background: "none",
                      border: "none",
                      fontSize: "14px",
                      cursor: "pointer",
                      textDecoration: "underline"
                    }}
                  >
                    Additional information ⌄
                  </button>
                </div>
                
                <div style={{ display: "flex", justifyContent: "center", marginTop: "40px" }}>
                  <button
                    style={{
                      padding: "12px 32px",
                      background: "#3b82f6",
                      color: "white",
                      border: "none",
                      borderRadius: "25px",
                      fontSize: "16px",
                      cursor: "pointer",
                      fontWeight: "500"
                    }}
                    onClick={() => setActiveTab('experience')}
                  >
                    Next: Experience
                  </button>
                </div>
              </div>
            )}

            {/* Experience Tab Content */}
            {activeTab === 'experience' && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <h2 style={{ fontSize: "24px", fontWeight: "bold", margin: 0 }}>Experience</h2>
                  <button style={{ background: "none", border: "none", color: "#f59e0b", cursor: "pointer", fontSize: "14px" }}>💡 Experience tips ⌄</button>
                </div>
                <p style={{ marginBottom: "20px", color: "#6b7280", fontSize: "14px" }}>
                  List your work experience starting with the most recent position first.
                </p>
                
                <div style={{ border: "1px solid #e5e7eb", borderRadius: "8px", padding: "20px", marginBottom: "20px", backgroundColor: "white" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                    <div>
                      <div style={{ color: "#9ca3af", fontSize: "14px" }}>Job title, Employer</div>
                      <div style={{ color: "#9ca3af", fontSize: "12px" }}>MM/YYYY - MM/YYYY</div>
                    </div>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: "16px" }}>⌃</button>
                      <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: "16px", color: "#ef4444" }}>🗑️</button>
                    </div>
                  </div>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "15px" }}>
                    <div>
                      <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "#374151", fontWeight: "500" }}>Job title</label>
                      <input
                        style={{ width: "100%", padding: "10px", border: "2px solid #3b82f6", borderRadius: "6px", fontSize: "14px" }}
                        value={resumeData.role}
                        onChange={(e) => updateField('role', e.target.value)}
                        placeholder="Junior Accountant"
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "#374151", fontWeight: "500" }}>Employer</label>
                      <input
                        style={{ width: "100%", padding: "10px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px" }}
                        value={resumeData.company}
                        onChange={(e) => updateField('company', e.target.value)}
                        placeholder="Company name"
                      />
                    </div>
                  </div>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "15px" }}>
                    <div>
                      <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "#374151", fontWeight: "500" }}>City</label>
                      <input
                        style={{ width: "100%", padding: "10px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px" }}
                        value={resumeData.city}
                        onChange={(e) => updateField('city', e.target.value)}
                        placeholder="San Francisco"
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "#374151", fontWeight: "500" }}>Country</label>
                      <input
                        style={{ width: "100%", padding: "10px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px" }}
                        value={resumeData.country}
                        onChange={(e) => updateField('country', e.target.value)}
                        placeholder="USA"
                      />
                    </div>
                  </div>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: "15px", alignItems: "end", marginBottom: "15px" }}>
                    <div>
                      <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "#374151", fontWeight: "500" }}>Start date</label>
                      <input
                        type="month"
                        style={{ width: "100%", padding: "10px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px" }}
                        value={resumeData.experience[0]?.start || ''}
                        onChange={(e) => {
                          const newExperience = [...resumeData.experience];
                          newExperience[0] = { ...newExperience[0], start: e.target.value };
                          updateField('experience', newExperience);
                        }}
                      />
                    </div>
                    <div style={{ padding: "10px 0", fontSize: "18px", color: "#9ca3af" }}>—</div>
                    <div>
                      <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "#374151", fontWeight: "500" }}>End date</label>
                      <input
                        type="month"
                        style={{ width: "100%", padding: "10px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px" }}
                        value={resumeData.experience[0]?.end || ''}
                        onChange={(e) => {
                          const newExperience = [...resumeData.experience];
                          newExperience[0] = { ...newExperience[0], end: e.target.value };
                          updateField('experience', newExperience);
                        }}
                      />
                    </div>
                  </div>
                  
                  <div style={{ marginBottom: "15px" }}>
                    <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "#374151", fontWeight: "500" }}>Description</label>
                    {renderToolbar('experience')}
                    <textarea
                      style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: "6px", padding: "10px", minHeight: "100px", backgroundColor: "white", fontSize: "14px", resize: "vertical" }}
                      value={resumeData.workDescription}
                      onChange={(e) => updateField('workDescription', e.target.value)}
                      placeholder="• Helped with monthly financial reports and data entry&#10;• Watched over team budgets and reported issues&#10;• Entered 150+ invoices weekly using accounting software"
                    />
                  </div>
                </div>
                
                <div style={{ marginTop: "20px", textAlign: "center" }}>
                  <button
                    style={{
                      padding: "10px 20px",
                      background: "#f3f4f6",
                      color: "#374151",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      fontSize: "14px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      margin: "0 auto"
                    }}
                    onClick={() => {
                      const newExperience = [...resumeData.experience, {
                        company: '',
                        role: '',
                        location: '',
                        start: '',
                        end: '',
                        details: ['']
                      }];
                      updateField('experience', newExperience);
                    }}
                  >
                    + Add Experience
                  </button>
                </div>
                
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "30px" }}>
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
                    onClick={() => setActiveTab('contacts')}
                  >
                    Back
                  </button>
                  <button
                    style={{
                      padding: "12px 32px",
                      background: "#3b82f6",
                      color: "white",
                      border: "none",
                      borderRadius: "25px",
                      fontSize: "16px",
                      cursor: "pointer",
                      fontWeight: "500"
                    }}
                    onClick={() => setActiveTab('education')}
                  >
                    Next: Education
                  </button>
                </div>
              </div>
            )}

            {/* Education Tab Content */}
            {activeTab === 'education' && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <h2 style={{ fontSize: "24px", fontWeight: "bold", margin: 0 }}>Education</h2>
                  <button style={{ background: "none", border: "none", color: "#f59e0b", cursor: "pointer", fontSize: "14px" }}>💡 Education tips ⌄</button>
                </div>
                <p style={{ marginBottom: "20px", color: "#6b7280", fontSize: "14px" }}>
                  Add your education details - even if you haven't graduated yet.
                </p>
                
                <div style={{ border: "1px solid #e5e7eb", borderRadius: "8px", padding: "20px", marginBottom: "20px", backgroundColor: "white" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                    <div>
                      <div style={{ color: "#9ca3af", fontSize: "14px" }}>School, Degree</div>
                      <div style={{ color: "#9ca3af", fontSize: "12px" }}>MM/YYYY - MM/YYYY</div>
                    </div>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: "16px" }}>⌃</button>
                      <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: "16px", color: "#ef4444" }}>🗑️</button>
                    </div>
                  </div>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "15px" }}>
                    <div>
                      <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "#374151", fontWeight: "500" }}>School name</label>
                      <input
                        style={{ width: "100%", padding: "10px", border: "2px solid #3b82f6", borderRadius: "6px", fontSize: "14px" }}
                        value={resumeData.education[0]?.school || ''}
                        onChange={(e) => {
                          const newEducation = [...resumeData.education];
                          newEducation[0] = { ...newEducation[0], school: e.target.value };
                          updateField('education', newEducation);
                        }}
                        placeholder="UCLA"
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "#374151", fontWeight: "500" }}>Location</label>
                      <input
                        style={{ width: "100%", padding: "10px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px" }}
                        value={resumeData.education[0]?.location || ''}
                        onChange={(e) => {
                          const newEducation = [...resumeData.education];
                          newEducation[0] = { ...newEducation[0], location: e.target.value };
                          updateField('education', newEducation);
                        }}
                        placeholder="New York"
                      />
                    </div>
                  </div>
                  
                  <div style={{ marginBottom: "15px" }}>
                    <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "#374151", fontWeight: "500" }}>Degree</label>
                    <input
                      style={{ width: "100%", padding: "10px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px" }}
                      value={resumeData.education[0]?.degree || ''}
                      onChange={(e) => {
                        const newEducation = [...resumeData.education];
                        newEducation[0] = { ...newEducation[0], degree: e.target.value };
                        updateField('education', newEducation);
                      }}
                      placeholder="BA in Finance and Banking"
                    />
                  </div>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: "15px", alignItems: "end", marginBottom: "15px" }}>
                    <div>
                      <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "#374151", fontWeight: "500" }}>Start date</label>
                      <input
                        type="month"
                        style={{ width: "100%", padding: "10px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px" }}
                        value={resumeData.education[0]?.start || ''}
                        onChange={(e) => {
                          const newEducation = [...resumeData.education];
                          newEducation[0] = { ...newEducation[0], start: e.target.value };
                          updateField('education', newEducation);
                        }}
                      />
                    </div>
                    <div style={{ padding: "10px 0", fontSize: "18px", color: "#9ca3af" }}>—</div>
                    <div>
                      <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "#374151", fontWeight: "500" }}>End date</label>
                      <input
                        type="month"
                        style={{ width: "100%", padding: "10px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px" }}
                        value={resumeData.education[0]?.end || ''}
                        onChange={(e) => {
                          const newEducation = [...resumeData.education];
                          newEducation[0] = { ...newEducation[0], end: e.target.value };
                          updateField('education', newEducation);
                        }}
                      />
                    </div>
                  </div>
                  
                  <div style={{ marginBottom: "15px" }}>
                    <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "#374151", fontWeight: "500" }}>Description</label>
                    {renderToolbar('education')}
                    <textarea
                      style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: "6px", padding: "10px", minHeight: "80px", backgroundColor: "white", fontSize: "14px", resize: "vertical" }}
                      value={resumeData.education[0]?.description || ''}
                      onChange={(e) => {
                        const newEducation = [...resumeData.education];
                        newEducation[0] = { ...newEducation[0], description: e.target.value };
                        updateField('education', newEducation);
                      }}
                      placeholder="e.g., Graduated with B.Tech in Computer Science with Honors. Completed coursework in Data Structures, Algorithms, Software Engineering, and Database Management. Achieved Dean's List recognition for academic excellence."
                    />
                  </div>
                </div>
                
                <div style={{ marginTop: "20px", textAlign: "center" }}>
                  <button
                    style={{
                      padding: "10px 20px",
                      background: "#f3f4f6",
                      color: "#374151",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      fontSize: "14px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      margin: "0 auto"
                    }}
                    onClick={() => {
                      const newEducation = [...resumeData.education, {
                        degree: '',
                        school: '',
                        location: '',
                        start: '',
                        end: '',
                        description: ''
                      }];
                      updateField('education', newEducation);
                    }}
                  >
                    + Add Education
                  </button>
                </div>
                
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "30px" }}>
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
                    onClick={() => setActiveTab('experience')}
                  >
                    Back
                  </button>
                  <button
                    style={{
                      padding: "12px 32px",
                      background: "#3b82f6",
                      color: "white",
                      border: "none",
                      borderRadius: "25px",
                      fontSize: "16px",
                      cursor: "pointer",
                      fontWeight: "500"
                    }}
                    onClick={() => setActiveTab('skills')}
                  >
                    Next: Skills
                  </button>
                </div>
              </div>
            )}

            {/* Skills Tab Content */}
            {activeTab === 'skills' && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <h2 style={{ fontSize: "24px", fontWeight: "bold", margin: 0 }}>Skills</h2>
                  <button style={{ background: "none", border: "none", color: "#f59e0b", cursor: "pointer", fontSize: "14px" }}>💡 Skills tips ⌄</button>
                </div>
                <p style={{ marginBottom: "20px", color: "#6b7280", fontSize: "14px" }}>
                  Choose 5 important skills that show you fit the position. Make sure they match the key skills mentioned in the job listing (especially when applying via an online system).
                </p>
                
                <div style={{ marginBottom: "20px" }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "15px" }}>
                    {resumeData.skills.map((skill, index) => (
                      <div key={index} style={{ 
                        display: "flex", 
                        alignItems: "center", 
                        gap: "8px", 
                        backgroundColor: "#f3f4f6", 
                        padding: "8px 12px", 
                        borderRadius: "20px",
                        border: "1px solid #d1d5db"
                      }}>
                        <span style={{ fontSize: "14px" }}>{skill}</span>
                        <button 
                          style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", fontSize: "12px" }}
                          onClick={() => {
                            const newSkills = resumeData.skills.filter((_, i) => i !== index);
                            updateField('skills', newSkills);
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <input
                      style={{ flex: 1, padding: "10px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px" }}
                      placeholder="Add a skill"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && e.target.value.trim()) {
                          const newSkills = [...resumeData.skills, e.target.value.trim()];
                          updateField('skills', newSkills);
                          e.target.value = '';
                        }
                      }}
                    />
                    <button
                      style={{
                        padding: "10px 20px",
                        background: "#3b82f6",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        fontSize: "14px",
                        cursor: "pointer"
                      }}
                      onClick={(e) => {
                        const input = e.target.parentElement.querySelector('input');
                        if (input.value.trim()) {
                          const newSkills = [...resumeData.skills, input.value.trim()];
                          updateField('skills', newSkills);
                          input.value = '';
                        }
                      }}
                    >
                      Add
                    </button>
                  </div>
                </div>
                
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "30px" }}>
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
                    onClick={() => setActiveTab('education')}
                  >
                    Back
                  </button>
                  <button
                    style={{
                      padding: "12px 32px",
                      background: "#3b82f6",
                      color: "white",
                      border: "none",
                      borderRadius: "25px",
                      fontSize: "16px",
                      cursor: "pointer",
                      fontWeight: "500"
                    }}
                    onClick={() => setActiveTab('summary')}
                  >
                    Next: Summary
                  </button>
                </div>
              </div>
            )}

            {/* Summary Tab Content */}
            {activeTab === 'summary' && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <h2 style={{ fontSize: "24px", fontWeight: "bold", margin: 0 }}>Summary</h2>
                  <button style={{ background: "none", border: "none", color: "#f59e0b", cursor: "pointer", fontSize: "14px" }}>💡 Summary tips ⌄</button>
                </div>
                <p style={{ marginBottom: "20px", color: "#6b7280", fontSize: "14px" }}>
                  Write a short introduction that highlights your experience, key skills, and career goals.
                </p>
                
                <div style={{ marginBottom: "20px" }}>
                  {renderToolbar('summary')}
                  
                  <textarea
                    style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: "6px", padding: "15px", minHeight: "120px", backgroundColor: "white", marginBottom: "20px", fontSize: "14px", resize: "vertical" }}
                    value={resumeData.summary}
                    onChange={(e) => updateField('summary', e.target.value)}
                    placeholder="Type from scratch or select one of our recruiter-approved structure examples."
                  />
                </div>
                
                <div style={{ marginBottom: "20px" }}>
                  <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "10px" }}>Suggested summary structure for <span style={{ color: "#3b82f6" }}>hv</span></h3>
                  <p style={{ color: "#6b7280", fontSize: "14px", marginBottom: "15px" }}>Click an example to insert and customize.</p>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "15px" }}>
                    <div style={{ 
                      border: "1px solid #d1d5db", 
                      borderRadius: "8px", 
                      padding: "15px", 
                      cursor: "pointer",
                      backgroundColor: "white",
                      position: "relative"
                    }}>
                      <div style={{ 
                        position: "absolute", 
                        top: "10px", 
                        left: "10px", 
                        width: "20px", 
                        height: "20px", 
                        borderRadius: "50%", 
                        backgroundColor: "#3b82f6", 
                        color: "white", 
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "center", 
                        fontSize: "12px", 
                        fontWeight: "bold" 
                      }}>+</div>
                      <div style={{ paddingLeft: "30px", fontSize: "14px", lineHeight: "1.4" }}>
                        Detail-oriented professional with 3+ years of experience in <strong>[field]</strong>. Skilled in <strong>[key skills]</strong>. Seeking to contribute to <strong>[type of team/company or goal]</strong>.
                      </div>
                    </div>
                    
                    <div style={{ 
                      border: "2px dashed #3b82f6", 
                      borderRadius: "8px", 
                      padding: "15px", 
                      cursor: "pointer",
                      backgroundColor: "#f8fafc",
                      position: "relative"
                    }}>
                      <div style={{ 
                        position: "absolute", 
                        top: "10px", 
                        left: "10px", 
                        width: "20px", 
                        height: "20px", 
                        borderRadius: "50%", 
                        backgroundColor: "#3b82f6", 
                        color: "white", 
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "center", 
                        fontSize: "12px", 
                        fontWeight: "bold" 
                      }}>+</div>
                      <div style={{ paddingLeft: "30px", fontSize: "14px", lineHeight: "1.4" }}>
                        Motivated recent graduate with a background in <strong>[field]</strong>. Eager to apply skills in <strong>[skill area]</strong> and grow within a dynamic organization.
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                    <div style={{ 
                      border: "1px solid #d1d5db", 
                      borderRadius: "8px", 
                      padding: "15px", 
                      cursor: "pointer",
                      backgroundColor: "white",
                      position: "relative"
                    }}>
                      <div style={{ 
                        position: "absolute", 
                        top: "10px", 
                        left: "10px", 
                        width: "20px", 
                        height: "20px", 
                        borderRadius: "50%", 
                        backgroundColor: "#3b82f6", 
                        color: "white", 
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "center", 
                        fontSize: "12px", 
                        fontWeight: "bold" 
                      }}>+</div>
                      <div style={{ paddingLeft: "30px", fontSize: "14px", lineHeight: "1.4" }}>
                        Creative thinker with a passion for <strong>[field]</strong>. Experienced in <strong>[tools or platforms]</strong>.
                      </div>
                    </div>
                    
                    <div style={{ 
                      border: "1px solid #d1d5db", 
                      borderRadius: "8px", 
                      padding: "15px", 
                      cursor: "pointer",
                      backgroundColor: "white",
                      position: "relative"
                    }}>
                      <div style={{ 
                        position: "absolute", 
                        top: "10px", 
                        left: "10px", 
                        width: "20px", 
                        height: "20px", 
                        borderRadius: "50%", 
                        backgroundColor: "#3b82f6", 
                        color: "white", 
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "center", 
                        fontSize: "12px", 
                        fontWeight: "bold" 
                      }}>+</div>
                      <div style={{ paddingLeft: "30px", fontSize: "14px", lineHeight: "1.4" }}>
                        A(n) <strong>[role]</strong> experienced in <strong>[field/industry]</strong>, skilled in <strong>[top 2-3 skills]</strong>, and looking to...
                      </div>
                    </div>
                  </div>
                </div>
                
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "30px" }}>
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
                    onClick={() => setActiveTab('skills')}
                  >
                    Back
                  </button>
                  <button
                    style={{
                      padding: "12px 32px",
                      background: "#3b82f6",
                      color: "white",
                      border: "none",
                      borderRadius: "25px",
                      fontSize: "16px",
                      cursor: "pointer",
                      fontWeight: "500"
                    }}
                    onClick={() => setActiveTab('finalize')}
                  >
                    Next: Finalize
                  </button>
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
                      { text: "Contact information is complete and accurate", checked: true },
                      { text: "Work experience includes quantifiable achievements", checked: true },
                      { text: "Education section is properly formatted", checked: true },
                      { text: "Skills are relevant to the target position", checked: false },
                      { text: "Professional summary is compelling and concise", checked: false }
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
          }}>
            <div style={{ transform: "scale(0.8)", transformOrigin: "top left", width: "125%" }} data-resume-content>
              <TemplateErrorBoundary>
                {renderTemplate()}
              </TemplateErrorBoundary>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeEditorPage;