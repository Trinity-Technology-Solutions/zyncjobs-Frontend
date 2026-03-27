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
    return pageResults.flatMap(content =>
      content.items
        .filter((item): item is typeof item & { str: string } => 'str' in item && !!(item as any).str.trim())
        .map(item => ({ text: (item as any).str, x: 0, y: 0, width: 0, height: 0 }))
    );
  } catch (e) {
    console.error('PDF read error:', e);
    return [];
  }
}
