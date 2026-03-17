/**
 * Utility functions for social sharing with dynamic OG tags
 */

export const generateSocialShareUrl = (jobId: string) => {
  const frontendUrl = import.meta.env.VITE_APP_URL || window.location.origin;
  if (!jobId) {
    // Fallback: use current page URL if it has ?id=
    const currentId = new URLSearchParams(window.location.search).get('id');
    return currentId ? `${frontendUrl}/job-detail?id=${currentId}` : window.location.href;
  }
  return `${frontendUrl}/job-detail?id=${jobId}`;
};

export const generateJobShareContent = (job: any) => {
  const urlId = new URLSearchParams(window.location.search).get('id') || '';
  const shareJobId = job.positionId || job.id || job._id || urlId;
  const jobTitle = job.jobTitle || job.title || 'Job Opportunity';
  const company = job.company || 'Company';
  const location = job.location || 'Location not specified';
  const jobType = Array.isArray(job.jobType) ? job.jobType.join(', ') : (job.jobType || 'Full-time');
  const experience = job.experienceRange || job.experienceLevel || '';
  const skills = Array.isArray(job.skills) && job.skills.length > 0
    ? job.skills.slice(0, 4).join(', ')
    : '';

  const formatSalary = (salary: any) => {
    if (typeof salary === 'object' && salary && salary.min && salary.max) {
      const symbol = salary.currency === 'INR' ? '₹' : salary.currency === 'USD' ? '$' : '$';
      return `${symbol}${salary.min.toLocaleString()}-${salary.max.toLocaleString()}`;
    }
    return null;
  };

  const salary = formatSalary(job.salary);
  const shareUrl = generateSocialShareUrl(shareJobId);
  const companyTag = company.replace(/[^a-zA-Z0-9]/g, '');

  const lines = [
    `💼 ${jobTitle} at ${company}`,
    ``,
    `📍 Location: ${location}`,
    `⏰ Type: ${jobType}`,
    ...(experience ? [`🎯 Experience: ${experience}`] : []),
    ...(salary ? [`💰 Salary: ${salary}`] : []),
    ...(skills ? [`🔧 Skills: ${skills}`] : []),
    ``,
    `🔗 Apply now: ${shareUrl}`,
    ``,
    `#JobAlert #Hiring #${companyTag} #Opportunity #Jobs`
  ];

  return {
    title: `${jobTitle} at ${company}`,
    description: `📍 ${location} • ⏰ ${jobType}${experience ? ` • 🎯 ${experience}` : ''}${salary ? ` • 💰 ${salary}` : ''}`,
    text: lines.join('\n'),
    url: shareUrl,
    hashtags: ['JobAlert', 'Hiring', companyTag, 'Opportunity']
  };
};

export const shareToLinkedIn = (content: ReturnType<typeof generateJobShareContent> | string) => {
  const text = typeof content === 'object' ? content.text : content;
  const linkedInUrl = `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(text)}`;
  window.open(linkedInUrl, '_blank', 'width=600,height=600');
};

export const shareToTwitter = (content: ReturnType<typeof generateJobShareContent>) => {
  const tweetText = `💼 ${content.title}\n${content.description}\n\n#${content.hashtags.join(' #')}`;
  const encodedText = encodeURIComponent(tweetText);
  const encodedUrl = encodeURIComponent(content.url);
  window.open(`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`, '_blank', 'width=600,height=400');
};

export const shareToWhatsApp = (content: ReturnType<typeof generateJobShareContent>) => {
  const message = content.text || `💼 *${content.title}*\n\n${content.description}\n\nApply: ${content.url}`;
  const encodedMessage = encodeURIComponent(message);
  window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
};

export const copyToClipboard = async (url: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch (err) {
    console.error('Failed to copy link:', err);
    return false;
  }
};