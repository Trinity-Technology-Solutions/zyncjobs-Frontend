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
  ArrowRight,
} from 'lucide-react';

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
  },
];

const JobCategories: React.FC<JobCategoriesProps> = ({ onNavigate }) => {
  const handleCategoryClick = (category: (typeof categories)[0]) => {
    if (onNavigate) {
      onNavigate('job-listings', {
        category: category.name,
        searchTerm: category.searchTerms[0],
        categoryTerms: category.searchTerms,
      });
    }
  };

  return (
    <section className="py-10 sm:py-12 lg:py-14 bg-white border-y border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
          <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-orange-600 mb-2">Popular Categories</p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 tracking-tight leading-tight">
            Explore Jobs by <span className="text-orange-500">Category</span>
          </h2>
          <p className="mt-2.5 text-sm sm:text-base text-gray-600 leading-relaxed">
            Find your next opportunity across the top industry sectors hiring today.
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
          {categories.map((cat) => {
            const Icon = cat.icon;

            return (
              <div
                key={cat.name}
                role="button"
                tabIndex={0}
                aria-label={`Explore jobs in ${cat.name}`}
                onClick={() => handleCategoryClick(cat)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleCategoryClick(cat);
                  }
                }}
                className="group relative bg-white rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-xs p-5 sm:p-6 flex flex-col justify-between cursor-pointer transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 select-none h-full"
              >
                <div>
                  {/* Top Row: Icon Container and Subtitle Badge */}
                  <div className="mb-4 sm:mb-5">
                    <div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-700 group-hover:bg-blue-50 group-hover:border-blue-100 group-hover:text-blue-600 transition-colors">
                      <Icon className="w-5 h-5" strokeWidth={1.75} />
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-snug group-hover:text-blue-600 transition-colors duration-200">
                    {cat.name}
                  </h3>
                  <p className="mt-1.5 text-xs sm:text-sm text-slate-500 line-clamp-2 leading-relaxed font-normal">
                    {cat.desc}
                  </p>
                </div>

                {/* Bottom Row: View Jobs Action Link */}
                <div className="pt-3.5 mt-4 border-t border-gray-100 flex items-center justify-between text-xs sm:text-sm font-medium text-gray-600 group-hover:text-blue-600 transition-colors">
                  <span>Explore Jobs</span>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            );
          })}
        </div>

        {/* View All Categories Action */}
        <div className="mt-10 sm:mt-12 text-center">
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('job-listings')}
            className="group inline-flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 text-gray-800 hover:text-blue-600 font-medium text-sm sm:text-base rounded-lg border border-gray-300 hover:border-blue-400 shadow-2xs transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <span>Explore All Categories</span>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all duration-200" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default JobCategories;
