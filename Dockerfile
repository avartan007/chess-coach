# ── Chess Coach backend ───────────────────────────────────────────────────────
# FastAPI + Stockfish. Used by Render (Docker runtime), see render.yaml.
# The frontend is built and served separately by Vercel.
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    STOCKFISH_PATH=/usr/games/stockfish

# Stockfish is not pip-installable; install the distro binary.
RUN apt-get update \
 && apt-get install -y --no-install-recommends stockfish \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY main.py ./

EXPOSE 8000

# Render injects $PORT. --proxy-headers makes request.client.host the real
# visitor IP (otherwise the rate limiter would see Render's proxy IP).
CMD uvicorn main:app --host 0.0.0.0 --port "${PORT:-8000}" \
    --proxy-headers --forwarded-allow-ips='*'
