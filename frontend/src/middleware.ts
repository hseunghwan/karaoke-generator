import { i18nRouter } from 'next-i18n-router';
import { i18nConfig } from '../i18nConfig';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/**
 * 보호된 경로 목록
 * 이 경로들은 인증이 필요합니다.
 */
const PROTECTED_PATHS = [
  '/dashboard',
  '/jobs',
  '/community/create', // 포스트 작성만 보호, 조회는 공개
];

/**
 * 인증 필요 여부 확인
 */
function isProtectedPath(pathname: string): boolean {
  // locale prefix 제거 (예: /ko/dashboard -> /dashboard)
  const pathWithoutLocale = pathname.replace(/^\/(ko|en|ja)/, '') || '/';

  return PROTECTED_PATHS.some(
    (protectedPath) => pathWithoutLocale.startsWith(protectedPath)
  );
}

/**
 * 현재 locale 추출
 */
function getLocale(pathname: string): string {
  const match = pathname.match(/^\/(ko|en|ja)/);
  return match ? match[1] : i18nConfig.defaultLocale;
}

export async function middleware(request: NextRequest) {
  // 1. Create a response object first to capture cookie operations
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // 2. Check auth
  const { data: { user }, error } = await supabase.auth.getUser();

  // 3. Check protected paths
  if (isProtectedPath(request.nextUrl.pathname)) {
    if (!user || error) {
      const locale = getLocale(request.nextUrl.pathname);
      const loginUrl = new URL(`/${locale}/login`, request.url);
      loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 4. Run i18n router
  // i18nRouter might redirect or return a new response.
  const i18nResponse = i18nRouter(request, i18nConfig);

  // If i18nRouter returns a redirect, we should return it immediately
  if (i18nResponse.status === 307 || i18nResponse.status === 308) {
    return i18nResponse;
  }

  // If i18nRouter returns a regular response (rewrite or next),
  // we need to merge the cookies set by Supabase (if any, e.g. token refresh)
  response.cookies.getAll().forEach((cookie) => {
    i18nResponse.cookies.set(cookie.name, cookie.value, cookie);
  });

  return i18nResponse;
}

// applies this middleware only to files in the app directory
export const config = {
  matcher: '/((?!api|auth|static|.*\\..*|_next).*)',
};
