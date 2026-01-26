#!/bin/bash

# Supabase 프로젝트 자동 연결 스크립트
# backend/.env 파일의 SUPABASE_URL을 읽어서 project-ref를 추출하고 연결합니다.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$BACKEND_DIR/.env"

echo "🔗 Supabase 프로젝트 연결 중..."

# .env 파일 존재 확인
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ .env 파일을 찾을 수 없습니다: $ENV_FILE"
    echo "   먼저 backend/.env 파일을 생성하고 SUPABASE_URL을 설정하세요."
    exit 1
fi

# SUPABASE_URL 읽기
SUPABASE_URL=$(grep "^SUPABASE_URL=" "$ENV_FILE" | cut -d '=' -f2 | tr -d '"' | tr -d "'" | xargs)

if [ -z "$SUPABASE_URL" ]; then
    echo "❌ .env 파일에서 SUPABASE_URL을 찾을 수 없습니다."
    echo "   backend/.env 파일에 SUPABASE_URL=https://xxxxx.supabase.co 형식으로 설정하세요."
    exit 1
fi

echo "📋 SUPABASE_URL: $SUPABASE_URL"

# Project Reference ID 추출
# URL 형식: https://xxxxx.supabase.co
PROJECT_REF=$(echo "$SUPABASE_URL" | sed -E 's|https?://([^.]+)\.supabase\.co.*|\1|')

if [ -z "$PROJECT_REF" ] || [ "$PROJECT_REF" = "$SUPABASE_URL" ]; then
    echo "❌ SUPABASE_URL에서 Project Reference ID를 추출할 수 없습니다."
    echo "   URL 형식이 올바른지 확인하세요: https://xxxxx.supabase.co"
    exit 1
fi

echo "✅ Project Reference ID: $PROJECT_REF"

# Supabase CLI 설치 확인
if ! command -v supabase &> /dev/null; then
    echo "⚠️  Supabase CLI가 설치되어 있지 않습니다."
    echo "   설치 스크립트를 실행하세요:"
    echo "   cd backend/supabase && ./install-cli.sh"
    exit 1
fi

# Supabase 로그인 확인
if ! supabase projects list &> /dev/null; then
    echo "🔐 Supabase CLI에 로그인이 필요합니다."
    echo "   다음 명령어를 실행하세요: supabase login"
    exit 1
fi

# 프로젝트 연결
echo "🔗 프로젝트 연결 중..."
cd "$SCRIPT_DIR"
supabase link --project-ref "$PROJECT_REF"

echo ""
echo "✅ 프로젝트 연결 완료!"
echo ""
echo "다음 단계:"
echo "  supabase db push    # 마이그레이션 실행"
echo "  supabase functions deploy  # Edge Functions 배포"
