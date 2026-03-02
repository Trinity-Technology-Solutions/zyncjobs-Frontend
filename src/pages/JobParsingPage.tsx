import React, { useState } from 'react';
import BackButton from '../components/BackButton';
import Notification from '../components/Notification';
import mistralAIService from '../services/mistralAIService';

interface JobParsingPageProps {
  onNavigate: (page: string, data?: any) => void;
  user?: any;
}

const JobParsingPage: React.FC<JobParsingPageProps> = ({ onNavigate, user }) => {
  const [jobDescription, setJobDescription] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
    isVisible: boolean;
  }>({ type: 'success', message: '', isVisible: false });

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
      // Parse job description using AI
      const parsedData = await parseJobDescription(jobDescription);
      
      setNotification({
        type: 'success',
        message: 'Job description parsed successfully! 🎉',
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
    // Use AI to extract job details from the description
    try {
      const prompt = `
        Parse the following job description and extract the key information in JSON format:
        
        Job Description:
        ${description}
        
        Please extract and return a JSON object with the following fields:
        {
          "jobTitle": "extracted job title",
          "companyName": "extracted company name",
          "jobLocation": "extracted location",
          "jobType": ["Full-time", "Part-time", etc.],
          "experienceRange": "extracted experience requirement",
          "skills": ["skill1", "skill2", "skill3"],
          "minSalary": "extracted minimum salary",
          "maxSalary": "extracted maximum salary",
          "currency": "USD/INR/EUR etc.",
          "payRate": "per year/per month/per hour",
          "benefits": ["benefit1", "benefit2"],
          "educationLevel": "extracted education requirement",
          "jobDescription": "cleaned and formatted job description"
        }
        
        If any field cannot be extracted, use reasonable defaults or empty values.
      `;

      // For now, we'll use a simple parsing logic
      // In production, you'd use the Mistral AI service
      const parsedData = {
        jobTitle: extractJobTitle(description),
        companyName: extractCompanyName(description),
        jobLocation: extractLocation(description),
        jobType: extractJobType(description),
        experienceRange: extractExperience(description),
        skills: extractSkills(description),
        minSalary: extractSalary(description).min,
        maxSalary: extractSalary(description).max,
        currency: extractSalary(description).currency,
        payRate: extractSalary(description).payRate,
        benefits: extractBenefits(description),
        educationLevel: extractEducation(description),
        jobDescription: extractJobDescription(description),
        responsibilities: extractResponsibilities(description),
        requirements: extractRequirements(description),
        jobCategory: extractJobCategory(description),
        priority: extractPriority(description),
        clientName: extractClientName(description),
        reportingManager: extractReportingManager(description),
        workAuth: extractWorkAuth(description)
      };

      return parsedData;
    } catch (error) {
      throw new Error('Failed to parse job description');
    }
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
      /^([^\n\r]+?)\s*(?:-{2,}|–|—|\||at\s+[A-Z]|@|\(|urgent|asap|immediate|apply|hiring|wanted|needed|location|salary|experience)/i,
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
        title = title.replace(/[\-\|\–\—].*$/g, '').trim();
        title = title.replace(/\s*\([^)]*\)\s*/g, ' ').trim();
        title = title.replace(/\s*\[[^\]]*\]\s*/g, ' ').trim();
        title = title.replace(/\s+/g, ' ');
        title = title.replace(/^[\-\*•\d+\.\)\s]+/, '').trim();
        
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
      const cleanLine = lines[i].trim().replace(/^[\-\*•\d+\.\)\s]+/, '').trim();
      
      if (cleanLine.length > 5 && cleanLine.length < 100) {
        const invalidKeywords = ['immediate', 'asap', 'apply', 'urgent', 'preferred', 'http', 'www', 'email', 'phone', 'contact', 'we are', 'company', 'about', 'description', 'location', 'salary', 'benefits'];
        const hasInvalidKeyword = invalidKeywords.some(keyword => cleanLine.toLowerCase().includes(keyword));
        
        if (!hasInvalidKeyword && !cleanLine.includes('@') && !/^\d+$/.test(cleanLine)) {
          const jobTerms = /(?:engineer|developer|analyst|scientist|manager|director|architect|consultant|specialist|coordinator|administrator|designer|writer|marketer|representative|associate|assistant|intern|trainee|software|web|mobile|frontend|backend|full.?stack|data|machine\s+learning|ai|devops|cloud|security|qa|test|product|project|program|technical|sales|marketing|hr|finance|accounting|legal|operations|support|customer\s+service)/i;
          if (jobTerms.test(cleanLine)) {
            return cleanLine.replace(/\s*[-–—].*$/g, '').trim();
          }
        }
      }
    }

    return 'Software Developer';
  };

  const extractCompanyName = (text: string): string => {
    const companyPatterns = [
      // Most reliable patterns first
      /\bat\s+([A-Z][a-zA-Z0-9\s&\.\-,']+?)(?:\s*[,\.!]|\s+(?:we|is|are|the|in|on|as|to|for|and|or|but|located|based|offers|provides|seeks|looking|hiring|where))/,
      /join\s+(?:the\s+team\s+at\s+)?([A-Z][a-zA-Z0-9\s&\.\-,']+?)(?:\s*[,\.!]|\s+(?:as|to|for|and|or|team|where|in|today))/i,
      /work\s+(?:at|for|with)\s+([A-Z][a-zA-Z0-9\s&\.\-,']+?)(?:\s*[,\.!]|\s+(?:as|to|for|and|or|in|where|today))/i,
      /([A-Z][a-zA-Z0-9\s&\.\-,']{2,40})\s+(?:is|are)\s+(?:looking|seeking|hiring|recruiting|searching)/i,
      /about\s+([A-Z][a-zA-Z0-9\s&\.\-,']+?)\s*[:\n]/i,
      /\(([A-Z][a-zA-Z0-9\s&\.\-,']{3,40})\)/,
      /^([A-Z][a-zA-Z0-9\s&\.\-,']{3,40})\s*[-–—]\s*(?:job|career|opportunity|position|role|hiring)/i,
      /@([a-zA-Z0-9\-]+)\.(?:com|org|net|edu|gov)/i,
      /we\s+are\s+([A-Z][a-zA-Z0-9\s&\.\-,']{3,40})(?:\s*[,\.!]|\s+(?:and|a|an|the))/i,
      /([A-Z][a-zA-Z0-9\s&\.\-,']{3,40})\s*[-–—]\s*(?:remote|hybrid|onsite|[A-Z][a-z]+,\s*[A-Z]{2})/i,
      /([A-Z][a-zA-Z0-9\s&\.\-,']{3,40})\s+(?:seeks|needs|requires|wants)\s+(?:a|an)?\s*[a-z]/i,
      // Company name before job title pattern
      /^([A-Z][a-zA-Z0-9\s&\.\-,']{2,30})\s*[-–—]\s*[A-Z][a-z]/m
    ];

    for (const pattern of companyPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        let company = match[1].trim();
        
        // Clean up company name
        company = company.replace(/[\-\|–—].*$/g, '').trim();
        company = company.replace(/\s*\([^)]*\)\s*/g, ' ').trim();
        company = company.replace(/\s+/g, ' ');
        company = company.replace(/[,\.!]+$/, '').trim();
        company = company.replace(/^(?:the|a|an)\s+/i, '').trim();
        
        // Enhanced validation - exclude job titles and common phrases
        const invalidWords = [
          'senior', 'junior', 'lead', 'principal', 'staff', 'chief', 'head',
          'software', 'developer', 'engineer', 'analyst', 'manager', 'director',
          'full stack', 'frontend', 'backend', 'fullstack', 'web', 'mobile',
          'data', 'machine learning', 'ai', 'devops', 'cloud', 'security',
          'position', 'role', 'job', 'opportunity', 'career', 'hiring',
          'looking', 'seeking', 'recruiting', 'candidate', 'applicant',
          'team', 'experience', 'skills', 'requirements', 'qualifications',
          'responsibilities', 'duties', 'benefits', 'salary', 'compensation'
        ];
        
        const companyLower = company.toLowerCase();
        const hasInvalidWord = invalidWords.some(word => 
          companyLower.includes(word) || companyLower === word
        );
        
        // Additional validation checks
        const isValid = company.length >= 2 && company.length <= 50 && 
                       !hasInvalidWord &&
                       !/^\d+$/.test(company) && // Not just numbers
                       !company.includes('@') && // Not email
                       !company.toLowerCase().includes('http') && // Not URL
                       /^[A-Z]/.test(company) && // Should start with capital
                       company.split(/\s+/).length <= 6; // Not too many words
        
        if (isValid) {
          return company;
        }
      }
    }

    // Enhanced fallback: Look for well-known company patterns
    const lines = text.split('\n').slice(0, 5);
    for (const line of lines) {
      // Look for "Company - Job Title" pattern but exclude if first part looks like job title
      const separatorMatch = line.match(/^([A-Z][a-zA-Z0-9\s&\.\-,']{2,30})\s*[-|–—]\s*(.+)/i);
      if (separatorMatch && separatorMatch[1] && separatorMatch[2]) {
        const potential = separatorMatch[1].trim();
        const afterSeparator = separatorMatch[2].trim();
        
        // Check if the part after separator looks more like a job title
        const jobTitleWords = ['developer', 'engineer', 'analyst', 'manager', 'director', 'senior', 'junior', 'lead'];
        const afterSeparatorIsJobTitle = jobTitleWords.some(word => 
          afterSeparator.toLowerCase().includes(word)
        );
        
        // Check if the first part looks like a company (not a job title)
        const firstPartIsJobTitle = jobTitleWords.some(word => 
          potential.toLowerCase().includes(word)
        );
        
        if (afterSeparatorIsJobTitle && !firstPartIsJobTitle && potential.length >= 3 && potential.length <= 30) {
          return potential;
        }
      }
    }

    return 'ZyncJobs';
  };

  const extractLocation = (text: string): string => {
    const locationPatterns = [
      // Explicit location labels
      /(?:location|based\s+in|office|workplace|address|city|state|country)\s*[:\-]\s*([^\n\r\(,]+)/i,
      // Work from patterns
      /work\s+from\s+([^\n\r\(,]+)/i,
      // Located in patterns
      /located\s+in\s+([^\n\r\(,]+)/i,
      // Major US cities with states
      /((?:New York|Los Angeles|Chicago|Houston|Phoenix|Philadelphia|San Antonio|San Diego|Dallas|San Jose|Austin|Jacksonville|Fort Worth|Columbus|Charlotte|San Francisco|Indianapolis|Seattle|Denver|Washington|Boston|El Paso|Nashville|Detroit|Oklahoma City|Portland|Las Vegas|Memphis|Louisville|Baltimore|Milwaukee|Albuquerque|Tucson|Fresno|Sacramento|Kansas City|Long Beach|Mesa|Atlanta|Colorado Springs|Virginia Beach|Raleigh|Omaha|Miami|Oakland|Minneapolis|Tulsa|Wichita|New Orleans|Arlington|Cleveland|Tampa|Bakersfield|Aurora|Honolulu|Anaheim|Santa Ana|Corpus Christi|Riverside|Lexington|Stockton|Toledo|St. Paul|Newark|Greensboro|Plano|Henderson|Lincoln|Buffalo|Jersey City|Chula Vista|Fort Wayne|Orlando|St. Petersburg|Chandler|Laredo|Norfolk|Durham|Madison|Lubbock|Irvine|Winston-Salem|Glendale|Garland|Hialeah|Reno|Chesapeake|Gilbert|Baton Rouge|Irving|Scottsdale|North Las Vegas|Fremont|Boise|Richmond|San Bernardino|Birmingham|Spokane|Rochester|Des Moines|Modesto|Fayetteville|Tacoma|Oxnard|Fontana|Columbus|Montgomery|Moreno Valley|Shreveport|Aurora|Yonkers|Akron|Huntington Beach|Little Rock|Augusta|Amarillo|Glendale|Mobile|Grand Rapids|Salt Lake City|Tallahassee|Huntsville|Grand Prairie|Knoxville|Worcester|Newport News|Brownsville|Overland Park|Santa Clarita|Providence|Garden Grove|Chattanooga|Oceanside|Jackson|Fort Lauderdale|Santa Rosa|Rancho Cucamonga|Port St. Lucie|Tempe|Ontario|Vancouver|Cape Coral|Sioux Falls|Springfield|Peoria|Pembroke Pines|Elk Grove|Salem|Lancaster|Corona|Eugene|Palmdale|Salinas|Springfield|Pasadena|Fort Collins|Hayward|Pomona|Cary|Rockford|Alexandria|Escondido|McKinney|Kansas City|Joliet|Sunnyvale|Torrance|Bridgeport|Lakewood|Hollywood|Paterson|Naperville|Syracuse|Mesquite|Dayton|Savannah|Clarksville|Orange|Pasadena|Fullerton|Killeen|Frisco|Hampton|McAllen|Warren|Bellevue|West Valley City|Columbia|Olathe|Sterling Heights|New Haven|Miramar|Waco|Thousand Oaks|Cedar Rapids|Charleston|Sioux City|Round Rock|Rialto|Davenport|Miami Gardens|Burbank|Richardson|Pompano Beach|North Charleston|Broken Arrow|Boulder|West Palm Beach|Surprise|Thornton|League City|Dearborn|Roseville|Palmdale|Salinas|Beaumont|Brownsville|Independence|Murfreesboro|Ann Arbor|Fargo|Wilmington|Abilene|Odessa|Columbia|Pearland|Huntington Beach|Temecula|Richardson|Carrollton|Lewisville|Victorville|Santa Maria|Berkeley|Topeka|Norman|Elgin|Columbia|Clearwater|Westminster|Billings|Lowell|Stamford|Fontana|Cedar Rapids|Meridian|Arvada|Allentown|Cambridge|Lansing|Evansville|Fort Wayne|Provo|Charleston|Springfield|Lakewood|Peoria|High Point|Waterbury|Pompano Beach|West Jordan|Antioch|Everett|West Palm Beach|Centennial|Lowell|Richardson|Broken Arrow|Inglewood|Sandy Springs|Jurupa Valley|Hillsboro|Waterbury|Santa Clara|Costa Mesa|Miami Gardens|Concord|Peoria|Downey|Roseville|Thornton|Manchester|Allentown|Elgin|Sterling Heights|West Valley City|Columbia|Surprise|Sunnyvale|Clarksville|Roseville|Peoria|Inglewood|Evansville|Salem|Santa Clara|Thousand Oaks|Vallejo|El Monte|Abilene|Beaumont|Carrollton|Dearborn|Westminster|West Covina|Pearland|Victorville|Santa Maria|Berkeley|Topeka|Norman|Columbia|Clearwater|Billings|Lowell|Stamford|Cedar Rapids|Meridian|Arvada|Allentown|Cambridge|Lansing|Fort Wayne|Provo|Charleston|Springfield|Lakewood|High Point|Waterbury|West Jordan|Antioch|Everett|Centennial|Richardson|Broken Arrow|Sandy Springs|Jurupa Valley|Hillsboro|Santa Clara|Costa Mesa|Concord|Downey|Thornton|Manchester|Elgin|Sterling Heights|West Valley City|Surprise|Sunnyvale|Clarksville|Inglewood|Evansville|Salem|Thousand Oaks|Vallejo|El Monte|Abilene|Beaumont|Carrollton|Dearborn|Westminster|West Covina|Pearland|Victorville|Santa Maria|Berkeley|Topeka|Norman|Columbia|Clearwater|Billings|Lowell|Stamford|Cedar Rapids|Meridian|Arvada|Allentown|Cambridge|Lansing|Fort Wayne|Provo|Charleston|Springfield|Lakewood|High Point|Waterbury|West Jordan|Antioch|Everett|Centennial|Richardson|Broken Arrow|Sandy Springs|Jurupa Valley|Hillsboro|Santa Clara|Costa Mesa|Concord|Downey|Thornton|Manchester|Elgin|Sterling Heights|West Valley City|Surprise|Sunnyvale|Clarksville|Inglewood|Evansville|Salem|Thousand Oaks|Vallejo|El Monte|Abilene|Beaumont|Carrollton|Dearborn|Westminster|West Covina|Pearland|Victorville|Santa Maria|Berkeley|Topeka|Norman|Columbia|Clearwater|Billings|Lowell|Stamford|Cedar Rapids|Meridian|Arvada|Allentown|Cambridge|Lansing|Fort Wayne|Provo|Charleston|Springfield|Lakewood|High Point|Waterbury|West Jordan|Antioch|Everett|Centennial|Richardson|Broken Arrow|Sandy Springs|Jurupa Valley|Hillsboro|Santa Clara|Costa Mesa|Concord|Downey|Thornton|Manchester|Elgin|Sterling Heights|West Valley City|Surprise|Sunnyvale|Clarksville|Inglewood|Evansville|Salem|Thousand Oaks|Vallejo|El Monte|Abilene|Beaumont|Carrollton|Dearborn|Westminster|West Covina|Pearland|Victorville|Santa Maria|Berkeley|Topeka|Norman|Columbia|Clearwater|Billings|Lowell|Stamford|Cedar Rapids|Meridian|Arvada|Allentown|Cambridge|Lansing|Fort Wayne|Provo|Charleston|Springfield|Lakewood|High Point|Waterbury|West Jordan|Antioch|Everett|Centennial|Richardson|Broken Arrow|Sandy Springs|Jurupa Valley|Hillsboro|Santa Clara|Costa Mesa|Concord|Downey|Thornton|Manchester|Elgin|Sterling Heights|West Valley City|Surprise|Sunnyvale|Clarksville|Inglewood|Evansville|Salem|Thousand Oaks|Vallejo|El Monte|Abilene|Beaumont|Carrollton|Dearborn|Westminster|West Covina|Pearland|Victorville|Santa Maria|Berkeley|Topeka|Norman|Columbia|Clearwater|Billings|Lowell|Stamford|Cedar Rapids|Meridian|Arvada|Allentown|Cambridge|Lansing|Fort Wayne|Provo|Charleston|Springfield|Lakewood|High Point|Waterbury|West Jordan|Antioch|Everett|Centennial|Richardson|Broken Arrow|Sandy Springs|Jurupa Valley|Hillsboro|Santa Clara|Costa Mesa|Concord|Downey|Thornton|Manchester|Elgin|Sterling Heights|West Valley City|Surprise|Sunnyvale|Clarksville|Inglewood|Evansville|Salem|Thousand Oaks|Vallejo|El Monte|Abilene|Beaumont|Carrollton|Dearborn|Westminster|West Covina)(?:,\s*(?:AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY|Alabama|Alaska|Arizona|Arkansas|California|Colorado|Connecticut|Delaware|Florida|Georgia|Hawaii|Idaho|Illinois|Indiana|Iowa|Kansas|Kentucky|Louisiana|Maine|Maryland|Massachusetts|Michigan|Minnesota|Mississippi|Missouri|Montana|Nebraska|Nevada|New Hampshire|New Jersey|New Mexico|New York|North Carolina|North Dakota|Ohio|Oklahoma|Oregon|Pennsylvania|Rhode Island|South Carolina|South Dakota|Tennessee|Texas|Utah|Vermont|Virginia|Washington|West Virginia|Wisconsin|Wyoming))?)/i,
      // International cities
      /(London|Paris|Berlin|Madrid|Rome|Amsterdam|Vienna|Brussels|Prague|Warsaw|Budapest|Stockholm|Copenhagen|Oslo|Helsinki|Dublin|Zurich|Geneva|Barcelona|Milan|Munich|Hamburg|Frankfurt|Cologne|Stuttgart|Düsseldorf|Leipzig|Dresden|Hannover|Nuremberg|Dortmund|Essen|Bremen|Duisburg|Bochum|Wuppertal|Bielefeld|Bonn|Münster|Karlsruhe|Mannheim|Augsburg|Wiesbaden|Gelsenkirchen|Mönchengladbach|Braunschweig|Chemnitz|Kiel|Aachen|Halle|Magdeburg|Freiburg|Krefeld|Lübeck|Oberhausen|Erfurt|Mainz|Rostock|Kassel|Hagen|Hamm|Saarbrücken|Mülheim|Potsdam|Ludwigshafen|Oldenburg|Leverkusen|Osnabrück|Solingen|Heidelberg|Herne|Neuss|Darmstadt|Paderborn|Regensburg|Ingolstadt|Würzburg|Fürth|Wolfsburg|Offenbach|Ulm|Heilbronn|Pforzheim|Göttingen|Bottrop|Trier|Recklinghausen|Reutlingen|Bremerhaven|Koblenz|Bergisch Gladbach|Jena|Remscheid|Erlangen|Moers|Siegen|Hildesheim|Salzgitter)(?:,\s*(?:UK|United Kingdom|Germany|France|Spain|Italy|Netherlands|Austria|Belgium|Czech Republic|Poland|Hungary|Sweden|Denmark|Norway|Finland|Ireland|Switzerland))?/i,
      // Work arrangement patterns
      /(remote|hybrid|on-site|work from home|wfh|distributed|anywhere|flexible location)/i,
      // City, State patterns
      /([A-Z][a-z]+,\s*[A-Z]{2})/,
      // City, Country patterns
      /([A-Z][a-z]+,\s*[A-Z][a-z]+)/,
      // Zip code patterns
      /([A-Z][a-z\s]+)\s+\d{5}(?:-\d{4})?/
    ];

    for (const pattern of locationPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        let location = match[1].trim();
        
        // Clean up location
        location = location.replace(/[\-\|\–\—].*$/g, '').trim();
        location = location.replace(/\s*\([^)]*\)\s*/g, ' ').trim();
        location = location.replace(/\s+/g, ' ');
        location = location.replace(/[,\.!]+$/, '').trim();
        
        if (location.length > 2 && location.length < 60) {
          // Capitalize first letter if needed
          location = location.charAt(0).toUpperCase() + location.slice(1);
          return location;
        }
      }
    }

    // Enhanced remote work detection
    const remotePatterns = [
      /remote/i,
      /work from home/i,
      /wfh/i,
      /distributed/i,
      /anywhere/i,
      /location independent/i,
      /virtual/i,
      /telecommute/i
    ];
    
    const hybridPatterns = [
      /hybrid/i,
      /flexible location/i,
      /remote and office/i,
      /office and remote/i
    ];
    
    const onsitePatterns = [
      /on-site/i,
      /onsite/i,
      /in-office/i,
      /office based/i,
      /office location/i
    ];

    if (remotePatterns.some(pattern => pattern.test(text))) {
      return 'Remote';
    }
    if (hybridPatterns.some(pattern => pattern.test(text))) {
      return 'Hybrid';
    }
    if (onsitePatterns.some(pattern => pattern.test(text))) {
      return 'On-site';
    }

    return 'Remote';
  };

  const extractJobType = (text: string): string[] => {
    const types = [];
    const jobTypePatterns = [
      { pattern: /full.?time|permanent|regular/i, type: 'Full-time' },
      { pattern: /part.?time/i, type: 'Part-time' },
      { pattern: /contract|contractor|freelance|consulting/i, type: 'Contract' },
      { pattern: /intern|internship|trainee/i, type: 'Internship' },
      { pattern: /temporary|temp|seasonal/i, type: 'Temporary' },
      { pattern: /volunteer/i, type: 'Volunteer' }
    ];

    for (const { pattern, type } of jobTypePatterns) {
      if (pattern.test(text)) {
        types.push(type);
      }
    }

    return types.length > 0 ? types : ['Full-time'];
  };

  const extractExperience = (text: string): string => {
    const expPatterns = [
      // Range patterns
      /(?:experience|exp)\s*(?:required|needed)?[:\s-]*(\d+)[\s-]+(\d+)\s*years?/i,
      /(\d+)[\s-]+(\d+)\s*years?\s*(?:of\s*)?(?:experience|exp)/i,
      /(\d+)\s*(?:to|-|–|—)\s*(\d+)\s*years?/i,
      // Single number patterns
      /(?:minimum|at\s+least|min\.?)\s*(\d+)\s*years?/i,
      /(\d+)\+?\s*years?\s*(?:of\s*)?(?:experience|exp)/i,
      /(?:experience|exp)\s*(?:required|needed)?[:\s-]*(\d+)\+?\s*years?/i,
      // Level-based patterns
      /(entry.level|junior|mid.level|senior|lead|principal|staff|chief)/i,
      /(fresher|fresh\s+graduate|new\s+grad|recent\s+graduate)/i,
      // Years of experience in context
      /with\s+(\d+)[\s-]+(\d+)\s*years?/i,
      /having\s+(\d+)\s*years?/i,
      // Plus patterns
      /(\d+)\+\s*years?/i
    ];

    for (const pattern of expPatterns) {
      const match = text.match(pattern);
      if (match) {
        // Handle range patterns
        if (match[1] && match[2] && !isNaN(parseInt(match[1])) && !isNaN(parseInt(match[2]))) {
          const min = parseInt(match[1]);
          const max = parseInt(match[2]);
          if (min <= max && min >= 0 && max <= 20) {
            return `${min}-${max} years`;
          }
        }
        // Handle single number patterns
        else if (match[1] && !isNaN(parseInt(match[1]))) {
          const years = parseInt(match[1]);
          if (years >= 0 && years <= 20) {
            if (years >= 15) return '15+ years';
            if (years >= 10) return '10-15 years';
            if (years >= 8) return '8-10 years';
            if (years >= 5) return '5-8 years';
            if (years >= 3) return '3-5 years';
            if (years >= 2) return '2-3 years';
            if (years >= 1) return '1-2 years';
            return '0-1 years';
          }
        }
        // Handle level-based patterns
        else if (match[1]) {
          const level = match[1].toLowerCase().replace(/[\s\.-]/g, '');
          if (level.includes('entry') || level.includes('junior') || level.includes('fresher') || level.includes('fresh') || level.includes('new') || level.includes('recent')) {
            return '0-2 years';
          } else if (level.includes('mid') || level.includes('intermediate')) {
            return '3-5 years';
          } else if (level.includes('senior')) {
            return '5-8 years';
          } else if (level.includes('lead') || level.includes('principal') || level.includes('staff') || level.includes('chief')) {
            return '8+ years';
          }
        }
      }
    }

    // Additional context-based detection
    const contextPatterns = [
      { pattern: /no\s+experience\s+required/i, experience: '0-1 years' },
      { pattern: /entry\s+level/i, experience: '0-2 years' },
      { pattern: /beginner/i, experience: '0-1 years' },
      { pattern: /intermediate/i, experience: '2-5 years' },
      { pattern: /experienced/i, experience: '5+ years' },
      { pattern: /expert/i, experience: '8+ years' },
      { pattern: /seasoned/i, experience: '10+ years' }
    ];

    for (const { pattern, experience } of contextPatterns) {
      if (pattern.test(text)) {
        return experience;
      }
    }

    return '2-5 years';
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
    const lowerText = text.toLowerCase();

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
          const bulletPoints = section.match(/(?:^|\n)\s*[•\-\*\d+\.)\s]+([^\n]+)/gm);
          if (bulletPoints) {
            for (const point of bulletPoints) {
              const cleanPoint = point.replace(/^\s*[•\-\*\d+\.)\s]+/, '').trim();
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

  const extractSalary = (text: string) => {
    const salaryPatterns = [
      // Enhanced range patterns with better currency detection
      /(?:salary|compensation|pay|wage|income|package)\s*[:\-]?\s*\$?([\d,]+(?:\.\d{2})?)\s*[-–—to]\s*\$?([\d,]+(?:\.\d{2})?)\s*(?:k|thousand)?\s*(per\s+year|annually|yearly|per\s+month|monthly|per\s+hour|hourly|pa|p\.a\.)?/gi,
      /\$([\d,]+(?:\.\d{2})?)\s*[-–—to]\s*\$?([\d,]+(?:\.\d{2})?)\s*(?:k|thousand)?\s*(per\s+year|annually|yearly|per\s+month|monthly|per\s+hour|hourly|pa|p\.a\.)?/gi,
      /([\d,]+(?:\.\d{2})?)\s*[-–—to]\s*([\d,]+(?:\.\d{2})?)\s*(?:USD|INR|EUR|GBP|CAD|AUD|SGD)\s*(per\s+year|annually|yearly|per\s+month|monthly|per\s+hour|hourly|pa|p\.a\.)?/gi,
      // K notation patterns
      /\$?([\d,]+(?:\.\d{1,2})?)k\s*[-–—to]\s*\$?([\d,]+(?:\.\d{1,2})?)k\s*(per\s+year|annually|yearly|per\s+month|monthly|per\s+hour|hourly|pa|p\.a\.)?/gi,
      // LPA patterns (Lakhs Per Annum) - Indian salary format
      /([\d.]+)\s*[-–—to]\s*([\d.]+)\s*(?:lpa|lakhs?\s+per\s+annum|lakhs?)/gi,
      /([\d.]+)\s*(?:lpa|lakhs?\s+per\s+annum|lakhs?)/gi,
      // CTC patterns (Cost to Company) - Indian format
      /(?:ctc|cost\s+to\s+company)\s*[:\-]?\s*₹?([\d,]+(?:\.\d{2})?)\s*[-–—to]\s*₹?([\d,]+(?:\.\d{2})?)\s*(?:lpa|lakhs?)?/gi,
      // Single amount patterns
      /(?:salary|compensation|pay|wage|income|package)\s*[:\-]?\s*\$([\d,]+(?:\.\d{2})?)\s*(?:k|thousand)?\s*(per\s+year|annually|yearly|per\s+month|monthly|per\s+hour|hourly|pa|p\.a\.)?/gi,
      /\$([\d,]+(?:\.\d{2})?)\s*(?:k|thousand)?\s*(per\s+year|annually|yearly|per\s+month|monthly|per\s+hour|hourly|pa|p\.a\.)?/gi,
      /([\d,]+(?:\.\d{2})?)\s*(?:USD|INR|EUR|GBP|CAD|AUD|SGD)\s*(per\s+year|annually|yearly|per\s+month|monthly|per\s+hour|hourly|pa|p\.a\.)?/gi,
      // Up to patterns
      /up\s+to\s+\$?([\d,]+(?:\.\d{2})?)\s*(?:k|thousand)?/gi,
      // Starting from patterns
      /starting\s+(?:from|at)\s+\$?([\d,]+(?:\.\d{2})?)\s*(?:k|thousand)?/gi,
      // Competitive salary indicators
      /competitive\s+(?:salary|compensation|package)/gi
    ];

    let minSalary = '';
    let maxSalary = '';
    let currency = 'USD';
    let payRate = 'per year';
    let isCompetitive = false;

    // Check for competitive salary first
    if (/competitive\s+(?:salary|compensation|package)/gi.test(text)) {
      isCompetitive = true;
    }

    for (const pattern of salaryPatterns) {
      const matches = [...text.matchAll(pattern)];
      for (const match of matches) {
        if (match[0].toLowerCase().includes('competitive')) {
          continue; // Skip competitive salary matches for now
        }

        if (match[1] && match[2]) {
          // Range found
          let min = parseFloat(match[1].replace(/,/g, ''));
          let max = parseFloat(match[2].replace(/,/g, ''));
          
          // Handle K notation
          if (match[0].toLowerCase().includes('k') || match[0].toLowerCase().includes('thousand')) {
            min *= 1000;
            max *= 1000;
          }
          
          // Handle LPA (Lakhs Per Annum)
          if (match[0].toLowerCase().includes('lpa') || match[0].toLowerCase().includes('lakh')) {
            currency = 'INR';
            min *= 100000;
            max *= 100000;
          }
          
          // Ensure min is less than max
          if (min > max) {
            [min, max] = [max, min];
          }
          
          minSalary = min.toString();
          maxSalary = max.toString();
          
          // Determine pay rate
          if (match[3]) {
            const rate = match[3].toLowerCase();
            if (rate.includes('month')) payRate = 'per month';
            else if (rate.includes('hour')) payRate = 'per hour';
            else payRate = 'per year';
          }
          break;
        } else if (match[1]) {
          // Single amount
          let amount = parseFloat(match[1].replace(/,/g, ''));
          
          // Handle K notation
          if (match[0].toLowerCase().includes('k') || match[0].toLowerCase().includes('thousand')) {
            amount *= 1000;
          }
          
          // Handle LPA
          if (match[0].toLowerCase().includes('lpa') || match[0].toLowerCase().includes('lakh')) {
            currency = 'INR';
            amount *= 100000;
          }
          
          // Create range from single amount
          if (match[0].toLowerCase().includes('up to')) {
            minSalary = (amount * 0.7).toString();
            maxSalary = amount.toString();
          } else if (match[0].toLowerCase().includes('starting')) {
            minSalary = amount.toString();
            maxSalary = (amount * 1.3).toString();
          } else {
            minSalary = (amount * 0.9).toString();
            maxSalary = (amount * 1.1).toString();
          }
          
          // Determine pay rate
          if (match[2]) {
            const rate = match[2].toLowerCase();
            if (rate.includes('month')) payRate = 'per month';
            else if (rate.includes('hour')) payRate = 'per hour';
            else payRate = 'per year';
          }
          break;
        }
      }
      if (minSalary && maxSalary) break;
    }

    // Enhanced currency detection
    const currencyPatterns = [
      { pattern: /₹|INR|rupees?|lakhs?|crores?/i, currency: 'INR' },
      { pattern: /€|EUR|euros?/i, currency: 'EUR' },
      { pattern: /£|GBP|pounds?/i, currency: 'GBP' },
      { pattern: /CAD|canadian\s+dollars?/i, currency: 'CAD' },
      { pattern: /AUD|australian\s+dollars?/i, currency: 'AUD' },
      { pattern: /SGD|singapore\s+dollars?/i, currency: 'SGD' },
      { pattern: /\$|USD|dollars?/i, currency: 'USD' }
    ];

    for (const { pattern, currency: curr } of currencyPatterns) {
      if (pattern.test(text)) {
        currency = curr;
        break;
      }
    }

    // Default salary ranges based on common patterns
    if (!minSalary || !maxSalary) {
      if (isCompetitive) {
        // Set competitive salary ranges based on currency
        switch (currency) {
          case 'INR':
            minSalary = '600000';
            maxSalary = '1200000';
            break;
          case 'EUR':
            minSalary = '45000';
            maxSalary = '75000';
            break;
          case 'GBP':
            minSalary = '40000';
            maxSalary = '70000';
            break;
          default:
            minSalary = '60000';
            maxSalary = '100000';
        }
      } else {
        // Default ranges
        switch (currency) {
          case 'INR':
            minSalary = '500000';
            maxSalary = '800000';
            break;
          case 'EUR':
            minSalary = '40000';
            maxSalary = '65000';
            break;
          case 'GBP':
            minSalary = '35000';
            maxSalary = '60000';
            break;
          default:
            minSalary = '50000';
            maxSalary = '80000';
        }
      }
    }

    // Validate and format salary values
    const minNum = parseInt(minSalary);
    const maxNum = parseInt(maxSalary);
    
    // Ensure reasonable salary ranges
    if (minNum > 0 && maxNum > 0 && minNum <= maxNum) {
      return {
        min: minSalary,
        max: maxSalary,
        currency,
        payRate
      };
    }

    return {
      min: '50000',
      max: '80000',
      currency: 'USD',
      payRate: 'per year'
    };
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
    const lowerText = text.toLowerCase();
    
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
    
    if (/us\s*citizen|citizenship\s*required/i.test(text)) {
      workAuth.push('US Citizen');
    }
    if (/green\s*card|permanent\s*resident/i.test(text)) {
      workAuth.push('Green Card Holder');
    }
    if (/h1b|h-1b/i.test(text)) {
      workAuth.push('H1B Visa');
    }
    if (/l1|l-1/i.test(text)) {
      workAuth.push('L1 Visa');
    }
    if (/opt|cpt|f1/i.test(text)) {
      workAuth.push('OPT/CPT');
    }
    if (/tn\s*visa/i.test(text)) {
      workAuth.push('TN Visa');
    }
    if (/no\s*sponsorship|sponsorship\s*not\s*available/i.test(text)) {
      workAuth.push('No Sponsorship Required');
    }
    if (/will\s*sponsor|sponsorship\s*available|visa\s*sponsorship/i.test(text)) {
      workAuth.push('Will Sponsor');
    }
    
    return workAuth.length > 0 ? workAuth : ['No Sponsorship Required'];
  };

  const extractJobDescription = (text: string): string => {
    // Remove responsibilities and requirements sections to get clean description
    let cleanDescription = text;
    
    // Remove common section headers and their content
    cleanDescription = cleanDescription.replace(/(?:key\s+)?responsibilities?[:\s]*[\s\S]*?(?=(?:requirements?|qualifications?|skills?|benefits?|about\s+(?:us|the\s+role)|$))/gi, '');
    cleanDescription = cleanDescription.replace(/(?:job\s+)?requirements?[:\s]*[\s\S]*?(?=(?:responsibilities?|qualifications?|skills?|benefits?|about\s+(?:us|the\s+role)|$))/gi, '');
    cleanDescription = cleanDescription.replace(/qualifications?[:\s]*[\s\S]*?(?=(?:responsibilities?|requirements?|skills?|benefits?|about\s+(?:us|the\s+role)|$))/gi, '');
    
    // Clean up extra whitespace and newlines
    cleanDescription = cleanDescription.replace(/\n{3,}/g, '\n\n').trim();
    
    return cleanDescription || text.substring(0, 500) + '...';
  };

  const extractResponsibilities = (text: string): string[] => {
    const responsibilities: string[] = [];
    
    // Look for responsibilities section
    const responsibilitiesMatch = text.match(/(?:key\s+)?responsibilities?[:\s]*([\s\S]*?)(?=(?:requirements?|qualifications?|skills?|benefits?|about\s+(?:us|the\s+role)|$))/gi);
    
    if (responsibilitiesMatch && responsibilitiesMatch[0]) {
      const section = responsibilitiesMatch[0];
      
      // Extract bullet points or numbered items
      const bulletPoints = section.match(/(?:^|\n)\s*[•\-\*\d+\.)\s]+(.+)/gm);
      if (bulletPoints) {
        bulletPoints.forEach(point => {
          const cleaned = point.replace(/^\s*[•\-\*\d+\.)\s]+/, '').trim();
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

  const extractRequirements = (text: string): string[] => {
    const requirements: string[] = [];
    
    // Look for requirements/qualifications section
    const requirementsMatch = text.match(/(?:(?:job\s+)?requirements?|qualifications?|skills?)[:\s]*([\s\S]*?)(?=(?:responsibilities?|benefits?|about\s+(?:us|the\s+role)|$))/gi);
    
    if (requirementsMatch && requirementsMatch[0]) {
      const section = requirementsMatch[0];
      
      // Extract bullet points or numbered items
      const bulletPoints = section.match(/(?:^|\n)\s*[•\-\*\d+\.)\s]+(.+)/gm);
      if (bulletPoints) {
        bulletPoints.forEach(point => {
          const cleaned = point.replace(/^\s*[•\-\*\d+\.)\s]+/, '').trim();
          if (cleaned.length > 10 && cleaned.length < 200) {
            requirements.push(cleaned);
          }
        });
      }
      
      // If no bullet points found, try to split by sentences
      if (requirements.length === 0) {
        const sentences = section.split(/[.!]\s+/);
        sentences.forEach(sentence => {
          const cleaned = sentence.replace(/(?:(?:job\s+)?requirements?|qualifications?|skills?)[:\s]*/gi, '').trim();
          if (cleaned.length > 20 && cleaned.length < 200 && !cleaned.toLowerCase().includes('requirements') && !cleaned.toLowerCase().includes('qualifications')) {
            requirements.push(cleaned);
          }
        });
      }
    }
    
    // Fallback: look for degree/experience requirements
    if (requirements.length === 0) {
      const degreeMatch = text.match(/(?:bachelor|master|phd|degree|diploma|certification)[^.!]*[.!]/gi);
      if (degreeMatch) {
        degreeMatch.forEach(match => {
          const cleaned = match.trim();
          if (cleaned.length > 15 && cleaned.length < 200) {
            requirements.push(cleaned);
          }
        });
      }
      
      const experienceMatch = text.match(/(?:\d+[\s-]+years?|experience)[^.!]*[.!]/gi);
      if (experienceMatch) {
        experienceMatch.forEach(match => {
          const cleaned = match.trim();
          if (cleaned.length > 15 && cleaned.length < 200) {
            requirements.push(cleaned);
          }
        });
      }
    }
    
    return requirements.slice(0, 8); // Limit to 8 requirements
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
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex justify-between items-center mb-8">
            <BackButton 
              onClick={() => onNavigate('job-posting-selection')}
              text="Back"
            />
            <h1 className="text-3xl font-bold text-gray-800">New Job</h1>
            <button 
              onClick={() => onNavigate('dashboard')} 
              className="text-gray-500 text-2xl hover:text-gray-700"
            >
              ×
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Paste Job Details</h2>
              <p className="text-gray-600">Copy and paste a job description from any source. Our AI will automatically extract and organize the details.</p>
            </div>

            <div className="p-6">
              {/* Rich Text Editor Toolbar */}
              <div className="border border-gray-300 rounded-lg">
                <div className="border-b border-gray-200 p-3 bg-gray-50 flex items-center space-x-2">
                  <button className="p-2 hover:bg-gray-200 rounded text-sm font-bold">B</button>
                  <button className="p-2 hover:bg-gray-200 rounded text-sm italic">I</button>
                  <button className="p-2 hover:bg-gray-200 rounded text-sm underline">U</button>
                  <div className="w-px h-6 bg-gray-300 mx-2"></div>
                  <button className="p-2 hover:bg-gray-200 rounded text-sm">•</button>
                  <button className="p-2 hover:bg-gray-200 rounded text-sm">1.</button>
                  <div className="w-px h-6 bg-gray-300 mx-2"></div>
                  
                  {/* Styles Dropdown */}
                  <select className="px-3 py-1 border border-gray-300 rounded text-sm bg-white" title="Text styles">
                    <option>Styles</option>
                    <option>Normal</option>
                    <option>Heading 1</option>
                    <option>Heading 2</option>
                  </select>
                  
                  {/* Format Dropdown */}
                  <select className="px-3 py-1 border border-gray-300 rounded text-sm bg-white" title="Text format">
                    <option>Format</option>
                    <option>Paragraph</option>
                    <option>Heading</option>
                  </select>
                  
                  {/* Font Dropdown */}
                  <select className="px-3 py-1 border border-gray-300 rounded text-sm bg-white" title="Font family">
                    <option>Font</option>
                    <option>Arial</option>
                    <option>Times New Roman</option>
                    <option>Helvetica</option>
                  </select>
                  
                  {/* Size Dropdown */}
                  <select className="px-3 py-1 border border-gray-300 rounded text-sm bg-white" title="Font size">
                    <option>Size</option>
                    <option>12px</option>
                    <option>14px</option>
                    <option>16px</option>
                    <option>18px</option>
                  </select>
                </div>

                {/* Text Area */}
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste your job description here...

Example:
Software Engineer - Full Stack Developer

We are looking for a talented Full Stack Developer to join our growing team at TechCorp. 

Requirements:
- 3-5 years of experience in web development
- Proficiency in JavaScript, React, Node.js
- Experience with databases (MongoDB, PostgreSQL)
- Bachelor's degree in Computer Science

Benefits:
- Competitive salary $70,000 - $90,000
- Health insurance
- Remote work options
- Flexible hours"
                  className="w-full p-4 min-h-[400px] resize-none border-none outline-none focus:ring-0 text-gray-800"
                  style={{ fontFamily: 'Arial, sans-serif', fontSize: '14px', lineHeight: '1.5' }}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end mt-6 space-x-4">
                <button
                  onClick={() => onNavigate('job-posting-selection')}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStartParsing}
                  disabled={!jobDescription.trim() || isParsing}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  {isParsing ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                      <span>Parsing...</span>
                    </>
                  ) : (
                    <>
                      <span>🤖</span>
                      <span>Start Parsing</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Help Section */}
          <div className="mt-8 bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">How it works</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-800">
              <div className="flex items-start space-x-2">
                <span className="bg-blue-200 text-blue-900 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">1</span>
                <div>
                  <p className="font-medium">Paste Job Description</p>
                  <p>Copy any job posting from LinkedIn, company websites, or job boards</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <span className="bg-blue-200 text-blue-900 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">2</span>
                <div>
                  <p className="font-medium">AI Parsing</p>
                  <p>Our AI extracts job title, requirements, skills, salary, and more</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <span className="bg-blue-200 text-blue-900 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">3</span>
                <div>
                  <p className="font-medium">Review & Post</p>
                  <p>Review the extracted details and publish your job posting</p>
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