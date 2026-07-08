FROM python:3.12-slim

WORKDIR /app

# System dependencies (for Presidio spaCy model & psycopg2)
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Download spaCy English model (required by Presidio NER)
RUN python -m spacy download en_core_web_lg

# Copy application source
COPY backend/ ./backend/
COPY workers/ ./workers/

# Non-root user for security
RUN adduser --disabled-password --gecos "" nimblize
USER nimblize

EXPOSE 8000 9090

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
