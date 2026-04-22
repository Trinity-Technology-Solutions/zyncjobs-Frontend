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

  const lines = [
    `${jobTitle} at ${company}`,
    ``,
    `Location: ${location}`,
    `Type: ${jobType}`,
    ...(experience ? [`Experience: ${experience}`] : []),
    ...(salary ? [`Salary: ${salary}`] : []),
    ...(skills ? [`Skills: ${skills}`] : []),
    ``,
    `Apply here: ${shareUrl}`,
    ``,
    `#JobAlert #Hiring #${companyTag} #Opportunity #Jobs`
  ];

  const whatsappText = lines.join('\n');

  return {
    title: `${jobTitle} at ${company}`,
    description: `${location} | ${jobType}${experience ? ` | ${experience}` : ''}${salary ? ` | ${salary}` : ''}`,

    text: lines.join('\n'),
    url: shareUrl,
    hashtags: ['Hiring', companyTag, 'Jobs', 'ZyncJobs'],
  };
};

export const shareToLinkedIn = (content: ReturnType<typeof generateJobShareContent> | string) => {
  const text = typeof content === 'object' ? content.text : content;
  const linkedInUrl = `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(text)}`;
  window.open(linkedInUrl, '_blank', 'width=600,height=600');
};

export const shareToTwitter = (content: ReturnType<typeof generateJobShareContent>) => {
  const tweetText = `${content.title}\n${content.description}\n\n#${content.hashtags.join(' #')}`;
  const encodedText = encodeURIComponent(tweetText);
  const encodedUrl = encodeURIComponent(content.url);
  window.open(`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`, '_blank', 'width=600,height=400');
};

export const shareToWhatsApp = (content: ReturnType<typeof generateJobShareContent>) => {
  const message = content.text || `*${content.title}*\n\n${content.description}\n\nApply: ${content.url}`;
  const encodedMessage = encodeURIComponent(message);
  window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
};

export const copyToClipboard = async (url: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};
