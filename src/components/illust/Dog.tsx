import { getA11yProps, StickerFrame, type IllustSvgProps } from './base'

export function Dog({ size = 120, title, ...props }: IllustSvgProps) {
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
        cx="21"
        cy="55"
        rx="9"
        ry="17"
        fill="#FFC857"
        stroke="#1A2024"
        strokeWidth="2"
      />
      <ellipse
        cx="99"
        cy="55"
        rx="9"
        ry="17"
        fill="#FFC857"
        stroke="#1A2024"
        strokeWidth="2"
      />
      <ellipse
        cx="60"
        cy="61"
        rx="36"
        ry="29"
        fill="#FFF1CF"
        stroke="#1A2024"
        strokeWidth="2"
      />
      <circle cx="47" cy="55" r="3" fill="#1A2024" />
      <circle cx="73" cy="55" r="3" fill="#1A2024" />
      <ellipse cx="60" cy="64" rx="6" ry="4" fill="#1A2024" />
    </svg>
  )
}
