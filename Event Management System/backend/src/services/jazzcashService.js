// backend/src/services/jazzcashService.js
//
// RESPONSIBILITY: Prepare JazzCash payment request data.
//
// This service provides ready-to-use payment form data to the controller.
// The controller simply forwards this payload to the frontend.
//
// Why separate service and controller?
// To support additional payment gateways (e.g. Easypaisa, Stripe) in the future,
// create a new service file without modifying controller logic (Open/Closed Principle).

const { generateJazzCashHash } = require('../utils/jazzcashHash');

/**
 * Prepares required fields for a JazzCash checkout transaction.
 *
 * @param {Object} options
 * @param {string} options.orderId        - Unique order ID (registration ID)
 * @param {number} options.amount         - Amount in PKR (e.g., 1500 → "150000" in paisas)
 * @param {string} options.customerMobile - Customer's phone number
 * @param {string} options.description    - Payment description (event title)
 * @returns {Object} - { formData, endpoint } — Auto-submitted by frontend
 */
const createJazzCashPaymentData = ({ orderId, amount, customerMobile, description }) => {
    const merchantId = process.env.JC_MERCHANT_ID;
    const password = process.env.JC_PASSWORD;
    const integritySalt = process.env.JC_INTEGRITY_SALT;
    const returnUrl = process.env.JC_RETURN_URL;
    const endpoint = process.env.JC_ENDPOINT;

    // ── DateTime: JazzCash format → yyyyMMddHHmmss ──────────────────────────
    // Format required by JazzCash documentation
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');

    const txnDateTime = [
        now.getFullYear(),
        pad(now.getMonth() + 1),    // Months are 0-indexed
        pad(now.getDate()),
        pad(now.getHours()),
        pad(now.getMinutes()),
        pad(now.getSeconds())
    ].join('');

    // Expiry: 1 hour later (recommended)
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
    // JazzCash requires amount in paisa: PKR 1500 = "150000"
    // Convert to string as expected by JazzCash API
    const amountInPaisa = String(Math.round(amount * 100));

    // ── Unique Transaction ID ────────────────────────────────────────────────
    // Format: T<orderId><timestamp> to prevent collisions
    const txnRefNo = `T${orderId}${Date.now()}`;

    // ── Payment Fields ───────────────────────────────────────────────────────
    // These fields are sent to JazzCash via form POST
    // These exact fields must also be included in secure hash generation
    const fields = {
        pp_Amount: amountInPaisa,
        pp_BillReference: `bill-${orderId}`,    // Reference number
        pp_Description: description,
        pp_Language: 'EN',
        pp_MerchantID: merchantId,
        pp_Password: password,
        pp_ReturnURL: returnUrl,
        pp_SubMerchantID: '',                   // Blank if not a sub-merchant
        pp_TxnCurrency: 'PKR',
        pp_TxnDateTime: txnDateTime,
        pp_TxnExpiryDateTime: txnExpiryDateTime,
        pp_TxnRefNo: txnRefNo,
        pp_TxnType: 'MWALLET',            // JazzCash mobile wallet payment
        pp_Version: '1.1',
        ppmpf_1: customerMobile || '', // Custom field — phone number
        ppmpf_2: String(orderId),       // Custom field — registration ID
        ppmpf_3: '',
        ppmpf_4: '',
        ppmpf_5: '',
    };

    // ── Generate Hash ────────────────────────────────────────────────────────
    // Only non-empty fields are included in hash calculation (handled by utility)
    const hash = generateJazzCashHash(fields, integritySalt);

    return {
        endpoint,                   // JazzCash URL for form submission
        formData: {
            ...fields,
            pp_SecureHash: hash     // Attach secure hash for verification by JazzCash
        }
    };
};

module.exports = { createJazzCashPaymentData };
