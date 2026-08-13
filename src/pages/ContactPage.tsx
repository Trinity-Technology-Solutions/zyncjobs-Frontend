import React, { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BackButton from '../components/BackButton';
import { Mail, MapPin, Send } from 'lucide-react';
import { API_ENDPOINTS } from '../config/env';

interface ContactPageProps {
  onNavigate?: (page: string) => void;
  user?: any;
  onLogout?: () => void;
}

const ContactPage: React.FC<ContactPageProps> = ({ onNavigate, user, onLogout }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const faqs = [
    { q: 'What is ZyncJobs?', a: 'ZyncJobs is an AI-powered job portal connecting professionals across all fields with their dream careers — from tech to healthcare, finance, education, and beyond.' },
    { q: 'How do I create an account?', a: 'Click on "Register" and choose whether you\'re a job seeker or employer. Fill in your details and you\'re ready to go in minutes!' },
    { q: 'Is ZyncJobs free?', a: 'Job seekers can use ZyncJobs completely for free. Employers have flexible pricing plans to suit businesses of all sizes.' },
    { q: 'How long does hiring take?', a: 'Hiring timelines vary by role, but our AI matching significantly accelerates the process by surfacing the most relevant candidates fast.' },
    { q: 'Can I apply to jobs across different industries?', a: 'Absolutely. ZyncJobs supports every industry — not just tech. Whether you are in retail, manufacturing, healthcare, or finance, we have opportunities for you.' },
    { q: 'How do I contact support?', a: 'You can reach us anytime at support@zyncjobs.com. Our team typically responds within 1 hour on business days.' },
  ];

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

      {/* Hero */}
      <div className="relative bg-gradient-to-br from-blue-50 via-orange-50 to-blue-100 text-gray-900 py-8 overflow-hidden border-b border-gray-200">
        <div className="absolute top-4 left-4 z-10">
          <BackButton fallback="/" className="bg-white/80 hover:bg-white text-gray-700 border-gray-300 shadow-md" />
        </div>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='50' height='50' viewBox='0 0 50 50' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Cpath d='M25 5L30 20L45 20L35 30L40 45L25 35L10 45L15 30L5 20L20 20Z'/%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '50px 50px'
          }}></div>
        </div>
        <div className="absolute top-10 left-10 w-20 h-20 bg-blue-200/30 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-20 right-20 w-32 h-32 bg-orange-200/30 rounded-full blur-2xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-10 left-1/4 w-16 h-16 bg-orange-100/40 rounded-full blur-lg animate-pulse delay-500"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-orange-200 shadow-lg bg-white flex items-center justify-center">
              <img src="/favicon_io/android-chrome-192x192.png" alt="ZyncJobs" className="w-12 h-12 object-contain" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">Contact Us</h1>
          <p className="text-base sm:text-lg text-gray-600 mb-6">We'd love to hear from you. Get in touch with our team.</p>

          <div className="flex justify-center items-center gap-4 sm:gap-8 mb-6">
            {[
              { value: '24/7', label: 'Support' },
              { value: '<1hr', label: 'Response Time' },
              { value: '99%', label: 'Satisfaction' },
            ].map((s, i) => (
              <React.Fragment key={s.label}>
                {i > 0 && <div className="w-px h-8 bg-gray-300"></div>}
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{s.value}</div>
                  <div className="text-gray-600 text-sm">{s.label}</div>
                </div>
              </React.Fragment>
            ))}
          </div>

          <div className="max-w-2xl mx-auto bg-white/60 backdrop-blur-sm border border-orange-200 rounded-2xl p-6 shadow-lg">
            <p className="text-lg text-gray-700 mb-4">Have a question? Need support? Our team is here to help!</p>
            <a
              href="mailto:support@zyncjobs.com"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors shadow-md"
            >
              <Mail className="w-4 h-4" />
              Email Us
            </a>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        {/* Contact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16 max-w-3xl mx-auto">
          <div className="relative bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-8 overflow-hidden text-white shadow-xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-12 translate-x-12"></div>
            <div className="relative">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                <Mail className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-3">Email Us</h3>
              <p className="text-blue-100 text-sm">support@zyncjobs.com</p>
              <p className="text-blue-100 text-sm">careers@zyncjobs.com</p>
            </div>
          </div>

          <div className="relative bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-8 overflow-hidden text-white shadow-xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-12 translate-x-12"></div>
            <div className="relative">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-3">Our Address</h3>
              <p className="text-orange-100 text-sm">#2, Avvaiyar Street</p>
              <p className="text-orange-100 text-sm">Ekkatuthangal, Chennai-32, India</p>
            </div>
          </div>
        </div>

        {/* Form + FAQ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Form */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Send us a Message</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {[
                { label: 'Name', name: 'name', type: 'text', placeholder: 'Your name' },
                { label: 'Email', name: 'email', type: 'email', placeholder: 'your@email.com' },
                { label: 'Subject', name: 'subject', type: 'text', placeholder: 'How can we help?' },
              ].map((f) => (
                <div key={f.name}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{f.label}</label>
                  <input
                    type={f.type}
                    name={f.name}
                    value={(formData as any)[f.name]}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition"
                    placeholder={f.placeholder}
                  />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition resize-none"
                  placeholder="Your message..."
                />
              </div>
              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60 font-medium"
              >
                <Send className="w-4 h-4" />
                {status === 'loading' ? 'Sending...' : 'Send Message'}
              </button>
              {status === 'success' && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center gap-2">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Message sent! We'll get back to you soon.
                </div>
              )}
              {status === 'error' && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {errorMsg}
                </div>
              )}
            </form>
          </div>

          {/* FAQ */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
            <div className="space-y-3">
              {faqs.map((faq, i) => {
                const isOpen = openFaq === i;
                const isOrange = i % 2 === 0;
                return (
                  <div
                    key={i}
                    className={`rounded-xl border transition-all ${
                      isOpen
                        ? isOrange ? 'border-orange-300 bg-orange-50' : 'border-blue-300 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : i)}
                      className="w-full flex items-center justify-between px-5 py-4 text-left"
                    >
                      <span className={`font-semibold text-sm ${isOpen ? (isOrange ? 'text-orange-600' : 'text-blue-600') : 'text-gray-900'}`}>{faq.q}</span>
                      <svg className={`w-5 h-5 flex-shrink-0 ml-4 transition-transform ${isOpen ? 'rotate-180' : ''} ${isOpen ? (isOrange ? 'text-orange-500' : 'text-blue-600') : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-4">
                        <p className="text-gray-600 text-sm leading-relaxed">{faq.a}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      <Footer onNavigate={onNavigate} user={user} />
    </div>
  );
};

export default ContactPage;
