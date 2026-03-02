import React, { useState } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, onSave, title, description, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose}></div>
        
        <div className="relative bg-white rounded-2xl shadow-xl max-w-2xl w-full p-8 animate-fadeIn">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>

          <h2 className="text-2xl font-semibold text-gray-900 mb-2">{title}</h2>
          {description && <p className="text-gray-600 text-sm mb-6">{description}</p>}

          <div className="mb-6">{children}</div>

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Skills Modal
export const SkillsModal: React.FC<{ isOpen: boolean; onClose: () => void; onSave: (skills: string[]) => void; currentSkills: string[] }> = 
  ({ isOpen, onClose, onSave, currentSkills }) => {
  const [skills, setSkills] = useState<string[]>(currentSkills || []);
  const [input, setInput] = useState('');

  const addSkill = () => {
    if (input.trim() && !skills.includes(input.trim())) {
      setSkills([...skills, input.trim()]);
      setInput('');
    }
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter(s => s !== skill));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      onSave={() => onSave(skills)}
      title="Key skills"
      description="Recruiters look for candidates with specific keyskills. Add them here to appear in searches."
    >
      <div className="border border-gray-300 rounded-lg p-4 min-h-[120px]">
        <div className="flex flex-wrap gap-2 mb-3">
          {skills.map((skill, index) => (
            <span key={index} className="inline-flex items-center px-3 py-1.5 rounded-full text-sm bg-gray-100 text-gray-800 border">
              {skill}
              <button onClick={() => removeSkill(skill)} className="ml-2 text-gray-600 hover:text-gray-800">×</button>
            </span>
          ))}
        </div>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
          placeholder="Enter your key skills"
          className="w-full border-none outline-none text-sm bg-transparent"
        />
      </div>
    </Modal>
  );
};

// Languages Modal
export const LanguagesModal: React.FC<{ isOpen: boolean; onClose: () => void; onSave: (languages: string[]) => void; currentLanguages: string[] }> = 
  ({ isOpen, onClose, onSave, currentLanguages }) => {
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(currentLanguages || []);
  const availableLanguages = ['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam', 'Bengali', 'Marathi'];

  const toggleLanguage = (lang: string) => {
    if (selectedLanguages.includes(lang)) {
      setSelectedLanguages(selectedLanguages.filter(l => l !== lang));
    } else {
      setSelectedLanguages([...selectedLanguages, lang]);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      onSave={() => onSave(selectedLanguages)}
      title="Languages known"
      description="Strengthen your resume by letting recruiters know you can communicate in multiple languages"
    >
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Language</label>
        <div className="flex flex-wrap gap-2">
          {availableLanguages.map((lang) => (
            <button
              key={lang}
              onClick={() => toggleLanguage(lang)}
              className={`px-4 py-2 rounded-full text-sm border transition-colors ${
                selectedLanguages.includes(lang)
                  ? 'bg-blue-50 border-blue-600 text-blue-600'
                  : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
              }`}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
};

// Career Preferences Modal
export const CareerPreferencesModal: React.FC<{ isOpen: boolean; onClose: () => void; onSave: (data: any) => void; currentData: any }> = 
  ({ isOpen, onClose, onSave, currentData }) => {
  const [lookingFor, setLookingFor] = useState<string[]>(currentData?.lookingFor || []);
  const [availability, setAvailability] = useState(currentData?.availability || '');
  const [locations, setLocations] = useState<string[]>(currentData?.locations || []);

  const toggleLookingFor = (type: string) => {
    if (lookingFor.includes(type)) {
      setLookingFor(lookingFor.filter(t => t !== type));
    } else {
      setLookingFor([...lookingFor, type]);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      onSave={() => onSave({ lookingFor, availability, locations })}
      title="Career preferences"
      description="Tell us your preferences for your next job & we will send you most relevant recommendations"
    >
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-3">Looking for</label>
          <div className="flex gap-3">
            {['Internships', 'Jobs'].map((type) => (
              <button
                key={type}
                onClick={() => toggleLookingFor(type)}
                className={`px-4 py-2 rounded-full text-sm border transition-colors ${
                  lookingFor.includes(type)
                    ? 'bg-blue-50 border-blue-600 text-blue-600'
                    : 'bg-white border-gray-300 text-gray-700'
                }`}
              >
                {type} +
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-3">Availability to work</label>
          <div className="flex flex-wrap gap-2">
            {['15 Days or less', '1 Month', '2 Months', '3 Months', 'More than 3 Months'].map((option) => (
              <button
                key={option}
                onClick={() => setAvailability(option)}
                className={`px-4 py-2 rounded-full text-sm border transition-colors ${
                  availability === option
                    ? 'bg-blue-50 border-blue-600 text-blue-600'
                    : 'bg-white border-gray-300 text-gray-700'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-3">Preferred work location(s)</label>
          <select className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            <option>Select from the list</option>
            <option>Bengaluru</option>
            <option>Delhi / NCR</option>
            <option>Mumbai</option>
            <option>Chennai</option>
            <option>Hyderabad</option>
            <option>Pune</option>
          </select>
        </div>
      </div>
    </Modal>
  );
};

// Education Modal
export const EducationModal: React.FC<{ isOpen: boolean; onClose: () => void; onSave: (education: string) => void; currentEducation: string }> = 
  ({ isOpen, onClose, onSave, currentEducation }) => {
  const [education, setEducation] = useState(currentEducation || '');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      onSave={() => onSave(education)}
      title="Education"
      description="Add your educational qualifications"
    >
      <textarea
        value={education}
        onChange={(e) => setEducation(e.target.value)}
        placeholder="e.g., Bachelor of Technology in Computer Science, Anna University, 2020-2024"
        rows={4}
        className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
    </Modal>
  );
};

// Employment Modal
export const EmploymentModal: React.FC<{ isOpen: boolean; onClose: () => void; onSave: (data: any) => void; currentData: any }> = 
  ({ isOpen, onClose, onSave, currentData }) => {
  const [companyName, setCompanyName] = useState(currentData?.companyName || '');
  const [roleTitle, setRoleTitle] = useState(currentData?.roleTitle || '');
  const [employment, setEmployment] = useState(currentData?.employment || '');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      onSave={() => onSave({ companyName, roleTitle, employment })}
      title="Employment"
      description="Talk about the company you worked at, your designation and describe what all you did there"
    >
      <div className="space-y-4">
        <input
          type="text"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="Company Name"
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <input
          type="text"
          value={roleTitle}
          onChange={(e) => setRoleTitle(e.target.value)}
          placeholder="Role Title"
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <textarea
          value={employment}
          onChange={(e) => setEmployment(e.target.value)}
          placeholder="Describe your responsibilities and achievements..."
          rows={5}
          className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </Modal>
  );
};

// Profile Summary Modal
export const ProfileSummaryModal: React.FC<{ isOpen: boolean; onClose: () => void; onSave: (summary: string) => void; currentSummary: string }> = 
  ({ isOpen, onClose, onSave, currentSummary }) => {
  const [summary, setSummary] = useState(currentSummary || '');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      onSave={() => onSave(summary)}
      title="Profile Summary"
      description="Your Profile Summary should mention the highlights of your career and education, what your professional interests are, and what kind of a career you are looking for."
    >
      <textarea
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
        placeholder="Write a compelling profile summary..."
        rows={6}
        className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
      <p className="text-sm text-gray-500 mt-2">{summary.length} characters</p>
    </Modal>
  );
};
