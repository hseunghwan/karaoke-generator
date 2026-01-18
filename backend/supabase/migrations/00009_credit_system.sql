-- =====================================================
-- Migration: 00009_credit_system.sql
-- Description: 크레딧 시스템 테이블 및 원자적 연산 함수
-- =====================================================

-- credit_transactions 테이블: 크레딧 입출금 내역
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 사용자
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- 환불 시 원본 거래 연결 (Self-referencing)
  parent_transaction_id UUID REFERENCES credit_transactions(id),
  
  -- 금액 (양수: 충전, 음수: 사용)
  amount INTEGER NOT NULL,
  
  -- 거래 후 잔액 (감사 추적용)
  balance_after INTEGER NOT NULL,
  
  -- 거래 유형
  type credit_tx_type NOT NULL,
  
  -- 참조 ID (job_id, subscription_id 등)
  reference_id UUID,
  
  -- 설명
  description TEXT,
  
  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스: 사용자별 거래 내역 (최신순)
CREATE INDEX idx_credit_tx_user ON credit_transactions(user_id, created_at DESC);

-- 인덱스: 참조 ID로 조회
CREATE INDEX idx_credit_tx_reference ON credit_transactions(reference_id) WHERE reference_id IS NOT NULL;

-- 인덱스: 환불 연결 조회
CREATE INDEX idx_credit_tx_parent ON credit_transactions(parent_transaction_id) WHERE parent_transaction_id IS NOT NULL;

-- =====================================================
-- 크레딧 시스템 함수
-- =====================================================

-- 크레딧 차감 함수 (원자적 연산, Race Condition 방지)
-- 성공 시 새 잔액 반환, 실패 시 NULL 반환
CREATE OR REPLACE FUNCTION deduct_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_reference_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  -- 원자적으로 잔액 차감 (잔액이 충분할 때만 UPDATE 성공)
  UPDATE profiles
  SET credits_balance = credits_balance - p_amount, updated_at = NOW()
  WHERE id = p_user_id AND credits_balance >= p_amount
  RETURNING credits_balance INTO v_new_balance;

  -- 차감 성공 시 트랜잭션 기록
  IF v_new_balance IS NOT NULL THEN
    INSERT INTO credit_transactions (user_id, amount, balance_after, type, reference_id, description)
    VALUES (p_user_id, -p_amount, v_new_balance, 'job_usage', p_reference_id, p_description);
  END IF;

  RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql;

-- 크레딧 충전 함수
CREATE OR REPLACE FUNCTION add_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_type credit_tx_type,
  p_reference_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  UPDATE profiles
  SET credits_balance = credits_balance + p_amount, updated_at = NOW()
  WHERE id = p_user_id
  RETURNING credits_balance INTO v_new_balance;

  INSERT INTO credit_transactions (user_id, amount, balance_after, type, reference_id, description)
  VALUES (p_user_id, p_amount, v_new_balance, p_type, p_reference_id, p_description);

  RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql;

-- 크레딧 환불 함수 (원본 거래 연결)
CREATE OR REPLACE FUNCTION refund_credits(
  p_original_transaction_id UUID,
  p_description TEXT DEFAULT '작업 실패로 인한 환불'
) RETURNS INTEGER AS $$
DECLARE
  v_user_id UUID;
  v_original_amount INTEGER;
  v_new_balance INTEGER;
BEGIN
  -- 원본 거래 정보 조회 (job_usage 타입만 환불 가능)
  SELECT user_id, ABS(amount)
  INTO v_user_id, v_original_amount
  FROM credit_transactions
  WHERE id = p_original_transaction_id AND type = 'job_usage';

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Original transaction not found or not refundable';
  END IF;

  -- 잔액 복구
  UPDATE profiles
  SET credits_balance = credits_balance + v_original_amount, updated_at = NOW()
  WHERE id = v_user_id
  RETURNING credits_balance INTO v_new_balance;

  -- 환불 기록 (parent_transaction_id로 연결)
  INSERT INTO credit_transactions (user_id, parent_transaction_id, amount, balance_after, type, description)
  VALUES (v_user_id, p_original_transaction_id, v_original_amount, v_new_balance, 'refund', p_description);

  RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql;

-- 크레딧 비용 계산 함수
CREATE OR REPLACE FUNCTION calculate_credit_cost(
  p_duration_seconds INTEGER,
  p_target_languages TEXT[],
  p_platform platform_type
) RETURNS INTEGER AS $$
DECLARE
  base_cost INTEGER := 10;
  duration_multiplier NUMERIC;
  language_cost INTEGER;
  platform_multiplier NUMERIC := 1.0;
BEGIN
  -- 영상 길이에 따른 비용 (30초당 2크레딧 추가)
  duration_multiplier := CEIL(p_duration_seconds / 30.0);
  
  -- 번역 언어 수에 따른 비용 (언어당 5크레딧)
  language_cost := COALESCE(array_length(p_target_languages, 1), 0) * 5;
  
  -- 플랫폼별 가중치 (shorts/tiktok은 짧아서 저렴)
  IF p_platform IN ('shorts', 'tiktok') THEN
    platform_multiplier := 0.8;
  END IF;

  RETURN CEIL((base_cost + (duration_multiplier * 2) + language_cost) * platform_multiplier);
END;
$$ LANGUAGE plpgsql;

-- 사용자 크레딧 잔액 조회 함수 (캐시 무효화 방지)
CREATE OR REPLACE FUNCTION get_credits_balance(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_balance INTEGER;
BEGIN
  SELECT credits_balance INTO v_balance
  FROM profiles
  WHERE id = p_user_id;
  
  RETURN COALESCE(v_balance, 0);
END;
$$ LANGUAGE plpgsql STABLE;
