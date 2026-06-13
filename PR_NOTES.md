PR Notes: CI / Security / Deployment fixes
======================================

Summary
-------
- Hardened `main.py` security headers, CSP behavior, and rate-limit responses.
- Added `.env.example` with `STOCKFISH_PATH` and `ALLOWED_ORIGINS`.
- Added `Makefile` for common local tasks.
- Added GitHub Actions CI at `.github/workflows/ci.yml` and extended it to run `pip-audit` and `npm audit`.
- Updated `README.md` with a concise Quick Start.
- Added `/health` endpoint and improved error messaging to avoid leaking filesystem paths.

Local verification steps (run locally)
------------------------------------
1. Ensure you have Python 3.10+, Node 18+, and Stockfish binary available.
2. Copy and edit the env file:

```bash
cp .env.example .env
# edit .env to set STOCKFISH_PATH to your Stockfish binary absolute path
```

3. Install and run backend + frontend (from project root):

```bash
make backend-install
make frontend-install
make frontend-dev    # visit http://localhost:5174
make backend-run     # runs FastAPI on http://127.0.0.1:8000

# Quick smoke tests
curl http://127.0.0.1:8000/health
curl http://127.0.0.1:8000/profile/erik
```

CI Notes
--------
- CI will run Python syntax check, `pip-audit` (backend), frontend build, and `npm audit`.
- If `pip-audit` or `npm audit` fails, review dependency advisories and update versions or apply patches.

Suggested follow-ups
--------------------
- Add `Dockerfile` + `docker-compose.yml` for reproducible deployments.
- Add automated `npm audit` fix step or schedule dependabot for PRs.
- Add runtime monitoring (Sentry/Prometheus) and health/readiness probes in the deployment platform.

How to commit & open a PR locally
---------------------------------
```bash
git checkout -b ci-deploy-fixes
git add .
git commit -m "chore: CI, security hardening, .env, Makefile, README improvements"
git push --set-upstream origin ci-deploy-fixes
# then open a PR on GitHub using the repository UI
```
