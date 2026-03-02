import React from 'react';
import { Home, Search, Briefcase, User, Calendar } from 'lucide-react';

interface MobileNavigationProps {
  onNavigate: (page: string) => void;
  currentPage?: string;
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({ onNavigate, currentPage = '' }) => {
  const navItems = [
    { icon: Home, label: 'Home', path: 'home' },
    { icon: Search, label: 'Jobs', path: 'job-listings' },
    { icon: Briefcase, label: 'Applied', path: 'my-applications' },
    { icon: Calendar, label: 'Interviews', path: 'interviews' },
    { icon: User, label: 'Profile', path: 'candidate-profile' }
  ];

  return (
    <div className="mobile-nav md:hidden">
      <div className="flex justify-around">
        {navItems.map(({ icon: Icon, label, path }) => (
          <button
            key={path}
            onClick={() => onNavigate(path)}
            className={`mobile-nav-item ${currentPage === path ? 'active' : ''}`}
          >
            <Icon size={20} />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default MobileNavigation;