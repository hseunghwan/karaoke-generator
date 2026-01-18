-- =====================================================
-- Migration: 00003_profiles.sql
-- Description: 사용자 프로필 테이블 및 트리거
-- =====================================================

-- profiles 테이블: Supabase Auth의 auth.users를 확장하는 public 프로필
CREATE TABLE profiles (
  -- auth.users와 1:1 관계, 사용자 삭제 시 프로필도 삭제
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 기본 정보
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  
  -- 다국어/글로벌 설정
  locale TEXT DEFAULT 'en',           -- UI 언어 (ko, en, ja 등)
  timezone TEXT DEFAULT 'UTC',        -- IANA timezone (Asia/Seoul 등)
  
  -- 크레딧 시스템
  credits_balance INTEGER DEFAULT 0 CHECK (credits_balance >= 0),  -- 음수 방지
  
  -- 결제 연동
  stripe_customer_id TEXT,            -- Stripe 고객 ID
  
  -- 상태
  is_active BOOLEAN DEFAULT TRUE,
  
  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스: 이메일 조회 최적화
CREATE INDEX idx_profiles_email ON profiles(email);

-- 인덱스: username 조회 최적화
CREATE INDEX idx_profiles_username ON profiles(username) WHERE username IS NOT NULL;

-- Auth 유저 생성 시 자동으로 profile 생성하는 트리거 함수
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, avatar_url, credits_balance)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url',
    50  -- 신규 가입 보너스 크레딧
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- auth.users에 INSERT 발생 시 트리거 실행
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- updated_at 자동 갱신 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- profiles 테이블의 updated_at 자동 갱신
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
