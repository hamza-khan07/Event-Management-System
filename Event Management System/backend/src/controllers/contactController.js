// backend/src/controllers/contactController.js
const db = require('../config/db');
const sendEmail = require('../utils/sendEmail');

const submitContactForm = async (req, res, next) => {
    try {
        const { name, email, subject, message } = req.body;

        if (!name || !email || !subject || !message) {
            return res.status(400).json({ success: false, message: 'Please provide all fields' });
        }

        // 1. Save to Database
        const [result] = await db.query(
            `INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)`,
            [name, email, subject, message]
        );

        // 2. Dispatch Email to Business Email in background
        const businessEmail = process.env.BUSINESS_EMAIL || process.env.EMAIL_USER;
        if (businessEmail && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            const htmlContent = `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
                    <div style="background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 20px; color: #ffffff;">
                        <h2 style="margin: 0; font-size: 20px;">📩 New Contact Enquiry Received</h2>
                    </div>
                    <div style="padding: 24px;">
                        <p><strong>From:</strong> ${name} (&lt;<a href="mailto:${email}">${email}</a>&gt;)</p>
                        <p><strong>Subject:</strong> ${subject}</p>
                        <hr style="border: 0; border-top: 1px solid #f0f0f0; margin: 16px 0;" />
                        <p><strong>Message Content:</strong></p>
                        <div style="background: #f9fafb; padding: 16px; border-radius: 6px; border-left: 4px solid #4f46e5; white-space: pre-wrap;">
                            ${message}
                        </div>
                        <p style="margin-top: 24px; font-size: 12px; color: #888;">
                            Received on ${new Date().toLocaleString()} via Event Management System
                        </p>
                    </div>
                </div>
            `;

            // Asynchronously dispatch so the user gets instant response
            sendEmail({
                to: businessEmail,
                subject: `[Contact Form] ${subject} - from ${name}`,
                text: `New contact submission from ${name} (${email}):\n\nSubject: ${subject}\n\n${message}`,
                html: htmlContent,
            }).catch(err => console.error('Background email notification error:', err));
        }

        res.status(201).json({
            success: true,
            message: 'Your message has been received! We will get back to you soon.'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    submitContactForm
};
