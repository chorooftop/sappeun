import type { CSSProperties } from 'react'
import type { Category } from '@/types/cell'

interface CategoryVisual {
  cellClassName: string
  iconClassName: string
  labelClassName: string
  borderClassName: string
}

export const CATEGORY_VISUALS: Record<Category, CategoryVisual> = {
  nature: {
    cellClassName: 'border-[#B8E6D4] bg-cat-nature',
    iconClassName: 'text-cat-nature-ink',
    labelClassName: 'text-cat-nature-ink',
    borderClassName: 'border-[#B8E6D4]',
  },
  manmade: {
    cellClassName: 'border-[#D8CCF0] bg-cat-manmade',
    iconClassName: 'text-cat-manmade-ink',
    labelClassName: 'text-cat-manmade-ink',
    borderClassName: 'border-[#D8CCF0]',
  },
  animal: {
    cellClassName: 'border-[#FFD3A3] bg-cat-animal',
    iconClassName: 'text-cat-animal-ink',
    labelClassName: 'text-cat-animal-ink',
    borderClassName: 'border-[#FFD3A3]',
  },
  time: {
    cellClassName: 'border-[#FFE1A0] bg-cat-time',
    iconClassName: 'text-cat-time-ink',
    labelClassName: 'text-cat-time-ink',
    borderClassName: 'border-[#FFE1A0]',
  },
  self: {
    cellClassName: 'border-[#FFC7D1] bg-cat-self',
    iconClassName: 'text-cat-self-ink',
    labelClassName: 'text-cat-self-ink',
    borderClassName: 'border-[#FFC7D1]',
  },
  color: {
    cellClassName: 'border-[#BFD7FF] bg-cat-color',
    iconClassName: 'text-cat-color-ink',
    labelClassName: 'text-cat-color-ink',
    borderClassName: 'border-[#BFD7FF]',
  },
  special: {
    cellClassName: 'border-brand-accent bg-brand-accent-soft',
    iconClassName: 'text-brand-accent',
    labelClassName: 'text-brand-accent',
    borderClassName: 'border-brand-accent',
  },
}

interface SwatchVisual {
  style: CSSProperties
  className: string
}

export function getCategoryVisual(category: Category): CategoryVisual {
  return CATEGORY_VISUALS[category]
}

export function getSwatchVisual(swatch: string): SwatchVisual {
  switch (swatch) {
    case 'red':
      return { className: 'border-paper', style: { backgroundColor: '#EF4444' } }
    case 'yellow':
      return { className: 'border-paper', style: { backgroundColor: '#FACC15' } }
    case 'green':
      return { className: 'border-paper', style: { backgroundColor: '#22C55E' } }
    case 'blue':
      return { className: 'border-paper', style: { backgroundColor: '#3B82F6' } }
    case 'pink':
      return { className: 'border-paper', style: { backgroundColor: '#EC4899' } }
    case 'white':
      return { className: 'border-ink-300', style: { backgroundColor: '#FFFFFF' } }
    case 'black':
      return { className: 'border-paper', style: { backgroundColor: '#111827' } }
    case 'rainbow':
      return {
        className: 'border-paper',
        style: {
          background:
            'linear-gradient(90deg, #EF4444 0%, #FACC15 35%, #22C55E 65%, #3B82F6 100%)',
        },
      }
    default:
      return { className: 'border-paper', style: { backgroundColor: '#3B82F6' } }
  }
}
