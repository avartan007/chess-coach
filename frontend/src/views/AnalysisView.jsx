import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import useChessStore from '../store/useChessStore';
import Board2D from '../components/UI/Board2D';
import EvalBar from '../components/UI/EvalBar';

// ── Chess move helpers ─────────────────────────────────────

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

// ── Classification helpers ─────────────────────────────────

const CLS_ICON  = { brilliant:'★', best:'!', excellent:'✓', good:'▸', book:'⊞', inaccuracy:'≈', mistake:'?', blunder:'??' };
const CLS_COLOR = { brilliant:'#3CB8C4', best:'#4FAE78', excellent:'#538EC9', good:'#a08060', book:'#5a3e2e', inaccuracy:'#538EC9', mistake:'#D6872A', blunder:'#B83C24' };

const PERSONA_NAMES = {
  grandmaster: '👑 Grandmaster',
  demon: '👹 Tactical Demon',
  teacher: '🧘 Calm Teacher',
  brutal: '💀 Brutal Analyzer'
};

const PERSONA_COLORS = {
  grandmaster: '#F7DAC4',
  demon: '#B83C24',
  teacher: '#4FAE78',
  brutal: '#BAA28C'
};

function getCoachMoveInsight(m, persona) {
  if (!m) return 'Select a move to begin our tactical evaluation.';
  const cls = m.cls;
  const san = m.san;
  const cp = m.cp || 0;
  
  if (cls === 'blunder') {
    switch (persona) {
      case 'demon': return `Absolute tactical collapse! You hung ${san} and completely threw away the position! You must hunt down active threats, not gift yours away!`;
      case 'teacher': return `Oh dear, that was an unfortunate slip with move ${san}. It seems we left a defensive coordinate exposed. Let's remember to double-check piece safety before pushing.`;
      case 'brutal': return `Catastrophic blunder. Move ${san} is absolute garbage, throwing away -${cp}cp. Wake up and calculate your squares.`;
      case 'grandmaster':
      default: return `A major positional error with ${san}, losing ${cp} centipawns. You compromised coordinate structures and instantly yielded board initiative.`;
    }
  } else if (cls === 'mistake') {
    switch (persona) {
      case 'demon': return `Missed dynamic opportunity! You played ${san} instead of pressing a sharp active counter-attack. Stay aggressive!`;
      case 'teacher': return `A slight oversight with ${san}. It is a decent move, but there was a much more harmonious piece placement available on the board.`;
      case 'brutal': return `A weak mistake. You played ${san} and gave your opponent free breathing room. Highly disappointing execution.`;
      case 'grandmaster':
      default: return `A tactical inaccuracy with ${san}. You failed to press your spatial advantage, allowing structural counterplay.`;
    }
  } else if (cls === 'brilliant' || m.imb) {
    switch (persona) {
      case 'demon': return `DEVASTATING! An absolutely lethal checkmate shot with ${san}! You shattered their coordinate defenses! Outstanding!`;
      case 'teacher': return `Wonderful! Move ${san} is exceptionally harmonious, showing beautiful coordinate geometry. Well calculated.`;
      case 'brutal': return `Surprisingly competent. You actually found the brilliant tactical line with ${san}. Credit where due.`;
      case 'grandmaster':
      default: return `Superb structural execution with ${san}. You calculated the absolute best forcing PV continuation.`;
    }
  }
  
  // default best/excellent/good/book
  switch (persona) {
    case 'demon': return `Solid pacing. Move ${san} maintains pressure on their camp. Keep hunting!`;
    case 'teacher': return `Very nice. Move ${san} develops our pieces and maintains healthy structural coordination.`;
    case 'brutal': return `Adequate. Move ${san} doesn't lose immediately. Let's see if you can keep it up.`;
    case 'grandmaster':
    default: return `Theoretical continuation with ${san}. Coordinates are balanced and space is controlled.`;
  }
}

// ── Move list panel ────────────────────────────────────────

function MoveList({ moves, activeMoveIdx, onSelect }) {
  const rows = [];
  for (let i = 0; i < moves.length; i += 2) {
    rows.push({ n: Math.floor(i / 2) + 1, w: moves[i], b: moves[i + 1] });
  }

  return (
    <div className="flex-1 overflow-y-auto px-3 py-2">
      {rows.map(({ n, w, b }) => (
        <div key={n} className="flex items-center gap-1 py-0.5 hover:bg-white/[0.01] rounded">
          <span className="w-8 text-[10px] font-mono text-[#7A5E4B] shrink-0">{n}.</span>
          {[w, b].map((m, j) => {
            if (!m) return <span key={j} className="flex-1" />;
            const idx = (n - 1) * 2 + j;
            const isActive = idx === activeMoveIdx;
            const cls = m.cls;
            
            let color = '#F7EFE4';
            if (!isActive) {
              if (m.imb) color = '#3CB8C4'; // Missed Brilliancy cyan
              else if (cls) color = CLS_COLOR[cls];
            }

            return (
              <button
                key={j}
                onClick={() => onSelect(idx)}
                className={`flex-1 text-left px-2 py-1 rounded text-[11px] font-mono transition-all truncate ${
                  isActive
                    ? 'bg-amber text-chess-bg font-700 shadow-sm'
                    : `hover:bg-white/[0.04]`
                }`}
                style={{ color }}
              >
                {m.imb ? (
                  <span className="text-[10px] mr-1" title="Missed Brilliancy">★</span>
                ) : CLS_ICON[cls] ? (
                  <span className="text-[10px] mr-1">{CLS_ICON[cls]}</span>
                ) : null}
                {m.san}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ── Right stats panel ──────────────────────────────────────

function StatsPanel({ game, onJumpToMove }) {
  if (!game) return null;
  const mq = game.mq;
  const total = Object.values(mq).reduce((a, b) => a + b, 0) || 1;

  const MQ_DATA = [
    { i:'★', n:'Brilliant',  k:'brilliant', c:'#3CB8C4' },
    { i:'!', n:'Best',       k:'best',       c:'#4FAE78' },
    { i:'✓', n:'Excellent',  k:'excellent',  c:'#538EC9' },
    { i:'▸', n:'Good',       k:'good',       c:'#a08060' },
    { i:'⊞', n:'Book',       k:'book',       c:'#5a3e2e' },
    { i:'≈', n:'Inaccuracy', k:'inaccuracy', c:'#538EC9' },
    { i:'?', n:'Mistake',    k:'mistake',    c:'#D6872A' },
    { i:'??',n:'Blunder',    k:'blunder',    c:'#B83C24' },
  ];

  return (
    <div className="w-72 shrink-0 border-l border-white/[0.06] overflow-y-auto">
      {/* What Lost You The Game Card */}
      {game.primaryLossCause && game.primaryLossCause !== 'Strategic Equilibrium' && (
        <div className="p-5 border-b border-[#B83C24]/12 bg-[#B83C24]/04 border-l-2 border-[#B83C24] flex flex-col gap-1.5">
          <div className="text-[9px] font-mono uppercase tracking-[1.8px] text-[#B83C24] font-700">What Lost You The Game</div>
          <div className="text-sm font-700 text-[#F7DAC4] leading-tight">{game.primaryLossCause}</div>
          <p className="text-[11px] text-[#BAA28C] leading-relaxed mb-2">{game.lossCauseDetail}</p>
          {game.lossMoveNum && (
            <button
              onClick={() => onJumpToMove(game.lossMoveNum - 1)}
              style={{
                fontSize: '10px',
                fontFamily: 'monospace',
                color: '#e88670',
                background: 'rgba(184,60,36,0.12)',
                border: '1px solid rgba(184,60,36,0.22)',
                padding: '5px 10px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
                alignSelf: 'start',
                transition: 'all 0.15s',
              }}
              className="hover:bg-red-900/30"
            >
              → Go to Move #{game.lossMoveNum} ({game.lossMoveSan})
            </button>
          )}
        </div>
      )}

      {/* Result */}
      <div className="p-5 border-b border-white/[0.04]">
        <div className="flex items-baseline gap-2 mb-2">
          <span className="font-mono text-2xl font-700 text-amber">{game.result}</span>
          <span className="text-[11px] text-[#7A5E4B] uppercase font-700">
            {game.won ? 'Won' : game.lost ? 'Lost' : 'Draw'}
          </span>
        </div>
        <p className="text-xs text-[#BAA28C] leading-relaxed">{game.won ? 'You outplayed your opponent.' : game.lost ? 'Your opponent found better tactics.' : 'A balanced game.'}</p>
      </div>

      {/* Accuracy */}
      <div className="p-5 border-b border-white/[0.04]">
        <div className="text-[10px] font-mono uppercase tracking-[1.8px] text-[#7A5E4B] mb-3">Accuracy</div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'You', val: game.yacc, color: game.yacc >= 70 ? '#4FAE78' : game.yacc >= 45 ? '#D6872A' : '#B83C24' },
            { label: game.uc === 'white' ? game.black : game.white, val: game.oacc, color: '#BAA28C' },
          ].map(({ label, val, color }) => (
            <div key={label} className="glass rounded-xl p-3 text-center">
              <div className="font-mono text-3xl font-700" style={{ color }}>{val}</div>
              <div className="text-[9px] text-[#7A5E4B] uppercase tracking-wider mt-1 truncate">{label.slice(0, 10)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Move quality */}
      <div className="p-5 border-b border-white/[0.04]">
        <div className="text-[10px] font-mono uppercase tracking-[1.8px] text-[#7A5E4B] mb-4">Move Quality</div>
        <div className="flex flex-col gap-2.5">
          {MQ_DATA.map(q => {
            const n = mq[q.k] || 0;
            const pct = Math.round((n / total) * 100);
            return (
              <div key={q.k} className="grid grid-cols-[20px_1fr_28px] gap-2 items-center">
                <span className="text-center text-sm" style={{ color: q.c }}>{q.i}</span>
                <div>
                  <div className="text-[10px] mb-1 font-600" style={{ color: q.c }}>{q.n}</div>
                  <div className="h-1 bg-white/[0.03] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: q.c }} />
                  </div>
                </div>
                <span className="font-mono text-[11px] text-right" style={{ color: q.c }}>{n}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Game list ──────────────────────────────────────────────

function GameList({ games, activeIdx, onSelect }) {
  return (
    <div className="w-64 shrink-0 border-r border-white/[0.06] flex flex-col">
      <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between shrink-0">
        <span className="text-[11px] font-mono uppercase tracking-[1.5px] text-[#7A5E4B]">Scanned Games</span>
        <span className="text-[11px] font-mono text-[#7A5E4B]">{games.length} games</span>
      </div>
      <div className="overflow-y-auto flex-1">
        {games.map((g, i) => (
          <button
            key={i}
            onClick={() => onSelect(i)}
            className={`w-full text-left px-5 py-4 border-b border-white/[0.03] transition-all
              ${i === activeIdx ? 'bg-amber/[0.07] border-l-2 border-l-amber' : 'border-l-2 border-l-transparent hover:bg-white/[0.02]'}`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[13px] font-600 text-[#F7EFE4] truncate max-w-[110px]">
                {g.uc === 'white' ? g.black : g.white}
              </span>
              <span className={`text-[12px] font-700 ${g.won ? 'text-[#4FAE78]' : g.lost ? 'text-[#B83C24]' : 'text-[#BAA28C]'}`}>
                {g.won ? 'Won' : g.lost ? 'Lost' : 'Draw'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#7A5E4B]">{g.tc} · {g.date}</span>
              <span className="text-[10px] font-mono text-[#BAA28C]">{g.yacc} acc</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Main View ──────────────────────────────────────────────

export default function AnalysisView() {
  const {
    games, activeGameIdx, activeMoveIdx, coachPersona,
    setActiveGameIdx, setActiveMoveIdx, navMove,
  } = useChessStore();

  const game = games[activeGameIdx];
  if (!game) return (
    <div className="flex items-center justify-center h-full text-[#7A5E4B] font-mono text-sm">
      No game data available. Please analyze your games first.
    </div>
  );

  const moves   = game.moves;
  const fen     = activeMoveIdx >= 0 ? moves[activeMoveIdx]?.fen : 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  const hlFrom  = activeMoveIdx >= 0 ? moves[activeMoveIdx]?.uci?.slice(0, 2) : null;
  const hlTo    = activeMoveIdx >= 0 ? moves[activeMoveIdx]?.uci?.slice(2, 4) : null;
  const curMove = activeMoveIdx >= 0 ? moves[activeMoveIdx] : null;
  const evalScore = curMove?.cp != null ? (curMove.cls === 'blunder' ? -curMove.cp : curMove.cp) : 0;

  // Dynamic Session Theme colors based on game phase
  const phase = curMove?.phase || 'opening';
  const glowStyle = 
    phase === 'opening' ? 'rgba(79, 174, 120, 0.22)' : // sage green
    phase === 'middlegame' ? 'rgba(226, 125, 56, 0.22)' : // amber
    'rgba(247, 239, 228, 0.12)'; // monochrome platinum

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left: Game list */}
      <GameList
        games={games}
        activeIdx={activeGameIdx}
        onSelect={(i) => setActiveGameIdx(i)}
      />

      {/* Center: Board + controls */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <div className="flex-1 flex items-center justify-center gap-6 p-6 overflow-hidden">
          {/* Eval bar */}
          <EvalBar evalScore={evalScore} />

          {/* Chess board wrapper for Dynamic Session Theme */}
          <div
            style={{
              padding: 4,
              borderRadius: 10,
              background: 'transparent',
              boxShadow: `0 12px 48px rgba(0,0,0,0.65), 0 0 30px ${glowStyle}`,
              transition: 'box-shadow 0.4s ease-out',
            }}
          >
            <Board2D
              fen={fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'}
              hlFrom={hlFrom}
              hlTo={hlTo}
            />
          </div>

          {/* Move list */}
          <div className="w-56 glass rounded-2xl flex flex-col overflow-hidden" style={{ height: '496px' }}>
            <div className="px-4 py-3 border-b border-white/[0.06] shrink-0 flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-[1.5px] text-[#7A5E4B]">Moves</span>
              {curMove && (
                <span className="text-[11px] font-600" style={{ color: curMove.imb ? '#3CB8C4' : CLS_COLOR[curMove.cls] }}>
                  {curMove.imb ? '★ Missed Brill.' : `${CLS_ICON[curMove.cls]} ${curMove.cls}`}
                </span>
              )}
            </div>
            <MoveList
              moves={moves}
              activeMoveIdx={activeMoveIdx}
              onSelect={setActiveMoveIdx}
            />
          </div>
        </div>

        {/* AI Persona Commentary Panel */}
        <div className="mx-6 mb-3 p-4 glass rounded-xl flex items-start gap-4 border-l-3" style={{ borderLeftColor: PERSONA_COLORS[coachPersona] }}>
          <div style={{ fontSize: 24, padding: 4 }}>
            {coachPersona === 'grandmaster' && '👑'}
            {coachPersona === 'demon' && '👹'}
            {coachPersona === 'teacher' && '🧘'}
            {coachPersona === 'brutal' && '💀'}
          </div>
          <div>
            <div style={{ color: PERSONA_COLORS[coachPersona], fontSize: 10.5, fontFamily: 'monospace', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>
              {PERSONA_NAMES[coachPersona]} Analysis
            </div>
            <p className="text-[12.5px] text-[#BAA28C] leading-relaxed mt-1">
              {getCoachMoveInsight(curMove, coachPersona)}
            </p>
          </div>
        </div>

        {/* Navigation controls */}
        <div className="shrink-0 flex items-center gap-3 px-6 py-3 border-t border-white/[0.06] bg-black/20">
          {[
            { label: '⇤', delta: -999, title: 'First' },
            { label: '←', delta: -1,   title: 'Previous (←)' },
          ].map(({ label, delta, title }) => (
            <button key={label} onClick={() => navMove(delta)} title={title}
              className="px-4 py-2 glass rounded-lg text-sm font-700 text-[#F7EFE4] hover:bg-amber/10 hover:border-amber/30 transition-all">
              {label}
            </button>
          ))}

          <div className="flex-1 text-center text-[12px] font-mono text-[#BAA28C]">
            {curMove
              ? <><span style={{ color: curMove.imb ? '#3CB8C4' : CLS_COLOR[curMove.cls], fontWeight: 700 }}>{curMove.imb ? 'MISSED BRILLIANCY' : curMove.cls?.toUpperCase()}</span> — Move {Math.ceil((activeMoveIdx + 1) / 2)}: <strong className="text-[#F7DAC4]">{curMove.san}</strong></>
              : 'Start position'
            }
          </div>

          {[
            { label: '→', delta: 1,   title: 'Next (→)' },
            { label: '⇥', delta: 999, title: 'Last' },
          ].map(({ label, delta, title }) => (
            <button key={label} onClick={() => navMove(delta)} title={title}
              className="px-4 py-2 glass rounded-lg text-sm font-700 text-[#F7EFE4] hover:bg-amber/10 hover:border-amber/30 transition-all">
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Right: Stats panel */}
      <StatsPanel game={game} onJumpToMove={setActiveMoveIdx} />
    </div>
  );
}
