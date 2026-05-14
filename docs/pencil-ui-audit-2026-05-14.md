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
  - `/tmp/sappeun-pencil-category-color/N7aHU.png` - Category-colored Cell Library
  - `/tmp/sappeun-pencil-category-color/Ih052.png` - Camera Modal target visual
- Local captures:
  - `/tmp/sappeun-local-audit/home-500.png`
  - `/tmp/sappeun-local-audit/board-standard-initial-500-after.png`
  - `/tmp/sappeun-local-audit/board-standard-polish-500.png`
  - `/tmp/sappeun-local-audit/bingo-time-labels.png`
  - `/tmp/sappeun-local-audit/bingo-photo-time-camera-hint.png`
  - `/tmp/sappeun-local-audit/dev-ui-stable-27.png`
  - `/tmp/sappeun-local-audit/photo-flow-board.png`
  - `/tmp/sappeun-local-audit/photo-flow-modal-open.png`
  - `/tmp/sappeun-local-audit/photo-flow-preview.png`
  - `/tmp/sappeun-local-audit/photo-flow-filled-cell.png`
  - `/tmp/sappeun-local-audit/photo-flow-standard-mark.png`
  - `/tmp/sappeun-local-audit/photo-flow-permission-denied.png`
  - `/tmp/sappeun-local-audit/photo-flow-3x3-board.png`
  - `/tmp/sappeun-color-category-audit/dev-ui-category-cells.png`
  - `/tmp/sappeun-color-category-audit/board-5x5-colored.png`
  - `/tmp/sappeun-color-category-audit/board-3x3-colored.png`
  - `/tmp/sappeun-color-category-audit/camera-modal-target-icon.png`
  - `/tmp/sappeun-color-category-audit/camera-modal-color-swatch.png`
  - `/tmp/sappeun-color-category-audit/bingo-celebration.png`
  - `/tmp/sappeun-caption-audit/dev-ui-captions.png`
  - `/tmp/sappeun-caption-audit/board-5x5-captions.png`
  - `/tmp/sappeun-caption-audit/camera-color-caption.png`

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
| Text-only targets | `숫자 7`, `숫자 5`, and `T자 표지` are ambiguous if the board only shows `7`, `5`, `T`. | Added `caption`, `captureLabel`, and `hint` metadata so board cells show `숫자`/`글자`, and camera mode explains where to find the target. |
| Camera modal reliability | S5 assumes a full-screen capture surface with clear recovery paths. | Added capture gating until video is playable, retry for camera errors, and keyboard focus wrapping inside the modal. |
| Category color library | Bingo cells needed clearer category distinction while keeping the 66px cell readable. | Added category soft tints, category ink icons, `self` category, `color` category swatches, and matching frontend rendering. |
| Camera target visual | Camera header only showed `찾기` and the target name. | Added the target icon, text badge, or color swatch above `찾기` in the camera modal header. |
| Bingo completion feedback | Completed bingo lines only changed the progress text/glow. | Added a small 800ms toast for newly completed bingo lines. |
| Abstract target explanation | `7`, `T`, and color names alone did not clearly say what action was expected. | Added visible sub captions like `숫자 찾기`, `글자 찾기`, and `색 찾기`; changed color labels from `검은 것` style to `검은색` style. |
| Self target copy | `내가 고른 색` did not clearly say what to photograph. | Renamed the self mission to `옷 색 셀카` and added a camera hint: `오늘 입은 옷 색이 보이게 찍어요`. |

## Validation Notes

- Photo-mode success path verified on `/bingo?mode=5x5`: open cell, launch camera modal, wait for playable stream, capture, preview, use, and return to board.
- 3x3 photo board verified at 390px viewport without cell overflow or footer overlap.
- Permission-denied path verified by forcing `getUserMedia` to reject with `NotAllowedError`: error copy appears with `다시 시도` and `닫기`.
- Standard mode verified on `/bingo?mode=standard`: tapping a cell marks it without opening the camera modal.
- Keyboard accessibility verified in the camera modal: initial focus lands on close, `Shift+Tab` wraps to camera switch, `Tab` wraps back to close, and `Escape` closes.
- Category color pass verified on `/dev/ui`, `/bingo?mode=5x5`, and `/bingo?mode=3x3`.
- Color category camera pass verified by opening a color swatch cell and checking the swatch above `찾기`.
- Bingo completion impact verified by completing the first row in standard mode.
- Abstract target captions verified in Pencil and frontend: color cells show `색 찾기`, numeric cells show `숫자 찾기`, and letter cells show `글자 찾기`.
- Self mission wording verified in Pencil data sync: `내가 고른 색` is now `옷 색 셀카`.
- `gstack-browse` is still not initialized in this workspace, so this pass used local Chrome headless/Playwright against `localhost:3000`.

## Visual Decisions

- Illustration master correction: `QCUGW` sticker-flat library is deprecated. Use
  new Pencil master `vBjRp` (`04. Illustration Master 39종 (BingoCell Style)`),
  copied from `03. Cell Library 39종`.
- Future frontend work should not place 120px sticker cards inside 66px bingo
  cells. The target is the existing BingoCell style: 30px lucide line icon +
  10px label inside the 66px cell.
- Frontend cleanup removed the obsolete `src/components/illust/` sticker SVG set
  and the `/dev/ui` Stable 27 preview. `DynamicIcon` remains the product icon path.
- Native mobile status bars shown in Pencil are not implemented in the web UI. The app renders inside the browser/PWA viewport, so this remains intentional.
- Home and Board are centered in wider desktop captures because the app frame is constrained to 390px. On actual mobile/PWA width the frame fills the viewport.
- The Board no longer expands to tablet/desktop widths; this intentionally follows the Pencil mobile-first S2 frame.
- S5 camera modal was checked visually in Chrome via the photo-mode board flow. The current modal remains aligned with Pencil's dark full-screen capture surface.

## Follow-Up For Frontend Work

- Keep the Pencil cell source of truth as: 66px mobile cell target, 6px radius, 6px grid gap, dark idle icon/label, green marked fill, pink free fill.
- Preserve text-only target guidance in future board redesigns: visible board caption (`숫자`/`글자`), accessible capture label (`숫자 7`, `숫자 5`, `T 글자`), and camera hint examples (`간판`, `주소`, `버스 번호`, `가격표`, `로고`, `티셔츠`).
- When implementing future board states, avoid reintroducing category-colored idle icons unless Pencil adds that variant.
- Re-run visual capture after the next frontend slice with gstack browse once its one-time setup is complete; current captures used Pencil export, Chrome headless, and direct Chrome interaction.
- NoPhoto is product-defined by explicit `noPhoto: true` only. `camera: "front"` remains a front-facing camera hint, not a NoPhoto marker.
- `mission` has been renamed to `self` in frontend data and types. Future category work should use `self` and `color`, not `mission`.
- Color labels should use color-name phrasing (`검은색`, `빨간색`) rather than object phrasing (`검은 것`, `빨간 것`) in visible cell labels.
- Self missions should describe a concrete photo action in the label itself. Avoid abstract wording like `내가 고른 색`; use labels like `옷 색 셀카` plus a short camera hint.
