import { getA11yProps, StickerFrame, type IllustSvgProps } from './base'

export function Sunlight({ size = 120, title, ...props }: IllustSvgProps) {
  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      fill="none"
      {...getA11yProps(title)}
      {...props}
    >
      <StickerFrame fill="#FFF1CF" />
      <circle
        cx="60"
        cy="60"
        r="27"
        fill="#FFC857"
        stroke="#1A2024"
        strokeWidth="2"
      />
      <rect x="58" y="8" width="4" height="14" rx="2" fill="#1A2024" />
      <rect x="58" y="98" width="4" height="14" rx="2" fill="#1A2024" />
      <rect x="8" y="58" width="14" height="4" rx="2" fill="#1A2024" />
      <rect x="98" y="58" width="14" height="4" rx="2" fill="#1A2024" />
    </svg>
  )
}
