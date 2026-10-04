import { RankId } from './ranks';

export type BioAnimationType =
  | 'none'
  | 'pulse'
  | 'glow'
  | 'bounce'
  | 'float'
  | 'shake'
  | 'wave'
  | 'rainbow'
  | 'flicker'
  | 'spin'
  | 'slide'
  | 'type'
  | 'shimmer';

export type BioFontSize = 'small' | 'normal' | 'large' | 'huge' | string;

export interface BioFormatting {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  color?: string;
  highlight?: string;
  font?: string;
  fontSize?: BioFontSize;
  glow?: {
    enabled: boolean;
    color: string;
  };
  animation?: BioAnimationType;
  more?: {
    letterSpacing?: string; // e.g. '0.05em', '0.15em'
    textShadow?: string;    // e.g. '2px 2px 4px rgba(0,0,0,0.8)'
    opacity?: number;       // 0.2 to 1.0
    textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
    gradientText?: string;  // e.g. 'linear-gradient(135deg, #a855f7, #ec4899)'
    stroke?: string;        // e.g. '1px #ffffff'
    blur?: string;          // e.g. '1px'
    underlineStyle?: 'solid' | 'wavy' | 'dashed' | 'dotted';
    strikethroughStyle?: 'solid' | 'wavy' | 'dashed' | 'dotted';
  };
}

export interface TextSegment extends BioFormatting {
  id: string;
  text: string;
}

export type TextFormatMode = 'normal' | 'bold' | 'heavy' | 'italic' | 'heavy_italic';

export interface TextStyleConfig {
  colorType?: 'solid' | 'neon' | 'gradient';
  colorValue?: string;
  glowColor?: string;
  font?: string;
  format?: TextFormatMode;
}

export interface ProfileData {
  username: string;
  password?: string;
  email?: string;
  profilePicture: string | null;
  banner: string | null;
  mood: string;
  bioSegments: TextSegment[];
  age?: string;
  gender?: string;
  rank?: RankId | null;
  chatBackground?: string | null;
  profileMusic?: string | null;
  profileEffect?: string | null;
  profileBorder?: string | null;
  profileDecoration?: string | null;
  customRankName?: string | null;
  avatarFrame?: string | null;
  usernameStyle?: TextStyleConfig | null;
  chatTextStyle?: TextStyleConfig | null;
  likesCount?: number;
  likedBy?: string[];
  dailyMessagesDate?: string;
  dailyMessagesCount?: number;
  claimedDailyMilestones?: number[];
  wallet?: {
    ruby: number;
    gold: number;
  };
  lastDailyClaim?: number;
  effects?: {
    starEffect?: boolean;
    borderEffect?: string;
    pfpBorder?: string;
    backgroundEffect?: string;
  };
}
