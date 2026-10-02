export type RankId =
  | 'DEV'
  | 'FOUNDER'
  | 'MOP'
  | 'CO-OWNER'
  | 'SUPERADMIN'
  | 'ADMIN'
  | 'MODERATOR'
  | 'ELITE'
  | 'SUPER-VIP'
  | 'VIP'
  | 'BOT';

export interface RankConfig {
  id: RankId;
  name: string;
  iconUrl: string;
  order: number;
  isSpecialBot?: boolean;
}
