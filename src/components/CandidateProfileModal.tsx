import React from 'react';
import { X, MapPin, Star, Users, Code, Mail, Phone, Calendar, Briefcase, GraduationCap } from 'lucide-react';

interface CandidateProfileModalProps {
  candidate: any;
  isOpen: boolean;
  onClose: () => void;
}

const CandidateProfileModal: React.FC<CandidateProfileModalProps> = ({ candidate, isOpen, onClose }) => {
  if (!isOpen || !candidate) return null;

  const getCandidateName = (candidate: any) => {
    return candidate.fullName || candidate.name || 'Anonymous';
  };

  const getCandidateSkills = (candidate: any) => {
    const skills = candidate.skills || [];
    return skills.length > 0 ? skills : ['No skills listed'];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
              {getCandidateName(candidate).split(' ').map(n => n[0]).join('').toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{getCandidateName(candidate)}</h2>
              <p className="text-blue-600 font-semibold">{candidate.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3 text-gray-600">
                <MapPin className="w-5 h-5" />
                <span>{candidate.location || 'Location not specified'}</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-600">
                <Users className="w-5 h-5" />
                <span>{candidate.experience || '2+ years'} experience</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-600">
                <Star className="w-5 h-5 text-yellow-500" />
                <span>{candidate.rating} rating</span>
              </div>
              {candidate.email && (
                <div className="flex items-center space-x-3 text-gray-600">
                  <Mail className="w-5 h-5" />
                  <span>{candidate.email}</span>
                </div>
              )}
              {candidate.phone && (
                <div className="flex items-center space-x-3 text-gray-600">
                  <Phone className="w-5 h-5" />
                  <span>{candidate.phone}</span>
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Expected Salary</h4>
                <p className="text-green-600 font-bold text-lg">{candidate.salary}</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Availability</h4>
                <p className="text-gray-700">{candidate.availability}</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Job Type Preference</h4>
                <p className="text-gray-700">{candidate.jobType || 'Not specified'}</p>
              </div>
            </div>
          </div>

          {/* Skills */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
              <Code className="w-5 h-5" />
              <span>Skills & Technologies</span>
            </h4>
            <div className="flex flex-wrap gap-2">
              {getCandidateSkills(candidate).map((skill, index) => (
                <span 
                  key={index} 
                  className={skill === 'No skills listed' ? 'text-gray-500 text-sm' : 'bg-blue-100 text-blue-800 px-3 py-2 rounded-full text-sm font-medium'}
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Experience */}
          {candidate.experience && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                <Briefcase className="w-5 h-5" />
                <span>Work Experience</span>
              </h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 whitespace-pre-line">{candidate.experience}</p>
              </div>
            </div>
          )}

          {/* Education */}
          {candidate.education && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                <GraduationCap className="w-5 h-5" />
                <span>Education</span>
              </h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 whitespace-pre-line">{candidate.education}</p>
              </div>
            </div>
          )}

          {/* Certifications */}
          {candidate.certifications && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Certifications</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 whitespace-pre-line">{candidate.certifications}</p>
              </div>
            </div>
          )}

          {/* Member Since */}
          {candidate.created_at && (
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Calendar className="w-4 h-4" />
              <span>Member since {new Date(candidate.created_at).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => candidate.email && (window.location.href = `mailto:${candidate.email}`)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Mail className="w-4 h-4" />
            <span>Contact Candidate</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CandidateProfileModal;