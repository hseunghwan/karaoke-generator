-- =====================================================
-- Migration: 00006_posts_variants.sql
-- Description: 포스트 및 다국어 영상 버전 테이블
-- =====================================================

-- posts 테이블: 커뮤니티 공유 포스트
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 소유자 및 연결된 작업
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  job_id UUID UNIQUE REFERENCES jobs(id) ON DELETE SET NULL,  -- 연결된 작업 (1:1)
  
  -- 포스트 정보
  title TEXT NOT NULL,
  description TEXT,
  
  -- 미디어 (storage_path만 저장, URL은 런타임에 Signed URL로 생성)
  thumbnail_path TEXT,
  
  -- 태그
  tags TEXT[] DEFAULT '{}',
  
  -- 통계 (비정규화, 트리거로 자동 갱신)
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  
  -- 관리자 추천
  is_featured BOOLEAN DEFAULT FALSE,
  
  -- 콘텐츠 모더레이션
  moderation_status moderation_status DEFAULT 'pending',
  moderation_note TEXT,                   -- 거부 사유 등
  
  -- AI 추천용 임베딩 (pgvector)
  embedding vector(1536),
  
  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스: 사용자별 포스트 목록
CREATE INDEX idx_posts_user ON posts(user_id);

-- 인덱스: 최신순 정렬
CREATE INDEX idx_posts_created ON posts(created_at DESC);

-- 인덱스: 인기순 정렬
CREATE INDEX idx_posts_popular ON posts(like_count DESC, created_at DESC);

-- 인덱스: 태그 검색 (GIN)
CREATE INDEX idx_posts_tags ON posts USING GIN(tags);

-- 인덱스: 모더레이션 대기 목록
CREATE INDEX idx_posts_moderation ON posts(moderation_status) WHERE moderation_status = 'pending';

-- HNSW 벡터 인덱스: AI 추천
CREATE INDEX idx_posts_embedding ON posts USING hnsw (embedding vector_cosine_ops);

-- 인덱스: 제목 퍼지 검색 (trigram)
CREATE INDEX idx_posts_title_trgm ON posts USING GIN (title gin_trgm_ops);

-- posts 테이블의 updated_at 자동 갱신
CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- video_variants 테이블: Netflix 스타일 다국어 버전 관리
CREATE TABLE video_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 포스트 연결
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  
  -- 언어
  language_code TEXT NOT NULL,            -- ISO 639-1 (ko, ja, en 등)
  
  -- 미디어 (storage_path만 저장!)
  storage_path TEXT NOT NULL,             -- Supabase Storage 경로
  subtitle_path TEXT,                     -- VTT/SRT 자막 파일 경로
  
  -- 메타데이터
  duration_seconds INTEGER,
  metadata JSONB DEFAULT '{}',            -- 해상도, 비트레이트 등
  
  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 하나의 포스트에 언어별 하나의 variant만 허용
  UNIQUE(post_id, language_code)
);

-- 인덱스: 포스트별 variant 목록
CREATE INDEX idx_variants_post ON video_variants(post_id);

-- 인덱스: 언어별 검색
CREATE INDEX idx_variants_language ON video_variants(language_code);

-- COMMENT: video_variants 사용 예시
COMMENT ON TABLE video_variants IS '
한 곡(post)에 대해 3개 언어 버전:

post: "Let It Go - Frozen OST"
├── video_variants[ko]: 한국어 자막 버전
├── video_variants[ja]: 일본어 자막 버전
└── video_variants[en]: 영어 원본 버전

사용자는 원하는 언어 버전을 선택해서 시청할 수 있습니다.
';
