import React from 'react';

export const RubyIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 ${className}`}
  >
    {/* Base ruby silhouette */}
    <polygon points="6,3 18,3 22,9 12,22 2,9" fill="#e11d48" stroke="#be123c" strokeWidth="1" />
    {/* Top crown facet */}
    <polygon points="6,3 18,3 15,9 9,9" fill="#fb7185" />
    {/* Left crown facet */}
    <polygon points="6,3 9,9 2,9" fill="#f43f5e" />
    {/* Right crown facet */}
    <polygon points="18,3 22,9 15,9" fill="#fda4af" />
    {/* Center lower facet */}
    <polygon points="9,9 15,9 12,22" fill="#be123c" />
    {/* Left pavilion facet */}
    <polygon points="2,9 9,9 12,22" fill="#9f1239" />
    {/* Right pavilion facet */}
    <polygon points="22,9 15,9 12,22" fill="#e11d48" />
    {/* Highlight shine */}
    <line x1="7" y1="4" x2="11" y2="4" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" opacity="0.8" />
  </svg>
);

export const GoldIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 ${className}`}
  >
    {/* Coin Outer Rim */}
    <circle cx="12" cy="12" r="10" fill="#d97706" stroke="#b45309" strokeWidth="1" />
    {/* Coin Face */}
    <circle cx="12" cy="12" r="8.5" fill="#f59e0b" />
    {/* Inner dashed ring */}
    <circle cx="12" cy="12" r="6.8" fill="#fbbf24" stroke="#fef3c7" strokeWidth="0.8" strokeDasharray="1.5 1.5" />
    {/* Embossed Symbol */}
    <path
      d="M14 9.5C13.5 8.6 12.5 8.2 11.5 8.5C10.2 8.9 9.5 10.3 9.5 12C9.5 13.7 10.3 15.1 11.6 15.5C12.8 15.8 13.8 15.1 14.2 14.2H12V12.7H15.5V14.8C14.8 16.3 13.2 17.2 11.4 16.9C9.2 16.5 8 14.5 8 12C8 9.5 9.5 7.4 11.7 7.1C13.2 6.9 14.8 7.8 15.5 9.2L14 9.5Z"
      fill="#78350f"
    />
    {/* Coin Top Highlight */}
    <path
      d="M5 8C7 5 12 4 16 5"
      stroke="#fef08a"
      strokeWidth="1"
      strokeLinecap="round"
      opacity="0.9"
    />
  </svg>
);
