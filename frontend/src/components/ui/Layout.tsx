
import React, { useState } from 'react';
export type ViewType = 'whitepaper' | 'features' | 'game' | 'statistics' | 'faq' | 'history';

interface LayoutProps {
    children: React.ReactNode;
    currentView?: ViewType;
    onViewChange?: (view: ViewType) => void;
    isRegistered?: boolean;
    onRegisterClick?: () => void;
}

const NAV_ITEMS: { view: ViewType; label: string }[] = [
    { view: 'whitepaper', label: 'White Paper' },
    { view: 'features',   label: 'Features' },
    { view: 'game',       label: 'Roulette' },
    { view: 'statistics', label: 'Statistics' },
    { view: 'faq',        label: 'FAQ' },
    { view: 'history',    label: 'Verify (Fair) & History' },
];

export function Layout({ children, currentView = 'whitepaper', onViewChange, isRegistered = true, onRegisterClick }: LayoutProps) {
    const [menuOpen, setMenuOpen] = useState(false);

    const handleNavClick = (view: ViewType) => {
        onViewChange?.(view);
        setMenuOpen(false);
    };
    return (
        <div className="min-h-screen flex flex-col">
            {/* Header */}
            <header className="border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => onViewChange?.('game')}>
                    </div>

                    {/* Desktop nav — hidden on mobile */}
                    <nav className="hidden md:flex gap-6 text-sm font-medium text-gray-400">
                        {NAV_ITEMS.map(({ view, label }) => (
                            <button
                                key={view}
                                onClick={() => handleNavClick(view)}
                                className={`transition-colors hover:text-primary ${currentView === view ? 'text-primary font-bold' : ''}`}
                            >
                                {label}
                            </button>
                        ))}

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

                    {/* Hamburger button — visible only on mobile */}
                    <button
                        aria-label="Open navigation menu"
                        aria-expanded={menuOpen}
                        onClick={() => setMenuOpen(prev => !prev)}
                        className="md:hidden flex flex-col justify-center items-center w-9 h-9 gap-1.5 rounded-md text-gray-400 hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                        <span className={`block h-0.5 w-5 bg-current transition-all duration-300 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
                        <span className={`block h-0.5 w-5 bg-current transition-all duration-300 ${menuOpen ? 'opacity-0' : ''}`} />
                        <span className={`block h-0.5 w-5 bg-current transition-all duration-300 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
                    </button>
                </div>

                {/* Mobile dropdown — collapses when closed */}
                {menuOpen && (
                    <div className="md:hidden border-t border-white/10 bg-black/80 backdrop-blur-md">
                        <nav className="flex flex-col px-4 py-2 gap-1 text-sm font-medium text-gray-400">
                            {NAV_ITEMS.map(({ view, label }) => (
                                <button
                                    key={view}
                                    onClick={() => handleNavClick(view)}
                                    className={`w-full text-left py-3 px-2 rounded-md transition-colors hover:text-primary hover:bg-white/5 ${currentView === view ? 'text-primary font-bold' : ''}`}
                                >
                                    {label}
                                </button>
                            ))}

                            {!isRegistered && onRegisterClick && (
                                <div className="pt-2 pb-3 border-t border-white/10 mt-1">
                                    <button
                                        onClick={() => { onRegisterClick(); setMenuOpen(false); }}
                                        className="text-xs font-bold text-black bg-primary px-3 py-1.5 rounded-full hover:bg-secondary transition-colors uppercase tracking-wider shadow-[0_0_10px_rgba(72,216,216,0.5)]"
                                    >
                                        Link Session
                                    </button>
                                </div>
                            )}
                        </nav>
                    </div>
                )}
            </header>

            {/* Main Content */}
            <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
                {children}
            </main>

            {/* Footer */}
            <footer className="border-t border-white/5 py-8 mt-auto">
                <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between text-gray-600 text-sm gap-6">
                    <p>© 2026 QuantumBTC. Powered by the BTC Lightning Network.</p>
                    <div className="flex flex-col sm:flex-row items-center gap-4 flex-wrap justify-center">
                        <span className="text-gray-400">You can contact us and/or follow our research at:</span>
                        <div className="flex gap-2">
                            <a href="https://primal.net/p/nprofile1qqsvzhkrdx639mwh3srsuuk0rsecy8xankpwyhyy54kuu3xhfjw0tzgyxf46q" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center text-primary w-[38px] h-[38px] rounded-full bg-white/5 border border-white/10 transition-all duration-300 hover:bg-white/10 hover:-translate-y-0.5 hover:shadow-[0_4px_15px_rgba(255,255,255,0.08)] hover:border-primary" aria-label="Nostr">
                                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92c0-1.61-1.31-2.92-2.92-2.92z"/></svg>
                            </a>
                            <a href="https://x.com/QuantumBTCdev" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center text-primary w-[38px] h-[38px] rounded-full bg-white/5 border border-white/10 transition-all duration-300 hover:bg-white/10 hover:-translate-y-0.5 hover:shadow-[0_4px_15px_rgba(255,255,255,0.08)] hover:border-primary" aria-label="X">
                                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                            </a>
                            <a href="https://discord.gg/v6a7zqn5qR" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center text-primary w-[38px] h-[38px] rounded-full bg-white/5 border border-white/10 transition-all duration-300 hover:bg-white/10 hover:-translate-y-0.5 hover:shadow-[0_4px_15px_rgba(255,255,255,0.08)] hover:border-primary" aria-label="Discord">
                                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z"/></svg>
                            </a>
                            <a href="https://t.me/QuantumBTCDev" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center text-primary w-[38px] h-[38px] rounded-full bg-white/5 border border-white/10 transition-all duration-300 hover:bg-white/10 hover:-translate-y-0.5 hover:shadow-[0_4px_15px_rgba(255,255,255,0.08)] hover:border-primary" aria-label="Telegram">
                                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.94z"/></svg>
                            </a>
                            <a href="https://github.com/Rayo2010x" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center text-primary w-[38px] h-[38px] rounded-full bg-white/5 border border-white/10 transition-all duration-300 hover:bg-white/10 hover:-translate-y-0.5 hover:shadow-[0_4px_15px_rgba(255,255,255,0.08)] hover:border-primary" aria-label="GitHub">
                                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.303 3.438 9.8 8.205 11.385.6.11.82-.26.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.332-1.755-1.332-1.755-1.09-.745.082-.73.082-.73 1.205.085 1.84 1.235 1.84 1.235 1.07 1.835 2.805 1.305 3.49.995.105-.775.42-1.305.76-1.605-2.665-.3-5.466-1.335-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.125-.305-.535-1.525.115-3.175 0 0 1.005-.32 3.3 1.23.96-.265 1.98-.395 3-.4 1.02.005 2.04.135 3 .4 2.295-1.55 3.295-1.23 3.295-1.23.65 1.65.24 2.87.12 3.175.77.84 1.235 1.91 1.235 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.605-.015 2.896-.015 3.286 0 .32.215.694.825.576C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z"/></svg>
                            </a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
