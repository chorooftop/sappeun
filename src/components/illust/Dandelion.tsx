import { getA11yProps, StickerFrame, type IllustSvgProps } from './base'

export function Dandelion({ size = 120, title, ...props }: IllustSvgProps) {
  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      fill="none"
      {...getA11yProps(title)}
      {...props}
    >
      <StickerFrame />
      <circle
        cx="60"
        cy="45"
        r="31"
        fill="#FFFFFF"
        stroke="#1A2024"
        strokeWidth="2"
      />
      <rect
        x="58"
        y="70"
        width="4"
        height="36"
        rx="2"
        fill="#3DBC8A"
        stroke="#1A2024"
      />
    </svg>
  )
}
