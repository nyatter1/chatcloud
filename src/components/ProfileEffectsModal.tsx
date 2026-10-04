import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Check, User } from 'lucide-react';
import { ProfileData } from '../types/bio';
import { PROFILE_EFFECTS_LIST, ProfileEffectId } from '../types/profileEffects';
import { ProfileEffectCanvas } from './ProfileEffectCanvas';
import { getRankConfig } from '../constants/ranks';
import { RankId } from '../types/ranks';

interface ProfileEffectsModalProps {
  isOpen: boolean;
  currentUser: ProfileData;
  onClose: () => void;
  onSaveEffect: (effectId: string | null) => void;
}

export const ProfileEffectsModal: React.FC<ProfileEffectsModalProps> = ({
  isOpen,
  currentUser,
  onClose,
  onSaveEffect,
}) => {
  const initialEffectId = (currentUser.profileEffect as ProfileEffectId) || 'none';
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Sync index when opening
  useEffect(() => {
    if (isOpen) {
      const idx = PROFILE_EFFECTS_LIST.findIndex(
        (e) => e.id === (currentUser.profileEffect || 'none')
      );
      setSelectedIndex(idx >= 0 ? idx : 0);
    }
  }, [isOpen, currentUser.profileEffect]);

  if (!isOpen) return null;

  const currentEffect = PROFILE_EFFECTS_LIST[selectedIndex] || PROFILE_EFFECTS_LIST[0];

  const handlePrev = () => {
    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : PROFILE_EFFECTS_LIST.length - 1));
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev < PROFILE_EFFECTS_LIST.length - 1 ? prev + 1 : 0));
  };

  const handleSave = () => {
    const finalVal = currentEffect.id === 'none' ? null : currentEffect.id;
    onSaveEffect(finalVal);
    onClose();
  };

  // Rank info for the preview
  const effectiveRank: RankId =
    currentUser.rank || (currentUser.username.toLowerCase() === 'null' ? 'DEV' : 'VIP');
  const rankConfig = getRankConfig(effectiveRank);

  const plainBioText = currentUser.bioSegments?.map((s) => s.text).join('\n') || '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      {/* Click backdrop to close */}
      <div className="absolute inset-0" onClick={onClose} />

      <div
        className="relative z-10 w-full max-w-sm sm:max-w-md bg-[#141519] border border-[#2c2d38] rounded-xs shadow-2xl shadow-black overflow-hidden flex flex-col text-left select-none animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ================================================== */}
        {/* MODAL HEADER                                       */}
        {/* ================================================== */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#25262f] bg-[#16171d]">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold text-neutral-100 uppercase tracking-wide flex items-center gap-1.5">
              <span>✎</span>
              <span>Profile Effects</span>
            </span>
          </div>

          {/* Close button - NO price on top right because effects are FREE */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1 text-neutral-400 hover:text-white rounded-xs transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ================================================== */}
        {/* MODAL BODY                                         */}
        {/* ================================================== */}
        <div className="p-4 flex flex-col gap-3.5 max-h-[85vh] overflow-y-auto">
          {/* ================================================== */}
          {/* LARGE LIVE PROFILE CARD PREVIEW                    */}
          {/* ================================================== */}
          <div className="w-full bg-[#141519] border border-[#2c2d38] rounded-xs overflow-hidden shadow-lg flex flex-col relative">
            {/* Banner Section */}
            <div className="h-20 sm:h-24 w-full bg-[#1b1c23] relative z-0 overflow-hidden border-b border-[#25262f] shrink-0">
              {currentUser.banner ? (
                <img
                  src={currentUser.banner}
                  alt="Profile banner"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-[#1c1e26] flex items-center justify-center">
                  <span className="text-neutral-600 text-xs font-mono uppercase tracking-widest select-none">
                    chatlaxy
                  </span>
                </div>
              )}
            </div>

            {/* Profile Information Area with Profile Effect Living Behind */}
            <div className="px-4 pt-0 pb-4 relative z-10 flex flex-col flex-1 min-h-[190px]">
              {/* Profile Effect Canvas (behind content, clipped strictly inside card) */}
              {currentEffect.id !== 'none' && (
                <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden rounded-b-xs">
                  <ProfileEffectCanvas effectId={currentEffect.id} />
                  {/* Subtle dark overlay for 100% text readability */}
                  <div className="absolute inset-0 bg-[#141519]/70 pointer-events-none" />
                </div>
              )}

              {/* Avatar and Mood - sits proudly on top of banner */}
              <div className="relative z-20 -mt-8 mb-2 flex items-end justify-between">
                  <div className="w-16 h-16 rounded-xs border-2 border-[#141519] bg-[#22242c] overflow-hidden flex items-center justify-center shadow-lg ring-1 ring-[#3a3b48] shrink-0">
                    {currentUser.profilePicture ? (
                      <img
                        src={currentUser.profilePicture}
                        alt={currentUser.username}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-8 h-8 text-neutral-400" />
                    )}
                  </div>

                  {currentUser.mood && (
                    <div className="mb-0.5 text-right max-w-[170px] truncate">
                      <span className="text-[11px] text-neutral-300 font-bold italic truncate">
                        &ldquo;{currentUser.mood}&rdquo;
                      </span>
                    </div>
                  )}
                </div>

                {/* User Name & Handle */}
                <div className="flex flex-col mb-2.5">
                  {rankConfig && (
                    <div className="flex items-center gap-1 mb-0.5">
                      <img
                        src={rankConfig.iconUrl}
                        alt={rankConfig.name}
                        referrerPolicy="no-referrer"
                        className="w-3.5 h-3.5 object-contain shrink-0"
                      />
                      <span className="text-[11px] font-bold text-white tracking-wide">
                        {rankConfig.name}
                      </span>
                    </div>
                  )}

                  <h3 className="text-sm font-bold text-neutral-100 tracking-tight leading-none">
                    {currentUser.username}
                  </h3>
                  <span className="text-[11px] text-neutral-500 font-mono mt-0.5">
                    @{currentUser.username.toLowerCase().replace(/\s+/g, '')}
                  </span>
                </div>

                {/* Info preview summary */}
                <div className="flex flex-col text-xs text-neutral-200 divide-y divide-[#20222a]/70 bg-[#16171e]/60 rounded-xs px-2.5 py-0.5 border border-[#272934]/60">
                  <div className="flex items-center justify-between py-1.5 text-[11px]">
                    <span className="text-neutral-400">Age</span>
                    <span className="text-neutral-200 font-mono">{currentUser.age || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 text-[11px]">
                    <span className="text-neutral-400">Gender</span>
                    <span className="text-neutral-200">{currentUser.gender || '—'}</span>
                  </div>
                  {plainBioText && (
                    <div className="py-1.5 text-[11px] text-neutral-300 line-clamp-2 italic">
                      {plainBioText}
                    </div>
                  )}
                </div>
              </div>
            </div>

          {/* ================================================== */}
          {/* CAROUSEL SELECTOR: [ ← ] Effect Name [ → ]         */}
          {/* ================================================== */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-3 px-3 py-2.5 bg-[#17181f] border border-[#2b2d39] rounded-xs select-none">
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous effect"
                className="p-1.5 bg-[#20222c] hover:bg-[#2b2e3c] text-neutral-200 hover:text-white rounded-xs border border-[#37394a] transition-colors cursor-pointer shrink-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex flex-col items-center justify-center flex-1 text-center min-w-0">
                <span className="text-sm font-bold text-neutral-100 tracking-wide truncate">
                  {currentEffect.name}
                </span>
                <span className="text-[11px] text-neutral-400 truncate max-w-[200px]">
                  {currentEffect.description}
                </span>
              </div>

              <button
                type="button"
                onClick={handleNext}
                aria-label="Next effect"
                className="p-1.5 bg-[#20222c] hover:bg-[#2b2e3c] text-neutral-200 hover:text-white rounded-xs border border-[#37394a] transition-colors cursor-pointer shrink-0"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px] text-neutral-500 px-1">
              <span>{selectedIndex + 1} of {PROFILE_EFFECTS_LIST.length}</span>
              <span className="text-emerald-400 font-semibold uppercase tracking-wider text-[10px]">
                Free
              </span>
            </div>
          </div>

          {/* ================================================== */}
          {/* MODAL ACTIONS                                      */}
          {/* ================================================== */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#25262f]">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 bg-[#1e2027] hover:bg-[#282a34] text-neutral-300 rounded-xs text-xs font-medium cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-1.5 bg-zinc-200 hover:bg-white text-zinc-950 font-semibold rounded-xs text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
