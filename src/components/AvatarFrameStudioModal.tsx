import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { ProfileData } from '../types/bio';
import {
  AVATAR_FRAMES_LIST,
  FrameCategory,
  AvatarFrameConfig,
} from '../types/avatarFrames';
import { UserAvatar } from './UserAvatar';

interface AvatarFrameStudioModalProps {
  isOpen: boolean;
  currentUser: ProfileData;
  onClose: () => void;
  onSelectFrame: (frameId: string | null) => void;
}

const CATEGORIES: FrameCategory[] = ['All', 'Soft', 'Energy', 'Fire', 'Extreme', 'Neon', 'Cosmic'];

export const AvatarFrameStudioModal: React.FC<AvatarFrameStudioModalProps> = ({
  isOpen,
  currentUser,
  onClose,
  onSelectFrame,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<FrameCategory>('All');
  const currentFrameId = currentUser.avatarFrame || currentUser.effects?.pfpBorder || 'none';

  if (!isOpen) return null;

  const filteredFrames: AvatarFrameConfig[] = AVATAR_FRAMES_LIST.filter((f) => {
    if (selectedCategory === 'All') return true;
    return f.category === selectedCategory;
  });

  const handleApplyFrame = (frameId: string) => {
    const val = frameId === 'none' ? null : frameId;
    onSelectFrame(val);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150 select-none">
      {/* Click backdrop to close */}
      <div className="absolute inset-0" onClick={onClose} />

      <div
        className="relative z-10 w-full max-w-lg bg-[#141519] border border-[#2b2d39] rounded-xs shadow-2xl shadow-black overflow-hidden flex flex-col max-h-[90vh] text-left animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#24252f] bg-[#171820]">
          <div>
            <h2 className="text-sm font-bold text-neutral-100 uppercase tracking-wide">
              Avatar Frame Studio
            </h2>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              Animated avatar borders for the userlist, main chat and profile.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1 text-neutral-400 hover:text-white rounded-xs transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter bar */}
        <div className="flex items-center justify-between gap-3 px-5 py-2.5 border-b border-[#23242e] bg-[#121317]">
          <span className="text-xs font-semibold text-neutral-400">
            Effect category
          </span>
          <div className="flex items-center gap-1 overflow-x-auto py-0.5 max-w-[340px]">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 text-xs rounded-xs font-medium transition-colors cursor-pointer shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-[#292c3a] text-white border border-purple-500/50 shadow-xs'
                    : 'bg-[#181921] hover:bg-[#20222c] text-neutral-400 hover:text-neutral-200 border border-white/5'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Frames List */}
        <div className="p-4 overflow-y-auto flex flex-col gap-2.5 flex-1">
          {filteredFrames.map((frame) => {
            const isEquipped = currentFrameId === frame.id;

            return (
              <div
                key={frame.id}
                className={`flex items-center justify-between p-3 rounded-xs border transition-colors ${
                  isEquipped
                    ? 'bg-[#1e202a] border-purple-500/60 shadow-sm'
                    : 'bg-[#16171f] hover:bg-[#1b1c26] border-[#252632]'
                }`}
              >
                {/* Left: Avatar with frame preview + details */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="relative p-1">
                    <UserAvatar
                      src={currentUser.profilePicture}
                      username={currentUser.username}
                      frameId={frame.id}
                      size="md"
                      shape="square"
                    />
                  </div>

                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-neutral-100 truncate">
                        {frame.name}
                      </span>
                      <span className="px-1.5 py-0.5 rounded-xs text-[10px] font-mono bg-[#232431] text-purple-300 border border-purple-500/20">
                        {frame.category}
                      </span>
                    </div>
                    <span className="text-[11px] text-neutral-400 truncate">
                      {frame.description}
                    </span>
                  </div>
                </div>

                {/* Right: Action button - All are 100% FREE */}
                <div className="shrink-0 ml-3">
                  {isEquipped ? (
                    <button
                      type="button"
                      disabled
                      className="px-3.5 py-1.5 bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 rounded-xs text-xs font-semibold flex items-center gap-1.5 cursor-default"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>In Use</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleApplyFrame(frame.id)}
                      className="px-4 py-1.5 bg-zinc-200 hover:bg-white text-zinc-950 rounded-xs text-xs font-semibold transition-colors cursor-pointer shadow-sm"
                    >
                      Use
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-[#23242e] bg-[#16171f] text-xs">
          <span className="text-neutral-500">
            All Avatar Frames are free to equip.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-[#20222c] hover:bg-[#2a2d3a] text-neutral-200 rounded-xs font-medium transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
