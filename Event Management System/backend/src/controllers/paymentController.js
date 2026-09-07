// backend/src/controllers/paymentController.js
//
// RESPONSIBILITY: JazzCash payment ka complete lifecycle manage karna.
//
// Functions:
//   1. createJazzCashPayment → POST /api/payments/jazzcash/create
//      Frontend se call hoti hai → JazzCash form data return karo
//
//   2. jazzCashReturn → POST /api/payments/jazzcash/return
//      JazzCash is URL par POST karta hai → result verify karo → DB update karo

const db = require('../config/db');
const { createJazzCashPaymentData } = require('../services/jazzcashService');
const { generateJazzCashHash } = require('../utils/jazzcashHash');

// ═══════════════════════════════════════════════════════════════════════════════
// 1. CREATE JAZZCASH PAYMENT
//    Route:  POST /api/payments/jazzcash/create
//    Access: PARTICIPANT (protect middleware se guard karo route mein)
//    Body:   { registration_id }
// ═══════════════════════════════════════════════════════════════════════════════
const createJazzCashPayment = async (req, res, next) => {
    try {
        const { registration_id } = req.body;
        const user_id = req.user.id; // JWT se — trusted

        if (!registration_id) {
            return res.status(400).json({
                success: false,
                message: 'registration_id is required.'
            });
        }

        // ── 1. Registration + Event data fetch karo ──────────────────────────
        // JOIN karo taake event title, price, aur phone number ek query mein mile
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
        // Sirf khud ki registration ka payment ho — dusre ka nahi
        if (registration.user_id !== user_id) {
            return res.status(403).json({
                success: false,
                message: 'You can only pay for your own registrations.'
            });
        }

        // ── 3. Already paid check ────────────────────────────────────────────
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

        // ── 4. Amount parse karo ─────────────────────────────────────────────
        // event_price VARCHAR hai: "Free", "PKR 1,500", "PKR 500"
        // Agar free hai toh payment nahi hogi
        const priceStr = registration.event_price || 'Free';
        const isFree = !priceStr || priceStr.toLowerCase() === 'free' || priceStr === '0';

        if (isFree) {
            return res.status(400).json({
                success: false,
                message: 'This event is free — no payment required. Just register directly.'
            });
        }

        // "PKR 1,500" → 1500 parse karo
        // Remove "PKR", commas, spaces → numeric
        const numericPrice = parseFloat(priceStr.replace(/[^0-9.]/g, ''));

        if (isNaN(numericPrice) || numericPrice <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid event price format. Contact organizer.'
            });
        }

        // ticket_count ke hisaab se total calculate karo
        const totalAmount = numericPrice * registration.ticket_count;

        // ── 5. Payment record create (PENDING state mein) ────────────────────
        // Kyun pehle se create karo?
        // Agar JazzCash return dobara aaye (network issue), toh pata ho
        // ke payment already process ho chuki thi.
        // Upsert (INSERT ... ON DUPLICATE KEY UPDATE) use karo
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

        // ── 6. JazzCash form data generate karo ─────────────────────────────
        const { endpoint, formData } = createJazzCashPaymentData({
            orderId: registration_id,
            amount: totalAmount,
            customerMobile: registration.phone_number || '',
            description: `Payment for: ${registration.event_title}`
        });

        // ── 7. Frontend ko data bhejo ────────────────────────────────────────
        // Frontend yeh data le kar ek HTML form auto-submit karega JazzCash par
        return res.status(200).json({
            success: true,
            data: {
                endpoint,   // JazzCash URL
                formData    // Saare hidden form fields
            }
        });

    } catch (error) {
        next(error);
    }
};


// ═══════════════════════════════════════════════════════════════════════════════
// 2. JAZZCASH RETURN (Webhook / Return URL)
//    Route:  POST /api/payments/jazzcash/return
//    Access: PUBLIC — JazzCash is URL par POST karta hai (koi auth nahi)
//
// IMPORTANT: Yeh route PUBLIC hai lekin hum HASH verify karte hain.
// Hash verification hi security hai — agar hash match na kare,
// toh response tamper hua hai → reject karo.
// ═══════════════════════════════════════════════════════════════════════════════
const jazzCashReturn = async (req, res, next) => {
    try {
        const integritySalt = process.env.JC_INTEGRITY_SALT;

        // JazzCash sab data req.body mein bhejta hai (form POST)
        const responseData = req.body;

        console.log('🔔 JazzCash Return Received:', responseData); // Debug ke liye

        // ── 1. Hash Verification ─────────────────────────────────────────────
        // JazzCash ne jo pp_SecureHash bheja hai, use hata do
        // Baaki sab fields se hash banao aur compare karo
        const receivedHash = responseData.pp_SecureHash;

        // Hash ke bina fields (wo fields jo hash mein nahi hoti)
        const fieldsForHash = { ...responseData };
        delete fieldsForHash.pp_SecureHash; // Hash field hash mein shamil nahi hoti

        const expectedHash = generateJazzCashHash(fieldsForHash, integritySalt);

        if (receivedHash !== expectedHash) {
            console.error('❌ Hash mismatch! Possible tampering.');
            // Frontend par redirect karo failure page par
            return res.redirect(`http://localhost:5173/payment/result?status=failed&reason=hash_mismatch`);
        }

        // ── 2. Response Code Check ────────────────────────────────────────────
        // pp_ResponseCode === '000' → SUCCESS
        // Baaki sab → FAILURE
        const isSuccess = responseData.pp_ResponseCode === '000';
        const txnRefNo = responseData.pp_TxnRefNo;
        const registrationId = responseData.ppmpf_2; // Humne ppmpf_2 mein orderId dala tha

        // ── 3. Database update karo ───────────────────────────────────────────
        if (isSuccess) {
            // Payment successful → payments table update karo
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
                    JSON.stringify(responseData), // Poora response save karo (audit ke liye)
                    registrationId
                ]
            );

            // Registration status CONFIRMED kar do (agar tumhare schema mein hai)
            // Agar nahi hai toh yeh line remove kar sakte ho
            await db.query(
                `UPDATE registrations SET status = 'CONFIRMED' WHERE id = ?`,
                [registrationId]
            );

            // Frontend par success page par redirect karo
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

module.exports = { createJazzCashPayment, jazzCashReturn };
