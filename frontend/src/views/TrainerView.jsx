import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useChessStore from '../store/useChessStore';
import Board2D from '../components/UI/Board2D';

// ── Simple FEN parser ─────────────────────────────────────

function parseFen(fen) {
  const rows = fen.split(' ')[0].split('/');
  const board = Array(8).fill(null).map(() => Array(8).fill(null));
  rows.forEach((row, r) => {
    let f = 0;
    for (const ch of row) {
      if (isNaN(ch)) { board[r][f++] = ch; }
      else { f += parseInt(ch); }
    }
  });
  return board;
}

function getLegalMoves(fen, sq, bestMove = null) {
  const board = parseFen(fen);
  const turn  = fen.split(' ')[1] === 'w' ? 'white' : 'black';
  const file  = sq.charCodeAt(0) - 97;
  const rank  = 8 - parseInt(sq[1]);
  const piece = board[rank]?.[file];
  if (!piece) return [];

  const isOwn = (p) => p && ((turn === 'white') === (p === p.toUpperCase()));
  const isOpp = (p) => p && !isOwn(p);
  const inBounds = (r, f) => r >= 0 && r < 8 && f >= 0 && f < 8;
  const toSq = (r, f) => String.fromCharCode(97 + f) + (8 - r);
  const moves = [];

  const ray = (dr, df) => {
    let r = rank + dr, f2 = file + df;
    while (inBounds(r, f2)) {
      const t = board[r][f2];
      if (isOwn(t)) break;
      moves.push(toSq(r, f2));
      if (isOpp(t)) break;
      r += dr; f2 += df;
    }
  };
  const jump = (dr, df) => {
    const r = rank + dr, f2 = file + df;
    if (inBounds(r, f2) && !isOwn(board[r][f2])) moves.push(toSq(r, f2));
  };

  const type = piece.toLowerCase();
  if (type === 'p') {
    const dir = turn === 'white' ? -1 : 1;
    const startR = turn === 'white' ? 6 : 1;
    if (inBounds(rank+dir, file) && !board[rank+dir][file]) {
      moves.push(toSq(rank+dir, file));
      if (rank === startR && !board[rank+dir*2]?.[file]) moves.push(toSq(rank+dir*2, file));
    }
    [-1,1].forEach(df => {
      if (inBounds(rank+dir, file+df) && isOpp(board[rank+dir][file+df]))
        moves.push(toSq(rank+dir, file+df));
    });
  } else if (type === 'r') {
    [[-1,0],[1,0],[0,-1],[0,1]].forEach(([dr,df]) => ray(dr,df));
  } else if (type === 'b') {
    [[-1,-1],[-1,1],[1,-1],[1,1]].forEach(([dr,df]) => ray(dr,df));
  } else if (type === 'q') {
    [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]].forEach(([dr,df]) => ray(dr,df));
  } else if (type === 'n') {
    [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]].forEach(([dr,df]) => jump(dr,df));
  } else if (type === 'k') {
    [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]].forEach(([dr,df]) => jump(dr,df));
    // Support castling
    if (turn === 'white' && sq === 'e1') {
      moves.push('g1');
      moves.push('c1');
    } else if (turn === 'black' && sq === 'e8') {
      moves.push('g8');
      moves.push('c8');
    }
  }

  // Best move fallback guarantee to prevent any edge cases from locking progress
  if (bestMove && bestMove.startsWith(sq)) {
    const dest = bestMove.slice(2, 4);
    if (!moves.includes(dest)) {
      moves.push(dest);
    }
  }

  return moves;
}

function getBoard(fen) { return parseFen(fen); }

function pieceAt(fen, sq) {
  const b = getBoard(fen);
  const file = sq.charCodeAt(0) - 97;
  const rank = 8 - parseInt(sq[1]);
  return b[rank]?.[file] ?? null;
}

// ── Result badge ───────────────────────────────────────────

function ResultBadge({ chosen, best, revealed }) {
  if (!revealed || !chosen) return null;
  const ok = chosen === best;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-700
        ${ok
          ? 'bg-[rgba(79,174,120,0.1)] border-[rgba(79,174,120,0.3)] text-[#4FAE78]'
          : 'bg-[rgba(184,60,36,0.1)] border-[rgba(184,60,36,0.3)] text-[#B83C24]'}`}
    >
      <span className="text-xl">{ok ? '✓' : '✗'}</span>
      {ok ? 'Correct! Best move found.' : `Incorrect. Engine plays: ${best.toUpperCase()}`}
    </motion.div>
  );
}

// ── Position card ──────────────────────────────────────────

function PositionMeta({ pos }) {
  if (!pos) return null;
  return (
    <div className="glass rounded-2xl p-5 flex flex-col gap-3">
      <div className="text-[10px] font-mono uppercase tracking-[1.8px] text-[#7A5E4B]">Position Details</div>

      <div className="flex flex-col gap-2">
        {[
          { label: 'Phase',        val: pos.phase || 'Unknown', color: '#BAA28C' },
          { label: 'Move',         val: `#${pos.move}`,          color: '#F7DAC4' },
          { label: 'CP Loss',      val: `−${pos.cp || '?'} cp`, color: '#B83C24' },
          { label: 'Game',         val: pos.glabel || 'Unknown', color: '#BAA28C' },
        ].map(({ label, val, color }) => (
          <div key={label} className="flex items-center justify-between border-b border-white/[0.03] pb-2">
            <span className="text-[11px] text-[#7A5E4B]">{label}</span>
            <span className="text-[12px] font-600" style={{ color }}>{val}</span>
          </div>
        ))}
      </div>

      <div className="glass rounded-xl p-3 border-l-2 border-[#D6872A]">
        <div className="text-[10px] text-[#7A5E4B] mb-1">Your move played</div>
        <div className="font-mono text-sm font-700 text-[#D6872A]">{pos.played?.toUpperCase() || '—'}</div>
      </div>
    </div>
  );
}

// ── Trainer board interaction ──────────────────────────────

function TrainerBoard({ pos }) {
  const {
    trainerSel, trainerHints, trainerRevealed, trainerChosen,
    setTrainerSel, submitTrainerMove,
  } = useChessStore();

  if (!pos?.fen) return null;

  const handleClick = (sq) => {
    if (trainerRevealed) return;
    const board = getBoard(pos.fen);
    const file  = sq.charCodeAt(0) - 97;
    const rank  = 8 - parseInt(sq[1]);
    const piece = board[rank]?.[file];
    const turn  = pos.fen.split(' ')[1];

    if (trainerSel) {
      if (trainerHints.includes(sq)) {
        let uci = trainerSel + sq;
        // Check for promotion (pawn moving to rank 8 or 1)
        const activePiece = pieceAt(pos.fen, trainerSel);
        if (activePiece && activePiece.toLowerCase() === 'p') {
          if (sq[1] === '8' || sq[1] === '1') {
            if (pos.best && pos.best.length === 5) {
              uci += pos.best[4]; // append promotion char (e.g. q, r, b, n)
            } else {
              uci += 'q'; // fallback to queen
            }
          }
        }
        submitTrainerMove(uci);
        return;
      }
      setTrainerSel(null, []);
    }

    if (piece) {
      const isWhite = piece === piece.toUpperCase();
      const myTurn  = (turn === 'w' && isWhite) || (turn === 'b' && !isWhite);
      if (myTurn) {
        const moves = getLegalMoves(pos.fen, sq, pos.best);
        setTrainerSel(sq, moves);
        return;
      }
    }
    setTrainerSel(null, []);
  };

  const bestFrom = trainerRevealed ? pos.best?.slice(0,2) : undefined;
  const bestTo   = trainerRevealed ? pos.best?.slice(2,4) : undefined;
  const hlFrom   = trainerChosen ? trainerChosen.slice(0,2) : undefined;
  const hlTo     = trainerChosen ? trainerChosen.slice(2,4) : undefined;

  // Flip board if it's black's turn to play
  const isBlackTurn = pos.fen.split(' ')[1] === 'b';

  return (
    <Board2D
      fen={pos.fen}
      sel={trainerSel}
      hints={trainerHints}
      hlFrom={hlFrom}
      hlTo={hlTo}
      bestFrom={bestFrom}
      bestTo={bestTo}
      onClick={handleClick}
      flipped={isBlackTurn}
    />
  );
}

// ── Main trainer view ──────────────────────────────────────

export default function TrainerView() {
  const {
    positions, trainerIdx, trainerRevealed, trainerChosen, trainerScore, trainerDone,
    revealTrainer, navTrainer, setTrainerIdx, resetTrainer,
  } = useChessStore();

  const pos = positions[trainerIdx];
  const total = positions.length;
  const solvedCount = trainerDone.size;
  const pct = total > 0 ? Math.round((solvedCount / total) * 100) : 0;

  // Group positions into roadmap weeks (locked stages)
  const weeks = useMemo(() => {
    const list = [];
    let wIdx = 1;
    for (let i = 0; i < total; i += 5) {
      const items = positions.slice(i, i + 5).map((p, subIdx) => {
        const globalIdx = i + subIdx;
        const isSolved = trainerDone.has(globalIdx);
        const isUnlocked = globalIdx === 0 || trainerDone.has(globalIdx - 1);
        return {
          ...p,
          globalIdx,
          stage: globalIdx + 1,
          isSolved,
          isUnlocked,
        };
      });
      
      let title = 'Defensive Basics';
      if (wIdx === 2) title = 'Tactical Coordination';
      else if (wIdx >= 3) title = 'Advanced Calculation';
      
      list.push({
        num: wIdx,
        title,
        items
      });
      wIdx++;
    }
    return list;
  }, [positions, total, trainerDone]);

  if (!pos) return (
    <div className="flex items-center justify-center h-full text-[#7A5E4B] font-mono text-sm">
      No blunder positions available. Please analyze your games first.
    </div>
  );

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left sidebar: Progression-based Adaptive Roadmap */}
      <div className="w-64 shrink-0 border-r border-white/[0.06] flex flex-col">
        <div className="px-5 py-4 border-b border-white/[0.06] shrink-0">
          <div className="text-[10px] font-mono uppercase tracking-[1.8px] text-[#7A5E4B] mb-2 font-700">Adaptive Roadmap</div>
          <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
            <div className="h-full bg-amber rounded-full" style={{ width: `${pct}%` }} />
          </div>
          <div className="flex justify-between text-[9px] text-[#7A5E4B] mt-1.5 font-mono">
            <span>STAGE PROGRESS</span>
            <span>{solvedCount} / {total} SOLVED</span>
          </div>
        </div>

        {/* Roadmap Stages list */}
        <div className="overflow-y-auto flex-1 px-2 py-3 flex flex-col gap-4">
          {weeks.map(week => {
            const isWeekUnlocked = week.items.some(item => item.isUnlocked);
            return (
              <div key={week.num} className="flex flex-col gap-1.5" style={{ opacity: isWeekUnlocked ? 1 : 0.4 }}>
                <div className="px-3 text-[10px] font-mono uppercase tracking-[1px] text-[#7A5E4B] flex justify-between">
                  <span>Week {week.num}: {week.title}</span>
                  {!isWeekUnlocked && <span>🔒</span>}
                </div>
                
                <div className="flex flex-col gap-1">
                  {week.items.map(item => (
                    <button
                      key={item.globalIdx}
                      disabled={!item.isUnlocked}
                      onClick={() => setTrainerIdx(item.globalIdx)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl border transition-all text-[11.5px] flex items-center justify-between
                        ${item.globalIdx === trainerIdx
                          ? 'bg-amber/[0.08] border-amber/40 text-amber font-700 shadow-sm'
                          : item.isSolved
                            ? 'bg-[rgba(79,174,120,0.03)] border-[rgba(79,174,120,0.12)] text-[#4FAE78] hover:bg-[rgba(79,174,120,0.06)]'
                            : item.isUnlocked
                              ? 'bg-white/[0.01] border-white/[0.04] text-[#BAA28C] hover:bg-white/[0.03] hover:border-white/[0.08]'
                              : 'bg-black/10 border-transparent text-[#7A5E4B] cursor-not-allowed'}`}
                    >
                      <div className="flex flex-col">
                        <span className="font-mono text-[10px] font-700">STAGE {item.stage}</span>
                        <span className="text-[9.5px] text-[#7A5E4B] mt-0.5">Move {item.move} · −{item.cp}cp</span>
                      </div>
                      
                      <div style={{ fontSize: 13 }}>
                        {item.isSolved ? '✓' : !item.isUnlocked ? '🔒' : '○'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Score */}
        <div className="shrink-0 p-4 border-t border-white/[0.06] bg-black/10">
          <div className="text-[10px] font-mono uppercase tracking-[1.5px] text-[#7A5E4B] mb-2">Session Score</div>
          <div className="flex items-baseline gap-1">
            <span className="font-mono text-2xl font-700 text-[#4FAE78]">{trainerScore.c}</span>
            <span className="font-mono text-sm text-[#7A5E4B]">/ {trainerScore.t}</span>
          </div>
          {trainerScore.t > 0 && (
            <div className="text-[11px] text-amber mt-1 font-mono">
              {Math.round((trainerScore.c / trainerScore.t) * 100)}% accuracy
            </div>
          )}
        </div>
      </div>

      {/* Center: Board */}
      <div className="flex-1 flex flex-col items-center justify-center gap-5 p-8 overflow-hidden">
        {/* Instruction */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`instr-${trainerIdx}-${trainerRevealed}`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="glass rounded-2xl px-6 py-4 text-center max-w-sm"
          >
            {trainerRevealed ? (
              <div>
                <div className="text-[11px] font-mono text-[#7A5E4B] mb-1 uppercase tracking-wider">Engine Solution</div>
                <div className="font-mono text-amber font-700 text-lg">
                  {pos.best?.toUpperCase()} — {pos.explain || 'Best continuation'}
                </div>
              </div>
            ) : (
              <div>
                <div className="text-[11px] font-mono text-[#7A5E4B] mb-1 uppercase tracking-wider">Find the Best Move</div>
                <div className="text-sm text-[#BAA28C]">
                  {pos.fen?.split(' ')[1] === 'w' ? '⬜ White' : '⬛ Black'} to play — {pos.phase} position
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Board */}
        <TrainerBoard pos={pos} />

        {/* Result badge */}
        <ResultBadge chosen={trainerChosen} best={pos.best} revealed={trainerRevealed} />
      </div>

      {/* Right panel: metadata + controls */}
      <div className="w-72 shrink-0 border-l border-white/[0.06] flex flex-col gap-4 p-5 overflow-y-auto">
        {/* Position info */}
        <PositionMeta pos={pos} />

        {/* Controls */}
        <div className="flex flex-col gap-3">
          {!trainerRevealed ? (
            <button onClick={revealTrainer}
              className="btn-secondary w-full text-center">
              💡 Show Best Move
            </button>
          ) : (
            trainerChosen !== pos.best && (
              <button onClick={resetTrainer}
                className="btn-secondary w-full text-center border-amber/30 hover:border-amber/60">
                🔄 Try Again
              </button>
            )
          )}
          <div className="flex gap-2">
            <button onClick={() => navTrainer(-1)} disabled={trainerIdx === 0}
              className="flex-1 glass rounded-xl py-3 text-sm font-700 text-[#BAA28C] hover:text-amber hover:border-amber/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
              ← Prev
            </button>
            <button onClick={() => navTrainer(1)} disabled={trainerIdx >= total - 1 || !trainerDone.has(trainerIdx)}
              className="flex-1 btn-primary rounded-xl py-3 text-sm disabled:opacity-30 disabled:cursor-not-allowed disabled:transform-none">
              Next →
            </button>
          </div>
        </div>

        {/* Progress */}
        <div className="glass rounded-2xl p-4">
          <div className="text-[10px] font-mono uppercase tracking-[1.5px] text-[#7A5E4B] mb-3">Progress</div>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-xs">
              <span className="text-[#BAA28C]">Total Stages</span>
              <span className="font-mono text-[#F7DAC4]">{trainerIdx + 1}/{total}</span>
            </div>
            <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-amber rounded-full"
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#BAA28C]">Solve Rate</span>
              <span className={`font-mono font-700 ${trainerScore.t > 0 && trainerScore.c/trainerScore.t >= 0.7 ? 'text-[#4FAE78]' : 'text-[#D6872A]'}`}>
                {trainerScore.t > 0 ? `${Math.round((trainerScore.c/trainerScore.t)*100)}%` : '—'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
