// Resume parser types
export type ResumeKey = "profile" | "education" | "workExperiences" | "projects" | "skills" | "custom";

export interface ResumeProfile {
  name: string;
  email: string;
  phone: string;
  location: string;
  url: string;
  summary: string;
}

export interface ResumeEducation {
  school: string;
  degree: string;
  gpa: string;
  date: string;
  descriptions: string[];
}

export interface ResumeWorkExperience {
  company: string;
  jobTitle: string;
  date: string;
  descriptions: string[];
}

export interface ResumeProject {
  project: string;
  date: string;
  descriptions: string[];
}

export interface ResumeSkills {
  featuredSkills: { skill: string; rating: number }[];
  descriptions: string[];
}

export interface Resume {
  profile: ResumeProfile;
  educations: ResumeEducation[];
  workExperiences: ResumeWorkExperience[];
  projects: ResumeProject[];
  skills: ResumeSkills;
  custom: {
    descriptions: string[];
  };
}

export interface ResumeData {
  name: string;
  title: string;
  contact: {
    phone: string;
    email: string;
    address: string;
  };
  summary: string;
  skills: string[];
  experience: {
    role: string;
    company: string;
    location: string;
    start_date: string;
    end_date: string;
    points: string[];
  }[];
  education: {
    degree: string;
    year: string;
    institute: string;
  }[];
  profilePic?: string;
}

export const colors = [
  "#0066CC", // Blue
  "#009688", // Teal
  "#E91E63", // Pink
  "#FF5722", // Orange
  "#2F4858", // Dark Navy
  "#4CAF50", // Green
  "#9C27B0", // Purple
  "#FF9800"  // Amber
];

export const sampleResumeData: ResumeData = {
  name: "Ishaan Agrawal",
  title: "Retail Sales Associate",
  contact: {
    phone: "+91 90000 12345",
    email: "ishaang@sample.in",
    address: "New Delhi, India"
  },
  summary: "Customer-focused retail sales professional with 3+ years of experience in fast-paced retail environments. Proven track record of exceeding sales targets and delivering exceptional customer service.",
  skills: ["POS system operation", "Teamwork", "Inventory management", "Customer service", "Sales techniques", "Cash handling"],
  experience: [
    {
      role: "Retail Sales Associate",
      company: "ZARA",
      location: "New Delhi, India",
      start_date: "2017",
      end_date: "Current",
      points: [
        "Increased monthly sales by 10% by cross-selling products.",
        "Maintained accurate drawer records meeting financial targets.",
        "Assisted customers with product selection and styling advice."
      ]
    }
  ],
  education: [
    {
      degree: "Diploma in Financial Accounting",
      year: "2016",
      institute: "Oxford Software Institute"
    }
  ],
  profilePic: "/images/profiles/default-avatar.jpg"
};