# NoPhoto / SelfMission Source Of Truth - 2026-05-14

## Decision

For v1, `src/data/sheet.json` is the product source of truth for the mission cells.

- The seven `mission` cells are SelfMission cells.
- They should open the camera in photo modes.
- `camera: "front"` means front-facing camera, not NoPhoto.
- `variant: "k4Srv"` is not a NoPhoto signal.
- NoPhoto is active only when a cell explicitly has `noPhoto: true`.

## Why

Pencil still contains an older person/NoPhoto concept for the seven `k4Srv` cells, but the current data model has already moved those cells to self-shot missions such as `활짝 웃은 셀카`, `거울 셀카`, `내 그림자`, and `발 인증샷`.

Treating `k4Srv`, `mission`, or `camera: "front"` as NoPhoto would break the current photo-mode game loop by preventing selfie missions from opening the camera.

## Implementation Rule

```ts
cell.noPhoto === true
```

That is the only NoPhoto predicate.

In photo mode:

- `noPhoto: true` cell tap toggles marked state directly.
- Any other cell tap opens the camera modal.

## Current Data State

There are no active NoPhoto cells in the current v1 sheet data.

Future NoPhoto/person-spotting cells may be added by introducing `noPhoto: true` on those specific cells without changing camera or mission semantics.
