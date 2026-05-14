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
  self: { iconClass: 'text-cat-self-ink' },
  color: { iconClass: 'text-cat-color-ink' },
  special: { iconClass: 'text-brand-accent' },
}

export const CATEGORY_LABEL: Record<Category, string> = {
  nature: '자연·식물',
  manmade: '인공물',
  animal: '동물',
  time: '시간·숫자',
  self: '셀프',
  color: '색깔',
  special: '특수',
}
