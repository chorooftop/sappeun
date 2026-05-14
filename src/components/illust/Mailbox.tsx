import { getA11yProps, StickerFrame, type IllustSvgProps } from './base'

export function Mailbox({ size = 120, title, ...props }: IllustSvgProps) {
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
        d="M30 44c0-13.255 10.745-24 24-24h12c13.255 0 24 10.745 24 24v60H30V44z"
        fill="#FF6B81"
        stroke="#1A2024"
        strokeWidth="2"
      />
      <rect x="42" y="46" width="36" height="4" rx="1" fill="#1A2024" />
    </svg>
  )
}
