import React from 'react';

interface ResumeData {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  summary?: string;
  skills?: string[];
  experience?: Array<{
    title: string;
    company: string;
    duration: string;
    description: string;
  }>;
  education?: Array<{
    degree: string;
    school: string;
    year: string;
  }>;
}

interface ResumeTableProps {
  resume: ResumeData;
}

const TableRowHeader = ({ children }: { children: React.ReactNode }) => (
  <tr className="bg-gray-50">
    <th className="px-3 py-2 font-semibold text-left" colSpan={2}>
      {children}
    </th>
  </tr>
);

const TableRow = ({ label, value }: { label: string; value: string | string[] }) => (
  <tr className="border-b border-gray-200">
    <th className="px-3 py-2 font-medium text-gray-700 w-1/4" scope="row">
      {label}
    </th>
    <td className="px-3 py-2 text-gray-900">
      {Array.isArray(value) ? (
        <div className="space-y-1">
          {value.map((item, idx) => (
            <div key={idx}>• {item}</div>
          ))}
        </div>
      ) : (
        value || 'Not provided'
      )}
    </td>
  </tr>
);

export const ResumeTable: React.FC<ResumeTableProps> = ({ resume }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <table className="w-full text-sm">
        <tbody>
          <TableRowHeader>Profile Information</TableRowHeader>
          <TableRow label="Name" value={resume.name || ''} />
          <TableRow label="Email" value={resume.email || ''} />
          <TableRow label="Phone" value={resume.phone || ''} />
          <TableRow label="Location" value={resume.location || ''} />
          {resume.summary && <TableRow label="Summary" value={resume.summary} />}

          {resume.experience && resume.experience.length > 0 && (
            <>
              <TableRowHeader>Work Experience</TableRowHeader>
              {resume.experience.map((exp, idx) => (
                <React.Fragment key={idx}>
                  <TableRow label="Company" value={exp.company} />
                  <TableRow label="Job Title" value={exp.title} />
                  <TableRow label="Duration" value={exp.duration} />
                  <TableRow label="Description" value={exp.description} />
                  {idx < resume.experience!.length - 1 && (
                    <tr><td colSpan={2} className="border-b-2 border-gray-300"></td></tr>
                  )}
                </React.Fragment>
              ))}
            </>
          )}

          {resume.education && resume.education.length > 0 && (
            <>
              <TableRowHeader>Education</TableRowHeader>
              {resume.education.map((edu, idx) => (
                <React.Fragment key={idx}>
                  <TableRow label="School" value={edu.school} />
                  <TableRow label="Degree" value={edu.degree} />
                  <TableRow label="Year" value={edu.year} />
                  {idx < resume.education!.length - 1 && (
                    <tr><td colSpan={2} className="border-b-2 border-gray-300"></td></tr>
                  )}
                </React.Fragment>
              ))}
            </>
          )}

          {resume.skills && resume.skills.length > 0 && (
            <>
              <TableRowHeader>Skills</TableRowHeader>
              <TableRow label="Skills" value={resume.skills} />
            </>
          )}
        </tbody>
      </table>
    </div>
  );
};