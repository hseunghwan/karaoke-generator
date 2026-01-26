#!/bin/bash

# Supabase CLI 설치 스크립트 (Linux)

set -e

echo "🚀 Supabase CLI 설치 중..."

# OS 감지
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
else
    echo "❌ OS를 감지할 수 없습니다."
    exit 1
fi

# 아키텍처 감지
ARCH=$(uname -m)
if [ "$ARCH" = "x86_64" ]; then
    ARCH="amd64"
elif [ "$ARCH" = "aarch64" ]; then
    ARCH="arm64"
else
    echo "❌ 지원하지 않는 아키텍처: $ARCH"
    exit 1
fi

# 최신 버전 다운로드 URL
VERSION="v2.72.3"
BASE_URL="https://github.com/supabase/cli/releases/download/${VERSION}"

echo "📦 OS: $OS, Architecture: $ARCH"

# 배포판별 설치
case $OS in
    ubuntu|debian)
        echo "📥 Debian/Ubuntu 패키지 다운로드 중..."
        FILE="supabase_${VERSION#v}_linux_${ARCH}.deb"
        URL="${BASE_URL}/${FILE}"
        
        if command -v curl &> /dev/null; then
            curl -L -o /tmp/supabase.deb "$URL"
        elif command -v wget &> /dev/null; then
            wget -O /tmp/supabase.deb "$URL"
        else
            echo "❌ curl 또는 wget이 필요합니다."
            exit 1
        fi
        
        echo "📦 패키지 설치 중..."
        sudo dpkg -i /tmp/supabase.deb || sudo apt-get install -f -y
        rm /tmp/supabase.deb
        ;;
        
    fedora|rhel|centos)
        echo "📥 RPM 패키지 다운로드 중..."
        FILE="supabase_${VERSION#v}_linux_${ARCH}.rpm"
        URL="${BASE_URL}/${FILE}"
        
        if command -v curl &> /dev/null; then
            curl -L -o /tmp/supabase.rpm "$URL"
        elif command -v wget &> /dev/null; then
            wget -O /tmp/supabase.rpm "$URL"
        else
            echo "❌ curl 또는 wget이 필요합니다."
            exit 1
        fi
        
        echo "📦 패키지 설치 중..."
        sudo rpm -i /tmp/supabase.rpm
        rm /tmp/supabase.rpm
        ;;
        
    *)
        echo "📥 바이너리 다운로드 중..."
        FILE="supabase_${VERSION#v}_linux_${ARCH}.tar.gz"
        URL="${BASE_URL}/${FILE}"
        
        if command -v curl &> /dev/null; then
            curl -L -o /tmp/supabase.tar.gz "$URL"
        elif command -v wget &> /dev/null; then
            wget -O /tmp/supabase.tar.gz "$URL"
        else
            echo "❌ curl 또는 wget이 필요합니다."
            exit 1
        fi
        
        echo "📦 바이너리 추출 중..."
        tar -xzf /tmp/supabase.tar.gz -C /tmp
        sudo mv /tmp/supabase /usr/local/bin/
        sudo chmod +x /usr/local/bin/supabase
        rm /tmp/supabase.tar.gz
        ;;
esac

# 설치 확인
if command -v supabase &> /dev/null; then
    echo "✅ Supabase CLI 설치 완료!"
    supabase --version
    echo ""
    echo "다음 단계:"
    echo "  1. supabase login"
    echo "  2. cd backend && supabase link --project-ref YOUR_PROJECT_REF"
    echo "  3. supabase migration up"
else
    echo "❌ 설치 실패"
    exit 1
fi
