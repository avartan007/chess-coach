import { useRef, useState } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';

// ─── FAQ Accordion ────────────────────────────────────────────────────────────

const FAQ_ITEMS = [
  {
    q: 'How deep is the Stockfish scan?',
    a: 'Every position is evaluated at depth-14 using Stockfish 16, the world\'s strongest open-source chess engine. This ensures engine accuracy far beyond human intuition, catching subtle tactical oversights and long-range strategic mistakes.',
  },
  {
    q: 'What is a tactical hotspot?',
    a: 'Our algorithm maps all your blunder origins to specific board squares, then aggregates them across every game in your session. The resulting heatmap reveals which squares you consistently mishandle — giving you a prioritized list of areas to study.',
  },
  {
    q: 'How does session caching work?',
    a: 'Your analysis is stored in your browser\'s local storage after each session. This means you can close the tab, return later, and resume exactly where you left off — no account or server required. Data is never sent to any external service.',
  },
];

function FAQItem({ q, a, index }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-30px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="glass"
      style={{
        borderRadius: 12,
        overflow: 'hidden',
        cursor: 'pointer',
      }}
      onClick={() => setOpen(o => !o)}
    >
      <div
        style={{
          padding: '18px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <span
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 600,
            fontSize: 15.5,
            color: '#F7EFE4',
            letterSpacing: '-0.2px',
          }}
        >
          {q}
        </span>
        <motion.div
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.22 }}
          style={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: open ? 'rgba(226,125,56,0.15)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${open ? 'rgba(226,125,56,0.3)' : 'rgba(255,255,255,0.06)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: open ? '#E27D38' : '#7A5E4B',
            fontSize: 16,
            fontWeight: 300,
            flexShrink: 0,
            lineHeight: 1,
          }}
        >
          +
        </motion.div>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div
              style={{
                padding: '0 24px 20px',
                borderTop: '1px solid rgba(226,125,56,0.08)',
                paddingTop: 16,
              }}
            >
              <p
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: 14,
                  color: '#BAA28C',
                  lineHeight: 1.75,
                  margin: 0,
                }}
              >
                {a}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Chess King SVG ───────────────────────────────────────────────────────────

const LogoKing = () => (
  <svg width="20" height="20" viewBox="0 0 44 44" fill="none">
    <rect x="18" y="4" width="8" height="4" rx="1" fill="#E27D38" />
    <rect x="20" y="2" width="4" height="8" rx="1" fill="#E27D38" />
    <rect x="14" y="12" width="16" height="4" rx="1" fill="#F0AB6C" />
    <path d="M12 16 L10 34 L34 34 L32 16 Z" fill="#E27D38" />
    <rect x="9" y="34" width="26" height="5" rx="2" fill="#F0AB6C" />
  </svg>
);

// ─── Footer Brand ─────────────────────────────────────────────────────────────

function FooterBrand() {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <LogoKing />
        <span
          className="heading-gradient"
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 800,
            fontSize: 16,
          }}
        >
          Chess Coach
        </span>
      </div>
      <p
        style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: 13,
          color: '#7A5E4B',
          lineHeight: 1.65,
          margin: 0,
          maxWidth: 240,
        }}
      >
        AI-powered chess analysis powered by Stockfish 16 and React Three Fiber.
        Identify your blindspots and train with purpose.
      </p>
    </div>
  );
}

// ─── Privacy / Terms Modal (Glass Overlay) ────────────────────────────────────

function GlassModal({ isOpen, onClose, title, content }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(6, 4, 3, 0.75)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="glass rounded-2xl p-8 max-w-xl w-full"
            style={{
              maxHeight: '80vh',
              overflowY: 'auto',
              boxShadow: '0 24px 64px rgba(0,0,0,0.85)',
              border: '1px solid rgba(226,125,56,0.18)',
              background: 'rgba(20, 14, 11, 0.94)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 20, fontWeight: 800, color: '#F7EFE4', margin: 0 }}>
                {title}
              </h3>
              <button
                onClick={onClose}
                style={{
                  background: 'rgba(226,125,56,0.08)',
                  border: '1px solid rgba(226,125,56,0.22)',
                  color: '#BAA28C',
                  fontSize: 14,
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                  outline: 'none',
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div 
              style={{ 
                fontFamily: "'Plus Jakarta Sans', sans-serif", 
                fontSize: 13, 
                lineHeight: 1.7, 
                color: '#BAA28C', 
                whiteSpace: 'pre-line',
                display: 'flex',
                flexDirection: 'column',
                gap: 12
              }}
            >
              {content}
            </div>

            {/* Modal Footer */}
            <div style={{ marginTop: 28, display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={onClose}
                className="btn-primary"
                style={{ padding: '8px 24px', borderRadius: 8, height: 38, cursor: 'pointer' }}
              >
                Composed
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function LegalLinks({ onOpenModal }) {
  const PRIVACY_TEXT = `1. DATA ACQUISITION & INTEGRATION
Chess Coach OS acts purely as a secure local analytics lab. We query public match logs directly from the public Chess.com API. We do not gather, store, or transmit your private credentials, passwords, or personal data.

2. LOCAL STORAGE SANDBOX
To ensure a stable session resume feature without forcing you to build database accounts, all Stockfish evaluations, game transcripts, playstyle profile archetypes, and training progress are stored exclusively within your browser's sandboxed local storage context (localStorage). This data remains 100% private to your browser.

3. GDPR & COMPLIANCE
You maintain absolute control over your records. Clicking "Clear Cache" in the navbar deletes all stored PGN analysis from your device immediately. We do not share, sell, or communicate user profiles to any third-party marketing services.`;

  const TERMS_TEXT = `1. USE OF THE PLATFORM
Chess Coach OS is offered free of charge purely for personal strategic rating improvements and competitive chess training. Commercial reproduction, scraping, or redistribution of this software or its backend is strictly prohibited.

2. ENGINE EVALUATION METRICS
All position evaluations, missed brilliancies, and blunder detections are computed locally on the fly using a high-fidelity depth-14 Stockfish 16 engine scan. Ratings, centipawn losses, and playstyle metrics are intended for personal training insight and do not constitute official tournament scores.

3. INDEMNIFICATION
This software is provided "as is" with no warranty or operational guarantees. The developers are not affiliated with, sponsored by, or linked to Chess.com or the Stockfish development team.`;

  const DISCLAIMER_TEXT = `1. AI LIMITATIONS
All coaching remarks, dynamic bento analyses, and "What Lost You The Game" diagnoses are generated using a local behavioral pattern engine based on Stockfish centipawn differentials. These assessments are coaching approximations and do not guarantee official rating rises or error-free tactical evaluations.

2. CLOCK COMMENTS & TIME PRESSURE
Tilt warnings and rushing blunder flags are mapped using %clk comments contained in raw PGN files. Clock precision is bounded by the parameters stored during game playbacks on public hosts.`;

  return (
    <div>
      <div
        style={{
          fontFamily: "'Outfit', sans-serif",
          fontWeight: 700,
          fontSize: 13,
          color: '#F7EFE4',
          marginBottom: 14,
          letterSpacing: '0.5px',
        }}
      >
        Legal
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button
          onClick={() => onOpenModal('Privacy Policy', PRIVACY_TEXT)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 13,
            color: '#7A5E4B',
            textAlign: 'left',
            padding: 0,
            transition: 'color 0.2s',
            outline: 'none',
          }}
          onMouseEnter={e => (e.target.style.color = '#BAA28C')}
          onMouseLeave={e => (e.target.style.color = '#7A5E4B')}
        >
          Privacy Policy
        </button>
        <button
          onClick={() => onOpenModal('Terms of Use', TERMS_TEXT)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 13,
            color: '#7A5E4B',
            textAlign: 'left',
            padding: 0,
            transition: 'color 0.2s',
            outline: 'none',
          }}
          onMouseEnter={e => (e.target.style.color = '#BAA28C')}
          onMouseLeave={e => (e.target.style.color = '#7A5E4B')}
        >
          Terms of Use
        </button>
        <button
          onClick={() => onOpenModal('Engine & AI Disclaimer', DISCLAIMER_TEXT)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 13,
            color: '#7A5E4B',
            textAlign: 'left',
            padding: 0,
            transition: 'color 0.2s',
            outline: 'none',
          }}
          onMouseEnter={e => (e.target.style.color = '#BAA28C')}
          onMouseLeave={e => (e.target.style.color = '#7A5E4B')}
        >
          Coaching Disclaimer
        </button>
      </div>
    </div>
  );
}

function FooterCredits() {
  return (
    <div>
      <div
        style={{
          fontFamily: "'Outfit', sans-serif",
          fontWeight: 700,
          fontSize: 13,
          color: '#F7EFE4',
          marginBottom: 14,
          letterSpacing: '0.5px',
        }}
      >
        Built With
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {['Stockfish 16', 'React Three Fiber', 'Framer Motion', 'Chess.com API'].map(credit => (
          <span
            key={credit}
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 13,
              color: '#7A5E4B',
            }}
          >
            {credit}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Main Section ─────────────────────────────────────────────────────────────

export default function CheckmateSection() {
  const heroRef = useRef(null);
  const heroInView = useInView(heroRef, { once: true, margin: '-80px' });

  const faqRef = useRef(null);
  const faqInView = useInView(faqRef, { once: true, margin: '-60px' });

  const [modal, setModal] = useState({ isOpen: false, title: '', content: '' });

  return (
    <section
      style={{
        minHeight: '100vh',
        width: '100%',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* Ambient glow top center */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 700,
          height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(226,125,56,0.06) 0%, transparent 65%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Hero Text Block */}
      <div
        ref={heroRef}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '120px 80px 80px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* CHECKMATE. */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={heroInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
        >
          <h2
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 900,
              fontSize: 'clamp(64px, 10vw, 112px)',
              letterSpacing: '-4px',
              color: '#ffffff',
              margin: 0,
              textAlign: 'center',
              lineHeight: 0.95,
              textShadow:
                '0 0 40px rgba(226,125,56,0.20), 0 0 80px rgba(226,125,56,0.10)',
            }}
          >
            CHECKMATE.
          </h2>
        </motion.div>

        {/* +M3 line */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={heroInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          style={{ marginTop: 20 }}
        >
          <motion.span
            animate={{
              textShadow: [
                '0 0 0px rgba(184,60,36,0)',
                '0 0 16px rgba(184,60,36,0.6)',
                '0 0 0px rgba(184,60,36,0)',
              ],
            }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 20,
              fontWeight: 600,
              color: '#B83C24',
              letterSpacing: '1px',
              display: 'block',
              textAlign: 'center',
            }}
          >
            +M3 — Forced mate detected.
          </motion.span>
        </motion.div>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={heroInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 18,
            color: '#BAA28C',
            textAlign: 'center',
            maxWidth: 440,
            lineHeight: 1.7,
            margin: '24px auto 0',
          }}
        >
          Understand your mistakes before they happen.
        </motion.p>

        {/* Divider */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={heroInView ? { opacity: 1, scaleX: 1 } : {}}
          transition={{ duration: 0.7, delay: 0.5 }}
          style={{
            width: 80,
            height: 1,
            background: 'rgba(226,125,56,0.3)',
            margin: '48px auto 0',
          }}
        />
      </div>

      {/* FAQ Section */}
      <div
        ref={faqRef}
        style={{
          maxWidth: 760,
          width: '100%',
          margin: '0 auto',
          padding: '0 40px 80px',
          boxSizing: 'border-box',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={faqInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55 }}
          style={{
            textAlign: 'center',
            marginBottom: 32,
          }}
        >
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
            FREQUENTLY ASKED
          </span>
        </motion.div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {FAQ_ITEMS.map((item, i) => (
            <FAQItem key={item.q} q={item.q} a={item.a} index={i} />
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid rgba(255,255,255,0.04)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            padding: '48px 80px 32px',
            boxSizing: 'border-box',
          }}
        >
          {/* Footer Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr',
              gap: 48,
              marginBottom: 40,
            }}
          >
            <FooterBrand />
            <LegalLinks onOpenModal={(title, content) => setModal({ isOpen: true, title, content })} />
            <FooterCredits />
          </div>

          {/* Copyright line */}
          <div
            style={{
              borderTop: '1px solid rgba(255,255,255,0.04)',
              paddingTop: 24,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <span
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 12,
                color: '#7A5E4B',
              }}
            >
              © 2026 Chess Coach. All rights reserved. Powered by Stockfish 16 &amp; React Three Fiber
            </span>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                color: '#4a3428',
                letterSpacing: '1.5px',
              }}
            >
              v1.0.0
            </span>
          </div>
        </div>
      </footer>

      {/* Glassmorphic Policy Overlay Modal */}
      <GlassModal
        isOpen={modal.isOpen}
        onClose={() => setModal(prev => ({ ...prev, isOpen: false }))}
        title={modal.title}
        content={modal.content}
      />
    </section>
  );
}
