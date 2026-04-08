import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface PersonalInfo {
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  portfolio: string;
}

export interface ExperienceItem {
  id: string;
  title: string;
  company: string;
  location: string;
  duration: string;
  current: boolean;
  bullets: string[];
}

export interface EducationItem {
  id: string;
  degree: string;
  institution: string;
  location: string;
  duration: string;
  grade: string;
}

export interface ResumeData {
  template: string;
  personalInfo: PersonalInfo;
  summary: string;
  experience: ExperienceItem[];
  education: EducationItem[];
  skills: string[];
  jobDescription: string;
}

interface ResumeStore {
  data: ResumeData;
  update: <K extends keyof ResumeData>(field: K, value: ResumeData[K]) => void;
  updatePersonalInfo: (field: keyof PersonalInfo, value: string) => void;
  addExperience: () => void;
  updateExperience: (id: string, field: keyof ExperienceItem, value: any) => void;
  removeExperience: (id: string) => void;
  addEducation: () => void;
  updateEducation: (id: string, field: keyof EducationItem, value: string) => void;
  removeEducation: (id: string) => void;
  reset: () => void;
}

const defaultData: ResumeData = {
  template: 'classic',
  personalInfo: { name: '', email: '', phone: '', location: '', linkedin: '', portfolio: '' },
  summary: '',
  experience: [],
  education: [],
  skills: [],
  jobDescription: '',
};

export const useResumeStore = create<ResumeStore>(
  persist(
    (set) => ({
      data: defaultData,

      update: (field, value) =>
        set((s) => ({ data: { ...s.data, [field]: value } })),

      updatePersonalInfo: (field, value) =>
        set((s) => ({
          data: { ...s.data, personalInfo: { ...s.data.personalInfo, [field]: value } },
        })),

      addExperience: () =>
        set((s) => ({
          data: {
            ...s.data,
            experience: [
              ...s.data.experience,
              { id: Date.now().toString(), title: '', company: '', location: '', duration: '', current: false, bullets: [''] },
            ],
          },
        })),

      updateExperience: (id, field, value) =>
        set((s) => ({
          data: {
            ...s.data,
            experience: s.data.experience.map((e) => (e.id === id ? { ...e, [field]: value } : e)),
          },
        })),

      removeExperience: (id) =>
        set((s) => ({
          data: { ...s.data, experience: s.data.experience.filter((e) => e.id !== id) },
        })),

      addEducation: () =>
        set((s) => ({
          data: {
            ...s.data,
            education: [
              ...s.data.education,
              { id: Date.now().toString(), degree: '', institution: '', location: '', duration: '', grade: '' },
            ],
          },
        })),

      updateEducation: (id, field, value) =>
        set((s) => ({
          data: {
            ...s.data,
            education: s.data.education.map((e) => (e.id === id ? { ...e, [field]: value } : e)),
          },
        })),

      removeEducation: (id) =>
        set((s) => ({
          data: { ...s.data, education: s.data.education.filter((e) => e.id !== id) },
        })),

      reset: () => set({ data: defaultData }),
    }),
    {
      name: 'zyncjobs-resume-builder',
    }
  )
);
