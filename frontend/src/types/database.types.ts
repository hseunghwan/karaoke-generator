/**
 * Supabase Database Types
 * 
 * 이 파일은 Supabase CLI로 자동 생성될 수 있습니다:
 * npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.types.ts
 * 
 * 현재는 수동으로 정의된 타입입니다.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ENUM 타입 정의
export type JobStatus = 
  | 'pending'
  | 'queued'
  | 'downloading'
  | 'separating'
  | 'transcribing'
  | 'translating'
  | 'rendering'
  | 'uploading'
  | 'completed'
  | 'failed'

export type PlatformType = 'youtube' | 'tiktok' | 'shorts' | 'instagram'

export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing' | 'paused'

export type CreditTxType = 'subscription_grant' | 'purchase' | 'job_usage' | 'refund' | 'bonus'

export type ModerationStatus = 'pending' | 'approved' | 'rejected' | 'flagged'

export type NotificationType = 
  | 'like'
  | 'comment'
  | 'reply'
  | 'mention'
  | 'job_completed'
  | 'job_failed'
  | 'follow'
  | 'system'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          username: string | null
          display_name: string | null
          avatar_url: string | null
          locale: string
          timezone: string
          credits_balance: number
          stripe_customer_id: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          username?: string | null
          display_name?: string | null
          avatar_url?: string | null
          locale?: string
          timezone?: string
          credits_balance?: number
          stripe_customer_id?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          username?: string | null
          display_name?: string | null
          avatar_url?: string | null
          locale?: string
          timezone?: string
          credits_balance?: number
          stripe_customer_id?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      jobs: {
        Row: {
          id: string
          user_id: string
          title: string
          artist: string
          platform: PlatformType
          source_language: string
          target_languages: string[]
          template: string
          is_external_media: boolean
          storage_path: string | null
          status: JobStatus
          progress: number
          detail: string | null
          result_meta: Json | null
          error: string | null
          ai_model_version: string | null
          credit_cost: number
          embedding: number[] | null
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          artist: string
          platform: PlatformType
          source_language: string
          target_languages: string[]
          template: string
          is_external_media?: boolean
          storage_path?: string | null
          status?: JobStatus
          progress?: number
          detail?: string | null
          result_meta?: Json | null
          error?: string | null
          ai_model_version?: string | null
          credit_cost?: number
          embedding?: number[] | null
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          artist?: string
          platform?: PlatformType
          source_language?: string
          target_languages?: string[]
          template?: string
          is_external_media?: boolean
          storage_path?: string | null
          status?: JobStatus
          progress?: number
          detail?: string | null
          result_meta?: Json | null
          error?: string | null
          ai_model_version?: string | null
          credit_cost?: number
          embedding?: number[] | null
          created_at?: string
          completed_at?: string | null
        }
      }
      posts: {
        Row: {
          id: string
          user_id: string
          job_id: string | null
          title: string
          description: string | null
          thumbnail_path: string | null
          tags: string[]
          view_count: number
          like_count: number
          comment_count: number
          is_featured: boolean
          moderation_status: ModerationStatus
          moderation_note: string | null
          embedding: number[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          job_id?: string | null
          title: string
          description?: string | null
          thumbnail_path?: string | null
          tags?: string[]
          view_count?: number
          like_count?: number
          comment_count?: number
          is_featured?: boolean
          moderation_status?: ModerationStatus
          moderation_note?: string | null
          embedding?: number[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          job_id?: string | null
          title?: string
          description?: string | null
          thumbnail_path?: string | null
          tags?: string[]
          view_count?: number
          like_count?: number
          comment_count?: number
          is_featured?: boolean
          moderation_status?: ModerationStatus
          moderation_note?: string | null
          embedding?: number[] | null
          created_at?: string
          updated_at?: string
        }
      }
      video_variants: {
        Row: {
          id: string
          post_id: string
          language_code: string
          storage_path: string
          subtitle_path: string | null
          duration_seconds: number | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          language_code: string
          storage_path: string
          subtitle_path?: string | null
          duration_seconds?: number | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          language_code?: string
          storage_path?: string
          subtitle_path?: string | null
          duration_seconds?: number | null
          metadata?: Json
          created_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          post_id: string
          user_id: string
          parent_id: string | null
          content: string
          like_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          parent_id?: string | null
          content: string
          like_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          parent_id?: string | null
          content?: string
          like_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      likes: {
        Row: {
          id: string
          user_id: string
          post_id: string | null
          comment_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          post_id?: string | null
          comment_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          post_id?: string | null
          comment_id?: string | null
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          actor_id: string | null
          type: NotificationType
          target_id: string | null
          target_type: string | null
          data: Json
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          actor_id?: string | null
          type: NotificationType
          target_id?: string | null
          target_type?: string | null
          data?: Json
          read_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          actor_id?: string | null
          type?: NotificationType
          target_id?: string | null
          target_type?: string | null
          data?: Json
          read_at?: string | null
          created_at?: string
        }
      }
      plans: {
        Row: {
          id: string
          name: string
          credits_per_month: number
          price_cents: number
          features: Json
          allowed_templates: string[]
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          credits_per_month: number
          price_cents: number
          features?: Json
          allowed_templates?: string[]
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          credits_per_month?: number
          price_cents?: number
          features?: Json
          allowed_templates?: string[]
          is_active?: boolean
          created_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          plan_id: string
          status: SubscriptionStatus
          stripe_subscription_id: string | null
          stripe_customer_id: string | null
          current_period_start: string | null
          current_period_end: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan_id: string
          status?: SubscriptionStatus
          stripe_subscription_id?: string | null
          stripe_customer_id?: string | null
          current_period_start?: string | null
          current_period_end?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plan_id?: string
          status?: SubscriptionStatus
          stripe_subscription_id?: string | null
          stripe_customer_id?: string | null
          current_period_start?: string | null
          current_period_end?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      credit_transactions: {
        Row: {
          id: string
          user_id: string
          parent_transaction_id: string | null
          amount: number
          balance_after: number
          type: CreditTxType
          reference_id: string | null
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          parent_transaction_id?: string | null
          amount: number
          balance_after: number
          type: CreditTxType
          reference_id?: string | null
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          parent_transaction_id?: string | null
          amount?: number
          balance_after?: number
          type?: CreditTxType
          reference_id?: string | null
          description?: string | null
          created_at?: string
        }
      }
      api_keys: {
        Row: {
          id: string
          user_id: string
          name: string
          key_hash: string
          key_prefix: string
          scopes: string[]
          last_used_at: string | null
          expires_at: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          key_hash: string
          key_prefix: string
          scopes?: string[]
          last_used_at?: string | null
          expires_at?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          key_hash?: string
          key_prefix?: string
          scopes?: string[]
          last_used_at?: string | null
          expires_at?: string | null
          is_active?: boolean
          created_at?: string
        }
      }
    }
    Functions: {
      deduct_credits: {
        Args: {
          p_user_id: string
          p_amount: number
          p_reference_id?: string
          p_description?: string
        }
        Returns: number | null
      }
      add_credits: {
        Args: {
          p_user_id: string
          p_amount: number
          p_type: CreditTxType
          p_reference_id?: string
          p_description?: string
        }
        Returns: number
      }
      refund_credits: {
        Args: {
          p_original_transaction_id: string
          p_description?: string
        }
        Returns: number
      }
      calculate_credit_cost: {
        Args: {
          p_duration_seconds: number
          p_target_languages: string[]
          p_platform: PlatformType
        }
        Returns: number
      }
      get_credits_balance: {
        Args: {
          p_user_id: string
        }
        Returns: number
      }
      get_similar_posts: {
        Args: {
          p_post_id: string
          p_limit?: number
        }
        Returns: {
          id: string
          title: string
          thumbnail_path: string | null
          similarity: number
        }[]
      }
      semantic_search: {
        Args: {
          p_query_embedding: number[]
          p_limit?: number
          p_threshold?: number
        }
        Returns: {
          id: string
          title: string
          description: string | null
          thumbnail_path: string | null
          similarity: number
        }[]
      }
      get_recommended_posts: {
        Args: {
          p_user_id: string
          p_limit?: number
        }
        Returns: {
          id: string
          title: string
          thumbnail_path: string | null
          score: number
        }[]
      }
      get_trending_posts: {
        Args: {
          p_limit?: number
          p_days?: number
        }
        Returns: {
          id: string
          title: string
          thumbnail_path: string | null
          like_count: number
          view_count: number
          trending_score: number
        }[]
      }
      get_user_stats: {
        Args: {
          p_user_id: string
        }
        Returns: {
          total_jobs: number
          completed_jobs: number
          total_posts: number
          total_likes_received: number
          total_comments_received: number
          credits_used_this_month: number
        }
      }
    }
  }
}
