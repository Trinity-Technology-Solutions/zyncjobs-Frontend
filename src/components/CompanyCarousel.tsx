import React from 'react';

const COMPANIES = [
  { name: 'Birlasoft', logo: 'https://upload.wikimedia.org/wikipedia/commons/0/0b/Birlasoft.svg' },
  { name: 'Persistent', logo: 'https://upload.wikimedia.org/wikipedia/commons/0/06/Persistent_Systems_Logo.svg' },
  { name: 'LTM', logo: 'https://img.logo.dev/ltimindtree.com?token=pk_cY8JBeWnQR6g5m_ymQhBoQ&size=100', squareMark: true },
  { name: 'Saksoft', logo: 'https://bsmedia.business-standard.com/_media/bs/img/article/2022-02/15/full/20220215213226.jpg', paddedArtwork: true },
  { name: 'Larsen & Toubro', logo: 'https://companieslogo.com/img/orig/LT.NS_BIG-b0f79677.svg' },
  { name: 'Cognizant', logo: 'https://upload.wikimedia.org/wikipedia/commons/4/43/Cognizant_logo_2022.svg' },
  { name: 'Accenture', logo: 'https://upload.wikimedia.org/wikipedia/commons/1/1c/Accenture_logo.svg', raisedWordmark: true },
  { name: 'HCLTech', logo: 'https://upload.wikimedia.org/wikipedia/commons/e/e5/HCLTech-new-logo.svg' },
];

export function CompanyLogoLoop() {
  return (
    <div className="home-company-loop">
      <div className="home-company-track">
        {[false, true].map(copy => (
          <ul key={String(copy)} aria-hidden={copy || undefined} className="home-company-grid">
            {COMPANIES.map(company => (
              <li key={company.name} className="home-company-logo"
                data-padded-artwork={company.paddedArtwork} data-raised-wordmark={company.raisedWordmark}
                data-square-mark={company.squareMark}>
                <img
                  src={company.logo}
                  alt={company.name}
                  decoding="async"
                  onError={event => { event.currentTarget.hidden = true; }}
                />
                <span>{company.name}</span>
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}

const CompanyCarousel: React.FC = () => (
  <section className="home-company-strip" aria-labelledby="home-company-heading">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="home-company-panel">
        <h2 id="home-company-heading" className="home-company-heading">Trusted by top companies</h2>
        <CompanyLogoLoop />
      </div>
    </div>
  </section>
);

export default CompanyCarousel;
