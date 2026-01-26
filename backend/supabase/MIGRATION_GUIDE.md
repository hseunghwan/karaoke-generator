# Supabase 마이그레이션 실행 가이드

## Supabase CLI 없이 마이그레이션 실행하기

### 방법 1: Supabase Dashboard SQL Editor 사용 (권장)

1. **Supabase Dashboard 접속**
   - https://app.supabase.com 접속
   - 프로젝트 선택

2. **SQL Editor 열기**
   - 좌측 메뉴에서 "SQL Editor" 클릭
   - "New query" 클릭

3. **마이그레이션 파일 내용 복사 & 실행**
   ```sql
   -- 00015_profiles_insert_policy.sql 내용
   CREATE POLICY "Users can insert own profile"
     ON profiles FOR INSERT
     WITH CHECK (auth.uid() = id);
   ```

4. **실행**
   - "Run" 버튼 클릭 또는 `Ctrl+Enter` (Windows/Linux) / `Cmd+Enter` (Mac)

### 방법 2: Supabase CLI 설치 후 실행

#### Linux 설치 방법

**Ubuntu/Debian:**
```bash
# 최신 버전 다운로드 및 설치
wget https://github.com/supabase/cli/releases/latest/download/supabase_linux_amd64.deb
sudo dpkg -i supabase_linux_amd64.deb

# 또는 특정 버전
wget https://github.com/supabase/cli/releases/download/v2.72.3/supabase_2.72.3_linux_amd64.deb
sudo dpkg -i supabase_2.72.3_linux_amd64.deb
```

**Fedora/RHEL/CentOS:**
```bash
wget https://github.com/supabase/cli/releases/latest/download/supabase_linux_amd64.rpm
sudo rpm -i supabase_linux_amd64.rpm
```

**바이너리 직접 다운로드 (모든 Linux 배포판):**
```bash
# 바이너리 다운로드
wget https://github.com/supabase/cli/releases/latest/download/supabase_linux_amd64.tar.gz
tar -xzf supabase_linux_amd64.tar.gz
sudo mv supabase /usr/local/bin/
sudo chmod +x /usr/local/bin/supabase

# 설치 확인
supabase --version
```

**npx 사용 (임시 실행, 설치 불필요):**
```bash
# npx로 직접 실행 (매번 다운로드됨)
npx supabase@latest migration up
```

#### 사용 방법

```bash
# 로그인
supabase login

# 프로젝트 링크 (backend 디렉토리에서)
cd backend
supabase link --project-ref your-project-ref

# 마이그레이션 실행
supabase migration up

# 마이그레이션 상태 확인
supabase migration list
```

### 방법 3: psql 직접 연결 (고급)

```bash
# Supabase Dashboard > Settings > Database > Connection string에서 연결 정보 확인
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# 마이그레이션 파일 실행
\i backend/supabase/migrations/00015_profiles_insert_policy.sql
```

## 현재 필요한 마이그레이션

### 00015_profiles_insert_policy.sql
프로필이 없을 때 클라이언트에서 자동 생성할 수 있도록 INSERT 정책 추가

```sql
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
```

## 트리거 확인

프로필 자동 생성 트리거가 제대로 작동하는지 확인:

```sql
-- 트리거 확인
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- 트리거 함수 확인
SELECT * FROM pg_proc WHERE proname = 'handle_new_user';
```

트리거가 없으면 `00003_profiles.sql`의 트리거 생성 부분을 다시 실행하세요.
