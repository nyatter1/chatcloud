export type ProfileEffectId =
  | 'none'
  | 'snow'
  | 'rain'
  | 'inferno'
  | 'bubbles'
  | 'storm'
  | 'neon'
  | 'glitch'
  | 'matrix'
  | 'stars'
  | 'rainbow'
  | 'plasma'
  | 'fog'
  | 'pulse'
  | 'scan'
  | 'retro_tv'
  | 'cosmic'
  | 'ocean'
  | 'flowers'
  | 'fireworks'
  | 'roses'
  | 'kitty'
  | 'sparkle'
  | 'galaxy'
  | 'vibe';

export interface ProfileEffectConfig {
  id: ProfileEffectId;
  name: string;
  free: true;
  description: string;
}

export const PROFILE_EFFECTS_LIST: ProfileEffectConfig[] = [
  { id: 'none', name: 'None', free: true, description: 'No visual effect' },
  { id: 'snow', name: 'Snow', free: true, description: 'Gentle falling snow particles with slow horizontal drift' },
  { id: 'rain', name: 'Rain', free: true, description: 'Fast, thin angled rain streaks continuously falling' },
  { id: 'inferno', name: 'Inferno', free: true, description: 'Animated glowing fire and embers rising from below' },
  { id: 'bubbles', name: 'Bubbles', free: true, description: 'Large and tiny translucent iridescent bubbles floating upward' },
  { id: 'storm', name: 'Storm', free: true, description: 'Dark drifting storm clouds with ambient lightning' },
  { id: 'neon', name: 'Neon', free: true, description: 'Vibrant cyberpunk neon glow beams shifting across' },
  { id: 'glitch', name: 'Glitch', free: true, description: 'Subtle digital scanlines and chromatic distortion' },
  { id: 'matrix', name: 'Matrix', free: true, description: 'Digital green code rain streaming in vertical columns' },
  { id: 'stars', name: 'Stars', free: true, description: 'Twinkling starry night sky with gentle drift' },
  { id: 'rainbow', name: 'Rainbow', free: true, description: 'Smooth flowing multi-color iridescent aurora waves' },
  { id: 'plasma', name: 'Plasma', free: true, description: 'Organic colorful swirling plasma blobs blending together' },
  { id: 'fog', name: 'Fog', free: true, description: 'Soft ethereal mist and fog drifting horizontally' },
  { id: 'pulse', name: 'Pulse', free: true, description: 'Hypnotic radiant energy aura expanding and contracting' },
  { id: 'scan', name: 'Scan', free: true, description: 'Holographic laser scanline sweeping vertically' },
  { id: 'retro_tv', name: 'Retro TV', free: true, description: 'Classic CRT monitor scanlines with phosphor flicker' },
  { id: 'cosmic', name: 'Cosmic', free: true, description: 'Deep space cosmic nebula with drifting stardust' },
  { id: 'ocean', name: 'Ocean', free: true, description: 'Calming undulating blue water waves and sea particles' },
  { id: 'flowers', name: 'Flowers', free: true, description: 'Soft cherry blossom flower petals slowly tumbling down' },
  { id: 'fireworks', name: 'Fireworks', free: true, description: 'Sparkling colorful celebratory firework bursts' },
  { id: 'roses', name: 'Roses', free: true, description: 'Romantic red rose petals swaying and falling softly' },
  { id: 'kitty', name: 'Kitty', free: true, description: 'Cute cat paws and sparkle elements floating gently' },
  { id: 'sparkle', name: 'Sparkle', free: true, description: 'Magical 4-point diamond sparkles twinkling brightly' },
  { id: 'galaxy', name: 'Galaxy', free: true, description: 'Slowly rotating spiral galaxy with luminous star clusters' },
  { id: 'vibe', name: 'Vibe', free: true, description: 'Chill ambient lo-fi floating particles with shifting glow' },
];

export function getEffectConfig(id?: string | null): ProfileEffectConfig {
  if (!id || id === 'none') return PROFILE_EFFECTS_LIST[0];
  const found = PROFILE_EFFECTS_LIST.find((e) => e.id === id);
  return found || PROFILE_EFFECTS_LIST[0];
}
