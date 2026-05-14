import { getA11yProps, StickerFrame, type IllustSvgProps } from './base'

export function Signpost({ size = 120, title, ...props }: IllustSvgProps) {
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
      <rect x="58" y="26" width="4" height="80" rx="1" fill="#3D464E" />
      <rect
        x="30"
        y="18"
        width="60"
        height="24"
        rx="2"
        fill="#3DBC8A"
        stroke="#1A2024"
        strokeWidth="2"
      />
    </svg>
  )
}
