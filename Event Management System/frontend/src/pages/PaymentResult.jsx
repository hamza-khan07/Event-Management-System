// frontend/src/pages/PaymentResult.jsx
//
// RESPONSIBILITY: Display payment result following gateway redirection.
//
// URL params:
//   ?status=success&registration_id=5&txn=TXXXXX
//   ?status=failed&reason=Payment+declined

import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Home, Ticket } from 'lucide-react';

const PaymentResult = () => {
    // Extract query parameters from URL
    // e.g. /payment/result?status=success&registration_id=5
    const [searchParams] = useSearchParams();

    const status = searchParams.get('status');        // 'success' | 'failed'
    const registrationId = searchParams.get('registration_id');
    const txnRef = searchParams.get('txn');
    const reason = searchParams.get('reason');

    const isSuccess = status === 'success';

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center">

                {/* Icon */}
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5
                    ${isSuccess ? 'bg-emerald-100' : 'bg-red-100'}`}>
                    {isSuccess
                        ? <CheckCircle2 size={40} className="text-emerald-500" />
                        : <XCircle size={40} className="text-red-500" />
                    }
                </div>

                {/* Heading */}
                <h1 className={`text-2xl font-extrabold mb-2
                    ${isSuccess ? 'text-gray-900' : 'text-gray-800'}`}>
                    {isSuccess ? 'Payment Successful! 🎉' : 'Payment Failed'}
                </h1>

                {/* Sub-message */}
                <p className="text-gray-500 text-sm mb-6">
                    {isSuccess
                        ? 'Your ticket has been confirmed. Check your registrations for details.'
                        : reason || 'Something went wrong with your payment. Please try again.'
                    }
                </p>

                {/* Transaction details (success only) */}
                {isSuccess && txnRef && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-6 text-left">
                        <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wider mb-1">
                            Transaction Reference
                        </p>
                        <p className="text-sm font-mono font-bold text-emerald-700">
                            {txnRef}
                        </p>
                        {registrationId && (
                            <>
                                <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wider mt-3 mb-1">
                                    Registration ID
                                </p>
                                <p className="text-sm font-mono font-bold text-emerald-700">
                                    #{registrationId}
                                </p>
                            </>
                        )}
                    </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-3">
                    {isSuccess ? (
                        <Link
                            to="/dashboard"
                            className="flex items-center justify-center gap-2 w-full py-3 
                                       bg-indigo-600 hover:bg-indigo-700 text-white 
                                       font-bold rounded-xl transition cursor-pointer"
                        >
                            <Ticket size={16} />
                            View My Registrations
                        </Link>
                    ) : (
                        <button
                            onClick={() => window.history.back()}
                            className="flex items-center justify-center gap-2 w-full py-3 
                                       bg-red-500 hover:bg-red-600 text-white 
                                       font-bold rounded-xl transition cursor-pointer"
                        >
                            Try Again
                        </button>
                    )}

                    <Link
                        to="/"
                        className="flex items-center justify-center gap-2 w-full py-3 
                                   bg-gray-100 hover:bg-gray-200 text-gray-700 
                                   font-semibold text-sm rounded-xl transition cursor-pointer"
                    >
                        <Home size={16} />
                        Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default PaymentResult;
