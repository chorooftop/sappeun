import { getA11yProps, StickerFrame, type IllustSvgProps } from './base'

export function Bicycle({ size = 120, title, ...props }: IllustSvgProps) {
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
        cx="26"
        cy="84"
        r="20"
        fill="#FFFFFF"
        stroke="#1A2024"
        strokeWidth="2"
      />
      <circle
        cx="94"
        cy="84"
        r="20"
        fill="#FFFFFF"
        stroke="#1A2024"
        strokeWidth="2"
      />
      <rect
        x="30"
        y="60"
        width="60"
        height="6"
        rx="2"
        fill="#FF6B81"
        stroke="#1A2024"
        strokeWidth="2"
      />
      <rect x="48" y="46" width="18" height="6" rx="2" fill="#1A2024" />
    </svg>
  )
}
