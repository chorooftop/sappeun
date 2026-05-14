import { getA11yProps, StickerFrame, type IllustSvgProps } from './base'

export function Sparrow({ size = 120, title, ...props }: IllustSvgProps) {
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
        cx="57"
        cy="61"
        rx="25"
        ry="19"
        fill="#FFF1CF"
        stroke="#1A2024"
        strokeWidth="2"
      />
      <path d="M80 56L92 60L80 64Z" fill="#FFC857" stroke="#1A2024" />
      <circle cx="66.5" cy="54.5" r="2.5" fill="#1A2024" />
      <path
        d="M35 62C24 64 18 72 18 82"
        stroke="#1A2024"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}
