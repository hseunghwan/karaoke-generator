/**
 * Edge Function: get-video-url
 * 
 * Storage 경로를 받아 Signed URL을 생성하여 반환합니다.
 * Private 버킷의 파일에 임시 접근 권한을 부여합니다.
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // CORS preflight 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { storage_path, bucket = 'karaoke-outputs', expires_in = 3600 } = await req.json()

    if (!storage_path) {
      return new Response(
        JSON.stringify({ error: 'storage_path is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Supabase Admin 클라이언트 생성 (Service Role Key 사용)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Signed URL 생성 (기본 1시간, 최대 7일)
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(storage_path, Math.min(expires_in, 604800))  // 최대 7일

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ 
        url: data.signedUrl,
        expires_at: new Date(Date.now() + expires_in * 1000).toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
