import React, { useState, useEffect, useRef } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import GetStartedButton from '../components/animata/button/get-started-button';
import WorkButton from '../components/animata/button/work-button';
import { API_ENDPOINTS } from '../config/env';
import {
  Briefcase, Search, LogIn, UserPlus, ArrowRight, CheckCircle2,
  Bot, ClipboardCheck, CalendarClock, Wallet,
  Building2, Users, Zap, Target, TrendingUp, Phone, Mail,
  User, ChevronDown, ShieldCheck, Sparkles, Globe2, Award, Clock
} from 'lucide-react';

const EmployersPage = ({ onNavigate, user, onLogout }: {
  onNavigate?: (page: string) => void;
  user?: { name: string; type: 'candidate' | 'employer' } | null;
  onLogout?: () => void;
}) => {
  const isEmployer = user?.type === 'employer';

  const go = (page: string) => onNavigate && onNavigate(page);

  const scrollToCallback = () => document.getElementById('request-callback')?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div className="min-h-screen bg-white">
      <GlobalMotionStyles />
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />

      {/* ── 1. Hero — light "live" background ── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/80 via-white to-white">
        <LiveHeroBackground />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24 lg:pt-24 lg:pb-28">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            <div className="lg:col-span-7">
              <div className="hero-fade-1 inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-600 text-xs font-semibold tracking-wide uppercase px-4 py-1.5 rounded-full mb-6">
                <Sparkles className="w-3.5 h-3.5 animate-pulse-soft" />
                AI-Powered Hiring Platform
              </div>
              <h1 className="hero-fade-2 text-5xl sm:text-6xl xl:text-[4.2rem] font-extrabold text-gray-900 leading-[1.05] tracking-[-0.02em] mb-6">
                Hire the right talent,<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-violet-600 to-blue-500 bg-[length:200%_auto] animate-gradient-shift">decoded by AI</span>
              </h1>
              <p className="hero-fade-3 text-lg text-gray-500 leading-relaxed mb-8 max-w-xl">
                Post jobs, search verified candidate profiles, and let AI shortlist the best matches — across every field and industry.
              </p>
              <div className="hero-fade-4 flex flex-col sm:flex-row gap-3.5">
                <WorkButton text="Explore Our Products" onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })} />
                <button
                  onClick={scrollToCallback}
                  className="inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 text-gray-700 px-7 py-3.5 rounded-md font-semibold text-[15px] transition-all duration-200 shadow-sm hover:-translate-y-0.5 active:translate-y-0"
                >
                  <Phone className="w-4.5 h-4.5" />
                  Sales Enquiry
                </button>
                <button
                  onClick={() => go('employer-register')}
                  className="inline-flex items-center justify-center gap-2 text-blue-600 hover:text-blue-700 px-4 py-3.5 font-semibold text-[15px] transition-colors group"
                >
                  {isEmployer ? <UserPlus className="w-4.5 h-4.5" /> : <LogIn className="w-4.5 h-4.5" />}
                  {isEmployer ? 'Go to Dashboard' : 'Register / Log in'}
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
              <div className="hero-fade-5 mt-10 flex flex-wrap items-center gap-x-6 gap-y-3">
                {[
                  { icon: ShieldCheck, text: '100% verified profiles' },
                  { icon: Bot, text: 'AI-matched shortlists' },
                  { icon: Target, text: 'All fields & industries' },
                ].map((b) => (
                  <span key={b.text} className="inline-flex items-center gap-1.5 text-sm text-gray-500">
                    <b.icon className="w-4 h-4 text-blue-600" /> {b.text}
                  </span>
                ))}
              </div>
            </div>

            {/* Hero visual — quick callback form */}
            <div className="lg:col-span-5 hidden md:block">
              <HeroCallbackCard />
            </div>
          </div>
        </div>

        {/* Signature element — a live ticker of jobs being posted right now */}
        <JobTicker />

        {/* Soft seam into the next section */}
        <div className="h-6 bg-gradient-to-b from-blue-50/40 to-transparent" />
      </section>

      {/* ── Trusted by marquee ── */}
      <section className="border-b border-gray-100 bg-white pt-16 pb-10 overflow-hidden">
        <p className="text-center text-xs font-semibold tracking-[0.2em] uppercase text-gray-400 mb-8">
          Trusted by hiring teams across every industry
        </p>
        <div className="overflow-hidden">
          <div className="marquee-track">
            {[
              { name: 'Birlasoft', logo: 'https://www.google.com/s2/favicons?domain=birlasoft.com&sz=64' },
              { name: 'Persistent', logo: '/images/company-logos/persistent-favicon.svg' },
              { name: 'LTIMindtree', logo: 'https://www.google.com/s2/favicons?domain=ltm.com&sz=64' },
              { name: 'Saksoft', logo: 'https://www.google.com/s2/favicons?domain=saksoft.com&sz=64' },
              { name: 'L&T', logo: '/images/company-logos/lt-logo.png' },
              { name: 'Cognizant', logo: 'https://www.google.com/s2/favicons?domain=cognizant.com&sz=64' },
              { name: 'Accenture', logo: 'https://www.google.com/s2/favicons?domain=accenture.com&sz=64' },
            ].concat([
              { name: 'Birlasoft', logo: 'https://www.google.com/s2/favicons?domain=birlasoft.com&sz=64' },
              { name: 'Persistent', logo: '/images/company-logos/persistent-favicon.svg' },
              { name: 'LTIMindtree', logo: 'https://www.google.com/s2/favicons?domain=ltm.com&sz=64' },
              { name: 'Saksoft', logo: 'https://www.google.com/s2/favicons?domain=saksoft.com&sz=64' },
              { name: 'L&T', logo: '/images/company-logos/lt-logo.png' },
              { name: 'Cognizant', logo: 'https://www.google.com/s2/favicons?domain=cognizant.com&sz=64' },
              { name: 'Accenture', logo: 'https://www.google.com/s2/favicons?domain=accenture.com&sz=64' },
            ]).map((c, i) => (
              <div
                key={`${c.name}-${i}`}
                onMouseEnter={(e) => { (e.currentTarget.closest('.marquee-track') as HTMLElement)?.classList.add('paused'); }}
                onMouseLeave={(e) => { (e.currentTarget.closest('.marquee-track') as HTMLElement)?.classList.remove('paused'); }}
                className="flex flex-col items-center justify-center mx-7 gap-2 grayscale hover:grayscale-0 opacity-70 hover:opacity-100 transition-all duration-300"
                style={{ minWidth: '100px' }}
              >
                <div className="w-14 h-14 flex items-center justify-center">
                  <img
                    src={c.logo}
                    alt={c.name}
                    width={56}
                    height={56}
                    loading="lazy"
                    decoding="async"
                    className="w-14 h-14 object-contain"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
                <span className="text-sm font-semibold text-gray-500">{c.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 2. One-Stop Solution — product categories with sub-products ── */}
      <ProductsSection go={go} />

      {/* ── 3. What ZyncJobs offers — cards with real site previews ── */}
      <section className="py-16 lg:py-24 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <SectionHeader
              overline="What ZyncJobs offers"
              title="We handle everything. You focus on interviewing."
              sub="From sourcing and screening to scheduling — so you can focus on interviewing the best talent."
            />
          </Reveal>
          <div className="space-y-10 lg:space-y-14">
            {[
              {
                icon: Briefcase, title: 'Job Posting', target: 'job-posting-selection',
                desc: 'Receive applications and quickly connect with high-quality, relevant candidates.',
                bullets: ['AI-assisted job descriptions', 'Instant publishing & visibility', 'Applications in one dashboard'],
                variant: 'job-posting', url: 'zyncjobs.ai/job-posting',
                grad: 'from-blue-600 to-cyan-500', tile: 'bg-blue-50', text: 'text-blue-600', cta: 'Post a Job',
              },
              {
                icon: Search, title: 'Resume Database (Candidate Search)', target: 'candidate-search',
                desc: 'Access & attract from a pool of verified jobseekers — all in real time!',
                bullets: ['100% verified profiles', 'Filter by skill, experience & location', 'Save and track promising candidates'],
                variant: 'candidate-search', url: 'zyncjobs.ai/candidate-search',
                grad: 'from-violet-600 to-purple-400', tile: 'bg-violet-50', text: 'text-violet-600', cta: 'Search Candidates',
              },
              {
                icon: Bot, title: 'AI Recruiter Assistant', target: 'ai-recruiter',
                desc: 'Leave sourcing & shortlisting to our AI hiring expert, you focus on interviewing the best.',
                bullets: ['24/7 candidate sourcing', 'Automatic screening & scoring', 'Ranked shortlists in seconds'],
                variant: 'ai-recruiter', url: 'zyncjobs.ai/ai-recruiter',
                grad: 'from-orange-500 to-rose-400', tile: 'bg-orange-50', text: 'text-orange-500', cta: 'Try AI Assistant',
              },
              {
                icon: ClipboardCheck, title: 'Skill Assessments', target: 'skill-assessment',
                desc: 'Let candidates prove their skills with scored, role-specific tests.',
                bullets: ['Role-specific test libraries', 'Automatic scoring & reporting', 'Shortlist by assessment results'],
                variant: 'skill-assessment', url: 'zyncjobs.ai/skill-assessment',
                grad: 'from-emerald-500 to-teal-400', tile: 'bg-emerald-50', text: 'text-emerald-600', cta: 'Explore Assessments',
              },
              {
                icon: CalendarClock, title: 'Interview Scheduling', target: 'interviews',
                desc: 'Plan and manage interviews with one-click scheduling.',
                bullets: ['No back-and-forth emails', 'Automated confirmations & reminders', 'Built-in video meeting links'],
                variant: 'interviews', url: 'zyncjobs.ai/interviews',
                grad: 'from-cyan-500 to-sky-400', tile: 'bg-cyan-50', text: 'text-cyan-600', cta: 'Schedule Interviews',
              },
              {
                icon: Wallet, title: 'Salary Insights', target: 'salary-insights',
                desc: 'Future-proof your hiring strategy with data-driven salary benchmarks.',
                bullets: ['Real market data by role & location', 'Benchmark against industry peers', 'Confident offers every time'],
                variant: 'salary-insights', url: 'zyncjobs.ai/salary-insights',
                grad: 'from-amber-500 to-orange-400', tile: 'bg-amber-50', text: 'text-amber-500', cta: 'Explore Insights',
              },
            ].map((f, i) => (
              <Reveal key={f.title} delay={i * 60}>
                <div className="group relative grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 items-center bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-blue-100/70 hover:border-blue-200 p-6 lg:p-10 transition-all duration-500 hover:-translate-y-1.5">
                  <div className={`${i % 2 === 1 ? 'lg:order-2' : ''}`}>
                    <div className={`w-14 h-14 bg-gradient-to-br ${f.grad} rounded-2xl flex items-center justify-center mb-6 shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3`}>
                      <f.icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3 tracking-tight">{f.title}</h3>
                    <p className="text-gray-500 text-lg leading-relaxed mb-6">{f.desc}</p>
                    <ul className="space-y-3 mb-8">
                      {f.bullets.map((b) => (
                        <li key={b} className="flex items-start gap-3 text-gray-700">
                          <CheckCircle2 className={`w-5 h-5 ${f.text} flex-shrink-0 mt-0.5`} />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => go(f.target)}
                      className={`inline-flex items-center gap-2 bg-gradient-to-r ${f.grad} hover:opacity-90 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 hover:-translate-y-0.5 shadow-lg`}
                    >
                      {f.cta} <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </button>
                  </div>

                  <div className={`relative ${i % 2 === 1 ? 'lg:order-1' : ''}`}>
                    <div className={`absolute -inset-3 bg-gradient-to-br ${f.grad} opacity-10 blur-2xl rounded-3xl transition-opacity duration-500 group-hover:opacity-25`} />
                    <div className="relative bg-white rounded-2xl border border-gray-200 shadow-xl shadow-blue-100/60 overflow-hidden transition-all duration-500 group-hover:shadow-2xl group-hover:-translate-y-1.5 group-hover:rotate-0 lg:group-hover:-rotate-1">
                      <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                        <span className="ml-3 flex-1 truncate text-[11px] text-gray-400 bg-white border border-gray-100 rounded-md px-2.5 py-1 font-medium">
                          {f.url}
                        </span>
                      </div>
                      <div className="aspect-[16/10] overflow-hidden">
                        <div className="h-full transition-transform duration-700 ease-out group-hover:scale-[1.06]">
                          <SitePreview variant={f.variant} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. Hiring made simple ── */}
      <section className="py-16 lg:py-24 bg-[#F6F8FF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <SectionHeader
              overline="Built for every business"
              title="Hiring made simple for every business"
              sub="Whether you're an enterprise, an SMB, or a consultancy — there's a plan that fits."
            />
          </Reveal>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <Reveal delay={0}>
              <SegmentCard
                icon={Building2}
                grad="from-blue-600 to-cyan-500"
                title="Growing companies & enterprises"
                tagline="Scale hiring with confidence"
                points={['Fill any role, from bulk hiring to leadership', 'Get AI-powered candidate insights and market trends', 'Track hiring performance with real-time analytics']}
                cta="Request callback"
                onClick={scrollToCallback}
              />
            </Reveal>
            <Reveal delay={100}>
              <SegmentCard
                icon={Users}
                grad="from-blue-600 to-violet-600"
                title="Small & medium businesses"
                tagline="Hire locally, affordably"
                points={['Find local candidates with quick applies', 'Hire candidates with relevant industry experience', 'Start hiring with plans that deliver value']}
                cta="Explore plans"
                onClick={() => go('job-posting-selection')}
                featured
              />
            </Reveal>
            <Reveal delay={200}>
              <SegmentCard
                icon={Zap}
                grad="from-violet-600 to-purple-500"
                title="Consultants & agencies"
                tagline="Move fast with smarter tools"
                points={['Speed up hiring with faster turnaround', "Track your team's performance with data insights", 'Instantly connect with candidates via email, SMS, call']}
                cta="Request callback"
                onClick={scrollToCallback}
              />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── 5b. Testimonials — why recruiters trust us ── */}
      <section className="py-16 lg:py-24 bg-[#F6F8FF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <SectionHeader
              overline="Why recruiters trust us"
              title="Here's why recruiters trust ZyncJobs"
              sub="Testimonials from valued clients who've elevated their hiring with ZyncJobs."
            />
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                quote: 'The AI shortlists are spot on. We cut our time-to-hire by half and every shortlist candidate came interview-ready.',
                name: 'Rajesh Kumar', role: 'Talent Acquisition Lead', company: 'TechNova',
                initials: 'RK', grad: 'from-blue-600 to-cyan-500',
              },
              {
                quote: 'One dashboard for posting, screening and scheduling changed how our small team hires. The callback team is genuinely helpful.',
                name: 'Priya Venkatesan', role: 'HR Manager', company: 'Loop Studio',
                initials: 'PV', grad: 'from-violet-600 to-purple-400',
              },
              {
                quote: 'Verified profiles mean we skip the guesswork. Match scores are accurate and the assessments filter candidates perfectly.',
                name: 'Arun Prakash', role: 'Director', company: 'Finlytics',
                initials: 'AP', grad: 'from-emerald-500 to-teal-400',
              },
            ].map((t, i) => (
              <Reveal key={t.name} delay={i * 100}>
                <div className="group relative bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-blue-100/70 hover:-translate-y-1.5 transition-all duration-300 p-8 h-full flex flex-col">
                  <div className="flex gap-1 mb-5">
                    {[...Array(5)].map((_, s) => (
                      <Award key={s} className="w-4 h-4 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-gray-600 leading-relaxed text-[15px] flex-1">"{t.quote}"</p>
                  <div className="flex items-center gap-3 mt-7 pt-5 border-t border-gray-100">
                    <span className={`w-11 h-11 bg-gradient-to-br ${t.grad} rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                      {t.initials}
                    </span>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{t.name}</p>
                      <p className="text-xs text-gray-400">{t.role} · {t.company}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. Request callback ── */}
      <CallbackForm />

      {/* ── 6. FAQs ── */}
      <FAQSection go={go} />

      {/* ── Final CTA band ── */}
      <section className="bg-gradient-to-br from-blue-700 via-blue-600 to-violet-600 relative overflow-hidden">
        <div className="absolute inset-0 opacity-70" style={{ backgroundImage: 'radial-gradient(circle at 70% 30%, rgba(255,255,255,0.2) 0%, transparent 50%)' }}></div>
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-cyan-300/10 rounded-full blur-3xl animate-float-slow-alt" />
        <Reveal>
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20 text-center">
            <h2 className="text-3xl lg:text-4xl font-extrabold text-white mb-4">
              Start hiring smarter today
            </h2>
            <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
              Join thousands of companies using ZyncJobs to find and hire the right talent — faster.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <WorkButton text="Create Free Account" onClick={() => go('employer-register')} />
              <button
                onClick={scrollToCallback}
                className="inline-flex items-center justify-center gap-2 border border-white/40 text-white hover:bg-white/10 px-8 py-3.5 rounded-md font-semibold transition-all duration-200 hover:-translate-y-0.5"
              >
                <Phone className="w-4 h-4" /> Talk to Sales
              </button>
            </div>
          </div>
        </Reveal>
      </section>

      <Footer onNavigate={onNavigate} user={user} />
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   Motion primitives
   ══════════════════════════════════════════════════════════ */

/** Global keyframes shared by the page — kept in one place so nothing collides. */
function GlobalMotionStyles() {
  return (
    <style>{`
      @keyframes marquee-rtl { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
      .marquee-track { display: flex; width: max-content; animation: marquee-rtl 28s linear infinite; }
      .marquee-track.paused { animation-play-state: paused; }

      @keyframes ticker-scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
      .ticker-track { animation: ticker-scroll 22s linear infinite; }

      @keyframes gradient-shift { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
      .animate-gradient-shift { animation: gradient-shift 6s ease-in-out infinite; }

      @keyframes pulse-soft { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      .animate-pulse-soft { animation: pulse-soft 2.2s ease-in-out infinite; }

      @keyframes float-slow { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(20px, -25px); } }
      .animate-float-slow { animation: float-slow 12s ease-in-out infinite; }
      @keyframes float-slow-alt { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(-25px, 20px); } }
      .animate-float-slow-alt { animation: float-slow-alt 14s ease-in-out infinite; }

      @keyframes float-y { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
      .animate-float { animation: float-y 3.5s ease-in-out infinite; }

      @keyframes orb-drift-1 { 0%, 100% { transform: translate(0, 0) scale(1); } 33% { transform: translate(40px, -30px) scale(1.08); } 66% { transform: translate(-20px, 30px) scale(0.96); } }
      @keyframes orb-drift-2 { 0%, 100% { transform: translate(0, 0) scale(1); } 33% { transform: translate(-35px, 25px) scale(1.05); } 66% { transform: translate(25px, -20px) scale(0.98); } }
      @keyframes orb-drift-3 { 0%, 100% { transform: translate(0, 0) scale(1); } 50% { transform: translate(15px, 20px) scale(1.1); } }
      .orb-1 { animation: orb-drift-1 16s ease-in-out infinite; }
      .orb-2 { animation: orb-drift-2 20s ease-in-out infinite; }
      .orb-3 { animation: orb-drift-3 13s ease-in-out infinite; }

      @keyframes grid-pan { 0% { background-position: 0 0, 0 0; } 100% { background-position: 44px 44px, 44px 44px; } }
      .grid-pan { animation: grid-pan 6s linear infinite; }

      @keyframes particle-rise { 0% { transform: translateY(0) translateX(0); opacity: 0; } 10% { opacity: 0.7; } 90% { opacity: 0.4; } 100% { transform: translateY(-380px) translateX(var(--drift, 20px)); opacity: 0; } }
      .particle { position: absolute; animation: particle-rise linear infinite; }

      @keyframes hero-fade-up { 0% { opacity: 0; transform: translateY(16px); } 100% { opacity: 1; transform: translateY(0); } }
      .hero-fade-1, .hero-fade-2, .hero-fade-3, .hero-fade-4, .hero-fade-5 { animation: hero-fade-up 0.7s cubic-bezier(.16,.84,.44,1) both; }
      .hero-fade-1 { animation-delay: 0.02s; }
      .hero-fade-2 { animation-delay: 0.10s; }
      .hero-fade-3 { animation-delay: 0.20s; }
      .hero-fade-4 { animation-delay: 0.30s; }
      .hero-fade-5 { animation-delay: 0.40s; }

      .reveal { opacity: 0; transform: translateY(28px); transition: opacity 0.7s cubic-bezier(.16,.84,.44,1), transform 0.7s cubic-bezier(.16,.84,.44,1); }
      .reveal-visible { opacity: 1; transform: translateY(0); }

      @keyframes count-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }

      @keyframes suite-panel-in { 0% { opacity: 0; transform: translateY(16px) scale(0.98); } 100% { opacity: 1; transform: translateY(0) scale(1); } }
      .suite-panel-in { animation: suite-panel-in 0.45s cubic-bezier(.16,.84,.44,1) both; }

      @keyframes suite-progress { from { width: 0%; } to { width: 100%; } }
      .suite-progress { width: 0%; animation: suite-progress 4s linear forwards; }

      @keyframes suite-chip-in { 0% { opacity: 0; transform: translateY(8px); } 100% { opacity: 1; transform: translateY(0); } }
      .suite-chip-in { animation: suite-chip-in 0.4s 0.2s cubic-bezier(.16,.84,.44,1) both; }

      @media (prefers-reduced-motion: reduce) {
        .marquee-track, .ticker-track, .animate-gradient-shift, .animate-pulse-soft, .animate-float-slow, .animate-float-slow-alt, .animate-float,
        .orb-1, .orb-2, .orb-3, .grid-pan, .particle, .suite-panel-in, .suite-progress, .suite-chip-in,
        .hero-fade-1, .hero-fade-2, .hero-fade-3, .hero-fade-4, .hero-fade-5 { animation: none !important; }
        .reveal { opacity: 1 !important; transform: none !important; transition: none !important; }
      }
    `}</style>
  );
}

/** Scroll-triggered reveal wrapper — fades/rises content in once it enters the viewport. */
function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${visible ? 'reveal-visible' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/** Animated "live wallpaper" hero background — drifting gradient mesh, panning grid, rising particles. */
function LiveHeroBackground() {
  const particles = [
    { icon: Briefcase, left: '8%', size: 18, dur: 14, delay: 0, drift: 30 },
    { icon: Users, left: '22%', size: 16, dur: 18, delay: 3, drift: -20 },
    { icon: CheckCircle2, left: '48%', size: 14, dur: 12, delay: 6, drift: 15 },
    { icon: Target, left: '68%', size: 18, dur: 20, delay: 2, drift: -35 },
    { icon: Bot, left: '85%', size: 16, dur: 15, delay: 8, drift: 20 },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Drifting gradient orbs — the "live wallpaper" */}
      <div className="orb-1 absolute -top-24 left-[10%] w-[420px] h-[420px] rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.14) 0%, transparent 70%)' }} />
      <div className="orb-2 absolute top-1/3 right-[5%] w-[380px] h-[380px] rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)' }} />
      <div className="orb-3 absolute bottom-0 left-[35%] w-[300px] h-[300px] rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.12) 0%, transparent 70%)' }} />

      {/* Slowly panning grid */}
      <div
        className="grid-pan absolute inset-0 opacity-100"
        style={{
          backgroundImage: 'linear-gradient(rgba(37,99,235,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.06) 1px, transparent 1px)',
          backgroundSize: '44px 44px, 44px 44px',
        }}
      />

      {/* Rising particle icons */}
      {particles.map((p, i) => (
        <p.icon
          key={i}
          className="particle text-blue-400/25"
          style={{
            left: p.left,
            bottom: '-40px',
            width: p.size,
            height: p.size,
            animationDuration: `${p.dur}s`,
            animationDelay: `${p.delay}s`,
            ['--drift' as any]: `${p.drift}px`,
          }}
        />
      ))}

      {/* Bottom fade so content below the hero stays crisp */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-blue-50/50 to-transparent" />
    </div>
  );
}

/** Signature element — a scrolling strip of jobs going live right now. Distinct from generic hero motion: it's content, not decoration. */
const FALLBACK_JOBS = [
  { title: 'Senior Frontend Developer', company: 'TechNova', loc: 'Chennai' },
  { title: 'Product Designer', company: 'Loop Studio', loc: 'Bengaluru' },
  { title: 'Data Analyst', company: 'Finlytics', loc: 'Hyderabad' },
  { title: 'DevOps Engineer', company: 'CloudBase', loc: 'Pune' },
  { title: 'Sales Manager', company: 'Marketly', loc: 'Mumbai' },
  { title: 'HR Business Partner', company: 'Orbit Corp', loc: 'Remote' },
  { title: 'Backend Engineer', company: 'ScaleUp', loc: 'Chennai' },
  { title: 'Content Strategist', company: 'WordPress Inc', loc: 'Delhi' },
];

function JobTicker() {
  const [liveJobs, setLiveJobs] = useState<{ title: string; company: string; loc: string }[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_ENDPOINTS.BASE_URL}/jobs?limit=16&sort=-createdAt`)
      .then(r => r.json())
      .then(data => {
        if (cancelled) return;
        const arr = Array.isArray(data) ? data : (data.jobs || []);
        const mapped = arr
          .filter((j: any) => j && (j.jobTitle || j.title))
          .map((j: any) => ({
            title: j.jobTitle || j.title,
            company: j.company || j.companyName || 'Company',
            loc: j.location || j.jobLocation || 'Remote',
          }));
        if (mapped.length) setLiveJobs(mapped);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const jobs = liveJobs.length ? liveJobs : FALLBACK_JOBS;
  const row = jobs.concat(jobs);

  return (
    <div className="relative border-y border-blue-100 bg-blue-50/60 overflow-hidden">
      <div className="flex items-center gap-3 px-4 sm:px-6 lg:px-8 py-3">
        <span className="flex-shrink-0 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-orange-600 bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse-soft" /> Live
        </span>
        <div className="flex-1 overflow-hidden">
          <div className="ticker-track flex items-center gap-8 w-max">
            {row.map((j, i) => (
              <span key={i} className="flex items-center gap-2 text-sm text-gray-600 whitespace-nowrap">
                <span className="font-semibold text-gray-900">{j.title}</span>
                <span className="text-gray-300">·</span>
                <span>{j.company}</span>
                <span className="text-gray-300">·</span>
                <span className="text-gray-500">{j.loc}</span>
                <span className="ml-6 text-gray-200">/</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* -- Hero callback card � quick request form (Naukri-style) -- */
function HeroCallbackCard() {
  const [form, setForm] = useState({ name: '', phone: '', email: '', hiringFor: 'Your company' });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim() || !form.email.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    setError('');
    try {
      const existing = JSON.parse(localStorage.getItem('employer_callbacks') || '[]');
      existing.push({ ...form, createdAt: new Date().toISOString() });
      localStorage.setItem('employer_callbacks', JSON.stringify(existing));
    } catch { /* ignore */ }
    setSubmitted(true);
  };

  const inputCls = "w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-shadow bg-gray-50 focus:bg-white";

  if (submitted) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-2xl shadow-blue-100/70 p-8 text-center">
        <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse-soft">
          <CheckCircle2 className="w-7 h-7 text-emerald-600" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">Request received!</h3>
        <p className="text-sm text-gray-500">Our team will get back to you shortly at {form.email}.</p>
      </div>
    );
  }

  return (
    <div className="relative bg-white rounded-2xl border border-gray-100 shadow-2xl shadow-blue-100/70 p-6 lg:p-7">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-violet-600 rounded-t-2xl" />
      <p className="text-[11px] font-bold uppercase tracking-widest text-blue-600 mb-1">Request callback</p>
      <h3 className="text-lg font-bold text-gray-900 mb-4">Get a free demo of our hiring suite</h3>
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div className="relative">
          <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" className={`${inputCls} pl-10`} />
        </div>
        <div className="relative">
          <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Mobile number" className={`${inputCls} pl-10`} />
        </div>
        <div className="relative">
          <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Work email" className={`${inputCls} pl-10`} />
        </div>
        <div className="relative">
          <Globe2 className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <select value={form.hiringFor} onChange={(e) => setForm({ ...form, hiringFor: e.target.value })} className={`${inputCls} pl-10 appearance-none`}>
            <option>Your company</option>
            <option>Your consultancy</option>
          </select>
          <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <WorkButton type="submit" text="Request callback" className="w-full" />
        <p className="text-[11px] text-gray-400 text-center">By submitting, you agree to be contacted by our hiring experts.</p>
      </form>
    </div>
  );
}

/* -- One-Stop Solution � product categories with sub-products -- */
const PRODUCT_CATEGORIES = [
  { id: 'sourcing', label: 'Talent Sourcing', icon: Users },
  { id: 'screening', label: 'Screening & Evaluation', icon: ClipboardCheck },
  { id: 'automation', label: 'Hiring Automation', icon: CalendarClock },
  { id: 'planning', label: 'Talent Planning', icon: TrendingUp },
  { id: 'branding', label: 'Employer Branding', icon: Building2 },
  { id: 'assisted', label: 'Assisted Hiring', icon: Bot },
] as const;

type ProductCategoryId = typeof PRODUCT_CATEGORIES[number]['id'];

const PRODUCTS: Record<ProductCategoryId, {
  name: string; tag: string; bullets: string[]; stats: { v: string; l: string }[]; grad: string; initials: string; target: string;
}[]> = {
  sourcing: [
    { name: 'ZyncJobs Portal', tag: 'Candidate Search + Job Posting', bullets: ['10 lakh+ registered jobseekers', 'AI-matched candidate recommendations', 'Save & track promising profiles'], stats: [{ v: '1L+', l: 'jobseekers' }, { v: '10K+', l: 'daily active users' }], grad: 'from-blue-600 to-cyan-500', initials: 'ZP', target: 'job-posting-selection' },
    { name: 'Resume Parser & Ranking', tag: 'Automatic resume scoring', bullets: ['Parse & score every resume', 'Skill & experience extraction', 'Ranked shortlists in seconds'], stats: [{ v: '100%', l: 'resumes parsed' }, { v: 'Auto', l: 'scoring' }], grad: 'from-cyan-500 to-sky-400', initials: 'RP', target: 'job-parsing' },
  ],
  screening: [
    { name: 'Skill Assessments', tag: 'Role-specific tests', bullets: ['Role-specific test libraries', 'Automatic scoring & reporting', 'Shortlist by assessment results'], stats: [{ v: '20+', l: 'test libraries' }, { v: 'Auto', l: 'scored' }], grad: 'from-emerald-500 to-teal-400', initials: 'SA', target: 'skill-assessment' },
    { name: 'Verified Candidates', tag: 'Credential-checked profiles', bullets: ['Email & identity verification', 'Skill validation checks', 'Clearly marked verified profiles'], stats: [{ v: '100%', l: 'verified profiles' }, { v: '24h', l: 'verification' }], grad: 'from-blue-600 to-indigo-500', initials: 'VC', target: 'candidate-search' },
  ],
  automation: [
    { name: 'Interview Scheduling', tag: 'One-click booking', bullets: ['No back-and-forth emails', 'Auto confirmations & reminders', 'Built-in video meeting links'], stats: [{ v: '1-click', l: 'booking' }, { v: '0', l: 'emails needed' }], grad: 'from-amber-500 to-orange-400', initials: 'IS', target: 'interviews' },
    { name: 'Bulk Job Import', tag: 'Volume hiring made easy', bullets: ['Import hundreds of roles at once', 'Bulk edit & publish instantly', 'All applicants in one dashboard'], stats: [{ v: '100s', l: 'jobs at once' }, { v: 'Instant', l: 'publish' }], grad: 'from-orange-500 to-amber-400', initials: 'BJ', target: 'bulk-job-import' },
  ],
  planning: [
    { name: 'Salary Insights', tag: 'Market benchmarks', bullets: ['Real market data by role & location', 'Benchmark against industry peers', 'Confident offers every time'], stats: [{ v: 'Live', l: 'market data' }, { v: '?', l: 'confident offers' }], grad: 'from-violet-600 to-purple-400', initials: 'SI', target: 'salary-insights' },
    { name: 'Hiring Analytics', tag: 'Live dashboards', bullets: ['Track applications & interviews', 'Recruiter activity insights', 'Real-time hiring funnel'], stats: [{ v: 'Real-time', l: 'dashboards' }, { v: '24/7', l: 'visibility' }], grad: 'from-purple-600 to-fuchsia-400', initials: 'HA', target: 'employer-dashboard' },
  ],
  branding: [
    { name: 'Branded Career Page', tag: 'Tell your employer story', bullets: ['Showcase your brand & culture', 'Highlight employee stories', 'Attract the right-fit candidates'], stats: [{ v: 'Brand', l: 'story' }, { v: 'More', l: 'visibility' }], grad: 'from-blue-600 to-violet-600', initials: 'BC', target: 'employer-register' },
    { name: 'Premium Job Posting', tag: 'Stand out to top talent', bullets: ['Featured placement & highlights', 'Boosted visibility for critical roles', 'Priority in candidate search'], stats: [{ v: 'Top', l: 'placement' }, { v: '3x', l: 'visibility' }], grad: 'from-sky-500 to-blue-400', initials: 'PJ', target: 'job-posting-selection' },
  ],
  assisted: [
    { name: 'AI Recruiter Assistant', tag: 'Agentic AI talent sourcing', bullets: ['24/7 candidate sourcing', 'Automatic screening & scoring', 'Ranked shortlists in seconds'], stats: [{ v: '24/7', l: 'sourcing' }, { v: 'AI', l: 'ranked' }], grad: 'from-orange-500 to-rose-400', initials: 'AI', target: 'ai-recruiter' },
  ],
};

function ProductsSection({ go }: { go: (page: string) => void }) {
  const [active, setActive] = useState<ProductCategoryId>('sourcing');

  return (
    <section id="products" className="py-16 lg:py-24 bg-[#F6F8FF]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <SectionHeader
            overline="One-Stop Solution. Talent Decoded."
            title="Comprehensive solutions for all your hiring needs"
          />
        </Reveal>

        {/* Category tabs */}
        <Reveal>
          <div className="flex flex-wrap justify-center gap-2.5 mb-10">
            {PRODUCT_CATEGORIES.map((c) => {
              const isActive = c.id === active;
              return (
                <button
                  key={c.id}
                  onClick={() => setActive(c.id)}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 border ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white border-transparent shadow-lg shadow-blue-200'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-blue-200 hover:text-blue-600'
                  }`}
                >
                  <c.icon className="w-4 h-4" />
                  {c.label}
                </button>
              );
            })}
          </div>
        </Reveal>

        {/* Product cards for active category */}
        <div key={active} className="suite-panel-in grid grid-cols-1 md:grid-cols-2 gap-6">
          {PRODUCTS[active].map((p, i) => (
            <Reveal key={p.name} delay={i * 80}>
              <div className="group relative bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-blue-100/70 hover:border-blue-200 hover:-translate-y-1.5 transition-all duration-300 p-7 h-full flex flex-col overflow-hidden">
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${p.grad}`} />
                <div className="flex items-center gap-4 mb-5">
                  <span className={`w-12 h-12 bg-gradient-to-br ${p.grad} rounded-2xl flex items-center justify-center text-white font-extrabold text-sm shadow-md transition-transform duration-300 group-hover:scale-110`}>
                    {p.initials}
                  </span>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 leading-tight">{p.name}</h3>
                    <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mt-0.5">{p.tag}</p>
                  </div>
                </div>
                <ul className="space-y-2.5 mb-6 flex-1">
                  {p.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2.5 text-sm text-gray-600">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      {b}
                    </li>
                  ))}
                </ul>
                <div className="flex items-center gap-3 mb-6">
                  {p.stats.map((s) => (
                    <div key={s.l} className="flex-1 bg-gray-50 rounded-xl py-2.5 px-3 text-center">
                      <p className="text-sm font-extrabold text-gray-900">{s.v}</p>
                      <p className="text-[10px] text-gray-400 font-medium">{s.l}</p>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => go(p.target)}
                  className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold text-sm transition-all duration-200 hover:-translate-y-0.5 shadow-md shadow-blue-100"
                >
                  Explore {p.name.split(' ')[0]} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Shared section pieces ── */

function SectionHeader({ overline, title, sub }: { overline: string; title: string; sub?: string }) {
  return (
    <div className="text-center mb-12 lg:mb-14">
      <p className="text-xs font-bold tracking-[0.2em] uppercase text-blue-600 mb-3">{overline}</p>
      <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight mb-4">{title}</h2>
      {sub && <p className="text-gray-500 max-w-2xl mx-auto text-lg">{sub}</p>}
    </div>
  );
}

/* ── Segment card — enterprises / SMBs / consultancies ── */
function SegmentCard({ icon: Icon, grad, title, tagline, points, cta, onClick, featured }: {
  icon: React.ComponentType<{ className?: string }>;
  grad: string;
  title: string;
  tagline: string;
  points: string[];
  cta: string;
  onClick: () => void;
  featured?: boolean;
}) {
  return (
    <div className={`group relative bg-white rounded-2xl overflow-hidden border flex flex-col h-full transition-all duration-300 ${
      featured
        ? 'border-orange-200 shadow-xl shadow-orange-100 lg:-translate-y-3 hover:-translate-y-4'
        : 'border-gray-100 shadow-sm hover:shadow-xl hover:shadow-blue-100/60 hover:-translate-y-1.5'
    }`}>
      <div className={`h-1 bg-gradient-to-r ${grad}`} />
      {featured && (
        <span className="absolute top-4 right-4 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-white bg-gradient-to-r from-orange-500 to-amber-500 px-3 py-1 rounded-full shadow-md shadow-orange-200">
          <Award className="w-3 h-3" /> Most chosen
        </span>
      )}
      <div className="p-8 flex flex-col flex-1">
        <div className={`w-14 h-14 bg-gradient-to-br ${grad} rounded-xl flex items-center justify-center mb-5 shadow-md transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3`}>
          <Icon className="w-7 h-7 text-white" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-1">{title}</h3>
        <p className="text-sm text-gray-500 mb-6">{tagline}</p>
        <ul className="space-y-3 mb-8 flex-1">
          {points.map((p) => (
            <li key={p} className="flex items-start gap-2.5 text-sm text-gray-600">
              <CheckCircle2 className={`w-5 h-5 flex-shrink-0 mt-0.5 ${featured ? 'text-orange-500' : 'text-blue-600'}`} /> {p}
            </li>
          ))}
        </ul>
        <button
          onClick={onClick}
          className={`w-full font-semibold py-3 rounded-lg transition-all duration-200 hover:-translate-y-0.5 ${
            featured
              ? 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-md shadow-orange-200'
              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-100'
          }`}
        >
          {cta}
        </button>
      </div>
    </div>
  );
}

/* ── Request callback form ── */
function CallbackForm() {
  const [form, setForm] = useState({ name: '', phone: '', email: '', hiringFor: 'Your company' });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim() || !form.email.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    setError('');
    try {
      const existing = JSON.parse(localStorage.getItem('employer_callbacks') || '[]');
      existing.push({ ...form, createdAt: new Date().toISOString() });
      localStorage.setItem('employer_callbacks', JSON.stringify(existing));
    } catch { /* ignore */ }
    setSubmitted(true);
  };

  const inputCls = "w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-shadow";

  return (
    <section id="request-callback" className="py-16 lg:py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="grid grid-cols-1 lg:grid-cols-2 shadow-2xl shadow-blue-100/70 rounded-2xl overflow-hidden border border-gray-100">
            <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-violet-600 relative overflow-hidden p-8 lg:p-12 text-white">
              <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.2) 0%, transparent 55%)' }}></div>
              <div className="relative">
                <p className="text-xs font-bold tracking-[0.2em] uppercase text-cyan-300 mb-3">Talk to an expert</p>
                <h2 className="text-2xl lg:text-3xl font-extrabold mb-4">
                  Not sure which offering is right for you?
                </h2>
                <p className="text-blue-100 text-lg mb-6">
                  Leave your contact details and we'll get back to you shortly.
                </p>
                <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-3.5 py-1.5 text-xs font-semibold text-emerald-300 mb-8">
                  <Clock className="w-3.5 h-3.5" /> Average response time — under 2 hours
                </div>
                <ul className="space-y-5">
                  {[
                    { icon: User, text: 'A hiring expert will understand your requirements' },
                    { icon: Target, text: 'Get a tailored recommendation for your team size' },
                    { icon: ShieldCheck, text: 'No obligation — just honest guidance' },
                  ].map((li) => (
                    <li key={li.text} className="flex items-start gap-3.5">
                      <span className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <li.icon className="w-4.5 h-4.5 text-cyan-300" />
                      </span>
                      <span className="text-blue-50 pt-1.5">{li.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="bg-white p-8 lg:p-12">
              {submitted ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-10">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-5 animate-pulse-soft">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Request received!</h3>
                  <p className="text-gray-500 max-w-xs">Our team will get back to you shortly at {form.email}.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <FormField label="Full name" required>
                    <div className="relative">
                      <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Enter your full name" className={`${inputCls} pl-10`} />
                    </div>
                  </FormField>
                  <FormField label="Mobile number" required>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Enter your mobile number" className={`${inputCls} pl-10`} />
                    </div>
                  </FormField>
                  <FormField label="Work email" required>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Enter your work email" className={`${inputCls} pl-10`} />
                    </div>
                  </FormField>
                  <FormField label="Hiring for">
                    <div className="relative">
                      <Globe2 className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <select value={form.hiringFor} onChange={(e) => setForm({ ...form, hiringFor: e.target.value })} className={`${inputCls} pl-10 appearance-none`}>
                        <option>Your company</option>
                        <option>Your consultancy</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </FormField>
                  {error && <p className="text-sm text-red-600">{error}</p>}
                  <WorkButton type="submit" text="Request callback" className="w-full" />
                  <p className="text-xs text-gray-400 text-center">By submitting, you agree to be contacted by our hiring experts.</p>
                </form>
              )}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

/* ── FAQs ── */
function FAQSection({ go }: { go: (page: string) => void }) {
  const [open, setOpen] = useState<number | null>(0);
  const faqs = [
    {
      q: 'How can a recruiter sign up for a ZyncJobs account?',
      a: 'Creating an employer account is free and takes under two minutes. Sign up with your work email, verify your company details, and you can immediately post jobs, search the resume database, and start receiving applications.',
    },
    {
      q: 'How does pricing work for ZyncJobs recruiter plans and job postings?',
      a: 'We keep pricing simple and transparent — flexible plans for every team size, with pay-per-posting and subscription options. There are no hidden fees, and our team can help you pick the plan that fits your hiring volume.',
    },
    {
      q: 'What support, insight, and team collaboration features does ZyncJobs Recruiter offer?',
      a: 'You get real-time hiring analytics, AI-powered candidate insights, and market trends. Your team can share shortlists and collaborate on candidates, and our support experts are always one callback away.',
    },
    {
      q: 'How secure is my recruiter account?',
      a: 'Your data is protected with industry-standard encryption and strict access controls. Candidate information is never shared without consent, and verified profiles ensure you are hiring with confidence.',
    },
    {
      q: 'How can I find the right candidates using ZyncJobs?',
      a: 'Search our resume database of verified jobseekers with filters for skills, experience, and location. AI match scores rank the best-fit candidates, and you can save and track promising profiles in one dashboard.',
    },
    {
      q: 'What features does ZyncJobs provide for bulk hiring?',
      a: 'Use bulk job import to publish hundreds of roles at once, then manage every application from a single dashboard. AI ranking keeps high-volume screening fast and accurate.',
    },
    {
      q: 'How can recruiters promote employer branding on ZyncJobs?',
      a: 'Build a branded career page that showcases your culture and employee stories, and boost critical roles with premium postings that get featured placement and priority visibility.',
    },
    {
      q: 'Are there any tips for writing effective job postings on our portal?',
      a: 'Use a clear job title, a strong summary, and list the key skills and qualifications candidates need. Our AI-assisted description tool helps you craft postings that attract the right applicants.',
    },
  ];

  return (
    <section className="py-16 lg:py-24 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <SectionHeader overline="FAQs" title="Frequently asked questions" />
        </Reveal>
        <div className="space-y-3">
          {faqs.map((f, i) => (
            <Reveal key={f.q} delay={i * 40}>
              <div className={`border rounded-xl overflow-hidden transition-colors duration-300 ${open === i ? 'border-blue-200 shadow-md shadow-blue-100/60' : 'border-gray-200'}`}>
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  className="w-full flex items-center gap-4 px-6 py-5 text-left bg-white hover:bg-gray-50 transition-colors"
                  aria-expanded={open === i}
                >
                  <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors duration-300 ${open === i ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="flex-1 font-semibold text-gray-900">{f.q}</span>
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${open === i ? 'bg-blue-50 text-blue-600 rotate-180' : 'text-gray-400'}`}>
                    <ChevronDown className="w-4 h-4" />
                  </span>
                </button>
                <div
                  className="grid transition-[grid-template-rows] duration-300 ease-out"
                  style={{ gridTemplateRows: open === i ? '1fr' : '0fr' }}
                >
                  <div className="overflow-hidden">
                    <div className="pl-[4.25rem] pr-6 pb-6 text-gray-600 leading-relaxed text-[15px]">{f.a}</div>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal>
          <div className="text-center mt-12">
            <p className="text-gray-500 mb-5">Still have questions? Our hiring experts are here to help.</p>
            <div className="flex justify-center">
              <GetStartedButton text="Get Started" onClick={() => go('employer-register')} />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}


/* ── Site preview — mini replica of the real ZyncJobs page UI ── */
function SitePreview({ variant }: { variant: 'job-posting' | 'candidate-search' | 'ai-recruiter' | 'skill-assessment' | 'interviews' | 'salary-insights' }) {
  const Bar = () => (
    <div className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-gray-100">
      <div className="flex items-center gap-1.5">
        <span className="w-3.5 h-3.5 bg-blue-600 rounded-[4px]" />
        <span className="text-[11px] font-extrabold text-blue-600">ZyncJobs</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-10 h-2 rounded-full bg-gray-100" />
        <span className="w-10 h-2 rounded-full bg-gray-100" />
        <span className="w-6 h-4 rounded bg-blue-600" />
      </div>
    </div>
  );

  if (variant === 'job-posting') {
    return (
      <div className="bg-gray-50 h-full flex flex-col">
        <Bar />
        <div className="p-4 flex-1">
          <p className="text-[12px] font-bold text-gray-900 mb-1">What type of job posting do you need?</p>
          <p className="text-[9px] text-gray-400 mb-3">Pick a plan that fits your hiring goal</p>
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { name: 'Pay-per-Job', price: '₹499', per: '/job', hot: false, feats: ['30 days live', 'Applications dashboard', 'Standard visibility'] },
              { name: 'Featured', price: '₹1,299', per: '/job', hot: true, feats: ['AI-assisted description', 'Featured placement', 'Priority in search'] },
              { name: 'Platinum', price: '₹2,999', per: '/job', hot: false, feats: ['Everything in Featured', 'Branded career page', 'Bulk job import'] },
            ].map((p) => (
              <div key={p.name} className={`relative bg-white rounded-lg border p-3 ${p.hot ? 'border-blue-600 ring-2 ring-blue-100' : 'border-gray-200'}`}>
                {p.hot && <span className="absolute -top-1.5 right-2 bg-orange-500 text-white text-[7px] font-bold px-1.5 py-0.5 rounded-full">Most popular</span>}
                <p className="text-[9px] font-bold text-gray-900">{p.name}</p>
                <p className="text-[11px] font-extrabold text-blue-600 mt-1">{p.price}<span className="text-[7px] font-medium text-gray-400">{p.per}</span></p>
                <div className="mt-2 space-y-1">
                  {p.feats.map((ft) => (
                    <p key={ft} className="text-[7.5px] text-gray-500 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> {ft}
                    </p>
                  ))}
                </div>
                <div className={`mt-2.5 text-center text-[8px] font-bold py-1.5 rounded-md ${p.hot ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600'}`}>Post a Job</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'candidate-search') {
    return (
      <div className="bg-gray-50 h-full flex flex-col">
        <Bar />
        <div className="p-4 flex-1">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 mb-3">
            <span className="text-[9px] text-gray-400">🔍</span>
            <span className="text-[9px] text-gray-500 flex-1">Search by skills, role, location…</span>
            <span className="text-[8px] font-bold text-white bg-blue-600 px-2.5 py-1 rounded-md">Search</span>
          </div>
          <div className="flex gap-1.5 mb-3">
            {['Location', 'Experience', 'Skills', 'Salary'].map((c) => (
              <span key={c} className="text-[8px] font-semibold text-gray-600 bg-white border border-gray-200 rounded-full px-2.5 py-1">{c} ▾</span>
            ))}
          </div>
          {[
            { ini: 'SK', name: 'Suresh Kumar', role: 'Senior Frontend Developer', loc: 'Chennai', exp: '6 yrs', skills: ['React', 'TypeScript'], match: '96%' },
            { ini: 'PM', name: 'Priya Menon', role: 'Product Designer', loc: 'Bengaluru', exp: '4 yrs', skills: ['Figma', 'UI/UX'], match: '91%' },
            { ini: 'AR', name: 'Arjun Rao', role: 'Backend Engineer', loc: 'Hyderabad', exp: '5 yrs', skills: ['Node.js', 'PostgreSQL'], match: '88%' },
          ].map((c) => (
            <div key={c.name} className="flex items-center gap-2.5 bg-white border border-gray-200 rounded-lg p-2.5 mb-2">
              <span className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-violet-600 text-white text-[8px] font-bold flex items-center justify-center flex-shrink-0">{c.ini}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[9.5px] font-bold text-gray-900 truncate">{c.name} <span className="text-gray-400 font-medium">· {c.role}</span></p>
                <p className="text-[7.5px] text-gray-400">{c.loc} · {c.exp}</p>
                <div className="flex gap-1 mt-1">
                  {c.skills.map((s) => (
                    <span key={s} className="text-[7px] font-medium text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded">{s}</span>
                  ))}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-[9px] font-extrabold text-emerald-500">{c.match}</p>
                <p className="text-[7px] text-gray-400">match</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'ai-recruiter') {
    return (
      <div className="bg-gray-50 h-full flex flex-col">
        <Bar />
        <div className="p-4 flex-1 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-500 to-rose-400 text-white text-[8px] font-bold flex items-center justify-center">AI</span>
            <div>
              <p className="text-[9.5px] font-bold text-gray-900">AI Recruiter Assistant</p>
              <p className="text-[7px] text-emerald-500 font-semibold">● Online — 24/7 sourcing</p>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg rounded-br-sm p-2.5 mb-2 self-start max-w-[75%]">
            <p className="text-[8.5px] text-gray-600">Find me backend engineers with 5+ years in Node.js, Bangalore preferred.</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg rounded-bl-sm p-2.5 mb-2 self-end max-w-[75%]">
            <p className="text-[8.5px] text-gray-600 font-semibold mb-1.5">🤖 Sourced 12 candidates — top 3 ranked</p>
            {[
              { ini: 'VR', name: 'Vikram Reddy', match: '94%', tag: 'Shortlist' },
              { ini: 'NS', name: 'Nisha Sharma', match: '91%', tag: 'Shortlist' },
              { ini: 'RP', name: 'Rahul Pillai', match: '87%', tag: 'Review' },
            ].map((c) => (
              <div key={c.name} className="flex items-center gap-2 bg-gray-50 rounded-md p-1.5 mb-1.5 last:mb-0">
                <span className="w-5 h-5 rounded-full bg-violet-500 text-white text-[7px] font-bold flex items-center justify-center">{c.ini}</span>
                <p className="text-[8px] font-bold text-gray-800 flex-1">{c.name}</p>
                <span className="text-[7px] font-extrabold text-emerald-500">{c.match}</span>
                <span className="text-[7px] font-bold text-white bg-blue-600 px-1.5 py-0.5 rounded">{c.tag}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-1.5 mt-auto">
            <div className="flex-1 bg-white border border-gray-200 rounded-full px-3 py-1.5 text-[8px] text-gray-400">Ask anything about hiring…</div>
            <span className="w-7 h-6 rounded-lg bg-orange-500 text-white text-[9px] flex items-center justify-center">➤</span>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'skill-assessment') {
    return (
      <div className="bg-gray-50 h-full flex flex-col">
        <Bar />
        <div className="p-4 flex-1">
          <p className="text-[12px] font-bold text-gray-900 mb-1">Skill Assessments</p>
          <p className="text-[9px] text-gray-400 mb-3">Validate candidates before you interview</p>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { name: 'Frontend Development', q: '30 questions', min: '25 min', lvl: 'Intermediate', bar: 'w-3/4' },
              { name: 'Data Analysis', q: '25 questions', min: '20 min', lvl: 'Advanced', bar: 'w-1/2' },
              { name: 'Communication Skills', q: '20 questions', min: '15 min', lvl: 'Beginner', bar: 'w-1/4' },
              { name: 'SQL & Databases', q: '28 questions', min: '22 min', lvl: 'Intermediate', bar: 'w-2/3' },
            ].map((a) => (
              <div key={a.name} className="bg-white border border-gray-200 rounded-lg p-3">
                <p className="text-[9px] font-bold text-gray-900">{a.name}</p>
                <p className="text-[7.5px] text-gray-400 mt-0.5">{a.q} · {a.min} · {a.lvl}</p>
                <div className="h-1 bg-gray-100 rounded-full mt-2.5 mb-2.5 overflow-hidden">
                  <div className={`h-full ${a.bar} bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full`} />
                </div>
                <div className="text-[8px] font-bold text-white bg-emerald-500 px-2 py-1 rounded-md text-center">Start Test</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'interviews') {
    return (
      <div className="bg-gray-50 h-full flex flex-col">
        <Bar />
        <div className="p-4 flex-1">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[12px] font-bold text-gray-900">Upcoming Interviews</p>
            <div className="flex gap-1.5">
              <span className="text-[8px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-1 rounded-full">Upcoming</span>
              <span className="text-[8px] font-bold text-gray-500 bg-white border border-gray-200 px-2 py-1 rounded-full">Completed</span>
            </div>
          </div>
          {[
            { ini: 'SK', name: 'Suresh Kumar', role: 'Senior Frontend Developer', date: 'Mon, 18 Aug', time: '10:30 AM', type: 'Video', status: 'Confirmed', stBg: 'bg-emerald-50 text-emerald-600' },
            { ini: 'PM', name: 'Priya Menon', role: 'Product Designer', date: 'Tue, 19 Aug', time: '2:00 PM', type: 'Video', status: 'Pending', stBg: 'bg-amber-50 text-amber-600' },
            { ini: 'AR', name: 'Arjun Rao', role: 'Backend Engineer', date: 'Wed, 20 Aug', time: '11:00 AM', type: 'Phone', status: 'Confirmed', stBg: 'bg-emerald-50 text-emerald-600' },
          ].map((iv) => (
            <div key={iv.name} className="bg-white border border-gray-200 rounded-lg p-3 mb-2.5">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-sky-400 text-white text-[8px] font-bold flex items-center justify-center flex-shrink-0">{iv.ini}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[9.5px] font-bold text-gray-900 truncate">{iv.name} <span className="text-gray-400 font-medium">· {iv.role}</span></p>
                  <p className="text-[7.5px] text-gray-400">{iv.date} · {iv.time} · {iv.type}</p>
                </div>
                <span className={`text-[7.5px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${iv.stBg}`}>{iv.status}</span>
              </div>
            </div>
          ))}
          <div className="text-[8px] font-bold text-white bg-blue-600 py-2 rounded-lg text-center">Schedule Interview</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 h-full flex flex-col">
      <Bar />
      <div className="p-4 flex-1">
        <p className="text-[12px] font-bold text-gray-900 mb-1">Salary Insights</p>
        <p className="text-[9px] text-gray-400 mb-3">Benchmark salaries by role & location</p>
        <div className="flex gap-1.5 mb-3">
          {['All Roles', 'Bengaluru', 'Hyderabad', 'Chennai'].map((c) => (
            <span key={c} className={`text-[8px] font-semibold px-2.5 py-1 rounded-full ${c === 'All Roles' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>{c}</span>
          ))}
        </div>
        {[
          { role: 'Frontend Developer', range: '₹6 – ₹24 LPA', bar: 'w-4/5' },
          { role: 'Backend Engineer', range: '₹8 – ₹28 LPA', bar: 'w-3/4' },
          { role: 'Data Analyst', range: '₹5 – ₹18 LPA', bar: 'w-3/5' },
          { role: 'Product Designer', range: '₹7 – ₹22 LPA', bar: 'w-2/3' },
        ].map((s) => (
          <div key={s.role} className="bg-white border border-gray-200 rounded-lg p-3 mb-2.5">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[9px] font-bold text-gray-900">{s.role}</p>
              <p className="text-[8px] font-extrabold text-violet-600">{s.range}</p>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full ${s.bar} bg-gradient-to-r from-violet-600 to-purple-400 rounded-full`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default EmployersPage;
