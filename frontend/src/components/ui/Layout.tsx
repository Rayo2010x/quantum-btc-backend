
import React from 'react';
import { Terminal } from 'lucide-react';

interface LayoutProps {
    children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
    return (
        <div className="min-h-screen flex flex-col">
            {/* Header */}
            <header className="border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary/20 rounded-md flex items-center justify-center border border-primary/50 text-primary">
                            <Terminal size={20} />
                        </div>
                        <span className="font-bold text-xl tracking-tight">
                            QUANTUM<span className="text-primary">BTC</span>
                        </span>
                    </div>

                    <nav className="flex gap-6 text-sm font-medium text-gray-400">
                        <a href="#" className="hover:text-primary transition-colors">Roulette</a>
                        <a href="#" className="hover:text-primary transition-colors">Verify (Fair)</a>
                        <a href="#" className="hover:text-primary transition-colors">History</a>
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
                    <p>© 2026 Quantum BTC. Powered by ANU Quantum Random Numbers & Lightning Network.</p>
                </div>
            </footer>
        </div>
    );
}
