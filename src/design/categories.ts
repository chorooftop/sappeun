import type { Category } from '@/types/cell'

export const CATEGORY_STYLE: Record<
  Category,
  {
    bg: string
    bgClass: string
    iconColor: string
    iconClass: string
    labelClass: string
    strokeClass?: string
  }
> = {
  nature: {
    bg: '#E8F5EC',
    bgClass: 'bg-cat-nature',
    iconColor: '#4FD09A',
    iconClass: 'text-brand-primary',
    labelClass: 'text-ink-700',
  },
  manmade: {
    bg: '#F0EAFA',
    bgClass: 'bg-cat-manmade',
    iconColor: '#8B6FBC',
    iconClass: 'text-cat-manmade-ink',
    labelClass: 'text-ink-700',
  },
  animal: {
    bg: '#FFEDD9',
    bgClass: 'bg-cat-animal',
    iconColor: '#E89548',
    iconClass: 'text-cat-animal-ink',
    labelClass: 'text-ink-700',
  },
  time: {
    bg: '#FFF4DC',
    bgClass: 'bg-cat-time',
    iconColor: '#B8842A',
    iconClass: 'text-cat-time-ink',
    labelClass: 'text-ink-700',
  },
  mission: {
    bg: '#FFE5E2',
    bgClass: 'bg-cat-mission',
    iconColor: '#E5615E',
    iconClass: 'text-brand-accent',
    labelClass: 'text-brand-accent',
    strokeClass: 'border-[1.5px] border-brand-accent',
  },
  special: {
    bg: '#E5615E',
    bgClass: 'bg-brand-accent',
    iconColor: '#FFFFFF',
    iconClass: 'text-paper',
    labelClass: 'text-paper',
  },
}

export const CATEGORY_LABEL: Record<Category, string> = {
  nature: '자연·식물',
  manmade: '인공물',
  animal: '동물',
  time: '시간·숫자',
  mission: '미션',
  special: '특수',
}
