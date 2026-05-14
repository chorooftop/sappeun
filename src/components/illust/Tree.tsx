import { getA11yProps, StickerFrame, type IllustSvgProps } from './base'

export function Tree({ size = 120, title, ...props }: IllustSvgProps) {
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
      <path
        d="M54 74h12v26a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V74z"
        fill="#8B5A2B"
        stroke="#1A2024"
        strokeWidth="2"
      />
      <circle
        cx="60"
        cy="48"
        r="36"
        fill="#3DBC8A"
        stroke="#1A2024"
        strokeWidth="2"
      />
    </svg>
  )
}
