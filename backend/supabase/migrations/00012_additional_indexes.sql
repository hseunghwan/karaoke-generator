-- =====================================================
-- Migration: 00012_additional_indexes.sql
-- Description: 추가 인덱스 및 성능 최적화
-- =====================================================

-- 주요 인덱스들은 이미 각 테이블 생성 시 포함되어 있음
-- 이 파일은 추가적인 복합 인덱스 및 최적화를 위한 인덱스를 포함

-- =====================================================
-- jobs 테이블 추가 인덱스
-- =====================================================

-- 사용자별 + 상태별 복합 인덱스 (대시보드용)
CREATE INDEX IF NOT EXISTS idx_jobs_user_status
  ON jobs(user_id, status, created_at DESC);

-- 완료된 작업 중 AI 모델 버전별 조회 (재렌더링용)
CREATE INDEX IF NOT EXISTS idx_jobs_completed_model
  ON jobs(ai_model_version, completed_at DESC)
  WHERE status = 'completed';

-- =====================================================
-- posts 테이블 추가 인덱스
-- =====================================================

-- 추천 포스트 조회 (featured + approved)
CREATE INDEX IF NOT EXISTS idx_posts_featured
  ON posts(created_at DESC)
  WHERE is_featured = true AND moderation_status = 'approved';

-- 사용자별 + 모더레이션 상태별 복합 인덱스
CREATE INDEX IF NOT EXISTS idx_posts_user_moderation
  ON posts(user_id, moderation_status, created_at DESC);

-- =====================================================
-- notifications 테이블 추가 인덱스
-- =====================================================

-- 사용자별 안 읽은 알림 개수 조회 최적화
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread_count
  ON notifications(user_id)
  WHERE read_at IS NULL;

-- 최근 알림 조회 (7일 이내)
CREATE INDEX IF NOT EXISTS idx_notifications_recent
  ON notifications(created_at DESC);

-- =====================================================
-- credit_transactions 테이블 추가 인덱스
-- =====================================================

-- 사용자별 + 유형별 복합 인덱스 (통계용)
CREATE INDEX IF NOT EXISTS idx_credit_tx_user_type
  ON credit_transactions(user_id, type, created_at DESC);

-- 월별 사용량 집계용 (job_usage만)
CREATE INDEX IF NOT EXISTS idx_credit_tx_monthly_usage
  ON credit_transactions(user_id, created_at)
  WHERE type = 'job_usage';

-- =====================================================
-- subscriptions 테이블 추가 인덱스
-- =====================================================

-- 만료 예정 구독 조회 (갱신 알림용)
CREATE INDEX IF NOT EXISTS idx_subscriptions_expiring
  ON subscriptions(current_period_end)
  WHERE status = 'active';

-- Stripe ID로 조회 (Webhook 처리용)
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe
  ON subscriptions(stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

-- =====================================================
-- likes 테이블 추가 인덱스
-- =====================================================

-- 최근 좋아요 조회 (트렌딩 계산용)
CREATE INDEX IF NOT EXISTS idx_likes_recent
  ON likes(created_at DESC);

-- =====================================================
-- comments 테이블 추가 인덱스
-- =====================================================

-- 최근 댓글 조회
CREATE INDEX IF NOT EXISTS idx_comments_recent
  ON comments(created_at DESC);

-- =====================================================
-- 통계 함수 (materialized view 대안)
-- =====================================================

-- 사용자 통계 조회 함수
CREATE OR REPLACE FUNCTION get_user_stats(p_user_id UUID)
RETURNS TABLE (
  total_jobs BIGINT,
  completed_jobs BIGINT,
  total_posts BIGINT,
  total_likes_received BIGINT,
  total_comments_received BIGINT,
  credits_used_this_month BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM jobs WHERE user_id = p_user_id),
    (SELECT COUNT(*) FROM jobs WHERE user_id = p_user_id AND status = 'completed'),
    (SELECT COUNT(*) FROM posts WHERE user_id = p_user_id),
    (SELECT COALESCE(SUM(like_count), 0) FROM posts WHERE user_id = p_user_id),
    (SELECT COALESCE(SUM(comment_count), 0) FROM posts WHERE user_id = p_user_id),
    (SELECT COALESCE(SUM(ABS(amount)), 0) FROM credit_transactions
     WHERE user_id = p_user_id
       AND type = 'job_usage'
       AND created_at >= date_trunc('month', NOW()));
END;
$$ LANGUAGE plpgsql STABLE;

-- 플랫폼 전체 통계 조회 함수 (관리자용)
CREATE OR REPLACE FUNCTION get_platform_stats()
RETURNS TABLE (
  total_users BIGINT,
  total_jobs BIGINT,
  total_posts BIGINT,
  jobs_today BIGINT,
  active_users_today BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM profiles WHERE is_active = true),
    (SELECT COUNT(*) FROM jobs),
    (SELECT COUNT(*) FROM posts WHERE moderation_status = 'approved'),
    (SELECT COUNT(*) FROM jobs WHERE created_at >= CURRENT_DATE),
    (SELECT COUNT(DISTINCT user_id) FROM jobs WHERE created_at >= CURRENT_DATE);
END;
$$ LANGUAGE plpgsql STABLE;
