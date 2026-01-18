"""
Supabase 클라이언트 모듈

Supabase Python SDK를 사용하여 데이터베이스, 인증, 스토리지에 접근합니다.
서버 사이드에서는 Secret Key를 사용하여 RLS를 우회할 수 있습니다.

API 키 타입:
- Publishable Key (sb_publishable_...): 클라이언트용, RLS 정책 적용
- Secret Key (sb_secret_...): 서버 전용, RLS 우회 (절대 공개 금지)
"""
from typing import Optional
from functools import lru_cache

from supabase import create_client, Client
from .config import settings


@lru_cache()
def get_supabase_client() -> Optional[Client]:
    """
    Supabase 클라이언트 인스턴스를 반환합니다.
    publishable key를 사용하여 RLS 정책이 적용됩니다.
    """
    if not settings.SUPABASE_URL or not settings.SUPABASE_PUBLISHABLE_KEY:
        return None
    
    return create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_PUBLISHABLE_KEY
    )


@lru_cache()
def get_supabase_admin_client() -> Optional[Client]:
    """
    Supabase Admin 클라이언트 인스턴스를 반환합니다.
    secret key를 사용하여 RLS를 우회합니다.
    주의: 서버 사이드에서만 사용해야 합니다. 절대 공개하지 마세요.
    """
    if not settings.SUPABASE_URL or not settings.SUPABASE_SECRET_KEY:
        return None
    
    return create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_SECRET_KEY
    )


# 편의를 위한 기본 클라이언트 인스턴스
supabase = get_supabase_client()
supabase_admin = get_supabase_admin_client()
