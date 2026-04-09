import { BookOpen } from "lucide-react";

export function WhitePaperView() {
    return (
        <div className="flex flex-col items-center justify-start min-h-[80vh] text-left space-y-12 max-w-4xl mx-auto pb-16 animate-fade-in">
            {/* Header Section */}
            <div className="space-y-6 pt-8 text-center border-b border-white/5 pb-12 w-full">
                <div className="inline-flex items-center justify-center p-3 bg-white/5 rounded-2xl mb-4 border border-white/10 shadow-xl shadow-black/50">
                    <BookOpen className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter font-display leading-tight">
                    QuantumBTC <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary block md:inline">White Paper</span>
                </h1>
                <p className="text-lg md:text-xl text-gray-400 font-light max-w-2xl mx-auto">
                    Securing Satoshi's Vision in the Quantum Era
                </p>
                <div className="flex items-center justify-center gap-4 text-xs font-mono text-gray-500 pt-4">
                    <span className="bg-white/5 px-3 py-1 rounded-full border border-white/5">Version: 0.5</span>
                    <span className="bg-white/5 px-3 py-1 rounded-full border border-white/5">Date: 2026-04-09</span>
                    <span className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20">Status: APPROVED</span>
                </div>
            </div>

            {/* Content Body */}
            <div className="space-y-8 text-gray-300 leading-relaxed font-body text-lg w-full px-4 md:px-0">
                <p className="text-xl text-white font-medium leading-normal border-l-4 border-primary pl-6 -ml-6 py-2">
                    A coalition of physicists specializing in Quantum Mechanics, mathematicians expert in Cryptography, and seasoned Blockchain developers have united under a shared conviction: the philosophy of Satoshi Nakamoto.
                </p>

                <p>
                    Bitcoin represents a paradigm shift in financial sovereignty. Unlike fiat currencies—which are subject to inflationary policies, central bank manipulation, and arbitrary censorship—Bitcoin is governed by immutable math. Its true power lies in decentralization: a permissionless, distributed network where no single entity dictates the rules, ensuring true peer-to-peer financial freedom without intermediaries.
                </p>

                <p>
                    However, this team's primary mission is to ensure that Satoshi Nakamoto's visionary legacy endures the greatest looming threat of our time: the advent of Quantum Computing.
                </p>

                <p>
                    Conservative estimates predict that within a decade, quantum computers will reach a level of sophistication capable of shattering the cryptographic foundations securing much of the modern internet. This imminent threat endangers global banking systems, national defense networks, critical public infrastructure, healthcare systems, power grids, and, inevitably, Bitcoin itself.
                </p>

                <p>
                    While institutions worldwide are urgently racing to develop quantum-resistant systems, Bitcoin faces a unique paradox. Its greatest strength—its profound decentralization—is also its most significant hurdle when it comes to upgrading its core security protocols. Achieving a global consensus to implement post-quantum cryptography requires the coordinated agreement of developers driven by pure ethos and miners distributed across the globe.
                </p>

                <p>
                    The QuantumBTC project is already developing necessary actions to safeguard the critical transition from the historically secure framework gifted by Satoshi, to a new, post-quantum cryptography paradigm, ensuring the survival of the Bitcoin idea for generations to come.
                </p>
            </div>
        </div>
    );
}
