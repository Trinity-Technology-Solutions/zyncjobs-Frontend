/**
 * Utility functions for social sharing with dynamic OG tags
 */

export const generateSocialShareUrl = (jobId: string) => {
  const backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
  return `${backendUrl}/job-detail?id=${jobId}`;
};

export const generateJobShareContent = (job: any) => {
  const jobTitle = job.jobTitle || job.title || 'Job Opportunity';
  const company = job.company || 'Company';
  const location = job.location || 'Location not specified';
  
  const formatSalary = (salary: any) => {
    if (typeof salary === 'object' && salary && salary.min && salary.max) {
      const symbol = salary.currency === 'INR' ? '₹' : salary.currency === 'USD' ? '$' : '$';
      return `${symbol}${salary.min.toLocaleString()}-${salary.max.toLocaleString()}`;
    }
    return 'Competitive salary';
  };

  const salary = formatSalary(job.salary);
  const shareUrl = generateSocialShareUrl(job._id || job.id);

  return {
    title: `${jobTitle} at ${company}`,
    description: `📍 ${location} • 💰 ${salary} • 🎯 ${job.experience || job.experienceLevel || '2-4 years'} experience`,
    url: shareUrl,
    hashtags: ['JobAlert', 'Hiring', company.replace(/\s+/g, ''), 'Opportunity']
  };
};

export const shareToLinkedIn = (content: ReturnType<typeof generateJobShareContent> | string) => {
  const url = typeof content === 'string' ? content : content.url;
  const text = typeof content === 'object'
    ? `💼 *${content.title}*\n\n${content.description}\n\nCheck it out: ${content.url}`
    : '';
  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}${text ? `&summary=${encodeURIComponent(text)}` : ''}`;
  window.open(linkedInUrl, '_blank');
};

export const shareToTwitter = (content: ReturnType<typeof generateJobShareContent>) => {
  const tweetText = `💼 ${content.title}\n${content.description}\n\n#${content.hashtags.join(' #')}`;
  const encodedText = encodeURIComponent(tweetText);
  const encodedUrl = encodeURIComponent(content.url);
  window.open(`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`, '_blank');
};

export const shareToWhatsApp = (content: ReturnType<typeof generateJobShareContent>) => {
  const message = `💼 *${content.title}*\n\n${content.description}\n\nCheck it out: ${content.url}`;
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