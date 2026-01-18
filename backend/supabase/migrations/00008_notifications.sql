-- =====================================================
-- Migration: 00008_notifications.sql
-- Description: 알림 시스템 테이블 및 트리거
-- =====================================================

-- notifications 테이블: 사용자 알림
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 알림 받는 사람
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- 행위자 (시스템 알림은 NULL)
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- 알림 유형
  type notification_type NOT NULL,
  
  -- 대상 정보
  target_id UUID,                         -- post_id, comment_id, job_id 등
  target_type TEXT,                       -- 'post', 'comment', 'job' 등
  
  -- 추가 데이터 (포스트 제목, 댓글 내용 미리보기 등)
  data JSONB DEFAULT '{}',
  
  -- 읽음 상태 (NULL이면 안 읽음)
  read_at TIMESTAMPTZ,
  
  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스: 사용자별 알림 목록 (최신순)
CREATE INDEX idx_notifications_user ON notifications(user_id, created_at DESC);

-- 인덱스: 안 읽은 알림 조회 최적화
CREATE INDEX idx_notifications_unread ON notifications(user_id, read_at) WHERE read_at IS NULL;

-- 인덱스: 알림 유형별 조회
CREATE INDEX idx_notifications_type ON notifications(type);

-- =====================================================
-- 알림 자동 생성 트리거
-- =====================================================

-- 좋아요 알림 생성 함수
CREATE OR REPLACE FUNCTION notify_on_like()
RETURNS TRIGGER AS $$
DECLARE
  v_post_owner_id UUID;
  v_post_title TEXT;
  v_comment_owner_id UUID;
  v_comment_preview TEXT;
BEGIN
  -- 포스트 좋아요일 때
  IF NEW.post_id IS NOT NULL THEN
    SELECT user_id, title INTO v_post_owner_id, v_post_title
    FROM posts WHERE id = NEW.post_id;

    -- 본인 좋아요는 알림 안 함
    IF v_post_owner_id IS NOT NULL AND v_post_owner_id != NEW.user_id THEN
      INSERT INTO notifications (user_id, actor_id, type, target_id, target_type, data)
      VALUES (
        v_post_owner_id,
        NEW.user_id,
        'like',
        NEW.post_id,
        'post',
        jsonb_build_object('post_title', v_post_title)
      );
    END IF;
  
  -- 댓글 좋아요일 때
  ELSIF NEW.comment_id IS NOT NULL THEN
    SELECT user_id, LEFT(content, 50) INTO v_comment_owner_id, v_comment_preview
    FROM comments WHERE id = NEW.comment_id;

    IF v_comment_owner_id IS NOT NULL AND v_comment_owner_id != NEW.user_id THEN
      INSERT INTO notifications (user_id, actor_id, type, target_id, target_type, data)
      VALUES (
        v_comment_owner_id,
        NEW.user_id,
        'like',
        NEW.comment_id,
        'comment',
        jsonb_build_object('comment_preview', v_comment_preview)
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_like_created
  AFTER INSERT ON likes
  FOR EACH ROW EXECUTE FUNCTION notify_on_like();

-- 댓글 알림 생성 함수
CREATE OR REPLACE FUNCTION notify_on_comment()
RETURNS TRIGGER AS $$
DECLARE
  v_post_owner_id UUID;
  v_post_title TEXT;
  v_parent_author_id UUID;
  v_comment_preview TEXT;
BEGIN
  v_comment_preview := LEFT(NEW.content, 50);
  
  -- 포스트 작성자에게 알림 (댓글)
  SELECT user_id, title INTO v_post_owner_id, v_post_title
  FROM posts WHERE id = NEW.post_id;

  IF v_post_owner_id IS NOT NULL AND v_post_owner_id != NEW.user_id THEN
    INSERT INTO notifications (user_id, actor_id, type, target_id, target_type, data)
    VALUES (
      v_post_owner_id,
      NEW.user_id,
      'comment',
      NEW.post_id,
      'post',
      jsonb_build_object('post_title', v_post_title, 'comment_preview', v_comment_preview)
    );
  END IF;

  -- 대댓글인 경우, 원 댓글 작성자에게 알림 (reply)
  IF NEW.parent_id IS NOT NULL THEN
    SELECT user_id INTO v_parent_author_id
    FROM comments WHERE id = NEW.parent_id;

    IF v_parent_author_id IS NOT NULL 
       AND v_parent_author_id != NEW.user_id 
       AND v_parent_author_id != v_post_owner_id THEN
      INSERT INTO notifications (user_id, actor_id, type, target_id, target_type, data)
      VALUES (
        v_parent_author_id,
        NEW.user_id,
        'reply',
        NEW.id,
        'comment',
        jsonb_build_object('comment_preview', v_comment_preview)
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_comment_created
  AFTER INSERT ON comments
  FOR EACH ROW EXECUTE FUNCTION notify_on_comment();

-- 작업 완료/실패 알림 생성 함수
CREATE OR REPLACE FUNCTION notify_on_job_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- completed로 변경 시
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    INSERT INTO notifications (user_id, type, target_id, target_type, data)
    VALUES (
      NEW.user_id,
      'job_completed',
      NEW.id,
      'job',
      jsonb_build_object('title', NEW.title, 'artist', NEW.artist)
    );
  
  -- failed로 변경 시
  ELSIF NEW.status = 'failed' AND OLD.status != 'failed' THEN
    INSERT INTO notifications (user_id, type, target_id, target_type, data)
    VALUES (
      NEW.user_id,
      'job_failed',
      NEW.id,
      'job',
      jsonb_build_object('title', NEW.title, 'artist', NEW.artist, 'error', NEW.error)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_job_status_change
  AFTER UPDATE OF status ON jobs
  FOR EACH ROW EXECUTE FUNCTION notify_on_job_status_change();
