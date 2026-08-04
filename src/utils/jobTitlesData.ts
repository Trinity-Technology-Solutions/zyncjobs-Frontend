"use client";
import { useState, useEffect, useCallback } from 'react';

export interface JobTitleData {
  value: string;
  label: string;
}

export interface SkillData {
  value: string;
  label: string;
}

// Static curated job titles (top 50 most in-demand roles)
export const staticJobTitles: JobTitleData[] = [
  { value: "Software Engineer", label: "Software Engineer" },
  { value: "Software Developer", label: "Software Developer" },
  { value: "Full Stack Developer", label: "Full Stack Developer" },
  { value: "Frontend Developer", label: "Frontend Developer" },
  { value: "Backend Developer", label: "Backend Developer" },
  { value: "DevOps Engineer", label: "DevOps Engineer" },
  { value: "Cloud Engineer", label: "Cloud Engineer" },
  { value: "AI Engineer", label: "AI Engineer" },
  { value: "ML Engineer", label: "ML Engineer" },
  { value: "Data Scientist", label: "Data Scientist" },
  { value: "Data Analyst", label: "Data Analyst" },
  { value: "Data Engineer", label: "Data Engineer" },
  { value: "Cybersecurity Analyst", label: "Cybersecurity Analyst" },
  { value: "Network Engineer", label: "Network Engineer" },
  { value: "IT Support Specialist", label: "IT Support Specialist" },
  { value: "QA Engineer", label: "QA Engineer" },
  { value: "Product Manager", label: "Product Manager" },
  { value: "Project Manager", label: "Project Manager" },
  { value: "Scrum Master", label: "Scrum Master" },
  { value: "UI Designer", label: "UI Designer" },
  { value: "UX Designer", label: "UX Designer" },
  { value: "Business Analyst", label: "Business Analyst" },
  { value: "HR Manager", label: "HR Manager" },
  { value: "Recruiter", label: "Recruiter" },
  { value: "Business Development Manager", label: "Business Development Manager" },
  { value: "Sales Manager", label: "Sales Manager" },
  { value: "Sales Executive", label: "Sales Executive" },
  { value: "Account Manager", label: "Account Manager" },
  { value: "Finance Manager", label: "Finance Manager" },
  { value: "Accountant", label: "Accountant" },
  { value: "Auditor", label: "Auditor" },
  { value: "Doctor", label: "Doctor" },
  { value: "Nurse", label: "Nurse" },
  { value: "Teacher", label: "Teacher" },
  { value: "Mechanical Engineer", label: "Mechanical Engineer" },
  { value: "Electrical Engineer", label: "Electrical Engineer" },
  { value: "Civil Engineer", label: "Civil Engineer" },
  { value: "Architect", label: "Architect" },
  { value: "Construction Manager", label: "Construction Manager" },
  { value: "Chef", label: "Chef" },
  { value: "Hotel Manager", label: "Hotel Manager" },
  { value: "Driver", label: "Driver" },
  { value: "Electrician", label: "Electrician" },
  { value: "Plumber", label: "Plumber" },
  { value: "Carpenter", label: "Carpenter" },
  { value: "Senior Software Engineer", label: "Senior Software Engineer" },
  { value: "Lead Developer", label: "Lead Developer" },
  { value: "Technical Lead", label: "Technical Lead" },
  { value: "Engineering Manager", label: "Engineering Manager" },
  { value: "CTO", label: "CTO" },
  { value: "VP Engineering", label: "VP Engineering" },
  { value: "Principal Engineer", label: "Principal Engineer" },
  { value: "Staff Engineer", label: "Staff Engineer" },
  { value: "Senior Data Scientist", label: "Senior Data Scientist" },
  { value: "Lead Data Scientist", label: "Lead Data Scientist" },
  { value: "Data Science Manager", label: "Data Science Manager" },
  { value: "Senior Product Manager", label: "Senior Product Manager" },
  { value: "Product Owner", label: "Product Owner" },
  { value: "Product Marketing Manager", label: "Product Marketing Manager" },
  { value: "Growth Product Manager", label: "Growth Product Manager" },
  { value: "Senior UI/UX Designer", label: "Senior UI/UX Designer" },
  { value: "Design Lead", label: "Design Lead" },
  { value: "Creative Director", label: "Creative Director" },
  { value: "Brand Manager", label: "Brand Manager" },
  { value: "Marketing Manager", label: "Marketing Manager" },
  { value: "Senior Software Engineer (MENA)", label: "Senior Software Engineer (MENA)" },
];

// Static curated skills (top 50 most in-demand skills)
export const staticSkills: SkillData[] = [
  { value: "Python", label: "Python" },
  { value: "Java", label: "Java" },
  { value: "JavaScript", label: "JavaScript" },
  { value: "React", label: "React" },
  { value: "Node.js", label: "Node.js" },
  { value: "Angular", label: "Angular" },
  { value: "Vue.js", label: "Vue.js" },
  { value: "Docker", label: "Docker" },
  { value: "Kubernetes", label: "Kubernetes" },
  { value: "AWS", label: "AWS" },
  { value: "Azure", label: "Azure" },
  { value: "GCP", label: "GCP" },
  { value: "Machine Learning", label: "Machine Learning" },
  { value: "Deep Learning", label: "Deep Learning" },
  { value: "AI", label: "AI" },
  { value: "SQL", label: "SQL" },
  { value: "MongoDB", label: "MongoDB" },
  { value: "PostgreSQL", label: "PostgreSQL" },
  { value: "Git", label: "Git" },
  { value: "GitHub", label: "GitHub" },
  { value: "CI/CD", label: "CI/CD" },
  { value: "DevOps", label: "DevOps" },
  { value: "Cybersecurity", label: "Cybersecurity" },
  { value: "REST API", label: "REST API" },
  { value: "GraphQL", label: "GraphQL" },
  { value: "TypeScript", label: "TypeScript" },
  { value: "HTML", label: "HTML" },
  { value: "CSS", label: "CSS" },
  { value: "Tailwind CSS", label: "Tailwind CSS" },
  { value: "Jira", label: "Jira" },
  { value: "Scrum", label: "Scrum" },
  { value: "Agile", label: "Agile" },
  { value: "Project Management", label: "Project Management" },
  { value: "Leadership", label: "Leadership" },
  { value: "Communication", label: "Communication" },
  { value: "Problem Solving", label: "Problem Solving" },
  { value: "Critical Thinking", label: "Critical Thinking" },
  { value: "Teamwork", label: "Teamwork" },
  { value: "Time Management", label: "Time Management" },
  { value: "Digital Marketing", label: "Digital Marketing" },
  { value: "SEO", label: "SEO" },
  { value: "Content Marketing", label: "Content Marketing" },
  { value: "Salesforce", label: "Salesforce" },
  { value: "HubSpot", label: "HubSpot" },
  { value: "Power BI", label: "Power BI" },
  { value: "Excel", label: "Excel" },
  { value: "Photoshop", label: "Photoshop" },
  { value: "Illustrator", label: "Illustrator" },
  { value: "Figma", label: "Figma" },
  { value: "Sketch", label: "Sketch" },
  { value: "Adobe XD", label: "Adobe XD" },
  { value: "Communication", label: "Communication" },
  { value: "Negotiation", label: "Negotiation" },
  { value: "Presentation", label: "Presentation" },
  { value: "Public Speaking", label: "Public Speaking" },
  { value: "Accounting", label: "Accounting" },
  { value: "Bookkeeping", label: "Bookkeeping" },
  { value: "QuickBooks", label: "QuickBooks" },
  { value: "Tally", label: "Tally" },
  { value: "SAP", label: "SAP" },
  { value: "Oracle", label: "Oracle" },
  { value: "Salesforce", label: "Salesforce" },
  { value: "HubSpot", label: "HubSpot" },
  { value: "Zoho", label: "Zoho" },
  { value: "Microsoft Office", label: "Microsoft Office" },
  { value: "Word", label: "Word" },
  { value: "PowerPoint", label: "PowerPoint" },
  { value: "Outlook", label: "Outlook" },
  { value: "Teams", label: "Teams" },
  { value: "Slack", label: "Slack" },
  { value: "Zoom", label: "Zoom" },
  { value: "Google Workspace", label: "Google Workspace" },
  { value: "Notion", label: "Notion" },
];

export const useJobTitles = () => {
  const [jobTitles, setJobTitles] = useState<JobTitleData[]>(staticJobTitles);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadMore = useCallback(async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const response = await fetch('/api/job-titles');
      if (!response.ok) {
        setHasMore(false);
        return [];
      }
      const data = await response.json();
      const newItems: JobTitleData[] = (data.job_titles || [])
        .filter((title: string) => !jobTitles.some(item => item.value === title))
        .map((title: string) => ({ value: title, label: title }));

      if (newItems.length === 0) {
        setHasMore(false);
      }

      setJobTitles(prev => [...prev, ...newItems]);
      return newItems;
    } catch (error) {
      setHasMore(false);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [jobTitles, isLoading]);

  useEffect(() => {
    if (jobTitles.length === 0) {
      loadMore();
    }
  }, [jobTitles.length, loadMore]);

  return { jobTitles, isLoading, hasMore, loadMore };
};

export const useSkills = () => {
  const [skills, setSkills] = useState<SkillData[]>(staticSkills);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadMore = useCallback(async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const response = await fetch('/api/skills');
      if (!response.ok) {
        setHasMore(false);
        return [];
      }
      const data = await response.json();
      const newItems: SkillData[] = (data.skills || [])
        .filter((skill: string) => !skills.some(item => item.value === skill))
        .map((skill: string) => ({ value: skill, label: skill }));

      if (newItems.length === 0) {
        setHasMore(false);
      }

      setSkills(prev => [...prev, ...newItems]);
      return newItems;
    } catch (error) {
      setHasMore(false);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [skills, isLoading]);

  useEffect(() => {
    if (skills.length === 0) {
      loadMore();
    }
  }, [skills.length, loadMore]);

  return { skills, isLoading, hasMore, loadMore };
};