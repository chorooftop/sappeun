import { getA11yProps, StickerFrame, type IllustSvgProps } from './base'

export function Mural({ size = 120, title, ...props }: IllustSvgProps) {
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
      <rect
        x="56"
        y="12"
        width="8"
        height="50"
        rx="2"
        fill="#3D464E"
        stroke="#1A2024"
        strokeWidth="2"
      />
      <rect
        x="50"
        y="62"
        width="20"
        height="8"
        fill="#FFC857"
        stroke="#1A2024"
        strokeWidth="2"
      />
      <path
        d="M46 70h28v18c0 6.627-5.373 12-12 12h-4c-6.627 0-12-5.373-12-12V70z"
        fill="#FF6B81"
        stroke="#1A2024"
        strokeWidth="2"
      />
    </svg>
  )
}
