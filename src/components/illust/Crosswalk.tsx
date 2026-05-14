import { getA11yProps, StickerFrame, type IllustSvgProps } from './base'

export function Crosswalk({ size = 120, title, ...props }: IllustSvgProps) {
  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      fill="none"
      {...getA11yProps(title)}
      {...props}
    >
      <StickerFrame fill="#3D464E" />
      <rect x="16" y="24" width="88" height="14" rx="2" fill="#FFFFFF" />
      <rect x="16" y="52" width="88" height="14" rx="2" fill="#FFFFFF" />
      <rect x="16" y="80" width="88" height="14" rx="2" fill="#FFFFFF" />
    </svg>
  )
}
