import React from 'react';
import { ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { Code, Megaphone, Users, DollarSign, HeadphonesIcon, Briefcase, ClipboardList, PenTool } from 'lucide-react';

interface JobCategoriesProps {
  onNavigate?: (page: string, data?: any) => void;
}

const categories = [
  {
    name: 'Software Development',
    icon: Code,
    desc: 'Frontend, Backend, Full Stack & more',
    searchTerms: ['software developer', 'frontend developer', 'backend developer'],
  },
  {
    name: 'Digital Marketing',
    icon: Megaphone,
    desc: 'SEO, SEM, Social Media, Content & more',
    searchTerms: ['digital marketing', 'seo specialist', 'social media manager'],
  },
  {
    name: 'Human Resources',
    icon: Users,
    desc: 'Recruitment, Training, Employee Relations',
    searchTerms: ['hr manager', 'recruiter', 'talent acquisition'],
  },
  {
    name: 'Finance & Accounting',
    icon: DollarSign,
    desc: 'Accounting, Banking, Financial Analysis',
    searchTerms: ['accountant', 'financial analyst', 'finance manager'],
  },
  {
    name: 'Customer Support',
    icon: HeadphonesIcon,
    desc: 'Support, Success, Service & more',
    searchTerms: ['customer support', 'customer service', 'support executive'],
  },
  {
    name: 'Sales & Business Dev',
    icon: Briefcase,
    desc: 'Sales, Business Development, BD',
    searchTerms: ['sales executive', 'business development', 'account manager'],
  },
  {
    name: 'Operations & Admin',
    icon: ClipboardList,
    desc: 'Admin, Operations, Supply Chain & more',
    searchTerms: ['operations manager', 'admin executive', 'office manager'],
  },
  {
    name: 'UI/UX Design',
    icon: PenTool,
    desc: 'UI Design, UX Research, Product Design',
    searchTerms: ['ui designer', 'ux designer', 'graphic designer'],
  }
];

const AnimatedBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
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
    <section className="py-8 sm:py-12 lg:py-14 bg-[#FAFBFC] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-3 tracking-tight">
            Explore Jobs by <span className="text-orange-500">Category</span>
          </h2>
          <p className="text-slate-500 text-sm sm:text-base max-w-xl mx-auto mb-3 sm:mb-4">
            Find your next opportunity across the industries hiring now.
          </p>
          <div className="w-8 h-[3px] bg-blue-600 mx-auto rounded-full" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {categories.map((cat) => {
            const Icon = cat.icon;

            return (
              <div
                key={cat.name}
                onClick={() => handleCategoryClick(cat)}
                className="group bg-white rounded-xl border border-gray-200/80 shadow-sm w-full cursor-pointer hover:shadow-xl hover:border-blue-200 transition-all duration-300 overflow-hidden flex flex-col justify-between"
              >
                <div className="p-5">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shadow-xs group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 flex-shrink-0">
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={1.75} />
                    </div>
                    <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider">
                      Explore Jobs
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-tight mb-2 group-hover:text-blue-600 transition-colors">
                    {cat.name}
                  </h3>

                  <span className="inline-block px-2.5 py-1 bg-gray-50 border border-gray-100 rounded text-xs font-medium text-gray-600">
                    {cat.desc}
                  </span>
                </div>

                <div className="px-5 pb-5 pt-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCategoryClick(cat);
                    }}
                    className="w-full px-4 py-2.5 bg-gray-900 text-white font-medium rounded-lg shadow-sm group-hover:bg-blue-600 transition-colors duration-200 text-sm flex items-center justify-center gap-2"
                  >
                    <span>View Jobs</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

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