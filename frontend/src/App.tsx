
import { useState, useEffect } from 'react';
import { Layout } from './components/ui/Layout';
import { BetControls } from './components/game/BetControls';
import { GameApi } from './lib/api';

function App() {
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    // Init session on load
    GameApi.initSession().then(id => setSessionId(id));
  }, []);

  return (
    <Layout>
      <div className="flex flex-col items-center justify-start min-h-[80vh] text-center space-y-10">

        {/* Hero Section */}
        <div className="space-y-4 pt-8">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter">
            PROVABLY <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">QUANTUM</span> FAIR
          </h1>
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto">
            Europe's finest roulette powered by real-time quantum fluctuations.
          </p>
        </div>

        {/* Game Area */}
        <BetControls />

        {/* Footer info */}
        <div className="text-xs text-gray-600 font-mono">
          Session ID: {sessionId || 'Initializing...'}
        </div>
      </div>
    </Layout>
  );
}

export default App;
