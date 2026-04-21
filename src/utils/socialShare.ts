export const generateSocialShareUrl = (job: any): string => {
  const origin = window.location.origin;
  if (job.slug) return origin + '/jobs/' + job.slug;
  const id = job.positionId || job.id || job._id || new URLSearchParams(window.location.search).get('id') || '';
  return id ? origin + '/jobs/' + id : window.location.href;
};

export const generateJobShareContent = (job: any) => {
  const jobTitle = job.jobTitle || job.title || 'Job Opportunity';
  const company = job.company || 'Company';
  const location = job.location || 'Location not specified';
  const jobType = Array.isArray(job.jobType) ? job.jobType.join(', ') : (job.jobType || 'Full-time');
  const experience = job.experienceRange || job.experienceLevel || '';
  const skills = Array.isArray(job.skills) && job.skills.length ? job.skills.slice(0, 5).join(', ') : '';

  let salary: string | null = null;
  if (job.salaryMin && job.salaryMax) {
    salary = 'Rs.' + Number(job.salaryMin).toLocaleString('en-IN') + ' - Rs.' + Number(job.salaryMax).toLocaleString('en-IN') + ' per annum';
  } else if (job.salary && typeof job.salary === 'object' && (job.salary.min || job.salary.max)) {
    const sym = job.salary.currency === 'USD' ? '$' : 'Rs.';
    if (job.salary.min && job.salary.max) {
      salary = sym + Number(job.salary.min).toLocaleString('en-IN') + ' - ' + sym + Number(job.salary.max).toLocaleString('en-IN') + ' per annum';
    }
  }

  const shareUrl = generateSocialShareUrl(job);
  const companyTag = company.replace(/[^a-zA-Z0-9]/g, '');
  const titleTag = jobTitle.replace(/\s+/g, '');

  const lines: string[] = [
    '*' + jobTitle + '* at *' + company + '*',
    '',
    '\uD83D\uDCCD *Location:* ' + location,
    '\uD83D\uDCBC *Job Type:* ' + jobType,
    ...(experience ? ['\uD83C\uDFAF *Experience:* ' + experience] : []),
    ...(salary ? ['\uD83D\uDCB0 *Salary:* ' + salary] : []),
    ...(skills ? ['\uD83D\uDD27 *Skills:* ' + skills] : []),
    '',
    '\uD83D\uDD17 *Apply Now:*',
    shareUrl,
    '',
    '#' + titleTag + ' #' + companyTag + ' #Hiring #Jobs #ZyncJobs',
  ];

  const whatsappText = lines.join('\n');

  return {
    title: jobTitle + ' at ' + company,
    description: location + ' | ' + jobType + (experience ? ' | ' + experience : ''),
    text: whatsappText,
    whatsappText,
    url: shareUrl,
    hashtags: ['Hiring', companyTag, 'Jobs', 'ZyncJobs'],
  };
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};
