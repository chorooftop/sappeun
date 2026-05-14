# Pencil UI Audit - 2026-05-14

## Scope

- Compared Pencil source screens/components against the current frontend implementation.
- Pencil file: `/Users/oksang/Desktop/sappeun/new.pen`
- Pencil captures:
  - `/tmp/sappeun-pencil-audit/St1JE.png` - S1 Home
  - `/tmp/sappeun-pencil-audit/zOKkC.png` - S2 Bingo Board
  - `/tmp/sappeun-pencil-audit/Ih052.png` - S5 Camera Modal
  - `/tmp/sappeun-pencil-audit/QeQCU.png` - BingoCell/Idle
  - `/tmp/sappeun-pencil-audit/Ppbhg.png` - BingoCell/BingoGlow
- Local captures:
  - `/tmp/sappeun-local-audit/home-500.png`
  - `/tmp/sappeun-local-audit/board-standard-initial-500-after.png`
  - `/tmp/sappeun-local-audit/board-standard-polish-500.png`

## Changes Applied

| Area | Pencil Finding | Frontend Change |
| --- | --- | --- |
| Bingo cell radius | `BingoCell/Idle` uses 6px corner radius. | Changed `--radius-cell` from 10px to 6px. |
| Bingo grid spacing | S2 grid rows and columns use 6px gap. | Changed board grid gap from 8px to 6px. |
| BingoGlow | `BingoCell/BingoGlow` uses yellow outer glow without a visible yellow ring. | Removed the ring and matched the glow to `0 0 14px 1px #FFC857`. |
| Idle cell icons | Pencil idle cells use dark ink icons/labels, not category-colored icons. | Changed unmarked cell icons to `text-ink-700` and icon size to 30px. |
| Board frame width | S2 is a fixed 390px mobile app frame. | Changed the board shell from `max-w-md` to `max-w-[390px]`. |
| Board bands | S2 Header, Progress, and BottomBar are white full-width bands. | Split Board into white header/progress/footer bands with the grid on canvas. |
| Bottom CTA | S2 primary end CTA uses stronger 16px label weight inside a white bottom bar. | Updated end CTA text to `text-base` and moved footer spacing to the band. |

## Visual Decisions

- Native mobile status bars shown in Pencil are not implemented in the web UI. The app renders inside the browser/PWA viewport, so this remains intentional.
- Home and Board are centered in wider desktop captures because the app frame is constrained to 390px. On actual mobile/PWA width the frame fills the viewport.
- The Board no longer expands to tablet/desktop widths; this intentionally follows the Pencil mobile-first S2 frame.
- S5 camera modal was checked visually in Chrome via the photo-mode board flow. The current modal remains aligned with Pencil's dark full-screen capture surface.

## Follow-Up For Frontend Work

- Keep the Pencil cell source of truth as: 66px mobile cell target, 6px radius, 6px grid gap, dark idle icon/label, green marked fill, pink free fill.
- When implementing future board states, avoid reintroducing category-colored idle icons unless Pencil adds that variant.
- Re-run visual capture after the next frontend slice with gstack browse once its one-time setup is complete; current captures used Pencil export, Chrome headless, and direct Chrome interaction.
- NoPhoto remains blocked until the `sheet.json` self-mission entries are reconciled with the Pencil NoPhoto board source of truth.
