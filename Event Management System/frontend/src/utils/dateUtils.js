// frontend/src/utils/dateUtils.js
//
// PURPOSE: Timezone-safe date parsing, formatting, and deadline comparison helpers.
//
// WHY THIS EXISTS:
// In standard JavaScript, `new Date("YYYY-MM-DD")` parses date-only strings in UTC midnight.
// When converted to local time via `.toLocaleDateString()` or `toISOString()`, time zones ahead
// or behind UTC (such as PKT UTC+5) will shift by +/- 1 day.
//
// These helpers construct local midnight Date objects directly from (year, month, day) components,
// guaranteeing that dates remain 100% consistent across form inputs and display components.

/**
 * Parses a "YYYY-MM-DD" or ISO date string into a Date object at local midnight.
 * Guarantees that the calendar day is never skewed by timezone offsets.
 *
 * @param {string|Date} dateInput
 * @returns {Date|null}
 */
export const parseLocalDate = (dateInput) => {
    if (!dateInput) return null;
    if (dateInput instanceof Date) return dateInput;

    const cleanStr = String(dateInput).split('T')[0].trim();
    const parts = cleanStr.split('-').map(Number);

    if (parts.length === 3 && !parts.some(isNaN)) {
        // month is 0-indexed in JS Date constructor: month - 1
        return new Date(parts[0], parts[1] - 1, parts[2]);
    }

    return new Date(dateInput);
};

/**
 * Formats a date string (YYYY-MM-DD or ISO) into a localized string without timezone drift.
 *
 * @param {string|Date} dateInput
 * @param {Intl.DateTimeFormatOptions} options
 * @returns {string}
 */
export const formatLocalDate = (
    dateInput,
    options = { month: 'short', day: '2-digit', year: 'numeric' }
) => {
    if (!dateInput) return '';
    const d = parseLocalDate(dateInput);
    return d ? d.toLocaleDateString('en-US', options) : '';
};

/**
 * Extracts pure 'YYYY-MM-DD' string for HTML <input type="date"> value attribute.
 *
 * @param {string|Date} dateInput
 * @returns {string}
 */
export const toDateInputValue = (dateInput) => {
    if (!dateInput) return '';
    return String(dateInput).split('T')[0].trim();
};

/**
 * Returns true if today (local midnight) is strictly AFTER the specified deadline date.
 * Simple date-only check — does NOT account for same-day start_time cutoff.
 * Use isRegistrationClosed() for the full logic.
 *
 * @param {string|Date} deadlineStr
 * @returns {boolean}
 */
export const isDeadlinePassed = (deadlineStr) => {
    if (!deadlineStr) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const deadline = parseLocalDate(deadlineStr);
    if (!deadline) return false;
    deadline.setHours(0, 0, 0, 0);

    return today > deadline;
};

/**
 * Determines whether registration is truly closed, with special handling for
 * same-day deadlines: if deadline === event_date, registration stays open until
 * the event's start_time (not just midnight), then locks once the event begins.
 *
 * Rules:
 *   - deadline < today            → closed (deadline date has passed)
 *   - deadline > today            → open
 *   - deadline === today === event_date → closed only when NOW >= start_time
 *   - deadline === today, event_date is later → open all day (already handled above)
 *
 * @param {string} deadlineStr  — 'YYYY-MM-DD'
 * @param {string} eventDateStr — 'YYYY-MM-DD'
 * @param {string} startTimeStr — 'HH:MM:SS' or 'HH:MM'
 * @returns {boolean}  true = registration is closed
 */
export const isRegistrationClosed = (deadlineStr, eventDateStr, startTimeStr) => {
    if (!deadlineStr) return false;

    const now = new Date();
    const todayStr = now.toLocaleDateString('sv-SE'); // 'YYYY-MM-DD'
    const deadlineDateStr = String(deadlineStr).split('T')[0];
    const eventDayStr     = String(eventDateStr || '').split('T')[0];

    // Deadline date is strictly in the past
    if (todayStr > deadlineDateStr) return true;

    // Deadline is in the future — still open
    if (todayStr < deadlineDateStr) return false;

    // todayStr === deadlineDateStr (deadline is TODAY)
    // Special case: if deadline is the same calendar day as the event,
    // lock registration once the event's start_time is reached.
    if (deadlineDateStr === eventDayStr && startTimeStr) {
        // Parse start_time into today's local datetime
        const [hh, mm] = startTimeStr.split(':').map(Number);
        const startToday = new Date();
        startToday.setHours(hh, mm, 0, 0);

        // Registration closes when the clock hits start_time
        return now >= startToday;
    }

    // Deadline is today but NOT the event day — open until end of day (midnight next day)
    return false;
};

/**
 * Returns the number of calendar days remaining until the deadline.
 * (0 = today is deadline, positive = days left, negative = deadline passed)
 *
 * @param {string|Date} deadlineStr
 * @returns {number|null}
 */
export const daysUntilDeadline = (deadlineStr) => {
    if (!deadlineStr) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const deadline = parseLocalDate(deadlineStr);
    if (!deadline) return null;
    deadline.setHours(0, 0, 0, 0);

    return Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
};
