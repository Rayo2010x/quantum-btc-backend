import { AlertTriangle, Zap, ShieldCheck, ExternalLink } from "lucide-react";

export function FeaturesView() {
    return (
        <div className="flex flex-col items-center justify-start min-h-[80vh] text-left space-y-12 max-w-4xl mx-auto pb-16 animate-fade-in">
            {/* Header Section */}
            <div className="space-y-6 pt-8 text-center border-b border-white/5 pb-12 w-full">
                <div className="inline-flex items-center justify-center p-3 bg-white/5 rounded-2xl mb-4 border border-white/10 shadow-xl shadow-black/50">
                    <Zap className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter font-display leading-tight">
                    QuantumBTC <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary block md:inline">Features</span>
                </h1>
                <p className="text-lg md:text-xl text-gray-400 font-light max-w-2xl mx-auto">
                    A grassroots Lightning Network platform built on Bitcoin's core ethos.
                </p>
            </div>

            {/* Intro paragraph */}
            <div className="space-y-8 text-gray-300 leading-relaxed font-body text-lg w-full px-4 md:px-0">
                <p>
                    This platform (<span className="text-primary font-mono text-base">quantumbtc.dev</span>) is launched as a grassroots funding initiative to support the research and development of this new system. True to Satoshi's original philosophy, we are starting small—reminiscent of Bitcoin's value 15 years ago—and offer the following core features:
                </p>

                {/* Feature Cards */}
                <div className="grid gap-6 mt-8">
                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 transition-all hover:bg-white/[0.04]">
                        <h3 className="text-white font-bold text-xl mb-3 flex items-center gap-3">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary text-sm font-mono">1</span>
                            Micro-Stakes Testing
                        </h3>
                        <p className="text-gray-400 text-base">
                            We are launching with very small wagers, typically in the range of 50 to 100 Satoshis (less than 10 cents USD as of March 2026). These intentionally low limits allow us to stress-test the network using a high volume of small transactions rather than a few large ones. As the network's resilience is proven, these limits will be incrementally raised.
                        </p>
                    </div>

                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 transition-all hover:bg-white/[0.04]">
                        <h3 className="text-white font-bold text-xl mb-3 flex items-center gap-3">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary text-sm font-mono">2</span>
                            True Trustless Interaction
                        </h3>
                        <p className="text-gray-400 text-base">
                            As Satoshi intended, users do not need to trust us with their funds or maintain deposits on our platform. All wagers are executed seamlessly and instantly via users' own Lightning Network wallets. The maximum exposure is merely a few cents.
                        </p>
                    </div>

                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 transition-all hover:bg-white/[0.04]">
                        <h3 className="text-white font-bold text-xl mb-3 flex items-center gap-3">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary text-sm font-mono">3</span>
                            Instant, Non-Custodial Payouts
                        </h3>
                        <p className="text-gray-400 text-base">
                            Winnings are settled instantaneously directly back to the user's Lightning Network wallet. There are no cumbersome withdrawal procedures or minimum thresholds. Our strictly non-custodial approach perfectly aligns with Bitcoin's core ethos: <em className="text-white">not your keys, not your coins</em>. We do not hold user funds, eliminating counterparty risk.
                        </p>
                    </div>

                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 transition-all hover:bg-white/[0.04]">
                        <h3 className="text-white font-bold text-xl mb-3 flex items-center gap-3">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary text-sm font-mono">4</span>
                            Verifiable Entropy Generation
                        </h3>
                        <p className="text-gray-400 text-base mb-4">
                            The core dynamic of our games relies on three distinct sources of entropy to guarantee the absolute randomness and fairness of every outcome:
                        </p>
                        <ul className="space-y-3 mb-4 text-base">
                            <li className="flex items-start gap-3">
                                <ShieldCheck className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                                <span>A seed derived from true, real-world quantum processes.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <ShieldCheck className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                                <span>A client-side seed generated directly from the user's browser device.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <ShieldCheck className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                                <span>
                                    A cryptographic pulse from the <strong className="text-white font-mono font-medium">Drand Beacon</strong> (a distributed, verifiable randomness beacon network, see <a href="https://drand.love/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">drand.love</a>).
                                </span>
                            </li>
                        </ul>
                        <p className="text-gray-400 text-base">
                            This multi-layered process is fully transparent and mathematically verifiable. We provide an intuitive on-site tool allowing anyone to independently audit the cryptographic fairness of their interactions.
                        </p>
                    </div>
                </div>
            </div>

            {/* Call to Action - Onboarding Portal */}
            <div className="w-full mt-12 bg-primary/5 border border-primary/20 rounded-2xl p-8 text-center relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"></div>

                <h3 className="text-2xl font-display font-bold text-white mb-3">Join the Citadel</h3>
                <p className="text-gray-400 max-w-xl mx-auto mb-6 text-base">
                    New to QuantumBTC? Visit our comprehensive Onboarding Portal to dive deeper into the philosophy, explore recommended Lightning wallets, and begin your journey as a network protector.
                </p>

                <a
                    href="https://learn.quantumbtc.dev/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-primary text-black font-bold px-8 py-3 rounded-full hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(72,216,216,0.3)] hover:shadow-[0_0_30px_rgba(72,216,216,0.5)] hover:-translate-y-0.5"
                >
                    Learn More <ExternalLink size={18} />
                </a>
            </div>

            {/* Regulatory Alert */}
            <div className="w-full mt-12 bg-red-950/20 border border-red-500/20 rounded-2xl p-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-red-500/50"></div>
                <div className="flex items-start gap-5">
                    <div className="p-3 bg-red-500/10 rounded-xl shrink-0">
                        <AlertTriangle className="w-8 h-8 text-red-400" />
                    </div>
                    <div>
                        <h3 className="text-red-400 font-bold text-xl mb-2 font-display tracking-tight">Regulatory Notice (Geoblocking)</h3>
                        <p className="text-red-200/70 text-base leading-relaxed">
                            Due to the highly complex and stringent regulatory landscape surrounding digital assets and online gaming, access to our platform is currently restricted for users located in the United States and the European Union. The severe compliance burdens and strict legislative controls imposed by these jurisdictions are temporarily incompatible with our fully decentralized, non-custodial testing phase. We are exploring legal frameworks that may allow future access, but our immediate focus remains on technical development and security.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
