import React, { useEffect, useState } from 'react';

interface AIProgressLoaderProps {
  fileName?: string;
  steps?: { label: string; duration: number }[];
  onComplete?: () => void;
}

const DEFAULT_RESUME_STEPS = [
  { label: 'Reading PDF content...', duration: 800 },
  { label: 'Extracting text layers...', duration: 700 },
  { label: 'Identifying sections...', duration: 900 },
  { label: 'Parsing skills & experience...', duration: 1000 },
  { label: 'Running AI analysis...', duration: 1200 },
  { label: 'Finalizing results...', duration: 600 },
];

export const AIProgressLoader: React.FC<AIProgressLoaderProps> = ({
  fileName,
  steps = DEFAULT_RESUME_STEPS,
  onComplete,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [stepProgress, setStepProgress] = useState(0);

  useEffect(() => {
    let stepIndex = 0;
    let frameId: number;
    let startTime = Date.now();
    const totalDuration = steps.reduce((a, s) => a + s.duration, 0);
    let elapsed = 0;

    const tick = () => {
      const now = Date.now();
      const stepElapsed = now - startTime;
      const step = steps[stepIndex];

      // Step-level progress (0-100)
      const sp = Math.min(100, Math.round((stepElapsed / step.duration) * 100));
      setStepProgress(sp);

      // Overall progress
      const overall = Math.min(98, Math.round(((elapsed + stepElapsed) / totalDuration) * 100));
      setProgress(overall);
      setCurrentStep(stepIndex);

      if (stepElapsed >= step.duration) {
        elapsed += step.duration;
        stepIndex++;
        startTime = Date.now();
        if (stepIndex >= steps.length) {
          setProgress(100);
          setStepProgress(100);
          onComplete?.();
          return;
        }
      }
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, []);

  const shortName = fileName
    ? fileName.length > 18 ? fileName.substring(0, 16) + '...' : fileName
    : 'resume.pdf';

  return (
    <div className="flex flex-col items-center justify-center py-10 px-4">
      {/* Animated ring */}
      <div className="relative w-20 h-20 mb-5">
        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="34" fill="none" stroke="#e5e7eb" strokeWidth="6" />
          <circle
            cx="40" cy="40" r="34" fill="none"
            stroke="url(#grad)" strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 34}`}
            strokeDashoffset={`${2 * Math.PI * 34 * (1 - progress / 100)}`}
            style={{ transition: 'stroke-dashoffset 0.3s ease' }}
          />
          <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-indigo-600">{progress}%</span>
        </div>
      </div>

      {/* Title */}
      <p className="text-base font-semibold text-gray-800 mb-1">Your resume is being parsed</p>

      {/* File chip */}
      <div className="flex items-center gap-2 bg-gray-100 border border-gray-200 rounded-full px-3 py-1.5 mb-5">
        <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM6 20V4h5v7h7v9H6z"/>
        </svg>
        <span className="text-sm text-gray-700 font-medium truncate max-w-[140px]">{shortName}</span>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-indigo-600">{progress}%</span>
        </div>
      </div>

      {/* Step bar */}
      <div className="w-full max-w-xs">
        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden mb-2">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 text-center animate-pulse">
          {steps[Math.min(currentStep, steps.length - 1)]?.label}
        </p>
      </div>

      {/* Step dots */}
      <div className="flex gap-1.5 mt-4">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`rounded-full transition-all duration-300 ${
              i < currentStep ? 'w-2 h-2 bg-indigo-500' :
              i === currentStep ? 'w-3 h-2 bg-purple-500' :
              'w-2 h-2 bg-gray-300'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

// ── Generic AI feature loader (JD generation, scoring, etc.) ──────────────────
interface AIFeatureLoaderProps {
  title: string;
  subtitle?: string;
  steps?: string[];
  icon?: 'sparkles' | 'brain' | 'document' | 'chart';
}

const ICONS = {
  sparkles: (
    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
    </svg>
  ),
  brain: (
    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25zm.75-12h9v9h-9v-9z" />
    </svg>
  ),
  document: (
    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  ),
  chart: (
    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  ),
};

export const AIFeatureLoader: React.FC<AIFeatureLoaderProps> = ({
  title,
  subtitle,
  steps = [],
  icon = 'sparkles',
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [dots, setDots] = useState('');

  useEffect(() => {
    if (!steps.length) return;
    const interval = setInterval(() => {
      setActiveStep(s => (s + 1) % steps.length);
    }, 1400);
    return () => clearInterval(interval);
  }, [steps.length]);

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(d => d.length >= 3 ? '' : d + '.');
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      {/* Pulsing icon */}
      <div className="relative mb-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
          {ICONS[icon]}
        </div>
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-4 w-4 bg-purple-500" />
        </span>
      </div>

      <h3 className="text-lg font-bold text-gray-900 mb-1">{title}{dots}</h3>
      {subtitle && <p className="text-sm text-gray-500 mb-6 max-w-xs">{subtitle}</p>}

      {/* Animated bar */}
      <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden mb-5">
        <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full animate-loading-bar" />
      </div>

      {/* Steps list */}
      {steps.length > 0 && (
        <div className="space-y-2 w-full max-w-xs">
          {steps.map((step, i) => (
            <div
              key={i}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-300 ${
                i === activeStep
                  ? 'bg-indigo-50 border border-indigo-200'
                  : i < activeStep
                  ? 'opacity-40'
                  : 'opacity-25'
              }`}
            >
              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                i === activeStep ? 'bg-indigo-100' : 'bg-gray-100'
              }`}>
                {i < activeStep ? (
                  <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                ) : i === activeStep ? (
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                ) : (
                  <div className="w-2 h-2 bg-gray-300 rounded-full" />
                )}
              </div>
              <span className={`text-xs font-medium ${i === activeStep ? 'text-indigo-700' : 'text-gray-500'}`}>
                {step}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AIProgressLoader;
