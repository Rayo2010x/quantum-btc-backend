
import { useState, useEffect } from 'react';
import { Layout } from './components/ui/Layout';
import type { ViewType } from './components/ui/Layout';
import { BetControls } from './components/game/BetControls';
import { GameApi } from './lib/api';
import { VerifyHistoryView } from './components/history/VerifyHistoryView';
import { WhitePaperView } from './components/whitepaper/WhitePaperView';
import { FeaturesView } from './components/features/FeaturesView';
import { StatisticsView } from './components/statistics/StatisticsView';
import { CampaignBanner } from './components/CampaignBanner';
import { RegistrationModal } from './components/RegistrationModal';
import { FaqView } from './components/faq/FaqView';

function App() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<ViewType>('whitepaper');
  
  // Campaign State
  const [isRegistered, setIsRegistered] = useState(true); // Default true to hide banner while loading
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBannerDismissed, setIsBannerDismissed] = useState(() => {
    return localStorage.getItem('qb_campaign_dismissed') === 'true';
  });

  useEffect(() => {
    // Init session on load
    GameApi.initSession().then(async (id) => {
        setSessionId(id);
        // Check PQ-Rewards registration status
        try {
            const status = await GameApi.checkCampaignStatus(id);
            setIsRegistered(status.registered);
        } catch (error) {
            console.error("Error checking campaign status:", error);
        }
    });
  }, []);

  const handleRegisterCampaign = async (address: string) => {
      if (!sessionId) return;
      await GameApi.registerCampaign(sessionId, address);
      setIsRegistered(true);
  };

  return (
    <Layout 
      currentView={currentView} 
      onViewChange={setCurrentView}
      isRegistered={isRegistered}
      onRegisterClick={() => setIsModalOpen(true)}
    >

      {currentView === 'whitepaper' && (
        <WhitePaperView />
      )}

      {currentView === 'features' && (
        <FeaturesView />
      )}

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

      {currentView === 'statistics' && (
        <StatisticsView />
      )}

      {currentView === 'faq' && (
        <FaqView />
      )}

      {currentView === 'history' && (
        <VerifyHistoryView 
          sessionId={sessionId} 
          onRegisterClick={() => setIsModalOpen(true)}
        />
      )}

      {/* Campaign UI Flow */}
      {!isRegistered && !isBannerDismissed && (
        <CampaignBanner 
          onRegisterClick={() => setIsModalOpen(true)} 
          onDismiss={() => {
            setIsBannerDismissed(true);
            localStorage.setItem('qb_campaign_dismissed', 'true');
          }}
        />
      )}

      <RegistrationModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleRegisterCampaign}
      />

    </Layout>
  );
}

export default App;
