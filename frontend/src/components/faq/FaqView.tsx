import { useState } from 'react';
import { HelpCircle, ChevronDown } from 'lucide-react';

const faqs = [
    {
        q: 'What exactly are the "Post-Quantum Rewards"?',
        a: 'They are verifiable cryptographic claims recognizing your role as an early protector of the network. As we finalize and deploy our Post-Quantum protocols, you aren\'t just earning a badge—you are securing prioritized access to our proprietary tools, early node deployments, and targeted airdrops from our development fund. Your rank dictates your standing in the new Citadel.'
    },
    {
        q: 'How do I contribute?',
        a: 'Your standing is measured strictly by your **Stress-Test Volume (STV)**—the total throughput of Satoshis you route through our Lightning infrastructure. Whether you end your session with massive profits or take a loss, every single satoshi processed generates vital entropy and pushes our nodes to their limits. You are rewarded for the velocity and volume of your interactions, never for your losses.'
    },
    {
        q: 'If the protocol is provably fair and anonymous, why must I register an address?',
        a: 'Unregistered sessions generate ephemeral entropy. Once your browser clears or your session expires, your cryptographic proof of work vanishes. The **Quantum Genesis Registry** permanently anchors your accumulated STV to a Sovereign Address of your choosing. This ensures your legacy, rank, and future rewards are preserved immutably across devices and time.'
    },
    {
        q: 'Should I secure my rank using a Layer 1 (On-Chain) or a Lightning Network (LN) address?',
        a: 'While the entire stress-testing protocol operates at lightning speed on Layer 2, the Registry defines your historically permanent identity. For this reason, we highly recommend anchoring your session to a **Layer 1 "Vault" address** (ideally from cold storage). It is the most robust and indisputable cryptographic identity in the Bitcoin ecosystem with which to claim your future Genesis rewards.'
    },
    {
        q: 'How are the Genesis Ranks (Tiers) calculated?',
        a: `Your rank is determined by your total STV (Satoshis routed).\n\n• **Participant (0 - 999 sats):** *Ephemeral Contributor.* Contributes to network entropy but holds no permanent rank or claim.\n• **Quantum Scout (1k - 10k sats):** *Access & Badging.* Secures a verifiable Genesis Badge and gains prioritized access to future Quantum BTC tools and beta-testing phases.\n• **Sentinel (10k - 100k sats):** *Development Fund Claim.* All Scout benefits PLUS a proportional claim to targeted BTC/LN airdrops distributed directly from our institutional development fund as milestones are reached.\n• **Guardian (100k+ sats):** *Infrastructure Priority.* All Sentinel benefits PLUS prioritized routing and early access to deploy our proprietary Post-Quantum Node software, cementing your place as a foundational pillar of the network.\n\nAs your STV crosses these thresholds, your rank dynamically updates on the network, elevating your status in the Post-Quantum Citadel.`
    }
];

export function FaqView() {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const toggleFaq = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <div className="flex flex-col items-center justify-start min-h-[80vh] text-left space-y-12 max-w-4xl mx-auto pb-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Section */}
            <div className="space-y-6 pt-8 text-center border-b border-white/5 pb-12 w-full">
                <div className="inline-flex items-center justify-center p-3 bg-white/5 rounded-2xl mb-4 border border-white/10 shadow-xl shadow-black/50">
                    <HelpCircle className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter font-display leading-tight">
                    Quantum Genesis <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary block md:inline">FAQ</span>
                </h1>
                <p className="text-lg md:text-xl text-gray-400 font-light max-w-2xl mx-auto">
                    Everything you need to know about STV, Ranks, and the Post-Quantum Citadel.
                </p>
            </div>

            {/* Accordion Questions */}
            <div className="w-full space-y-4">
                {faqs.map((faq, index) => {
                    const isOpen = openIndex === index;
                    return (
                        <div 
                            key={index} 
                            className={`bg-white/[0.02] border rounded-2xl overflow-hidden transition-all duration-300 ${isOpen ? 'border-primary/30 shadow-[0_4px_20px_rgba(72,216,216,0.05)]' : 'border-white/5 hover:border-white/10'}`}
                        >
                            <button 
                                className="w-full text-left px-6 py-5 flex items-center justify-between focus:outline-none"
                                onClick={() => toggleFaq(index)}
                            >
                                <span className={`font-display font-bold text-lg pr-8 transition-colors ${isOpen ? 'text-primary' : 'text-white'}`}>
                                    {faq.q}
                                </span>
                                <div className={`shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 text-primary' : 'text-gray-500'}`}>
                                    <ChevronDown size={20} />
                                </div>
                            </button>
                            
                            <div 
                                className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}
                            >
                                <div className="px-6 pb-6 pt-2 text-gray-400 leading-relaxed font-body text-base whitespace-pre-wrap">
                                    {faq.a.split('**').map((part, i) => (
                                        i % 2 === 1 ? <strong key={i} className="text-white">{part}</strong> : part
                                    ))}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            
            <div className="pt-8 text-center w-full">
                <p className="text-sm text-gray-500 italic">
                    For further technical specifications on entropy generation, refer to the White Paper.
                </p>
            </div>
        </div>
    );
}
