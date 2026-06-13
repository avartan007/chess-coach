// ── Chess logic engine ────────────────────────────────────
// Pure functions, no side effects, fully self-contained

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

function parseFen(fen) {
  const rows = fen.split(' ')[0].split('/');
  const board = [];
  for (const row of rows) {
    const r = [];
    for (const c of row) {
      if ('12345678'.includes(c)) {
        for (let i = 0; i < +c; i++) r.push(null);
      } else {
        r.push(c);
      }
    }
    board.push(r);
  }
  return board;
}

function fenTurn(fen) {
  return (fen.split(' ')[1] || 'w');
}

function fenCastling(fen) {
  return (fen.split(' ')[2] || '-');
}

function fenEnPassant(fen) {
  return (fen.split(' ')[3] || '-');
}

// Convert square name to board index
function s2rc(sq) {
  return { r: 8 - parseInt(sq[1]), c: sq.charCodeAt(0) - 97 };
}

function rc2s(r, c) {
  return String.fromCharCode(97 + c) + (8 - r);
}

function s2i(sq) {
  const { r, c } = s2rc(sq);
  return r * 8 + c;
}

function i2s(i) {
  return rc2s(Math.floor(i / 8), i % 8);
}

// Get all pseudo-legal moves for a piece at sq in a given FEN
function getLegalMoves(fen, fromSq) {
  const board = parseFen(fen);
  const turn = fenTurn(fen);
  const ep = fenEnPassant(fen);
  const { r: fr, c: ff } = s2rc(fromSq);
  const piece = board[fr][ff];

  if (!piece) return [];
  const isWhite = piece === piece.toUpperCase();
  if (turn === 'w' && !isWhite) return [];
  if (turn === 'b' && isWhite) return [];

  const p = piece.toUpperCase();
  const moves = [];

  const inB = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8;
  const isEmpty = (r, c) => board[r][c] === null;
  const isEnemy = (r, c) => {
    const t = board[r][c];
    if (!t) return false;
    return isWhite ? t === t.toLowerCase() : t === t.toUpperCase();
  };
  const isFriend = (r, c) => {
    const t = board[r][c];
    if (!t) return false;
    return isWhite ? t === t.toUpperCase() : t === t.toLowerCase();
  };
  const add = (r, c) => { if (inB(r, c) && !isFriend(r, c)) moves.push(rc2s(r, c)); };

  if (p === 'P') {
    const dir = isWhite ? -1 : 1;
    const startRow = isWhite ? 6 : 1;
    // Forward
    if (inB(fr + dir, ff) && isEmpty(fr + dir, ff)) {
      moves.push(rc2s(fr + dir, ff));
      if (fr === startRow && isEmpty(fr + 2 * dir, ff)) {
        moves.push(rc2s(fr + 2 * dir, ff));
      }
    }
    // Captures
    for (const dc of [-1, 1]) {
      if (inB(fr + dir, ff + dc)) {
        if (isEnemy(fr + dir, ff + dc)) {
          moves.push(rc2s(fr + dir, ff + dc));
        }
        // En passant
        if (ep !== '-' && rc2s(fr + dir, ff + dc) === ep) {
          moves.push(ep);
        }
      }
    }
  }

  if (p === 'N') {
    for (const [dr, dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) {
      add(fr + dr, ff + dc);
    }
  }

  if (p === 'K') {
    for (const [dr, dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) {
      add(fr + dr, ff + dc);
    }
    // Basic castling (no check validation for simplicity)
    const castling = fenCastling(fen);
    if (isWhite && fr === 7 && ff === 4) {
      if (castling.includes('K') && isEmpty(7,5) && isEmpty(7,6)) moves.push('g1');
      if (castling.includes('Q') && isEmpty(7,3) && isEmpty(7,2) && isEmpty(7,1)) moves.push('c1');
    }
    if (!isWhite && fr === 0 && ff === 4) {
      if (castling.includes('k') && isEmpty(0,5) && isEmpty(0,6)) moves.push('g8');
      if (castling.includes('q') && isEmpty(0,3) && isEmpty(0,2) && isEmpty(0,1)) moves.push('c8');
    }
  }

  if ('BQ'.includes(p)) {
    for (const [dr, dc] of [[-1,-1],[-1,1],[1,-1],[1,1]]) {
      let r = fr + dr, c = ff + dc;
      while (inB(r, c)) {
        if (isFriend(r, c)) break;
        moves.push(rc2s(r, c));
        if (isEnemy(r, c)) break;
        r += dr; c += dc;
      }
    }
  }

  if ('RQ'.includes(p)) {
    for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
      let r = fr + dr, c = ff + dc;
      while (inB(r, c)) {
        if (isFriend(r, c)) break;
        moves.push(rc2s(r, c));
        if (isEnemy(r, c)) break;
        r += dr; c += dc;
      }
    }
  }

  return moves;
}

// Classify a move by centipawn loss
function classifyMove(cpLoss) {
  if (cpLoss === 0) return 'best';
  if (cpLoss < 20) return 'best';
  if (cpLoss < 50) return 'excellent';
  if (cpLoss < 100) return 'good';
  if (cpLoss < 150) return 'inaccuracy';
  if (cpLoss < 300) return 'mistake';
  return 'blunder';
}

function getGamePhase(moveNumber) {
  if (moveNumber <= 10) return 'opening';
  if (moveNumber <= 25) return 'middlegame';
  return 'endgame';
}

// Aggregate move quality stats from a game
function aggregateMQ(moves, userColor) {
  const mq = { brilliant:0, best:0, excellent:0, good:0, book:0, inaccuracy:0, mistake:0, blunder:0, missed:0 };
  moves.forEach(m => {
    if (m.cl !== userColor[0]) return;
    mq[m.cls] = (mq[m.cls] || 0) + 1;
  });
  return mq;
}
