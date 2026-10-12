import React from 'react';
import { Route, Target, FileText, BarChart3, ScanText, Sparkles, Check } from 'lucide-react';
const content = {
  skills: { title:'Turn skill gaps into a learning plan', description:'Add your current skills and choose a target role. Compare the requirements, then focus your learning on the missing skills.', steps:['Add your skills','Choose a role','Review the gaps'], Icon:Target },
  roadmap: { title:'Make your next career move concrete', description:'Set your current role and career goal. Generate a roadmap, review the milestones and use the suggested steps to plan your development.', steps:['Set your goal','Generate your path','Work through milestones'], Icon:Route },
  salary: { title:'Research before your next salary conversation', description:'Search a role and compare available salary ranges by experience. Use these insights as a reference; actual offers vary by employer and location.', steps:['Search a role','Compare ranges','Plan your next move'], Icon:BarChart3 },
  matches: { title:'Find roles that fit your profile', description:'Review jobs recommended from your skills, experience and preferences. Check each job description and requirements before applying.', steps:['Keep your profile current','Review match details','Apply to suitable roles'], Icon:Target },
  parser: { title:'Turn your resume into organised details', description:'Upload your resume to extract its information. Review the parsed sections and correct anything missing or inaccurate before using the results.', steps:['Upload a resume','Extract the details','Review each section'], Icon:ScanText },
  analyzer: { title:'Understand what your resume can improve', description:'Upload a resume or paste its text, then analyse it. Review the score, keywords and suggestions as guidance for your next revision.', steps:['Add your resume','Run the analysis','Improve and review'], Icon:FileText },
  builder: { title:'Build a resume around your experience', description:'Choose a template, add your real experience and use AI suggestions to refine the wording. Check every detail before downloading.', steps:['Choose a template','Add and refine details','Review and download'], Icon:Sparkles },
};
export type CandidateFeature = keyof typeof content;
export default function CandidateFeatureGuide({feature}:{feature:CandidateFeature}) {
 const {title,description,steps,Icon}=content[feature];
 return <aside className={`candidate-feature-guide candidate-guide-${feature}`}>
  <div className="candidate-guide-art" aria-hidden="true"><Icon size={38} strokeWidth={1.4}/>
   {feature==='roadmap' ? <div className="guide-milestones">{steps.map((_,i)=><span key={i}>{i+1}</span>)}</div> : feature==='salary' || feature==='analyzer' ? <div className="guide-chart">{[40,65,88].map(n=><span key={n} style={{height:n/2}} />)}</div> : feature==='parser' || feature==='builder' ? <div className="guide-document"><i/><i/><i/><Check size={16}/></div> : <div className="guide-skill-pills"><span>Skills</span><span>Experience</span><Check size={16}/></div>}
  </div>
  <div className="candidate-guide-copy"><h2>{title}</h2><p>{description}</p><ol>{steps.map(step=><li key={step}>{step}</li>)}</ol></div>
 </aside>;
}
