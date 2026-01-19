/**
 * Edge Function: generate-embedding
 *
 * 텍스트를 받아 Cohere 임베딩을 생성합니다. (다국어 지원 우수)
 * 포스트 생성 시 자동으로 호출되거나, 검색 쿼리에 사용됩니다.
 *
 * 모델: embed-multilingual-v3.0 (1024 차원)
 * - 100+ 언어 지원, 한/일/중 성능 우수
 * - 크로스링구얼 검색 지원 (한국어로 검색 → 일본어 결과)
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

    // Cohere Embed API 호출 (다국어 지원)
    const cohereResponse = await fetch('https://api.cohere.ai/v1/embed', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('COHERE_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        texts: [text.slice(0, 8000)],  // 최대 8000자
        model: 'embed-multilingual-v3.0',
        input_type: 'search_document',  // 문서 저장 시 'search_document', 검색 쿼리 시 'search_query'
        truncate: 'END',
      }),
    })

    if (!cohereResponse.ok) {
      const error = await cohereResponse.text()
      throw new Error(`Cohere API error: ${error}`)
    }

    const data = await cohereResponse.json()
    const embedding = data.embeddings[0]

    // [참고] 기존 OpenAI API 호출 코드 (주석 처리)
    // const openaiResponse = await fetch('https://api.openai.com/v1/embeddings', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     model: 'text-embedding-3-small',
    //     input: text.slice(0, 8000),
    //   }),
    // })
    // if (!openaiResponse.ok) {
    //   const error = await openaiResponse.text()
    //   throw new Error(`OpenAI API error: ${error}`)
    // }
    // const data = await openaiResponse.json()
    // const embedding = data.data[0].embedding

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
