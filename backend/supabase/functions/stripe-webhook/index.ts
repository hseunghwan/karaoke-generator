/**
 * Edge Function: stripe-webhook
 * 
 * Stripe Webhook 이벤트를 처리합니다.
 * - 구독 생성/갱신/취소
 * - 크레딧 지급
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@13.10.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return new Response('No signature', { status: 400 })
  }

  try {
    const body = await req.text()
    const event = stripe.webhooks.constructEvent(body, signature, endpointSecret)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string
        const status = subscription.status

        // 사용자 조회
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (!profile) {
          console.error('Profile not found for customer:', customerId)
          break
        }

        // Stripe Price ID로 플랜 조회
        const priceId = subscription.items.data[0]?.price.id
        const { data: plan } = await supabase
          .from('plans')
          .select('id, credits_per_month')
          .eq('stripe_price_id', priceId)
          .single()

        if (!plan) {
          console.error('Plan not found for price:', priceId)
          break
        }

        // 구독 정보 업데이트/생성
        const subscriptionData = {
          user_id: profile.id,
          plan_id: plan.id,
          status: status === 'active' ? 'active' : 
                  status === 'canceled' ? 'canceled' :
                  status === 'past_due' ? 'past_due' :
                  status === 'trialing' ? 'trialing' : 'paused',
          stripe_subscription_id: subscription.id,
          stripe_customer_id: customerId,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        }

        const { error: upsertError } = await supabase
          .from('subscriptions')
          .upsert(subscriptionData, { onConflict: 'user_id' })

        if (upsertError) {
          console.error('Failed to upsert subscription:', upsertError)
        }

        // 구독 생성/갱신 시 크레딧 지급 (첫 결제 또는 갱신)
        if (status === 'active' && event.type === 'customer.subscription.updated') {
          const previousPeriodStart = event.data.previous_attributes?.current_period_start
          if (previousPeriodStart) {
            // 결제 주기가 갱신됨 = 크레딧 지급
            await supabase.rpc('add_credits', {
              p_user_id: profile.id,
              p_amount: plan.credits_per_month,
              p_type: 'subscription_grant',
              p_reference_id: subscription.id,
              p_description: `월간 구독 크레딧 지급 (${plan.credits_per_month} credits)`
            })
          }
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (profile) {
          await supabase
            .from('subscriptions')
            .update({ status: 'canceled' })
            .eq('user_id', profile.id)
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (profile) {
          await supabase
            .from('subscriptions')
            .update({ status: 'past_due' })
            .eq('user_id', profile.id)
        }
        break
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Webhook error:', err)
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }
})
