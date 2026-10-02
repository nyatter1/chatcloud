import { RankConfig, RankId } from '../types/ranks';

export const RANKS: Record<RankId, RankConfig> = {
  DEV: {
    id: 'DEV',
    name: 'Developer',
    iconUrl: 'https://raw.githubusercontent.com/nyatter1/ranks/main/crown_crown.gif',
    order: 1,
  },
  FOUNDER: {
    id: 'FOUNDER',
    name: 'Founder',
    iconUrl: 'https://raw.githubusercontent.com/nyatter1/ranks/main/founder.gif',
    order: 2,
  },
  MOP: {
    id: 'MOP',
    name: 'Mop',
    iconUrl: 'https://raw.githubusercontent.com/nyatter1/ranks/main/MoP.gif',
    order: 3,
  },
  'CO-OWNER': {
    id: 'CO-OWNER',
    name: 'Co-owner',
    iconUrl: 'https://raw.githubusercontent.com/nyatter1/ranks/main/verified.gif',
    order: 4,
  },
  SUPERADMIN: {
    id: 'SUPERADMIN',
    name: 'Superadmin',
    iconUrl: 'https://raw.githubusercontent.com/nyatter1/ranks/main/superadmin.png',
    order: 5,
  },
  ADMIN: {
    id: 'ADMIN',
    name: 'Admin',
    iconUrl: 'https://raw.githubusercontent.com/nyatter1/ranks/main/admin.png',
    order: 6,
  },
  MODERATOR: {
    id: 'MODERATOR',
    name: 'Moderator',
    iconUrl: 'https://raw.githubusercontent.com/nyatter1/ranks/main/mod.png',
    order: 7,
  },
  BOT: {
    id: 'BOT',
    name: 'Bot',
    iconUrl:
      'https://imgs.search.brave.com/5Ebh-NK4qGF2KY6Y9d21mN2KJBDbcDiTSNbxAH2CcKM/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly91eHdp/bmcuY29tL3dwLWNv/bnRlbnQvdGhlbWVz/L3V4d2luZy9kb3du/bG9hZC9icmFuZHMt/YW5kLXNvY2lhbC1t/ZWRpYS9hbmRyb2lk/LXJvYm90LWJvdC1p/Y29uLnBuZw',
    order: 8,
    isSpecialBot: true,
  },
  ELITE: {
    id: 'ELITE',
    name: 'Elite',
    iconUrl: 'https://raw.githubusercontent.com/nyatter1/ranks/main/elite.png',
    order: 9,
  },
  'SUPER-VIP': {
    id: 'SUPER-VIP',
    name: 'Super VIP',
    iconUrl: 'https://raw.githubusercontent.com/nyatter1/ranks/main/super-vip.gif',
    order: 10,
  },
  VIP: {
    id: 'VIP',
    name: 'VIP',
    iconUrl: 'https://raw.githubusercontent.com/nyatter1/ranks/main/vip.gif',
    order: 11,
  },
};

export const getRankConfig = (rankId?: RankId | string | null): RankConfig | null => {
  if (!rankId) return null;
  return RANKS[rankId as RankId] || null;
};
