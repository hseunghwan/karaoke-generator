/**
 * AuthProvider
 *
 * Supabase Auth 상태를 관리하고 앱 전체에 제공하는 컨텍스트 프로바이더입니다.
 * 세션 복원, 자동 토큰 갱신, 프로필 동기화를 처리합니다.
 */
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { User, Session, Provider, AuthChangeEvent } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { AuthContext, type Profile, type AuthContextType } from "@/hooks/use-auth";

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();

  // 상태
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 프로필 가져오기
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      // 프로필이 없으면 (트리거가 아직 실행되지 않았을 수 있음)
      if (error && (error.code === "PGRST116" || error.message?.includes("No rows"))) {
        console.log("Profile not found, waiting for trigger...");

        // 트리거가 실행될 시간을 주기 위해 잠시 대기 후 재시도
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const { data: retryData, error: retryError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();

        if (retryError) {
          console.warn("Profile still not found after retry. This may be normal if the trigger hasn't run yet.");
          return null;
        }

        return retryData as Profile;
      }

      if (error) {
        console.error("Failed to fetch profile:", {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        }, error);
        return null;
      }

      return data as Profile;
    } catch (err) {
      console.error("Error fetching profile:", err);
      return null;
    }
  }, []);

  // 프로필 새로고침
  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const newProfile = await fetchProfile(user.id);
    if (newProfile) {
      setProfile(newProfile);
    }
  }, [user, fetchProfile]);

  // 세션 변경 처리
  const handleAuthStateChange = useCallback(
    async (event: AuthChangeEvent, newSession: Session | null) => {
      console.log("Auth state changed:", event);

      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        const userProfile = await fetchProfile(newSession.user.id);
        setProfile(userProfile);
      } else {
        setProfile(null);
      }

      // 특정 이벤트에 따른 처리
      if (event === "SIGNED_OUT") {
        router.push("/");
      } else if (event === "PASSWORD_RECOVERY") {
        router.push("/reset-password");
      }

      setIsLoading(false);
    },
    [fetchProfile, router]
  );

  // 초기 세션 복원 및 리스너 등록
  useEffect(() => {
    // 초기 세션 가져오기
    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();

        if (initialSession) {
          setSession(initialSession);
          setUser(initialSession.user);
          const userProfile = await fetchProfile(initialSession.user.id);
          setProfile(userProfile);
        }
      } catch (error) {
        console.error("Failed to initialize auth:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Auth 상태 변경 리스너
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile, handleAuthStateChange]);

  // 이메일 로그인
  const signInWithEmail = useCallback(
    async (email: string, password: string): Promise<{ error: Error | null }> => {
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          return { error: new Error(error.message) };
        }

        return { error: null };
      } catch (err) {
        return { error: err as Error };
      }
    },
    []
  );

  // 이메일 회원가입
  const signUpWithEmail = useCallback(
    async (
      email: string,
      password: string,
      metadata?: { username?: string }
    ): Promise<{ error: Error | null }> => {
      try {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: metadata,
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (error) {
          return { error: new Error(error.message) };
        }

        return { error: null };
      } catch (err) {
        return { error: err as Error };
      }
    },
    []
  );

  // OAuth 로그인
  const signInWithOAuth = useCallback(
    async (provider: Provider): Promise<{ error: Error | null }> => {
      try {
        const { error } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (error) {
          return { error: new Error(error.message) };
        }

        return { error: null };
      } catch (err) {
        return { error: err as Error };
      }
    },
    []
  );

  // Magic Link 로그인
  const signInWithMagicLink = useCallback(
    async (email: string): Promise<{ error: Error | null }> => {
      try {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (error) {
          return { error: new Error(error.message) };
        }

        return { error: null };
      } catch (err) {
        return { error: err as Error };
      }
    },
    []
  );

  // 로그아웃
  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
  }, []);

  // 프로필 업데이트
  const updateProfile = useCallback(
    async (updates: Partial<Profile>): Promise<{ error: Error | null }> => {
      if (!user) {
        return { error: new Error("Not authenticated") };
      }

      try {
        const { error } = await supabase
          .from("profiles")
          // @ts-ignore
          .update(updates)
          .eq("id", user.id);

        if (error) {
          return { error: new Error(error.message) };
        }

        // 로컬 상태 업데이트
        setProfile((prev) => (prev ? { ...prev, ...updates } : null));

        return { error: null };
      } catch (err) {
        return { error: err as Error };
      }
    },
    [user]
  );

  // 컨텍스트 값 메모이제이션
  const contextValue = useMemo<AuthContextType>(
    () => ({
      user,
      profile,
      session,
      isLoading,
      isAuthenticated: !!user && !!session,
      signInWithEmail,
      signUpWithEmail,
      signInWithOAuth,
      signInWithMagicLink,
      signOut,
      refreshProfile,
      updateProfile,
    }),
    [
      user,
      profile,
      session,
      isLoading,
      signInWithEmail,
      signUpWithEmail,
      signInWithOAuth,
      signInWithMagicLink,
      signOut,
      refreshProfile,
      updateProfile,
    ]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}
