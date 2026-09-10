// backend/src/utils/jazzcashHash.js
//
// RESPONSIBILITY: Generate HMAC-SHA256 hash for JazzCash transactions.
//
// Why separate utility?
// Hash generation is a pure function without side effects.
// Kept in a single location for reusability (DRY) and unit testability.

const crypto = require('crypto'); // Built-in Node.js module

/**
 * Generates JazzCash HMAC-SHA256 hash.
 *
 * Algorithm:
 * 1. Receive fields object
 * 2. Filter non-empty values
 * 3. Sort keys alphabetically
 * 4. Join values with "&": "val1&val2&val3"
 * 5. Prefix integritySalt: "salt&val1&val2&val3"
 * 6. Apply HMAC-SHA256 (key = integritySalt)
 * 7. Return resulting hex string
 *
 * @param {Object} fields - Payment fields (key-value pairs)
 * @param {string} integritySalt - JazzCash secret salt
 * @returns {string} - HMAC-SHA256 hash (hex)
 */
const generateJazzCashHash = (fields, integritySalt) => {
    // Step 1: Keep only non-empty values
    const filteredFields = {};
    Object.keys(fields).forEach(key => {
        if (fields[key] !== '' && fields[key] !== null && fields[key] !== undefined) {
            filteredFields[key] = fields[key];
        }
    });

    // Step 2: Sort keys alphabetically
    const sortedKeys = Object.keys(filteredFields).sort();

    // Step 3: Extract values in sorted key order
    const sortedValues = sortedKeys.map(key => filteredFields[key]);

    // Step 4: Prepend integritySalt and join values with "&"
    // Format: "salt&value1&value2&value3"
    const hashString = [integritySalt, ...sortedValues].join('&');

    // Step 5: Apply HMAC-SHA256
    // Key = integritySalt, Data = hashString
    const hash = crypto
        .createHmac('sha256', integritySalt)
        .update(hashString)
        .digest('hex');

    return hash;
};

module.exports = { generateJazzCashHash };
