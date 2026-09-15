import { useResumeStore } from '../../store/useResumeStore';
import { personalInfoValidators } from '../../utils/resumeFieldValidators';
import ValidatedInput from './ValidatedInput';

export default function PersonalInfoStep() {
  const { data, updatePersonalInfo } = useResumeStore();
  const { personalInfo } = data;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Personal Information</h2>
        <p className="text-sm text-gray-500 mt-0.5">Tell us about yourself</p>
        <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
          <svg className="w-3 h-3 text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Add <span className="text-amber-500 font-medium">LinkedIn</span> and <span className="text-amber-500 font-medium">Portfolio</span> — recruiters check these to verify your background
        </p>
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
        <ValidatedInput
          id="pi-name"
          label="Full Name"
          required
          value={personalInfo.name}
          onCommit={(v) => updatePersonalInfo('name', v)}
          validator={personalInfoValidators.name}
          placeholder="Enter your full name"
          labelClassName="text-sm font-semibold text-gray-700 mb-2"
          inputClassName="px-4 py-2.5"
        />
        <ValidatedInput
          id="pi-email"
          label="Email"
          required
          value={personalInfo.email}
          onCommit={(v) => updatePersonalInfo('email', v)}
          validator={personalInfoValidators.email}
          placeholder="Enter your email address"
          type="email"
          labelClassName="text-sm font-semibold text-gray-700 mb-2"
          inputClassName="px-4 py-2.5"
        />
        <ValidatedInput
          id="pi-phone"
          label="Phone"
          required
          value={personalInfo.phone}
          onCommit={(v) => updatePersonalInfo('phone', v)}
          validator={personalInfoValidators.phone}
          placeholder="Enter your phone number"
          type="tel"
          labelClassName="text-sm font-semibold text-gray-700 mb-2"
          inputClassName="px-4 py-2.5"
        />
        <ValidatedInput
          id="pi-location"
          label="Location"
          required
          value={personalInfo.location}
          onCommit={(v) => updatePersonalInfo('location', v)}
          validator={personalInfoValidators.location}
          placeholder="Enter your city and country"
          labelClassName="text-sm font-semibold text-gray-700 mb-2"
          inputClassName="px-4 py-2.5"
        />
        <ValidatedInput
          id="pi-linkedin"
          label="LinkedIn"
          value={personalInfo.linkedin}
          onCommit={(v) => updatePersonalInfo('linkedin', v)}
          validator={personalInfoValidators.linkedin}
          placeholder="Enter your LinkedIn profile URL"
          type="url"
          labelClassName="text-sm font-semibold text-gray-700 mb-2"
          inputClassName="px-4 py-2.5"
        />
        <ValidatedInput
          id="pi-portfolio"
          label="Portfolio"
          value={personalInfo.portfolio}
          onCommit={(v) => updatePersonalInfo('portfolio', v)}
          validator={personalInfoValidators.portfolio}
          placeholder="Enter your portfolio or website URL"
          type="url"
          labelClassName="text-sm font-semibold text-gray-700 mb-2"
          inputClassName="px-4 py-2.5"
        />
      </div>
    </div>
  );
}