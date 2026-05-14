import type { ComponentType } from 'react'
import { Bicycle } from './Bicycle'
import { Butterfly } from './Butterfly'
import { Cat } from './Cat'
import { Chair } from './Chair'
import { Clock } from './Clock'
import { Cloud } from './Cloud'
import { Crosswalk } from './Crosswalk'
import { Dandelion } from './Dandelion'
import { Dog } from './Dog'
import { Fish } from './Fish'
import { Flower } from './Flower'
import { Mailbox } from './Mailbox'
import { Moon } from './Moon'
import { Mural } from './Mural'
import { NatureLeaf } from './NatureLeaf'
import { Pigeon } from './Pigeon'
import { PottedPlant } from './PottedPlant'
import { PublicPhone } from './PublicPhone'
import { Rainbow } from './Rainbow'
import { Signpost } from './Signpost'
import { Sparrow } from './Sparrow'
import { Star } from './Star'
import { StreetLamp } from './StreetLamp'
import { Sunlight } from './Sunlight'
import { Tree } from './Tree'
import { Umbrella } from './Umbrella'
import { VendingMachine } from './VendingMachine'
import type { IllustSvgProps } from './base'

export type IllustKey =
  | 'flower'
  | 'natureLeaf'
  | 'dandelion'
  | 'pottedPlant'
  | 'tree'
  | 'cloud'
  | 'sunlight'
  | 'rainbow'
  | 'vendingMachine'
  | 'signpost'
  | 'publicPhone'
  | 'mailbox'
  | 'streetLamp'
  | 'bicycle'
  | 'umbrella'
  | 'chair'
  | 'mural'
  | 'crosswalk'
  | 'cat'
  | 'dog'
  | 'sparrow'
  | 'butterfly'
  | 'pigeon'
  | 'fish'
  | 'clock'
  | 'moon'
  | 'star'

export const ILLUST_COMPONENTS: Record<
  IllustKey,
  ComponentType<IllustSvgProps>
> = {
  flower: Flower,
  natureLeaf: NatureLeaf,
  dandelion: Dandelion,
  pottedPlant: PottedPlant,
  tree: Tree,
  cloud: Cloud,
  sunlight: Sunlight,
  rainbow: Rainbow,
  vendingMachine: VendingMachine,
  signpost: Signpost,
  publicPhone: PublicPhone,
  mailbox: Mailbox,
  streetLamp: StreetLamp,
  bicycle: Bicycle,
  umbrella: Umbrella,
  chair: Chair,
  mural: Mural,
  crosswalk: Crosswalk,
  cat: Cat,
  dog: Dog,
  sparrow: Sparrow,
  butterfly: Butterfly,
  pigeon: Pigeon,
  fish: Fish,
  clock: Clock,
  moon: Moon,
  star: Star,
}

export const ILLUST_BY_ICON = {
  'flower-2': 'flower',
  leaf: 'natureLeaf',
  sprout: 'dandelion',
  flower: 'pottedPlant',
  trees: 'tree',
  cloud: 'cloud',
  sun: 'sunlight',
  rainbow: 'rainbow',
  package: 'vendingMachine',
  signpost: 'signpost',
  phone: 'publicPhone',
  mail: 'mailbox',
  lamp: 'streetLamp',
  bike: 'bicycle',
  umbrella: 'umbrella',
  armchair: 'chair',
  brush: 'mural',
  'square-asterisk': 'crosswalk',
  cat: 'cat',
  dog: 'dog',
  bird: 'sparrow',
  bug: 'butterfly',
  fish: 'fish',
  clock: 'clock',
  moon: 'moon',
  star: 'star',
} satisfies Record<string, IllustKey>

export const ILLUST_BY_CELL_ID = {
  n01: 'flower',
  n02: 'natureLeaf',
  n03: 'dandelion',
  n04: 'pottedPlant',
  n05: 'tree',
  n06: 'cloud',
  n07: 'sunlight',
  n08: 'rainbow',
  m01: 'vendingMachine',
  m02: 'signpost',
  m03: 'publicPhone',
  m04: 'mailbox',
  m05: 'streetLamp',
  m06: 'bicycle',
  m07: 'umbrella',
  m08: 'chair',
  m09: 'mural',
  m10: 'crosswalk',
  a01: 'cat',
  a02: 'dog',
  a03: 'sparrow',
  a04: 'butterfly',
  a05: 'pigeon',
  a06: 'fish',
  t04: 'clock',
  t05: 'moon',
  t06: 'star',
} satisfies Record<string, IllustKey>

interface IllustProps extends IllustSvgProps {
  name: IllustKey
}

export function Illust({ name, ...props }: IllustProps) {
  const Component = ILLUST_COMPONENTS[name]
  return <Component {...props} />
}
