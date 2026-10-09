import React, { useState, useEffect, useRef } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import GetStartedButton from '../components/animata/button/get-started-button';
import WorkButton from '../components/animata/button/work-button';
import { API_ENDPOINTS } from '../config/env';
import {
  Briefcase, Search, ArrowRight, CheckCircle2,
  Bot, CalendarClock, Wallet,
  Building2, Users, Zap, Target, TrendingUp, Phone, Mail,
  User, ChevronDown, ShieldCheck, Sparkles, Globe2, Award, Clock, ClipboardCheck, HelpCircle
} from 'lucide-react';

const EmployersPage = ({ onNavigate, user, onLogout }: {
  onNavigate?: (page: string) => void;
  user?: { name: string; type: 'candidate' | 'employer' } | null;
  onLogout?: () => void;
}) => {
  const go = (page: string) => onNavigate && onNavigate(page);
  const [previewRuns, setPreviewRuns] = useState<Record<string, number>>({});

  const scrollToCallback = () => document.getElementById('request-callback')?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div className="employer-home min-h-screen bg-white">
      <GlobalMotionStyles />
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />

      {/* ── 1. Hero — light "live" background ── */}
      <section className="employer-hero relative overflow-hidden bg-gradient-to-b from-blue-50/80 via-white to-white">
        <LiveHeroBackground />

        <div className="portal-page-container relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-14 sm:pt-12 sm:pb-16 lg:pt-14 lg:pb-18 xl:pt-16 xl:pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 xl:gap-12 items-start">
            <div className="employer-hero-copy lg:col-span-7 flex flex-col items-start">
              <div className="hero-fade-1 inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-600 text-xs font-semibold tracking-wide uppercase px-3.5 py-1.5 rounded-full mb-4">
                <Sparkles className="w-3.5 h-3.5 animate-pulse-soft" />
                AI-Powered Hiring Platform
              </div>
              <h1 className="hero-fade-2 text-4xl sm:text-6xl xl:text-[4.2rem] font-extrabold text-gray-900 leading-[1.05] tracking-[-0.02em] mb-4 sm:mb-6">
                Hire the right talent,<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-violet-600 to-blue-500 bg-[length:200%_auto] animate-gradient-shift">decoded by AI</span>
              </h1>
              <p className="hero-fade-3 text-sm sm:text-base text-gray-500 leading-relaxed mb-5 max-w-xl">
                Post jobs, search verified candidate profiles, and let AI shortlist the best matches — across every field and industry.
              </p>
              <div className="hero-fade-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button className="employer-explore-button" onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}>Explore Our Products <ArrowRight size={17} aria-hidden="true" /></button>
                <button
                  onClick={scrollToCallback}
                  className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-full bg-white hover:bg-orange-50/40 border border-gray-200/90 hover:border-orange-200/80 text-gray-700 hover:text-gray-900 font-semibold text-sm tracking-tight transition-all duration-200 shadow-sm hover:shadow-md hover:shadow-gray-200/50 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] group"
                >
                  <Phone className="w-4 h-4 text-gray-500 group-hover:text-orange-600 transition-colors" />
                  <span>Sales Enquiry</span>
                </button>
              </div>
              <div className="employer-hero-benefits hero-fade-5 mt-7 lg:mt-8 flex flex-wrap items-center gap-x-5 gap-y-2.5">
                {[
                  { icon: ShieldCheck, text: '100% verified profiles' },
                  { icon: Bot, text: 'AI-matched shortlists' },
                  { icon: Target, text: 'All fields & industries' },
                ].map((b) => (
                  <span key={b.text} className="inline-flex items-center gap-1.5 text-xs sm:text-[13px] text-gray-500">
                    <b.icon className="w-3.5 h-3.5 text-blue-600" /> {b.text}
                  </span>
                ))}
              </div>
            </div>

            {/* Hero visual — quick callback form */}
            <div className="employer-hero-form lg:col-span-5 w-full">
              <HeroCallbackCard />
            </div>
          </div>
        </div>

        {/* Signature element — a live ticker of jobs being posted right now */}
        <JobTicker />

        {/* Soft seam into the next section */}
      </section>

      {/* ── Trusted by marquee ── */}
      <section className="employer-trusted bg-white pt-16 pb-10 overflow-hidden">
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
      <section className="employer-features py-16 lg:py-24 bg-white overflow-hidden">
        <div className="portal-page-container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <SectionHeader
              overline="What ZyncJobs offers"
              title="We handle everything. You focus on interviewing."
              sub="From sourcing and screening to scheduling — so you can focus on interviewing the best talent."
            />
          </Reveal>
          <div className="employer-offerings-grid">
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
              {
                icon: Building2, title: 'Employer Branding', target: 'employer-register',
                desc: 'Showcase your company, culture, and career opportunities to attract the right talent.',
                bullets: ['Branded company profile', 'Share your workplace story', 'Highlight career opportunities'],
                variant: 'branding', url: 'zyncjobs.ai/companies',
                grad: 'from-indigo-500 to-violet-500', tile: 'bg-indigo-50', text: 'text-indigo-600', cta: 'Build Your Brand',
              },
            ].map((f, i) => (
              <Reveal key={f.title} delay={i * 60} className="employer-offering-reveal">
                <article className={`employer-offering-card offering-${f.variant}`}>
                  <button type="button" className="employer-offering-preview" aria-label={`${f.title} demo, plays on hover or focus`} onMouseEnter={() => setPreviewRuns(previous => ({...previous, [f.variant]: (previous[f.variant] || 0) + 1}))} onFocus={() => setPreviewRuns(previous => ({...previous, [f.variant]: (previous[f.variant] || 0) + 1}))}>
                    
                    <div key={`${f.variant}-${previewRuns[f.variant] || 0}`} className={`offering-preview-scene ${previewRuns[f.variant] ? 'is-playing' : ''}`} aria-hidden="true" inert=""><SitePreview run={previewRuns[f.variant] || 0} variant={f.variant as 'job-posting' | 'candidate-search' | 'ai-recruiter' | 'interviews' | 'salary-insights' | 'branding'} /></div>
                  </button>
                  <div className="employer-offering-copy"><h3>{f.title}</h3><p>{f.desc}</p><ul>{f.bullets.map(bullet => <li key={bullet}><CheckCircle2 size={13} aria-hidden="true" />{bullet}</li>)}</ul><button type="button" onClick={() => go(f.target)}>{f.cta}<ArrowRight size={16} aria-hidden="true" /></button></div>
                </article>
              </Reveal>
            ))}
          </div>
     </div>
      </section>

      {/* ── 4. Hiring made simple ── */}
      <section className="employer-segments py-16 lg:py-24 bg-[#F6F8FF]">
        <div className="portal-page-container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <SectionHeader
              overline="Built for every business"
              title="Hiring made simple for every business"
              sub="Whether you're an enterprise, an SMB, or a consultancy — there's a plan that fits."
            />
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
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
      <section className="py-16 lg:py-24 bg-[#F6F8FF] md:hidden">
        <div className="portal-page-container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <SectionHeader
              overline="Why recruiters trust us"
              title="Here's why recruiters trust ZyncJobs"
              sub="Testimonials from valued clients who've elevated their hiring with ZyncJobs."
            />
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
      <section className="employer-final-cta bg-gradient-to-br from-blue-700 via-blue-600 to-violet-600 relative overflow-hidden">
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
            <div className="flex flex-col sm:flex-row gap-3.5 justify-center items-stretch sm:items-center">
              <WorkButton text="Create Free Account" onClick={() => go('employer-register')} />
              <button
                onClick={scrollToCallback}
                className="inline-flex items-center justify-center gap-2.5 h-12 px-7 rounded-full border border-white/30 hover:border-white/50 bg-white/10 hover:bg-white/20 text-white font-semibold text-[15px] tracking-tight transition-all duration-200 shadow-sm hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] group"
              >
                <Phone className="w-4.5 h-4.5 text-blue-200 group-hover:text-white transition-colors" />
                <span>Talk to Sales</span>
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

      .employer-home { color: #172b4d; }
      .employer-home > section { scroll-margin-top: calc(var(--header-h, 86px) + 16px); }
      .employer-home :is(.max-w-7xl, .max-w-6xl) { max-width: 1264px; }
      .employer-home .employer-hero { background: linear-gradient(115deg, #f6f9ff, #edf3fd); }
      .employer-home .employer-hero :is(.orb-1, .orb-2, .orb-3, .particle, .grid-pan) { display: none; }
      .employer-home .employer-hero > .max-w-7xl { padding-block: 44px; }
      .employer-home .employer-hero > .max-w-7xl > .grid { align-items: center; }
      .employer-home .employer-hero h1 { color: #172b4d; font-size: clamp(36px, 4.1vw, 57px); font-weight: 600; letter-spacing: -1.8px; line-height: 1.12; }
      .employer-home .employer-hero h1 > span { font-size: inherit; color: #245be0; background: none; animation: none; }
      .employer-home .employer-hero .hero-fade-1 { background: #fff; border-color: #dfe7f5; font-size: 10px; letter-spacing: 1px; }
      .employer-home .employer-hero .hero-fade-3 { font-size: 16px; color: #64748b; line-height: 1.8; }
      .employer-home .employer-hero .hero-fade-4 button { border-radius: 8px; box-shadow: none; transform: none; font-size: 14px; }
      .employer-home .employer-hero .hero-fade-4 button:first-child { background: #245be0; }
      .employer-home .employer-hero-form > div { border-color: #dfe7f4; border-radius: 14px; box-shadow: 0 12px 35px #234b7d0c; padding: 26px; }
      .employer-home .employer-hero-form > div > .absolute { display: none; }
      .employer-home .employer-hero-form h3 { font-size: 20px; font-weight: 600; color: #172b4d; line-height: 1.4; margin-bottom: 20px; }
      .employer-home .employer-hero-form :is(input, select) { background: #f8fafd; border-color: #dfe6f1; border-radius: 7px; min-height: 44px; }
      .employer-home .employer-hero-form button[type="submit"] { background: #245be0; box-shadow: none; }
      .employer-home .employer-trusted { padding-block: 30px; }
      .employer-home .employer-trusted > p { font-size: 10px; color: #73849e; margin-bottom: 22px; }
      .employer-home .employer-trusted img { width: 38px; height: 38px; }
      .employer-home .employer-trusted .marquee-track span { font-size: 12px; font-weight: 500; }
      .employer-home :is(#products, .employer-segments) { background: #f8fafd; }
      .employer-home :is(#products, .employer-features, .employer-segments, .employer-callback, .employer-faq) { padding-block: 52px; }
      .employer-home .employer-section-heading { text-align: left; margin-bottom: 30px; }
      .employer-home .employer-section-heading > p:first-child { font-size: 10px; font-weight: 600; letter-spacing: 1.8px; color: #7386a5; margin-bottom: 10px; }
      .employer-home .employer-section-heading h2 { font-size: clamp(25px, 2.8vw, 34px); font-weight: 600; letter-spacing: -.8px; color: #172b4d; line-height: 1.3; margin-bottom: 10px; }
      .employer-home .employer-section-heading > p:last-child:not(:first-child) { font-size: 14px; color: #64748b; line-height: 1.8; margin-inline: 0; }
      .employer-home #products .flex.flex-wrap { justify-content: flex-start; margin-bottom: 25px; gap: 8px; }
      .employer-home #products button[aria-pressed] { border-radius: 7px; font-size: 12px; box-shadow: none; }
      .employer-home #products button[aria-pressed="true"] { background: #245be0; }
      .employer-home #products .suite-panel-in .group { border-color: #e0e7f1; border-radius: 12px; box-shadow: none; padding: 25px; }
      .employer-home #products .suite-panel-in .group:hover { transform: none; border-color: #abc1ed; }
      .employer-home #products .suite-panel-in .group > .absolute { display: none; }
      .employer-home #products .suite-panel-in button { border-radius: 7px; box-shadow: none; transform: none; background: #245be0; }
      .employer-home #products .suite-panel-in .bg-gradient-to-br { background: #edf3ff; color: #245be0; box-shadow: none; transform: none; }
      .employer-home .employer-feature-card { padding: 30px; gap: 38px; border-color: #e0e7f1; border-radius: 14px; box-shadow: none; transition-duration: .2s; }
      .employer-home .employer-feature-card:hover { transform: none; border-color: #abc1ed; box-shadow: 0 6px 20px #245be009; }
      .employer-home .employer-feature-card h3 { font-size: 25px; font-weight: 600; color: #172b4d; }
      .employer-home .employer-feature-card p { font-size: 14px; line-height: 1.8; color: #64748b; margin-bottom: 18px; }
      .employer-home .employer-feature-card li { font-size: 13px; }
      .employer-home .employer-feature-card ul { margin-bottom: 22px; }
      .employer-home .employer-feature-card > div > .bg-gradient-to-br { background: #edf3ff; border-radius: 10px; box-shadow: none; transform: none; width: 46px; height: 46px; margin-bottom: 18px; }
      .employer-home .employer-feature-card > div > .bg-gradient-to-br svg { color: #245be0; width: 23px; height: 23px; }
      .employer-home .employer-feature-card button { background: #245be0; border-radius: 7px; box-shadow: none; transform: none; }
      .employer-home .employer-feature-card > div > .absolute { display: none; }
      .employer-home .employer-product-preview { transform: none; border-color: #dce5f3; border-radius: 10px; box-shadow: 0 8px 22px #172b4d09; }
      .employer-home .employer-feature-card:hover .employer-product-preview { transform: none; box-shadow: 0 8px 22px #172b4d09; }
      .employer-home .employer-feature-card:hover .employer-product-preview .h-full { transform: none; }
      .employer-home .employer-features .space-y-10 > :not(:first-child) { margin-top: 24px; }
      .employer-home .employer-segments .grid { align-items: stretch; }
      .employer-home .employer-segments .grid > .reveal > .group { height: 100%; border-color: #e0e7f1; box-shadow: none; transform: none; border-radius: 12px; }
      .employer-home .employer-segments .group > .h-1 { background: #245be0; }
      .employer-home .employer-segments .group .p-8 { padding: 26px; }
      .employer-home .employer-segments h3 { font-size: 20px; font-weight: 600; color: #172b4d; }
      .employer-home .employer-segments button { background: #245be0; box-shadow: none; transform: none; font-size: 13px; }
      .employer-home .employer-segments .group .w-14 { background: #edf3ff; box-shadow: none; transform: none; }
      .employer-home .employer-segments .group .w-14 svg { color: #245be0; }
      .employer-home .employer-segments .group > span { background: #edf3ff; color: #245be0; box-shadow: none; font-size: 9px; }
      .employer-home .employer-callback .grid { box-shadow: 0 8px 25px #172b4d08; border-color: #e0e7f1; border-radius: 14px; }
      .employer-home .employer-callback .grid > .bg-gradient-to-br { background: #172b4d; }
      .employer-home .employer-callback .grid > div { padding: 34px; }
      .employer-home .employer-callback h2 { font-weight: 600; line-height: 1.3; }
      .employer-home .employer-callback :is(input, select) { background: #f8fafd; border-color: #dfe6f1; border-radius: 7px; }
      .employer-home .employer-callback button[type="submit"] { background: #245be0; box-shadow: none; border-radius: 7px; }
      .employer-home .employer-faq { background: #fff; }
      .employer-home .employer-faq > .absolute { display: none; }
      .employer-home .employer-faq .group { border-radius: 10px; box-shadow: none; border-color: #e0e7f1; }
      .employer-home .employer-faq .group > button { padding: 18px 20px; }
      .employer-home .employer-faq button > .flex-1 { font-size: 15px; font-weight: 500; }
      .employer-home .employer-faq .group > button > span:first-child { background: #edf3ff; color: #245be0; box-shadow: none; transform: none; }
      .employer-home .employer-final-cta { background: #172b4d; }
      .employer-home .employer-final-cta > .absolute { display: none; }
      .employer-home .employer-final-cta .max-w-4xl { padding-block: 48px; }
      .employer-home .employer-final-cta h2 { font-weight: 600; letter-spacing: -.8px; }
      .employer-home .employer-final-cta p { font-size: 15px; line-height: 1.8; }
      .employer-home .employer-final-cta button { border-radius: 8px; box-shadow: none; transform: none; }
      .employer-home .employer-final-cta button:first-child { background: #fff; color: #172b4d; }
      .employer-home section button:focus-visible { outline: 2px solid #759bec; outline-offset: 3px; }
      @media (max-width: 767px) {
        .employer-home .employer-hero > .max-w-7xl { padding-block: 28px; }
        .employer-home .employer-hero h1 { font-size: 38px; letter-spacing: -1.2px; }
        .employer-home .employer-hero .hero-fade-3 { font-size: 14px; }
        .employer-home .employer-hero-form > div { margin-inline: auto; max-width: none; padding: 22px; }
        .employer-home :is(#products, .employer-features, .employer-segments, .employer-callback, .employer-faq) { padding-block: 34px; }
        .employer-home .employer-section-heading { margin-bottom: 23px; }
        .employer-home .employer-feature-card { padding: 22px; gap: 25px; }
        .employer-home .employer-feature-card h3 { font-size: 22px; }
        .employer-home .employer-callback .grid > div { padding: 25px; }
        .employer-home .employer-faq .group > button { padding: 16px; gap: 10px; }
        .employer-home .employer-faq button > .flex-1 { font-size: 14px; }
      }
      .employer-home #products.employer-solution-section { background: #f8fafd; padding-block: 48px; }
      .employer-home .employer-solution-section .employer-section-heading { max-width: 680px; margin-bottom: 28px; }
      .employer-home .solution-layout { display: grid; grid-template-columns: 230px minmax(0, 1fr); gap: 28px; align-items: start; }
      .employer-home .solution-categories { display: grid; gap: 6px; padding: 8px; background: #fff; border: 1px solid #e0e7f1; border-radius: 12px; }
      .employer-home #products .solution-categories button { display: flex; align-items: center; gap: 11px; text-align: left; padding: 13px 10px; border: 1px solid transparent; border-radius: 7px; background: #fff; color: #71829b; font-size: 12px; font-weight: 500; cursor: pointer; }
      .employer-home .solution-category-icon { display: grid; place-items: center; flex-shrink: 0; color: #8194b0; }
      .employer-home .solution-categories button > span:nth-child(2) { flex: 1; font-size: inherit; }
      .employer-home .solution-category-arrow { opacity: 0; flex-shrink: 0; }
      .employer-home #products .solution-categories button:hover { background: #f7f9fd; color: #245be0; }
      .employer-home #products .solution-categories button[aria-pressed="true"] { background: #edf3ff; border-color: #dce7ff; color: #245be0; }
      .employer-home .solution-categories button[aria-pressed="true"] .solution-category-icon { color: #245be0; }
      .employer-home .solution-categories button[aria-pressed="true"] .solution-category-arrow { opacity: 1; }
      .employer-home .solution-content-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 8px 0 18px; }
      .employer-home .solution-content-heading > div { display: flex; align-items: center; gap: 9px; color: #5d7cb4; }
      .employer-home .solution-content-heading h3 { font-size: 16px; font-weight: 600; color: #243858; margin: 0; }
      .employer-home .solution-content-heading > span { font-size: 11px; color: #8b9ab0; }
      .employer-home .solution-card-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; }
      .employer-home .solution-card-grid.has-single-card { grid-template-columns: minmax(0, 1fr); }
      .employer-home .solution-card { display: flex; flex-direction: column; align-items: stretch; padding: 26px; background: #fff; border: 1px solid #e0e7f1; border-radius: 12px; transition: border-color .2s, box-shadow .2s; }
      .employer-home .solution-card:hover { border-color: #adc3ed; box-shadow: 0 5px 18px #245be007; }
      .employer-home .solution-card-heading { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 22px; }
      .employer-home .solution-product-icon { display: grid; place-items: center; width: 42px; height: 42px; background: #edf3ff; color: #456dba; border-radius: 9px; font-size: 12px; font-weight: 600; flex-shrink: 0; }
      .employer-home .solution-card-heading h4 { font-size: 18px; line-height: 1.35; font-weight: 600; color: #172b4d; letter-spacing: -.3px; margin: 0; }
      .employer-home .solution-card-heading p { font-size: 11px; line-height: 1.6; color: #8593a9; margin: 5px 0 0; }
      .employer-home .solution-card ul { list-style: none; padding: 0; margin: 0 0 24px; display: grid; gap: 12px; flex: 1; }
      .employer-home .solution-card li { display: flex; align-items: flex-start; gap: 9px; }
      .employer-home .solution-card li svg { color: #378b75; flex-shrink: 0; margin-top: 2px; }
      .employer-home .solution-card li span { font-size: 13px; color: #64748b; line-height: 1.6; }
      .employer-home .solution-stats { display: grid; grid-template-columns: 1fr 1fr; border-block: 1px solid #edf0f6; padding-block: 16px; margin-bottom: 20px; }
      .employer-home .solution-stats > div { display: flex; flex-direction: column; gap: 4px; }
      .employer-home .solution-stats > div + div { border-left: 1px solid #edf0f6; padding-left: 18px; }
      .employer-home .solution-stats strong { font-size: 18px; font-weight: 600; color: #243858; }
      .employer-home .solution-stats span { font-size: 10px; color: #8593a9; }
      .employer-home .solution-card > button { display: flex; align-items: center; justify-content: space-between; gap: 12px; color: #245be0; background: #f3f6fe; border: 1px solid #e4ebfc; padding: 11px 13px; font-size: 12px; font-weight: 600; border-radius: 7px; cursor: pointer; }
      .employer-home .solution-card > button:hover { background: #e8efff; }
      @media (max-width: 1023px) {
        .employer-home .solution-layout { grid-template-columns: 1fr; gap: 18px; }
        .employer-home .solution-categories { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        .employer-home .solution-category-arrow { display: none; }
      }
      @media (max-width: 639px) {
        .employer-home #products.employer-solution-section { padding-block: 32px; }
        .employer-home .solution-categories { grid-template-columns: repeat(2, minmax(0, 1fr)); padding: 5px; gap: 4px; }
        .employer-home #products .solution-categories button { padding: 11px 8px; font-size: 11px; gap: 7px; }
        .employer-home .solution-card-grid { grid-template-columns: 1fr; gap: 12px; }
        .employer-home .solution-card { padding: 22px; }
      }
      /* Employer hero: a focused enterprise layout with an accessible demo form. */
      .employer-home .employer-hero { background: #172b4d; }
      .employer-home .employer-hero > .max-w-7xl { padding-block: 52px; }
      .employer-home .employer-hero > .max-w-7xl > .grid { gap: 56px; }
      .employer-home .employer-hero h1 { color: #fff; max-width: 650px; font-size: clamp(38px, 4vw, 56px); letter-spacing: -1.6px; line-height: 1.15; }
      .employer-home .employer-hero h1 > span { color: #9ebeff; }
      .employer-home .employer-hero .hero-fade-1 { color: #c5d7f6; background: #ffffff08; border-color: #ffffff24; border-radius: 6px; font-size: 10px; letter-spacing: 1.3px; padding: 8px 11px; margin-bottom: 24px; }
      .employer-home .employer-hero .hero-fade-1 svg { animation: none; }
      .employer-home .employer-hero .hero-fade-3 { color: #b9c9e1; max-width: 490px; margin-bottom: 27px; font-size: 15px; }
      .employer-home .employer-hero .hero-fade-4 { width: 100%; }
      .employer-home .employer-hero .hero-fade-4 button { min-height: 46px; padding-inline: 20px; font-weight: 500; }
      .employer-home .employer-hero .hero-fade-4 .employer-explore-button { display: inline-flex; align-items: center; justify-content: center; gap: 15px; background: #fff; color: #172b4d; border: 1px solid #fff; }
      .employer-home .employer-hero .hero-fade-4 .employer-explore-button:hover { background: #e8effc; }
      .employer-home .employer-hero .hero-fade-4 button:last-child { background: transparent; color: #d5e1f4; border-color: #ffffff40; }
      .employer-home .employer-hero .hero-fade-4 button:last-child svg { color: #a9c2ea; }
      .employer-home .employer-hero .hero-fade-4 button:last-child:hover { background: #ffffff0a; border-color: #ffffff70; }
      .employer-home .employer-hero-benefits { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 17px; border-top: 1px solid #ffffff20; padding-top: 23px; margin-top: 34px; width: 100%; max-width: 535px; }
      .employer-home .employer-hero-benefits > span { display: flex; flex-direction: column; align-items: flex-start; gap: 9px; font-size: 11px; line-height: 1.6; color: #bccce3; }
      .employer-home .employer-hero-benefits svg { color: #9ebeff; width: 19px; height: 19px; }
      .employer-home .employer-hero-form > .employer-demo-card { max-width: 440px; padding: 30px; border: 1px solid #fff; box-shadow: 0 18px 50px #07172926; border-radius: 14px; }
      .employer-home .employer-demo-icon { display: grid; place-items: center; width: 44px; height: 44px; background: #eaf3ef; color: #34866f; border-radius: 10px; margin-bottom: 18px; }
      .employer-home .employer-demo-card > p:first-of-type { font-size: 10px; letter-spacing: 1.5px; font-weight: 500; color: #7689a4; margin-bottom: 7px; }
      .employer-home .employer-hero-form .employer-demo-card h3 { font-size: 23px; line-height: 1.35; letter-spacing: -.5px; margin-bottom: 24px; }
      .employer-home .employer-demo-form { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 15px 12px; }
      .employer-home .employer-demo-wide { grid-column: 1 / -1; }
      .employer-home .employer-demo-field { min-width: 0; }
      .employer-home .employer-demo-field label { display: block; color: #536782; font-size: 11px; font-weight: 500; margin-bottom: 6px; }
      .employer-home .employer-hero-form .employer-demo-field :is(input, select) { background: #fff; border-color: #dbe3ef; font-size: 12px; min-height: 43px; padding-right: 10px; }
      .employer-home .employer-demo-field select { padding-right: 30px; }
      .employer-home .employer-demo-field input::placeholder { color: #a0aec0; }
      .employer-home .employer-demo-submit { display: flex; align-items: center; justify-content: center; gap: 15px; background: #245be0; color: #fff; border: 0; border-radius: 7px; min-height: 45px; font-size: 13px; font-weight: 600; margin-top: 5px; cursor: pointer; }
      .employer-home .employer-demo-submit:hover { background: #1948bd; }
      .employer-home .employer-demo-consent { font-size: 10px; line-height: 1.7; color: #8b9ab0; margin: 0; }
      .employer-home .employer-job-ticker { background: #f8fafd; border: 0; }
      @media (max-width: 1023px) {
        .employer-home .employer-hero > .max-w-7xl > .grid { gap: 35px; }
        .employer-home .employer-hero-form > .employer-demo-card { max-width: none; margin-inline: 0; }
      }
      @media (max-width: 639px) {
        .employer-home .employer-hero > .max-w-7xl { padding-block: 30px; }
        .employer-home .employer-hero h1 { font-size: 37px; }
        .employer-home .employer-hero-form > .employer-demo-card { padding: 24px 20px; }
        .employer-home .employer-demo-form { grid-template-columns: 1fr; gap: 12px; }
        .employer-home .employer-hero-benefits { gap: 10px; }
        .employer-home .employer-hero-benefits > span { font-size: 10px; }
      }
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
      .catch(() => { });
    return () => { cancelled = true; };
  }, []);

  const jobs = liveJobs.length ? liveJobs : FALLBACK_JOBS;
  const row = jobs.concat(jobs);

  return (
    <div className="employer-job-ticker relative border-y border-blue-100 bg-blue-50/60 overflow-hidden">
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

/* -- Hero callback card — quick request form (Naukri-style) -- */
function HeroCallbackCard() {
  const [form, setForm] = useState({ name: '', phone: '', email: '', hiringFor: 'Your company' });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (/[^a-zA-Z\s]/.test(val)) {
      setError('Full name can only contain letters and spaces.');
    } else if (error === 'Full name can only contain letters and spaces.') {
      setError('');
    }
    setForm((prev) => ({ ...prev, name: val.replace(/[^a-zA-Z\s]/g, '') }));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (/\D/.test(val)) {
      setError('Mobile number can only contain digits.');
    } else if (error === 'Mobile number can only contain digits.') {
      setError('');
    }
    const cleanPhone = val.replace(/\D/g, '').slice(0, 10);
    setForm((prev) => ({ ...prev, phone: cleanPhone }));
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setForm((prev) => ({ ...prev, email: val }));
    if (val.trim() && !validateEmail(val)) {
      setError('Please enter a valid email address.');
    } else if (error === 'Please enter a valid email address.') {
      setError('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim() || !form.email.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    if (/[^a-zA-Z\s]/.test(form.name)) {
      setError('Full name can only contain letters and spaces.');
      return;
    }
    if (/\D/.test(form.phone) || form.phone.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!validateEmail(form.email)) {
      setError('Please enter a valid email address.');
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

  const inputCls = "w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-[13px] sm:text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-shadow bg-gray-50 focus:bg-white";

  if (submitted) {
    return (
      <div className="w-full max-w-[420px] ml-auto bg-white rounded-2xl border border-gray-100 shadow-xl shadow-blue-100/70 p-6 sm:p-7 text-center">
        <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3.5 animate-pulse-soft">
          <CheckCircle2 className="w-6 h-6 text-emerald-600" />
        </div>
        <h3 className="text-base font-bold text-gray-900 mb-1">Request received!</h3>
        <p className="text-xs sm:text-sm text-gray-500">Our team will get back to you shortly at {form.email}.</p>
      </div>
    );
  }

  return (
    <div className="employer-demo-card relative w-full max-w-[420px] ml-auto bg-white rounded-2xl border border-gray-100 shadow-xl shadow-blue-100/70 p-5 sm:p-6">
      <div className="employer-demo-icon"><Phone size={21} strokeWidth={1.7} aria-hidden="true" /></div>
      <p className="text-[11px] font-bold uppercase tracking-widest text-blue-600 mb-1">Request callback</p>
      <h3 className="text-base sm:text-[17px] font-bold text-gray-900 mb-3.5">Get a free demo of our hiring suite</h3>
      <form onSubmit={handleSubmit} className="employer-demo-form">
        <div className="employer-demo-field">
          <label htmlFor="employer-demo-name">Full name</label>
          <div className="relative">
          <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input id="employer-demo-name" autoComplete="name" type="text" value={form.name} onChange={handleNameChange} placeholder="Full name" className={`${inputCls} pl-[38px]`} />
          </div>
        </div>
        <div className="employer-demo-field">
          <label htmlFor="employer-demo-phone">Mobile number</label>
          <div className="relative">
          <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input id="employer-demo-phone" autoComplete="tel-national" inputMode="numeric" type="tel" value={form.phone} onChange={handlePhoneChange} maxLength={10} placeholder="Mobile number" className={`${inputCls} pl-[38px]`} />
          </div>
        </div>
        <div className="employer-demo-field employer-demo-wide">
          <label htmlFor="employer-demo-email">Work email</label>
          <div className="relative">
          <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input id="employer-demo-email" autoComplete="email" type="email" value={form.email} onChange={handleEmailChange} placeholder="Work email" className={`${inputCls} pl-[38px]`} />
          </div>
        </div>
        <div className="employer-demo-field employer-demo-wide">
          <label htmlFor="employer-demo-hiring">Hiring for</label>
          <div className="relative">
          <Globe2 className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <select id="employer-demo-hiring" value={form.hiringFor} onChange={(e) => setForm({ ...form, hiringFor: e.target.value })} className={`${inputCls} pl-[38px] appearance-none`}>
            <option>Your company</option>
            <option>Your consultancy</option>
          </select>
          <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>
        {error && <p role="alert" className="employer-demo-wide text-xs text-red-600">{error}</p>}
        <button className="employer-demo-submit employer-demo-wide" type="submit">Request callback <ArrowRight size={16} aria-hidden="true" /></button>
        <p className="employer-demo-consent employer-demo-wide text-[10.5px] text-gray-400 text-center pt-0.5">By submitting, you agree to be contacted by our hiring experts.</p>
      </form>
    </div>
  );
}

/* -- One-Stop Solution — product categories with sub-products -- */
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

  return (
    <section id="products" className="employer-solution-section py-16 lg:py-24 bg-[#F6F8FF]">
      <div className="employer-discovery-workspace portal-page-container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="career-discovery-intro"><div className="career-discovery-art"><svg className="career-person-illustration employer-hiring-illustration" viewBox="0 0 260 220" fill="none" aria-hidden="true" focusable="false">
  <circle cx="126" cy="111" r="88" fill="#E9EFF8" />
  <rect x="39" y="64" width="155" height="113" rx="10" fill="#FFF" stroke="#26374F" strokeWidth="2" />
  <path d="M39 86H194" stroke="#D6E1F1" strokeWidth="2" />
  <circle cx="51" cy="75" r="3" fill="#AFC2DF" /><circle cx="62" cy="75" r="3" fill="#C8D6EB" /><circle cx="73" cy="75" r="3" fill="#DDE6F2" />
  <g className="career-floating-document"><rect x="54" y="101" width="58" height="59" rx="6" fill="#F4F7FC" stroke="#C5D5EA" /><circle cx="83" cy="118" r="8" fill="#FFF" stroke="#6E89B2" strokeWidth="1.5" /><path d="M70 141Q72 128 83 128Q94 128 96 141Z" fill="#FFF" stroke="#6E89B2" strokeWidth="1.5" /><path d="M72 151H94" stroke="#A6BBDD" strokeWidth="2" strokeLinecap="round" /></g>
  <rect x="122" y="103" width="53" height="5" rx="2" fill="#7996C0" /><rect x="122" y="116" width="44" height="4" rx="2" fill="#CBD8EA" /><rect x="122" y="128" width="48" height="4" rx="2" fill="#CBD8EA" />
  <rect x="122" y="143" width="46" height="15" rx="4" fill="#E6F5EE" /><path d="m130 150 3 3 6-7" stroke="#4D967A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  <g stroke="#26374F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M170 207 172 170 186 154 211 156 227 177 234 207Z" fill="#FFF" />
    <path d="M186 139 188 156 198 163 207 155 204 139" fill="#FFF" />
    <path d="M182 112Q180 94 197 95Q214 94 214 114L210 136Q199 148 188 136Z" fill="#FFF" />
    <path d="M182 115Q174 100 185 92Q197 86 208 94Q220 96 215 116L207 108 191 106 185 116Z" fill="#26374F" />
    <path d="M189 119H193M203 119H207M198 120 197 129 201 129M193 134Q199 137 204 133" />
    <path d="M184 164 166 182 149 165 140 174 164 199 178 190M211 170 215 199M140 174 132 165Q129 160 134 158L142 163 142 156Q148 153 149 165" fill="#FFF" />
  </g>
  <g className="career-floating-document-secondary"><circle cx="204" cy="64" r="18" fill="#FFF" stroke="#85B79F" strokeWidth="1.5" /><path d="m196 64 5 5 10-11" stroke="#4D967A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></g>
  <path d="M46 192H145" stroke="#C5D5EA" strokeWidth="2" strokeLinecap="round" />
</svg></div><div className="career-discovery-copy"><Reveal><SectionHeader overline="One-Stop Solution. Talent Decoded." title="Comprehensive solutions for all your hiring needs" /></Reveal></div></div>
        <div className="employer-category-panel">          <div className="solution-categories" role="group" aria-label="Hiring solution categories">
            <p className="solution-navigation-label">Hiring solutions</p>
            {PRODUCT_CATEGORIES.map(item => <button key={item.id} id={`solution-category-${item.id}`} type="button" onClick={() => go(PRODUCTS[item.id][0].target)}><span className="solution-category-icon"><item.icon size={19} strokeWidth={1.7} /></span><span>{item.label}<small>Explore tools</small></span><ArrowRight size={14} className="solution-category-arrow" /></button>)}
          </div>
        </div>
      </div>
    </section>
  );
}

function SectionHeader({ overline, title, sub }: { overline: string; title: string; sub?: string }) {
  return (
    <div className="employer-section-heading text-center mb-12 lg:mb-14">
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
    <div className={`group relative bg-white rounded-2xl overflow-hidden border flex flex-col h-full transition-all duration-300 ${featured
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
          className={`w-full font-semibold py-3 rounded-lg transition-all duration-200 hover:-translate-y-0.5 ${featured
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

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (/[^a-zA-Z\s]/.test(val)) {
      setError('Full name can only contain letters and spaces.');
    } else if (error === 'Full name can only contain letters and spaces.') {
      setError('');
    }
    setForm((prev) => ({ ...prev, name: val.replace(/[^a-zA-Z\s]/g, '') }));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (/\D/.test(val)) {
      setError('Mobile number can only contain digits.');
    } else if (error === 'Mobile number can only contain digits.') {
      setError('');
    }
    const cleanPhone = val.replace(/\D/g, '').slice(0, 10);
    setForm((prev) => ({ ...prev, phone: cleanPhone }));
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setForm((prev) => ({ ...prev, email: val }));
    if (val.trim() && !validateEmail(val)) {
      setError('Please enter a valid email address.');
    } else if (error === 'Please enter a valid email address.') {
      setError('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim() || !form.email.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    if (/[^a-zA-Z\s]/.test(form.name)) {
      setError('Full name can only contain letters and spaces.');
      return;
    }
    if (/\D/.test(form.phone) || form.phone.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!validateEmail(form.email)) {
      setError('Please enter a valid email address.');
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
    <section id="request-callback" className="employer-callback py-16 lg:py-24 bg-white">
      <div className="portal-page-container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="grid grid-cols-1 md:grid-cols-2 shadow-2xl shadow-blue-100/70 rounded-2xl overflow-hidden border border-gray-100">
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
                      <input type="text" value={form.name} onChange={handleNameChange} placeholder="Enter your full name" className={`${inputCls} pl-10`} />
                    </div>
                  </FormField>
                  <FormField label="Mobile number" required>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input type="tel" value={form.phone} onChange={handlePhoneChange} maxLength={10} placeholder="Enter your mobile number" className={`${inputCls} pl-10`} />
                    </div>
                  </FormField>
                  <FormField label="Work email" required>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input type="email" value={form.email} onChange={handleEmailChange} placeholder="Enter your work email" className={`${inputCls} pl-10`} />
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
    <section className="employer-faq relative py-20 lg:py-28 bg-gradient-to-b from-slate-50/60 via-white to-slate-50/40 overflow-hidden">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-tr from-blue-400/10 via-indigo-400/5 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <SectionHeader
            overline="FAQs"
            title="Frequently asked questions"
          />
        </Reveal>

        <div className="space-y-4">
          {faqs.map((f, i) => (
            <Reveal key={f.q} delay={i * 40}>
              <div
                className={`group rounded-2xl border transition-all duration-300 overflow-hidden ${open === i
                  ? 'bg-white border-blue-200/90 shadow-xl shadow-blue-900/5 ring-1 ring-blue-500/10'
                  : 'bg-white/90 backdrop-blur-sm border-gray-200/80 hover:border-blue-200/80 hover:bg-white hover:shadow-md hover:shadow-gray-200/50'
                  }`}
              >
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  className="w-full flex items-center gap-3.5 sm:gap-5 px-5 sm:px-7 py-5 sm:py-6 text-left transition-colors cursor-pointer select-none"
                  aria-expanded={open === i}
                  aria-controls={`employer-faq-answer-${i}`}
                >
                  <span
                    className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-xs font-extrabold tracking-tight transition-all duration-300 ${open === i
                      ? 'bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-md shadow-blue-500/25 scale-105'
                      : 'bg-gray-100/80 text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600'
                      }`}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>

                  <span
                    className={`flex-1 text-base sm:text-[17px] leading-snug font-semibold tracking-tight transition-colors duration-200 ${open === i ? 'text-gray-900 font-bold' : 'text-gray-800 group-hover:text-blue-600'
                      }`}
                  >
                    {f.q}
                  </span>

                  <span
                    className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 ${open === i
                      ? 'bg-blue-600 text-white rotate-180 shadow-sm shadow-blue-500/30'
                      : 'bg-gray-100/80 text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600'
                      }`}
                  >
                    <ChevronDown className="w-4.5 h-4.5 stroke-[2.2]" />
                  </span>
                </button>

                <div
                  id={`employer-faq-answer-${i}`}
                  aria-hidden={open !== i}
                  className="grid transition-[grid-template-rows] duration-300 ease-out"
                  style={{ gridTemplateRows: open === i ? '1fr' : '0fr' }}
                >
                  <div className="overflow-hidden">
                    <div className="border-t border-gray-100/80 mx-5 sm:mx-7" />
                    <div className="px-5 sm:px-7 pt-4 pb-6 sm:pb-7 text-gray-600 leading-relaxed text-sm sm:text-[15px] sm:pl-[4.25rem]">
                      {f.a}
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <div className="employer-help-card">
            <div className="employer-help-copy"><span className="employer-help-eyebrow">LET'S TALK HIRING</span><h3>Still have questions? Our hiring experts are here to help.</h3><GetStartedButton text="Get Started" onClick={() => go('employer-register')} /></div>
            <svg className="employer-support-illustration" viewBox="0 0 260 210" fill="none" aria-hidden="true" focusable="false">
              <circle cx="132" cy="108" r="82" fill="#E7EDFA" />
              <g className="career-floating-document"><rect x="172" y="27" width="65" height="39" rx="10" fill="#FFF" stroke="#AFC4E5" strokeWidth="1.5" /><path d="m183 66-2 10 15-10" fill="#FFF" stroke="#AFC4E5" strokeWidth="1.5" /><circle cx="189" cy="46" r="3" fill="#839EC8" /><circle cx="204" cy="46" r="3" fill="#839EC8" /><circle cx="219" cy="46" r="3" fill="#839EC8" /></g>
              <g stroke="#26374F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M75 187 82 143 111 130 142 132 169 147 180 187Z" fill="#FFF" />
                <path d="M112 117 113 135 128 145 139 134 139 117" fill="#FFF" />
                <path d="M108 78Q108 60 127 61Q149 61 149 80L146 110Q130 132 115 110Z" fill="#FFF" />
                <path d="M108 87Q96 61 113 53Q124 45 137 53Q157 57 151 83L143 75 121 72 113 86Z" fill="#26374F" />
                <path d="M116 88H122M135 88H141M128 90 126 101 131 101M122 109Q130 115 138 107" />
                <path d="M99 84Q96 57 126 51Q157 52 158 86" stroke="#6D8FBF" strokeWidth="4" />
                <rect x="97" y="83" width="9" height="21" rx="4" fill="#ECF2FC" stroke="#6D8FBF" /><rect x="151" y="83" width="9" height="21" rx="4" fill="#ECF2FC" stroke="#6D8FBF" />
                <path d="M157 104Q154 120 137 118" stroke="#6D8FBF" /><rect x="130" y="114" width="10" height="6" rx="3" fill="#6D8FBF" stroke="#6D8FBF" />
              </g>
              <path d="M88 150H167L157 188H98Z" fill="#DDE8F8" stroke="#9FB7DB" strokeWidth="1.5" /><circle cx="128" cy="169" r="5" fill="#FFF" /><path d="M66 189H194" stroke="#AFC4E5" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </Reveal>
      </div>
    </section>
  );
}


/* ── Site preview — mini replica of the real ZyncJobs page UI ── */
function SitePreview({ variant, run = 0 }: { variant: 'job-posting' | 'candidate-search' | 'ai-recruiter' | 'interviews' | 'salary-insights' | 'branding'; run?: number }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (!run) return;
    setStep(1);
    const second = window.setTimeout(() => setStep(2), 600);
    const third = window.setTimeout(() => setStep(3), 1250);
    return () => { window.clearTimeout(second); window.clearTimeout(third); };
  }, [run]);
  const Frame = ({ children }: { children: React.ReactNode }) => <div className={`zync-mini-window demo-step-${step}`}><div className="zync-mini-window-header"><i /><i /><i /><span>zyncjobs</span>{step > 0 && <span className="zync-demo-progress">{step < 3 ? 'Demo in progress' : 'Demo complete'}</span>}</div><div className="zync-mini-window-body">{children}</div></div>;
  if (variant === 'candidate-search') return <Frame><div className="zync-mini-search"><Search size={14} /><span>{step ? 'Communication + customer support' : 'Find talent by skills'}</span></div><div className="zync-mini-results">{['Relevant skills', 'Relevant experience'].map((label,index) => <div key={label} className={`preview-motion-item ${step >= 3 && index === 0 ? 'demo-result-selected' : ''}`}><span className="zync-mini-avatar"><User size={19} /></span><div><strong>{step >= 2 ? ['Customer support profile', 'Sales profile'][index] : label}</strong><span>{step >= 3 && index === 0 ? 'Added to demo shortlist' : step === 1 ? 'Matching role requirements...' : 'Review candidate profile'}</span></div>{step >= 3 && index === 0 ? <CheckCircle2 size={16} /> : <Search size={13} />}</div>)}</div></Frame>;
  if (variant === 'ai-recruiter') return <Frame><div className="zync-mini-label"><Bot size={16} />{step ? ['','Finding relevant profiles','Reviewing role requirements','Your demo shortlist is ready'][step] : 'AI hiring workflow'}</div><div className="zync-mini-process">{[{label:'Source', icon:Search}, {label:'Screen', icon:ClipboardCheck}, {label:'Shortlist', icon:Target}].map((stage,index) => <React.Fragment key={stage.label}>{index > 0 && <span className={`zync-process-connector ${step > index ? 'is-complete' : ''}`} />}<div className={`zync-process-node preview-motion-item ${step === index + 1 ? 'is-active' : ''} ${step > index + 1 ? 'is-complete' : ''}`}><span>{step > index + 1 ? <CheckCircle2 size={23} /> : <stage.icon size={23} />}</span><strong>{stage.label}</strong></div></React.Fragment>)}</div><div className="zync-mini-process-note"><CheckCircle2 size={13} />{step === 3 ? 'Demo candidates ready for review' : 'A clear path from sourcing to shortlist'}</div></Frame>;
  if (variant === 'interviews') return <Frame><div className="zync-mini-label"><CalendarClock size={15} />Interview planner</div><div className="zync-mini-agenda">{[{title:'Invitation', detail:'Choose a suitable time'}, {title:'Confirmation', detail:'Keep everyone informed'}, {title:'Interview', detail:'Connect with your candidate'}].map((event,index) => <div key={event.title} className={`preview-motion-item ${step >= index + 1 ? 'demo-agenda-confirmed' : ''}`}><span>{step >= index + 1 ? <CheckCircle2 size={14} /> : String(index + 1).padStart(2,'0')}</span><div><strong>{event.title}</strong><p>{step >= index + 1 ? ['Demo invitation sent','Demo time confirmed','Ready to join demo'][index] : event.detail}</p></div></div>)}</div></Frame>;
  if (variant === 'salary-insights') return <Frame><div className="zync-mini-label"><TrendingUp size={16} />{step ? 'Comparing demo career levels' : 'Compare experience levels'}</div><div className="zync-mini-benchmarks">{[{label:'Entry level', width:'38%'}, {label:'Mid level', width:'63%'}, {label:'Senior level', width:'87%'}].map((level,index) => <div key={level.label} className={step === index + 1 ? 'demo-benchmark-selected' : ''}><span>{level.label}</span><div><i className="zync-benchmark-fill" style={{width: !step || step > index ? level.width : '10%'}} /></div></div>)}</div><p className="zync-mini-footnote">{step === 3 ? 'Demo comparison complete' : 'Illustrative ranges, not market salary data'}</p></Frame>;
  if (variant === 'branding') return <Frame><div className="zync-mini-brand-cover"><Building2 size={28} /><div><strong>Your workplace</strong><span>{step === 3 ? 'Demo career page ready' : 'Share your company story'}</span></div></div><div className="zync-mini-brand-sections">{['Culture', 'People', 'Careers'].map((label,index) => <div key={label} className={`preview-motion-item ${step >= index + 1 ? 'demo-brand-ready' : ''}`}><i />{step >= index + 1 && <CheckCircle2 size={11} />}<strong>{label}</strong><span /></div>)}</div></Frame>;
  return <Frame><div className="zync-mini-label"><Briefcase size={16} />{['Job publishing workspace','Draft your role','Publish your demo job','Review demo applications'][step]}</div><div className="zync-mini-job-board">{['Draft', 'Published', 'Applications'].map((label,index) => <div key={label} className={Math.max(0, step - 1) === index ? 'demo-board-active' : ''}><span>{label}</span>{Math.max(0, step - 1) === index ? <div className="preview-motion-item"><strong>{step === 3 ? 'New application' : 'Your open role'}</strong><i /><i />{index === 1 ? <CheckCircle2 size={15} /> : index === 2 ? <Users size={19} /> : <Briefcase size={15} />}</div> : <div className="demo-board-placeholder"><i /><i /></div>}</div>)}</div></Frame>;
}

export default EmployersPage;
