import { motion } from 'framer-motion';

function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

function evalToPercent(evalScore) {
  return clamp(((evalScore + 800) / 1600) * 100, 5, 95);
}

function formatLabel(evalScore) {
  if (evalScore >= 99) return '+M';
  if (evalScore <= -99) return '-M';
  const abs = Math.abs(evalScore);
  const sign = evalScore >= 0 ? '+' : '-';
  return `${sign}${(abs / 100).toFixed(1)}`;
}

export default function EvalBar({ evalScore = 0 }) {
  const isMateWhite = evalScore >= 99;
  const isMateBlack = evalScore <= -99;
  const isMate = isMateWhite || isMateBlack;

  // whitePct = percent of bar that is "white" (top of bar = white's side)
  const whitePct = evalToPercent(evalScore);
  const label = formatLabel(evalScore);

  const glowColor = isMateWhite ? '#4FAE78' : isMateBlack ? '#B83C24' : 'transparent';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
      }}
    >
      {/* Bar container */}
      <div
        className="glass"
        style={{
          width: 18,
          height: 180,
          borderRadius: 999,
          overflow: 'hidden',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: isMate
            ? `0 0 12px 3px ${glowColor}44, 0 0 4px 1px ${glowColor}88`
            : undefined,
        }}
      >
        {/* White section (top) */}
        <motion.div
          layout
          initial={false}
          animate={{
            height: `${whitePct}%`,
            boxShadow: isMateWhite
              ? ['0 0 0px 0px #4FAE7800', '0 0 8px 4px #4FAE7866', '0 0 0px 0px #4FAE7800']
              : 'none',
          }}
          transition={{
            height: { type: 'spring', stiffness: 120, damping: 22 },
            boxShadow: isMateWhite
              ? { duration: 1.2, repeat: Infinity, ease: 'easeInOut' }
              : { duration: 0.3 },
          }}
          style={{
            width: '100%',
            background: isMateWhite
              ? 'linear-gradient(180deg, #6eff9d 0%, #4FAE78 100%)'
              : 'linear-gradient(180deg, #ffffff 0%, #dbd8c5 100%)',
            borderRadius: '999px 999px 0 0',
            flexShrink: 0,
          }}
        />

        {/* Black section (bottom) */}
        <motion.div
          initial={false}
          animate={{
            flex: 1,
            boxShadow: isMateBlack
              ? ['0 0 0px 0px #B83C2400', '0 0 8px 4px #B83C2466', '0 0 0px 0px #B83C2400']
              : 'none',
          }}
          transition={{
            boxShadow: isMateBlack
              ? { duration: 1.2, repeat: Infinity, ease: 'easeInOut' }
              : { duration: 0.3 },
          }}
          style={{
            width: '100%',
            background: isMateBlack
              ? 'linear-gradient(180deg, #B83C24 0%, #7a1a0c 100%)'
              : 'linear-gradient(180deg, #2d2119 0%, #1a0d0a 100%)',
            borderRadius: '0 0 999px 999px',
          }}
        />
      </div>

      {/* Score label */}
      <span
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10,
          fontWeight: 600,
          color: evalScore >= 0 ? '#F7EFE4' : '#BAA28C',
          letterSpacing: '0.5px',
          minWidth: 32,
          textAlign: 'center',
        }}
      >
        {label}
      </span>
    </div>
  );
}
