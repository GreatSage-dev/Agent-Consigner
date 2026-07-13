import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 32 }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ overflow: 'visible' }}
    >
      {/* Outer Pentagonal Security Shield */}
      <path 
        d="M50 10 
           L86 24 
           L86 64 
           L50 90 
           L14 64 
           L14 24 
           Z" 
        stroke="currentColor" 
        strokeWidth="5" 
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Interlocking 'A' Chevron */}
      <path 
        d="M30 52 
           L50 28 
           L70 52" 
        stroke="currentColor" 
        strokeWidth="5" 
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* 'A' Crossbar */}
      <path 
        d="M40 50 L60 50" 
        stroke="currentColor" 
        strokeWidth="4" 
        strokeLinecap="round"
      />

      {/* Interlocking 'C' Arch Loop */}
      <path 
        d="M32 64 C 36 78, 64 78, 68 64" 
        stroke="currentColor" 
        strokeWidth="5" 
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default Logo;
