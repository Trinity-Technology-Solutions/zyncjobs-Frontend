import React from 'react';

const COMPANIES = [
  { name: 'Birlasoft',   logo: 'https://img.logo.dev/birlasoft.com?token=pk_cY8JBeWnQR6g5m_ymQhBoQ&size=100' },
  { name: 'Persistent', logo: 'https://img.logo.dev/persistent.com?token=pk_cY8JBeWnQR6g5m_ymQhBoQ&size=100' },
  { name: 'LTIMindtree',logo: 'https://img.logo.dev/ltimindtree.com?token=pk_cY8JBeWnQR6g5m_ymQhBoQ&size=100' },
  { name: 'Saksoft',    logo: 'https://img.logo.dev/saksoft.com?token=pk_cY8JBeWnQR6g5m_ymQhBoQ&size=100' },
  { name: 'L&T',        logo: 'https://img.logo.dev/larsentoubro.com?token=pk_cY8JBeWnQR6g5m_ymQhBoQ&size=100' },
  { name: 'Cognizant',  logo: 'https://img.logo.dev/cognizant.com?token=pk_cY8JBeWnQR6g5m_ymQhBoQ&size=100' },
  { name: 'Accenture',  logo: 'https://img.logo.dev/accenture.com?token=pk_cY8JBeWnQR6g5m_ymQhBoQ&size=100' },
];

const CompanyCarousel: React.FC = () => {
  // Duplicate the companies array to create a seamless infinite loop
  const duplicatedCompanies = [...COMPANIES, ...COMPANIES, ...COMPANIES];

  return (
    <div className="w-full bg-white py-6 sm:py-8 border-y border-slate-100 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-xs font-bold text-gray-400 tracking-[0.2em] uppercase mb-4 sm:mb-6">
          Trusted by Top Companies
        </p>
        
        <div className="relative w-full overflow-hidden">
          {/* Gradient overlays for smooth fade on edges */}
          <div className="absolute left-0 top-0 bottom-0 w-10 sm:w-20 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
          <div className="absolute right-0 top-0 bottom-0 w-10 sm:w-20 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>

          {/* Marquee container */}
          <div className="flex items-center gap-12 sm:gap-16 md:gap-24 animate-[marquee_30s_linear_infinite] w-max">
            {duplicatedCompanies.map((company, index) => (
              <div 
                key={`${company.name}-${index}`} 
                className="flex items-center justify-center transition-transform duration-200 hover:scale-105"
              >
                <img 
                  src={company.logo} 
                  alt={`${company.name} logo`} 
                  className="h-9 sm:h-10 lg:h-11 max-w-[140px] sm:max-w-[160px] w-auto object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(company.name)}&background=0284c7&color=fff&size=80`;
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
