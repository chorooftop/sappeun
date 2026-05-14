import { getA11yProps, StickerFrame, type IllustSvgProps } from './base'

export function Cloud({ size = 120, title, ...props }: IllustSvgProps) {
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
      <ellipse
        cx="36"
        cy="63"
        rx="24"
        ry="21"
        fill="#FFFFFF"
        stroke="#1A2024"
        strokeWidth="2"
      />
      <ellipse
        cx="61"
        cy="53"
        rx="27"
        ry="25"
        fill="#FFFFFF"
        stroke="#1A2024"
        strokeWidth="2"
      />
      <ellipse
        cx="86"
        cy="63"
        rx="24"
        ry="21"
        fill="#FFFFFF"
        stroke="#1A2024"
        strokeWidth="2"
      />
      <rect x="14" y="50" width="92" height="34" fill="#FFFFFF" />
    </svg>
  )
}
