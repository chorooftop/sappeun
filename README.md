# sappeun (사뿐)

산책하면서 빙고 칸의 사물을 찾아 사진으로 채워 완성하는 PWA. 일본의 [お散歩ビンゴONLINE](https://osampo-bingo.netlify.app/) 컨셉을 한국 환경에 맞게 재해석한 산책 게임 서비스.

## Stack

- **Next.js 16.2.6** (App Router) + **React 19.2** + **TypeScript 5**
- **Tailwind CSS v4** (PostCSS)
- **Supabase** (`@supabase/ssr`, `@supabase/supabase-js`) — 인증·DB·RLS
- **Cloudflare R2** (`@aws-sdk/client-s3` + presigned URL) — 산책 사진 저장
- **TanStack Query v5** — 서버 상태
- **Zod v4** — env / 입력 검증
- **lucide-react**, **clsx**, **tailwind-merge** — UI 유틸

## Quick start

```bash
pnpm install
cp docs/ENV.md . # 참고용. .env 직접 작성
pnpm dev # http://localhost:3000
```

자세한 환경변수는 [`docs/ENV.md`](docs/ENV.md) 참고.

## Scripts

| 명령 | 설명 |
|------|------|
| `pnpm dev` | Next.js 개발 서버 |
| `pnpm build` | 프로덕션 빌드 |
| `pnpm start` | 프로덕션 서버 |
| `pnpm lint` | ESLint (Next.js config) |

## Structure

```
src/
  app/              # App Router 라우트
    (auth)/         # 로그인·회원 라우트 그룹
    (game)/         # 빙고 게임 라우트 그룹
    api/            # Route Handlers (presigned URL, share 등)
    share/          # 공유 페이지
    offline/        # PWA offline fallback
  components/
    bingo/          # 빙고 보드·셀
    camera/         # getUserMedia 카메라 모달
    catalog/        # 아이템 카탈로그
    share/          # 결과 공유 UI
    layout/, ui/, icons/
  lib/
    bingo/          # 보드 생성·시드·규칙
    r2/             # R2 presign / upload
    share/          # 공유 이미지 생성
    supabase/       # 클라/서버/미들웨어 클라이언트
    utils/          # env (zod), cn 등
  server/           # 서버 액션·서버 전용 모듈
  data/             # 빙고 아이템 정적 데이터
  design/           # 토큰·테마
  hooks/, types/, middleware.ts
supabase/migrations/ # 0001_init, 0002_rls
docs/
  ENV.md
  osampo-bingo-analysis.md  # 원작 분석 리포트
```

## Concept

- 5×5 빙고판, 가운데 칸은 free
- 산책 중 칸에 적힌 사물을 찾으면 사진 모드로 촬영 → 칸 채우기
- 결과 화면을 이미지로 캡처해 공유
- 사람 대상 아이템은 사진 모드에서 제외 (초상권 보호)

상세 컨셉·플로우·기술 인사이트는 [`docs/osampo-bingo-analysis.md`](docs/osampo-bingo-analysis.md) 참조.

## Agent / contributor notes

- 이 프로젝트의 Next.js는 **16.x로 학습 데이터보다 신버전**일 수 있다. 코드를 쓰기 전 `node_modules/next/dist/docs/`를 먼저 확인할 것.
- 자세한 작업 규칙은 [`AGENTS.md`](AGENTS.md) / [`CLAUDE.md`](CLAUDE.md) 참조.
