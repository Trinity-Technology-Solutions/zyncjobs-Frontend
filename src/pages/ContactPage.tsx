import React, { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Mail, Phone, MapPin, Send } from 'lucide-react';

interface ContactPageProps {
  onNavigate?: (page: string) => void;
  user?: any;
  onLogout?: () => void;
}

const ContactPage: React.FC<ContactPageProps> = ({ onNavigate, user, onLogout }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <div className="min-h-screen bg-white">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />
      
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold mb-4">Contact Us</h1>
          <p className="text-xl text-purple-100">We'd love to hear from you. Get in touch with our team.</p>
        </div>
      </div>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">


        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-blue-50 rounded-lg p-8">
            <Mail className="w-8 h-8 text-blue-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Email</h3>
            <p className="text-gray-600">support@zyncjobs.com</p>
            <p className="text-gray-600">careers@zyncjobs.com</p>
          </div>

          <div className="bg-blue-50 rounded-lg p-8">
            <Phone className="w-8 h-8 text-blue-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Phone</h3>
            <p className="text-gray-600">+1 (555) 123-4567</p>
            <p className="text-gray-600">Mon-Fri, 9AM-6PM EST</p>
          </div>

          <div className="bg-blue-50 rounded-lg p-8">
            <MapPin className="w-8 h-8 text-blue-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Address</h3>
            <p className="text-gray-600">123 Tech Street</p>
            <p className="text-gray-600">San Francisco, CA 94105</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Send us a Message</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  placeholder="How can we help?"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  placeholder="Your message..."
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                Send Message
              </button>
              {submitted && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                  Thank you! We'll get back to you soon.
                </div>
              )}
            </form>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">FAQ</h2>
            <div className="space-y-4">
              <div className="border-l-4 border-blue-600 pl-4">
                <h3 className="font-semibold text-gray-900 mb-2">What is ZyncJobs?</h3>
                <p className="text-gray-600 text-sm">ZyncJobs is an AI-powered job portal connecting tech professionals with their dream careers.</p>
              </div>
              <div className="border-l-4 border-blue-600 pl-4">
                <h3 className="font-semibold text-gray-900 mb-2">How do I create an account?</h3>
                <p className="text-gray-600 text-sm">Click on "Register" and choose whether you're a job seeker or employer. Fill in your details and you're ready to go!</p>
              </div>
              <div className="border-l-4 border-blue-600 pl-4">
                <h3 className="font-semibold text-gray-900 mb-2">Is ZyncJobs free?</h3>
                <p className="text-gray-600 text-sm">Job seekers can use ZyncJobs for free. Employers have flexible pricing plans.</p>
              </div>
              <div className="border-l-4 border-blue-600 pl-4">
                <h3 className="font-semibold text-gray-900 mb-2">How long does hiring take?</h3>
                <p className="text-gray-600 text-sm">Hiring timelines vary, but our AI matching helps accelerate the process significantly.</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default ContactPage;
