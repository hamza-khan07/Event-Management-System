// backend/src/services/jazzcashService.js
//
// RESPONSIBILITY: JazzCash payment request data prepare karna.
//
// Yeh service controller ko ek ready-to-use payment form data deti hai.
// Controller ne bas is data ko frontend ko bhejni hai.
//
// Kyun service aur controller alag?
// Agar kal dusra payment gateway add karna ho (Easypaisa, Stripe),
// sirf ek nai service file banao — controller change nahi hoga (OCP principle).

const { generateJazzCashHash } = require('../utils/jazzcashHash');

/**
 * JazzCash payment ke liye required fields prepare karta hai.
 *
 * @param {Object} options
 * @param {string} options.orderId        - Unique order ID (registration ID use karein)
 * @param {number} options.amount         - Amount in PKR (e.g. 1500 → "150000" — paisa mein)
 * @param {string} options.customerMobile - Customer ka phone number
 * @param {string} options.description    - Payment ka description (event title)
 * @returns {Object} - { formData, endpoint } — frontend isko auto-submit karega
 */
const createJazzCashPaymentData = ({ orderId, amount, customerMobile, description }) => {
    const merchantId = process.env.JC_MERCHANT_ID;
    const password = process.env.JC_PASSWORD;
    const integritySalt = process.env.JC_INTEGRITY_SALT;
    const returnUrl = process.env.JC_RETURN_URL;
    const endpoint = process.env.JC_ENDPOINT;

    // ── DateTime: JazzCash format → yyyyMMddHHmmss ──────────────────────────
    // Kyun yeh format? JazzCash ka requirement hai (check docs)
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');

    const txnDateTime = [
        now.getFullYear(),
        pad(now.getMonth() + 1),    // Months 0-indexed hain
        pad(now.getDate()),
        pad(now.getHours()),
        pad(now.getMinutes()),
        pad(now.getSeconds())
    ].join('');

    // Expiry: 1 ghante baad (optional lekin recommended)
    const expiry = new Date(now.getTime() + 60 * 60 * 1000);
    const txnExpiryDateTime = [
        expiry.getFullYear(),
        pad(expiry.getMonth() + 1),
        pad(expiry.getDate()),
        pad(expiry.getHours()),
        pad(expiry.getMinutes()),
        pad(expiry.getSeconds())
    ].join('');

    // ── Amount: PKR → Paisa (× 100) ─────────────────────────────────────────
    // JazzCash amount "paisa" mein chahiye: PKR 1500 = "150000"
    // String mein convert karo (JazzCash string expect karta hai)
    const amountInPaisa = String(Math.round(amount * 100));

    // ── Unique Transaction ID ────────────────────────────────────────────────
    // Format: T<orderId><timestamp> — collision probability zero
    const txnRefNo = `T${orderId}${Date.now()}`;

    // ── Payment Fields ───────────────────────────────────────────────────────
    // Yeh sab fields JazzCash ko form POST mein bheji jaati hain
    // EXACTLY yahi fields hash mein bhi shamil hongi
    const fields = {
        pp_Amount: amountInPaisa,
        pp_BillReference: `bill-${orderId}`,    // Reference number
        pp_Description: description,
        pp_Language: 'EN',
        pp_MerchantID: merchantId,
        pp_Password: password,
        pp_ReturnURL: returnUrl,
        pp_SubMerchantID: '',                   // Agar sub-merchant nahi toh blank
        pp_TxnCurrency: 'PKR',
        pp_TxnDateTime: txnDateTime,
        pp_TxnExpiryDateTime: txnExpiryDateTime,
        pp_TxnRefNo: txnRefNo,
        pp_TxnType: 'MWALLET',            // JazzCash wallet payment
        pp_Version: '1.1',
        ppmpf_1: customerMobile || '', // Custom field — phone number
        ppmpf_2: String(orderId),       // Custom field — registration ID
        ppmpf_3: '',
        ppmpf_4: '',
        ppmpf_5: '',
    };

    // ── Hash Generate Karo ───────────────────────────────────────────────────
    // Hash mein SIRF non-empty fields shamil hoti hain (utility function handle karta hai)
    const hash = generateJazzCashHash(fields, integritySalt);

    return {
        endpoint,                   // JazzCash ka URL jahan form submit hoga
        formData: {
            ...fields,
            pp_SecureHash: hash     // Hash ko form mein add karo (JazzCash verify karega)
        }
    };
};

module.exports = { createJazzCashPaymentData };
