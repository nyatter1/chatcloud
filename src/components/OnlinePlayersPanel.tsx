import React from 'react';
import { ProfileData } from '../types/bio';
import { SYSTEM_BOT } from '../constants/systemBot';
import { getRankConfig } from '../constants/ranks';
import { RankId } from '../types/ranks';
import { AvatarWithBorder } from './AvatarWithBorder';

interface OnlinePlayersPanelProps {
  currentUser: ProfileData;
  allUsers?: Record<string, ProfileData>;
  onOpenProfile: (userId: string) => void;
}

export const OnlinePlayersPanel: React.FC<OnlinePlayersPanelProps> = ({
  currentUser,
  allUsers = {},
  onOpenProfile,
}) => {
  // Determine effective rank for currentUser
  const currentUserRank: RankId =
    currentUser.rank ||
    (currentUser.username.toLowerCase() === 'null' ? 'DEV' : 'VIP');

  // Filter out current user from allUsers to avoid duplicate
  const otherUsersList = Object.values(allUsers).filter(
    (u) => u.username.toLowerCase().trim() !== currentUser.username.toLowerCase().trim()
  );

  // Build full roster:
  // 1. System Bot
  // 2. Current user
  // 3. Other registered users
  const rawOnlineUsers = [
    {
      id: 'system',
      name: SYSTEM_BOT.name,
      avatar: SYSTEM_BOT.avatar,
      borderId: null,
      isSystemBot: true,
      mood: '',
      rank: SYSTEM_BOT.rank as RankId,
    },
    {
      id: currentUser.username,
      name: currentUser.username,
      avatar: currentUser.profilePicture,
      borderId: currentUser.effects?.pfpBorder || currentUser.pfpBorder || null,
      isSystemBot: false,
      mood: currentUser.mood?.trim() || '',
      rank: currentUserRank,
    },
    ...otherUsersList.map((u) => ({
      id: u.username,
      name: u.username,
      avatar: u.profilePicture,
      borderId: u.effects?.pfpBorder || u.pfpBorder || null,
      isSystemBot: false,
      mood: u.mood?.trim() || '',
      rank: (u.rank || (u.username.toLowerCase() === 'null' ? 'DEV' : 'VIP')) as RankId,
    })),
  ];

  // Sort by staff hierarchy (DEV -> FOUNDER -> ... -> MODERATOR -> BOT -> ELITE -> SUPER-VIP -> VIP)
  const onlineUsers = [...rawOnlineUsers].sort((a, b) => {
    const orderA = getRankConfig(a.rank)?.order ?? 99;
    const orderB = getRankConfig(b.rank)?.order ?? 99;
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    return a.name.localeCompare(b.name);
  });

  return (
    <aside className="w-56 sm:w-60 md:w-64 bg-[#141518] border-l border-[#24252c] flex flex-col p-4 shrink-0 overflow-y-auto select-none text-left">
      <div className="flex flex-col">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[11px] font-bold tracking-wider text-neutral-400 uppercase">
            Online
          </span>
          <span className="text-[11px] text-neutral-500 font-mono">
            {onlineUsers.length}
          </span>
        </div>

        <div className="flex flex-col gap-1.5">
          {onlineUsers.map((user) => {
            const rankConfig = getRankConfig(user.rank);

            return (
              <button
                key={user.id}
                type="button"
                onClick={() => onOpenProfile(user.id)}
                className="w-full flex items-center justify-between p-2 rounded-md hover:bg-[#1c1d23] transition-colors cursor-pointer text-left focus:outline-none focus:ring-1 focus:ring-zinc-600 gap-2"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  {/* Profile Picture with Custom PFP Border */}
                  <AvatarWithBorder
                    src={user.avatar}
                    borderId={user.borderId}
                    isSystemBot={user.isSystemBot}
                    alt={user.name}
                    size="sm"
                    shape="circle"
                  />

                  {/* Name & Mood */}
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-xs font-semibold text-neutral-200 truncate">
                      {user.name}
                    </span>
                    {user.mood ? (
                      <span className="text-[11px] text-neutral-300 font-bold italic truncate">
                        {user.mood}
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Rank icon at the FAR RIGHT END */}
                {rankConfig && (
                  <img
                    src={rankConfig.iconUrl}
                    alt={rankConfig.name}
                    title={rankConfig.name}
                    referrerPolicy="no-referrer"
                    className="w-4 h-4 object-contain shrink-0"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
};
