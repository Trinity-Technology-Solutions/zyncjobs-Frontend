import { create } from 'zustand';

const useResumeStore = create((set, get) => ({
  resumeData: {
    personalInfo: {
      name: '',
      email: '',
      phone: '',
      location: '',
      linkedin: '',
      website: ''
    },
    summary: '',
    experience: [],
    education: [],
    skills: []
  },

  selectedTemplate: 'modern',
  currentStep: 0,
  isGenerating: false,
  resumeScore: 0,

  updatePersonalInfo: (info) => set((state) => ({
    resumeData: { ...state.resumeData, personalInfo: { ...state.resumeData.personalInfo, ...info } }
  })),

  updateSummary: (summary) => set((state) => ({
    resumeData: { ...state.resumeData, summary }
  })),

  addExperience: (experience) => set((state) => ({
    resumeData: { 
      ...state.resumeData, 
      experience: [...state.resumeData.experience, experience] 
    }
  })),

  updateSkills: (skills) => set((state) => ({
    resumeData: { ...state.resumeData, skills }
  })),

  setSelectedTemplate: (template) => set({ selectedTemplate: template }),

  setCurrentStep: (step) => set({ currentStep: step }),

  setIsGenerating: (isGenerating) => set({ isGenerating }),

  calculateResumeScore: () => {
    const { resumeData } = get();
    let score = 0;

    if (resumeData.personalInfo.name) score += 20;
    if (resumeData.personalInfo.email) score += 10;
    if (resumeData.summary && resumeData.summary.length > 50) score += 30;
    if (resumeData.experience.length > 0) score += 25;
    if (resumeData.skills.length >= 3) score += 15;

    set({ resumeScore: Math.min(score, 100) });
    return Math.min(score, 100);
  }
}));

export default useResumeStore;