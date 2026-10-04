import React, { useEffect, useRef } from 'react';
import { Bell, Trash2, Heart, Eye, Megaphone, ExternalLink, X } from 'lucide-react';
import { AppNotification } from '../types/notifications';
import { UserAvatar } from './UserAvatar';
import { getTextStyleCSS } from '../utils/textStylePresets';

interface NotificationsDropdownProps {
  isOpen: boolean;
  notifications: AppNotification[];
  onClose: () => void;
  onClearAll: () => void;
  onDeleteNotification: (id: string) => void;
  onOpenProfile: (username: string) => void;
}

/**
 * Parses text and replaces URLs with clickable hyperlinks
 */
function renderTextWithLinks(text: string) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-sky-400 hover:text-sky-300 underline inline-flex items-center gap-0.5 break-all font-medium"
        >
          <span>{part}</span>
          <ExternalLink className="w-2.5 h-2.5 inline shrink-0" />
        </a>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

function formatNotificationTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - timestamp) / 1000);

  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;

  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${month}/${day} ${hours}:${minutes}`;
}

export const NotificationsDropdown: React.FC<NotificationsDropdownProps> = ({
  isOpen,
  notifications,
  onClose,
  onClearAll,
  onDeleteNotification,
  onOpenProfile,
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
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

  return (
    <div
      ref={dropdownRef}
      className="absolute top-14 sm:top-16 right-10 sm:right-14 z-50 w-80 sm:w-88 bg-[#181920] border border-[#2b2d39] rounded-lg shadow-2xl shadow-black overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150 text-left select-none"
    >
      {/* ================================================== */}
      {/* HEADER: Notifications + Trash icon                 */}
      {/* ================================================== */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#14151a] border-b border-[#252732]">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-neutral-200 fill-neutral-200/20" />
          <span className="text-xs font-bold text-neutral-100 uppercase tracking-wide">
            Notifications
          </span>
          {notifications.length > 0 && (
            <span className="px-1.5 py-0.2 bg-[#252838] text-neutral-300 text-[10px] font-semibold rounded-full border border-[#34374c]">
              {notifications.length}
            </span>
          )}
        </div>

        {notifications.length > 0 && (
          <button
            type="button"
            onClick={onClearAll}
            title="Clear all notifications"
            className="p-1 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* ================================================== */}
      {/* NOTIFICATIONS LIST                                 */}
      {/* ================================================== */}
      <div className="max-h-80 overflow-y-auto divide-y divide-[#222430]">
        {notifications.length === 0 ? (
          <div className="py-8 px-4 flex flex-col items-center justify-center text-center text-neutral-400">
            <Bell className="w-8 h-8 text-neutral-600 mb-2 stroke-[1.5]" />
            <span className="text-xs font-medium">No notifications yet</span>
            <span className="text-[10px] text-neutral-500 mt-0.5">
              You&apos;ll be notified when people view or like your profile
            </span>
          </div>
        ) : (
          notifications.map((item) => {
            const senderStyle = getTextStyleCSS(item.senderUsernameStyle, true);

            return (
              <div
                key={item.id}
                onClick={() => {
                  if (item.senderUsername && item.senderUsername !== 'System') {
                    onOpenProfile(item.senderUsername);
                    onClose();
                  }
                }}
                className="flex items-start gap-3 p-3 hover:bg-[#1f212c] transition-colors cursor-pointer group relative"
              >
                {/* Left: Avatar with badge icon */}
                <div className="relative shrink-0 pt-0.5">
                  <UserAvatar
                    src={item.senderAvatar}
                    username={item.senderUsername || 'User'}
                    frameId={item.senderAvatarFrame}
                    size="sm"
                    shape="circle"
                  />

                  {/* Badge Icon overlay */}
                  <div
                    className={`absolute -bottom-1 -right-1 w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 border-[#181920] shadow-sm ${
                      item.type === 'profile_like'
                        ? 'bg-rose-600 text-white'
                        : item.type === 'profile_view'
                        ? 'bg-purple-600 text-white'
                        : 'bg-sky-600 text-white'
                    }`}
                  >
                    {item.type === 'profile_like' && <Heart className="w-2.5 h-2.5 fill-current" />}
                    {item.type === 'profile_view' && <Eye className="w-2.5 h-2.5" />}
                    {item.type === 'custom' && <Megaphone className="w-2.5 h-2.5" />}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pr-4">
                  {/* Sender Name */}
                  <div className="flex items-center gap-1.5 flex-wrap leading-tight">
                    <span
                      style={senderStyle}
                      className="text-xs font-bold text-neutral-100 truncate hover:underline"
                    >
                      {item.senderUsername}
                    </span>
                  </div>

                  {/* Text Content */}
                  <div className="text-xs text-neutral-300 mt-0.5 leading-snug break-words">
                    {renderTextWithLinks(item.text)}
                  </div>

                  {/* Time */}
                  <div className="text-[10px] text-neutral-500 font-mono mt-1">
                    {formatNotificationTime(item.timestamp)}
                  </div>
                </div>

                {/* Single Delete Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteNotification(item.id);
                  }}
                  title="Remove notification"
                  className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-all cursor-pointer shrink-0 absolute top-2 right-2"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
