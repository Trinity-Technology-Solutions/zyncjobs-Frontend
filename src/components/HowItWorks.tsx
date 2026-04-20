import React, { useEffect, useRef, useState } from 'react';
import { Search, FileText, UserPlus, Send } from 'lucide-react';

interface HowItWorksProps {
  onNavigate?: (page: string) => void;
}

const steps = [
  {
    id: '01',
    icon: UserPlus,
    title: 'Create Account',
    desc: 'Sign up free in seconds to save jobs, track applications, and get smart AI-powered recommendations.',
    page: 'role-selection',
    gradient: 'from-blue-500 to-blue-700',
    light: 'bg-blue-50',
    text: 'text-blue-600',
    border: 'border-blue-100',
    glow: 'hover:shadow-blue-100',
  },
  {
    id: '02',
    icon: Search,
    title: 'Search Jobs',
    desc: 'Explore thousands of AI-matched opportunities tailored to your skills, location, and preferences.',
    page: 'job-listings',
    gradient: 'from-violet-500 to-purple-700',
    light: 'bg-violet-50',
    text: 'text-violet-600',
    border: 'border-violet-100',
    glow: 'hover:shadow-violet-100',
  },
  {
    id: '03',
    icon: FileText,
    title: 'Build Resume',
    desc: 'Create or upload your resume using our AI-powered builder. Get instant ATS score and improvement tips.',
    page: 'resume-builder',
    gradient: 'from-orange-500 to-orange-700',
    light: 'bg-orange-50',
    text: 'text-orange-600',
    border: 'border-orange-100',
    glow: 'hover:shadow-orange-100',
  },
  {
    id: '04',
    icon: Send,
    title: 'Apply Instantly',
    desc: 'One-click apply and track your application status in real-time. Get notified at every stage.',
    page: 'job-listings',
    gradient: 'from-emerald-500 to-green-700',
    light: 'bg-emerald-50',
    text: 'text-emerald-600',
    border: 'border-emerald-100',
    glow: 'hover:shadow-emerald-100',
  },
];

const HowItWorks: React.FC<HowItWorksProps> = ({ onNavigate }) => {
  const [visible, setVisible] = useState<boolean[]>([false, false, false, false]);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observers = cardRefs.current.map((ref, i) => {
      if (!ref) return null;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setTimeout(() => setVisible(v => { const n = [...v]; n[i] = true; return n; }), i * 120);
          } else {
            setVisible(v => { const n = [...v]; n[i] = false; return n; });
          }
        },
        { threshold: 0.15 }
      );
      obs.observe(ref);
      return obs;
    });
    return () => observers.forEach(o => o?.disconnect());
  }, []);

  return (
    <section className="py-20 bg-gradient-to-b from-white via-gray-50 to-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Heading */}
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-widest border border-blue-100 mb-4">
            How It Works
          </span>
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight">
            Your Dream Job is <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600">Just 4 Steps Away</span>
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto text-base leading-relaxed">
            From searching to applying — ZyncJobs makes your job hunt simple, smart, and fast.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">

          {/* Connector line — desktop only */}
          <div className="hidden lg:block absolute top-12 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-blue-200 via-violet-200 via-orange-200 to-emerald-200 z-0" />

          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div
                key={step.id}
                ref={el => { cardRefs.current[i] = el; }}
                onClick={() => onNavigate?.(step.page)}
                className={`relative z-10 group cursor-pointer rounded-2xl bg-white border ${step.border} p-6 shadow-sm hover:shadow-xl ${step.glow} transition-all duration-500 ${
                  visible[i] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                {/* Step number watermark */}
                <span className="absolute top-4 right-5 text-6xl font-black text-gray-100 select-none leading-none group-hover:text-gray-200 transition-colors">
                  {step.id}
                </span>

                {/* Icon */}
                <div className={`relative w-14 h-14 rounded-2xl bg-gradient-to-br ${step.gradient} flex items-center justify-center mb-5 shadow-md group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-6 h-6 text-white" />
                  {/* Dot connector */}
                  <span className={`hidden lg:block absolute -right-[calc(100%+1.5rem)] top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-gradient-to-br ${step.gradient} ${i === steps.length - 1 ? 'hidden' : ''}`} />
                </div>

                {/* Content */}
                <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-700 transition-colors">
                  {step.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {step.desc}
                </p>

                {/* Bottom accent bar */}
                <div className={`absolute bottom-0 left-6 right-6 h-0.5 rounded-full bg-gradient-to-r ${step.gradient} scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left`} />
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default HowItWorks;
