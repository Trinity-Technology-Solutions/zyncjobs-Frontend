import { useState } from 'react';
import { downloadResumeAsPDF } from '../utils/pdfExport';
import { useErrorHandler } from './useErrorHandler';

export const usePdfExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const { handleError } = useErrorHandler();

  const exportToPdf = async (elementId: string, fileName: string = 'resume') => {
    setIsExporting(true);
    try {
      await downloadResumeAsPDF(elementId, fileName);
    } catch (error) {
      handleError(error, 'PDF Export');
    } finally {
      setIsExporting(false);
    }
  };

  return {
    isExporting,
    exportToPdf
  };
};