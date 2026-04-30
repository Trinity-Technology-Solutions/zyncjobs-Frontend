import React, { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BackButton from '../components/BackButton';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { API_ENDPOINTS } from '../config/env';

interface ContactPageProps {
  onNavigate?: (page: string) => void;
  user?: any;
  onLogout?: () => void;
}

const ContactPage: React.FC<ContactPageProps> = ({ onNavigate, user, onLogout }) => {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');
    try {
      const res = await fetch(`${API_ENDPOINTS.BASE_URL}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok) {
        setStatus('success');
        setFormData({ name: '', email: '', subject: '', message: '' });
      } else {
        setStatus('error');
        setErrorMsg(data.error || 'Failed to send message.');
      }
    } catch {
      setStatus('error');
      setErrorMsg('Network error. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />
      
      <div className="relative bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 text-gray-900 py-8 overflow-hidden border-b border-gray-200">
        {/* Back Button */}
        <div className="absolute top-4 left-4 z-10">
          <BackButton onClick={() => onNavigate && onNavigate('home')} className="bg-white/80 hover:bg-white text-gray-700 border-gray-300 shadow-md" />
        </div>
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='50' height='50' viewBox='0 0 50 50' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Cpath d='M25 5L30 20L45 20L35 30L40 45L25 35L10 45L15 30L5 20L20 20Z'/%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '50px 50px'
          }}></div>
        </div>
        
        {/* Floating Elements */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-purple-200/30 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-20 right-20 w-32 h-32 bg-pink-200/20 rounded-full blur-2xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-10 left-1/4 w-16 h-16 bg-indigo-200/30 rounded-full blur-lg animate-pulse delay-500"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Contact Icons */}
          <div className="flex justify-center items-center mb-4">
            <div className="flex -space-x-2">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center border border-blue-200">
                <Mail className="w-5 h-5 text-blue-600" />
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center border border-blue-200">
                <Phone className="w-5 h-5 text-blue-600" />
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center border border-blue-200">
                <MapPin className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>
          
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 text-gray-900 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Contact Us</h1>
          <p className="text-base sm:text-lg text-gray-600 mb-6">We'd love to hear from you. Get in touch with our team.</p>
          
          {/* Contact Stats */}
          <div className="flex justify-center items-center gap-4 sm:gap-8 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">24/7</div>
              <div className="text-gray-600 text-sm">Support</div>
            </div>
            <div className="w-px h-8 bg-gray-300"></div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">&lt;1hr</div>
              <div className="text-gray-600 text-sm">Response Time</div>
            </div>
            <div className="w-px h-8 bg-gray-300"></div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">99%</div>
              <div className="text-gray-600 text-sm">Satisfaction</div>
            </div>
          </div>
          
          {/* Quick Contact CTA */}
          <div className="max-w-2xl mx-auto bg-white/60 backdrop-blur-sm border border-purple-200 rounded-2xl p-6 shadow-lg">
            <p className="text-lg text-gray-700 mb-4">
              Have a question? Need support? Our team is here to help!
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a 
                href="mailto:support@zyncjobs.com"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-all border border-purple-600 flex items-center gap-2 shadow-md"
              >
                <Mail className="w-4 h-4" />
                Email Us
              </a>
            </div>
          </div>
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
            <p className="text-gray-600">+91 (044) 1234-5678</p>
            <p className="text-gray-600">Mon-Fri, 9AM-6PM IST</p>
          </div>

          <div className="bg-blue-50 rounded-lg p-8">
            <MapPin className="w-8 h-8 text-blue-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Address</h3>
            <p className="text-gray-600">#2, Avvaiyar Street</p>
            <p className="text-gray-600">Ekkatuthangal, Chennai-32, India</p>
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
                disabled={status === 'loading'}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <Send className="w-4 h-4" />
                {status === 'loading' ? 'Sending...' : 'Send Message'}
              </button>
              {status === 'success' && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                  ✅ Message sent! We'll get back to you soon.
                </div>
              )}
              {status === 'error' && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  ❌ {errorMsg}
                </div>
              )}
            </form>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">FAQ</h2>
            <div className="space-y-4">
              <div className="border-l-4 border-blue-600 pl-4">
                <h3 className="font-semibold text-gray-900 mb-2">What is ZyncJobs?</h3>
                <p className="text-gray-600 text-sm">ZyncJobs is an AI-powered job portal connecting professionals across all fields with their dream careers.</p>
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

      <Footer onNavigate={onNavigate} user={user} />
    </div>
  );
};

export default ContactPage;
