import { TextStyleConfig } from './bio';

export type NotificationType = 'profile_view' | 'profile_like' | 'custom';

export interface AppNotification {
  id: string;
  recipientUsername: string; // Target username or 'all' for broadcast
  senderUsername: string;
  senderAvatar?: string | null;
  senderAvatarFrame?: string | null;
  senderUsernameStyle?: TextStyleConfig | null;
  type: NotificationType;
  text: string;
  timestamp: number;
  read: boolean;
  linkUrl?: string | null;
}
