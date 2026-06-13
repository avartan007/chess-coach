PYTHON=.venv/bin/python
PIP=$(PYTHON) -m pip
UVICORN=$(PYTHON) -m uvicorn

.PHONY: help backend-install backend-run frontend-install frontend-dev frontend-build build

help:
	@echo "Available targets: backend-install, backend-run, frontend-install, frontend-dev, frontend-build, build"

backend-install:
	$(PIP) install -r requirements.txt

backend-run:
	# Copy .env.example to .env and edit STOCKFISH_PATH before running in production
	$(UVICORN) main:app --reload --port 8000

frontend-install:
	cd frontend && npm install

frontend-dev:
	cd frontend && npm run dev

frontend-build:
	cd frontend && npm run build

build: backend-install frontend-build
