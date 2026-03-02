import type { TextItems } from './types';

export function groupTextItemsIntoLines(textItems: TextItems) {
  return textItems.map(item => [item]);
}