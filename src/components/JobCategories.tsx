import React, { useEffect, useRef, useState } from 'react';
import { 
  Code, 
  Megaphone, 
  Users, 
  DollarSign, 
  HeadphonesIcon, 
  ShoppingCart, 
  Palette,
  Building2
} from 'lucide-react';
import GradientCard from './GradientCard';

interface JobCategoriesProps {
  onNavigate?: (page: string, data?: any) => void;
}

const categories = [
  { 
    name: 'Software Development', 
    icon: Code, 
    gradient: 'blue' as const,
    badge: 'High Demand',
    badgeColor: '#60A5FA',
    description: 'Build the next big thing — web, mobile & cloud roles.',
    searchTerms: ['software developer', 'frontend developer', 'backend developer', 'full stack developer', 'web developer', 'software engineer']
  },
  { 
    name: 'Digital Marketing', 
    icon: Megaphone, 
    gradient: 'orange' as const,
    badge: 'Trending',
    badgeColor: '#FB923C',
    description: 'Grow brands with SEO, social & performance marketing.',
    searchTerms: ['digital marketing', 'seo specialist', 'social media manager', 'content marketer', 'ppc specialist', 'growth hacker']
  },
  { 
    name: 'Human Resources', 
    icon: Users, 
    gradient: 'purple' as const,
    badge: 'In Demand',
    badgeColor: '#A78BFA',
    description: 'Shape workplace culture and hire great people.',
    searchTerms: ['hr manager', 'recruiter', 'talent acquisition', 'hr executive', 'people operations', 'human resources']
  },
  { 
    name: 'Finance & Accounting', 
    icon: DollarSign, 
    gradient: 'green' as const,
    badge: 'Essential',
    badgeColor: '#34D399',
    description: 'Own the numbers — from audits to financial analysis.',
    searchTerms: ['accountant', 'financial analyst', 'finance manager', 'chartered accountant', 'auditor', 'bookkeeper']
  },
  { 
    name: 'Customer Support', 
    icon: HeadphonesIcon, 
    gradient: 'cyan' as const,
    badge: 'Top Roles',
    badgeColor: '#22D3EE',
    description: 'Deliver customer experiences people love.',
    searchTerms: ['customer support', 'customer service', 'support executive', 'help desk', 'customer success', 'technical support']
  },
  { 
    name: 'Sales & Business Dev', 
    icon: ShoppingCart, 
    gradient: 'yellow' as const,
    badge: 'Growing',
    badgeColor: '#FBBF24',
    description: 'Drive revenue and open new markets.',
    searchTerms: ['sales executive', 'business development', 'account manager', 'sales manager', 'inside sales', 'b2b sales']
  },
  { 
    name: 'Operations & Admin', 
    icon: Building2, 
    gradient: 'teal' as const,
    badge: 'Core Roles',
    badgeColor: '#2DD4BF',
    description: 'Keep businesses running smoothly every day.',
    searchTerms: ['operations manager', 'admin executive', 'office manager', 'operations analyst', 'back office', 'administrative assistant']
  },
  { 
    name: 'UI/UX Design', 
    icon: Palette, 
    gradient: 'pink' as const,
    badge: 'Creative',
    badgeColor: '#F472B6',
    description: 'Design products people love to use.',
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
    <section className="py-10 sm:py-14 lg:py-16 bg-gradient-to-b from-gray-50 to-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Heading */}
        <div className="text-center mb-10 sm:mb-12">
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

        {/* Grid - Bento Gradient Cards */}
        <div className="w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 auto-rows-fr">
            {categories.map((cat, i) => {
              const Icon = cat.icon;
              const featured = i === 0 || i === 1;
              const spanClasses = [
                'sm:col-span-2 lg:col-span-2 lg:row-span-2 xl:col-span-2 xl:row-span-2',
                'sm:col-span-2 lg:col-span-1 xl:col-span-2',
                '',
                '',
                '',
                '',
                'lg:col-span-2 xl:col-span-1',
                '',
              ][i];

              return (
                <div
                  key={cat.name}
                  ref={el => { cardRefs.current[i] = el; }}
                  className={`h-full ${spanClasses} ${
                    visible[i] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                  }`}
                  style={{ transitionDelay: `${i * 60}ms` }}
                >
                  <GradientCard
                    badgeText={cat.badge}
                    badgeColor={cat.badgeColor}
                    title={cat.name}
                    description={cat.description}
                    ctaText="Explore"
                    gradient={cat.gradient}
                    icon={<Icon className="w-full h-full" />}
                    featured={featured}
                    chips={featured ? cat.searchTerms.slice(0, 3) : undefined}
                    onClick={() => handleCategoryClick(cat)}
                  />
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