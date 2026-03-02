export interface Resume {
  profile: {
    name: string;
    email: string;
    phone: string;
    location: string;
    url: string;
    summary: string;
  };
  workExperiences: Array<{
    company: string;
    jobTitle: string;
    date: string;
    descriptions: string[];
  }>;
  educations: Array<{
    school: string;
    degree: string;
    date: string;
    gpa: string;
    descriptions: string[];
  }>;
  projects: Array<{
    project: string;
    date: string;
    descriptions: string[];
  }>;
  skills: {
    featuredSkills: Array<{ skill: string }>;
    descriptions: string[];
  };
  custom: {
    descriptions: string[];
  };
}