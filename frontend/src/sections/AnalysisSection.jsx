import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const FEATURES = [
  {
    icon: '♟',
    title: 'Blunder Corrector',
    desc: "Play through your actual game positions and find the engine's recommended correction.",
  },
  {
    icon: '📊',
    title: 'Deep Analytics',
    desc: 'Track centipawn loss, opening deviation depth, king safety, and piece vulnerability indices.',
  },
  {
    icon: '🎯',
    title: 'Tactical Hotspots',
    desc: 'Discover the exact board squares where you commit the most errors across all your games.',
  },
];

const PIPELINE = [
  {
    step: '01',
    title: 'Import & Fetch',
    desc: 'Retrieve your games from Chess.com API',
    icon: '⬇',
  },
  {
    step: '02',
    title: 'Engine Analysis',
    desc: 'Stockfish depth-14 scans every position',
    icon: '⚙',
  },
  {
    step: '03',
    title: 'Diagnostic Training',
    desc: 'Personalized puzzle generation from real blunders',
    icon: '🎓',
  },
];

function FeatureCard({ icon, title, desc, delay }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className="glass"
      style={{
        borderRadius: 16,
        padding: 32,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        cursor: 'default',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
      }}
      whileHover={{ y: -6, transition: { duration: 0.3, ease: 'easeOut' } }}
    >
      {/* Icon Box */}
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 10,
          background: 'rgba(226,125,56,0.10)',
          border: '1px solid rgba(226,125,56,0.28)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 22,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>

      <h3
        style={{
          fontFamily: "'Outfit', sans-serif",
          fontWeight: 700,
          fontSize: 18,
          color: '#F7EFE4',
          margin: 0,
          letterSpacing: '-0.3px',
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: 14,
          color: '#BAA28C',
          lineHeight: 1.7,
          margin: 0,
        }}
      >
        {desc}
      </p>
    </motion.div>
  );
}

function PipelineStep({ step, title, desc, icon, delay, isLast }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });

  return (
    <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
          flex: 1,
        }}
      >
        {/* Icon + Step Number */}
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: 'rgba(226,125,56,0.08)',
            border: '1px solid rgba(226,125,56,0.22)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
            position: 'relative',
          }}
        >
          {icon}
          <span
            style={{
              position: 'absolute',
              top: -10,
              left: -10,
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              fontWeight: 700,
              color: '#E27D38',
              background: 'rgba(10,8,5,0.9)',
              border: '1px solid rgba(226,125,56,0.3)',
              borderRadius: 6,
              padding: '2px 6px',
              letterSpacing: '1px',
            }}
          >
            {step}
          </span>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 700,
              fontSize: 15,
              color: '#F7EFE4',
              marginBottom: 4,
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 12.5,
              color: '#7A5E4B',
              lineHeight: 1.5,
              maxWidth: 160,
              margin: '0 auto',
            }}
          >
            {desc}
          </div>
        </div>
      </motion.div>

      {/* Arrow connector */}
      {!isLast && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            paddingBottom: 36,
            color: '#E27D38',
            fontSize: 20,
            opacity: 0.45,
            flexShrink: 0,
            margin: '0 8px',
          }}
        >
          →
        </div>
      )}
    </div>
  );
}

export default function AnalysisSection({ scrollProgress }) {
  const headerRef = useRef(null);
  const headerInView = useInView(headerRef, { once: true, margin: '-80px' });

  return (
    <section
      style={{
        width: '100%',
        position: 'relative',
        paddingTop: 120,
        paddingBottom: 120,
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: '0 80px',
          boxSizing: 'border-box',
        }}
      >
        {/* Header */}
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 30 }}
          animate={headerInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          style={{ textAlign: 'center', marginBottom: 64 }}
        >
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              fontWeight: 600,
              color: '#E27D38',
              letterSpacing: '3px',
              textTransform: 'uppercase',
              display: 'block',
              marginBottom: 16,
            }}
          >
            FEATURE SET
          </span>
          <h2
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 800,
              fontSize: 44,
              letterSpacing: '-1.5px',
              margin: 0,
              marginBottom: 16,
            }}
          >
            <span className="heading-gradient">
              Engineered to improve your rating
            </span>
          </h2>
          <p
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 16,
              color: '#BAA28C',
              lineHeight: 1.7,
              maxWidth: 560,
              margin: '0 auto',
            }}
          >
            Every feature is built around a single goal: turning your actual game
            history into targeted, high-impact training.
          </p>
        </motion.div>

        {/* Feature Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 24,
            marginBottom: 72,
          }}
        >
          {FEATURES.map((feat, i) => (
            <FeatureCard
              key={feat.title}
              {...feat}
              delay={i * 0.15}
            />
          ))}
        </div>

        {/* Pipeline Section */}
        <div
          className="glass"
          style={{
            borderRadius: 20,
            padding: '40px 48px',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10.5,
                fontWeight: 600,
                color: '#E27D38',
                letterSpacing: '2.5px',
                textTransform: 'uppercase',
              }}
            >
              ANALYSIS PIPELINE
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
            {PIPELINE.map((step, i) => (
              <PipelineStep
                key={step.step}
                {...step}
                delay={0.1 + i * 0.15}
                isLast={i === PIPELINE.length - 1}
              />
            ))}
          </div>
        </div>

        {/* Decorative line */}
        <div
          style={{
            marginTop: 80,
            height: 1,
            background:
              'linear-gradient(90deg, transparent, rgba(226,125,56,0.15) 50%, transparent)',
          }}
        />
      </div>

      {/* Ambient glow */}
      <div
        style={{
          position: 'absolute',
          top: '40%',
          right: 0,
          width: 400,
          height: 400,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(226,125,56,0.04) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: -1,
        }}
      />
    </section>
  );
}
