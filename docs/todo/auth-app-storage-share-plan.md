# 앱 기반 저장/공유 후속 기획

상태: 보류 아이디어  
작성일: 2026-05-16  
대상 범위: 앱 환경, 사진 저장, 결과 공유, 첫 플레이어 튜토리얼

## 문서 위치

이 문서는 아직 실제 작업에 들어가지 않은 보류 기획을 모아두는 문서다. 실제 구현에 착수하는 순간 관련 내용을 `plans/` 아래의 작업 기획서로 승격한다.

회원가입/로그인 기반은 구현되어 `main`에 반영됐다. 현재 `plans/`에는 원격 DB 적용과 실제 OAuth 가입 smoke test를 추적하는 `/Users/oksang/Desktop/sappeun/sappeun/plans/social-signup-onboarding-plan.md`만 남긴다.

## 보류 이유

사진 저장과 결과 공유는 사용자를 특정할 수 있어야 의미가 있다. 회원가입/로그인 기반은 마련됐지만, 계정 단위 저장/공유를 실제로 열려면 원격 Supabase에 가입 온보딩 migration을 적용하고 실제 OAuth 가입 smoke test로 `profiles.signup_completed_at`과 `user_consents` 기록을 확인해야 한다.

또한 로그인 요구가 자연스럽게 받아들여지려면 앱 또는 앱에 준하는 설치형 환경이 먼저 갖춰지는 편이 좋다. 따라서 이 문서의 기능들은 현재 바로 구현하지 않는다. 가입 온보딩 검증과 앱 환경 방향이 결정된 뒤 `plans/`로 옮겨 실제 작업으로 전환한다.

## 후속 기능 1. 앱 환경 기반 구축

목표는 사용자가 사뿐을 "산책할 때 쓰는 앱"으로 인식하게 만드는 것이다.

구현 후보:

- PWA 설치 경험 정리
- 앱 아이콘, 스플래시, 오프라인 fallback 정리
- 카메라 권한 요청 전 안내 화면
- 산책 중 복귀 시 진행 중인 보드 복구
- 추후 네이티브 앱 전환 가능성을 고려한 라우트와 API 경계 정리

관련 파일:

- `/Users/oksang/Desktop/sappeun/sappeun/src/app/layout.tsx`
- `/Users/oksang/Desktop/sappeun/sappeun/src/app/offline`
- `/Users/oksang/Desktop/sappeun/sappeun/src/components/camera/CameraModal.tsx`
- `/Users/oksang/Desktop/sappeun/sappeun/public`

## 후속 기능 2. 사진 저장

목표는 산책 중 촬영한 사진을 계정과 보드에 안전하게 연결하는 것이다.

구현 후보:

- R2 presigned upload API
- 업로드 완료 confirm API
- Supabase `photos`와 `board_cells` 연결
- 업로드 실패/재시도 상태
- 다른 기기에서 이어보기
- 보드 삭제 시 사진 참조와 R2 객체 삭제 정책

관련 파일:

- `/Users/oksang/Desktop/sappeun/sappeun/src/components/bingo/Board.tsx`
- `/Users/oksang/Desktop/sappeun/sappeun/src/components/camera/CameraModal.tsx`
- `/Users/oksang/Desktop/sappeun/sappeun/src/lib/r2/presign.ts`
- `/Users/oksang/Desktop/sappeun/sappeun/src/lib/r2/keys.ts`
- `/Users/oksang/Desktop/sappeun/sappeun/src/app/api/photos/upload`
- `/Users/oksang/Desktop/sappeun/sappeun/src/types/photo.ts`

## 후속 기능 3. 결과 공유

목표는 산책 결과를 사용자가 명시적으로 선택한 범위 안에서 외부에 공유할 수 있게 하는 것이다.

구현 후보:

- 결과 화면에서 공유 만들기
- `shareCode` 기반 공개 결과 링크
- 공유 카드 이미지 생성
- 공유 링크 삭제 또는 비공개 전환
- 공개 페이지에서 개인정보 최소 노출
- SNS/메신저별 카드 비율 대응

관련 파일:

- `/Users/oksang/Desktop/sappeun/sappeun/src/app/(game)/boards/[boardId]/share`
- `/Users/oksang/Desktop/sappeun/sappeun/src/app/share/[shareCode]`
- `/Users/oksang/Desktop/sappeun/sappeun/src/app/api/share/[boardId]`
- `/Users/oksang/Desktop/sappeun/sappeun/src/lib/share/generateShareCode.ts`
- `/Users/oksang/Desktop/sappeun/sappeun/src/types/share.ts`
- `/Users/oksang/Desktop/sappeun/sappeun/supabase/migrations/0002_rls.sql`

## 후속 기능 4. 첫 플레이어 튜토리얼: 오늘 처음 보는 장면

목표는 첫 플레이어가 빈 보드 앞에서 망설이지 않고, 사뿐의 핵심 행동인 "걷다가 발견한 장면을 찍기"를 바로 경험하게 만드는 것이다.

예시 카피:

```text
오늘 처음이시네요?
처음인 기념으로, 오늘 산책하며 처음 보는 장면을 찍어보세요.
```

권장 UX 흐름:

1. 첫 플레이어가 앱에서 보드 시작을 누른다.
2. 짧은 튜토리얼 안내가 먼저 뜬다.
3. 사용자가 `첫 장면 찍기`를 누른다.
4. 카메라가 열린다.
5. 촬영 후 미리보기에서 `사용하기`를 누른다.
6. 보드 중앙 셀에 사진이 들어간다.
7. 진행률이 1칸 채워진 상태로 보드가 시작된다.

데이터 모델 후보:

- 새 셀 ID: `first_scene`
- 라벨: `첫 장면`
- captureLabel: `오늘 처음 보는 장면`
- hint: `오늘 산책하며 지금까지 처음 본 장면을 찍어보세요`
- category: `special`
- fixedPosition: `center`
- camera: `back`

관련 파일:

- `/Users/oksang/Desktop/sappeun/sappeun/src/data/sheet.json`
- `/Users/oksang/Desktop/sappeun/sappeun/src/lib/bingo/compose.ts`
- `/Users/oksang/Desktop/sappeun/sappeun/src/components/bingo/Board.tsx`
- `/Users/oksang/Desktop/sappeun/sappeun/src/components/bingo/Cell.tsx`
- `/Users/oksang/Desktop/sappeun/sappeun/src/components/camera/CameraModal.tsx`
- `/Users/oksang/Desktop/sappeun/sappeun/src/app/(game)/bingo/page.tsx`

## 승격 조건

이 문서의 기능은 아래 조건 중 하나가 충족되면 `plans/`로 옮긴다.

- 해당 기능을 바로 구현하기로 결정했다.
- 원격 Supabase에 `0004_signup_onboarding.sql`을 적용했고, 실제 OAuth 가입 smoke test로 `profiles.signup_completed_at`과 `user_consents` 기록을 확인했다.
- 앱/PWA 환경 방향이 확정되어 권한, 세션, deep link 정책을 구체화할 수 있다.
- 사진 저장 또는 결과 공유의 계정 단위 데이터 모델을 확정했다.
