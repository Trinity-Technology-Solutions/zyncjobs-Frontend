import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BackButton from '../components/BackButton';

interface ResumeTemplatesPageProps {
  onNavigate?: (page: string) => void;
  user?: {name: string, type: 'candidate' | 'employer'} | null;
  onLogout?: () => void;
}

const ResumeTemplatesPage: React.FC<ResumeTemplatesPageProps> = ({ onNavigate, user, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);


  const allTemplates = {
    simple: [
      { name: 'oslo', title: 'Oslo Classic', caption: 'Clean and simple resume template for professionals.', mono: true, formats: ['pdf', 'docx'] },
      { name: 'madrid', title: 'Madrid Simple', caption: 'Minimalist design with clear sections.', mono: true, formats: ['pdf', 'docx'] },
      { name: 'santiago', title: 'Santiago Traditional', caption: 'Classic full-page resume template with sizable resume sections.', mono: true, formats: ['pdf', 'docx'] },
      { name: 'london', title: 'London Classic', caption: 'Classically structured resume template, for a robust career history.', mono: true, formats: ['pdf', 'docx'] },

    ],
    picture: [
      { name: 'copenhagen', title: 'Copenhagen Picture', caption: 'Professional template with photo section.', colors: ['#2163CA', '#5121CA', '#CA3D21', '#CA9421', '#1E1E1E'], formats: ['pdf', 'docx'] },

      { name: 'stockholm', title: 'Stockholm Picture', caption: 'Modern template with integrated photo.', colors: ['#2163CA', '#5121CA', '#CA3D21', '#CA9421', '#1E1E1E'], formats: ['pdf', 'docx'] },
      { name: 'vienna', title: 'Vienna Picture', caption: 'Professional photo resume template.', colors: ['#084C41', '#87300D', '#10365C', '#3E1D53', '#242935'], formats: ['pdf', 'docx'] },
      { name: 'dublin', title: 'Dublin Picture', caption: 'A touch of personality with a well-organized resume structure.', colors: ['#084C41', '#87300D', '#10365C', '#3E1D53', '#242935'], formats: ['pdf', 'docx'] },
      { name: 'brussels', title: 'Brussels Picture', caption: 'Sophisticated design with photo integration.', colors: ['#2163CA', '#5121CA', '#CA3D21', '#CA9421', '#1E1E1E'], formats: ['pdf', 'docx'] }
    ],
    word: [
      { name: 'boston', title: 'Boston Word', caption: 'Word-compatible professional template.', colors: ['#000000', '#5b5f65', '#2163CA', '#CA3D21', '#CA9421'], formats: ['pdf', 'docx'] },
      { name: 'new-york', title: 'New York Word', caption: 'Modern Word template for professionals.', colors: ['#2163CA', '#5121CA', '#CA3D21', '#CA9421', '#1E1E1E'], formats: ['pdf', 'docx'] },
      { name: 'sydney', title: 'Sydney Word', caption: 'Clean Word-friendly design.', colors: ['#084C41', '#87300D', '#10365C', '#3E1D53', '#242935'], formats: ['pdf', 'docx'] },
      { name: 'milan', title: 'Milan Word', caption: 'Elegant Word template.', colors: ['#2163CA', '#5121CA', '#CA3D21', '#CA9421', '#1E1E1E'], formats: ['pdf', 'docx'] }
    ],
    ats: [
      { name: 'berlin', title: 'Berlin ATS', caption: 'ATS-optimized template for maximum compatibility.', colors: ['#1E1E1E', '#2163CA', '#5121CA', '#CA3D21', '#CA9421'], formats: ['pdf', 'docx'] },
      { name: 'chicago', title: 'Chicago ATS', caption: 'Professional ATS-friendly design.', colors: ['#2163CA', '#5121CA', '#CA3D21', '#CA9421', '#1E1E1E'], formats: ['pdf', 'docx'] },
      { name: 'singapore', title: 'Singapore ATS', caption: 'Streamlined ATS-compatible template.', colors: ['#1E1E1E', '#2163CA', '#5121CA', '#CA3D21', '#CA9421'], formats: ['pdf', 'docx'] },
      { name: 'athens', title: 'Athens ATS', caption: 'Clean ATS-optimized design.', colors: ['#2163CA', '#5121CA', '#CA3D21', '#CA9421', '#1E1E1E'], formats: ['pdf', 'docx'] }
    ],
    'two-column': [
      { name: 'toronto', title: 'Toronto Two-Column', caption: 'Modern two-column layout.', colors: ['#084C41', '#87300D', '#10365C', '#3E1D53', '#242935'], formats: ['pdf', 'docx'] },
      { name: 'paris', title: 'Paris Two-Column', caption: 'Elegant two-column design.', colors: ['#2163CA', '#5121CA', '#CA3D21', '#CA9421', '#1E1E1E'], formats: ['pdf', 'docx'] },
      { name: 'amsterdam', title: 'Amsterdam Two-Column', caption: 'Professional two-column template.', colors: ['#084C41', '#87300D', '#10365C', '#3E1D53', '#242935'], formats: ['pdf', 'docx'] }
    ],
    'google-docs': [
      { name: 'prague', title: 'Prague Google Docs', caption: 'Google Docs compatible template.', colors: ['#000000', '#5b5f65', '#2163CA', '#CA3D21', '#CA9421'], formats: ['pdf', 'docx'] },
      { name: 'shanghai', title: 'Shanghai Google Docs', caption: 'Clean Google Docs template.', colors: ['#2163CA', '#5121CA', '#CA3D21', '#CA9421', '#1E1E1E'], formats: ['pdf', 'docx'] }
    ]
  };

  const [activeCategory, setActiveCategory] = useState('all');
  const templates = activeCategory === 'all' 
    ? Object.values(allTemplates).flat()
    : allTemplates[activeCategory as keyof typeof allTemplates] || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />

      {/* Main Content */}
      <div className="container container--templates">
        <div className="templates-root">
          <div className="templates-root__container">
          

            {/* Header */}
            <div className="templates-root__header--without-create-resume-button templates-root__header-sticky text-center">
              <BackButton 
                onClick={() => onNavigate && onNavigate('dashboard')}
                text="Back to Dashboard"
                className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800 transition-colors mb-4"
              />
              <h1 className="templates-root__header-title">Resume templates</h1>
              <p className="templates-root__header-subtitle">
                Each resume template is designed to follow the exact rules you need to get hired faster. Use our resume templates and get free access to 18 more career tools!
              </p>
             
            </div>

            {/* Filter Tabs */}
            <div className="templates-filter-sticky">
              <div className="templates-filter__container-static">
                <div className="templates-filter__content">
                  <div className="templates-filter__tabs-static justify-center">
                    <button className={`templates-filter__tab-static ${activeCategory === 'all' ? 'templates-filter__tab-static--active' : ''}`} onClick={() => setActiveCategory('all')}>All templates</button>
                    <button className={`templates-filter__tab-static ${activeCategory === 'picture' ? 'templates-filter__tab-static--active' : ''}`} onClick={() => setActiveCategory('picture')}>Picture</button>
                    <button className={`templates-filter__tab-static ${activeCategory === 'word' ? 'templates-filter__tab-static--active' : ''}`} onClick={() => setActiveCategory('word')}>Word</button>
                    <button className={`templates-filter__tab-static ${activeCategory === 'simple' ? 'templates-filter__tab-static--active' : ''}`} onClick={() => setActiveCategory('simple')}>Simple</button>
                    <button className={`templates-filter__tab-static ${activeCategory === 'ats' ? 'templates-filter__tab-static--active' : ''}`} onClick={() => setActiveCategory('ats')}>ATS</button>
                    <button className={`templates-filter__tab-static ${activeCategory === 'two-column' ? 'templates-filter__tab-static--active' : ''}`} onClick={() => setActiveCategory('two-column')}>Two-column</button>
                    <button className={`templates-filter__tab-static ${activeCategory === 'google-docs' ? 'templates-filter__tab-static--active' : ''}`} onClick={() => setActiveCategory('google-docs')}>Google Docs</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Templates Grid */}
            <div className="templates-root__grids">
              <div className="templates-grid">
                {templates.map((template, index) => (
                  <div key={template.name} className="templates-grid__cell" data-name={template.name}>
                    <div className="templates-card" onClick={() => {
                      onNavigate?.('resume-editor', template.name);
                    }}>
                      <div className="templates-card__body">
                        <div className="templates-card__content">
                          <div className="templates-card__preview" title={`${template.title} template`}>
                            <img 
                              src={`/images/organized-resume-templates/${activeCategory === 'all' ? Object.keys(allTemplates).find(cat => allTemplates[cat as keyof typeof allTemplates].some(t => t.name === template.name)) : activeCategory}/${template.name}-resume-templates.jpg`}
                              alt={template.title}
                              className="templates-card__preview-image templates-card__preview-image--default templates-card__preview-image--active"
                              width="380"
                            />
                            <div className="templates-card__action">
                              <div className="button">Use this template</div>
                            </div>
                          </div>
                          <div className="templates-card__options">
                            {'mono' in template && template.mono ? (
                              <div className="templates-card__mono">
                                <div className="templates-card__mono-icon"></div>
                                <div className="templates-card__mono-text">Monochrome</div>
                              </div>
                            ) : 'colors' in template && template.colors && (
                              <div className="templates-card__colors">
                                {template.colors.map((color, i) => (
                                  <div 
                                    key={i}
                                    className={`templates-card__colors-item ${i === 0 ? 'templates-card__colors-item--active' : ''}`}
                                    style={{ backgroundColor: color }}
                                  ></div>
                                ))}
                              </div>
                            )}
                            <div className="templates-card__badges">
                              {template.formats.map(format => (
                                <div key={format} className="templates-card__badge">{format}</div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="templates-card__footer">
                        <div className="templates-card__name">{template.title}</div>
                        <div className="templates-card__caption">{template.caption}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>



      <Footer onNavigate={onNavigate} />

      <style>{`
        .nav { position: sticky; top: 0; z-index: 100; background: white; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .nav__content { max-width: 1200px; margin: 0 auto; padding: 1rem; }
        .nav__bar { display: flex; justify-content: space-between; align-items: center; }
        .nav__bar-menu { display: flex; gap: 2rem; align-items: center; }
        .nav__bar-link { text-decoration: none; color: #333; font-weight: 500; }
        .nav__bar-link:hover { color: #1a91f0; }
        .nav__bar-auth { display: flex; gap: 1rem; }
        .button { padding: 0.5rem 1rem; background: #1a91f0; color: white; border: none; border-radius: 4px; cursor: pointer; text-decoration: none; display: inline-block; }
        .button:hover { background: #1580d8; }
        .container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
        .text-center { text-align: center; }
        .justify-center { justify-content: center; }
        .templates-root__header-title { font-size: 2.5rem; margin-bottom: 1rem; }
        .templates-root__header-subtitle { font-size: 1.1rem; color: #666; margin-bottom: 2rem; max-width: 800px; margin-left: auto; margin-right: auto; }
        .templates-filter__tabs-static { display: flex; gap: 1rem; margin: 2rem 0; border-bottom: 2px solid #eee; }
        .templates-filter__tab-static { padding: 1rem; text-decoration: none; color: #666; border-bottom: 2px solid transparent; margin-bottom: -2px; background: none; border: none; cursor: pointer; font-size: inherit; }
        .templates-filter__tab-static--active { color: #1a91f0; border-bottom-color: #1a91f0; }
        .templates-filter__tab-static:hover { color: #1a91f0; }
        .templates-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 2rem; margin: 2rem 0; }
        .templates-card { text-decoration: none; color: inherit; display: block; border: 1px solid #eee; border-radius: 8px; overflow: hidden; transition: transform 0.2s, box-shadow 0.2s; cursor: pointer; }
        .templates-card:hover { transform: translateY(-4px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
        .templates-card__preview { position: relative; aspect-ratio: 3/4; overflow: hidden; }
        .templates-card__preview img { width: 100%; height: 100%; object-fit: cover; }
        .templates-card__action { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.7); opacity: 0; transition: opacity 0.2s; }
        .templates-card:hover .templates-card__action { opacity: 1; }
        .templates-card__options { display: flex; justify-content: space-between; padding: 1rem; }
        .templates-card__colors { display: flex; gap: 0.5rem; }
        .templates-card__colors-item { width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 0 1px #ddd; }
        .templates-card__badges { display: flex; gap: 0.5rem; }
        .templates-card__badge { padding: 0.25rem 0.5rem; background: #f0f0f0; border-radius: 4px; font-size: 0.75rem; }
        .templates-card__footer { padding: 1rem; }
        .templates-card__name { font-weight: 600; font-size: 1.1rem; margin-bottom: 0.5rem; }
        .templates-card__caption { color: #666; font-size: 0.9rem; }

        .footer { background: #2c3e50; color: white; padding: 3rem 0; margin-top: 4rem; }
        .footer__container { max-width: 1200px; margin: 0 auto; padding: 0 2rem; }
        .footer__copyright { text-align: center; opacity: 0.8; }
        @media (max-width: 768px) {
          .nav__bar-menu { display: none; }
          .templates-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};

export default ResumeTemplatesPage;