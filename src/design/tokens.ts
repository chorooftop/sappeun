export const COLORS = {
  brand: {
    primary: '#3DBC8A',
    primaryHover: '#33A578',
    primarySoft: '#D8F1E6',
    accent: '#FF6B81',
    accentSoft: '#FFE0E5',
    secondary: '#FFC857',
    secondarySoft: '#FFF1CF',
  },
  paper: '#FFFFFF',
  canvas: '#F4F8F5',
  ink: {
    900: '#1A2024',
    700: '#3D464E',
    500: '#7B848C',
    300: '#C9CFD4',
    100: '#EEF1F3',
    50: '#F7F9FA',
  },
  stroke: '#E2E7EB',
  overlay: '#0F161499',
  semantic: {
    success: '#3DBC8A',
    warning: '#FFAB00',
    danger: '#E5484D',
    info: '#3B82F6',
  },
} as const

export const RADIUS = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  cell: 10,
  card: 16,
  illust: 20,
  pill: 999,
} as const

export const SHADOWS = {
  cellGlow: '0 2px 8px rgba(61, 188, 138, 0.25)',
  card: '0 1px 3px rgba(10, 42, 31, 0.08)',
} as const

export const DURATION = {
  fast: 120,
  base: 200,
  slow: 320,
  celebrate: 800,
} as const

export const FONT_FAMILY = {
  display:
    "'Cafe24Ssurround', 'Pretendard Variable', -apple-system, BlinkMacSystemFont, sans-serif",
  body: "'Pretendard Variable', -apple-system, BlinkMacSystemFont, sans-serif",
} as const

export const PHOTO_BACKDROP_GRADIENT =
  'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.8) 100%)'
