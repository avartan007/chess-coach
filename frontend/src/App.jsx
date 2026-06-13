import React, { useEffect, Suspense, lazy } from 'react';
import useChessStore from './store/useChessStore';
import { useScrollProgress } from './hooks/useScrollProgress';
import { analyzeGames, saveSession, loadSession, transformApiData } from './api/api';
import NavBar from './components/UI/NavBar';

// Lazy-load heavy components
const ChessWorld = lazy(() => import('./components/ChessWorld/ChessWorld'));
const HeroSection = lazy(() => import('./sections/HeroSection'));
const AnalysisSection = lazy(() => import('./sections/AnalysisSection'));
const BlunderSection = lazy(() => import('./sections/BlunderSection'));
const CheckmateSection = lazy(() => import('./sections/CheckmateSection'));
const AnalysisView = lazy(() => import('./views/AnalysisView'));
const PatternsView = lazy(() => import('./views/PatternsView'));
const TrainerView = lazy(() => import('./views/TrainerView'));
const CoachView = lazy(() => import('./views/CoachView'));

function LandingPage({ scrollProgress, onStart }) {
  return (
    <div className="relative z-10">
      {/* Scrollable content stacked vertically */}
      <HeroSection scrollProgress={scrollProgress} onStart={onStart} />
      <AnalysisSection scrollProgress={scrollProgress} />
      <BlunderSection scrollProgress={scrollProgress} />
      <CheckmateSection />
    </div>
  );
}

function LoadingScreen({ username }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-chess-bg">
      <div className="glass rounded-2xl p-16 text-center max-w-md w-full mx-4">
        <div className="text-7xl mb-6 animate-float filter drop-shadow-lg" style={{ color: '#E27D38' }}>♚</div>
        <h2 className="font-outfit text-2xl font-700 mb-3">
          Analyzing{' '}
          <span className="text-amber">{username}</span>
        </h2>
        <p className="text-[#BAA28C] text-sm mb-2">
          Fetching recent games from Chess.com…
        </p>
        <p className="text-[#7A5E4B] text-xs leading-relaxed">
          Running Stockfish depth-14 evaluation. This takes 10–30 seconds depending on game length.
        </p>
        <div className="mt-8 flex gap-1.5 justify-center">
          {[0, 1, 2, 3, 4].map(i => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-amber"
              style={{ animation: `pulse-glow 1.2s ease-in-out ${i * 0.18}s infinite` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const {
    currentView, setCurrentView,
    setAnalysisData,
    clearSession,
  } = useChessStore();

  const { scrollProgress } = useScrollProgress();

  // Check for cached session on mount
  useEffect(() => {
    const cached = loadSession();
    if (cached?.username && cached?.apiData) {
      // Show resume button via SetupCard (handled there)
    }
  }, []);

  // Handle keyboard navigation in analysis view
  useEffect(() => {
    const { navMove } = useChessStore.getState();
    const handler = (e) => {
      if (currentView !== 'analysis') return;
      if (e.key === 'ArrowLeft')  navMove(-1);
      if (e.key === 'ArrowRight') navMove(1);
      if (e.key === 'ArrowUp')    navMove(-999);
      if (e.key === 'ArrowDown')  navMove(999);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [currentView]);

  const handleStart = async ({ username, count, fromCache }) => {
    if (fromCache) {
      const cached = loadSession();
      if (cached?.username && cached?.apiData) {
        const { games, positions, psychProfile, totalMissedBrilliancies } = transformApiData(cached.apiData, cached.username);
        setAnalysisData({ games, positions, apiData: cached.apiData, username: cached.username, psychProfile, totalMissedBrilliancies });
        setCurrentView('analysis');
        return;
      }
    }

    setCurrentView('loading');
    try {
      const data = await analyzeGames(username, count);
      saveSession(username, data);
      const { games, positions, psychProfile, totalMissedBrilliancies } = transformApiData(data, username);
      setAnalysisData({ games, positions, apiData: data, username, psychProfile, totalMissedBrilliancies });
      setCurrentView('analysis');
    } catch (err) {
      setCurrentView('landing');
      throw err; // re-throw so SetupCard can display the error
    }
  };

  const isLanding = currentView === 'landing';
  const isLoading = currentView === 'loading';

  return (
    <div className="min-h-screen bg-chess-bg text-[#F7EFE4]">
      {/* 3D Canvas — Fixed background, only rendered on landing */}
      {isLanding && (
        <Suspense fallback={null}>
          <ChessWorld scrollProgress={scrollProgress} />
        </Suspense>
      )}

      {/* Loading screen (overlay) */}
      {isLoading && (
        <LoadingScreen username={useChessStore.getState().username || '…'} />
      )}

      {/* Navigation — always visible except during loading */}
      {!isLoading && <NavBar />}

      {/* Main content */}
      <main className={isLanding ? '' : 'pt-16 h-screen overflow-hidden'}>
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-screen">
              <div className="text-[#7A5E4B] font-mono text-sm">Loading…</div>
            </div>
          }
        >
          {isLanding && (
            <LandingPage scrollProgress={scrollProgress} onStart={handleStart} />
          )}
          {currentView === 'analysis' && <AnalysisView />}
          {currentView === 'patterns' && <PatternsView />}
          {currentView === 'coach' && <CoachView />}
          {currentView === 'trainer' && <TrainerView />}
        </Suspense>
      </main>
    </div>
  );
}
