import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, Calendar, Users, Award, Briefcase } from 'lucide-react';
import { API_ENDPOINTS } from '../config/api';

interface TimelineItem {
  status: string;
  date: string;
  note: string;
  updatedBy: string;
}

interface ApplicationTimelineProps {
  applicationId: string;
  currentStatus: string;
}

const ApplicationTimeline: React.FC<ApplicationTimelineProps> = ({ applicationId, currentStatus }) => {
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTimeline();
  }, [applicationId]);

  const fetchTimeline = async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/applications/${applicationId}/timeline`);
      if (response.ok) {
        const data = await response.json();
        setTimeline(data);
      }
    } catch (error) {
      console.error('Error fetching timeline:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'applied':
        return <Briefcase className="w-5 h-5 text-blue-600" />;
      case 'reviewed':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'shortlisted':
        return <Award className="w-5 h-5 text-purple-600" />;
      case 'interview_scheduled':
        return <Calendar className="w-5 h-5 text-indigo-600" />;
      case 'interviewed':
        return <Users className="w-5 h-5 text-orange-600" />;
      case 'offer_made':
        return <Award className="w-5 h-5 text-green-600" />;
      case 'hired':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'withdrawn':
        return <XCircle className="w-5 h-5 text-gray-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'applied':
        return 'bg-blue-100 border-blue-200';
      case 'reviewed':
        return 'bg-yellow-100 border-yellow-200';
      case 'shortlisted':
        return 'bg-purple-100 border-purple-200';
      case 'interview_scheduled':
        return 'bg-indigo-100 border-indigo-200';
      case 'interviewed':
        return 'bg-orange-100 border-orange-200';
      case 'offer_made':
        return 'bg-green-100 border-green-200';
      case 'hired':
        return 'bg-green-100 border-green-200';
      case 'rejected':
        return 'bg-red-100 border-red-200';
      case 'withdrawn':
        return 'bg-gray-100 border-gray-200';
      default:
        return 'bg-gray-100 border-gray-200';
    }
  };

  const formatStatus = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Application Timeline</h3>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold mb-4">Application Timeline</h3>
      
      <div className="space-y-4">
        {timeline.map((item, index) => (
          <div key={index} className="flex items-start space-x-4">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${getStatusColor(item.status)}`}>
              {getStatusIcon(item.status)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-900">
                  {formatStatus(item.status)}
                </h4>
                <span className="text-xs text-gray-500">
                  {new Date(item.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              
              <p className="text-sm text-gray-600 mt-1">{item.note}</p>
              
              {item.updatedBy && (
                <p className="text-xs text-gray-500 mt-1">
                  Updated by {item.updatedBy}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {timeline.length === 0 && (
        <div className="text-center py-8">
          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No timeline data available</p>
        </div>
      )}
    </div>
  );
};

export default ApplicationTimeline;