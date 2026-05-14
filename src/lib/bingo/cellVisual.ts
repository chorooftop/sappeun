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
    cellClassName: 'border-cat-nature-border bg-cat-nature',
    iconClassName: 'text-cat-nature-ink',
    labelClassName: 'text-cat-nature-ink',
    borderClassName: 'border-cat-nature-border',
  },
  manmade: {
    cellClassName: 'border-cat-manmade-border bg-cat-manmade',
    iconClassName: 'text-cat-manmade-ink',
    labelClassName: 'text-cat-manmade-ink',
    borderClassName: 'border-cat-manmade-border',
  },
  animal: {
    cellClassName: 'border-cat-animal-border bg-cat-animal',
    iconClassName: 'text-cat-animal-ink',
    labelClassName: 'text-cat-animal-ink',
    borderClassName: 'border-cat-animal-border',
  },
  time: {
    cellClassName: 'border-cat-time-border bg-cat-time',
    iconClassName: 'text-cat-time-ink',
    labelClassName: 'text-cat-time-ink',
    borderClassName: 'border-cat-time-border',
  },
  self: {
    cellClassName: 'border-cat-self-border bg-cat-self',
    iconClassName: 'text-cat-self-ink',
    labelClassName: 'text-cat-self-ink',
    borderClassName: 'border-cat-self-border',
  },
  color: {
    cellClassName: 'border-cat-color-border bg-cat-color',
    iconClassName: 'text-cat-color-ink',
    labelClassName: 'text-cat-color-ink',
    borderClassName: 'border-cat-color-border',
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
      return { className: 'border-swatch-ring', style: { backgroundColor: '#EF4444' } }
    case 'yellow':
      return { className: 'border-swatch-ring', style: { backgroundColor: '#FACC15' } }
    case 'green':
      return { className: 'border-swatch-ring', style: { backgroundColor: '#22C55E' } }
    case 'blue':
      return { className: 'border-swatch-ring', style: { backgroundColor: '#3B82F6' } }
    case 'pink':
      return { className: 'border-swatch-ring', style: { backgroundColor: '#EC4899' } }
    case 'white':
      return { className: 'border-swatch-muted-ring', style: { backgroundColor: '#FFFFFF' } }
    case 'black':
      return { className: 'border-swatch-ring', style: { backgroundColor: '#111827' } }
    case 'rainbow':
      return {
        className: 'border-swatch-ring',
        style: {
          background:
            'linear-gradient(90deg, #EF4444 0%, #FACC15 35%, #22C55E 65%, #3B82F6 100%)',
        },
      }
    default:
      return { className: 'border-swatch-ring', style: { backgroundColor: '#3B82F6' } }
  }
}
