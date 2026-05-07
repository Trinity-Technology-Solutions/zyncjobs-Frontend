import React, { useRef, useState, useEffect } from 'react';
import { Download, Target, TrendingUp } from 'lucide-react';
import { useResumeStore } from '../../store/useResumeStore';
import { resumeBuilderAPI } from '../../services/resumeBuilderAPI';
import ResumeTemplate from './ResumeTemplate';

export default function PreviewStep() {
  const { data } = useResumeStore();
  const previewRef = useRef<HTMLDivElement>(null);
  const [atsScore, setAtsScore] = useState<any>(null);
  const [loadingScore, setLoadingScore] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [docxLoading, setDocxLoading] = useState(false);

  useEffect(() => { calculateScore(); }, []);

  const calculateScore = async () => {
    setLoadingScore(true);
    try {
      const bullets = data.experience.flatMap(e => e.bullets.filter(b => b.trim()));
      const result = await resumeBuilderAPI.calculateATSScore({
        resumeData: { personalInfo: data.personalInfo, summary: data.summary, skills: data.skills, bullets, experience: data.experience, education: data.education },
      });
      setAtsScore(result);
    } catch (err) {
      console.error('ATS score error:', err);
    } finally {
      setLoadingScore(false);
    }
  };

  const generateResumeText = () => {
    let text = `${data.personalInfo.name}\n`;
    if (data.personalInfo.email) text += `${data.personalInfo.email} | `;
    if (data.personalInfo.phone) text += `${data.personalInfo.phone} | `;
    if (data.personalInfo.location) text += `${data.personalInfo.location}\n`;
    text += '\n';
    if (data.summary) text += `SUMMARY\n${data.summary}\n\n`;
    if (data.skills.length) text += `SKILLS\n${data.skills.join(', ')}\n\n`;
    if (data.experience.length) {
      text += 'EXPERIENCE\n';
      data.experience.forEach(exp => {
        text += `${exp.title} - ${exp.company}\n${exp.duration}\n`;
        exp.bullets.forEach(b => { if (b.trim()) text += `• ${b}\n`; });
        text += '\n';
      });
    }
    if (data.education.length) {
      text += 'EDUCATION\n';
      data.education.forEach(edu => {
        text += `${edu.degree} - ${edu.institution}\n${edu.duration}`;
        if (edu.grade) text += ` | ${edu.grade}`;
        text += '\n\n';
      });
    }
    return text;
  };

  const downloadTxt = () => {
    const blob = new Blob([generateResumeText()], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.personalInfo.name || 'Resume'}_Resume.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── DOCX ──────────────────────────────────────────────────────────────────
  const downloadDocx = async () => {
    setDocxLoading(true);
    const fileName = `${data.personalInfo.name || 'Resume'}_Resume.docx`;
    try {
      // Only import what's guaranteed to exist in the browser docx package
      const { Document, Packer, Paragraph: P, TextRun: T, BorderStyle, AlignmentType } = await import('docx');

      const NAME  = 52; // 26pt
      const HEAD  = 24; // 12pt
      const BODY  = 22; // 11pt
      const SMALL = 20; // 10pt
      const BLACK = '111827';
      const BLUE  = '1D4ED8';
      const GRAY  = '6B7280';

      const divider = () => new P({
        spacing: { before: 0, after: 80 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '374151' } },
        children: [],
      });

      const secHead = (title: string): any[] => [
        new P({ spacing: { before: 280, after: 0 }, children: [] }),
        new P({
          spacing: { before: 0, after: 60 },
          children: [new T({ text: title.toUpperCase(), bold: true, size: HEAD, color: BLACK, characterSpacing: 80 })],
        }),
        divider(),
        new P({ spacing: { before: 80, after: 0 }, children: [] }),
      ];

      const bul = (text: string) => new P({
        spacing: { before: 40, after: 40 },
        indent: { left: 400, hanging: 200 },
        children: [new T({ text: `\u2022  ${text}`, size: BODY, color: BLACK })],
      });

      const contacts = [
        data.personalInfo.email, data.personalInfo.phone,
        data.personalInfo.location, data.personalInfo.linkedin, data.personalInfo.portfolio,
      ].filter(Boolean) as string[];

      const summaryText = Array.isArray(data.summary) ? data.summary.join(' ') : (data.summary || '');

      const expParas: any[] = [];
      data.experience.forEach(exp => {
        expParas.push(new P({
          spacing: { before: 160, after: 20 },
          children: [
            new T({ text: exp.title || '', bold: true, size: BODY + 2, color: BLACK }),
            exp.duration ? new T({ text: `    ${exp.duration}`, size: SMALL, color: GRAY }) : new T(''),
          ],
        }));
        if (exp.company) expParas.push(new P({
          spacing: { before: 0, after: 60 },
          children: [new T({ text: exp.company, italics: true, size: BODY, color: BLUE })],
        }));
        exp.bullets.filter(b => b.trim()).forEach(b => expParas.push(bul(b)));
      });

      const eduParas: any[] = [];
      data.education.forEach(edu => {
        eduParas.push(new P({
          spacing: { before: 120, after: 20 },
          children: [
            new T({ text: edu.degree || '', bold: true, size: BODY + 2, color: BLACK }),
            edu.duration ? new T({ text: `    ${edu.duration}`, size: SMALL, color: GRAY }) : new T(''),
          ],
        }));
        if (edu.institution) eduParas.push(new P({
          spacing: { before: 0, after: 40 },
          children: [new T({ text: edu.institution, size: BODY, color: GRAY })],
        }));
        if (edu.grade) eduParas.push(new P({
          spacing: { before: 0, after: 60 },
          children: [new T({ text: `Grade: ${edu.grade}`, size: SMALL, color: GRAY })],
        }));
      });

      const doc = new Document({
        styles: { default: { document: { run: { font: 'Calibri', size: BODY, color: BLACK } } } },
        sections: [{
          properties: { page: { margin: { top: 720, bottom: 720, left: 1080, right: 1080 } } },
          children: [
            new P({
              alignment: AlignmentType.CENTER,
              spacing: { after: 60 },
              children: [new T({ text: data.personalInfo.name || 'Candidate', bold: true, size: NAME, color: BLACK })],
            }),
            ...(contacts.length ? [new P({
              alignment: AlignmentType.CENTER,
              spacing: { after: 0 },
              children: contacts.map((c, i) => new T({ text: i === 0 ? c : `  |  ${c}`, size: SMALL, color: GRAY })),
            })] : []),
            new P({
              spacing: { before: 120, after: 0 },
              border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: BLUE } },
              children: [],
            }),
            ...(summaryText ? [
              ...secHead('Professional Summary'),
              new P({ spacing: { before: 0, after: 120 }, children: [new T({ text: summaryText, size: BODY, color: BLACK })] }),
            ] : []),
            ...(data.skills.length ? [
              ...secHead('Core Competencies'),
              new P({ spacing: { before: 0, after: 120 }, children: [new T({ text: data.skills.join('  \u2022  '), size: BODY, color: BLACK })] }),
            ] : []),
            ...(data.experience.length ? [...secHead('Professional Experience'), ...expParas] : []),
            ...(data.education.length ? [...secHead('Education'), ...eduParas] : []),
            ...(data.certifications?.length ? [
              ...secHead('Certifications'),
              ...data.certifications.map(c => new P({
                spacing: { before: 60, after: 60 },
                children: [
                  new T({ text: c.name || '', bold: true, size: BODY, color: BLACK }),
                  c.issuer ? new T({ text: `  \u2014  ${c.issuer}`, size: BODY, color: GRAY }) : new T(''),
                  c.year ? new T({ text: `    ${c.year}`, size: SMALL, color: GRAY }) : new T(''),
                ],
              })),
            ] : []),
            ...(data.awards?.length ? [
              ...secHead('Awards & Achievements'),
              ...data.awards.map(a => new P({
                spacing: { before: 60, after: 60 },
                children: [
                  new T({ text: a.title || '', bold: true, size: BODY, color: BLACK }),
                  a.issuer ? new T({ text: `  \u2014  ${a.issuer}`, size: BODY, color: GRAY }) : new T(''),
                  a.year ? new T({ text: `    ${a.year}`, size: SMALL, color: GRAY }) : new T(''),
                ],
              })),
            ] : []),
          ],
        }],
      });

      // Packer.toBlob is browser-safe; wrap with explicit MIME type
      const rawBlob = await Packer.toBlob(doc);
      const blob = new Blob([rawBlob], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (err) {
      console.error('DOCX export failed:', err);
      alert('DOCX generation failed. Please try PDF instead.');
    } finally {
      setDocxLoading(false);
    }
  };

  // ── PDF ───────────────────────────────────────────────────────────────────
  const downloadPdf = async () => {
    setPdfLoading(true);
    const fileName = `${data.personalInfo.name || 'Resume'}_Resume.pdf`;
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);

      const element = previewRef.current;
      if (!element) throw new Error('Preview element not found');

      // Temporarily expand element to full A4 width for proper rendering
      const originalStyle = element.style.cssText;
      element.style.width = '794px';
      element.style.maxWidth = '794px';
      element.style.overflow = 'visible';

      await new Promise(r => setTimeout(r, 150));

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: 794,
        windowWidth: 794,
      });

      // Restore original style
      element.style.cssText = originalStyle;

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfW = pdf.internal.pageSize.getWidth();   // 210mm
      const pdfH = pdf.internal.pageSize.getHeight();  // 297mm
      const imgW = canvas.width;
      const imgH = canvas.height;
      const ratio = pdfW / imgW;
      const scaledH = imgH * ratio;

      if (scaledH <= pdfH) {
        pdf.addImage(imgData, 'PNG', 0, 0, pdfW, scaledH);
      } else {
        const pageHeightPx = pdfH / ratio;
        let yPos = 0;
        while (yPos < imgH) {
          const sliceH = Math.min(pageHeightPx, imgH - yPos);
          const sliceCanvas = document.createElement('canvas');
          sliceCanvas.width = imgW;
          sliceCanvas.height = Math.ceil(sliceH);
          const ctx = sliceCanvas.getContext('2d')!;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, imgW, sliceH);
          ctx.drawImage(canvas, 0, yPos, imgW, sliceH, 0, 0, imgW, sliceH);
          if (yPos > 0) pdf.addPage();
          pdf.addImage(sliceCanvas.toDataURL('image/png'), 'PNG', 0, 0, pdfW, sliceH * ratio);
          yPos += sliceH;
        }
      }
      pdf.save(fileName);
    } catch (err) {
      console.error('PDF export failed:', err);
      alert('PDF generation failed. Please try again.');
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Preview & Download</h2>
          <p className="text-gray-600">Review your resume and download</p>
        </div>
        <button onClick={downloadPdf} disabled={pdfLoading}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors font-medium shadow-sm">
            <Download className="w-4 h-4" />
            {pdfLoading ? 'Generating PDF...' : 'Download PDF'}
          </button>
      </div>

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
              <div className="space-y-2 mb-4">
                {atsScore.breakdown.map((item: any, i: number) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">{item.label}</span>
                      <span className="text-gray-600">{item.score}/{item.max}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full transition-all" style={{ width: `${(item.score / item.max) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              {atsScore.suggestions.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" /> Suggestions to Improve:
                  </h4>
                  <ul className="space-y-1">
                    {atsScore.suggestions.map((sug: string, i: number) => (
                      <li key={i} className="text-sm text-gray-600">• {sug}</li>
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
