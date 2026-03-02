import type { TextItems } from './types';

export async function readPdf(fileUrl: string): Promise<TextItems> {
  // Return empty array - actual parsing happens in extractResumeFromSections
  return [];
}