import { getA11yProps, StickerFrame, type IllustSvgProps } from './base'

export function Moon({ size = 120, title, ...props }: IllustSvgProps) {
  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      fill="none"
      {...getA11yProps(title)}
      {...props}
    >
      <StickerFrame fill="#FFE0E5" />
      <circle
        cx="60"
        cy="60"
        r="38"
        fill="#FFC857"
        stroke="#1A2024"
        strokeWidth="2"
      />
      <circle cx="72" cy="48" r="30" fill="#FFE0E5" />
    </svg>
  )
}
