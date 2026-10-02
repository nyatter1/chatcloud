import React, { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, CornerUpLeft, EyeOff, Trash2, User, Bot } from 'lucide-react';
import { ChatMessage } from '../types/chat';
import { RubyIcon, GoldIcon } from './CurrencyIcons';

interface ChatMessageItemProps {
  message: ChatMessage;
  isCurrentUser: boolean;
  isAlternateBg: boolean;
  canModerate?: boolean;
  onReply: (message: ChatMessage) => void;
  onHide: (id: string) => void;
  onDelete: (id: string) => void;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
  message,
  isCurrentUser,
  isAlternateBg,
  canModerate,
  onReply,
  onHide,
  onDelete,
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

  return (
    <div
      className={`group relative w-full px-4 sm:px-6 py-3 sm:py-3.5 transition-colors duration-100 ${bgClass} hover:brightness-125 backdrop-blur-[1px]`}
    >
      <div className="flex items-start gap-3 w-full">
        {/* Avatar */}
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-sm overflow-hidden bg-[#242630] border border-[#343644] shrink-0 flex items-center justify-center">
          {message.senderAvatar ? (
            <img
              src={message.senderAvatar}
              alt={message.senderName}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          ) : message.isSystemBot ? (
            <Bot className="w-5 h-5 text-purple-400" />
          ) : (
            <User className="w-5 h-5 text-neutral-400" />
          )}
        </div>

        {/* Message Body */}
        <div className="flex-1 min-w-0 pr-8">
          {/* Header: Name, Timestamp */}
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span
              className={`text-xs sm:text-sm font-semibold truncate ${
                message.isSystemBot ? 'text-purple-300' : 'text-neutral-100'
              }`}
            >
              {message.senderName}
            </span>

            {/* Timestamp */}
            <span className="text-[11px] text-neutral-500 font-mono">
              {message.formattedTime}
            </span>
          </div>

          {/* Centered Gambling UI if gamblePayload is present */}
          {message.gamblePayload ? (
            <div className="w-full flex justify-center my-2">
              <div className="relative w-full max-w-md bg-[#161720]/90 border border-[#2b2d3c] rounded-md p-4 shadow-xl text-center flex flex-col items-center gap-2.5">
                {/* Top Corner Multiplier Badge: x[1-100] */}
                <div
                  className={`absolute top-2.5 right-3 px-2 py-0.5 rounded text-xs font-black font-mono tracking-wider border shadow-sm ${
                    message.gamblePayload.won
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'
                      : 'bg-[#22161a]/90 text-neutral-400 border-[#3d232a]'
                  }`}
                >
                  {message.gamblePayload.won
                    ? `x${message.gamblePayload.multiplier}`
                    : 'x0'}
                </div>

                {/* User info & command performed */}
                <div className="flex items-center gap-2 flex-wrap justify-center pt-0.5">
                  <div className="w-6 h-6 rounded-full overflow-hidden bg-[#242630] border border-[#373946] shrink-0 flex items-center justify-center">
                    {message.gamblePayload.userAvatar ? (
                      <img
                        src={message.gamblePayload.userAvatar}
                        alt={message.gamblePayload.username}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-3.5 h-3.5 text-neutral-400" />
                    )}
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-neutral-100">
                    {message.gamblePayload.username}
                  </span>
                  <span className="text-xs text-neutral-400">
                    did{' '}
                    <span className="text-purple-300 font-mono font-bold">
                      /{message.gamblePayload.command.toUpperCase()}
                    </span>
                  </span>
                </div>

                {/* Bet amount */}
                <div className="flex items-center gap-1.5 text-xs text-neutral-300 font-medium bg-[#111218]/90 px-3 py-1 rounded border border-[#232532]">
                  <span className="text-neutral-400">Bet:</span>
                  {message.gamblePayload.currency === 'ruby' ? (
                    <RubyIcon className="w-4 h-4" />
                  ) : (
                    <GoldIcon className="w-4 h-4" />
                  )}
                  <span className="font-mono font-bold text-white">
                    {message.gamblePayload.betAmount.toLocaleString()}
                  </span>
                  <span className="capitalize text-neutral-400">
                    {message.gamblePayload.currency === 'ruby' ? 'Rubies' : 'Gold'}
                  </span>
                </div>

                {/* Result: Won / Lost */}
                <div className="w-full flex items-center justify-center pt-1">
                  {message.gamblePayload.won ? (
                    <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-950/70 border border-emerald-500/50 rounded text-emerald-300 text-xs sm:text-sm font-black tracking-wide">
                      <span>WON</span>
                      <span className="font-mono text-emerald-200">
                        +{message.gamblePayload.payoutAmount.toLocaleString()}
                      </span>
                      {message.gamblePayload.currency === 'ruby' ? (
                        <RubyIcon className="w-4 h-4" />
                      ) : (
                        <GoldIcon className="w-4 h-4" />
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-4 py-1.5 bg-red-950/60 border border-red-500/40 rounded text-red-400 text-xs sm:text-sm font-black tracking-wide">
                      <span>LOST</span>
                      <span className="font-mono text-red-300">
                        -{message.gamblePayload.betAmount.toLocaleString()}
                      </span>
                      {message.gamblePayload.currency === 'ruby' ? (
                        <RubyIcon className="w-4 h-4" />
                      ) : (
                        <GoldIcon className="w-4 h-4" />
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Regular message content */
            <p className="text-xs sm:text-sm text-neutral-200 leading-relaxed whitespace-pre-wrap break-words selection:bg-zinc-700">
              {message.content}
            </p>
          )}
        </div>

        {/* Three Dots Menu Button */}
        <div className="absolute top-2.5 right-4 sm:right-6" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Message options"
            className="p-1 text-neutral-400 hover:text-neutral-200 hover:bg-[#2b2d38] rounded-xs transition-colors opacity-70 group-hover:opacity-100 focus:opacity-100 cursor-pointer"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {/* Dropdown Menu */}
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 z-30 w-32 bg-[#1b1c22] border border-[#323440] rounded-xs shadow-2xl shadow-black/80 py-1 text-xs text-neutral-200 flex flex-col animate-in fade-in duration-100">
              {/* Reply */}
              <button
                type="button"
                onClick={() => {
                  onReply(message);
                  setMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-[#272933] hover:text-white transition-colors cursor-pointer"
              >
                <CornerUpLeft className="w-3.5 h-3.5 text-neutral-400" />
                <span>Reply</span>
              </button>

              {/* Hide */}
              <button
                type="button"
                onClick={() => {
                  onHide(message.id);
                  setMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-[#272933] hover:text-white transition-colors cursor-pointer"
              >
                <EyeOff className="w-3.5 h-3.5 text-neutral-400" />
                <span>Hide</span>
              </button>

              {/* Delete - on own messages OR if user is founder/dev (canModerate) */}
              {(isCurrentUser || canModerate) && (
                <button
                  type="button"
                  onClick={() => {
                    onDelete(message.id);
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-red-400 hover:bg-[#2f2025] hover:text-red-300 transition-colors border-t border-[#292a34] mt-1 pt-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
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
