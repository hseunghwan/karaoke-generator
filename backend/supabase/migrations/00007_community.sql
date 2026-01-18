-- =====================================================
-- Migration: 00007_community.sql
-- Description: 커뮤니티 기능 테이블 (댓글, 좋아요)
-- =====================================================

-- comments 테이블: 댓글 및 대댓글
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 포스트 연결
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  
  -- 작성자
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- 대댓글 (Self-referencing)
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  
  -- 내용
  content TEXT NOT NULL CHECK (char_length(content) <= 2000),
  
  -- 좋아요 수 (비정규화)
  like_count INTEGER DEFAULT 0,
  
  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스: 포스트별 댓글 목록 (시간순)
CREATE INDEX idx_comments_post ON comments(post_id, created_at);

-- 인덱스: 대댓글 조회
CREATE INDEX idx_comments_parent ON comments(parent_id) WHERE parent_id IS NOT NULL;

-- 인덱스: 사용자별 댓글 목록
CREATE INDEX idx_comments_user ON comments(user_id);

-- comments 테이블의 updated_at 자동 갱신
CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- likes 테이블: 포스트/댓글 좋아요
CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 좋아요 누른 사용자
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- 대상 (둘 중 하나만 설정)
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  
  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- post 또는 comment 중 하나만 설정되어야 함
  CONSTRAINT like_target_check CHECK (
    (post_id IS NOT NULL AND comment_id IS NULL) OR
    (post_id IS NULL AND comment_id IS NOT NULL)
  ),
  
  -- 중복 좋아요 방지
  CONSTRAINT unique_post_like UNIQUE (user_id, post_id),
  CONSTRAINT unique_comment_like UNIQUE (user_id, comment_id)
);

-- 인덱스: 포스트별 좋아요 목록
CREATE INDEX idx_likes_post ON likes(post_id) WHERE post_id IS NOT NULL;

-- 인덱스: 댓글별 좋아요 목록
CREATE INDEX idx_likes_comment ON likes(comment_id) WHERE comment_id IS NOT NULL;

-- 인덱스: 사용자별 좋아요 목록
CREATE INDEX idx_likes_user ON likes(user_id);

-- =====================================================
-- 좋아요 수 자동 갱신 트리거
-- =====================================================

-- 포스트 좋아요 수 갱신 함수
CREATE OR REPLACE FUNCTION update_post_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.post_id IS NOT NULL THEN
    UPDATE posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' AND OLD.post_id IS NOT NULL THEN
    UPDATE posts SET like_count = like_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_like_change_update_post
  AFTER INSERT OR DELETE ON likes
  FOR EACH ROW EXECUTE FUNCTION update_post_like_count();

-- 댓글 좋아요 수 갱신 함수
CREATE OR REPLACE FUNCTION update_comment_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.comment_id IS NOT NULL THEN
    UPDATE comments SET like_count = like_count + 1 WHERE id = NEW.comment_id;
  ELSIF TG_OP = 'DELETE' AND OLD.comment_id IS NOT NULL THEN
    UPDATE comments SET like_count = like_count - 1 WHERE id = OLD.comment_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_like_change_update_comment
  AFTER INSERT OR DELETE ON likes
  FOR EACH ROW EXECUTE FUNCTION update_comment_like_count();

-- =====================================================
-- 댓글 수 자동 갱신 트리거
-- =====================================================

-- 포스트 댓글 수 갱신 함수
CREATE OR REPLACE FUNCTION update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comment_count = comment_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_comment_change_update_post
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_post_comment_count();
