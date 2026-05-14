# Illustration System Gate - 2026-05-14

## Decision

Superseded on 2026-05-14 after Pencil review.

The sticker-flat React SVG strategy should not be wired into the product board.
The correct Pencil source of truth is now the BingoCell-style master copied from
`03. Cell Library 39종`, not the previous large sticker illustration library.

- Correct Pencil master: `vBjRp` — `04. Illustration Master 39종 (BingoCell Style)`
- Deprecated Pencil master: `QCUGW` — `DEPRECATED - Illustration Library 39종 (Sticker-Flat)`
- Product direction: keep the 66px `BingoCell/Idle` structure with a 30px lucide
  line icon slot (`BRawi`) and 10px label (`DBUFO`).
- Code cleanup: the obsolete `src/components/illust/` sticker SVG implementation
  and `/dev/ui` Stable 27 preview have been removed from the product codebase.

## Deprecated Gate Notes

The notes below are retained as historical implementation context only.
Do not use them as implementation direction.

Slice 7 had previously proceeded with the React SVG strategy.

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
| `5WE4s` | 고양이 | `Cat` |
| `d3vvN` | 강아지 | `Dog` |
| `6DLrw` | 참새 | `Sparrow` |
| `Adka8` | 나비 | `Butterfly` |
| `mfhbu` | 비둘기 | `Pigeon` |
| `j3RBu` | 물고기 | `Fish` |
| `l5HdD` | 시계 | `Clock` |
| `i7WBM` | 달 | `Moon` |
| `f9U3R` | 별 | `Star` |

The stable non-mission illustration gate is now complete: nature 8/8, manmade
10/10, animal 6/6, and time icon 3/3.

## Deprecated Files

- Components: removed from `src/components/illust/`
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
  - `/tmp/sappeun-pencil-animal-time-illust/5WE4s.png`
  - `/tmp/sappeun-pencil-animal-time-illust/d3vvN.png`
  - `/tmp/sappeun-pencil-animal-time-illust/6DLrw.png`
  - `/tmp/sappeun-pencil-animal-time-illust/Adka8.png`
  - `/tmp/sappeun-pencil-animal-time-illust/mfhbu.png`
  - `/tmp/sappeun-pencil-animal-time-illust/j3RBu.png`
  - `/tmp/sappeun-pencil-animal-time-illust/l5HdD.png`
  - `/tmp/sappeun-pencil-animal-time-illust/i7WBM.png`
  - `/tmp/sappeun-pencil-animal-time-illust/f9U3R.png`
- Local preview capture:
  - `/tmp/sappeun-local-audit/dev-ui-illust-gate.png`
  - `/tmp/sappeun-local-audit/dev-ui-nature-8.png`
  - `/tmp/sappeun-local-audit/dev-ui-manmade-10.png`
  - `/tmp/sappeun-local-audit/dev-ui-stable-27.png`

## Implementation Notes

- Components use `viewBox="0 0 120 120"` because the Pencil sample nodes are 120x120 sticker frames.
- `StickerFrame` centralizes the shared 120x120 rounded frame, fill, and ink stroke.
- The `Rainbow` component converts Pencil's `sweepAngle: 180` ellipses into SVG half-ellipse paths.
- Stable 27 mappings were removed with the obsolete sticker SVG implementation.
- Product board rendering should stay on lucide icons through `DynamicIcon`, matching
  Pencil `BingoCell/Idle`.

## Next Step

Continue porting the stable 27 non-mission illustration targets:

- nature 8 — done
- manmade 10 — done
- animal 6 — done
- time icon 3 — done

Mission/SelfMission cells can remain lucide fallback until their new Pencil artwork exists.
