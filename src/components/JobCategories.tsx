import React, { useEffect, useRef, useState } from 'react';
import { 
  Code, 
  Megaphone, 
  Users, 
  DollarSign, 
  HeadphonesIcon, 
  ShoppingCart, 
  TrendingUp, 
  Palette,
  ArrowRight,
  Briefcase,
  Building2,
  Stethoscope
} from 'lucide-react';

interface JobCategoriesProps {
  onNavigate?: (page: string, data?: any) => void;
}

const categories = [
  { 
    name: 'Software Development', 
    icon: Code, 
    gradient: 'from-blue-500 to-indigo-600',
    glow: 'group-hover:shadow-blue-200',
    searchTerms: ['software developer', 'frontend developer', 'backend developer', 'full stack developer', 'web developer', 'software engineer']
  },
  { 
    name: 'Digital Marketing', 
    icon: Megaphone, 
    gradient: 'from-orange-500 to-pink-600',
    glow: 'group-hover:shadow-orange-200',
    searchTerms: ['digital marketing', 'seo specialist', 'social media manager', 'content marketer', 'ppc specialist', 'growth hacker']
  },
  { 
    name: 'Human Resources', 
    icon: Users, 
    gradient: 'from-violet-500 to-purple-600',
    glow: 'group-hover:shadow-violet-200',
    searchTerms: ['hr manager', 'recruiter', 'talent acquisition', 'hr executive', 'people operations', 'human resources']
  },
  { 
    name: 'Finance & Accounting', 
    icon: DollarSign, 
    gradient: 'from-green-500 to-emerald-600',
    glow: 'group-hover:shadow-green-200',
    searchTerms: ['accountant', 'financial analyst', 'finance manager', 'chartered accountant', 'auditor', 'bookkeeper']
  },
  { 
    name: 'Customer Support', 
    icon: HeadphonesIcon, 
    gradient: 'from-cyan-500 to-blue-600',
    glow: 'group-hover:shadow-cyan-200',
    searchTerms: ['customer support', 'customer service', 'support executive', 'help desk', 'customer success', 'technical support']
  },
  { 
    name: 'Sales & Business Dev', 
    icon: ShoppingCart, 
    gradient: 'from-yellow-500 to-orange-600',
    glow: 'group-hover:shadow-yellow-200',
    searchTerms: ['sales executive', 'business development', 'account manager', 'sales manager', 'inside sales', 'b2b sales']
  },
  { 
    name: 'Operations & Admin', 
    icon: Building2, 
    gradient: 'from-teal-500 to-green-600',
    glow: 'group-hover:shadow-teal-200',
    searchTerms: ['operations manager', 'admin executive', 'office manager', 'operations analyst', 'back office', 'administrative assistant']
  },
  { 
    name: 'UI/UX Design', 
    icon: Palette, 
    gradient: 'from-pink-500 to-rose-600',
    glow: 'group-hover:shadow-pink-200',
    searchTerms: ['ui designer', 'ux designer', 'graphic designer', 'web designer', 'product designer', 'visual designer']
  }
];

const JobCategories: React.FC<JobCategoriesProps> = ({ onNavigate }) => {
  const [visible, setVisible] = useState<boolean[]>(new Array(categories.length).fill(false));
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observers = cardRefs.current.map((ref, i) => {
      if (!ref) return null;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setTimeout(() => setVisible(v => { const n = [...v]; n[i] = true; return n; }), i * 80);
          } else {
            setVisible(v => { const n = [...v]; n[i] = false; return n; });
          }
        },
        { threshold: 0.15 }
      );
      obs.observe(ref);
      return obs;
    });
    return () => observers.forEach(o => o?.disconnect());
  }, []);

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
    <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-b from-gray-50 to-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Heading */}
        <div className="text-center mb-12 sm:mb-16">
          <span className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-widest border border-blue-100 mb-4">
            Job Categories
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight px-4">
            Explore Opportunities by <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600">Category</span>
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed px-4">
            Discover roles across top domains powered by AI-driven recommendations.
          </p>
        </div>

        {/* Grid - Responsive with explicit mobile handling */}
        <div className="w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 auto-rows-fr">
            {categories.map((cat, i) => {
              const Icon = cat.icon;

              return (
                <div
                  key={cat.name}
                  ref={el => { cardRefs.current[i] = el; }}
                  onClick={() => handleCategoryClick(cat)}
                  className={`relative group cursor-pointer rounded-2xl bg-white/70 backdrop-blur-xl border border-gray-200 p-6 shadow-md hover:shadow-2xl ${cat.glow} transition-all duration-500 flex flex-col items-center text-center min-h-[160px] sm:min-h-[180px] ${
                    visible[i] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                  }`}
                  style={{ transitionDelay: `${i * 60}ms` }}
                >
                  {/* Glow effect */}
                  <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-20 blur-2xl transition-opacity duration-500 bg-gradient-to-r ${cat.gradient}`} />

                  {/* Icon */}
                  <div className={`relative w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center rounded-2xl text-white bg-gradient-to-r ${cat.gradient} mb-4 shadow-lg group-hover:scale-105 transition-transform duration-300 flex-shrink-0 mx-auto`}>
                    <Icon className="w-7 h-7 sm:w-8 sm:h-8" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 flex flex-col justify-between text-center">
                    {/* Title */}
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 group-hover:text-blue-700 transition-colors leading-tight">
                      {cat.name}
                    </h3>

                    {/* Explore */}
                    <div className="flex items-center justify-center mt-auto">
                      <span className="flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors font-medium">
                        Explore
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
};

export default JobCategories;
