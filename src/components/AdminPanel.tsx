import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  Terminal,
  Zap,
  Puzzle,
  ChevronLeft,
  Search,
  Trash2,
  Edit3,
  Coins,
  ShieldAlert,
  Check,
  X,
  RefreshCw,
  User as UserIcon,
  Bell,
  Send,
  ExternalLink,
} from 'lucide-react';
import { ProfileData } from '../types/bio';
import { RankId } from '../types/ranks';
import { RANKS, getRankConfig } from '../constants/ranks';
import { RubyIcon, GoldIcon } from './CurrencyIcons';
import { getAuditLogs, clearAuditLogs, addAuditLog, AuditLogEntry } from '../utils/auditLogger';
import {
  subscribeToUsers,
  subscribeToAuditLogs,
  saveUserToFirestore,
  deleteUserFromFirestore,
  clearAuditLogsInFirestore,
  getAllUsersFromFirestore,
  sendNotificationToFirestore,
} from '../services/apiService';
import { AppNotification } from '../types/notifications';

interface AdminPanelProps {
  currentUser: ProfileData;
  onBackToChat: () => void;
  onOpenProfile: (targetUserId: string) => void;
  onUpdateCurrentUser: (profile: ProfileData) => void;
}

type AdminTab = 'dashboard' | 'members' | 'notifications' | 'console' | 'action' | 'addons';

export const AdminPanel: React.FC<AdminPanelProps> = ({
  currentUser,
  onBackToChat,
  onOpenProfile,
  onUpdateCurrentUser,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [accounts, setAccounts] = useState<Record<string, ProfileData>>({});
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [logFilter, setLogFilter] = useState<'all' | 'chat' | 'user' | 'command' | 'admin'>('all');
  const [searchLogQuery, setSearchLogQuery] = useState('');
  const [memberSearchQuery, setMemberSearchQuery] = useState('');

  // Currency modal state
  const [currencyModalUser, setCurrencyModalUser] = useState<string | null>(null);
  const [giveCurrencyType, setGiveCurrencyType] = useState<'gold' | 'ruby'>('gold');
  const [giveAmount, setGiveAmount] = useState<string>('500');

  // Custom Notification state
  const [notifTarget, setNotifTarget] = useState<string>('all');
  const [notifMessage, setNotifMessage] = useState<string>('');
  const [notifSending, setNotifSending] = useState<boolean>(false);
  const [notifSuccess, setNotifSuccess] = useState<string | null>(null);

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = notifMessage.trim();
    if (!trimmed) return;

    setNotifSending(true);
    setNotifSuccess(null);

    try {
      const newNotif: AppNotification = {
        id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        recipientUsername: notifTarget,
        senderUsername: currentUser.username,
        senderAvatar: currentUser.profilePicture || null,
        senderAvatarFrame: currentUser.avatarFrame || currentUser.effects?.pfpBorder || null,
        senderUsernameStyle: currentUser.usernameStyle || null,
        type: 'custom',
        text: trimmed,
        timestamp: Date.now(),
        read: false,
      };

      await sendNotificationToFirestore(newNotif);

      addAuditLog(
        currentUser.username,
        'Sent Custom Notification',
        `Sent to ${notifTarget}: "${trimmed.slice(0, 30)}..."`,
        'admin'
      );

      setNotifMessage('');
      setNotifSuccess(
        notifTarget === 'all'
          ? 'Notification broadcasted to all users successfully!'
          : `Notification delivered to ${notifTarget} successfully!`
      );

      setTimeout(() => setNotifSuccess(null), 5000);
    } catch (err) {
      console.error('Error sending notification from admin panel:', err);
    } finally {
      setNotifSending(false);
    }
  };

  // Refresh data from cloud
  const refreshData = async () => {
    try {
      const users = await getAllUsersFromFirestore();
      const usersMap: Record<string, ProfileData> = {};
      users.forEach((u) => {
        if (u.username) usersMap[u.username.toLowerCase().trim()] = u;
      });
      if (users.length > 0) {
        setAccounts(usersMap);
      }
    } catch {}
  };

  // Load registered users and system audit logs & subscribe live
  useEffect(() => {
    const unsubUsers = subscribeToUsers((usersMap) => {
      setAccounts(usersMap);
    });

    const unsubLogs = subscribeToAuditLogs((liveLogs) => {
      setLogs(liveLogs);
    });

    return () => {
      unsubUsers();
      unsubLogs();
    };
  }, []);

  const usersList = Object.values(accounts);

  // Statistics calculation
  const totalUsers = usersList.length;
  const maleCount = usersList.filter(
    (u) => u.gender?.toLowerCase() === 'male'
  ).length;
  const femaleCount = usersList.filter(
    (u) => u.gender?.toLowerCase() === 'female'
  ).length;
  const otherGenderCount = totalUsers - maleCount - femaleCount;

  const totalGold = usersList.reduce(
    (sum, u) => sum + (u.wallet?.gold || 0),
    0
  );
  const totalRubies = usersList.reduce(
    (sum, u) => sum + (u.wallet?.ruby || 0),
    0
  );

  // Update user rank
  const handleRankChange = (username: string, newRank: RankId) => {
    const lower = username.toLowerCase();
    const target = accounts[lower];
    if (!target) return;

    const oldRank = target.rank || 'VIP';
    const updatedUser: ProfileData = {
      ...target,
      rank: newRank,
    };

    const updatedAccounts = {
      ...accounts,
      [lower]: updatedUser,
    };

    setAccounts(updatedAccounts);
    try {
      localStorage.setItem('chatcloud_users', JSON.stringify(updatedAccounts));
    } catch {}

    saveUserToFirestore(updatedUser).catch(() => {});

    if (currentUser.username.toLowerCase() === lower) {
      onUpdateCurrentUser(updatedUser);
    }

    addAuditLog(
      currentUser.username,
      'Changed User Rank',
      `${currentUser.username} changed ${target.username}'s rank from ${oldRank} to ${newRank}`,
      'admin'
    );
  };

  // Give currency
  const handleGiveCurrency = () => {
    if (!currencyModalUser) return;
    const amountNum = parseInt(giveAmount, 10);
    if (isNaN(amountNum) || amountNum <= 0) return;

    const lower = currencyModalUser.toLowerCase();
    const target = accounts[lower];
    if (!target) return;

    const currentWallet = target.wallet || { gold: 1000, ruby: 5 };
    const updatedWallet = {
      ...currentWallet,
      [giveCurrencyType]: currentWallet[giveCurrencyType] + amountNum,
    };

    const updatedUser: ProfileData = {
      ...target,
      wallet: updatedWallet,
    };

    const updatedAccounts = {
      ...accounts,
      [lower]: updatedUser,
    };

    setAccounts(updatedAccounts);
    try {
      localStorage.setItem('chatcloud_users', JSON.stringify(updatedAccounts));
    } catch {}

    saveUserToFirestore(updatedUser).catch(() => {});

    if (currentUser.username.toLowerCase() === lower) {
      onUpdateCurrentUser(updatedUser);
    }

    addAuditLog(
      currentUser.username,
      'Granted Currency',
      `${currentUser.username} gave ${amountNum.toLocaleString()} ${
        giveCurrencyType === 'gold' ? 'Gold' : 'Rubies'
      } to ${target.username}`,
      'admin'
    );

    setCurrencyModalUser(null);
  };

  // Delete user
  const handleDeleteUser = (username: string) => {
    const lower = username.toLowerCase();
    if (lower === currentUser.username.toLowerCase()) {
      alert("You cannot delete your own active admin account.");
      return;
    }

    if (!confirm(`Are you sure you want to delete user "${username}" from the database?`)) {
      return;
    }

    const updatedAccounts = { ...accounts };
    delete updatedAccounts[lower];

    setAccounts(updatedAccounts);
    try {
      localStorage.setItem('chatcloud_users', JSON.stringify(updatedAccounts));
    } catch {}

    deleteUserFromFirestore(username).catch(() => {});

    addAuditLog(
      currentUser.username,
      'Deleted User',
      `${currentUser.username} permanently deleted user account "${username}"`,
      'admin'
    );
  };

  // Filtered members list
  const filteredUsers = usersList.filter((u) =>
    u.username.toLowerCase().includes(memberSearchQuery.toLowerCase())
  );

  // Filtered logs
  const filteredLogs = logs.filter((log) => {
    if (logFilter !== 'all' && log.category !== logFilter) return false;
    if (searchLogQuery) {
      const q = searchLogQuery.toLowerCase();
      return (
        log.actor.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        (log.details && log.details.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="flex h-screen w-full bg-[#0f1013] text-neutral-100 select-none overflow-hidden font-sans">
      {/* ================================================== */}
      {/* 1. LEFT SIDEBAR                                    */}
      {/* ================================================== */}
      <aside className="w-60 sm:w-64 bg-[#141518] border-r border-[#24252c] flex flex-col shrink-0">
        {/* Top Header / Back button */}
        <div className="p-4 border-b border-[#24252c] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onBackToChat}
              className="p-1.5 bg-[#1e2026] hover:bg-[#282a32] text-neutral-300 hover:text-white rounded-md transition-colors flex items-center gap-1 text-xs cursor-pointer"
              title="Return to ChatCloud"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Chat</span>
            </button>
          </div>
          <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider font-mono">
            v1.0
          </span>
        </div>

        {/* Panel Title */}
        <div className="px-4 py-3 bg-[#111215] border-b border-[#24252c]">
          <h1 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Admin Panel
          </h1>
          <span className="text-[11px] text-neutral-400">
            System Administration
          </span>
        </div>

        {/* Sidebar Nav Links */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {/* Dashboard */}
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-medium transition-colors cursor-pointer text-left ${
              activeTab === 'dashboard'
                ? 'bg-[#22242c] text-white border-l-2 border-purple-500'
                : 'text-neutral-400 hover:bg-[#191a20] hover:text-neutral-200'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-neutral-400" />
            <span>Dashboard</span>
          </button>

          {/* Manage members */}
          <button
            type="button"
            onClick={() => setActiveTab('members')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-medium transition-colors cursor-pointer text-left ${
              activeTab === 'members'
                ? 'bg-[#22242c] text-white border-l-2 border-purple-500'
                : 'text-neutral-400 hover:bg-[#191a20] hover:text-neutral-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <Users className="w-4 h-4 text-neutral-400" />
              <span>Manage members</span>
            </div>
            <span className="px-1.5 py-0.5 bg-[#1b1d24] text-[10px] text-neutral-400 rounded-sm font-mono">
              {totalUsers}
            </span>
          </button>

          {/* Custom Notifications */}
          <button
            type="button"
            onClick={() => setActiveTab('notifications')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-medium transition-colors cursor-pointer text-left ${
              activeTab === 'notifications'
                ? 'bg-[#22242c] text-white border-l-2 border-purple-500'
                : 'text-neutral-400 hover:bg-[#191a20] hover:text-neutral-200'
            }`}
          >
            <Bell className="w-4 h-4 text-neutral-400" />
            <span>Send Notifications</span>
          </button>

          {/* System Console / Logs */}
          <button
            type="button"
            onClick={() => setActiveTab('console')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-medium transition-colors cursor-pointer text-left ${
              activeTab === 'console'
                ? 'bg-[#22242c] text-white border-l-2 border-purple-500'
                : 'text-neutral-400 hover:bg-[#191a20] hover:text-neutral-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <Terminal className="w-4 h-4 text-neutral-400" />
              <span>System Console</span>
            </div>
            <span className="px-1.5 py-0.5 bg-[#1b1d24] text-[10px] text-neutral-400 rounded-sm font-mono">
              {logs.length}
            </span>
          </button>

          {/* Manage action */}
          <button
            type="button"
            onClick={() => setActiveTab('action')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-medium transition-colors cursor-pointer text-left ${
              activeTab === 'action'
                ? 'bg-[#22242c] text-white border-l-2 border-purple-500'
                : 'text-neutral-400 hover:bg-[#191a20] hover:text-neutral-200'
            }`}
          >
            <Zap className="w-4 h-4 text-neutral-400" />
            <span>Manage action</span>
          </button>

          {/* Manage addons / Plugins */}
          <button
            type="button"
            onClick={() => setActiveTab('addons')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-medium transition-colors cursor-pointer text-left ${
              activeTab === 'addons'
                ? 'bg-[#22242c] text-white border-l-2 border-purple-500'
                : 'text-neutral-400 hover:bg-[#191a20] hover:text-neutral-200'
            }`}
          >
            <Puzzle className="w-4 h-4 text-neutral-400" />
            <span>Manage addons</span>
          </button>
        </nav>

        {/* Current Admin User footer info */}
        <div className="p-3 bg-[#111215] border-t border-[#24252c] flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-[#242630] border border-[#343644] shrink-0 flex items-center justify-center">
            {currentUser.profilePicture ? (
              <img
                src={currentUser.profilePicture}
                alt={currentUser.username}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            ) : (
              <UserIcon className="w-4 h-4 text-neutral-400" />
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold text-neutral-200 truncate">
              {currentUser.username}
            </span>
            <span className="text-[10px] text-purple-400 font-mono">
              Developer Mode
            </span>
          </div>
        </div>
      </aside>

      {/* ================================================== */}
      {/* 2. MAIN CONTENT AREA                               */}
      {/* ================================================== */}
      <main className="flex-1 flex flex-col bg-[#111216] overflow-y-auto">
        {/* Top Header */}
        <header className="h-14 border-b border-[#24252c] bg-[#141519] px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">
              Admin /
            </span>
            <span className="text-xs font-bold text-neutral-100 capitalize">
              {activeTab === 'addons'
                ? 'Manage addons'
                : activeTab === 'action'
                ? 'Manage action'
                : activeTab === 'console'
                ? 'System Console & Audit Logs'
                : activeTab}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={refreshData}
              className="px-2.5 py-1.5 bg-[#1e2026] hover:bg-[#282a32] text-neutral-300 hover:text-white rounded-md transition-colors text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>
        </header>

        {/* Content Body */}
        <div className="p-6 max-w-6xl w-full mx-auto space-y-6">
          {/* TAB 1: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-in fade-in duration-150 text-left">
              {/* Top Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Registered Users */}
                <div className="p-4 bg-[#17181f] border border-[#262833] rounded-md flex flex-col gap-1">
                  <span className="text-xs font-medium text-neutral-400">
                    Total Registered Users
                  </span>
                  <span className="text-2xl font-black text-white font-mono">
                    {totalUsers}
                  </span>
                  <span className="text-[11px] text-emerald-400 mt-1">
                    Live registration active
                  </span>
                </div>

                {/* Male Demographics */}
                <div className="p-4 bg-[#17181f] border border-[#262833] rounded-md flex flex-col gap-1">
                  <span className="text-xs font-medium text-neutral-400">
                    Male Users
                  </span>
                  <span className="text-2xl font-black text-blue-400 font-mono">
                    {maleCount}
                  </span>
                  <span className="text-[11px] text-neutral-400 mt-1">
                    {totalUsers > 0
                      ? `${Math.round((maleCount / totalUsers) * 100)}% of total users`
                      : '0%'}
                  </span>
                </div>

                {/* Female Demographics */}
                <div className="p-4 bg-[#17181f] border border-[#262833] rounded-md flex flex-col gap-1">
                  <span className="text-xs font-medium text-neutral-400">
                    Female Users
                  </span>
                  <span className="text-2xl font-black text-pink-400 font-mono">
                    {femaleCount}
                  </span>
                  <span className="text-[11px] text-neutral-400 mt-1">
                    {totalUsers > 0
                      ? `${Math.round((femaleCount / totalUsers) * 100)}% of total users`
                      : '0%'}
                  </span>
                </div>

                {/* Other / Unspecified */}
                <div className="p-4 bg-[#17181f] border border-[#262833] rounded-md flex flex-col gap-1">
                  <span className="text-xs font-medium text-neutral-400">
                    Other / Not Specified
                  </span>
                  <span className="text-2xl font-black text-neutral-300 font-mono">
                    {otherGenderCount}
                  </span>
                  <span className="text-[11px] text-neutral-400 mt-1">
                    {totalUsers > 0
                      ? `${Math.round((otherGenderCount / totalUsers) * 100)}% of total users`
                      : '0%'}
                  </span>
                </div>
              </div>

              {/* Economy Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 bg-[#17181f] border border-[#262833] rounded-md flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-neutral-400">
                      Total Gold in Circulation
                    </span>
                    <div className="flex items-center gap-2">
                      <GoldIcon className="w-5 h-5" />
                      <span className="text-xl font-bold font-mono text-neutral-100">
                        {totalGold.toLocaleString()} Gold
                      </span>
                    </div>
                  </div>
                  <Coins className="w-8 h-8 text-amber-500/40" />
                </div>

                <div className="p-5 bg-[#17181f] border border-[#262833] rounded-md flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-neutral-400">
                      Total Rubies in Circulation
                    </span>
                    <div className="flex items-center gap-2">
                      <RubyIcon className="w-5 h-5" />
                      <span className="text-xl font-bold font-mono text-neutral-100">
                        {totalRubies.toLocaleString()} Rubies
                      </span>
                    </div>
                  </div>
                  <Coins className="w-8 h-8 text-rose-500/40" />
                </div>
              </div>

              {/* Quick Jump */}
              <div className="p-5 bg-[#17181f] border border-[#262833] rounded-md flex flex-col gap-3">
                <h3 className="text-sm font-semibold text-neutral-200">
                  Quick Management Actions
                </h3>
                <div className="flex flex-wrap gap-2.5">
                  <button
                    type="button"
                    onClick={() => setActiveTab('members')}
                    className="px-4 py-2 bg-[#22242e] hover:bg-[#2c2f3c] text-xs font-medium text-neutral-200 rounded-md transition-colors cursor-pointer flex items-center gap-2"
                  >
                    <Users className="w-3.5 h-3.5 text-purple-400" />
                    <span>View All {totalUsers} Members</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('console')}
                    className="px-4 py-2 bg-[#22242e] hover:bg-[#2c2f3c] text-xs font-medium text-neutral-200 rounded-md transition-colors cursor-pointer flex items-center gap-2"
                  >
                    <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Inspect System Console</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MANAGE MEMBERS */}
          {activeTab === 'members' && (
            <div className="space-y-4 animate-in fade-in duration-150 text-left">
              {/* Search bar */}
              <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={memberSearchQuery}
                    onChange={(e) => setMemberSearchQuery(e.target.value)}
                    placeholder="Search members by username..."
                    className="w-full pl-9 pr-4 py-2 bg-[#17181f] border border-[#282a36] rounded-md text-xs text-neutral-100 placeholder-neutral-500 outline-none focus:border-zinc-500"
                  />
                </div>
                <span className="text-xs text-neutral-400 font-mono">
                  Showing {filteredUsers.length} of {totalUsers} members
                </span>
              </div>

              {/* Members Table */}
              <div className="bg-[#17181f] border border-[#262833] rounded-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#13141a] text-neutral-400 border-b border-[#262833] uppercase text-[10px] tracking-wider font-semibold">
                      <tr>
                        <th className="py-3 px-4">User</th>
                        <th className="py-3 px-4">Rank</th>
                        <th className="py-3 px-4">Gender / Age</th>
                        <th className="py-3 px-4">Wallet</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#242632] text-neutral-300">
                      {filteredUsers.map((user) => {
                        const rankId = user.rank || (user.username.toLowerCase() === 'null' ? 'DEV' : 'VIP');
                        const rankConfig = getRankConfig(rankId);

                        return (
                          <tr
                            key={user.username}
                            className="hover:bg-[#1d1f28] transition-colors"
                          >
                            {/* User Info */}
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full overflow-hidden bg-[#242630] border border-[#343644] shrink-0 flex items-center justify-center">
                                  {user.profilePicture ? (
                                    <img
                                      src={user.profilePicture}
                                      alt={user.username}
                                      referrerPolicy="no-referrer"
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <UserIcon className="w-4 h-4 text-neutral-400" />
                                  )}
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className="font-semibold text-neutral-100 truncate">
                                    {user.username}
                                  </span>
                                  <span className="text-[11px] text-neutral-500 font-mono">
                                    @{user.username.toLowerCase().replace(/\s+/g, '')}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Rank dropdown */}
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-1.5">
                                {rankConfig && (
                                  <img
                                    src={rankConfig.iconUrl}
                                    alt={rankConfig.name}
                                    className="w-3.5 h-3.5 object-contain"
                                    referrerPolicy="no-referrer"
                                  />
                                )}
                                <select
                                  value={rankId}
                                  onChange={(e) =>
                                    handleRankChange(
                                      user.username,
                                      e.target.value as RankId
                                    )
                                  }
                                  className="bg-[#121318] border border-[#2b2d3b] text-neutral-200 text-xs rounded px-2 py-1 outline-none focus:border-zinc-500 cursor-pointer"
                                >
                                  {Object.values(RANKS)
                                    .filter((r) => r.id !== 'BOT')
                                    .map((r) => (
                                      <option key={r.id} value={r.id}>
                                        {r.name}
                                      </option>
                                    ))}
                                </select>
                              </div>
                            </td>

                            {/* Gender / Age */}
                            <td className="py-3 px-4">
                              <div className="flex flex-col">
                                <span className="capitalize text-neutral-200">
                                  {user.gender || 'Not specified'}
                                </span>
                                <span className="text-[11px] text-neutral-500">
                                  {user.age ? `Age: ${user.age}` : 'No age'}
                                </span>
                              </div>
                            </td>

                            {/* Wallet */}
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1 font-mono">
                                  <GoldIcon className="w-3.5 h-3.5" />
                                  <span>{user.wallet?.gold ?? 1000}</span>
                                </div>
                                <div className="flex items-center gap-1 font-mono">
                                  <RubyIcon className="w-3.5 h-3.5" />
                                  <span>{user.wallet?.ruby ?? 5}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCurrencyModalUser(user.username);
                                    setGiveAmount('500');
                                  }}
                                  className="px-1.5 py-0.5 bg-[#252834] hover:bg-[#323646] text-[10px] text-purple-300 rounded font-medium transition-colors cursor-pointer"
                                >
                                  + Give
                                </button>
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    onOpenProfile(user.username)
                                  }
                                  className="p-1.5 bg-[#22242e] hover:bg-[#2e313f] text-neutral-300 hover:text-white rounded transition-colors cursor-pointer"
                                  title="View/Edit Profile"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDeleteUser(user.username)
                                  }
                                  disabled={
                                    user.username.toLowerCase() ===
                                    currentUser.username.toLowerCase()
                                  }
                                  className="p-1.5 bg-red-950/40 hover:bg-red-900/60 disabled:opacity-30 text-red-300 rounded transition-colors cursor-pointer disabled:cursor-not-allowed"
                                  title="Delete User"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: SEND CUSTOM NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="space-y-6 animate-in fade-in duration-150 text-left max-w-3xl">
              <div>
                <h2 className="text-base font-bold text-neutral-100 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-purple-400" />
                  <span>Send Custom Notifications</span>
                </h2>
                <p className="text-xs text-neutral-400 mt-1">
                  Deliver instant real-time alerts with your avatar to a specific user or broadcast to all members. Any URLs included in the message automatically become clickable links!
                </p>
              </div>

              {notifSuccess && (
                <div className="p-3 bg-emerald-950/70 border border-emerald-500/40 rounded-md text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in duration-150">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{notifSuccess}</span>
                </div>
              )}

              <form onSubmit={handleSendNotification} className="bg-[#17181f] border border-[#262833] rounded-md p-5 space-y-4">
                {/* Target Recipient */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-neutral-300">
                    Target Recipient
                  </label>
                  <select
                    value={notifTarget}
                    onChange={(e) => setNotifTarget(e.target.value)}
                    className="w-full bg-[#111215] border border-[#2b2d39] text-neutral-200 text-xs rounded-md px-3.5 py-2.5 outline-none focus:border-purple-500 cursor-pointer"
                  >
                    <option value="all">📢 Broadcast to All Members (@everyone)</option>
                    <optgroup label="Specific Users">
                      {usersList.map((u) => (
                        <option key={u.username} value={u.username}>
                          @{u.username} {u.rank ? `(${u.rank})` : ''}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                {/* Message Content */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-neutral-300">
                      Notification Message
                    </label>
                    <span className="text-[11px] text-neutral-500">
                      Links (http/https) will turn into hyperlinks
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    value={notifMessage}
                    onChange={(e) => setNotifMessage(e.target.value)}
                    placeholder="Enter custom announcement or alert... e.g. Check out the new updates at https://chatlaxy.app!"
                    maxLength={300}
                    className="w-full bg-[#111215] border border-[#2b2d39] text-neutral-200 text-xs rounded-md p-3 outline-none focus:border-purple-500 placeholder-neutral-500 resize-none"
                  />
                  <div className="flex justify-between items-center text-[11px] text-neutral-500">
                    <span>Sender: <strong>@{currentUser.username}</strong></span>
                    <span>{notifMessage.length}/300</span>
                  </div>
                </div>

                {/* Live Preview Box */}
                {notifMessage.trim() && (
                  <div className="p-3 bg-[#111216] border border-[#282a36] rounded-md flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                      Live Notification Preview
                    </span>
                    <div className="flex items-start gap-2.5 mt-1">
                      <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-xs font-bold text-white shrink-0 overflow-hidden">
                        {currentUser.profilePicture ? (
                          <img src={currentUser.profilePicture} alt="" className="w-full h-full object-cover" />
                        ) : (
                          currentUser.username.slice(0, 1).toUpperCase()
                        )}
                      </div>
                      <div className="text-xs">
                        <div className="font-bold text-neutral-200">{currentUser.username}</div>
                        <div className="text-neutral-300 break-words mt-0.5">
                          {notifMessage}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Submit button */}
                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={notifSending || !notifMessage.trim()}
                    className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-xs font-bold rounded-md shadow flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{notifSending ? 'Delivering...' : 'Send Notification'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: SYSTEM CONSOLE / LOGS */}
          {activeTab === 'console' && (
            <div className="space-y-4 animate-in fade-in duration-150 text-left">
              {/* Filter and Clear controls */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  {(['all', 'chat', 'user', 'command', 'admin'] as const).map(
                    (cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setLogFilter(cat)}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors uppercase tracking-wider cursor-pointer ${
                          logFilter === cat
                            ? 'bg-purple-600 text-white'
                            : 'bg-[#1a1b22] text-neutral-400 hover:bg-[#252732] hover:text-neutral-200'
                        }`}
                      >
                        {cat}
                      </button>
                    )
                  )}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchLogQuery}
                      onChange={(e) => setSearchLogQuery(e.target.value)}
                      placeholder="Search console logs..."
                      className="w-full pl-8 pr-3 py-1.5 bg-[#17181f] border border-[#282a36] rounded-md text-xs text-neutral-100 placeholder-neutral-500 outline-none focus:border-zinc-500"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Clear all audit logs?')) {
                        clearAuditLogs();
                        setLogs([]);
                      }
                    }}
                    className="px-3 py-1.5 bg-red-950/60 hover:bg-red-900/80 border border-red-500/30 text-red-300 rounded-md text-xs font-medium transition-colors cursor-pointer shrink-0"
                  >
                    Clear Logs
                  </button>
                </div>
              </div>

              {/* Terminal Log Console Window */}
              <div className="bg-[#0b0c0f] border border-[#22242e] rounded-md p-4 font-mono text-xs shadow-2xl flex flex-col gap-2 min-h-[420px] max-h-[600px] overflow-y-auto">
                <div className="flex items-center justify-between pb-2 border-b border-[#1f212c] text-neutral-500 text-[11px]">
                  <span>SYSTEM AUDIT CONSOLE // REAL-TIME LOG STREAM</span>
                  <span>{filteredLogs.length} EVENTS</span>
                </div>

                {filteredLogs.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-neutral-600 italic py-16">
                    No log events found matching the criteria.
                  </div>
                ) : (
                  <div className="space-y-2 pt-1">
                    {filteredLogs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-start gap-3 hover:bg-[#141620] p-1.5 rounded transition-colors"
                      >
                        {/* Timestamp */}
                        <span className="text-neutral-500 shrink-0 text-[11px]">
                          [{log.formattedTime}]
                        </span>

                        {/* Category Badge */}
                        <span
                          className={`px-1.5 py-0.2 rounded text-[10px] uppercase font-bold shrink-0 ${
                            log.category === 'admin'
                              ? 'bg-purple-950/80 text-purple-300 border border-purple-500/40'
                              : log.category === 'chat'
                              ? 'bg-blue-950/80 text-blue-300 border border-blue-500/40'
                              : log.category === 'command'
                              ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
                              : 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                          }`}
                        >
                          {log.category}
                        </span>

                        {/* Actor */}
                        <span className="text-purple-300 font-bold shrink-0">
                          {log.actor}
                        </span>

                        {/* Action & Details */}
                        <div className="flex-1 min-w-0">
                          <span className="text-neutral-200 font-semibold">
                            {log.action}
                          </span>
                          {log.details && (
                            <span className="text-neutral-400 ml-2 break-all">
                              &rarr; {log.details}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: MANAGE ACTION (Placeholder as requested) */}
          {activeTab === 'action' && (
            <div className="bg-[#17181f] border border-[#262833] rounded-md p-12 text-center flex flex-col items-center justify-center gap-3 animate-in fade-in duration-150">
              <Zap className="w-10 h-10 text-neutral-600" />
              <h3 className="text-sm font-bold text-neutral-200">
                Manage Actions
              </h3>
              <p className="text-xs text-neutral-500 max-w-md">
                There are no automated actions configured yet. Custom triggers,
                auto-moderation filters, and event listeners will appear here.
              </p>
            </div>
          )}

          {/* TAB 5: MANAGE ADDONS / PLUGINS (Placeholder as requested) */}
          {activeTab === 'addons' && (
            <div className="bg-[#17181f] border border-[#262833] rounded-md p-12 text-center flex flex-col items-center justify-center gap-3 animate-in fade-in duration-150">
              <Puzzle className="w-10 h-10 text-neutral-600" />
              <h3 className="text-sm font-bold text-neutral-200">
                Manage Addons & Plugins
              </h3>
              <p className="text-xs text-neutral-500 max-w-md">
                No active plugins or modular extensions are installed. Installed
                system modules will be listed here.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* ================================================== */}
      {/* 3. GIVE CURRENCY MODAL DIALOG                      */}
      {/* ================================================== */}
      {currencyModalUser && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-100">
          <div className="w-full max-w-sm bg-[#181920] border border-[#2d2f3d] rounded-md p-5 shadow-2xl flex flex-col gap-4 text-left">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
                <Coins className="w-4 h-4 text-purple-400" />
                <span>Grant Currency to {currencyModalUser}</span>
              </h3>
              <button
                type="button"
                onClick={() => setCurrencyModalUser(null)}
                className="p-1 text-neutral-400 hover:text-white rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Currency Type Selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-neutral-400">
                Select Currency
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setGiveCurrencyType('gold')}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded text-xs font-bold border transition-colors cursor-pointer ${
                    giveCurrencyType === 'gold'
                      ? 'bg-amber-950/60 border-amber-500 text-amber-300'
                      : 'bg-[#121318] border-[#292b37] text-neutral-400'
                  }`}
                >
                  <GoldIcon className="w-4 h-4" />
                  <span>Gold</span>
                </button>
                <button
                  type="button"
                  onClick={() => setGiveCurrencyType('ruby')}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded text-xs font-bold border transition-colors cursor-pointer ${
                    giveCurrencyType === 'ruby'
                      ? 'bg-rose-950/60 border-rose-500 text-rose-300'
                      : 'bg-[#121318] border-[#292b37] text-neutral-400'
                  }`}
                >
                  <RubyIcon className="w-4 h-4" />
                  <span>Rubies</span>
                </button>
              </div>
            </div>

            {/* Amount input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-neutral-400">
                Amount
              </label>
              <input
                type="number"
                value={giveAmount}
                onChange={(e) => setGiveAmount(e.target.value)}
                placeholder="Amount to grant..."
                className="w-full px-3 py-2 bg-[#121318] border border-[#2b2d3c] rounded text-xs text-neutral-100 outline-none focus:border-zinc-500 font-mono"
              />
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCurrencyModalUser(null)}
                className="px-3 py-1.5 bg-[#20222a] hover:bg-[#2a2d38] text-neutral-300 rounded text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleGiveCurrency}
                className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded text-xs transition-colors shadow-sm cursor-pointer"
              >
                Confirm Grant
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
