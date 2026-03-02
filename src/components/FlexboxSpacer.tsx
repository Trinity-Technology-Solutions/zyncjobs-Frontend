import React from 'react';

interface FlexboxSpacerProps {
  maxWidth?: number;
  className?: string;
}

export const FlexboxSpacer: React.FC<FlexboxSpacerProps> = ({ maxWidth = 100, className = '' }) => {
  return (
    <div 
      className={`flex-shrink-0 ${className}`}
      style={{ maxWidth: `${maxWidth}px` }}
    />
  );
};