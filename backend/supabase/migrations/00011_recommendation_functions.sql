-- =====================================================
-- Migration: 00011_recommendation_functions.sql
-- Description: AI 추천 및 시맨틱 검색 함수
-- =====================================================

-- =====================================================
-- 유사 포스트 추천 함수
-- =====================================================
CREATE OR REPLACE FUNCTION get_similar_posts(
  p_post_id UUID,
  p_limit INTEGER DEFAULT 10
) RETURNS TABLE (
  id UUID,
  title TEXT,
  thumbnail_path TEXT,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.title,
    p.thumbnail_path,
    1 - (p.embedding <=> (SELECT embedding FROM posts WHERE id = p_post_id)) AS similarity
  FROM posts p
  WHERE p.id != p_post_id
    AND p.moderation_status = 'approved'
    AND p.embedding IS NOT NULL
  ORDER BY p.embedding <=> (SELECT embedding FROM posts WHERE id = p_post_id)
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- 시맨틱 검색 함수 (다국어 의미 기반)
-- 텍스트 쿼리를 임베딩으로 변환 후 이 함수 호출
-- =====================================================
CREATE OR REPLACE FUNCTION semantic_search(
  p_query_embedding vector(1536),
  p_limit INTEGER DEFAULT 20,
  p_threshold FLOAT DEFAULT 0.3
) RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  thumbnail_path TEXT,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.title,
    p.description,
    p.thumbnail_path,
    1 - (p.embedding <=> p_query_embedding) AS similarity
  FROM posts p
  WHERE p.moderation_status = 'approved'
    AND p.embedding IS NOT NULL
    AND 1 - (p.embedding <=> p_query_embedding) > p_threshold
  ORDER BY p.embedding <=> p_query_embedding
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- 사용자 취향 기반 추천 함수
-- 최근 좋아요한 포스트들의 평균 임베딩 기반
-- =====================================================
CREATE OR REPLACE FUNCTION get_recommended_posts(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 20
) RETURNS TABLE (
  id UUID,
  title TEXT,
  thumbnail_path TEXT,
  score FLOAT
) AS $$
DECLARE
  v_user_embedding vector(1536);
BEGIN
  -- 사용자가 최근 30일간 좋아요한 포스트들의 평균 임베딩 계산
  SELECT AVG(p.embedding) INTO v_user_embedding
  FROM likes l
  JOIN posts p ON l.post_id = p.id
  WHERE l.user_id = p_user_id
    AND l.created_at > NOW() - INTERVAL '30 days'
    AND p.embedding IS NOT NULL;

  -- 평균 임베딩이 없으면 (좋아요한 포스트가 없으면) 인기순으로 반환
  IF v_user_embedding IS NULL THEN
    RETURN QUERY
    SELECT p.id, p.title, p.thumbnail_path, p.like_count::FLOAT AS score
    FROM posts p
    WHERE p.moderation_status = 'approved'
    ORDER BY p.like_count DESC, p.created_at DESC
    LIMIT p_limit;
  ELSE
    -- 유사도 70% + 인기도 30% 가중치로 점수 계산
    RETURN QUERY
    SELECT
      p.id,
      p.title,
      p.thumbnail_path,
      (1 - (p.embedding <=> v_user_embedding)) * 0.7 + (p.like_count::FLOAT / 1000) * 0.3 AS score
    FROM posts p
    WHERE p.moderation_status = 'approved'
      AND p.user_id != p_user_id  -- 본인 포스트 제외
      AND p.embedding IS NOT NULL
    ORDER BY score DESC
    LIMIT p_limit;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- 트렌딩 포스트 조회 함수
-- 최근 7일간 좋아요 수 기준
-- =====================================================
CREATE OR REPLACE FUNCTION get_trending_posts(
  p_limit INTEGER DEFAULT 20,
  p_days INTEGER DEFAULT 7
) RETURNS TABLE (
  id UUID,
  title TEXT,
  thumbnail_path TEXT,
  like_count INTEGER,
  view_count INTEGER,
  trending_score FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.title,
    p.thumbnail_path,
    p.like_count,
    p.view_count,
    -- 최근 좋아요 수 + 조회수의 가중 합계
    (
      (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id AND l.created_at > NOW() - (p_days || ' days')::INTERVAL) * 2
      + p.view_count * 0.1
    )::FLOAT AS trending_score
  FROM posts p
  WHERE p.moderation_status = 'approved'
    AND p.created_at > NOW() - (p_days * 2 || ' days')::INTERVAL  -- 최근 2주 이내 포스트만
  ORDER BY trending_score DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- 태그 기반 포스트 검색 함수
-- =====================================================
CREATE OR REPLACE FUNCTION search_posts_by_tags(
  p_tags TEXT[],
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
) RETURNS TABLE (
  id UUID,
  title TEXT,
  thumbnail_path TEXT,
  tags TEXT[],
  like_count INTEGER,
  match_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.title,
    p.thumbnail_path,
    p.tags,
    p.like_count,
    (SELECT COUNT(*) FROM unnest(p.tags) t WHERE t = ANY(p_tags))::INTEGER AS match_count
  FROM posts p
  WHERE p.moderation_status = 'approved'
    AND p.tags && p_tags  -- 하나라도 일치하는 태그가 있으면
  ORDER BY match_count DESC, p.like_count DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- 유사 작업 추천 함수 (재생성 시 참고용)
-- =====================================================
CREATE OR REPLACE FUNCTION get_similar_jobs(
  p_job_id UUID,
  p_limit INTEGER DEFAULT 5
) RETURNS TABLE (
  id UUID,
  title TEXT,
  artist TEXT,
  status job_status,
  similarity FLOAT
) AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- 작업 소유자 확인
  SELECT user_id INTO v_user_id FROM jobs WHERE id = p_job_id;

  RETURN QUERY
  SELECT
    j.id,
    j.title,
    j.artist,
    j.status,
    1 - (j.embedding <=> (SELECT embedding FROM jobs WHERE id = p_job_id)) AS similarity
  FROM jobs j
  WHERE j.id != p_job_id
    AND j.user_id = v_user_id  -- 본인 작업만
    AND j.embedding IS NOT NULL
  ORDER BY j.embedding <=> (SELECT embedding FROM jobs WHERE id = p_job_id)
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;
