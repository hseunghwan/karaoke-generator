"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth, useCreditsBalance } from "@/hooks/use-auth";
import {
  Bell,
  User,
  LogOut,
  Settings,
  CreditCard,
  Coins,
  Loader2,
  LayoutDashboard,
} from "lucide-react";

export const Navbar = () => {
  const router = useRouter();
  const { user, profile, isLoading, isAuthenticated, signOut } = useAuth();
  const creditsBalance = useCreditsBalance();

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  // 로딩 중
  if (isLoading) {
    return (
      <div className="flex items-center p-4 border-b h-16 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <MobileSidebar />
        <div className="flex w-full justify-end items-center gap-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center p-4 border-b h-16 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <MobileSidebar />

      <div className="flex w-full justify-end items-center gap-4">
        {isAuthenticated ? (
          <>
            {/* 크레딧 잔액 */}
            <Link href="/pricing" className="hidden sm:block">
              <Badge
                variant="secondary"
                className="flex items-center gap-1.5 px-3 py-1 cursor-pointer hover:bg-secondary/80 transition-colors"
              >
                <Coins className="w-3.5 h-3.5" />
                <span className="font-medium">{creditsBalance}</span>
                <span className="text-muted-foreground">크레딧</span>
              </Badge>
            </Link>

            {/* 알림 버튼 */}
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              {/* 알림 뱃지 (추후 구현) */}
              {/* <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">3</span> */}
            </Button>

            {/* 유저 드롭다운 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full bg-muted hover:bg-muted/80"
                >
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt="Avatar"
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-5 h-5" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {profile?.display_name || profile?.username || "사용자"}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {/* 모바일에서만 크레딧 표시 */}
                <DropdownMenuItem className="sm:hidden">
                  <Coins className="mr-2 h-4 w-4" />
                  <span>{creditsBalance} 크레딧</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="sm:hidden" />

                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => router.push("/dashboard")}>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span>대시보드</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/pricing")}>
                    <CreditCard className="mr-2 h-4 w-4" />
                    <span>요금제</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/settings")}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>설정</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="text-red-600 focus:text-red-600"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>로그아웃</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <>
            {/* 비로그인 상태 */}
            <Link href="/login">
              <Button variant="ghost">로그인</Button>
            </Link>
            <Link href="/signup">
              <Button>시작하기</Button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
};
