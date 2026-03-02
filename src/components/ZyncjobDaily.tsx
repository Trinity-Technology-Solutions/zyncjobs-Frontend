
import { Calendar, TrendingUp, Users, ArrowRight } from 'lucide-react';

interface ZyncjobDailyProps {
  onNavigate?: (page: string) => void;
}

const ZyncjobDaily: React.FC<ZyncjobDailyProps> = ({ onNavigate }) => {
  const articles = [
    {
      title: "AI Skills in Highest Demand for 2025",
      excerpt: "Machine learning, natural language processing, and computer vision lead the pack...",
      date: "Jan 15, 2025",
      category: "Trending Skills",
      bgColor: "bg-white",
      image: "/images/AI-Skills-in-Highest-Demand-for-2025.jpg"
    },
    {
      title: "Remote Work Trends in Tech Industry",
      excerpt: "How the landscape of remote tech jobs continues to evolve and what it means for your career...",
      date: "Jan 14, 2025", 
      category: "Market Trends",
      bgColor: "bg-white",
      image: "/images/market.jpg"
    },
    {
      title: "Salary Negotiation Tips for Developers",
      excerpt: "Expert strategies to maximize your earning potential in tech interviews...",
      date: "Jan 13, 2025",
      category: "Career Advice",
      bgColor: "bg-white",
      image: "/images/salary.jpg"
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Calendar className="w-6 h-6 text-blue-600" />
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              Daily Updates
            </span>
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Stay Informed with ZyncJobs Daily
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Daily tech-job news, market trends, and thought leadership—tidy, insightful reads to keep you ahead in the job market.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {articles.map((article, index) => (
            <div 
              key={index} 
              className={`${article.bgColor} rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group cursor-pointer transform hover:scale-105 active:scale-95 border-2 border-transparent hover:border-blue-500`}
              onClick={() => console.log(`Clicked on: ${article.title}`)}
            >
              <img 
                src={article.image} 
                alt={article.title}
                className="w-full h-48 object-cover group-hover:brightness-110 transition-all duration-300"
              />
              <div className="p-8">
                <div className="flex items-center space-x-2 mb-4">
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium group-hover:bg-blue-200 transition-colors">
                    {article.category}
                  </span>
                  <span className="text-gray-500 text-sm">{article.date}</span>
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">
                  {article.title}
                </h3>
                
                <p className="text-gray-600 leading-relaxed mb-6">
                  {article.excerpt}
                </p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-center">
          <button 
            onClick={() => onNavigate && onNavigate('daily-jobs')}
            className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2 mx-auto"
          >
            <span>Explore ZyncJobs Daily</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default ZyncjobDaily;