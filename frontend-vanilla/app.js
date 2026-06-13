// ── App state ─────────────────────────────────────────────

let GAMES = [];
let POSITIONS = [];
let aGame = 0;         // active game index
let aMoveIdx = -1;     // -1 = start position

let tIdx = 0;          // active trainer position
let tSel = null;       // selected square
let tHints = [];       // legal move destinations
let tRevealed = false; // has answer been revealed
let tChosen = null;    // UCI move the user played
let tScore = { c: 0, t: 0 };
const tDone = new Set();

// ── Board renderer ────────────────────────────────────────

function renderBoard(el, fen, opts = {}) {
  const {
    sel = null, hints = [], hlFrom = null, hlTo = null,
    bestFrom = null, bestTo = null,
    onClick = null,
  } = opts;

  const board = parseFen(fen);
  el.innerHTML = '';

  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const sq = rc2s(r, f);
      const piece = board[r][f];
      const isLt = (r + f) % 2 === 0;

      const div = document.createElement('div');
      div.className = 'sq ' + (isLt ? 'lt' : 'dk');
      div.dataset.sq = sq;

      // Last-move highlight
      if (sq === hlFrom || sq === hlTo) div.classList.add('hl-from');

      // Selection
      if (sq === sel) div.classList.add('sel');

      // Legal move hints
      if (hints.includes(sq)) {
        div.classList.add(piece ? 'hint-cap' : 'hint');
      }

      // Best move (trainer reveal)
      if (bestFrom && sq === bestFrom) div.classList.add('best-from');
      if (bestTo && sq === bestTo) div.classList.add('best-to');

      // Piece SVG
      if (piece) {
        const wrapper = document.createElement('div');
        wrapper.style.cssText = 'width:48px;height:48px;display:flex;align-items:center;justify-content:center;pointer-events:none;transition:transform 0.15s ease;';
        renderPieceInto(wrapper, piece);
        div.appendChild(wrapper);
      }

      // High-contrast, contrast-inverted coordinates rendered directly inside tiles
      if (r === 7) {
        const fileSpan = document.createElement('span');
        fileSpan.className = 'sq-coord';
        fileSpan.style.cssText = 'position:absolute;bottom:2px;right:4px;font-size:9px;font-weight:800;font-family:\'JetBrains Mono\',monospace;pointer-events:none;opacity:0.95;';
        fileSpan.textContent = String.fromCharCode(97 + f);
        div.appendChild(fileSpan);
      }
      if (f === 0) {
        const rankSpan = document.createElement('span');
        rankSpan.className = 'sq-coord';
        rankSpan.style.cssText = 'position:absolute;top:2px;left:4px;font-size:9px;font-weight:800;font-family:\'JetBrains Mono\',monospace;pointer-events:none;opacity:0.95;';
        rankSpan.textContent = 8 - r;
        div.appendChild(rankSpan);
      }

      if (onClick) {
        div.addEventListener('click', () => onClick(sq, piece, div));
      }

      el.appendChild(div);
    }
  }
}

// ── Analysis screen ───────────────────────────────────────

function buildGameList() {
  const el = document.getElementById('gl-inner');
  document.getElementById('gl-count').textContent = GAMES.length + ' games';
  el.innerHTML = '';

  GAMES.forEach((g, i) => {
    const opp = g.uc === 'white' ? g.black : g.white;
    const won  = (g.result === '1-0' && g.uc === 'white') || (g.result === '0-1' && g.uc === 'black');
    const lost = (g.result === '0-1' && g.uc === 'white') || (g.result === '1-0' && g.uc === 'black');

    const div = document.createElement('div');
    div.className = 'gi' + (i === aGame ? ' on' : '');
    div.innerHTML = `
      <span class="gi-opp">${opp}</span>
      <span class="gi-res ${won ? 'w' : lost ? 'l' : 'd'}">${won ? 'Won' : lost ? 'Lost' : 'Draw'}</span>
      <span class="gi-meta">${g.tc} · ${g.date}</span>
      <span class="gi-acc">${g.yacc} acc</span>
    `;
    div.addEventListener('click', () => {
      aGame = i; aMoveIdx = -1;
      buildGameList(); renderAnalysis();
    });
    el.appendChild(div);
  });
}

const MOVE_ICONS = {
  brilliant:  '★', best: '!', excellent: '✓', good: '▸',
  book: '⊞', inaccuracy: '≈', mistake: '?', blunder: '??',
};
const MOVE_COLORS = {
  brilliant: '#3cb8c4', best: '#4fae78', excellent: '#538ec9', good: '#a08060',
  book: '#5a3e2e', inaccuracy: '#538ec9', mistake: '#d48a33', blunder: '#b24124',
};

function renderAnalysis() {
  const g = GAMES[aGame];
  const mvs = g.moves;

  // Board
  const fen = aMoveIdx >= 0
    ? mvs[aMoveIdx].fen
    : 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  const hlFrom = aMoveIdx >= 0 ? mvs[aMoveIdx].uci.slice(0, 2) : null;
  const hlTo   = aMoveIdx >= 0 ? mvs[aMoveIdx].uci.slice(2, 4) : null;

  renderBoard(document.getElementById('board'), fen, { hlFrom, hlTo });

  // Coordinate labels (maintained for backwards compatibility, hidden/cleared)
  document.getElementById('ranks').innerHTML = '';
  document.getElementById('files').innerHTML = '';

  // Eval bar
  const evalEl = document.getElementById('eval-display');
  if (aMoveIdx >= 0) {
    const m = mvs[aMoveIdx];
    const color = MOVE_COLORS[m.cls] || '#a08060';
    const icon  = MOVE_ICONS[m.cls] || '';
    evalEl.innerHTML = `<span style="color:${color};font-weight:700;">${icon} ${m.cls.toUpperCase()}</span> — Move ${Math.ceil((aMoveIdx + 1) / 2)}: <strong style="color:var(--sp)">${m.san}</strong>`;
  } else {
    evalEl.textContent = 'Start position';
  }

  // Move list
  const ml = document.getElementById('mlist');
  ml.innerHTML = '';
  for (let i = 0; i < mvs.length; i += 2) {
    const row = document.createElement('div');
    row.className = 'mrow';
    row.innerHTML = `<span class="mnum">${Math.floor(i / 2) + 1}.</span>`;
    [0, 1].forEach(j => {
      const idx = i + j;
      if (idx >= mvs.length) return;
      const m = mvs[idx];
      const btn = document.createElement('button');
      btn.className = 'mbtn' +
        (idx === aMoveIdx ? ' on' : '') +
        (['blunder','mistake','inaccuracy','excellent'].includes(m.cls) ? ' ' + m.cls : '');
      btn.textContent = m.san;
      btn.addEventListener('click', () => { aMoveIdx = idx; renderAnalysis(); });
      row.appendChild(btn);
    });
    ml.appendChild(row);
  }
  ml.querySelector('.mbtn.on')?.scrollIntoView({ block: 'nearest' });

  // Right panel
  renderStatsPanel(g);
}

function renderStatsPanel(g) {
  const rp = document.getElementById('rp');
  const opp = g.uc === 'white' ? g.black : g.white;
  const won  = (g.result === '1-0' && g.uc === 'white') || (g.result === '0-1' && g.uc === 'black');
  const lost = (g.result === '0-1' && g.uc === 'white') || (g.result === '1-0' && g.uc === 'black');
  const mq = g.mq;
  const mqTotal = Object.values(mq).reduce((a, b) => a + b, 0) || 1;

  const MQ_DATA = [
    { i:'★', n:'Brilliant',   k:'brilliant',  c:'var(--cy)' },
    { i:'!', n:'Best move',   k:'best',        c:'var(--gr)' },
    { i:'✓', n:'Excellent',   k:'excellent',   c:'var(--bl)' },
    { i:'▸', n:'Good',        k:'good',        c:'#a08060' },
    { i:'⊞', n:'Book',        k:'book',        c:'#5a3e2e' },
    { i:'≈', n:'Inaccuracy',  k:'inaccuracy',  c:'var(--bl)' },
    { i:'?', n:'Mistake',     k:'mistake',     c:'var(--am)' },
    { i:'??',n:'Blunder',     k:'blunder',     c:'var(--re)' },
  ];

  rp.innerHTML = `
    <div class="rp-sec">
      <div style="display:flex;align-items:baseline;gap:7px;margin-bottom:6px">
        <span style="font-size:22px;font-weight:700;color:var(--oc);font-family:'JetBrains Mono',monospace">${g.result}</span>
        <span style="font-size:11px;color:var(--t2);font-weight:600;text-transform:uppercase;">${won ? 'Won' : lost ? 'Lost' : 'Draw'}</span>
      </div>
      <div style="font-size:12px;color:var(--t2);line-height:1.55">${g.summary}</div>
    </div>

    <div class="rp-sec">
      <div class="rp-lbl">Accuracy rating</div>
      <div class="acc-pair">
        <div class="acc-card">
          <div class="acc-val" style="color:${g.yacc >= 70 ? 'var(--gr)' : g.yacc >= 45 ? 'var(--am)' : 'var(--re)'}">${g.yacc}</div>
          <div class="acc-lbl">You</div>
        </div>
        <div class="acc-card">
          <div class="acc-val" style="color:var(--t2)">${g.oacc}</div>
          <div class="acc-lbl">${opp.slice(0, 10)}</div>
        </div>
      </div>
    </div>

    <div class="rp-sec">
      <div class="rp-lbl">Move quality breakdown</div>
      ${MQ_DATA.map(q => {
        const n = mq[q.k] || 0;
        const pct = Math.round((n / mqTotal) * 100);
        return `<div class="mqrow">
          <div class="mqi" style="color:${q.c}">${q.i}</div>
          <div>
            <div class="mqname" style="color:${q.c};font-weight:600">${q.n}</div>
            <div class="mqbar"><div class="mqfill" style="width:${pct}%;background:${q.c}"></div></div>
          </div>
          <div class="mqn" style="color:${q.c}">${n}</div>
        </div>`;
      }).join('')}
    </div>

    <div class="rp-sec">
      <div class="rp-lbl">Coaching Insights</div>
      ${g.insights.length ? g.insights.map(ins => `
        <div class="ins" style="border-left-color:${ins.s === 'high' ? 'var(--re)' : ins.s === 'medium' ? 'var(--am)' : 'var(--bl)'}">
          <div class="ins-t">${ins.t}</div>
          <div class="ins-b">${ins.b}</div>
        </div>
      `).join('') : '<div style="font-size:11px;color:var(--t3);text-align:center;">No high-severity insights identified. Play more games to trigger pattern scans.</div>'}
    </div>
  `;
}

function navMove(delta) {
  const mvs = GAMES[aGame].moves;
  aMoveIdx = Math.max(-1, Math.min(mvs.length - 1, aMoveIdx + delta));
  renderAnalysis();
}

// ── Patterns dashboard ────────────────────────────────────

function buildDash() {
  // Aggregate across all games
  const allMq = { brilliant:0, best:0, excellent:0, good:0, book:0, inaccuracy:0, mistake:0, blunder:0, missed:0 };
  GAMES.forEach(g => { for (const k in allMq) allMq[k] += (g.mq[k] || 0); });
  const totalMoves = Object.values(allMq).reduce((a, b) => a + b, 0) || 1;

  const wins   = GAMES.filter(g => (g.result==='1-0'&&g.uc==='white')||(g.result==='0-1'&&g.uc==='black')).length;
  const losses = GAMES.filter(g => (g.result==='0-1'&&g.uc==='white')||(g.result==='1-0'&&g.uc==='black')).length;
  const draws  = GAMES.length - wins - losses;
  const avgAcc = (GAMES.reduce((s, g) => s + g.yacc, 0) / GAMES.length).toFixed(1);
  const winPct = Math.round((wins / GAMES.length) * 100);
  const blRate = ((allMq.blunder / totalMoves) * 100).toFixed(1);

  // ── ADVANCED METRIC CALCULATIONS ──
  
  // 1. Tactical Hotspot Square
  const squareTally = {};
  POSITIONS.forEach(pos => {
    if (pos.best && pos.best.length >= 2) {
      const fromSq = pos.best.slice(0, 2);
      squareTally[fromSq] = (squareTally[fromSq] || 0) + 1;
    }
  });
  let worstSq = 'None';
  let worstCount = 0;
  for (const sq in squareTally) {
    if (squareTally[sq] > worstCount) {
      worstSq = sq;
      worstCount = squareTally[sq];
    }
  }

  // 2. Average Theoretical Deviation Depth
  let totalDepthSum = 0;
  let devGamesCount = 0;
  GAMES.forEach(g => {
    let firstDevMove = -1;
    for (let i = 0; i < g.moves.length; i++) {
      const m = g.moves[i];
      if (['inaccuracy', 'mistake', 'blunder'].includes(m.cls)) {
        firstDevMove = Math.ceil((i + 1) / 2);
        break;
      }
    }
    if (firstDevMove !== -1) {
      totalDepthSum += firstDevMove;
      devGamesCount++;
    }
  });
  const avgDeviation = devGamesCount > 0 ? (totalDepthSum / devGamesCount).toFixed(1) : "N/A";

  // 3. Vulnerability per Piece Type
  const pieceLosses = { pawn: 0, knight: 0, bishop: 0, rook: 0, queen: 0, king: 0 };
  const pieceCounts = { pawn: 0, knight: 0, bishop: 0, rook: 0, queen: 0, king: 0 };
  
  const rawApiData = JSON.parse(localStorage.getItem('chess_coach_cached_session') || '{}').apiData;
  if (rawApiData && rawApiData.games) {
    rawApiData.games.forEach(g => {
      g.moves.forEach(m => {
        if (m.is_users_move && m.piece_moved && pieceLosses[m.piece_moved] !== undefined) {
          pieceLosses[m.piece_moved] += m.cp_loss || 0;
          pieceCounts[m.piece_moved]++;
        }
      });
    });
  }

  let worstPieceType = 'None';
  let maxAvgLoss = 0;
  for (const p in pieceLosses) {
    const count = pieceCounts[p] || 1;
    const avg = pieceLosses[p] / count;
    if (avg > maxAvgLoss) {
      maxAvgLoss = avg;
      worstPieceType = p;
    }
  }
  const displayPieceType = worstPieceType.toUpperCase() + ` (${Math.round(maxAvgLoss)} cp loss)`;

  // 4. King Safety Index
  let totalCastlingMove = 0;
  let castledGames = 0;
  if (rawApiData && rawApiData.games) {
    rawApiData.games.forEach(g => {
      let castledAt = -1;
      for (let i = 0; i < g.moves.length; i++) {
        const m = g.moves[i];
        if (m.is_users_move && m.piece_moved === 'king' && ['e1g1', 'e1c1', 'e8g8', 'e8c8'].includes(m.move_uci)) {
          castledAt = Math.ceil((i + 1) / 2);
          break;
        }
      }
      if (castledAt !== -1) {
        totalCastlingMove += castledAt;
        castledGames++;
      }
    });
  }
  const avgCastling = castledGames > 0 ? (totalCastlingMove / castledGames).toFixed(1) : "N/A";
  let safetyGrade = 'Unknown';
  if (avgCastling !== 'N/A') {
    const val = parseFloat(avgCastling);
    safetyGrade = val <= 10 ? 'EXCELLENT' : val <= 15 ? 'WARNING' : 'HAZARDOUS';
  } else {
    safetyGrade = 'SEVERE DANGER';
  }

  document.getElementById('dash-meta').textContent =
    `${GAMES.length} games · ${totalMoves} moves · ${POSITIONS.length} blunder positions`;

  const QDATA = [
    { i:'★', n:'Brilliant',  k:'brilliant', c:'var(--cy)' },
    { i:'!', n:'Best',       k:'best',       c:'var(--gr)' },
    { i:'✓', n:'Excellent',  k:'excellent',  c:'var(--bl)' },
    { i:'▸', n:'Good',       k:'good',       c:'#a08060' },
    { i:'⊞', n:'Book',       k:'book',       c:'#5a3e2e' },
    { i:'≈', n:'Inaccuracy', k:'inaccuracy', c:'var(--bl)' },
    { i:'?', n:'Mistake',    k:'mistake',    c:'var(--am)' },
    { i:'??',n:'Blunder',    k:'blunder',    c:'var(--re)' },
  ];

  document.getElementById('bento').innerHTML = `
    <!-- Bento Row 1: Core KPIs -->
    <div class="bn c1">
      <div class="bn-lbl">Win rate</div>
      <div class="bn-hero" style="color:${winPct>=50?'var(--gr)':'var(--re)'}">${winPct}%</div>
      <div class="bn-sub">${wins}W · ${losses}L · ${draws}D</div>
    </div>
    <div class="bn c1">
      <div class="bn-lbl">Avg accuracy</div>
      <div class="bn-hero" style="color:${avgAcc>=70?'var(--gr)':avgAcc>=45?'var(--am)':'var(--re)'}">${avgAcc}</div>
      <div class="bn-sub">across ${GAMES.length} games</div>
    </div>
    <div class="bn c1">
      <div class="bn-lbl">Blunder rate</div>
      <div class="bn-hero" style="color:${blRate<2.5?'var(--gr)':blRate<5.5?'var(--am)':'var(--re)'}">${blRate}%</div>
      <div class="bn-sub">target: under 2%</div>
    </div>
    <div class="bn c1">
      <div class="bn-lbl">Mistakes saved</div>
      <div class="bn-hero" style="color:var(--oc)">${POSITIONS.length}</div>
      <div class="bn-sub">puzzles to correct</div>
    </div>
    
    <!-- Bento Row 1b: NEW ADVANCED ANALYSIS PILLS -->
    <div class="bn c2">
      <div class="bn-lbl">Tactical Hotspot Matrix</div>
      <div class="bn-hero" style="color:var(--re);text-shadow:0 0 10px rgba(184,60,36,0.3);">${worstSq.toUpperCase()}</div>
      <div class="bn-sub">Worst Coordinate (${worstCount} tactical blunders here)</div>
      <div class="bn-sub2" style="font-size:10px;color:var(--t2);margin-top:6px;line-height:1.4;">Verify your defensive piece alignments on ${worstSq.toUpperCase()}! Make sure pieces aren't left undefended.</div>
    </div>

    <!-- Bento Row 2: Theoretical Deviation & King Safety -->
    <div class="bn c2">
      <div class="bn-lbl">Opening Book Adherence</div>
      <div class="bn-hero" style="color:var(--sp)">M${avgDeviation}</div>
      <div class="bn-sub">Avg move before first inaccuracy</div>
      <div class="bn-sub2" style="font-size:10px;color:var(--t2);margin-top:6px;line-height:1.4;">You typical deviate from book theory around turn ${Math.floor(parseFloat(avgDeviation) || 0)}. Study positional structures beyond book.</div>
    </div>
    <div class="bn c2">
      <div class="bn-lbl">King Safety index</div>
      <div class="bn-hero" style="color:${safetyGrade==='EXCELLENT'?'var(--gr)':safetyGrade==='WARNING'?'var(--am)':'var(--re)'}">${safetyGrade}</div>
      <div class="bn-sub">Castling Turn Average: M${avgCastling}</div>
      <div class="bn-sub2" style="font-size:10px;color:var(--t2);margin-top:6px;line-height:1.4;">King castling speed is evaluated. Castling before move 10 guarantees standard protection.</div>
    </div>
    <div class="bn c2">
      <div class="bn-lbl">Worst handled piece</div>
      <div class="bn-hero" style="color:var(--oc);font-size:26px;line-height:1.7;">${displayPieceType}</div>
      <div class="bn-sub">Highest average centipawn loss</div>
      <div class="bn-sub2" style="font-size:10px;color:var(--t2);margin-top:6px;line-height:1.4;">Your ${worstPieceType} moves suffer from high tactical drops. Double check destination squares for this piece type!</div>
    </div>

    <!-- Bento Row 3: Move distribution + Errors phase -->
    <div class="bn c4">
      <div class="bn-lbl">Move quality overview</div>
      ${QDATA.map(q => {
        const n = allMq[q.k] || 0;
        const pct = Math.round((n / totalMoves) * 100);
        return `<div class="qfrow">
          <span class="qficon" style="color:${q.c}">${q.i}</span>
          <span class="qfname" style="color:${q.c};font-weight:600">${q.n}</span>
          <div class="mqbar"><div class="mqfill" style="width:${pct}%;background:${q.c}"></div></div>
          <span class="qfpct">${pct}%</span>
          <span class="qfcnt">${n}</span>
        </div>`;
      }).join('')}
    </div>
    <div class="bn c2">
      <div class="bn-lbl">Blunders by game phase</div>
      <div>
        <div class="pbar-row"><span class="pbar-lbl">Opening</span><div class="pbar-track"><div class="pbar-fill" style="width:25%;background:var(--am)"></div></div><span class="pbar-val" style="color:var(--am)">25%</span></div>
        <div class="pbar-row"><span class="pbar-lbl">Middlegame</span><div class="pbar-track"><div class="pbar-fill" style="width:75%;background:var(--re)"></div></div><span class="pbar-val" style="color:var(--re)">75%</span></div>
        <div class="pbar-row"><span class="pbar-lbl">Endgame</span><div class="pbar-track"><div class="pbar-fill" style="width:35%;background:var(--am)"></div></div><span class="pbar-val" style="color:var(--am)">35%</span></div>
      </div>
      <div style="margin-top:14px;background:rgba(28,20,16,0.5);border-radius:4px;padding:10px 12px;font-size:11px;color:var(--t2);border-left:3px solid var(--re);line-height:1.5">
        Over 70% of tactical errors occur in the middlegame moves (moves 11–25). Your middlegame decision-making is your biggest improvement lever.
      </div>
    </div>

    <!-- Bento Row 4: Accuracy Chart -->
    <div class="bn c6" style="padding:16px 20px">
      <div class="bn-lbl" style="margin-bottom:12px">Accuracy Trend Over Time</div>
      <canvas id="acc-chart" height="70"></canvas>
    </div>
  `;

  setTimeout(() => {
    const ctx = document.getElementById('acc-chart')?.getContext('2d');
    if (!ctx) return;
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: GAMES.map((_, i) => `Game ${i + 1}`),
        datasets: [
          {
            label: 'You', data: GAMES.map(g => g.yacc),
            borderColor: '#e27d38', backgroundColor: 'rgba(226, 125, 56, 0.06)',
            borderWidth: 3, pointRadius: 5, tension: 0.35, fill: true,
            pointBackgroundColor: '#e27d38',
          },
          {
            label: 'Opponent', data: GAMES.map(g => g.oacc),
            borderColor: '#7d5e4a', backgroundColor: 'transparent',
            borderWidth: 1.8, pointRadius: 4, tension: 0.35,
            borderDash: [4, 4], pointBackgroundColor: '#7d5e4a',
          },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: true,
        plugins: {
          legend: { labels: { color: '#b59b82', font: { size: 11, family: 'Plus Jakarta Sans', weight: '600' } } },
          tooltip: { backgroundColor: '#1a120e', borderColor: '#2c1e16', borderWidth: 1, titleColor: '#f4ece1', bodyColor: '#b59b82' },
        },
        scales: {
          x: { grid: { color: 'rgba(220,120,47,.03)' }, ticks: { color: '#7d5e4a', font: { size: 10, family: 'JetBrains Mono' } } },
          y: { grid: { color: 'rgba(220,120,47,.03)' }, ticks: { color: '#7d5e4a', font: { size: 10, family: 'JetBrains Mono' } }, min: 0, max: 100 },
        },
      },
    });
  }, 60);
}

// ── Blunder Trainer ───────────────────────────────────────

function buildTrainerList() {
  const el = document.getElementById('tlist');
  el.innerHTML = '';

  const byGame = {};
  POSITIONS.forEach((p, i) => {
    if (!byGame[p.gid]) byGame[p.gid] = [];
    byGame[p.gid].push({ ...p, origIdx: i });
  });

  Object.keys(byGame).forEach(gid => {
    const g = GAMES[+gid];
    const opp = g.uc === 'white' ? g.black : g.white;
    const solvedCount = byGame[gid].filter(p => tDone.has(p.origIdx)).length;

    const hdr = document.createElement('div');
    hdr.className = 'tgroup-hdr';
    hdr.innerHTML = `
      <span>vs ${opp.slice(0, 12)}</span>
      <span style="font-family:'JetBrains Mono',monospace">${solvedCount}/${byGame[gid].length}</span>
    `;
    el.appendChild(hdr);

    byGame[gid].forEach(p => {
      const done = tDone.has(p.origIdx);
      const isActive = p.origIdx === tIdx;
      const div = document.createElement('div');
      div.className = 'ti' + (isActive ? ' on' : '');
      div.innerHTML = `
        <div class="ti-top">
          <span class="ti-phase">${p.phase.toUpperCase()} · move ${p.move}</span>
          <span class="ti-cp">−${p.cp}cp</span>
        </div>
        <div class="ti-bottom">
          <span class="ti-dot" style="background:${done ? 'var(--gr)' : isActive ? 'var(--oc)' : 'var(--s4)'}; box-shadow: 0 0 8px ${done ? 'rgba(79, 174, 120, 0.4)' : isActive ? 'rgba(226, 125, 56, 0.4)' : 'transparent'}"></span>
          <span class="ti-status" style="color:${done ? 'var(--gr)' : isActive ? 'var(--sp)' : 'var(--t3)'}">${done ? 'Solved' : isActive ? 'Active' : 'Not tried'}</span>
        </div>
      `;
      div.addEventListener('click', () => {
        tIdx = p.origIdx; tSel = null; tHints = []; tRevealed = false; tChosen = null;
        buildTrainerList(); renderTrainer();
      });
      el.appendChild(div);
    });
  });
}

function renderTrainer() {
  const pos = POSITIONS[tIdx];
  const bFrom = tRevealed ? pos.best.slice(0, 2) : null;
  const bTo   = tRevealed ? pos.best.slice(2, 4) : null;

  const hlFrom = tChosen ? tChosen.slice(0, 2) : null;
  const hlTo   = tChosen ? tChosen.slice(2, 4) : null;

  function handleClick(sq, piece) {
    if (tRevealed) return;

    if (tSel) {
      if (tHints.includes(sq)) {
        const uci = tSel + sq;
        tChosen = uci;
        tRevealed = true;
        const ok = uci === pos.best;
        tScore.c += ok ? 1 : 0;
        tScore.t++;
        if (ok) tDone.add(tIdx);
        tSel = null; tHints = [];
        buildTrainerList();
        renderTrainer();
        return;
      }
      tSel = null; tHints = [];
    }

    const lm = getLegalMoves(pos.fen, sq);
    if (lm.length) {
      tSel = sq; tHints = lm;
    } else {
      tSel = null; tHints = [];
    }
    renderBoard(document.getElementById('tboard'), pos.fen, {
      sel: tSel, hints: tHints, bestFrom: bFrom, bestTo: bTo, hlFrom, hlTo, onClick: handleClick,
    });
  }

  renderBoard(document.getElementById('tboard'), pos.fen, {
    sel: tSel, hints: tHints, bestFrom: bFrom, bestTo: bTo, hlFrom, hlTo, onClick: handleClick,
  });

  const turn = fenTurn(pos.fen);
  document.getElementById('tturn').innerHTML = `
    <div class="tturn-dot" style="background:${turn === 'w' ? '#eed2bc' : '#281c16'}"></div>
    <span>${turn === 'w' ? 'White' : 'Black'} to move</span>
  `;

  const acc = tScore.t ? Math.round((tScore.c / tScore.t) * 100) : null;
  document.getElementById('tscore').innerHTML = `
    <div class="tpill">Puzzle ${tIdx + 1} of ${POSITIONS.length}</div>
    <div class="tpill${acc !== null && acc >= 70 ? ' ac' : ''}">
      ${tScore.c} / ${tScore.t} correct${acc !== null ? ' · ' + acc + '%' : ''}
    </div>
    ${tDone.size >= 1 ? `<div class="tpill ac">${tDone.size} solved</div>` : ''}
  `;

  const dotsEl = document.getElementById('pdots');
  dotsEl.innerHTML = '';
  POSITIONS.forEach((_, i) => {
    const d = document.createElement('button');
    d.className = 'pdot';
    d.style.cssText = `width:${i === tIdx ? 18 : 7}px;background:${i === tIdx ? 'var(--oc)' : tDone.has(i) ? 'rgba(79, 174, 120, .6)' : 'rgba(255,255,255,.08)'}`;
    d.addEventListener('click', () => {
      tIdx = i; tSel = null; tHints = []; tRevealed = false; tChosen = null;
      buildTrainerList(); renderTrainer();
    });
    dotsEl.appendChild(d);
  });

  renderTrainerPanel(pos);
}

function renderTrainerPanel(pos) {
  const panel = document.getElementById('tpanel');
  const isCorrect = tChosen && tChosen === pos.best;

  let resultHTML = '';
  if (tRevealed) {
    if (tChosen) {
      resultHTML = `
        <div class="result-box ${isCorrect ? 'rb-ok' : 'rb-err'}">
          <div class="rb-icon" style="color:${isCorrect ? 'var(--gr)' : 'var(--re)'}">${isCorrect ? '✓' : '✗'}</div>
          <div>
            <div class="rb-title" style="color:${isCorrect ? 'var(--gr)' : 'var(--re)'}">${isCorrect ? 'Correct!' : 'Not quite'}</div>
            <div class="rb-sub">
              ${isCorrect
                ? 'You successfully found the engine\'s recommended corrective choice.'
                : `You played <code>${tChosen}</code> · best was <code style="color:var(--gr)">${pos.best}</code>`}
            </div>
          </div>
        </div>
        <div class="tp-explain">${pos.explain}</div>
      `;
    } else {
      resultHTML = `
        <div class="result-box rb-rev">
          <div class="rb-icon" style="color:var(--oc)">→</div>
          <div>
            <div class="rb-title" style="color:var(--oc)">Best move: <code style="font-family:'JetBrains Mono',monospace">${pos.best}</code></div>
            <div class="rb-sub">Highlighted in green outline on the board</div>
          </div>
        </div>
        <div class="tp-explain">${pos.explain}</div>
      `;
    }
  }

  panel.innerHTML = `
    <div class="tags">
      <span class="tag tag-oc">${pos.phase}</span>
      <span class="tag tag-mu">Move ${pos.move}</span>
      <span class="tag tag-re">−${pos.cp} cp</span>
      <span class="tag tag-bl">${pos.glabel}</span>
    </div>

    <div class="tp-q">
      Find the corrective move for ${fenTurn(pos.fen) === 'w' ? 'White' : 'Black'}
    </div>

    <div class="tp-ctx">
      You played <code>${pos.played}</code> in this game, causing an engine centipawn drop of
      <strong>${pos.cp} cp</strong>.
      Can you locate the best positional correction?
    </div>

    ${resultHTML}

    ${!tRevealed ? `<button class="reveal-btn" onclick="doReveal()">Show best move</button>` : ''}

    <div class="tnav">
      <button class="tnbtn" onclick="tNav(-1)" ${tIdx === 0 ? 'disabled' : ''}>← Prev</button>
      <button class="tnbtn" onclick="doReset()">↺ Retry</button>
      <button class="tnbtn pri" onclick="tNav(1)" ${tIdx === POSITIONS.length - 1 ? 'disabled' : ''}>Next →</button>
    </div>
  `;
}

function doReveal() {
  tRevealed = true; tScore.t++;
  buildTrainerList(); renderTrainer();
}

function doReset() {
  tSel = null; tHints = []; tRevealed = false; tChosen = null;
  renderTrainer();
}

function tNav(d) {
  tIdx = Math.max(0, Math.min(POSITIONS.length - 1, tIdx + d));
  tSel = null; tHints = []; tRevealed = false; tChosen = null;
  buildTrainerList(); renderTrainer();
}

// ── Screen switching ──────────────────────────────────────

function showScreen(id, btn) {
  document.querySelectorAll('.scr').forEach(s => s.classList.remove('on'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('on'));
  
  // Set target screen active
  document.getElementById(id).classList.add('on');
  
  if (btn) {
    if (typeof btn.classList.add === 'function') {
      btn.classList.add('on');
    } else {
      const tabEl = document.getElementById(`tab-${id}`);
      if (tabEl) tabEl.classList.add('on');
    }
  }

  // Adjust global body scrollbar block based on screen context
  if (id === 'landing') {
    document.body.style.overflow = 'auto'; // Allow landing page scrolling
  } else {
    document.body.style.overflow = 'hidden'; // Block clashing app dual-scrolls
  }
}

// ── Keyboard navigation (analysis board) ─────────────────

document.addEventListener('keydown', e => {
  const active = document.getElementById('sa');
  if (!active.classList.contains('on')) return;
  if (e.key === 'ArrowLeft')  navMove(-1);
  if (e.key === 'ArrowRight') navMove(1);
  if (e.key === 'ArrowUp')    navMove(-999);
  if (e.key === 'ArrowDown')  navMove(999);
});

// ── Data Fetching & Setup ─────────────────────────────────

async function startAnalysis() {
  const user = document.getElementById('username-input').value.trim();
  const count = document.getElementById('count-input').value;
  const errEl = document.getElementById('land-err');

  if (!user) {
    errEl.textContent = 'Please enter a Chess.com username.';
    errEl.style.display = 'block';
    return;
  }
  errEl.style.display = 'none';

  document.getElementById('load-user').textContent = user;
  showScreen('loading', null);

  try {
    const res = await fetch('/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: user, game_count: parseInt(count, 10) })
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail || 'Failed to fetch games');
    }

    const data = await res.json();
    
    localStorage.setItem('chess_coach_cached_session', JSON.stringify({
      username: user,
      apiData: data
    }));

    loadSessionData(data, user);

  } catch (err) {
    showScreen('landing', null);
    errEl.textContent = err.message;
    errEl.style.display = 'block';
  }
}

function loadSessionData(data, username) {
  transformData(data, username);

  aGame = 0; aMoveIdx = -1; tIdx = 0;
  tSel = null; tHints = []; tRevealed = false; tChosen = null; tScore = { c: 0, t: 0 }; tDone.clear();
  
  if (GAMES.length === 0) {
    throw new Error('No games found for this user.');
  }

  buildGameList();
  renderAnalysis();
  buildDash();
  buildTrainerList();
  renderTrainer();

  showScreen('sa', document.getElementById('tab-sa'));

  const resumeBtn = document.getElementById('btn-resume');
  if (resumeBtn) {
    resumeBtn.style.display = 'block';
    resumeBtn.textContent = `Resume Session (${username})`;
  }
}

function resumeSession() {
  const cached = localStorage.getItem('chess_coach_cached_session');
  if (!cached) return;
  try {
    const parsed = JSON.parse(cached);
    if (parsed && parsed.username && parsed.apiData) {
      loadSessionData(parsed.apiData, parsed.username);
    }
  } catch (e) {
    console.error('Failed to parse cached session:', e);
    localStorage.removeItem('chess_coach_cached_session');
  }
}

function transformData(apiData, username) {
  POSITIONS = (apiData.blunder_positions || []).map((bp, i) => ({
    gid: 0,
    glabel: 'vs Opponent',
    phase: bp.phase,
    move: bp.move_number || '?', 
    fen: bp.fen,
    played: bp.move_played,
    best: bp.best_move,
    cp: bp.cp_loss,
    explain: 'Engine recommends ' + bp.best_move
  }));

  GAMES = (apiData.games || []).map((g, i) => {
    let yacc = 0, oacc = 0, yCount = 0, oCount = 0;
    let mq = { brilliant:0, best:0, excellent:0, good:0, book:0, inaccuracy:0, mistake:0, blunder:0, missed:0 };
    
    g.moves.forEach(m => {
      const accScore = getAcc(m.classification);
      if (m.is_users_move) {
        yCount++;
        if (m.classification && mq[m.classification] !== undefined) {
          mq[m.classification]++;
        }
        yacc += accScore;
      } else {
        oCount++;
        oacc += accScore;
      }
    });

    const yaccFinal = yCount > 0 ? (yacc / yCount).toFixed(1) : "0.0";
    const oaccFinal = oCount > 0 ? (oacc / oCount).toFixed(1) : "0.0";
    const opp = g.user_color === 'white' ? 'Black' : 'White';
    
    if (apiData.blunder_positions) {
      apiData.blunder_positions.forEach((bp, bi) => {
        if (bp.game_date === g.date && POSITIONS[bi]) {
          POSITIONS[bi].gid = i;
          POSITIONS[bi].glabel = 'vs ' + opp;
        }
      });
    }

    const won = (g.result === '1-0' && g.user_color === 'white') || (g.result === '0-1' && g.user_color === 'black');
    const lost = (g.result === '0-1' && g.user_color === 'white') || (g.result === '1-0' && g.user_color === 'black');

    let summaryText = 'A balanced game.';
    if (won) summaryText = 'You outplayed your opponent in this game.';
    if (lost) summaryText = 'Your opponent found better tactical opportunities.';

    return {
      id: i,
      white: g.user_color === 'white' ? username : opp,
      black: g.user_color === 'black' ? username : opp,
      result: g.result,
      uc: g.user_color,
      date: g.date || 'Unknown',
      tc: g.time_control || 'Unknown',
      yacc: parseFloat(yaccFinal),
      oacc: parseFloat(oaccFinal),
      summary: summaryText,
      mq: mq,
      insights: apiData.insights.slice(0, 3).map(ins => ({ s:'medium', t: ins.title, b: ins.detail })),
      moves: g.moves.map(m => ({ san: m.move_san, uci: m.move_uci, cls: m.classification, fen: m.fen_after }))
    };
  });
}

function getAcc(cls) {
  if (['brilliant', 'best', 'book'].includes(cls)) return 100;
  if (cls === 'excellent') return 90;
  if (cls === 'good') return 80;
  if (cls === 'inaccuracy') return 55;
  if (cls === 'mistake') return 25;
  return 0; // blunder, missed
}

function exitToLanding() {
  showScreen('landing', null);
  const landEl = document.getElementById('landing');
  if (landEl) landEl.scrollTop = 0;
}

// ── THREE.JS 3D SCROLL-DRIVEN GRAVITY PIPELINE ───────────────

let threeScene, threeCamera, threeRenderer, threeParticles;
let checkmateRingMesh; // Holographic pulsing ring
let threePiecesMap = []; // Holds arrays of { mesh, targetY, targetX, targetZ, fallStart, fallEnd }
let mouseX = 0, mouseY = 0;
const clock = new THREE.Clock();

function initThreeJS() {
  const canvas = document.getElementById('three-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  // Scene
  threeScene = new THREE.Scene();
  threeScene.fog = new THREE.FogExp2(0x0a0705, 0.015);

  // Camera
  threeCamera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  threeCamera.position.set(0, 11, 15);
  threeCamera.lookAt(0, 0, 0);

  // Renderer
  threeRenderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
  threeRenderer.setSize(window.innerWidth, window.innerHeight);
  threeRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Lights
  const ambientLight = new THREE.AmbientLight(0x2c1d15, 2.0);
  threeScene.add(ambientLight);

  const spotLight = new THREE.SpotLight(0xe27d38, 12, 50, Math.PI / 4, 0.5, 1);
  spotLight.position.set(6, 14, 6);
  threeScene.add(spotLight);

  const fillLight = new THREE.DirectionalLight(0xf0ab6c, 0.9);
  fillLight.position.set(-6, 8, -6);
  threeScene.add(fillLight);

  // Chess Board
  const boardGroup = new THREE.Group();
  const squareSize = 1.35;
  const squareHeight = 0.25;

  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const isLt = (r + f) % 2 === 0;
      const geo = new THREE.BoxGeometry(squareSize, squareHeight, squareSize);
      
      let mat;
      if (isLt) {
        mat = new THREE.MeshStandardMaterial({
          color: 0xe27d38,
          roughness: 0.1,
          metalness: 0.9,
          transparent: true,
          opacity: 0.22,
          wireframe: true
        });
      } else {
        mat = new THREE.MeshStandardMaterial({
          color: 0x1f140f,
          roughness: 0.7,
          metalness: 0.8,
          transparent: true,
          opacity: 0.65
        });
      }

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(
        (f - 3.5) * squareSize,
        0,
        (r - 3.5) * squareSize
      );
      
      if (r === 0 && f === 4) {
        mesh.userData = { checkmateTile: true, defaultColor: 0x1f140f };
      }
      
      boardGroup.add(mesh);
    }
  }
  threeScene.add(boardGroup);

  // Holographic Pulsing Checkmate laser ring under e8 King
  const ringGeo = new THREE.RingGeometry(0.5, 0.65, 32);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xb83c24, transparent: true, opacity: 0, side: THREE.DoubleSide });
  checkmateRingMesh = new THREE.Mesh(ringGeo, ringMat);
  const e8X = (4 - 3.5) * squareSize;
  const e8Z = (0 - 3.5) * squareSize;
  checkmateRingMesh.position.set(e8X, 0.26, e8Z);
  checkmateRingMesh.rotation.x = -Math.PI / 2;
  threeScene.add(checkmateRingMesh);

  // Glowing Chess Pieces Group (FULL 31-PIECE LAYOUT FOR SCHOLAR'S MATE)
  const pieceGroup = new THREE.Group();

  function createPieceGeometry(type, isWhite) {
    const group = new THREE.Group();
    
    // Solid shiny materials (Cream Gold for White, Obsidian Charcoal for Black)
    const matPiece = isWhite 
      ? new THREE.MeshStandardMaterial({ color: 0xf7efe4, metalness: 0.9, roughness: 0.15, emissive: 0xf7dac4, emissiveIntensity: 0.25 })
      : new THREE.MeshStandardMaterial({ color: 0x221712, metalness: 0.85, roughness: 0.25, emissive: 0xb83c24, emissiveIntensity: 0.15 });

    const matCollar = new THREE.MeshStandardMaterial({ color: isWhite ? 0xf0ab6c : 0xb83c24, metalness: 0.9, roughness: 0.2, wireframe: true });

    // Base collar
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.42, 0.18, 16), matCollar);
    group.add(base);

    if (type === 'Pawn') {
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.28, 0.65, 16), matPiece);
      trunk.position.y = 0.4;
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 16), matPiece);
      head.position.y = 0.8;
      group.add(trunk, head);
    } 
    else if (type === 'Rook') {
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.3, 0.75, 16), matPiece);
      trunk.position.y = 0.45;
      const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.26, 0.28, 16), matPiece);
      crown.position.y = 0.9;
      group.add(trunk, crown);
    } 
    else if (type === 'Bishop') {
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, 0.8, 16), matPiece);
      trunk.position.y = 0.48;
      
      const headGeo = new THREE.SphereGeometry(0.26, 16, 16);
      const head = new THREE.Mesh(headGeo, matPiece);
      head.scale.set(1, 1.4, 1);
      head.position.y = 0.95;
      
      const tip = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), matPiece);
      tip.position.y = 1.35;
      
      group.add(trunk, head, tip);
    }
    else if (type === 'Knight') {
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 0.6, 16), matPiece);
      trunk.position.y = 0.35;
      
      // Curved Horse Muzzle Box
      const snout = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.32, 0.45), matPiece);
      snout.position.set(0, 0.65, 0.1);
      snout.rotation.x = 0.25;
      
      // Ears
      const earL = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.18, 4), matPiece);
      earL.position.set(-0.08, 0.82, -0.08);
      const earR = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.18, 4), matPiece);
      earR.position.set(0.08, 0.82, -0.08);
      
      group.add(trunk, snout, earL, earR);
    }
    else if (type === 'Queen') {
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 0.9, 16), matPiece);
      trunk.position.y = 0.5;
      const top = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.48, 8), matPiece);
      top.position.y = 1.0;
      top.rotation.x = Math.PI;
      group.add(trunk, top);
    }
    else { // King
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.32, 0.95, 16), matPiece);
      trunk.position.y = 0.55;
      
      // Horizontal cross slab
      const crossH = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.08, 0.08), matPiece);
      crossH.position.set(0, 1.15, 0);
      // Vertical cross slab
      const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.35, 0.08), matPiece);
      crossV.position.set(0, 1.15, 0);
      
      group.add(trunk, crossH, crossV);
    }

    // Scale mesh larger for rich visual weight
    group.scale.set(1.15, 1.15, 1.15);
    return group;
  }

  // ── COMPLETE 31-PIECE SCHOLAR'S MATE LAYOUT ──
  // Floating Visible Hover Altitude = 4.2
  const checkmateSpawns = [
    // ── WHITE PIECES ──
    { type: 'Queen',  r: 1, f: 5, isWhite: true,  fallStart: 0.75, fallEnd: 0.90 }, // delivers mate on f7
    { type: 'Bishop', r: 4, f: 2, isWhite: true,  fallStart: 0.30, fallEnd: 0.45 }, // f1 to c4
    { type: 'Pawn',   r: 4, f: 4, isWhite: true,  fallStart: 0.02, fallEnd: 0.15 }, // e2 to e4
    { type: 'King',   r: 7, f: 6, isWhite: true,  fallStart: 0.55, fallEnd: 0.70 }, // castled on g1
    { type: 'Rook',   r: 7, f: 5, isWhite: true,  fallStart: 0.58, fallEnd: 0.72 }, // f1 rook
    { type: 'Rook',   r: 7, f: 0, isWhite: true,  fallStart: 0.50, fallEnd: 0.65 }, // a1 rook
    { type: 'Bishop', r: 7, f: 2, isWhite: true,  fallStart: 0.35, fallEnd: 0.50 }, // c1 bishop
    { type: 'Knight', r: 5, f: 2, isWhite: true,  fallStart: 0.38, fallEnd: 0.52 }, // c3 knight
    { type: 'Knight', r: 5, f: 5, isWhite: true,  fallStart: 0.40, fallEnd: 0.55 }, // f3 knight
    
    { type: 'Pawn',   r: 6, f: 0, isWhite: true,  fallStart: 0.12, fallEnd: 0.25 }, // a2
    { type: 'Pawn',   r: 6, f: 1, isWhite: true,  fallStart: 0.14, fallEnd: 0.28 }, // b2
    { type: 'Pawn',   r: 6, f: 2, isWhite: true,  fallStart: 0.15, fallEnd: 0.30 }, // c2
    { type: 'Pawn',   r: 6, f: 3, isWhite: true,  fallStart: 0.16, fallEnd: 0.32 }, // d2
    { type: 'Pawn',   r: 6, f: 5, isWhite: true,  fallStart: 0.18, fallEnd: 0.33 }, // f2
    { type: 'Pawn',   r: 6, f: 6, isWhite: true,  fallStart: 0.20, fallEnd: 0.34 }, // g2
    { type: 'Pawn',   r: 6, f: 7, isWhite: true,  fallStart: 0.22, fallEnd: 0.35 }, // h2

    // ── BLACK PIECES ──
    { type: 'King',   r: 0, f: 4, isWhite: false, fallStart: 0.60, fallEnd: 0.75 }, // checkmated on e8
    { type: 'Queen',  r: 1, f: 4, isWhite: false, fallStart: 0.72, fallEnd: 0.85 }, // blocking on e7
    { type: 'Pawn',   r: 3, f: 4, isWhite: false, fallStart: 0.05, fallEnd: 0.18 }, // e7 to e5
    { type: 'Bishop', r: 3, f: 2, isWhite: false, fallStart: 0.32, fallEnd: 0.48 }, // f8 to c5
    { type: 'Bishop', r: 2, f: 4, isWhite: false, fallStart: 0.34, fallEnd: 0.50 }, // e6 bishop
    { type: 'Rook',   r: 0, f: 0, isWhite: false, fallStart: 0.52, fallEnd: 0.66 }, // a8 rook
    { type: 'Rook',   r: 0, f: 7, isWhite: false, fallStart: 0.54, fallEnd: 0.68 }, // h8 rook
    { type: 'Knight', r: 2, f: 2, isWhite: false, fallStart: 0.42, fallEnd: 0.56 }, // c6 knight
    { type: 'Knight', r: 2, f: 7, isWhite: false, fallStart: 0.44, fallEnd: 0.58 }, // h6 knight

    { type: 'Pawn',   r: 1, f: 0, isWhite: false, fallStart: 0.22, fallEnd: 0.34 }, // a7
    { type: 'Pawn',   r: 1, f: 1, isWhite: false, fallStart: 0.23, fallEnd: 0.35 }, // b7
    { type: 'Pawn',   r: 1, f: 2, isWhite: false, fallStart: 0.24, fallEnd: 0.36 }, // c7
    { type: 'Pawn',   r: 2, f: 3, isWhite: false, fallStart: 0.18, fallEnd: 0.30 }, // d7 to d6
    { type: 'Pawn',   r: 1, f: 6, isWhite: false, fallStart: 0.26, fallEnd: 0.38 }, // g7
    { type: 'Pawn',   r: 1, f: 7, isWhite: false, fallStart: 0.28, fallEnd: 0.40 }  // h7
  ];

  checkmateSpawns.forEach(spawn => {
    const mesh = createPieceGeometry(spawn.type, spawn.isWhite);
    
    const targetX = (spawn.f - 3.5) * squareSize;
    const targetZ = (spawn.r - 3.5) * squareSize;
    const targetY = 0.25;

    // Suspends floating inside viewport initially (y = 4.2)
    mesh.position.set(targetX, 4.2, targetZ);
    pieceGroup.add(mesh);

    threePiecesMap.push({
      mesh: mesh,
      targetX: targetX,
      targetY: targetY,
      targetZ: targetZ,
      fallStart: spawn.fallStart,
      fallEnd: spawn.fallEnd
    });
  });
  threeScene.add(pieceGroup);

  // Drifting dust particles
  const particleCount = 180;
  const particleGeometry = new THREE.BufferGeometry();
  const particlePositions = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount * 3; i += 3) {
    particlePositions[i] = (Math.random() - 0.5) * 32;     // X
    particlePositions[i + 1] = Math.random() * 16;          // Y
    particlePositions[i + 2] = (Math.random() - 0.5) * 32; // Z
  }

  particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

  const particleMaterial = new THREE.PointsMaterial({
    color: 0xf0ab6c,
    size: 0.08,
    transparent: true,
    opacity: 0.55,
    blending: THREE.AdditiveBlending
  });

  threeParticles = new THREE.Points(particleGeometry, particleMaterial);
  threeScene.add(threeParticles);

  // Resize and mouse parallax listeners
  window.addEventListener('resize', onWindowResize);
  window.addEventListener('mousemove', onMouseMove);

  // Scroll listener for landing showcase page
  const landingEl = document.getElementById('landing');
  if (landingEl) {
    landingEl.addEventListener('scroll', () => {
      const maxScroll = landingEl.scrollHeight - landingEl.clientHeight;
      const scrollPercent = landingEl.scrollTop / (maxScroll || 1);
      updateThreeJSScroll(scrollPercent);
    });
  }

  // Set initial scroll heights
  updateThreeJSScroll(0);

  // Start Animation Loop
  animate();
}

function onWindowResize() {
  if (!threeRenderer || !threeCamera) return;
  threeCamera.aspect = window.innerWidth / window.innerHeight;
  threeCamera.updateProjectionMatrix();
  threeRenderer.setSize(window.innerWidth, window.innerHeight);
}

function onMouseMove(event) {
  mouseX = (event.clientX / window.innerWidth - 0.5) * 2.5;
  mouseY = (event.clientY / window.innerHeight - 0.5) * 2.5;
}

// Maps scroll percentage to gravity pieces fall physics & zoom pivots
function updateThreeJSScroll(scrollPercent) {
  // 1. Update Pieces Altitude (Gravity fall with decay mechanical spring bounce)
  threePiecesMap.forEach(item => {
    const { mesh, targetY, fallStart, fallEnd } = item;
    
    if (scrollPercent <= fallStart) {
      // Hovering suspended inside viewport on load
      mesh.position.y = 4.2;
    } 
    else if (scrollPercent >= fallEnd) {
      // Landed. Apply decay mechanical spring bounce
      const bounceTime = (scrollPercent - fallEnd) * 12; // Speed up mechanical bounce
      const bounceDecayHeight = Math.exp(-bounceTime * 1.8) * Math.abs(Math.sin(bounceTime * Math.PI)) * 1.1;
      mesh.position.y = targetY + bounceDecayHeight;
    } 
    else {
      // In-flight falling gravity
      const flightProgress = (scrollPercent - fallStart) / (fallEnd - fallStart);
      mesh.position.y = 4.2 * (1 - flightProgress) + targetY;
    }
  });

  // 2. Camera Pivots (Eleveated floating overview at top, dramatic low-angle close-up at bottom)
  if (threeCamera) {
    const startPos = { x: 0, y: 11, z: 15 };
    const endPos   = { x: 0.8, y: 1.8, z: -3.8 }; // Tighter close-up zoom looking at checkmate
    
    const curX = startPos.x * (1 - scrollPercent) + endPos.x * scrollPercent;
    const curY = startPos.y * (1 - scrollPercent) + endPos.y * scrollPercent;
    const curZ = startPos.z * (1 - scrollPercent) + endPos.z * scrollPercent;

    threeCamera.position.set(curX + mouseX * 0.25, curY + mouseY * 0.25, curZ + mouseY * 0.25);
    
    const centerLook = { x: 0, y: 0, z: 0 };
    const e8SquareX = (4 - 3.5) * 1.35; // e8 file coord
    const e8SquareZ = (0 - 3.5) * 1.35; // e8 rank coord
    const checkmateLook = { x: e8SquareX + 0.5, y: 0.3, z: e8SquareZ + 0.5 }; // Focus on checkmate confrontation

    const lookX = centerLook.x * (1 - scrollPercent) + checkmateLook.x * scrollPercent;
    const lookY = centerLook.y * (1 - scrollPercent) + checkmateLook.y * scrollPercent;
    const lookZ = centerLook.z * (1 - scrollPercent) + checkmateLook.z * scrollPercent;

    threeCamera.lookAt(lookX, lookY, lookZ);
  }

  // 3. Pulsing red holographic checkmate warning ring on e8 tile
  if (checkmateRingMesh) {
    if (scrollPercent >= 0.85) {
      // Pulse red glow opacity and size
      const pulse = Math.sin(clock.getElapsedTime() * 8) * 0.45 + 0.5;
      checkmateRingMesh.material.opacity = 0.5 + pulse * 0.45;
      
      const scale = 1 + Math.sin(clock.getElapsedTime() * 4) * 0.08;
      checkmateRingMesh.scale.set(scale, scale, 1);
    } else {
      checkmateRingMesh.material.opacity = 0;
    }
  }

  // 4. Board checkmate tile pulsing highlight
  if (threeScene) {
    threeScene.traverse(child => {
      if (child.userData && child.userData.checkmateTile) {
        if (scrollPercent >= 0.85) {
          const pulse = Math.sin(clock.getElapsedTime() * 6) * 0.5 + 0.5;
          child.material.color.setHex(0xb83c24);
          child.material.opacity = 0.5 + pulse * 0.4;
        } else {
          child.material.color.setHex(child.userData.defaultColor);
          child.material.opacity = 0.65;
        }
      }
    });
  }
}

function animate() {
  requestAnimationFrame(animate);
  const time = clock.getElapsedTime();

  const landingEl = document.getElementById('landing');
  const scrollPercent = landingEl ? landingEl.scrollTop / ((landingEl.scrollHeight - landingEl.clientHeight) || 1) : 0;

  // Gentle piece floating animations
  threePiecesMap.forEach(item => {
    const isLanded = scrollPercent >= item.fallEnd;
    const isHovering = scrollPercent <= item.fallStart;
    
    if (isLanded) {
      const bounceTime = (scrollPercent - item.fallEnd) * 12;
      const bounceDecayHeight = Math.exp(-bounceTime * 1.8) * Math.abs(Math.sin(bounceTime * Math.PI)) * 1.1;
      
      // Floating offset
      const floatOffset = Math.sin(time * 1.5 + item.mesh.position.x) * 0.04;
      item.mesh.position.y = item.targetY + bounceDecayHeight + floatOffset;
      item.mesh.rotation.y += 0.002;
    }
    else if (isHovering) {
      // Hovering suspended floating offset
      const floatOffset = Math.sin(time * 1.2 + item.mesh.position.x * 2) * 0.08;
      item.mesh.position.y = 4.2 + floatOffset;
      item.mesh.rotation.y += 0.003;
    }
  });

  // Slow drifting particles
  if (threeParticles) {
    const pos = threeParticles.geometry.attributes.position.array;
    for (let i = 1; i < pos.length; i += 3) {
      pos[i] += 0.007;
      if (pos[i] > 16) {
        pos[i] = 0;
      }
    }
    threeParticles.geometry.attributes.position.needsUpdate = true;
  }

  // Holographic red checkmate ring update
  if (checkmateRingMesh && scrollPercent >= 0.85) {
    const pulse = Math.sin(time * 8) * 0.45 + 0.5;
    checkmateRingMesh.material.opacity = 0.45 + pulse * 0.45;
    const scale = 1 + Math.sin(time * 4) * 0.08;
    checkmateRingMesh.scale.set(scale, scale, 1);
  }

  if (threeRenderer && threeScene && threeCamera) {
    threeRenderer.render(threeScene, threeCamera);
  }
}

// ── Page Initialization Hooks ───────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  // 1. Setup Click listener on nav logo to easily go back to landing screen
  const logo = document.getElementById('nav-logo');
  if (logo) {
    logo.style.cursor = 'pointer';
    logo.addEventListener('click', exitToLanding);
  }

  // 2. Search and restore session cache
  const cached = localStorage.getItem('chess_coach_cached_session');
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (parsed && parsed.username && parsed.apiData) {
        const resumeBtn = document.getElementById('btn-resume');
        if (resumeBtn) {
          resumeBtn.style.display = 'block';
          resumeBtn.textContent = `Resume Session (${parsed.username})`;
        }
      }
    } catch (e) {
      localStorage.removeItem('chess_coach_cached_session');
    }
  }

  // 3. Kickstart 3D WebGL background
  if (typeof THREE !== 'undefined') {
    initThreeJS();
  } else {
    console.warn('Three.js library not loaded. Falling back to static gradient rendering.');
  }
});
