export type FrameCategory = 'All' | 'Soft' | 'Energy' | 'Fire' | 'Extreme' | 'Neon' | 'Cosmic';

export interface AvatarFrameConfig {
  id: string;
  name: string;
  category: FrameCategory;
  description: string;
  frameClasses: string; // CSS classes for the outer animated decorative frame
  glowClasses?: string;
}

export const AVATAR_FRAMES_LIST: AvatarFrameConfig[] = [
  {
    id: 'none',
    name: 'None',
    category: 'All',
    description: 'Default clean border',
    frameClasses: 'border-2 border-[#343644]',
  },
  {
    id: 'aurora-flow',
    name: 'Aurora Flow',
    category: 'Soft',
    description: 'Rotating smooth pastel aurora aura',
    frameClasses: 'border-2 border-teal-300 ring-2 ring-purple-400 shadow-[0_0_12px_rgba(45,212,191,0.7)] animate-pulse',
    glowClasses: 'from-teal-400 via-emerald-400 to-indigo-400',
  },
  {
    id: 'rose-breathing',
    name: 'Rose Breathing',
    category: 'Soft',
    description: 'Gentle blooming rose-pink glow',
    frameClasses: 'border-2 border-rose-400 ring-2 ring-pink-500/60 shadow-[0_0_12px_rgba(244,114,182,0.7)] animate-pulse',
    glowClasses: 'from-rose-400 via-pink-400 to-rose-600',
  },
  {
    id: 'pearl-shimmer',
    name: 'Pearl Shimmer',
    category: 'Soft',
    description: 'Iridescent pearlescent silver luster',
    frameClasses: 'border-2 border-slate-100 ring-2 ring-purple-200/50 shadow-[0_0_12px_rgba(255,255,255,0.7)]',
    glowClasses: 'from-white via-slate-200 to-indigo-200',
  },
  {
    id: 'candy-heartbeat',
    name: 'Candy Heartbeat',
    category: 'Soft',
    description: 'Rhythmic pulsing pastel pink and cyan',
    frameClasses: 'border-2 border-pink-400 ring-2 ring-sky-300 shadow-[0_0_12px_rgba(244,114,182,0.8)] animate-pulse',
    glowClasses: 'from-pink-400 to-sky-300',
  },
  {
    id: 'dream-pulse',
    name: 'Dream Pulse',
    category: 'Soft',
    description: 'Ethereal lavender and mist purple glow',
    frameClasses: 'border-2 border-purple-300 ring-2 ring-indigo-400/60 shadow-[0_0_12px_rgba(192,132,252,0.7)] animate-pulse',
    glowClasses: 'from-purple-300 to-indigo-500',
  },
  {
    id: 'sakura-breeze',
    name: 'Sakura Breeze',
    category: 'Soft',
    description: 'Cherry blossom petals ring with soft aura',
    frameClasses: 'border-2 border-pink-300 ring-2 ring-rose-300 shadow-[0_0_12px_rgba(253,164,175,0.7)] animate-pulse',
    glowClasses: 'from-pink-300 via-rose-300 to-pink-500',
  },
  {
    id: 'plasma-riot',
    name: 'Plasma Riot',
    category: 'Energy',
    description: 'Swirling electric violet and cyan plasma',
    frameClasses: 'border-2 border-cyan-400 ring-2 ring-fuchsia-500 shadow-[0_0_14px_rgba(34,211,238,0.8)]',
    glowClasses: 'from-cyan-400 via-violet-500 to-fuchsia-500',
  },
  {
    id: 'laser-cyclone',
    name: 'Laser Cyclone',
    category: 'Energy',
    description: 'High-velocity spinning neon laser beams',
    frameClasses: 'border-2 border-emerald-400 ring-2 ring-cyan-400 shadow-[0_0_14px_rgba(52,211,153,0.8)] animate-pulse',
    glowClasses: 'from-emerald-400 via-cyan-400 to-lime-400',
  },
  {
    id: 'atomic-charge',
    name: 'Atomic Charge',
    category: 'Extreme',
    description: 'Radioactive lime-yellow lightning discharge',
    frameClasses: 'border-2 border-lime-400 ring-2 ring-yellow-400 shadow-[0_0_16px_rgba(163,230,53,0.85)] animate-pulse',
    glowClasses: 'from-lime-400 via-yellow-400 to-emerald-500',
  },
  {
    id: 'overdrive-core',
    name: 'Overdrive Core',
    category: 'Extreme',
    description: 'Hyper-kinetic crimson and electric cyan surge',
    frameClasses: 'border-2 border-red-500 ring-2 ring-cyan-400 shadow-[0_0_16px_rgba(239,68,68,0.85)] animate-pulse',
    glowClasses: 'from-red-500 to-cyan-400',
  },
  {
    id: 'magma-burn',
    name: 'Magma Burn',
    category: 'Fire',
    description: 'Molten bubbling lava and glowing magma',
    frameClasses: 'border-2 border-orange-500 ring-2 ring-red-600 shadow-[0_0_14px_rgba(249,115,22,0.8)] animate-pulse',
    glowClasses: 'from-orange-500 via-red-600 to-amber-500',
  },
  {
    id: 'red-ember',
    name: 'Red Ember',
    category: 'Fire',
    description: 'Crackling fiery sparks and flame glow',
    frameClasses: 'border-2 border-red-500 ring-2 ring-amber-500 shadow-[0_0_14px_rgba(239,68,68,0.8)] animate-pulse',
    glowClasses: 'from-red-600 to-amber-400',
  },
  {
    id: 'cyber-pulse',
    name: 'Cyber Pulse',
    category: 'Neon',
    description: 'High-tech neon cyan and magenta sci-fi ring',
    frameClasses: 'border-2 border-fuchsia-400 ring-2 ring-cyan-400 shadow-[0_0_14px_rgba(232,121,249,0.8)]',
    glowClasses: 'from-fuchsia-400 via-purple-500 to-cyan-400',
  },
  {
    id: 'neon-matrix',
    name: 'Neon Matrix',
    category: 'Neon',
    description: 'Cybernetic digital green circuit aura',
    frameClasses: 'border-2 border-emerald-400 ring-2 ring-green-500 shadow-[0_0_14px_rgba(52,211,153,0.8)] animate-pulse',
    glowClasses: 'from-emerald-400 to-green-600',
  },
  {
    id: 'cosmic-void',
    name: 'Cosmic Void',
    category: 'Cosmic',
    description: 'Abyssal dark violet spiral galaxy ring',
    frameClasses: 'border-2 border-purple-500 ring-2 ring-indigo-600 shadow-[0_0_14px_rgba(168,85,247,0.8)] animate-pulse',
    glowClasses: 'from-purple-600 via-indigo-700 to-violet-500',
  },
  {
    id: 'starlight-halo',
    name: 'Starlight Halo',
    category: 'Cosmic',
    description: 'Radiant celestial golden starlight frame',
    frameClasses: 'border-2 border-amber-300 ring-2 ring-yellow-400 shadow-[0_0_14px_rgba(251,191,36,0.8)] animate-pulse',
    glowClasses: 'from-amber-300 via-yellow-400 to-amber-500',
  },
  {
    id: 'frost-crystal',
    name: 'Frost Crystal',
    category: 'Energy',
    description: 'Glacial diamond blue ice crystal frame',
    frameClasses: 'border-2 border-cyan-200 ring-2 ring-sky-400 shadow-[0_0_14px_rgba(186,230,253,0.8)] animate-pulse',
    glowClasses: 'from-cyan-100 via-sky-300 to-blue-500',
  },
];

export function getAvatarFrameConfig(frameId?: string | null): AvatarFrameConfig {
  if (!frameId || frameId === 'none') {
    return AVATAR_FRAMES_LIST[0];
  }
  const found = AVATAR_FRAMES_LIST.find((f) => f.id === frameId);
  return found || AVATAR_FRAMES_LIST[0];
}
