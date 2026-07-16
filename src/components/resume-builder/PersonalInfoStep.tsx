import React, { useState } from 'react';
import { useResumeStore } from '../../store/useResumeStore';

interface FieldProps {
  label: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
  error?: string;
}

function Field({ label, required, value, onChange, placeholder, type = 'text', error }: FieldProps) {
  const [touched, setTouched] = useState(false);
  const showError = touched && required && !value.trim();
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => setTouched(true)}
        placeholder={placeholder}
        className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
          showError ? 'border-red-300 bg-red-50' : 'border-gray-300'
        }`}
      />
      {showError && <p className="text-[11px] text-red-500 mt-1">{label} is required</p>}
    </div>
  );
}

export default function PersonalInfoStep() {
  const { data, updatePersonalInfo } = useResumeStore();
  const { personalInfo } = data;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Personal Information</h2>
        <p className="text-sm text-gray-500 mt-0.5">Tell us about yourself</p>
        <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1"><span className="text-amber-400">💡</span> Add <span className="text-amber-500 font-medium">LinkedIn</span> and <span className="text-amber-500 font-medium">Portfolio</span> — recruiters check these to verify your background</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Full Name" required value={personalInfo.name} onChange={(v) => updatePersonalInfo('name', v)} placeholder="e.g. Rajesh Kumar" />
        <Field label="Email" required value={personalInfo.email} onChange={(v) => updatePersonalInfo('email', v)} placeholder="rajesh@example.com" type="email" />
        <Field label="Phone" required value={personalInfo.phone} onChange={(v) => updatePersonalInfo('phone', v)} placeholder="+91 98765 43210" type="tel" />
        <Field label="Location" required value={personalInfo.location} onChange={(v) => updatePersonalInfo('location', v)} placeholder="Chennai, India" />
        <Field label="LinkedIn" value={personalInfo.linkedin} onChange={(v) => updatePersonalInfo('linkedin', v)} placeholder="linkedin.com/in/yourprofile" type="url" />
        <Field label="Portfolio" value={personalInfo.portfolio} onChange={(v) => updatePersonalInfo('portfolio', v)} placeholder="yourportfolio.com" type="url" />
      </div>
    </div>
  );
}
