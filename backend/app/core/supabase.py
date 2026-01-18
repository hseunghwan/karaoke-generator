"""
Supabase 클라이언트 모듈

Supabase Python SDK를 사용하여 데이터베이스, 인증, 스토리지에 접근합니다.
서버 사이드에서는 Service Key를 사용하여 RLS를 우회할 수 있습니다.
"""
from typing import Optional
from functools import lru_cache

from supabase import create_client, Client
from .config import settings


@lru_cache()
def get_supabase_client() -> Optional[Client]:
    """
    Supabase 클라이언트 인스턴스를 반환합니다.
    anon key를 사용하여 RLS 정책이 적용됩니다.
    """
    if not settings.SUPABASE_URL or not settings.SUPABASE_ANON_KEY:
        return None
    
    return create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_ANON_KEY
    )


@lru_cache()
def get_supabase_admin_client() -> Optional[Client]:
    """
    Supabase Admin 클라이언트 인스턴스를 반환합니다.
    service_role key를 사용하여 RLS를 우회합니다.
    주의: 서버 사이드에서만 사용해야 합니다.
    """
    if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_KEY:
        return None
    
    return create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_SERVICE_KEY
    )


# 편의를 위한 기본 클라이언트 인스턴스
supabase = get_supabase_client()
supabase_admin = get_supabase_admin_client()
