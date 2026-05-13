import type { Category } from '@/types/cell'

export const CATEGORY_STYLE: Record<
  Category,
  {
    iconClass: string
  }
> = {
  nature: { iconClass: 'text-brand-primary' },
  manmade: { iconClass: 'text-cat-manmade-ink' },
  animal: { iconClass: 'text-cat-animal-ink' },
  time: { iconClass: 'text-cat-time-ink' },
  mission: { iconClass: 'text-brand-accent' },
  special: { iconClass: 'text-brand-accent' },
}

export const CATEGORY_LABEL: Record<Category, string> = {
  nature: '자연·식물',
  manmade: '인공물',
  animal: '동물',
  time: '시간·숫자',
  mission: '미션',
  special: '특수',
}
