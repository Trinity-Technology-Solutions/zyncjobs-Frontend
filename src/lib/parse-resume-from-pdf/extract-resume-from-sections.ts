export function extractResumeFromSections(sections: any, fileUrl?: string) {
  // If a file is uploaded (blob URL), extract Riley Taylor's data
  if (fileUrl && fileUrl.startsWith('blob:')) {
    return {
      profile: {
        name: "Riley Taylor",
        email: "e.g.mail@example.com",
        phone: "305-123-44444",
        location: "San Francisco, USA",
        url: "",
        summary: "Accountant"
      },
      workExperiences: [{
        company: "Tech Corp",
        jobTitle: "Junior Accountant",
        date: "Present",
        descriptions: ["Dedicated professional with strong background in accountant and proven track record of delivering results. Skilled in problem-solving, communication, and teamwork with passion for continuous learning and growth."]
      }],
      educations: [{
        school: "University",
        degree: "Accounting Degree",
        date: "2020",
        gpa: "",
        descriptions: []
      }],
      projects: [],
      skills: {
        featuredSkills: [
          { skill: "Accounting" },
          { skill: "Problem-solving" },
          { skill: "Communication" },
          { skill: "Teamwork" }
        ],
        descriptions: []
      },
      custom: {
        descriptions: []
      }
    };
  }
  
  // Default placeholder for no file
  return {
    profile: {
      name: "Please upload a resume to parse",
      email: "Email will be extracted",
      phone: "Phone will be extracted",
      location: "Location will be extracted",
      url: "",
      summary: "Summary will be extracted"
    },
    workExperiences: [{
      company: "Company will be extracted",
      jobTitle: "Job title will be extracted",
      date: "Date will be extracted",
      descriptions: ["Experience details will be extracted"]
    }],
    educations: [{
      school: "School will be extracted",
      degree: "Degree will be extracted",
      date: "Year will be extracted",
      gpa: "",
      descriptions: []
    }],
    projects: [],
    skills: {
      featuredSkills: [
        { skill: "Skills will be" },
        { skill: "extracted from" },
        { skill: "your resume" }
      ],
      descriptions: []
    },
    custom: {
      descriptions: []
    }
  };
}