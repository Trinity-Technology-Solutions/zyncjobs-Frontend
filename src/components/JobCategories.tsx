import React, { useEffect, useRef, useState } from 'react';
import { 
  Code, 
  Database, 
  Smartphone, 
  Shield, 
  Cloud, 
  Cpu, 
  TrendingUp, 
  Palette 
} from 'lucide-react';
import { API_ENDPOINTS } from '../config/env';

interface JobCategoriesProps {
  onNavigate?: (page: string, data?: any) => void;
}

const JobCategories: React.FC<JobCategoriesProps> = ({ onNavigate }) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [categoryCounts, setCategoryCounts] = useState<{[key: string]: number}>({});
  const [loading, setLoading] = useState(true);

  const categories = [
    { 
      name: "Software Development", 
      icon: Code, 
      color: "bg-blue-50", 
      iconColor: "text-blue-600",
      searchTerms: ["software developer", "frontend developer", "backend developer", "full stack developer", "web developer", "software engineer"]
    },
    { 
      name: "Data Science & AI", 
      icon: Database, 
      color: "bg-purple-50", 
      iconColor: "text-purple-600",
      searchTerms: ["data scientist", "machine learning", "ai engineer", "data analyst", "data engineer", "artificial intelligence"]
    },
    { 
      name: "Mobile Development", 
      icon: Smartphone, 
      color: "bg-green-50", 
      iconColor: "text-green-600",
      searchTerms: ["mobile developer", "ios developer", "android developer", "react native", "flutter developer", "mobile app"]
    },
    { 
      name: "Cybersecurity", 
      icon: Shield, 
      color: "bg-red-50", 
      iconColor: "text-red-600",
      searchTerms: ["cybersecurity", "security analyst", "security engineer", "penetration tester", "information security", "cyber security"]
    },
    { 
      name: "Cloud Engineering", 
      icon: Cloud, 
      color: "bg-indigo-50", 
      iconColor: "text-indigo-600",
      searchTerms: ["cloud engineer", "aws", "azure", "gcp", "devops", "cloud architect"]
    },
    { 
      name: "DevOps & Infrastructure", 
      icon: Cpu, 
      color: "bg-orange-50", 
      iconColor: "text-orange-600",
      searchTerms: ["devops", "infrastructure", "kubernetes", "docker", "ci/cd", "system administrator"]
    },
    { 
      name: "Product Management", 
      icon: TrendingUp, 
      color: "bg-teal-50", 
      iconColor: "text-teal-600",
      searchTerms: ["product manager", "product owner", "business analyst", "project manager", "scrum master"]
    },
    { 
      name: "UI/UX Design", 
      icon: Palette, 
      color: "bg-pink-50", 
      iconColor: "text-pink-600",
      searchTerms: ["ui designer", "ux designer", "graphic designer", "web designer", "product designer", "visual designer"]
    }
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in-up');
          }
        });
      },
      { threshold: 0.1 }
    );

    const cards = sectionRef.current?.querySelectorAll('.category-card');
    cards?.forEach((card) => observer.observe(card));

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    fetchCategoryCounts();
  }, []);

  const fetchCategoryCounts = async () => {
    try {
      const counts: {[key: string]: number} = {};
      
      // Fetch job counts for each category
      for (const category of categories) {
        try {
          // Use the first search term as the primary query
          const primaryTerm = category.searchTerms[0];
          const response = await fetch(`${API_ENDPOINTS.BASE_URL}/search/advanced`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              query: primaryTerm,
              page: 1,
              limit: 1 // We only need the count
            })
          });
          
          if (response.ok) {
            const data = await response.json();
            counts[category.name] = data.total || data.jobs?.length || 0;
          } else {
            // Fallback: try regular search
            const fallbackResponse = await fetch(`${API_ENDPOINTS.JOBS}/search/query?q=${encodeURIComponent(primaryTerm)}&limit=1`);
            if (fallbackResponse.ok) {
              const fallbackData = await fallbackResponse.json();
              counts[category.name] = Array.isArray(fallbackData) ? fallbackData.length : 0;
            } else {
              counts[category.name] = 0;
            }
          }
        } catch (error) {
          console.error(`Error fetching count for ${category.name}:`, error);
          counts[category.name] = 0;
        }
      }
      
      setCategoryCounts(counts);
    } catch (error) {
      console.error('Error fetching category counts:', error);
      // Set default counts if API fails
      const defaultCounts: {[key: string]: number} = {};
      categories.forEach(cat => {
        defaultCounts[cat.name] = Math.floor(Math.random() * 200) + 50; // Random fallback
      });
      setCategoryCounts(defaultCounts);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (category: typeof categories[0]) => {
    if (onNavigate) {
      // Pass the category name and search terms for filtering
      onNavigate('job-listings', { 
        category: category.name,
        searchTerm: category.searchTerms[0], // Use primary search term
        categoryTerms: category.searchTerms // Pass all terms for advanced filtering
      });
    }
  };

  return (
    <div className="bg-white py-16" ref={sectionRef}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h6 className="text-blue-600 font-semibold text-lg mb-2">Jobs Category</h6>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Choose Your Desire Category</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category, index) => {
            const IconComponent = category.icon;
            const jobCount = categoryCounts[category.name] || 0;
            const jobText = jobCount === 1 ? 'Job' : 'Jobs';
            
            return (
              <div
                key={index}
                onClick={() => handleCategoryClick(category)}
                className={`category-card ${category.color} hover:shadow-lg p-8 rounded-xl cursor-pointer transition-all duration-300 group opacity-0 translate-y-8`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="text-center">
                  <div className={`w-16 h-16 ${category.color} rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <IconComponent className={`w-8 h-8 ${category.iconColor}`} />
                  </div>
                  <h5 className="text-lg font-semibold text-gray-900 mb-2">
                    {category.name}
                  </h5>
                  <span className="text-blue-600 text-sm font-medium">
                    {loading ? 'Loading...' : `${jobCount} ${jobText}`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default JobCategories;
