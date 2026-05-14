import { getA11yProps, StickerFrame, type IllustSvgProps } from './base'

export function Clock({ size = 120, title, ...props }: IllustSvgProps) {
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
        r="40"
        fill="#FFFFFF"
        stroke="#1A2024"
        strokeWidth="2"
      />
      <rect x="58" y="36" width="4" height="26" rx="2" fill="#1A2024" />
      <rect x="60" y="58" width="30" height="4" rx="2" fill="#1A2024" />
      <circle cx="60" cy="60" r="4" fill="#F58BA0" />
    </svg>
  )
}
