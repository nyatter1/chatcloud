import { TextStyleConfig } from './bio';

export interface GambleResultPayload {
  command: 'dice' | 'allin' | 'coinflip';
  username: string;
  userAvatar: string | null;
  currency: 'gold' | 'ruby';
  betAmount: number;
  multiplier: number;
  rollNumber?: number;
  won: boolean;
  payoutAmount: number;
}

export interface ChatMessage {
  id: string;
  senderId: string; // 'user' | 'system'
  senderName: string;
  senderHandle: string;
  senderAvatar: string | null;
  senderAvatarFrame?: string | null;
  senderCustomRankName?: string | null;
  senderUsernameStyle?: TextStyleConfig | null;
  contentStyle?: TextStyleConfig | null;
  isSystemBot?: boolean;
  isClearChatMessage?: boolean;
  clearedBy?: string;
  content: string;
  timestamp: number;
  formattedTime: string;
  gamblePayload?: GambleResultPayload;
}

export interface ReplyContext {
  messageId: string;
  senderName: string;
  content: string;
}
