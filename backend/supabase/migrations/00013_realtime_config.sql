-- =====================================================
-- Migration: 00013_realtime_config.sql
-- Description: Supabase Realtime 설정
-- =====================================================

-- Supabase Realtime Publication 설정
-- 특정 테이블의 변경 사항을 실시간으로 클라이언트에 전달

-- =====================================================
-- Realtime Publication 생성
-- =====================================================

-- 기존 publication이 있으면 삭제 후 재생성
DROP PUBLICATION IF EXISTS supabase_realtime;

-- jobs, posts, notifications 테이블의 변경 사항을 전파
CREATE PUBLICATION supabase_realtime FOR TABLE 
  jobs,
  posts,
  notifications,
  comments,
  likes;

-- =====================================================
-- 주의사항
-- =====================================================
-- 1. Supabase Dashboard에서 Realtime 기능을 활성화해야 합니다.
-- 2. 클라이언트에서는 user_id 필터를 적용하여 구독해야 합니다.
-- 3. RLS 정책이 Realtime에도 적용됩니다.

-- =====================================================
-- 클라이언트 사용 예시 (TypeScript)
-- =====================================================

/*
// 본인 작업 상태 변경 구독
const channel = supabase
  .channel('job-updates')
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'jobs',
      filter: `user_id=eq.${userId}`,  // 본인 작업만 구독
    },
    (payload) => {
      console.log('Job updated:', payload.new);
      updateJobStatus(payload.new);
    }
  )
  .subscribe();

// 본인 알림 구독
const notificationChannel = supabase
  .channel('notifications')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${userId}`,
    },
    (payload) => {
      showNotification(payload.new);
    }
  )
  .subscribe();

// 특정 포스트의 댓글 구독
const commentsChannel = supabase
  .channel(`post-${postId}-comments`)
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'comments',
      filter: `post_id=eq.${postId}`,
    },
    (payload) => {
      addNewComment(payload.new);
    }
  )
  .subscribe();

// 특정 포스트의 좋아요 수 변경 구독
const likesChannel = supabase
  .channel(`post-${postId}-likes`)
  .on(
    'postgres_changes',
    {
      event: '*',  // INSERT, UPDATE, DELETE 모두
      schema: 'public',
      table: 'posts',
      filter: `id=eq.${postId}`,
    },
    (payload) => {
      updateLikeCount(payload.new.like_count);
    }
  )
  .subscribe();
*/
