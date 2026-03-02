import React, { useEffect, useRef } from 'react';
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

interface JobCategoriesProps {
  onNavigate?: (page: string, data?: any) => void;
}

const JobCategories: React.FC<JobCategoriesProps> = ({ onNavigate }) => {
  const sectionRef = useRef<HTMLDivElement>(null);

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

  const categories = [
    { name: "Software Development", jobs: "245 Vacancy", icon: Code, color: "bg-blue-50", iconColor: "text-blue-600" },
    { name: "Data Science & AI", jobs: "189 Vacancy", icon: Database, color: "bg-purple-50", iconColor: "text-purple-600" },
    { name: "Mobile Development", jobs: "156 Vacancy", icon: Smartphone, color: "bg-green-50", iconColor: "text-green-600" },
    { name: "Cybersecurity", jobs: "134 Vacancy", icon: Shield, color: "bg-red-50", iconColor: "text-red-600" },
    { name: "Cloud Engineering", jobs: "167 Vacancy", icon: Cloud, color: "bg-indigo-50", iconColor: "text-indigo-600" },
    { name: "DevOps & Infrastructure", jobs: "123 Vacancy", icon: Cpu, color: "bg-orange-50", iconColor: "text-orange-600" },
    { name: "Product Management", jobs: "98 Vacancy", icon: TrendingUp, color: "bg-teal-50", iconColor: "text-teal-600" },
    { name: "UI/UX Design", jobs: "112 Vacancy", icon: Palette, color: "bg-pink-50", iconColor: "text-pink-600" }
  ];

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
            return (
              <div
                key={index}
                onClick={() => onNavigate && onNavigate('job-listings', { category: category.name })}
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
                  <span className="text-blue-600 text-sm font-medium">{category.jobs}</span>
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