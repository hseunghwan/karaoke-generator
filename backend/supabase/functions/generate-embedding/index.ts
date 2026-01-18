/**
 * Edge Function: generate-embedding
 *
 * 텍스트를 받아 OpenAI 임베딩을 생성합니다.
 * 포스트 생성 시 자동으로 호출되거나, 검색 쿼리에 사용됩니다.
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
    const { text, target_table, target_id } = await req.json()

    if (!text) {
      return new Response(
        JSON.stringify({ error: 'text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // OpenAI API 호출
    const openaiResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text.slice(0, 8000),  // 최대 8000자
      }),
    })

    if (!openaiResponse.ok) {
      const error = await openaiResponse.text()
      throw new Error(`OpenAI API error: ${error}`)
    }

    const data = await openaiResponse.json()
    const embedding = data.data[0].embedding

    // target_table과 target_id가 제공되면 DB 업데이트
    if (target_table && target_id) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      )

      // 지원하는 테이블 확인
      if (!['posts', 'jobs'].includes(target_table)) {
        return new Response(
          JSON.stringify({ error: 'Invalid target_table. Supported: posts, jobs' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // pgvector 형식으로 변환하여 저장
      const embeddingStr = `[${embedding.join(',')}]`

      const { error: updateError } = await supabase
        .from(target_table)
        .update({ embedding: embeddingStr })
        .eq('id', target_id)

      if (updateError) {
        throw new Error(`Failed to update ${target_table}: ${updateError.message}`)
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: `Embedding saved to ${target_table}`,
          dimensions: embedding.length
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // target_table/target_id 없으면 임베딩만 반환 (검색용)
    return new Response(
      JSON.stringify({
        embedding,
        dimensions: embedding.length
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
