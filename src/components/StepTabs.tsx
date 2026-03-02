import React from 'react';
import { User, Briefcase, GraduationCap, Star, FileText, Check } from 'lucide-react';
import useResumeStore from '../store/useResumeStore';

const StepTabs = () => {
  const { currentStep, setCurrentStep } = useResumeStore();

  const steps = [
    { id: 0, name: 'Contact', icon: User },
    { id: 1, name: 'Experience', icon: Briefcase },
    { id: 2, name: 'Education', icon: GraduationCap },
    { id: 3, name: 'Skills', icon: Star },
    { id: 4, name: 'Summary', icon: FileText },
    { id: 5, name: 'Finalize', icon: Check }
  ];

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <div className="flex space-x-1 overflow-x-auto">
        {steps.map((step) => {
          const IconComponent = step.icon;
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;
          
          return (
            <button
              key={step.id}
              onClick={() => setCurrentStep(step.id)}
              className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-medium text-sm transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-blue-500 text-white'
                  : isCompleted
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <IconComponent className="w-4 h-4" />
              <span>{step.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default StepTabs;