// src/components/AuthLayout.jsx
import React from 'react';

/**
 * AuthLayout — full-screen blue radial gradient background with a
 * centred frosted-glass card.  Matches the premium glassmorphism style.
 */
const AuthLayout = ({ children }) => {
    return (
        <div
            className="min-h-screen flex items-center justify-center p-4"
            style={{
                background: 'radial-gradient(ellipse at 50% 40%, #3a6fa8 0%, #1e4a7a 35%, #0d2747 70%, #071a32 100%)',
            }}
        >
            {/* Frosted glass card */}
            <div
                className="w-full max-w-sm rounded-2xl px-10 py-10 flex flex-col items-center"
                style={{
                    background: 'rgba(255,255,255,0.08)',
                    backdropFilter: 'blur(18px)',
                    WebkitBackdropFilter: 'blur(18px)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    boxShadow: '0 8px 40px rgba(0,0,0,0.45)',
                }}
            >
                {children}
            </div>
        </div>
    );
};

export default AuthLayout;
