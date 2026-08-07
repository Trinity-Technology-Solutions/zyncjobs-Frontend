import mistralAIService from '../services/mistralAIService';

// Shared JD generator — used by manual posting (JobPostingPage) and bulk import (BulkJobImportPage)
// so both produce identical job descriptions.

export const generateLocalJD = (jobTitle: string, company: string, location: string, context: any): string => {
    const title = jobTitle.toLowerCase();
    const co = company || 'our company';
    const loc = location ? ` in ${location}` : '';
    const skills = Array.isArray(context?.skills) && context.skills.length > 0 ? context.skills.join(', ') : 'relevant technologies';
    const jobType = Array.isArray(context?.jobType) ? context.jobType.join('/') : (context?.jobType || 'Full-time');
    const education = Array.isArray(context?.educationLevel) ? context.educationLevel[0] : (context?.educationLevel || "Bachelor's degree");
    const salary = context?.salary ? `\n• Salary: ${context.salary}` : '';
    const benefits = Array.isArray(context?.benefits) && context.benefits.length > 0 ? context.benefits.join(', ') : 'health insurance, flexible work';

    const isTech = /developer|engineer|programmer|architect|devops|fullstack|frontend|backend|data|cloud|security|qa|tester/i.test(title);
    const isMarketing = /marketing|seo|content|social media|brand|growth|digital/i.test(title);
    const isSales = /sales|account executive|business development|bdm/i.test(title);
    const isHR = /hr|human resource|recruiter|talent|people/i.test(title);
    const isFinance = /accountant|finance|accounting|auditor|tax|payroll/i.test(title);
    const isDesign = /designer|ui|ux|graphic|creative/i.test(title);
    const isMedia = /news|journalist|reporter|anchor|producer|editor|broadcast|media|correspondent|cameraman|videographer|photographer|content creator|copywriter|writer|blogger/i.test(title);
    const isManager = /manager|lead|head|director|vp|chief/i.test(title);

    let responsibilities: string[];
    let requirements: string[];

    if (isTech) {
        responsibilities = [
            `Design, develop, and maintain high-quality ${jobTitle} solutions`,
            'Collaborate with cross-functional teams to define and implement new features',
            'Write clean, scalable, and well-documented code',
            'Conduct code reviews and ensure best practices are followed',
            `Work with technologies including: ${skills}`,
            'Troubleshoot, debug, and optimize application performance',
            'Participate in agile ceremonies and sprint planning',
        ];
        requirements = [
            `${education} in Computer Science, Engineering, or related field`,
            `3+ years of experience as a ${jobTitle}`,
            `Strong proficiency in: ${skills}`,
            'Experience with version control systems (Git)',
            'Excellent problem-solving and analytical skills',
            'Strong communication and teamwork abilities',
        ];
    } else if (isMarketing) {
        responsibilities = [
            'Plan and execute digital marketing campaigns across multiple channels',
            'Analyze campaign performance and optimize for ROI',
            'Create engaging content for social media, email, and web',
            'Conduct market research and competitor analysis',
            'Collaborate with design and sales teams',
            'Track KPIs and prepare performance reports',
        ];
        requirements = [
            `${education} in Marketing, Communications, or related field`,
            `2+ years of experience in ${jobTitle} role`,
            `Proficiency in: ${skills}`,
            'Strong analytical and creative thinking skills',
            'Excellent written and verbal communication',
        ];
    } else if (isSales) {
        responsibilities = [
            'Identify and pursue new business opportunities',
            'Build and maintain strong client relationships',
            'Meet and exceed monthly/quarterly sales targets',
            'Present products and services to prospective clients',
            'Negotiate contracts and close deals',
            'Maintain accurate records in CRM system',
        ];
        requirements = [
            `${education} in Business, Sales, or related field`,
            `2+ years of experience in ${jobTitle} role`,
            'Proven track record of meeting sales targets',
            'Excellent communication and negotiation skills',
            'Self-motivated with strong work ethic',
        ];
    } else if (isHR) {
        responsibilities = [
            'Manage end-to-end recruitment and onboarding processes',
            'Develop and implement HR policies and procedures',
            'Handle employee relations and conflict resolution',
            'Conduct performance management and appraisal cycles',
            'Ensure compliance with labor laws and regulations',
            'Drive employee engagement and retention initiatives',
        ];
        requirements = [
            `${education} in Human Resources, Psychology, or related field`,
            `3+ years of experience in ${jobTitle} role`,
            'Knowledge of employment laws and HR best practices',
            'Strong interpersonal and communication skills',
            'Experience with HRIS systems',
        ];
    } else if (isFinance) {
        responsibilities = [
            'Prepare and maintain accurate financial records and statements',
            'Process accounts payable and receivable transactions',
            'Assist with monthly, quarterly, and annual financial reporting',
            'Reconcile bank statements and general ledger accounts',
            'Support budget preparation and financial analysis',
            'Ensure compliance with accounting standards and tax regulations',
        ];
        requirements = [
            `${education} in Accounting, Finance, or related field`,
            `2+ years of experience in ${jobTitle} role`,
            `Proficiency in: ${skills}`,
            'Knowledge of GAAP and tax regulations',
            'Strong attention to detail and analytical skills',
        ];
    } else if (isDesign) {
        responsibilities = [
            'Create user-centered designs for web and mobile applications',
            'Develop wireframes, prototypes, and high-fidelity mockups',
            'Conduct user research and usability testing',
            'Collaborate with developers and product managers',
            'Maintain design systems and brand consistency',
            'Present design concepts to stakeholders',
        ];
        requirements = [
            `${education} in Design, HCI, or related field`,
            `2+ years of experience as a ${jobTitle}`,
            `Proficiency in: ${skills}`,
            'Strong portfolio demonstrating design skills',
            'Understanding of user-centered design principles',
        ];
    } else if (isMedia) {
        responsibilities = [
            `Research, write, and produce compelling ${jobTitle} content for broadcast/digital platforms`,
            'Coordinate with reporters, anchors, and camera crews to deliver timely news coverage',
            'Edit and review scripts, footage, and stories for accuracy and editorial standards',
            'Monitor breaking news and manage live coverage logistics',
            'Collaborate with editorial team to plan daily news rundowns and story lineups',
            'Ensure content meets broadcast quality, legal, and ethical standards',
        ];
        requirements = [
            `${education} in Journalism, Mass Communication, Media Studies, or related field`,
            `2+ years of experience as a ${jobTitle} in a news or media organization`,
            `Skills: ${skills}`,
            'Strong news judgment and ability to work under tight deadlines',
            'Excellent written and verbal communication skills',
            'Familiarity with broadcast/digital media production tools',
        ];
    } else {
        responsibilities = [
            'Collaborate effectively with team members and stakeholders',
            'Contribute to process improvements and operational efficiency',
            'Prepare reports and documentation as required',
            'Meet deadlines and deliver high-quality work',
            'Stay updated with industry trends and best practices',
        ];
        requirements = [
            `${education} or equivalent experience`,
            `2+ years of relevant experience${isManager ? ' with team leadership' : ''}`,
            `Skills: ${skills}`,
            'Strong communication and interpersonal skills',
            'Ability to work independently and manage priorities',
        ];
    }

    const respText = responsibilities.map(r => `• ${r}`).join('\n');
    const reqText = requirements.map(r => `• ${r}`).join('\n');

    return `Job Summary
We are looking for a talented and experienced ${jobTitle} to join ${co}${loc}. This is a ${jobType} position offering an exciting opportunity to make a significant impact in a dynamic and collaborative environment. The ideal candidate will bring a strong background in ${skills}, a passion for excellence, and the ability to thrive in a fast-paced setting. You will work closely with cross-functional teams to deliver high-quality outcomes and contribute to the long-term success of the organization.

About the Role
As a ${jobTitle} at ${co}, you will be responsible for driving key initiatives, collaborating with stakeholders, and delivering results that align with our strategic goals. We are looking for someone who is proactive, detail-oriented, and committed to continuous improvement. This role offers significant growth potential and the opportunity to work on challenging, meaningful projects.

Key Responsibilities
${respText}

Requirements
${reqText}

What We Offer
• Competitive compensation package${salary}
• ${benefits}
• Professional development and continuous learning opportunities
• Collaborative, inclusive, and innovative work culture
• Opportunity to work on impactful projects with a talented team
• Flexible working arrangements and work-life balance
• Regular performance reviews and career growth pathways

About ${co}
${co} is a forward-thinking organization committed to excellence, innovation, and creating value for our clients and stakeholders. We believe in empowering our employees to do their best work and fostering a culture of respect, collaboration, and continuous improvement. Join us and be part of a team that is shaping the future.

How to Apply
If you are passionate about ${jobTitle.toLowerCase()} and meet the above requirements, we would love to hear from you. Apply now through ZyncJobs and take the next step in your career journey.`;
};

// Same flow as manual posting: try AI first, fall back to the rich local template only if AI fails.
export const generateJD = async (
    jobTitle: string,
    company: string,
    location: string,
    context: any
): Promise<string> => {
    let jdText = '';
    try {
        const raw = await mistralAIService.generateJobDescription(
            jobTitle,
            company || '',
            location || '',
            context
        );
        if (typeof raw === 'string' && raw.trim() && raw !== '[object Object]') {
            jdText = raw.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*\*([^*]+)\*/g, '$1');
        }
    } catch { /* AI failed, use local */ }

    if (!jdText) {
        jdText = generateLocalJD(jobTitle, company || '', location || '', context);
    }
    return jdText;
};
