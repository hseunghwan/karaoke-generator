import { i18nRouter } from 'next-i18n-router';
import { i18nConfig } from '../i18nConfig';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
  const { pathname } = request.nextUrl;

  // 보호된 경로인지 확인
  if (isProtectedPath(pathname)) {
    const locale = getLocale(pathname);
    
    // Supabase 클라이언트 생성
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // 쿠키에서 세션 토큰 확인
      const accessToken = request.cookies.get('sb-access-token')?.value;
      const refreshToken = request.cookies.get('sb-refresh-token')?.value;
      
      // 세션 확인 시도
      let isAuthenticated = false;
      
      if (accessToken) {
        try {
          const { data: { user }, error } = await supabase.auth.getUser(accessToken);
          isAuthenticated = !!user && !error;
        } catch {
          // 토큰 검증 실패
          isAuthenticated = false;
        }
      }
      
      // 미인증 시 로그인 페이지로 리다이렉트
      if (!isAuthenticated) {
        const loginUrl = new URL(`/${locale}/login`, request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }
    }
  }

  // i18n 라우팅 처리
  return i18nRouter(request, i18nConfig);
}

// applies this middleware only to files in the app directory
export const config = {
  matcher: '/((?!api|auth|static|.*\\..*|_next).*)',
};
