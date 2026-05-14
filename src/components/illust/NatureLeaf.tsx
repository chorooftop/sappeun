import { getA11yProps, type IllustSvgProps } from './base'

export function NatureLeaf({
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
      <rect width="120" height="120" rx="16" fill="#D8F1E6" />
      <rect
        x="1"
        y="1"
        width="118"
        height="118"
        rx="15"
        stroke="#1A2024"
        strokeWidth="2"
      />
      <path
        d="M60 18c30 20 30 60 0 84-30-24-30-64 0-84z"
        fill="#3DBC8A"
        stroke="#1A2024"
        strokeWidth="2"
      />
      <rect x="59" y="24" width="2" height="74" fill="#1A2024" />
    </svg>
  )
}
