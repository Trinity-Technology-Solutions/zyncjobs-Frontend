export function transformHybridToFrontendFormat(hybridData: any) {
  if (!hybridData) return null;

  return {
    profile: {
      name: hybridData.profile?.name || '',
      email: hybridData.profile?.email || '',
      phone: hybridData.profile?.phone || '',
      location: hybridData.profile?.location || '',
      address: hybridData.profile?.address || {
        city: '',
        state: '',
        country: '',
        postal_code: '',
        full_address: '',
      },
      linkedin: hybridData.profile?.linkedin || '',
      github: hybridData.profile?.github || '',
    },
    skills: {
      featuredSkills: (() => {
        const skills: string[] = [];
        if (hybridData.skills && typeof hybridData.skills === 'object') {
          if (hybridData.skills.languages) skills.push(...hybridData.skills.languages);
          if (hybridData.skills.frameworks) skills.push(...hybridData.skills.frameworks);
          if (hybridData.skills.databases) skills.push(...hybridData.skills.databases);
          if (hybridData.skills.cloud) skills.push(...hybridData.skills.cloud);
          if (hybridData.skills.tools) skills.push(...hybridData.skills.tools);
            if (hybridData.skills.others) skills.push(...hybridData.skills.others);
          if (hybridData.skills.design) skills.push(...hybridData.skills.design);
          if (hybridData.skills.soft) skills.push(...hybridData.skills.soft);
          // flat array fallback
          if (Array.isArray(hybridData.skills)) skills.push(...hybridData.skills);
        }
        return skills.map(s => ({ skill: s }));
      })(),
    },
    workExperiences: (hybridData.experience || []).map((exp: any) => ({
      jobTitle: exp.designation || exp.role || exp.jobTitle || '',
      company: exp.company || '',
      date: exp.start_date && exp.end_date
        ? `${exp.start_date} - ${exp.end_date}`
        : exp.date || '',
      descriptions: Array.isArray(exp.responsibilities) ? exp.responsibilities : [],
      location: exp.location || '',
    })),
    educations: (hybridData.education || []).map((edu: any) => ({
      degree: edu.degree || '',
      school: edu.institution || edu.college || '',
      date: edu.year || edu.date || '',
      grade: edu.cgpa || '',
    })),
    projects: (hybridData.projects || []).map((proj: any) => ({
      name: proj.title || proj.name || '',
      description: proj.description || '',
      technologies: proj.technologies || [],
      responsibilities: proj.responsibilities || [],
    })),
    certifications: (hybridData.certifications || []).map((cert: any) => ({
      name: cert.name || cert.certificate || '',
      provider: cert.issuer || cert.provider || '',
      date: cert.year || cert.date || '',
    })),
    summary: hybridData.summary || '',
    competitions: [],
    softSkills: [],
    tools: [],
  };
}
