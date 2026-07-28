import React, { useState, useCallback, useEffect } from 'react';
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
  const ref = React.useRef<HTMLInputElement>(null);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  }, [onChange]);

  const showError = touched && required && !value.trim();
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        ref={ref}
        type={type}
        value={value}
        onChange={handleChange}
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

      {/* Upload Resume Banner */}
      <label className="flex items-center gap-3 p-3 border-2 border-dashed border-blue-300 bg-blue-50 rounded-xl cursor-pointer hover:bg-blue-100 transition-colors group">
        <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" className="hidden" onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) window.dispatchEvent(new CustomEvent('zync:import-resume', { detail: { file } }));
          e.target.value = '';
        }} />
        <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-blue-700">Upload Resume to Auto-fill</p>
          <p className="text-xs text-blue-500">PDF, DOC, DOCX, JPG, PNG — AI will parse and fill all fields</p>
        </div>
        <span className="text-xs font-medium text-blue-600 bg-white border border-blue-200 px-3 py-1 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">Browse</span>
      </label>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Full Name" required value={personalInfo.name} onChange={(v) => updatePersonalInfo('name', v)} placeholder="e.g. Priya Sharma" />
        <Field label="Email" required value={personalInfo.email} onChange={(v) => updatePersonalInfo('email', v)} placeholder="e.g. priya@gmail.com" type="email" />
        <Field label="Phone" required value={personalInfo.phone} onChange={(v) => updatePersonalInfo('phone', v)} placeholder="e.g. +91 98765 43210" type="tel" />
        <Field label="Location" required value={personalInfo.location} onChange={(v) => updatePersonalInfo('location', v)} placeholder="e.g. Bangalore, India" />
        <Field label="LinkedIn" value={personalInfo.linkedin} onChange={(v) => updatePersonalInfo('linkedin', v)} placeholder="e.g. linkedin.com/in/priyasharma" type="url" />
        <Field label="Portfolio" value={personalInfo.portfolio} onChange={(v) => updatePersonalInfo('portfolio', v)} placeholder="e.g. priyasharma.dev" type="url" />
      </div>
    </div>
  );
}