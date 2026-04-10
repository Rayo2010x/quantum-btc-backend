import { useState } from "react";
import { DonationModal } from "../donations/DonationModal";

export function WhitePaperView() {
    const [isDonationModalOpen, setIsDonationModalOpen] = useState(false);
    return (
        <div className="flex flex-col items-center justify-start min-h-[80vh] text-left space-y-12 max-w-4xl mx-auto pb-16 animate-fade-in">
            {/* Brand Hero Section */}
            <div className="w-full pt-6 text-center border-b border-white/5 pb-12 space-y-0">

                {/* Banner Image */}
                <div className="relative w-full rounded-2xl overflow-hidden mb-0 shadow-[0_0_60px_rgba(72,216,216,0.15)]">
                    <img
                        src="/og-image.webp"
                        alt="QuantumBTC — Securing Satoshi's Vision in the Quantum Era"
                        className="w-full object-cover rounded-2xl"
                        style={{ maxHeight: "320px", objectPosition: "center" }}
                    />
                    {/* Subtle dark gradient overlay at the bottom for logo blending */}
                    <div
                        className="absolute bottom-0 left-0 w-full"
                        style={{
                            height: "60%",
                            background: "linear-gradient(to bottom, transparent, rgba(9,9,11,0.85))",
                        }}
                    />
                </div>

                {/* Logo — centered, overlapping the banner bottom edge */}
                <div className="flex justify-center" style={{ marginTop: "-52px", position: "relative", zIndex: 10 }}>
                    <div className="p-1.5 rounded-2xl bg-zinc-950/80 border border-white/10 shadow-[0_0_40px_rgba(72,216,216,0.25)] backdrop-blur-sm">
                        <img
                            src="/favicon.png"
                            alt="QuantumBTC Logo"
                            className="w-24 h-24 rounded-xl object-contain"
                        />
                    </div>
                </div>

                {/* Title */}
                <div className="pt-5 space-y-3">
                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter font-display leading-tight">
                        QuantumBTC&nbsp;
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary block md:inline">
                            White Paper
                        </span>
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

            {/* Call to Action - Donate */}
            <div className="w-full mt-8 bg-zinc-900/50 border border-white/10 rounded-2xl p-8 text-center relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

                <h3 className="text-2xl font-display font-bold text-white mb-3 flex items-center justify-center gap-2">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-yellow-500">Support the Project</span>
                </h3>
                <p className="text-gray-400 max-w-xl mx-auto mb-6 text-base leading-relaxed">
                    QuantumBTC is a grassroots initiative maintained by independent researchers. Your donations help fund our infrastructure and development of post-quantum cryptography for the Lightning Network.
                </p>

                <button
                    onClick={() => setIsDonationModalOpen(true)}
                    className="inline-flex items-center gap-2 bg-white text-black font-bold px-8 py-3 rounded-full hover:bg-gray-200 transition-all shadow-lg hover:-translate-y-0.5"
                >
                    Donate via Lightning
                </button>
            </div>

            {/* Donation Modal */}
            <DonationModal isOpen={isDonationModalOpen} onClose={() => setIsDonationModalOpen(false)} />
        </div>
    );
}
