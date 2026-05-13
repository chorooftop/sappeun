# 환경 변수 설정

`.env.local` 파일을 프로젝트 루트에 생성하고 아래 값을 채우세요. 이 파일은 `.gitignore`에 포함되며 절대 커밋하지 마세요.

```bash
# --- Public (브라우저 노출) ---
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# --- Server only ---
SUPABASE_SERVICE_ROLE_KEY=

# Cloudflare R2 (사진 저장소)
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=sappeun-photos
# 옵션: 커스텀 CDN 도메인 (예: https://cdn.sappeun.app)
# 미설정 시 R2 endpoint URL로 fallback
R2_PUBLIC_URL=
```

## 값 발급 가이드

### Supabase
1. https://supabase.com/dashboard 에서 프로젝트 생성
2. Project Settings → API
3. `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
4. `anon public` 키 → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. `service_role secret` 키 → `SUPABASE_SERVICE_ROLE_KEY` (절대 클라이언트 노출 금지)

### Cloudflare R2
1. https://dash.cloudflare.com → R2
2. 버킷 생성 (`sappeun-photos`)
3. "Manage R2 API Tokens" → 새 토큰 (Object Read & Write)
4. `Account ID` → `R2_ACCOUNT_ID`
5. `Access Key ID` → `R2_ACCESS_KEY_ID`
6. `Secret Access Key` → `R2_SECRET_ACCESS_KEY`
7. 옵션: Custom Domain 연결 후 `R2_PUBLIC_URL` 설정

## 환경 검증

`src/lib/utils/env.ts`의 zod 스키마가 빌드/런타임 시 자동 검증. 누락된 값은 즉시 에러로 표시됩니다.
