import { getA11yProps, type IllustSvgProps } from './base'

export function VendingMachine({
  size = 120,
  title,
  ...props
}: IllustSvgProps) {
  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      fill="none"
      {...getA11yProps(title)}
      {...props}
    >
      <rect width="120" height="120" rx="16" fill="#FFF1CF" />
      <rect
        x="1"
        y="1"
        width="118"
        height="118"
        rx="15"
        stroke="#1A2024"
        strokeWidth="2"
      />
      <rect
        x="24"
        y="12"
        width="72"
        height="96"
        rx="8"
        fill="#3DBC8A"
        stroke="#1A2024"
        strokeWidth="2"
      />
      <rect
        x="32"
        y="20"
        width="56"
        height="36"
        rx="4"
        fill="#FFFFFF"
        stroke="#1A2024"
      />
      <rect x="34" y="84" width="52" height="14" rx="2" fill="#1A2024" />
      <circle
        cx="79"
        cy="69"
        r="5"
        fill="#FFC857"
        stroke="#1A2024"
      />
    </svg>
  )
}
