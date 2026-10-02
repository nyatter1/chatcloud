export const GENDER_OPTIONS = [
  'Male',
  'Female',
  'Non-binary',
  'Agender',
  'Genderfluid',
  'Genderqueer',
  'Other',
  'Prefer not to say',
];

// Discrete ages from 13 to 100+
export const AGE_OPTIONS: string[] = [
  ...Array.from({ length: 87 }, (_, i) => String(i + 13)), // 13 through 99
  '100+',
];
