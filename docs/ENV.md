# 환경 변수 설정

`.env` 파일을 프로젝트 루트에 생성하고 아래 값을 채우세요. 이 파일은 `.gitignore`에 포함되며 절대 커밋하지 않습니다.

```bash
# --- Public (브라우저 노출) ---
NEXT_PUBLIC_SUPABASE_URL=https://wtptvgxyqkqqsfkdsoox.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
AUTH_ENABLED_PROVIDERS=google,kakao
KAKAO_CLIENT_ID=
KAKAO_CLIENT_SECRET=

# --- Server only ---
# Auth MVP의 OAuth callback/profile 생성에는 사용하지 않습니다.
# Admin 작업이나 서버 전용 기능이 실제로 필요할 때만 설정하세요.
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

## 현재 확인된 Supabase 프로젝트

- Project URL: `https://wtptvgxyqkqqsfkdsoox.supabase.co`
- Publishable key: `.env`의 `NEXT_PUBLIC_SUPABASE_ANON_KEY`에 설정 완료
- Auth endpoint 확인: `/auth/v1/settings`, `/auth/v1/health` 200 OK
- Enabled providers: Google, Kakao
- Kakao는 `account_email` 동의항목 권한이 아직 없으므로 Supabase built-in OAuth 진입을 사용하지 않는다.
- 앱은 Kakao OpenID Connect authorize URL을 직접 열고, `/auth/kakao/callback`에서 Kakao `id_token`을 Supabase `signInWithIdToken({ provider: 'kakao', token: id_token })`로 교환한다.
- 앱은 Kakao 사용자에게 이메일이 없을 수 있다는 전제로 동작해야 하며, 화면 표시와 가입 완료 판단은 `profiles`와 Supabase user id를 기준으로 한다.
- Redirect URLs는 query 없는 callback URL만 등록한다. OAuth 이후 이동할 `next` 값은 앱의 짧은 httpOnly cookie로 보관한다.
- `supabase/migrations/0004_signup_onboarding.sql`은 원격 DB에 적용 완료됐다.
- 실제 Kakao 가입 왕복 smoke test는 현재 Chrome에서 `wtptvgxyqkqqsfkdsoox.supabase.co`가 `ERR_BLOCKED_BY_CLIENT`로 차단되어 미완료 상태다.
- 주의: `service_role secret`은 서버 전용 비밀값이며, 현재 소셜 로그인 MVP의 profile 생성에는 사용하지 않는다.

## 현재 확인된 Vercel 설정

- Production domain: `https://sappeun.vercel.app`
- Production/Preview 환경 변수 등록 완료:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_SITE_URL`
  - `AUTH_ENABLED_PROVIDERS=google,kakao`
- 환경 변수 반영을 위한 Production 재배포 완료
- `/login`과 `/signup`에서 Google/Kakao provider가 활성 상태로 노출된다.
- `/auth/sign-in/kakao?next=/`는 앱의 Kakao OIDC authorize URL로 이동한다.

## 값 발급 가이드

### Supabase
1. https://supabase.com/dashboard 에서 프로젝트 생성
2. Project Settings -> API
3. `Project URL` -> `NEXT_PUBLIC_SUPABASE_URL`
4. `Publishable key` 또는 legacy `anon public` 키 -> `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. `service_role secret` 키 -> `SUPABASE_SERVICE_ROLE_KEY` (절대 클라이언트 노출 금지)

### Kakao OAuth
1. Kakao Developers -> 내 애플리케이션 -> `사뿐`
2. 카카오 로그인 상태: ON
3. REST API 키의 카카오 로그인 Redirect URI:
   - `https://wtptvgxyqkqqsfkdsoox.supabase.co/auth/v1/callback`
4. Supabase Dashboard -> Authentication -> Sign In / Providers -> Kakao
5. REST API Key와 Client Secret Code는 Supabase Dashboard에만 저장한다.
6. 카카오가 이메일을 반환하지 않아도 로그인할 수 있도록 Supabase Kakao provider의 `Allow users without an email`을 켠다.
7. Kakao 앱의 동의항목은 `profile_nickname`, `profile_image`를 선택 동의로 둔다.
8. Kakao 앱에서 OpenID Connect를 ON으로 둔다.
9. Kakao REST API 키의 카카오 로그인 Redirect URI에 아래 값을 등록한다.
   - `https://wtptvgxyqkqqsfkdsoox.supabase.co/auth/v1/callback`
   - `https://sappeun.vercel.app/auth/kakao/callback`
   - `http://localhost:3000/auth/kakao/callback`
10. `KAKAO_CLIENT_ID`에는 Kakao REST API 키를 넣는다.
11. `KAKAO_CLIENT_SECRET`에는 Kakao 로그인 Client Secret Code를 넣는다.
12. 이메일 기반 기능이 필요해지면 Kakao 비즈 앱 전환과 비즈니스 정보 심사 후 `account_email` 권한을 별도 신청한다.

### Google OAuth
1. Google Cloud Console -> Google Auth Platform
2. OAuth consent app:
   - App name: `사뿐`
   - Audience: External
3. OAuth client:
   - Application type: Web application
   - Authorized JavaScript origins:
     - `https://sappeun.vercel.app`
     - `http://localhost:3000`
   - Authorized redirect URI:
     - `https://wtptvgxyqkqqsfkdsoox.supabase.co/auth/v1/callback`
4. Supabase Dashboard -> Authentication -> Sign In / Providers -> Google
5. Client ID와 Client Secret은 Supabase Dashboard에만 저장한다.
6. Google provider의 `Skip nonce checks`와 `Allow users without an email`은 기본값 OFF로 둔다.

### Cloudflare R2
1. https://dash.cloudflare.com -> R2
2. 버킷 생성 (`sappeun-photos`)
3. "Manage R2 API Tokens" -> 새 토큰 (Object Read & Write)
4. `Account ID` -> `R2_ACCOUNT_ID`
5. `Access Key ID` -> `R2_ACCESS_KEY_ID`
6. `Secret Access Key` -> `R2_SECRET_ACCESS_KEY`
7. 옵션: Custom Domain 연결 후 `R2_PUBLIC_URL` 설정

## 환경 검증

`src/lib/utils/env.ts`의 zod 스키마가 빌드/런타임 시 자동 검증한다. 누락된 값은 즉시 에러로 표시된다.
