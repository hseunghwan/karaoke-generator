-- =====================================================
-- Migration: 00014_storage_setup.sql
-- Description: Supabase Storage 버킷 설정 가이드
-- =====================================================

-- 주의: Storage 버킷 생성은 SQL이 아닌 Supabase Dashboard 또는 API로 수행해야 합니다.
-- 이 파일은 설정 가이드 및 RLS 정책 예시를 포함합니다.

/*
=====================================================
Storage 버킷 구성
=====================================================

1. karaoke-originals (Private)
   - 용도: 업로드된 원본 미디어 파일
   - 접근: 본인만 읽기/쓰기 가능
   - 파일 경로 규칙: {user_id}/{job_id}/original.{ext}

2. karaoke-outputs (Public/Private 혼합)
   - 용도: 변환된 결과 영상 및 썸네일
   - 접근: 
     - 공개된 포스트의 파일: 모두 읽기 가능
     - 비공개 파일: 본인만 읽기 가능
   - 파일 경로 규칙: {user_id}/{job_id}/output_{language}.{ext}

3. avatars (Public)
   - 용도: 사용자 프로필 이미지
   - 접근: 모두 읽기 가능, 본인만 쓰기 가능
   - 파일 경로 규칙: {user_id}/avatar.{ext}

=====================================================
Dashboard에서 버킷 생성 방법
=====================================================

1. Supabase Dashboard > Storage
2. "New bucket" 클릭
3. 버킷 이름 입력 (예: karaoke-originals)
4. Public/Private 설정
5. "Create bucket" 클릭

=====================================================
Storage RLS 정책 설정 (Dashboard에서)
=====================================================

karaoke-originals 버킷:
- SELECT: auth.uid()::text = (storage.foldername(name))[1]
- INSERT: auth.uid()::text = (storage.foldername(name))[1]
- UPDATE: auth.uid()::text = (storage.foldername(name))[1]
- DELETE: auth.uid()::text = (storage.foldername(name))[1]

karaoke-outputs 버킷:
- SELECT: true  (또는 승인된 포스트만 허용하는 조건)
- INSERT: auth.uid()::text = (storage.foldername(name))[1]
- UPDATE: auth.uid()::text = (storage.foldername(name))[1]
- DELETE: auth.uid()::text = (storage.foldername(name))[1]

avatars 버킷:
- SELECT: true
- INSERT: auth.uid()::text = (storage.foldername(name))[1]
- UPDATE: auth.uid()::text = (storage.foldername(name))[1]
- DELETE: auth.uid()::text = (storage.foldername(name))[1]

=====================================================
API를 통한 버킷 생성 (선택사항)
=====================================================

Supabase Admin API를 사용하여 버킷을 프로그래밍 방식으로 생성할 수 있습니다:

curl -X POST 'https://your-project-ref.supabase.co/storage/v1/bucket' \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"id": "karaoke-originals", "name": "karaoke-originals", "public": false}'

=====================================================
파일 업로드/다운로드 예시 (TypeScript)
=====================================================

// 파일 업로드
const { data, error } = await supabase.storage
  .from('karaoke-originals')
  .upload(`${userId}/${jobId}/original.mp4`, file, {
    cacheControl: '3600',
    upsert: false
  });

// Signed URL로 다운로드 (Private 버킷)
const { data: signedUrl } = await supabase.storage
  .from('karaoke-originals')
  .createSignedUrl(`${userId}/${jobId}/original.mp4`, 3600);

// Public URL로 다운로드 (Public 버킷)
const { data: publicUrl } = supabase.storage
  .from('karaoke-outputs')
  .getPublicUrl(`${userId}/${jobId}/output_ko.mp4`);

*/
