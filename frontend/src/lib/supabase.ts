/**
 * Supabase 클라이언트 모듈 (Frontend)
 * 
 * 브라우저에서 Supabase에 접근하기 위한 클라이언트입니다.
 * publishable key를 사용하여 RLS 정책이 적용됩니다.
 * 
 * API 키 타입:
 * - Publishable Key (sb_publishable_...): 클라이언트용, 공개 가능
 * - Secret Key (sb_secret_...): 서버 전용, 절대 프론트엔드에서 사용 금지
 */
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

// 환경 변수 검증
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error('Missing Supabase environment variables')
}

// Supabase 클라이언트 생성
export const supabase = createClient<Database>(supabaseUrl, supabasePublishableKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

/**
 * Storage Signed URL 생성 (Edge Function 호출)
 * Private 버킷의 파일에 임시 접근 URL을 생성합니다.
 */
export async function getSignedUrl(
  storagePath: string,
  bucket: string = 'karaoke-outputs',
  expiresIn: number = 3600
): Promise<string | null> {
  try {
    const { data, error } = await supabase.functions.invoke('get-video-url', {
      body: { storage_path: storagePath, bucket, expires_in: expiresIn },
    })

    if (error) {
      console.error('Failed to get signed URL:', error)
      return null
    }

    return data.url
  } catch (err) {
    console.error('Error getting signed URL:', err)
    return null
  }
}

/**
 * Public URL 생성 (Public 버킷용)
 */
export function getPublicUrl(storagePath: string, bucket: string = 'karaoke-outputs'): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath)
  return data.publicUrl
}

/**
 * 파일 업로드
 */
export async function uploadFile(
  bucket: string,
  path: string,
  file: File,
  options?: { cacheControl?: string; upsert?: boolean }
) {
  const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: options?.cacheControl ?? '3600',
    upsert: options?.upsert ?? false,
  })

  if (error) {
    throw error
  }

  return data
}

/**
 * Realtime 채널 구독 헬퍼
 */
export function subscribeToJobUpdates(
  userId: string,
  callback: (payload: any) => void
) {
  return supabase
    .channel('job-updates')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'jobs',
        filter: `user_id=eq.${userId}`,
      },
      callback
    )
    .subscribe()
}

export function subscribeToNotifications(
  userId: string,
  callback: (payload: any) => void
) {
  return supabase
    .channel('notifications')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      callback
    )
    .subscribe()
}

/**
 * 시맨틱 검색 (Edge Function 호출)
 */
export async function semanticSearch(query: string, limit: number = 20) {
  try {
    // 먼저 쿼리를 임베딩으로 변환
    const { data: embeddingData, error: embeddingError } = await supabase.functions.invoke(
      'generate-embedding',
      { body: { text: query } }
    )

    if (embeddingError || !embeddingData?.embedding) {
      throw new Error('Failed to generate embedding')
    }

    // 시맨틱 검색 RPC 호출
    const { data, error } = await supabase.rpc('semantic_search', {
      p_query_embedding: embeddingData.embedding,
      p_limit: limit,
      p_threshold: 0.3,
    })

    if (error) {
      throw error
    }

    return data
  } catch (err) {
    console.error('Semantic search error:', err)
    return []
  }
}

/**
 * 크레딧 잔액 조회
 */
export async function getCreditsBalance(): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0

  const { data, error } = await supabase.rpc('get_credits_balance', {
    p_user_id: user.id,
  })

  if (error) {
    console.error('Failed to get credits balance:', error)
    return 0
  }

  return data ?? 0
}

export default supabase
