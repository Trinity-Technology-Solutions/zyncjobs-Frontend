import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import Header from '../components/Header';
import BackButton from '../components/BackButton';
import TemplateSelection from '../components/resume-builder/TemplateSelection';
import PersonalInfoStep from '../components/resume-builder/PersonalInfoStep';
import SummaryStep from '../components/resume-builder/SummaryStep';
import ExperienceStep from '../components/resume-builder/ExperienceStep';
import EducationStep from '../components/resume-builder/EducationStep';
import SkillsStep from '../components/resume-builder/SkillsStep';
import AISuggestionsStep from '../components/resume-builder/AISuggestionsStep';
import CertificationsAwardsStep from '../components/resume-builder/CertificationsAwardsStep';
import PreviewStep from '../components/resume-builder/PreviewStep';
import LivePreview from '../components/resume-builder/LivePreview';
import { useResumeStore } from '../store/useResumeStore';

interface ResumeBuilderPageProps {
  onNavigate?: (page: string) => void;
  user?: any;
  onLogout?: () => void;
}

const steps = [
  { id: 0, name: 'Template',       component: TemplateSelection },
  { id: 1, name: 'Personal Info',  component: PersonalInfoStep },
  { id: 2, name: 'Summary',        component: SummaryStep },
  { id: 3, name: 'Experience',     component: ExperienceStep },
  { id: 4, name: 'Education',      component: EducationStep },
  { id: 5, name: 'Skills',         component: SkillsStep },
  { id: 6, name: 'Certifications', component: CertificationsAwardsStep },
  { id: 7, name: 'AI Optimize',    component: AISuggestionsStep },
  { id: 8, name: 'Preview',        component: PreviewStep },
];

const ResumeBuilderPage: React.FC<ResumeBuilderPageProps> = ({ onNavigate, user, onLogout }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const { data } = useResumeStore();

  const CurrentStepComponent = steps[currentStep].component;

  const canGoNext = () => {
    if (currentStep === 1) {
      return data.personalInfo.name && data.personalInfo.email && data.personalInfo.phone;
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep === steps.length - 1) {
      onNavigate?.('resume-studio');
      return;
    }
    if (currentStep < steps.length - 1) setCurrentStep(currentStep + 1);
  };

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const isLastStep = currentStep === steps.length - 1;
  // Hide live preview on Template and Finalize steps
  const showPreview = currentStep !== 7;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />

      <div className="w-full px-4 pt-4 pb-2">
        <BackButton
          onClick={() => onNavigate?.('resume-studio')}
          text="Back to Resume Studio"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800 mb-4"
        />
      </div>

      <div className="flex flex-1 w-full px-4 gap-0">
        {/* ── LEFT: form panel ── */}
        <div className={`flex flex-col ${showPreview ? 'w-[52%]' : 'w-full'} transition-all`}>

          {/* ── Horizontal step tabs ── */}
          <div className="bg-white border border-gray-200 rounded-tl-xl rounded-tr-xl px-6 pt-5 pb-4">
            {/* Step label */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-blue-600">{steps[currentStep].name}</span>
              <span className="text-xs text-gray-400">Step {currentStep + 1} of {steps.length}</span>
            </div>
            {/* Progress dots */}
            <div className="flex items-center relative">
              <div className="absolute top-1/2 left-0 right-0 h-px bg-gray-200 -translate-y-1/2 z-0" />
              <div
                className="absolute top-1/2 left-0 h-px bg-blue-500 -translate-y-1/2 z-0 transition-all duration-300"
                style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
              />
              {steps.map((step, idx) => {
                const done   = idx < currentStep;
                const active = idx === currentStep;
                return (
                  <button
                    key={idx}
                    onClick={() => setCurrentStep(idx)}
                    title={step.name}
                    className="flex-1 flex justify-center z-10"
                  >
                    <div
                      className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all text-xs font-bold
                        ${ done   ? 'bg-blue-500 border-blue-500 text-white'
                         : active ? 'bg-white border-blue-500 text-blue-600 shadow-md ring-2 ring-blue-100'
                         :          'bg-white border-gray-300 text-gray-400'}`}
                    >
                      {done ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-6">
              <button
                onClick={handlePrev}
                disabled={currentStep === 0}
                className="flex items-center gap-2 px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>

              <div className="text-sm text-gray-500">
                Step {currentStep + 1} of {steps.length}
              </div>

              <button
                onClick={handleNext}
                disabled={currentStep < steps.length - 1 && !canGoNext()}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          {/* ── Step content ── */}
          <div className="bg-white border-l border-r border-gray-200 px-8 py-8 flex-1 overflow-y-auto">
            <CurrentStepComponent />
          </div>

          {/* ── Bottom nav ── */}
          <div className="bg-white border border-gray-200 rounded-bl-xl rounded-br-xl px-8 py-4 flex items-center justify-between">
            <button
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              {currentStep > 0 ? `Back: ${steps[currentStep - 1].name}` : 'Back'}
            </button>

            <span className="text-xs text-gray-400">
              {currentStep + 1} / {steps.length}
            </span>

            <button
              onClick={handleNext}
              disabled={isLastStep || !canGoNext()}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {isLastStep ? 'Finish' : `Next: ${steps[currentStep + 1].name}`}
              {!isLastStep && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* ── RIGHT: live preview ── */}
        {showPreview && (
          <div className="w-[48%] pl-4 sticky top-6 self-start" style={{ maxHeight: 'calc(100vh - 120px)' }}>
            <LivePreview />
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeBuilderPage;
