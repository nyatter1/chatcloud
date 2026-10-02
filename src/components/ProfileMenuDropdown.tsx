import React, { useState, useRef, useEffect } from 'react';
import {
  Image as ImageIcon,
  Award,
  Wallet,
  LogOut,
  ChevronRight,
  ChevronLeft,
  User,
  Shield,
} from 'lucide-react';
import { ProfileData } from '../types/bio';
import { RubyIcon, GoldIcon } from './CurrencyIcons';
import { isFounderOrAbove } from '../utils/permissions';

interface ProfileMenuDropdownProps {
  profile: ProfileData;
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  onOpenProfile?: () => void;
  onOpenChatBackground: () => void;
  onOpenAdminPanel?: () => void;
}

export const ProfileMenuDropdown: React.FC<ProfileMenuDropdownProps> = ({
  profile,
  isOpen,
  onClose,
  onLogout,
  onOpenProfile,
  onOpenChatBackground,
  onOpenAdminPanel,
}) => {
  const [activeView, setActiveView] = useState<'main' | 'wallet'>('main');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Reset to main view whenever opened
  useEffect(() => {
    if (isOpen) {
      setActiveView('main');
    }
  }, [isOpen]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      try {
        if (
          dropdownRef.current &&
          eventTargetIsOutside(dropdownRef.current, e.target)
        ) {
          onClose();
        }
      } catch {
        // Safe fallback
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const rubyBalance = profile.wallet?.ruby ?? 5;
  const goldBalance = profile.wallet?.gold ?? 1000;

  return (
    <div
      ref={dropdownRef}
      className="absolute right-4 sm:right-6 top-16 z-50 w-72 bg-[#18191d] border border-[#2c2e37] rounded-sm shadow-2xl shadow-black/80 py-2 text-left animate-in fade-in zoom-in-95 duration-100"
    >
      {/* ================================================== */}
      {/* 1. WALLET SUBMENU VIEW                             */}
      {/* ================================================== */}
      {activeView === 'wallet' ? (
        <div className="flex flex-col animate-in fade-in duration-100">
          {/* Header with back arrow */}
          <div className="px-3 py-2.5 border-b border-[#25262f] flex items-center">
            <button
              type="button"
              onClick={() => setActiveView('main')}
              className="flex items-center gap-1.5 text-neutral-300 hover:text-white transition-colors cursor-pointer text-xs font-semibold"
            >
              <ChevronLeft className="w-4 h-4 text-neutral-400" />
              <span>Wallet</span>
            </button>
          </div>

          {/* Wallet Balances: Ruby & Gold */}
          <div className="px-5 py-4 flex flex-col gap-4 text-left">
            {/* Ruby */}
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-neutral-300">
                Ruby
              </span>
              <div className="flex items-center gap-2.5 pt-0.5">
                <RubyIcon className="w-5 h-5" />
                <span className="text-sm font-bold text-neutral-100 font-mono">
                  {rubyBalance.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Gold */}
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-neutral-300">
                Gold
              </span>
              <div className="flex items-center gap-2.5 pt-0.5">
                <GoldIcon className="w-5 h-5" />
                <span className="text-sm font-bold text-neutral-100 font-mono">
                  {goldBalance.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ================================================== */
        /* 2. MAIN PROFILE MENU VIEW                          */
        /* ================================================== */
        <>
          {/* Current user's profile header (Click to open full profile) */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenProfile?.();
            }}
            className="w-full px-4 py-3 border-b border-[#25262f] flex items-center gap-3 hover:bg-[#202128] transition-colors text-left cursor-pointer"
          >
            <div className="w-11 h-11 rounded-sm overflow-hidden bg-[#242630] border border-[#373946] shrink-0 flex items-center justify-center">
              {profile.profilePicture ? (
                <img
                  src={profile.profilePicture}
                  alt={profile.username}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-6 h-6 text-neutral-400" />
              )}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-sm font-semibold text-neutral-100 truncate">
                {profile.username}
              </span>
              <span className="text-xs text-neutral-400 font-mono truncate">
                @{profile.username.toLowerCase().replace(/\s+/g, '')}
              </span>
              {profile.mood && (
                <span className="text-[11px] text-neutral-400 truncate mt-0.5 italic font-bold">
                  &ldquo;{profile.mood}&rdquo;
                </span>
              )}
            </div>
          </button>

          {/* Menu items section */}
          <div className="py-1">
            {/* Chat background - FUNCTIONAL: opens modal */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenChatBackground();
              }}
              className="w-full flex items-center justify-between px-4 py-2.5 text-xs text-neutral-300 hover:bg-[#202128] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <ImageIcon className="w-4 h-4 text-neutral-400" />
                <span className="font-medium">Chat background</span>
              </div>
            </button>

            {/* Level info - UI ONLY */}
            <button
              type="button"
              onClick={(e) => e.preventDefault()}
              className="w-full flex items-center justify-between px-4 py-2.5 text-xs text-neutral-300 hover:bg-[#202128] transition-colors cursor-default"
              title="Level info"
            >
              <div className="flex items-center gap-3">
                <Award className="w-4 h-4 text-neutral-400" />
                <span className="font-medium">Level info</span>
              </div>
            </button>

            {/* Wallet - FUNCTIONAL: opens wallet submenu */}
            <button
              type="button"
              onClick={() => setActiveView('wallet')}
              className="w-full flex items-center justify-between px-4 py-2.5 text-xs text-neutral-300 hover:bg-[#202128] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Wallet className="w-4 h-4 text-neutral-400" />
                <span className="font-medium">Wallet</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-neutral-500" />
            </button>

            {/* Admin Panel - Simple icon, no fancy colors */}
            {isFounderOrAbove(profile) && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAdminPanel?.();
                }}
                className="w-full flex items-center justify-between px-4 py-2.5 text-xs text-neutral-300 hover:bg-[#202128] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Shield className="w-4 h-4 text-neutral-400" />
                  <span className="font-medium">Admin panel</span>
                </div>
              </button>
            )}
          </div>

          <div className="my-1 border-t border-[#25262f]" />

          {/* Logout - FUNCTIONAL */}
          <div className="px-1 py-1">
            <button
              type="button"
              onClick={() => {
                onClose();
                onLogout();
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-neutral-300 hover:text-red-300 hover:bg-[#291e22] rounded-xs transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-neutral-400 group-hover:text-red-400" />
              <span>Logout</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};

function eventTargetIsOutside(container: HTMLElement, target: EventTarget | null): boolean {
  if (!target || !(target instanceof Node)) return false;
  return !container.contains(target);
}
