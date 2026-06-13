# Chess Coach OS — Production Deployment Guide

This guide provides step-by-step instructions for deploying Chess Coach OS to production. The frontend (Vite/React) is hosted on **Vercel**, and the backend (FastAPI/Python) is hosted on **Railway**, which allows us to automatically provision the **Stockfish** binary using system-level Nix packages.

---

## 1. Production Architecture

In production, the frontend and backend are deployed as separate, decoupled services:
- **Frontend URL:** `https://your-chess-coach-os.vercel.app` (Static React bundle)
- **Backend URL:** `https://your-backend-service.railway.app` (FastAPI REST service)

---

## 2. Frontend Deployment: Vercel

Vercel is used to host static web assets due to its global edge network, build caching, and Brotli compression.

### Step-by-Step Vercel Setup:
1. Sign in to your [Vercel Account](https://vercel.com).
2. Click **Add New** → **Project**.
3. Import your GitHub repository.
4. Configure the Project Settings:
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Configure Environment Variables (Optional):
   - If your frontend needs to query a specific backend domain instead of relative endpoints, add:
     ```env
     VITE_API_URL=https://your-backend-service.railway.app
     ```
6. Click **Deploy**. Vercel will compile the React assets and host them under a secure `https` domain.

---

## 3. Backend Deployment: Railway with Stockfish

Because the FastAPI server executes Stockfish locally via the `python-chess` library, the hosting server must have the `stockfish` binary installed and accessible. We use **Railway** with **Nixpacks** to install system dependencies during the build.

### Step 1: Verify `nixpacks.toml` at Repository Root
Ensure there is a `nixpacks.toml` file at the root of your project directory. This tells Railway's builder to pull Stockfish from the Nix package registry during deployment:

```toml
# nixpacks.toml at repository root
[providers]
python = {}

[phases.setup]
nixPkgs = ["python310", "stockfish"]
```

### Step 2: Stockfish Path Resolution in `main.py`
The backend automatically resolves the binary path on startup using:
```python
# Resolved in main.py
STOCKFISH_PATH = os.getenv("STOCKFISH_PATH") or shutil.which("stockfish") or "/usr/games/stockfish"
```
On Railway, `shutil.which("stockfish")` will automatically locate the Stockfish executable installed by Nixpacks on the system PATH.

### Step 3: Step-by-Step Railway Setup:
1. Log in to [Railway.app](https://railway.app).
2. Click **New Project** → **Deploy from GitHub repo**.
3. Select your repository.
4. Under the service settings, navigate to **Variables** and add:
   - `PORT`: `8000`
   - `HOST`: `0.0.0.0`
   - `ENVIRONMENT`: `production`
   - `ALLOWED_ORIGINS`: `https://your-chess-coach-os.vercel.app` *(Set this to your specific Vercel frontend domain to secure the API).*
5. Click **Deploy**. Railway will run Nixpacks, compile the Python virtual environment, install the `stockfish` package, bind to the target port, and expose a public HTTP domain.

---

## 4. Production Security & Quality Checklist

Before completing your deployment, verify that all security guards and operational checks are active:

- [ ] **IP-Based Rate Limiting:** Verify that the backend rate-limits incoming analysis requests (5 queries per 10 minutes per IP address) to prevent API abuse.
- [ ] **Input Sanitization:** Confirm username parameters are validated using regex (`^[a-zA-Z0-9_\-]+$`) to prevent path traversal or exploit injections.
- [ ] **FastAPI Response Security Headers:** Confirm that standard headers (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and custom CSP directives) are successfully attached to every API response.
- [ ] **CORS Restriction:** Ensure `ALLOWED_ORIGINS` in your backend variables is restricted to your Vercel deployment domain.
- [ ] **WebGL Resource Cleanups:** Confirm that 3D assets and materials are cleanly disposed of (`.dispose()`) upon unmounting to prevent memory leaks.

---

## 5. Local Production Dry Run

To test a production-like build locally before pushing changes:

```bash
# 1. Build the production React bundle
cd frontend
npm run build
cd ..

# 2. Start the FastAPI server locally in production mode
export ENVIRONMENT=production
uvicorn main:app --port 8000 --host 127.0.0.1
```
Navigate to `http://127.0.0.1:8000` in your browser. The local FastAPI server will serve the compiled static React assets directly from `frontend/dist/` with secure HTTP headers activated.
