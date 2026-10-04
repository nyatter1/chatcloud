export type NewsReactionType = 'like' | 'dislike' | 'heart' | 'laugh';

export interface NewsComment {
  id: string;
  authorUsername: string;
  authorAvatar?: string | null;
  authorAvatarFrame?: string | null;
  content: string;
  timestamp: number;
}

export interface NewsPost {
  id: string;
  authorUsername: string;
  authorAvatar?: string | null;
  authorAvatarFrame?: string | null;
  authorRank?: string | null;
  content: string;
  mediaUrl?: string | null;
  mediaType?: 'image' | 'video' | 'gif' | null;
  timestamp: number;
  reactions: {
    like: string[]; // usernames
    dislike: string[];
    heart: string[];
    laugh: string[];
  };
  comments: NewsComment[];
}
