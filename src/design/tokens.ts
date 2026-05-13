export const COLORS = {
  brand: {
    primary: '#4FD09A',
    primarySoft: '#E8F5EC',
    accent: '#E5615E',
    accentSoft: '#FFE5E2',
    secondary: '#F5C24B',
    secondarySoft: '#FFF4DC',
  },
  paper: '#FFFFFF',
  canvas: '#FAF8F4',
  ink: {
    900: '#1A2024',
    700: '#4A5358',
    500: '#7B8589',
    300: '#C9CFD4',
    100: '#F0F3F4',
    50: '#F7F9FA',
  },
} as const

export const RADIUS = {
  cell: 10,
  card: 16,
  illust: 20,
  pill: 999,
} as const

export const SHADOWS = {
  cellGlow: '0 2px 8px rgba(79, 208, 154, 0.25)',
  card: '0 1px 3px rgba(10, 42, 31, 0.08)',
} as const

export const PHOTO_BACKDROP_GRADIENT =
  'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.8) 100%)'
