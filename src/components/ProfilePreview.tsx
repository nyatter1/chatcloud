import React from 'react';
import { User, Sparkles } from 'lucide-react';
import { TextSegment } from '../types/bio';
import { BioRenderer } from './BioRenderer';

interface ProfilePreviewProps {
  username: string;
  profilePicture: string | null;
  banner: string | null;
  mood: string;
  bioSegments: TextSegment[];
}

export const ProfilePreview: React.FC<ProfilePreviewProps> = ({
  username,
  profilePicture,
  banner,
  mood,
  bioSegments,
}) => {
  return (
    <div className="w-full bg-[#18191d] border border-[#282a32] rounded-lg overflow-hidden shadow-2xl shadow-black/50 text-left flex flex-col">
      {/* Profile Header Bar */}
      <div className="px-4 py-2.5 bg-[#141518] border-b border-[#25262c] flex items-center justify-between">
        <span className="text-xs font-medium text-neutral-400 tracking-wide">
          Live Profile Preview
        </span>
        <span className="text-[11px] text-neutral-500 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
          Live
        </span>
      </div>

      {/* Banner */}
      <div className="relative w-full h-32 sm:h-36 bg-[#1f2026] overflow-hidden flex items-center justify-center border-b border-[#24252c]">
        {banner ? (
          <img
            src={banner}
            alt="Profile Banner Preview"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-neutral-600 gap-1 select-none">
            <span className="text-xs tracking-wider uppercase font-medium">Banner Placeholder</span>
          </div>
        )}
      </div>

      {/* Profile Info Container */}
      <div className="px-5 pb-6 pt-0 relative flex flex-col">
        {/* Avatar positioned over banner */}
        <div className="relative -mt-10 sm:-mt-12 mb-3 flex items-end justify-between">
          <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-full border-4 border-[#18191d] bg-[#22242c] overflow-hidden flex items-center justify-center shadow-lg">
            {profilePicture ? (
              <img
                src={profilePicture}
                alt="Profile Avatar Preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-9 h-9 text-neutral-500" />
            )}
          </div>

          {/* Mood Preview Pill/Badge */}
          {mood.trim() && (
            <div className="mb-2 max-w-[200px] truncate px-3 py-1 bg-[#20222a] border border-[#2e303b] rounded-full text-xs text-neutral-300 flex items-center gap-1.5 shadow-sm">
              <Sparkles className="w-3 h-3 text-purple-400 shrink-0" />
              <span className="truncate">{mood}</span>
            </div>
          )}
        </div>

        {/* Username */}
        <div className="flex flex-col gap-0.5">
          <h2 className="text-lg sm:text-xl font-semibold text-neutral-100 tracking-tight">
            {username.trim() || 'Username'}
          </h2>
          <span className="text-xs text-neutral-500 font-mono">
            @{username.trim().toLowerCase().replace(/\s+/g, '') || 'username'}
          </span>
        </div>

        {/* Divider */}
        <div className="w-full h-[1px] bg-[#24262e] my-4" />

        {/* Bio Section */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-neutral-400 tracking-wide uppercase">
            About Me
          </span>
          <div className="p-3 bg-[#131417] border border-[#23242a] rounded-md min-h-[60px]">
            <BioRenderer
              segments={bioSegments}
              emptyPlaceholder="Your bio will appear here..."
              className="text-xs sm:text-sm text-neutral-200"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
