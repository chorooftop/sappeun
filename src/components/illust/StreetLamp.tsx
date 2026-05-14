import { getA11yProps, StickerFrame, type IllustSvgProps } from './base'

export function StreetLamp({ size = 120, title, ...props }: IllustSvgProps) {
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
      <ellipse
        cx="60"
        cy="27"
        rx="15"
        ry="13"
        fill="#FFC857"
        stroke="#1A2024"
        strokeWidth="2"
      />
      <rect x="58" y="38" width="4" height="70" rx="1" fill="#3D464E" />
    </svg>
  )
}
