-- =====================================================
-- Migration: 00005_billing.sql
-- Description: 구독 플랜 및 결제 관련 테이블
-- =====================================================

-- plans 테이블: 구독 플랜 정의
CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 플랜 식별
  name TEXT UNIQUE NOT NULL,              -- free, pro, enterprise
  
  -- 크레딧
  credits_per_month INTEGER NOT NULL,     -- 월간 지급 크레딧
  
  -- 가격
  price_cents INTEGER NOT NULL,           -- 월 가격 (센트 단위, 0 = 무료)
  
  -- 기능 제한
  features JSONB DEFAULT '{}',            -- 추가 기능 (max_video_length, watermark 등)
  allowed_templates TEXT[] DEFAULT '{}',  -- 사용 가능한 템플릿 목록
  
  -- 상태
  is_active BOOLEAN DEFAULT TRUE,
  
  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 초기 플랜 데이터 삽입
INSERT INTO plans (name, credits_per_month, price_cents, features, allowed_templates) VALUES
  ('free', 50, 0,
   '{"max_video_length_seconds": 180, "watermark": true, "max_languages": 1}',
   ARRAY['basic', 'simple']),
  ('pro', 500, 990,
   '{"max_video_length_seconds": 600, "watermark": false, "priority_queue": true, "max_languages": 3}',
   ARRAY['basic', 'simple', 'premium', 'animated']),
  ('enterprise', 5000, 4990,
   '{"max_video_length_seconds": 1800, "watermark": false, "priority_queue": true, "api_access": true, "max_languages": 10}',
   ARRAY['basic', 'simple', 'premium', 'animated', 'custom']);

-- subscriptions 테이블: 사용자 구독 상태
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 사용자 (1:1 관계)
  user_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- 플랜
  plan_id UUID NOT NULL REFERENCES plans(id),
  
  -- 상태
  status subscription_status DEFAULT 'active',
  
  -- Stripe 연동
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,                -- Webhook 처리 편의를 위해 여기에도 저장
  
  -- 결제 주기
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  
  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- subscriptions 테이블의 updated_at 자동 갱신
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- api_keys 테이블: API Key 관리 (Enterprise 전용)
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 소유자
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Key 정보
  name TEXT NOT NULL,                     -- Key 이름 (식별용)
  key_hash TEXT UNIQUE NOT NULL,          -- SHA256 해시 (평문 저장 안함)
  key_prefix TEXT NOT NULL,               -- 앞 8자 (kgen_xxxx, 표시용)
  
  -- 권한 범위
  scopes TEXT[] DEFAULT ARRAY['jobs:read', 'jobs:write'],
  
  -- 사용 추적
  last_used_at TIMESTAMPTZ,
  
  -- 만료
  expires_at TIMESTAMPTZ,                 -- NULL = 무기한
  
  -- 상태
  is_active BOOLEAN DEFAULT TRUE,
  
  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스: API Key 해시 조회 (활성 키만)
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash) WHERE is_active = TRUE;

-- 인덱스: 사용자별 API Key 목록
CREATE INDEX idx_api_keys_user ON api_keys(user_id);

-- COMMENT: API Key scopes 예시
COMMENT ON COLUMN api_keys.scopes IS '
권한 범위 예시:
- jobs:read - 작업 조회
- jobs:write - 작업 생성/수정
- posts:read - 포스트 조회
- posts:write - 포스트 생성/수정
- profile:read - 프로필 조회
';
