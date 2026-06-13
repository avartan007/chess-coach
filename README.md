# Chess Coach OS

Quick Start
-----------

Run the backend and frontend locally (requires Python 3.10+, Node.js 18+, and a Stockfish binary):

```bash
# from project root
cp .env.example .env   # edit STOCKFISH_PATH if needed
make backend-install
make frontend-install
make frontend-dev      # runs Vite dev server (http://localhost:5174)
make backend-run       # runs FastAPI on http://127.0.0.1:8000
```

Chess Coach OS is a full-stack, personalized chess analysis and training platform. It allows players to import their recent games from Chess.com, evaluate their moves using a local Stockfish engine process, identify long-term playing patterns, and practice puzzles generated directly from their own in-game blunders.

---

## 1. What is the project?
This project is an interactive web application designed to help chess players learn from their own in-game mistakes. Rather than presenting generic tactical puzzles, the platform retrieves a player's real match history and isolates their specific errors. It aggregates statistics over multiple games to display performance trends, highlight coordinate hotspots, identify composure shifts under material stress, and provide conversational coaching feedback based on raw engine logs.

---

## 2. Why was it built?
Most online chess platforms run engine evaluations that tell players *which* moves were errors, but they do not help players identify the recurring behavioral patterns behind those errors. Furthermore, standard chess puzzles are generic and lack emotional connection. 

This project was built to solve these problems by:
- Creating highly personalized puzzles directly from the user's actual game blunders, helping them understand and correct their specific tactical oversights.
- Identifying aggregate playstyle traits (e.g., patience, aggression, complexity) to diagnose structural weaknesses, like king safety failures or premature move rushing.
- Serving as a practical, production-hardened demonstration of integrating modern frontends (React, WebGL, Web Audio) with standard native backend processes (FastAPI, multi-process chess engine wrappers).

---

## 3. How does it work?
The application executes in a clean, decoupled data pipeline:
1. **Data Ingestion:** The player enters their Chess.com username. The FastAPI backend queries the Chess.com public API to retrieve recent game PGNs.
2. **Engine Analysis:** The backend parses the PGN files and pipes the positions into a local depth-14 Stockfish subprocess using the `python-chess` wrapper. Every move is evaluated to calculate centipawn losses and identify best candidate move alternatives.
3. **Pattern Aggregation:** The backend aggregates statistics across all scanned games, classifying playstyle properties (aggressive checks/captures vs. defensive setups) and isolating tilt markers (like move-rushing under 1.8 seconds or blunder chains).
4. **Interactive Training Generation:** All blunder positions, best continuation coordinates, and aggregate metrics are returned to the client as a single JSON payload. The React frontend stores the data in a Zustand store and dynamically populates the interactive dashboards, radar charts, and progression trainer.

---

## 4. What technologies were used?

### Frontend
- **React (Vite):** Client-side application framework.
- **Zustand:** Centralized state store for responsive, multi-view data tracking.
- **Framer Motion:** Smooth transitions and interface reveals.
- **Three.js & React Three Fiber (R3F):** High-performance 3D responsive reflective chessboard visualization on the landing viewport.
- **Web Audio API:** Synthesis of woodblock move indicators, bass blunder alarms, and crystal chime indicators natively without external asset downloads.

### Backend
- **FastAPI (Python):** Lightweight, asynchronous REST API gateway.
- **python-chess:** Chess board state modeling, move legality tracking, and PGN parsing.
- **Stockfish 16 Engine:** Spawns local subprocess threads to evaluate board positions.

### Client-Side Storage
- **LocalStorage Caching:** Restores analyzed sessions instantly to prevent redundant server-side Stockfish evaluations.

---

## 5. What problems were solved?
- **Progression Deadlocks in Puzzles:** Replaced hard-locked stage architectures in the blunder trainer with a flexible solver state: players are never locked out on incorrect moves or reveals. A **🔄 Try Again** reset hook was introduced, letting players retry and learn from their mistakes to earn progress.
- **WebGL Memory Bloating:** Managed Three.js GPU memory leaks during dashboard view transitions by implementing explicit `.dispose()` garbage collection hooks on WebGL materials and fog objects when the background unmounts.
- **CORS & Environment Configurations:** Hardened backend security by allowingallowed origins and Stockfish paths to resolve dynamically from environment files, supporting seamless deployments.
- **Dynamic Threading & Hangs:** Configured strict subprocess timeout parameters on the Stockfish worker threads to protect CPU resources from locking up during long evaluations.

---

## 6. How can someone run it?

### Prerequisites
- **Python 3.10+** (with virtual environment support)
- **Node.js 18+** (with `npm`)
- **Stockfish Chess Engine:** Download the binary for your specific OS from the [Stockfish Official Site](https://stockfishchess.org/download/).

### Step 1: Run the Backend
1. Clone the repository and open the project root.
2. Setup a virtual environment:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```
3. Install backend dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Copy the environment template:
   ```bash
   cp .env.example .env
   ```
   Open `.env` and set the path to your downloaded Stockfish executable:
   ```env
   STOCKFISH_PATH="/usr/local/bin/stockfish"  # Update with your local path!
   ```
5. Launch the FastAPI server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```

### Step 2: Run the Frontend
1. Open a new terminal tab and enter the `frontend/` folder:
   ```bash
   cd frontend
   ```
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Run the Vite development server:
   ```bash
   npm run dev
   ```
4. Navigate to `http://localhost:5173` in your browser.

---

## About the Project

> "As a Computer Science Engineering student and a chess enthusiast, I wanted to build a practical tool that helps players learn from their own real matches rather than solving abstract, randomized puzzles. Building this project allowed me to combine my interest in chess with my passion for full-stack software engineering. It served as an excellent exercise in writing clear asynchronous Python gateways, executing multi-process engine pipelines, managing high-performance WebGL renders in React, and designing clean user experiences. I wanted to showcase a project that is technically robust, clearly structured, and easy to deploy."
> 
> — **[Your Name]** (Computer Science & Engineering Student)

---

## License
Distributed under the open-source [MIT License](LICENSE). Feel free to fork, customize, and build upon this showcase project!
# chess-coach
