# Karaoke Generator AI Engine (Backend)

이 프로젝트의 백엔드는 고성능 AI 오디오 처리와 영상 렌더링을 담당하는 **비동기 이벤트 구동 시스템**입니다. FastAPI를 제어 계층(Control Plane)으로, Celery와 Python ML 라이브러리를 데이터 계층(Data Plane)으로 사용합니다.

## 🏗 시스템 아키텍처

아래 다이어그램은 프론트엔드 요청부터 AI 처리, 최종 영상 생성까지의 데이터 흐름을 보여줍니다.

```mermaid
graph TD
    %% Nodes
    Client[Next.js Frontend]

    subgraph "Control Plane (API)"
        API[FastAPI Server]
        Auth[Auth Middleware]
    end

    Broker[Redis Message Broker]

    subgraph "Data Plane (AI Workers)"
        Worker[Celery Worker Group]

        subgraph "AI Pipeline"
            Demucs["HTDemucs v4<br/>(Source Separation)"]
            Whisper["WhisperX<br/>(Forced Alignment)"]
            LLM["Google Gemini<br/>(Translation & Lyrics)"]
            FFmpeg["FFmpeg<br/>(Video Rendering)"]
        end
    end

    Storage[("S3 / Cloudflare R2<br/>Object Storage")]
    DB[("PostgreSQL<br/>Metadata DB")]

    %% Flows
    Client -->|1. Upload & Create Job| API
    API -->|2. Validate & Enqueue| Broker
    Broker -->|3. Dispatch Task| Worker

    Worker -->|4. Download Source| Storage

    %% Pipeline Logic
    Worker -->|Step A| Demucs
    Demucs -->|Vocals/Inst Files| Storage

    Worker -->|Step B| Whisper
    Whisper -->|Sync Data (JSON)| Storage

    Worker -->|Step C| LLM
    LLM -->|Translated Lyrics| Worker

    Worker -->|Step D| FFmpeg
    FFmpeg -->|Final MP4| Storage

    %% Status Updates
    Worker -.->|Update Status| DB
    API -.->|Poll Status| DB

    %% Styles
    classDef ai fill:#f9f,stroke:#333,stroke-width:2px;
    classDef storage fill:#ff9,stroke:#333,stroke-width:2px;
    class Demucs,Whisper,LLM,FFmpeg ai;
    class Storage,DB,Broker storage;
```

## 🧩 주요 컴포넌트

### 1. Control Plane (`app/main.py`)
- **FastAPI**: REST API 엔드포인트 제공.
- **역할**:
  - 사용자 요청 수신 및 유효성 검사.
  - 작업을 Redis 큐에 적재(Publish).
  - 작업 상태 조회 및 결과 반환.

### 2. Message Broker
- **Redis**: 고성능 인메모리 데이터 저장소.
- **역할**: API 서버와 워커 간의 느슨한 결합(Decoupling)을 보장하며, 작업 대기열을 관리합니다.

### 3. Data Plane (`app/worker/`)
- **Celery**: 분산 작업 큐 시스템.
- **AI Pipelines**:
  - **Audio Separation**: `demucs`를 사용하여 보컬과 반주(MR) 분리.
  - **Transcription**: `whisperX`를 사용하여 가사 추출 및 음소 단위 정밀 싱크(Alignment).
  - **Linguistics**: LLM을 통한 다국어 번역 및 발음(Romanization) 변환.
  - **Synthesis**: `ffmpeg`를 사용하여 영상, 오디오, 자막(.ass) 합성.

## 🚀 실행 방법

### 요구 사항
- Docker & Docker Compose
- Python 3.10+ (로컬 개발 시)

### 서비스 실행
```bash
# 전체 서비스 실행 (API + Redis + Worker)
docker-compose up --build

# 백그라운드 실행
docker-compose up -d
```

### API 문서
서버가 실행되면 다음 주소에서 Swagger UI를 확인할 수 있습니다:
- http://localhost:8000/docs
