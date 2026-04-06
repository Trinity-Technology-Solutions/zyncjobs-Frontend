import React, { useState, useEffect, useRef } from 'react';
import { User, Building2, ArrowRight, Sparkles, Zap, Shield, TrendingUp, Users, Briefcase, Star } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

interface RoleSelectionPageProps {
  onNavigate: (page: string) => void;
  user: any;
  onLogout: () => void;
}

function useCounter(target: number, duration = 2000, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [start, target, duration]);
  return count;
}

const RoleSelectionPage: React.FC<RoleSelectionPageProps> = ({ onNavigate, user = null, onLogout }) => {
  const [hovered, setHovered] = useState<'candidate' | 'employer' | null>(null);
  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setStatsVisible(true);
    }, { threshold: 0.3 });
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  const users = useCounter(10000, 2000, statsVisible);
  const companies = useCounter(500, 2000, statsVisible);
  const hires = useCounter(95, 2000, statsVisible);

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #f8faff 0%, #f0f4ff 50%, #faf5ff 100%)' }}>
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />

      {/* Blob decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }} />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #f97316, transparent)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #3b82f6, transparent)' }} />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 py-16">

        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-white border border-blue-100 text-blue-600 text-xs font-semibold px-4 py-2 rounded-full mb-6 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            Join 10,000+ professionals on ZyncJobs
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-5">
            Where Tech Meets
            <span className="block" style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Talent 🚀
            </span>
          </h1>
          <p className="text-gray-500 text-lg max-w-xl mx-auto leading-relaxed">
            Connect with top companies or hire the best talent — all in one powerful platform.
          </p>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-16">

          {/* Candidate Card */}
          <div
            onMouseEnter={() => setHovered('candidate')}
            onMouseLeave={() => setHovered(null)}
            className="relative rounded-3xl p-8 flex flex-col cursor-pointer overflow-hidden transition-all duration-300"
            style={{
              background: hovered === 'candidate'
                ? 'linear-gradient(135deg, #1d4ed8, #4f46e5)'
                : 'linear-gradient(135deg, #2563eb, #6366f1)',
              boxShadow: hovered === 'candidate'
                ? '0 25px 60px -10px rgba(99,102,241,0.5)'
                : '0 10px 40px -10px rgba(99,102,241,0.3)',
              transform: hovered === 'candidate' ? 'translateY(-6px) scale(1.02)' : 'translateY(0) scale(1)',
            }}
          >
            {/* Badge */}
            <div className="absolute top-5 right-5 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full border border-white/30">
              For Candidates
            </div>

            {/* Glow */}
            <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, white, transparent)' }} />

            <div className="relative z-10 flex flex-col flex-1">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6" style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)' }}>
                <User className="w-8 h-8 text-white" />
              </div>

              <h2 className="text-2xl font-bold text-white mb-2">Tech Professionals</h2>
              <p className="text-blue-100 text-sm mb-6 leading-relaxed">
                Be seen and get hired. Create your profile and let top companies find you.
              </p>

              <div className="space-y-2 mb-8">
                {['AI-powered job matching', 'One-click easy apply', 'Resume builder included'].map((f) => (
                  <div key={f} className="flex items-center gap-2 text-blue-100 text-sm">
                    <div className="w-4 h-4 rounded-full bg-white/30 flex items-center justify-center flex-shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    </div>
                    {f}
                  </div>
                ))}
              </div>

              <button
                onClick={() => onNavigate('candidate-register')}
                className="mt-auto w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-sm transition-all duration-200"
                style={{ background: 'rgba(255,255,255,0.95)', color: '#2563eb' }}
              >
                Create Candidate Profile
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Employer Card */}
          <div
            onMouseEnter={() => setHovered('employer')}
            onMouseLeave={() => setHovered(null)}
            className="relative rounded-3xl p-8 flex flex-col cursor-pointer overflow-hidden transition-all duration-300"
            style={{
              background: hovered === 'employer'
                ? 'linear-gradient(135deg, #c2410c, #dc2626)'
                : 'linear-gradient(135deg, #f97316, #ef4444)',
              boxShadow: hovered === 'employer'
                ? '0 25px 60px -10px rgba(249,115,22,0.5)'
                : '0 10px 40px -10px rgba(249,115,22,0.3)',
              transform: hovered === 'employer' ? 'translateY(-6px) scale(1.02)' : 'translateY(0) scale(1)',
            }}
          >
            {/* Badge */}
            <div className="absolute top-5 right-5 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full border border-white/30">
              For Recruiters
            </div>

            {/* Glow */}
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, white, transparent)' }} />

            <div className="relative z-10 flex flex-col flex-1">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6" style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)' }}>
                <Building2 className="w-8 h-8 text-white" />
              </div>

              <h2 className="text-2xl font-bold text-white mb-2">Employers & Recruiters</h2>
              <p className="text-orange-100 text-sm mb-6 leading-relaxed">
                Find and hire top tech talent faster with AI-powered candidate matching.
              </p>

              <div className="space-y-2 mb-8">
                {['AI candidate ranking', 'Smart job posting tools', 'Applicant tracking system'].map((f) => (
                  <div key={f} className="flex items-center gap-2 text-orange-100 text-sm">
                    <div className="w-4 h-4 rounded-full bg-white/30 flex items-center justify-center flex-shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    </div>
                    {f}
                  </div>
                ))}
              </div>

              <button
                onClick={() => onNavigate('employer-register')}
                className="mt-auto w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-sm transition-all duration-200"
                style={{ background: 'rgba(255,255,255,0.95)', color: '#ea580c' }}
              >
                Create Employer Profile
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div ref={statsRef} className="max-w-3xl mx-auto mb-12">
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 px-8 py-6 grid grid-cols-3 gap-6">
            {[
              { icon: Users, value: users, suffix: '+', label: 'Users', color: '#3b82f6' },
              { icon: Briefcase, value: companies, suffix: '+', label: 'Companies', color: '#f97316' },
              { icon: Star, value: hires, suffix: '%', label: 'Success Rate', color: '#6366f1' },
            ].map(({ icon: Icon, value, suffix, label, color }) => (
              <div key={label} className="text-center">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2" style={{ background: `${color}15` }}>
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {value.toLocaleString()}{suffix}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Sign in link */}
        <div className="text-center">
          <p className="text-gray-500 text-sm">
            Already have an account?{' '}
            <button onClick={() => onNavigate('login')} className="font-semibold text-blue-600 hover:text-blue-700 underline underline-offset-2">
              Sign in
            </button>
          </p>
        </div>

      </div>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default RoleSelectionPage;
