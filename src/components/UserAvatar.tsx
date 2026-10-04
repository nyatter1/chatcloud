import React from 'react';
import { User } from 'lucide-react';
import { getAvatarFrameConfig } from '../types/avatarFrames';

interface UserAvatarProps {
  src?: string | null;
  username?: string;
  frameId?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  shape?: 'square' | 'circle';
  className?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  src,
  username = '',
  frameId,
  size = 'md',
  shape = 'square',
  className = '',
}) => {
  const frameConfig = getAvatarFrameConfig(frameId);
  const isNone = !frameId || frameId === 'none';

  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20',
  }[size];

  const iconSizes = {
    xs: 'w-3.5 h-3.5',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-8 h-8',
    xl: 'w-10 h-10',
  }[size];

  const roundedClass = shape === 'circle' ? 'rounded-full' : 'rounded-xs';

  return (
    <div
      className={`relative shrink-0 flex items-center justify-center select-none ${sizeClasses} ${roundedClass} ${
        !isNone ? frameConfig.frameClasses : 'border border-[#343644]'
      } bg-[#22242c] overflow-hidden ${className}`}
    >
      {src ? (
        <img
          src={src}
          alt={username || 'Avatar'}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
        />
      ) : (
        <User className={`${iconSizes} text-neutral-400`} />
      )}
    </div>
  );
};
