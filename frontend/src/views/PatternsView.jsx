import React, { useRef, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import useChessStore from '../store/useChessStore';

// ── Metric calculations ────────────────────────────────────

function computeMetrics(games, positions, apiData) {
  const allMq = { brilliant:0,best:0,excellent:0,good:0,book:0,inaccuracy:0,mistake:0,blunder:0 };
  games.forEach(g => { for (const k in allMq) allMq[k] += (g.mq[k] || 0); });
  const totalMoves = Object.values(allMq).reduce((a,b) => a+b, 0) || 1;

  const wins   = games.filter(g => g.won).length;
  const losses = games.filter(g => g.lost).length;
  const draws  = games.length - wins - losses;
  const avgAcc = (games.reduce((s,g) => s + g.yacc, 0) / games.length).toFixed(1);
  const winPct = Math.round((wins / games.length) * 100);
  const blRate = ((allMq.blunder / totalMoves) * 100).toFixed(1);

  // Tactical hotspot
  const squareTally = {};
  positions.forEach(pos => {
    if (pos.best && pos.best.length >= 2) {
      const sq = pos.best.slice(0,2);
      squareTally[sq] = (squareTally[sq] || 0) + 1;
    }
  });
  let worstSq = 'None', worstCount = 0;
  for (const sq in squareTally) {
    if (squareTally[sq] > worstCount) { worstSq = sq; worstCount = squareTally[sq]; }
  }

  // Opening deviation depth
  let depthSum = 0, devGames = 0;
  games.forEach(g => {
    let firstDev = -1;
    for (let i = 0; i < g.moves.length; i++) {
      if (['inaccuracy','mistake','blunder'].includes(g.moves[i].cls)) { firstDev = Math.ceil((i+1)/2); break; }
    }
    if (firstDev !== -1) { depthSum += firstDev; devGames++; }
  });
  const avgDeviation = devGames > 0 ? (depthSum / devGames).toFixed(1) : 'N/A';

  // Game phase blunder distribution
  const phaseBl = { opening: 0, middlegame: 0, endgame: 0 };
  games.forEach(g => {
    g.moves.forEach(m => {
      if (m.cls === 'blunder' && m.phase) phaseBl[m.phase] = (phaseBl[m.phase] || 0) + 1;
    });
  });
  const totalPhBl = Object.values(phaseBl).reduce((a,b) => a+b, 0) || 1;

  return { allMq, totalMoves, wins, losses, draws, avgAcc, winPct, blRate, worstSq, worstCount, avgDeviation, phaseBl, totalPhBl };
}

// ── Simple bar chart without Chart.js ─────────────────────

function AccuracyTrend({ games }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.offsetWidth, H = canvas.offsetHeight;
    canvas.width = W * devicePixelRatio;
    canvas.height = H * devicePixelRatio;
    ctx.scale(devicePixelRatio, devicePixelRatio);

    ctx.clearRect(0, 0, W, H);
    const data = games.map(g => g.yacc);
    const oData = games.map(g => g.oacc);
    const n = data.length;
    if (n < 2) return;

    const px = (i) => (i / (n-1)) * (W - 32) + 16;
    const py = (v) => H - 16 - ((v / 100) * (H - 32));

    // Grid lines
    ctx.strokeStyle = 'rgba(220,120,47,0.06)';
    ctx.lineWidth = 1;
    [25, 50, 75].forEach(y => {
      ctx.beginPath(); ctx.moveTo(16, py(y)); ctx.lineTo(W-16, py(y)); ctx.stroke();
    });

    // Opponent line
    ctx.beginPath(); ctx.strokeStyle = 'rgba(180,140,100,0.5)'; ctx.lineWidth = 1.5; ctx.setLineDash([4,4]);
    oData.forEach((v,i) => i === 0 ? ctx.moveTo(px(i),py(v)) : ctx.lineTo(px(i),py(v)));
    ctx.stroke(); ctx.setLineDash([]);

    // User line
    const grad = ctx.createLinearGradient(0,0,W,0);
    grad.addColorStop(0,'#E27D38'); grad.addColorStop(1,'#F0AB6C');
    ctx.beginPath(); ctx.strokeStyle = grad; ctx.lineWidth = 2.5;
    data.forEach((v,i) => i === 0 ? ctx.moveTo(px(i),py(v)) : ctx.lineTo(px(i),py(v)));
    ctx.stroke();

    // Dots
    data.forEach((v,i) => {
      ctx.beginPath(); ctx.arc(px(i),py(v),4,0,Math.PI*2);
      ctx.fillStyle = '#E27D38'; ctx.fill();
    });

    // Labels
    ctx.font = '9px JetBrains Mono, monospace';
    ctx.fillStyle = 'rgba(122,94,75,0.8)';
    data.forEach((v,i) => {
      ctx.fillText(`G${i+1}`, px(i)-5, H-4);
    });
  }, [games]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full"
      style={{ height: '110px' }}
    />
  );
}

// ── Custom SVG Radar Chart ─────────────────────────────────

function RadarChart({ profile }) {
  if (!profile) return null;
  const cx = 110, cy = 110, r = 72;

  const axes = [
    { name: 'Safety', key: 'safety' },
    { name: 'Aggressive', key: 'aggression' },
    { name: 'Complexity', key: 'complexity' },
    { name: 'Patience', key: 'patience' },
    { name: 'Depth', key: 'depth' }
  ];

  const getXY = (val, idx) => {
    const angle = (idx * 2 * Math.PI / 5) - Math.PI / 2;
    const factor = Math.max(0.1, val / 100);
    const x = cx + r * factor * Math.cos(angle);
    const y = cy + r * factor * Math.sin(angle);
    return { x, y };
  };

  const ringPoints = (factor) => {
    return Array(5).fill(0).map((_, i) => {
      const angle = (i * 2 * Math.PI / 5) - Math.PI / 2;
      const x = cx + r * factor * Math.cos(angle);
      const y = cy + r * factor * Math.sin(angle);
      return `${x},${y}`;
    }).join(' ');
  };

  const polyPoints = axes.map((ax, idx) => {
    const val = profile[ax.key] || 50;
    const { x, y } = getXY(val, idx);
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width="220" height="220" viewBox="0 0 220 220" style={{ margin: '0 auto', display: 'block' }}>
      <defs>
        <radialGradient id="radar-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(226,125,56,0.25)" />
          <stop offset="100%" stopColor="rgba(226,125,56,0)" />
        </radialGradient>
      </defs>

      {/* Grid rings */}
      {[0.25, 0.5, 0.75, 1.0].map((f, i) => (
        <polygon
          key={i}
          points={ringPoints(f)}
          fill="none"
          stroke="rgba(226,125,56,0.08)"
          strokeWidth="1"
        />
      ))}

      {/* Axis spokes */}
      {Array(5).fill(0).map((_, i) => {
        const angle = (i * 2 * Math.PI / 5) - Math.PI / 2;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={x}
            y2={y}
            stroke="rgba(226,125,56,0.08)"
            strokeWidth="1"
          />
        );
      })}

      {/* Value glow */}
      <polygon points={polyPoints} fill="url(#radar-glow)" />

      {/* Value polygon */}
      <polygon
        points={polyPoints}
        fill="rgba(226,125,56,0.14)"
        stroke="#E27D38"
        strokeWidth="2"
      />

      {/* Dynamic values */}
      {axes.map((ax, idx) => {
        const val = profile[ax.key] || 50;
        const { x, y } = getXY(val, idx);
        return (
          <g key={idx}>
            <circle cx={x} cy={y} r="3.5" fill="#E27D38" />
            <circle cx={x} cy={y} r="6.5" fill="none" stroke="#E27D38" strokeWidth="0.8" opacity="0.4" />
          </g>
        );
      })}

      {/* Axis text labels */}
      {axes.map((ax, idx) => {
        const angle = (idx * 2 * Math.PI / 5) - Math.PI / 2;
        const labelR = r + 15;
        const x = cx + labelR * Math.cos(angle);
        const y = cy + labelR * Math.sin(angle);

        let textAnchor = 'middle';
        if (Math.cos(angle) > 0.1) textAnchor = 'start';
        else if (Math.cos(angle) < -0.1) textAnchor = 'end';

        return (
          <text
            key={idx}
            x={x}
            y={y + 3.5}
            textAnchor={textAnchor}
            fill="#BAA28C"
            fontSize="8.5"
            fontFamily="'JetBrains Mono', monospace"
            fontWeight="bold"
            letterSpacing="0.5px"
          >
            {ax.name.toUpperCase()}
          </text>
        );
      })}
    </svg>
  );
}

// ── Bento card ─────────────────────────────────────────────

function BentoCard({ label, hero, sub, sub2, heroColor, span2 = false, children, style }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`bn rounded-2xl ${span2 ? 'col-span-2' : ''}`}
      style={style}
    >
      {label && <div className="bn-lbl">{label}</div>}
      {hero && <div className="bn-hero" style={{ color: heroColor }}>{hero}</div>}
      {sub && <div className="bn-sub">{sub}</div>}
      {sub2 && <div className="text-[10px] text-[#7A5E4B] leading-relaxed mt-1">{sub2}</div>}
      {children}
    </motion.div>
  );
}

// ── Move quality row ───────────────────────────────────────

function QualityRow({ icon, name, color, count, total }) {
  const pct = Math.round((count / total) * 100);
  return (
    <div className="grid grid-cols-[18px_1fr_28px] gap-2 items-center mb-2.5">
      <span className="text-center text-sm" style={{ color }}>{icon}</span>
      <div>
        <div className="text-[10px] font-600 mb-1" style={{ color }}>{name}</div>
        <div className="h-1 bg-white/[0.04] rounded-full overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
        </div>
      </div>
      <span className="font-mono text-[10px] text-right" style={{ color }}>{count}</span>
    </div>
  );
}

// ── Phase bar ──────────────────────────────────────────────

function PhaseBar({ label, count, total, color }) {
  const pct = Math.round((count / total) * 100);
  return (
    <div className="flex items-center gap-3 mb-3">
      <span className="text-[11px] text-[#BAA28C] w-24 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-white/[0.04] rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="font-mono text-[11px] w-8 text-right" style={{ color }}>{pct}%</span>
    </div>
  );
}

// ── Main view ──────────────────────────────────────────────

export default function PatternsView() {
  const { games, positions, apiData, username, psychProfile, totalMissedBrilliancies } = useChessStore();

  const metrics = useMemo(
    () => computeMetrics(games, positions, apiData),
    [games, positions, apiData]
  );

  if (!games.length) return (
    <div className="flex items-center justify-center h-full text-[#7A5E4B] font-mono text-sm">
      No data yet. Please analyze games first.
    </div>
  );

  const { allMq, totalMoves, wins, losses, draws, avgAcc, winPct, blRate,
          worstSq, worstCount, avgDeviation, phaseBl, totalPhBl } = metrics;

  const MQ_DATA = [
    { i:'★',n:'Brilliant', k:'brilliant',c:'#3CB8C4' },
    { i:'!',n:'Best',      k:'best',      c:'#4FAE78' },
    { i:'✓',n:'Excellent', k:'excellent', c:'#538EC9' },
    { i:'▸',n:'Good',      k:'good',      c:'#a08060' },
    { i:'⊞',n:'Book',      k:'book',      c:'#5a3e2e' },
    { i:'≈',n:'Inaccuracy',k:'inaccuracy',c:'#538EC9' },
    { i:'?',n:'Mistake',   k:'mistake',   c:'#D6872A' },
    { i:'??',n:'Blunder',  k:'blunder',   c:'#B83C24' },
  ];

  const profile = psychProfile || {
    archetype: 'The Universal Strategist',
    famous_player: 'Bobby Fischer',
    description: 'You play a balanced, classical style of chess. You transition smoothly between solid pawn structures and sharp tactical counters.',
    strengths: ['Clear active piece play', 'Solid development structure', 'Classical space control'],
    weaknesses: ['Reluctance to take extreme risks', 'Occasional dogmatic thinking'],
    aggression: 50, patience: 50, complexity: 50, depth: 50, safety: 50,
    tilt_warnings: ['Maintain focus after material losses.'],
    recommended_opening_white: 'London System / Ruy Lopez',
    recommended_opening_black: 'Caro-Kann Defense',
    opening_reason: 'Matches solid structures and long-term endgame squeezes.',
    queen_loss_drop: 0, rushing_blunders: 0, blunder_chains: 0
  };

  return (
    <div className="h-full overflow-y-auto p-6">
      {/* Header */}
      <div className="mb-6 flex items-baseline gap-3">
        <h2 className="font-outfit text-2xl font-800 text-[#F7EFE4]">Chess Performance Intelligence</h2>
        <span className="font-mono text-[11px] text-[#7A5E4B]">
          {username} · {games.length} games scanned · playstyle analysis active
        </span>
      </div>

      {/* Bento grid */}
      <div className="grid grid-cols-4 gap-4 max-w-6xl mx-auto pb-10">
        {/* Row 1: Core KPIs */}
        <BentoCard
          label="Win Rate"
          hero={`${winPct}%`}
          heroColor={winPct >= 50 ? '#4FAE78' : '#B83C24'}
          sub={`${wins}W · ${losses}L · ${draws}D`}
        />
        <BentoCard
          label="Avg Accuracy"
          hero={avgAcc}
          heroColor={avgAcc >= 70 ? '#4FAE78' : avgAcc >= 45 ? '#D6872A' : '#B83C24'}
          sub={`across ${games.length} games`}
        />
        <BentoCard
          label="Blunder Rate"
          hero={`${blRate}%`}
          heroColor={blRate < 2.5 ? '#4FAE78' : blRate < 5.5 ? '#D6872A' : '#B83C24'}
          sub="target: under 2%"
        />
        <BentoCard
          label="Missed Opportunities"
          hero={totalMissedBrilliancies}
          heroColor="#3CB8C4"
          sub="missed brilliant shots"
        />

        {/* Row 2: Chess Personality Profile & SVG Radar Chart */}
        <BentoCard label="Playstyle Analysis" span2 style={{ background: 'rgba(26,18,14,0.65)' }}>
          <div className="flex flex-col h-full justify-between">
            <div>
              <div className="flex items-baseline gap-2 mb-1.5">
                <span className="font-outfit font-900 text-2xl text-amber">{profile.archetype}</span>
                <span className="text-[10px] font-mono text-[#7A5E4B]">vs {profile.famous_player}</span>
              </div>
              <p className="text-xs text-[#BAA28C] leading-relaxed mb-4">{profile.description}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/[0.04]">
              <div>
                <div className="text-[9px] font-mono font-700 uppercase tracking-wider text-[#4FAE78] mb-1">Strengths</div>
                <ul className="list-disc pl-3 text-[11px] text-[#BAA28C] space-y-0.5">
                  {(profile.strengths || []).slice(0, 3).map((st, i) => <li key={i}>{st}</li>)}
                </ul>
              </div>
              <div>
                <div className="text-[9px] font-mono font-700 uppercase tracking-wider text-[#B83C24] mb-1">Weaknesses</div>
                <ul className="list-disc pl-3 text-[11px] text-[#BAA28C] space-y-0.5">
                  {(profile.weaknesses || []).slice(0, 3).map((wk, i) => <li key={i}>{wk}</li>)}
                </ul>
              </div>
            </div>
          </div>
        </BentoCard>

        {/* Radar Chart */}
        <BentoCard label="Playstyle Mapping" span2>
          <div className="flex items-center justify-center py-2 h-full">
            <RadarChart profile={profile} />
          </div>
        </BentoCard>

        {/* Row 3: Tilt Detection System */}
        <BentoCard label="Tilt & Composure Analysis" span2 style={{ borderLeft: '3px solid #B83C24', background: 'rgba(30,10,10,0.45)' }}>
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-3 gap-2">
              <div className="glass rounded-xl p-2.5 text-center">
                <div className="font-mono text-xl font-700 text-[#B83C24]">{profile.queen_loss_drop}%</div>
                <div className="text-[9px] text-[#7A5E4B] uppercase mt-0.5 leading-tight">Queen Loss Drop</div>
              </div>
              <div className="glass rounded-xl p-2.5 text-center">
                <div className="font-mono text-xl font-700 text-amber">{profile.rushing_blunders}</div>
                <div className="text-[9px] text-[#7A5E4B] uppercase mt-0.5 leading-tight">Rushing Errors</div>
              </div>
              <div className="glass rounded-xl p-2.5 text-center">
                <div className="font-mono text-xl font-700 text-[#e88670]">{profile.blunder_chains}</div>
                <div className="text-[9px] text-[#7A5E4B] uppercase mt-0.5 leading-tight">Blunder Chains</div>
              </div>
            </div>

            <div className="flex flex-col gap-2 mt-1">
              {(profile.tilt_warnings || []).length > 0 ? (
                profile.tilt_warnings.map((warn, i) => (
                  <div key={i} className="glass rounded-xl p-2.5 text-[10.5px] text-[#e88670] leading-relaxed border border-[#B83C24]/10 bg-[#B83C24]/05">
                    {warn}
                  </div>
                ))
              ) : (
                <div className="glass rounded-xl p-2.5 text-[10.5px] text-[#4FAE78] leading-relaxed border border-[#4FAE78]/10 bg-[#4FAE78]/05">
                  ✓ Tilt metrics nominal. You maintain complete emotional composure and consistent move pacing.
                </div>
              )}
            </div>
          </div>
        </BentoCard>

        {/* Tactical Hotspot */}
        <BentoCard
          label="Tactical Hotspot"
          hero={worstSq.toUpperCase()}
          heroColor="#B83C24"
          sub={`${worstCount} tactical errors on this square`}
          sub2={`Check defensive piece coverage on ${worstSq.toUpperCase()}. Pieces left undefended here cost you material.`}
        />
        
        {/* Opening Adherence */}
        <BentoCard
          label="Opening Adherence"
          hero={`M${avgDeviation}`}
          heroColor="#F7DAC4"
          sub="avg move before first inaccuracy"
          sub2={`You typically deviate from theory around turn ${Math.floor(parseFloat(avgDeviation) || 0)}. Study structures beyond book prep.`}
        />

        {/* Row 4: Opening DNA Recommender */}
        <BentoCard label="Recommended Openings" span2 style={{ background: 'rgba(226,125,56,0.02)' }}>
          <div className="flex flex-col h-full justify-between gap-3">
            <p className="text-xs text-[#BAA28C] leading-relaxed">{profile.opening_reason}</p>
            
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="glass rounded-xl p-3 border border-amber/10">
                <span className="text-[8.5px] font-mono text-[#7A5E4B] uppercase tracking-wider block mb-1">Recommended White</span>
                <span className="text-[12.5px] font-outfit font-700 text-[#F7DAC4]">{profile.recommended_opening_white}</span>
              </div>
              <div className="glass rounded-xl p-3 border border-amber/10">
                <span className="text-[8.5px] font-mono text-[#7A5E4B] uppercase tracking-wider block mb-1">Recommended Black</span>
                <span className="text-[12.5px] font-outfit font-700 text-[#F7DAC4]">{profile.recommended_opening_black}</span>
              </div>
            </div>
          </div>
        </BentoCard>

        {/* Move quality */}
        <BentoCard label="Move Quality Overview">
          <div className="max-h-[140px] overflow-y-auto pr-1">
            {MQ_DATA.map(q => (
              <QualityRow key={q.k} icon={q.i} name={q.n} color={q.c} count={allMq[q.k] || 0} total={totalMoves} />
            ))}
          </div>
        </BentoCard>

        {/* Phase distribution */}
        <BentoCard label="Blunders by Phase">
          <PhaseBar label="Opening"    count={phaseBl.opening || 0}    total={totalPhBl} color="#D6872A" />
          <PhaseBar label="Middlegame" count={phaseBl.middlegame || 0} total={totalPhBl} color="#B83C24" />
          <PhaseBar label="Endgame"    count={phaseBl.endgame || 0}    total={totalPhBl} color="#D6872A" />
        </BentoCard>

        {/* Accuracy trend */}
        <div className="bn col-span-4 rounded-2xl p-5">
          <div className="bn-lbl mb-3">Accuracy Trend Over Time</div>
          <AccuracyTrend games={games} />
          <div className="flex gap-6 mt-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-0.5 bg-amber rounded-full" />
              <span className="text-[10px] text-[#BAA28C]">You</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-px bg-[#7A5E4B] rounded-full" style={{ borderTop: '1px dashed' }} />
              <span className="text-[10px] text-[#BAA28C]">Opponent</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
