import { getA11yProps, StickerFrame, type IllustSvgProps } from './base'

export function Fish({ size = 120, title, ...props }: IllustSvgProps) {
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
        cx="42"
        cy="61"
        rx="30"
        ry="17"
        fill="#3DBC8A"
        stroke="#1A2024"
        strokeWidth="2"
      />
      <path d="M68 61L90 46V76Z" fill="#3DBC8A" stroke="#1A2024" strokeWidth="2" />
      <circle cx="20.5" cy="56.5" r="2.5" fill="#FFFFFF" />
      <path
        d="M49 47C51 54 51 68 49 75"
        stroke="#1A2024"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}
