export interface ProfileDecorationConfig {
  id: string;
  name: string;
  description: string;
  previewUrl: string;
  assetUrl: string;
  durationMs: number;
}

export const PROFILE_DECORATIONS_LIST: ProfileDecorationConfig[] = [
  {
    id: 'none',
    name: 'None',
    description: 'No profile decoration',
    previewUrl: '',
    assetUrl: '',
    durationMs: 0,
  },
  {
    id: 'ezgif_7_2df87a0dec',
    name: 'Anime Splash',
    description: 'Animated collectible decoration overlaying the whole profile',
    previewUrl: 'https://raw.githubusercontent.com/DTACat/Collectibles/main/Archive/ezgif-7-2df87a0dec.png',
    assetUrl: 'https://raw.githubusercontent.com/DTACat/Collectibles/main/Archive/ezgif-7-2df87a0dec.png',
    durationMs: 4000,
  },
  {
    id: 'lightning_intro',
    name: 'Lightning Intro',
    description: 'Electric bolts of blue lighting surging across the profile',
    previewUrl: 'https://raw.githubusercontent.com/DTACat/Collectibles/main/Archive/Lightning-Intro.png',
    assetUrl: 'https://raw.githubusercontent.com/DTACat/Collectibles/main/Archive/Lightning-Intro.png',
    durationMs: 4000,
  },
  {
    id: 'haunted_man_o_war',
    name: 'Haunted Man-O-War',
    description: 'Ethereal ghostly pirate ship rising from spectral waters',
    previewUrl: 'https://raw.githubusercontent.com/DTACat/Collectibles/main/Archive/haunted-man-o-war-intro-loop.png',
    assetUrl: 'https://raw.githubusercontent.com/DTACat/Collectibles/main/Archive/haunted-man-o-war-intro-loop.png',
    durationMs: 4000,
  },
  {
    id: 'nice_profile',
    name: 'Nice Profile',
    description: 'Stylish glowing neon sparkle intro',
    previewUrl: 'https://raw.githubusercontent.com/DTACat/Collectibles/main/Archive/nice-profile-intro-loop.png',
    assetUrl: 'https://raw.githubusercontent.com/DTACat/Collectibles/main/Archive/nice-profile-intro-loop.png',
    durationMs: 4000,
  },
  {
    id: 'shooting_stars',
    name: 'Shooting Stars',
    description: 'Cosmic meteor shower streaking across the night sky',
    previewUrl: 'https://raw.githubusercontent.com/DTACat/Collectibles/main/Archive/shooting-stars-intr-loop.png',
    assetUrl: 'https://raw.githubusercontent.com/DTACat/Collectibles/main/Archive/shooting-stars-intr-loop.png',
    durationMs: 4000,
  },
  {
    id: 'space_evader',
    name: 'Space Evader',
    description: 'Retro 8-bit arcade space invader sequence',
    previewUrl: 'https://raw.githubusercontent.com/DTACat/Collectibles/main/Archive/space-evader-intro-loop.png',
    assetUrl: 'https://raw.githubusercontent.com/DTACat/Collectibles/main/Archive/space-evader-intro-loop.png',
    durationMs: 4000,
  },
  {
    id: 'supernova',
    name: 'Supernova',
    description: 'Explosive stellar energy blast burst',
    previewUrl: 'https://raw.githubusercontent.com/DTACat/Collectibles/main/Archive/supernova-intro-loop.png',
    assetUrl: 'https://raw.githubusercontent.com/DTACat/Collectibles/main/Archive/supernova-intro-loop.png',
    durationMs: 4000,
  },
  {
    id: 'twilight',
    name: 'Twilight',
    description: 'Enchanted twilight aura with falling petals',
    previewUrl: 'https://raw.githubusercontent.com/DTACat/Collectibles/main/Archive/twilight-intro-loop.png',
    assetUrl: 'https://raw.githubusercontent.com/DTACat/Collectibles/main/Archive/twilight-intro-loop.png',
    durationMs: 4000,
  },
  {
    id: 'vortex',
    name: 'Vortex',
    description: 'Swirling gravitational cosmic vortex distortion',
    previewUrl: 'https://raw.githubusercontent.com/DTACat/Collectibles/main/Images/Vortex-Intro-Loop.png',
    assetUrl: 'https://raw.githubusercontent.com/DTACat/Collectibles/main/Images/Vortex-Intro-Loop.png',
    durationMs: 4000,
  },
  {
    id: 'mastery',
    name: 'Mastery',
    description: 'Golden crest of supreme mastery and aura',
    previewUrl: 'https://raw.githubusercontent.com/DTACat/Collectibles/main/Images/Mastery-Intro-Loop.png',
    assetUrl: 'https://raw.githubusercontent.com/DTACat/Collectibles/main/Images/Mastery-Intro-Loop.png',
    durationMs: 4000,
  },
  {
    id: 'rock_slide',
    name: 'Rock Slide',
    description: 'Seismic crumbling rock slide intro',
    previewUrl: 'https://raw.githubusercontent.com/DTACat/Collectibles/main/Images/Rock-Slide-Intro-Loop.png',
    assetUrl: 'https://raw.githubusercontent.com/DTACat/Collectibles/main/Images/Rock-Slide-Intro-Loop.png',
    durationMs: 4000,
  },
  {
    id: 'arcane_summons',
    name: 'Arcane Summons',
    description: 'Mystic arcane summoning circle burst',
    previewUrl: 'https://raw.githubusercontent.com/DTACat/Collectibles/main/Archive/arcane-summons-intro-loop.png',
    assetUrl: 'https://raw.githubusercontent.com/DTACat/Collectibles/main/Archive/arcane-summons-intro-loop.png',
    durationMs: 4000,
  },
  {
    id: 'feelin_mischievous',
    name: 'Feelin Mischievous',
    description: 'Playful glowing impish grin aura',
    previewUrl: 'https://raw.githubusercontent.com/DTACat/Collectibles/main/Archive/feelin-mischievous-intro-loop.png',
    assetUrl: 'https://raw.githubusercontent.com/DTACat/Collectibles/main/Archive/feelin-mischievous-intro-loop.png',
    durationMs: 4000,
  },
  {
    id: 'forgotten_treasure',
    name: 'Forgotten Treasure',
    description: 'Ancient chest opening with glittering gold coins and gems',
    previewUrl: 'https://raw.githubusercontent.com/DTACat/Collectibles/main/Archive/forgotten-treasure-intro-loop.png',
    assetUrl: 'https://raw.githubusercontent.com/DTACat/Collectibles/main/Archive/forgotten-treasure-intro-loop.png',
    durationMs: 4000,
  },
  {
    id: 'handsome_squidward',
    name: 'Handsome Squidward',
    description: 'Glorious majestic handsome squidward sparkle effect',
    previewUrl: 'https://raw.githubusercontent.com/DTACat/Collectibles/main/Archive/handsome-squidward-intro-loop.png',
    assetUrl: 'https://raw.githubusercontent.com/DTACat/Collectibles/main/Archive/handsome-squidward-intro-loop.png',
    durationMs: 4000,
  },
];

export const getDecorationConfig = (decorationId: string | null | undefined): ProfileDecorationConfig => {
  if (!decorationId || decorationId === 'none') {
    return PROFILE_DECORATIONS_LIST[0];
  }
  const match = PROFILE_DECORATIONS_LIST.find((d) => d.id === decorationId);
  return match || PROFILE_DECORATIONS_LIST[0];
};
