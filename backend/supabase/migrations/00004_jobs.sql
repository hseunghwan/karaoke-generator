-- =====================================================
-- Migration: 00004_jobs.sql
-- Description: 작업(jobs) 테이블 - 노래방 영상 생성 작업
-- =====================================================

-- jobs 테이블: 노래방 영상 생성 작업
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 소유자 (사용자)
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- 곡 정보
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  
  -- 플랫폼 및 설정
  platform platform_type NOT NULL,
  source_language TEXT NOT NULL,        -- ISO 639-1 코드 (ko, en, ja 등)
  target_languages TEXT[] NOT NULL,     -- 번역 대상 언어 배열
  template TEXT NOT NULL,               -- 템플릿 ID (basic, premium 등)
  
  -- 미디어 소스
  is_external_media BOOLEAN DEFAULT FALSE,   -- 외부 URL인지 여부
  storage_path TEXT,                          -- Supabase Storage 경로
  
  -- 작업 상태
  status job_status DEFAULT 'pending',
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  detail TEXT,                          -- 현재 단계 설명
  
  -- 결과
  result_meta JSONB,                    -- 결과 메타데이터 (파일 크기, 해상도 등)
  error TEXT,                           -- 에러 메시지
  
  -- AI 모델 추적
  ai_model_version TEXT,                -- 사용된 AI 모델 버전
  
  -- 크레딧
  credit_cost INTEGER DEFAULT 0,        -- 소모된 크레딧
  
  -- AI 추천용 임베딩 (pgvector)
  embedding vector(1536),               -- OpenAI text-embedding-3-small 차원
  
  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- 인덱스: 사용자별 작업 목록 조회 (최신순)
CREATE INDEX idx_jobs_user_created ON jobs(user_id, created_at DESC);

-- 인덱스: 활성 작업 상태 필터링 (완료/실패 제외)
CREATE INDEX idx_jobs_status ON jobs(status) WHERE status NOT IN ('completed', 'failed');

-- 인덱스: AI 모델 버전별 조회 (일괄 재렌더링 시 필요)
CREATE INDEX idx_jobs_ai_model ON jobs(ai_model_version) WHERE ai_model_version IS NOT NULL;

-- HNSW 벡터 인덱스: 빠르고 정확한 유사도 검색
CREATE INDEX idx_jobs_embedding ON jobs USING hnsw (embedding vector_cosine_ops);

-- COMMENT: result_meta JSONB 구조 예시
COMMENT ON COLUMN jobs.result_meta IS '
{
  "file_size_bytes": 52428800,
  "duration_seconds": 240,
  "resolution": "1920x1080",
  "format": "mp4",
  "languages_generated": ["ko", "ja"],
  "ai_models": {
    "separation": "demucs-v4",
    "transcription": "whisper-large-v3",
    "translation": "gemini-1.5-pro"
  },
  "storage": {
    "bucket": "karaoke-outputs",
    "original_path": "jobs/xxx/original.mp4",
    "output_paths": {
      "ko": "jobs/xxx/output_ko.mp4",
      "ja": "jobs/xxx/output_ja.mp4"
    }
  }
}';
