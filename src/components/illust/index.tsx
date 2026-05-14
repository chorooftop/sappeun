import type { ComponentType } from 'react'
import { Cloud } from './Cloud'
import { Dandelion } from './Dandelion'
import { Flower } from './Flower'
import { NatureLeaf } from './NatureLeaf'
import { PottedPlant } from './PottedPlant'
import { Rainbow } from './Rainbow'
import { Sunlight } from './Sunlight'
import { Tree } from './Tree'
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
} satisfies Record<string, IllustKey>

interface IllustProps extends IllustSvgProps {
  name: IllustKey
}

export function Illust({ name, ...props }: IllustProps) {
  const Component = ILLUST_COMPONENTS[name]
  return <Component {...props} />
}
