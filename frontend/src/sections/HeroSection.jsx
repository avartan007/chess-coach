import { motion } from 'framer-motion';
import SetupCard from '../components/UI/SetupCard';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] },
});

const STATS = [
  { label: 'DEPTH', value: '14' },
  { label: 'POSITIONS', value: '∞' },
  { label: 'ANALYSIS', value: '< 30s' },
];

export default function HeroSection({ scrollProgress, onStart }) {
  return (
    <section
      style={{
        minHeight: '100vh',
        width: '100%',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 64, // navbar offset
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          width: '100%',
          margin: '0 auto',
          padding: '0 80px',
          paddingTop: 80,
          paddingBottom: 80,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 72,
          alignItems: 'center',
          boxSizing: 'border-box',
        }}
      >
        {/* ── Left Column: Text ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {/* Label */}
          <motion.div {...fadeUp(0)}>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                fontWeight: 600,
                color: '#E27D38',
                letterSpacing: '3px',
                textTransform: 'uppercase',
                display: 'inline-block',
                marginBottom: 20,
                opacity: 0.9,
              }}
            >
              AI-POWERED CHESS ANALYSIS
            </span>
          </motion.div>

          {/* H1 */}
          <motion.h1
            {...fadeUp(0.15)}
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 900,
              fontSize: 62,
              lineHeight: 1.05,
              letterSpacing: '-2px',
              margin: 0,
              marginBottom: 24,
            }}
          >
            <span className="heading-gradient">
              Master your chess blindspots.
            </span>
          </motion.h1>

          {/* Subtext */}
          <motion.p
            {...fadeUp(0.3)}
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 16,
              color: '#BAA28C',
              lineHeight: 1.75,
              margin: 0,
              marginBottom: 36,
              maxWidth: 520,
            }}
          >
            Chess Coach extracts your recent matches from Chess.com, analyzes
            every move with depth-14 Stockfish, and builds personalized training
            from your actual blunders.
          </motion.p>

          {/* Stats Row */}
          <motion.div
            {...fadeUp(0.45)}
            style={{
              display: 'flex',
              gap: 32,
              marginBottom: 48,
            }}
          >
            {STATS.map(stat => (
              <div key={stat.label} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 22,
                    fontWeight: 700,
                    color: '#F7EFE4',
                    letterSpacing: '-0.5px',
                    lineHeight: 1,
                  }}
                >
                  {stat.value}
                </span>
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 9.5,
                    fontWeight: 600,
                    color: '#E27D38',
                    letterSpacing: '2px',
                    textTransform: 'uppercase',
                  }}
                >
                  {stat.label}
                </span>
              </div>
            ))}
          </motion.div>

          {/* Separator */}
          <div
            style={{
              width: 48,
              height: 1,
              background: 'rgba(226,125,56,0.25)',
              marginBottom: 32,
            }}
          />

          {/* Scroll hint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.4, 0.9, 0.4] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 12,
              color: '#E27D38',
              letterSpacing: '0.5px',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            ↓ Scroll to watch the game unfold
          </motion.div>
        </div>

        {/* ── Right Column: Setup Card ── */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            style={{ width: '100%', maxWidth: 440 }}
          >
            <SetupCard onStart={onStart} />
          </motion.div>
        </div>
      </div>

      {/* Subtle ambient glow */}
      <div
        style={{
          position: 'absolute',
          top: '30%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 600,
          height: 300,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(226,125,56,0.05) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: -1,
        }}
      />
    </section>
  );
}
