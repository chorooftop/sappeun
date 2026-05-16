# お散歩ビンゴONLINE (Osampo Bingo Online) 분석 리포트

> URL: https://osampo-bingo.netlify.app/
> 조사일: 2026-05-12
> 조사 도구: Headless Chromium, JS 번들 정적 분석, 네트워크 요청 추적

---

## 1. 한 줄 요약

**"산책하면서 빙고 칸에 적힌 사물을 찾아 사진으로 채워나가는 PWA 웹앱"**
일본어 사이트로, 코로나 자숙기간에 "평소와는 조금 다른 산책을" 콘셉트로 만들어진 빙고 형식의 산책 게임.

---

## 2. 핵심 콘셉트

- 5x5 (또는 3x3) 빙고판이 주어짐
- 각 칸에는 산책 중 만날 수 있는 **사물·자연물·표지판** 등이 일러스트와 일본어 명칭으로 표시됨
  (예: 飛行機, 自販機, ちょうちょ, 鳥居, マンホール, 踏切, たんぽぽ ...)
- 그 사물을 실제로 찾으면 칸을 마킹/촬영해 빙고를 완성
- 가운데 칸은 항상 **「NO!密!」** (사람 많은 곳을 피하라는 자유 칸)

---

## 3. 3가지 모드

| 모드 | 설명 | UX 특징 |
|------|------|---------|
| **スタンダードモード** (Standard) | 기본 빙고. 칸을 탭해서 마킹만 | 사진 없이 가볍게 즐기는 모드 |
| **写真モード** (Photo, 스마트폰 권장) | 칸을 탭하면 후면 카메라 활성화, 그 사물의 사진을 촬영해 칸을 채움 | 인 앱 카메라로 촬영, 정사각형 크롭 |
| **印刷モード** (Print) | 빙고판을 인쇄용 레이아웃으로 표시 | 종이로 출력해 오프라인에서 사용 |

추가 옵션: **5×5 / 3×3** 그리드 사이즈 선택 (사진 모드에서 표시됨)

---

## 4. 사용자 플로우

```
[홈 (index)]
  ├─ 모드 카드 3개 표시 (印刷 / スタンダード / 写真)
  ├─ 닉네임 입력 (例：お散歩太郎)
  ├─ 모드 선택 → (사진모드면) 5×5/3×3 선택
  ├─ 주의사항 안내 ("密な場所は避けましょう", "歩きスマホはやめましょう", "12세 이하는 보호자와")
  └─ [はじめる] 버튼 활성화
      ↓
[빙고 페이지 /bingo]
  ├─ 헤더: 로고 / 날짜 / 닉네임
  ├─ 5x5 격자 (24칸 + 가운데 NO!密! free)
  ├─ "スタート" 버튼 (가운데 free 칸이 시작 트리거)
  ├─ 각 칸 탭:
  │    - 스탠다드 모드 → 마킹 ON/OFF
  │    - 사진 모드 → 카메라 모달 열림 → 촬영 → blob 이미지로 칸 갱신
  └─ [お散歩終了] 버튼
      ↓ 확인 dialog
[BingoFinish 결과 화면]
  ├─ 완성한 빙고판 표시
  ├─ html2canvas로 캡처 → 결과 이미지 저장 가능
  └─ (메뉴: 추천환경/문의/약관/프라이버시)
```

---

## 5. 기술 스택 (번들 정적 분석으로 확인)

### 프론트엔드
- **Vue.js 2.x** + **Vue Router** (SPA, history 모드)
  - 컴포넌트 식별자: `Bingo`, `BingoApp`, `BingoFinish`, `BingoPrint`, `MyCamera`
  - DOM에 `data-v-*` 해시 → Single File Component 빌드 산출물
- **Vue CLI / Webpack 4 빌드**
  - `webpackJsonp` 패턴, route-based code splitting (chunk-* 다수)
  - `chunk-vendors.js` (~144KB) + `app.js` (~15KB) + 7개 라우트 청크
- 라이브러리:
  - **html2canvas** (9회 사용): 빙고판/결과 이미지를 PNG로 렌더
  - **getUserMedia** (Web API): 후면 카메라 캡처
  - **Canvas API** (`drawImage`, `toBlob`, `toDataURL`): 정사각형 크롭, JPEG 변환
- 상태 관리: **localStorage** 사용 (Vuex는 발견되지 않음)

### PWA / 모바일 최적화
- **manifest.webmanifest** (이름, 색상, 아이콘 8 사이즈)
  - `theme_color: #b1dbcd` (민트 그린)
  - `background_color: #d8ece6`
  - `display: standalone`
- **Service Worker** 등록 (`sw.js`): 오프라인/캐시
- 아이콘: 72/96/128/144/152/192/384/512 사이즈 (`/icons/icon-*.png`)
- 192·512는 `purpose: "any maskable"` (Android 마스킹 대응)
- 뷰포트: `user-scalable=no`, `minimum-scale=1` (모바일 우선)

### 호스팅 & 배포
- **Netlify** (`*.netlify.app`)
- 정적 파일 서빙
- 모든 청크가 prefetch + preload 로 hint 처리

### 분석 / 트래킹
- **Google Analytics 4** (G-98TSLQRCM2) + UA 호환 (UA-165992842-1)
- Twitter 카드 메타: `@OsampoBINGO`

---

## 6. 데이터 구조 (`/sheet.json`)

빙고판 아이템들은 **클라이언트가 fetch 하는 정적 JSON**으로 관리됨 (총 39개 아이템).

```json
[
  {
    "text": "見知らぬポスト",
    "icon": "/icons/post@216x.png",
    "tags": ["picture"]
  },
  {
    "text": "ランナー",
    "icon": "/icons/runner@216x.png"
  },
  {
    "text": "NO!密!",
    "icon": "/icons/free@216x.png",
    "tags": ["free"]
  }
]
```

### 태그 분포
| 태그 | 수 | 의미 |
|------|----|------|
| `picture` | 31개 | **사진 촬영 가능** 한 사물 (자판기, 꽃, 표지판, 동물 등) |
| (no tag) | 7개 | **사람** 관련 — 사진을 찍으면 안 되는 항목 (러너, 배달원, 강아지 산책자, 노부부, 마스크 안 낀 사람 등). 스탠다드 모드에서만 마킹용 |
| `free` | 1개 | 가운데 free 칸 (NO!密!) |

### 핵심 설계 인사이트 (프라이버시)
- **사람을 직접 촬영하는 항목은 의도적으로 사진 모드에서 제외**
- 산책 중 우연히 만난 타인을 무단 촬영하지 않도록 데이터 레벨에서 분리
- 한국 서비스로 만들 때도 **개인정보·초상권 이슈를 데이터에서 사전 차단**하는 패턴으로 활용 가능

### 전체 아이템 (39개)
사물·자연: 견지지 않는 우체통, 이상한 구름, 鉄棒(철봉), 민들레, 꽃, 시계, 마우스홀, 공중전화, 정자, 큰 돌, 토리이, 자판기, 전철, 공원, 행인 막다른 길, 비행기, 자전거, 트럭, 버스 정류장, 모자, 공, 숫자 7, 숫자 5, T 글자, 나비, 참새, 비둘기, 고양이, 강아지, 떨어진 물건, 테이크아웃 가게, 건널목, 飛び出し坊や(어린이 주의 표지판), 택배 모자, 후미진 우편함 등.

사람(촬영 불가): ランナー, 配達の人, わんこ(개 산책자), 暇そうな人, 髪を結んだ人, 老夫婦, 白じゃないマスク.

---

## 7. UI / UX 디자인 특징

### 컬러
- 배경: `#b1dbcd / #d8ece6` (파스텔 민트)
- 노란색 강조 카드: 印刷モード (가장 위에 배치, 시각적 차별화)
- 가운데 free 칸: 분홍 도장 스타일 "NO!密!"
- 손글씨/만화체 한자 로고 (お散歩ビンゴ)

### 레이아웃
- **모바일 우선** (390px 기준 디자인). 데스크톱에서도 같은 폭 카드 3개 세로 배치
- 햄버거 메뉴 (우측 상단) → 풀스크린 오버레이로 5개 메뉴
  - トップへ戻る / 推奨環境 / お問い合わせ / 利用規約 / プライバシーポリシー
- 빙고 칸: 정사각형, 일러스트 위에 명칭 캡션 (`p` 태그)

### 인터랙션 디테일
- "はじめる" 버튼은 **닉네임 입력 + 모드 선택이 끝나야 활성화** (`disabled` 상태로 시작)
- 가운데 free 칸이 **"スタート" 트리거**도 겸함 (시작하면 free로 변환)
- 페이지 이탈 방지: `BingoFinish`가 아닌 라우트로 이동 시 `dialog.confirm("ページを離れてもよろしいですか？")` 호출
- 화면별 슬라이드/페이드 트랜지션 추정 (Vue Router transition)

### 사진 모드 핵심 코드 (디컴파일 추정)
```javascript
navigator.mediaDevices.getUserMedia({
  audio: false,
  video: {
    width:  { ideal: 4096 },
    height: { ideal: 2160 },
    facingMode: "environment"   // 후면 카메라 우선
  }
}).then(stream => {
  this.$refs.video.srcObject = stream;
  // ... 촬영 시 ...
  // 정사각형 중앙 크롭 → 300x300 캔버스 → toBlob('image/jpeg')
  canvas.toBlob(blob => this.$emit('picture', blob), 'image/jpeg');
});
```

### 결과 캡처
- `html2canvas($refs.capture, { allowTaint: true })` 로 빙고판 DOM을 PNG 로 저장
- 결과 이미지로 SNS 공유 (Twitter 카드 메타가 있는 것으로 보아 공유 도입 가능성)

---

## 8. 사이트 구조 / 라우트

| Path | 컴포넌트 | 역할 |
|------|---------|------|
| `/` | `BingoApp` | 모드 선택 + 닉네임 입력 |
| `/bingo` | `Bingo` | 5x5 빙고판 (모드별 분기) |
| (modal) | `MyCamera` | 카메라 캡처 컴포넌트 |
| (route 분기) | `BingoFinish` | 결과 화면 |
| (route 분기) | `BingoPrint` | 인쇄용 레이아웃 |

정적 파일:
- `/sheet.json` — 빙고 아이템 정의 (4.2KB)
- `/parts/*.png` — 로고, 모드 아이콘 (logo, boy, camera, printer, start)
- `/icons/*@216x.png` — 39개 아이템 일러스트
- `/manifest.webmanifest`, `/sw.js`, `/icons/icon-*.png` — PWA

---

## 9. 산책 사진 사이트를 만들 때 참고할 포인트

### 좋은 점 (벤치마킹)
1. **PWA 우선** — 모바일에서 홈 화면 추가 후 풀스크린 사용 가능. 산책 중 손쉽게 접근.
2. **데이터를 JSON 파일로 분리** — 아이템 추가/수정에 코드 빌드 불필요. 시즌별 빙고도 가능.
3. **사진 안 찍어야 할 대상은 데이터에서 태그로 구분** — 초상권 이슈를 설계 단계에서 차단.
4. **카메라 권장 옵션이 명확** — `facingMode: environment`(후면), `ideal: 4K` (가능한 최고 화질).
5. **결과 이미지를 클라이언트에서 생성** (html2canvas) — 서버 비용 0, 즉시 공유.
6. **웹앱 단독 + 인쇄 모드** — 디지털 못 쓰는 사람(아이/부모)도 같이 즐기게.
7. **닉네임만 받음** — 회원가입 없음. 진입 마찰 0.
8. **걸음 안전 가이드 노출** — "歩きスマホはやめましょう" 등 안전 문구.

### 한국 서비스화할 때 보완·차별화 아이디어
- **위치 기반 (Geolocation)** — 위치별 아이템 다르게 (해변/산/도심)
- **시간대 인식** — 새벽/낮/밤별 아이템
- **계절성** — 봄(벚꽃), 여름(매미), 가을(낙엽), 겨울(눈사람)
- **공유/SNS 통합** — Kakao 공유, 인스타 스토리 사이즈 결과 이미지
- **위치 기록·산책 트래킹** — 거리, 시간, 코스 지도 표시
- **친구와 동시 빙고** — 같은 시드의 빙고판으로 누가 먼저 완성하는지
- **AI 자동 검증** — 찍은 사진이 정말 그 사물인지 모델로 판정 (예: TFLite, 모바일넷)
- **로컬 저장 → 옵션으로 클라우드 동기화** (오프라인 우선)
- **사진 EXIF 제거** — 위치 정보 자동 스크럽 (프라이버시)

### 기술 스택 추천 (한국 서비스 기준)
- **Next.js 14+ (App Router)** 또는 **SvelteKit** — Vue 2는 EOL이므로 신규는 피하기
- **Tailwind CSS** — 모바일 우선 빠른 스타일링
- **Zustand / Jotai** — 가벼운 상태관리 (Vuex 자리)
- **Workbox** — PWA / 서비스 워커
- **html-to-image** 또는 **dom-to-image-more** — html2canvas 대체 (더 가볍고 정확)
- **Vercel / Netlify** — 정적 호스팅
- **Supabase / Firebase** — 회원·점수·랭킹 (선택)
- **Supabase Storage** — 사진 업로드·저장 (private bucket + signed URL)
- **TensorFlow.js + MobileNet** — 사물 자동 인식 (선택, 차별화 포인트)

---

## 10. 참고 자료
- 사이트: https://osampo-bingo.netlify.app/
- 매니페스트: https://osampo-bingo.netlify.app/manifest.webmanifest
- 데이터 시트: https://osampo-bingo.netlify.app/sheet.json
- 트위터: https://twitter.com/OsampoBINGO

---

## 부록 A: 캡처한 화면

조사 중 캡처한 스크린샷이 `/tmp/osampo-screens/` 에 저장되어 있습니다.
- `01-home-pretty.png` — 데스크톱 홈
- `01b-home-mobile.png` — 모바일 홈
- `04-bingo-mobile.png` — 빙고 보드 (모바일)
- `05-after-start.png` — 시작 후 보드
- `07-standard-mode.png` — 스탠다드 모드 보드
- `08-print-mode.png` — 인쇄 모드
- `09-menu-open.png` — 햄버거 메뉴
- `10-finish-screen.png` — 종료 화면

## 부록 B: 빙고 아이템 풀 (sheet.json 원본)

| # | text (일본어) | text (한국어 추정) | icon | 태그 |
|---|---|---|---|---|
| 1 | 見知らぬポスト | 모르는 우체통 | post | picture |
| 2 | ランナー | 러너 | runner | (사람) |
| 3 | 落とし物 | 떨어진 물건 | lost | picture |
| 4 | 数字の7 | 숫자 7 | seven | picture |
| 5 | ねこ | 고양이 | cat | picture |
| 6 | バス停 | 버스 정류장 | busstop | picture |
| 7 | ちょうちょ | 나비 | butterfly | picture |
| 8 | 変な雲 | 이상한 구름 | cloud | picture |
| 9 | 鉄棒 | 철봉 | bar | picture |
| 10 | たんぽぽ | 민들레 | dandelion | picture |
| 11 | 配達の人 | 배달원 | delivery | (사람) |
| 12 | わんこ | 강아지 | dog | (사람) |
| 13 | 暇そうな人 | 한가해 보이는 사람 | bored | (사람) |
| 14 | お花 | 꽃 | flower | picture |
| 15 | 時計 | 시계 | watch | picture |
| 16 | 踏切 | 철도 건널목 | rail_cross | picture |
| 17 | 自販機 | 자판기 | vendingmachine | picture |
| 18 | 電車 | 전철 | train | picture |
| 19 | 鳥居 | 토리이 | torii | picture |
| 20 | 飛び出し坊や | 어린이 주의 표지 | tobidashi | picture |
| 21 | 髪を結んだ人 | 머리 묶은 사람 | tiehair | (사람) |
| 22 | 公衆電話 | 공중전화 | telephone | picture |
| 23 | スズメ | 참새 | sparrow | picture |
| 24 | ハト | 비둘기 | pigeon | picture |
| 25 | 老夫婦 | 노부부 | oldcouple | (사람) |
| 26 | 白じゃないマスク | 흰색 아닌 마스크 쓴 사람 | mask | (사람) |
| 27 | テイクアウトの店 | 테이크아웃 가게 | takeout | picture |
| 28 | 公園 | 공원 | play | picture |
| 29 | 行き止まり | 막다른 길 | deadend | picture |
| 30 | マンホール | 맨홀 | manhole | picture |
| 31 | 自転車 | 자전거 | bicycle | picture |
| 32 | 大きな石 | 큰 돌 | storn | picture |
| 33 | トラック | 트럭 | truck | picture |
| 34 | Tの文字 | T 글자 | T | picture |
| 35 | 帽子 | 모자 | hat | picture |
| 36 | ボール | 공 | ball | picture |
| 37 | 飛行機 | 비행기 | airplane | picture |
| 38 | 数字の5 | 숫자 5 | 5 | picture |
| 39 | NO!密! | (가운데 free) | free | free |
