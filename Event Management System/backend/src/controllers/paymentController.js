// backend/src/controllers/paymentController.js
//
// RESPONSIBILITY: Manage the complete lifecycle of payment transactions.
//
// Functions:
//   1. createJazzCashPayment → POST /api/payments/jazzcash/create
//      Called by frontend → returns JazzCash form data
//
//   2. jazzCashReturn → POST /api/payments/jazzcash/return
//      Callback URL for JazzCash → verifies payload signature → updates DB
//
//   3. processMockPayment → POST /api/payments/mock/process
//      Simulated payment gateway for local development and testing

const db = require('../config/db');
const { createJazzCashPaymentData } = require('../services/jazzcashService');
const { generateJazzCashHash } = require('../utils/jazzcashHash');

// ═══════════════════════════════════════════════════════════════════════════════
// 1. CREATE JAZZCASH PAYMENT
//    Route:  POST /api/payments/jazzcash/create
//    Access: PARTICIPANT (protected route)
//    Body:   { registration_id }
// ═══════════════════════════════════════════════════════════════════════════════
const createJazzCashPayment = async (req, res, next) => {
    try {
        const { registration_id } = req.body;
        const user_id = req.user.id; // Trusted ID from JWT payload

        if (!registration_id) {
            return res.status(400).json({
                success: false,
                message: 'registration_id is required.'
            });
        }

        // ── 1. Fetch registration & event data ──────────────────────────────
        const [rows] = await db.query(
            `SELECT 
                r.id, r.user_id, r.status, r.ticket_count, r.phone_number,
                e.title as event_title, e.price as event_price,
                u.name as user_name, u.email as user_email
             FROM registrations r
             JOIN events e ON e.id = r.event_id
             JOIN users  u ON u.id = r.user_id
             WHERE r.id = ?`,
            [registration_id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Registration not found.'
            });
        }

        const registration = rows[0];

        // ── 2. Ownership check ───────────────────────────────────────────────
        if (registration.user_id !== user_id) {
            return res.status(403).json({
                success: false,
                message: 'You can only pay for your own registrations.'
            });
        }

        // ── 3. Check if already paid ─────────────────────────────────────────
        const [existingPayment] = await db.query(
            `SELECT id, status FROM payments WHERE registration_id = ?`,
            [registration_id]
        );

        if (existingPayment.length > 0 && existingPayment[0].status === 'SUCCESS') {
            return res.status(400).json({
                success: false,
                message: 'This registration is already paid.'
            });
        }

        // ── 4. Parse amount ──────────────────────────────────────────────────
        const priceStr = registration.event_price || 'Free';
        const isFree = !priceStr || priceStr.toLowerCase() === 'free' || priceStr === '0';

        if (isFree) {
            return res.status(400).json({
                success: false,
                message: 'This event is free — no payment required. Just register directly.'
            });
        }

        const numericPrice = parseFloat(priceStr.replace(/[^0-9.]/g, ''));

        if (isNaN(numericPrice) || numericPrice <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid event price format. Contact organizer.'
            });
        }

        const totalAmount = numericPrice * registration.ticket_count;

        // ── 5. Create or upsert payment record in PENDING state ─────────────
        const txnRefNo = `T${registration_id}${Date.now()}`;

        await db.query(
            `INSERT INTO payments (registration_id, transaction_id, amount, status)
             VALUES (?, ?, ?, 'PENDING')
             ON DUPLICATE KEY UPDATE
                transaction_id = VALUES(transaction_id),
                amount = VALUES(amount),
                status = 'PENDING',
                updated_at = NOW()`,
            [registration_id, txnRefNo, totalAmount]
        );

        // ── 6. Generate JazzCash form payload ────────────────────────────────
        const { endpoint, formData } = createJazzCashPaymentData({
            orderId: registration_id,
            amount: totalAmount,
            customerMobile: registration.phone_number || '',
            description: `Payment for: ${registration.event_title}`
        });

        // ── 7. Return payload to frontend ────────────────────────────────────
        return res.status(200).json({
            success: true,
            data: {
                endpoint,
                formData
            }
        });

    } catch (error) {
        next(error);
    }
};


// ═══════════════════════════════════════════════════════════════════════════════
// 2. JAZZCASH RETURN (Webhook / Callback URL)
//    Route:  POST /api/payments/jazzcash/return
//    Access: PUBLIC — Called directly by JazzCash payment gateway
// ═══════════════════════════════════════════════════════════════════════════════
const jazzCashReturn = async (req, res, next) => {
    try {
        const integritySalt = process.env.JC_INTEGRITY_SALT;
        const responseData = req.body;

        // ── 1. Hash verification ─────────────────────────────────────────────
        const receivedHash = responseData.pp_SecureHash;

        const fieldsForHash = { ...responseData };
        delete fieldsForHash.pp_SecureHash;

        const expectedHash = generateJazzCashHash(fieldsForHash, integritySalt);

        if (receivedHash !== expectedHash) {
            console.error('❌ Hash mismatch! Possible tampering.');
            return res.redirect(`http://localhost:5173/payment/result?status=failed&reason=hash_mismatch`);
        }

        // ── 2. Response code evaluation ──────────────────────────────────────
        // '000' denotes success in JazzCash API
        const isSuccess = responseData.pp_ResponseCode === '000';
        const txnRefNo = responseData.pp_TxnRefNo;
        const registrationId = responseData.ppmpf_2;

        // ── 3. Update database records ───────────────────────────────────────
        if (isSuccess) {
            await db.query(
                `UPDATE payments 
                 SET status = 'SUCCESS',
                     transaction_id = ?,
                     gateway = 'JAZZCASH',
                     gateway_response = ?,
                     paid_at = NOW(),
                     updated_at = NOW()
                 WHERE registration_id = ?`,
                [
                    txnRefNo,
                    JSON.stringify(responseData),
                    registrationId
                ]
            );

            // Update registration status to REGISTERED
            await db.query(
                `UPDATE registrations SET status = 'REGISTERED' WHERE id = ?`,
                [registrationId]
            );

            return res.redirect(
                `http://localhost:5173/payment/result?status=success&registration_id=${registrationId}&txn=${txnRefNo}`
            );

        } else {
            // Payment failed
            await db.query(
                `UPDATE payments 
                 SET status = 'FAILED',
                     gateway_response = ?,
                     updated_at = NOW()
                 WHERE registration_id = ?`,
                [JSON.stringify(responseData), registrationId]
            );

            return res.redirect(
                `http://localhost:5173/payment/result?status=failed&reason=${responseData.pp_ResponseMessage || 'Payment failed'}`
            );
        }

    } catch (error) {
        next(error);
    }
};


// ═══════════════════════════════════════════════════════════════════════════════
// 3. PROCESS MOCK PAYMENT (Simulated Gateway)
//    Route:  POST /api/payments/mock/process
//    Access: PARTICIPANT (JWT protected)
//    Body:   { registration_id, card_number, expiry, cvv, account_name }
//
// Simulation Rules:
//   - Card ending in '0000' triggers payment failure for testing
//   - Any other valid card number simulates successful payment
// ═══════════════════════════════════════════════════════════════════════════════
const processMockPayment = async (req, res, next) => {
    try {
        const { registration_id, card_number, expiry, cvv, account_name } = req.body;
        const user_id = req.user.id;

        // ── 1. Input Validation ───────────────────────────────────────────────
        if (!registration_id || !card_number || !expiry || !cvv || !account_name) {
            return res.status(400).json({
                success: false,
                message: 'All payment fields are required.'
            });
        }

        // ── 2. Registration Verification & Ownership Check ──────────────────
        const [rows] = await db.query(
            `SELECT r.id, r.user_id, r.status, r.ticket_count,
                    e.title as event_title, e.price as event_price,
                    p.id as payment_id, p.amount, p.status as payment_status
             FROM registrations r
             JOIN events e ON e.id = r.event_id
             LEFT JOIN payments p ON p.registration_id = r.id
             WHERE r.id = ?`,
            [registration_id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Registration not found.' });
        }

        const reg = rows[0];

        // Ensure user can only pay for their own registrations
        if (reg.user_id !== user_id) {
            return res.status(403).json({
                success: false,
                message: 'You can only pay for your own registrations.'
            });
        }

        // Check if already registered or paid
        if (reg.status === 'REGISTERED' || reg.payment_status === 'SUCCESS') {
            return res.status(400).json({
                success: false,
                message: 'This registration is already paid and confirmed.'
            });
        }

        if (reg.status === 'CANCELLED') {
            return res.status(400).json({
                success: false,
                message: 'Cannot pay for a cancelled registration.'
            });
        }

        // ── 3. Simulate Card Validation ───────────────────────────────────────
        const cleanCard = card_number.replace(/[\s\-]/g, '');

        if (!/^\d{13,19}$/.test(cleanCard)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid card number format.'
            });
        }

        // SIMULATION: Cards ending in '0000' trigger a simulated failure
        const last4 = cleanCard.slice(-4);
        const isPaymentFailed = last4 === '0000';

        // ── 4. Generate Transaction Reference ────────────────────────────────
        const txnRef = `MOCK-${registration_id}-${Date.now()}`;

        if (isPaymentFailed) {
            // Update payment record as FAILED
            await db.query(
                `UPDATE payments 
                 SET status = 'FAILED',
                     gateway = 'MOCK',
                     gateway_response = ?,
                     updated_at = NOW()
                 WHERE registration_id = ?`,
                [JSON.stringify({ reason: 'Card declined — last 4 digits 0000', card_last4: last4 }), registration_id]
            );

            return res.status(200).json({
                success: false,
                paymentStatus: 'FAILED',
                message: 'Payment declined. Please check your card details and try again.',
                txn_ref: txnRef
            });
        }

        // ── 4b. SUCCESS: Update payments and registrations tables ────────────
        await db.query(
            `UPDATE payments 
             SET status = 'SUCCESS',
                 transaction_id = ?,
                 gateway = 'MOCK',
                 gateway_response = ?,
                 paid_at = NOW(),
                 updated_at = NOW()
             WHERE registration_id = ?`,
            [
                txnRef,
                JSON.stringify({
                    card_last4: last4,
                    account_name,
                    processed_at: new Date().toISOString()
                }),
                registration_id
            ]
        );

        // Update registration status to REGISTERED
        await db.query(
            `UPDATE registrations SET status = 'REGISTERED' WHERE id = ?`,
            [registration_id]
        );

        return res.status(200).json({
            success: true,
            paymentStatus: 'SUCCESS',
            message: 'Payment successful! Your registration is now confirmed.',
            txn_ref: txnRef,
            registration_id,
            amount: reg.amount
        });

    } catch (error) {
        next(error);
    }
};

module.exports = { createJazzCashPayment, jazzCashReturn, processMockPayment };
