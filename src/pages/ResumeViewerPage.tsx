import React, { useState, useEffect, lazy, Suspense } from 'react';
// Note: This component doesn't use React Router since it's integrated into the main App
// Instead, it gets data from URL search params directly

class TemplateErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "40px", textAlign: "center", color: "#ef4444" }}>
          <h3>Template Error</h3>
          <p>There was an error rendering this resume.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

interface ResumeData {
  firstName: string;
  lastName: string;
  jobTitle: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  summary: string;
  skills: string[];
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
const templateComponents: { [key: string]: React.LazyExoticComponent<React.ComponentType<{ data: ResumeData }>> } = {
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

interface ResumeViewerPageProps {
  template?: string;
  resumeData?: ResumeData;
}

const ResumeViewerPage: React.FC<ResumeViewerPageProps> = ({ template: propTemplate, resumeData: propResumeData }) => {
  const [resumeData, setResumeData] = useState<ResumeData | null>(propResumeData || null);
  const [loading, setLoading] = useState(true);
  const [template, setTemplate] = useState<string>(propTemplate || 'london');

  useEffect(() => {
    try {
      // Try to get data from URL params if not provided as props
      if (!propResumeData) {
        const urlParams = new URLSearchParams(window.location.search);
        const dataParam = urlParams.get('data');
        if (dataParam) {
          const parsedData = JSON.parse(decodeURIComponent(dataParam));
          setResumeData(parsedData);
        }
      }
      
      // Get template from URL if not provided as props
      if (!propTemplate) {
        const path = window.location.pathname;
        const templateFromPath = path.split('/')[2];
        if (templateFromPath) {
          setTemplate(templateFromPath);
        }
      }
    } catch (error) {
      console.error('Error parsing resume data:', error);
    } finally {
      setLoading(false);
    }
  }, [propTemplate, propResumeData]);

  const downloadPDF = () => {
    window.print();
  };

  const renderTemplate = () => {
    if (!template || !resumeData) return null;
    
    const TemplateComponent = templateComponents[template];
    if (!TemplateComponent) {
      return (
        <div style={{ padding: "40px", textAlign: "center", color: "#666" }}>
          <h3>Template "{template}" not found</h3>
        </div>
      );
    }
    
    return (
      <TemplateErrorBoundary>
        <Suspense fallback={
          <div style={{ padding: "40px", textAlign: "center", color: "#666" }}>
            <div>Loading resume...</div>
          </div>
        }>
          <TemplateComponent data={resumeData} />
        </Suspense>
      </TemplateErrorBoundary>
    );
  };

  if (loading) {
    return (
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        height: "100vh",
        backgroundColor: "#f5f5f5"
      }}>
        <div>Loading resume...</div>
      </div>
    );
  }

  if (!resumeData) {
    return (
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        height: "100vh",
        backgroundColor: "#f5f5f5",
        flexDirection: "column"
      }}>
        <h2>Resume Not Found</h2>
        <p>The resume data could not be loaded.</p>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "#f5f5f5", minHeight: "100vh" }}>
      {/* Header with actions - hidden in print */}
      <div style={{ 
        padding: "20px", 
        backgroundColor: "white", 
        borderBottom: "1px solid #e5e7eb",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }} className="no-print">
        <div>
          <h1 style={{ margin: 0, fontSize: "24px", fontWeight: "bold" }}>
            {resumeData.firstName} {resumeData.lastName} - Resume
          </h1>
          <p style={{ margin: "5px 0 0 0", color: "#6b7280" }}>{resumeData.jobTitle}</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={downloadPDF}
            style={{
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
            📄 Download PDF
          </button>
          <button
            onClick={() => window.close()}
            style={{
              padding: "10px 20px",
              background: "#6b7280",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "14px",
              cursor: "pointer",
              fontWeight: "500"
            }}
          >
            Close
          </button>
        </div>
      </div>

      {/* Resume Content */}
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        padding: "20px",
        backgroundColor: "#f5f5f5"
      }}>
        <div style={{ 
          width: "210mm", 
          minHeight: "297mm",
          backgroundColor: "white",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
          borderRadius: "8px",
          overflow: "hidden"
        }}>
          {renderTemplate()}
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; padding: 0; background: white !important; }
          * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
        }
      `}</style>
    </div>
  );
};

export default ResumeViewerPage;