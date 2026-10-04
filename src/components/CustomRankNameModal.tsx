import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { getRankConfig } from '../constants/ranks';
import { RankId } from '../types/ranks';

interface CustomRankNameModalProps {
  isOpen: boolean;
  currentCustomRankName?: string | null;
  userRank: RankId;
  onClose: () => void;
  onSave: (customName: string | null) => void;
}

export const CustomRankNameModal: React.FC<CustomRankNameModalProps> = ({
  isOpen,
  currentCustomRankName = '',
  userRank,
  onClose,
  onSave,
}) => {
  const [rankName, setRankName] = useState<string>(currentCustomRankName || '');
  const rankConfig = getRankConfig(userRank);
  const defaultRankName = rankConfig?.name || userRank;

  if (!isOpen) return null;

  const handleSave = () => {
    const trimmed = rankName.trim();
    onSave(trimmed ? trimmed.slice(0, 20) : null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150 select-none">
      {/* Click backdrop to close */}
      <div className="absolute inset-0" onClick={onClose} />

      <div
        className="relative z-10 w-full max-w-sm bg-[#15161c] border border-[#2b2d39] rounded-xs shadow-2xl shadow-black overflow-hidden flex flex-col text-left animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#24252f] bg-[#181921]">
          <h2 className="text-sm font-bold text-neutral-100 uppercase tracking-wide">
            Custom rank name
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1 text-neutral-400 hover:text-white rounded-xs transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-neutral-300">
              Enter your custom rank name
            </label>
            <input
              type="text"
              value={rankName}
              onChange={(e) => setRankName(e.target.value.slice(0, 20))}
              placeholder={defaultRankName}
              maxLength={20}
              className="w-full px-3 py-2 bg-[#101115] border border-[#282a36] focus:border-purple-400 text-sm text-neutral-100 placeholder:text-neutral-600 rounded-xs outline-none transition-colors"
              autoFocus
            />
            <div className="flex items-center justify-between text-[11px] text-neutral-500 font-mono">
              <span>{rankName.length} / 20 characters</span>
              <span>Leave blank for default</span>
            </div>
          </div>

          {/* Live Preview badge */}
          <div className="p-2.5 bg-[#101116] border border-[#23242e] rounded-xs flex flex-col gap-1">
            <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">
              Profile Display Preview
            </span>
            <div className="flex items-center gap-1.5 py-1">
              {rankConfig && (
                <img
                  src={rankConfig.iconUrl}
                  alt={rankConfig.name}
                  referrerPolicy="no-referrer"
                  className="w-4 h-4 object-contain shrink-0"
                />
              )}
              <span className="text-xs font-bold text-white tracking-wide">
                {rankName.trim() || defaultRankName}
              </span>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-[#24252f] bg-[#16171d]">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 bg-[#1f2027] hover:bg-[#292b35] text-neutral-300 rounded-xs text-xs font-medium cursor-pointer transition-colors"
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
  );
};
