export function assessmentOptionIndex(value: unknown, options: unknown): number | undefined {
  if (!Array.isArray(options) || value == null) return undefined;
  const normalize = (text: string) => text.trim().replace(/^[A-Z][.)]\s+/i, '').replace(/\s+/g, ' ').toLowerCase();
  if (typeof value === 'string') {
    const text = value.trim();
    if (!text) return undefined;
    if (!/^\d+$/.test(text)) {
      const byText = options.findIndex(option => typeof option === 'string' && normalize(option) === normalize(text));
      if (byText >= 0) return byText;
      const letter = text.match(/^([A-Z])[.)]?$/i);
      if (!letter) return undefined;
      value = letter[1].toUpperCase().charCodeAt(0) - 65;
    } else value = Number(text);
  }
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value < options.length ? value : undefined;
}
