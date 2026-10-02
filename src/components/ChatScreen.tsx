import React, { useState, useRef, useEffect } from 'react';
import { Send, X, User, Sparkles, AlertCircle, Info } from 'lucide-react';
import { ChatMessage, ReplyContext } from '../types/chat';
import { ProfileData } from '../types/bio';
import { ChatMessageItem } from './ChatMessageItem';
import { ProfileMenuDropdown } from './ProfileMenuDropdown';
import { OnlinePlayersPanel } from './OnlinePlayersPanel';
import { ProfileModal } from './ProfileModal';
import { ChatBackgroundModal } from './ChatBackgroundModal';
import { handleChatCommand } from '../utils/commandHandler';
import { isFounderOrAbove } from '../utils/permissions';
import { addAuditLog } from '../utils/auditLogger';
import {
  subscribeToMessages,
  sendMessageToFirestore,
  deleteMessageFromFirestore,
  clearAllMessagesInFirestore,
  subscribeToUsers,
} from '../services/firestoreService';

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
  const [activeProfileTarget, setActiveProfileTarget] = useState<string | null>(null);
  const [isChatBgModalOpen, setIsChatBgModalOpen] = useState(false);
  const [previewChatBackground, setPreviewChatBackground] = useState<string | null>(
    currentUser.chatBackground || null
  );
  const [privateNotice, setPrivateNotice] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 1. Subscribe to Live Firestore Messages
  useEffect(() => {
    const unsubscribe = subscribeToMessages((liveMessages) => {
      setMessages(liveMessages);
    });
    return () => unsubscribe();
  }, []);

  // 2. Subscribe to Live Registered Users
  useEffect(() => {
    const unsubscribe = subscribeToUsers((usersMap) => {
      setAllUsers(usersMap);
    });
    return () => unsubscribe();
  }, []);

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
      isSystemBot: false,
      content: trimmed,
      timestamp: Date.now(),
      formattedTime,
    };

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

  // Visible messages (filtered by hidden IDs)
  const visibleMessages = messages.filter((m) => !hiddenMessageIds.has(m.id));

  return (
    <div className="flex flex-col h-screen w-full bg-[#121316] text-neutral-100 overflow-hidden select-none">
      {/* ================================================== */}
      {/* TOP BAR                                           */}
      {/* Left: ChatCloud.                                  */}
      {/* Right: User's profile picture only.               */}
      {/* ================================================== */}
      <header className="h-14 sm:h-16 px-4 sm:px-6 bg-[#16171b] border-b border-[#25262d] flex items-center justify-between shrink-0 z-20 relative">
        {/* Brand Wordmark Only */}
        <span className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-100">
          chatlaxy
        </span>

        {/* Top Right: ONLY the user's profile picture */}
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => setIsProfileMenuOpen((prev) => !prev)}
            aria-label="Open profile menu"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-[#242630] border-2 border-[#373946] hover:border-neutral-300 focus:outline-none focus:ring-2 focus:ring-zinc-400 transition-all flex items-center justify-center cursor-pointer shadow-sm"
          >
            {currentUser.profilePicture ? (
              <img
                src={currentUser.profilePicture}
                alt={currentUser.username}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-5 h-5 text-neutral-400" />
            )}
          </button>
        </div>

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
      {/* MAIN BODY: CHAT (LEFT/CENTER) + ONLINE PANEL (RIGHT)*/}
      {/* ================================================== */}
      <div className="flex flex-1 overflow-hidden relative">
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

                  return (
                    <ChatMessageItem
                      key={msg.id}
                      message={msg}
                      isCurrentUser={isCurrentUser}
                      isAlternateBg={isAlternateBg}
                      canModerate={isFounderOrAbove(currentUser)}
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
    </div>
  );
};
