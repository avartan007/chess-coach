import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const TESTIMONIALS = [
  {
    quote:
      'Chess Coach found a recurring knight sacrifice pattern I was completely blind to. My rating jumped 80 points in two weeks.',
    author: 'Alex K.',
    rating: '1820 Rapid',
    avatar: 'AK',
  },
  {
    quote:
      "The blunder trainer is eerie — it feels like it knows exactly which positions I will misplay. Genuinely the best chess tool I've used.",
    author: 'Sarah M.',
    rating: '1540 Blitz',
    avatar: 'SM',
  },
];

const STAT_CARDS = [
  { value: '3.2×', label: 'Blunder Rate vs Average', color: '#B83C24' },
  { value: '−41cp', label: 'Avg Centipawn Loss on Blunders', color: '#e88670' },
  { value: 'High', label: 'Tactical Complexity Score', color: '#F0AB6C' },
];

function Avatar({ initials }) {
  return (
    <div
      style={{
        width: 40,
        height: 40,
        borderRadius: '50%',
        background: 'rgba(226,125,56,0.15)',
        border: '1px solid rgba(226,125,56,0.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Outfit', sans-serif",
        fontWeight: 700,
        fontSize: 13,
        color: '#E27D38',
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

export default function BlunderSection({ scrollProgress }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  const headerRef = useRef(null);
  const headerInView = useInView(headerRef, { once: true, margin: '-60px' });

  const badgeRef = useRef(null);
  const badgeInView = useInView(badgeRef, { once: true, margin: '-40px' });

  // Red overlay intensity increases as scrollProgress approaches 0.7
  const redIntensity = Math.min(0.08, Math.max(0, (scrollProgress - 0.5) * 0.3));

  return (
    <section
      style={{
        width: '100%',
        position: 'relative',
        paddingTop: 120,
        paddingBottom: 120,
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* Red tint overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `rgba(80,0,0,${redIntensity})`,
          pointerEvents: 'none',
          zIndex: 0,
          transition: 'background 0.1s',
        }}
      />

      {/* Ambient red glow */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          left: '-10%',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(184,60,36,0.07) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <div
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: '0 80px',
          boxSizing: 'border-box',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Header */}
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 30 }}
          animate={headerInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          style={{ marginBottom: 56 }}
        >
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              fontWeight: 600,
              color: '#B83C24',
              letterSpacing: '3px',
              textTransform: 'uppercase',
              display: 'block',
              marginBottom: 16,
            }}
          >
            TACTICAL FAILURE ANALYSIS
          </span>
          <h2
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 900,
              fontSize: 52,
              letterSpacing: '-2px',
              margin: 0,
              lineHeight: 1.05,
            }}
          >
            <span
              style={{
                background: 'linear-gradient(135deg, #e88670 0%, #B83C24 60%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              When tactics collapse
            </span>
          </h2>
        </motion.div>

        {/* Top row: Badge + Stats */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'auto 1fr',
            gap: 32,
            marginBottom: 48,
            alignItems: 'start',
          }}
        >
          {/* MISTAKE DETECTED badge */}
          <motion.div
            ref={badgeRef}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={badgeInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5 }}
            style={{
              background: 'rgba(184,60,36,0.08)',
              border: '1px solid rgba(184,60,36,0.35)',
              borderRadius: 14,
              padding: '20px 28px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 10,
              minWidth: 180,
            }}
          >
            <motion.div
              animate={{
                boxShadow: [
                  '0 0 0px 0px rgba(184,60,36,0)',
                  '0 0 12px 4px rgba(184,60,36,0.35)',
                  '0 0 0px 0px rgba(184,60,36,0)',
                ],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: 'rgba(184,60,36,0.15)',
                border: '1px solid rgba(184,60,36,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
              }}
            >
              ⚠
            </motion.div>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                fontWeight: 700,
                color: '#B83C24',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                textAlign: 'center',
              }}
            >
              MISTAKE
              <br />
              DETECTED
            </div>
          </motion.div>

          {/* Stat Cards */}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {STAT_CARDS.map((card, i) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 20 }}
                animate={headerInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.55, delay: 0.15 + i * 0.1 }}
                className="glass"
                style={{
                  borderRadius: 12,
                  padding: '18px 22px',
                  flex: 1,
                  minWidth: 140,
                }}
              >
                <div
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontWeight: 800,
                    fontSize: 28,
                    color: card.color,
                    letterSpacing: '-1px',
                    lineHeight: 1,
                    marginBottom: 6,
                  }}
                >
                  {card.value}
                </div>
                <div
                  style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: 12,
                    color: '#7A5E4B',
                    lineHeight: 1.4,
                  }}
                >
                  {card.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Main content + Red alert box */}
        <div
          ref={ref}
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 40,
            marginBottom: 56,
          }}
        >
          {/* Description */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <h3
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 700,
                fontSize: 22,
                color: '#F7EFE4',
                margin: '0 0 16px',
                letterSpacing: '-0.4px',
              }}
            >
              The Blunder Trainer
            </h3>
            <p
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 15,
                color: '#BAA28C',
                lineHeight: 1.75,
                margin: '0 0 16px',
              }}
            >
              Instead of generic puzzles, Chess Coach reconstructs the exact
              positions where you blundered. You play the board again, this
              time armed with context and hindsight.
            </p>
            <p
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 15,
                color: '#BAA28C',
                lineHeight: 1.75,
                margin: 0,
              }}
            >
              The engine reveals the best continuation after you attempt each
              position, building pattern recognition for your specific
              weaknesses.
            </p>

            {/* Feature bullets */}
            <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                'Reconstructs your exact blunder positions',
                'Hints system for progressive reveals',
                'Engine best-move overlay after reveal',
                'Session progress persisted locally',
              ].map(item => (
                <div
                  key={item}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: 13.5,
                    color: '#BAA28C',
                  }}
                >
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: '#B83C24',
                      flexShrink: 0,
                    }}
                  />
                  {item}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Red Alert Box */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            {/* Forced mate box */}
            <motion.div
              animate={{
                boxShadow: [
                  '0 0 0px 0px rgba(184,60,36,0)',
                  '0 0 18px 4px rgba(184,60,36,0.25)',
                  '0 0 0px 0px rgba(184,60,36,0)',
                ],
              }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                background: 'rgba(184,60,36,0.10)',
                border: '1px solid rgba(184,60,36,0.30)',
                borderRadius: 12,
                padding: '20px 24px',
              }}
            >
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11,
                  color: '#B83C24',
                  letterSpacing: '2px',
                  marginBottom: 10,
                  opacity: 0.8,
                }}
              >
                ENGINE EVALUATION
              </div>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 22,
                  fontWeight: 700,
                  color: '#e88670',
                  letterSpacing: '-0.5px',
                  marginBottom: 8,
                }}
              >
                Qxf7+ — Forced checkmate detected
              </div>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 12,
                  color: '#B83C24',
                  opacity: 0.7,
                }}
              >
                #M3 · Depth 14 · Stockfish 16
              </div>
            </motion.div>

            {/* Additional info card */}
            <div
              className="glass"
              style={{ borderRadius: 12, padding: '18px 22px' }}
            >
              <div
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: 13,
                  color: '#7A5E4B',
                  lineHeight: 1.6,
                }}
              >
                <span style={{ color: '#F0AB6C', fontWeight: 600 }}>Pro tip:</span> The
                most common blunder pattern we detect is missing a back-rank
                threat — occurring in 38% of analyzed games.
              </div>
            </div>
          </motion.div>
        </div>

        {/* Testimonials */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.author}
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.55, delay: 0.3 + i * 0.15 }}
              className="glass"
              style={{ borderRadius: 14, padding: '24px 28px' }}
            >
              {/* Stars */}
              <div style={{ marginBottom: 14, color: '#E27D38', fontSize: 13 }}>
                ★★★★★
              </div>
              <p
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: 14.5,
                  color: '#BAA28C',
                  lineHeight: 1.7,
                  margin: '0 0 18px',
                  fontStyle: 'italic',
                }}
              >
                "{t.quote}"
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Avatar initials={t.avatar} />
                <div>
                  <div
                    style={{
                      fontFamily: "'Outfit', sans-serif",
                      fontWeight: 700,
                      fontSize: 14,
                      color: '#F7EFE4',
                    }}
                  >
                    {t.author}
                  </div>
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 11,
                      color: '#E27D38',
                      marginTop: 2,
                    }}
                  >
                    {t.rating}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
