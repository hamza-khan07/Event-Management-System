// frontend/src/components/Drawer.jsx
import React, { useEffect } from 'react';

const Drawer = ({ isOpen, onClose, title, subtitle, children, footer }) => {
    // Escape key dabane par drawer close karne ke liye (Great UX!)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    return (
        <>
            {/* 1. Backdrop Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity"
                    onClick={onClose}
                />
            )}

            {/* 2. Generic Slide-in Panel */}
            <div
                className={`fixed top-0 right-0 h-full w-96 bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
            >
                {/* Header (Dynamic Title & Subtitle) */}
                <div className="flex justify-between items-start p-6 border-b border-gray-100">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">{title || 'Details'}</h2>
                        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-700 text-lg font-bold transition p-1"
                        aria-label="Close drawer"
                    >
                        ✕
                    </button>
                </div>

                {/* Body (Yahan jo bhi component pass karenge woh render hoga) */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {children}
                </div>

                {/* Optional Footer (Action Buttons) */}
                {footer && (
                    <div className="p-6 border-t border-gray-100 bg-gray-50/50">
                        {footer}
                    </div>
                )}
            </div>
        </>
    );
};

export default Drawer;
