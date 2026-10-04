export interface BorderItem {
  id: string;
  name: string;
  index: number;
  row: number;
  col: number;
  imageUrl: string;
}

export const BORDERS: BorderItem[] = [];

export const getBorderByIdOrName = (_val?: string | null): BorderItem | null => {
  return null;
};
