import React, { useState, useRef } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { ChevronRight, FileText, Shield, Building2 } from 'lucide-react';

interface TermsPageProps {
  onNavigate?: (page: string) => void;
  user?: any;
  onLogout?: () => void;
}

const SECTIONS = {
  terms: [
    { id: 'acceptance', title: '1. Acceptance of Terms' },
    { id: 'eligibility', title: '2. Eligibility' },
    { id: 'account', title: '3. Your Account' },
    { id: 'profile', title: '4. Profile & Resume Data' },
    { id: 'datastorage', title: '5. Where Your Data is Stored' },
    { id: 'dataflow', title: '6. How Your Data Flows to Employers' },
    { id: 'applications', title: '7. Job Applications' },
    { id: 'ai', title: '8. AI-Powered Features' },
    { id: 'assessments', title: '9. Skill Assessments' },
    { id: 'conduct', title: '10. Prohibited Conduct' },
    { id: 'messaging', title: '11. Messaging' },
    { id: 'ip', title: '12. Intellectual Property' },
    { id: 'termination', title: '13. Termination' },
    { id: 'liability', title: '14. Limitation of Liability' },
    { id: 'governing', title: '15. Governing Law' },
  ],
  employer: [
    { id: 'ed1', title: 'ED-1. Authorized Representative' },
    { id: 'ed2', title: 'ED-2. Accuracy of Job Postings' },
    { id: 'ed3', title: 'ED-3. No Fraudulent Hiring' },
    { id: 'ed4', title: 'ED-4. Candidate Data Protection' },
    { id: 'ed5', title: 'ED-5. Equal Opportunity' },
    { id: 'ed6', title: 'ED-6. Verification & Approval' },
    { id: 'ed7', title: 'ED-7. Communication Standards' },
    { id: 'ed8', title: 'ED-8. AI Tools Usage' },
    { id: 'ed9', title: 'ED-9. Labor Law Compliance' },
    { id: 'ed10', title: 'ED-10. Enforcement' },
  ],
};

const TermsPage: React.FC<TermsPageProps> = ({ onNavigate, user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'terms' | 'employer'>('terms');
  const contentRef = useRef<HTMLDivElement>(null);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />

      {/* Hero */}
      <div className={`text-white py-14 ${activeTab === 'terms' ? 'bg-gradient-to-r from-blue-700 to-blue-900' : 'bg-gradient-to-r from-orange-600 to-orange-800'}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-3">
            {activeTab === 'terms' ? <FileText className="w-8 h-8 opacity-80" /> : <Building2 className="w-8 h-8 opacity-80" />}
            <span className="text-sm font-medium opacity-75 uppercase tracking-wider">Legal</span>
          </div>
          <h1 className="text-4xl font-bold mb-2">
            {activeTab === 'terms' ? 'Terms & Conditions' : 'Employer Declaration'}
          </h1>
          <p className="opacity-75 text-sm">Last updated: June 2025 · ZyncJobs Platform</p>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-0">
          {([
            { key: 'terms', label: 'User Terms & Conditions', icon: FileText },
            { key: 'employer', label: 'Employer Declaration', icon: Building2 },
          ] as const).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => { setActiveTab(key); window.scrollTo({ top: 0 }); }}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === key
                  ? key === 'terms' ? 'border-blue-600 text-blue-600' : 'border-orange-500 text-orange-500'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex gap-8">

          {/* Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-gray-200 p-4 sticky top-20">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-2">On this page</p>
              <nav className="space-y-0.5">
                {SECTIONS[activeTab].map(s => (
                  <button
                    key={s.id}
                    onClick={() => scrollTo(s.id)}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs text-gray-600 hover:bg-gray-50 hover:text-gray-900 flex items-center gap-2 group transition-colors"
                  >
                    <ChevronRight className="w-3 h-3 text-gray-300 group-hover:text-gray-500 flex-shrink-0" />
                    {s.title}
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* Content */}
          <main ref={contentRef} className="flex-1 min-w-0">
            <div className="bg-white rounded-2xl border border-gray-200 p-8 sm:p-10 space-y-10">

              {activeTab === 'terms' ? (
                <>
                  <div className="pb-6 border-b border-gray-100">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100 mb-4">
                      <Shield className="w-3 h-3" /> For Job Seekers & Candidates
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Terms of Service</h2>
                    <p className="text-gray-500 mt-1 text-sm">By registering on ZyncJobs, you agree to the following terms.</p>
                  </div>

                  <Section id="acceptance" title="1. Acceptance of Terms">
                    By registering for or using ZyncJobs ("Platform"), you ("User", "Candidate") agree to these Terms of Service. If you do not agree, you must not access or use the platform. These terms form a legally binding agreement between you and ZyncJobs.
                  </Section>

                  <Section id="eligibility" title="2. Eligibility">
                    <p className="mb-3">To use ZyncJobs as a job seeker, you must:</p>
                    <List items={[
                      'Be at least 18 years of age',
                      'Have the legal right to work in the country where you are seeking employment',
                      'Provide accurate, current, and complete information during registration',
                      'Not have been previously suspended or removed from ZyncJobs',
                    ]} />
                  </Section>

                  <Section id="account" title="3. Your Account">
                    <p className="mb-3">When you create an account on ZyncJobs:</p>
                    <List items={[
                      'You are responsible for maintaining the confidentiality of your login credentials',
                      'You must notify us immediately at support@zyncjobs.com if you suspect unauthorized access',
                      'You are responsible for all activity that occurs under your account',
                      'You may not share your account with or transfer it to any other person',
                      'You must keep your profile information accurate and up to date',
                    ]} />
                  </Section>

                  <Section id="profile" title="4. Profile & Resume Data">
                    <p className="mb-3">By submitting your profile and resume information:</p>
                    <List items={[
                      'You confirm all information in your profile and resume is truthful and accurate',
                      'You grant ZyncJobs a non-exclusive license to display your profile to registered employers',
                      'You understand that employers may view, download, and save your resume for recruitment purposes',
                      'You can update or delete your profile data at any time from your account settings',
                      'Submitting false qualifications or misleading information may result in permanent account suspension',
                    ]} />
                  </Section>

                  <Section id="datastorage" title="5. Where Your Data is Stored">
                    <p className="mb-3">When you register and use ZyncJobs, your data is securely stored on our servers. Here is exactly what gets stored and where:</p>
                    <div className="space-y-3">
                      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                        <p className="font-semibold text-blue-800 text-sm mb-2">📄 Your Resume</p>
                        <List items={[
                          'Your uploaded resume files (PDF/DOCX) are stored on ZyncJobs secure cloud servers',
                          'Resume content (skills, experience, education) is extracted and stored in your profile database',
                          'Your resume is only visible to employers you apply to — it is NOT publicly searchable',
                          'You can delete or replace your resume at any time from your profile settings',
                          'Resume data is used by our AI engine to generate job matches and skill recommendations',
                        ]} />
                      </div>
                      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                        <p className="font-semibold text-blue-800 text-sm mb-2">👤 Your Personal Details</p>
                        <List items={[
                          'Your name, email, phone number, and location are stored in our secure database',
                          'Your password is never stored in plain text — it is encrypted using bcrypt hashing',
                          'Profile details (skills, experience, education, headline) are stored and linked to your account',
                          'Your job preferences, salary expectations, and work type are stored to power job recommendations',
                          'Login activity and session tokens are stored temporarily for security purposes',
                        ]} />
                      </div>
                      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                        <p className="font-semibold text-blue-800 text-sm mb-2">📊 Your Activity Data</p>
                        <List items={[
                          'Jobs you viewed, saved, and applied to are stored to improve your recommendations',
                          'Skill assessment scores and results are stored and displayed on your profile',
                          'AI career coaching conversations are stored temporarily to maintain session context',
                          'Resume builder drafts are saved automatically to your account',
                        ]} />
                      </div>
                      <p className="text-sm text-gray-500 mt-2">You can request a full copy of your stored data or request deletion at any time by contacting <a href="mailto:privacy@zyncjobs.com" className="text-blue-600 hover:underline">privacy@zyncjobs.com</a>.</p>
                    </div>
                  </Section>

                  <Section id="dataflow" title="6. How Your Data Flows to Employers">
                    <p className="mb-3">Understanding exactly what happens when you apply for a job or when an employer views your profile:</p>
                    <div className="space-y-3">
                      <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                        <p className="font-semibold text-green-800 text-sm mb-2">✅ When You Apply for a Job</p>
                        <List items={[
                          'Your name, email, resume, and profile details are shared with that specific employer only',
                          'The employer receives your application through the ZyncJobs platform — your direct contact details are shared only if you choose to include them',
                          'Your AI match score for that job is visible to the employer to help them evaluate your fit',
                          'Your skill assessment results (if any) are visible to the employer on your profile',
                          'The employer can view, download, and save your resume for their recruitment process',
                        ]} />
                      </div>
                      <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4">
                        <p className="font-semibold text-yellow-800 text-sm mb-2">⚠️ What Employers Can See</p>
                        <List items={[
                          'Your full profile — name, headline, skills, experience, education, and resume',
                          'Your application status and cover letter (if submitted)',
                          'Your skill assessment badges and scores',
                          'Your AI job match percentage for their specific job posting',
                          'Employers CANNOT see your applications to other companies',
                        ]} />
                      </div>
                      <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                        <p className="font-semibold text-red-800 text-sm mb-2">🚫 What Employers Cannot Do</p>
                        <List items={[
                          'Employers cannot access your data unless you have applied to their job posting',
                          'Employers cannot share your data with other companies or third parties',
                          'Employers cannot contact you outside ZyncJobs without your consent',
                          'Employers cannot see your password, payment details, or private messages with other employers',
                        ]} />
                      </div>
                      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                        <p className="font-semibold text-blue-800 text-sm mb-2">📋 When You Post a Job (Employer)</p>
                        <List items={[
                          'Your job posting details — title, description, requirements, salary, and location — are published on ZyncJobs',
                          'Your company name, logo, and profile are displayed alongside the job posting',
                          'The job posting is visible to all registered candidates and public visitors on ZyncJobs',
                          'Candidates who apply will have their profile and resume sent to your employer dashboard',
                          'Your company contact email is NOT publicly displayed — all communication goes through ZyncJobs messaging',
                        ]} />
                      </div>
                    </div>
                  </Section>

                  <Section id="applications" title="7. Job Applications">
                    <p className="mb-3">When applying for jobs through ZyncJobs:</p>
                    <List items={[
                      'You authorize ZyncJobs to share your application and profile with the relevant employer',
                      'ZyncJobs does not guarantee job placement, interviews, or employment outcomes',
                      'You are solely responsible for the accuracy of your application content',
                      'ZyncJobs is not a party to any employment agreement between you and an employer',
                      'You must not apply for jobs you are not legally eligible for',
                    ]} />
                  </Section>

                  <Section id="ai" title="8. AI-Powered Features">
                    <p className="mb-3">ZyncJobs offers AI tools including resume scoring, skill assessments, job matching, and career coaching. By using these features:</p>
                    <List items={[
                      'AI-generated suggestions are for guidance only and not professional career advice',
                      'Your resume and profile data may be processed by AI models to generate recommendations',
                      'AI match scores are indicative and not a guarantee of job suitability',
                      'You retain full ownership of content you create using our AI tools',
                      'ZyncJobs is not liable for decisions made based on AI-generated outputs',
                    ]} />
                  </Section>

                  <Section id="assessments" title="9. Skill Assessments">
                    Skill assessment results are generated for self-evaluation and profile enhancement. Assessment scores displayed on your profile are visible to employers. You must not attempt to manipulate, cheat, or share assessment questions. ZyncJobs reserves the right to invalidate assessments if misconduct is detected.
                  </Section>

                  <Section id="conduct" title="10. Prohibited Conduct">
                    <p className="mb-3">You agree not to:</p>
                    <List items={[
                      'Create fake profiles or impersonate any person or entity',
                      'Upload malicious files, viruses, or harmful code',
                      'Scrape or harvest data from ZyncJobs without written permission',
                      'Use the platform for spam, phishing, or unsolicited communications',
                      'Attempt to gain unauthorized access to any part of the platform',
                      'Post or share offensive, discriminatory, or illegal content',
                      'Use ZyncJobs for any purpose other than legitimate job seeking',
                    ]} />
                  </Section>

                  <Section id="messaging" title="11. Messaging & Communications">
                    ZyncJobs provides messaging features to communicate with employers. You agree to use these features professionally and respectfully. Harassment, threats, or inappropriate communication will result in immediate account suspension. ZyncJobs may monitor messages for safety and compliance purposes.
                  </Section>

                  <Section id="ip" title="12. Intellectual Property">
                    All platform content including the ZyncJobs name, logo, design, software, and features are the intellectual property of ZyncJobs and protected by copyright and trademark laws. You may not reproduce, distribute, or create derivative works without our express written consent.
                  </Section>

                  <Section id="termination" title="13. Termination">
                    ZyncJobs reserves the right to suspend or permanently terminate your account at any time if you violate these terms, engage in fraudulent activity, or misuse the platform. You may also delete your account at any time from your account settings. Upon termination, your profile will be removed from employer searches.
                  </Section>

                  <Section id="liability" title="14. Limitation of Liability">
                    ZyncJobs is a job marketplace platform and is not responsible for the conduct of employers, the accuracy of job listings, or employment outcomes. To the maximum extent permitted by law, ZyncJobs shall not be liable for any indirect, incidental, or consequential damages arising from your use of the platform.
                  </Section>

                  <Section id="governing" title="15. Governing Law">
                    These Terms are governed by applicable laws. Any disputes arising from these terms shall be resolved through binding arbitration or in the courts of competent jurisdiction. ZyncJobs reserves the right to update these terms at any time with notice posted on the platform.
                  </Section>

                  <div className="pt-6 border-t border-gray-100 text-sm text-gray-500">
                    Questions? Contact us at{' '}
                    <a href="mailto:legal@zyncjobs.com" className="text-blue-600 hover:underline font-medium">legal@zyncjobs.com</a>
                    {' '}or{' '}
                    <button onClick={() => onNavigate?.('contact')} className="text-blue-600 hover:underline font-medium">Contact Page</button>.
                  </div>
                </>
              ) : (
                <>
                  <div className="pb-6 border-b border-gray-100">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-600 border border-orange-100 mb-4">
                      <Building2 className="w-3 h-3" /> For Employers & Recruiters
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Employer Declaration</h2>
                    <p className="text-gray-500 mt-1 text-sm">By registering as an employer, you agree to all terms below.</p>
                  </div>

                  <Section id="ed1" title="ED-1. Authorized Representative" accent="orange">
                    By registering as an employer on ZyncJobs, you confirm that you are a duly authorized representative of the company you are registering. You have the legal authority to bind your organization to these terms. Registering on behalf of a company you are not affiliated with is strictly prohibited and may result in legal action.
                  </Section>

                  <Section id="ed2" title="ED-2. Accuracy of Job Postings" accent="orange">
                    <p className="mb-3">You declare that all job postings, company descriptions, and role requirements you publish are:</p>
                    <List items={[
                      'Accurate, truthful, and not misleading to candidates',
                      'For genuine, existing vacancies within your organization',
                      'Free from discriminatory language based on race, gender, age, religion, or disability',
                      'Compliant with applicable employment advertising laws',
                      'Updated or removed promptly once a position is filled',
                    ]} accent="orange" />
                  </Section>

                  <Section id="ed3" title="ED-3. No Fraudulent or Deceptive Hiring" accent="orange">
                    <p className="mb-3">You explicitly declare that you will not use ZyncJobs to:</p>
                    <List items={[
                      'Post fake job listings to collect personal data from candidates',
                      'Charge candidates any fees for applying, interviewing, or being hired',
                      'Conduct advance-fee fraud, phishing, or any form of financial scam',
                      'Misrepresent your company\'s identity, size, or legitimacy',
                      'Use candidate contact information for purposes unrelated to the job applied for',
                    ]} accent="orange" />
                    <p className="mt-3 text-sm font-medium text-orange-700 bg-orange-50 border border-orange-200 rounded-lg px-4 py-3">
                      ZyncJobs has a zero-tolerance policy for fraudulent employers. Violations will result in immediate account suspension and may be reported to relevant authorities.
                    </p>
                  </Section>

                  <Section id="ed4" title="ED-4. Candidate Data Protection" accent="orange">
                    <p className="mb-3">When you access candidate profiles and resumes through ZyncJobs, you agree to:</p>
                    <List items={[
                      'Use candidate data exclusively for evaluating candidates for the specific role they applied to',
                      'Not sell, transfer, or share candidate data with third parties without explicit consent',
                      'Store and process candidate data in compliance with GDPR, PDPA, CCPA, or equivalent laws',
                      'Delete candidate data upon request or when no longer needed for recruitment',
                      'Implement reasonable security measures to protect candidate data',
                    ]} accent="orange" />
                  </Section>

                  <Section id="ed5" title="ED-5. Equal Opportunity Employment" accent="orange">
                    You confirm that your hiring practices comply with Equal Employment Opportunity (EEO) principles. You will evaluate all candidates based on their qualifications, skills, and experience — not on protected characteristics such as race, color, religion, sex, national origin, age, or disability. Discriminatory hiring practices will result in immediate account termination.
                  </Section>

                  <Section id="ed6" title="ED-6. Verification & Admin Approval" accent="orange">
                    ZyncJobs requires employer accounts to be verified before full platform access is granted. You agree to provide accurate company information during registration and cooperate with any verification process. ZyncJobs reserves the right to reject or suspend employer accounts that cannot be verified or that violate platform standards.
                  </Section>

                  <Section id="ed7" title="ED-7. Candidate Communication Standards" accent="orange">
                    <p className="mb-3">When communicating with candidates through ZyncJobs:</p>
                    <List items={[
                      'Maintain professional and respectful communication at all times',
                      'Provide timely responses and updates on application status where possible',
                      'Do not send unsolicited bulk messages or spam candidates',
                      'Do not request sensitive personal information (e.g., bank details) before a formal offer',
                    ]} accent="orange" />
                  </Section>

                  <Section id="ed8" title="ED-8. AI Matching & Ranking Tools" accent="orange">
                    ZyncJobs provides AI-powered candidate matching, ranking, and comparison tools to assist your recruitment process. These tools are advisory in nature. You are solely responsible for all final hiring decisions. ZyncJobs is not liable for any hiring outcomes based on AI-generated scores. You must not use AI ranking data to discriminate against candidates in violation of applicable law.
                  </Section>

                  <Section id="ed9" title="ED-9. Compliance with Labor Laws" accent="orange">
                    <p className="mb-3">You confirm that your company complies with all applicable labor and employment laws, including:</p>
                    <List items={[
                      'Minimum wage and compensation standards',
                      'Working hours and overtime regulations',
                      'Workplace health and safety requirements',
                      'Employee rights and benefits as required by law',
                      'Immigration and work authorization requirements for roles you post',
                    ]} accent="orange" />
                  </Section>

                  <Section id="ed10" title="ED-10. Enforcement & Consequences" accent="orange">
                    <p className="mb-3">Violations of this declaration may result in:</p>
                    <List items={[
                      'Immediate suspension or permanent ban of your employer account',
                      'Removal of all active job postings',
                      'Notification to affected candidates',
                      'Reporting to relevant regulatory or law enforcement authorities',
                      'Legal action for damages caused to candidates or ZyncJobs',
                    ]} accent="orange" />
                  </Section>

                  <div className="pt-6 border-t border-gray-100 text-sm text-gray-500">
                    Employer queries:{' '}
                    <a href="mailto:employers@zyncjobs.com" className="text-orange-500 hover:underline font-medium">employers@zyncjobs.com</a>
                    {' '}or{' '}
                    <button onClick={() => onNavigate?.('contact')} className="text-orange-500 hover:underline font-medium">Contact Page</button>.
                  </div>
                </>
              )}
            </div>
          </main>
        </div>
      </div>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};

const Section: React.FC<{ id: string; title: string; children: React.ReactNode; accent?: 'blue' | 'orange' }> = ({ id, title, children, accent = 'blue' }) => (
  <section id={id} className="scroll-mt-24">
    <h3 className={`text-lg font-bold mb-3 ${accent === 'orange' ? 'text-gray-900' : 'text-gray-900'}`}>
      <span className={`inline-block w-1 h-5 rounded-full mr-3 align-middle ${accent === 'orange' ? 'bg-orange-400' : 'bg-blue-500'}`} />
      {title}
    </h3>
    <div className="text-gray-600 leading-relaxed text-sm pl-4">{children}</div>
  </section>
);

const List: React.FC<{ items: string[]; accent?: 'blue' | 'orange' }> = ({ items, accent = 'blue' }) => (
  <ul className="space-y-2">
    {items.map((item, i) => (
      <li key={i} className="flex items-start gap-2.5">
        <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${accent === 'orange' ? 'bg-orange-400' : 'bg-blue-400'}`} />
        <span>{item}</span>
      </li>
    ))}
  </ul>
);

export default TermsPage;
