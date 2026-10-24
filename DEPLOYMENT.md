# Chess Coach OS — Production Deployment Guide

Production uses two managed services:

| Piece | Platform | Why |
| --- | --- | --- |
| React/Vite frontend | **Vercel** (static site) | Fast global CDN, zero-config Vite builds |
| FastAPI + Stockfish backend | **Render** (Docker web service) | Needs a real `stockfish` binary and requests that can run for minutes |

> **Do not deploy the backend to Vercel Functions.** Vercel's Python runtime cannot install
> Stockfish system packages, and `/analyze` runs Stockfish synchronously, which can take several
> minutes for 10 games (Hobby functions time out at ~60s, Pro at ~300s). Vercel is only used for the
> static frontend.

```
Browser ──> https://<app>.vercel.app   (static React bundle, built with VITE_API_URL)
                │
                └── fetch POST /analyze (CORS) ──> https://<api>.onrender.com  (FastAPI + Stockfish)
```

---

## 1. Backend on Render (Docker + Stockfish)

The repo ships a `Dockerfile` that installs Stockfish from Debian (`/usr/games/stockfish`) and starts
Uvicorn on Render's `$PORT`, and a `render.yaml` Blueprint.

### Option A — Blueprint (recommended)

1. Push this repo to GitHub.
2. In [Render](https://render.com) click **New → Blueprint**, select the repo.
3. Render reads `render.yaml` and creates the `chess-coach-api` web service.
4. When prompted, set `ALLOWED_ORIGINS` to your Vercel URL (comma-separate multiple origins), e.g.
   `https://chess-coach.vercel.app`.
5. Deploy, then copy the service URL (`https://chess-coach-api.onrender.com`).

### Option B — Manual

1. **New → Web Service** → connect the repo.
2. **Language:** Docker, **Dockerfile Path:** `./Dockerfile`, **Plan:** Free (or higher).
3. Add environment variables:

   | Key | Value |
   | --- | --- |
   | `ENVIRONMENT` | `production` |
   | `STOCKFISH_PATH` | `/usr/games/stockfish` |
   | `ALLOWED_ORIGINS` | `https://<your-app>.vercel.app` |
   | `PORT` | leave unset — Render injects it |

4. **Health Check Path:** `/health`.
5. Deploy.

`ENVIRONMENT=production` turns on fail-fast startup checks: the app refuses to boot without an
explicit `ALLOWED_ORIGINS` (no `*`) and a working Stockfish binary.

### How Stockfish is installed (no runtime download)

Stockfish is **not** downloaded when someone clicks Analyze. It is installed once, when Render
builds the Docker image:

1. Render runs `docker build`. The `Dockerfile` starts from `python:3.11-slim`.
2. `apt-get install stockfish` pulls the Debian package from the Debian mirrors and unpacks the
   binary to `/usr/games/stockfish` inside the image layer (a few MB).
3. That layer is baked into the image. Every container Render starts from it already has the binary
   on disk, at no network cost.
4. `STOCKFISH_PATH=/usr/games/stockfish` tells `main.py` where it lives. On each `/analyze` request
   the app runs `chess.engine.SimpleEngine.popen_uci(...)`, which spawns the local binary as a child
   process and talks UCI over stdin/stdout. It is shut down when the request finishes.

So "downloading" happens only at deploy/build time, never per user or per request. The free Render
plan keeps the built image; a restart does not re-download it, only a new deploy rebuilds the image.

If you ever deploy without Docker (Render's native Python runtime), the checked-in `nixpacks.toml`
does the equivalent: `nixPkgs = ["python310", "stockfish"]` makes Nix fetch Stockfish into the
build's Nix store. Docker is the recommended path because the binary path is predictable.

### Verify the backend

```bash
curl https://<your-api>.onrender.com/health
# {"status":"ok","details":{"env":"production","stockfish_available":true}}
```

You can also open a Render Shell on the service and run `stockfish --version`.

### Environment variables reference

| Variable | Required in prod | Notes |
| --- | --- | --- |
| `ENVIRONMENT` | yes | `production` enforces CORS + Stockfish checks |
| `ALLOWED_ORIGINS` | yes | Comma-separated, no `*`; must include the Vercel origin |
| `STOCKFISH_PATH` | recommended | `/usr/games/stockfish` in the Docker image; auto-detected via `PATH` otherwise |
| `PORT` | no | Injected by Render |

---

## 2. Frontend on Vercel

1. In [Vercel](https://vercel.com) click **Add New → Project** and import the same repo.
2. Configure:
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Add an environment variable (Production *and* Preview):

   ```env
   VITE_API_URL=https://<your-api>.onrender.com
   ```

   No trailing slash. `VITE_*` values are inlined at **build time**, so changing this requires a
   redeploy (not just a restart).
4. **Deploy**.

`frontend/vercel.json` holds this build config plus security headers (CSP, `X-Frame-Options`,
immutable caching for `/assets/*`). Vercel only reads it when the project's **Root Directory** is
`frontend`. Its `connect-src` allows `https://*.onrender.com`; if you put a custom domain in front of
Render, add that origin to the CSP there.

If `VITE_API_URL` is missing, the app calls `/analyze` on the Vercel domain, which returns 404.
`frontend/.env.example` documents the variable for local builds.

### CORS round-trip

Set `ALLOWED_ORIGINS` on Render to the exact Vercel origin(s). For preview deployments either add
each preview URL or use a stable production domain. Mismatched scheme/host fails the browser
preflight.

---

## 3. Optional: single-service deployment on Render

`main.py` serves `frontend/dist/` when it exists, so you can skip Vercel entirely:

```bash
cd frontend && npm run build && cd ..
# Dockerfile would need to copy frontend/dist (see note below)
```

Then deploy one Render service with `ENVIRONMENT=production`, `ALLOWED_ORIGINS=https://<same-service>.onrender.com`,
and build the frontend in the Dockerfile (add a Node stage). This avoids CORS but loses Vercel's CDN.

---

## 4. Local production dry run

```bash
# Backend exactly as Render runs it
docker build -t chess-coach-api .
docker run --rm -p 8000:8000 \
  -e ENVIRONMENT=production \
  -e ALLOWED_ORIGINS=http://localhost:5173 \
  -e STOCKFISH_PATH=/usr/games/stockfish \
  chess-coach-api

# Frontend against that backend
cd frontend
VITE_API_URL=http://localhost:8000 npm run build
npm run preview
```

Or without Docker:

```bash
export ENVIRONMENT=production
export ALLOWED_ORIGINS=http://localhost:5173
export STOCKFISH_PATH=/opt/homebrew/bin/stockfish   # your local binary
uvicorn main:app --port 8000 --host 127.0.0.1
```

---

## 5. Operational notes

- **Long requests on Render.** Render allows HTTP responses up to 100 minutes and does not kill
  idle compute mid-request, so synchronous Stockfish analysis fits. 10 games can still take several
  minutes — the frontend must show a loading state and not retry aggressively.
- **Render free plan** spins down after inactivity and has a slow cold start; the first analysis
  request after idle will be much slower. Use a paid instance for anything public.
- **Rate limiting** is in-process (5 requests / 10 min / IP). With more than one Render instance each
  instance keeps its own counters. The Docker `CMD` passes `--proxy-headers` so the real client IP is
  used behind Render's proxy; without it every visitor shares the proxy IP's limit.
- **In-memory rate-limit state** resets on every deploy/restart and is not shared across instances.

---

## 6. Production security checklist

- [ ] `ALLOWED_ORIGINS` restricted to the Vercel domain (never `*`) — enforced at startup.
- [ ] IP-based rate limiting active on `/analyze`.
- [ ] Username regex sanitization (`^[a-zA-Z0-9_\-]+$`) active.
- [ ] Security headers (CSP, `X-Frame-Options`, `X-Content-Type-Options`) on every response.
- [ ] Stockfish resolved from an absolute, existing path; `/health` reports `stockfish_available`.
- [ ] HTTPS on both services (automatic on Vercel and Render).
