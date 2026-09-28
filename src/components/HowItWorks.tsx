import React, { useEffect, useRef, useState } from 'react';
import { Search, Check, Sparkles, MapPin, Zap, Briefcase, CalendarClock, Clock, ChevronLeft, ChevronRight, Bookmark, TrendingUp, BadgeCheck, Video } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import WorkButton from './animata/button/work-button';

interface HowItWorksProps {
  onNavigate?: (page: string) => void;
}

const steps = [
  {
    id: '01',
    title: 'Create Your Free Account',
    page: 'candidate-register',
    cta: 'Create Free Account',
    desc: 'Sign up in seconds to save jobs, track applications and unlock AI-powered recommendations built around your skills.',
    bullets: [
      'Free signup in under 30 seconds',
      'Save jobs & track applications',
      'AI-personalized job recommendations',
    ],
    gradient: 'from-slate-50 via-slate-50 to-slate-100',
    glow: 'bg-blue-400',
    chipBg: 'bg-blue-600',
  },
  {
    id: '02',
    title: 'Search AI-Matched Jobs',
    page: 'job-listings',
    cta: 'Search Jobs',
    desc: 'Explore thousands of opportunities matched to your skills, location and preferences — with a match score on every job.',
    bullets: [
      'AI-matched roles for your skills',
      'Filter by location, salary & job type',
      'Smart match score on every job',
    ],
    gradient: 'from-slate-50 via-slate-50 to-slate-100',
    glow: 'bg-violet-400',
    chipBg: 'bg-violet-600',
  },
  {
    id: '03',
    title: 'Build a Standout Resume',
    page: 'resume-builder',
    cta: 'Build My Resume',
    desc: 'Create or upload your resume with our AI builder. Get an instant ATS score and clear steps to improve it.',
    bullets: [
      'AI builder or instant upload',
      'Instant ATS score & improvement tips',
      'Tailor resumes per application',
    ],
    gradient: 'from-slate-50 via-slate-50 to-slate-100',
    glow: 'bg-cyan-400',
    chipBg: 'bg-cyan-600',
  },
  {
    id: '04',
    title: 'Apply & Track in Real-Time',
    page: 'job-listings',
    cta: 'Start Applying',
    desc: 'One-click apply, then watch your application move through every stage — with notifications at each step.',
    bullets: [
      'One-click apply',
      'Real-time status tracking',
      'Notifications at every stage',
    ],
    gradient: 'from-slate-50 via-slate-50 to-slate-100',
    glow: 'bg-orange-400',
    chipBg: 'bg-orange-500',
  },
];

const HowItWorks: React.FC<HowItWorksProps> = ({ onNavigate }) => {
  const [progress, setProgress] = useState(0);
  const [isDesktop, setIsDesktop] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const ticking = useRef(false);

  useEffect(() => {
    const checkScreen = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    checkScreen();
    window.addEventListener('resize', checkScreen);
    return () => window.removeEventListener('resize', checkScreen);
  }, []);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const update = () => {
      const rect = el.getBoundingClientRect();
      const headerOffset = window.innerWidth >= 1024 ? 96 : window.innerWidth >= 640 ? 80 : 64;
      const stickyHeight = window.innerHeight - headerOffset;
      const total = el.offsetHeight - stickyHeight;
      if (total <= 0) { ticking.current = false; return; }

      const scrolled = headerOffset - rect.top;
      const p = Math.min(1, Math.max(0, scrolled / total));
      setProgress(p);
      ticking.current = false;
    };

    const onScroll = () => {
      if (!ticking.current) {
        ticking.current = true;
        requestAnimationFrame(update);
      }
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  // Equal 25% distribution across all 4 steps so Step 04 has a stable, clear scroll window
  const frac = progress * steps.length;
  const active = Math.min(steps.length - 1, Math.floor(frac));
  const step = steps[active];
  const fracFrac = frac - Math.floor(frac);
  const parallax = isDesktop ? (0.5 - fracFrac) * 20 : 0;

  const goToStep = (i: number) => {
    const clamped = Math.max(0, Math.min(steps.length - 1, i));
    const el = sectionRef.current;
    if (!el) return;
    const headerOffset = window.innerWidth >= 1024 ? 96 : window.innerWidth >= 640 ? 80 : 64;
    const stickyHeight = window.innerHeight - headerOffset;
    const total = el.offsetHeight - stickyHeight;
    if (total <= 0) return;

    const targetProgress = (clamped + 0.5) / steps.length;
    const elTopDoc = window.scrollY + el.getBoundingClientRect().top;
    const targetY = elTopDoc - headerOffset + (targetProgress * total);
    window.scrollTo({ top: targetY, behavior: 'smooth' });
  };

  return (
    <section id="how-it-works" className="relative bg-slate-50 overflow-x-clip border-y border-slate-200/70">

      {/* 1. Section header in standard document flow — fades out cleanly once steps pin */}
      <div
        className="relative pt-10 sm:pt-12 lg:pt-16 pb-4 sm:pb-5 lg:pb-6 text-center px-4 max-w-4xl mx-auto z-10 transition-opacity duration-200"
        style={{
          opacity: Math.max(0, 1 - progress * 8),
          pointerEvents: progress > 0.05 ? 'none' : 'auto',
          visibility: progress > 0.12 ? 'hidden' : 'visible',
        }}
      >
        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-2 sm:mb-3 tracking-tight leading-tight">
          Your Dream Job is Just <span className="text-orange-500">4 Steps</span> Away
        </h2>
        <p className="text-gray-600 max-w-xl mx-auto text-xs sm:text-sm md:text-base lg:text-lg leading-relaxed">
          Scroll to walk through your journey — watch every step come alive as you move.
        </p>
      </div>

      {/* 2. Scroll-driven Step Showcase Track */}
      <div
        ref={sectionRef}
        className="relative"
        style={{ height: `${steps.length * 90}vh` }}
      >
        <div
          className="sticky z-20 flex flex-col justify-center overflow-hidden"
          style={{
            top: 'var(--header-h, 64px)',
            height: 'calc(100dvh - var(--header-h, 64px))',
          }}
        >

          {/* Background gradient layers */}
          {steps.map((t, i) => (
            <div
              key={t.id}
              className={`absolute inset-0 bg-gradient-to-br ${t.gradient} transition-opacity duration-700 pointer-events-none`}
              style={{ opacity: i === active ? 1 : 0 }}
            >
            </div>
          ))}

          {/* Step Navigation Bar for Mobile & Tablet */}
          <div className="lg:hidden relative z-20 flex items-center justify-between gap-2 max-w-md mx-auto w-full px-4 pt-3 sm:pt-4 mb-2 flex-shrink-0">
            <span className="text-gray-600 text-xs font-bold uppercase tracking-wider">
              Step {step.id} / 0{steps.length}
            </span>
            <div className="flex gap-1.5 items-center">
              {steps.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => goToStep(i)}
                  aria-label={`Go to step ${s.id}: ${s.title}`}
                  className="py-1 px-0.5 cursor-pointer focus:outline-none"
                >
                  <span
                    className={`block h-1.5 sm:h-2 rounded-full transition-all duration-300 ${
                      i === active
                        ? 'w-7 sm:w-8 bg-blue-600 shadow-xs'
                        : i < active
                          ? 'w-3 sm:w-4 bg-blue-400'
                          : 'w-3 sm:w-4 bg-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Changing content — steps */}
          <div className="relative z-10 flex-1 min-h-0 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 xl:pr-48 py-2 sm:py-4 lg:py-6 flex items-center justify-center overflow-y-auto lg:overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="w-full grid md:grid-cols-2 gap-4 sm:gap-6 lg:gap-10 items-center transform scale-100 lg:scale-90 xl:scale-95 origin-top"
              >

                {/* Step indicator — desktop */}
                <div className="hidden lg:flex items-center gap-3 lg:col-span-2 mb-1">
                  <span className="text-gray-500 text-xs font-bold uppercase tracking-[0.2em]">
                    Step {step.id} / {steps.length}
                  </span>
                  <div className="flex gap-1.5 items-center">
                    {steps.map((s, i) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => goToStep(i)}
                        aria-label={`Go to step ${s.id}: ${s.title}`}
                        className="py-1 cursor-pointer focus:outline-none"
                      >
                        <span
                          className={`block h-1.5 rounded-full transition-all duration-300 ${
                            i === active
                              ? 'w-8 bg-blue-600'
                              : i < active
                                ? 'w-4 bg-blue-600/40'
                                : 'w-4 bg-gray-900/10'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Left — text */}
                <div className="relative overflow-hidden sm:overflow-visible w-full max-w-lg mx-auto md:max-w-none">
                  <span className="absolute -top-4 sm:-top-6 lg:-top-8 -left-2 lg:-left-6 text-[55px] sm:text-[90px] lg:text-[140px] font-black text-blue-900/5 leading-none select-none pointer-events-none">
                    {step.id}
                  </span>

                  <div className="relative flex items-start gap-2.5 sm:gap-3 lg:gap-4">
                    <span className={`w-9 h-9 sm:w-11 sm:h-11 lg:w-13 lg:h-13 rounded-xl sm:rounded-2xl ${step.chipBg} flex items-center justify-center text-sm sm:text-base lg:text-lg font-black text-white shadow-md sm:shadow-lg shadow-black/10 ring-2 sm:ring-4 ring-white/70 flex-shrink-0`}>
                      {step.id}
                    </span>
                    <div className="pt-0.5 min-w-0 flex-1">
                      <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400 mb-0.5">
                        Step {step.id}
                      </p>
                      <h3 className="text-lg sm:text-2xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-900 leading-tight sm:leading-tight">
                        {step.title}
                      </h3>
                      <span className={`mt-1 sm:mt-1.5 block h-0.5 sm:h-1 w-8 sm:w-12 rounded-full bg-gradient-to-r ${step.chipBg} to-white/40`} />
                    </div>
                  </div>

                  <p className="relative mt-2 sm:mt-3 lg:mt-4 text-gray-600 text-xs sm:text-sm lg:text-base leading-relaxed max-w-lg">
                    {step.desc}
                  </p>

                  <ul className="relative mt-2.5 sm:mt-4 lg:mt-5 space-y-1.5 sm:space-y-2">
                    {step.bullets.map((b, idx) => (
                      <li
                        key={b}
                        className={`items-center gap-2 sm:gap-2.5 rounded-lg sm:rounded-xl bg-white/80 backdrop-blur-xs border border-gray-100 shadow-xs px-2.5 sm:px-3.5 py-1.5 sm:py-2 ${
                          idx === 2 ? 'hidden sm:flex' : 'flex'
                        }`}
                      >
                        <span className={`w-4 h-4 sm:w-4.5 sm:h-4.5 min-w-[16px] min-h-[16px] sm:min-w-[18px] sm:min-h-[18px] rounded-full ${step.chipBg} flex items-center justify-center flex-shrink-0`}>
                          <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                        </span>
                        <span className="text-xs sm:text-sm lg:text-[15px] font-medium text-gray-800 leading-normal truncate">{b}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="relative mt-3 sm:mt-5 lg:mt-6 flex items-center gap-3 sm:gap-4">
                    <WorkButton
                      size="sm"
                      text={step.cta}
                      onClick={() => onNavigate?.(step.page)}
                      className="sm:hidden"
                    />
                    <WorkButton
                      size="md"
                      text={step.cta}
                      onClick={() => onNavigate?.(step.page)}
                      className="hidden sm:inline-flex"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => goToStep(active - 1)}
                        disabled={active === 0}
                        aria-label="Previous step"
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-gray-300 bg-white/80 backdrop-blur-md flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-white shadow-xs transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => goToStep(active + 1)}
                        disabled={active === steps.length - 1}
                        aria-label="Next step"
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-gray-300 bg-white/80 backdrop-blur-md flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-white shadow-xs transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 cursor-pointer"
                      >
                        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right / Stacked — app window mockup */}
                <div
                  className="relative w-full max-w-sm sm:max-w-md md:max-w-none mx-auto justify-self-center md:justify-self-end mt-3 sm:mt-4 md:mt-0"
                  style={isDesktop ? { transform: `translateY(${parallax}px)`, transition: 'transform 0.1s ease-out' } : undefined}
                >
                  <div className="transform scale-[0.88] sm:scale-95 md:scale-90 lg:scale-95 xl:scale-100 origin-top">
                    <div className="absolute -top-10 -left-6 w-44 h-44 bg-white/50 rounded-full blur-3xl" />

                    <div className="rounded-2xl sm:rounded-3xl bg-white ring-1 ring-black/5 shadow-xl sm:shadow-2xl shadow-gray-300/60 overflow-hidden">
                      <div className="flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 bg-gray-50 border-b border-gray-100">
                        <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-400" />
                        <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-amber-400" />
                        <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-400" />
                        <span className="ml-2 sm:ml-3 h-5 sm:h-6 flex-1 max-w-[200px] sm:max-w-[220px] rounded-md bg-white border border-gray-200 flex items-center justify-center text-[9px] sm:text-[10px] text-gray-400">
                          zyncjobs.com
                        </span>
                      </div>
                      <div className="bg-gradient-to-br from-gray-50 via-white to-gray-50 p-2.5 sm:p-4 lg:p-6">
                        <StepMockup index={active} />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Vertical step rail — desktop */}
          <div className="absolute right-6 2xl:right-10 top-1/2 -translate-y-1/2 hidden xl:flex flex-col items-start gap-0 z-20">
            <div className="relative flex flex-col items-start gap-5 2xl:gap-6">
              <div className="absolute left-[15px] top-3 bottom-3 w-0.5 bg-gray-900/10 rounded-full" />
              <div
                className="absolute left-[15px] top-3 w-0.5 bg-gradient-to-b from-blue-600 to-violet-600 rounded-full transition-all duration-300"
                style={{ height: `calc((100% - 24px) * ${(active + 1) / steps.length})` }}
              />
              {steps.map((s, i) => {
                const done = i < active;
                const current = i === active;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => goToStep(i)}
                    className="relative flex items-center gap-3 group cursor-pointer focus:outline-none"
                  >
                    <span
                      className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300 ${
                        current
                          ? 'bg-gradient-to-br from-blue-600 to-violet-600 border-white text-white shadow-lg scale-110'
                          : done
                            ? 'bg-blue-600 text-white border-white shadow'
                            : 'bg-white/80 text-gray-500 border-gray-300 group-hover:border-gray-400'
                      }`}
                    >
                      {done ? <Check className="w-4 h-4" /> : s.id}
                    </span>
                    <span className={`text-xs 2xl:text-sm font-semibold transition-colors ${current ? 'text-gray-900' : done ? 'text-gray-700' : 'text-gray-400'}`}>
                      {s.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes stepIn {
          from { opacity: 0; transform: translateY(30px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .step-in { animation: stepIn 0.7s cubic-bezier(0.22, 1, 0.36, 1) both; }
        .step-in-delay { animation: stepIn 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.12s both; }
      `}</style>
    </section>
  );
};

/* ── Lightweight UI mockups (no images) — industry-grade fidelity ── */

const StepMockup: React.FC<{ index: number }> = ({ index }) => {
  switch (index) {
    case 0: return <SignupMockup />;
    case 1: return <SearchMockup />;
    case 2: return <ResumeMockup />;
    default: return <ApplyMockup />;
  }
};

const mockupCard = 'rounded-xl sm:rounded-2xl bg-white border border-gray-200/90 p-3 sm:p-4 lg:p-5 w-full max-w-md mx-auto';
const field = 'h-8 sm:h-9 lg:h-10 rounded-lg bg-gray-50 border border-gray-200 px-2.5 sm:px-3 flex items-center gap-2 text-xs text-gray-500';
const miniBtn = 'px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md text-[10px] sm:text-[11px] font-semibold transition-colors';

const SignupMockup = () => (
  <div className={mockupCard}>
    <div className="flex items-center gap-2.5 sm:gap-3 mb-3 sm:mb-4">
      <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center shadow-md shadow-blue-600/20 flex-shrink-0">
        <Sparkles className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-white" />
      </span>
      <div>
        <p className="text-xs sm:text-sm font-bold text-gray-900 leading-tight">Create your free account</p>
        <p className="text-[10px] sm:text-[11px] text-gray-400">No credit card required</p>
      </div>
    </div>
    <div className="space-y-2 sm:space-y-2.5">
      <div>
        <p className="text-[9px] sm:text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-0.5 sm:mb-1">Full name</p>
        <div className={field}>Karthik R</div>
      </div>
      <div>
        <p className="text-[9px] sm:text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-0.5 sm:mb-1">Email address</p>
        <div className={field}>karthik@email.com</div>
      </div>
      <div className="hidden sm:block">
        <p className="text-[9px] sm:text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-0.5 sm:mb-1">Password</p>
        <div className={field}>••••••••</div>
      </div>
    </div>
    <div className="mt-3 sm:mt-4 rounded-full bg-gradient-to-r from-blue-600 to-violet-600 text-white text-xs sm:text-sm font-semibold py-2 sm:py-2.5 text-center shadow-md sm:shadow-lg shadow-blue-600/25">
      Create Account
    </div>
    <p className="mt-2 sm:mt-3 text-center text-[10px] sm:text-[11px] text-gray-400">
      Already have an account? <span className="text-blue-600 font-semibold">Log in</span>
    </p>
    <div className="mt-2.5 sm:mt-4 pt-2 sm:pt-3 border-t border-gray-100 flex items-center justify-center gap-2">
      <div className="flex -space-x-1.5">
        <img src="/images/women.png" alt="New member" className="w-4 h-4 sm:w-5 sm:h-5 rounded-full border border-white object-cover object-top" />
        <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full border border-white bg-gradient-to-br from-violet-500 to-purple-600 text-[7px] sm:text-[8px] font-bold text-white flex items-center justify-center">K</span>
        <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full border border-white bg-gradient-to-br from-orange-400 to-rose-500 text-[7px] sm:text-[8px] font-bold text-white flex items-center justify-center">R</span>
      </div>
      <span className="text-[10px] sm:text-[11px] text-gray-500">Join <b className="text-gray-800">thousands</b> of job seekers</span>
    </div>
  </div>
);

const SearchMockup = () => {
  const jobs = [
    { role: 'Frontend Developer', company: 'Zync Labs', loc: 'Chennai', salary: '₹12-18 LPA', match: '96%', logo: null },
    { role: 'React Engineer', company: 'L&T Infotech', loc: 'Remote', salary: '₹10-15 LPA', match: '92%', logo: '/images/company-logos/lt-logo.png' },
    { role: 'UI Developer', company: 'Nambikkai', loc: 'Bengaluru', salary: '₹8-12 LPA', match: '89%', logo: '/images/company-logos/nambikkai-logo.png' },
  ];
  return (
    <div className={`${mockupCard} max-w-lg`}>
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <p className="text-xs sm:text-sm font-bold text-gray-900">2,340 jobs found</p>
        <span className="text-[10px] sm:text-[11px] text-gray-400 flex items-center gap-1">
          <TrendingUp className="w-3 h-3 text-emerald-500" /> Updated 2m ago
        </span>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-1 sm:p-1.5 flex items-center gap-2 shadow-xs">
        <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 ml-1.5 flex-shrink-0" />
        <span className="text-[11px] sm:text-xs text-gray-400 flex-1 truncate">Frontend developer in Chennai</span>
        <span className="rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-2 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-semibold text-white shadow-xs flex-shrink-0">Search</span>
      </div>
      <div className="flex gap-1 sm:gap-1.5 mt-2 sm:mt-3">
        {['All', 'Remote', 'Full-time', '₹10L+'].map((f, i) => (
          <span key={f} className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-semibold ${i === 0 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>{f}</span>
        ))}
      </div>
      <div className="mt-2.5 sm:mt-3.5 space-y-2 sm:space-y-2.5">
        {jobs.map((j, idx) => (
          <div key={j.role} className={`rounded-xl border border-gray-100 bg-gray-50/60 p-2 sm:p-2.5 lg:p-3 items-center gap-2.5 sm:gap-3 ${idx === 2 ? 'hidden sm:flex' : 'flex'}`}>
            {j.logo ? (
              <img src={j.logo} alt={`${j.company} logo`} className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg object-contain bg-white border border-gray-200 p-1 flex-shrink-0" />
            ) : (
              <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-xs">
                {j.company[0]}
              </span>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-xs sm:text-[13px] font-bold text-gray-900 truncate">{j.role}</p>
                <BadgeCheck className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
              </div>
              <p className="text-[10px] sm:text-[11px] text-gray-500 flex items-center gap-1 truncate">
                <Briefcase className="w-3 h-3" /> {j.company} <span className="text-gray-300">•</span>
                <MapPin className="w-3 h-3" /> {j.loc} <span className="text-gray-300">•</span> {j.salary}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              <span className="rounded-full bg-emerald-50 text-emerald-600 text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5">
                {j.match} match
              </span>
              <button className={`${miniBtn} bg-blue-600 text-white hover:bg-blue-700`}>Apply</button>
            </div>
            <Bookmark className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-300 flex-shrink-0 hidden sm:block" />
          </div>
        ))}
      </div>
    </div>
  );
};

const ResumeMockup = () => {
  const R = 24;
  const C = 2 * Math.PI * R;
  const score = 85;
  const skills = [
    { name: 'JavaScript', pct: 90 },
    { name: 'React', pct: 85 },
    { name: 'TypeScript', pct: 72 },
  ];
  const tips = [
    { text: 'Strong professional summary', ok: true },
    { text: '5 target keywords found', ok: true },
    { text: 'Add 2 more skills to boost ATS', ok: false },
  ];
  return (
    <div className={mockupCard}>
      {/* Top purple/indigo header banner */}
      <div className="relative -mx-3 sm:-mx-4 lg:-mx-5 -mt-3 sm:-mt-4 lg:-mt-5 h-12 sm:h-14 lg:h-16 rounded-t-xl sm:rounded-t-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600">
        <span className="absolute top-2.5 sm:top-3 right-3 sm:right-4 text-white/80 text-[9px] sm:text-[10px] font-semibold flex items-center gap-1">
          <Sparkles className="w-3 h-3" /> Premium resume
        </span>
      </div>

      {/* Candidate profile avatar row overlapping the header */}
      <div className="relative z-10 flex items-center gap-2.5 sm:gap-3 -mt-6 sm:-mt-7 mb-3 sm:mb-4">
        <div className="relative z-20 shrink-0">
          <img
            src="/images/women.png"
            alt="Candidate profile"
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover object-top shrink-0 ring-3 sm:ring-4 ring-white shadow-md"
          />
        </div>
        <div className="pt-3 sm:pt-4">
          <p className="text-xs sm:text-sm font-bold text-gray-900 leading-tight">Priya S</p>
          <p className="text-[10px] sm:text-[11px] text-gray-400">Frontend Developer • 4 yrs exp</p>
        </div>
        <span className="ml-auto mt-3 sm:mt-4 rounded-full bg-blue-50 text-blue-600 text-[9px] sm:text-[10px] font-bold px-2 sm:px-2.5 py-0.5 sm:py-1">ATS Ready</span>
      </div>
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div>
          <p className="text-xs sm:text-sm font-bold text-gray-900">Resume ATS Score</p>
          <p className="text-[10px] sm:text-[11px] text-gray-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-violet-500" /> AI-powered analysis
          </p>
        </div>
        <div className="relative w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16">
          <svg viewBox="0 0 64 64" className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 -rotate-90">
            <circle cx="32" cy="32" r={R} fill="none" stroke="#e5e7eb" strokeWidth="6" />
            <circle
              cx="32" cy="32" r={R} fill="none"
              stroke="url(#atsGrad)" strokeWidth="6" strokeLinecap="round"
              strokeDasharray={C} strokeDashoffset={C * (1 - score / 100)}
            />
            <defs>
              <linearGradient id="atsGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#f59e0b" />
              </linearGradient>
            </defs>
          </svg>
          <span className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-sm sm:text-base font-bold text-gray-900 leading-none">{score}</span>
            <span className="text-[7px] sm:text-[8px] text-gray-400 font-semibold mt-0.5">/100</span>
          </span>
        </div>
      </div>
      <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
        {skills.map((s) => (
          <div key={s.name}>
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[10px] sm:text-[11px] font-semibold text-gray-600">{s.name}</span>
              <span className="text-[9px] sm:text-[10px] text-gray-400 font-medium">{s.pct}%</span>
            </div>
            <div className="h-1 sm:h-1.5 rounded-full bg-gray-100 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500" style={{ width: `${s.pct}%` }} />
            </div>
          </div>
        ))}
      </div>
      <div className="space-y-1.5 sm:space-y-2">
        {tips.map((t, idx) => (
          <div key={t.text} className={`items-center gap-2 sm:gap-2.5 rounded-lg bg-gray-50 border border-gray-100 px-2.5 sm:px-3 py-1.5 sm:py-2 ${idx === 2 ? 'hidden sm:flex' : 'flex'}`}>
            {t.ok ? (
              <span className="w-4 h-4 sm:w-4.5 sm:h-4.5 min-w-[16px] min-h-[16px] sm:min-w-[18px] sm:min-h-[18px] rounded-full bg-emerald-100 flex items-center justify-center">
                <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-600" />
              </span>
            ) : (
              <span className="w-4 h-4 sm:w-4.5 sm:h-4.5 min-w-[16px] min-h-[16px] sm:min-w-[18px] sm:min-h-[18px] rounded-full bg-orange-100 flex items-center justify-center">
                <Zap className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-orange-500" />
              </span>
            )}
            <span className="text-[11px] sm:text-xs text-gray-600">{t.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const ApplyMockup = () => {
  const statuses = [
    { label: 'Applied', state: 'done' as const, meta: 'Aug 14' },
    { label: 'Viewed', state: 'done' as const, meta: 'Aug 15' },
    { label: 'Interview', state: 'current' as const, meta: 'Thu, 10 AM' },
    { label: 'Offer', state: 'pending' as const, meta: '—' },
  ];
  return (
    <div className={mockupCard}>
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="flex items-center gap-2 sm:gap-2.5">
          <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold shadow-xs flex-shrink-0">Z</span>
          <div>
            <p className="text-xs sm:text-[13px] font-bold text-gray-900 leading-tight">Frontend Developer</p>
            <p className="text-[10px] sm:text-[11px] text-gray-400">Zync Labs • ₹12-18 LPA</p>
          </div>
        </div>
        <span className="rounded-full bg-emerald-50 text-emerald-600 text-[9px] sm:text-[10px] font-bold px-2 sm:px-2.5 py-0.5 sm:py-1">
          In Progress
        </span>
      </div>
      <div className="flex items-center justify-between mb-2">
        {statuses.map((s, i) => (
          <React.Fragment key={s.label}>
            <div className="flex flex-col items-center gap-0.5 sm:gap-1 flex-shrink-0">
              <span className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[9px] sm:text-[10px] font-bold ${
                s.state === 'done' ? 'bg-blue-600 text-white' :
                s.state === 'current' ? 'bg-orange-500 text-white animate-pulse ring-2 sm:ring-4 ring-orange-100' :
                'bg-gray-100 text-gray-400'
              }`}>
                {s.state === 'done' ? <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> : s.state === 'current' ? '●' : i + 1}
              </span>
              <span className={`text-[8px] sm:text-[9px] font-semibold ${s.state === 'pending' ? 'text-gray-400' : 'text-gray-700'}`}>{s.label}</span>
              <span className="text-[7px] sm:text-[8px] text-gray-400 -mt-0.5">{s.meta}</span>
            </div>
            {i < statuses.length - 1 && (
              <div className={`flex-1 h-0.5 mx-0.5 sm:mx-1 mt-0.5 ${s.state === 'done' ? 'bg-blue-600' : 'bg-gray-200'}`} />
            )}
          </React.Fragment>
        ))}
      </div>
      <div className="mt-2.5 sm:mt-4 rounded-xl overflow-hidden relative">
        <img src="/images/women.png" alt="Interview video call" className="w-full h-20 sm:h-24 lg:h-28 object-cover object-top" />
        <div className="absolute inset-0 bg-gradient-to-t from-violet-900/85 via-violet-900/25 to-transparent" />
        <span className="absolute top-2 right-2 rounded-full bg-white/15 backdrop-blur-md border border-white/30 text-white text-[8px] sm:text-[9px] font-bold px-1.5 sm:px-2 py-0.5 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" /> LIVE
        </span>
        <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white/15 backdrop-blur-md border border-white/30 flex items-center justify-center flex-shrink-0">
              <Video className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
            </span>
            <div>
              <p className="text-white text-[10px] sm:text-[11px] font-bold leading-tight">Interview with Zync Labs</p>
              <p className="text-white/80 text-[8px] sm:text-[9px]">Thursday, 10:00 AM • Video call</p>
            </div>
          </div>
          <span className="rounded-full bg-white text-violet-700 text-[9px] sm:text-[10px] font-bold px-2.5 sm:px-3.5 py-1 sm:py-1.5 shadow-md">Join</span>
        </div>
      </div>
      <div className="mt-2 sm:mt-3 flex items-center gap-2 text-[9px] sm:text-[10px] text-gray-400">
        <CalendarClock className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Tracked in real-time <span className="text-gray-200">|</span> <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Notified at every stage
      </div>
    </div>
  );
};

export default HowItWorks;
