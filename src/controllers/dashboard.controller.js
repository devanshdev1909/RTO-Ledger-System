const db = require("../config/db");

module.exports.renderDashboard = async (req, res) => {

    try {

        const totalCustomers = await db.query(`
            SELECT COUNT(*) AS total
            FROM customers
        `);

        const totalVehicles = await db.query(`
            SELECT COUNT(*) AS total
            FROM vehicles
        `);

        const totalServices = await db.query(`
            SELECT COUNT(*) AS total
            FROM services
        `);

        const totalRequests = await db.query(`
            SELECT COUNT(*) AS total
            FROM service_requests
        `);

        const pendingJobs = await db.query(`
            SELECT COUNT(*) AS total
            FROM service_requests
            WHERE status = 'Pending'
        `);

        const completedJobs = await db.query(`
            SELECT COUNT(*) AS total
            FROM service_requests
            WHERE status = 'Completed'
        `);

        const todayRequests = await db.query(`
            SELECT COUNT(*) AS total
            FROM service_requests
            WHERE DATE(created_at) = CURRENT_DATE
        `);

        const revenue = await db.query(`
            SELECT COALESCE(SUM(service_fee),0) AS total
            FROM ledgers
        `);

        const dueAmount = await db.query(`
            SELECT COALESCE(SUM(due_amount),0) AS total
            FROM ledgers
        `);

        res.render("dashboard", {
            activePage: "dashboard",
            userName: req.session.userName || "Admin",

            stats: {
                customers: totalCustomers.rows[0].total,
                vehicles: totalVehicles.rows[0].total,
                services: totalServices.rows[0].total,
                requests: totalRequests.rows[0].total,
                pendingJobs: pendingJobs.rows[0].total,
                completedJobs: completedJobs.rows[0].total,
                todayRequests: todayRequests.rows[0].total,
                revenue: revenue.rows[0].total,
                dueAmount: dueAmount.rows[0].total
            }
        });

    } catch (err) {

        console.log(err);
        res.send(err.message);

    }

};