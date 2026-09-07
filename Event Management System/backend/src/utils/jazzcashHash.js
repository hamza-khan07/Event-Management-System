// backend/src/utils/jazzcashHash.js
//
// RESPONSIBILITY: JazzCash ke liye HMAC-SHA256 hash generate karna.
//
// Kyun alag utility?
// Hash generation ek pure function hai — koi side effect nahi.
// Ek jagah rakh do, baar baar import karo (DRY).
// Testing bhi aasan hogi.

const crypto = require('crypto'); // Node.js built-in — koi npm package nahi chahiye

/**
 * JazzCash HMAC-SHA256 hash generate karta hai.
 *
 * Algorithm:
 * 1. Saare fields le lo (object)
 * 2. Sirf non-empty values filter karo
 * 3. Keys ko alphabetically sort karo
 * 4. Values ko "&" se join karo: "val1&val2&val3"
 * 5. IntegritySalt ko PEHLE prefix karo: "salt&val1&val2&val3"
 * 6. HMAC-SHA256 apply karo (key = IntegritySalt)
 * 7. Result hex string mein return karo
 *
 * @param {Object} fields - Payment fields (key-value pairs)
 * @param {string} integritySalt - JazzCash ka secret salt
 * @returns {string} - HMAC-SHA256 hash (hex)
 */
const generateJazzCashHash = (fields, integritySalt) => {
    // Step 1: Sirf non-empty values rakhho
    const filteredFields = {};
    Object.keys(fields).forEach(key => {
        if (fields[key] !== '' && fields[key] !== null && fields[key] !== undefined) {
            filteredFields[key] = fields[key];
        }
    });

    // Step 2: Keys ko alphabetically sort karo
    const sortedKeys = Object.keys(filteredFields).sort();

    // Step 3: Values extract karo sorted order mein
    const sortedValues = sortedKeys.map(key => filteredFields[key]);

    // Step 4: IntegritySalt + values ko "&" se join karo
    // Format: "salt&value1&value2&value3"
    const hashString = [integritySalt, ...sortedValues].join('&');

    // Step 5: HMAC-SHA256 apply karo
    // Key = integritySalt, Data = hashString
    const hash = crypto
        .createHmac('sha256', integritySalt)
        .update(hashString)
        .digest('hex');

    return hash;
};

module.exports = { generateJazzCashHash };
