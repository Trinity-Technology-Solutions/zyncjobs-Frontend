import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

interface TalentedPeopleProps {
  onNavigate?: (page: string, data?: any) => void;
}

const TalentedPeople: React.FC<TalentedPeopleProps> = ({ onNavigate }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [rolePage, setRolePage] = useState(0);
  const roles = ['Sales Executive', 'Customer Support', 'Accountant', 'HR Executive', 'Operations Coordinator', 'Software Developer', 'Registered Nurse', 'Mechanical Engineer', 'Teacher', 'Graphic Designer', 'Marketing Executive', 'Logistics Coordinator'];
  const totalRolePages = Math.ceil(roles.length / 6);
  const sectionRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for scroll animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Trigger animation when entering viewport
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (sectionRef.current) {
            observer.unobserve(sectionRef.current);
          }
        }
      },
      { threshold: 0.15 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  return (
    <section ref={sectionRef} className="home-career-feature py-10 sm:py-12 lg:py-14 bg-white overflow-hidden">
      <div className={`career-role-discovery max-w-7xl mx-auto ${isVisible ? 'is-visible' : ''}`}>
        <div className="career-role-introduction">
          <div className="career-role-art"><svg className="career-person-illustration" viewBox="0 0 260 220" fill="none" aria-hidden="true" focusable="false">
  <circle cx="118" cy="106" r="88" fill="#F0EEF5" />
  <g stroke="#243044" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M72 206 80 145 106 133 130 141 146 206" fill="#FFF" />
    <path d="M84 148 70 168 62 200M122 145 148 159 175 126 188 133 159 181 127 170" fill="#FFF" />
    <path d="M99 128 100 141 110 149 119 139 116 126" fill="#FFF" />
    <path d="M93 96Q92 76 108 74Q132 73 129 96L125 116Q114 135 101 121Z" fill="#FFF" />
    <path d="M92 92Q83 75 96 67Q103 61 111 66Q124 56 133 72Q144 78 130 91L123 82 113 87 103 78 99 93Z" fill="#243044" />
    <path d="M101 101H111M115 101H126M111 101H115M113 104 112 113 117 113M108 119Q115 123 120 117" />
    <circle cx="105" cy="103" r="6" /><circle cx="121" cy="103" r="6" />
    <path d="M92 157 95 204M115 153 119 205M83 207H136M176 127 180 116Q184 111 186 117L185 124 190 119Q195 119 192 126L188 133" fill="#FFF" />
  </g>
  <g className="career-floating-document"><rect x="171" y="63" width="49" height="61" rx="6" fill="#FFF" stroke="#EF9D77" strokeWidth="1.5" /><rect x="181" y="76" width="22" height="5" rx="2" fill="#EF9D77" /><path d="M181 91H210M181 99H210M181 107H201" stroke="#ACB9CE" strokeWidth="2" strokeLinecap="round" /></g>
  <g className="career-floating-document-secondary"><rect x="39" y="103" width="32" height="41" rx="5" fill="#FFF" stroke="#A8BFDF" strokeWidth="1.5" /><path d="M48 115H62M48 124H60M48 132H56" stroke="#7595C5" strokeWidth="2" strokeLinecap="round" /></g>
  <path d="m219 158 3 7 8 1-6 5 1 8-6-4-7 3 2-8-5-5 8-1Z" fill="#F6CDB8" />
</svg></div>
          <p className="career-role-eyebrow">Smarter way to get hired</p>
          <h2>Discover Your Next <span>Career Opportunity</span></h2>
          <p>Smart job matching powered by AI to connect you with the perfect role faster.</p>
          <div className="career-role-intro-actions"><button type="button" onClick={() => onNavigate?.('role-selection')}>Get Started <ArrowRight size={16} aria-hidden="true" /></button><button type="button" onClick={() => onNavigate?.('job-listings')}>Browse Jobs</button></div>
        </div>
        <div className="career-role-panel" aria-label="Discover jobs by role">
          <div className="career-role-grid">{roles.slice(rolePage * 6, rolePage * 6 + 6).map(role => <button key={role} type="button" onClick={() => onNavigate?.('job-listings', {searchTerm: role})}><strong>{role}</strong><span>Explore jobs <ChevronRight size={14} aria-hidden="true" /></span></button>)}</div>
          <div className="career-role-pagination"><button type="button" aria-label="Previous roles" disabled={rolePage === 0} onClick={() => setRolePage(page => page - 1)}><ChevronLeft size={18} aria-hidden="true" /></button><div>{Array.from({length: totalRolePages}, (_, index) => <button key={index} type="button" aria-label={`Show role group ${index + 1}`} aria-pressed={rolePage === index} onClick={() => setRolePage(index)} />)}</div><button type="button" aria-label="Next roles" disabled={rolePage === totalRolePages - 1} onClick={() => setRolePage(page => page + 1)}><ChevronRight size={18} aria-hidden="true" /></button></div>
        </div>
      </div>

      {/* Company Logos Section / Lightweight Divider Bar */}
      <div className="home-feature-companies w-full mt-10 sm:mt-12 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <p className="text-center text-gray-500 text-xs sm:text-sm font-semibold tracking-wider uppercase mb-5 sm:mb-6">
            Trusted by top companies
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 sm:gap-10 md:gap-14 lg:gap-16">
            {[
              { name: 'Birlasoft', logo: 'https://img.logo.dev/birlasoft.com?token=pk_cY8JBeWnQR6g5m_ymQhBoQ&size=100' },
              { name: 'Persistent', logo: 'https://img.logo.dev/persistent.com?token=pk_cY8JBeWnQR6g5m_ymQhBoQ&size=100' },
              { name: 'LTIMindtree', logo: 'https://img.logo.dev/ltimindtree.com?token=pk_cY8JBeWnQR6g5m_ymQhBoQ&size=100' },
              { name: 'Saksoft', logo: 'https://img.logo.dev/saksoft.com?token=pk_cY8JBeWnQR6g5m_ymQhBoQ&size=100' },
              { name: 'L&T', logo: 'https://img.logo.dev/larsentoubro.com?token=pk_cY8JBeWnQR6g5m_ymQhBoQ&size=100' },
              { name: 'Cognizant', logo: 'https://img.logo.dev/cognizant.com?token=pk_cY8JBeWnQR6g5m_ymQhBoQ&size=100' },
              { name: 'Accenture', logo: 'https://img.logo.dev/accenture.com?token=pk_cY8JBeWnQR6g5m_ymQhBoQ&size=100' },
            ].map((company, index) => (
              <img
                key={index}
                src={company.logo}
                alt={company.name}
                className="h-9 sm:h-10 lg:h-11 max-w-[140px] sm:max-w-[160px] w-auto object-contain hover:scale-105 transition-transform duration-200"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TalentedPeople;
