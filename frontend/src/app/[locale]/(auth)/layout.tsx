/**
 * Auth Layout
 *
 * 로그인/회원가입 페이지의 공통 레이아웃입니다.
 * 이미 로그인된 사용자는 대시보드로 리다이렉트됩니다.
 */
"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2, Music } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  // 로딩 중
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // 이미 로그인됨
  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* 왼쪽: 브랜딩 영역 */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/90 to-primary items-center justify-center p-12">
        <div className="max-w-md text-white">
          <Link href="/" className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-white/20 rounded-lg">
              <Music className="h-8 w-8" />
            </div>
            <span className="text-2xl font-bold">Karaoke Gen</span>
          </Link>
          <h1 className="text-4xl font-bold mb-4">
            Create Amazing Karaoke Videos
          </h1>
          <p className="text-lg text-white/80 mb-8">
            Upload any song, generate synchronized lyrics in multiple languages,
            and share with our global community.
          </p>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-lg font-bold">1</span>
              </div>
              <span>Upload your favorite tracks</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-lg font-bold">2</span>
              </div>
              <span>AI generates synced subtitles</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-lg font-bold">3</span>
              </div>
              <span>Share and sing along!</span>
            </div>
          </div>
        </div>
      </div>

      {/* 오른쪽: 인증 폼 영역 */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* 모바일 로고 */}
          <Link href="/" className="flex lg:hidden items-center gap-2 mb-8 justify-center">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Music className="h-6 w-6 text-primary" />
            </div>
            <span className="text-xl font-bold">Karaoke Gen</span>
          </Link>

          {children}
        </div>
      </div>
    </div>
  );
}
