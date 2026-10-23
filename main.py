from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import requests
import chess
import chess.pgn
import chess.engine
import io
import logging
import os
import re
import time
import shutil
from collections import defaultdict, deque
from datetime import datetime, timedelta
from typing import Any

app = FastAPI()

# ── IP-Based Rate Limiting (Throttling) ──
RATE_LIMIT_WINDOW = 600  # 10 minutes (in seconds)
RATE_LIMIT_MAX_REQUESTS = 5
request_history = defaultdict(deque)

def check_rate_limit(ip_address: str):
    now = time.time()
    history = request_history[ip_address]
    # Remove logs older than the 10-minute window
    while history and history[0] < now - RATE_LIMIT_WINDOW:
        history.popleft()
    if len(history) >= RATE_LIMIT_MAX_REQUESTS:
        time_left = int(RATE_LIMIT_WINDOW - (now - history[0]))
        # Return Retry-After header so callers can back off correctly
        raise HTTPException(
            status_code=429,
            detail=f"Too many analysis requests. Please wait {time_left} seconds before submitting again.",
            headers={"Retry-After": str(time_left)},
        )
    history.append(now)

# ── Secure HTTP Response Headers Middleware ──
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "no-referrer-when-downgrade"

    # Adjust CSP based on environment: stricter in production
    ENV = os.getenv("ENVIRONMENT", "development").lower()
    if ENV == "production":
        csp = (
            "default-src 'self'; "
            "script-src 'self'; "
            "style-src 'self' https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com; "
            "connect-src 'self' https://api.chess.com; "
            "img-src 'self' data: https://images.chesscomfiles.com; "
            "media-src 'self' data:;"
        )
    else:
        # Development allows unsafe-inline/eval for local tooling
        csp = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com; "
            "connect-src 'self' https://api.chess.com; "
            "img-src 'self' data: https://images.chesscomfiles.com; "
            "media-src 'self' data:;"
        )
    response.headers["Content-Security-Policy"] = csp
    return response

allowed_origins_raw = os.getenv("ALLOWED_ORIGINS")
ENV = os.getenv("ENVIRONMENT", "development").lower()
if ENV == "production":
    if not allowed_origins_raw:
        raise RuntimeError("ALLOWED_ORIGINS must be set in production and must not be '*'.")
    origins = [o.strip() for o in allowed_origins_raw.split(",") if o.strip() and o.strip() != "*"]
    if not origins:
        raise RuntimeError("ALLOWED_ORIGINS must contain explicit origin(s) in production.")
else:
    origins = [o.strip() for o in allowed_origins_raw.split(",")] if allowed_origins_raw else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Stockfish Binary Path Resolution ─────
# Checks: 1) STOCKFISH_PATH environment variable
#         2) Dynamic lookup in system PATH (Linux/macOS/Windows)
#         3) Homebrew macOS default path
#         4) Debian/Ubuntu/Railway default package path
STOCKFISH_PATH = os.getenv("STOCKFISH_PATH") or shutil.which("stockfish") or "/opt/homebrew/bin/stockfish"
if not os.path.exists(STOCKFISH_PATH) and os.path.exists("/usr/games/stockfish"):
    STOCKFISH_PATH = "/usr/games/stockfish"

# In production, fail fast if Stockfish is not available
if ENV == "production":
    if not (STOCKFISH_PATH and os.path.isabs(STOCKFISH_PATH) and os.path.exists(STOCKFISH_PATH)):
        logging.error("Stockfish binary not found or STOCKFISH_PATH not set correctly. Checked: %s", STOCKFISH_PATH)
        raise RuntimeError("Stockfish binary not found. Set STOCKFISH_PATH to an absolute path on the host.")


# ── Models ────────────────────────────────

class AnalyzeRequest(BaseModel):
    username: str
    game_count: int = 10  # how many recent games to analyze (1-100)


# ── Helpers ───────────────────────────────

def get_months_to_fetch(months: int):
    """Returns list of (year, month) tuples going back N months from today."""
    result = []
    now = datetime.now()
    for i in range(months):
        # go back i months
        month = now.month - i
        year = now.year
        while month < 1:
            month += 12
            year -= 1
        result.append((year, month))
    return result


def fetch_pgn_for_month(username: str, year: int, month: int) -> str:
    """Fetch PGN from Chess.com public API for a given month."""
    url = f"https://api.chess.com/pub/player/{username}/games/{year}/{month:02d}/pgn"
    headers = {"User-Agent": "chess-coach-app/1.0"}
    resp = requests.get(url, headers=headers, timeout=15)
    if resp.status_code == 404:
        return ""  # no games that month, that's fine
    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail=f"Chess.com API error: {resp.status_code}")
    return resp.text


def classify_move(cp_loss: float) -> str:
    """Classify a move based on centipawn loss."""
    if cp_loss < 20:
        return "best"
    elif cp_loss < 50:
        return "inaccuracy"
    elif cp_loss < 150:
        return "mistake"
    else:
        return "blunder"


def get_game_phase(move_number: int) -> str:
    if move_number <= 10:
        return "opening"
    elif move_number <= 25:
        return "middlegame"
    else:
        return "endgame"


def piece_name(piece_type: int) -> str:
    names = {
        chess.PAWN: "pawn",
        chess.KNIGHT: "knight",
        chess.BISHOP: "bishop",
        chess.ROOK: "rook",
        chess.QUEEN: "queen",
        chess.KING: "king",
    }
    return names.get(piece_type, "unknown")


def analyze_game(pgn_text: str, engine: chess.engine.SimpleEngine, username: str):
    """
    Analyze a single PGN game.
    Returns a dict with move-level data and game-level stats.
    """
    game = chess.pgn.read_game(io.StringIO(pgn_text))
    if game is None:
        return None

    # Figure out which color the user played
    white = game.headers.get("White", "").lower()
    black = game.headers.get("Black", "").lower()
    user_lower = username.lower()

    if user_lower == white:
        user_color = chess.WHITE
    elif user_lower == black:
        user_color = chess.BLACK
    else:
        return None  # game doesn't involve this user (shouldn't happen)

    result = game.headers.get("Result", "*")
    date = game.headers.get("Date", "")
    time_control = game.headers.get("TimeControl", "")

    # Guess starting clock time (in seconds)
    initial_time = 300
    if time_control:
        try:
            parts = time_control.split('+')
            initial_time = int(parts[0])
        except Exception:
            pass

    board = game.board()
    moves_data = []

    last_white_clk = None
    last_black_clk = None
    move_number = 0

    for node in game.mainline():
        move = node.move
        move_number += 1
        is_users_turn = (board.turn == user_color)
        phase = get_game_phase(move_number)

        # Get the piece being moved
        piece = board.piece_at(move.from_square)
        moved_piece = piece_name(piece.piece_type) if piece else "unknown"

        # Check user's queen presence before pushing move
        had_queen = len(board.pieces(chess.QUEEN, user_color)) > 0

        # Evaluate position BEFORE the move
        info_before = engine.analyse(board, chess.engine.Limit(depth=14, time=2.0))
        score_before = info_before["score"].white().score(mate_score=10000)

        # Get best move suggestion before making the move
        best_move = info_before.get("pv", [None])[0]
        best_move_uci = best_move.uci() if best_move else None

        # Capture FEN before the move
        fen_before = board.fen()

        # Make the move
        board.push(move)

        # Capture FEN after the move
        fen_after = board.fen()

        # Check if user just lost their queen
        has_queen = len(board.pieces(chess.QUEEN, user_color)) > 0
        just_lost_queen = had_queen and not has_queen

        # Evaluate position AFTER the move
        info_after = engine.analyse(board, chess.engine.Limit(depth=14, time=2.0))
        score_after = info_after["score"].white().score(mate_score=10000)

        # Parse remaining clock time from PGN comment e.g. [%clk 0:02:59.2]
        import re
        clk = None
        if node.comment:
            m_clk = re.search(r'%clk\s+(\d+):(\d+):(\d+(\.\d+)?)', node.comment)
            if m_clk:
                hours = int(m_clk.group(1))
                minutes = int(m_clk.group(2))
                seconds = float(m_clk.group(3))
                clk = hours * 3600 + minutes * 60 + seconds

        # Calculate time spent on this move
        time_spent = None
        if clk is not None:
            # board.turn is the side to move AFTER board.push() has been executed.
            # So the player who just moved is the opposite of board.turn.
            just_moved_color = chess.WHITE if board.turn == chess.BLACK else chess.BLACK
            if just_moved_color == chess.WHITE:
                prev_clk = last_white_clk if last_white_clk is not None else initial_time
                time_spent = max(0.1, prev_clk - clk)
                last_white_clk = clk
            else:
                prev_clk = last_black_clk if last_black_clk is not None else initial_time
                time_spent = max(0.1, prev_clk - clk)
                last_black_clk = clk

        # Calculate centipawn loss and classify move
        cp_loss = 0
        classification = "best"
        if score_before is not None and score_after is not None:
            just_moved_color = chess.WHITE if board.turn == chess.BLACK else chess.BLACK
            if just_moved_color == chess.WHITE:
                cp_loss = max(0, score_before - score_after)
            else:
                cp_loss = max(0, score_after - score_before)
            classification = classify_move(cp_loss)

        # Missed Brilliancy: User was heavily winning (score > 150cp) but blundered/made mistake (> 120cp loss)
        is_missed_brilliancy = False
        if is_users_turn and score_before is not None and score_after is not None:
            user_friendly_before = score_before if user_color == chess.WHITE else -score_before
            if user_friendly_before > 150 and cp_loss >= 120:
                is_missed_brilliancy = True

        moves_data.append({
            "move_number": move_number,
            "move_uci": move.uci(),
            "move_san": node.san(),
            "is_users_move": is_users_turn,
            "piece_moved": moved_piece,
            "phase": phase,
            "cp_loss": cp_loss,
            "classification": classification,
            "best_move_uci": best_move_uci,
            "fen_before": fen_before,
            "fen_after": fen_after,
            "time_spent": time_spent,
            "clk": clk,
            "just_lost_queen": just_lost_queen,
            "is_missed_brilliancy": is_missed_brilliancy,
        })

    return {
        "result": result,
        "date": date,
        "time_control": time_control,
        "user_color": "white" if user_color == chess.WHITE else "black",
        "moves": moves_data,
    }


def build_pattern_report(games: list, username: str) -> dict:
    """
    Aggregate across all analyzed games to find personal patterns.
    This is the core coaching engine.
    """
    total_games = len(games)
    if total_games == 0:
        return {}

    # Counters
    blunders_by_phase = defaultdict(int)
    mistakes_by_phase = defaultdict(int)
    piece_blunders = defaultdict(int)
    castling_delays = 0        # games where user hadn't castled by move 15
    repeated_piece_moves = 0   # games with 3+ moves of same piece in opening
    total_user_moves = 0
    total_blunders = 0
    total_mistakes = 0
    total_inaccuracies = 0
    blunder_positions = []     # for blunder trainer
    wins = losses = draws = 0

    # Advanced aggregate counters
    total_checks = 0
    total_captures = 0
    total_rushing_blunders = 0
    total_blunder_chains = 0
    total_missed_brilliancies = 0
    queen_loss_accuracies = []

    for game in games:
        # Win/loss/draw
        result = game["result"]
        user_color = game["user_color"]
        if result == "1-0":
            if user_color == "white":
                wins += 1
            else:
                losses += 1
        elif result == "0-1":
            if user_color == "black":
                wins += 1
            else:
                losses += 1
        elif result == "1/2-1/2":
            draws += 1

        # Per-move analysis
        opening_piece_counts = defaultdict(int)
        castled = False
        moves = game["moves"]

        worst_loss_cp = 0
        loss_move_num = None
        loss_move_san = None
        loss_piece = None

        queen_lost_move_idx = None
        post_queen_moves = []
        consecutive_errors = 0
        rushing_blunders_in_game = 0
        blunder_chains_in_game = 0

        for idx, move in enumerate(moves):
            if not move["is_users_move"]:
                continue

            total_user_moves += 1
            cls = move["classification"]
            phase = move["phase"]
            piece = move["piece_moved"]
            move_num = move["move_number"]

            # Count checks and captures in SAN
            if "x" in move["move_san"]:
                total_captures += 1
            if "+" in move["move_san"] or "#" in move["move_san"]:
                total_checks += 1

            # Missed Brilliancies
            if move.get("is_missed_brilliancy"):
                total_missed_brilliancies += 1

            # Queen Loss Response
            if move["just_lost_queen"]:
                queen_lost_move_idx = idx

            if queen_lost_move_idx is not None and idx > queen_lost_move_idx and len(post_queen_moves) < 5:
                post_queen_moves.append(move)

            # Blunder Chains
            if cls in ["blunder", "mistake"]:
                consecutive_errors += 1
                if consecutive_errors >= 2:
                    blunder_chains_in_game += 1
            else:
                consecutive_errors = 0

            # Move Rushing Blunder
            if move["time_spent"] is not None and move["time_spent"] < 1.8 and cls in ["blunder", "mistake"]:
                rushing_blunders_in_game += 1

            if cls == "blunder":
                total_blunders += 1
                blunders_by_phase[phase] += 1
                piece_blunders[piece] += 1
                
                # Save worst blunder details for game diagnosis
                if move["cp_loss"] > worst_loss_cp:
                    worst_loss_cp = move["cp_loss"]
                    loss_move_num = move_num
                    loss_move_san = move["move_san"]
                    loss_piece = piece

                # Save position for blunder trainer (max 50 stored)
                if len(blunder_positions) < 50:
                    blunder_positions.append({
                        "fen": move["fen_before"],
                        "best_move": move["best_move_uci"],
                        "move_played": move["move_uci"],
                        "cp_loss": move["cp_loss"],
                        "phase": phase,
                        "game_date": game["date"],
                        "move_number": move["move_number"],
                    })
            elif cls == "mistake":
                total_mistakes += 1
                mistakes_by_phase[phase] += 1
                
                # Keep mistake as fallback worst error if no blunder
                if worst_loss_cp == 0 and move["cp_loss"] > worst_loss_cp:
                    worst_loss_cp = move["cp_loss"]
                    loss_move_num = move_num
                    loss_move_san = move["move_san"]
                    loss_piece = piece
            elif cls == "inaccuracy":
                total_inaccuracies += 1

            # Track castling (king move of 2 squares = castling)
            if piece == "king" and move_num <= 30:
                uci = move["move_uci"]
                if uci in ["e1g1", "e1c1", "e8g8", "e8c8"]:
                    castled = True

            # Track repeated piece moves in opening
            if phase == "opening":
                opening_piece_counts[piece] += 1

        if not castled:
            castling_delays += 1

        # Check if any piece was moved 3+ times in opening
        for piece_type, count in opening_piece_counts.items():
            if piece_type != "pawn" and count >= 3:
                repeated_piece_moves += 1
                break

        # Process post-queen-loss move accuracies
        for m in post_queen_moves:
            acc_val = 0
            m_cls = m["classification"]
            if m_cls in ["brilliant", "best", "book"]:
                acc_val = 100
            elif m_cls == "excellent":
                acc_val = 90
            elif m_cls == "good":
                acc_val = 80
            elif m_cls == "inaccuracy":
                acc_val = 55
            elif m_cls == "mistake":
                acc_val = 25
            queen_loss_accuracies.append(acc_val)

        # Calculate game accuracy (yacc) for the user
        user_move_scores = []
        for m in moves:
            if m["is_users_move"]:
                m_cls = m["classification"]
                if m_cls in ["brilliant", "best", "book"]:
                    acc_val = 100
                elif m_cls == "excellent":
                    acc_val = 90
                elif m_cls == "good":
                    acc_val = 80
                elif m_cls == "inaccuracy":
                    acc_val = 55
                elif m_cls == "mistake":
                    acc_val = 25
                else:
                    acc_val = 0
                user_move_scores.append(acc_val)
        game["yacc"] = sum(user_move_scores) / len(user_move_scores) if user_move_scores else 0.0

        total_rushing_blunders += rushing_blunders_in_game
        total_blunder_chains += blunder_chains_in_game

        # Establish Game Loss Reason (What Lost You The Game)
        primary_loss_cause = "Strategic Equilibrium"
        loss_cause_detail = "You maintained complete tactical coordination and kept dynamic balance."
        if worst_loss_cp >= 120:
            if loss_piece == "king":
                primary_loss_cause = "Poor King Safety"
                loss_cause_detail = f"Your king was left exposed in the center or weakened by premature pawn moves on move {loss_move_num}, triggering a terminal checkmate sequence."
            elif loss_piece in ["queen", "rook"]:
                primary_loss_cause = "Tactical Blindness"
                loss_cause_detail = f"You overlooked a direct threat to a major piece on move {loss_move_num}, creating an immediate and decisive material handicap."
            elif loss_move_num <= 10:
                primary_loss_cause = "Opening Principle Violation"
                loss_cause_detail = f"You deviated from sound theoretical guidelines on move {loss_move_num}, leaving your piece development uncoordinated and falling into an early trap."
            elif game["moves"][loss_move_num - 1].get("time_spent", 0) is not None and game["moves"][loss_move_num - 1].get("time_spent", 999) < 1.8:
                primary_loss_cause = "Time Pressure Collapse"
                loss_cause_detail = f"You rushed a critical defensive candidate calculation on move {loss_move_num} in under 2 seconds, committing a terminal blunder."
            else:
                primary_loss_cause = "Tactical Overextension"
                loss_cause_detail = f"An aggressive tactical tactical shot went wrong on move {loss_move_num}, allowing a back-rank counter-attack or hanging a key defensive square."
        elif game.get("lost") or (result == "0-1" and user_color == "white") or (result == "1-0" and user_color == "black"):
            primary_loss_cause = "Positional Decay"
            loss_cause_detail = "No single catastrophic blunder occurred, but a series of passive inaccuracies allowed your opponent to slowly squeeze your pieces and restrict your counterplay."

        game["primary_loss_cause"] = primary_loss_cause
        game["loss_cause_detail"] = loss_cause_detail
        game["loss_move_san"] = loss_move_san
        game["loss_move_num"] = loss_move_num
        game["loss_piece"] = loss_piece

    # Build coaching insights (plain English, ranked by severity)
    insights = []

    blunder_rate = round((total_blunders / max(total_user_moves, 1)) * 100, 1)
    if blunder_rate > 5:
        insights.append({
            "type": "blunder_rate",
            "severity": "high",
            "title": "You blunder too often",
            "detail": f"You blunder on {blunder_rate}% of your moves across {total_games} games. The goal is under 2%. Slow down before each move — ask yourself: can my opponent take anything for free?",
        })

    worst_phase = max(blunders_by_phase, key=blunders_by_phase.get) if blunders_by_phase else None
    if worst_phase:
        insights.append({
            "type": "phase_weakness",
            "severity": "high",
            "title": f"Most blunders happen in the {worst_phase}",
            "detail": f"You made {blunders_by_phase[worst_phase]} blunders in the {worst_phase} across your games. Focus your study time here first.",
        })

    worst_piece = max(piece_blunders, key=piece_blunders.get) if piece_blunders else None
    if worst_piece:
        insights.append({
            "type": "piece_vulnerability",
            "severity": "medium",
            "title": f"Your {worst_piece}s get you in trouble most",
            "detail": f"You lost or badly misplayed your {worst_piece} {piece_blunders[worst_piece]} times. Pay extra attention to this piece's safety.",
        })

    castling_delay_pct = round((castling_delays / total_games) * 100)
    if castling_delay_pct > 40:
        insights.append({
            "type": "castling",
            "severity": "medium",
            "title": "You delay castling too often",
            "detail": f"You didn't castle in {castling_delay_pct}% of your games. An uncastled king is a target. Make castling a priority in the first 12 moves.",
        })

    repeated_pct = round((repeated_piece_moves / total_games) * 100)
    if repeated_pct > 30:
        insights.append({
            "type": "opening_principle",
            "severity": "medium",
            "title": "You move the same piece multiple times in the opening",
            "detail": f"In {repeated_pct}% of your games, one piece was moved 3+ times before you finished development. Develop all pieces first — don't chase pawns with one piece.",
        })

    # --- ADVANCED RADAR AND PSYCHOLOGICAL DNA CALCULATION ---
    raw_aggression = 100 * (total_checks + total_captures) / max(1, total_user_moves)
    aggression = max(35, min(95, round(raw_aggression * 3.8 + 35)))

    avg_game_length = sum(len(g["moves"]) for g in games) / max(1, total_games)
    raw_patience = (avg_game_length / 45) * 50 + (100 - aggression)
    patience = max(35, min(95, round(raw_patience * 0.5 + 25)))

    raw_complexity = 100 * (total_blunders + total_mistakes) / max(1, total_user_moves)
    complexity = max(35, min(95, round(raw_complexity * 9 + 40)))

    depth_sum = 0
    dev_games = 0
    for g in games:
        first_dev = -1
        for idx, m in enumerate(g["moves"]):
            if m["is_users_move"] and m["classification"] in ["inaccuracy", "mistake", "blunder"]:
                first_dev = (idx // 2) + 1
                break
        if first_dev != -1:
            depth_sum += first_dev
            dev_games += 1
    avg_dev = depth_sum / dev_games if dev_games > 0 else 6.0
    depth_score = max(35, min(95, round(avg_dev * 6.5 + 22)))
    safety_score = max(35, min(95, round(100 - (castling_delay_pct * 0.65))))

    # Match Chess Personality Profile
    archetype = "The Universal Strategist"
    archetype_player = "Bobby Fischer"
    archetype_desc = "You play a balanced, classical style of chess. You transition smoothly between solid pawn structures and sharp tactical counters."
    archetype_strengths = ["Clear active piece play", "Solid development structure", "Classical space control"]
    archetype_weaknesses = ["Reluctance to take extreme risks", "Occasional dogmatic thinking", "Passive drawish endgames"]

    if aggression >= 66 and complexity >= 64:
        archetype = "The Aggressive Calculator"
        archetype_player = "Garry Kasparov"
        archetype_desc = "You seek chaotic positions, calculating deep forcing lines to crash through your opponent's defenses. Your games are sharp battles where you thrive on having the initiative."
        archetype_strengths = ["Fearless attacking instinct", "Deep tactical calculation", "Pressure play under stress"]
        archetype_weaknesses = ["Impatience in quiet positions", "Prone to overextending pawns", "Neglecting baseline defense"]
    elif patience >= 65 and depth_score >= 60:
        archetype = "The Positional Architect"
        archetype_player = "Magnus Carlsen"
        archetype_desc = "You control the board like a grand structural blueprint. You prefer quiet, squeezing maneuvers, restricting opponent activity until their position slowly collapses."
        archetype_strengths = ["Mastery of piece coordination", "Endgame squeezes", "Robust defensive coverage"]
        archetype_weaknesses = ["Avoiding direct complications", "Missing tactical counter-shots", "Playing overly passive"]
    elif aggression >= 58 and patience < 55:
        archetype = "The Gambit Hunter"
        archetype_player = "Mikhail Tal"
        archetype_desc = "You view chess as an art of chaos and sacrifices. You gladly offer pawns or pieces to expose the opponent's king, creating intuitive attacks that terrify defenders."
        archetype_strengths = ["Stunning creative imagination", "High tactical pacing", "Extreme psychological pressure"]
        archetype_weaknesses = ["Objectively unsound sacrifices", "Early material deficits", "Hanging pieces in time pressure"]
    elif total_rushing_blunders >= max(1, total_blunders * 0.35):
        archetype = "The Time Scrambler"
        archetype_player = "Hikaru Nakamura"
        archetype_desc = "You are a speed demon who thrives in extreme time pressure. You drag opponents into blitz scrambles, using rapid-fire moves to force mistakes."
        archetype_strengths = ["Lightning tactical vision", "Speed-pressuring opponents", "Exceptional defensive speed"]
        archetype_weaknesses = ["Premature move rushing", "Shallow positional evaluations", "Frequent clock reliance"]

    # Analyze Tilt warnings
    avg_baseline_acc = round(sum(g["yacc"] for g in games) / max(1, total_games), 1)
    queen_loss_drop = 0
    if queen_loss_accuracies:
        avg_queen_loss_acc = sum(queen_loss_accuracies) / len(queen_loss_accuracies)
        queen_loss_drop = max(0, round(avg_baseline_acc - avg_queen_loss_acc, 1))

    tilt_warnings = []
    if queen_loss_drop >= 12:
        tilt_warnings.append(f"Your accuracy drops by {queen_loss_drop}% in the 5 moves after losing major material (Queen/Rook). Focus on slow breathing after a material setback.")
    if total_rushing_blunders >= 2:
        tilt_warnings.append(f"You made {total_rushing_blunders} tactical errors in under 2 seconds of thinking time. Avoid executing candidate moves instantly without double-checking.")
    if total_blunder_chains >= 2:
        tilt_warnings.append(f"You entered back-to-back mistake cycles {total_blunder_chains} times. When an error happens, pause for 10 seconds to break the psychological momentum.")

    # Recommending Openings based on playstyle
    if aggression >= 62:
        rec_opening_white = "Vienna Gambit / Scotch Game"
        rec_opening_black = "Sicilian Defense (Najdorf/Dragon)"
        opening_reason = "Your high aggression and tactical complexity align with open, highly tactical lines that yield immediate king attacks and dynamic imbalance."
    else:
        rec_opening_white = "London System / Ruy Lopez"
        rec_opening_black = "Caro-Kann Defense / King's Indian"
        opening_reason = "Your positional patience and coordination support solid structures, aiming for endgame control and squeezing piece maneuvers."

    psych_profile = {
        "archetype": archetype,
        "famous_player": archetype_player,
        "description": archetype_desc,
        "strengths": archetype_strengths,
        "weaknesses": archetype_weaknesses,
        "aggression": aggression,
        "patience": patience,
        "complexity": complexity,
        "depth": depth_score,
        "safety": safety_score,
        "tilt_warnings": tilt_warnings,
        "recommended_opening_white": rec_opening_white,
        "recommended_opening_black": rec_opening_black,
        "opening_reason": opening_reason,
        "queen_loss_drop": queen_loss_drop,
        "rushing_blunders": total_rushing_blunders,
        "blunder_chains": total_blunder_chains
    }

    return {
        "username": username,
        "total_games": total_games,
        "wins": wins,
        "losses": losses,
        "draws": draws,
        "total_blunders": total_blunders,
        "total_mistakes": total_mistakes,
        "total_inaccuracies": total_inaccuracies,
        "blunder_rate_percent": blunder_rate,
        "blunders_by_phase": dict(blunders_by_phase),
        "mistakes_by_phase": dict(mistakes_by_phase),
        "piece_blunders": dict(piece_blunders),
        "castling_delay_percent": castling_delay_pct,
        "total_missed_brilliancies": total_missed_brilliancies,
        "psych_profile": psych_profile,
        "insights": insights,
        "blunder_positions": blunder_positions,  # used by blunder trainer
    }


# ── Endpoints ──────────────────────────────



@app.post("/analyze")
def analyze(req: AnalyzeRequest, request: Request):
    """
    Main endpoint. Fetches recent games from Chess.com, analyzes them,
    returns pattern report + blunder positions.
    """
    # 1. IP-Based Sliding-Window Rate Limit Check
    client_ip = request.client.host if request.client else "unknown"
    check_rate_limit(client_ip)

    # 2. Input Regex Sanitization (Letters, numbers, underscores, and hyphens only)
    if not re.match(r"^[a-zA-Z0-9_\-]+$", req.username):
        raise HTTPException(
            status_code=400,
            detail="Invalid username format. Only alphanumeric characters, underscores, and hyphens are permitted."
        )

    game_count = max(1, min(req.game_count, 100))
    all_pgn_text = ""

    # Fetch up to 6 months back until we have enough games
    months_to_fetch = get_months_to_fetch(6)
    for year, month in months_to_fetch:
        pgn = fetch_pgn_for_month(req.username, year, month)
        if pgn:
            all_pgn_text = pgn + "\n\n" + all_pgn_text  # prepend so oldest first

    if not all_pgn_text.strip():
        raise HTTPException(status_code=404, detail="No games found for this username.")

    # Parse all games
    pgn_io = io.StringIO(all_pgn_text)
    raw_games = []
    while True:
        game = chess.pgn.read_game(pgn_io)
        if game is None:
            break
        raw_games.append(game)

    if not raw_games:
        raise HTTPException(status_code=404, detail="Could not parse any games.")

    # Take the most recent N games
    raw_games = raw_games[-game_count:]

    # Analyze with Stockfish
    if not os.path.exists(STOCKFISH_PATH):
        logging.error("Stockfish not found when handling /analyze request. Checked: %s", STOCKFISH_PATH)
        raise HTTPException(
            status_code=500,
            detail="Server misconfiguration: Stockfish engine is not available. Contact the administrator.",
        )

    analyzed_games = []
    try:
        with chess.engine.SimpleEngine.popen_uci(STOCKFISH_PATH) as engine:
            for raw_game in raw_games:
                pgn_str = str(raw_game)
                result = analyze_game(pgn_str, engine, req.username)
                if result:
                    analyzed_games.append(result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Stockfish error: {str(e)}")

    # Build pattern report
    report = build_pattern_report(analyzed_games, req.username)
    report["games"] = analyzed_games  # include per-game data for the UI

    return report


@app.get("/profile/{username}")
def get_profile(username: str):
    """Quick check that a Chess.com username exists."""
    url = f"https://api.chess.com/pub/player/{username}"
    headers = {"User-Agent": "chess-coach-app/1.0"}
    resp = requests.get(url, headers=headers, timeout=10)
    if resp.status_code == 404:
        raise HTTPException(status_code=404, detail="Username not found on Chess.com")
    data = resp.json()
    return {
        "username": data.get("username"),
        "avatar": data.get("avatar", ""),
        "country": data.get("country", ""),
        "joined": data.get("joined", 0),
    }


@app.get("/health")
def health():
    """Lightweight health endpoint used by load balancers and readiness checks."""
    ok = True
    details = {"env": ENV}
    # In production ensure Stockfish exists
    if ENV == "production":
        details["stockfish_available"] = os.path.exists(STOCKFISH_PATH)
        ok = ok and details["stockfish_available"]
    return {"status": "ok" if ok else "degraded", "details": details}


# Serve static frontend (must be at the end)
# In development: run `npm run dev` inside frontend/ (Vite dev server on port 5173)
# In production: run `npm run build` inside frontend/, then start this server
import os as _os
_FRONTEND_DIR = "frontend/dist" if _os.path.isdir("frontend/dist") else "frontend"
# API-only deployments (e.g. frontend hosted on Vercel) may not ship the frontend dir
if _os.path.isdir(_FRONTEND_DIR):
    app.mount("/", StaticFiles(directory=_FRONTEND_DIR, html=True), name="frontend")
