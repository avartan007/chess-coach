import { create } from 'zustand';

let sharedAudioCtx = null;

/**
 * Web Audio Synth Sound Generator for Immersive Audio
 */
export function playSynthSound(type) {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    
    if (!sharedAudioCtx) {
      sharedAudioCtx = new AudioContextClass();
    }
    const ctx = sharedAudioCtx;
    
    // Resume context if suspended by browser autoplay policy
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    if (type === 'click') {
      // Soft, warm organic woodblock tick
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } else if (type === 'blunder') {
      // Warm, dramatic low sub-bass pulse
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(80, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } else if (type === 'brilliancy') {
      // Radiant, high-frequency crystal bell chime
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    }
  } catch (e) {
    // Ignore audio context blockages
  }
}

/**
 * Central Zustand store for Chess Coach application state.
 * Manages: current view, API data, analysis board state, trainer state, coach personas, and psychological metrics.
 */
const useChessStore = create((set, get) => ({
  // ── View routing ──────────────────────────────────────────
  currentView: 'landing', // 'landing' | 'loading' | 'analysis' | 'patterns' | 'trainer'
  setCurrentView: (view) => {
    playSynthSound('click');
    set({ currentView: view });
  },

  // ── AI Coach Persona ─────────────────────────────────────
  coachPersona: 'grandmaster', // 'grandmaster' | 'demon' | 'teacher' | 'brutal'
  setCoachPersona: (persona) => {
    playSynthSound('click');
    set({ coachPersona: persona });
  },

  // ── Game data (loaded from /analyze API) ──────────────────
  username: '',
  games: [],       // processed game objects
  positions: [],   // blunder positions for trainer
  apiData: null,   // raw API response
  psychProfile: null, // advanced Chess Personality & Playstyle metrics
  totalMissedBrilliancies: 0,
  setAnalysisData: ({ games, positions, apiData, username, psychProfile, totalMissedBrilliancies }) =>
    set({ games, positions, apiData, username, psychProfile, totalMissedBrilliancies }),

  // ── Analysis board state ──────────────────────────────────
  activeGameIdx: 0,
  activeMoveIdx: -1, // -1 = starting position
  setActiveGameIdx: (i) => {
    playSynthSound('click');
    set({ activeGameIdx: i, activeMoveIdx: -1 });
  },
  setActiveMoveIdx: (i) => {
    const { games, activeGameIdx } = get();
    const g = games[activeGameIdx];
    if (!g) return;
    const clamped = Math.max(-1, Math.min(g.moves.length - 1, i));
    
    // Play feedback sound based on move classification
    if (clamped >= 0 && g.moves[clamped]) {
      const cls = g.moves[clamped].cls;
      if (cls === 'blunder' || cls === 'mistake') {
        playSynthSound('blunder');
      } else if (cls === 'brilliant' || g.moves[clamped].imb) {
        playSynthSound('brilliancy');
      } else {
        playSynthSound('click');
      }
    } else {
      playSynthSound('click');
    }
    
    set({ activeMoveIdx: clamped });
  },
  navMove: (delta) => {
    const { games, activeGameIdx, activeMoveIdx } = get();
    const g = games[activeGameIdx];
    if (!g) return;
    const next = Math.max(-1, Math.min(g.moves.length - 1, activeMoveIdx + delta));
    
    if (next !== activeMoveIdx) {
      if (next >= 0 && g.moves[next]) {
        const cls = g.moves[next].cls;
        if (cls === 'blunder' || cls === 'mistake') {
          playSynthSound('blunder');
        } else if (cls === 'brilliant' || g.moves[next].imb) {
          playSynthSound('brilliancy');
        } else {
          playSynthSound('click');
        }
      } else {
        playSynthSound('click');
      }
    }
    
    set({ activeMoveIdx: next });
  },

  // ── Blunder trainer state ─────────────────────────────────
  trainerIdx: 0,
  trainerSel: null,     // selected square string
  trainerHints: [],     // legal move destinations
  trainerRevealed: false,
  trainerChosen: null,  // UCI move the user played
  trainerScore: { c: 0, t: 0 },
  trainerDone: new Set(),

  setTrainerIdx: (i) => {
    playSynthSound('click');
    set({
      trainerIdx: i, trainerSel: null, trainerHints: [],
      trainerRevealed: false, trainerChosen: null,
    });
  },
  setTrainerSel: (sq, hints) => set({ trainerSel: sq, trainerHints: hints }),
  submitTrainerMove: (uci) => {
    const { positions, trainerIdx, trainerScore, trainerDone } = get();
    const pos = positions[trainerIdx];
    if (!pos) return;
    const ok = uci === pos.best;
    
    // Play feedback sound immediately
    if (ok) {
      playSynthSound('brilliancy');
    } else {
      playSynthSound('blunder');
    }
    
    const newDone = new Set(trainerDone);
    newDone.add(trainerIdx);
    set({
      trainerChosen: uci,
      trainerRevealed: true,
      trainerSel: null,
      trainerHints: [],
      trainerScore: { c: trainerScore.c + (ok ? 1 : 0), t: trainerScore.t + 1 },
      trainerDone: newDone,
    });
  },
  revealTrainer: () => {
    playSynthSound('blunder');
    const { trainerScore, trainerIdx, trainerDone } = get();
    const newDone = new Set(trainerDone);
    newDone.add(trainerIdx);
    set({
      trainerRevealed: true,
      trainerScore: { ...trainerScore, t: trainerScore.t + 1 },
      trainerDone: newDone,
    });
  },
  resetTrainer: () => set({ trainerSel: null, trainerHints: [], trainerRevealed: false, trainerChosen: null }),
  navTrainer: (delta) => {
    playSynthSound('click');
    const { positions, trainerIdx } = get();
    const next = Math.max(0, Math.min(positions.length - 1, trainerIdx + delta));
    set({
      trainerIdx: next, trainerSel: null, trainerHints: [],
      trainerRevealed: false, trainerChosen: null,
    });
  },

  // ── Session helpers ───────────────────────────────────────
  clearSession: () => set({
    games: [], positions: [], apiData: null, username: '',
    psychProfile: null, totalMissedBrilliancies: 0, coachPersona: 'grandmaster',
    activeGameIdx: 0, activeMoveIdx: -1,
    trainerIdx: 0, trainerSel: null, trainerHints: [],
    trainerRevealed: false, trainerChosen: null,
    trainerScore: { c: 0, t: 0 }, trainerDone: new Set(),
  }),
}));

export default useChessStore;
