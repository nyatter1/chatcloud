import React, { useState } from 'react';
import {
  X,
  MoreHorizontal,
  Trash2,
  MessageCircle,
  ThumbsUp,
  ThumbsDown,
  Heart,
  Smile,
  Send,
  Plus,
  Image,
  Video,
  AlertCircle,
} from 'lucide-react';
import { NewsPost, NewsReactionType } from '../types/news';
import { ProfileData } from '../types/bio';
import { isFounderOrAbove } from '../utils/permissions';
import { UserAvatar } from './UserAvatar';

interface NewsPanelProps {
  currentUser: ProfileData;
  newsPosts: NewsPost[];
  onClose: () => void;
  onOpenProfile: (username: string) => void;
  onDeletePost: (postId: string) => void;
  onToggleReaction: (postId: string, reaction: NewsReactionType) => void;
  onAddComment: (postId: string, content: string) => void;
  onDeleteComment: (postId: string, commentId: string) => void;
  onOpenCreateNews?: () => void;
}

export const NewsPanel: React.FC<NewsPanelProps> = ({
  currentUser,
  newsPosts,
  onClose,
  onOpenProfile,
  onDeletePost,
  onToggleReaction,
  onAddComment,
  onDeleteComment,
  onOpenCreateNews,
}) => {
  const isFounderOrDev = isFounderOrAbove(currentUser);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [activeMenuPostId, setActiveMenuPostId] = useState<string | null>(null);

  const handleCommentSubmit = (postId: string) => {
    const text = (commentInputs[postId] || '').trim();
    if (!text) return;
    onAddComment(postId, text);
    setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
    setExpandedComments((prev) => ({ ...prev, [postId]: true }));
  };

  const formatTimestamp = (ts: number) => {
    const d = new Date(ts);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${month}/${day} ${hours}:${minutes}`;
  };

  return (
    <aside className="w-full sm:w-84 md:w-96 lg:w-[400px] bg-[#141519] border-r border-[#24252c] flex flex-col shrink-0 overflow-hidden select-none z-10 animate-in slide-in-from-left duration-200">
      {/* Header */}
      <div className="h-14 px-4 bg-[#16171d] border-b border-[#23242e] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-white tracking-tight">News</h2>
          {isFounderOrDev && onOpenCreateNews && (
            <button
              type="button"
              onClick={onOpenCreateNews}
              className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold bg-purple-600 hover:bg-purple-500 text-white rounded-xs transition-colors cursor-pointer ml-1"
            >
              <Plus className="w-3 h-3" />
              <span>Post</span>
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close News"
          className="p-1.5 text-neutral-400 hover:text-white rounded-xs transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Posts List */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 flex flex-col gap-3.5">
        {newsPosts.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center text-neutral-500 gap-2 px-4">
            <AlertCircle className="w-8 h-8 text-neutral-600" />
            <span className="text-xs font-semibold text-neutral-400">No news announcements yet</span>
            <span className="text-[11px] text-neutral-600">
              {isFounderOrDev
                ? 'Click "Post News" in the hamburger menu or top header to publish the first announcement!'
                : 'Check back later for announcements from Developers & Founders!'}
            </span>
          </div>
        ) : (
          newsPosts.map((post) => {
            const hasLiked = post.reactions.like.includes(currentUser.username);
            const hasDisliked = post.reactions.dislike.includes(currentUser.username);
            const hasHearted = post.reactions.heart.includes(currentUser.username);
            const hasLaughed = post.reactions.laugh.includes(currentUser.username);
            const areCommentsOpen = expandedComments[post.id] ?? false;

            return (
              <div
                key={post.id}
                className="bg-[#181921] border border-[#262835] rounded-xs p-3.5 sm:p-4 flex flex-col gap-3 shadow-md text-left"
              >
                {/* Author row */}
                <div className="flex items-center justify-between relative">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button
                      type="button"
                      onClick={() => onOpenProfile(post.authorUsername)}
                      className="cursor-pointer focus:outline-none"
                    >
                      <UserAvatar
                        src={post.authorAvatar}
                        username={post.authorUsername}
                        frameId={post.authorAvatarFrame}
                        size="md"
                        shape="circle"
                      />
                    </button>

                    <div className="flex flex-col min-w-0">
                      <button
                        type="button"
                        onClick={() => onOpenProfile(post.authorUsername)}
                        className="text-xs sm:text-sm font-bold text-white hover:underline text-left truncate cursor-pointer focus:outline-none"
                      >
                        {post.authorUsername}
                      </button>
                      <span className="text-[11px] text-neutral-400 font-mono">
                        {formatTimestamp(post.timestamp)}
                      </span>
                    </div>
                  </div>

                  {/* Options menu (Founder & Dev only) */}
                  {isFounderOrDev && (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() =>
                          setActiveMenuPostId((prev) => (prev === post.id ? null : post.id))
                        }
                        className="p-1 text-neutral-400 hover:text-white rounded-xs transition-colors cursor-pointer"
                        title="Post options"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>

                      {activeMenuPostId === post.id && (
                        <div className="absolute right-0 top-full mt-1 w-32 bg-[#121317] border border-[#2b2d3c] rounded-xs shadow-xl py-1 z-20 animate-in fade-in zoom-in-95 duration-100">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuPostId(null);
                              onDeletePost(post.id);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition-colors cursor-pointer text-left font-medium"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* News content message */}
                <p className="text-xs sm:text-[13px] text-neutral-100 font-medium leading-relaxed whitespace-pre-wrap select-text">
                  {post.content}
                </p>

                {/* Media preview if uploaded (image, gif, or video) */}
                {post.mediaUrl && (
                  <div className="w-full rounded-xs overflow-hidden bg-[#101115] border border-[#282a38] mt-0.5">
                    {post.mediaType === 'video' ? (
                      <video
                        src={post.mediaUrl}
                        controls
                        className="w-full max-h-72 object-contain bg-black"
                      />
                    ) : (
                      <img
                        src={post.mediaUrl}
                        alt="News media"
                        referrerPolicy="no-referrer"
                        className="w-full max-h-80 object-cover"
                      />
                    )}
                  </div>
                )}

                {/* Reactions row (Matching reference image) */}
                <div className="flex items-center justify-between pt-1 border-t border-[#23242f]/80">
                  {/* Left: Like, Dislike, Heart, Laugh icons */}
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    {/* Like 👍 */}
                    <button
                      type="button"
                      onClick={() => onToggleReaction(post.id, 'like')}
                      title="Like"
                      className="flex items-center gap-1 cursor-pointer group"
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 ${
                          hasLiked ? 'bg-[#2470e8] ring-2 ring-blue-300/40' : 'bg-[#2470e8]'
                        }`}
                      >
                        <ThumbsUp className="w-3 h-3 text-white fill-white" />
                      </div>
                      <span className="text-xs font-bold text-neutral-300 font-mono">
                        {post.reactions.like.length}
                      </span>
                    </button>

                    {/* Dislike 👎 */}
                    <button
                      type="button"
                      onClick={() => onToggleReaction(post.id, 'dislike')}
                      title="Dislike"
                      className="flex items-center gap-1 cursor-pointer group"
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 ${
                          hasDisliked ? 'bg-[#d32f2f] ring-2 ring-red-300/40' : 'bg-[#d32f2f]'
                        }`}
                      >
                        <ThumbsDown className="w-3 h-3 text-white fill-white" />
                      </div>
                      <span className="text-xs font-bold text-neutral-300 font-mono">
                        {post.reactions.dislike.length}
                      </span>
                    </button>

                    {/* Heart 💖 */}
                    <button
                      type="button"
                      onClick={() => onToggleReaction(post.id, 'heart')}
                      title="Heart"
                      className="flex items-center gap-1 cursor-pointer group"
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 ${
                          hasHearted ? 'bg-[#e91e63] ring-2 ring-pink-300/40' : 'bg-[#e91e63]'
                        }`}
                      >
                        <Heart className="w-3 h-3 text-white fill-white" />
                      </div>
                      <span className="text-xs font-bold text-neutral-300 font-mono">
                        {post.reactions.heart.length}
                      </span>
                    </button>

                    {/* Laugh 😆 */}
                    <button
                      type="button"
                      onClick={() => onToggleReaction(post.id, 'laugh')}
                      title="Laugh"
                      className="flex items-center gap-1 cursor-pointer group"
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 ${
                          hasLaughed ? 'bg-[#fbc02d] ring-2 ring-amber-200/50' : 'bg-[#fbc02d]'
                        }`}
                      >
                        <Smile className="w-3.5 h-3.5 text-neutral-950 font-bold" />
                      </div>
                      <span className="text-xs font-bold text-neutral-300 font-mono">
                        {post.reactions.laugh.length}
                      </span>
                    </button>
                  </div>

                  {/* Right: Comments count */}
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedComments((prev) => ({
                        ...prev,
                        [post.id]: !prev[post.id],
                      }))
                    }
                    className="flex items-center gap-1 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <span className="text-xs font-bold font-mono">{post.comments.length}</span>
                    <MessageCircle className="w-3.5 h-3.5 fill-neutral-400/20" />
                  </button>
                </div>

                {/* Comment input pill (Matching reference image) */}
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={commentInputs[post.id] || ''}
                      onChange={(e) =>
                        setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleCommentSubmit(post.id);
                        }
                      }}
                      placeholder="Type your comment"
                      className="w-full px-4 py-2 bg-[#101116] border border-[#2a2c3a] focus:border-neutral-400 rounded-full text-xs text-neutral-100 placeholder:text-neutral-500 outline-none transition-colors"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCommentSubmit(post.id)}
                    disabled={!(commentInputs[post.id] || '').trim()}
                    className="p-2 bg-[#22242f] hover:bg-[#2c2f3d] disabled:opacity-40 text-white rounded-full transition-colors cursor-pointer shrink-0"
                    title="Send comment"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Expanded comments list */}
                {areCommentsOpen && post.comments.length > 0 && (
                  <div className="flex flex-col gap-2 pt-2 border-t border-[#23242e] max-h-56 overflow-y-auto">
                    {post.comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="flex items-start justify-between gap-2 p-2 bg-[#121318] rounded-xs border border-white/5"
                      >
                        <div className="flex items-start gap-2 min-w-0">
                          <UserAvatar
                            src={comment.authorAvatar}
                            username={comment.authorUsername}
                            frameId={comment.authorAvatarFrame}
                            size="xs"
                            shape="circle"
                          />
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] font-bold text-neutral-200">
                                {comment.authorUsername}
                              </span>
                              <span className="text-[9px] text-neutral-500 font-mono">
                                {formatTimestamp(comment.timestamp)}
                              </span>
                            </div>
                            <span className="text-xs text-neutral-300 break-words select-text">
                              {comment.content}
                            </span>
                          </div>
                        </div>

                        {/* Delete comment button (Founder & Dev only) */}
                        {isFounderOrDev && (
                          <button
                            type="button"
                            onClick={() => onDeleteComment(post.id, comment.id)}
                            className="p-1 text-neutral-500 hover:text-rose-400 rounded-xs transition-colors cursor-pointer shrink-0"
                            title="Delete comment"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
