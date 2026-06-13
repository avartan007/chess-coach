import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useChessStore, { playSynthSound } from '../store/useChessStore';

const PERSONA_DETAILS = {
  grandmaster: {
    name: 'Grandmaster Coach',
    title: 'Elite Classical Mentor',
    icon: '👑',
    avatarBg: 'linear-gradient(135deg, #F7DAC4 0%, #D06020 100%)',
    description: 'Calculates structural advantages, pawn coordinate hierarchies, and classical grandmaster principles with deep strategic foresight.',
    greeting: 'Welcome back. I have analyzed your recent matches against the engine. Let us examine your coordinates, playstyle constraints, and strategic imbalances.'
  },
  demon: {
    name: 'Tactical Demon',
    title: 'Esports Attack Specialist',
    icon: '👹',
    avatarBg: 'linear-gradient(135deg, #B83C24 0%, #E27D38 100%)',
    description: 'Thrives on absolute tactical chaos, mating nets, aggressive sacrifices, and overwhelming pressure. Demands dynamic initiative.',
    greeting: 'ACTIVE TARGET ACQUIRED! I scanned your games—some beautiful tactical shots, but also some absolute collapses! Let’s hunt down your weaknesses and crush them!'
  },
  teacher: {
    name: 'Calm Teacher',
    title: 'Positional & Psychological Mentor',
    icon: '🧘',
    avatarBg: 'linear-gradient(135deg, #4FAE78 0%, #3CB8C4 100%)',
    description: 'Focuses on emotional composure, consistent move pacing, piece harmony, and cognitive breathing. Your psychological growth anchor.',
    greeting: 'Hello, my friend. Let us take a deep, mindful breath. Mistakes are not failures—they are simply landmarks on your journey to rated mastery.'
  },
  brutal: {
    name: 'Brutal Analyzer',
    title: 'Uncensored Critique Engine',
    icon: '💀',
    avatarBg: 'linear-gradient(135deg, #BAA28C 0%, #7A5E4B 100%)',
    description: 'Direct, dry, and brutally honest. Calls out lazy calculations and garbage blunders without sugarcoating.',
    greeting: 'Well, well. I looked at your games. Frankly, some of those move selections were absolute garbage. Let’s sit down and figure out why you kept hanging pieces.'
  }
};

// Heuristic RAG Response Generator
function generateCoachReply(message, profile, username, games, persona) {
  const query = message.toLowerCase();
  const arche = profile?.archetype || 'The Universal Strategist';
  const player = profile?.famous_player || 'Bobby Fischer';
  const blunderRate = profile?.blunder_rate_percent || 0;
  const worstSq = (profile?.worstSq || 'f7').toUpperCase();
  const worstSqCount = profile?.worstCount || 0;
  const rushing = profile?.rushing_blunders || 0;
  const chains = profile?.blunder_chains || 0;
  const queenDrop = profile?.queen_loss_drop || 0;
  const wins = profile?.wins || 0;
  const losses = profile?.losses || 0;

  let reply = '';

  if (query.includes('style') || query.includes('personality') || query.includes('who am i') || query.includes('diagnose')) {
    switch (persona) {
      case 'demon':
        reply = `YOU ARE AN ATTACKING BEAST! The telemetry maps you as ${arche.toUpperCase()}! You share direct tactical DNA with ${player.toUpperCase()}! You love aggressive complications, but your aggression score is ${profile?.aggression || 50}%. We need to turn up the heat! Stop playing passive defense and start throwing pawns at their king! Let's get aggressive!`;
        break;
      case 'teacher':
        reply = `Your playstyle aligns beautifully with ${arche}. You share the classical harmony of ${player}. Your patience index sits at ${profile?.patience || 50}%, which shows a healthy capacity for strategic waiting. However, we must ensure your safety score (${profile?.safety || 50}%) remains stable under tactical storms. Focus on steady piece development first.`;
        break;
      case 'brutal':
        reply = `They call your playstyle "${arche}"—which is a fancy way of saying you play like ${player}. Honestly, your complexity index is ${profile?.complexity || 50}%, meaning you construct incredibly chaotic positions only to blunder them away. You have some active attacking ideas, but your safety is severely lacking. Let's make piece security a rule.`;
        break;
      case 'grandmaster':
      default:
        reply = `My evaluation classifies your strategic archetype as ${arche}, showing structural tendencies comparable to ${player}. Your aggression index is calibrated at ${profile?.aggression || 50}% against a positional patience score of ${profile?.patience || 50}%. This suggests a classic mid-complexity profile. To advance, you must refine your transition phases and master back-rank piece coordination.`;
    }
  } else if (query.includes('blunder') || query.includes('queen') || query.includes('lose') || query.includes('mistake')) {
    switch (persona) {
      case 'demon':
        reply = `TACTICAL COLLAPSE WARNING! Your blunder rate is ${blunderRate}%! That is too high! And look here: you suffered a queen loss accuracy drop of ${queenDrop}%! You are panic-capturing when things go wrong! When you lose material, you must NOT collapse. Double down on active counter-attacks instead of hanging more pieces!`;
        break;
      case 'teacher':
        reply = `It appears you have a blunder rate of ${blunderRate}%. Do not be discouraged. A key pattern I noticed is your time pressure performance: you made ${rushing} errors in under 2 seconds of thinking time! This indicates move-rushing. Next time you face a threat, take a slow 5-second pause to evaluate your candidate options.`;
        break;
      case 'brutal':
        reply = `You have a blunder rate of ${blunderRate}%. Under 2% is grandmaster standard; your score is, well, amateur. You committed ${rushing} blunders in under 2 seconds, which is absolutely brainless. You also had ${chains} back-to-back blunder chains—meaning once you make one mistake, you immediately follow it with another one. Wake up!`;
        break;
      case 'grandmaster':
      default:
        reply = `Your tactical blunder coefficient is currently measured at ${blunderRate}%. The primary structural vulnerability I isolated is move rushing: you committed ${rushing} errors in under 1.8 seconds of evaluation. Additionally, you triggered ${chains} consecutive error chains, indicating a psychological struggle to reset after a setback. Focus on tactical double-checks on move 15-25.`;
    }
  } else if (query.includes('coordinate') || query.includes('square') || query.includes('hotspot') || query.includes('f7')) {
    switch (persona) {
      case 'demon':
        reply = `BOARD DEFENSE WARNING! Your worst coordinate hotspot is ${worstSq}! You committed ${worstSqCount} critical tactical errors on this exact square! Opponents are targeting your ${worstSq} square because you leave it completely undefended! Next game, place a bishop or rook to guard ${worstSq} and blow open their lines instead!`;
        break;
      case 'teacher':
        reply = `Our tactical hotspot mapping has identified the ${worstSq} square as a recurring coordinate vulnerability, with ${worstSqCount} errors occurring here. Often, this happens because we lose track of undefended pieces. Try to visualize an invisible green coordinate line connecting your pieces on ${worstSq}.`;
        break;
      case 'brutal':
        reply = `You committed ${worstSqCount} errors on ${worstSq}. Frankly, it is embarrassing. You are completely blind to threats on the ${worstSq} square. Stop leaving your pieces completely undefended in the center of the board. Guard ${worstSq} or expect to keep losing.`;
        break;
      case 'grandmaster':
      default:
        reply = `A spatial analysis of your coordinates maps a significant tactical hotspot on ${worstSq}, accumulating ${worstSqCount} errors across ${games.length} games. This coordinate weakness typically stems from a failure to calculate opponent line-of-sight attacks across the Z-axis. Ensure your pieces on ${worstSq} are fully supported.`;
    }
  } else if (query.includes('tilt') || query.includes('angry') || query.includes('panic') || query.includes('streaks')) {
    switch (persona) {
      case 'demon':
        reply = `TILT DETECTED! You entered ${chains} blunder chains! When you make a mistake, you go into an aggressive frenzy and throw the game away! Don't let them get in your head! Channel that fire into a calculated checkmate storm instead of rapid-fire panic moves!`;
        break;
      case 'teacher':
        reply = `Emotional tilt is a natural hurdle. I see your material loss drop sits at ${queenDrop}%, indicating a significant composure shift after losing major pieces. Let us make a commitment: when you lose a major piece, hands off the mouse. Take a deep, conscious breath, count to three, and only then proceed.`;
        break;
      case 'brutal':
        reply = `Your composure is highly unstable. Your accuracy drops by ${queenDrop}% immediately after losing material. You are panic-moving. You also had ${chains} mistake cycles. If you keep playing blitz scrambles when you are tilted, you will continue your rated slide. Close the tab and rest.`;
        break;
      case 'grandmaster':
      default:
        reply = `A psychological audit reveals a composure deficit under material stress: your accuracy index drops by ${queenDrop}% in post-queen-loss phases. This creates an immediate cognitive cascade of ${chains} consecutive blunders. I recommend implementing a 10-second buffer rule immediately following any material transition.`;
    }
  } else if (query.includes('roadmap') || query.includes('train') || query.includes('next') || query.includes('practice')) {
    switch (persona) {
      case 'demon':
        reply = `TIME FOR TACTICAL DRILLS! We are targeting your Week 1 roadmap: Queen Safety and Rushing Mitigation! You need to practice forced mate nets and stop clicking instantly! Attack, attack, and solve those progression modules! Let's get to work!`;
        break;
      case 'teacher':
        reply = `For your next developmental milestone, I recommend focusing on Week 1 of your adaptive roadmap: Queen Safety & Composure. Practice coordinates and slow down your pacing. You have completed several games; let us refine our baseline positional patience first.`;
        break;
      case 'brutal':
        reply = `What you need to train is basic tactical awareness. You need to focus on Week 1: Queen Safety. You keep gifting queens in open files. Solve the blunder puzzles, and don't try to unlock Week 2 until you can solve Week 1 without guessing.`;
        break;
      case 'grandmaster':
      default:
        reply = `Your calculated developmental path directs you to prioritize Week 1 of the progression roadmap, specifically: Rushing Mitigation and Coordinate Integrity. Focus on resolving the puzzles in the Blunder Trainer to stabilize your tactical baseline before advancing to middlegame structures.`;
    }
  } else {
    // General fallback
    switch (persona) {
      case 'demon':
        reply = `I LIKE THE ENERGY! Let’s keep attacking! We have analyzed ${games.length} matches. Ask me about your Blunder Rate, Tilt Warnings, Worst Square, or Opening DNA, and let’s crush the next opponent!`;
        break;
      case 'teacher':
        reply = `That is an interesting question, my friend. Reflecting on our analysis of ${games.length} games, we see clear pathways ofrated improvement. Would you like to explore your Chess Personality profile, Tilt composition, or Opening recommendations?`;
        break;
      case 'brutal':
        reply = `I have no idea what you are trying to ask, but I suggest you look at your actual statistics. We have ${games.length} games of raw proof. Ask about your blunders, playstyle, or opening deviations if you actually want to rated-up.`;
        break;
      case 'grandmaster':
      default:
        reply = `An intriguing query. Across our sample size of ${games.length} engine-evaluated games, the behavioral patterns point toward a solid strategic base with critical tactical bottlenecks. I can clarify your Playstyle metrics, Composure tilt ratings, or recommend opening expansions.`;
    }
  }

  return reply;
}

export default function CoachView() {
  const { games, psychProfile, username, coachPersona } = useChessStore();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  const activePersona = PERSONA_DETAILS[coachPersona] || PERSONA_DETAILS.grandmaster;

  // Initialize with greeting
  useEffect(() => {
    setMessages([
      {
        id: 'welcome',
        sender: 'coach',
        text: activePersona.greeting,
        timestamp: new Date()
      }
    ]);
  }, [coachPersona]);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = (textToSend) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    // Play click sound
    playSynthSound('click');

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    
    // Trigger typing indicator
    setIsTyping(true);

    setTimeout(() => {
      const replyText = generateCoachReply(text, psychProfile, username, games, coachPersona);
      
      // Play chimes sound on reply
      playSynthSound('brilliancy');

      const coachMsg = {
        id: `coach-${Date.now()}`,
        sender: 'coach',
        text: replyText,
        timestamp: new Date()
      };

      setIsTyping(false);
      setMessages(prev => [...prev, coachMsg]);
    }, 900);
  };

  const PRESET_QUERIES = [
    { text: '📊 Analyze my playstyle DNA', label: 'Playstyle DNA' },
    { text: '⏳ Why do I keep rushing my moves?', label: 'Pacing & Pushes' },
    { text: '🎯 Explain my worst board coordinate error', label: 'Worst Hotspot' },
    { text: '🧠 How can I prevent emotional tilt?', label: 'Composure & Tilt' },
    { text: '♟ Recommended openings for my style', label: 'Opening DNA' }
  ];

  return (
    <div className="h-full flex flex-col p-6 overflow-hidden max-w-6xl mx-auto">
      {/* View Header */}
      <div className="mb-6 shrink-0 flex items-baseline gap-3">
        <h2 className="font-outfit text-2xl font-800 text-[#F7EFE4]">AI Coaching Assistant</h2>
        <span className="font-mono text-[11px] text-[#7A5E4B]">
          {username ? `${username} · ` : ''} Conversational Coach active · {activePersona.title}
        </span>
      </div>

      {/* Main Two-Column Layout */}
      <div className="flex-1 flex gap-6 overflow-hidden min-h-0">
        
        {/* Left Column: Active Coach Bio */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="w-80 shrink-0 glass rounded-2xl p-6 flex flex-col justify-between"
          style={{ background: 'rgba(26,18,14,0.65)' }}
        >
          <div className="flex flex-col items-center text-center">
            {/* Avatar Shield */}
            <div 
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: activePersona.avatarBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 36,
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                marginBottom: 16
              }}
            >
              {activePersona.icon}
            </div>

            {/* Coach Details */}
            <h3 className="font-outfit font-900 text-xl text-[#F7EFE4] mb-0.5">{activePersona.name}</h3>
            <span 
              className="font-mono text-[10px] uppercase tracking-widest font-700 mb-4"
              style={{ color: PERSONA_DETAILS[coachPersona] ? PERSONA_DETAILS[coachPersona].color : '#BAA28C' }}
            >
              {activePersona.title}
            </span>
            <p className="text-xs text-[#BAA28C] leading-relaxed mb-6 border-t border-white/[0.04] pt-4">
              {activePersona.description}
            </p>
          </div>

          {/* Quick stats panel */}
          <div className="glass rounded-xl p-4 border border-white/[0.03] bg-black/20">
            <div className="text-[9px] font-mono font-700 uppercase tracking-wider text-[#7A5E4B] mb-2.5">Coach Details & State</div>
            <div className="space-y-1.5 font-mono text-[10px] text-[#BAA28C]">
              <div className="flex justify-between">
                <span>Active Core:</span>
                <span className="text-[#F7DAC4]">Stockfish 16 + RAG</span>
              </div>
              <div className="flex justify-between">
                <span>Persona State:</span>
                <span style={{ color: PERSONA_DETAILS[coachPersona] ? PERSONA_DETAILS[coachPersona].color : '#BAA28C' }}>Locked-In</span>
              </div>
              <div className="flex justify-between">
                <span>Personal Memory:</span>
                <span className="text-[#4FAE78]">Active ({games.length} games)</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Column: Immersive Conversational Box */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="flex-1 glass rounded-2xl flex flex-col overflow-hidden relative"
        >
          {/* Ambient Glowing Halo */}
          <div 
            style={{
              position: 'absolute',
              top: -150,
              right: -150,
              width: 300,
              height: 300,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(226,125,56,0.06) 0%, rgba(226,125,56,0) 70%)',
              pointerEvents: 'none'
            }}
          />

          {/* Messages Log */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 pr-3 custom-scrollbar">
            <AnimatePresence initial={false}>
              {messages.map(msg => {
                const isUser = msg.sender === 'user';
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 12, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.25 }}
                    style={{
                      display: 'flex',
                      justifyContent: isUser ? 'flex-end' : 'flex-start'
                    }}
                  >
                    <div 
                      className={`max-w-[80%] rounded-2xl px-5 py-3.5 text-[12.5px] leading-relaxed shadow-lg ${
                        isUser 
                          ? 'bg-[#E27D38] text-chess-bg font-600 rounded-tr-sm' 
                          : 'glass rounded-tl-sm border-l-2'
                      }`}
                      style={{
                        borderLeftColor: !isUser ? (PERSONA_DETAILS[coachPersona]?.color || '#E27D38') : undefined,
                        background: !isUser ? 'rgba(26,18,14,0.72)' : undefined,
                        color: !isUser ? '#BAA28C' : undefined
                      }}
                    >
                      {/* Coach label */}
                      {!isUser && (
                        <div 
                          className="font-mono text-[9px] font-700 uppercase tracking-widest mb-1"
                          style={{ color: PERSONA_DETAILS[coachPersona]?.color || '#E27D38' }}
                        >
                          {PERSONA_DETAILS[coachPersona]?.name || 'Coach'}
                        </div>
                      )}
                      <p className={isUser ? 'text-[#0a0805]' : 'text-[#F7EFE4]'}>{msg.text}</p>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="glass rounded-2xl rounded-tl-sm px-5 py-3.5 flex gap-1.5 items-center bg-black/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber animate-pulse" />
                  <div className="w-1.5 h-1.5 rounded-full bg-amber animate-pulse" style={{ animationDelay: '0.2s' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-amber animate-pulse" style={{ animationDelay: '0.4s' }} />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Query Shortcuts */}
          <div className="px-6 py-3 border-t border-white/[0.04] bg-black/10 flex gap-2 flex-wrap shrink-0">
            {PRESET_QUERIES.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q.text)}
                className="glass px-3 py-1.5 rounded-lg text-[10.5px] text-[#BAA28C] hover:text-[#F7EFE4] hover:border-amber/40 hover:bg-amber/[0.03] transition-all cursor-pointer font-mono"
              >
                {q.label}
              </button>
            ))}
          </div>

          {/* Message Input Box */}
          <div className="p-4 border-t border-white/[0.06] bg-black/35 flex gap-3 items-center shrink-0">
            <input
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
              placeholder={`Type a question for ${activePersona.name}…`}
              className="flex-1 bg-black/40 border border-white/[0.08] rounded-xl px-5 py-3.5 text-sm text-[#F7EFE4] focus:outline-none focus:border-amber/50 placeholder-[#7A5E4B] transition-all"
            />
            <button
              onClick={() => handleSend()}
              className="btn-primary"
              style={{
                padding: '12px 24px',
                borderRadius: 12,
                height: 46
              }}
            >
              Consult Coach
            </button>
          </div>

        </motion.div>

      </div>
    </div>
  );
}
