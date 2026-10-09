import React from 'react';
import { Bot, ListOrdered, ShieldCheck, SlidersHorizontal, Check, FileText, Search } from 'lucide-react';

type Feature = 'ranking' | 'rejection' | 'recruiter' | 'credentialing' | 'parser' | 'shortlist' | 'bulk';
const guides = {
  bulk: { title: 'Prepare several job drafts together', text: 'Upload a CSV or paste multiple job descriptions. Review the parsed jobs, correct missing fields and select the jobs you want to publish.', Icon: FileText, labels: ['Upload or paste', 'Review each draft', 'Publish selected jobs'] },
  parser: { title: 'Turn a description into a job draft', text: 'Paste the job description and let AI extract the role details. Check the extracted fields and complete missing information before publishing.', Icon: FileText, labels: ['Paste description', 'Extract details', 'Review the draft'] },
  shortlist: { title: 'Review your AI shortlist before applying it', text: 'Generate match scores for the current applicants, inspect matched and missing skills, then confirm the suggested stage updates when you are ready.', Icon: ListOrdered, labels: ['Generate preview', 'Check the matches', 'Confirm updates'] },
  ranking: { title: 'Start with the strongest matches', text: 'Compare applicants using their match scores and skill breakdowns. Use the ranking to prioritise profile reviews before deciding who to shortlist.', Icon: ListOrdered, labels: ['Compare skills', 'Review matches', 'Build a shortlist'] },
  rejection: { title: 'Set clear screening criteria', text: 'Configure your screening thresholds and rejection rules. Review the preview before enabling automation, and choose whether to send candidate feedback.', Icon: SlidersHorizontal, labels: ['Set criteria', 'Review preview', 'Enable when ready'] },
  recruiter: { title: 'Your hiring assistant, one conversation away', text: 'Ask for help sourcing candidates, screening profiles or building a ranked shortlist. Include the role and required skills, then review the recommendations before taking action.', Icon: Bot, labels: ['Describe the role', 'Ask your assistant', 'Review suggestions'] },
  credentialing: { title: 'Keep candidate credentials organised', text: 'Add a candidate to credentialing, review their records and track verification and onboarding. Use this workspace to see what is complete and what still needs attention.', Icon: ShieldCheck, labels: ['Add candidate', 'Review records', 'Track verification'] },
};
export default function EmployerFeatureGuide({ feature }: { feature: Feature }) {
  const { title, text, Icon, labels } = guides[feature];
  return <aside className={`employer-feature-guide feature-guide-${feature}`}>
    <div className="feature-guide-art" aria-hidden="true">
      <svg viewBox="0 0 180 150" className="feature-specific-art" fill="none">
        <circle cx="90" cy="75" r="70" fill="white" fillOpacity=".6" />
        {(feature === 'ranking' || feature === 'shortlist') ? <>
          {[0,1,2].map(i => <g key={i}><rect x="25" y={25+i*35} width={130-i*15} height="27" rx="7" fill="white" stroke="currentColor" strokeOpacity=".2" /><circle cx="40" cy={38+i*35} r="8" fill="currentColor" opacity={1-i*.25} /><text x="40" y={41+i*35} textAnchor="middle" fill="white" fontSize="9">{i+1}</text><path d={`M58 ${38+i*35}h${65-i*20}`} stroke="currentColor" strokeWidth="5" strokeLinecap="round" opacity=".35" /></g>)}
        </> : feature === 'rejection' ? <>
          <path d="M30 30h120l-45 50v38l-30 10V80z" fill="white" stroke="currentColor" strokeWidth="2" /><path d="M57 43h65M70 56h39" stroke="currentColor" strokeWidth="4" opacity=".3" /><circle cx="130" cy="105" r="23" fill="white" stroke="currentColor" strokeWidth="2" /><path d="m120 105 7 7 13-15" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </> : feature === 'recruiter' ? <>
          <rect x="24" y="24" width="106" height="62" rx="16" fill="white" stroke="currentColor" strokeWidth="2" /><path d="m40 85-8 13 29-13" fill="white" /><circle cx="51" cy="54" r="5" fill="currentColor" /><circle cx="77" cy="54" r="5" fill="currentColor" /><circle cx="103" cy="54" r="5" fill="currentColor" /><rect x="66" y="94" width="89" height="32" rx="12" fill="currentColor" opacity=".2" />
        </> : feature === 'credentialing' ? <>
          <rect x="30" y="22" width="96" height="111" rx="10" fill="white" stroke="currentColor" strokeOpacity=".3" /><circle cx="77" cy="49" r="12" fill="currentColor" opacity=".2" /><path d="M48 76h57M48 88h40M48 100h47" stroke="currentColor" strokeWidth="4" opacity=".25" /><path d="m125 66 27 12v24c0 17-27 30-27 30s-27-13-27-30V78z" fill="white" stroke="currentColor" strokeWidth="2" /><path d="m113 98 9 9 16-20" stroke="currentColor" strokeWidth="3" />
        </> : <>
          {(feature === 'bulk' ? [0,1,2] : [0]).map(i => <g key={i}><rect x={30+i*20} y={24+i*14} width="83" height="95" rx="9" fill="white" stroke="currentColor" strokeOpacity=".4" /><path d={`M${45+i*20} ${43+i*14}h46M${45+i*20} ${56+i*14}h33M${45+i*20} ${69+i*14}h40`} stroke="currentColor" strokeWidth="4" opacity=".25" /></g>)}
          <circle cx="137" cy="111" r="22" fill="white" stroke="currentColor" strokeWidth="2" /><path d="m126 111 8 8 14-16" stroke="currentColor" strokeWidth="3" />
        </>}
      </svg>
    </div>
    <div className="feature-guide-copy"><h2>{title}</h2><p>{text}</p><div className="feature-guide-steps">{labels.map((label, index) => <span key={label}><b>{index + 1}</b>{label}</span>)}</div></div>
  </aside>;
}
