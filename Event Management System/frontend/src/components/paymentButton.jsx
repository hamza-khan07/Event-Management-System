// frontend/src/components/PaymentButton.jsx
//
// RESPONSIBILITY: JazzCash payment initiate karna.
//
// How it works:
// 1. User "Pay Now" click karta hai
// 2. Backend se form data aata hai (endpoint + hidden fields)
// 3. Hum programmatically ek <form> banate hain DOM mein
// 4. Sab hidden inputs add karte hain
// 5. form.submit() call karte hain
// 6. Browser JazzCash ke page par chala jata hai
//
// Kyun yeh approach?
// JazzCash redirect-based hai — fetch/axios se payment nahi ho sakti.
// Form submit karne par browser naturally redirect hota hai.

import React, { useState } from 'react';
import { CreditCard, Loader2 } from 'lucide-react';
import { initiateJazzCashPayment } from '../services/paymentAPI';

const PaymentButton = ({ registrationId, amount, disabled = false }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handlePayment = async () => {
        setLoading(true);
        setError('');

        try {
            // Step 1: Backend se form data lo
            const result = await initiateJazzCashPayment(registrationId);

            if (!result.success) {
                setError('Payment initiation failed. Please try again.');
                return;
            }

            const { endpoint, formData } = result.data;

            // Step 2: Dynamically ek HTML form banao
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = endpoint;        // JazzCash ka URL
            form.style.display = 'none';  // User ko nahi dikhana

            // Step 3: Har field ke liye hidden input add karo
            Object.entries(formData).forEach(([key, value]) => {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = key;
                input.value = value || '';
                form.appendChild(input);
            });

            // Step 4: Form ko DOM mein add karo (submit ke liye zaruri)
            document.body.appendChild(form);

            // Step 5: Auto-submit → browser JazzCash par chala jaayega
            form.submit();

            // Note: form.submit() ke baad code execute nahi hoga
            // kyunke browser dusre page par chala gaya hai

        } catch (err) {
            const msg = err.response?.data?.message || 'Payment failed. Try again.';
            setError(msg);
            setLoading(false);
        }
        // Note: setLoading(false) sirf error case mein — success mein page redirect ho jata hai
    };

    return (
        <div className="space-y-2">
            <button
                onClick={handlePayment}
                disabled={loading || disabled}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 
                           bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800
                           disabled:bg-gray-300 disabled:cursor-not-allowed
                           text-white font-bold text-sm rounded-xl 
                           transition-all duration-200 shadow-md hover:shadow-lg
                           cursor-pointer"
            >
                {loading ? (
                    <>
                        <Loader2 size={18} className="animate-spin" />
                        Redirecting to JazzCash...
                    </>
                ) : (
                    <>
                        <CreditCard size={18} />
                        Pay via JazzCash — PKR {amount}
                    </>
                )}
            </button>

            {error && (
                <p className="text-xs text-red-600 text-center font-medium">
                    ⚠️ {error}
                </p>
            )}
        </div>
    );
};

export default PaymentButton;
