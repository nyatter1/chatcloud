import React from 'react';

interface ChatlaxyLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const ChatlaxyLogo: React.FC<ChatlaxyLogoProps> = ({
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    xs: 'text-sm sm:text-base',
    sm: 'text-base sm:text-lg',
    md: 'text-lg sm:text-xl md:text-2xl',
    lg: 'text-2xl sm:text-3xl md:text-4xl',
    xl: 'text-3xl sm:text-4xl md:text-5xl',
  };

  const strokeWidths = {
    xs: '3px',
    sm: '3.5px',
    md: '4.5px',
    lg: '6px',
    xl: '8px',
  };

  const shadowOffsets = {
    xs: '0 1.5px 0 #000000, 0 2.5px 2px rgba(0,0,0,0.5)',
    sm: '0 2px 0 #000000, 0 3px 0 #000000, 0 4px 3px rgba(0,0,0,0.5)',
    md: '0 2.5px 0 #000000, 0 4px 0 #000000, 0 5px 3px rgba(0,0,0,0.6)',
    lg: '0 3.5px 0 #000000, 0 6px 0 #000000, 0 7px 4px rgba(0,0,0,0.6)',
    xl: '0 4.5px 0 #000000, 0 8px 0 #000000, 0 10px 6px rgba(0,0,0,0.7)',
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center font-black select-none uppercase tracking-normal leading-none cursor-default ${sizeClasses[size]} ${className}`}
      style={{
        fontFamily: "'Titan One', 'Fredoka', 'Baloo 2', Impact, cursive, sans-serif",
      }}
      title="CHATLAXY"
    >
      {/* 3D Black Outline and Bottom Extrusion */}
      <span
        className="absolute inset-0 select-none pointer-events-none flex items-center justify-center"
        style={{
          color: '#000000',
          WebkitTextStroke: `${strokeWidths[size]} #000000`,
          textShadow: shadowOffsets[size],
          transform: 'translateZ(0)',
        }}
        aria-hidden="true"
      >
        CHATLAXY
      </span>

      {/* Vibrant Glossy Bubble Gradient Fill */}
      <span
        className="relative z-10 select-none flex items-center justify-center"
        style={{
          background: 'linear-gradient(180deg, #FFE855 0%, #FFA800 48%, #FF5200 86%, #D93600 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          filter: 'drop-shadow(0 1px 0 rgba(255,255,255,0.4))',
          transform: 'translateZ(0)',
        }}
      >
        CHATLAXY
      </span>
    </div>
  );
};
