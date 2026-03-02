import React, { useState } from 'react';
import { API_ENDPOINTS } from '../config/api';
import { Upload, Building, MapPin, Users, Globe, Briefcase, Save, Plus } from 'lucide-react';
import Notification from '../components/Notification';
import BackButton from '../components/BackButton';

interface CompanyProfilePageProps {
  onNavigate?: (page: string) => void;
  companyName?: string;
}

const CompanyProfilePage: React.FC<CompanyProfilePageProps> = ({ onNavigate }) => {
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
    isVisible: boolean;
  }>({ type: 'success', message: '', isVisible: false });

  const [formData, setFormData] = useState({
    companyName: '',
    industry: '',
    location: '',
    website: '',
    founded: '',
    companySize: '',
    description: '',
    logo: null as File | null,
    jobTitle: '',
    jobLocation: '',
    jobType: '',
    salary: '',
    jobDescription: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({
        ...formData,
        logo: e.target.files[0]
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/company-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        setNotification({
          type: 'success',
          message: 'Company profile saved successfully!',
          isVisible: true
        });
      } else {
        setNotification({
          type: 'error',
          message: 'Failed to save company profile!',
          isVisible: true
        });
      }
    } catch (error) {
      setNotification({
        type: 'error',
        message: 'Error saving company profile!',
        isVisible: true
      });
    }
  };

  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    const jobData = {
      title: formData.jobTitle,
      location: formData.jobLocation,
      type: formData.jobType,
      salary: formData.salary,
      description: formData.jobDescription
    };
    
    try {
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jobData)
      });
      
      if (response.ok) {
        setNotification({
          type: 'success',
          message: 'Job posted successfully!',
          isVisible: true
        });
        // Clear job form
        setFormData({
          ...formData,
          jobTitle: '',
          jobLocation: '',
          jobType: '',
          salary: '',
          jobDescription: ''
        });
      } else {
        setNotification({
          type: 'error',
          message: 'Failed to post job!',
          isVisible: true
        });
      }
    } catch (error) {
      setNotification({
        type: 'error',
        message: 'Error posting job!',
        isVisible: true
      });
    }
  };

  return (
    <>
      <Notification
        type={notification.type}
        message={notification.message}
        isVisible={notification.isVisible}
        onClose={() => setNotification({ ...notification, isVisible: false })}
      />
      <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-8">
            <BackButton 
              onClick={() => onNavigate && onNavigate('dashboard')}
              text="Back"
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors mb-4"
            />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Company Profile</h1>
            <p className="text-gray-600">Complete your company profile to attract top talent</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Company Logo */}
            <div className="border-b pb-6">
              <div className="flex items-center mb-4">
                <Upload className="w-6 h-6 text-blue-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900">Company Logo</h2>
              </div>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept=".png,.jpg,.jpeg,.svg"
                  onChange={handleLogoUpload}
                  className="hidden"
                  id="logo-upload"
                />
                <label htmlFor="logo-upload" className="cursor-pointer">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">
                    {formData.logo ? formData.logo.name : 'Click to upload company logo'}
                  </p>
                  <p className="text-sm text-gray-500">PNG, JPG, JPEG, SVG (Max 2MB)</p>
                </label>
              </div>
            </div>

            {/* Company Information */}
            <div className="border-b pb-6">
              <div className="flex items-center mb-4">
                <Building className="w-6 h-6 text-blue-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900">Company Information</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <input
                  type="text"
                  name="companyName"
                  placeholder="Company Name"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
                <input
                  type="text"
                  name="industry"
                  placeholder="Industry (e.g., Software Development)"
                  value={formData.industry}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  name="location"
                  placeholder="Location (e.g., San Francisco, CA)"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="url"
                  name="website"
                  placeholder="Website (e.g., https://company.com)"
                  value={formData.website}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  name="founded"
                  placeholder="Founded Year (e.g., 2010)"
                  value={formData.founded}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <select
                  name="companySize"
                  value={formData.companySize}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  aria-label="Company size"
                >
                  <option value="">Company Size</option>
                  <option value="1-10">1-10 employees</option>
                  <option value="11-50">11-50 employees</option>
                  <option value="51-200">51-200 employees</option>
                  <option value="201-500">201-500 employees</option>
                  <option value="501-1000">501-1000 employees</option>
                  <option value="1000+">1000+ employees</option>
                </select>
              </div>
              <textarea
                name="description"
                placeholder="Company Description (tell candidates about your company, culture, and mission)"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Submit Company Profile */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => onNavigate && onNavigate('home')}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <Save className="w-5 h-5" />
                <span>Save Company Profile</span>
              </button>
            </div>
          </form>

          {/* Job Posting Section */}
          <div className="mt-12 pt-8 border-t">
            <div className="flex items-center mb-6">
              <Briefcase className="w-6 h-6 text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Post a Job</h2>
            </div>
            
            <form onSubmit={handlePostJob} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  name="jobTitle"
                  placeholder="Job Title (e.g., Senior Frontend Developer)"
                  value={formData.jobTitle}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  name="jobLocation"
                  placeholder="Job Location (e.g., Remote, San Francisco)"
                  value={formData.jobLocation}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <select
                  name="jobType"
                  value={formData.jobType}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  aria-label="Job type"
                >
                  <option value="">Job Type</option>
                  <option value="full-time">Full Time</option>
                  <option value="part-time">Part Time</option>
                  <option value="contract">Contract</option>
                  <option value="remote">Remote</option>
                </select>
                <input
                  type="text"
                  name="salary"
                  placeholder="Salary Range (e.g., $120k - $180k)"
                  value={formData.salary}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <textarea
                name="jobDescription"
                placeholder="Job Description (requirements, responsibilities, benefits)"
                value={formData.jobDescription}
                onChange={handleInputChange}
                rows={4}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
                >
                  <Plus className="w-5 h-5" />
                  <span>Post Job</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default CompanyProfilePage;