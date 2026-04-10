import React, { useRef } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { ChevronRight, Shield } from 'lucide-react';

interface PrivacyPageProps {
  onNavigate?: (page: string) => void;
  user?: any;
  onLogout?: () => void;
}

const SECTIONS = [
  { id: 'who', title: '1. Who We Are' },
  { id: 'collect', title: '2. What Data We Collect' },
  { id: 'use', title: '3. How We Use Your Data' },
  { id: 'ai', title: '4. AI Processing' },
  { id: 'share', title: '5. Who We Share Data With' },
  { id: 'cookies', title: '6. Cookies & Tracking' },
  { id: 'security', title: '7. Data Security' },
  { id: 'retention', title: '8. Data Retention' },
  { id: 'rights', title: '9. Your Rights' },
  { id: 'children', title: '10. Children\'s Privacy' },
  { id: 'thirdparty', title: '11. Third-Party Links' },
  { id: 'changes', title: '12. Policy Changes' },
  { id: 'contact', title: '13. Contact Us' },
];

const PrivacyPage: React.FC<PrivacyPageProps> = ({ onNavigate, user, onLogout }) => {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />

      {/* Hero */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-800 text-white py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-3">
            <Shield className="w-8 h-8 opacity-80" />
            <span className="text-sm font-medium opacity-75 uppercase tracking-wider">Legal</span>
          </div>
          <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
          <p className="opacity-75 text-sm">Last updated: June 2025 · ZyncJobs Platform</p>
        </div>
      </div>

      {/* Tab-style bar for consistency */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-0">
          <button
            onClick={() => onNavigate?.('terms')}
            className="flex items-center gap-2 px-6 py-4 text-sm font-semibold border-b-2 border-transparent text-gray-500 hover:text-gray-700 transition-colors"
          >
            Terms & Conditions
          </button>
          <button className="flex items-center gap-2 px-6 py-4 text-sm font-semibold border-b-2 border-orange-500 text-orange-500">
            <Shield className="w-4 h-4" />
            Privacy Policy
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex gap-8">

          {/* Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-gray-200 p-4 sticky top-20">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-2">On this page</p>
              <nav className="space-y-0.5">
                {SECTIONS.map(s => (
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
          <main className="flex-1 min-w-0">
            <div className="bg-white rounded-2xl border border-gray-200 p-8 sm:p-10 space-y-10">

              <div className="pb-6 border-b border-gray-100">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-600 border border-orange-100 mb-4">
                  <Shield className="w-3 h-3" /> Your Privacy Matters
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Privacy Policy</h2>
                <p className="text-gray-500 mt-1 text-sm">This policy explains what data we collect, why we collect it, and how we protect it.</p>
              </div>

              <Section id="who" title="1. Who We Are">
                ZyncJobs ("we", "us", "our") is an AI-powered job portal that connects job seekers with employers. We are committed to protecting your personal data and being transparent about how we use it. This Privacy Policy applies to all users of the ZyncJobs platform — including candidates, employers, and visitors.
              </Section>

              <Section id="collect" title="2. What Data We Collect">
                <p className="mb-4">We collect the following categories of data depending on how you use ZyncJobs:</p>
                <div className="space-y-3">
                  {[
                    {
                      label: 'Account & Identity Data',
                      items: ['Full name, email address, and password (hashed)', 'Profile photo (if uploaded)', 'User type (candidate or employer)', 'Google OAuth profile data (if you sign in with Google)', 'LinkedIn profile data (if you connect LinkedIn)'],
                    },
                    {
                      label: 'Professional & Resume Data (Candidates)',
                      items: ['Resume files (PDF, DOCX) you upload', 'Work experience, education, and skills', 'Career summary and professional headline', 'Skill assessment scores and results', 'Job preferences, desired salary, and location', 'Application history and status'],
                    },
                    {
                      label: 'Company & Employer Data',
                      items: ['Company name, logo, and description', 'Company email and contact information', 'Job postings and hiring activity', 'Employer ID and verification status'],
                    },
                    {
                      label: 'Usage & Technical Data',
                      items: ['Pages visited, features used, and time spent', 'Search queries and job browsing history', 'IP address, browser type, and device information', 'Cookies and session tokens', 'Error logs and performance data'],
                    },
                  ].map(({ label, items }) => (
                    <div key={label} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <p className="font-semibold text-gray-800 text-sm mb-2">{label}</p>
                      <List items={items} />
                    </div>
                  ))}
                </div>
              </Section>

              <Section id="use" title="3. How We Use Your Data">
                <p className="mb-3">We use your data to:</p>
                <List items={[
                  'Create and manage your account on ZyncJobs',
                  'Match your profile with relevant job opportunities using AI',
                  'Display your profile and resume to employers you apply to',
                  'Power AI features: resume scoring, skill assessments, career coaching, and job recommendations',
                  'Send you job alerts, application updates, and platform notifications',
                  'Verify employer accounts and prevent fraudulent activity',
                  'Improve platform performance, features, and user experience',
                  'Comply with legal obligations and enforce our Terms of Service',
                ]} />
              </Section>

              <Section id="ai" title="4. AI Processing of Your Data">
                <p className="mb-3">ZyncJobs uses AI and machine learning to enhance your experience. This includes:</p>
                <List items={[
                  'Parsing and analyzing your resume to extract skills, experience, and qualifications',
                  'Generating job match scores based on your profile and job requirements',
                  'Providing personalized job recommendations and career roadmaps',
                  'Generating skill assessment questions and evaluating your responses',
                  'AI career coaching conversations (your inputs are processed to generate responses)',
                ]} />
                <p className="mt-3 text-sm bg-orange-50 border border-orange-100 rounded-lg px-4 py-3 text-orange-800">
                  We do not use your data to train third-party AI models without your explicit consent.
                </p>
              </Section>

              <Section id="share" title="5. Who We Share Your Data With">
                <p className="mb-3">We share your data only in the following circumstances:</p>
                <div className="space-y-2">
                  {[
                    ['Employers', 'When you apply for a job, your profile and resume are shared with that employer only'],
                    ['Service Providers', 'Trusted third-party services that help us operate the platform (cloud hosting, email delivery, AI APIs) — bound by confidentiality agreements'],
                    ['Legal Requirements', 'When required by law, court order, or to protect the rights and safety of users'],
                    ['Business Transfers', 'In the event of a merger or acquisition, your data may be transferred under the same privacy protections'],
                  ].map(([label, desc]) => (
                    <div key={label} className="flex gap-3 text-sm">
                      <span className="font-semibold text-gray-800 w-36 flex-shrink-0">{label}:</span>
                      <span className="text-gray-600">{desc}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-4 font-semibold text-gray-900 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm">
                  ✅ We do not sell your personal data to advertisers or data brokers. Ever.
                </p>
              </Section>

              <Section id="cookies" title="6. Cookies & Tracking">
                <p className="mb-3">ZyncJobs uses cookies and similar technologies for:</p>
                <List items={[
                  'Keeping you logged in (authentication tokens)',
                  'Remembering your preferences and settings',
                  'Analyzing platform usage to improve features',
                  'Preventing fraud and ensuring security',
                ]} />
                <p className="mt-3 text-sm text-gray-500">You can control cookies through your browser settings. Disabling cookies may affect some platform functionality such as staying logged in.</p>
              </Section>

              <Section id="security" title="7. Data Security">
                <p className="mb-3">We implement the following security measures:</p>
                <List items={[
                  'Passwords are hashed using industry-standard algorithms (bcrypt)',
                  'All data transmission is encrypted via HTTPS/TLS',
                  'Authentication tokens are short-lived and securely stored',
                  'Access to user data is restricted to authorized personnel only',
                  'Regular security audits and vulnerability assessments',
                ]} />
                <p className="mt-3 text-sm text-gray-500">If you suspect a security breach, contact us immediately at <a href="mailto:security@zyncjobs.com" className="text-orange-600 hover:underline">security@zyncjobs.com</a>.</p>
              </Section>

              <Section id="retention" title="8. Data Retention">
                <List items={[
                  'Active accounts: data retained for the duration of your account',
                  'Deleted accounts: most data is deleted within 30 days of account deletion',
                  'Application records: retained for up to 12 months for dispute resolution',
                  'Legal obligations may require us to retain certain data longer',
                ]} />
              </Section>

              <Section id="rights" title="9. Your Rights">
                <p className="mb-3">You have the following rights regarding your personal data:</p>
                <div className="space-y-2">
                  {[
                    ['Access', 'Request a copy of the personal data we hold about you'],
                    ['Correction', 'Update or correct inaccurate data in your profile settings'],
                    ['Deletion', 'Request deletion of your account and associated data'],
                    ['Portability', 'Request your data in a machine-readable format'],
                    ['Opt-out', 'Unsubscribe from marketing emails at any time'],
                    ['Restriction', 'Request we limit how we process your data in certain circumstances'],
                  ].map(([label, desc]) => (
                    <div key={label} className="flex gap-3 text-sm">
                      <span className="font-semibold text-gray-800 w-24 flex-shrink-0">{label}:</span>
                      <span className="text-gray-600">{desc}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-sm text-gray-500">To exercise any of these rights, contact <a href="mailto:privacy@zyncjobs.com" className="text-orange-600 hover:underline">privacy@zyncjobs.com</a>. We will respond within 30 days.</p>
              </Section>

              <Section id="children" title="10. Children's Privacy">
                ZyncJobs is not intended for users under the age of 18. We do not knowingly collect personal data from minors. If we become aware that a minor has registered, we will delete their account and associated data immediately. Contact <a href="mailto:privacy@zyncjobs.com" className="text-orange-600 hover:underline">privacy@zyncjobs.com</a> if you believe a minor has created an account.
              </Section>

              <Section id="thirdparty" title="11. Third-Party Links">
                ZyncJobs may contain links to external websites (e.g., company websites, LinkedIn). We are not responsible for the privacy practices of these third-party sites. We encourage you to review their privacy policies before providing any personal information.
              </Section>

              <Section id="changes" title="12. Changes to This Policy">
                We may update this Privacy Policy from time to time. We will notify you of significant changes via email or a prominent notice on the platform. The "Last updated" date at the top of this page will always reflect the most recent revision. Continued use of ZyncJobs after changes constitutes acceptance of the updated policy.
              </Section>

              <Section id="contact" title="13. Contact Us">
                <div className="space-y-2 text-sm">
                  <p>General privacy queries: <a href="mailto:privacy@zyncjobs.com" className="text-orange-600 hover:underline font-medium">privacy@zyncjobs.com</a></p>
                  <p>Security issues: <a href="mailto:security@zyncjobs.com" className="text-orange-600 hover:underline font-medium">security@zyncjobs.com</a></p>
                  <p>Contact form: <button onClick={() => onNavigate?.('contact')} className="text-orange-600 hover:underline font-medium">zyncjobs.com/contact</button></p>
                </div>
              </Section>

            </div>
          </main>
        </div>
      </div>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};

const Section: React.FC<{ id: string; title: string; children: React.ReactNode }> = ({ id, title, children }) => (
  <section id={id} className="scroll-mt-24">
    <h3 className="text-lg font-bold text-gray-900 mb-3">
      <span className="inline-block w-1 h-5 rounded-full mr-3 align-middle bg-orange-400" />
      {title}
    </h3>
    <div className="text-gray-600 leading-relaxed text-sm pl-4">{children}</div>
  </section>
);

const List: React.FC<{ items: string[] }> = ({ items }) => (
  <ul className="space-y-2">
    {items.map((item, i) => (
      <li key={i} className="flex items-start gap-2.5">
        <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 bg-orange-400" />
        <span>{item}</span>
      </li>
    ))}
  </ul>
);

export default PrivacyPage;
