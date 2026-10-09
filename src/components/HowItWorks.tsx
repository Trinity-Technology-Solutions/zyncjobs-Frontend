import React, { useState, useRef, useEffect } from 'react';
import { ArrowRight, UserPlus, FileText, Search, Check, Sparkles, Briefcase, CalendarClock, ChevronLeft, ChevronRight, BadgeCheck } from 'lucide-react';

interface HowItWorksProps {
  onNavigate?: (page: string) => void;
}

const steps = [
  {
    id: '01', label: 'Create your account', icon: UserPlus,
    title: 'Start with a profile that tells your story.',
    page: 'candidate-register', cta: 'Create free account',
    desc: 'Bring your skills and experience together. Save the roles you love and discover recommendations built around you.',
    bullets: ['Create your free account', 'Save jobs and track applications', 'Get personalised job recommendations'],
  },
  {
    id: '02', label: 'Find your fit', icon: Search,
    title: 'Find work that fits your ambitions.',
    page: 'job-listings', cta: 'Explore jobs',
    desc: 'Explore opportunities based on your skills, location, and preferences. Focus your search on the roles that matter to you.',
    bullets: ['Discover roles matched to your skills', 'Filter by location, salary, and job type', 'Compare opportunities in one place'],
  },
  {
    id: '03', label: 'Build your resume', icon: FileText,
    title: 'Make your first impression count.',
    page: 'resume-builder', cta: 'Build my resume',
    desc: 'Create or upload your resume, understand its ATS score, and get practical suggestions to make your experience stand out.',
    bullets: ['Build a resume or upload your own', 'Get an ATS score and improvement tips', 'Tailor your resume to each opportunity'],
  },
  {
    id: '04', label: 'Apply & track', icon: Briefcase,
    title: 'Take the next step with confidence.',
    page: 'job-listings', cta: 'Start applying',
    desc: 'Apply for your next role and follow your application through each stage. Keep your opportunities organised as your search moves forward.',
    bullets: ['Apply with your profile and resume', 'Follow your application status', 'Stay updated as employers respond'],
  },
];

const HowItWorks: React.FC<HowItWorksProps> = ({ onNavigate }) => {
  const [active, setActive] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const manualStepRef = useRef(false);
  const scrollLayout = useRef({ pinned: false, header: 86, padding: 40, distance: 0, contentHeight: 0 });
  const [trackHeight, setTrackHeight] = useState<number | undefined>();
  useEffect(() => {
    let frame = 0;
    const updateStep = () => {
      frame = 0;
      if (manualStepRef.current) return;
      const section = sectionRef.current;
      if (!section) return;
      const layout = scrollLayout.current;
      const top = section.getBoundingClientRect().top + layout.padding;
      const travelled = layout.header + 12 - top;
      const progress = layout.pinned ? travelled / layout.distance : (travelled + window.innerHeight * .15) / Math.max(layout.contentHeight, 1);
      setActive(Math.max(0, Math.min(steps.length - 1, Math.floor(progress * steps.length))));
    };
    const scheduleUpdate = () => { if (!frame) frame = window.requestAnimationFrame(updateStep); };
    const handleScroll = () => { manualStepRef.current = false; scheduleUpdate(); };
    const measure = () => {
      if (!sectionRef.current || !contentRef.current) return;
      const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 86;
      const padding = parseFloat(getComputedStyle(sectionRef.current).paddingTop) || 0;
      const bottomPadding = parseFloat(getComputedStyle(sectionRef.current).paddingBottom) || 0;
      const contentHeight = contentRef.current.getBoundingClientRect().height;
      const available = window.innerHeight - header - 24;
      const pinned = contentHeight <= available;
      const distance = Math.max(1200, available * .65 * steps.length);
      scrollLayout.current = { pinned, header, padding, distance, contentHeight };
      sectionRef.current.classList.toggle('journey-scroll-pinned', pinned);
      setTrackHeight(pinned ? contentHeight + distance + padding + bottomPadding : undefined);
      scheduleUpdate();
    };
    const observer = new ResizeObserver(measure);
    if (contentRef.current) observer.observe(contentRef.current);
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', measure);
    measure();
    return () => { observer.disconnect(); window.removeEventListener('scroll', handleScroll); window.removeEventListener('resize', measure); if (frame) window.cancelAnimationFrame(frame); };
  }, []);
  const selectStep = (index: number) => {
    const next = Math.max(0, Math.min(steps.length - 1, index));
    manualStepRef.current = !scrollLayout.current.pinned;
    setActive(next);
    if (!sectionRef.current || !scrollLayout.current.pinned) return;
    const layout = scrollLayout.current;
    const start = window.scrollY + sectionRef.current.getBoundingClientRect().top + layout.padding - layout.header - 12;
    window.scrollTo({ top: start + layout.distance * (next / steps.length + .03), behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  };
  const step = steps[active];
  const Icon = step.icon;

  return (
    <section ref={sectionRef} style={{ minHeight: trackHeight }} id="how-it-works" className="career-journey" aria-labelledby="journey-heading">
      <div ref={contentRef} className="journey-container">
        <div className="journey-header">
          <div>
            <span className="journey-eyebrow">HOW ZYNCJOBS WORKS</span>
            <h2 id="journey-heading">Your dream job is just <span>4 steps away.</span></h2>
            <p>From your first profile to your next opportunity. A simpler way to move your career forward.</p>
          </div>
          <span className="journey-header-note"><Sparkles size={16} /> Scroll to explore your journey</span>
        </div>

        <div className="journey-step-list" role="group" aria-label="Explore the four steps">
          {steps.map((item, index) => {
            const StepIcon = item.icon;
            return (
              <button key={item.id} type="button" className={`journey-step ${active === index ? 'is-active' : ''}`} aria-pressed={active === index} aria-controls="journey-detail" onClick={() => selectStep(index)}>
                <span className="journey-step-number">{item.id}</span>
                <span className="journey-step-label"><small>STEP {item.id}</small><strong>{item.label}</strong></span>
                <StepIcon size={19} strokeWidth={1.7} className="journey-step-icon" />
              </button>
            );
          })}
        </div>

        <div className="journey-panel" id="journey-detail">
          <div className="journey-copy" key={step.id}>
            <div className="journey-detail-label"><span><Icon size={21} strokeWidth={1.7} /></span> STEP {step.id} OF 04</div>
            <h3>{step.title}</h3>
            <p>{step.desc}</p>
            <ul>{step.bullets.map(bullet => <li key={bullet}><Check size={16} /><span>{bullet}</span></li>)}</ul>
            <button className="journey-action" onClick={() => onNavigate?.(step.page)}>{step.cta} <ArrowRight size={17} /></button>
          </div>
          <div className="journey-preview layered-journey-preview">
            <div className="journey-preview-heading"><span className="journey-preview-brand">zync<span>jobs</span></span></div>
            <div className="journey-preview-content" {...{ inert: '' }} aria-hidden="true"><LayeredStepPreview index={active} /></div>
            <p className="journey-preview-caption">An illustration of your journey on ZyncJobs</p>
          </div>
        </div>

        <div className="journey-footer">
          <span>One step at a time. All the way forward.</span>
          <div className="journey-controls">
            <span aria-live="polite" aria-atomic="true">Step {active + 1} of {steps.length}: {step.label}</span>
            <button type="button" aria-label="Previous step" disabled={active === 0} onClick={() => selectStep(active - 1)}><ChevronLeft size={18} /></button>
            <button type="button" aria-label="Next step" disabled={active === steps.length - 1} onClick={() => selectStep(active + 1)}><ChevronRight size={18} /></button>
          </div>
        </div>
      </div>
      <style>{`
        .career-journey { background: #fff; border-block: 1px solid #e8edf5; padding: 40px 0; color: #172b4d; }
        .career-journey .journey-container { width: min(1200px, calc(100% - 64px)); margin: auto; }
        .career-journey .journey-header { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; margin-bottom: 22px; }
        .career-journey .journey-eyebrow { font-size: 10px; font-weight: 600; letter-spacing: 1.8px; color: #627697; display: block; margin-bottom: 12px; }
        .career-journey h2 { font-size: clamp(24px, 2.5vw, 30px); font-weight: 600; letter-spacing: -1px; line-height: 1.25; margin: 0; }
        .career-journey h2 > span { color: #245be0; font-size: inherit; }
        .career-journey .journey-header p { font-size: 14px; line-height: 1.8; color: #64748b; max-width: 580px; margin: 12px 0 0; }
        .career-journey .journey-header-note { display: inline-flex; align-items: center; gap: 8px; font-size: 11px; color: #75849b; white-space: nowrap; padding-bottom: 4px; }
        .career-journey .journey-header-note svg { color: #245be0; }
        .career-journey .journey-step-list { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-bottom: 14px; }
        .career-journey .journey-step { display: flex; align-items: center; gap: 12px; text-align: left; padding: 12px 14px; background: #fff; border: 1px solid #e2e8f2; border-radius: 10px; color: #64748b; cursor: pointer; transition: background .2s, border-color .2s; }
        .career-journey .journey-step:hover { background: #f6f9ff; border-color: #a9bfee; }
        .career-journey .journey-step.is-active { border-color: #245be0; background: #eff4ff; color: #245be0; }
        .career-journey .journey-step-number { width: 34px; height: 34px; display: grid; place-items: center; flex-shrink: 0; border-radius: 8px; background: #f1f4f8; font-size: 12px; font-weight: 600; }
        .career-journey .is-active .journey-step-number { background: #245be0; color: #fff; }
        .career-journey .journey-step-label { flex: 1; }
        .career-journey .journey-step-label small { font-size: 9px; letter-spacing: 1.1px; display: block; margin-bottom: 3px; }
        .career-journey .journey-step-label strong { font-size: 13px; font-weight: 600; color: #243858; display: block; }
        .career-journey .journey-step-icon { flex-shrink: 0; }
        .career-journey .journey-panel { display: grid; grid-template-columns: 1fr 1fr; border: 1px solid #e2e8f2; border-radius: 16px; overflow: hidden; background: #fff; }
        .career-journey .journey-copy { padding: 28px; align-self: center; animation: journey-reveal .22s ease-out; }
        .career-journey .journey-detail-label { display: flex; align-items: center; gap: 12px; font-size: 10px; font-weight: 600; letter-spacing: 1.4px; color: #71829c; margin-bottom: 14px; }
        .career-journey .journey-detail-label > span { width: 42px; height: 42px; display: grid; place-items: center; border-radius: 10px; background: #edf3ff; color: #245be0; }
        .career-journey h3 { font-size: 25px; font-weight: 600; line-height: 1.3; letter-spacing: -.8px; margin: 0 0 15px; max-width: 380px; }
        .career-journey .journey-copy > p { font-size: 14px; line-height: 1.8; color: #64748b; margin: 0; }
        .career-journey .journey-copy ul { list-style: none; padding: 0; margin: 16px 0 20px; display: grid; gap: 9px; }
        .career-journey .journey-copy li { display: flex; align-items: flex-start; gap: 8px; }
        .career-journey .journey-copy li svg { color: #27836d; flex-shrink: 0; margin-top: 2px; }
        .career-journey .journey-copy li span { font-size: 13px; color: #405371; }
        .career-journey .journey-action { display: inline-flex; align-items: center; gap: 20px; background: #245be0; color: #fff; border: 0; border-radius: 8px; padding: 13px 20px; font-size: 13px; font-weight: 600; cursor: pointer; }
        .career-journey .journey-action:hover { background: #1948bd; }
        .career-journey .journey-preview { background: #f4f7fc; border-left: 1px solid #e2e8f2; padding: 18px 20px 14px; display: flex; flex-direction: column; justify-content: space-between; min-height: 0; }
        .career-journey .journey-preview-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 14px; }
        .career-journey .journey-preview-brand { font-size: 17px; font-weight: 700; letter-spacing: -.5px; }
        .career-journey .journey-preview-brand > span { color: #245be0; font-size: inherit; }
        .career-journey .journey-preview-heading > span:last-child { font-size: 9px; color: #8b99ae; letter-spacing: 1.4px; }
        .career-journey .journey-preview-content { pointer-events: none; }
        .career-journey .journey-preview { background: linear-gradient(145deg, #eef3fc, #f8faff); padding-inline: 18px; }
        .career-journey .journey-product-window { background: white; border: 1px solid #d8e2f0; border-radius: 12px; box-shadow: 0 18px 40px #193b6810, 0 3px 8px #193b6808; overflow: hidden; animation: journey-reveal .25s ease-out; }
        .career-journey .journey-browser-bar { display: flex; align-items: center; gap: 12px; background: #f2f5fa; border-bottom: 1px solid #e5eaf3; height: 34px; padding: 0 12px; }
        .career-journey .journey-browser-dots { display: flex; gap: 4px; }
        .career-journey .journey-browser-dots i { width: 6px; height: 6px; background: #c5d0df; border-radius: 50%; }
        .career-journey .journey-browser-address { display: flex; justify-content: center; align-items: center; gap: 5px; flex: 1; background: #fff; border: 1px solid #e4eaf3; border-radius: 4px; padding: 3px 6px; color: #8090a7; font-size: 9px; }
        .career-journey .journey-browser-menu { color: #8b9bb1; font-size: 16px; }
        .career-journey .journey-product-toolbar { display: flex; align-items: center; gap: 13px; padding: 11px 15px; border-bottom: 1px solid #edf0f6; }
        .career-journey .journey-product-logo { color: #172b4d; font-size: 18px; font-weight: 700; letter-spacing: -1px; }
        .career-journey .journey-product-logo > span { color: #245be0; font-size: inherit; }
        .career-journey .journey-product-toolbar > span:nth-child(2) { font-size: 10px; color: #516581; font-weight: 500; }
        .career-journey .journey-product-avatar { margin-left: auto; display: grid; place-items: center; width: 24px; height: 24px; background: #eaf2ff; border-radius: 50%; color: #456cba; font-size: 8px; font-weight: 600; }
        .career-journey .journey-product-body { display: flex; background: #f8fafd; min-height: 0; }
        .career-journey .journey-product-sidebar { display: flex; flex-direction: column; gap: 8px; align-items: center; width: 42px; flex-shrink: 0; background: #fff; border-right: 1px solid #edf0f6; padding: 14px 5px; }
        .career-journey .journey-product-sidebar > span { display: grid; place-items: center; width: 30px; height: 30px; border-radius: 6px; color: #97a6bb; }
        .career-journey .journey-product-sidebar > .is-selected { color: #245be0; background: #edf3ff; }
        .career-journey .journey-product-sidebar > .journey-sidebar-bottom { margin-top: auto; }
        .career-journey .journey-product-screen { flex: 1; min-width: 0; padding: 12px 10px; align-self: center; }
        .career-journey .journey-screen-card { border: 1px solid #e3e9f2; border-radius: 9px; padding: 17px; background: #fff; max-width: none; box-shadow: 0 3px 10px #172b4d04; }
        .career-journey .journey-screen-card .bg-gradient-to-r, .career-journey .journey-screen-card .bg-gradient-to-br { background-image: none; background-color: #245be0; box-shadow: none; }
        .career-journey .journey-screen-card .rounded-full.text-white { border-radius: 6px; }
        .career-journey .journey-screen-card .journey-resume-banner { margin: -17px -17px 0; height: 60px; border-radius: 9px 9px 0 0; background: #172b4d; }
        .career-journey .journey-screen-card .journey-job-meta { display: flex; flex-wrap: wrap; white-space: normal; gap: 3px; line-height: 1.7; }
        .career-journey .journey-screen-card .journey-job-row { align-items: flex-start; background: #fff; border-color: #e5eaf2; }
        .career-journey .journey-screen-card .journey-job-row:first-child { border-color: #bdcef2; background: #f9fbff; }
        .career-journey .journey-screen-card .journey-video-preview { border: 1px solid #e5eaf2; }
        .career-journey .journey-preview-caption { text-align: center; font-size: 10px; color: #8392a8; margin: 12px 0 0; }
        .career-journey .journey-footer { display: flex; justify-content: space-between; align-items: center; gap: 15px; padding-top: 12px; }
        .career-journey .journey-footer > span { font-size: 12px; color: #7a899e; }
        .career-journey .journey-controls { display: flex; align-items: center; gap: 8px; }
        .career-journey .journey-controls > span { font-size: 11px; color: #7a899e; margin-right: 8px; }
        .career-journey .journey-controls button { width: 40px; height: 40px; border: 1px solid #dce4ef; background: #fff; border-radius: 8px; color: #405371; display: grid; place-items: center; cursor: pointer; }
        .career-journey .journey-controls button:hover:not(:disabled) { background: #eff4ff; border-color: #a9bfee; }
        .career-journey .journey-controls button:disabled { opacity: .35; cursor: default; }
        .career-journey button:focus-visible { outline: 2px solid #245be0; outline-offset: 3px; }
        .career-journey .preview-ui { background: #fff; border: 1px solid #e1e7f0; border-radius: 10px; padding: 14px; color: #243858; box-shadow: 0 3px 12px #172b4d05; }
        .career-journey .preview-ui :is(h4, h5, p) { margin: 0; }
        .career-journey .preview-ui h4 { font-size: 14px; font-weight: 600; line-height: 1.4; letter-spacing: -.2px; }
        .career-journey .preview-ui h5 { font-size: 12px; font-weight: 600; line-height: 1.4; }
        .career-journey .preview-ui p { font-size: 10px; color: #7b8aa0; line-height: 1.6; margin-top: 3px; }
        .career-journey .preview-heading { display: flex; align-items: center; gap: 12px; padding-bottom: 12px; border-bottom: 1px solid #edf0f5; }
        .career-journey .preview-symbol { display: grid; place-items: center; width: 40px; height: 40px; border-radius: 10px; background: #edf3ff; color: #245be0; flex-shrink: 0; }
        .career-journey .preview-form { display: grid; gap: 10px; margin-block: 14px; }
        .career-journey .preview-field > span { display: block; font-size: 10px; font-weight: 500; color: #516581; margin-bottom: 6px; }
        .career-journey .preview-field > div { display: flex; align-items: center; gap: 8px; border: 1px solid #dfe6f0; border-radius: 6px; background: #fafcff; min-height: 32px; padding: 8px 10px; font-size: 11px; color: #3f5473; }
        .career-journey .preview-field svg, .career-journey .preview-at { color: #95a4ba; flex-shrink: 0; }
        .career-journey .preview-field .preview-valid { color: #329078; margin-left: auto; }
        .career-journey .preview-at { font-size: 13px; }
        .career-journey .preview-password { letter-spacing: 3px; font-size: 11px; }
        .career-journey .preview-solid-button { display: flex; justify-content: center; align-items: center; gap: 12px; background: #245be0; color: #fff; border-radius: 6px; padding: 11px; font-size: 11px; font-weight: 600; }
        .career-journey .preview-ui .preview-login { text-align: center; margin-top: 12px; font-size: 10px; }
        .career-journey .preview-login span { color: #245be0; font-size: inherit; font-weight: 600; }
        .career-journey .preview-member-line { border-top: 1px solid #edf0f5; margin-top: 12px; padding-top: 10px; display: flex; align-items: center; justify-content: center; gap: 9px; }
        .career-journey .preview-member-line > span { font-size: 9px; color: #7b8aa0; }
        .career-journey .preview-avatars { display: flex; padding-left: 5px; }
        .career-journey .preview-avatars > * { width: 23px; height: 23px; border-radius: 50%; border: 2px solid #fff; margin-left: -5px; object-fit: cover; display: grid; place-items: center; background: #e3edff; color: #5c7bbe; font-size: 8px; }
        .career-journey .preview-avatars > span:last-child { background: #e3f3ec; color: #37856d; }
        .career-journey .preview-results-heading { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 15px; flex-wrap: wrap; }
        .career-journey .preview-results-heading > span { display: flex; align-items: center; gap: 4px; font-size: 9px; color: #8090a7; }
        .career-journey .preview-results-heading svg { color: #329078; }
        .career-journey .preview-searchbar { display: flex; align-items: center; gap: 6px; border: 1px solid #dfe6f0; border-radius: 6px; padding: 5px 5px 5px 8px; color: #8d9cb1; }
        .career-journey .preview-searchbar > svg { flex-shrink: 0; }
        .career-journey .preview-searchbar > span:first-of-type { font-size: 10px; flex: 1; min-width: 0; }
        .career-journey .preview-search-button { background: #245be0; color: #fff; border-radius: 4px; padding: 6px 8px; font-size: 9px; }
        .career-journey .preview-filters { display: flex; flex-wrap: wrap; gap: 6px; margin-block: 12px; }
        .career-journey .preview-filters > span { font-size: 9px; border: 1px solid #e3e9f2; color: #74849d; border-radius: 5px; padding: 4px 9px; }
        .career-journey .preview-filters > .is-selected { color: #245be0; border-color: #bbcff7; background: #edf3ff; }
        .career-journey .preview-jobs { display: grid; gap: 8px; }
        .career-journey .preview-job { border: 1px solid #e3e9f2; border-radius: 8px; padding: 9px; }
        .career-journey .preview-job:first-child { border-color: #b4c8f1; background: #fafcff; }
        .career-journey .preview-job-top { display: flex; align-items: center; gap: 8px; }
        .career-journey .preview-job-top > div { min-width: 0; flex: 1; }
        .career-journey .preview-job-top h5 { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
        .career-journey .preview-job-top h5 svg { color: #487bd8; flex-shrink: 0; }
        .career-journey .preview-company-logo { width: 32px; height: 32px; border: 1px solid #e3e9f2; background: #eef3fd; color: #245be0; display: grid; place-items: center; border-radius: 7px; font-size: 15px; font-weight: 600; flex-shrink: 0; }
        .career-journey .preview-company-logo img { width: 24px; height: 24px; object-fit: contain; }
        .career-journey .preview-save { color: #9daac0; flex-shrink: 0; }
        .career-journey .preview-job-details { display: flex; flex-wrap: wrap; gap: 9px; margin: 10px 0; }
        .career-journey .preview-job-details span { font-size: 9px; color: #71829b; display: flex; align-items: center; gap: 3px; }
        .career-journey .preview-job-details span + span { font-weight: 500; color: #3f5473; border-left: 1px solid #e1e8f2; padding-left: 9px; }
        .career-journey .preview-job-bottom { display: flex; align-items: center; justify-content: space-between; border-top: 1px solid #edf0f6; padding-top: 9px; }
        .career-journey .preview-match { display: inline-flex; align-items: center; gap: 4px; background: #edf7f2; color: #28866e; border-radius: 4px; padding: 4px 7px; font-size: 9px; font-weight: 500; }
        .career-journey .preview-small-button { display: flex; gap: 6px; align-items: center; color: #245be0; font-size: 10px; font-weight: 600; }
        .career-journey .preview-resume-label { display: flex; gap: 5px; align-items: center; border-bottom: 1px solid #edf0f6; padding-bottom: 12px; color: #71829b; }
        .career-journey .preview-resume-label > span { font-size: 9px; }
        .career-journey .preview-resume-label .preview-badge { margin-left: auto; color: #245be0; background: #edf3ff; padding: 4px 6px; border-radius: 4px; }
        .career-journey .preview-profile { display: flex; align-items: center; gap: 12px; padding-block: 12px; }
        .career-journey .preview-profile img { width: 44px; height: 44px; object-fit: cover; object-position: top; border-radius: 50%; border: 3px solid #f0f4fa; }
        .career-journey .preview-score-panel { display: flex; justify-content: space-between; gap: 12px; align-items: center; border: 1px solid #dcece5; border-radius: 8px; background: #f5faf7; padding: 10px; }
        .career-journey .preview-score-panel p { display: flex; align-items: center; gap: 4px; font-size: 9px; }
        .career-journey .preview-score-ring { width: 52px; height: 52px; flex-shrink: 0; position: relative; }
        .career-journey .preview-score-ring svg { width: 100%; height: 100%; transform: rotate(-90deg); }
        .career-journey .preview-score-ring > span { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .career-journey .preview-score-ring strong { font-size: 20px; font-weight: 600; line-height: 1.1; color: #236e5c; }
        .career-journey .preview-score-ring small { font-size: 8px; color: #80988e; }
        .career-journey .preview-skill-list { display: grid; gap: 8px; padding-block: 12px; }
        .career-journey .preview-skill-list > div > div:first-child { display: flex; justify-content: space-between; margin-bottom: 5px; }
        .career-journey .preview-skill-list span { font-size: 10px; color: #516581; }
        .career-journey .preview-skill-track { background: #edf1f7; height: 5px; border-radius: 4px; overflow: hidden; }
        .career-journey .preview-skill-track span { display: block; height: 100%; background: #7299e6; border-radius: 4px; }
        .career-journey .preview-resume-tips { display: grid; gap: 5px; border-top: 1px solid #edf0f6; padding-top: 10px; }
        .career-journey .preview-resume-tips > div { display: flex; align-items: center; gap: 7px; padding: 6px; background: #f8fafc; border-radius: 5px; color: #38856f; }
        .career-journey .preview-resume-tips svg { flex-shrink: 0; }
        .career-journey .preview-resume-tips span { font-size: 10px; color: #60738f; }
        .career-journey .preview-resume-tips > .is-suggestion { background: #fff9ee; color: #b88d36; }
        .career-journey .preview-application-heading { display: flex; align-items: center; gap: 8px; }
        .career-journey .preview-application-status { padding: 12px 0; border-bottom: 1px solid #edf0f6; }
        .career-journey .preview-status-dot { width: 5px; height: 5px; border-radius: 50%; background: #329078; }
        .career-journey .preview-timeline { padding-block: 10px; }
        .career-journey .preview-timeline-row { display: flex; align-items: center; gap: 10px; min-height: 33px; position: relative; }
        .career-journey .preview-timeline-row:not(:last-child)::after { content: ''; position: absolute; width: 1px; height: 15px; background: #dce5f3; top: 30px; left: 12px; }
        .career-journey .preview-timeline-icon { position: relative; z-index: 1; display: grid; place-items: center; width: 25px; height: 25px; border-radius: 50%; background: #edf3ff; color: #4f7cd2; font-size: 10px; }
        .career-journey .preview-timeline-row strong { font-size: 11px; font-weight: 500; }
        .career-journey .preview-timeline-row > span:last-child { font-size: 9px; color: #8b9ab0; margin-left: auto; }
        .career-journey .preview-timeline-row.is-current .preview-timeline-icon { background: #245be0; color: #fff; box-shadow: 0 0 0 3px #edf3ff; }
        .career-journey .preview-timeline-row.is-pending { color: #a4afbf; }
        .career-journey .preview-timeline-row.is-pending .preview-timeline-icon { background: #f1f4f8; color: #a4afbf; }
        .career-journey .preview-interview { height: 105px; position: relative; border-radius: 8px; overflow: hidden; }
        .career-journey .preview-interview > img { width: 100%; height: 100%; object-fit: cover; object-position: center 25%; }
        .career-journey .preview-interview-overlay { position: absolute; inset: 0; background: linear-gradient(0deg, #172b4df2, #172b4d05); }
        .career-journey .preview-live { position: absolute; right: 9px; top: 9px; display: flex; align-items: center; gap: 4px; font-size: 8px; color: #fff; padding: 4px 6px; background: #172b4d60; border-radius: 4px; }
        .career-journey .preview-live > span { width: 4px; height: 4px; border-radius: 50%; background: #f59191; }
        .career-journey .preview-interview-info { position: absolute; bottom: 12px; left: 12px; right: 12px; display: flex; align-items: center; gap: 7px; color: #fff; }
        .career-journey .preview-interview-info > svg { flex-shrink: 0; }
        .career-journey .preview-interview-info > div { flex: 1; min-width: 0; }
        .career-journey .preview-interview-info strong { font-size: 10px; display: block; font-weight: 500; }
        .career-journey .preview-interview-info div > span { font-size: 8px; color: #c6d5ed; display: block; margin-top: 3px; }
        .career-journey .preview-join { background: #fff; color: #245be0; padding: 6px 10px; font-size: 9px; border-radius: 5px; }
        .career-journey .preview-tracking-note { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 5px; margin-top: 12px; }
        .career-journey .preview-tracking-note span { display: flex; align-items: center; gap: 4px; font-size: 8px; color: #8696ac; }
        @media (max-width: 1023px) { .career-journey .preview-ui { padding: 14px; } }
        @media (max-width: 380px) { .career-journey .preview-ui { padding: 11px; } .career-journey .preview-job { padding: 9px; } .career-journey .preview-member-line { flex-wrap: wrap; } }
        @keyframes journey-reveal { from { opacity: .4; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
        @media (max-width: 1023px) { .career-journey .journey-header-note, .career-journey .journey-step-icon { display: none; } .career-journey .journey-copy { padding: 24px; } .career-journey .journey-preview { padding-inline: 20px; } }
        @media (max-width: 767px) {
          .career-journey { padding: 28px 0; }
          .career-journey .journey-container { width: calc(100% - 36px); }
          .career-journey .journey-step-list { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
          .career-journey .journey-step { padding: 13px 10px; gap: 9px; }
          .career-journey .journey-step-label strong { font-size: 12px; }
          .career-journey .journey-panel { grid-template-columns: 1fr; }
          .career-journey .journey-copy { padding: 20px 18px; }
          .career-journey h3 { font-size: 25px; }
          .career-journey .journey-preview { border-left: 0; border-top: 1px solid #e2e8f2; min-height: 0; padding: 16px; }
          .career-journey .journey-footer { flex-wrap: wrap; }
          .career-journey .journey-controls { width: 100%; justify-content: flex-end; }
          .career-journey .journey-controls > span { margin-right: auto; }
        }
        @media (prefers-reduced-motion: reduce) { .career-journey .journey-copy { animation: none; } .career-journey .journey-step { transition: none; } .career-journey .animate-pulse { animation: none; } }
        @media (max-width: 767px) {
          .career-journey .journey-preview { padding: 14px 12px; }
          .career-journey .journey-product-sidebar { width: 34px; padding-inline: 2px; }
          .career-journey .journey-product-sidebar > span { width: 26px; }
          .career-journey .journey-product-screen { padding: 12px 8px; }
          .career-journey .journey-screen-card { padding: 12px; }
          .career-journey .journey-screen-card .journey-resume-banner { margin: -12px -12px 0; }
          .career-journey .journey-product-body { min-height: 0; }
        }
        @media (prefers-reduced-motion: reduce) { .career-journey .journey-product-window { animation: none; } }
      `}</style>
    </section>
  );
};

const LayeredStepPreview: React.FC<{ index: number }> = ({ index }) => {
  const Segments = ({ filled = 4 }: { filled?: number }) => <span className="layered-fit-segments">{Array.from({length: 5}, (_, position) => <i key={position} className={position < filled ? 'is-filled' : ''} />)}</span>;
  const Lines = () => <div className="layered-document-lines"><i /><i /><i /></div>;
  const titles = ['Your candidate profile', 'Find your next role', 'Your professional resume', 'Track your applications'];
  return <div key={index} className={`journey-layered-scene layered-step-${index}`}>
    <div className="layered-main-sheet"><div className="layered-sheet-heading"><span className="layered-zync-mark">zj</span><strong>{titles[index]}</strong><span className="layered-sheet-tag">{['Profile', 'Discover', 'Resume', 'Applications'][index]}</span></div>
      {index === 0 ? <><div className="layered-profile-summary"><span><UserPlus size={25} /></span><div><strong>Your skills. Your story.</strong><p>Build a profile for your next move</p></div></div><div className="layered-fields">{['Personal details', 'Work experience', 'Career preferences'].map(label => <div key={label}><span>{label}</span><div><i /><Check size={13} /></div></div>)}</div></> : index === 1 ? <><h4 className="layered-opportunity-title">Customer Support Specialist</h4><p className="layered-sheet-subtitle">Explore a role that fits your strengths</p><div className="layered-skills"><strong>Skills</strong><div>{['Communication', 'Teamwork', 'Customer focus'].map(skill => <span key={skill}><Check size={10} />{skill}</span>)}</div></div><strong className="layered-section-label">Role details</strong><Lines /><Lines /></> : index === 2 ? <><div className="layered-resume-name"><span><FileText size={22} /></span><div><strong>Your experience</strong><p>Clearly presented. Ready to share.</p></div></div>{['Professional summary', 'Experience', 'Skills'].map(label => <div className="layered-resume-section" key={label}><strong>{label}</strong><Lines /></div>)}</> : <><h4 className="layered-opportunity-title">Your selected opportunity</h4><p className="layered-sheet-subtitle">Keep every application organised</p><div className="layered-application-progress">{['Applied', 'In review', 'Interview'].map((label, position) => <div key={label} className={position === 1 ? 'is-current' : ''}><span>{position === 0 ? <Check size={12} /> : position + 1}</span><strong>{label}</strong><i /></div>)}</div><Lines /></>}
    </div>
    <div className="layered-floating-insight"><div className="layered-insight-title"><Sparkles size={14} /><strong>{['Profile ready', 'Explore your fit', 'Resume check', 'Application sent'][index]}</strong></div>{index === 0 || index === 3 ? <><div className="layered-insight-confirmation"><Check size={18} /><span>{index === 0 ? 'Your details, all in one place' : 'Follow your progress here'}</span></div><Lines /></> : <div className="layered-fit-grid">{(index === 1 ? ['Skills', 'Role relevance', 'Preferences'] : ['Structure', 'Keywords', 'Readability']).map((label, position) => <div key={label}><strong>{label}</strong><Segments filled={position === 2 ? 3 : 4} /></div>)}</div>}</div>
    <div className="layered-side-cards"><div className="layered-side-note"><span>{index === 0 ? <BadgeCheck size={18} /> : index === 1 ? <Search size={18} /> : index === 2 ? <FileText size={18} /> : <CalendarClock size={18} />}</span><strong>{['Ready to connect', 'Discover opportunities', 'Improve your impact', 'Stay prepared'][index]}</strong><Lines /></div><div className="layered-recommendations"><strong>{['Your next steps', 'More roles to explore', 'Resume suggestions', 'What comes next'][index]}</strong>{(index === 0 ? ['Explore jobs', 'Build your resume'] : index === 1 ? ['Sales Executive', 'Support Associate'] : index === 2 ? ['Highlight your skills', 'Show clear outcomes'] : ['Check application updates', 'Prepare for interviews']).map(label => <div key={label}><span><Briefcase size={12} /></span><div><strong>{label}</strong><i /></div></div>)}</div></div>
  </div>;
};

export default HowItWorks;
