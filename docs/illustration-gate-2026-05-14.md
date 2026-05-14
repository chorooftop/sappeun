# Illustration System Gate - 2026-05-14

## Decision

Slice 7 can proceed with the React SVG strategy.

The Pencil sample nodes for the day-1 gate use a manageable shape subset:

- `frame`
- `rectangle`
- `ellipse`
- `path`
- `ellipse.sweepAngle: 180`

This is enough to represent the initial sticker-flat illustration style without falling back to bitmap assets.

## Samples Implemented

| Pencil Node | Label | Component |
| --- | --- | --- |
| `43jQ0` | 나뭇잎 | `NatureLeaf` |
| `rR3JN` | 무지개 | `Rainbow` |
| `XjVpp` | 자판기 | `VendingMachine` |

## Files

- Components: `src/components/illust/`
- Preview: `src/app/dev/ui/page.tsx`
- Pencil captures:
  - `/tmp/sappeun-pencil-illust-gate/43jQ0.png`
  - `/tmp/sappeun-pencil-illust-gate/rR3JN.png`
  - `/tmp/sappeun-pencil-illust-gate/XjVpp.png`
- Local preview capture:
  - `/tmp/sappeun-local-audit/dev-ui-illust-gate.png`

## Implementation Notes

- Components use `viewBox="0 0 120 120"` because the Pencil sample nodes are 120x120 sticker frames.
- The `Rainbow` component converts Pencil's `sweepAngle: 180` ellipses into SVG half-ellipse paths.
- The first gate keeps these illustrations in `/dev/ui` only. Board cell integration should happen after enough icons are ported to avoid a mixed lucide/sticker visual state in the product board.

## Next Step

Port the stable 27 non-mission illustration targets first:

- nature 8
- manmade 10
- animal 6
- time icon 3

Mission/SelfMission cells can remain lucide fallback until their new Pencil artwork exists.
