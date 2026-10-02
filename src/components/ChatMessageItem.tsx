import React, { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, CornerUpLeft, EyeOff, Trash2 } from 'lucide-react';
import { ChatMessage } from '../types/chat';
import { RubyIcon, GoldIcon } from './CurrencyIcons';
import { AvatarWithBorder } from './AvatarWithBorder';

interface ChatMessageItemProps {
  message: ChatMessage;
  isCurrentUser: boolean;
  isAlternateBg: boolean;
  canModerate?: boolean;
  senderBorder?: string | null;
  onReply: (message: ChatMessage) => void;
  onHide: (id: string) => void;
  onDelete: (id: string) => void;
  onOpenProfile?: (username: string) => void;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
  message,
  isCurrentUser,
  isAlternateBg,
  canModerate,
  senderBorder,
  onReply,
  onHide,
  onDelete,
  onOpenProfile,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  // Alternating colors: semi-transparent so chat background shows through clearly
  const bgClass = isAlternateBg
    ? 'bg-[#101115]/50 border-b border-[#252631]/40'
    : 'bg-[#16171d]/50 border-b border-[#2a2c38]/40';

  const handleProfileClick = () => {
    if (onOpenProfile) {
      if (message.isSystemBot) {
        onOpenProfile('system');
      } else {
        onOpenProfile(message.senderName);
      }
    }
  };

  return (
    <div
      className={`group relative w-full px-4 sm:px-6 py-3 sm:py-3.5 transition-colors duration-100 ${bgClass} hover:brightness-125 backdrop-blur-[1px]`}
    >
      <div className="flex items-start gap-3 w-full">
        {/* Avatar with Border - Clickable to open Profile */}
        <button
          type="button"
          onClick={handleProfileClick}
          title={`View ${message.senderName}'s profile`}
          className="shrink-0 cursor-pointer focus:outline-none"
        >
          <AvatarWithBorder
            src={message.senderAvatar}
            borderId={senderBorder}
            alt={message.senderName}
            size="md"
            isSystemBot={message.isSystemBot}
            shape="circle"
          />
        </button>

        {/* Message Body */}
        <div className="flex-1 min-w-0 pr-8">
          {/* Header: Name, Timestamp */}
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <button
              type="button"
              onClick={handleProfileClick}
              className={`text-xs sm:text-sm font-semibold truncate hover:underline cursor-pointer text-left focus:outline-none ${
                message.isSystemBot ? 'text-purple-300' : 'text-neutral-100'
              }`}
            >
              {message.senderName}
            </button>

            {/* Timestamp */}
            <span className="text-[11px] text-neutral-500 font-mono">
              {message.formattedTime}
            </span>
          </div>

          {/* Centered Gambling UI if gamblePayload is present */}
          {message.gamblePayload ? (
            <div className="w-full flex justify-center my-2">
              <div className="relative w-full max-w-md bg-[#161720]/90 border border-[#2b2d3c] rounded-md p-4 shadow-xl text-center flex flex-col items-center gap-2.5">
                {/* Header title */}
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                  {message.gamblePayload.command === 'dice' ? '🎲 Dice Roll' : '🎰 All-In Gamble'}
                </span>

                {/* Outcome Badge */}
                <div
                  className={`px-3 py-1 rounded-sm text-xs font-bold tracking-wide ${
                    message.gamblePayload.won
                      ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-700/60'
                      : 'bg-red-950/80 text-red-400 border border-red-700/60'
                  }`}
                >
                  {message.gamblePayload.won ? 'VICTORY' : 'DEFEAT'}
                </div>

                {/* Roll Details / Multiplier */}
                <div className="flex items-center justify-center gap-3 text-xs text-neutral-300">
                  {message.gamblePayload.rollNumber !== undefined && (
                    <span className="bg-[#20222e] px-2.5 py-1 rounded font-mono text-neutral-200">
                      Roll: {message.gamblePayload.rollNumber}
                    </span>
                  )}
                  {message.gamblePayload.multiplier && (
                    <span className="bg-[#20222e] px-2.5 py-1 rounded font-mono text-purple-300">
                      {message.gamblePayload.multiplier}x
                    </span>
                  )}
                </div>

                {/* Currency Profit / Loss Summary */}
                <div className="flex items-center justify-center gap-2 mt-1 font-semibold text-xs sm:text-sm">
                  <span className="text-neutral-400">Outcome:</span>
                  <span
                    className={`flex items-center gap-1 font-bold ${
                      message.gamblePayload.won ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {message.gamblePayload.won ? '+' : '-'}
                    {(message.gamblePayload.won
                      ? message.gamblePayload.payoutAmount
                      : message.gamblePayload.betAmount
                    ).toLocaleString()}
                    {message.gamblePayload.currency === 'ruby' ? (
                      <RubyIcon className="w-3.5 h-3.5 inline" />
                    ) : (
                      <GoldIcon className="w-3.5 h-3.5 inline" />
                    )}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* Standard text message content */
            <p className="text-xs sm:text-sm text-neutral-200 leading-relaxed break-words whitespace-pre-wrap select-text">
              {message.content}
            </p>
          )}
        </div>
      </div>

      {/* Hover Action Menu Button */}
      <div className="absolute top-2.5 right-4 flex items-center gap-1 z-10">
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Message options"
            className="p-1 rounded-sm text-neutral-400 hover:text-neutral-100 hover:bg-[#252733] transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {/* Action dropdown menu */}
          {menuOpen && (
            <div className="absolute right-0 top-7 w-36 bg-[#181921] border border-[#2b2d39] rounded-md shadow-2xl shadow-black/80 py-1 z-50 text-left animate-in fade-in zoom-in-95 duration-100">
              {/* Reply */}
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onReply(message);
                }}
                className="w-full px-3 py-2 text-xs text-neutral-300 hover:text-white hover:bg-[#232532] flex items-center gap-2 transition-colors cursor-pointer"
              >
                <CornerUpLeft className="w-3.5 h-3.5 text-neutral-400" />
                <span>Reply</span>
              </button>

              {/* Hide Message (Local) */}
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onHide(message.id);
                }}
                className="w-full px-3 py-2 text-xs text-neutral-300 hover:text-white hover:bg-[#232532] flex items-center gap-2 transition-colors cursor-pointer"
              >
                <EyeOff className="w-3.5 h-3.5 text-neutral-400" />
                <span>Hide Message</span>
              </button>

              {/* Delete Message (If author or Moderator/Dev) */}
              {(isCurrentUser || canModerate) && (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete(message.id);
                  }}
                  className="w-full px-3 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/40 flex items-center gap-2 transition-colors border-t border-[#262834] mt-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  <span>Delete</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
