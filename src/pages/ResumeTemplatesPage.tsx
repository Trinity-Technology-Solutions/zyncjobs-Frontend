import React, { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BackButton from '../components/BackButton';

interface ResumeTemplatesPageProps {
  onNavigate?: (page: string, params?: any) => void;
  user?: {name: string, type: 'candidate' | 'employer'} | null;
  onLogout?: () => void;
}

const allTemplates = {
  simple: [
    { name: 'oslo',     title: 'Oslo Classic',       caption: 'Clean and simple resume template for professionals.', mono: true, formats: ['pdf', 'docx'] },
    { name: 'madrid',   title: 'Madrid Simple',       caption: 'Minimalist design with clear sections.', mono: true, formats: ['pdf', 'docx'] },
    { name: 'santiago', title: 'Santiago Traditional',caption: 'Classic full-page resume template with sizable sections.', mono: true, formats: ['pdf', 'docx'] },
    { name: 'london',   title: 'London Classic',      caption: 'Classically structured resume for a robust career history.', mono: true, formats: ['pdf', 'docx'] },
  ],
  picture: [
    { name: 'copenhagen', title: 'Copenhagen Picture', caption: 'Professional template with photo section.', colors: ['#2163CA','#5121CA','#CA3D21','#CA9421','#1E1E1E'], formats: ['pdf','docx'] },
    { name: 'stockholm',  title: 'Stockholm Picture',  caption: 'Modern template with integrated photo.', colors: ['#2163CA','#5121CA','#CA3D21','#CA9421','#1E1E1E'], formats: ['pdf','docx'] },
    { name: 'vienna',     title: 'Vienna Picture',     caption: 'Professional photo resume template.', colors: ['#084C41','#87300D','#10365C','#3E1D53','#242935'], formats: ['pdf','docx'] },
    { name: 'dublin',     title: 'Dublin Picture',     caption: 'A touch of personality with a well-organized structure.', colors: ['#084C41','#87300D','#10365C','#3E1D53','#242935'], formats: ['pdf','docx'] },
    { name: 'brussels',   title: 'Brussels Picture',   caption: 'Sophisticated design with photo integration.', colors: ['#2163CA','#5121CA','#CA3D21','#CA9421','#1E1E1E'], formats: ['pdf','docx'] },
  ],
  word: [
    { name: 'boston',   title: 'Boston Word',    caption: 'Word-compatible professional template.', colors: ['#000000','#5b5f65','#2163CA','#CA3D21','#CA9421'], formats: ['pdf','docx'] },
    { name: 'new-york', title: 'New York Word',  caption: 'Modern Word template for professionals.', colors: ['#2163CA','#5121CA','#CA3D21','#CA9421','#1E1E1E'], formats: ['pdf','docx'] },
    { name: 'sydney',   title: 'Sydney Word',    caption: 'Clean Word-friendly design.', colors: ['#084C41','#87300D','#10365C','#3E1D53','#242935'], formats: ['pdf','docx'] },
    { name: 'milan',    title: 'Milan Word',     caption: 'Elegant Word template.', colors: ['#2163CA','#5121CA','#CA3D21','#CA9421','#1E1E1E'], formats: ['pdf','docx'] },
  ],
  ats: [
    { name: 'berlin',    title: 'Berlin ATS',    caption: 'ATS-optimized template for maximum compatibility.', colors: ['#1E1E1E','#2163CA','#5121CA','#CA3D21','#CA9421'], formats: ['pdf','docx'] },
    { name: 'chicago',   title: 'Chicago ATS',   caption: 'Professional ATS-friendly design.', colors: ['#2163CA','#5121CA','#CA3D21','#CA9421','#1E1E1E'], formats: ['pdf','docx'] },
    { name: 'singapore', title: 'Singapore ATS', caption: 'Streamlined ATS-compatible template.', colors: ['#1E1E1E','#2163CA','#5121CA','#CA3D21','#CA9421'], formats: ['pdf','docx'] },
    { name: 'athens',    title: 'Athens ATS',    caption: 'Clean ATS-optimized design.', colors: ['#2163CA','#5121CA','#CA3D21','#CA9421','#1E1E1E'], formats: ['pdf','docx'] },
  ],
  'two-column': [
    { name: 'toronto',   title: 'Toronto Two-Column',   caption: 'Modern two-column layout.', colors: ['#084C41','#87300D','#10365C','#3E1D53','#242935'], formats: ['pdf','docx'] },
    { name: 'paris',     title: 'Paris Two-Column',     caption: 'Elegant two-column design.', colors: ['#2163CA','#5121CA','#CA3D21','#CA9421','#1E1E1E'], formats: ['pdf','docx'] },
    { name: 'amsterdam', title: 'Amsterdam Two-Column', caption: 'Professional two-column template.', colors: ['#084C41','#87300D','#10365C','#3E1D53','#242935'], formats: ['pdf','docx'] },
  ],
  'google-docs': [
    { name: 'prague',   title: 'Prague Google Docs',   caption: 'Google Docs compatible template.', colors: ['#000000','#5b5f65','#2163CA','#CA3D21','#CA9421'], formats: ['pdf','docx'] },
    { name: 'shanghai', title: 'Shanghai Google Docs', caption: 'Clean Google Docs template.', colors: ['#2163CA','#5121CA','#CA3D21','#CA9421','#1E1E1E'], formats: ['pdf','docx'] },
  ],
  // ── 6 Industry-specific templates ──────────────────────────────────────────
  tech: [
    { name: 'berlin',  title: '💻 Tech / Software',  caption: 'ATS-optimized for software engineers, developers & DevOps. Skills-forward layout.', colors: ['#1E1E1E','#2163CA','#5121CA'], formats: ['pdf','docx'], industry: 'Software Engineer' },
    { name: 'chicago', title: '💻 Tech Modern',       caption: 'Modern two-tone design for frontend, backend & full-stack engineers.', colors: ['#2163CA','#5121CA','#CA3D21'], formats: ['pdf','docx'], industry: 'Software Engineer' },
  ],
  finance: [
    { name: 'oslo',   title: '💰 Finance / Banking', caption: 'Conservative, professional layout for finance analysts, accountants & bankers.', mono: true, formats: ['pdf','docx'], industry: 'Finance Analyst' },
    { name: 'london', title: '💰 Finance Classic',   caption: 'Traditional structured layout trusted by top finance firms.', mono: true, formats: ['pdf','docx'], industry: 'Finance Analyst' },
  ],
  marketing: [
    { name: 'copenhagen', title: '📣 Marketing / Creative', caption: 'Bold, colorful design for marketers, brand managers & content creators.', colors: ['#CA3D21','#CA9421','#2163CA'], formats: ['pdf','docx'], industry: 'Marketing Manager' },
    { name: 'stockholm',  title: '📣 Marketing Modern',     caption: 'Eye-catching layout for digital marketers & growth hackers.', colors: ['#5121CA','#2163CA','#CA3D21'], formats: ['pdf','docx'], industry: 'Marketing Manager' },
  ],
  design: [
    { name: 'paris',  title: '🎨 Design / UX',       caption: 'Elegant two-column layout for UI/UX designers & creatives.', colors: ['#2163CA','#5121CA','#CA3D21'], formats: ['pdf','docx'], industry: 'UI/UX Designer' },
    { name: 'vienna', title: '🎨 Design Portfolio',  caption: 'Sophisticated dark-header design for portfolio-driven creative roles.', colors: ['#084C41','#3E1D53','#10365C'], formats: ['pdf','docx'], industry: 'UI/UX Designer' },
  ],
  management: [
    { name: 'toronto', title: '📊 Management / PM',  caption: 'Executive two-column layout for product managers, team leads & directors.', colors: ['#084C41','#10365C','#3E1D53'], formats: ['pdf','docx'], industry: 'Product Manager' },
    { name: 'boston',  title: '📊 Management Classic',caption: 'Authoritative single-column layout for senior management & C-suite roles.', colors: ['#000000','#2163CA','#CA3D21'], formats: ['pdf','docx'], industry: 'Product Manager' },
  ],
  data: [
    { name: 'singapore', title: '📈 Data / Analytics', caption: 'Clean, structured layout for data analysts, scientists & BI professionals.', colors: ['#1E1E1E','#2163CA','#5121CA'], formats: ['pdf','docx'], industry: 'Data Analyst' },
    { name: 'athens',    title: '📈 Data Science',     caption: 'Minimal ATS-friendly design for ML engineers & data scientists.', colors: ['#2163CA','#5121CA','#CA9421'], formats: ['pdf','docx'], industry: 'Data Analyst' },
  ],
};

const TABS = [
  { id: 'all',          label: 'All' },
  { id: 'tech',         label: '💻 Tech' },
  { id: 'finance',      label: '💰 Finance' },
  { id: 'marketing',    label: '📣 Marketing' },
  { id: 'design',       label: '🎨 Design' },
  { id: 'management',   label: '📊 Management' },
  { id: 'data',         label: '📈 Data' },
  { id: 'ats',          label: 'ATS' },
  { id: 'simple',       label: 'Simple' },
  { id: 'picture',      label: 'Picture' },
  { id: 'two-column',   label: 'Two-column' },
  { id: 'word',         label: 'Word' },
  { id: 'google-docs',  label: 'Google Docs' },
];

const ResumeTemplatesPage: React.FC<ResumeTemplatesPageProps> = ({ onNavigate, user, onLogout }) => {
  const [activeCategory, setActiveCategory] = useState('all');

  const templates = activeCategory === 'all'
    ? Object.values(allTemplates).flat()
    : allTemplates[activeCategory as keyof typeof allTemplates] || [];

  // Deduplicate by name when showing all
  const seen = new Set<string>();
  const uniqueTemplates = templates.filter(t => {
    if (seen.has(t.name + t.title)) return false;
    seen.add(t.name + t.title);
    return true;
  });

  const getCategoryForTemplate = (name: string, title: string) =>
    Object.keys(allTemplates).find(cat =>
      allTemplates[cat as keyof typeof allTemplates].some(t => t.name === name && t.title === title)
    ) || 'simple';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-cyan-50">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BackButton
          onClick={() => onNavigate?.('resume-studio')}
          text="Back to Resume Studio"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800 transition-colors mb-6"
        />

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Resume Templates</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Choose from industry-specific templates designed to get you hired faster. All templates export as PDF & DOCX.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeCategory === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300 hover:text-blue-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Industry banner when industry tab selected */}
        {['tech','finance','marketing','design','management','data'].includes(activeCategory) && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-center gap-3">
            <span className="text-2xl">{TABS.find(t => t.id === activeCategory)?.label.split(' ')[0]}</span>
            <div>
              <p className="font-semibold text-blue-900 text-sm">Industry-optimized templates</p>
              <p className="text-blue-700 text-xs">Pre-filled with relevant skills & summary for {TABS.find(t => t.id === activeCategory)?.label.replace(/^[^ ]+ /, '')} roles. Click a template to auto-fill your resume.</p>
            </div>
          </div>
        )}

        {/* Templates Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {uniqueTemplates.map((template) => {
            const cat = getCategoryForTemplate(template.name, template.title);
            const hasIndustry = 'industry' in template && template.industry;
            return (
              <div
                key={template.name + template.title}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group"
                onClick={() => onNavigate?.('resume-editor', template.name)}
              >
                {/* Preview area */}
                <div className="relative aspect-[3/4] bg-gray-50 overflow-hidden">
                  <img
                    src={`/images/organized-resume-templates/${cat}/${template.name}-resume-templates.jpg`}
                    alt={template.title}
                    className="w-full h-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).src = '/images/resume-placeholder.jpg'; }}
                  />
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="bg-white text-gray-900 px-4 py-2 rounded-lg font-medium text-sm">Use this template</span>
                  </div>
                  {/* Industry badge */}
                  {hasIndustry && (
                    <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                      {(template as any).industry}
                    </div>
                  )}
                </div>

                {/* Card footer */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-semibold text-gray-900 text-sm leading-tight">{template.title}</h3>
                  </div>
                  <p className="text-gray-500 text-xs mb-3 line-clamp-2">{template.caption}</p>

                  <div className="flex items-center justify-between">
                    {/* Color swatches or mono badge */}
                    {'mono' in template && template.mono ? (
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">Monochrome</span>
                    ) : 'colors' in template && template.colors ? (
                      <div className="flex gap-1">
                        {(template.colors as string[]).slice(0, 4).map((color, i) => (
                          <div key={i} className="w-4 h-4 rounded-full border border-white shadow-sm" style={{ backgroundColor: color }} />
                        ))}
                      </div>
                    ) : <span />}

                    {/* Format badges */}
                    <div className="flex gap-1">
                      {template.formats.map(f => (
                        <span key={f} className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded uppercase font-medium">{f}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default ResumeTemplatesPage;
