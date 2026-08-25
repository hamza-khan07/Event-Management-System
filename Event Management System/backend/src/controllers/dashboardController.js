const db = require('../config/db');
const getPMStats = async (req, res) => {
    try {
        // Query 1: Database mein mojood tamam companies ko ginte hain
        const [companies] = await db.query('SELECT COUNT(*) as total FROM companies');

        // Query 2: Sirf un users ko ginte hain jinka role 'ORGANIZER' hai
        const [organizers] = await db.query('SELECT COUNT(*) as total FROM users WHERE role = ?', ['ORGANIZER']);

        // Query 3: Sirf un users ko ginte hain jinka role 'PARTICIPANT' hai
        const [participants] = await db.query('SELECT COUNT(*) as total FROM users WHERE role = ?', ['PARTICIPANT']);

        // Query 4: Database mein mojood tamam events ko ginte hain
        const [events] = await db.query('SELECT COUNT(*) as total FROM events');

        // Sab numbers nikal aaye, ab frontend ko json response bhej do
        res.status(200).json({
            success: true,
            data: {
                totalCompanies: companies[0].total,
                totalOrganizers: organizers[0].total,
                totalParticipants: participants[0].total,
                totalEvents: events[0].total
            }
        });
    } catch (error) {
        console.error("Dashboard Stats Error: ", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch dashboard statistics"
        });
    }
};



module.exports = { getPMStats };

