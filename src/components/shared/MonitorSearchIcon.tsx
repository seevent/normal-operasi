import React from 'react';

export const MonitorSearchIcon = ({ className }: { className?: string }) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      {/* Monitor Base */}
      <rect width="20" height="14" x="2" y="3" rx="2" />
      <line x1="8" x2="16" y1="21" y2="21" />
      <line x1="12" x2="12" y1="17" y2="21" />
      
      {/* Magnifying Glass Inside */}
      <circle cx="11" cy="9" r="3" />
      <line x1="13.1" x2="16" y1="11.1" y2="14" />
    </svg>
  );
};
