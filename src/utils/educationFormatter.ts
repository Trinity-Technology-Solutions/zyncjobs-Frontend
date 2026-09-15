import { EducationItem, EducationLevel } from '../store/useResumeStore';

/**
 * Returns human-readable label for an EducationLevel.
 */
export function getEducationLevelLabel(level?: EducationLevel): string {
  switch (level) {
    case '10th':
      return '10th / Secondary School';
    case '12th':
      return '12th / Higher Secondary';
    case 'ug':
      return 'Undergraduate (UG)';
    case 'pg':
      return 'Postgraduate (PG)';
    case 'other':
      return 'Other Qualification';
    default:
      return 'Education';
  }
}

/**
 * Creates a clean default EducationItem for the specified level.
 */
export function createDefaultEducationItem(level: EducationLevel = 'ug'): EducationItem {
  const id = Date.now().toString() + Math.random().toString(36).slice(2, 6);
  let defaultDegree = '';
  if (level === '10th') defaultDegree = '10th / Secondary';
  else if (level === '12th') defaultDegree = '12th / Higher Secondary';

  return {
    id,
    level,
    degree: defaultDegree,
    fieldOfStudy: '',
    board: '',
    institution: '',
    location: '',
    duration: '',
    grade: '',
    description: '',
  };
}

/**
 * Deterministically classifies an education level from degree/qualification string and optional institution string.
 * Used at ingestion boundaries (resume parser, profile prefill, legacy migration).
 */
export function classifyEducationLevel(degreeStr?: string, institutionStr?: string): EducationLevel {
  const text = `${degreeStr || ''} ${institutionStr || ''}`.trim().toLowerCase();
  if (!text) return 'ug';

  // 10th / Secondary patterns
  if (/\b(10th|class\s*x\b|ssc\b|sslc\b|matric\b|matriculation|secondary\s*school|high\s*school\s*leaving)\b/i.test(text)) {
    return '10th';
  }

  // 12th / Higher Secondary patterns
  if (/\b(12th|class\s*x\s*ii\b|hsc\b|higher\s*secondary|intermediate|pre-university|puc\b|senior\s*secondary|junior\s*college)\b/i.test(text)) {
    return '12th';
  }

  // PG / Master / Doctorate patterns
  if (/\b(m\.|m\.tech|m\.e\b|m\.sc|mca\b|mba\b|m\.com|m\.s\b|ma\b|ph\.?d|master|masters|doctorate|postgraduate|post\s*graduate)\b/i.test(text)) {
    return 'pg';
  }

  // UG / Bachelor patterns
  if (/\b(b\.|b\.tech|b\.e\b|b\.sc|bca\b|bba\b|b\.com|b\.a\b|bachelor|bachelors|undergraduate|under\s*graduate|b\.des|b\.arch|b\.pharm)\b/i.test(text)) {
    return 'ug';
  }

  // Diploma / Associate / Certificate / Other
  if (/\b(diploma|associate|vocational|polytechnic|certificate|certification)\b/i.test(text)) {
    return 'other';
  }

  return 'ug';
}

/**
 * Normalizes any array of raw education objects into canonical EducationItem[].
 * 
 * Guarantees:
 * 1. Lossless & Honest: Never fabricates institution/duration/grade for PG if they belonged only to UG.
 * 2. Splits legacy combined UG+PG entries into 2 distinct items:
 *    - UG keeps the entered institution, location, duration, and grade.
 *    - PG keeps the pgDegree title with empty institution/duration/grade so candidate can accurately supply them.
 * 3. Classifies missing levels safely without discarding unclassified education (assigns 'other').
 * 4. Preserves all canonical fields: level, degree, fieldOfStudy, board, institution, location, duration, grade, description.
 */
export function normalizeEducationItems(rawItems: any[]): EducationItem[] {
  if (!Array.isArray(rawItems)) return [];

  const result: EducationItem[] = [];

  for (let i = 0; i < rawItems.length; i++) {
    const item = rawItems[i];
    if (!item || typeof item !== 'object') continue;

    const ug = typeof item.ugDegree === 'string' ? item.ugDegree.trim() : '';
    const pg = typeof item.pgDegree === 'string' ? item.pgDegree.trim() : '';
    const rawDeg = typeof item.degree === 'string' ? item.degree.trim() : (typeof item.qualification === 'string' ? item.qualification.trim() : '');
    const institution = typeof item.institution === 'string' ? item.institution.trim() : (typeof item.school === 'string' ? item.school.trim() : (typeof item.college === 'string' ? item.college.trim() : ''));
    const location = typeof item.location === 'string' ? item.location.trim() : '';
    const duration = typeof item.duration === 'string' ? item.duration.trim() : (typeof item.date === 'string' ? item.date.trim() : (item.year ? String(item.year).trim() : ''));
    const grade = typeof item.grade === 'string' ? item.grade.trim() : (typeof item.percentage === 'string' ? item.percentage.trim() : (typeof item.cgpa === 'string' ? item.cgpa.trim() : (typeof item.gpa === 'string' ? item.gpa.trim() : '')));
    const fieldOfStudy = typeof item.fieldOfStudy === 'string' ? item.fieldOfStudy.trim() : (typeof item.stream === 'string' ? item.stream.trim() : (typeof item.specialization === 'string' ? item.specialization.trim() : ''));
    const board = typeof item.board === 'string' ? item.board.trim() : '';
    const description = typeof item.description === 'string' ? item.description.trim() : (typeof item.details === 'string' ? item.details.trim() : '');

    // Case 1: Legacy combined record with both ugDegree AND pgDegree populated
    if (ug && pg) {
      // Primary UG record: safely retains the shared institution, location, duration, grade, description
      result.push({
        id: (item.id ? `${item.id}-ug` : Date.now().toString() + i + 'ug'),
        level: 'ug',
        degree: ug,
        fieldOfStudy,
        board: '',
        institution,
        location,
        duration,
        grade,
        description,
      });

      // Secondary PG record: retains PG degree without fabricating false institution, duration or grade
      result.push({
        id: (item.id ? `${item.id}-pg` : Date.now().toString() + i + 'pg'),
        level: 'pg',
        degree: pg,
        fieldOfStudy: '',
        board: '',
        institution: '',
        location: '',
        duration: '',
        grade: '',
        description: '',
      });
      continue;
    }

    // Case 2: Legacy record with only ugDegree populated
    if (ug && !rawDeg) {
      result.push({
        id: item.id || (Date.now().toString() + i),
        level: 'ug',
        degree: ug,
        fieldOfStudy,
        board,
        institution,
        location,
        duration,
        grade,
        description,
      });
      continue;
    }

    // Case 3: Legacy record with only pgDegree populated
    if (pg && !rawDeg) {
      result.push({
        id: item.id || (Date.now().toString() + i),
        level: 'pg',
        degree: pg,
        fieldOfStudy,
        board,
        institution,
        location,
        duration,
        grade,
        description,
      });
      continue;
    }

    // Case 4: Record with level already set
    if (item.level && ['10th', '12th', 'ug', 'pg', 'other'].includes(item.level)) {
      result.push({
        id: item.id || (Date.now().toString() + i),
        level: item.level as EducationLevel,
        degree: rawDeg || (item.level === '10th' ? '10th / Secondary' : item.level === '12th' ? '12th / Higher Secondary' : ''),
        fieldOfStudy,
        board,
        institution,
        location,
        duration,
        grade,
        description,
      });
      continue;
    }

    // Case 5: Record with degree/school but unclassified level (from parser, profile, or custom)
    const effectiveDegree = rawDeg || ug || pg || '';
    const inferredLevel = classifyEducationLevel(effectiveDegree, institution);

    result.push({
      id: item.id || (Date.now().toString() + i),
      level: inferredLevel,
      degree: effectiveDegree || (inferredLevel === '10th' ? '10th / Secondary' : inferredLevel === '12th' ? '12th / Higher Secondary' : ''),
      fieldOfStudy,
      board,
      institution,
      location,
      duration,
      grade,
      description,
    });
  }

  return result;
}

/**
 * Intelligently formats grade/CGPA/percentage values with proper context.
 * Converts bare numbers like "8.5" -> "CGPA: 8.5" and "88" -> "88%".
 */
export function formatGrade(rawGrade?: string): string {
  if (!rawGrade) return '';
  const trimmed = rawGrade.trim();
  if (!trimmed) return '';

  // If already tagged with %, cgpa, or gpa, retain user's formatting
  if (/%|cgpa|gpa|marks/i.test(trimmed)) {
    return trimmed;
  }

  const num = parseFloat(trimmed);
  if (!isNaN(num)) {
    if (num <= 10) {
      return `CGPA: ${trimmed}`;
    }
    return `${trimmed}%`;
  }

  return trimmed;
}

/**
 * Formats the primary institution line (Line 1): Institution + Location.
 */
export function formatEducationSubtitle(edu: Partial<EducationItem> | any): string {
  if (!edu) return '';
  const institution = (edu.institution || edu.school || edu.college || '').trim();
  const location = (edu.location || '').trim();
  if (institution && location) return `${institution}, ${location}`;
  return institution || location || '';
}

/**
 * Formats the primary Degree / Qualification label (Line 2).
 * Deduplicates field of study if already present in degree title (e.g. "B.Sc Computer Science").
 */
export function formatEducationDegreeLabel(edu: Partial<EducationItem> | any): string {
  if (!edu) return '';

  // Boundary check for legacy un-migrated combined object
  if (edu.ugDegree && edu.pgDegree) {
    return `${edu.ugDegree}, ${edu.pgDegree}`;
  }

  const rawDeg = (edu.degree || edu.ugDegree || edu.pgDegree || '').trim();
  const level: EducationLevel | undefined = edu.level;
  const fieldOfStudy = (edu.fieldOfStudy || edu.stream || edu.specialization || '').trim();

  // 10th / Secondary
  if (level === '10th') {
    if (rawDeg && !/^(10th|10th\s*\/\s*secondary|secondary\s*school)$/i.test(rawDeg)) {
      return rawDeg;
    }
    return 'Class X';
  }

  // 12th / Higher Secondary
  if (level === '12th') {
    if (rawDeg && !/^(12th|12th\s*\/\s*higher\s*secondary|higher\s*secondary)$/i.test(rawDeg)) {
      return rawDeg;
    }
    return 'Class XII';
  }

  // UG / PG / Other
  let title = rawDeg;
  if (!title) {
    if (level === 'ug') title = 'Undergraduate Degree';
    else if (level === 'pg') title = 'Postgraduate Degree';
    else if (level === 'other') title = 'Qualification / Diploma';
    else title = 'Education';
  }

  // Deduplicate and append fieldOfStudy / major
  if (fieldOfStudy) {
    const titleLower = title.toLowerCase();
    const fieldLower = fieldOfStudy.toLowerCase();
    const isAlreadyIncluded = titleLower.includes(fieldLower) || fieldLower.includes(titleLower);

    if (!isAlreadyIncluded) {
      title = `${title} in ${fieldOfStudy}`;
    }
  }

  return title;
}

/**
 * Formats secondary metadata (Line 3): Stream and Board for school levels.
 * Returns empty string for UG/PG to prevent clutter.
 */
export function formatEducationMeta(edu: Partial<EducationItem> | any): string {
  if (!edu) return '';
  const level: EducationLevel | undefined = edu.level;
  const board = (edu.board || '').trim();
  const stream = (edu.fieldOfStudy || edu.stream || edu.specialization || '').trim();

  if (level === '10th') {
    return board;
  }

  if (level === '12th') {
    if (stream && board) return `${stream}  ·  ${board}`;
    return stream || board || '';
  }

  if (level === 'other') {
    return board;
  }

  return '';
}

/**
 * Formats duration and grade cleanly (Line 4 or right-side placement).
 */
export function formatEducationDateGrade(edu: Partial<EducationItem> | any): string {
  if (!edu) return '';
  const duration = (edu.duration || edu.date || (edu.year ? String(edu.year) : '')).trim();
  const grade = formatGrade(edu.grade || edu.percentage || edu.cgpa || edu.gpa);

  if (duration && grade) return `${duration}  ·  ${grade}`;
  return duration || grade || '';
}

/**
 * Backward compatibility alias for formatEducationDegreeLabel.
 */
export function formatEducationTitle(edu: Partial<EducationItem> | any): string {
  return formatEducationDegreeLabel(edu);
}

/**
 * Institution-first one-line canonical summary for DOCX, plain-text export, and Quick Apply.
 */
export function formatEducationSummary(edu: Partial<EducationItem> | any): string {
  if (!edu) return '';
  const institution = formatEducationSubtitle(edu);
  const degree = formatEducationDegreeLabel(edu);
  const meta = formatEducationMeta(edu);
  const dateGrade = formatEducationDateGrade(edu);

  const parts: string[] = [];
  if (institution) parts.push(institution);

  let qual = degree;
  if (meta) qual = `${qual} (${meta})`;
  if (qual) parts.push(qual);

  let str = parts.join(' — ');
  if (dateGrade) str += `  |  ${dateGrade}`;
  return str;
}
