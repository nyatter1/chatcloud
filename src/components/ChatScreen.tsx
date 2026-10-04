import React, { useState, useRef, useEffect } from 'react';
import { Send, X, User, Sparkles, AlertCircle, Info, Menu, Bell } from 'lucide-react';
import { ChatMessage, ReplyContext } from '../types/chat';
import { ProfileData } from '../types/bio';
import { ChatMessageItem } from './ChatMessageItem';
import { ProfileMenuDropdown } from './ProfileMenuDropdown';
import { OnlinePlayersPanel } from './OnlinePlayersPanel';
import { ProfileModal } from './ProfileModal';
import { ChatBackgroundModal } from './ChatBackgroundModal';
import { HamburgerMenuDrawer } from './HamburgerMenuDrawer';
import { DailyRewardsModal } from './DailyRewardsModal';
import { AvatarFrameStudioModal } from './AvatarFrameStudioModal';
import { ProfileDecorationsModal } from './ProfileDecorationsModal';
import { UserAvatar } from './UserAvatar';
import { NewsPanel } from './NewsPanel';
import { NewsComposer } from './NewsComposer';
import { ChatlaxyLogo } from './ChatlaxyLogo';
import { NotificationsDropdown } from './NotificationsDropdown';
import { AppNotification } from '../types/notifications';
import { NewsPost, NewsReactionType } from '../types/news';
import { handleChatCommand } from '../utils/commandHandler';
import { isFounderOrAbove } from '../utils/permissions';
import { addAuditLog } from '../utils/auditLogger';
import {
  subscribeToMessages,
  sendMessageToFirestore,
  deleteMessageFromFirestore,
  clearAllMessagesInFirestore,
  subscribeToUsers,
  saveUserToFirestore,
  subscribeToNews,
  createNewsPostInFirestore,
  deleteNewsPostFromFirestore,
  updateNewsPostInFirestore,
  subscribeToUserNotifications,
  deleteNotificationFromFirestore,
  clearAllNotificationsForUser,
  getServers,
  createServer,
  joinServer,
  leaveServer,
  getServerMembers,
  updateMemberRoles,
  getServerChannels,
  createChannel,
  getServerRoles,
  createServerRole,
  deleteServerRole,
  ServerRole,
  ServerChannel,
  ServerData,
  ServerMember,
} from '../services/apiService';

interface ChatScreenProps {
  currentUser: ProfileData;
  onLogout: () => void;
  onUpdateCurrentUser: (profile: ProfileData) => void;
  onEditProfile?: () => void;
  onOpenAdminPanel?: () => void;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({
  currentUser,
  onLogout,
  onUpdateCurrentUser,
  onOpenAdminPanel,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [allUsers, setAllUsers] = useState<Record<string, ProfileData>>({});
  const [hiddenMessageIds, setHiddenMessageIds] = useState<Set<string>>(new Set());
  const [inputText, setInputText] = useState('');
  const [replyContext, setReplyContext] = useState<ReplyContext | null>(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false);
  const [isDailyRewardsOpen, setIsDailyRewardsOpen] = useState(false);
  const [isAvatarFramesOpen, setIsAvatarFramesOpen] = useState(false);
  const [isProfileDecorationsOpen, setIsProfileDecorationsOpen] = useState(false);
  const [isNewsOpen, setIsNewsOpen] = useState(false);
  const [hasUnreadNews, setHasUnreadNews] = useState(false);
  const [newsPosts, setNewsPosts] = useState<NewsPost[]>([]);
  const [isComposerModalOpen, setIsComposerModalOpen] = useState(false);
  const [activeProfileTarget, setActiveProfileTarget] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const [isChatBgModalOpen, setIsChatBgModalOpen] = useState(false);
  const [previewChatBackground, setPreviewChatBackground] = useState<string | null>(
    currentUser.chatBackground || null
  );
  const [privateNotice, setPrivateNotice] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Server, Channel & Role State
  const [servers, setServers] = useState<ServerData[]>([]);
  const [activeServer, setActiveServer] = useState<ServerData | null>(null);
  const [channels, setChannels] = useState<ServerChannel[]>([]);
  const [activeChannel, setActiveChannel] = useState<ServerChannel | null>(null);
  const [serverRoles, setServerRoles] = useState<ServerRole[]>([]);
  const [serverMembers, setServerMembers] = useState<ServerMember[]>([]);
  const [isCreateServerOpen, setIsCreateServerOpen] = useState(false);
  const [newServerName, setNewServerName] = useState('');
  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [isManageRolesOpen, setIsManageRolesOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleColour, setNewRoleColour] = useState('#99aab5');
  const [isExploreOpen, setIsExploreOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadServerConfig = async () => {
    const list = await getServers();
    setServers(list);
  };

  useEffect(() => {
    loadServerConfig();
  }, []);

  useEffect(() => {
    if (activeServer) {
      getServerChannels(activeServer.id).then((list) => {
        setChannels(list);
        if (list && list.length > 0) {
          setActiveChannel(list[0]);
        } else {
          setActiveChannel(null);
        }
      });
      getServerRoles(activeServer.id).then(setServerRoles);
      getServerMembers(activeServer.id).then(setServerMembers);
    } else {
      setChannels([]);
      setActiveChannel(null);
      setServerRoles([]);
      setServerMembers([]);
    }
  }, [activeServer?.id]);

  const handleCreateServer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServerName.trim()) return;
    const s = await createServer(newServerName.trim(), currentUser.username);
    if (s) {
      setServers((prev) => [...prev, s]);
      setActiveServer(s);
      setIsCreateServerOpen(false);
      setNewServerName('');
    }
  };

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeServer || !newChannelName.trim()) return;
    const ch = await createChannel(activeServer.id, newChannelName.trim());
    if (ch) {
      setChannels((prev) => [...prev, ch]);
      setActiveChannel(ch);
      setIsCreateChannelOpen(false);
      setNewChannelName('');
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeServer || !newRoleName.trim()) return;
    const r = await createServerRole(activeServer.id, { name: newRoleName.trim(), colour: newRoleColour });
    if (r) {
      setServerRoles((prev) => [...prev, r]);
      setNewRoleName('');
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!activeServer) return;
    const success = await deleteServerRole(activeServer.id, roleId);
    if (success) {
      setServerRoles((prev) => prev.filter((r) => r.id !== roleId));
    }
  };

  const handleJoinServer = async (serverId: string) => {
    const success = await joinServer(serverId, currentUser.username);
    if (success) {
      loadServerConfig();
      const s = servers.find((sv) => sv.id === serverId) || { id: serverId, name: 'Joined Server', owner: '' };
      setActiveServer(s);
      setIsExploreOpen(false);
    }
  };

  const handleLeaveServer = async (serverId: string) => {
    const success = await leaveServer(serverId, currentUser.username);
    if (success) {
      loadServerConfig();
      setActiveServer(null);
    }
  };

  // 1. Subscribe to Live Messages (filtered by server and channel if active)
  useEffect(() => {
    const unsubscribe = subscribeToMessages((liveMessages) => {
      setMessages(liveMessages);
    }, activeServer?.id || null, activeChannel?.id || null);
    return () => unsubscribe();
  }, [activeServer?.id, activeChannel?.id]);

  // 2. Subscribe to Live Registered Users
  useEffect(() => {
    const unsubscribe = subscribeToUsers((usersMap) => {
      setAllUsers(usersMap);
    });
    return () => unsubscribe();
  }, []);

  // 3. Subscribe to Live Firestore News Announcements
  useEffect(() => {
    const lastRead = Number(localStorage.getItem('chatlaxy_last_read_news_time') || '0');
    const unsubscribe = subscribeToNews((posts) => {
      setNewsPosts(posts);
      if (posts.length > 0) {
        const latestTs = Math.max(...posts.map((p) => p.timestamp));
        if (latestTs > lastRead && !isNewsOpen) {
          setHasUnreadNews(true);
        }
      } else {
        setHasUnreadNews(false);
      }
    });
    return () => unsubscribe();
  }, [isNewsOpen]);

  // 4. Subscribe to Live User Notifications
  useEffect(() => {
    if (!currentUser.username) return;
    const lastReadNotif = Number(
      localStorage.getItem(`chatlaxy_last_read_notif_${currentUser.username.toLowerCase()}`) || '0'
    );

    const unsubscribe = subscribeToUserNotifications(currentUser.username, (notifs) => {
      setNotifications(notifs);
      if (notifs.length > 0) {
        const latestTs = Math.max(...notifs.map((n) => n.timestamp));
        if (latestTs > lastReadNotif && !isNotificationsOpen) {
          setHasUnreadNotifications(true);
        }
      } else {
        setHasUnreadNotifications(false);
      }
    });
    return () => unsubscribe();
  }, [currentUser.username, isNotificationsOpen]);

  // Open & Mark Notifications Read
  const handleToggleNotifications = () => {
    setIsNotificationsOpen((prev) => {
      const next = !prev;
      if (next) {
        setHasUnreadNotifications(false);
        localStorage.setItem(
          `chatlaxy_last_read_notif_${currentUser.username.toLowerCase()}`,
          Date.now().toString()
        );
      }
      return next;
    });
  };

  // Clear all notifications for current user
  const handleClearAllNotifications = async () => {
    try {
      await clearAllNotificationsForUser(currentUser.username);
      setNotifications([]);
      setHasUnreadNotifications(false);
    } catch (err) {
      console.error('Error clearing notifications:', err);
    }
  };

  // Delete single notification
  const handleDeleteNotification = async (id: string) => {
    try {
      await deleteNotificationFromFirestore(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  // 4. Auto-sync missing user profile pictures and banners from chat messages & active session into Firestore
  useEffect(() => {
    if (messages.length === 0) return;

    const updatesToSave: Record<string, ProfileData> = {};

    messages.forEach((msg) => {
      if (msg.senderAvatar && msg.senderName && !msg.isSystemBot) {
        const key = msg.senderName.toLowerCase().trim();
        const existingUser = allUsers[key];
        if (existingUser && !existingUser.profilePicture) {
          updatesToSave[key] = {
            ...existingUser,
            profilePicture: msg.senderAvatar,
          };
        }
      }
    });

    if (currentUser.profilePicture || currentUser.banner) {
      const currentKey = currentUser.username.toLowerCase().trim();
      const existingUser = allUsers[currentKey];
      if (
        existingUser &&
        (!existingUser.profilePicture || !existingUser.banner)
      ) {
        updatesToSave[currentKey] = {
          ...existingUser,
          profilePicture: currentUser.profilePicture || existingUser.profilePicture || null,
          banner: currentUser.banner || existingUser.banner || null,
        };
      }
    }

    const keysToUpdate = Object.keys(updatesToSave);
    if (keysToUpdate.length > 0) {
      keysToUpdate.forEach(async (key) => {
        const profile = updatesToSave[key];
        try {
          await saveUserToFirestore(profile);
        } catch (err) {
          console.warn(`Failed to sync profile for ${key}:`, err);
        }
      });
    }
  }, [messages, allUsers, currentUser]);

  // Auto-dismiss private notice after 6s
  useEffect(() => {
    if (privateNotice) {
      const timer = setTimeout(() => {
        setPrivateNotice(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [privateNotice]);

  // Sync previewChatBackground whenever currentUser.chatBackground updates
  useEffect(() => {
    setPreviewChatBackground(currentUser.chatBackground || null);
  }, [currentUser.chatBackground]);

  // Auto-scroll to latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, hiddenMessageIds]);

  // Handle message sending
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed) return;

    // Check if input is a command (e.g. /dice, /allin, /daily, /give, /rig, /clear)
    if (trimmed.startsWith('/')) {
      const commandResult = handleChatCommand(trimmed, currentUser);
      if (commandResult.isCommand) {
        setInputText('');
        setReplyContext(null);

        // Update wallet / profile persistently
        if (commandResult.updatedProfile) {
          onUpdateCurrentUser(commandResult.updatedProfile);
        }

        // If clearChat is requested (/clear dev command)
        if (commandResult.clearChat) {
          setHiddenMessageIds(new Set());
          await clearAllMessagesInFirestore(commandResult.publicMessage);
        } else if (commandResult.publicMessage) {
          // Send public message to live Firestore chat
          await sendMessageToFirestore(commandResult.publicMessage);
        }

        // Show private feedback notice if present (e.g. /daily rewards, error notices)
        if (commandResult.privateFeedback) {
          setPrivateNotice(commandResult.privateFeedback);
        }

        setTimeout(() => {
          inputRef.current?.focus();
        }, 10);
        return;
      }
    }

    // Daily message counting
    const todayKey = new Date().toISOString().slice(0, 10);
    const isSameDay = currentUser.dailyMessagesDate === todayKey;
    const nextCount = isSameDay ? (currentUser.dailyMessagesCount || 0) + 1 : 1;
    const nextClaimed = isSameDay ? currentUser.claimedDailyMilestones || [] : [];

    const updatedUser: ProfileData = {
      ...currentUser,
      dailyMessagesDate: todayKey,
      dailyMessagesCount: nextCount,
      claimedDailyMilestones: nextClaimed,
    };
    onUpdateCurrentUser(updatedUser);
    saveUserToFirestore(updatedUser);

    const now = new Date();
    const formattedTime = now.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
    });

    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      senderId: 'user',
      senderName: currentUser.username,
      senderHandle: `@${currentUser.username.toLowerCase().replace(/\s+/g, '')}`,
      senderAvatar: currentUser.profilePicture,
      senderAvatarFrame: currentUser.avatarFrame || currentUser.effects?.pfpBorder || null,
      senderCustomRankName: currentUser.customRankName || null,
      senderUsernameStyle: currentUser.usernameStyle || null,
      contentStyle: currentUser.chatTextStyle || null,
      isSystemBot: false,
      content: trimmed,
      timestamp: Date.now(),
      formattedTime,
      serverId: activeServer?.id || null,
      channelId: activeChannel?.id || null,
    } as any;

    setInputText('');
    setReplyContext(null);

    // Save to Live Firestore Realtime Database
    try {
      await sendMessageToFirestore(newMessage);
    } catch (err) {
      console.error('Error sending message to Firestore:', err);
      // Fallback local state if offline
      setMessages((prev) => [...prev, newMessage]);
    }

    setTimeout(() => {
      inputRef.current?.focus();
    }, 10);
  };

  // Claim a daily message reward
  const handleClaimDailyReward = async (milestoneCount: number, gold: number, rubies: number) => {
    const todayKey = new Date().toISOString().slice(0, 10);
    const currentClaimed =
      currentUser.dailyMessagesDate === todayKey
        ? currentUser.claimedDailyMilestones || []
        : [];
    if (currentClaimed.includes(milestoneCount)) return;

    const updated: ProfileData = {
      ...currentUser,
      dailyMessagesDate: todayKey,
      claimedDailyMilestones: [...currentClaimed, milestoneCount],
      wallet: {
        gold: (currentUser.wallet?.gold || 0) + gold,
        ruby: (currentUser.wallet?.ruby || 0) + rubies,
      },
    };

    onUpdateCurrentUser(updated);
    await saveUserToFirestore(updated);
    addAuditLog(
      currentUser.username,
      'Claimed Daily Reward',
      `Claimed milestone ${milestoneCount} messages: +${gold} Gold, +${rubies} Rubies`,
      'user'
    );
  };

  // Select an avatar frame
  const handleSelectAvatarFrame = async (frameId: string | null) => {
    const updated: ProfileData = {
      ...currentUser,
      avatarFrame: frameId,
      effects: {
        ...currentUser.effects,
        pfpBorder: frameId || undefined,
      },
    };

    onUpdateCurrentUser(updated);
    await saveUserToFirestore(updated);
    addAuditLog(
      currentUser.username,
      'Equipped Avatar Frame',
      `Equipped avatar frame: ${frameId || 'none'}`,
      'user'
    );
  };

  // Open News panel & clear unread notifications
  const handleOpenNews = () => {
    setHasUnreadNews(false);
    localStorage.setItem('chatlaxy_last_read_news_time', Date.now().toString());
    setIsNewsOpen(true);
  };

  // Publish a new announcement
  const handlePublishNews = async (
    content: string,
    mediaUrl?: string | null,
    mediaType?: 'image' | 'video' | 'gif' | null
  ) => {
    if (!isFounderOrAbove(currentUser)) return;

    const newPost: NewsPost = {
      id: `news_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      authorUsername: currentUser.username,
      authorAvatar: currentUser.profilePicture,
      authorAvatarFrame: currentUser.avatarFrame || currentUser.effects?.pfpBorder,
      authorRank: currentUser.rank || 'DEV',
      content,
      mediaUrl: mediaUrl || null,
      mediaType: mediaType || null,
      timestamp: Date.now(),
      reactions: {
        like: [],
        dislike: [],
        heart: [],
        laugh: [],
      },
      comments: [],
    };

    await createNewsPostInFirestore(newPost);
    addAuditLog(
      currentUser.username,
      'Published News Post',
      `Published news: "${content.slice(0, 35)}..."`,
      'admin'
    );
    handleOpenNews();
  };

  // Delete a news post
  const handleDeleteNewsPost = async (postId: string) => {
    if (!isFounderOrAbove(currentUser)) return;
    await deleteNewsPostFromFirestore(postId);
    addAuditLog(
      currentUser.username,
      'Deleted News Post',
      `Deleted news post ID: ${postId}`,
      'admin'
    );
  };

  // Toggle user reaction on a news post
  const handleToggleNewsReaction = async (postId: string, reaction: NewsReactionType) => {
    const post = newsPosts.find((p) => p.id === postId);
    if (!post) return;

    const username = currentUser.username;
    const currentList = post.reactions[reaction] || [];
    const hasReacted = currentList.includes(username);

    const updatedList = hasReacted
      ? currentList.filter((u) => u !== username)
      : [...currentList, username];

    const updatedPost: NewsPost = {
      ...post,
      reactions: {
        ...post.reactions,
        [reaction]: updatedList,
      },
    };

    await updateNewsPostInFirestore(updatedPost);
  };

  // Add comment to a news post
  const handleAddNewsComment = async (postId: string, content: string) => {
    const post = newsPosts.find((p) => p.id === postId);
    if (!post) return;

    const newComment = {
      id: `comm_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      authorUsername: currentUser.username,
      authorAvatar: currentUser.profilePicture,
      authorAvatarFrame: currentUser.avatarFrame || currentUser.effects?.pfpBorder,
      content,
      timestamp: Date.now(),
    };

    const updatedPost: NewsPost = {
      ...post,
      comments: [...(post.comments || []), newComment],
    };

    await updateNewsPostInFirestore(updatedPost);
  };

  // Delete comment from a news post
  const handleDeleteNewsComment = async (postId: string, commentId: string) => {
    if (!isFounderOrAbove(currentUser)) return;
    const post = newsPosts.find((p) => p.id === postId);
    if (!post) return;

    const updatedPost: NewsPost = {
      ...post,
      comments: (post.comments || []).filter((c) => c.id !== commentId),
    };

    await updateNewsPostInFirestore(updatedPost);
  };

  // Handle reply button clicked on message menu
  const handleReply = (message: ChatMessage) => {
    setReplyContext({
      messageId: message.id,
      senderName: message.senderName,
      content: message.content,
    });
    inputRef.current?.focus();
  };

  // Handle hiding a message locally
  const handleHide = (id: string) => {
    setHiddenMessageIds((prev) => new Set(prev).add(id));
  };

  // Handle deleting message (self or moderator/dev)
  const handleDelete = async (id: string) => {
    const msg = messages.find((m) => m.id === id);
    if (msg) {
      addAuditLog(
        currentUser.username,
        'Deleted Message',
        `${currentUser.username} deleted a message by ${msg.senderName}: "${msg.content.slice(0, 40)}"`,
        'chat'
      );
    }
    // Delete from Firestore
    try {
      await deleteMessageFromFirestore(id);
    } catch (err) {
      console.error('Error deleting message from Firestore:', err);
    }
    setMessages((prev) => prev.filter((m) => m.id !== id));
  };

  // Handle selecting profile decoration
  const handleSelectProfileDecoration = async (decorationId: string | null) => {
    const updated: ProfileData = {
      ...currentUser,
      profileDecoration: decorationId,
    };
    onUpdateCurrentUser(updated);
    try {
      await saveUserToFirestore(updated);
    } catch (err) {
      console.warn('Failed to save profile decoration to Firestore:', err);
    }
  };

  // Visible messages (filtered by hidden IDs)
  const visibleMessages = messages.filter((m) => !hiddenMessageIds.has(m.id));

  return (
    <div className="flex flex-col h-screen w-full bg-[#121316] text-neutral-100 overflow-hidden select-none">
      {/* ================================================== */}
      {/* TOP BAR                                           */}
      {/* Left: Hamburger button + Big Logo.                */}
      {/* Right: User's profile picture only.               */}
      {/* ================================================== */}
      <header className="h-14 sm:h-16 pl-2 sm:pl-3 pr-4 sm:pr-6 bg-[#16171b] border-b border-[#25262d] flex items-center justify-between shrink-0 z-20 relative">
        {/* Left: Hamburger Menu (Opens sidebar) + Static Chatlaxy Logo Text */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => setIsHamburgerOpen((prev) => !prev)}
            aria-label="Open navigation menu"
            className="relative p-1.5 sm:p-2 text-neutral-300 hover:text-white hover:bg-[#20222c] rounded-xs transition-colors cursor-pointer shrink-0"
          >
            <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
            {hasUnreadNews && (
              <span className="absolute top-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-[#16171b] animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.9)]" />
            )}
          </button>
          <ChatlaxyLogo size="md" />
        </div>

        {/* Top Right: Bell Notifications Button + User's Profile Picture */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Bell Notifications Button */}
          <button
            type="button"
            onClick={handleToggleNotifications}
            aria-label="Open notifications"
            className="relative p-2 text-neutral-300 hover:text-white hover:bg-[#20222c] rounded-full transition-colors cursor-pointer"
          >
            <Bell className="w-5 h-5 sm:w-5.5 sm:h-5.5 fill-current/10" />
            {hasUnreadNotifications && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-[#16171b] animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.9)]" />
            )}
          </button>

          {/* User's profile picture with active Avatar Frame */}
          <button
            type="button"
            onClick={() => setIsProfileMenuOpen((prev) => !prev)}
            aria-label="Open profile menu"
            className="focus:outline-none cursor-pointer transition-transform hover:scale-105"
          >
            <UserAvatar
              src={currentUser.profilePicture}
              username={currentUser.username}
              frameId={currentUser.avatarFrame || currentUser.effects?.pfpBorder}
              size="sm"
              shape="circle"
            />
          </button>
        </div>

        {/* Notifications Dropdown */}
        <NotificationsDropdown
          isOpen={isNotificationsOpen}
          notifications={notifications}
          onClose={() => setIsNotificationsOpen(false)}
          onClearAll={handleClearAllNotifications}
          onDeleteNotification={handleDeleteNotification}
          onOpenProfile={(username) => setActiveProfileTarget(username)}
        />

        {/* Profile Menu Dropdown (Includes Chat background & functional Wallet & Admin panel) */}
        <ProfileMenuDropdown
          profile={currentUser}
          isOpen={isProfileMenuOpen}
          onClose={() => setIsProfileMenuOpen(false)}
          onLogout={onLogout}
          onOpenProfile={() => setActiveProfileTarget('current_user')}
          onOpenChatBackground={() => setIsChatBgModalOpen(true)}
          onOpenAdminPanel={onOpenAdminPanel}
        />
      </header>

      {/* ================================================== */}
      {/* MAIN BODY: NEWS (PINNED LEFT) + CHAT + ONLINE PANEL*/}
      {/* ================================================== */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Pinned News Panel on Left (NOT over the chat) */}
        {isNewsOpen && (
          <NewsPanel
            currentUser={currentUser}
            newsPosts={newsPosts}
            onClose={() => setIsNewsOpen(false)}
            onOpenProfile={(username) => setActiveProfileTarget(username)}
            onDeletePost={handleDeleteNewsPost}
            onToggleReaction={handleToggleNewsReaction}
            onAddComment={handleAddNewsComment}
            onDeleteComment={handleDeleteNewsComment}
            onOpenCreateNews={
              isFounderOrAbove(currentUser) ? () => setIsComposerModalOpen(true) : undefined
            }
          />
        )}

        {/* Leftmost Vertical Server Strip */}
        <div className="w-16 bg-[#0f1013] border-r border-[#1a1b24] flex flex-col items-center py-4 gap-3 shrink-0 z-10">
          {/* Global Lobby Button */}
          <button
            type="button"
            onClick={() => setActiveServer(null)}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer text-white font-bold relative group ${
              activeServer === null
                ? 'bg-zinc-200 text-zinc-900 rounded-2xl'
                : 'bg-[#1e2029] hover:bg-zinc-700 hover:rounded-2xl'
            }`}
            title="Global Chatlaxy"
          >
            G
            {activeServer === null && (
              <span className="absolute left-0 w-1 h-5 bg-white rounded-r-md top-1/2 -translate-y-1/2" />
            )}
          </button>

          <div className="w-8 h-[2px] bg-neutral-800 rounded-full" />

          {/* Servers list */}
          <div className="flex-1 flex flex-col gap-2 w-full items-center overflow-y-auto no-scrollbar">
            {servers.map((s) => {
              const isActive = activeServer?.id === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActiveServer(s)}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer font-bold relative group text-xs text-neutral-200 ${
                    isActive
                      ? 'bg-zinc-200 text-zinc-900 rounded-2xl'
                      : 'bg-[#1e2029] hover:bg-zinc-700 hover:rounded-2xl'
                  }`}
                  title={s.name}
                >
                  {s.iconUrl ? (
                    <img src={s.iconUrl} alt={s.name} className="w-full h-full object-cover rounded-inherit" />
                  ) : (
                    <span>{s.name.slice(0, 2).toUpperCase()}</span>
                  )}
                  {isActive && (
                    <span className="absolute left-0 w-1 h-5 bg-white rounded-r-md top-1/2 -translate-y-1/2" />
                  )}
                </button>
              );
            })}

            {/* Create Server Button */}
            <button
              type="button"
              onClick={() => setIsCreateServerOpen(true)}
              className="w-12 h-12 rounded-full bg-[#1e2029] hover:bg-emerald-600 hover:text-white flex items-center justify-center text-emerald-400 font-bold transition-all cursor-pointer text-xl"
              title="Create Server"
            >
              +
            </button>
            
            {/* Explore Servers Button */}
            <button
              type="button"
              onClick={() => setIsExploreOpen(true)}
              className="w-12 h-12 rounded-full bg-[#1e2029] hover:bg-purple-600 hover:text-white flex items-center justify-center text-purple-400 font-bold transition-all cursor-pointer text-sm font-black"
              title="Explore Servers"
            >
              EXP
            </button>
          </div>
        </div>

        {/* Channels list Strip (rendered if a server is active) */}
        {activeServer && (
          <div className="w-40 bg-[#131419] border-r border-[#1f2029] flex flex-col shrink-0 z-10 animate-in slide-in-from-left duration-150">
            {/* Server Header */}
            <div className="p-3 border-b border-[#1f2029] flex flex-col gap-1 bg-[#16171d]">
              <span className="text-xs font-extrabold text-neutral-100 truncate">{activeServer.name}</span>
              <div className="flex gap-1.5 mt-1">
                <button
                  type="button"
                  onClick={() => setIsManageRolesOpen(true)}
                  className="text-[10px] bg-[#24252f] hover:bg-zinc-700 text-neutral-300 font-bold py-0.5 px-1.5 rounded-xs cursor-pointer"
                >
                  Roles
                </button>
                <button
                  type="button"
                  onClick={() => handleLeaveServer(activeServer.id)}
                  className="text-[10px] bg-red-950 hover:bg-red-900 text-red-300 font-bold py-0.5 px-1.5 rounded-xs cursor-pointer ml-auto"
                >
                  Leave
                </button>
              </div>
            </div>

            {/* Channels Header */}
            <div className="p-2 flex items-center justify-between text-neutral-400 text-[9px] font-black uppercase tracking-wider">
              <span>Channels</span>
              <button
                type="button"
                onClick={() => setIsCreateChannelOpen(true)}
                className="text-neutral-400 hover:text-white text-xs font-bold px-1 cursor-pointer"
              >
                +
              </button>
            </div>

            {/* Channel list */}
            <div className="flex-1 overflow-y-auto px-1 flex flex-col gap-0.5">
              {channels.map((ch) => {
                const isChActive = activeChannel?.id === ch.id;
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => setActiveChannel(ch)}
                    className={`w-full text-left text-xs px-2 py-1 rounded-xs transition-colors cursor-pointer truncate flex items-center gap-1 ${
                      isChActive
                        ? 'bg-[#20222c] text-white font-semibold'
                        : 'text-neutral-400 hover:text-neutral-200 hover:bg-[#1a1b24]'
                    }`}
                  >
                    <span>#</span>
                    <span className="truncate">{ch.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Chat Section (With Custom Chat Background Support) */}
        <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-[#121316]">
          {/* Custom Chat Background Image Layer - ONLY covers chat area */}
          {previewChatBackground && (
            <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
              <img
                src={previewChatBackground}
                alt="Chat background"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              {/* Dark subtle overlay so messages remain clearly readable */}
              <div className="absolute inset-0 bg-[#121316]/40 backdrop-blur-[0.5px]" />
            </div>
          )}

          {/* Scrollable message list (full-width rectangular rows) */}
          <main className="flex-1 overflow-y-auto flex flex-col w-full relative z-10">
            {visibleMessages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 my-auto select-none">
                <span className="text-sm font-medium text-neutral-400 bg-[#121316]/75 px-3 py-1.5 rounded-xs border border-[#23242c]">
                  No messages yet. Send a message or roll the dice!
                </span>
              </div>
            ) : (
              <div className="flex flex-col w-full">
                {visibleMessages.map((msg, index) => {
                  const isCurrentUser = msg.senderId === 'user';
                  // Alternating background: even is slightly lighter dark, odd is darker underneath
                  const isAlternateBg = index % 2 === 1;

                  const senderProfile =
                    allUsers[msg.senderName.toLowerCase().trim()] ||
                    (msg.senderName.toLowerCase().trim() === currentUser.username.toLowerCase().trim()
                      ? currentUser
                      : null);

                  return (
                    <ChatMessageItem
                      key={msg.id}
                      message={msg}
                      isCurrentUser={isCurrentUser}
                      isAlternateBg={isAlternateBg}
                      canModerate={isFounderOrAbove(currentUser)}
                      senderProfile={senderProfile}
                      onReply={handleReply}
                      onHide={handleHide}
                      onDelete={handleDelete}
                      onOpenProfile={(target) => setActiveProfileTarget(target)}
                    />
                  );
                })}
              </div>
            )}
            <div ref={messagesEndRef} className="h-2" />
          </main>

          {/* Fixed Message Input at bottom of chat */}
          <footer className="w-full bg-[#16171b] border-t border-[#25262d] px-4 py-3 shrink-0 z-10">
            <div className="max-w-4xl mx-auto flex flex-col gap-1.5">
              {/* Private Notice Banner (e.g. for /daily or command error alerts) */}
              {privateNotice && (
                <div
                  className={`flex items-center justify-between px-3 py-1.5 rounded-md text-xs animate-in fade-in duration-150 border ${
                    privateNotice.type === 'success'
                      ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200'
                      : privateNotice.type === 'error'
                      ? 'bg-red-950/80 border-red-500/40 text-red-200'
                      : 'bg-[#1e202b] border-[#34374a] text-neutral-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {privateNotice.type === 'success' && (
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    )}
                    {privateNotice.type === 'error' && (
                      <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    )}
                    {privateNotice.type === 'info' && (
                      <Info className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    )}
                    <span className="font-medium">{privateNotice.message}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPrivateNotice(null)}
                    aria-label="Dismiss notice"
                    className="p-0.5 text-neutral-400 hover:text-white rounded transition-colors ml-2 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Reply indicator banner if active */}
              {replyContext && (
                <div className="flex items-center justify-between px-3 py-1.5 bg-[#1f2129] border border-[#2e303c] rounded-md text-xs text-neutral-300 animate-in fade-in duration-150">
                  <div className="flex items-center gap-2 truncate">
                    <span className="font-semibold text-neutral-200">
                      Replying to {replyContext.senderName}:
                    </span>
                    <span className="text-neutral-400 truncate">
                      &ldquo;{replyContext.content}&rdquo;
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReplyContext(null)}
                    aria-label="Cancel reply"
                    className="p-0.5 text-neutral-400 hover:text-neutral-200 rounded transition-colors ml-2 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Input Form */}
              <form
                onSubmit={handleSendMessage}
                className="flex items-center gap-2 w-full"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type a message or command (/dice, /allin, /daily)..."
                  className="flex-1 px-4 py-2.5 bg-[#111215] border border-[#2c2d35] hover:border-zinc-600 focus:border-zinc-400 rounded-md text-sm text-neutral-100 placeholder-neutral-500 outline-none transition-colors"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="py-2.5 px-4 bg-zinc-200 hover:bg-white disabled:opacity-40 disabled:hover:bg-zinc-200 text-zinc-950 font-medium text-xs sm:text-sm rounded-md transition-colors flex items-center gap-1.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 cursor-pointer disabled:cursor-not-allowed"
                >
                  <span>Send</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </footer>
        </div>

        {/* Right-Side Online Players Panel */}
        <OnlinePlayersPanel
          currentUser={currentUser}
          allUsers={allUsers}
          onOpenProfile={(userId) => setActiveProfileTarget(userId)}
        />
      </div>

      {/* Square Profile Modal / Viewer (with in-profile editing & Cloudinary support) */}
      <ProfileModal
        isOpen={activeProfileTarget !== null}
        targetUserId={activeProfileTarget}
        currentUser={currentUser}
        allUsers={allUsers}
        onClose={() => setActiveProfileTarget(null)}
        onUpdateCurrentUser={onUpdateCurrentUser}
      />

      {/* Centered Chat Background Modal */}
      <ChatBackgroundModal
        isOpen={isChatBgModalOpen}
        currentBackground={currentUser.chatBackground || null}
        onClose={() => {
          setIsChatBgModalOpen(false);
          setPreviewChatBackground(currentUser.chatBackground || null);
        }}
        onPreviewBackground={(bg) => setPreviewChatBackground(bg)}
        onSaveBackground={(bg) => {
          onUpdateCurrentUser({
            ...currentUser,
            chatBackground: bg,
          });
          setPreviewChatBackground(bg);
        }}
        onResetBackground={() => {
          onUpdateCurrentUser({
            ...currentUser,
            chatBackground: null,
          });
          setPreviewChatBackground(null);
        }}
      />

      {/* Hamburger Navigation Drawer */}
      <HamburgerMenuDrawer
        isOpen={isHamburgerOpen}
        hasUnreadNews={hasUnreadNews}
        onClose={() => setIsHamburgerOpen(false)}
        onOpenDailyRewards={() => setIsDailyRewardsOpen(true)}
        onOpenAvatarFrames={() => setIsAvatarFramesOpen(true)}
        onOpenProfileDecorations={() => setIsProfileDecorationsOpen(true)}
        onOpenNews={handleOpenNews}
      />

      {/* Create News Modal (when opened from NewsPanel) */}
      {isComposerModalOpen && isFounderOrAbove(currentUser) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs select-none animate-in fade-in duration-150">
          <div className="absolute inset-0" onClick={() => setIsComposerModalOpen(false)} />
          <div className="relative z-10 w-full max-w-md bg-[#161720] border border-[#2c2e3e] rounded-xs shadow-2xl p-4">
            <NewsComposer
              onPublish={async (content, mediaUrl, mediaType) => {
                await handlePublishNews(content, mediaUrl, mediaType);
                setIsComposerModalOpen(false);
              }}
              onCancel={() => setIsComposerModalOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Daily Rewards Modal */}
      <DailyRewardsModal
        isOpen={isDailyRewardsOpen}
        currentUser={currentUser}
        allUsers={allUsers}
        onClose={() => setIsDailyRewardsOpen(false)}
        onClaimReward={handleClaimDailyReward}
      />

      {/* Avatar Frame Studio Modal */}
      <AvatarFrameStudioModal
        isOpen={isAvatarFramesOpen}
        currentUser={currentUser}
        onClose={() => setIsAvatarFramesOpen(false)}
        onSelectFrame={handleSelectAvatarFrame}
      />

      {/* Profile Decorations Modal */}
      <ProfileDecorationsModal
        isOpen={isProfileDecorationsOpen}
        currentUser={currentUser}
        onClose={() => setIsProfileDecorationsOpen(false)}
        onSaveDecoration={handleSelectProfileDecoration}
      />

      {/* Create Server Modal */}
      {isCreateServerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="absolute inset-0" onClick={() => setIsCreateServerOpen(false)} />
          <div className="relative z-10 w-full max-w-sm bg-[#161720] border border-[#2c2e3e] rounded-xs shadow-2xl p-5">
            <h2 className="text-sm font-black text-neutral-100 mb-4 uppercase tracking-wider">Create a Server</h2>
            <form onSubmit={handleCreateServer} className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Server Name"
                value={newServerName}
                onChange={(e) => setNewServerName(e.target.value)}
                className="w-full px-3 py-2 bg-[#111215] border border-[#2c2d35] rounded-md text-xs text-neutral-100 placeholder-neutral-500 outline-none"
                required
              />
              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateServerOpen(false)}
                  className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs bg-zinc-200 hover:bg-white text-zinc-950 font-bold rounded-md cursor-pointer"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Channel Modal */}
      {isCreateChannelOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="absolute inset-0" onClick={() => setIsCreateChannelOpen(false)} />
          <div className="relative z-10 w-full max-w-sm bg-[#161720] border border-[#2c2e3e] rounded-xs shadow-2xl p-5">
            <h2 className="text-sm font-black text-neutral-100 mb-4 uppercase tracking-wider">Create a Channel</h2>
            <form onSubmit={handleCreateChannel} className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Channel Name"
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
                className="w-full px-3 py-2 bg-[#111215] border border-[#2c2d35] rounded-md text-xs text-neutral-100 placeholder-neutral-500 outline-none"
                required
              />
              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateChannelOpen(false)}
                  className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs bg-zinc-200 hover:bg-white text-zinc-950 font-bold rounded-md cursor-pointer"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Explore Servers Modal */}
      {isExploreOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="absolute inset-0" onClick={() => setIsExploreOpen(false)} />
          <div className="relative z-10 w-full max-w-md bg-[#161720] border border-[#2c2e3e] rounded-xs shadow-2xl p-5 max-h-[80vh] flex flex-col">
            <h2 className="text-sm font-black text-neutral-100 mb-4 uppercase tracking-wider">Explore Public Servers</h2>
            <div className="flex-1 overflow-y-auto flex flex-col gap-2">
              {servers.length === 0 ? (
                <span className="text-xs text-neutral-400">No public servers found. Be the first to create one!</span>
              ) : (
                servers.map((s) => (
                  <div key={s.id} className="p-3 bg-[#111215] border border-[#2c2d35] rounded-md flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-neutral-100">{s.name}</span>
                      <span className="text-[10px] text-neutral-500">Created by: {s.owner}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleJoinServer(s.id)}
                      className="px-3 py-1 bg-zinc-200 hover:bg-white text-zinc-950 text-xs font-bold rounded-md cursor-pointer"
                    >
                      Join
                    </button>
                  </div>
                ))
              )}
            </div>
            <button
              type="button"
              onClick={() => setIsExploreOpen(false)}
              className="mt-4 px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-neutral-300 text-xs font-bold rounded-md cursor-pointer self-end"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Manage Server Roles Modal */}
      {isManageRolesOpen && activeServer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="absolute inset-0" onClick={() => setIsManageRolesOpen(false)} />
          <div className="relative z-10 w-full max-w-md bg-[#161720] border border-[#2c2e3e] rounded-xs shadow-2xl p-5 max-h-[85vh] flex flex-col">
            <h2 className="text-sm font-black text-neutral-100 mb-4 uppercase tracking-wider">Server Roles: {activeServer.name}</h2>
            
            {/* Create Role Form */}
            <form onSubmit={handleCreateRole} className="mb-4 p-3 bg-[#111215] border border-[#2c2d35] rounded-md flex gap-2">
              <input
                type="text"
                placeholder="New Role Name"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                className="flex-1 px-3 py-1.5 bg-[#161720] border border-[#2c2d35] rounded-xs text-xs text-neutral-100 outline-none"
                required
              />
              <input
                type="color"
                value={newRoleColour}
                onChange={(e) => setNewRoleColour(e.target.value)}
                className="w-10 h-8 rounded border-none cursor-pointer"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-zinc-200 hover:bg-white text-zinc-950 text-xs font-bold rounded-md cursor-pointer"
              >
                Add
              </button>
            </form>

            {/* List Roles */}
            <div className="flex-1 overflow-y-auto flex flex-col gap-2">
              <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Roles</span>
              {serverRoles.map((r) => (
                <div key={r.id} className="p-2.5 bg-[#111215] border border-[#2c2d35] rounded-md flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: r.colour }} />
                    <span className="text-xs font-bold text-neutral-100">{r.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteRole(r.id)}
                    className="text-red-400 hover:text-red-300 text-xs font-bold cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setIsManageRolesOpen(false)}
              className="mt-4 px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-neutral-300 text-xs font-bold rounded-md cursor-pointer self-end"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
