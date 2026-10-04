import React from 'react';
import { X, Gift, Sparkles, Newspaper, Palette } from 'lucide-react';
import { ChatlaxyLogo } from './ChatlaxyLogo';

interface HamburgerMenuDrawerProps {
  isOpen: boolean;
  hasUnreadNews: boolean;
  onClose: () => void;
  onOpenDailyRewards: () => void;
  onOpenAvatarFrames: () => void;
  onOpenProfileDecorations?: () => void;
  onOpenNews: () => void;
}

export const HamburgerMenuDrawer: React.FC<HamburgerMenuDrawerProps> = ({
  isOpen,
  hasUnreadNews,
  onClose,
  onOpenDailyRewards,
  onOpenAvatarFrames,
  onOpenProfileDecorations,
  onOpenNews,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex select-none animate-in fade-in duration-150">
      {/* Dark backdrop overlay - clicking closes the menu */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Slide-out drawer from the left */}
      <div
        className="relative z-10 w-72 sm:w-80 max-w-[85vw] h-full bg-[#141519] border-r border-[#24252f] shadow-2xl flex flex-col justify-between animate-in slide-in-from-left duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#23242e] bg-[#16171d]">
          {/* Logo only - no extra buttons */}
          <div className="flex items-center">
            <ChatlaxyLogo size="sm" />
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="p-1 text-neutral-400 hover:text-white rounded-xs transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body - Menu Items */}
        <div className="py-3 flex flex-col flex-1 px-2.5 gap-1 overflow-y-auto">
          {/* News Item */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenNews();
            }}
            className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-semibold text-neutral-200 hover:text-white hover:bg-[#1f2029] rounded-xs border border-transparent hover:border-white/5 transition-all cursor-pointer text-left"
          >
            <div className="flex items-center gap-3">
              <Newspaper className="w-4 h-4 text-sky-400 shrink-0" />
              <span>News</span>
            </div>
            {hasUnreadNews && (
              <span
                className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.9)]"
                title="New unread news"
              />
            )}
          </button>

          {/* Daily Rewards */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenDailyRewards();
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-semibold text-neutral-200 hover:text-white hover:bg-[#1f2029] rounded-xs border border-transparent hover:border-white/5 transition-all cursor-pointer text-left"
          >
            <Gift className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Daily Rewards</span>
          </button>

          {/* Avatar Frames */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenAvatarFrames();
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-semibold text-neutral-200 hover:text-white hover:bg-[#1f2029] rounded-xs border border-transparent hover:border-white/5 transition-all cursor-pointer text-left"
          >
            <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
            <span>Avatar Frames</span>
          </button>

          {/* Profile Decorations */}
          {onOpenProfileDecorations && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenProfileDecorations();
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-semibold text-neutral-200 hover:text-white hover:bg-[#1f2029] rounded-xs border border-transparent hover:border-white/5 transition-all cursor-pointer text-left"
            >
              <Palette className="w-4 h-4 text-pink-400 shrink-0" />
              <span>Profile Decoration</span>
            </button>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-[#23242e] bg-[#121317] text-[11px] text-neutral-500 font-mono flex items-center justify-between">
          <span className="font-semibold text-neutral-400">chatlaxy</span>
          <span>v1.0</span>
        </div>
      </div>
    </div>
  );
};
