import { getA11yProps, StickerFrame, type IllustSvgProps } from './base'

export function Pigeon({ size = 120, title, ...props }: IllustSvgProps) {
  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      fill="none"
      {...getA11yProps(title)}
      {...props}
    >
      <StickerFrame fill="#E7EBEF" />
      <ellipse
        cx="59"
        cy="60"
        rx="29"
        ry="22"
        fill="#C9D0D6"
        stroke="#1A2024"
        strokeWidth="2"
      />
      <path d="M86 54L98 58L86 62Z" fill="#FFC857" stroke="#1A2024" />
      <circle cx="72.5" cy="50.5" r="2.5" fill="#1A2024" />
      <path
        d="M39 77L34 90M51 80L48 92"
        stroke="#1A2024"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}
