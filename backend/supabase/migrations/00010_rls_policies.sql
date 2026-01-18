-- =====================================================
-- Migration: 00010_rls_policies.sql
-- Description: Row Level Security (RLS) 정책 설정
-- =====================================================

-- =====================================================
-- profiles 테이블 RLS
-- =====================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 프로필을 조회할 수 있음 (공개)
CREATE POLICY "Public profiles are viewable"
  ON profiles FOR SELECT
  USING (true);

-- 본인만 프로필 수정 가능
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- =====================================================
-- jobs 테이블 RLS
-- =====================================================
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- 본인 작업만 조회 가능
CREATE POLICY "Users can view own jobs"
  ON jobs FOR SELECT
  USING (auth.uid() = user_id);

-- 본인 작업만 생성 가능
CREATE POLICY "Users can create own jobs"
  ON jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 본인 작업만 수정 가능
CREATE POLICY "Users can update own jobs"
  ON jobs FOR UPDATE
  USING (auth.uid() = user_id);

-- =====================================================
-- 템플릿 접근 제한 함수 (구독 등급 기반)
-- =====================================================
CREATE OR REPLACE FUNCTION check_template_access(p_user_id UUID, p_template TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_allowed_templates TEXT[];
BEGIN
  -- 사용자의 활성 구독에서 허용된 템플릿 목록 조회
  SELECT p.allowed_templates INTO v_allowed_templates
  FROM subscriptions s
  JOIN plans p ON s.plan_id = p.id
  WHERE s.user_id = p_user_id AND s.status = 'active';

  -- 구독이 없으면 free 플랜 기준으로 판단
  IF v_allowed_templates IS NULL THEN
    SELECT allowed_templates INTO v_allowed_templates
    FROM plans WHERE name = 'free';
  END IF;

  RETURN p_template = ANY(v_allowed_templates);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 템플릿 접근 제한 정책 (INSERT 시에만 체크)
CREATE POLICY "Template access based on subscription"
  ON jobs FOR INSERT
  WITH CHECK (check_template_access(auth.uid(), template));

-- =====================================================
-- posts 테이블 RLS
-- =====================================================
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- 승인된 포스트는 모두 조회 가능, 본인 포스트는 상태 무관 조회 가능
CREATE POLICY "Approved posts are viewable"
  ON posts FOR SELECT
  USING (moderation_status = 'approved' OR auth.uid() = user_id);

-- 본인 포스트만 생성 가능
CREATE POLICY "Users can create own posts"
  ON posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 본인 포스트만 수정 가능
CREATE POLICY "Users can update own posts"
  ON posts FOR UPDATE
  USING (auth.uid() = user_id);

-- 본인 포스트만 삭제 가능
CREATE POLICY "Users can delete own posts"
  ON posts FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- video_variants 테이블 RLS
-- =====================================================
ALTER TABLE video_variants ENABLE ROW LEVEL SECURITY;

-- 포스트 가시성을 따름 (승인된 포스트 또는 본인 포스트의 variant만 조회)
CREATE POLICY "Variants follow post visibility"
  ON video_variants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM posts p
      WHERE p.id = post_id
        AND (p.moderation_status = 'approved' OR p.user_id = auth.uid())
    )
  );

-- 본인 포스트의 variant만 생성/수정/삭제 가능
CREATE POLICY "Users can manage variants of own posts"
  ON video_variants FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM posts p
      WHERE p.id = post_id AND p.user_id = auth.uid()
    )
  );

-- =====================================================
-- comments 테이블 RLS
-- =====================================================
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- 승인된 포스트의 댓글은 모두 조회 가능
CREATE POLICY "Comments on approved posts are viewable"
  ON comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM posts p
      WHERE p.id = post_id
        AND (p.moderation_status = 'approved' OR p.user_id = auth.uid())
    )
  );

-- 인증된 사용자만 댓글 작성 가능
CREATE POLICY "Authenticated users can create comments"
  ON comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 본인 댓글만 수정 가능
CREATE POLICY "Users can update own comments"
  ON comments FOR UPDATE
  USING (auth.uid() = user_id);

-- 본인 댓글만 삭제 가능
CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- likes 테이블 RLS
-- =====================================================
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- 좋아요는 모두 조회 가능
CREATE POLICY "Likes are viewable"
  ON likes FOR SELECT
  USING (true);

-- 본인 좋아요만 관리 가능 (INSERT, DELETE)
CREATE POLICY "Users can manage own likes"
  ON likes FOR ALL
  USING (auth.uid() = user_id);

-- =====================================================
-- notifications 테이블 RLS
-- =====================================================
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 본인 알림만 조회 가능
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- 본인 알림만 수정 가능 (읽음 처리)
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- =====================================================
-- credit_transactions 테이블 RLS
-- =====================================================
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- 본인 거래 내역만 조회 가능
CREATE POLICY "Users can view own transactions"
  ON credit_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- =====================================================
-- subscriptions 테이블 RLS
-- =====================================================
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- 본인 구독만 조회 가능
CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- =====================================================
-- plans 테이블 RLS
-- =====================================================
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 활성 플랜 조회 가능
CREATE POLICY "Active plans are viewable"
  ON plans FOR SELECT
  USING (is_active = true);

-- =====================================================
-- api_keys 테이블 RLS (Enterprise 전용)
-- =====================================================

-- API Key 접근 권한 확인 함수
CREATE OR REPLACE FUNCTION check_api_key_access(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM subscriptions s
    JOIN plans p ON s.plan_id = p.id
    WHERE s.user_id = p_user_id
      AND s.status = 'active'
      AND (p.features->>'api_access')::boolean = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- 본인 API Key만 조회 가능
CREATE POLICY "Users can view own api_keys"
  ON api_keys FOR SELECT
  USING (auth.uid() = user_id);

-- Enterprise 플랜 사용자만 API Key 생성 가능
CREATE POLICY "Only enterprise can create api_keys"
  ON api_keys FOR INSERT
  WITH CHECK (auth.uid() = user_id AND check_api_key_access(auth.uid()));

-- 본인 API Key만 수정 가능
CREATE POLICY "Users can update own api_keys"
  ON api_keys FOR UPDATE
  USING (auth.uid() = user_id);

-- 본인 API Key만 삭제 가능
CREATE POLICY "Users can delete own api_keys"
  ON api_keys FOR DELETE
  USING (auth.uid() = user_id);
