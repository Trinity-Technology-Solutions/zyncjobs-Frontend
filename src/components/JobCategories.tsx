import React, { useEffect, useRef, useState } from 'react';
import { 
  Code, 
  Database, 
  Smartphone, 
  Shield, 
  Cloud, 
  Cpu, 
  TrendingUp, 
  Palette,
  ArrowRight
} from 'lucide-react';
import { API_ENDPOINTS } from '../config/env';

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
    name: 'Data Science & AI', 
    icon: Database, 
    gradient: 'from-purple-500 to-pink-600',
    glow: 'group-hover:shadow-purple-200',
    searchTerms: ['data scientist', 'machine learning', 'ai engineer', 'data analyst', 'data engineer', 'artificial intelligence']
  },
  { 
    name: 'Mobile Development', 
    icon: Smartphone, 
    gradient: 'from-green-500 to-emerald-600',
    glow: 'group-hover:shadow-green-200',
    searchTerms: ['mobile developer', 'ios developer', 'android developer', 'react native', 'flutter developer', 'mobile app']
  },
  { 
    name: 'Cybersecurity', 
    icon: Shield, 
    gradient: 'from-red-500 to-orange-600',
    glow: 'group-hover:shadow-red-200',
    searchTerms: ['cybersecurity', 'security analyst', 'security engineer', 'penetration tester', 'information security', 'cyber security']
  },
  { 
    name: 'Cloud Engineering', 
    icon: Cloud, 
    gradient: 'from-cyan-500 to-blue-600',
    glow: 'group-hover:shadow-cyan-200',
    searchTerms: ['cloud engineer', 'aws', 'azure', 'gcp', 'devops', 'cloud architect']
  },
  { 
    name: 'DevOps & Infrastructure', 
    icon: Cpu, 
    gradient: 'from-yellow-500 to-orange-600',
    glow: 'group-hover:shadow-yellow-200',
    searchTerms: ['devops', 'infrastructure', 'kubernetes', 'docker', 'ci/cd', 'system administrator']
  },
  { 
    name: 'Product Management', 
    icon: TrendingUp, 
    gradient: 'from-teal-500 to-green-600',
    glow: 'group-hover:shadow-teal-200',
    searchTerms: ['product manager', 'product owner', 'business analyst', 'project manager', 'scrum master']
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
  const [categoryCounts, setCategoryCounts] = useState<{[key: string]: number}>({});
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState<boolean[]>(new Array(categories.length).fill(false));
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observers = cardRefs.current.map((ref, i) => {
      if (!ref) return null;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setTimeout(() => setVisible(v => { const n = [...v]; n[i] = true; return n; }), i * 80);
            obs.disconnect();
          }
        },
        { threshold: 0.15 }
      );
      obs.observe(ref);
      return obs;
    });
    return () => observers.forEach(o => o?.disconnect());
  }, []);

  useEffect(() => {
    fetchCategoryCounts();
  }, []);

  const fetchCategoryCounts = async () => {
    try {
      const counts: {[key: string]: number} = {};
      for (const category of categories) {
        try {
          const primaryTerm = category.searchTerms[0];
          const response = await fetch(`${API_ENDPOINTS.BASE_URL}/search/advanced`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: primaryTerm, page: 1, limit: 1 })
          });
          if (response.ok) {
            const data = await response.json();
            counts[category.name] = data.total || data.jobs?.length || 0;
          } else {
            const fallbackResponse = await fetch(`${API_ENDPOINTS.JOBS}/search/query?q=${encodeURIComponent(primaryTerm)}&limit=1`);
            if (fallbackResponse.ok) {
              const fallbackData = await fallbackResponse.json();
              counts[category.name] = Array.isArray(fallbackData) ? fallbackData.length : 0;
            } else {
              counts[category.name] = 0;
            }
          }
        } catch {
          counts[category.name] = 0;
        }
      }
      setCategoryCounts(counts);
    } catch {
      const defaultCounts: {[key: string]: number} = {};
      categories.forEach(cat => { defaultCounts[cat.name] = Math.floor(Math.random() * 200) + 50; });
      setCategoryCounts(defaultCounts);
    } finally {
      setLoading(false);
    }
  };

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
    <section className="py-20 bg-gradient-to-b from-gray-50 to-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Heading */}
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-widest border border-blue-100 mb-4">
            Job Categories
          </span>
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight">
            Explore Opportunities by <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600">Category</span>
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto text-base leading-relaxed">
            Discover roles across top domains powered by AI-driven recommendations.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat, i) => {
            const Icon = cat.icon;
            const jobCount = categoryCounts[cat.name] || 0;
            const jobText = jobCount === 1 ? 'Job' : 'Jobs';

            return (
              <div
                key={cat.name}
                ref={el => { cardRefs.current[i] = el; }}
                onClick={() => handleCategoryClick(cat)}
                className={`relative group cursor-pointer rounded-2xl bg-white/70 backdrop-blur-xl border border-gray-200 p-6 shadow-md hover:shadow-2xl ${cat.glow} transition-all duration-500 ${
                  visible[i] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
                style={{ transitionDelay: `${i * 60}ms` }}
              >
                {/* Glow effect */}
                <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-20 blur-2xl transition-opacity duration-500 bg-gradient-to-r ${cat.gradient}`} />

                {/* Icon */}
                <div className={`relative w-14 h-14 flex items-center justify-center rounded-xl text-white bg-gradient-to-r ${cat.gradient} mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <Icon size={26} />
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-blue-700 transition-colors">
                  {cat.name}
                </h3>

                {/* Jobs count + Explore */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-900 font-bold text-base">
                      {loading ? '...' : jobCount}
                    </span>
                    <span className="text-gray-500 text-sm">
                      {jobText}
                    </span>
                  </div>
                  <span className="flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors font-medium">
                    Explore
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default JobCategories;
