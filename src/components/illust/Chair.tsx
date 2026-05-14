import { getA11yProps, StickerFrame, type IllustSvgProps } from './base'

export function Chair({ size = 120, title, ...props }: IllustSvgProps) {
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
      <path
        d="M34 24a8 8 0 0 1 8-8h36a8 8 0 0 1 8 8v46H34V24z"
        fill="#3DBC8A"
        stroke="#1A2024"
        strokeWidth="2"
      />
      <path
        d="M26 68a4 4 0 0 1 4-4h60a4 4 0 0 1 4 4v14H26V68z"
        fill="#FF6B81"
        stroke="#1A2024"
        strokeWidth="2"
      />
      <rect x="32" y="80" width="6" height="24" fill="#3D464E" />
      <rect x="82" y="80" width="6" height="24" fill="#3D464E" />
    </svg>
  )
}
