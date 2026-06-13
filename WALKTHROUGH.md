# Chess Coach OS — Demo Walkthrough Script

This script is structured as a **3–5 minute technical walkthrough** of the project. It is designed to demonstrate full-stack engineering decisions, problem-solving skills, and software craftsmanship during technical interviews or project presentations.

---

## Technical Presentation Script

### 1. Introduction
> "Hello. Today, I am demonstrating **Chess Coach OS**, a personalized chess analysis and training platform. This full-stack application allows users to import their recent matches from Chess.com, evaluate their moves using a local Stockfish engine, and practice training puzzles generated directly from their own in-game errors."

---

### 2. Problem Statement
> "Most standard chess engines provide dry evaluation numbers like `+1.2` or `-2.5` but don't explain the recurring patterns behind a player's mistakes. In addition, online tactical puzzles are usually generic and disconnected from a player's actual games. 
> 
> I built this platform to make chess improvement highly personalized. By analyzing a player's actual history, the system identifies specific, repeating errors—like move-rushing under time pressure or uncoordinated piece positioning—and generates custom-made puzzle modules directly from those positions."

---

### 3. Architecture Overview
> "Let me walk you through the system architecture. The project is built using a decoupled four-layer pipeline:
> 
> 1. **Frontend Interface:** A single-page React app built with Vite, using Zustand for centralized state management, Framer Motion for transitions, and React Three Fiber to render a responsive 3D board on the landing page.
> 2. **Backend Gateway:** Built using FastAPI in Python to manage game-fetching, sliding-window rate limiting, and inputs.
> 4. **Analysis Core:** Uses `python-chess` to parse PGN files and spawns dedicated, timeout-controlled local Stockfish subprocesses to run depth-14 position evaluations.
> 5. **Client-Side Storage:** To protect privacy and prevent redundant engine operations, all analyzed game logs are saved client-side using browser LocalStorage."

---

### 4. Game Analysis Flow
> "Let me show you how the game analysis works. When a user enters their Chess.com username, the backend queries Chess.com's public API to fetch their recent matches.
> 
> Once analyzed, the dashboard renders a sidebar listing recent games. Selecting a game updates the interactive 2D board and populates a custom **Eval Bar** that springs dynamically between positions. 
> 
> In the analysis view, we provide a detailed card identifying the primary cause of a game loss—like king safety errors or tactical blindness—with a direct link that jumps the board instantly to that specific move index."

---

### 5. Blunder Trainer
> "A core feature is the **Blunder Trainer**, which turns the user's actual game blunders into custom puzzles. 
> 
> The board automatically flips depending on whether the user played White or Black. If a user plays an incorrect move, a custom native Web Audio synthesizer plays a soft sub-bass alert and displays the best engine line. 
> 
> To prevent users from getting stuck, I designed a **Try Again** button that resets the puzzle's state, allowing them to recalculate the candidate moves and try again to complete the stage. The synthesizer generates woodblock sounds and chimes natively using the Web Audio API with zero external assets."

---

### 6. Tactical Hotspots
> "To help players identify long-term spatial weaknesses, the system tallies the origin coordinates of all blunders in the player's history. It maps these calculations onto a **Tactical Hotspot** card, isolating the specific square (like F7 or C6) where they commit the most errors. 
> 
> This provides immediate, actionable feedback, showing players which board sectors they need to guard more carefully in future games."

---

### 7. Playstyle Analysis
> "On the patterns dashboard, we generate a comprehensive **Playstyle Analysis**. By evaluating checks, captures, pace, and blunder frequencies, the app maps the player across five core dimensions: Safety, Aggression, Patience, Depth, and Complexity.
> 
> These coordinates are rendered inside a custom **SVG Radar Chart** with dynamic polygon boundaries. Based on these traits, the system suggests tailored openings for White and Black (like the Caro-Kann or the London System) and explains the positional logic behind the recommendations."

---

### 8. AI Coach
> "For a more interactive experience, the **AI Coach** view houses a conversational chat box. 
> 
> This is driven by a heuristic backend query engine that parses the player's active data store in real-time. Players can select between four distinct coaching styles—the positional **Grandmaster**, the intense **Tactical Demon**, the mindful **Calm Teacher**, or the dry **Brutal Analyzer**. 
> 
> The coach translates raw statistics into custom, natural-language feedback, allowing players to ask *'Why do I keep rushing?'* or *'Explain my worst coordinate'* and receive direct, constructive critiques."

---

### 9. Training Roadmap
> "To keep progression structured, the blunder trainer sidebar organizes puzzles into an **Adaptive Training Roadmap**. Puzzles are grouped into weekly modules, such as *Week 1: Defensive Basics* and *Week 2: Tactical Coordination*.
> 
> Stages unlock sequentially as the player completes previous puzzles. If a player is stuck and reveals a solution, they can progress, but they must utilize the 'Try Again' reset loop to actively complete the level, ensuring they understand the correct calculation."

---

### 10. Summary
> "To summarize, Chess Coach OS is a technically robust, full-stack software engineering showcase. 
> 
> By engineering decoupled FastAPI/React architectures, managing WebGL memory allocation with explicit material disposals on unmount, implementing secure backend environments, and using native Web Audio synthesizers, I wanted to focus on clean software craftsmanship and efficient performance. 
> 
> It stands as a production-grade portfolio piece that is highly performant, well-documented, and easy to demonstrate. Thank you for your time, and I would be happy to discuss the technical implementation or code structure in more detail."
