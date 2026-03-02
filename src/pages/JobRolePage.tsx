import React from 'react';
import { ArrowLeft, Code } from 'lucide-react';

interface JobRolePageProps {
  onNavigate: (page: string) => void;
  jobTitle?: string;
}

const JobRolePage: React.FC<JobRolePageProps> = ({ onNavigate, jobTitle }) => {
  const roleData = {
    "Full Stack Developer": {
      icon: Code,
      description: "Develop both front-end and back-end applications. Work with modern frameworks, databases, and APIs to create complete web solutions.",
      color: "from-blue-600 to-purple-600"
    },
    "React": {
      icon: Code,
      description: "A JavaScript library for building user interfaces. Create interactive, component-based web applications with modern development practices.",
      color: "from-purple-600 to-pink-600"
    },
    "Data Scientist": {
      icon: Code,
      description: "Analyze complex data sets to extract meaningful insights. Build predictive models and create data visualizations to drive business decisions.",
      color: "from-green-600 to-blue-600"
    },
    "DevOps Engineer": {
      icon: Code,
      description: "Manage cloud infrastructure and deployment pipelines. Automate processes and ensure scalable, reliable system operations.",
      color: "from-purple-600 to-pink-600"
    },
    "IT Support": {
      icon: Code,
      description: "Provide technical assistance and troubleshooting for hardware and software issues. Maintain IT systems and support end users.",
      color: "from-orange-600 to-red-600"
    },
    ".NET Developer": {
      icon: Code,
      description: "Build robust applications using Microsoft .NET framework. Develop web applications, APIs, and enterprise solutions.",
      color: "from-indigo-600 to-blue-600"
    },
    "Business Analyst": {
      icon: Code,
      description: "Bridge the gap between business needs and technical solutions. Analyze requirements and optimize business processes.",
      color: "from-teal-600 to-green-600"
    },
    "Cyber Security Analyst": {
      icon: Code,
      description: "Protect organizations from cyber threats. Monitor security systems, investigate incidents, and implement security measures.",
      color: "from-red-600 to-pink-600"
    },
    "Game Developer": {
      icon: Code,
      description: "Create engaging video games and interactive experiences. Work with game engines, graphics, and gameplay mechanics.",
      color: "from-yellow-600 to-orange-600"
    }
  };

  const currentRole = roleData[jobTitle as keyof typeof roleData] || roleData["Full Stack Developer"];

  return (
    <div className={`min-h-screen bg-gradient-to-br ${currentRole.color} p-8`}>
      <div className="mb-8">
        <button 
          onClick={() => onNavigate('home')}
          className="bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-2xl font-medium hover:bg-white/30 transition-all flex items-center space-x-2"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Home</span>
        </button>
      </div>

      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="bg-white rounded-3xl p-12 max-w-4xl w-full mx-auto text-center shadow-2xl">
          <div className={`bg-gradient-to-br ${currentRole.color} rounded-3xl p-8 mb-8 inline-block shadow-lg`}>
            <Code className="w-16 h-16 text-white mx-auto" />
          </div>

          <h1 className="text-5xl lg:text-6xl font-bold mb-8 text-gray-900">
            {jobTitle || "Full Stack Developer"}
          </h1>

          <p className="text-xl lg:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            {currentRole.description}
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <button 
              onClick={() => onNavigate('job-listings')}
              className={`bg-gradient-to-r ${currentRole.color} text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:shadow-lg transition-all transform hover:scale-105`}
            >
              Find {jobTitle || "Full Stack Developer"} Jobs
            </button>
            <button 
              onClick={() => onNavigate('home')}
              className="bg-gray-100 text-gray-700 px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-gray-200 transition-all border-2 border-gray-200"
            >
              Explore More Skills
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobRolePage;