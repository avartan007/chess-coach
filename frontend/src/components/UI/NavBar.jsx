import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useChessStore from '../../store/useChessStore';

const ChessKingSVG = () => (
  <svg width="28" height="28" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="18" y="4" width="8" height="4" rx="1" fill="#E27D38" />
    <rect x="20" y="2" width="4" height="8" rx="1" fill="#E27D38" />
    <rect x="14" y="12" width="16" height="4" rx="1" fill="#F0AB6C" />
    <path d="M12 16 L10 34 L34 34 L32 16 Z" fill="#E27D38" />
    <rect x="9" y="34" width="26" height="5" rx="2" fill="#F0AB6C" />
  </svg>
);

const TABS = [
  { label: 'Game Analysis', view: 'analysis' },
  { label: 'My Patterns', view: 'patterns' },
  { label: 'AI Coach Chat', view: 'coach' },
  { label: 'Blunder Trainer', view: 'trainer' },
];

const PERSONAS = [
  { id: 'grandmaster', name: 'Grandmaster', icon: '👑', color: '#F7DAC4' },
  { id: 'demon', name: 'Tactical Demon', icon: '👹', color: '#B83C24' },
  { id: 'teacher', name: 'Calm Teacher', icon: '🧘', color: '#4FAE78' },
  { id: 'brutal', name: 'Brutal Analyzer', icon: '💀', color: '#BAA28C' },
];

export default function NavBar() {
  const currentView = useChessStore(s => s.currentView);
  const setCurrentView = useChessStore(s => s.setCurrentView);
  const coachPersona = useChessStore(s => s.coachPersona);
  const setCoachPersona = useChessStore(s => s.setCoachPersona);

  const [dropdownOpen, setDropdownOpen] = useState(false);

  const isLanding = currentView === 'landing';
  const activePersona = PERSONAS.find(p => p.id === coachPersona) || PERSONAS[0];

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 64,
        zIndex: 50,
        background: 'rgba(12,8,6,0.80)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(226,125,56,0.12)',
        display: 'flex',
        alignItems: 'center',
        paddingLeft: 28,
        paddingRight: 28,
      }}
    >
      {/* Left: Logo */}
      <motion.div
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          cursor: !isLanding ? 'pointer' : 'default',
          userSelect: 'none',
          flexShrink: 0,
        }}
        onClick={() => { if (!isLanding) setCurrentView('landing'); }}
      >
        <ChessKingSVG />
        <span
          className="heading-gradient"
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 800,
            fontSize: 20,
            letterSpacing: '-0.5px',
          }}
        >
          Chess Coach
        </span>
      </motion.div>

      {/* Center: Tabs */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 4 }}>
        <AnimatePresence>
          {!isLanding && (
            <motion.div
              key="tabs"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              style={{ display: 'flex', alignItems: 'center', gap: 4 }}
            >
              {TABS.map(tab => (
                <button
                  key={tab.view}
                  className={`nav-tab${currentView === tab.view ? ' active' : ''}`}
                  onClick={() => setCurrentView(tab.view)}
                >
                  {tab.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Right: Coach Selector & Back to Home */}
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 16 }}>
        <AnimatePresence>
          {!isLanding && (
            <motion.div
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.25 }}
              style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}
            >
              {/* Persona Selector Dropdown */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    background: 'rgba(226,125,56,0.06)',
                    border: `1px solid ${activePersona.color}33`,
                    color: activePersona.color,
                    padding: '7px 14px',
                    borderRadius: 10,
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: 'pointer',
                    outline: 'none',
                    transition: 'all 0.2s',
                    userSelect: 'none',
                  }}
                >
                  <span style={{ fontSize: 14 }}>{activePersona.icon}</span>
                  <span>{activePersona.name}</span>
                  <span style={{ fontSize: 9, opacity: 0.6, transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>▼</span>
                </button>

                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 8px)',
                        right: 0,
                        width: 175,
                        background: 'rgba(18,12,8,0.92)',
                        border: '1px solid rgba(226,125,56,0.18)',
                        borderRadius: 12,
                        padding: 6,
                        boxShadow: '0 12px 36px rgba(0,0,0,0.65)',
                        backdropFilter: 'blur(24px)',
                        WebkitBackdropFilter: 'blur(24px)',
                        zIndex: 100,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                      }}
                    >
                      <div style={{ padding: '4px 8px 6px', fontSize: 9, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '1px', color: '#7A5E4B' }}>Select AI Mentor</div>
                      {PERSONAS.map(p => (
                        <button
                          key={p.id}
                          onClick={() => {
                            setCoachPersona(p.id);
                            setDropdownOpen(false);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            width: '100%',
                            padding: '8px 10px',
                            background: p.id === coachPersona ? 'rgba(226,125,56,0.12)' : 'transparent',
                            border: 'none',
                            color: p.id === coachPersona ? p.color : '#BAA28C',
                            borderRadius: 8,
                            fontSize: 12,
                            fontWeight: p.id === coachPersona ? 700 : 500,
                            textAlign: 'left',
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                          }}
                        >
                          <span style={{ fontSize: 13 }}>{p.icon}</span>
                          <span>{p.name}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Back to Home Button */}
              <button
                className="btn-secondary"
                onClick={() => setCurrentView('landing')}
                style={{ fontSize: 12.5, padding: '7px 15px', height: 32 }}
              >
                ← Back to Home
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}
