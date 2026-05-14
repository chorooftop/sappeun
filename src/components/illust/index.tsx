import type { ComponentType } from 'react'
import { NatureLeaf } from './NatureLeaf'
import { Rainbow } from './Rainbow'
import { VendingMachine } from './VendingMachine'
import type { IllustSvgProps } from './base'

export type IllustKey = 'natureLeaf' | 'rainbow' | 'vendingMachine'

export const ILLUST_COMPONENTS: Record<
  IllustKey,
  ComponentType<IllustSvgProps>
> = {
  natureLeaf: NatureLeaf,
  rainbow: Rainbow,
  vendingMachine: VendingMachine,
}

export const ILLUST_BY_ICON = {
  leaf: 'natureLeaf',
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
