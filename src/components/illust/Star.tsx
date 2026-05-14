import { getA11yProps, StickerFrame, type IllustSvgProps } from './base'

export function Star({ size = 120, title, ...props }: IllustSvgProps) {
  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      fill="none"
      {...getA11yProps(title)}
      {...props}
    >
      <StickerFrame fill="#FFE0E5" />
      <path
        d="M60 22L68 52H100L74 72L84 98L60 82L36 98L46 72L20 52H52Z"
        fill="#FFC857"
        stroke="#1A2024"
        strokeWidth="2"
      />
    </svg>
  )
}
