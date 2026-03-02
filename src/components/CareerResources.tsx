import React, { useState } from 'react';
import { MapPin, ExternalLink, X, Upload, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';

const CareerResources: React.FC = () => {
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [expandedJob, setExpandedJob] = useState<number | null>(null);
  const [applicationSubmitted, setApplicationSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    resume: null as File | null,
    coverLetter: ''
  });

  const jobOpenings = [
    {
      id: 1,
      role: "Senior Software Engineer",
      location: "San Francisco, CA",
      type: "Full-time",
      company: "TechCorp Inc.",
      responsibilities: [
        "Design and develop scalable web applications",
        "Lead technical discussions and code reviews",
        "Mentor junior developers",
        "Collaborate with cross-functional teams"
      ],
      skills: ["React", "Node.js", "TypeScript", "AWS", "Docker"],
      salary: "$120,000 - $160,000",
      deadline: "December 31, 2024"
    },
    {
      id: 2,
      role: "Data Scientist",
      location: "New York, NY",
      type: "Full-time",
      company: "DataTech Solutions",
      responsibilities: [
        "Analyze large datasets to extract insights",
        "Build predictive models and algorithms",
        "Create data visualizations and reports",
        "Work with stakeholders to define requirements"
      ],
      skills: ["Python", "SQL", "Machine Learning", "Pandas", "TensorFlow"],
      salary: "$110,000 - $140,000",
      deadline: "January 15, 2025"
    },
    {
      id: 3,
      role: "DevOps Engineer",
      location: "Austin, TX",
      type: "Full-time",
      company: "CloudOps Ltd.",
      responsibilities: [
        "Manage CI/CD pipelines",
        "Monitor and optimize infrastructure",
        "Implement security best practices",
        "Automate deployment processes"
      ],
      skills: ["AWS", "Kubernetes", "Docker", "Jenkins", "Terraform"],
      salary: "$100,000 - $130,000",
      deadline: "January 30, 2025"
    },
    {
      id: 4,
      role: "Frontend Developer",
      location: "Seattle, WA",
      type: "Remote",
      company: "WebDev Studios",
      responsibilities: [
        "Develop responsive user interfaces",
        "Optimize applications for performance",
        "Collaborate with designers and backend teams",
        "Write clean, maintainable code"
      ],
      skills: ["React", "JavaScript", "CSS", "HTML", "Git"],
      salary: "$80,000 - $110,000",
      deadline: "February 15, 2025"
    },
    {
      id: 5,
      role: "Product Manager",
      location: "Boston, MA",
      type: "Full-time",
      company: "InnovateTech",
      responsibilities: [
        "Define product roadmap and strategy",
        "Coordinate with engineering and design teams",
        "Analyze market trends and user feedback",
        "Manage product launches and releases"
      ],
      skills: ["Product Strategy", "Agile", "Analytics", "Communication", "Leadership"],
      salary: "$130,000 - $170,000",
      deadline: "March 1, 2025"
    },
    {
      id: 6,
      role: "UX Designer",
      location: "Los Angeles, CA",
      type: "Part-time",
      company: "Design Hub",
      responsibilities: [
        "Create user-centered design solutions",
        "Conduct user research and testing",
        "Design wireframes and prototypes",
        "Collaborate with development teams"
      ],
      skills: ["Figma", "Sketch", "User Research", "Prototyping", "Design Systems"],
      salary: "$60,000 - $80,000",
      deadline: "February 28, 2025"
    }
  ];

  const handleApplyNow = (job: any) => {
    setSelectedJob(job);
    setShowApplicationForm(true);
    setApplicationSubmitted(false);
  };

  const handleKnowMore = (jobId: number) => {
    setExpandedJob(expandedJob === jobId ? null : jobId);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({
        ...formData,
        resume: e.target.files[0]
      });
    }
  };

  const handleSubmitApplication = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate form submission
    setTimeout(() => {
      setApplicationSubmitted(true);
    }, 1000);
  };

  const closeApplicationForm = () => {
    setShowApplicationForm(false);
    setSelectedJob(null);
    setApplicationSubmitted(false);
    setFormData({
      name: '',
      email: '',
      phone: '',
      resume: null,
      coverLetter: ''
    });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <section className="py-16 bg-gradient-to-br from-blue-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Career Resources
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Explore current job openings and advance your career with us
          </p>
        </div>
      </section>

      {/* Job Openings */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Current Job Openings</h2>
          <div className="grid gap-6">
            {jobOpenings.map((job) => (
              <div key={job.id} className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:border-blue-400 hover:shadow-lg transition-all duration-300">
                <div className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{job.role}</h3>
                      <div className="flex items-center text-gray-600 mb-2">
                        <MapPin className="w-4 h-4 mr-2" />
                        <span>{job.location}</span>
                        <span className="mx-2">•</span>
                        <span>{job.type}</span>
                      </div>
                      <p className="text-gray-600">{job.company}</p>
                    </div>
                    <div className="flex space-x-3 mt-4 md:mt-0">
                      <button 
                        onClick={() => handleApplyNow(job)}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                      >
                        Apply Now
                      </button>
                      <button 
                        onClick={() => handleKnowMore(job.id)}
                        className="border-2 border-blue-600 text-blue-600 px-6 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors flex items-center"
                      >
                        Know More
                        {expandedJob === job.id ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Expanded Job Details */}
                {expandedJob === job.id && (
                  <div className="border-t border-gray-200 p-6 bg-gray-50">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Responsibilities</h4>
                        <ul className="space-y-2">
                          {job.responsibilities.map((resp, index) => (
                            <li key={index} className="text-gray-600 flex items-start">
                              <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                              {resp}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Required Skills</h4>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {job.skills.map((skill, index) => (
                            <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                              {skill}
                            </span>
                          ))}
                        </div>
                        <div className="space-y-2">
                          <p className="text-gray-600"><span className="font-medium">Salary:</span> {job.salary}</p>
                          <p className="text-gray-600"><span className="font-medium">Application Deadline:</span> {job.deadline}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Application Form Modal */}
      {showApplicationForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  Apply for {selectedJob?.role}
                </h3>
                <button 
                  onClick={closeApplicationForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {!applicationSubmitted ? (
                <form onSubmit={handleSubmitApplication} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Resume * (PDF/DOC)
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileChange}
                        required
                        className="hidden"
                        id="resume-upload"
                      />
                      <label htmlFor="resume-upload" className="cursor-pointer">
                        <span className="text-blue-600 font-medium">Click to upload</span>
                        <span className="text-gray-500"> or drag and drop</span>
                      </label>
                      {formData.resume && (
                        <p className="text-sm text-gray-600 mt-2">
                          Selected: {formData.resume.name}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cover Letter (Optional)
                    </label>
                    <textarea
                      name="coverLetter"
                      value={formData.coverLetter}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none"
                      placeholder="Tell us why you're interested in this position..."
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Submit Application
                  </button>
                </form>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h4 className="text-xl font-semibold text-gray-900 mb-2">
                    Application Submitted Successfully!
                  </h4>
                  <p className="text-gray-600 mb-6">
                    Thank you for your interest in the {selectedJob?.role} position. We'll review your application and get back to you soon.
                  </p>
                  <button
                    onClick={closeApplicationForm}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CareerResources;