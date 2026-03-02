export function groupLinesIntoSections(lines: any[]) {
  return {
    profile: lines.slice(0, 4),
    skills: lines.slice(4),
    experience: [],
    education: []
  };
}