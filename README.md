# Chess Coach OS — Turn Your Chess Blunders into Personalized Training

[![Live Demo](https://img.shields.io/badge/Live_Demo-Visit_Site-2ea44f?style=for-the-badge)](https://chess-coach-avartan.vercel.app/)
[![Stack](https://img.shields.io/badge/Stack-React_|_FastAPI_|_Stockfish-blue?style=for-the-badge)]()

> **Demo Preview:** Add a screenshot or short GIF of the interactive chessboard, analysis dashboard, or personalized blunder trainer here.
<img width="1470" height="754" alt="Screenshot 2026-10-25 at 10 59 44" src="https://github.com/user-attachments/assets/94aae5ea-663d-4820-9b69-d552dc270839" />

## Why I Built This

Most chess platforms identify mistakes in individual games, but understanding recurring weaknesses across multiple games requires deeper analysis. Chess Coach OS addresses this gap by analyzing a player's Chess.com game history, identifying recurring blunders and behavioral patterns, and transforming real mistakes into personalized training puzzles.

## Key Engineering Highlights

- **Engine-Powered Analysis:** Integrates Stockfish through `python-chess` to evaluate positions, calculate centipawn losses, and identify stronger alternative moves.
- **Personalized Training Pipeline:** Converts actual game blunders into interactive puzzles, allowing players to practice positions where they previously made mistakes.
- **Behavioral Analytics:** Aggregates statistics across games to highlight playing tendencies, tactical weaknesses, and potential composure shifts under material pressure.
- **Decoupled Architecture:** Uses a React frontend and FastAPI backend to separate interactive visualizations from computationally intensive chess analysis.
- **Performance & Reliability:** Implements subprocess timeouts, session caching, environment-based configuration, and WebGL resource cleanup to improve stability and responsiveness.

## System Architecture

`Chess.com API` → `FastAPI Backend` → `PGN Parsing & Stockfish Analysis` → `Blunder Detection & Pattern Aggregation` → `React Dashboard & Personalized Trainer`

## Tech Stack

- **Frontend:** React, Vite, Zustand, Framer Motion
- **3D & Interaction:** Three.js, React Three Fiber, Web Audio API
- **Backend:** Python, FastAPI, python-chess
- **Chess Engine:** Stockfish
- **Data Processing:** PGN parsing, centipawn-loss analysis, move classification, behavioral statistics
- **Client-Side Storage:** LocalStorage caching

## Key Features

- Import recent games using a Chess.com username.
- Analyze moves and identify blunders using Stockfish.
- Explore recurring mistakes and playing-style patterns.
- Practice personalized puzzles generated from actual game positions.
- Visualize performance through interactive dashboards and radar charts.
- Experience an interactive 3D chessboard with synthesized audio feedback.

## Quick Start (Local Development)

**Prerequisites:** Python 3.10+, Node.js 18+, npm, and a locally installed Stockfish engine.

1. Clone the repository:

   ```bash
   git clone YOUR_GITHUB_REPOSITORY_URL
   cd chess-coach
   ```

2. Configure the environment:

   ```bash
   cp .env.example .env
   ```

   Set `STOCKFISH_PATH` in `.env` to the location of your Stockfish executable.

3. Install dependencies:

   ```bash
   make backend-install
   make frontend-install
   ```

4. Start the backend and frontend in separate terminals:

   ```bash
   make backend-run
   ```

   ```bash
   make frontend-dev
   ```

5. Open the frontend at the URL printed by Vite, typically `http://localhost:5174`.

## Problems Solved

- **Generic Puzzle Training:** Generates practice positions from a player's own mistakes rather than relying exclusively on unrelated puzzles.
- **Limited Long-Term Insights:** Aggregates results across games to reveal recurring weaknesses and playing tendencies.
- **Unresponsive Analysis Workflows:** Uses bounded engine execution and subprocess timeouts to reduce the risk of long-running evaluations.
- **Rendering Resource Leaks:** Disposes of Three.js resources during component cleanup to reduce unnecessary GPU memory usage.

## License

Distributed under the MIT License, if included in the repository's `LICENSE` file.

---

**Chess Coach OS** combines chess, engine analysis, behavioral insights, and full-stack engineering to make improvement more personalized and measurable.
