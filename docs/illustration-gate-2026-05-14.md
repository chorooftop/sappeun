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
| `TEUMp` | 꽃 | `Flower` |
| `43jQ0` | 나뭇잎 | `NatureLeaf` |
| `R4nEb` | 민들레 | `Dandelion` |
| `ZfTPv` | 화분 | `PottedPlant` |
| `6wNxN` | 나무 | `Tree` |
| `mL1Xy` | 구름 | `Cloud` |
| `yWRog` | 햇빛 | `Sunlight` |
| `rR3JN` | 무지개 | `Rainbow` |
| `XjVpp` | 자판기 | `VendingMachine` |
| `YUZPf` | 표지판 | `Signpost` |
| `BMaHR` | 공중전화 | `PublicPhone` |
| `SiUOu` | 우체통 | `Mailbox` |
| `Pj5AU` | 가로등 | `StreetLamp` |
| `5k84g` | 자전거 | `Bicycle` |
| `Z6pd9` | 우산 | `Umbrella` |
| `0fzlN` | 의자 | `Chair` |
| `OHKjM` | 벽화 | `Mural` |
| `QTTTc` | 횡단보도 | `Crosswalk` |

The first two stable sets are now complete: nature 8/8 and manmade 10/10.

## Files

- Components: `src/components/illust/`
- Preview: `src/app/dev/ui/page.tsx`
- Pencil captures:
  - `/tmp/sappeun-pencil-illust-gate/43jQ0.png`
  - `/tmp/sappeun-pencil-illust-gate/rR3JN.png`
  - `/tmp/sappeun-pencil-illust-gate/XjVpp.png`
  - `/tmp/sappeun-pencil-nature-illust/TEUMp.png`
  - `/tmp/sappeun-pencil-nature-illust/43jQ0.png`
  - `/tmp/sappeun-pencil-nature-illust/R4nEb.png`
  - `/tmp/sappeun-pencil-nature-illust/ZfTPv.png`
  - `/tmp/sappeun-pencil-nature-illust/6wNxN.png`
  - `/tmp/sappeun-pencil-nature-illust/mL1Xy.png`
  - `/tmp/sappeun-pencil-nature-illust/yWRog.png`
  - `/tmp/sappeun-pencil-nature-illust/rR3JN.png`
  - `/tmp/sappeun-pencil-manmade-illust/XjVpp.png`
  - `/tmp/sappeun-pencil-manmade-illust/YUZPf.png`
  - `/tmp/sappeun-pencil-manmade-illust/BMaHR.png`
  - `/tmp/sappeun-pencil-manmade-illust/SiUOu.png`
  - `/tmp/sappeun-pencil-manmade-illust/Pj5AU.png`
  - `/tmp/sappeun-pencil-manmade-illust/5k84g.png`
  - `/tmp/sappeun-pencil-manmade-illust/Z6pd9.png`
  - `/tmp/sappeun-pencil-manmade-illust/0fzlN.png`
  - `/tmp/sappeun-pencil-manmade-illust/OHKjM.png`
  - `/tmp/sappeun-pencil-manmade-illust/QTTTc.png`
- Local preview capture:
  - `/tmp/sappeun-local-audit/dev-ui-illust-gate.png`
  - `/tmp/sappeun-local-audit/dev-ui-nature-8.png`
  - `/tmp/sappeun-local-audit/dev-ui-manmade-10.png`

## Implementation Notes

- Components use `viewBox="0 0 120 120"` because the Pencil sample nodes are 120x120 sticker frames.
- `StickerFrame` centralizes the shared 120x120 rounded frame, fill, and ink stroke.
- The `Rainbow` component converts Pencil's `sweepAngle: 180` ellipses into SVG half-ellipse paths.
- The current nature and manmade sets are exposed in `ILLUST_BY_ICON` for later `Cell` wiring, but product board integration is intentionally postponed until more of the 27 stable icons are available.
- The first gate keeps these illustrations in `/dev/ui` only. Board cell integration should happen after enough icons are ported to avoid a mixed lucide/sticker visual state in the product board.

## Next Step

Continue porting the stable 27 non-mission illustration targets:

- nature 8 — done
- manmade 10 — done
- animal 6
- time icon 3

Mission/SelfMission cells can remain lucide fallback until their new Pencil artwork exists.
