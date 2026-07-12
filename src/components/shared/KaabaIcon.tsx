import React from 'react';

export const KaabaIcon = ({ className }: { className?: string }) => {
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
      {/* Kaaba Cube Outline */}
      <path d="M4 5.5a1.5 1.5 0 0 1 1.5-1.5h13A1.5 1.5 0 0 1 20 5.5v14a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19.5v-14z" />
      
      {/* Kiswah Golden Band (Pita Emas Kiswah di bagian atas) */}
      <line x1="4" y1="9" x2="20" y2="9" />
      <line x1="4" y1="12" x2="20" y2="12" />
      
      {/* Kaaba Door (Pintu Ka'bah di sebelah kanan) */}
      <path d="M14 14.5v6.5" />
      <path d="M18 14.5v6.5" />
      <path d="M14 14.5h4" />
      
      {/* Accent detail (Sudut Hajar Aswad) */}
      <circle cx="7.5" cy="16.5" r="1" fill="currentColor" />
    </svg>
  );
};
