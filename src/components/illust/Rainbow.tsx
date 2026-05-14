import { getA11yProps, type IllustSvgProps } from './base'

function halfEllipsePath(x: number, y: number, width: number, height: number) {
  const rx = width / 2
  const ry = height / 2
  const cy = y + ry
  return `M${x} ${cy}A${rx} ${ry} 0 0 1 ${x + width} ${cy}L${x + width} ${y + height}H${x}Z`
}

export function Rainbow({ size = 120, title, ...props }: IllustSvgProps) {
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
        d={halfEllipsePath(10, 30, 100, 80)}
        fill="#FF6B81"
        stroke="#1A2024"
        strokeWidth="2"
      />
      <path d={halfEllipsePath(18, 36, 84, 68)} fill="#FF9F4A" />
      <path d={halfEllipsePath(26, 42, 68, 56)} fill="#FFC857" />
      <path d={halfEllipsePath(34, 48, 52, 44)} fill="#3DBC8A" />
      <path d={halfEllipsePath(42, 54, 36, 32)} fill="#4ABFFA" />
      <ellipse
        cx="22"
        cy="99"
        rx="16"
        ry="11"
        fill="#FFFFFF"
        stroke="#1A2024"
        strokeWidth="2"
      />
      <ellipse
        cx="98"
        cy="99"
        rx="16"
        ry="11"
        fill="#FFFFFF"
        stroke="#1A2024"
        strokeWidth="2"
      />
    </svg>
  )
}
