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
