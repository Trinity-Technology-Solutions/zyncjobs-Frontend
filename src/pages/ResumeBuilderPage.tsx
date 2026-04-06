import React, { useState } from 'react';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import Header from '../components/Header';
import BackButton from '../components/BackButton';
import TemplateSelection from '../components/resume-builder/TemplateSelection';
import PersonalInfoStep from '../components/resume-builder/PersonalInfoStep';
import SummaryStep from '../components/resume-builder/SummaryStep';
import ExperienceStep from '../components/resume-builder/ExperienceStep';
import EducationStep from '../components/resume-builder/EducationStep';
import SkillsStep from '../components/resume-builder/SkillsStep';
import AISuggestionsStep from '../components/resume-builder/AISuggestionsStep';
import PreviewStep from '../components/resume-builder/PreviewStep';
import LivePreview from '../components/resume-builder/LivePreview';
import { useResumeStore } from '../store/useResumeStore';

interface ResumeBuilderPageProps {
  onNavigate?: (page: string) => void;
  user?: any;
  onLogout?: () => void;
}

const steps = [
  { id: 0, name: 'Template', component: TemplateSelection },
  { id: 1, name: 'Personal Info', component: PersonalInfoStep },
  { id: 2, name: 'Summary', component: SummaryStep },
  { id: 3, name: 'Experience', component: ExperienceStep },
  { id: 4, name: 'Education', component: EducationStep },
  { id: 5, name: 'Skills', component: SkillsStep },
  { id: 6, name: 'AI Optimize', component: AISuggestionsStep },
  { id: 7, name: 'Preview', component: PreviewStep },
];

const ResumeBuilderPage: React.FC<ResumeBuilderPageProps> = ({ onNavigate, user, onLogout }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const { data } = useResumeStore();

  const CurrentStepComponent = steps[currentStep].component;

  const canGoNext = () => {
    if (currentStep === 1) {
      return data.personalInfo.name && data.personalInfo.email && data.personalInfo.phone && data.personalInfo.location;
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) setCurrentStep(currentStep + 1);
  };

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />

      <div className="max-w-7xl mx-auto px-4 py-6">
        <BackButton
          onClick={() => onNavigate?.('resume-studio')}
          text="Back to Resume Studio"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800 mb-6"
        />

        <div className="flex gap-6">
          {/* LEFT SIDEBAR - Steps */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-white rounded-xl border border-gray-200 p-4 sticky top-6">
              <h3 className="font-semibold text-gray-900 mb-4">Resume Builder</h3>
              <div className="space-y-2">
                {steps.map((step, idx) => (
                  <button
                    key={step.id}
                    onClick={() => setCurrentStep(idx)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                      currentStep === idx
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : currentStep > idx
                        ? 'text-gray-700 hover:bg-gray-50'
                        : 'text-gray-400'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                        currentStep === idx
                          ? 'bg-blue-600 text-white'
                          : currentStep > idx
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {currentStep > idx ? <Check className="w-4 h-4" /> : idx + 1}
                    </div>
                    <span className="text-sm">{step.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* CENTER - Current Step */}
          <div className="flex-1">
            <div className="bg-white rounded-xl border border-gray-200 p-8 min-h-[600px]">
              <CurrentStepComponent />
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
                disabled={currentStep === steps.length - 1 || !canGoNext()}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* RIGHT - Live Preview */}
          <div className="w-96 flex-shrink-0">
            <div className="sticky top-6">
              <LivePreview />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeBuilderPage;
