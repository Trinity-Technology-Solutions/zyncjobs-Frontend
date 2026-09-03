import React from 'react';

const COMPANIES = [
  { name: 'Birlasoft',   logo: 'https://www.google.com/s2/favicons?domain=birlasoft.com&sz=64' },
  { name: 'Persistent', logo: '/images/company-logos/persistent-favicon.svg' },
  { name: 'LTIMindtree',logo: 'https://www.google.com/s2/favicons?domain=ltm.com&sz=64' },
  { name: 'L&T',        logo: '/images/company-logos/lt-logo.png' },
  { name: 'Cognizant',  logo: 'https://www.google.com/s2/favicons?domain=cognizant.com&sz=64' },
  { name: 'Accenture',  logo: 'https://www.google.com/s2/favicons?domain=accenture.com&sz=64' },
];

const CompanyCarousel: React.FC = () => {
  // Duplicate the companies array to create a seamless infinite loop
  const duplicatedCompanies = [...COMPANIES, ...COMPANIES, ...COMPANIES];

  return (
    <div className="w-full bg-white py-12 border-b border-gray-100 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-xs font-bold text-gray-400 tracking-[0.2em] uppercase mb-8">
          Trusted By Leading Companies
        </p>
        
        <div className="relative w-full overflow-hidden">
          {/* Gradient overlays for smooth fade on edges */}
          <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-white to-transparent z-10"></div>
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white to-transparent z-10"></div>

          {/* Marquee container */}
          <div className="flex items-center gap-16 md:gap-24 animate-[marquee_30s_linear_infinite] w-max">
            {duplicatedCompanies.map((company, index) => (
              <div 
                key={`${company.name}-${index}`} 
                className="flex flex-col items-center justify-center transition-all duration-300"
              >
                <img 
                  src={company.logo} 
                  alt={`${company.name} logo`} 
                  className="h-8 md:h-10 w-auto object-contain"
                  onError={(e) => {
                    // Fallback if image fails to load
                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${company.name}&background=random&color=fff&size=64`;
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-33.33%); }
        }
      `}} />
    </div>
  );
};

export default CompanyCarousel;
