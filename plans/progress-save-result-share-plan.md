# 진행 상태 저장 + 결과/공유 기반 기획

작성일: 2026-05-14
상태: Slice 2 구현 반영
전제: `standard` 모드는 제거하고, v1은 사진 기반 `5x5`/`3x3` 산책 빙고에 집중한다.

<!-- updated 2026-05-14: localStorage 1차 저장 범위와 사진 Blob 제외 정책을 명확화 -->

## 1. 목적

사뿐의 다음 단계는 “한 번 시작한 산책 빙고가 끝까지 살아 있는” 경험을 만드는 것이다. 사용자가 산책 중 화면을 닫거나 새로고침해도 보드 구성, 완료 상태, 촬영 결과가 가능한 범위에서 복원되어야 한다.

이번 기획은 아래 네 가지를 순서대로 연결한다.

- 진행 상태 저장
- 결과 화면
- 공유 이미지 저장
- 카메라/QA 안정화

이번 문서의 1차 구현 범위는 “진행 중 보드가 사라지지 않는 것”이다. 사진 자체의 영속 저장은 IndexedDB 설계가 필요하므로 별도 slice로 분리한다.

## 2. 제품 결정

### Standard 모드 제거

결정:

- `standard` 모드는 v1에서 제거한다.
- 홈에서는 `사진 모드`만 활성 모드로 둔다.
- 판 크기는 `5x5`와 `3x3`만 제공한다.
- `/bingo?mode=standard`는 `/`로 redirect한다.

이유:

- 현재 셀 라이브러리는 사진 촬영 미션 중심이다.
- 사진 없이 단순 체크하는 모드는 사뿐의 핵심 차별점과 맞지 않는다.
- 저장/결과/공유 설계에서 `standard`만 별도 예외가 생겨 복잡도가 오른다.
- 접근성 또는 오프라인 수요는 추후 “프린트 모드”나 “접근성 옵션”으로 다시 설계하는 편이 낫다.

유지:

- `noPhoto: true` 셀 직접 완료 규칙은 유지한다.
- FREE 칸 자동 완료는 유지한다.
- 향후 사진 없는 특수 미션을 추가할 수 있도록 데이터 구조는 열어둔다.

## 3. 큰 주제와 세부 작업

### A. 진행 상태 저장

목표:

- 새로고침, 뒤로가기, 브라우저 재진입에도 진행 중 보드를 복원한다.
- 저장 실패가 있어도 현재 세션 플레이는 막지 않는다.

세부 작업:

- 보드 세션 ID 생성
- `mode`, `nickname`, `createdAt`, `updatedAt`, `freePosition`, `cellIds` 저장
- FREE와 `noPhoto: true` 직접 완료 칸만 `markedPositions`로 저장
- 사진이 필요한 칸의 완료 상태와 Blob metadata는 1차 영속 저장 대상에서 제외
- 새로고침 시 저장된 보드 복원
- 홈에서 진행 중 보드가 있으면 이어하기 제공
- 산책 종료 시 세션 정리
- 저장소 차단/용량 초과 fallback 처리

### B. 결과 화면

목표:

- 산책 종료가 단순 이탈이 아니라 완료 경험으로 이어진다.
- 사용자가 결과를 보고 다시 시작하거나 저장/공유할 수 있다.

세부 작업:

- 결과 상태 또는 `/result` 라우트 결정
- 채운 칸 수, 빙고 줄 수, 진행률 표시
- 사진 썸네일 요약
- 3x3/5x5별 결과 문구 분기
- “이미지 저장”, “다시 하기”, “홈으로” CTA 구성
- 빙고가 없어도 긍정적인 마무리 문구 제공

### C. 공유 이미지 저장

목표:

- 완성된 빙고판을 이미지로 저장하거나 공유할 수 있다.
- 사진 셀과 다크/라이트 테마가 결과 이미지에서도 자연스럽게 보인다.

세부 작업:

- DOM 캡처 라이브러리 vs Canvas 직접 렌더 비교
- 사진 셀, FREE, marked, bingo glow 포함 확인
- 라이트/다크 테마별 공유 이미지 품질 확인
- 모바일 `navigator.share`/다운로드 fallback 확인
- 저장 실패 안내 추가
- 결과 화면 CTA와 연결

### D. 카메라 플로우 안정화

목표:

- 사진 기반 모드만 남기는 만큼 카메라 실패/복구 흐름을 더 신뢰감 있게 만든다.

세부 작업:

- 권한 거부 안내 고도화
- iOS/Android 브라우저별 에러 메시지 정리
- 촬영 실패 시 재시도 안내
- 전면 카메라 미션의 좌우 반전 정책 결정
- 사진 삭제/다시 찍기 UX 보강
- 촬영 전후 저장 상태와 충돌 없는지 확인

### E. QA 안정화

목표:

- 저장/결과/공유가 들어와도 기존 보드 경험이 흔들리지 않는다.

세부 작업:

- 3x3 시작 → 촬영 → 새로고침 → 복원
- 5x5 시작 → 여러 칸 촬영 → 종료 → 결과
- 다크/라이트 전환 후 저장 상태 유지
- 카메라 권한 거부 후 저장 데이터 무결성 확인
- `/bingo?mode=standard` redirect 확인
- Next `middleware` → `proxy` deprecation 정리

## 4. 저장 설계 v1

### 4-1. 저장소 결정

1차 구현:

- 보드 구조: `localStorage`
- 직접 완료 상태: `localStorage`
- 촬영 사진의 현재 탭 표시: `URL.createObjectURL(blob)` 메모리 유지
- 촬영 사진 영속 복원: 1차 범위 제외

2차 구현:

- 사진 Blob 영속 복원: IndexedDB
- 원격 백업/공유: R2 또는 Supabase storage

이유:

- `localStorage`는 문자열 상태 저장에 충분하고 구현이 빠르다.
- Blob을 base64로 localStorage에 넣으면 용량과 성능 문제가 크다.
- 사진 영속 저장은 IndexedDB schema와 cleanup 정책이 필요하므로 별도 slice가 안전하다.

### 4-2. Storage key

```ts
const ACTIVE_SESSION_KEY = 'sappeun-active-board-v1'
const SESSION_PREFIX = 'sappeun-board-v1:'
```

사용 규칙:

- `ACTIVE_SESSION_KEY`: 현재 이어할 board session id만 저장
- `${SESSION_PREFIX}${sessionId}`: 실제 board session payload 저장
- 버전이 바뀌면 prefix를 올려 migration 충돌을 피한다.

### 4-3. BoardSession schema

```ts
type PersistedBoardMode = '5x5' | '3x3'

interface PersistedBoardSessionV1 {
  version: 1
  sessionId: string
  mode: PersistedBoardMode
  nickname: string
  createdAt: string
  updatedAt: string
  freePosition: number
  cellIds: string[]
  markedPositions: number[]
  endedAt: string | null
}
```

필드 설명:

- `cellIds`: 셔플 결과를 고정하기 위한 source of truth
- `markedPositions`: FREE와 `noPhoto: true` 직접 완료 칸만 저장한다.
- `endedAt`: 결과 화면 진입 또는 종료 처리 기준

의도적으로 제외:

- `photoPositions`
- `photoBlobKey`
- `photoPreviewUrl`

사진 관련 필드는 IndexedDB slice에서 schema를 확정한 뒤 추가한다.

### 4-4. 저장 타이밍

- 보드 최초 생성 시 session 저장
- FREE 또는 `noPhoto: true` 직접 완료 변경 시 저장
- 사진 capture 성공 시 현재 React state에는 반영하되, localStorage에는 사진 칸 완료 상태를 저장하지 않음
- 사진 삭제 시 현재 React state만 정리
- 셔플 확정 시 새 session으로 교체
- 산책 종료 확인 시 `endedAt` 업데이트 후 결과 화면으로 이동하거나 session 삭제

### 4-5. 복원 규칙

복원 가능:

- `mode`
- `nickname`
- `cellIds`
- FREE와 `noPhoto: true` 기반 `markedPositions`
- FREE 위치
- 날짜/진행률/빙고 줄 계산

1차에서 복원하지 않는 것:

- 실제 사진 Blob
- Object URL

사진 복원 UX:

- 1차에서는 `photoPositions`를 저장하지 않는다.
- 사진 Blob 영속 저장 전까지 사진 칸은 새로고침 후 미완료로 돌아간다.
- 사용자는 해당 칸을 다시 눌러 사진을 다시 찍을 수 있다.
- 이 정책은 사진이 사라졌는데 완료만 남는 어색한 상태를 피하기 위한 것이다.

최종 1차 결정:

- `cellIds`, `nickname`, `mode`, `freePosition`, `createdAt`은 저장한다.
- `markedPositions`는 FREE와 `noPhoto: true` 완료만 저장한다.
- 사진 완료 상태 영속 저장은 IndexedDB slice에서 구현한다.

### 4-6. 직접 완료 판별 규칙

```ts
function canPersistMarkedCell(cell: CellMaster, position: number, freePosition: number) {
  return position === freePosition || cell.noPhoto === true
}
```

규칙:

- FREE 칸은 보드 생성 시 항상 완료로 간주한다.
- `noPhoto: true` 셀은 사용자가 직접 탭해서 완료/해제할 수 있고 영속 저장한다.
- 일반 사진 셀은 사진 Blob 저장소가 준비되기 전까지 영속 marked 대상이 아니다.
- 저장 직전에는 `markedPositions.filter(position => canPersistMarkedCell(...))` 형태로 한 번 더 거른다.

## 5. 구현 구조

### 신규 파일 후보

- `src/lib/bingo/persistence.ts`
- `src/lib/bingo/session.ts`
- `src/types/persisted-board.ts`

### 주요 함수 후보

```ts
createBoardSession(input): PersistedBoardSessionV1
saveBoardSession(session): void
loadActiveBoardSession(): PersistedBoardSessionV1 | null
clearActiveBoardSession(): void
resolveCellsFromSession(session, cellById): CellMaster[]
filterPersistableMarkedPositions(marked, cells, freePosition): number[]
```

### 기존 파일 영향 범위

- `src/app/page.tsx`: 이어하기 CTA와 새로 시작 확인 UX
- `src/app/(game)/bingo/page.tsx`: query 검증, session 복원, invalid session redirect
- `src/components/bingo/Board.tsx`: 초기 상태 주입, 완료 상태 저장, 종료/셔플 시 정리
- `src/lib/bingo/compose.ts`: `cellIds` 기반 보드 재구성 helper 추가
- `src/types/bingo.ts`: session 관련 타입과 board mode 정합성 확인

### 컴포넌트 연결

Home:

- active session이 있으면 CTA를 `이어하기`로 전환하거나 보조 버튼으로 표시
- 새로 시작 시 기존 session 삭제 확인

BingoPage:

- query string이 유효하면 새 session 생성 또는 기존 query 기반 보드 생성
- active session id가 있으면 `/bingo?session=...` 구조를 검토

BingoBoard:

- 초기 state를 session에서 받도록 props 확장
- persist 가능한 `marked` 변경 시 persistence 호출
- `photos` 변경은 현재 세션 UI state로만 유지
- 종료/셔플 시 session 정리

## 6. UX 플로우

### 신규 시작

1. 홈에서 닉네임 입력
2. 5x5/3x3 선택
3. `산책 시작하기`
4. board session 생성
5. `/bingo?session={sessionId}` 또는 `/bingo?mode=...&nickname=...` 진입

추천:

- 1차는 기존 query 유지
- session 저장은 내부에서만 처리
- 다음 단계에서 URL을 `session` 기반으로 정리

예외:

- active session이 있는데 사용자가 새 닉네임/판 크기로 시작하면 기존 session을 삭제하고 새 session을 만든다.
- query의 `mode`가 유효하지 않으면 session을 만들지 않고 홈으로 돌려보낸다.
- 저장소 접근에 실패해도 보드 진입은 허용한다.

### 이어하기

1. 홈 진입
2. active session 확인
3. 이어하기 버튼 표시
4. 기존 보드 구성 복원

홈 표시 예:

- `진행 중인 산책이 있어요`
- `5x5 · 테스트 · 8/25`
- CTA: `이어하기`
- 보조: `새로 시작`

문구 기준:

- 이어하기 카드에는 기술 용어인 session을 노출하지 않는다.
- 사진이 복원되지 않는 1차 정책을 홈에서 길게 설명하지 않는다.
- 사용자가 새로고침 후 사진 칸이 비어 있는 것을 보드에서 자연스럽게 이해할 수 있도록, 사진 칸은 기존 빈 셀 UI로 복귀시킨다.

### 산책 종료

1. 보드에서 `산책 종료`
2. confirm 대신 결과 sheet 또는 종료 확인 modal 사용 검토
3. 결과 화면 표시
4. 결과 저장/공유 후 session 삭제 또는 archived 상태로 보존

1차 추천:

- 기존 confirm 유지
- 종료 시 session 삭제
- 결과 화면은 다음 slice에서 추가

## 7. 실행 순서

### Slice 1. Standard 제거

상태: 진행 완료

- 타입/레시피/URL 검증에서 `standard` 삭제
- 홈 카드 제거
- 보드 탭 동작을 사진 모드 기준으로 단순화
- `/bingo?mode=standard` redirect 확인
- lint/build 확인

### Slice 2. 저장 모델 1차 구현

상태: 진행 완료

목표:

- 셔플된 보드 구성이 새로고침 후 유지된다.
- FREE와 미래의 `noPhoto` 직접 완료 상태가 유지된다.
- 사진 Blob은 1차에서 영속 복원하지 않는다.
- 사진 칸 완료 상태가 localStorage에 잘못 남지 않는다.

작업:

- `PersistedBoardSessionV1` 타입 추가
- `persistence.ts` 추가
- 보드 생성 시 session 저장
- `cellIds` 기반 compose/resolve 함수 추가
- persist 가능한 marked position 필터 추가
- 홈 이어하기 UI 추가
- 종료/셔플 시 session 정리
- storage parse 실패 시 active session 정리

완료 기준:

- 5x5 시작 후 새로고침해도 셀 순서가 유지된다.
- 3x3 시작 후 새로고침해도 셀 순서가 유지된다.
- 홈에서 이어하기가 가능하다.
- 사진 칸을 촬영한 뒤 새로고침하면 사진 칸은 미완료로 돌아가고, 보드는 깨지지 않는다.
- FREE 칸은 새로고침 후에도 완료 상태다.
- `noPhoto: true` 셀은 새로고침 후에도 완료 상태다.

### Slice 3. 사진 영속 저장 검토

목표:

- 사진 완료 상태와 preview까지 새로고침 후 복원할지 결정한다.

작업:

- IndexedDB wrapper 검토
- Blob 저장/삭제 schema 설계
- 용량 제한/cleanup 정책 작성
- iOS Safari 호환성 확인

완료 기준:

- 사진 복원 가능 여부와 비용이 결정된다.
- 구현한다면 Slice 4로 진행한다.

### Slice 4. 결과 화면

목표:

- 사용자가 산책을 끝냈다는 감각을 얻고, 결과 저장/공유로 자연스럽게 이어진다.

작업:

- 종료 시 result state 생성
- 결과 화면 또는 sheet 추가
- 진행률/빙고 줄/사진 요약 표시
- CTA 추가

완료 기준:

- 빙고가 있어도 없어도 결과 화면 문구가 어색하지 않다.
- 3x3과 5x5에서 진행률/빙고 줄 계산이 정확하다.
- 결과 화면에서 홈 복귀와 다시 시작이 가능하다.

### Slice 5. 공유 이미지

목표:

- 결과를 이미지로 남기거나 모바일 공유 sheet로 보낼 수 있다.

작업:

- 이미지 export 방식 결정
- 결과 화면에서 저장/공유 연결
- 모바일 QA

완료 기준:

- 라이트/다크 테마 모두에서 공유 이미지 가독성이 유지된다.
- 사진 썸네일이 잘리지 않는다.
- 공유 API가 없는 브라우저에서는 다운로드 fallback이 동작한다.

## 8. 검증 계획

필수 명령:

- `npm run lint`
- `npm run build`

필수 화면:

- `/`
- `/bingo?mode=5x5&nickname=테스트`
- `/bingo?mode=3x3&nickname=테스트`
- `/bingo?mode=standard&nickname=테스트`

필수 QA:

- 홈에 `스탠다드 모드`가 노출되지 않는다.
- `/bingo?mode=standard&nickname=테스트`는 `/`로 redirect된다.
- 5x5/3x3은 정상 시작된다.
- 새로고침 후 보드 셀 순서가 유지된다.
- FREE는 기존처럼 완료 상태다.
- 사진 셀은 카메라를 연다.
- 사진 셀 완료 상태는 1차 localStorage 복원 대상이 아니다.
- `noPhoto: true` 셀은 직접 완료된다.
- 다크/라이트 전환 후 저장 session이 유지된다.

브라우저 캡처 권장:

- `/tmp/sappeun-progress-save-audit/home-continue.png`
- `/tmp/sappeun-progress-save-audit/board-5x5-restored.png`
- `/tmp/sappeun-progress-save-audit/board-3x3-restored.png`
- `/tmp/sappeun-progress-save-audit/standard-redirect.png`

## 9. 리스크와 대응

| 리스크 | 설명 | 대응 |
| --- | --- | --- |
| 사진 완료 상태 불일치 | Blob은 사라졌는데 marked만 남을 수 있음 | 1차에서는 사진 칸 완료 영속 저장 제외 |
| 저장 데이터 부패 | JSON parse 실패 또는 schema mismatch | version 검사 후 세션 삭제 |
| storage 차단 | private mode나 브라우저 설정으로 localStorage 실패 | try/catch 후 현재 세션만 유지 |
| 셀 데이터 변경 | 저장된 `cellIds`가 현재 sheet에 없을 수 있음 | 누락 cell 발견 시 홈으로 redirect 또는 새로 시작 안내 |
| 여러 탭 충돌 | 두 탭에서 같은 session 수정 | `updatedAt` 기준 latest wins, v1은 단순화 |
| 종료 UX 혼란 | 종료 시 결과/삭제/홈 이동이 섞일 수 있음 | Slice 2는 기존 confirm 유지, 결과는 Slice 4 |

## 10. 오픈 질문

- 사진 Blob 영속 저장을 v1.1에 포함할까, 결과/공유 이후로 미룰까?
- 결과 화면은 별도 URL이 좋을까, 보드 내부 sheet가 좋을까?
- 이미지 저장은 DOM 캡처가 충분할까, Canvas 렌더러가 필요할까?
- 진행 중 보드가 있을 때 홈 CTA는 `이어하기`를 primary로 둘까, `새로 시작`을 primary로 둘까?
- 오래된 session 자동 만료 기간은 24시간, 7일, 수동 삭제 중 무엇이 좋을까?

## 11. 추천 1차 결정

- 다음 구현은 Slice 2부터 진행한다.
- 1차 저장은 `localStorage`로 보드 구성과 직접 완료 상태만 저장한다.
- 사진 Blob 영속 저장은 IndexedDB 검토 후 별도 slice로 둔다.
- 홈에는 `이어하기` primary, `새로 시작` secondary를 둔다.
- session 만료는 24시간보다 넉넉한 7일을 추천한다. 산책 앱 특성상 당일 종료가 일반적이지만, 사용자가 다음날 이어서 확인할 수 있는 여지를 남긴다.

## 12. 구현 착수 전 체크리스트

- `standard` 제거 변경이 `lint`/`build`를 통과한 상태인지 확인한다.
- `sheet.json`의 `noPhoto` 셀이 실제로 존재하는지 확인하고, 없다면 FREE만 영속 marked 대상으로 시작한다.
- `cellIds` 복원 시 누락된 셀 ID가 있으면 crash 대신 홈으로 보낸다.
- localStorage helper는 SSR 환경에서 실행되지 않도록 `typeof window !== 'undefined'` guard를 둔다.
- 저장 실패는 사용자에게 치명 오류로 보여주지 않고 console warning 수준으로 제한한다.

## 13. 바로 다음 작업 제안

다음 작업은 Slice 2 “저장 모델 1차 구현”이 가장 좋다.

첫 구현 단위:

1. `PersistedBoardSessionV1` 타입과 persistence helper 작성
2. `composeBoardFromCellIds` 또는 동등한 복원 helper 추가
3. 보드 최초 생성 시 session 저장
4. 홈 이어하기 CTA 추가
5. 새로고침/redirect QA

이 단위까지만 끝내면 결과 화면과 공유 이미지 작업 전에 “보드가 유지되는 기본 신뢰감”을 먼저 확보할 수 있다.
