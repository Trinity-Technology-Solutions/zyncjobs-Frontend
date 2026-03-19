// Employer ID generation utility
// Generates sequential employer IDs starting from EID0001, EID0002, EID0003...

const EMPLOYER_ID_KEY = 'zyncjobs_employer_counter';

export const generateEmployerId = (): string => {
  // Get current counter from localStorage
  let counter = parseInt(localStorage.getItem(EMPLOYER_ID_KEY) || '0', 10);
  
  // Increment counter
  counter += 1;
  
  // Store updated counter
  localStorage.setItem(EMPLOYER_ID_KEY, counter.toString());
  
  // Return formatted employer ID with EID prefix and zero padding
  return `EID${String(counter).padStart(4, '0')}`;
};

export const getNextEmployerId = (): string => {
  // Get current counter without incrementing
  const counter = parseInt(localStorage.getItem(EMPLOYER_ID_KEY) || '0', 10);
  return `EID${String(counter + 1).padStart(4, '0')}`;
};

export const getCurrentEmployerIdCount = (): number => {
  return parseInt(localStorage.getItem(EMPLOYER_ID_KEY) || '0', 10);
};

export const resetEmployerIdCounter = (): void => {
  localStorage.removeItem(EMPLOYER_ID_KEY);
};

// For testing purposes - set a specific counter value
export const setEmployerIdCounter = (value: number): void => {
  localStorage.setItem(EMPLOYER_ID_KEY, value.toString());
};

// Initialize counter if not exists (useful for first-time setup)
export const initializeEmployerIdCounter = (): void => {
  if (!localStorage.getItem(EMPLOYER_ID_KEY)) {
    localStorage.setItem(EMPLOYER_ID_KEY, '0');
  }
};