import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

interface TermsPageProps {
  onNavigate?: (page: string) => void;
  user?: any;
  onLogout?: () => void;
}

const TermsPage: React.FC<TermsPageProps> = ({ onNavigate, user, onLogout }) => {
  return (
    <div className="min-h-screen bg-white">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />
      
      <div className="bg-gradient-to-r from-red-600 to-red-800 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold mb-4">Terms & Conditions</h1>
          <p className="text-red-100">Last updated: January 2025</p>
        </div>
      </div>
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">


        <div className="prose prose-sm max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-600 leading-relaxed">
              By accessing and using ZyncJobs, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Use License</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Permission is granted to temporarily download one copy of the materials (information or software) on ZyncJobs for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>Modifying or copying the materials</li>
              <li>Using the materials for any commercial purpose or for any public display</li>
              <li>Attempting to decompile or reverse engineer any software contained on ZyncJobs</li>
              <li>Removing any copyright or other proprietary notations from the materials</li>
              <li>Transferring the materials to another person or "mirroring" the materials on any other server</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Disclaimer</h2>
            <p className="text-gray-600 leading-relaxed">
              The materials on ZyncJobs are provided on an 'as is' basis. ZyncJobs makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Limitations</h2>
            <p className="text-gray-600 leading-relaxed">
              In no event shall ZyncJobs or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on ZyncJobs, even if ZyncJobs or an authorized representative has been notified orally or in writing of the possibility of such damage.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Accuracy of Materials</h2>
            <p className="text-gray-600 leading-relaxed">
              The materials appearing on ZyncJobs could include technical, typographical, or photographic errors. ZyncJobs does not warrant that any of the materials on its website are accurate, complete, or current. ZyncJobs may make changes to the materials contained on its website at any time without notice.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Links</h2>
            <p className="text-gray-600 leading-relaxed">
              ZyncJobs has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by ZyncJobs of the site. Use of any such linked website is at the user's own risk.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Modifications</h2>
            <p className="text-gray-600 leading-relaxed">
              ZyncJobs may revise these terms of service for its website at any time without notice. By using this website, you are agreeing to be bound by the then current version of these terms of service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Governing Law</h2>
            <p className="text-gray-600 leading-relaxed">
              These terms and conditions are governed by and construed in accordance with the laws of the United States, and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. User Responsibilities</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              As a user of ZyncJobs, you are responsible for:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>Maintaining the confidentiality of your account information</li>
              <li>Accepting responsibility for all activities that occur under your account</li>
              <li>Ensuring that all information you provide is accurate and truthful</li>
              <li>Complying with all applicable laws and regulations</li>
              <li>Not engaging in any unlawful or prohibited activities</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Intellectual Property Rights</h2>
            <p className="text-gray-600 leading-relaxed">
              All content on ZyncJobs, including text, graphics, logos, images, and software, is the property of ZyncJobs or its content suppliers and is protected by international copyright laws.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Contact Information</h2>
            <p className="text-gray-600 leading-relaxed">
              If you have any questions about these Terms & Conditions, please contact us at legal@zyncjobs.com
            </p>
          </section>
        </div>
      </main>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default TermsPage;
