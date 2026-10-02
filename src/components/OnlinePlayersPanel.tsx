import React from 'react';
import { User } from 'lucide-react';
import { ProfileData } from '../types/bio';
import { SYSTEM_BOT } from '../constants/systemBot';
import { getRankConfig } from '../constants/ranks';
import { RankId } from '../types/ranks';

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
  // Determine effective ranks
  const currentUserRank: RankId =
    currentUser.rank ||
    (currentUser.username.toLowerCase() === 'null' ? 'DEV' : 'VIP');

  // Build online list:
  // 1. System Bot at the top
  // 2. Current user
  // 3. Other registered users from Firestore
  const otherUsersList = Object.values(allUsers).filter(
    (u) => u.username.toLowerCase().trim() !== currentUser.username.toLowerCase().trim()
  );

  const onlineUsers = [
    {
      id: 'system',
      name: SYSTEM_BOT.name,
      avatar: SYSTEM_BOT.avatar,
      isSystemBot: true,
      mood: '',
      rank: SYSTEM_BOT.rank as RankId,
    },
    {
      id: 'current_user',
      name: currentUser.username,
      avatar: currentUser.profilePicture,
      isSystemBot: false,
      mood: currentUser.mood?.trim() || '',
      rank: currentUserRank,
    },
    ...otherUsersList.map((u) => ({
      id: u.username,
      name: u.username,
      avatar: u.profilePicture,
      isSystemBot: false,
      mood: u.mood?.trim() || '',
      rank: (u.rank || (u.username.toLowerCase() === 'null' ? 'DEV' : 'VIP')) as RankId,
    })),
  ];

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
                  {/* Profile Picture */}
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-[#242630] border border-[#343644] shrink-0 flex items-center justify-center">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-4 h-4 text-neutral-400" />
                    )}
                  </div>

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
