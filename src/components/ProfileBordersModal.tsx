import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, Check, User } from 'lucide-react';
import { ProfileData } from '../types/bio';
import { PROFILE_BORDERS_LIST, getBorderConfig } from '../types/profileBorders';
import { ProfileEffectCanvas } from './ProfileEffectCanvas';
import { getRankConfig } from '../constants/ranks';
import { RankId } from '../types/ranks';
import { UserAvatar } from './UserAvatar';

interface ProfileBordersModalProps {
  isOpen: boolean;
  currentUser: ProfileData;
  onClose: () => void;
  onSaveBorder: (borderId: string | null) => void;
}

export const ProfileBordersModal: React.FC<ProfileBordersModalProps> = ({
  isOpen,
  currentUser,
  onClose,
  onSaveBorder,
}) => {
  const initialBorderId = currentUser.profileBorder || 'none';
  const [selectedBorderId, setSelectedBorderId] = useState<string>(initialBorderId);

  useEffect(() => {
    if (isOpen) {
      setSelectedBorderId(currentUser.profileBorder || 'none');
    }
  }, [isOpen, currentUser.profileBorder]);

  if (!isOpen) return null;

  const currentBorderConfig = getBorderConfig(selectedBorderId);

  const handleSave = () => {
    const finalVal = selectedBorderId === 'none' ? null : selectedBorderId;
    onSaveBorder(finalVal);
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
          {/* Back to Preview Button */}
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1 text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Preview</span>
          </button>

          {/* Title - NO price/currency requirement because borders are FREE */}
          <h2 className="text-sm font-bold text-neutral-100 uppercase tracking-wide">
            Profile Borders
          </h2>

          {/* Close button */}
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
          {/* LIVE PROFILE CARD PREVIEW WITH SELECTED BORDER     */}
          {/* ================================================== */}
          <div
            className={`w-full bg-[#141519] rounded-xs overflow-hidden transition-all duration-200 flex flex-col relative ${currentBorderConfig.cardClasses}`}
          >
            {/* Banner Section - strictly behind avatar */}
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
            <div className="px-4 pt-0 pb-4 relative z-10 flex flex-col flex-1 min-h-[185px]">
              {/* Profile Effect Canvas (plays live underneath/inside the profile) */}
              {currentUser.profileEffect && currentUser.profileEffect !== 'none' && (
                <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden rounded-b-xs">
                  <ProfileEffectCanvas effectId={currentUser.profileEffect} />
                  {/* Subtle dark overlay for 100% text readability */}
                  <div className="absolute inset-0 bg-[#141519]/70 pointer-events-none" />
                </div>
              )}

              {/* Avatar and Mood - sits proudly on top of banner */}
              <div className="relative z-20 -mt-8 mb-2 flex items-end justify-between">
                <UserAvatar
                  src={currentUser.profilePicture}
                  username={currentUser.username}
                  frameId={currentUser.avatarFrame || currentUser.effects?.pfpBorder}
                  size="lg"
                  shape="square"
                />

                {currentUser.mood && (
                  <div className="mb-0.5 text-right max-w-[170px] truncate">
                    <span className="text-[11px] text-neutral-300 font-bold italic truncate">
                      &ldquo;{currentUser.mood}&rdquo;
                    </span>
                  </div>
                )}
              </div>

              {/* User Name & Handle */}
              <div className="flex flex-col mb-2">
                {rankConfig && (
                  <div className="flex items-center gap-1 mb-0.5">
                    <img
                      src={rankConfig.iconUrl}
                      alt={rankConfig.name}
                      referrerPolicy="no-referrer"
                      className="w-3.5 h-3.5 object-contain shrink-0"
                    />
                    <span className="text-[11px] font-bold text-white tracking-wide">
                      {currentUser.customRankName?.trim() || rankConfig.name}
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

              {/* Info summary */}
              <div className="flex flex-col text-xs text-neutral-200 divide-y divide-[#20222a]/70 bg-[#16171e]/60 rounded-xs px-2.5 py-0.5 border border-[#272934]/60">
                <div className="flex items-center justify-between py-1 text-[11px]">
                  <span className="text-neutral-400">Age</span>
                  <span className="text-neutral-200 font-mono">{currentUser.age || '—'}</span>
                </div>
                <div className="flex items-center justify-between py-1 text-[11px]">
                  <span className="text-neutral-400">Gender</span>
                  <span className="text-neutral-200">{currentUser.gender || '—'}</span>
                </div>
                {plainBioText && (
                  <div className="py-1 text-[11px] text-neutral-300 line-clamp-2 italic">
                    {plainBioText}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ================================================== */}
          {/* BORDER SELECTION GRID (5 BORDERS PER ROW)          */}
          {/* ================================================== */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between px-1 text-xs">
              <span className="text-neutral-300 font-semibold tracking-wide">
                Select Profile Border
              </span>
              <span className="text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                100% Free
              </span>
            </div>

            {/* Scrollable 5-column grid */}
            <div className="grid grid-cols-5 gap-2 max-h-56 overflow-y-auto p-1 bg-[#101115] border border-[#23242e] rounded-xs select-none">
              {PROFILE_BORDERS_LIST.map((border) => {
                const isSelected = selectedBorderId === border.id;
                return (
                  <button
                    key={border.id}
                    type="button"
                    onClick={() => setSelectedBorderId(border.id)}
                    title={`${border.name}: ${border.description}`}
                    className={`flex flex-col items-center p-1.5 rounded-xs transition-all cursor-pointer relative group ${
                      isSelected
                        ? 'bg-[#232632] ring-2 ring-purple-400'
                        : 'bg-[#181920] hover:bg-[#1f2029] border border-white/5'
                    }`}
                  >
                    {/* Miniature Border Thumbnail */}
                    <div
                      className={`w-full h-10 rounded-xs flex items-center justify-center relative overflow-hidden transition-transform group-hover:scale-105 ${border.previewThumbnailClasses}`}
                    >
                      {border.id === 'none' ? (
                        <span className="text-[9px] text-neutral-500 font-mono">None</span>
                      ) : (
                        <div className="w-4 h-4 rounded-xs border border-white/20 bg-white/5" />
                      )}

                      {isSelected && (
                        <div className="absolute inset-0 bg-purple-500/20 flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 text-white drop-shadow-md" />
                        </div>
                      )}
                    </div>

                    {/* Border Name */}
                    <span
                      className={`text-[10px] mt-1 truncate max-w-full text-center leading-tight font-medium ${
                        isSelected ? 'text-white font-bold' : 'text-neutral-400'
                      }`}
                    >
                      {border.name}
                    </span>
                  </button>
                );
              })}
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
