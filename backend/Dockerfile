FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    git \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
# requirements.txt가 변경되지 않으면 Docker 레이어 캐시 사용
COPY requirements.txt .
RUN pip install -r requirements.txt

# Copy app code
COPY . .

# Create temp directory
RUN mkdir -p /tmp/karaoke-gen

# Expose port
EXPOSE 8000

# Default command (can be overridden for worker)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
