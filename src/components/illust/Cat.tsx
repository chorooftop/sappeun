import { getA11yProps, StickerFrame, type IllustSvgProps } from './base'

export function Cat({ size = 120, title, ...props }: IllustSvgProps) {
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
      <path d="M32 38L42 14L52 38Z" fill="#FFFFFF" stroke="#1A2024" strokeWidth="2" />
      <path d="M68 38L78 14L88 38Z" fill="#FFFFFF" stroke="#1A2024" strokeWidth="2" />
      <ellipse
        cx="60"
        cy="64"
        rx="35"
        ry="30"
        fill="#FFFFFF"
        stroke="#1A2024"
        strokeWidth="2"
      />
      <circle cx="47" cy="57" r="3" fill="#1A2024" />
      <circle cx="73" cy="57" r="3" fill="#1A2024" />
      <ellipse cx="60" cy="69" rx="4" ry="3" fill="#F58BA0" />
    </svg>
  )
}
