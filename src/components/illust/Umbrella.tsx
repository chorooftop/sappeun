import { getA11yProps, StickerFrame, type IllustSvgProps } from './base'
import { halfEllipsePath } from './shapes'

export function Umbrella({ size = 120, title, ...props }: IllustSvgProps) {
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
      <path
        d={halfEllipsePath(10, 24, 100, 60)}
        fill="#FF6B81"
        stroke="#1A2024"
        strokeWidth="2"
      />
      <rect x="58" y="54" width="4" height="48" rx="1" fill="#3D464E" />
      <path
        d={halfEllipsePath(48, 96, 14, 14)}
        fill="#FFFFFF"
        stroke="#1A2024"
        strokeWidth="2"
      />
    </svg>
  )
}
