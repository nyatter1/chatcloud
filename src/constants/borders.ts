export interface BorderItem {
  id: string;
  name: string;
  index: number;
  row: number;
  col: number;
  imageUrl: string;
}

const BORDER_NAMES: string[] = [
  // Row 1 (Cols 1-5)
  'Shadow Thorn',
  'Frostbite',
  'Golden Crown',
  'Royal Purple',
  'Cherry Blossom',

  // Row 2 (Cols 1-5)
  'Aqua Storm',
  'Inferno',
  'Purple Flame',
  'Emerald',
  'Cyber Ring',

  // Row 3 (Cols 1-5)
  'Silver Star',
  'Dark Crystal',
  'Ice Crown',
  'Sunburst',
  'Blood Red',

  // Row 4 (Cols 1-5)
  'Starlight',
  'Iron Chain',
  'Wildfire',
  'Moonlight',
  'Toxic',

  // Row 5 (Cols 1-5)
  'Dark Matter',
  'Golden Edge',
  'Angel',
  'Void',
  'Neon Kitty',
];

export const BORDERS: BorderItem[] = BORDER_NAMES.map((name, index) => {
  const row = Math.floor(index / 5);
  const col = index % 5;
  const id = name.toLowerCase().replace(/\s+/g, '-');
  return {
    id,
    name,
    index,
    row,
    col,
    imageUrl: `/borders/border-${index}.png`,
  };
});

export const getBorderByIdOrName = (val?: string | null): BorderItem | null => {
  if (!val || val === 'none') return null;
  const clean = val.toLowerCase().trim().replace(/\s+/g, '-');
  return (
    BORDERS.find(
      (b) =>
        b.id === clean ||
        b.name.toLowerCase().trim() === val.toLowerCase().trim() ||
        b.index.toString() === val
    ) || null
  );
};
