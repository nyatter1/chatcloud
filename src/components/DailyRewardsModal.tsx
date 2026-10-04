import React, { useState, useEffect } from 'react';
import { X, Gift, Trophy, Check, Sparkles } from 'lucide-react';
import { ProfileData } from '../types/bio';
import { GoldIcon, RubyIcon } from './CurrencyIcons';
import { UserAvatar } from './UserAvatar';
import { getAllUsersFromFirestore } from '../services/apiService';

interface DailyRewardsModalProps {
  isOpen: boolean;
  currentUser: ProfileData;
  allUsers?: Record<string, ProfileData>;
  onClose: () => void;
  onClaimReward: (milestoneCount: number, gold: number, rubies: number) => void;
}

interface Milestone {
  count: number;
  gold: number;
  rubies: number;
}

const MILESTONES: Milestone[] = [
  { count: 10, gold: 50, rubies: 0 },
  { count: 50, gold: 200, rubies: 2 },
  { count: 100, gold: 500, rubies: 5 },
  { count: 250, gold: 1500, rubies: 10 },
  { count: 500, gold: 3000, rubies: 20 },
  { count: 1000, gold: 7500, rubies: 50 },
];

export const DailyRewardsModal: React.FC<DailyRewardsModalProps> = ({
  isOpen,
  currentUser,
  allUsers = {},
  onClose,
  onClaimReward,
}) => {
  const [activeTab, setActiveTab] = useState<'rewards' | 'leaderboard'>('rewards');
  const [countdown, setCountdown] = useState<string>('');
  const [leaderboardUsers, setLeaderboardUsers] = useState<ProfileData[]>([]);

  const todayKey = new Date().toISOString().slice(0, 10);
  const isToday = currentUser.dailyMessagesDate === todayKey;
  const messagesToday = isToday ? currentUser.dailyMessagesCount || 0 : 0;
  const claimedMilestones = isToday ? currentUser.claimedDailyMilestones || [] : [];

  // Live countdown timer until next UTC midnight reset
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const tomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
      const diffMs = tomorrow.getTime() - now.getTime();

      if (diffMs <= 0) {
        setCountdown('00h 00m 00s');
        return;
      }

      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      const pad = (n: number) => String(n).padStart(2, '0');
      setCountdown(`${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch / assemble live real users for the leaderboard
  useEffect(() => {
    if (!isOpen) return;

    const fetchLeaderboard = async () => {
      try {
        const usersFromDb = await getAllUsersFromFirestore();
        const combinedMap: Record<string, ProfileData> = { ...allUsers };
        usersFromDb.forEach((u) => {
          combinedMap[u.username.toLowerCase()] = u;
        });

        // Always make sure currentUser has latest today messages
        combinedMap[currentUser.username.toLowerCase()] = currentUser;

        const list = Object.values(combinedMap)
          .filter((u) => u.dailyMessagesDate === todayKey && (u.dailyMessagesCount || 0) > 0)
          .sort((a, b) => (b.dailyMessagesCount || 0) - (a.dailyMessagesCount || 0))
          .slice(0, 10);

        setLeaderboardUsers(list);
      } catch {
        // Fallback to allUsers in props
        const list = Object.values(allUsers)
          .filter((u) => u.dailyMessagesDate === todayKey && (u.dailyMessagesCount || 0) > 0)
          .sort((a, b) => (b.dailyMessagesCount || 0) - (a.dailyMessagesCount || 0))
          .slice(0, 10);
        setLeaderboardUsers(list);
      }
    };

    fetchLeaderboard();
  }, [isOpen, allUsers, currentUser, todayKey]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150 select-none">
      {/* Click backdrop to close */}
      <div className="absolute inset-0" onClick={onClose} />

      <div
        className="relative z-10 w-full max-w-lg bg-[#141519] border border-[#2b2d39] rounded-xs shadow-2xl shadow-black overflow-hidden flex flex-col max-h-[90vh] text-left animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#24252f] bg-[#171820]">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-amber-400" />
            <h2 className="text-sm font-bold text-neutral-100 uppercase tracking-wide">
              Daily Rewards
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1 text-neutral-400 hover:text-white rounded-xs transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab navigation */}
        <div className="grid grid-cols-2 p-1.5 bg-[#101115] border-b border-[#24252f]">
          <button
            type="button"
            onClick={() => setActiveTab('rewards')}
            className={`py-2 text-xs font-bold rounded-xs transition-colors flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'rewards'
                ? 'bg-[#22242f] text-white shadow-xs border border-[#343648]'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Gift className="w-3.5 h-3.5" />
            <span>My Rewards</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('leaderboard')}
            className={`py-2 text-xs font-bold rounded-xs transition-colors flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'leaderboard'
                ? 'bg-[#22242f] text-white shadow-xs border border-[#343648]'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Leaderboard</span>
          </button>
        </div>

        {/* TAB 1: MY REWARDS */}
        {activeTab === 'rewards' && (
          <div className="p-4 sm:p-5 overflow-y-auto flex flex-col gap-4 flex-1">
            {/* Top Info Banner */}
            <div className="p-3.5 bg-gradient-to-r from-[#191b24] to-[#1d1f2a] border border-[#2b2d3d] rounded-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-neutral-100 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Claim rewards for your daily messages</span>
                </span>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Send messages in chat to reach daily milestones and earn Gold and Rubies!
                </p>
              </div>

              {/* Countdown box */}
              <div className="px-3 py-1.5 bg-[#121318] border border-[#262835] rounded-xs shrink-0 flex flex-col items-center">
                <span className="text-[10px] text-neutral-500 uppercase font-mono tracking-wider">
                  Reset in:
                </span>
                <span className="text-xs font-bold text-amber-400 font-mono">
                  {countdown}
                </span>
              </div>
            </div>

            {/* Stat Card: Messages Sent Today */}
            <div className="p-4 bg-[#121317] border border-[#242633] rounded-xs flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-extrabold text-white tracking-tight font-mono">
                {messagesToday}
              </span>
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest mt-1">
                Messages Sent Today
              </span>
            </div>

            {/* Milestones list */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider px-0.5">
                Daily Milestones
              </span>

              {MILESTONES.map((milestone) => {
                const isClaimed = claimedMilestones.includes(milestone.count);
                const hasReached = messagesToday >= milestone.count;
                const progressPct = Math.min(100, Math.round((messagesToday / milestone.count) * 100));

                return (
                  <div
                    key={milestone.count}
                    className={`p-3 rounded-xs border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                      isClaimed
                        ? 'bg-[#15161d] border-[#22232c] opacity-80'
                        : hasReached
                        ? 'bg-[#1b1e2a] border-amber-500/50 shadow-xs'
                        : 'bg-[#16171f] border-[#252632]'
                    }`}
                  >
                    {/* Left: Milestone info + progress bar */}
                    <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-neutral-100">
                          {milestone.count} Messages
                        </span>
                        <span className="text-[11px] text-neutral-400 font-mono">
                          {messagesToday} / {milestone.count}
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full h-1.5 bg-[#101115] rounded-full overflow-hidden border border-white/5">
                        <div
                          className={`h-full transition-all duration-300 ${
                            isClaimed
                              ? 'bg-emerald-500'
                              : hasReached
                              ? 'bg-amber-400'
                              : 'bg-purple-500'
                          }`}
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>

                      {/* Reward pills */}
                      <div className="flex items-center gap-3 pt-0.5">
                        <span className="text-[11px] text-neutral-400">Reward:</span>
                        <div className="flex items-center gap-1">
                          <GoldIcon className="w-3.5 h-3.5" />
                          <span className="text-xs font-bold text-amber-300 font-mono">
                            {milestone.gold.toLocaleString()}
                          </span>
                        </div>
                        {milestone.rubies > 0 && (
                          <div className="flex items-center gap-1">
                            <RubyIcon className="w-3.5 h-3.5" />
                            <span className="text-xs font-bold text-rose-400 font-mono">
                              {milestone.rubies.toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Claim button */}
                    <div className="shrink-0 flex items-center justify-end sm:justify-center">
                      {isClaimed ? (
                        <div className="px-3 py-1.5 bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 rounded-xs text-xs font-semibold flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5" />
                          <span>Claimed</span>
                        </div>
                      ) : hasReached ? (
                        <button
                          type="button"
                          onClick={() => onClaimReward(milestone.count, milestone.gold, milestone.rubies)}
                          className="px-4 py-1.5 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold rounded-xs text-xs transition-colors cursor-pointer shadow-sm animate-pulse"
                        >
                          Claim Reward
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="px-3.5 py-1.5 bg-[#1f202a] text-neutral-500 border border-[#2b2d3c] rounded-xs text-xs font-medium cursor-not-allowed"
                        >
                          {milestone.count - messagesToday} left
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: LEADERBOARD */}
        {activeTab === 'leaderboard' && (
          <div className="p-4 sm:p-5 overflow-y-auto flex flex-col gap-3 flex-1">
            <div className="flex items-center justify-between pb-1 border-b border-[#23242e]">
              <div>
                <span className="text-xs font-extrabold text-amber-400 uppercase tracking-widest">
                  Top 10
                </span>
                <h3 className="text-sm font-bold text-neutral-100">
                  MOST ACTIVE TODAY
                </h3>
              </div>
              <span className="text-[11px] text-neutral-500 font-mono">
                {leaderboardUsers.length} active users
              </span>
            </div>

            {leaderboardUsers.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center text-neutral-500 gap-2">
                <Trophy className="w-8 h-8 text-neutral-600" />
                <span className="text-xs">No messages sent yet today.</span>
                <span className="text-[11px] text-neutral-600">
                  Be the first to chat and take the #1 spot!
                </span>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {leaderboardUsers.map((user, idx) => {
                  const rankNum = idx + 1;
                  const isCurrent = user.username.toLowerCase() === currentUser.username.toLowerCase();

                  return (
                    <div
                      key={user.username}
                      className={`flex items-center justify-between p-2.5 rounded-xs border transition-colors ${
                        isCurrent
                          ? 'bg-[#1e212d] border-purple-500/50'
                          : 'bg-[#16171f] border-[#252632]'
                      }`}
                    >
                      {/* Rank & User details */}
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Rank Badge */}
                        <div
                          className={`w-6 h-6 rounded-xs flex items-center justify-center font-bold text-xs font-mono shrink-0 ${
                            rankNum === 1
                              ? 'bg-amber-400 text-neutral-950 shadow-xs'
                              : rankNum === 2
                              ? 'bg-slate-300 text-neutral-950'
                              : rankNum === 3
                              ? 'bg-amber-700 text-white'
                              : 'bg-[#22242f] text-neutral-400'
                          }`}
                        >
                          #{rankNum}
                        </div>

                        {/* Avatar with frame */}
                        <UserAvatar
                          src={user.profilePicture}
                          username={user.username}
                          frameId={user.avatarFrame || user.effects?.pfpBorder}
                          size="sm"
                          shape="square"
                        />

                        {/* Username */}
                        <div className="flex flex-col min-w-0">
                          <span
                            className={`text-xs font-bold truncate ${
                              isCurrent ? 'text-purple-300' : 'text-neutral-100'
                            }`}
                          >
                            {user.username}
                            {isCurrent && (
                              <span className="ml-1 text-[10px] font-mono text-purple-400">
                                (You)
                              </span>
                            )}
                          </span>
                          <span className="text-[10px] text-neutral-500 font-mono">
                            @{user.username.toLowerCase().replace(/\s+/g, '')}
                          </span>
                        </div>
                      </div>

                      {/* Right: Message count */}
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        <span className="text-xs font-bold text-amber-400 font-mono">
                          {(user.dailyMessagesCount || 0).toLocaleString()}
                        </span>
                        <span className="text-[11px] text-neutral-400">
                          {user.dailyMessagesCount === 1 ? 'message' : 'messages'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-[#23242e] bg-[#16171f] text-xs">
          <span className="text-neutral-500 text-[11px]">
            Messages count toward daily milestones and reset at midnight UTC.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-[#20222c] hover:bg-[#2a2d3a] text-neutral-200 rounded-xs font-medium transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
