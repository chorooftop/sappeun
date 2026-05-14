import {
  Armchair,
  Bike,
  Bird,
  Brush,
  Bug,
  Cat,
  Clock,
  Cloud,
  CloudSun,
  Coffee,
  Dog,
  Fish,
  Flower,
  Flower2,
  Footprints,
  Heart,
  Lamp,
  Leaf,
  Mail,
  Moon,
  Package,
  Phone,
  Rainbow,
  ScanFace,
  Signpost,
  Smile,
  Sprout,
  SquareAsterisk,
  Star,
  Sun,
  ThumbsUp,
  Trees,
  Umbrella,
  type LucideIcon,
  type LucideProps,
} from 'lucide-react'

// Temporary bridge for Slice 6. Slice 7 will replace these lucide fallbacks
// with the sticker-flat illustration system and then remove or narrow this map.
const ICONS = {
  armchair: Armchair,
  bike: Bike,
  bird: Bird,
  brush: Brush,
  bug: Bug,
  cat: Cat,
  clock: Clock,
  cloud: Cloud,
  'cloud-sun': CloudSun,
  coffee: Coffee,
  dog: Dog,
  fish: Fish,
  flower: Flower,
  'flower-2': Flower2,
  footprints: Footprints,
  heart: Heart,
  lamp: Lamp,
  leaf: Leaf,
  mail: Mail,
  moon: Moon,
  package: Package,
  phone: Phone,
  rainbow: Rainbow,
  'scan-face': ScanFace,
  signpost: Signpost,
  smile: Smile,
  sprout: Sprout,
  'square-asterisk': SquareAsterisk,
  star: Star,
  sun: Sun,
  'thumbs-up': ThumbsUp,
  trees: Trees,
  umbrella: Umbrella,
} satisfies Record<string, LucideIcon>

export type SupportedIconName = keyof typeof ICONS

export function isSupportedIconName(name: string): name is SupportedIconName {
  return Object.prototype.hasOwnProperty.call(ICONS, name)
}

interface DynamicIconProps extends Omit<LucideProps, 'ref'> {
  name: string
}

export function DynamicIcon({ name, ...props }: DynamicIconProps) {
  if (!isSupportedIconName(name)) return null
  const Icon = ICONS[name]
  return <Icon {...props} />
}
