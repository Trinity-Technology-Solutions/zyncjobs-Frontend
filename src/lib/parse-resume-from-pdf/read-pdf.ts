import type { TextItems } from './types';
import * as pdfjsLib from 'pdfjs-dist';
import { pdfDocumentOptions } from './pdfjs-config';

export async function readPdf(source: string | File | ArrayBuffer, options: { throwOnError?: boolean } = {}): Promise<TextItems> {
  if (!source) return [];
  let task: pdfjsLib.PDFDocumentLoadingTask | undefined;
  try {
    const input = typeof source === 'string' ? { url: source } : { data: new Uint8Array(source instanceof ArrayBuffer ? source : await source.arrayBuffer()) };
    task = pdfjsLib.getDocument({ ...input, ...pdfDocumentOptions, disableStream: true });
    const pdf = await task.promise;
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
    if (options.throwOnError) throw e;
    return [];
  } finally {
    await task?.destroy().catch(() => {});
  }
}
