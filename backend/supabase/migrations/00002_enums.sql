-- =====================================================
-- Migration: 00002_enums.sql
-- Description: PostgreSQL ENUM 타입 정의
-- =====================================================

-- 작업 상태: 노래방 영상 생성 작업의 진행 상태
CREATE TYPE job_status AS ENUM (
  'pending',      -- 대기 중
  'queued',       -- 큐 등록됨
  'downloading',  -- 미디어 다운로드 중
  'separating',   -- 음원 분리 중
  'transcribing', -- 음성 인식 중
  'translating',  -- 번역 중
  'rendering',    -- 영상 렌더링 중
  'uploading',    -- 업로드 중
  'completed',    -- 완료
  'failed'        -- 실패
);

-- 플랫폼 타입: 지원하는 영상 플랫폼
CREATE TYPE platform_type AS ENUM (
  'youtube',      -- YouTube (16:9 가로)
  'tiktok',       -- TikTok (9:16 세로)
  'shorts',       -- YouTube Shorts (9:16 세로)
  'instagram'     -- Instagram Reels (9:16 세로)
);

-- 구독 상태: Stripe 구독 상태와 매핑
CREATE TYPE subscription_status AS ENUM (
  'active',       -- 활성 (정상 결제)
  'canceled',     -- 취소됨 (기간 종료 후 비활성)
  'past_due',     -- 결제 연체
  'trialing',     -- 무료 체험 중
  'paused'        -- 일시 정지
);

-- 크레딧 거래 유형: 크레딧 입출금 내역 분류
CREATE TYPE credit_tx_type AS ENUM (
  'subscription_grant',  -- 구독으로 인한 월간 지급
  'purchase',            -- 직접 구매
  'job_usage',           -- 작업 사용 (차감)
  'refund',              -- 환불
  'bonus'                -- 이벤트/보너스
);

-- 콘텐츠 모더레이션 상태: AI 자동 검사 및 수동 검토
CREATE TYPE moderation_status AS ENUM (
  'pending',      -- 검토 대기
  'approved',     -- 승인됨 (공개 가능)
  'rejected',     -- 거부됨 (저작권 위반 등)
  'flagged'       -- AI 자동 플래그 (수동 검토 필요)
);

-- 알림 유형: 사용자 알림 분류
CREATE TYPE notification_type AS ENUM (
  'like',           -- 누군가 내 포스트에 좋아요
  'comment',        -- 누군가 내 포스트에 댓글
  'reply',          -- 누군가 내 댓글에 답글
  'mention',        -- 누군가 나를 멘션
  'job_completed',  -- 작업 완료
  'job_failed',     -- 작업 실패
  'follow',         -- 누군가 나를 팔로우 (향후 확장)
  'system'          -- 시스템 알림
);
