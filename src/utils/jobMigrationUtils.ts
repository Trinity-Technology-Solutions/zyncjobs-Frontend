// Job migration utility to handle existing jobs without employer IDs
import { generateEmployerId } from './employerIdUtils';

export const migrateJobEmployerId = (job: any, jobPoster: any): string => {
  // If job already has an employer ID, return it
  if (job.employerId) {
    return job.employerId;
  }
  
  // If job poster has an employer ID, use that
  if (jobPoster?.employerId) {
    return jobPoster.employerId;
  }
  
  // For existing jobs without employer ID, generate a new one
  // This will be used for display purposes only
  const newEmployerId = generateEmployerId();
  
  // Log for debugging
  console.log(`Generated employer ID ${newEmployerId} for job: ${job.jobTitle || job.title}`);
  
  return newEmployerId;
};

export const getDisplayEmployerId = (job: any, jobPoster: any): string | null => {
  // Check job first
  if (job.employerId) {
    return job.employerId;
  }
  
  // Check job poster
  if (jobPoster?.employerId) {
    return jobPoster.employerId;
  }
  
  // For Trinity Technology Solutions, use a specific ID
  if (job.company?.toLowerCase().includes('trinity') || 
      jobPoster?.company?.toLowerCase().includes('trinity') ||
      job.employerEmail?.includes('@trinitetech')) {
    return 'EID0001'; // Trinity gets EID0001
  }
  
  // For other existing jobs, don't generate new IDs to avoid confusion
  // Return null to hide the employer ID display
  return null;
};

export const getCompanyAbbreviation = (companyName: string): string => {
  if (!companyName) return 'ZYN';
  const words = companyName.trim().split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].substring(0, 3).toUpperCase();
  return words.slice(0, 4).map(w => w[0]).join('').toUpperCase();
};

export const generatePositionId = (companyName?: string): string => {
  const POSITION_ID_KEY = 'zyncjobs_position_counter';
  let counter = parseInt(localStorage.getItem(POSITION_ID_KEY) || '0', 10);
  counter += 1;
  localStorage.setItem(POSITION_ID_KEY, counter.toString());
  const abbr = getCompanyAbbreviation(companyName || '');
  const year = new Date().getFullYear().toString().slice(-2);
  const seq = String(counter).padStart(4, '0');
  return `${abbr}/${year}/${seq}`;
};