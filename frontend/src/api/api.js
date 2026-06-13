const CACHE_KEY = 'chess_coach_cached_session';
const API_URL = import.meta.env.VITE_API_URL || '';

/** POST /analyze — fetch & analyze games for a username */
export async function analyzeGames(username, gameCount) {
  const res = await fetch(`${API_URL}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, game_count: parseInt(gameCount, 10) }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || `Server error ${res.status}`);
  }
  return res.json();
}

/** Save API response + username to localStorage */
export function saveSession(username, apiData) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ username, apiData, ts: Date.now() }));
  } catch (_) { /* storage full, ignore */ }
}

/** Load cached session from localStorage. Returns null if none. */
export function loadSession() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (_) {
    localStorage.removeItem(CACHE_KEY);
    return null;
  }
}

/** Clear cached session */
export function clearSession() {
  localStorage.removeItem(CACHE_KEY);
}

// ── Data transformation ──────────────────────────────────────

const ACC_MAP = {
  brilliant: 100, best: 100, book: 100,
  excellent: 90, good: 80, inaccuracy: 55, mistake: 25, blunder: 0,
};

function getAcc(cls) { return ACC_MAP[cls] ?? 0; }

/** Transform raw API response into UI-ready data structures */
export function transformApiData(apiData, username) {
  const positions = (apiData.blunder_positions || []).map((bp, i) => ({
    idx: i,
    gid: 0,
    glabel: 'vs Opponent',
    phase: bp.phase,
    move: bp.move_number ?? '?',
    fen: bp.fen,
    played: bp.move_played,
    best: bp.best_move,
    cp: bp.cp_loss,
    explain: `Engine recommends ${bp.best_move}`,
    date: bp.game_date,
  }));

  // Calculate worst square coordinate blunder hotspot
  const squareTally = {};
  positions.forEach(pos => {
    if (pos.best && pos.best.length >= 2) {
      const sq = pos.best.slice(0, 2);
      squareTally[sq] = (squareTally[sq] || 0) + 1;
    }
  });
  let worstSq = 'f7', worstCount = 0;
  for (const sq in squareTally) {
    if (squareTally[sq] > worstCount) {
      worstSq = sq;
      worstCount = squareTally[sq];
    }
  }

  const games = (apiData.games || []).map((g, i) => {
    let yacc = 0, oacc = 0, yCount = 0, oCount = 0;
    const mq = { brilliant:0, best:0, excellent:0, good:0, book:0, inaccuracy:0, mistake:0, blunder:0 };

    g.moves.forEach(m => {
      const a = getAcc(m.classification);
      if (m.is_users_move) { yacc += a; yCount++; if (mq[m.classification] !== undefined) mq[m.classification]++; }
      else { oacc += a; oCount++; }
    });

    // Fix blunder position gid references
    if (apiData.blunder_positions) {
      apiData.blunder_positions.forEach((bp, bi) => {
        if (bp.game_date === g.date && positions[bi]) {
          positions[bi].gid = i;
          const opp = g.user_color === 'white' ? 'Black' : 'White';
          positions[bi].glabel = `vs ${opp}`;
        }
      });
    }

    const won  = (g.result === '1-0' && g.user_color === 'white') || (g.result === '0-1' && g.user_color === 'black');
    const lost = (g.result === '0-1' && g.user_color === 'white') || (g.result === '1-0' && g.user_color === 'black');
    const opp  = g.user_color === 'white' ? 'Black' : 'White';

    return {
      id: i,
      white:  g.user_color === 'white' ? username : opp,
      black:  g.user_color === 'black' ? username : opp,
      result: g.result,
      uc:     g.user_color,
      date:   g.date || 'Unknown',
      tc:     g.time_control || 'Unknown',
      yacc:   yCount > 0 ? parseFloat((yacc / yCount).toFixed(1)) : 0,
      oacc:   oCount > 0 ? parseFloat((oacc / oCount).toFixed(1)) : 0,
      won, lost,
      mq,
      primaryLossCause: g.primary_loss_cause || 'Strategic Equilibrium',
      lossCauseDetail: g.loss_cause_detail || 'No single massive blunder occurred.',
      lossMoveSan: g.loss_move_san,
      lossMoveNum: g.loss_move_num,
      lossPiece: g.loss_piece,
      insights: (apiData.insights || []).slice(0, 3).map(ins => ({ s: 'medium', t: ins.title, b: ins.detail })),
      moves: g.moves.map(m => ({
        san: m.move_san,
        uci: m.move_uci,
        cls: m.classification,
        fen: m.fen_after,
        cp:  m.cp_loss,
        imb: m.is_missed_brilliancy, // Missed Brilliancy
      })),
    };
  });

  const psychProfile = apiData.psych_profile ? {
    ...apiData.psych_profile,
    worstSq,
    worstCount
  } : null;

  return {
    games,
    positions,
    psychProfile,
    totalMissedBrilliancies: apiData.total_missed_brilliancies || 0,
  };
}
