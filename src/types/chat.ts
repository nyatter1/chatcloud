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
  isSystemBot?: boolean;
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
