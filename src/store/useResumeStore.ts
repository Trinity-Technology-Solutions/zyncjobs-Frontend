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

export interface CertificationItem {
  id: string;
  name: string;
  issuer: string;
  year: string;
}

export interface AwardItem {
  id: string;
  title: string;
  issuer: string;
  year: string;
  description: string;
}

export interface ProjectItem {
  id: string;
  name: string;
  role: string;
  duration: string;
  url: string;
  bullets: string[];
}

export interface LanguageItem {
  id: string;
  language: string;
  proficiency: 'Native' | 'Fluent' | 'Advanced' | 'Intermediate' | 'Basic';
}

export interface AchievementItem {
  id: string;
  title: string;
  description: string;
}

export interface CustomSection {
  id: string;
  heading: string;
  content: string;
}

export interface ResumeData {
  template: string;
  personalInfo: PersonalInfo;
  summary: string;
  experience: ExperienceItem[];
  education: EducationItem[];
  skills: string[];
  certifications: CertificationItem[];
  awards: AwardItem[];
  projects: ProjectItem[];
  languages: LanguageItem[];
  achievements: AchievementItem[];
  customSections: CustomSection[];
  hiddenSections: string[];
  jobDescription: string;
  resumeName: string;
  goal: string;
  targetRole: string;
  lastSaved: number | null;
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
  addCertification: () => void;
  updateCertification: (id: string, field: keyof CertificationItem, value: string) => void;
  removeCertification: (id: string) => void;
  addAward: () => void;
  updateAward: (id: string, field: keyof AwardItem, value: string) => void;
  removeAward: (id: string) => void;
  addProject: () => void;
  updateProject: (id: string, field: keyof ProjectItem, value: any) => void;
  removeProject: (id: string) => void;
  addLanguage: () => void;
  updateLanguage: (id: string, field: keyof LanguageItem, value: string) => void;
  removeLanguage: (id: string) => void;
  addAchievement: () => void;
  updateAchievement: (id: string, field: keyof AchievementItem, value: string) => void;
  removeAchievement: (id: string) => void;
  addCustomSection: () => void;
  updateCustomSection: (id: string, field: keyof CustomSection, value: string) => void;
  removeCustomSection: (id: string) => void;
  toggleSection: (sectionId: string) => void;
  touchSave: () => void;
  reset: () => void;
}

const defaultData: ResumeData = {
  template: 'classic',
  personalInfo: { name: '', email: '', phone: '', location: '', linkedin: '', portfolio: '' },
  summary: '',
  experience: [],
  education: [],
  skills: [],
  certifications: [],
  awards: [],
  projects: [],
  languages: [],
  achievements: [],
  customSections: [],
  hiddenSections: [],
  jobDescription: '',
  resumeName: 'My Resume',
  goal: '',
  targetRole: '',
  lastSaved: null,
};

export const useResumeStore = create<ResumeStore>()(
  persist(
    (set) => ({
      data: defaultData,

      update: (field, value) =>
        set((s: ResumeStore) => ({ data: { ...s.data, [field]: typeof value === 'string' ? value.trim() : value } })),

      updatePersonalInfo: (field, value) =>
        set((s: ResumeStore) => ({
          data: { ...s.data, personalInfo: { ...s.data.personalInfo, [field]: value.trim() } },
        })),

      addExperience: () =>
        set((s: ResumeStore) => ({
          data: {
            ...s.data,
            experience: [
              ...s.data.experience,
              { id: Date.now().toString(), title: '', company: '', location: '', duration: '', current: false, bullets: [''] },
            ],
          },
        })),

      updateExperience: (id, field, value) =>
        set((s: ResumeStore) => ({
          data: {
            ...s.data,
            experience: s.data.experience.map((e: ExperienceItem) => (e.id === id ? { ...e, [field]: value } : e)),
          },
        })),

      removeExperience: (id) =>
        set((s: ResumeStore) => ({
          data: { ...s.data, experience: s.data.experience.filter((e: ExperienceItem) => e.id !== id) },
        })),

      addEducation: () =>
        set((s: ResumeStore) => ({
          data: {
            ...s.data,
            education: [
              ...s.data.education,
              { id: Date.now().toString(), degree: '', institution: '', location: '', duration: '', grade: '' },
            ],
          },
        })),

      updateEducation: (id, field, value) =>
        set((s: ResumeStore) => ({
          data: {
            ...s.data,
            education: s.data.education.map((e: EducationItem) => (e.id === id ? { ...e, [field]: value } : e)),
          },
        })),

      removeEducation: (id) =>
        set((s: ResumeStore) => ({
          data: { ...s.data, education: s.data.education.filter((e: EducationItem) => e.id !== id) },
        })),

      addCertification: () =>
        set((s: ResumeStore) => ({
          data: {
            ...s.data,
            certifications: [
              ...s.data.certifications,
              { id: Date.now().toString(), name: '', issuer: '', year: '' },
            ],
          },
        })),

      updateCertification: (id, field, value) =>
        set((s: ResumeStore) => ({
          data: {
            ...s.data,
            certifications: s.data.certifications.map((c: CertificationItem) => (c.id === id ? { ...c, [field]: value } : c)),
          },
        })),

      removeCertification: (id) =>
        set((s: ResumeStore) => ({
          data: { ...s.data, certifications: s.data.certifications.filter((c: CertificationItem) => c.id !== id) },
        })),

      addAward: () =>
        set((s: ResumeStore) => ({
          data: {
            ...s.data,
            awards: [
              ...s.data.awards,
              { id: Date.now().toString(), title: '', issuer: '', year: '', description: '' },
            ],
          },
        })),

      updateAward: (id, field, value) =>
        set((s: ResumeStore) => ({
          data: {
            ...s.data,
            awards: s.data.awards.map((a: AwardItem) => (a.id === id ? { ...a, [field]: value } : a)),
          },
        })),

      removeAward: (id) =>
        set((s: ResumeStore) => ({
          data: { ...s.data, awards: s.data.awards.filter((a: AwardItem) => a.id !== id) },
        })),

      addProject: () =>
        set((s: ResumeStore) => ({
          data: {
            ...s.data,
            projects: [
              ...(s.data.projects || []),
              { id: Date.now().toString(), name: '', role: '', duration: '', url: '', bullets: [''] },
            ],
          },
        })),

      updateProject: (id, field, value) =>
        set((s: ResumeStore) => ({
          data: {
            ...s.data,
            projects: (s.data.projects || []).map((p: ProjectItem) => (p.id === id ? { ...p, [field]: value } : p)),
          },
        })),

      removeProject: (id) =>
        set((s: ResumeStore) => ({
          data: { ...s.data, projects: (s.data.projects || []).filter((p: ProjectItem) => p.id !== id) },
        })),

      addLanguage: () =>
        set((s: ResumeStore) => ({
          data: { ...s.data, languages: [...(s.data.languages||[]), { id: Date.now().toString(), language: '', proficiency: 'Intermediate' as const }] },
        })),
      updateLanguage: (id, field, value) =>
        set((s: ResumeStore) => ({ data: { ...s.data, languages: (s.data.languages||[]).map((l: LanguageItem) => l.id===id ? {...l,[field]:value} : l) } })),
      removeLanguage: (id) =>
        set((s: ResumeStore) => ({ data: { ...s.data, languages: (s.data.languages||[]).filter((l: LanguageItem) => l.id!==id) } })),

      addAchievement: () =>
        set((s: ResumeStore) => ({
          data: { ...s.data, achievements: [...(s.data.achievements||[]), { id: Date.now().toString(), title: '', description: '' }] },
        })),
      updateAchievement: (id, field, value) =>
        set((s: ResumeStore) => ({ data: { ...s.data, achievements: (s.data.achievements||[]).map((a: AchievementItem) => a.id===id ? {...a,[field]:value} : a) } })),
      removeAchievement: (id) =>
        set((s: ResumeStore) => ({ data: { ...s.data, achievements: (s.data.achievements||[]).filter((a: AchievementItem) => a.id!==id) } })),

      addCustomSection: () =>
        set((s: ResumeStore) => ({
          data: { ...s.data, customSections: [...(s.data.customSections||[]), { id: Date.now().toString(), heading: 'Custom Section', content: '' }] },
        })),
      updateCustomSection: (id, field, value) =>
        set((s: ResumeStore) => ({ data: { ...s.data, customSections: (s.data.customSections||[]).map((c: CustomSection) => c.id===id ? {...c,[field]:value} : c) } })),
      removeCustomSection: (id) =>
        set((s: ResumeStore) => ({ data: { ...s.data, customSections: (s.data.customSections||[]).filter((c: CustomSection) => c.id!==id) } })),

      toggleSection: (sectionId) =>
        set((s: ResumeStore) => {
          const hidden = s.data.hiddenSections || [];
          return {
            data: {
              ...s.data,
              hiddenSections: hidden.includes(sectionId)
                ? hidden.filter(id => id !== sectionId)
                : [...hidden, sectionId],
            },
          };
        }),

      touchSave: () =>
        set((s: ResumeStore) => ({ data: { ...s.data, lastSaved: Date.now() } })),

      reset: () => {
        set({ data: defaultData });
        try { localStorage.removeItem('zyncjobs-resume-builder'); } catch { /* silent */ }
      },
    }),
    {
      name: 'zyncjobs-resume-builder',
      merge: (persisted: any, current: any) => ({
        ...current,
        data: { ...defaultData, ...persisted?.data },
      }),
    }
  )
);
