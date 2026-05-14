import { getA11yProps, StickerFrame, type IllustSvgProps } from './base'

export function Butterfly({ size = 120, title, ...props }: IllustSvgProps) {
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
        cy="40"
        rx="18"
        ry="16"
        fill="#F58BA0"
        stroke="#1A2024"
        strokeWidth="2"
      />
      <ellipse
        cx="84"
        cy="40"
        rx="18"
        ry="16"
        fill="#F58BA0"
        stroke="#1A2024"
        strokeWidth="2"
      />
      <ellipse
        cx="38"
        cy="72"
        rx="14"
        ry="12"
        fill="#FFC857"
        stroke="#1A2024"
        strokeWidth="2"
      />
      <ellipse
        cx="82"
        cy="72"
        rx="14"
        ry="12"
        fill="#FFC857"
        stroke="#1A2024"
        strokeWidth="2"
      />
      <rect x="58" y="30" width="4" height="60" rx="2" fill="#2F3A42" />
    </svg>
  )
}
