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
    <section className="py-12 sm:py-16 lg:py-20 bg-slate-50 border-y border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12 lg:mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200/70 text-xs font-semibold text-orange-600 mb-3 tracking-wide">
            <span>Categories</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 tracking-tight leading-tight">
            Explore Jobs by <span className="text-orange-500">Category</span>
          </h2>
          <p className="mt-3 text-sm sm:text-base text-gray-600 leading-relaxed">
            Find your next opportunity across the industries hiring now.
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
                className="group relative bg-white rounded-xl border border-slate-100 shadow-sm p-5 sm:p-6 flex flex-col justify-between cursor-pointer transition-all duration-200 hover:border-orange-400/80 hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 select-none"
              >
                <div>
                  {/* Top Row: Icon and subtle arrow indicator */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-700 group-hover:bg-orange-50 group-hover:border-orange-200 group-hover:text-orange-500 transition-colors duration-200 flex-shrink-0">
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={1.8} />
                    </div>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 group-hover:text-orange-500 group-hover:bg-orange-50 transition-all duration-200 flex-shrink-0">
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-base sm:text-lg font-semibold text-slate-900 leading-snug group-hover:text-orange-600 transition-colors duration-200">
                    {cat.name}
                  </h3>
                  <p className="mt-1.5 text-xs sm:text-sm text-slate-500 line-clamp-2 leading-relaxed font-normal">
                    {cat.desc}
                  </p>
                </div>

                {/* Bottom Row: View Jobs CTA */}
                <div className="pt-4 mt-5 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-medium text-slate-600 group-hover:text-orange-600 transition-colors duration-200">
                    View Jobs
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-orange-500 group-hover:translate-x-1 transition-all duration-200" />
                </div>
              </div>
            );
          })}
        </div>

        {/* View All Categories Action */}
        <div className="mt-10 sm:mt-12 lg:mt-14 text-center">
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('job-listings')}
            className="group inline-flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 text-slate-800 hover:text-orange-600 font-semibold text-sm rounded-xl border border-slate-200 hover:border-orange-300 shadow-sm hover:shadow transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
          >
            <span>View All Categories</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default JobCategories;