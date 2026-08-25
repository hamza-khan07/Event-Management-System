// src/components/AuthLayout.jsx
import React from 'react';

// 'children' ek special React prop hai. Jo kuch bhi hum is component ke tags <AuthLayout> ... </AuthLayout>
// ke darmian likhenge, wo is 'children' variable mein aayega.
const AuthLayout = ({ title, subtitle, children }) => {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">

                {/* Common Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 text-blue-600 font-bold text-xl mb-4">
                        EMS
                    </div>
                    {/* Dynamic Title aur Subtitle */}
                    <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                    <p className="text-gray-500 mt-2">{subtitle}</p>
                </div>

                {/* Yahan Page ka main content (Form waghaira) render hoga */}
                {children}

            </div>
        </div>
    );
};

export default AuthLayout;
