import React, { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { API_BASE_URL } from '../config/env';

interface ResumeReadyPageProps {
  onNavigate?: (page: string) => void;
  user?: {name: string, type: 'candidate' | 'employer'} | null;
  onLogout?: () => void;
}

const ResumeReadyPage: React.FC<ResumeReadyPageProps> = ({ onNavigate, user, onLogout }) => {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Sample resume data - in real app, this would come from state/props
  const resumeData = {
    template: 'london',
    personalInfo: {
      firstName: 'Rajesh',
      lastName: 'Gupta',
      city: 'Chennai',
      phone: '+91 9876543210',
      email: 'rajeshgupta@rediffmail.com'
    },
    workExperience: [
      {
        id: 1,
        company: 'Tech Solutions Pvt Ltd',
        position: 'Software Developer',
        location: 'Chennai, India',
        startDate: 'Jan 2022',
        endDate: 'Present',
        current: true,
        description: 'Developed and maintained web applications using React and Node.js. Collaborated with cross-functional teams to deliver high-quality software solutions.'
      }
    ],
    skills: [
      { id: 1, name: 'JavaScript', level: 'PROFESSIONAL' },
      { id: 2, name: 'React', level: 'PROFESSIONAL' },
      { id: 3, name: 'Node.js', level: 'INTERMEDIATE' }
    ],
    about: 'Passionate software developer with 2+ years of experience in full-stack development.'
  };

  const generatePDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/pdf/generate-resume`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resumeData })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${resumeData.personalInfo.firstName}_${resumeData.personalInfo.lastName}_Resume.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        throw new Error('Failed to generate PDF');
      }
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />
      
      <div className="resume-ready-container">
        <div className="success-header">
          <div className="success-icon">🎉</div>
          <h1 className="success-title">Your Resume is Ready!</h1>
          <p className="success-subtitle">
            Congratulations! Your professional resume has been created successfully.
          </p>
        </div>

        <div className="resume-preview-section">
          <div className="preview-container">
            <div className="resume-preview">
              <div className="resume-header">
                <h2 className="resume-name">
                  {resumeData.personalInfo.firstName} {resumeData.personalInfo.lastName}
                </h2>
                <div className="resume-contact">
                  {resumeData.personalInfo.email} | {resumeData.personalInfo.phone} | {resumeData.personalInfo.city}
                </div>
              </div>

              {resumeData.about && (
                <div className="resume-section">
                  <h3 className="section-title">About</h3>
                  <p className="section-content">{resumeData.about}</p>
                </div>
              )}

              {resumeData.workExperience.length > 0 && (
                <div className="resume-section">
                  <h3 className="section-title">Experience</h3>
                  {resumeData.workExperience.map((exp) => (
                    <div key={exp.id} className="experience-item">
                      <div className="exp-header">
                        <div className="exp-title">{exp.position} - {exp.company}</div>
                        <div className="exp-date">
                          {exp.startDate} {exp.current ? '- Present' : `- ${exp.endDate}`}
                        </div>
                      </div>
                      {exp.location && <div className="exp-location">{exp.location}</div>}
                      {exp.description && <div className="exp-description">{exp.description}</div>}
                    </div>
                  ))}
                </div>
              )}

              {resumeData.skills.length > 0 && (
                <div className="resume-section">
                  <h3 className="section-title">Skills</h3>
                  <div className="skills-grid">
                    {resumeData.skills.map((skill) => (
                      <div key={skill.id} className="skill-item">
                        <span className="skill-name">{skill.name}</span>
                        <span className="skill-level">{skill.level}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="action-buttons">
            <button 
              className="download-btn"
              onClick={generatePDF}
              disabled={isGeneratingPDF}
            >
              {isGeneratingPDF ? '🔄 Generating...' : '📥 Download PDF'}
            </button>
            <button 
              className="edit-btn"
              onClick={() => onNavigate?.('resume-editor')}
            >
              ✏️ Edit Resume
            </button>
            <button 
              className="new-btn"
              onClick={() => onNavigate?.('resume-templates')}
            >
              🆕 Create New Resume
            </button>
          </div>
        </div>

        <div className="next-steps">
          <h3>What's Next?</h3>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-icon">🔍</div>
              <h4>Find Jobs</h4>
              <p>Search for job opportunities that match your skills</p>
              <button onClick={() => onNavigate?.('jobs')}>Browse Jobs</button>
            </div>
            <div className="step-card">
              <div className="step-icon">📧</div>
              <h4>Apply Now</h4>
              <p>Start applying to your dream jobs with your new resume</p>
              <button onClick={() => onNavigate?.('jobs')}>Start Applying</button>
            </div>
            <div className="step-card">
              <div className="step-icon">💼</div>
              <h4>Build Profile</h4>
              <p>Complete your candidate profile to get noticed by employers</p>
              <button onClick={() => onNavigate?.('candidate-profile')}>Complete Profile</button>
            </div>
          </div>
        </div>
      </div>

      <Footer onNavigate={onNavigate} />

      <style jsx>{`
        .resume-ready-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 40px 20px;
        }

        .success-header {
          text-align: center;
          margin-bottom: 50px;
        }

        .success-icon {
          font-size: 64px;
          margin-bottom: 20px;
        }

        .success-title {
          font-size: 36px;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 16px;
        }

        .success-subtitle {
          font-size: 18px;
          color: #6b7280;
          max-width: 600px;
          margin: 0 auto;
        }

        .resume-preview-section {
          display: flex;
          gap: 40px;
          margin-bottom: 60px;
        }

        .preview-container {
          flex: 2;
        }

        .resume-preview {
          background: white;
          padding: 40px;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          font-family: Arial, sans-serif;
          line-height: 1.6;
        }

        .resume-header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #2563eb;
        }

        .resume-name {
          font-size: 28px;
          font-weight: bold;
          margin-bottom: 10px;
          color: #1f2937;
        }

        .resume-contact {
          font-size: 14px;
          color: #6b7280;
        }

        .resume-section {
          margin-bottom: 25px;
        }

        .section-title {
          font-size: 18px;
          font-weight: bold;
          color: #2563eb;
          margin-bottom: 15px;
          text-transform: uppercase;
          border-bottom: 1px solid #2563eb;
          padding-bottom: 5px;
        }

        .section-content {
          margin-bottom: 15px;
          color: #374151;
        }

        .experience-item {
          margin-bottom: 20px;
        }

        .exp-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 5px;
        }

        .exp-title {
          font-weight: bold;
          font-size: 16px;
          color: #1f2937;
        }

        .exp-date {
          font-size: 14px;
          color: #6b7280;
          font-style: italic;
        }

        .exp-location {
          font-size: 14px;
          color: #6b7280;
          margin-bottom: 8px;
        }

        .exp-description {
          margin-top: 8px;
          color: #374151;
        }

        .skills-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }

        .skill-item {
          display: flex;
          justify-content: space-between;
          padding: 8px;
          background: #f8f9fa;
          border-radius: 4px;
        }

        .skill-name {
          font-weight: 500;
          color: #1f2937;
        }

        .skill-level {
          font-size: 12px;
          color: #6b7280;
          text-transform: uppercase;
        }

        .action-buttons {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 16px;
          align-self: flex-start;
          position: sticky;
          top: 100px;
        }

        .download-btn, .edit-btn, .new-btn {
          padding: 16px 24px;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .download-btn {
          background: #10b981;
          color: white;
        }

        .download-btn:hover {
          background: #059669;
        }

        .download-btn:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        .edit-btn {
          background: #3b82f6;
          color: white;
        }

        .edit-btn:hover {
          background: #2563eb;
        }

        .new-btn {
          background: #f59e0b;
          color: white;
        }

        .new-btn:hover {
          background: #d97706;
        }

        .next-steps {
          text-align: center;
        }

        .next-steps h3 {
          font-size: 28px;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 40px;
        }

        .steps-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 30px;
        }

        .step-card {
          background: white;
          padding: 30px;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          text-align: center;
        }

        .step-icon {
          font-size: 48px;
          margin-bottom: 20px;
        }

        .step-card h4 {
          font-size: 20px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 12px;
        }

        .step-card p {
          color: #6b7280;
          margin-bottom: 20px;
          line-height: 1.6;
        }

        .step-card button {
          background: #3b82f6;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }

        .step-card button:hover {
          background: #2563eb;
        }

        @media (max-width: 768px) {
          .resume-preview-section {
            flex-direction: column;
          }

          .action-buttons {
            position: static;
            flex-direction: row;
            justify-content: center;
          }

          .success-title {
            font-size: 28px;
          }

          .resume-preview {
            padding: 20px;
          }
        }
      `}</style>
    </div>
  );
};

export default ResumeReadyPage;