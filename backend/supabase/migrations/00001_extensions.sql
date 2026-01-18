-- =====================================================
-- Migration: 00001_extensions.sql
-- Description: PostgreSQL 확장 활성화
-- =====================================================

-- pgvector: AI 임베딩 벡터 저장 및 유사도 검색
-- HNSW 인덱스를 사용하여 빠르고 정확한 벡터 검색 지원
CREATE EXTENSION IF NOT EXISTS vector;

-- pg_trgm: 텍스트 유사도 검색 (trigram 기반)
-- 퍼지 검색 및 다국어 텍스트 검색의 fallback으로 사용
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- uuid-ossp: UUID 생성 (gen_random_uuid의 대안)
-- Supabase는 기본적으로 활성화되어 있지만 명시적으로 포함
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
