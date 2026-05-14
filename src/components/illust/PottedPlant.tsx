import { getA11yProps, StickerFrame, type IllustSvgProps } from './base'

export function PottedPlant({
  size = 120,
  title,
  ...props
}: IllustSvgProps) {
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
      <rect x="58" y="50" width="4" height="24" fill="#3DBC8A" />
      <ellipse
        cx="60"
        cy="36"
        rx="22"
        ry="18"
        fill="#FFC857"
        stroke="#1A2024"
        strokeWidth="2"
      />
      <path
        d="M34 72h52v30a8 8 0 0 1-8 8H42a8 8 0 0 1-8-8V72z"
        fill="#FF6B81"
        stroke="#1A2024"
        strokeWidth="2"
      />
    </svg>
  )
}
