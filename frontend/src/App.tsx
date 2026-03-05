
import { useState, useEffect } from 'react';
import { Layout } from './components/ui/Layout';
import type { ViewType } from './components/ui/Layout';
import { BetControls } from './components/game/BetControls';
import { GameApi } from './lib/api';
import { VerifyHistoryView } from './components/history/VerifyHistoryView';

function App() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<ViewType>('game');
  // Verify handling is now inside VerifyHistoryView

  useEffect(() => {
    // Init session on load
    GameApi.initSession().then(id => setSessionId(id));
  }, []);

  return (
    <Layout currentView={currentView} onViewChange={setCurrentView}>

      {currentView === 'game' && (
        <div className="flex flex-col items-center justify-start min-h-[80vh] text-center space-y-10">
          {/* Hero Section */}
          <div className="space-y-4 pt-8">
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter font-display">
              QUANTUM FAIR <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">ROULETTE</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto">
              Entropy powered by real quantum fluctuations
            </p>
          </div>

          {/* Game Area */}
          <BetControls />

          {/* Footer info */}
          <div className="text-xs text-gray-600 font-mono">
            Session ID: {sessionId || 'Initializing...'}
          </div>
        </div>
      )}

      {currentView === 'history' && (
        <VerifyHistoryView sessionId={sessionId} />
      )}

    </Layout>
  );
}

export default App;
