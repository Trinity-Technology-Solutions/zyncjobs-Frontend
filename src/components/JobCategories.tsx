import React from 'react';
import { 
  Code, 
  Megaphone, 
  Users, 
  DollarSign, 
  HeadphonesIcon, 
  Briefcase, 
  ClipboardList, 
  PenTool,
  ArrowRight
} from 'lucide-react';
import { motion } from 'motion/react';

interface JobCategoriesProps {
  onNavigate?: (page: string, data?: any) => void;
}

const categories = [
  { 
    name: 'Software Development', 
    icon: Code, 
    desc: 'Frontend, Backend, Full Stack & more',
    searchTerms: ['software developer', 'frontend developer', 'backend developer']
  },
  { 
    name: 'Digital Marketing', 
    icon: Megaphone, 
    desc: 'SEO, SEM, Social Media, Content & more',
    searchTerms: ['digital marketing', 'seo specialist', 'social media manager']
  },
  { 
    name: 'Human Resources', 
    icon: Users, 
    desc: 'Recruitment, Training, Employee Relations',
    searchTerms: ['hr manager', 'recruiter', 'talent acquisition']
  },
  { 
    name: 'Finance & Accounting', 
    icon: DollarSign, 
    desc: 'Accounting, Banking, Financial Analysis',
    searchTerms: ['accountant', 'financial analyst', 'finance manager']
  },
  { 
    name: 'Customer Support', 
    icon: HeadphonesIcon, 
    desc: 'Support, Success, Service & more',
    searchTerms: ['customer support', 'customer service', 'support executive']
  },
  { 
    name: 'Sales & Business Dev', 
    icon: Briefcase, 
    desc: 'Sales, Business Development, BD',
    searchTerms: ['sales executive', 'business development', 'account manager']
  },
  { 
    name: 'Operations & Admin', 
    icon: ClipboardList, 
    desc: 'Admin, Operations, Supply Chain & more',
    searchTerms: ['operations manager', 'admin executive', 'office manager']
  },
  { 
    name: 'UI/UX Design', 
    icon: PenTool, 
    desc: 'UI Design, UX Research, Product Design',
    searchTerms: ['ui designer', 'ux designer', 'graphic designer']
  }
];

const AnimatedBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Left Parametric Wave Mesh */}
      <svg 
        className="absolute left-0 top-0 h-full w-[40%] max-w-[500px] text-blue-500/[0.08] pointer-events-none" 
        viewBox="0 0 500 1000" 
        fill="none" 
        preserveAspectRatio="none"
      >
        {Array.from({ length: 45 }).map((_, i) => (
          <path 
            key={`wave-${i}`} 
            d={`M -50 ${-100 + i * 25} C ${150 + i * 8} ${100 + i * 15}, ${300 - i * 4} ${500 + i * 12}, ${50 + i * 15} 1100`}
            stroke="currentColor" 
            strokeWidth="1.5" 
          />
        ))}
      </svg>
      
      {/* Right dots */}
      <div className="absolute top-0 right-0 w-1/3 h-full">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-[4px] h-[4px] bg-blue-300 rounded-full"
            style={{ 
              left: `${10 + Math.random() * 80}%`, 
              top: `${10 + Math.random() * 80}%` 
            }}
            animate={{ opacity: [0, 0.8, 0] }}
            transition={{ 
              duration: 4 + Math.random() * 6, 
              repeat: Infinity, 
              delay: Math.random() * 10 
            }}
          />
        ))}
      </div>
    </div>
  );
};

const JobCategories: React.FC<JobCategoriesProps> = ({ onNavigate }) => {
  const handleCategoryClick = (category: typeof categories[0]) => {
    if (onNavigate) {
      onNavigate('job-listings', { 
        category: category.name,
        searchTerm: category.searchTerms[0],
        categoryTerms: category.searchTerms
      });
    }
  };

  return (
    <section className="py-16 sm:py-24 bg-[#FAFBFC] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Heading */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-[40px] font-bold text-slate-900 mb-4 tracking-tight">
            Explore Jobs by <span className="text-orange-500">Category</span>
          </h2>
          <p className="text-slate-500 text-[15px] sm:text-base max-w-xl mx-auto mb-6">
            Find your next opportunity across the industries hiring now.
          </p>
          <div className="w-8 h-[3px] bg-blue-600 mx-auto rounded-full" />
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {categories.map((cat, i) => {
            const Icon = cat.icon;

            return (
              <div
                key={cat.name}
                onClick={() => handleCategoryClick(cat)}
                className="group relative flex items-center bg-white border border-[#E5E7EB] rounded-[16px] p-5 sm:p-6 cursor-pointer shadow-[0_2px_10px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:border-blue-100 transition-all duration-300 overflow-hidden min-h-[150px]"
              >
                
                {/* Icon */}
                <div className="flex-shrink-0 w-11 h-11 flex items-center justify-center rounded-[12px] bg-slate-50 text-slate-400 group-hover:text-blue-600 group-hover:-translate-y-[2px] transition-all duration-300">
                  <Icon className="w-5 h-5" strokeWidth={1.5} />
                </div>
                
                {/* Content */}
                <div className="ml-4 flex-1 min-w-0">
                  <h3 className="text-[15px] font-bold text-slate-900 leading-tight mb-1.5 truncate group-hover:text-blue-700 transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-[13px] text-slate-500 leading-relaxed pr-2 line-clamp-2">
                    {cat.desc}
                  </p>
                </div>
                
                {/* Arrow */}
                <div className="flex-shrink-0 ml-1 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all duration-250">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="mt-14 text-center">
          <button 
            onClick={() => onNavigate && onNavigate('job-listings')} 
            className="group inline-flex items-center gap-2 text-[15px] font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            View All Categories
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

      </div>
    </section>
  );
};

export default JobCategories;
