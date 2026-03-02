import React from 'react';
import { ArrowLeft, TrendingUp, DollarSign, MapPin, Users, Star, BarChart3 } from 'lucide-react';
import Header from '../components/Header';

interface SalaryReportPageProps {
  onNavigate: (page: string) => void;
  user?: any;
  onLogout?: () => void;
}

const SalaryReportPage: React.FC<SalaryReportPageProps> = ({ onNavigate, user, onLogout }) => {
  const jobRoles = [
    { role: "AI Engineer", salary: "$165k", growth: "+15%", demand: "Very High" },
    { role: "DevOps Engineer", salary: "$140k", growth: "+12%", demand: "High" },
    { role: "Data Scientist", salary: "$135k", growth: "+10%", demand: "High" },
    { role: "Full Stack Developer", salary: "$125k", growth: "+8%", demand: "Very High" },
    { role: "Cybersecurity Analyst", salary: "$120k", growth: "+18%", demand: "Critical" },
    { role: "Cloud Architect", salary: "$155k", growth: "+14%", demand: "High" }
  ];

  const demandSkills = [
    { skill: "Python", avgSalary: "$142k", jobs: "12.5k" },
    { skill: "React", avgSalary: "$128k", jobs: "18.2k" },
    { skill: "AWS", avgSalary: "$145k", jobs: "15.8k" },
    { skill: "Machine Learning", avgSalary: "$158k", jobs: "8.9k" },
    { skill: "Docker", avgSalary: "$135k", jobs: "11.3k" },
    { skill: "Kubernetes", avgSalary: "$148k", jobs: "7.6k" }
  ];

  const locationData = [
    { city: "San Francisco", avgSalary: "$175k", costIndex: "High" },
    { city: "New York", avgSalary: "$165k", costIndex: "High" },
    { city: "Seattle", avgSalary: "$155k", costIndex: "Medium" },
    { city: "Austin", avgSalary: "$135k", costIndex: "Medium" },
    { city: "Denver", avgSalary: "$125k", costIndex: "Low" },
    { city: "Remote", avgSalary: "$140k", costIndex: "Variable" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center space-x-2 mb-6">
            <div className="bg-orange-500 p-3 rounded-lg">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <span className="bg-orange-100 text-orange-800 px-4 py-2 rounded-full text-lg font-medium">
              2025 Edition
            </span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Tech Salary Report 2025 📊
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Comprehensive analysis of tech salaries, market trends, and compensation insights across roles, skills, and locations
          </p>
        </div>

        {/* Job Role Breakdown */}
        <div className="mb-16">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-gray-200 shadow-lg">
            <div className="flex items-center space-x-3 mb-8">
              <Users className="w-8 h-8 text-blue-600" />
              <h2 className="text-3xl font-bold text-gray-900">Job Role Breakdown</h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobRoles.map((job, index) => (
                <div key={index} className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all">
                  <h3 className="font-bold text-lg text-gray-900 mb-3">{job.role}</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Average Salary:</span>
                      <span className="font-bold text-green-600">{job.salary}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">YoY Growth:</span>
                      <span className="font-bold text-blue-600">{job.growth}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Demand:</span>
                      <span className={`font-bold ${job.demand === 'Critical' ? 'text-red-600' : job.demand === 'Very High' ? 'text-orange-600' : 'text-purple-600'}`}>
                        {job.demand}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* In-Demand Skills */}
        <div className="mb-16">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-gray-200 shadow-lg">
            <div className="flex items-center space-x-3 mb-8">
              <Star className="w-8 h-8 text-yellow-600" />
              <h2 className="text-3xl font-bold text-gray-900">In-Demand Skills</h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {demandSkills.map((skill, index) => (
                <div key={index} className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200 hover:shadow-lg transition-all">
                  <h3 className="font-bold text-lg text-gray-900 mb-3">{skill.skill}</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Avg Salary:</span>
                      <span className="font-bold text-green-600">{skill.avgSalary}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Open Jobs:</span>
                      <span className="font-bold text-blue-600">{skill.jobs}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Location-wise Comparison */}
        <div className="mb-16">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-gray-200 shadow-lg">
            <div className="flex items-center space-x-3 mb-8">
              <MapPin className="w-8 h-8 text-green-600" />
              <h2 className="text-3xl font-bold text-gray-900">Location-wise Salary Comparison</h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {locationData.map((location, index) => (
                <div key={index} className="bg-gradient-to-br from-green-50 to-teal-50 rounded-xl p-6 border border-green-200 hover:shadow-lg transition-all">
                  <h3 className="font-bold text-lg text-gray-900 mb-3">{location.city}</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Avg Salary:</span>
                      <span className="font-bold text-green-600">{location.avgSalary}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cost Index:</span>
                      <span className={`font-bold ${location.costIndex === 'High' ? 'text-red-600' : location.costIndex === 'Medium' ? 'text-orange-600' : 'text-green-600'}`}>
                        {location.costIndex}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Key Insights */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white">
          <div className="flex items-center space-x-3 mb-6">
            <BarChart3 className="w-8 h-8" />
            <h2 className="text-3xl font-bold">Key Insights 2025</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">🚀 Trending Up</h3>
              <ul className="space-y-2 text-blue-100">
                <li>• AI/ML roles seeing 15-18% salary growth</li>
                <li>• Cybersecurity demand increased by 25%</li>
                <li>• Remote work maintaining premium salaries</li>
                <li>• Cloud skills commanding 20% salary boost</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">💡 Market Predictions</h3>
              <ul className="space-y-2 text-blue-100">
                <li>• Full-stack developers remain most in-demand</li>
                <li>• DevOps/SRE roles growing 30% year-over-year</li>
                <li>• Blockchain skills emerging as high-value</li>
                <li>• Junior roles seeing faster salary progression</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalaryReportPage;