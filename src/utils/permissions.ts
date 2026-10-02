import { ProfileData } from '../types/bio';

export function isFounderOrAbove(profile?: ProfileData | null): boolean {
  if (!profile) return false;
  if (profile.username?.trim().toLowerCase() === 'null') return true;
  const rank = profile.rank;
  return rank === 'DEV' || rank === 'FOUNDER';
}
