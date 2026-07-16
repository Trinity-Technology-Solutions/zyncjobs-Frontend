import type { TextItems } from './types';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export async function readPdf(fileUrl: string): Promise<TextItems> {
  if (!fileUrl) return [];
  try {
    const pdf = await pdfjsLib.getDocument({ url: fileUrl, disableStream: true }).promise;
    // Process all pages in parallel instead of sequentially
    const pageResults = await Promise.all(
      Array.from({ length: pdf.numPages }, (_, i) =>
        pdf.getPage(i + 1).then(page => page.getTextContent())
      )
    );
    return pageResults.flatMap((content, pageIdx) =>
      content.items
        .filter((item): item is typeof item & { str: string } => 'str' in item && !!(item as any).str.trim())
        .map(item => ({
          text: (item as any).str,
          x: (item as any).transform?.[4] ?? 0,
          y: (item as any).transform?.[5] ?? 0,
          width: (item as any).width ?? 0,
          height: (item as any).height ?? 0,
          page: pageIdx + 1,
          bold: /bold/i.test((item as any).fontName || ''),
        }))
    );
  } catch (e) {
    console.error('PDF read error:', e);
    return [];
  }
}
