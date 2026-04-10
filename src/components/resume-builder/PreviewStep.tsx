import React, { useRef, useState, useEffect } from 'react';
import { Download, FileText, Target, TrendingUp } from 'lucide-react';
import { useResumeStore } from '../../store/useResumeStore';
import { resumeBuilderAPI } from '../../services/resumeBuilderAPI';
import ResumeTemplate from './ResumeTemplate';

export default function PreviewStep() {
  const { data } = useResumeStore();
  const previewRef = useRef<HTMLDivElement>(null);
  const [atsScore, setAtsScore] = useState<any>(null);
  const [loadingScore, setLoadingScore] = useState(false);

  // Calculate ATS score on mount
  useEffect(() => {
    calculateScore();
  }, []);

  const calculateScore = async () => {
    setLoadingScore(true);
    try {
      const bullets = data.experience.flatMap((e) => e.bullets.filter((b) => b.trim()));
      const result = await resumeBuilderAPI.calculateATSScore({
        resumeData: {
          personalInfo: data.personalInfo,
          summary: data.summary,
          skills: data.skills,
          bullets,
          experience: data.experience,
          education: data.education,
        },
      });
      setAtsScore(result);
    } catch (err) {
      console.error('ATS score error:', err);
    } finally {
      setLoadingScore(false);
    }
  };

  const downloadTxt = () => {
    const content = generateResumeText();
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.personalInfo.name || 'Resume'}_Resume.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const [pdfLoading, setPdfLoading] = useState(false);
  const [docxLoading, setDocxLoading] = useState(false);

  const downloadDocx = async () => {
    setDocxLoading(true);
    const fileName = `${data.personalInfo.name || 'Resume'}_Resume.docx`;
    try {
      const {
        Document, Packer, Paragraph, TextRun, HeadingLevel,
        AlignmentType, BorderStyle, Table, TableRow, TableCell,
        WidthType, ShadingType,
      } = await import('docx');

      const ACCENT = '2563EB';
      const MUTED  = '6B7280';
      const DARK   = '1A1A2E';

      // ── helpers ──────────────────────────────────────────────────────────
      const sectionHeading = (title: string) => [
        new Paragraph({
          spacing: { before: 200, after: 60 },
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'E5E7EB' } },
          children: [
            new TextRun({
              text: title.toUpperCase(),
              bold: true, size: 18, color: MUTED,
              characterSpacing: 60,
            }),
          ],
        }),
      ];

      const bullet = (text: string) =>
        new Paragraph({
          spacing: { before: 40, after: 40 },
          indent: { left: 360 },
          children: [
            new TextRun({ text: `• ${text}`, size: 20, color: '374151' }),
          ],
        });

      // ── contact line ─────────────────────────────────────────────────────
      const contactParts = [
        data.personalInfo.email,
        data.personalInfo.phone,
        data.personalInfo.location,
      ].filter(Boolean);

      const linkParts = [
        data.personalInfo.linkedin,
        data.personalInfo.portfolio,
      ].filter(Boolean);

      // ── experience rows ──────────────────────────────────────────────────
      const experienceParas: Paragraph[] = [];
      data.experience.forEach((exp) => {
        // Title | Duration row using a 2-col table
        experienceParas.push(
          new Paragraph({
            spacing: { before: 160, after: 40 },
            children: [
              new TextRun({ text: exp.title || '', bold: true, size: 22, color: DARK }),
              exp.duration
                ? new TextRun({ text: `  —  ${exp.duration}`, size: 18, color: MUTED })
                : new TextRun(''),
            ],
          }),
        );
        if (exp.company) {
          experienceParas.push(
            new Paragraph({
              spacing: { before: 0, after: 60 },
              children: [new TextRun({ text: exp.company, italics: true, size: 20, color: ACCENT })],
            }),
          );
        }
        exp.bullets.filter((b) => b.trim()).forEach((b) => experienceParas.push(bullet(b)));
      });

      // ── education rows ───────────────────────────────────────────────────
      const educationParas: Paragraph[] = [];
      data.education.forEach((edu) => {
        educationParas.push(
          new Paragraph({
            spacing: { before: 160, after: 40 },
            children: [
              new TextRun({ text: edu.degree || '', bold: true, size: 22, color: DARK }),
              edu.duration
                ? new TextRun({ text: `  —  ${edu.duration}`, size: 18, color: MUTED })
                : new TextRun(''),
            ],
          }),
        );
        if (edu.institution) {
          educationParas.push(
            new Paragraph({
              spacing: { before: 0, after: 40 },
              children: [new TextRun({ text: edu.institution, italics: true, size: 20, color: ACCENT })],
            }),
          );
        }
        if (edu.grade) {
          educationParas.push(
            new Paragraph({
              spacing: { before: 0, after: 60 },
              children: [new TextRun({ text: `Grade: ${edu.grade}`, size: 18, color: MUTED })],
            }),
          );
        }
      });

      // ── build document ───────────────────────────────────────────────────
      const doc = new Document({
        styles: {
          default: {
            document: {
              run: { font: 'Calibri', size: 20, color: '374151' },
            },
          },
        },
        sections: [{
          properties: {
            page: {
              margin: { top: 720, bottom: 720, left: 900, right: 900 },
            },
          },
          children: [
            // Name
            new Paragraph({
              spacing: { after: 80 },
              children: [
                new TextRun({
                  text: data.personalInfo.name || 'Candidate',
                  bold: true, size: 44, color: DARK,
                }),
              ],
            }),

            // Contact
            ...(contactParts.length ? [new Paragraph({
              spacing: { after: 40 },
              children: contactParts.map((p, i) => new TextRun({
                text: i === 0 ? p! : `  •  ${p}`,
                size: 18, color: '374151',
              })),
            })] : []),

            // Links
            ...(linkParts.length ? [new Paragraph({
              spacing: { after: 120 },
              children: linkParts.map((p, i) => new TextRun({
                text: i === 0 ? p! : `  •  ${p}`,
                size: 18, color: ACCENT,
              })),
            })] : []),

            // Divider paragraph (top border)
            new Paragraph({
              spacing: { before: 0, after: 200 },
              border: { top: { style: BorderStyle.SINGLE, size: 12, color: ACCENT } },
              children: [],
            }),

            // Summary
            ...(data.summary ? [
              ...sectionHeading('Summary'),
              new Paragraph({
                spacing: { before: 80, after: 120 },
                children: [new TextRun({ text: data.summary, size: 20, color: '374151' })],
              }),
            ] : []),

            // Skills
            ...(data.skills.length ? [
              ...sectionHeading('Skills'),
              new Paragraph({
                spacing: { before: 80, after: 120 },
                children: [new TextRun({ text: data.skills.join('  •  '), size: 20, color: '374151' })],
              }),
            ] : []),

            // Experience
            ...(data.experience.length ? [
              ...sectionHeading('Experience'),
              ...experienceParas,
            ] : []),

            // Education
            ...(data.education.length ? [
              ...sectionHeading('Education'),
              ...educationParas,
            ] : []),
          ],
        }],
      });

      const buffer = await Packer.toBlob(doc);
      const url = URL.createObjectURL(buffer);
      const a = document.createElement('a');
      a.href = url; a.download = fileName; a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('DOCX export failed:', err);
      downloadTxt();
    } finally {
      setDocxLoading(false);
    }
  };

  const downloadPdf = async () => {
    setPdfLoading(true);
    const fileName = `${data.personalInfo.name || 'Resume'}_Resume.pdf`;
    try {
      // Render the actual ResumeTemplate component to canvas → PDF
      const { default: html2canvas } = await import('html2canvas');
      const API_BASE = import.meta.env.VITE_API_URL || '/api';
      const res = await fetch(`${API_BASE}/pdf/generate-resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeData: data }),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return;
      }
      console.warn('Backend PDF failed, status:', res.status);
    } catch (e) {
      console.warn('Backend PDF unavailable, using client fallback:', e);
    }

    // Client-side fallback using jsPDF text rendering (no html2canvas)
    try {
      const { default: jsPDF } = await import('jspdf');

      const element = previewRef.current;
      if (!element) throw new Error('Preview not found');

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: data.template === 'tech' ? '#030712' : '#ffffff',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();
      const imgW = canvas.width;
      const imgH = canvas.height;
      const ratio = Math.min(pdfW / imgW, pdfH / imgH);
      const scaledW = imgW * ratio;
      const scaledH = imgH * ratio;
      const offsetX = (pdfW - scaledW) / 2;

      // If content is taller than one page, split into pages
      if (scaledH <= pdfH) {
        pdf.addImage(imgData, 'PNG', offsetX, 0, scaledW, scaledH);
      } else {
        let yPos = 0;
        while (yPos < imgH) {
          const sliceH = Math.min(pdfH / ratio, imgH - yPos);
          const sliceCanvas = document.createElement('canvas');
          sliceCanvas.width = imgW;
          sliceCanvas.height = sliceH;
          const ctx = sliceCanvas.getContext('2d')!;
          ctx.drawImage(canvas, 0, yPos, imgW, sliceH, 0, 0, imgW, sliceH);
          const sliceData = sliceCanvas.toDataURL('image/png');
          if (yPos > 0) pdf.addPage();
          pdf.addImage(sliceData, 'PNG', offsetX, 0, scaledW, sliceH * ratio);
          yPos += sliceH;
        }
      }

      pdf.save(fileName);
    } catch (err) {
      console.error('PDF export failed, falling back to text:', err);
      downloadTxt();
    } finally {
      setPdfLoading(false);
    }
  };

  const generateResumeText = () => {
    let text = `${data.personalInfo.name}\n`;
    if (data.personalInfo.email) text += `${data.personalInfo.email} | `;
    if (data.personalInfo.phone) text += `${data.personalInfo.phone} | `;
    if (data.personalInfo.location) text += `${data.personalInfo.location}\n`;
    if (data.personalInfo.linkedin) text += `LinkedIn: ${data.personalInfo.linkedin}\n`;
    if (data.personalInfo.portfolio) text += `Portfolio: ${data.personalInfo.portfolio}\n`;
    text += '\n';

    if (data.summary) {
      text += 'SUMMARY\n';
      text += `${data.summary}\n\n`;
    }

    if (data.skills.length > 0) {
      text += 'SKILLS\n';
      text += `${data.skills.join(', ')}\n\n`;
    }

    if (data.experience.length > 0) {
      text += 'EXPERIENCE\n';
      data.experience.forEach((exp) => {
        text += `${exp.title} - ${exp.company}\n`;
        text += `${exp.duration}\n`;
        exp.bullets.forEach((b) => {
          if (b.trim()) text += `• ${b}\n`;
        });
        text += '\n';
      });
    }

    if (data.education.length > 0) {
      text += 'EDUCATION\n';
      data.education.forEach((edu) => {
        text += `${edu.degree} - ${edu.institution}\n`;
        text += `${edu.duration}`;
        if (edu.grade) text += ` | ${edu.grade}`;
        text += '\n\n';
      });
    }

    return text;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Preview & Download</h2>
          <p className="text-gray-600">Review your resume and download</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={downloadTxt}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            TXT
          </button>
          <button
            onClick={downloadDocx}
            disabled={docxLoading}
            className="flex items-center gap-2 px-4 py-2 border border-indigo-500 text-indigo-600 rounded-lg hover:bg-indigo-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            <Download className="w-4 h-4" />
            {docxLoading ? 'Generating...' : 'DOCX'}
          </button>
          <button
            onClick={downloadPdf}
            disabled={pdfLoading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            <Download className="w-4 h-4" />
            {pdfLoading ? 'Generating...' : 'PDF'}
          </button>
        </div>
      </div>

      {/* ATS Score Card */}
      {atsScore && (
        <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-6 border border-green-200">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">ATS Score</h3>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-bold text-green-600">{atsScore.score}</span>
                  <span className="text-gray-500">/100</span>
                </div>
              </div>

              {/* Score Breakdown */}
              <div className="space-y-2 mb-4">
                {atsScore.breakdown.map((item: any, i: number) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">{item.label}</span>
                      <span className="text-gray-600">
                        {item.score}/{item.max}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all"
                        style={{ width: `${(item.score / item.max) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Suggestions */}
              {atsScore.suggestions.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Suggestions to Improve:
                  </h4>
                  <ul className="space-y-1">
                    {atsScore.suggestions.map((sug: string, i: number) => (
                      <li key={i} className="text-sm text-gray-600">
                        • {sug}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div ref={previewRef} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <ResumeTemplate data={data} />
      </div>
    </div>
  );
}
