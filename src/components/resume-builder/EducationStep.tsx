import { useState } from 'react';
import { Plus, Trash2, Sparkles, Loader2, GraduationCap, School, BookOpen } from 'lucide-react';
import { useResumeStore, EducationLevel, EducationItem } from '../../store/useResumeStore';
import { executeResumeAI } from '../../services/resumeAIClient';
import { classifyEducationLevel, getEducationLevelLabel } from '../../utils/educationFormatter';
import { ph } from '../../utils/goalPlaceholders';
import { validateOrgName, validateJobTitle, validateDuration, validateGrade } from '../../utils/resumeFieldValidators';
import ValidatedInput from './ValidatedInput';

const QUICK_UG = ['B.E Computer Science', 'B.Tech IT', 'B.Sc Computer Science', 'BCA', 'B.Com', 'BBA', 'B.E Mechanical'];
const QUICK_PG = ['MCA', 'M.Tech', 'MBA', 'M.Sc Computer Science', 'M.Com', 'M.S.'];

const LEVEL_OPTIONS: { value: EducationLevel; label: string }[] = [
  { value: '10th', label: '10th / Secondary' },
  { value: '12th', label: '12th / Higher Secondary' },
  { value: 'ug', label: 'Undergraduate (UG)' },
  { value: 'pg', label: 'Postgraduate (PG)' },
  { value: 'other', label: 'Other / Diploma' },
];

interface EduInputProps {
  label: string;
  required?: boolean;
  hint?: string;
  value: string;
  onCommit: (val: string) => void;
  validator?: (val: string) => string | null;
  placeholder: string;
  className?: string;
}

function EduInput({
  label,
  required,
  hint,
  value,
  onCommit,
  validator,
  placeholder,
  className,
}: EduInputProps) {
  return (
    <ValidatedInput
      label={label}
      required={required}
      hint={hint}
      value={value}
      onCommit={onCommit}
      validator={validator}
      placeholder={placeholder}
      className={className}
      labelClassName="block text-xs font-medium text-gray-700 mb-1"
    />
  );
}

export default function EducationStep() {
  const { data, addEducation, updateEducation, removeEducation } = useResumeStore();
  const goal = data.goal || '';
  const [aiLoading, setAiLoading] = useState(false);

  const suggestEducation = async () => {
    setAiLoading(true);
    const title = data.experience[0]?.title || data.summary || 'Professional';
    try {
      const res = await executeResumeAI({
        section: 'education',
        action: 'generate',
        content: `Target role: ${title}\n\nGenerate 2-3 relevant educational entries. Format: Degree, Institution, Year`,
      });
      const lines = (res.result || '').split('\n').filter(Boolean);
      for (const line of lines) {
        const parts = line.split(',').map(s => s.trim());
        if (parts.length >= 1) {
          const deg = parts[0];
          const institution = parts[1] || '';
          const year = parts[2] || '';
          const level = classifyEducationLevel(deg, institution);
          addEducation(level);
          const fresh = useResumeStore.getState();
          const newItem = fresh.data.education[fresh.data.education.length - 1];
          if (newItem) {
            if (deg) fresh.updateEducation(newItem.id, 'degree', deg);
            if (institution) fresh.updateEducation(newItem.id, 'institution', institution);
            if (year) fresh.updateEducation(newItem.id, 'duration', year);
          }
        }
      }
    } catch (error) {
      console.error('Education suggestion failed:', error);
    } finally {
      setAiLoading(false);
    }
  };

  const hasRole = data.experience[0]?.title || data.summary;

  const renderLevelSpecificFields = (edu: EducationItem) => {
    switch (edu.level) {
      case '10th':
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <EduInput
                label="School Name"
                required
                value={edu.institution || ''}
                onCommit={v => updateEducation(edu.id, 'institution', v)}
                validator={validateOrgName}
                placeholder="e.g. St. Xavier's High School"
              />
              <EduInput
                label="Board / Examination"
                value={edu.board || ''}
                onCommit={v => updateEducation(edu.id, 'board', v)}
                validator={validateOrgName}
                placeholder="e.g. CBSE, ICSE, State Board, SSC"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <EduInput
                label="Passing Year"
                value={edu.duration || ''}
                onCommit={v => updateEducation(edu.id, 'duration', v)}
                validator={validateDuration}
                placeholder="e.g. 2018"
              />
              <EduInput
                label="Percentage / CGPA"
                value={edu.grade || ''}
                onCommit={v => updateEducation(edu.id, 'grade', v)}
                validator={validateGrade}
                placeholder="e.g. 88% or 9.0 CGPA"
              />
              <EduInput
                label="Location"
                hint="(optional)"
                value={edu.location || ''}
                onCommit={v => updateEducation(edu.id, 'location', v)}
                placeholder="e.g. Mumbai, India"
              />
            </div>
          </div>
        );

      case '12th':
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <EduInput
                label="School / Junior College"
                required
                className="md:col-span-2"
                value={edu.institution || ''}
                onCommit={v => updateEducation(edu.id, 'institution', v)}
                validator={validateOrgName}
                placeholder="e.g. Delhi Public School"
              />
              <EduInput
                label="Board / Examination"
                value={edu.board || ''}
                onCommit={v => updateEducation(edu.id, 'board', v)}
                validator={validateOrgName}
                placeholder="e.g. CBSE, ISC, State Board, HSC"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <EduInput
                label="Stream / Group"
                value={edu.fieldOfStudy || ''}
                onCommit={v => updateEducation(edu.id, 'fieldOfStudy', v)}
                validator={validateJobTitle}
                placeholder="e.g. Science (PCM), Commerce, Arts"
              />
              <EduInput
                label="Passing Year"
                value={edu.duration || ''}
                onCommit={v => updateEducation(edu.id, 'duration', v)}
                validator={validateDuration}
                placeholder="e.g. 2020"
              />
              <EduInput
                label="Percentage / CGPA"
                value={edu.grade || ''}
                onCommit={v => updateEducation(edu.id, 'grade', v)}
                validator={validateGrade}
                placeholder="e.g. 91% or 9.1 CGPA"
              />
            </div>
          </div>
        );

      case 'ug':
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <EduInput
                label="College / University"
                required
                className="md:col-span-2"
                value={edu.institution || ''}
                onCommit={v => updateEducation(edu.id, 'institution', v)}
                validator={validateOrgName}
                placeholder={ph(goal, 'institution') || 'e.g. Anna University'}
              />
              <EduInput
                label="Location"
                hint="(optional)"
                value={edu.location || ''}
                onCommit={v => updateEducation(edu.id, 'location', v)}
                placeholder="e.g. Chennai, India"
              />
            </div>

            {!edu.degree && (
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-[11px] text-gray-400 mr-1">Quick select:</span>
                {QUICK_UG.map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => updateEducation(edu.id, 'degree', d)}
                    className="px-2.5 py-1 text-xs border border-gray-200 rounded-md hover:border-blue-500 hover:text-blue-700 bg-white transition-colors"
                  >
                    {d}
                  </button>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <EduInput
                label="Undergraduate Degree"
                required
                value={edu.degree || ''}
                onCommit={v => updateEducation(edu.id, 'degree', v)}
                validator={validateJobTitle}
                placeholder="e.g. B.Tech, B.E., B.Sc, BCA, B.Com"
              />
              <EduInput
                label="Field of Study / Major"
                hint="(optional)"
                value={edu.fieldOfStudy || ''}
                onCommit={v => updateEducation(edu.id, 'fieldOfStudy', v)}
                validator={validateJobTitle}
                placeholder="e.g. Computer Science & Engineering"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <EduInput
                label="Duration / Years"
                value={edu.duration || ''}
                onCommit={v => updateEducation(edu.id, 'duration', v)}
                validator={validateDuration}
                placeholder="e.g. 2018 – 2022"
              />
              <EduInput
                label="CGPA / Percentage"
                value={edu.grade || ''}
                onCommit={v => updateEducation(edu.id, 'grade', v)}
                validator={validateGrade}
                placeholder="e.g. 8.5 CGPA or 85%"
              />
            </div>
          </div>
        );

      case 'pg':
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <EduInput
                label="University / Institute"
                required
                className="md:col-span-2"
                value={edu.institution || ''}
                onCommit={v => updateEducation(edu.id, 'institution', v)}
                validator={validateOrgName}
                placeholder="e.g. IIT Madras, IIM Bangalore"
              />
              <EduInput
                label="Location"
                hint="(optional)"
                value={edu.location || ''}
                onCommit={v => updateEducation(edu.id, 'location', v)}
                placeholder="e.g. Bangalore, India"
              />
            </div>

            {!edu.degree && (
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-[11px] text-gray-400 mr-1">Quick select:</span>
                {QUICK_PG.map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => updateEducation(edu.id, 'degree', d)}
                    className="px-2.5 py-1 text-xs border border-gray-200 rounded-md hover:border-purple-500 hover:text-purple-700 bg-white transition-colors"
                  >
                    {d}
                  </button>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <EduInput
                label="Postgraduate Degree"
                required
                value={edu.degree || ''}
                onCommit={v => updateEducation(edu.id, 'degree', v)}
                validator={validateJobTitle}
                placeholder="e.g. MBA, M.Tech, MCA, M.Sc, M.S."
              />
              <EduInput
                label="Specialization / Major"
                hint="(optional)"
                value={edu.fieldOfStudy || ''}
                onCommit={v => updateEducation(edu.id, 'fieldOfStudy', v)}
                validator={validateJobTitle}
                placeholder="e.g. Artificial Intelligence, Marketing, Finance"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <EduInput
                label="Duration / Years"
                value={edu.duration || ''}
                onCommit={v => updateEducation(edu.id, 'duration', v)}
                validator={validateDuration}
                placeholder="e.g. 2022 – 2024"
              />
              <EduInput
                label="CGPA / Grade"
                value={edu.grade || ''}
                onCommit={v => updateEducation(edu.id, 'grade', v)}
                validator={validateGrade}
                placeholder="e.g. 8.8 CGPA or 3.8 GPA"
              />
            </div>
          </div>
        );

      case 'other':
      default:
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <EduInput
                label="Institution / Organization"
                required
                className="md:col-span-2"
                value={edu.institution || ''}
                onCommit={v => updateEducation(edu.id, 'institution', v)}
                validator={validateOrgName}
                placeholder="e.g. Government Polytechnic"
              />
              <EduInput
                label="Location"
                hint="(optional)"
                value={edu.location || ''}
                onCommit={v => updateEducation(edu.id, 'location', v)}
                placeholder="e.g. Pune, India"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <EduInput
                label="Qualification / Diploma Name"
                required
                value={edu.degree || ''}
                onCommit={v => updateEducation(edu.id, 'degree', v)}
                validator={validateJobTitle}
                placeholder="e.g. Diploma in Mechanical Engineering"
              />
              <EduInput
                label="Field / Specialization"
                hint="(optional)"
                value={edu.fieldOfStudy || ''}
                onCommit={v => updateEducation(edu.id, 'fieldOfStudy', v)}
                validator={validateJobTitle}
                placeholder="e.g. Automobile Engineering"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <EduInput
                label="Duration / Year"
                value={edu.duration || ''}
                onCommit={v => updateEducation(edu.id, 'duration', v)}
                validator={validateDuration}
                placeholder="e.g. 2017 – 2020"
              />
              <EduInput
                label="Grade / Score"
                value={edu.grade || ''}
                onCommit={v => updateEducation(edu.id, 'grade', v)}
                validator={validateGrade}
                placeholder="e.g. Distinction or 80%"
              />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-gray-100">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Education</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Add your school, high school, undergraduate, and postgraduate education
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {hasRole && (
            <button
              type="button"
              onClick={suggestEducation}
              disabled={aiLoading}
              className="flex items-center gap-1.5 px-3 py-2 text-xs bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 disabled:opacity-50 transition-colors font-medium"
            >
              {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              AI Suggest
            </button>
          )}
          <div className="flex items-center gap-1.5 bg-gray-50 p-1 rounded-lg border border-gray-200">
            <button
              type="button"
              onClick={() => addEducation('10th')}
              className="px-2.5 py-1.5 text-xs text-gray-700 hover:bg-white hover:text-blue-700 rounded-md transition-all font-medium flex items-center gap-1 shadow-sm"
              title="Add 10th / Secondary School"
            >
              <Plus className="w-3 h-3 text-blue-600" /> 10th
            </button>
            <button
              type="button"
              onClick={() => addEducation('12th')}
              className="px-2.5 py-1.5 text-xs text-gray-700 hover:bg-white hover:text-blue-700 rounded-md transition-all font-medium flex items-center gap-1 shadow-sm"
              title="Add 12th / Higher Secondary"
            >
              <Plus className="w-3 h-3 text-blue-600" /> 12th
            </button>
            <button
              type="button"
              onClick={() => addEducation('ug')}
              className="px-2.5 py-1.5 text-xs text-gray-700 hover:bg-white hover:text-blue-700 rounded-md transition-all font-medium flex items-center gap-1 shadow-sm"
              title="Add Undergraduate Degree"
            >
              <Plus className="w-3 h-3 text-blue-600" /> UG
            </button>
            <button
              type="button"
              onClick={() => addEducation('pg')}
              className="px-2.5 py-1.5 text-xs text-gray-700 hover:bg-white hover:text-purple-700 rounded-md transition-all font-medium flex items-center gap-1 shadow-sm"
              title="Add Postgraduate Degree"
            >
              <Plus className="w-3 h-3 text-purple-600" /> PG
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {data.education.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-gray-800">No education entries yet</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            Choose an education level to add your academic credentials to your resume.
          </p>
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            <button
              type="button"
              onClick={() => addEducation('10th')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:text-blue-700 shadow-sm transition-colors font-medium"
            >
              <School className="w-3.5 h-3.5 text-emerald-600" /> Add 10th / Secondary
            </button>
            <button
              type="button"
              onClick={() => addEducation('12th')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:text-blue-700 shadow-sm transition-colors font-medium"
            >
              <BookOpen className="w-3.5 h-3.5 text-sky-600" /> Add 12th / Higher Secondary
            </button>
            <button
              type="button"
              onClick={() => addEducation('ug')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:text-blue-700 shadow-sm transition-colors font-medium"
            >
              <GraduationCap className="w-3.5 h-3.5 text-blue-600" /> Add Undergraduate (UG)
            </button>
            <button
              type="button"
              onClick={() => addEducation('pg')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg hover:border-purple-400 hover:text-purple-700 shadow-sm transition-colors font-medium"
            >
              <GraduationCap className="w-3.5 h-3.5 text-purple-600" /> Add Postgraduate (PG)
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {data.education.map(edu => (
            <div
              key={edu.id}
              className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs hover:border-gray-300 transition-colors"
            >
              {/* Card Header */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50/90 border-b border-gray-100">
                <div className="relative">
                  <select
                    value={edu.level || 'ug'}
                    onChange={e => updateEducation(edu.id, 'level', e.target.value as EducationLevel)}
                    className="text-xs font-semibold text-gray-800 bg-white border border-gray-200 rounded-md px-2.5 py-1 pr-6 hover:border-gray-300 focus:outline-hidden focus:ring-1 focus:ring-blue-500 cursor-pointer"
                  >
                    {LEVEL_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-gray-400 hidden sm:inline">
                    {getEducationLevelLabel(edu.level)}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeEducation(edu.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="Remove this education entry"
                    aria-label="Remove education entry"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 space-y-3.5">
                {renderLevelSpecificFields(edu)}

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Education Description <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <textarea
                    value={edu.description || ''}
                    onChange={e => updateEducation(edu.id, 'description', e.target.value)}
                    rows={3}
                    placeholder="Add relevant coursework, academic achievements, projects, activities, or other details..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white hover:border-gray-300 transition-colors resize-y"
                  />
                </div>
              </div>
            </div>
          ))}

          {/* Quick bottom-add bar */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-gray-400">
              {data.education.length} {data.education.length === 1 ? 'entry' : 'entries'} added
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => addEducation('ug')}
                className="px-3 py-1.5 text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg font-medium transition-colors"
              >
                + Add Another Degree
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
