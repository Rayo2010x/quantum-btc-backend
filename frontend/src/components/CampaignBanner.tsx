import React from 'react';

interface CampaignBannerProps {
    onRegisterClick: () => void;
    onDismiss: () => void;
}

export const CampaignBanner: React.FC<CampaignBannerProps> = ({ onRegisterClick, onDismiss }) => {
    return (
        <div className="campaign-banner group">
            <button 
                onClick={(e) => { e.stopPropagation(); onDismiss(); }}
                className="absolute -top-2 -right-2 bg-surface border border-white/20 text-white/50 hover:text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                title="Dismiss"
            >
                ×
            </button>
            <div className="banner-content" onClick={onRegisterClick}>
                <div className="banner-icon">⚛️</div>
                <div className="banner-text">
                    <h4>Build the Post-Quantum Citadel</h4>
                    <p>Register your session for PQ-Rewards and secure your place in history.</p>
                </div>
                <button className="btn btn-secondary banner-btn pointer-events-none">
                    Register Now
                </button>
            </div>
        </div>
    );
};
