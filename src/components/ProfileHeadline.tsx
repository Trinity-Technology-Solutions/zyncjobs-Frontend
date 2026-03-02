import React, { useEffect, useState } from 'react';
import { API_ENDPOINTS } from '../config/api';

interface ProfileHeadlineProps {
  userId: string;
  fallbackHeadline?: string;
}

const ProfileHeadline: React.FC<ProfileHeadlineProps> = ({ userId, fallbackHeadline }) => {
  const [displayHeadline, setDisplayHeadline] = useState(fallbackHeadline || '');
  const [version, setVersion] = useState<'A' | 'B'>('A');

  useEffect(() => {
    const fetchHeadline = async () => {
      if (!userId || userId === 'undefined' || userId === 'null') {
        setDisplayHeadline(fallbackHeadline || '');
        return;
      }
      
      try {
        const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/headline/rotation/${userId}`);
        if (response.ok) {
          const data = await response.json();
          setDisplayHeadline(data.headline || fallbackHeadline || '');
          setVersion(data.version);
        } else {
          setDisplayHeadline(fallbackHeadline || '');
        }
      } catch (error) {
        setDisplayHeadline(fallbackHeadline || '');
      }
    };

    fetchHeadline();
  }, [userId, fallbackHeadline]);

  return (
    <div className="headline-container">
      {displayHeadline && (
        <p className="text-lg text-gray-700 mb-2">{displayHeadline}</p>
      )}
    </div>
  );
};

export default ProfileHeadline;