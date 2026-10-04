import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, Check, Sparkles } from 'lucide-react';
import { ProfileData } from '../types/bio';
import { PROFILE_DECORATIONS_LIST, getDecorationConfig } from '../types/profileDecorations';
import { getRankConfig } from '../constants/ranks';
import { RankId } from '../types/ranks';
import { UserAvatar } from './UserAvatar';
import { getBorderConfig } from '../types/profileBorders';
import { ProfileEffectCanvas } from './ProfileEffectCanvas';

interface ProfileDecorationsModalProps {
  isOpen: boolean;
  currentUser: ProfileData;
  onClose: () => void;
  onSaveDecoration: (decorationId: string | null) => void;
}

export const ProfileDecorationsModal: React.FC<ProfileDecorationsModalProps> = ({
  isOpen,
  currentUser,
  onClose,
  onSaveDecoration,
}) => {
  const initialDecorationId = currentUser.profileDecoration || 'none';
  const [selectedDecorationId, setSelectedDecorationId] = useState<string>(initialDecorationId);
  const [previewKey, setPreviewKey] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setSelectedDecorationId(currentUser.profileDecoration || 'none');
      setPreviewKey((prev) => prev + 1);
    }
  }, [isOpen, currentUser.profileDecoration]);

  if (!isOpen) return null;

  const currentDecorationConfig = getDecorationConfig(selectedDecorationId);

  const handleSelect = (id: string) => {
    setSelectedDecorationId(id);
    setPreviewKey((prev) => prev + 1);
  };

  const handleSave = () => {
    const finalVal = selectedDecorationId === 'none' ? null : selectedDecorationId;
    onSaveDecoration(finalVal);
    onClose();
  };

  // Rank info for the preview
  const effectiveRank: RankId =
    currentUser.rank || (currentUser.username.toLowerCase() === 'null' ? 'DEV' : 'VIP');
  const rankConfig = getRankConfig(effectiveRank);
  const activeBorderConfig = getBorderConfig(currentUser.profileBorder);
  const plainBioText = currentUser.bioSegments?.map((s) => s.text).join('\n') || '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150 select-none">
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
            <span>Back to Profile</span>
          </button>

          <span className="text-sm font-bold text-neutral-100 uppercase tracking-wide flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>Profile Decoration</span>
          </span>

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
          {/* LIVE PROFILE CARD PREVIEW */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                Live Preview
              </span>
              {currentDecorationConfig.id !== 'none' && (
                <button
                  type="button"
                  onClick={() => setPreviewKey((k) => k + 1)}
                  className="text-[10px] text-purple-400 hover:text-purple-300 transition-colors font-medium cursor-pointer"
                >
                  Replay Overlay
                </button>
              )}
            </div>

            <div
              className={`relative w-full bg-[#141519] rounded-xs shadow-xl overflow-hidden flex flex-col border border-[#262833] ${activeBorderConfig.cardClasses}`}
            >
              {/* Profile decoration animated overlay across the whole entire card */}
              {currentDecorationConfig.assetUrl && (
                <div
                  key={previewKey}
                  className="absolute inset-0 z-40 pointer-events-none overflow-hidden flex items-center justify-center animate-in fade-in duration-300"
                >
                  <img
                    src={currentDecorationConfig.assetUrl}
                    alt={currentDecorationConfig.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover sm:object-fill pointer-events-none"
                  />
                </div>
              )}

              {/* Banner Area */}
              <div className="h-24 sm:h-28 w-full bg-[#1b1c23] relative z-0 overflow-hidden border-b border-[#25262f] shrink-0">
                {currentUser.banner ? (
                  <img
                    src={currentUser.banner}
                    alt="Banner"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-[#1c1e26] flex items-center justify-center">
                    <span className="text-neutral-600 text-[10px] font-mono uppercase tracking-widest">
                      chatlaxy
                    </span>
                  </div>
                )}
              </div>

              {/* Profile Effect Canvas in preview if user has one */}
              {currentUser.profileEffect && (
                <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
                  <ProfileEffectCanvas effectId={currentUser.profileEffect} />
                </div>
              )}

              {/* Profile Details Header */}
              <div className="p-3 relative z-20 flex flex-col gap-2">
                <div className="flex items-end justify-between -mt-10 sm:-mt-12">
                  {/* Avatar */}
                  <div className="relative">
                    <UserAvatar
                      src={currentUser.profilePicture}
                      username={currentUser.username}
                      frameId={currentUser.avatarFrame || currentUser.effects?.pfpBorder}
                      size="lg"
                      shape="circle"
                      className="border-2 border-[#141519] shadow-lg"
                    />
                  </div>

                  {/* Rank Badge */}
                  {rankConfig && (
                    <div className="flex items-center gap-1 bg-[#181920]/80 px-2 py-0.5 rounded-xs border border-white/10">
                      <img
                        src={rankConfig.iconUrl}
                        alt={currentUser.customRankName || rankConfig.name}
                        referrerPolicy="no-referrer"
                        className="w-3.5 h-3.5 object-contain"
                      />
                      <span className="text-[10px] font-bold text-white">
                        {currentUser.customRankName || rankConfig.name}
                      </span>
                    </div>
                  )}
                </div>

                {/* Name & Mood */}
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-neutral-100">
                    {currentUser.username}
                  </span>
                  {currentUser.mood && (
                    <span className="text-[11px] text-neutral-300 italic font-medium truncate">
                      {currentUser.mood}
                    </span>
                  )}
                </div>

                {/* Snippet Bio */}
                {plainBioText && (
                  <p className="text-[11px] text-neutral-300 line-clamp-2 leading-relaxed bg-[#101115]/60 p-1.5 rounded-xs border border-white/5">
                    {plainBioText}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* DECORATION SELECTION LIST */}
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
              Select Decoration
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PROFILE_DECORATIONS_LIST.map((deco) => {
                const isSelected = selectedDecorationId === deco.id;
                return (
                  <button
                    key={deco.id}
                    type="button"
                    onClick={() => handleSelect(deco.id)}
                    className={`flex items-center gap-3 p-2.5 rounded-xs border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-purple-950/40 border-purple-500 shadow-sm shadow-purple-900/30'
                        : 'bg-[#181920] border-[#272932] hover:bg-[#1e2029] hover:border-neutral-600'
                    }`}
                  >
                    {/* Thumbnail / Icon */}
                    <div className="w-12 h-12 rounded-xs bg-[#101115] border border-white/10 shrink-0 overflow-hidden flex items-center justify-center relative">
                      {deco.assetUrl ? (
                        <img
                          src={deco.assetUrl}
                          alt={deco.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xs text-neutral-500 font-mono">None</span>
                      )}
                    </div>

                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-semibold truncate ${
                            isSelected ? 'text-purple-200 font-bold' : 'text-neutral-200'
                          }`}
                        >
                          {deco.name}
                        </span>
                        {isSelected && (
                          <Check className="w-4 h-4 text-purple-400 shrink-0 ml-1" />
                        )}
                      </div>
                      <span className="text-[10px] text-neutral-400 line-clamp-1 mt-0.5">
                        {deco.description}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ================================================== */}
        {/* MODAL FOOTER: SAVE BUTTON                          */}
        {/* ================================================== */}
        <div className="px-4 py-3 border-t border-[#25262f] bg-[#16171d] flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-xs flex items-center gap-1.5 shadow-md shadow-purple-950/50 transition-all cursor-pointer active:scale-95"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Save Decoration</span>
          </button>
        </div>
      </div>
    </div>
  );
};
