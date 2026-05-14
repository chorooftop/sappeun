import { getA11yProps, StickerFrame, type IllustSvgProps } from './base'

export function PublicPhone({
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
      <StickerFrame fill="#FFF1CF" />
      <ellipse
        cx="60"
        cy="39"
        rx="40"
        ry="9"
        fill="#FF6B81"
        stroke="#1A2024"
        strokeWidth="2"
      />
      <rect
        x="20"
        y="64"
        width="80"
        height="32"
        rx="4"
        fill="#3DBC8A"
        stroke="#1A2024"
        strokeWidth="2"
      />
      <ellipse
        cx="60"
        cy="80"
        rx="10"
        ry="8"
        fill="#FFFFFF"
        stroke="#1A2024"
      />
    </svg>
  )
}
