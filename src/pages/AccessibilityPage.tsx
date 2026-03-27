import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

interface AccessibilityPageProps {
  onNavigate?: (page: string) => void;
  user?: any;
  onLogout?: () => void;
}

const AccessibilityPage: React.FC<AccessibilityPageProps> = ({ onNavigate, user, onLogout }) => {
  return (
    <div className="min-h-screen bg-white">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />
      
      <div className="bg-gradient-to-r from-teal-600 to-teal-800 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold mb-4">Accessibility Statement</h1>
          <p className="text-teal-100">Our commitment to digital accessibility</p>
        </div>
      </div>
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">


        <div className="prose prose-sm max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Commitment</h2>
            <p className="text-gray-600 leading-relaxed">
              ZyncJobs is committed to ensuring digital accessibility for people with disabilities. We are continually improving the user experience for everyone and applying the relevant accessibility standards.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Accessibility Features</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Our website includes the following accessibility features:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>Keyboard navigation support throughout the site</li>
              <li>Screen reader compatibility</li>
              <li>High contrast mode support</li>
              <li>Resizable text and adjustable font sizes</li>
              <li>Alternative text for all images</li>
              <li>Descriptive link text</li>
              <li>Proper heading hierarchy</li>
              <li>Form labels and error messages</li>
              <li>Skip navigation links</li>
              <li>ARIA landmarks and roles</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">WCAG Compliance</h2>
            <p className="text-gray-600 leading-relaxed">
              ZyncJobs aims to conform to the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA standards. We regularly test our website with accessibility tools and user feedback to identify and fix accessibility issues.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Assistive Technology Support</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Our website is compatible with the following assistive technologies:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>NVDA (NonVisual Desktop Access)</li>
              <li>JAWS (Job Access With Speech)</li>
              <li>VoiceOver (macOS and iOS)</li>
              <li>Narrator (Windows)</li>
              <li>TalkBack (Android)</li>
              <li>ZoomText</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Browser and Device Support</h2>
            <p className="text-gray-600 leading-relaxed">
              ZyncJobs is accessible on:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>Chrome, Firefox, Safari, and Edge browsers</li>
              <li>Desktop, tablet, and mobile devices</li>
              <li>Various operating systems (Windows, macOS, Linux, iOS, Android)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Known Accessibility Issues</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              We are aware of the following accessibility limitations and are working to address them:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>Some embedded third-party content may not be fully accessible</li>
              <li>PDF documents may require additional accessibility features</li>
              <li>Video content requires captions and transcripts</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Accessibility Tools</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              We recommend using the following tools to enhance your browsing experience:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>Browser zoom features (Ctrl/Cmd + Plus)</li>
              <li>Operating system accessibility settings</li>
              <li>Browser extensions for accessibility</li>
              <li>Text-to-speech software</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Feedback and Improvements</h2>
            <p className="text-gray-600 leading-relaxed">
              We welcome feedback on the accessibility of ZyncJobs. If you encounter any accessibility barriers or have suggestions for improvement, please contact us. We are committed to making our website accessible to everyone.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Accessibility Support</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              If you experience any accessibility issues, please reach out to us:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>Email: accessibility@zyncjobs.com</li>
              <li>Phone: +1 (555) 123-4567</li>
              <li>Mail: 123 Tech Street, San Francisco, CA 94105</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Accessibility Resources</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              For more information about web accessibility, visit:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>Web Accessibility Initiative (WAI): www.w3.org/WAI</li>
              <li>WCAG Guidelines: www.w3.org/WAI/WCAG21/quickref</li>
              <li>WebAIM: www.webaim.org</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Last Updated</h2>
            <p className="text-gray-600">
              This Accessibility Statement was last updated in January 2025. We will continue to update this statement as we make improvements to our website's accessibility.
            </p>
          </section>
        </div>
      </main>

      <Footer onNavigate={onNavigate} user={user} />
    </div>
  );
};

export default AccessibilityPage;
