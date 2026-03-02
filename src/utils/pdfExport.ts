import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const downloadResumeAsPDF = async (elementId: string, fileName: string = 'resume') => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('Resume element not found');
    }

    // Wait for fonts and images to load
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      onclone: (clonedDoc) => {
        const clonedElement = clonedDoc.getElementById(elementId);
        if (clonedElement) {
          clonedElement.style.transform = 'scale(1)';
          clonedElement.style.transformOrigin = 'top left';
        }
      }
    });

    const pdf = new jsPDF('portrait', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;
    
    const imgData = canvas.toDataURL('image/png', 1.0);
    
    if (imgHeight <= pdfHeight) {
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    } else {
      // Multi-page handling
      let position = 0;
      while (position < imgHeight) {
        pdf.addImage(imgData, 'PNG', 0, -position, imgWidth, imgHeight);
        position += pdfHeight;
        if (position < imgHeight) pdf.addPage();
      }
    }

    pdf.save(`${fileName}.pdf`);
    return true;
    
  } catch (error) {
    console.error('PDF generation failed:', error);
    throw error;
  }
};