
import React from 'react';
export type ViewType = 'whitepaper' | 'game' | 'statistics' | 'faq' | 'history';

interface LayoutProps {
    children: React.ReactNode;
    currentView?: ViewType;
    onViewChange?: (view: ViewType) => void;
    isRegistered?: boolean;
    onRegisterClick?: () => void;
}

export function Layout({ children, currentView = 'whitepaper', onViewChange, isRegistered = true, onRegisterClick }: LayoutProps) {
    return (
        <div className="min-h-screen flex flex-col">
            {/* Header */}
            <header className="border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => onViewChange?.('game')}>
                    </div>

                    <nav className="flex gap-6 text-sm font-medium text-gray-400">
                        <button
                            onClick={() => onViewChange?.('whitepaper')}
                            className={`transition-colors hover:text-primary ${currentView === 'whitepaper' ? 'text-primary font-bold' : ''}`}
                        >
                            White Paper
                        </button>
                        <button
                            onClick={() => onViewChange?.('game')}
                            className={`transition-colors hover:text-primary ${currentView === 'game' ? 'text-primary font-bold' : ''}`}
                        >
                            Roulette
                        </button>
                        <button
                            onClick={() => onViewChange?.('statistics')}
                            className={`transition-colors hover:text-primary ${currentView === 'statistics' ? 'text-primary font-bold' : ''}`}
                        >
                            Statistics
                        </button>
                        <button
                            onClick={() => onViewChange?.('faq')}
                            className={`transition-colors flex items-center gap-1 hover:text-primary ${currentView === 'faq' ? 'text-primary font-bold' : ''}`}
                        >
                            FAQ
                        </button>
                        <button
                            onClick={() => onViewChange?.('history')}
                            className={`transition-colors hover:text-primary flex items-center gap-2 ${currentView === 'history' ? 'text-primary font-bold' : ''}`}
                        >
                            Verify (Fair) & History
                        </button>
                        
                        {!isRegistered && onRegisterClick && (
                            <div className="pl-4 ml-2 border-l border-white/10 flex items-center">
                                <button 
                                    onClick={onRegisterClick}
                                    className="text-xs font-bold text-black bg-primary px-3 py-1.5 rounded-full hover:bg-secondary transition-colors uppercase tracking-wider shadow-[0_0_10px_rgba(72,216,216,0.5)]"
                                >
                                    Link Session
                                </button>
                            </div>
                        )}
                    </nav>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
                {children}
            </main>

            {/* Footer */}
            <footer className="border-t border-white/5 py-8 mt-auto">
                <div className="max-w-7xl mx-auto px-4 text-center text-gray-600 text-sm">
                    <p>© 2026 Quantum BTC. Powered by the BTC Lightning Network.</p>
                </div>
            </footer>
        </div>
    );
}
