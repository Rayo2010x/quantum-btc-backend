import { useState, useEffect } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { X, Copy, Check, Bitcoin } from "lucide-react";
import { DonationsApi } from "../../lib/api";

interface DonationModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function DonationModal({ isOpen, onClose }: DonationModalProps) {
    const [amountSat, setAmountSat] = useState<string>("10000");
    const [address, setAddress] = useState<string>("");
    const [step, setStep] = useState<"form" | "checkout" | "success">("form");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [invoice, setInvoice] = useState<string>("");
    const [donationId, setDonationId] = useState<string>("");
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setStep("form");
            setAmountSat("10000");
            setAddress("");
            setError(null);
            setInvoice("");
            setDonationId("");
        }
    }, [isOpen]);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (step === "checkout" && donationId) {
            interval = setInterval(async () => {
                try {
                    const res = await DonationsApi.checkStatus(donationId);
                    if (res.status === 'paid') {
                        setStep("success");
                    }
                } catch (e) {
                    console.error("Failed to check status", e);
                }
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [step, donationId]);

    if (!isOpen) return null;

    const handleCreateDonation = async () => {
        setError(null);
        if (!amountSat || isNaN(Number(amountSat)) || Number(amountSat) < 100) {
            setError("Amount must be at least 100 Sats.");
            return;
        }

        setIsLoading(true);
        try {
            const res = await DonationsApi.createDonation(Number(amountSat), address || undefined);
            setInvoice(res.paymentRequest);
            setDonationId(res.id);
            setStep("checkout");
        } catch (err: any) {
            setError(err.response?.data?.error || err.message || "Failed to create invoice.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(invoice);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#111] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative">
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 text-gray-400 hover:text-white transition-colors"
                >
                    <X size={24} />
                </button>

                <div className="p-8">
                    <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center shadow-[0_0_20px_rgba(72,216,216,0.2)]">
                            <Bitcoin className="w-8 h-8 text-primary" />
                        </div>
                    </div>

                    {step === "form" && (
                        <div className="space-y-6 animate-in slide-in-from-bottom-4">
                            <div className="text-center">
                                <h2 className="text-2xl font-bold text-white mb-2 font-display">Support QuantumBTC</h2>
                                <p className="text-gray-400 text-sm">Enter your donation amount below.</p>
                            </div>

                            {error && (
                                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm text-center">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">
                                        Amount (Sats)
                                    </label>
                                    <input
                                        type="number"
                                        value={amountSat}
                                        onChange={(e) => setAmountSat(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-mono"
                                        placeholder="10000"
                                        min="100"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1 flex items-center justify-between">
                                        <span>BTC or LN Address</span> 
                                        <span className="text-gray-500 text-xs font-normal bg-white/5 py-0.5 px-2 rounded-full border border-white/5">(Optional)</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-sm font-mono"
                                        placeholder="bc1... or username@domain"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleCreateDonation}
                                disabled={isLoading}
                                className="w-full bg-primary hover:bg-primary/90 text-black font-bold py-3 px-4 rounded-xl transition-all shadow-[0_0_15px_rgba(72,216,216,0.3)] disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide text-sm"
                            >
                                {isLoading ? "Generating..." : "Generate Invoice"}
                            </button>
                        </div>
                    )}

                    {step === "checkout" && (
                        <div className="space-y-6 text-center animate-in slide-in-from-right-4">
                            <h2 className="text-2xl font-bold text-white mb-2 font-display">Scan to Donate</h2>
                            <p className="text-gray-400 text-sm">Pay this invoice with your Lightning wallet.</p>

                            <div className="bg-white p-4 rounded-2xl inline-block mx-auto mt-4 mb-4 shadow-xl">
                                <QRCodeCanvas
                                    value={invoice}
                                    size={220}
                                    level="H"
                                    includeMargin={false}
                                />
                            </div>

                            <div className="flex items-center gap-2 justify-center">
                                <p className="text-sm text-gray-400 max-w-[250px] truncate font-mono bg-white/5 px-3 py-2 rounded-lg border border-white/10">
                                    {invoice}
                                </p>
                                <button
                                    onClick={handleCopy}
                                    className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-gray-300"
                                    title="Copy Invoice"
                                >
                                    {copied ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
                                </button>
                            </div>
                            
                            <div className="flex items-center justify-center gap-2 mt-4">
                                <div className="w-2 h-2 rounded-full bg-primary animate-ping"></div>
                                <p className="text-sm font-mono text-primary">Waiting for payment...</p>
                            </div>
                        </div>
                    )}

                    {step === "success" && (
                        <div className="text-center py-8 animate-in zoom-in-95 duration-500">
                            <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
                                <Check className="w-10 h-10 text-emerald-500" />
                            </div>
                            <h2 className="text-3xl font-display font-bold text-white mb-4">Thank You!</h2>
                            <p className="text-gray-400 font-light text-lg mb-8 leading-relaxed">
                                Your donation has been received. We deeply appreciate your support for QuantumBTC.
                            </p>
                            <button
                                onClick={onClose}
                                className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-4 rounded-xl transition-all border border-white/10"
                            >
                                Close Window
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
