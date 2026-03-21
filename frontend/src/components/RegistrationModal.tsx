import React, { useState } from 'react';

interface RegistrationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (address: string) => Promise<void>;
}

export const RegistrationModal: React.FC<RegistrationModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const [address, setAddress] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        if (!address.trim()) {
            setError("Address is required");
            return;
        }

        setIsLoading(true);
        try {
            await onSubmit(address.trim());
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.error || err.message || "Failed to register");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <button className="close-btn" onClick={onClose}>×</button>
                <h2>QuantumBTC Genesis Registry</h2>
                <p style={{ textAlign: 'center', fontSize: '0.9rem', color: '#a0aec0', marginTop: '-10px', marginBottom: '15px' }}>This process is completely optional</p>
                <div className="modal-body">
                    <p className="modal-description">
                        Link your current session to a Sovereign Address.
                        We will aggregate your Stress-Test Volume (STV) across all sessions using this address.
                    </p>
                    <div className="privacy-notice">
                        <strong>🛡️ Privacy First:</strong> Linking a session associates your interaction history with the provided address. No KYC required.
                    </div>
                    
                    <form onSubmit={handleSubmit} className="registration-form">
                        <div className="form-group">
                            <label htmlFor="address">BTC or LN Reward Address</label>
                            <input
                                type="text"
                                id="address"
                                placeholder="bc1q... or user@ln.address"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                disabled={isLoading}
                                className={error ? 'input-error' : ''}
                            />
                            {error && <div className="error-message">{error}</div>}
                        </div>
                        <button type="submit" className="btn btn-primary full-width" disabled={isLoading}>
                            {isLoading ? 'Registering...' : 'Secure My Place'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};
