import * as pdfjs from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

// Bundle the standard fonts used by Resume Builder; no CDN or browser PDF extension required.
const assets = import.meta.glob<string>('/node_modules/pdfjs-dist/standard_fonts/*.{ttf,pfb}', { eager: true, query: '?url', import: 'default' });
const fontUrls = Object.fromEntries(Object.entries(assets).map(([path, url]) => [path.split('/').pop()!, url]));
const fontCache = new Map<string, Promise<Uint8Array>>();
class AppStandardFontDataFactory {
  async fetch({ filename }: { filename: string }): Promise<Uint8Array> {
    const url = fontUrls[filename];
    if (!url) throw new Error('Required PDF font is unavailable. Reload the application.');
    if (!fontCache.has(filename)) {
      fontCache.set(filename, fetch(url).then(async response => {
        if (!response.ok) throw new Error(`PDF font could not be loaded (${response.status}).`);
        return new Uint8Array(await response.arrayBuffer());
      }).catch(error => { fontCache.delete(filename); throw error; }));
    }
    return (await fontCache.get(filename)!).slice();
  }
}
export const pdfDocumentOptions = {
  StandardFontDataFactory: AppStandardFontDataFactory,
  useWorkerFetch: false,
  isEvalSupported: false,
};
