import React from 'react';
import { User, Bot } from 'lucide-react';

interface AvatarWithBorderProps {
  src?: string | null;
  borderId?: string | null;
  alt?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | number;
  isSystemBot?: boolean;
  className?: string;
  shape?: 'circle' | 'square';
  showBorder?: boolean;
}

export const AvatarWithBorder: React.FC<AvatarWithBorderProps> = ({
  src,
  alt = 'User avatar',
  size = 'md',
  isSystemBot = false,
  className = '',
  shape = 'circle',
}) => {
  // Outer container dimensions
  let sizeClasses = 'w-10 h-10';
  let iconSize = 'w-5 h-5';

  if (typeof size === 'number') {
    sizeClasses = `w-[${size}px] h-[${size}px]`;
  } else {
    switch (size) {
      case 'xs':
        sizeClasses = 'w-6 h-6';
        iconSize = 'w-3 h-3';
        break;
      case 'sm':
        sizeClasses = 'w-8 h-8';
        iconSize = 'w-4 h-4';
        break;
      case 'md':
        sizeClasses = 'w-10 h-10';
        iconSize = 'w-5 h-5';
        break;
      case 'lg':
        sizeClasses = 'w-12 h-12';
        iconSize = 'w-6 h-6';
        break;
      case 'xl':
        sizeClasses = 'w-16 h-16';
        iconSize = 'w-8 h-8';
        break;
      case '2xl':
        sizeClasses = 'w-20 h-20';
        iconSize = 'w-10 h-10';
        break;
    }
  }

  // All avatars are circular (rounded-full)
  const isCircle = shape !== 'square';
  const roundedClass = isCircle ? 'rounded-full' : 'rounded-xs';

  return (
    <div className={`relative shrink-0 flex items-center justify-center select-none ${sizeClasses} ${className}`}>
      {/* Circular Avatar Container */}
      <div
        className={`w-full h-full overflow-hidden bg-[#242630] border border-[#343644] flex items-center justify-center ${roundedClass}`}
      >
        {src ? (
          <img
            src={src}
            alt={alt}
            referrerPolicy="no-referrer"
            className={`w-full h-full object-cover ${roundedClass}`}
          />
        ) : isSystemBot ? (
          <Bot className={`${iconSize} text-purple-400`} />
        ) : (
          <User className={`${iconSize} text-neutral-400`} />
        )}
      </div>
    </div>
  );
};
