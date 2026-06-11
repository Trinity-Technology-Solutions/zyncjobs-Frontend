import React, { useState } from 'react';
import BackButton from '../components/BackButton';
import Notification from '../components/Notification';
import { sendAIMessage } from '../services/aiChatService';
import { JobParser } from '../utils/jobParser';

interface JobParsingPageProps {
  onNavigate: (page: string, data?: any) => void;
  user?: any;
}

const JobParsingPage: React.FC<JobParsingPageProps> = ({ onNavigate }) => {
  const [jobDescription, setJobDescription] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
    isVisible: boolean;
  }>({ type: 'success', message: '', isVisible: false });

  const stripHtml = (html: string): string =>
    html.replace(/<[^>]*>/g, '').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&nbsp;/g,' ').replace(/\s{2,}/g,' ').trim();

  const handleStartParsing = async () => {
    if (!jobDescription.trim()) {
      setNotification({
        type: 'error',
        message: 'Please paste a job description first',
        isVisible: true
      });
      return;
    }

    setIsParsing(true);
    try {
      const cleanDescription = stripHtml(jobDescription);
      // Parse job description using AI
      const parsedData = await parseJobDescription(cleanDescription);
      
      setNotification({
        type: 'success',
        message: 'Job description parsed successfully! ðŸŽ‰',
        isVisible: true
      });

      // Navigate to job posting page with parsed data
      setTimeout(() => {
        onNavigate('job-posting', { 
          mode: 'parse', 
          parsedData: parsedData 
        });
      }, 1500);

    } catch (error) {
      console.error('Parsing failed:', error);
      setNotification({
        type: 'error',
        message: 'Failed to parse job description. Please try again.',
        isVisible: true
      });
    } finally {
      setIsParsing(false);
    }
  };

  const parseJobDescription = async (description: string) => {
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const base = API_BASE.endsWith('/api') ? API_BASE : `${API_BASE}/api`;

    // Step 1: AI parses first â€” always (via backend to keep API key secure)
    let ai: Record<string, any> = {};
    try {
      console.log('[JobParser] Calling AI via backend...');
      const res = await fetch(`${base}/parse-job-post`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: description }),
      });
      if (res.ok) {
        const result = await res.json();
        const d = result.data || result;
        // Strip markdown, metadata prefixes from jobTitle
        const rawTitle = (d.jobTitle || '').replace(/\*+/g, '').trim();
        const metaTitlePat = /^(experience|exp|salary|location|skills?|department|employment|job type|work type|notice|joining|ctc|lpa|\d)/i;
        const cleanTitle = metaTitlePat.test(rawTitle) ? '' : rawTitle;
        ai = {
          jobTitle:         cleanTitle,
          jobLocation:      d.location        || '',
          jobType:          d.jobType         || '',
          experienceRange:  d.experienceRange || '',
          skills:           d.skills          || [],
          benefits:         [],
          minSalary:        d.salaryMin > 0 ? String(d.salaryMin) : '',
          maxSalary:        d.salaryMax > 0 ? String(d.salaryMax) : '',
          currency:         d.currency        || '',
          educationLevel:   d.educationLevel  || '',
          jobCategory:      d.jobCategory     || '',
          responsibilities: d.responsibilities || [],
          requirements:     d.requirements    || [],
          nationality:      '',
        };
        console.log('[JobParser] AI parsed:', ai);
      } else {
        console.warn('[JobParser] Backend parse-job-post failed:', res.status);
      }
    } catch (err) {
      console.error('[JobParser] AI failed:', err);
    }

    // Step 2: JobParser regex fills anything AI left empty
    let regex: Record<string, any> = {};
    try {
      const parserResult = JobParser.parseJobDescription(description);
      const expRaw = parserResult.experience || '';
      const expHasNumbers = /\d+\s*[-\u2013\u2014to]+\s*\d+|\d+\+?\s*(?:years?|yrs?)/i.test(expRaw);
      regex = {
        jobTitle:         parserResult.title !== 'Software Developer' ? parserResult.title : '',
        jobLocation:      parserResult.location,
        experienceRange:  expHasNumbers ? normalizeExperienceRange(expRaw) : '',
        skills:           parserResult.mandatorySkills,
        minSalary:        parserResult.salary.min,
        maxSalary:        parserResult.salary.max,
        currency:         parserResult.salary.currency,
        responsibilities: parserResult.responsibilities,
        goodToHaveSkills: parserResult.goodToHaveSkills || [],
      };
    } catch { /* ignore */ }

    // Step 3: merge â€” AI first, regex fills gaps, helper functions as final fallback
    const salary = extractSalaryIfNumeric(description);
    const jobLocation =
      ai.jobLocation || regex.jobLocation || extractLocation(description);
    const country = await inferCountryFromCity(base, jobLocation);

    return {
      jobTitle:         ai.jobTitle         || regex.jobTitle         || extractJobTitle(description),
      companyName:      ai.companyName      || '',
      jobLocation,
      country,
      jobType:          ai.jobType          ? (Array.isArray(ai.jobType) ? ai.jobType : [ai.jobType]) : extractJobType(description),
      experienceRange:  normalizeExperienceRange(ai.experienceRange)  || regex.experienceRange || extractExperience(description),
      skills:           (Array.isArray(ai.skills) && ai.skills.length)   ? ai.skills   : (regex.skills?.length ? regex.skills : extractSkills(description)),
      minSalary:        ai.minSalary        || regex.minSalary        || salary.min,
      maxSalary:        ai.maxSalary        || regex.maxSalary        || salary.max,
      currency:         ai.currency         || regex.currency         || salary.currency,
      payRate:          salary.payRate,
      payType:          (salary as any).payType,
      benefits:         (Array.isArray(ai.benefits) && ai.benefits.length) ? ai.benefits : extractBenefits(description),
      educationLevel:   ai.educationLevel   || extractEducation(description),
      jobDescription:   description,
      responsibilities: (Array.isArray(ai.responsibilities) && ai.responsibilities.length) ? ai.responsibilities : (regex.responsibilities?.length ? regex.responsibilities : extractResponsibilities(description)),
      requirements:     (Array.isArray(ai.requirements)     && ai.requirements.length)     ? ai.requirements     : extractRequirements(description),
      goodToHaveSkills: regex.goodToHaveSkills?.length ? regex.goodToHaveSkills : extractGoodToHaveSkills(description),
      jobCategory:      ai.jobCategory      || extractJobCategory(description),
      nationality:      ai.nationality      || '',
      priority:         extractPriority(description),
      clientName:       extractClientName(description),
      reportingManager: extractReportingManager(description),
      workAuth:         extractWorkAuth(description),
      noticePeriod:     extractNoticePeriod(description),
      urgentNote:       extractUrgentNote(description),
      nationalityRestriction: extractNationalityRestriction(description),
    };
  };

  const inferCountryFromCity = async (apiBase: string, city: string): Promise<string> => {
    if (!city || city === 'Remote' || city === 'Hybrid' || city === 'On-site') return '';
    // Client-side cityâ†’country map (no API needed)
    const cityCountryMap: Record<string, string> = {
      // India
      'Mumbai': 'India', 'Delhi': 'India', 'New Delhi': 'India', 'Bangalore': 'India',
      'Bengaluru': 'India', 'Chennai': 'India', 'Hyderabad': 'India', 'Kolkata': 'India',
      'Pune': 'India', 'Ahmedabad': 'India', 'Surat': 'India', 'Jaipur': 'India',
      'Lucknow': 'India', 'Kanpur': 'India', 'Nagpur': 'India', 'Indore': 'India',
      'Thane': 'India', 'Bhopal': 'India', 'Visakhapatnam': 'India', 'Patna': 'India',
      'Vadodara': 'India', 'Ghaziabad': 'India', 'Ludhiana': 'India', 'Agra': 'India',
      'Nashik': 'India', 'Faridabad': 'India', 'Meerut': 'India', 'Rajkot': 'India',
      'Varanasi': 'India', 'Srinagar': 'India', 'Aurangabad': 'India', 'Dhanbad': 'India',
      'Amritsar': 'India', 'Navi Mumbai': 'India', 'Allahabad': 'India', 'Ranchi': 'India',
      'Howrah': 'India', 'Coimbatore': 'India', 'Jabalpur': 'India', 'Gwalior': 'India',
      'Vijayawada': 'India', 'Jodhpur': 'India', 'Madurai': 'India', 'Raipur': 'India',
      'Kota': 'India', 'Guwahati': 'India', 'Chandigarh': 'India', 'Mysore': 'India',
      'Gurgaon': 'India', 'Noida': 'India', 'Kochi': 'India', 'Dehradun': 'India',
      'Bhubaneswar': 'India', 'Mangalore': 'India', 'Erode': 'India', 'Trichy': 'India',
      'Tiruchirappalli': 'India', 'Salem': 'India', 'Tirunelveli': 'India', 'Vellore': 'India',
      'Pondicherry': 'India', 'Puducherry': 'India', 'Kolhapur': 'India', 'Nanded': 'India',
      'Solapur': 'India', 'Hubli': 'India', 'Dharwad': 'India',
      // US
      'New York': 'United States', 'Los Angeles': 'United States', 'Chicago': 'United States',
      'Houston': 'United States', 'Phoenix': 'United States', 'Philadelphia': 'United States',
      'San Antonio': 'United States', 'San Diego': 'United States', 'Dallas': 'United States',
      'San Jose': 'United States', 'Austin': 'United States', 'San Francisco': 'United States',
      'Seattle': 'United States', 'Denver': 'United States', 'Boston': 'United States',
      'Nashville': 'United States', 'Atlanta': 'United States', 'Miami': 'United States',
      'Portland': 'United States', 'Las Vegas': 'United States',
      // UK
      'London': 'United Kingdom', 'Manchester': 'United Kingdom', 'Birmingham': 'United Kingdom',
      'Leeds': 'United Kingdom', 'Glasgow': 'United Kingdom', 'Edinburgh': 'United Kingdom',
      // Others
      'Toronto': 'Canada', 'Vancouver': 'Canada', 'Montreal': 'Canada',
      'Sydney': 'Australia', 'Melbourne': 'Australia', 'Brisbane': 'Australia',
      // Oman
      'Muscat': 'Oman', 'Salalah': 'Oman', 'Sohar': 'Oman', 'Nizwa': 'Oman', 'Sur': 'Oman', 'Ibri': 'Oman',
      // GCC
      'Riyadh': 'Saudi Arabia', 'Jeddah': 'Saudi Arabia', 'Dammam': 'Saudi Arabia', 'Khobar': 'Saudi Arabia',
      'Doha': 'Qatar',
      'Kuwait City': 'Kuwait', 'Salmiya': 'Kuwait',
      'Manama': 'Bahrain',
      'Sharjah': 'United Arab Emirates', 'Ajman': 'United Arab Emirates',
      'Singapore': 'Singapore', 'Dubai': 'United Arab Emirates', 'Abu Dhabi': 'United Arab Emirates',
      'Berlin': 'Germany', 'Munich': 'Germany', 'Hamburg': 'Germany', 'Frankfurt': 'Germany',
      'Paris': 'France', 'Lyon': 'France', 'Madrid': 'Spain', 'Barcelona': 'Spain',
      'Rome': 'Italy', 'Milan': 'Italy', 'Amsterdam': 'Netherlands', 'Zurich': 'Switzerland',
      'Tokyo': 'Japan', 'Osaka': 'Japan', 'Seoul': 'South Korea', 'Beijing': 'China',
      'Shanghai': 'China', 'Kuala Lumpur': 'Malaysia', 'Jakarta': 'Indonesia',
    };
    // Try exact match first
    const exact = cityCountryMap[city];
    if (exact) return exact;
    // Try case-insensitive partial match
    const lower = city.toLowerCase();
    for (const [c, country] of Object.entries(cityCountryMap)) {
      if (c.toLowerCase() === lower || lower.includes(c.toLowerCase())) return country;
    }
    // Fallback to API
    try {
      const res = await fetch(`${apiBase}/locations/city-country/${encodeURIComponent(city)}`);
      const data = await res.json();
      return data.country || '';
    } catch {
      return '';
    }
  };

  // Extract salary from JD text only if actual numbers found â€” no defaults
  const extractSalaryIfNumeric = (text: string) => {
    const empty = { min: '', max: '', currency: 'INR', payRate: 'per year' };
    const currency = /â‚¹|INR|lakh/i.test(text) ? 'INR' : /â‚¬|EUR/i.test(text) ? 'EUR' : /Â£|GBP/i.test(text) ? 'GBP' : 'USD';
    const payRate = /per\s+month|monthly/i.test(text) ? 'per month' : /per\s+hour|hourly/i.test(text) ? 'per hour' : 'per year';

    // Range patterns (25-35 lakhs, 25 to 35 LPA, 25-35 lks, etc.)
    const rangePatterns = [
      // â‚¹2 LPA â€“ â‚¹3 LPA (LPA after EACH number, any dash type)
      /â‚¹\s*([\d.]+)\s*(?:lpa|lakhs?(?:\s*per\s*annum)?|lks?)\s*[-â€“â€”to]+\s*â‚¹?\s*([\d.]+)\s*(?:lpa|lakhs?(?:\s*per\s*annum)?|lks?)/gi,
      // 2 LPA â€“ 3 LPA (no â‚¹, LPA after each)
      /([\d.]+)\s*(?:lpa|lakhs?(?:\s*per\s*annum)?|lks?)\s*[-â€“â€”to]+\s*([\d.]+)\s*(?:lpa|lakhs?(?:\s*per\s*annum)?|lks?)/gi,
      // â‚¹2 LPA â€“ â‚¹3 LPA (with â‚¹ before each number, any dash type)
      /â‚¹\s*([\d.]+)\s*(?:lpa|lakhs?(?:\s*per\s*annum)?|lks?)\s*[-â€“â€”to]+\s*â‚¹?\s*([\d.]+)\s*(?:lpa|lakhs?(?:\s*per\s*annum)?|lks?)/gi,
      // 2 LPA â€“ 3 LPA (without â‚¹)
      /([\d.]+)\s*(?:lpa|lakhs?(?:\s*per\s*annum)?|lks?)\s*[-â€“â€”to]+\s*([\d.]+)\s*(?:lpa|lakhs?(?:\s*per\s*annum)?|lks?)/gi,
      // â‚¹2 â€“ â‚¹3 (just rupee symbol)
      /â‚¹\s*([\d,]+(?:\.\d+)?)\s*[-â€“â€”to]+\s*â‚¹?\s*([\d,]+(?:\.\d+)?)/gi,
      // $2 - $3
      /\$([\d,]+(?:\.\d+)?)\s*[-â€“â€”to]+\s*\$?([\d,]+(?:\.\d+)?)/gi,
      // salary: 2-3 lakhs
      /(?:salary|ctc|pay|compensation)\s*[:\-]?\s*([\d,]+(?:\.\d+)?)\s*[-â€“â€”to]+\s*([\d,]+(?:\.\d+)?)/gi,
    ];
    // deduplicate patterns (some are repeated above for clarity)
    const seenPatterns = new Set<string>();
    for (const pattern of rangePatterns) {
      const key = pattern.source;
      if (seenPatterns.has(key)) continue;
      seenPatterns.add(key);
      pattern.lastIndex = 0;
      const match = pattern.exec(text);
      if (match) {
        let min = parseFloat(match[1].replace(/,/g, ''));
        let max = parseFloat(match[2].replace(/,/g, ''));
        if (/lpa|lakh|lks?/i.test(match[0])) { min *= 100000; max *= 100000; }
        if (min > 0 && max > 0 && max >= min) {
          return { min: String(Math.round(min)), max: String(Math.round(max)), currency, payRate };
        }
      }
    }

    // "Upto" / "up to" single-value patterns (upto 25 lakhs, up to 35 LPA, upto 45 lks)
    const uptoPatterns = [
      /up\s*to\s+([\d,]+(?:\.\d+)?)\s*(?:lpa|lakhs?\s*per\s*annum|lakhs?|lks?)/gi,
      /up\s*to\s+â‚¹\s*([\d,]+(?:\.\d+)?)/gi,
      /up\s*to\s+\$([\d,]+(?:\.\d+)?)/gi,
      /(?:salary|ctc|pay|compensation)\s*[:\-]?\s*up\s*to\s+([\d,]+(?:\.\d+)?)/gi,
      /(?:maximum|max)\s*(?:salary|ctc|pay)?\s*[:\-]?\s*([\d,]+(?:\.\d+)?)\s*(?:lpa|lakhs?|lks?)/gi,
    ];
    for (const pattern of uptoPatterns) {
      const match = pattern.exec(text);
      if (match) {
        let max = parseFloat(match[1].replace(/,/g, ''));
        if (/lpa|lakh|lks?/i.test(match[0])) max *= 100000;
        if (max > 0) {
          return { min: '', max: String(Math.round(max)), currency, payRate, payType: 'Maximum amount' };
        }
      }
    }

    return empty;
  };

  // Normalize any experience string to match the dropdown options exactly
  const normalizeExperienceRange = (raw: string): string => {
    if (!raw) return '';
    const text = raw.toLowerCase().replace(/\s+/g, ' ').trim();

    const snapMin = (n: number) => {
      const opts = [0,1,2,3,4,5,6,7,8,9,10,12,15,20];
      const c = opts.reduce((a, b) => Math.abs(b - n) < Math.abs(a - n) ? b : a);
      return `${c} year${c !== 1 ? 's' : ''}`;
    };
    const snapMax = (n: number) => {
      const opts = [1,2,3,4,5,6,7,8,9,10,12,15,20,25];
      const c = opts.reduce((a, b) => Math.abs(b - n) < Math.abs(a - n) ? b : a);
      return `${c} year${c !== 1 ? 's' : ''}`;
    };

    // Match "11-15 years" or "11 - 15 years" or "11 to 15 years" or "11 â€“ 15 years"
    const rangeMatch = text.match(/(\d+)\s*[-â€“â€”to]+\s*(\d+)/);
    if (rangeMatch) {
      return `${snapMin(parseInt(rangeMatch[1]))} - ${snapMax(parseInt(rangeMatch[2]))}`;
    }

    // Single number like "11+ years"
    const singleMatch = text.match(/(\d+)/);
    if (singleMatch) {
      const n = parseInt(singleMatch[1]);
      return `${snapMin(n)} - ${snapMax(Math.min(n + 2, 25))}`;
    }

    if (/fresher|entry|no experience|0/i.test(text)) return '0 years - 1 year';
    if (/junior/i.test(text)) return '1 year - 2 years';
    if (/mid|intermediate/i.test(text)) return '3 years - 5 years';
    if (/senior/i.test(text)) return '5 years - 7 years';
    if (/lead|principal|expert/i.test(text)) return '10 years - 12 years';
    return '';
  };

  // Helper functions to extract information
  const extractJobTitle = (text: string): string => {
    // Enhanced patterns for better job title extraction
    const titlePatterns = [
      // Explicit job title labels
      /(?:job\s+title|position|role|vacancy|opening)\s*[:\-]\s*([^\n\r]+)/i,
      // Hiring patterns with better context
      /(?:we\s+are\s+(?:hiring|looking\s+for|seeking)|hiring|seeking|recruiting)\s+(?:a|an|for)?\s*([^\n\r,]+?)\s*(?:to|for|at|in|with|who|that|\.|,|$)/i,
      // Join us patterns
      /join\s+(?:us|our\s+team)\s+as\s+(?:a|an)?\s*([^\n\r,]+?)\s*(?:to|for|at|in|with|\.|,|$)/i,
      // First line before separators or urgency text
      /^([^\n\r]+?)\s*(?:-{2,}|â€“|â€”|\||at\s+[A-Z]|@|\(|urgent|asap|immediate|apply|hiring|wanted|needed|location|salary|experience)/i,
      // Job title with level prefixes
      /(?:^|\n)\s*(?:senior|sr\.?|junior|jr\.?|lead|principal|staff|chief|head\s+of|director\s+of)?\s*([^\n\r]+?)\s*(?:engineer|developer|analyst|scientist|manager|director|architect|consultant|specialist|coordinator|administrator|designer|writer|marketer|representative|associate|assistant|intern|trainee)\b/i,
      // Common job patterns
      /(?:^|\n)\s*([^\n\r]*(?:software|web|mobile|frontend|backend|full.?stack|data|machine\s+learning|ai|devops|cloud|security|qa|test|product|project|program|technical|engineering)[^\n\r]*(?:engineer|developer|analyst|scientist|manager|director|architect))/i
    ];

    for (const pattern of titlePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        let title = match[1].trim();
        
        // Enhanced cleaning
        title = title.replace(/[\-\|\â€“\â€”].*$/g, '').trim();
        title = title.replace(/\s*\([^)]*\)\s*/g, ' ').trim();
        title = title.replace(/\s*\[[^\]]*\]\s*/g, ' ').trim();
        title = title.replace(/\s+/g, ' ');
        title = title.replace(/^[\-\*â€¢\d+\.\)\s]+/, '').trim();
        
        // Enhanced validation
        const invalidKeywords = ['immediate', 'asap', 'apply', 'urgent', 'preferred', 'http', 'www', 'email', 'phone', 'contact', 'location', 'salary', 'benefits', 'company', 'about', 'description', 'requirements', 'qualifications', 'responsibilities', 'duties', 'skills', 'experience', 'education', 'degree'];
        const hasInvalidKeyword = invalidKeywords.some(keyword => title.toLowerCase().includes(keyword));
        
        if (title.length > 3 && title.length < 100 && !hasInvalidKeyword && !title.includes('@') && !/^\d+$/.test(title)) {
          // Additional validation for job-related terms
          const jobTerms = /(?:engineer|developer|analyst|scientist|manager|director|architect|consultant|specialist|coordinator|administrator|designer|writer|marketer|representative|associate|assistant|intern|trainee|software|web|mobile|frontend|backend|full.?stack|data|machine\s+learning|ai|devops|cloud|security|qa|test|product|project|program|technical|sales|marketing|hr|finance|accounting|legal|operations|support|customer\s+service)/i;
          if (jobTerms.test(title)) {
            return title;
          }
        }
      }
    }

    // Enhanced fallback with better line analysis
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const cleanLine = lines[i].trim().replace(/^[\-\*â€¢\d+\.\)\s]+/, '').trim();
      
      if (cleanLine.length > 5 && cleanLine.length < 100) {
        const invalidKeywords = ['immediate', 'asap', 'apply', 'urgent', 'preferred', 'http', 'www', 'email', 'phone', 'contact', 'we are', 'company', 'about', 'description', 'location', 'salary', 'benefits'];
        const hasInvalidKeyword = invalidKeywords.some(keyword => cleanLine.toLowerCase().includes(keyword));
        
        if (!hasInvalidKeyword && !cleanLine.includes('@') && !/^\d+$/.test(cleanLine)) {
          const jobTerms = /(?:engineer|developer|analyst|scientist|manager|director|architect|consultant|specialist|coordinator|administrator|designer|writer|marketer|representative|associate|assistant|intern|trainee|software|web|mobile|frontend|backend|full.?stack|data|machine\s+learning|ai|devops|cloud|security|qa|test|product|project|program|technical|sales|marketing|hr|finance|accounting|legal|operations|support|customer\s+service)/i;
          if (jobTerms.test(cleanLine)) {
            return cleanLine.replace(/\s*[-â€“â€”].*$/g, '').trim();
          }
        }
      }
    }

    return 'Software Developer';
  };


  const extractLocation = (text: string): string => {
    // --- Priority 1: explicit label on its own line or after colon ---
    const labelPatterns = [
      /^\s*(?:location|job\s+location|work\s+location|office\s+location)\s*[:\-]?\s*([^\n\r,\(]{2,50})/im,
      /(?:location|based\s+in|located\s+in|office\s+location)\s*[:\-]\s*([^\n\r,\(]{2,50})/i,
      /work\s+(?:location|place)\s*[:\-]\s*([^\n\r,\(]{2,50})/i,
    ];
    for (const p of labelPatterns) {
      const m = text.match(p);
      if (m?.[1]) {
        // Strip work mode keywords that may bleed into the location value
        let loc = m[1].trim()
          .replace(/\s*(?:work\s+mode|work\s+type|employment\s+type|mode)[^\n]*/gi, '')
          .replace(/\s*(hybrid|remote|on-?site|in-?person)\s*$/gi, '')
          .replace(/\s+/g, ' ')
          .trim();
        // reject if it looks like a sentence (too many words or contains verbs)
        if (loc.length > 1 && loc.length < 50 && loc.split(/\s+/).length <= 5
            && !/\b(?:is|are|will|can|the|and|for|with|from|that|this|have|has)\b/i.test(loc)) {
          return loc.charAt(0).toUpperCase() + loc.slice(1);
        }
      }
    }

    // --- Priority 2: work arrangement keywords (only if no city found above) ---
    if (/\bfully\s+remote\b|\b100%\s+remote\b|\bwork\s+from\s+home\b|\bwfh\b/i.test(text)) return 'Remote';

    // --- Priority 3: known cities only â€” must appear with a location label OR alone on a line ---
    const knownCities = [
      'Mumbai','Delhi','New Delhi','Bangalore','Bengaluru','Chennai','Hyderabad',
      'Kolkata','Pune','Ahmedabad','Surat','Jaipur','Lucknow','Kanpur','Nagpur',
      'Indore','Thane','Bhopal','Visakhapatnam','Patna','Vadodara','Ghaziabad',
      'Ludhiana','Agra','Nashik','Faridabad','Meerut','Rajkot','Varanasi',
      'Srinagar','Aurangabad','Dhanbad','Amritsar','Navi Mumbai','Allahabad',
      'Ranchi','Howrah','Coimbatore','Jabalpur','Gwalior','Vijayawada','Jodhpur',
      'Madurai','Raipur','Kota','Guwahati','Chandigarh','Mysore','Gurgaon',
      'Noida','Kochi','Dehradun','Bhubaneswar','Mangalore','Erode','Trichy',
      'Tiruchirappalli','Salem','Tirunelveli','Vellore','Pondicherry','Puducherry',
      'Kolhapur','Nanded','Solapur','Hubli','Dharwad',
      // GCC
      'Muscat','Salalah','Sohar','Nizwa','Sur','Ibri',
      'Dubai','Abu Dhabi','Sharjah','Ajman','Riyadh','Jeddah','Dammam','Khobar',
      'Doha','Kuwait City','Manama','Salmiya',
      // International
      'Singapore','London','Toronto','Sydney','Melbourne','New York',
    ];
    for (const city of knownCities) {
      // Only match if city appears with a location-related label, or alone on its own line
      const withLabel = new RegExp(
        `(?:location|city|based\s+in|located\s+in|work\s+location|job\s+location)\s*[:\-,]?\s*${city}\b`,
        'i'
      ).test(text);
      const aloneLine = new RegExp(`^\\s*${city}\\s*$`, 'im').test(text);
      if (withLabel || aloneLine) return city;
    }

    // --- No confident location found â€” return empty string ---
    return '';
  };

  const extractJobType = (text: string): string[] => {
    const types: string[] = [];
    const jobTypePatterns = [
      { pattern: /\bfull[\s\-]?time\b|\bpermanent\b|\bregular\s+employment\b/i, type: 'Full-time' },
      { pattern: /\bpart[\s\-]?time\b/i, type: 'Part-time' },
      { pattern: /\bcontract\b|\bcontractor\b|\bfreelance\b|\bconsulting\b|\bc2c\b|\bcorp[\s\-]to[\s\-]corp\b/i, type: 'Contract' },
      { pattern: /\bintern\b|\binternship\b|\btrainee\b|\bapprentice\b/i, type: 'Internship' },
      { pattern: /\btemporary\b|\btemp\b|\bseasonal\b/i, type: 'Temporary' },
    ];

    for (const { pattern, type } of jobTypePatterns) {
      if (pattern.test(text)) {
        types.push(type);
      }
    }

    // Only default to Full-time if the JD has strong employment signals but no explicit type
    if (types.length === 0 && /\b(?:salary|benefits|annual\s+leave|pf|provident\s+fund|esi|health\s+insurance|joining\s+date|notice\s+period)\b/i.test(text)) {
      types.push('Full-time');
    }

    return types;
  };

  const extractNoticePeriod = (text: string): string => {
    // Capture sentences near notice period / immediate joiner / availability keywords
    const patterns = [
      /notice\s+period\s*[:\-]?\s*([^\n.]{5,80})/i,
      /(immediate\s+joiners?[^\n.]{0,80})/i,
      /(available\s+to\s+join\s+immediately[^\n.]{0,60})/i,
      /(serving\s+notice[^\n.]{0,60})/i,
    ];
    for (const p of patterns) {
      const m = text.match(p);
      if (m) return m[1].trim().replace(/[.\s]+$/, '');
    }
    return '';
  };

  const extractExperience = (text: string): string => {
    // Priority 1: explicit "Experience Required" label followed by range on same or next line
    const labelMatch = text.match(/experience\s+required\s*[:\-]?\s*([\d\s\-â€“â€”to]+(?:years?|yrs?))/i);
    if (labelMatch) {
      const raw = labelMatch[1].trim();
      const m = raw.match(/(\d+)\s*[-â€“â€”to]+\s*(\d+)/);
      if (m) return `${parseInt(m[1])}-${parseInt(m[2])} years`;
      const s = raw.match(/(\d+)/);
      if (s) return `${parseInt(s[1])}+ years`;
    }

    // Priority 2: range patterns directly tied to experience keyword
    const rangePatterns = [
      /(\d+)\s*[-â€“â€”]\s*(\d+)\s*(?:years?|yrs?)\s*(?:of\s+)?(?:experience|exp)/i,
      /(\d+)\s+to\s+(\d+)\s*(?:years?|yrs?)\s*(?:of\s+)?(?:experience|exp)/i,
      /(?:experience|exp)\s*[:\-]?\s*(\d+)\s*[-â€“â€”to]+\s*(\d+)\s*(?:years?|yrs?)/i,
      /(?:minimum|at\s+least)\s*(\d+)\s*[-â€“â€”to]+\s*(\d+)\s*(?:years?|yrs?)/i,
      /(\d+)\+\s*(?:years?|yrs?)\s*(?:of\s+)?(?:experience|exp)/i,
    ];
    for (const p of rangePatterns) {
      const m = text.match(p);
      if (m && m[1]) {
        const a = parseInt(m[1]), b = m[2] ? parseInt(m[2]) : NaN;
        if (!isNaN(a) && a <= 40) {
          if (!isNaN(b) && b <= 40 && b >= a) return `${a}-${b} years`;
          return `${a}+ years`;
        }
      }
    }
    return '';
  };

  const extractSkills = (text: string): string[] => {
    const commonSkills = [
      // Programming Languages
      'JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'C++', 'PHP', 'Ruby', 'Go', 'Rust', 'Swift', 'Kotlin', 'Scala', 'R', 'MATLAB', 'Perl', 'Objective-C', 'Dart', 'Elixir', 'Haskell', 'Clojure', 'F#', 'VB.NET', 'COBOL', 'Fortran', 'Assembly', 'Shell', 'Bash', 'PowerShell',
      // Frontend Technologies
      'React', 'Angular', 'Vue.js', 'Svelte', 'Next.js', 'Nuxt.js', 'HTML', 'HTML5', 'CSS', 'CSS3', 'SCSS', 'SASS', 'Less', 'Bootstrap', 'Tailwind CSS', 'Material-UI', 'Ant Design', 'Chakra UI', 'jQuery', 'Webpack', 'Vite', 'Parcel', 'Rollup', 'Gulp', 'Grunt',
      // Backend Technologies
      'Node.js', 'Express.js', 'Django', 'Flask', 'FastAPI', 'Spring', 'Spring Boot', 'Laravel', 'Symfony', 'Rails', 'Ruby on Rails', 'ASP.NET', 'ASP.NET Core', 'NestJS', 'Koa.js', 'Hapi.js', 'Gin', 'Echo', 'Fiber',
      // Mobile Development
      'React Native', 'Flutter', 'iOS', 'Android', 'Xamarin', 'Ionic', 'Cordova', 'PhoneGap', 'Unity', 'Unreal Engine',
      // Databases
      'SQL', 'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Elasticsearch', 'Cassandra', 'DynamoDB', 'Oracle', 'SQLite', 'MariaDB', 'CouchDB', 'Neo4j', 'InfluxDB', 'TimescaleDB', 'Snowflake', 'BigQuery',
      // Cloud & DevOps
      'AWS', 'Azure', 'Google Cloud', 'GCP', 'Docker', 'Kubernetes', 'Jenkins', 'CI/CD', 'Terraform', 'Ansible', 'Chef', 'Puppet', 'Vagrant', 'GitLab CI', 'GitHub Actions', 'CircleCI', 'Travis CI', 'Helm', 'Istio', 'Prometheus', 'Grafana', 'ELK Stack', 'Splunk',
      // Version Control & Tools
      'Git', 'GitHub', 'GitLab', 'Bitbucket', 'SVN', 'Mercurial', 'Jira', 'Confluence', 'Slack', 'Microsoft Teams', 'Trello', 'Asana', 'Notion',
      // APIs & Protocols
      'REST API', 'GraphQL', 'SOAP', 'gRPC', 'WebSocket', 'HTTP', 'HTTPS', 'TCP/IP', 'UDP', 'OAuth', 'JWT', 'OpenAPI', 'Swagger',
      // Architecture & Patterns
      'Microservices', 'Monolith', 'SOA', 'MVC', 'MVP', 'MVVM', 'Clean Architecture', 'Hexagonal Architecture', 'Event-Driven Architecture', 'CQRS', 'Event Sourcing', 'Domain-Driven Design', 'DDD',
      // Testing
      'Unit Testing', 'Integration Testing', 'E2E Testing', 'TDD', 'BDD', 'Jest', 'Mocha', 'Chai', 'Jasmine', 'Cypress', 'Selenium', 'Playwright', 'Puppeteer', 'TestNG', 'JUnit', 'PyTest', 'RSpec',
      // Data & Analytics
      'Machine Learning', 'Deep Learning', 'AI', 'Data Science', 'Data Analysis', 'Big Data', 'ETL', 'Data Mining', 'Statistics', 'Pandas', 'NumPy', 'SciPy', 'Scikit-learn', 'TensorFlow', 'PyTorch', 'Keras', 'OpenCV', 'NLTK', 'spaCy', 'Tableau', 'Power BI', 'Looker', 'D3.js', 'Apache Spark', 'Hadoop', 'Kafka', 'Airflow',
      // Security
      'Cybersecurity', 'Information Security', 'Network Security', 'Application Security', 'Penetration Testing', 'Vulnerability Assessment', 'OWASP', 'SSL/TLS', 'Encryption', 'PKI', 'SIEM', 'SOC', 'Incident Response',
      // Business & Soft Skills
      'Project Management', 'Agile', 'Scrum', 'Kanban', 'Lean', 'Six Sigma', 'Leadership', 'Team Management', 'Communication', 'Problem Solving', 'Critical Thinking', 'Analytical Thinking', 'Strategic Planning', 'Business Analysis', 'Requirements Gathering', 'Stakeholder Management', 'Risk Management', 'Change Management',
      // Design
      'UI/UX Design', 'User Experience', 'User Interface', 'Figma', 'Sketch', 'Adobe XD', 'InVision', 'Zeplin', 'Photoshop', 'Illustrator', 'After Effects', 'Wireframing', 'Prototyping', 'Design Systems', 'Accessibility', 'Responsive Design',
      // Marketing & Sales
      'Digital Marketing', 'SEO', 'SEM', 'Social Media Marketing', 'Content Marketing', 'Email Marketing', 'Marketing Automation', 'Google Analytics', 'Google Ads', 'Facebook Ads', 'LinkedIn Ads', 'CRM', 'Salesforce', 'HubSpot', 'Lead Generation', 'Sales Funnel',
      // Finance & Accounting
      'Financial Analysis', 'Financial Modeling', 'Budgeting', 'Forecasting', 'Accounting', 'Bookkeeping', 'Tax Preparation', 'Audit', 'Compliance', 'Risk Assessment', 'Excel', 'QuickBooks', 'SAP', 'Oracle Financials',
      // HR & Recruitment
      'Human Resources', 'Talent Acquisition', 'Recruitment', 'Employee Relations', 'Performance Management', 'Training and Development', 'Compensation and Benefits', 'HR Analytics', 'HRIS', 'Workday', 'BambooHR',
      // Operations
      'Operations Management', 'Supply Chain Management', 'Logistics', 'Inventory Management', 'Quality Assurance', 'Process Improvement', 'Lean Manufacturing', 'Six Sigma', 'ERP', 'SAP', 'Oracle ERP'
    ];

    const foundSkills = new Set<string>();

    // Enhanced skill detection with context awareness
    for (const skill of commonSkills) {
      const skillLower = skill.toLowerCase();
      
      // Create regex patterns for better matching
      const patterns = [
        // Exact word boundary match
        new RegExp(`\\b${skillLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i'),
        // Handle special cases with dots, slashes, etc.
        new RegExp(skillLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\\./g, '\\.?').replace(/\\\//g, '\\/?'), 'i'),
        // Handle variations with spaces and hyphens
        new RegExp(skillLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '[\\s\\-]?'), 'i')
      ];
      
      for (const pattern of patterns) {
        if (pattern.test(text)) {
          foundSkills.add(skill);
          break;
        }
      }
    }

    // Enhanced section-based extraction
    const skillSections = [
      /(?:required\s+)?(?:skills?|technologies?|tools?|tech\s+stack|technical\s+skills?)\s*[:\-]?([\s\S]*?)(?=(?:\n\s*\n|requirements?|qualifications?|responsibilities?|benefits?|about\s+(?:us|the\s+role)|$))/gi,
      /(?:requirements?|qualifications?)\s*[:\-]?([\s\S]*?)(?=(?:\n\s*\n|responsibilities?|benefits?|about\s+(?:us|the\s+role)|$))/gi,
      /(?:must\s+have|should\s+have|nice\s+to\s+have)\s*[:\-]?([\s\S]*?)(?=(?:\n\s*\n|requirements?|qualifications?|responsibilities?|benefits?|about\s+(?:us|the\s+role)|$))/gi,
      /(?:experience\s+(?:with|in))\s*[:\-]?([\s\S]*?)(?=(?:\n\s*\n|requirements?|qualifications?|responsibilities?|benefits?|about\s+(?:us|the\s+role)|$))/gi
    ];

    for (const sectionPattern of skillSections) {
      const matches = [...text.matchAll(sectionPattern)];
      for (const match of matches) {
        if (match[1]) {
          const section = match[1];
          
          // Extract skills from bullet points
          const bulletPoints = section.match(/(?:^|\n)\s*[â€¢\-\*\d+\.)\s]+([^\n]+)/gm);
          if (bulletPoints) {
            for (const point of bulletPoints) {
              const cleanPoint = point.replace(/^\s*[â€¢\-\*\d+\.)\s]+/, '').trim();
              for (const skill of commonSkills) {
                if (cleanPoint.toLowerCase().includes(skill.toLowerCase())) {
                  foundSkills.add(skill);
                }
              }
            }
          }
          
          // Extract skills from comma-separated lists
          const commaSeparated = section.split(/[,;\n]/);
          for (const item of commaSeparated) {
            const cleanItem = item.trim();
            if (cleanItem.length > 2 && cleanItem.length < 50) {
              for (const skill of commonSkills) {
                if (cleanItem.toLowerCase().includes(skill.toLowerCase())) {
                  foundSkills.add(skill);
                }
              }
            }
          }
        }
      }
    }

    // Extract programming languages and frameworks from context
    const techPatterns = [
      /(?:proficient|experienced|skilled)\s+(?:in|with)\s+([^\n\.]+)/gi,
      /(?:knowledge|experience)\s+(?:of|in|with)\s+([^\n\.]+)/gi,
      /(?:using|working\s+with)\s+([^\n\.]+)/gi,
      /(?:\d+\+?\s*years?)\s+(?:of\s+)?(?:experience\s+)?(?:in|with)\s+([^\n\.]+)/gi
    ];

    for (const pattern of techPatterns) {
      const matches = [...text.matchAll(pattern)];
      for (const match of matches) {
        if (match[1]) {
          const techList = match[1];
          for (const skill of commonSkills) {
            if (techList.toLowerCase().includes(skill.toLowerCase())) {
              foundSkills.add(skill);
            }
          }
        }
      }
    }

    // Convert Set to Array and prioritize by relevance
    const skillsArray = Array.from(foundSkills);
    
    // Sort skills by priority (programming languages first, then frameworks, etc.)
    const priorityOrder = [
      'JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'C++', 'PHP', 'Ruby', 'Go', 'Rust', 'Swift', 'Kotlin',
      'React', 'Angular', 'Vue.js', 'Node.js', 'Django', 'Flask', 'Spring', 'Laravel',
      'AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes',
      'SQL', 'MongoDB', 'PostgreSQL', 'MySQL', 'Redis'
    ];
    
    const sortedSkills = skillsArray.sort((a, b) => {
      const aIndex = priorityOrder.indexOf(a);
      const bIndex = priorityOrder.indexOf(b);
      
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      } else if (aIndex !== -1) {
        return -1;
      } else if (bIndex !== -1) {
        return 1;
      } else {
        return a.localeCompare(b);
      }
    });

    // Return top 12 skills or default skills if none found
    return sortedSkills.length > 0 ? sortedSkills.slice(0, 12) : ['JavaScript', 'React', 'Node.js', 'Python', 'SQL'];
  };


  const extractBenefits = (text: string): string[] => {
    const benefits = [];
    const benefitPatterns = [
      { pattern: /health\s*insurance|medical\s*insurance|healthcare/i, benefit: 'Health insurance' },
      { pattern: /dental\s*insurance|dental\s*care/i, benefit: 'Dental insurance' },
      { pattern: /vision\s*insurance|eye\s*care/i, benefit: 'Vision insurance' },
      { pattern: /401k|retirement\s*plan|pension/i, benefit: '401(k)' },
      { pattern: /paid\s*time\s*off|pto|vacation\s*days?|annual\s*leave/i, benefit: 'Paid time off' },
      { pattern: /flexible\s*hours|flexible\s*schedule|flex\s*time/i, benefit: 'Flexible hours' },
      { pattern: /remote\s*work|work\s*from\s*home|wfh/i, benefit: 'Remote work' },
      { pattern: /stock\s*options|equity|shares/i, benefit: 'Stock options' },
      { pattern: /bonus|performance\s*bonus|annual\s*bonus/i, benefit: 'Performance bonus' },
      { pattern: /training|learning|education|courses/i, benefit: 'Professional development' },
      { pattern: /gym|fitness|wellness/i, benefit: 'Wellness programs' },
      { pattern: /maternity|paternity|parental\s*leave/i, benefit: 'Parental leave' },
      { pattern: /life\s*insurance/i, benefit: 'Life insurance' },
      { pattern: /disability\s*insurance/i, benefit: 'Disability insurance' },
      { pattern: /commuter|transport|travel\s*allowance/i, benefit: 'Commuter benefits' },
      { pattern: /lunch|meal|food\s*allowance/i, benefit: 'Meal benefits' }
    ];

    for (const { pattern, benefit } of benefitPatterns) {
      if (pattern.test(text)) {
        benefits.push(benefit);
      }
    }

    return benefits;
  };

  const extractEducation = (text: string): string => {
    if (/bachelor|bs|ba/i.test(text)) return "Bachelor's degree";
    if (/master|ms|ma/i.test(text)) return "Master's degree";
    if (/phd|doctorate/i.test(text)) return "PhD/Doctorate";
    if (/associate/i.test(text)) return "Associate's degree";
    if (/high\s*school/i.test(text)) return "High School Diploma";

    return "Bachelor's degree";
  };

  const extractJobCategory = (text: string): string => {
    
    if (/software|developer|engineer|programming|coding|frontend|backend|fullstack/i.test(text)) {
      return 'Software Development';
    }
    if (/data\s*scientist|data\s*analyst|machine\s*learning|ai|analytics/i.test(text)) {
      return 'Data Science & Analytics';
    }
    if (/sales|marketing|business\s*development|account\s*manager/i.test(text)) {
      return 'Sales & Marketing';
    }
    if (/finance|accounting|financial|accountant/i.test(text)) {
      return 'Finance & Accounting';
    }
    if (/hr|human\s*resources|recruiter|talent/i.test(text)) {
      return 'Human Resources';
    }
    if (/healthcare|medical|nurse|doctor|clinical/i.test(text)) {
      return 'Healthcare';
    }
    if (/customer\s*service|support|help\s*desk/i.test(text)) {
      return 'Customer Service';
    }
    if (/operations|logistics|supply\s*chain/i.test(text)) {
      return 'Operations';
    }
    if (/legal|lawyer|attorney|compliance/i.test(text)) {
      return 'Legal';
    }
    if (/education|teacher|instructor|training/i.test(text)) {
      return 'Education';
    }
    
    return 'Information Technology';
  };

  const extractPriority = (text: string): string => {
    if (/urgent|asap|immediately|critical|emergency/i.test(text)) {
      return 'Urgent';
    }
    if (/high\s*priority|important|fast\s*track/i.test(text)) {
      return 'High';
    }
    if (/low\s*priority|flexible|when\s*possible/i.test(text)) {
      return 'Low';
    }
    return 'Medium';
  };

  const extractClientName = (text: string): string => {
    const clientPatterns = [
      /client[:\s-]+([^\n\r]+)/i,
      /for\s+([A-Z][a-zA-Z\s&\.\-]+)(?:\s+division|\s+team|\s+department)/i,
      /on\s+behalf\s+of\s+([A-Z][a-zA-Z\s&\.\-]+)/i
    ];

    for (const pattern of clientPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const client = match[1].trim();
        if (client.length > 2 && client.length < 50) {
          return client;
        }
      }
    }
    return '';
  };

  const extractReportingManager = (text: string): string => {
    const managerPatterns = [
      /reporting\s+manager[:\s-]+([^\n\r]+)/i,
      /report(?:ing)?\s+to[:\s-]+([^\n\r]+)/i,
      /manager[:\s-]+([^\n\r,]+(?:,\s*[^\n\r]+)?)/i,
      /supervisor[:\s-]+([^\n\r]+)/i,
      /reports\s+to[:\s-]+([^\n\r]+)/i
    ];

    for (const pattern of managerPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const manager = match[1].trim();
        if (manager.length > 2 && manager.length < 100) {
          return manager;
        }
      }
    }
    return '';
  };

  const extractWorkAuth = (text: string): string[] => {
    const workAuth = [];
    
    if (/us\s*citizen|citizenship\s*required/i.test(text)) workAuth.push('US Citizen');
    if (/green\s*card|permanent\s*resident/i.test(text)) workAuth.push('Green Card Holder');
    if (/h1b|h-1b/i.test(text)) workAuth.push('H1B Visa');
    if (/l1|l-1/i.test(text)) workAuth.push('L1 Visa');
    if (/opt|cpt|f1/i.test(text)) workAuth.push('OPT/CPT');
    if (/tn\s*visa/i.test(text)) workAuth.push('TN Visa');
    if (/no\s*sponsorship|sponsorship\s*not\s*available/i.test(text)) workAuth.push('No Sponsorship Required');
    if (/will\s*sponsor|sponsorship\s*available|visa\s*sponsorship/i.test(text)) workAuth.push('Will Sponsor');
    
    // Return empty array for Indian JDs (no US work auth keywords found)
    return workAuth;
  };


  const extractResponsibilities = (text: string): string[] => {
    const responsibilities: string[] = [];
    
    // Look for responsibilities section
    const responsibilitiesMatch = text.match(/(?:key\s+)?responsibilities?[:\s]*([\s\S]*?)(?=(?:requirements?|qualifications?|skills?|benefits?|about\s+(?:us|the\s+role)|$))/gi);
    
    if (responsibilitiesMatch && responsibilitiesMatch[0]) {
      const section = responsibilitiesMatch[0];
      
      // Extract bullet points or numbered items
      const bulletPoints = section.match(/(?:^|\n)\s*[â€¢\-\*\d+\.)\s]+(.+)/gm);
      if (bulletPoints) {
        bulletPoints.forEach(point => {
          const cleaned = point.replace(/^\s*[â€¢\-\*\d+\.)\s]+/, '').trim();
          if (cleaned.length > 10 && cleaned.length < 200) {
            responsibilities.push(cleaned);
          }
        });
      }
      
      // If no bullet points found, try to split by sentences
      if (responsibilities.length === 0) {
        const sentences = section.split(/[.!]\s+/);
        sentences.forEach(sentence => {
          const cleaned = sentence.replace(/(?:key\s+)?responsibilities?[:\s]*/gi, '').trim();
          if (cleaned.length > 20 && cleaned.length < 200 && !cleaned.toLowerCase().includes('responsibilities')) {
            responsibilities.push(cleaned);
          }
        });
      }
    }
    
    // Fallback: look for action verbs at start of lines
    if (responsibilities.length === 0) {
      const actionVerbs = /(?:^|\n)\s*(?:develop|design|implement|manage|lead|create|build|maintain|collaborate|work|ensure|support|analyze|review|participate|contribute|assist|coordinate|execute|deliver|optimize|troubleshoot|monitor|test|document|train|mentor|research|evaluate|plan|organize|communicate|present|report|oversee|supervise|guide|facilitate|establish|improve|enhance|streamline|integrate|deploy|configure|administer|operate|handle|process|resolve|investigate|identify|recommend|propose|initiate|drive|champion|advocate|promote|foster|cultivate|nurture|engage|interact|liaise|negotiate|influence|persuade|convince|educate|inform|update|notify|alert|escalate|prioritize|schedule|allocate|assign|delegate|distribute|share|exchange|transfer|migrate|upgrade|modernize|automate|digitize|transform|innovate|pioneer|explore|experiment|prototype|pilot|launch|rollout|scale|expand|grow|increase|maximize|minimize|reduce|eliminate|prevent|mitigate|address|tackle|solve|fix|repair|restore|recover|backup|archive|secure|protect|safeguard|comply|adhere|follow|observe|respect|honor|uphold|maintain|sustain|preserve|conserve|save|store|organize|categorize|classify|sort|filter|search|find|locate|retrieve|extract|collect|gather|compile|aggregate|summarize|synthesize|consolidate|merge|combine|integrate|unify|standardize|normalize|validate|verify|confirm|check|inspect|audit|assess|evaluate|measure|quantify|calculate|compute|estimate|forecast|predict|project|model|simulate|visualize|illustrate|demonstrate|showcase|exhibit|display|present|publish|release|distribute|disseminate|broadcast|announce|declare|proclaim|advertise|market|promote|sell|negotiate|close|finalize|complete|finish|conclude|wrap|deliver|ship|deploy|install|setup|configure|customize|tailor|adapt|adjust|modify|update|upgrade|enhance|improve|refine|polish|perfect|optimize|streamline|simplify|clarify|explain|describe|define|specify|detail|outline|summarize|abstract|generalize|conceptualize|theorize|hypothesize|assume|presume|suppose|believe|think|consider|contemplate|reflect|ponder|deliberate|decide|determine|conclude|judge|evaluate|assess|appraise|rate|rank|score|grade|mark|label|tag|categorize|classify|group|cluster|segment|partition|divide|separate|isolate|extract|remove|delete|eliminate|exclude|omit|skip|bypass|avoid|prevent|block|stop|halt|pause|suspend|defer|postpone|delay|reschedule|reorganize|restructure|redesign|rebuild|reconstruct|renovate|refurbish|restore|repair|fix|correct|rectify|remedy|resolve|solve|address|handle|deal|cope|manage|control|regulate|govern|rule|direct|guide|steer|navigate|pilot|drive|operate|run|execute|perform|conduct|carry|undertake|pursue|follow|track|trace|monitor|observe|watch|supervise|oversee|manage|administer|govern|control|regulate|coordinate|organize|arrange|plan|prepare|setup|establish|create|build|construct|develop|design|engineer|architect|craft|make|produce|generate|manufacture|fabricate|assemble|compile|compose|write|author|draft|edit|revise|review|proofread|polish|refine|improve|enhance|optimize|perfect|finalize|complete|finish|conclude|close|end|terminate|stop|cease|discontinue|abandon|cancel|abort|withdraw|retreat|return|revert|restore|recover|retrieve|reclaim|regain|resume|restart|continue|proceed|advance|progress|move|shift|transfer|migrate|relocate|transport|carry|deliver|ship|send|transmit|broadcast|communicate|convey|express|articulate|verbalize|vocalize|speak|talk|discuss|converse|chat|dialogue|interview|question|interrogate|inquire|ask|request|demand|require|need|want|desire|wish|hope|expect|anticipate|predict|forecast|foresee|envision|imagine|visualize|picture|see|observe|notice|spot|detect|discover|find|locate|identify|recognize|distinguish|differentiate|discriminate|separate|isolate|extract|derive|deduce|infer|conclude|determine|establish|prove|demonstrate|show|reveal|expose|uncover|unveil|disclose|share|communicate|inform|notify|alert|warn|caution|advise|counsel|guide|direct|instruct|teach|educate|train|coach|mentor|tutor|help|assist|support|aid|facilitate|enable|empower|encourage|motivate|inspire|influence|persuade|convince|sway|impact|affect|change|alter|modify|adjust|adapt|customize|tailor|personalize|individualize|specialize|focus|concentrate|emphasize|highlight|stress|underscore|accentuate|amplify|magnify|enlarge|expand|extend|stretch|reach|achieve|attain|accomplish|realize|fulfill|satisfy|meet|exceed|surpass|outperform|excel|shine|stand|distinguish|differentiate|separate|isolate|unique|special|exceptional|outstanding|remarkable|notable|significant|important|critical|essential|vital|crucial|key|primary|main|principal|chief|leading|top|best|finest|highest|greatest|maximum|optimal|ideal|perfect|excellent|superior|premium|quality|standard|benchmark|reference|model|example|template|pattern|framework|structure|system|process|procedure|method|approach|technique|strategy|tactic|plan|scheme|design|blueprint|roadmap|pathway|route|course|direction|guidance|instruction|manual|handbook|guide|tutorial|lesson|course|program|curriculum|syllabus|agenda|schedule|timeline|calendar|plan|project|initiative|campaign|effort|endeavor|venture|enterprise|business|operation|activity|task|assignment|job|work|duty|responsibility|obligation|commitment|promise|pledge|vow|oath|agreement|contract|deal|arrangement|understanding|accord|pact|treaty|alliance|partnership|collaboration|cooperation|teamwork|joint|shared|collective|group|team|squad|crew|staff|personnel|workforce|employees|workers|members|participants|contributors|stakeholders|partners|allies|associates|colleagues|peers|friends|companions|mates|buddies|pals|acquaintances|contacts|connections|relationships|bonds|ties|links|associations|affiliations|memberships|subscriptions|registrations|enrollments|applications|submissions|entries|records|files|documents|papers|reports|studies|research|analysis|investigation|examination|inspection|audit|review|assessment|evaluation|appraisal|judgment|opinion|view|perspective|standpoint|position|stance|attitude|approach|mindset|mentality|psychology|behavior|conduct|actions|activities|practices|habits|routines|procedures|processes|methods|techniques|strategies|tactics|plans|schemes|designs|blueprints|roadmaps|pathways|routes|courses|directions|guidelines|instructions|manuals|handbooks|guides|tutorials|lessons|courses|programs|curricula|syllabi|agendas|schedules|timelines|calendars|plans|projects|initiatives|campaigns|efforts|endeavors|ventures|enterprises|businesses|operations|activities|tasks|assignments|jobs|work|duties|responsibilities|obligations|commitments|promises|pledges|vows|oaths|agreements|contracts|deals|arrangements|understandings|accords|pacts|treaties|alliances|partnerships|collaborations|cooperations)\s+(.+)/gmi;
      
      const actionMatches = text.match(actionVerbs);
      if (actionMatches) {
        actionMatches.forEach(match => {
          const cleaned = match.replace(/^\s*/, '').trim();
          if (cleaned.length > 20 && cleaned.length < 200) {
            responsibilities.push(cleaned);
          }
        });
      }
    }
    
    return responsibilities.slice(0, 8); // Limit to 8 responsibilities
  };

  const extractGoodToHaveSkills = (text: string): string[] => {
    const cleanText = text.replace(
      /(?:interview\s+process|recruitment\s+drive|interview\s+mode|drive\s+type|locations?\s+open)[\s\S]*/gi, ''
    );
    const sectionMatch = cleanText.match(
      /(?:good\s+to\s+have|nice\s+to\s+have|preferred\s+skills?|bonus\s+skills?|optional\s+skills?)[:\s]*([\s\S]*?)(?=(?:preferred\s+candidate|interview|recruitment|$))/i
    );
    if (!sectionMatch) return [];

    const isValidSkill = (s: string) =>
      s.length > 2 && s.length < 100 &&
      !/^[-#*=_|.\s]+$/.test(s) &&       // reject lines of only symbols
      !/^#{1,6}\s/.test(s) &&             // reject markdown headers
      !/^-{2,}$/.test(s.trim()) &&        // reject horizontal rules
      /[a-zA-Z]/.test(s);                 // must contain at least one letter

    const bullets = sectionMatch[1].match(/(?:^|\n)\s*[•\-\*\d+\.\)\s]+(.+)/gm);
    if (bullets) {
      return bullets
        .map(b => b.replace(/^\s*[•\-\*\d+\.\)\s]+/, '').trim())
        .filter(isValidSkill)
        .slice(0, 10);
    }
    return sectionMatch[1].split('\n')
      .map(l => l.trim())
      .filter(isValidSkill)
      .slice(0, 10);
  };

  const extractNationalityRestriction = (text: string): string => {
    const lower = text.toLowerCase();
    const patterns: [RegExp, string][] = [
      [/oman\s+national(?:s|\s+only)?|omanis?\s+only|omani\s+national/i, 'Oman National Only'],
      [/uae\s+national(?:s|\s+only)?|emirati(?:s)?\s+only|emirati\s+national/i, 'UAE National Only'],
      [/saudi\s+national(?:s|\s+only)?|saudi\s+only|saudi\s+arabian\s+national/i, 'Saudi National Only'],
      [/bahrain\s+national(?:s|\s+only)?|bahraini(?:s)?\s+only/i, 'Bahrain National Only'],
      [/kuwait\s+national(?:s|\s+only)?|kuwaiti(?:s)?\s+only/i, 'Kuwait National Only'],
      [/qatar\s+national(?:s|\s+only)?|qatari(?:s)?\s+only/i, 'Qatar National Only'],
      [/indian\s+national(?:s|\s+only)?|indian(?:s)?\s+only/i, 'Indian National Only'],
    ];
    for (const [pattern, label] of patterns) {
      if (pattern.test(text)) return label;
    }
    // Generic: "[Nationality] nationals only" or "only [nationality] nationals"
    const genericMatch = text.match(/\b([A-Z][a-z]+)\s+nationals?\s+only\b|\bonly\s+([A-Z][a-z]+)\s+nationals?\b/i);
    if (genericMatch) {
      const nat = (genericMatch[1] || genericMatch[2]).trim();
      return `${nat.charAt(0).toUpperCase() + nat.slice(1)} National Only`;
    }
    return '';
  };

  const extractUrgentNote = (text: string): string => {
    const patterns = [
      /urgent\s+note\s*[:\-]?\s*([^\n.]{5,120})/i,
      /(?:urgent|immediate)\s+(?:requirement|opening|hiring|vacancy)[:\s-]*([^\n.]{5,120})/i,
      /(?:immediate\s+joiners?\s+(?:only|preferred|required)[^\n.]{0,80})/i,
      /(?:looking\s+for\s+immediate\s+joiners?[^\n.]{0,80})/i,
      /(?:must\s+join\s+(?:immediately|within\s+\d+\s+days?)[^\n.]{0,60})/i,
      /(?:asap\s+(?:joining|requirement|hire)[^\n.]{0,80})/i,
    ];
    for (const p of patterns) {
      const m = text.match(p);
      if (m) return (m[1] || m[0]).trim().replace(/[.\s]+$/, '');
    }
    return '';
  };

  const extractRequirements = (text: string): string[] => {
    const requirements: string[] = [];
    
    // Strip interview/recruitment noise
    const cleanText = text.replace(
      /(?:interview\s+process|recruitment\s+drive|interview\s+mode|drive\s+type|locations?\s+open)[\s\S]*/gi,
      ''
    );

    const requirementsMatch = cleanText.match(/(?:(?:job\s+)?requirements?|qualifications?|mandatory\s+skills?)[:\s]*([\s\S]*?)(?=(?:responsibilities?|benefits?|about\s+(?:us|the\s+role)|good\s+to\s+have|preferred|$))/gi);
    
    if (requirementsMatch && requirementsMatch[0]) {
      const section = requirementsMatch[0];
      const bulletPoints = section.match(/(?:^|\n)\s*[â€¢\-\*\d+\.)\s]+(.+)/gm);
      if (bulletPoints) {
        bulletPoints.forEach(point => {
          const cleaned = point.replace(/^\s*[â€¢\-\*\d+\.)\s]+/, '').trim();
          if (cleaned.length > 10 && cleaned.length < 200) {
            requirements.push(cleaned);
          }
        });
      }
    }
    
    return requirements.slice(0, 8);
  };

  return (
    <>
      <Notification
        type={notification.type}
        message={notification.message}
        isVisible={notification.isVisible}
        onClose={() => setNotification({ ...notification, isVisible: false })}
      />

      <div className="min-h-screen bg-gray-50">

        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
            <BackButton onClick={() => onNavigate('job-posting-selection')} text="Back" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15M14.25 3.104c.251.023.501.05.75.082M19.8 15l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.607L5 14.5m14.8.5l1.196 4.784A2.25 2.25 0 0118.8 21.75H5.2a2.25 2.25 0 01-2.196-1.966L4 15m1 0l-.804-.201" />
                </svg>
              </div>
              <h1 className="text-lg font-semibold text-gray-900 hidden sm:block">AI Job Parser</h1>
              <h1 className="text-base font-semibold text-gray-900 sm:hidden">Parser</h1>
            </div>
            <button
              onClick={() => onNavigate('dashboard')}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

          {/* How it works */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 sm:mb-8">
            {[
              {
                step: '01',
                title: 'Paste Job Description',
                desc: 'Copy any job posting from LinkedIn, company websites, or job boards',
                icon: (
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
                  </svg>
                ),
              },
              {
                step: '02',
                title: 'AI Extraction',
                desc: 'Our AI extracts job title, skills, salary, requirements and more',
                icon: (
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                ),
              },
              {
                step: '03',
                title: 'Review & Post',
                desc: 'Review the extracted details and publish your job posting instantly',
                icon: (
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
              },
            ].map((item) => (
              <div key={item.step} className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    {item.icon}
                  </div>
                  <span className="text-xs font-bold text-blue-600 tracking-widest">STEP {item.step}</span>
                </div>
                <p className="text-sm font-semibold text-gray-800 mb-1">{item.title}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Main Card */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Paste Job Description</h2>
                <p className="text-sm text-gray-500 mt-0.5">Copy and paste a job description from any source</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-400 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-full">
                <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
                Powered by AI
              </div>
            </div>

            <div className="px-4 sm:px-6 pt-4 pb-6 sm:pb-8">
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder={`Paste your job description here...`}
                className="w-full p-3 sm:p-4 min-h-[280px] sm:min-h-[360px] border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 text-sm leading-relaxed placeholder-gray-300 transition-colors"
              />

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-4 gap-3 sm:gap-0">
                <p className="text-xs text-gray-400">
                  {jobDescription.length > 0 ? `${jobDescription.length} characters` : ''}
                </p>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    onClick={() => onNavigate('job-posting-selection')}
                    className="flex-1 sm:flex-none px-4 sm:px-5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors font-medium text-center"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleStartParsing}
                    disabled={!jobDescription.trim() || isParsing}
                    className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 text-sm font-medium shadow-sm"
                  >
                    {isParsing ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Parsing...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                        </svg>
                        Parse with AI
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default JobParsingPage;
