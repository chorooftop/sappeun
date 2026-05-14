import type { SVGProps } from 'react'

export interface IllustSvgProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  size?: number
  title?: string
}

export function getA11yProps(title: string | undefined) {
  if (title) {
    return {
      role: 'img',
      'aria-label': title,
    } as const
  }

  return {
    'aria-hidden': true,
  } as const
}

interface StickerFrameProps {
  fill?: string
}

export function StickerFrame({ fill = '#D8F1E6' }: StickerFrameProps) {
  return (
    <>
      <rect width="120" height="120" rx="16" fill={fill} />
      <rect
        x="1"
        y="1"
        width="118"
        height="118"
        rx="15"
        stroke="#1A2024"
        strokeWidth="2"
      />
    </>
  )
}
