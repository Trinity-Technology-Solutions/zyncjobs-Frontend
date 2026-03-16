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

export const generatePositionId = (): string => {
  const POSITION_ID_KEY = 'zyncjobs_position_counter';
  
  // Get current counter from localStorage
  let counter = parseInt(localStorage.getItem(POSITION_ID_KEY) || '0', 10);
  
  // Increment counter
  counter += 1;
  
  // Store updated counter
  localStorage.setItem(POSITION_ID_KEY, counter.toString());
  
  // Return formatted position ID with PID prefix and zero padding
  return `PID${String(counter).padStart(4, '0')}`;
};