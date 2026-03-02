import React from 'react';

export const Badge: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
      {children}
    </span>
  );
};