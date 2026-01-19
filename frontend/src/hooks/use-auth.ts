/**
 * useAuth 훅
 * 
 * Supabase Auth를 래핑하여 인증 상태 및 메서드를 제공합니다.
 * AuthProvider와 함께 사용됩니다.
 */
"use client";

import { useContext, createContext } from "react";
import type { User, Session, Provider } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

// 프로필 타입 (Supabase profiles 테이블)
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

// Auth 컨텍스트 타입 정의
export interface AuthContextType {
  // 상태
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // 인증 메서드
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithEmail: (email: string, password: string, metadata?: { username?: string }) => Promise<{ error: Error | null }>;
  signInWithOAuth: (provider: Provider) => Promise<{ error: Error | null }>;
  signInWithMagicLink: (email: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  
  // 프로필 메서드
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
}

// 기본값 (컨텍스트 외부에서 사용 시)
const defaultContext: AuthContextType = {
  user: null,
  profile: null,
  session: null,
  isLoading: true,
  isAuthenticated: false,
  signInWithEmail: async () => ({ error: new Error("AuthProvider not found") }),
  signUpWithEmail: async () => ({ error: new Error("AuthProvider not found") }),
  signInWithOAuth: async () => ({ error: new Error("AuthProvider not found") }),
  signInWithMagicLink: async () => ({ error: new Error("AuthProvider not found") }),
  signOut: async () => {},
  refreshProfile: async () => {},
  updateProfile: async () => ({ error: new Error("AuthProvider not found") }),
};

// 컨텍스트 생성
export const AuthContext = createContext<AuthContextType>(defaultContext);

// useAuth 훅
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  
  return context;
}

// 편의 훅: 인증 상태만 확인
export function useIsAuthenticated(): boolean {
  const { isAuthenticated, isLoading } = useAuth();
  return !isLoading && isAuthenticated;
}

// 편의 훅: 현재 사용자
export function useUser(): User | null {
  const { user } = useAuth();
  return user;
}

// 편의 훅: 프로필 정보
export function useProfile(): Profile | null {
  const { profile } = useAuth();
  return profile;
}

// 편의 훅: 크레딧 잔액
export function useCreditsBalance(): number {
  const { profile } = useAuth();
  return profile?.credits_balance ?? 0;
}
