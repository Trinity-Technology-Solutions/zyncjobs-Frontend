import type { TextItems } from './types';
import * as pdfjsLib from 'pdfjs-dist';

// Use unpkg CDN worker — avoids bundling the 3MB worker, always matches installed version
pdfjsLib.GlobalWorkerOptions.workerSrc =
  `https://unpkg.com/pdfjs-dist@5.5.207/build/pdf.worker.min.mjs`;

export async function readPdf(fileUrl: string): Promise<TextItems> {
  if (!fileUrl) return [];
  try {
    const pdf = await pdfjsLib.getDocument({ url: fileUrl, disableStream: false }).promise;
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
