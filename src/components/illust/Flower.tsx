import { getA11yProps, StickerFrame, type IllustSvgProps } from './base'

export function Flower({ size = 120, title, ...props }: IllustSvgProps) {
  const petals = [
    [60, 35],
    [84, 52],
    [75, 80],
    [45, 80],
    [36, 52],
  ] as const

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
      {petals.map(([cx, cy]) => (
        <circle
          key={`${cx}-${cy}`}
          cx={cx}
          cy={cy}
          r="15"
          fill="#FF6B81"
          stroke="#1A2024"
          strokeWidth="2"
        />
      ))}
      <circle
        cx="60"
        cy="60"
        r="14"
        fill="#FFC857"
        stroke="#1A2024"
        strokeWidth="2"
      />
    </svg>
  )
}
