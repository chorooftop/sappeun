import type { ComponentType } from 'react'
import { Bicycle } from './Bicycle'
import { Chair } from './Chair'
import { Cloud } from './Cloud'
import { Crosswalk } from './Crosswalk'
import { Dandelion } from './Dandelion'
import { Flower } from './Flower'
import { Mailbox } from './Mailbox'
import { Mural } from './Mural'
import { NatureLeaf } from './NatureLeaf'
import { PottedPlant } from './PottedPlant'
import { PublicPhone } from './PublicPhone'
import { Rainbow } from './Rainbow'
import { Signpost } from './Signpost'
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
} satisfies Record<string, IllustKey>

interface IllustProps extends IllustSvgProps {
  name: IllustKey
}

export function Illust({ name, ...props }: IllustProps) {
  const Component = ILLUST_COMPONENTS[name]
  return <Component {...props} />
}
